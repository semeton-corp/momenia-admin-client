import { getAccessToken, redirectToLogin, refreshAccessToken } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type QueryParams = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: QueryParams;
  token?: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path: string, params?: QueryParams) {
  const isAbsoluteUrl = /^https?:\/\//i.test(path);
  const url = new URL(path, isAbsoluteUrl ? undefined : API_BASE_URL || window.location.origin);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  });

  return isAbsoluteUrl || API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (response.status === 204) {
    return null;
  }

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

const IDEMPOTENT_METHODS = new Set(["POST", "PUT", "PATCH"]);

async function request<T>(path: string, options: ApiRequestOptions = {}, retried = false): Promise<T> {
  const { body, headers, params, token, ...requestOptions } = options;
  const isFormData = body instanceof FormData;
  const accessToken = token ?? getAccessToken();
  const method = (requestOptions.method ?? "GET").toUpperCase();

  const response = await fetch(buildUrl(path, params), {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(IDEMPOTENT_METHODS.has(method) ? { "x-idempotency-key": crypto.randomUUID() } : {}),
      ...headers,
    },
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok && response.status === 401) {
    if (!retried) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return request<T>(path, { ...options, token: refreshedToken }, true);
      }
    }

    return redirectToLogin();
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : response.statusText;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

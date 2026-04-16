import { clearAuthTokens, getAccessToken, refreshAccessToken } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

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
      url.searchParams.set(key, String(value));
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

async function request<T>(path: string, options: ApiRequestOptions = {}, retried = false): Promise<T> {
  const { body, headers, params, token, ...requestOptions } = options;
  const isFormData = body instanceof FormData;
  const accessToken = token ?? getAccessToken();

  const response = await fetch(buildUrl(path, params), {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401 && !retried) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return request<T>(path, { ...options, token: refreshedToken }, true);
      }

      clearAuthTokens();
      window.location.assign("/login");
    }

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

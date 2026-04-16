const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";
const REFRESH_PATH =
  import.meta.env.VITE_ADMIN_REFRESH_PATH ?? "/api/v1/admins/refresh-token";

const ACCESS_TOKEN_KEY = "memoria_admin_access_token";
const REFRESH_TOKEN_KEY = "memoria_admin_refresh_token";
const LEGACY_ACCESS_TOKEN_KEYS = ["accessToken", "access_token", "adminAccessToken"];
const LEGACY_REFRESH_TOKEN_KEYS = ["refreshToken", "refresh_token", "adminRefreshToken"];
const ACCESS_TOKEN_RESPONSE_KEYS = [
  ACCESS_TOKEN_KEY,
  "accessToken",
  "access_token",
  "adminAccessToken",
];
const REFRESH_TOKEN_RESPONSE_KEYS = [
  REFRESH_TOKEN_KEY,
  "refreshToken",
  "refresh_token",
  "adminRefreshToken",
];

type TokenResponse = Record<string, unknown>;

const GOOGLE_REDIRECT_KEYS = [
  "url",
  "redirectUrl",
  "redirect_url",
  "authUrl",
  "auth_url",
  "location",
];

export function buildApiUrl(path: string) {
  const isAbsoluteUrl = /^https?:\/\//i.test(path);
  const url = new URL(path, isAbsoluteUrl ? undefined : API_BASE_URL || window.location.origin);

  return isAbsoluteUrl || API_BASE_URL ? url.toString() : url.pathname + url.search;
}

function writeStorage(key: string, value?: string | null) {
  if (!value) {
    return;
  }

  localStorage.setItem(key, value);
}

function removeStorage(keys: string[]) {
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

function findTokenValue(data: unknown, names: string[]): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as TokenResponse;

  for (const name of names) {
    const value = record[name];

    if (typeof value === "string" && value) {
      return value;
    }
  }

  for (const value of Object.values(record)) {
    const token = findTokenValue(value, names);

    if (token) {
      return token;
    }
  }

  return null;
}

function findStringValue(data: unknown, names: string[]) {
  return findTokenValue(data, names);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveAuthTokens(data: unknown) {
  const accessToken = findTokenValue(data, ACCESS_TOKEN_RESPONSE_KEYS);
  const refreshToken = findTokenValue(data, REFRESH_TOKEN_RESPONSE_KEYS);

  removeStorage([...LEGACY_ACCESS_TOKEN_KEYS, ...LEGACY_REFRESH_TOKEN_KEYS]);
  writeStorage(ACCESS_TOKEN_KEY, accessToken);
  writeStorage(REFRESH_TOKEN_KEY, refreshToken);

  return Boolean(accessToken || refreshToken);
}

export function saveAuthTokensFromUrl(url: URL) {
  const params = new URLSearchParams(url.search);

  if (url.hash) {
    new URLSearchParams(url.hash.slice(1)).forEach((value, key) => {
      params.set(key, value);
    });
  }

  return saveAuthTokens(Object.fromEntries(params.entries()));
}

export function clearAuthTokens() {
  removeStorage([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    ...LEGACY_ACCESS_TOKEN_KEYS,
    ...LEGACY_REFRESH_TOKEN_KEYS,
  ]);
}

export function getGoogleSignInUrl() {
  return buildApiUrl("/api/v1/admins/signin/google");
}

export async function signInWithGoogleCode(code: string) {
  const response = await fetch(getGoogleSignInUrl(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
    body: JSON.stringify({
      code,
      userAgent: window.navigator.userAgent,
    }),
  });

  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : "Google login failed.";

    throw new Error(message);
  }

  if (!saveAuthTokens(data)) {
    throw new Error("Google login response did not include tokens.");
  }

  return data;
}

export async function getGoogleSignInRedirectUrl() {
  const response = await fetch(getGoogleSignInUrl(), {
    method: "GET",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
  });

  const location = response.headers.get("Location");

  if (location) {
    return location;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const data = await response.json();
    const redirectUrl = findStringValue(data, GOOGLE_REDIRECT_KEYS);

    if (redirectUrl) {
      return redirectUrl;
    }
  }

  if (response.redirected) {
    return response.url;
  }

  throw new Error("Google login redirect was not returned by the API.");
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthTokens();
    return null;
  }

  try {
    const response = await fetch(buildApiUrl(REFRESH_PATH), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      clearAuthTokens();
      return null;
    }

    saveAuthTokens(data);

    return getAccessToken();
  } catch {
    clearAuthTokens();
    return null;
  }
}

export async function ensureAuthenticated() {
  const accessToken = getAccessToken();

  if (accessToken) {
    return true;
  }

  return Boolean(await refreshAccessToken());
}

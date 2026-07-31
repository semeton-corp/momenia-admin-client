const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";
const REFRESH_PATH =
  import.meta.env.VITE_ADMIN_REFRESH_PATH ?? "/api/v1/sessions/refresh";

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
let refreshAccessTokenPromise: Promise<string | null> | null = null;

const TOKEN_EXPIRY_SKEW_MS = 30_000;
const TOKEN_EXPIRY_KEYS = ["exp"];

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

function findNumberValue(data: unknown, names: string[]): number | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as TokenResponse;

  for (const name of names) {
    const value = record[name];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value) {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  for (const value of Object.values(record)) {
    const numberValue = findNumberValue(value, names);

    if (numberValue !== null) {
      return numberValue;
    }
  }

  return null;
}

function findStringValue(data: unknown, names: string[]) {
  return findTokenValue(data, names);
}

function parseJwtPayload(token: string): TokenResponse | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);

    return JSON.parse(atob(base64 + padding)) as TokenResponse;
  } catch {
    return null;
  }
}

function isAccessTokenExpired(token: string) {
  const payload = parseJwtPayload(token);
  const expiresAt = findNumberValue(payload, TOKEN_EXPIRY_KEYS);

  if (expiresAt === null) {
    return false;
  }

  return expiresAt * 1000 <= Date.now() + TOKEN_EXPIRY_SKEW_MS;
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

export function redirectToLogin() {
  clearAuthTokens();
  window.location.replace("/login");

  return new Promise<never>(() => {});
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
      "x-idempotency-key": crypto.randomUUID(),
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

async function requestFreshAccessToken() {
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
        "x-idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        refreshToken,
        userAgent: navigator.userAgent,
      }),
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

export function refreshAccessToken() {
  refreshAccessTokenPromise ??= requestFreshAccessToken().finally(() => {
    refreshAccessTokenPromise = null;
  });

  return refreshAccessTokenPromise;
}

export async function ensureAuthenticated() {
  const accessToken = getAccessToken();

  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return true;
  }

  return Boolean(await refreshAccessToken());
}

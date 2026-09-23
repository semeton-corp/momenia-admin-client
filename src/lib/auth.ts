const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const REFRESH_PATH =
  import.meta.env.VITE_ADMIN_REFRESH_PATH ?? "/api/v1/sessions/refresh";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_RESPONSE_KEYS = [ACCESS_TOKEN_KEY];
const REFRESH_TOKEN_RESPONSE_KEYS = [REFRESH_TOKEN_KEY];

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
  removeStorage([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
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
    return null;
  }

  const performRefresh = async () => {
    // Another tab may have refreshed while this one waited for the lock.
    if (getRefreshToken() !== refreshToken) {
      return getAccessToken();
    }

    const response = await fetch(buildApiUrl(REFRESH_PATH), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        refreshToken,
        userAgent: navigator.userAgent,
      }),
    });

    // Only an explicit authentication rejection proves the session is invalid.
    // Network errors, 5xx responses, and malformed responses must not log out
    // a user who still has a valid refresh token.
    if (response.status === 401 || response.status === 403) {
      if (getRefreshToken() !== refreshToken) return getAccessToken();
      clearAuthTokens();
      return null;
    }

    if (!response.ok) {
      throw new Error(`Token refresh failed (${response.status}).`);
    }

    const data: unknown = await response.json();
    const accessToken = findTokenValue(data, ACCESS_TOKEN_RESPONSE_KEYS);
    if (!accessToken) {
      throw new Error("Token refresh response did not include an access token.");
    }

    if (getRefreshToken() !== refreshToken) return getAccessToken();
    saveAuthTokens(data);
    return accessToken;
  };

  // localStorage is shared across tabs, but the in-memory promise below is not.
  // A cross-tab lock prevents two tabs from using the same rotating refresh token.
  if (navigator.locks) {
    return navigator.locks.request("memoria-admin-token-refresh", performRefresh);
  }

  return performRefresh();
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

  try {
    return Boolean(await refreshAccessToken());
  } catch {
    // Keep the session on a temporary API/network failure. Protected requests
    // can surface the error and retry; logging out would discard valid tokens.
    return Boolean(getAccessToken());
  }
}

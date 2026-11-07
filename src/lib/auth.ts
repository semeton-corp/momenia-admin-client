const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const REFRESH_PATH =
  import.meta.env.VITE_ADMIN_REFRESH_PATH ?? "/api/v1/sessions/refresh";

const ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_RESPONSE_KEYS = [ACCESS_TOKEN_KEY];

type TokenResponse = Record<string, unknown>;
let refreshAccessTokenPromise: Promise<string | null> | null = null;

const TOKEN_EXPIRY_SKEW_MS = 30_000;
const TOKEN_EXPIRY_KEYS = ["exp"];

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

export function saveAuthTokens(data: unknown) {
  const accessToken = findTokenValue(data, ACCESS_TOKEN_RESPONSE_KEYS);

  writeStorage(ACCESS_TOKEN_KEY, accessToken);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);

  return Boolean(accessToken);
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
  removeStorage([ACCESS_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY]);
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
    credentials: "include",
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

// This navigation lets the API issue its HttpOnly OAuth state cookie before redirecting to Google.
export function getGoogleSignInStartUrl() {
  const url = new URL(buildApiUrl("/api/v1/admins/signin/google/redirect"), window.location.origin);
  url.searchParams.set("redirect_origin", window.location.origin);
  return url.toString();
}

// The API reads and rotates its HttpOnly refresh cookie; it never enters JavaScript or JSON.
async function requestFreshAccessToken() {
  const accessTokenBeforeRefresh = getAccessToken();

  const performRefresh = async () => {
    // Another tab may have refreshed or logged out while this one waited for the lock.
    if (getAccessToken() !== accessTokenBeforeRefresh) {
      return getAccessToken();
    }

    const response = await fetch(buildApiUrl(REFRESH_PATH), {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        userAgent: navigator.userAgent,
      }),
    });

    // Only an explicit authentication rejection proves the session is invalid.
    // Network errors, 5xx responses, and malformed responses must not log out
    // a user who still has a valid refresh token.
    if (response.status === 401 || response.status === 403) {
      if (getAccessToken() !== accessTokenBeforeRefresh) return getAccessToken();
      clearAuthTokens();
      return null;
    }

    if (!response.ok) {
      throw new Error(`Token refresh failed (${response.status}).`);
    }

    const data: unknown = await response.json();
    const refreshedAccessToken = findTokenValue(data, ACCESS_TOKEN_RESPONSE_KEYS);
    if (!refreshedAccessToken) {
      throw new Error("Token refresh response did not include an access token.");
    }

    if (getAccessToken() !== accessTokenBeforeRefresh) return getAccessToken();
    saveAuthTokens(data);
    return refreshedAccessToken;
  };

  // localStorage is shared across tabs, but the in-memory promise below is not.
  // A cross-tab lock prevents two tabs from rotating the cookie-backed session.
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

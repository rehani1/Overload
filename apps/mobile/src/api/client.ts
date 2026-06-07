import type { User } from "@/types/user";
import { loadStoredJson, removeStoredJson, saveStoredJson } from "@/lib/storage";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL = configuredApiUrl || "http://localhost:8080/api";
const isApiConfigured = Boolean(configuredApiUrl);
const API_AUTH_STORAGE_KEY = "overload.apiAuth.v1";

export type ApiAuthSession = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

let apiAuthSession: ApiAuthSession | null | undefined;
let refreshPromise: Promise<ApiAuthSession | null> | null = null;

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const session = await getApiAuthSession();
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && session?.refreshToken && shouldRefresh(path)) {
    const refreshedSession = await refreshApiAuthSession(session.refreshToken);

    if (refreshedSession) {
      return apiRequest<TResponse>(path, options);
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const responseText = await response.text();

  if (!responseText) {
    return undefined as TResponse;
  }

  return JSON.parse(responseText) as TResponse;
}

export async function getApiAuthSession(): Promise<ApiAuthSession | null> {
  if (apiAuthSession !== undefined) {
    return apiAuthSession;
  }

  apiAuthSession = await loadStoredJson<ApiAuthSession>(API_AUTH_STORAGE_KEY);
  return apiAuthSession;
}

export function hasApiAuthSession() {
  return Boolean(apiAuthSession?.accessToken);
}

export function isBackendSyncEnabled() {
  return isApiConfigured && hasApiAuthSession();
}

export async function setApiAuthSession(session: ApiAuthSession) {
  apiAuthSession = session;
  await saveStoredJson<ApiAuthSession>(API_AUTH_STORAGE_KEY, session);
}

export async function clearApiAuthSession() {
  apiAuthSession = null;
  await removeStoredJson(API_AUTH_STORAGE_KEY);
}

async function refreshApiAuthSession(refreshToken: string) {
  refreshPromise ??= fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        await clearApiAuthSession();
        return null;
      }

      const refreshedSession = (await response.json()) as ApiAuthSession;
      await setApiAuthSession(refreshedSession);
      return refreshedSession;
    })
    .catch(async () => {
      await clearApiAuthSession();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function shouldRefresh(path: string) {
  return !(
    path.includes("/auth/login") ||
    path.includes("/auth/register") ||
    path.includes("/auth/refresh") ||
    path.includes("/auth/logout") ||
    path.includes("/auth/pairing-codes/claim")
  );
}

export { API_URL, isApiConfigured };

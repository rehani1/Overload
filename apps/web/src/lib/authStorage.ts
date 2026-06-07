import type { AuthResponse } from "../types/api";

const AUTH_STORAGE_KEY = "overload.web.auth.v1";

export type StoredAuth = AuthResponse;

type AuthStorageListener = (auth: StoredAuth | null) => void;

let currentAuth: StoredAuth | null = readStoredAuth();
const listeners = new Set<AuthStorageListener>();

export function getStoredAuth() {
  return currentAuth;
}

export function setStoredAuth(auth: StoredAuth) {
  currentAuth = auth;
  writeStoredAuth(auth);
  emit();
}

export function clearStoredAuth() {
  currentAuth = null;
  removeStoredAuth();
  emit();
}

export function getAccessToken() {
  return currentAuth?.accessToken;
}

export function getRefreshToken() {
  return currentAuth?.refreshToken;
}

export function subscribeAuthStorage(listener: AuthStorageListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener(currentAuth));
}

function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredAuth>;

    if (parsed.accessToken && parsed.refreshToken && parsed.user) {
      return parsed as StoredAuth;
    }
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return null;
}

function writeStoredAuth(auth: StoredAuth) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function removeStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== AUTH_STORAGE_KEY) {
      return;
    }

    currentAuth = readStoredAuth();
    emit();
  });
}

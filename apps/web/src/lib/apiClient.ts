import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  clearStoredAuth,
  getAccessToken,
  getRefreshToken,
  setStoredAuth,
} from "./authStorage";
import type { AuthResponse } from "../types/api";

export const API_URL = import.meta.env.VITE_API_URL?.trim() || "http://localhost:8080/api";

export const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<AuthResponse> | null = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || !shouldRefresh(error, originalRequest)) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearStoredAuth();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken(refreshToken).finally(() => {
        refreshPromise = null;
      });

      const refreshedAuth = await refreshPromise;
      setStoredAuth(refreshedAuth);

      originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
      originalRequest.headers.set("Authorization", `Bearer ${refreshedAuth.accessToken}`);

      return apiClient(originalRequest);
    } catch {
      clearStoredAuth();
      return Promise.reject(error);
    }
  },
);

export function getApiStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

type ApiErrorMessageOptions = {
  conflictMessage?: string;
  unauthorizedMessage?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Request failed.",
  options: ApiErrorMessageOptions = {},
): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return "Cannot reach the Overload API. Confirm the backend is running.";
  }

  const data = error.response.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const apiMessage = getStringField(data, "message") ?? getStringField(data, "detail");

    if (apiMessage) {
      return apiMessage;
    }
  }

  if (error.response.status === 401) {
    return options.unauthorizedMessage ?? "Your session expired. Sign in again.";
  }

  if (error.response.status === 409) {
    return options.conflictMessage ?? "An account already exists for that email.";
  }

  return fallback;
}

function shouldRefresh(error: AxiosError, originalRequest: RetryableRequestConfig) {
  return (
    error.response?.status === 401 &&
    !originalRequest._retry &&
    !isAuthRoute(originalRequest.url)
  );
}

function isAuthRoute(url?: string) {
  return Boolean(
    url?.includes("/auth/login") ||
      url?.includes("/auth/register") ||
      url?.includes("/auth/refresh") ||
      url?.includes("/auth/logout"),
  );
}

async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const response = await publicClient.post<AuthResponse>("/auth/refresh", { refreshToken });

  return response.data;
}

function getStringField(value: object, key: string) {
  const record = value as Record<string, unknown>;

  if (key in record) {
    const field = record[key];

    return typeof field === "string" && field.trim() ? field : undefined;
  }

  return undefined;
}

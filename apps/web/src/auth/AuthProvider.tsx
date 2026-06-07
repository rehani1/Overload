import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { login as loginRequest, logout as logoutRequest, register as registerRequest } from "../api/auth";
import { getCurrentUser } from "../api/resources";
import { getApiStatus } from "../lib/apiClient";
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
  subscribeAuthStorage,
  type StoredAuth,
} from "../lib/authStorage";
import { queryClient } from "../lib/queryClient";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "../types/api";

type AuthContextValue = {
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (request: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (request: RegisterRequest) => Promise<AuthResponse>;
  user: User | null;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuthState] = useState<StoredAuth | null>(() => getStoredAuth());
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => subscribeAuthStorage(setAuthState), []);

  useEffect(() => {
    let isActive = true;

    async function hydrateSession() {
      const storedAuth = getStoredAuth();

      if (!storedAuth) {
        setIsHydrating(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        const latestAuth = getStoredAuth();

        if (isActive && latestAuth) {
          setStoredAuth({ ...latestAuth, user });
        }
      } catch (error) {
        if (getApiStatus(error) === 401) {
          clearStoredAuth();
          queryClient.clear();
        }
      } finally {
        if (isActive) {
          setIsHydrating(false);
        }
      }
    }

    void hydrateSession();

    return () => {
      isActive = false;
    };
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    const response = await loginRequest(request);
    queryClient.clear();
    setStoredAuth(response);

    return response;
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await registerRequest(request);
    queryClient.clear();
    setStoredAuth(response);

    return response;
  }, []);

  const logout = useCallback(async () => {
    const storedAuth = getStoredAuth();

    try {
      if (storedAuth?.refreshToken) {
        await logoutRequest(storedAuth.refreshToken);
      }
    } finally {
      clearStoredAuth();
      queryClient.clear();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(auth?.accessToken),
      isHydrating,
      login,
      logout,
      register,
      user: auth?.user ?? null,
    }),
    [auth?.accessToken, auth?.user, isHydrating, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { useSyncExternalStore } from "react";

import { mockUser } from "@/features/profile/mockUser";
import { loadStoredJson, removeStoredJson, saveStoredJson } from "@/lib/storage";
import type { User } from "@/types/user";

const AUTH_STORAGE_KEY = "overload.auth.v1";

type AuthState = {
  isHydrated: boolean;
  user: User | null;
};

type RegisterInput = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthStore = AuthState & {
  isAuthenticated: boolean;
  login: (input: LoginInput) => void;
  logout: () => void;
  register: (input: RegisterInput) => void;
};

let state: AuthState = {
  isHydrated: false,
  user: null,
};

const listeners = new Set<() => void>();

function emit(nextState: AuthState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function login(input: LoginInput) {
  const nextState: AuthState = {
    isHydrated: true,
    user: {
      ...mockUser,
      email: input.email.trim() || mockUser.email,
    },
  };

  emit(nextState);
  void saveAuthState(nextState);
}

function register(input: RegisterInput) {
  const nextState: AuthState = {
    isHydrated: true,
    user: {
      ...mockUser,
      email: input.email.trim() || mockUser.email,
      firstName: input.firstName.trim() || mockUser.firstName,
      id: `user-local-${Date.now()}`,
      lastName: input.lastName.trim() || mockUser.lastName,
    },
  };

  emit(nextState);
  void saveAuthState(nextState);
}

function logout() {
  const nextState: AuthState = {
    isHydrated: true,
    user: null,
  };

  emit(nextState);
  void removeStoredJson(AUTH_STORAGE_KEY);
}

async function hydrateAuthState() {
  const storedState = await loadStoredJson<AuthState>(AUTH_STORAGE_KEY);

  emit({
    isHydrated: true,
    user: storedState?.user ?? null,
  });
}

async function saveAuthState(nextState: AuthState) {
  await saveStoredJson<AuthState>(AUTH_STORAGE_KEY, nextState);
}

void hydrateAuthState();

function buildStore(snapshot: AuthState): AuthStore {
  return {
    ...snapshot,
    isAuthenticated: snapshot.user !== null,
    login,
    logout,
    register,
  };
}

export function useAuthStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}

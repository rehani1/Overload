import { useSyncExternalStore } from "react";

import { mockUser } from "@/features/profile/mockUser";
import type { User } from "@/types/user";

type AuthState = {
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
  emit({
    user: {
      ...mockUser,
      email: input.email.trim() || mockUser.email,
    },
  });
}

function register(input: RegisterInput) {
  emit({
    user: {
      ...mockUser,
      email: input.email.trim() || mockUser.email,
      firstName: input.firstName.trim() || mockUser.firstName,
      id: `user-local-${Date.now()}`,
      lastName: input.lastName.trim() || mockUser.lastName,
    },
  });
}

function logout() {
  emit({ user: null });
}

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

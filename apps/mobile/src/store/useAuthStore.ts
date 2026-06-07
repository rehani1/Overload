import { useSyncExternalStore } from "react";

import {
  clearApiAuthSession,
  getApiAuthSession,
  isApiConfigured,
  setApiAuthSession,
  type ApiAuthSession,
} from "@/api/client";
import { loadStoredJson, saveStoredJson } from "@/lib/storage";
import { setActiveWorkoutStoreAccount } from "@/store/useActiveWorkoutStore";
import { setNutritionStoreAccount } from "@/store/useNutritionStore";
import { setPresetStoreAccount } from "@/store/usePresetStore";
import { setWorkoutHistoryStoreAccount } from "@/store/useWorkoutHistoryStore";
import type { Sex, UnitPreference, User } from "@/types/user";

const AUTH_STORAGE_KEY = "overload.auth.v1";
const DEFAULT_UNIT_PREFERENCE: UnitPreference = "lb";
const LEGACY_DEMO_EMAILS = new Set(["rehan@example.com"]);
const LEGACY_DEMO_USER_IDS = new Set(["user-demo-rehan"]);

type LocalUserRecord = User & {
  passwordHash: string;
};

type AuthState = {
  isHydrated: boolean;
  user: User | null;
  users: LocalUserRecord[];
};

type RegisterInput = {
  email: string;
  firstName: string;
  goal: string;
  heightInches: number;
  lastName: string;
  password: string;
  sex: Sex;
  weightPounds: number;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthResult = {
  error?: string;
  user: User | null;
};

type AuthStore = Pick<AuthState, "isHydrated" | "user"> & {
  isAuthenticated: boolean;
  connectApiSession: (session: ApiAuthSession) => Promise<User>;
  login: (input: LoginInput) => AuthResult;
  logout: () => void;
  register: (input: RegisterInput) => AuthResult;
  updateUser: (
    updates: Partial<
      Pick<User, "goal" | "heightInches" | "sex" | "unitPreference" | "weightPounds">
    >,
  ) => User;
};

let state: AuthState = {
  isHydrated: false,
  user: null,
  users: [],
};

const listeners = new Set<() => void>();

function emit(nextState: AuthState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function emitAndPersist(nextState: AuthState) {
  emit(nextState);
  void saveAuthState(nextState);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function login(input: LoginInput): AuthResult {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const existingUser = state.users.find((user) => normalizeEmail(user.email) === email);

  if (!email || !password) {
    return {
      error: "Enter your email and password.",
      user: null,
    };
  }

  if (!existingUser || existingUser.passwordHash !== hashPassword(password)) {
    return {
      error: "Email or password is incorrect.",
      user: null,
    };
  }

  const user = stripLocalAuthFields(existingUser);

  setAccountScopedStores(user.id);

  emitAndPersist({
    ...state,
    isHydrated: true,
    user,
  });

  return { user };
}

function register(input: RegisterInput): AuthResult {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!email || !password) {
    return {
      error: "Enter an email and password.",
      user: null,
    };
  }

  if (state.users.some((user) => normalizeEmail(user.email) === email)) {
    return {
      error: "An account already exists for that email.",
      user: null,
    };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const goal = input.goal.trim();

  if (!firstName || !lastName || !goal) {
    return {
      error: "Complete your name and current goal.",
      user: null,
    };
  }

  if (
    !isSex(input.sex) ||
    !Number.isFinite(input.heightInches) ||
    input.heightInches <= 0 ||
    !Number.isFinite(input.weightPounds) ||
    input.weightPounds <= 0
  ) {
    return {
      error: "Use valid profile details.",
      user: null,
    };
  }

  const user: User = {
    email,
    firstName,
    goal,
    heightInches: input.heightInches,
    id: `user-local-${Date.now()}`,
    lastName,
    sex: input.sex,
    unitPreference: DEFAULT_UNIT_PREFERENCE,
    weightPounds: input.weightPounds,
  };
  const localUser: LocalUserRecord = {
    ...user,
    passwordHash: hashPassword(password),
  };

  setAccountScopedStores(user.id);

  emitAndPersist({
    isHydrated: true,
    user,
    users: [localUser, ...state.users],
  });

  return { user };
}

function logout() {
  setAccountScopedStores(null);
  void clearApiAuthSession();

  emitAndPersist({
    ...state,
    isHydrated: true,
    user: null,
  });
}

function updateUser(
  updates: Partial<
    Pick<User, "goal" | "heightInches" | "sex" | "unitPreference" | "weightPounds">
  >,
) {
  if (!state.user) {
    throw new Error("Cannot update a profile before login.");
  }

  const normalizedUpdates = normalizeUserUpdates(updates);
  const updatedUser: User = {
    ...state.user,
    ...normalizedUpdates,
  };
  const nextUsers = state.users.map((user) =>
    user.id === updatedUser.id
      ? {
          ...user,
          ...updatedUser,
        }
      : user,
  );

  emitAndPersist({
    isHydrated: true,
    user: updatedUser,
    users: nextUsers,
  });

  return updatedUser;
}

async function connectApiSession(session: ApiAuthSession) {
  await setApiAuthSession(session);
  setAccountScopedStores(session.user.id);

  emitAndPersist({
    ...state,
    isHydrated: true,
    user: session.user,
  });

  return session.user;
}

function normalizeUserUpdates(
  updates: Partial<
    Pick<User, "goal" | "heightInches" | "sex" | "unitPreference" | "weightPounds">
  >,
) {
  const heightInches = sanitizeOptionalPositiveNumber(updates.heightInches);
  const nextGoal = updates.goal?.trim();
  const weightPounds = sanitizeOptionalPositiveNumber(updates.weightPounds);

  return {
    ...(nextGoal ? { goal: nextGoal } : {}),
    ...(heightInches !== undefined ? { heightInches } : {}),
    ...(isSex(updates.sex) ? { sex: updates.sex } : {}),
    ...(isUnitPreference(updates.unitPreference)
      ? { unitPreference: updates.unitPreference }
      : {}),
    ...(weightPounds !== undefined ? { weightPounds } : {}),
  };
}

async function hydrateAuthState() {
  const storedState = await loadStoredJson<Partial<AuthState>>(AUTH_STORAGE_KEY);
  const users = mergeStoredUsers(storedState?.users, storedState?.user);
  const apiSession = isApiConfigured ? await getApiAuthSession() : null;
  if (apiSession) {
    const nextState: AuthState = {
      isHydrated: true,
      user: apiSession.user,
      users,
    };

    setAccountScopedStores(apiSession.user.id);
    emit(nextState);
    void saveAuthState(nextState);
    return;
  }

  const currentUser = storedState?.user
    ? users.find((storedUser) => storedUser.id === storedState.user?.id) ??
      users.find(
        (storedUser) =>
          normalizeEmail(storedUser.email) ===
          normalizeEmail(storedState.user?.email ?? ""),
      )
    : undefined;
  const nextState: AuthState = {
    isHydrated: true,
    user: currentUser ? stripLocalAuthFields(currentUser) : null,
    users,
  };

  setAccountScopedStores(nextState.user?.id ?? null);
  emit(nextState);
  void saveAuthState(nextState);
}

async function saveAuthState(nextState: AuthState) {
  await saveStoredJson<AuthState>(AUTH_STORAGE_KEY, nextState);
}

void hydrateAuthState();

function buildStore(snapshot: AuthState): AuthStore {
  return {
    isHydrated: snapshot.isHydrated,
    isAuthenticated: snapshot.user !== null,
    connectApiSession,
    login,
    logout,
    register,
    updateUser,
    user: snapshot.user,
  };
}

function setAccountScopedStores(accountId: string | null) {
  setActiveWorkoutStoreAccount(accountId);
  setNutritionStoreAccount(accountId);
  setPresetStoreAccount(accountId);
  setWorkoutHistoryStoreAccount(accountId);
}

function mergeStoredUsers(
  storedUsers: LocalUserRecord[] | undefined,
  currentUser: User | null | undefined,
) {
  const usersByEmail = new Map<string, LocalUserRecord>();

  (storedUsers ?? []).forEach((user) => {
    const normalizedUser = normalizeLocalUser(user);

    if (!isLegacyDemoUser(normalizedUser)) {
      usersByEmail.set(normalizeEmail(normalizedUser.email), normalizedUser);
    }
  });

  if (currentUser && !isLegacyDemoUser(currentUser)) {
    const normalizedUser = normalizeUser(currentUser);
    const email = normalizeEmail(normalizedUser.email);

    if (!usersByEmail.has(email)) {
      usersByEmail.set(email, {
        ...normalizedUser,
        passwordHash: hashPassword(`migrated-${normalizedUser.id}-${email}`),
      });
    }
  }

  return Array.from(usersByEmail.values());
}

function normalizeLocalUser(user: LocalUserRecord): LocalUserRecord {
  return {
    ...normalizeUser(user),
    passwordHash: user.passwordHash,
  };
}

function normalizeUser(user: Partial<User> & Pick<User, "email">): User {
  const email = normalizeEmail(user.email);

  return {
    email,
    firstName: user.firstName?.trim() || getNameFromEmail(email),
    goal: user.goal?.trim() ?? "",
    heightInches: sanitizePositiveNumber(user.heightInches, 0),
    id: user.id?.trim() || `user-local-${Date.now()}`,
    lastName: user.lastName?.trim() ?? "",
    sex: isSex(user.sex) ? user.sex : "male",
    unitPreference: isUnitPreference(user.unitPreference)
      ? user.unitPreference
      : DEFAULT_UNIT_PREFERENCE,
    weightPounds: sanitizePositiveNumber(user.weightPounds, 0),
  };
}

function isLegacyDemoUser(user: Partial<User>) {
  return (
    (user.id ? LEGACY_DEMO_USER_IDS.has(user.id) : false) ||
    (user.email ? LEGACY_DEMO_EMAILS.has(normalizeEmail(user.email)) : false)
  );
}

function stripLocalAuthFields(user: LocalUserRecord): User {
  const { passwordHash: _passwordHash, ...publicUser } = user;

  return publicUser;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isSex(value: unknown): value is Sex {
  return value === "female" || value === "male";
}

function isUnitPreference(value: unknown): value is UnitPreference {
  return value === "lb" || value === "kg";
}

function sanitizePositiveNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function sanitizeOptionalPositiveNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function getNameFromEmail(email: string) {
  return email.split("@")[0] || "User";
}

function hashPassword(password: string) {
  let hash = 5381;

  for (let index = 0; index < password.length; index += 1) {
    hash = (hash * 33) ^ password.charCodeAt(index);
  }

  return `local-${hash >>> 0}`;
}

export function useAuthStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}

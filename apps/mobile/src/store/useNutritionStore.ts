import { useSyncExternalStore } from "react";

import { defaultNutritionTarget } from "@/features/nutrition/defaultNutritionTarget";
import { loadAccountScopedJson, saveAccountScopedJson } from "@/lib/accountStorage";
import type {
  NutritionEntry,
  NutritionEntryDraft,
  NutritionEntryUpdate,
  NutritionTarget,
  NutritionTargetUpdate,
} from "@/types/nutrition";
import { calculateMacroCalories } from "@/utils/nutrition";

const NUTRITION_STORAGE_KEY = "overload.nutrition.v1";
const REMOVED_SEED_ENTRY_IDS = new Set([
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
]);

type NutritionState = {
  entries: NutritionEntry[];
  isHydrated: boolean;
  target: NutritionTarget;
  targetsByDate: Record<string, NutritionTarget>;
};

type NutritionStore = NutritionState & {
  addEntry: (draft: NutritionEntryDraft) => NutritionEntry;
  deleteEntry: (entryId: string) => void;
  getTargetForDate: (date: string) => NutritionTarget;
  initializeTarget: (updates: NutritionTargetUpdate) => NutritionTarget;
  restoreEntry: (entry: NutritionEntry) => void;
  updateEntry: (entryId: string, updates: NutritionEntryUpdate) => NutritionEntry | null;
  updateTarget: (updates: NutritionTargetUpdate) => NutritionTarget;
};

let state: NutritionState = {
  entries: [],
  isHydrated: false,
  target: defaultNutritionTarget,
  targetsByDate: {},
};
let activeAccountId: string | null = null;
let activeAccountVersion = 0;

const listeners = new Set<() => void>();

function createUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === "x" ? randomValue : (randomValue & 0x3) | 0x8;

    return value.toString(16);
  });
}

function emit(nextState: NutritionState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function emitAndPersist(nextState: NutritionState) {
  activeAccountVersion += 1;
  emit(nextState);
  void saveNutritionState(nextState);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function addEntry(draft: NutritionEntryDraft) {
  const now = new Date().toISOString();
  const entry: NutritionEntry = {
    ...draft,
    calories: calculateMacroCalories(draft),
    id: createUuid(),
    createdAt: now,
    updatedAt: now,
  };

  emitAndPersist({
    ...state,
    entries: sortEntries([entry, ...state.entries]),
    isHydrated: true,
    targetsByDate: ensureTargetSnapshot(state.targetsByDate, entry.date, state.target),
  });

  return entry;
}

function deleteEntry(entryId: string) {
  emitAndPersist({
    ...state,
    entries: state.entries.filter((entry) => entry.id !== entryId),
    isHydrated: true,
  });
}

function restoreEntry(entry: NutritionEntry) {
  const existingEntry = state.entries.find((currentEntry) => currentEntry.id === entry.id);

  const nextTargetsByDate = ensureTargetSnapshot(
    state.targetsByDate,
    entry.date,
    state.target,
  );

  emitAndPersist({
    ...state,
    entries: sortEntries(
      existingEntry
        ? state.entries.map((currentEntry) =>
            currentEntry.id === entry.id ? entry : currentEntry,
          )
        : [entry, ...state.entries],
    ),
    isHydrated: true,
    targetsByDate: nextTargetsByDate,
  });
}

function updateEntry(entryId: string, updates: NutritionEntryUpdate) {
  const entry = state.entries.find((currentEntry) => currentEntry.id === entryId);

  if (!entry) {
    return null;
  }

  const updatedEntry: NutritionEntry = {
    ...entry,
    ...updates,
    calories: calculateMacroCalories({
      ...entry,
      ...updates,
    }),
    updatedAt: new Date().toISOString(),
  };

  emitAndPersist({
    ...state,
    entries: sortEntries(
      state.entries.map((currentEntry) =>
        currentEntry.id === entryId ? updatedEntry : currentEntry,
      ),
    ),
    isHydrated: true,
    targetsByDate: ensureTargetSnapshot(
      state.targetsByDate,
      updatedEntry.date,
      state.target,
    ),
  });

  return updatedEntry;
}

function updateTarget(updates: NutritionTargetUpdate) {
  const historicalTargetsByDate = snapshotExistingEntryDates(
    state.targetsByDate,
    state.entries,
    state.target,
  );
  const updatedTarget: NutritionTarget = {
    ...state.target,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  const normalizedTarget = normalizeTarget(updatedTarget);

  emitAndPersist({
    ...state,
    isHydrated: true,
    target: normalizedTarget,
    targetsByDate: historicalTargetsByDate,
  });

  return normalizedTarget;
}

function initializeTarget(updates: NutritionTargetUpdate) {
  const updatedTarget: NutritionTarget = {
    ...state.target,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  const normalizedTarget = normalizeTarget(updatedTarget);

  emitAndPersist({
    ...state,
    isHydrated: true,
    target: normalizedTarget,
    targetsByDate: {},
  });

  return normalizedTarget;
}

export function setNutritionStoreAccount(accountId: string | null) {
  if (activeAccountId === accountId && state.isHydrated) {
    return;
  }

  activeAccountId = accountId;
  activeAccountVersion += 1;

  if (!accountId) {
    emit(createEmptyNutritionState(true));
    return;
  }

  emit(createEmptyNutritionState(false));
  void hydrateNutritionState(accountId, activeAccountVersion);
}

async function hydrateNutritionState(accountId: string, accountVersion: number) {
  const storedState = await loadAccountScopedJson<Partial<NutritionState>>(
    NUTRITION_STORAGE_KEY,
    accountId,
  );
  const entries = normalizeStoredEntries(storedState?.entries);
  const nextState: NutritionState = {
    entries,
    isHydrated: true,
    target: mergeStoredTarget(storedState?.target),
    targetsByDate: mergeStoredTargetsByDate(storedState?.targetsByDate, entries),
  };

  if (activeAccountId !== accountId || activeAccountVersion !== accountVersion) {
    return;
  }

  emit(nextState);
  void saveNutritionStateForAccount(accountId, nextState);
}

async function saveNutritionState(nextState: NutritionState) {
  const accountId = activeAccountId;

  if (!accountId) {
    return;
  }

  await saveNutritionStateForAccount(accountId, nextState);
}

async function saveNutritionStateForAccount(accountId: string, nextState: NutritionState) {
  await saveAccountScopedJson<NutritionState>(NUTRITION_STORAGE_KEY, accountId, {
    entries: nextState.entries,
    isHydrated: true,
    target: nextState.target,
    targetsByDate: nextState.targetsByDate,
  });
}

function sortEntries(entries: NutritionEntry[]) {
  return [...entries].sort((firstEntry, secondEntry) => {
    if (firstEntry.date !== secondEntry.date) {
      return secondEntry.date.localeCompare(firstEntry.date);
    }

    return secondEntry.createdAt.localeCompare(firstEntry.createdAt);
  });
}

function normalizeStoredEntries(entries: NutritionEntry[] | undefined) {
  return sortEntries(
    (entries ?? []).filter(isUserNutritionEntry).map(normalizeEntry),
  );
}

function isUserNutritionEntry(entry: NutritionEntry) {
  return !REMOVED_SEED_ENTRY_IDS.has(entry.id);
}

function mergeStoredTarget(target?: NutritionTarget) {
  return normalizeTarget({
    ...defaultNutritionTarget,
    ...target,
  });
}

function mergeStoredTargetsByDate(
  targetsByDate: Record<string, NutritionTarget> | undefined,
  entries: NutritionEntry[],
) {
  const entryDates = new Set(entries.map((entry) => entry.date));

  return Object.fromEntries(
    Object.entries(targetsByDate ?? {})
      .filter(([date]) => entryDates.has(date))
      .map(([date, target]) => [
        date,
        normalizeTarget({
          ...defaultNutritionTarget,
          ...target,
        }),
      ]),
  );
}

function ensureTargetSnapshot(
  targetsByDate: Record<string, NutritionTarget>,
  date: string,
  target: NutritionTarget,
) {
  if (targetsByDate[date]) {
    return targetsByDate;
  }

  return {
    ...targetsByDate,
    [date]: snapshotTarget(target),
  };
}

function snapshotExistingEntryDates(
  targetsByDate: Record<string, NutritionTarget>,
  entries: NutritionEntry[],
  target: NutritionTarget,
) {
  const entryDates = new Set(entries.map((entry) => entry.date));

  return Array.from(entryDates).reduce(
    (nextTargetsByDate, date) =>
      ensureTargetSnapshot(nextTargetsByDate, date, target),
    targetsByDate,
  );
}

function getTargetForDate(snapshot: NutritionState, date: string) {
  const hasEntriesForDate = snapshot.entries.some((entry) => entry.date === date);

  if (!hasEntriesForDate) {
    return snapshot.target;
  }

  return snapshot.targetsByDate[date] ?? snapshot.target;
}

function snapshotTarget(target: NutritionTarget) {
  return {
    ...target,
  };
}

function normalizeEntry(entry: NutritionEntry) {
  return {
    ...entry,
    calories: calculateMacroCalories(entry),
  };
}

function normalizeTarget(target: NutritionTarget) {
  return {
    ...target,
    dailyCalories: calculateMacroCalories(target),
  };
}

function buildStore(snapshot: NutritionState): NutritionStore {
  return {
    ...snapshot,
    addEntry,
    deleteEntry,
    getTargetForDate: (date) => getTargetForDate(snapshot, date),
    initializeTarget,
    restoreEntry,
    updateEntry,
    updateTarget,
  };
}

function createEmptyNutritionState(isHydrated: boolean): NutritionState {
  return {
    entries: [],
    isHydrated,
    target: defaultNutritionTarget,
    targetsByDate: {},
  };
}

export function useNutritionStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}

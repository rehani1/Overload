import { useSyncExternalStore } from "react";

import {
  mockNutritionEntries,
  mockNutritionTarget,
} from "@/features/nutrition/mockNutrition";
import { loadStoredJson, saveStoredJson } from "@/lib/storage";
import type {
  NutritionEntry,
  NutritionEntryDraft,
  NutritionEntryUpdate,
  NutritionTarget,
  NutritionTargetUpdate,
} from "@/types/nutrition";

const NUTRITION_STORAGE_KEY = "overload.nutrition.v1";

type NutritionState = {
  entries: NutritionEntry[];
  isHydrated: boolean;
  target: NutritionTarget;
};

type NutritionStore = NutritionState & {
  addEntry: (draft: NutritionEntryDraft) => NutritionEntry;
  deleteEntry: (entryId: string) => void;
  restoreEntry: (entry: NutritionEntry) => void;
  updateEntry: (entryId: string, updates: NutritionEntryUpdate) => NutritionEntry | null;
  updateTarget: (updates: NutritionTargetUpdate) => NutritionTarget;
};

let state: NutritionState = {
  entries: mockNutritionEntries,
  isHydrated: false,
  target: mockNutritionTarget,
};

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
    id: createUuid(),
    createdAt: now,
    updatedAt: now,
  };

  emitAndPersist({
    ...state,
    entries: sortEntries([entry, ...state.entries]),
    isHydrated: true,
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
  });

  return updatedEntry;
}

function updateTarget(updates: NutritionTargetUpdate) {
  const updatedTarget: NutritionTarget = {
    ...state.target,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  emitAndPersist({
    ...state,
    isHydrated: true,
    target: updatedTarget,
  });

  return updatedTarget;
}

async function hydrateNutritionState() {
  const storedState = await loadStoredJson<NutritionState>(NUTRITION_STORAGE_KEY);

  emit({
    entries: storedState?.entries ?? mockNutritionEntries,
    isHydrated: true,
    target: storedState?.target ?? mockNutritionTarget,
  });
}

async function saveNutritionState(nextState: NutritionState) {
  await saveStoredJson<NutritionState>(NUTRITION_STORAGE_KEY, {
    entries: nextState.entries,
    isHydrated: true,
    target: nextState.target,
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

void hydrateNutritionState();

function buildStore(snapshot: NutritionState): NutritionStore {
  return {
    ...snapshot,
    addEntry,
    deleteEntry,
    restoreEntry,
    updateEntry,
    updateTarget,
  };
}

export function useNutritionStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return buildStore(snapshot);
}

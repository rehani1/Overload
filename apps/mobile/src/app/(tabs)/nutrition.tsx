import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { isApiConfigured } from "@/api/client";
import {
  createNutritionEntry,
  deleteNutritionEntry,
  updateNutritionEntry,
  updateNutritionTarget,
} from "@/api/nutritionApi";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useNutritionStore } from "@/store/useNutritionStore";
import type {
  MealType,
  NutritionEntry,
  NutritionEntryDraft,
  NutritionTarget,
  NutritionTargetUpdate,
} from "@/types/nutrition";

type SyncState = {
  kind: "idle" | "pending" | "success" | "error";
  message: string;
};

type NutritionEntryFormState = {
  calories: string;
  carbsGrams: string;
  fatGrams: string;
  foodName: string;
  mealType: MealType;
  notes: string;
  proteinGrams: string;
  servingQuantity: string;
};

type NutritionTargetFormState = {
  carbsGrams: string;
  dailyCalories: string;
  fatGrams: string;
  proteinGrams: string;
};

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function NutritionScreen() {
  const {
    addEntry,
    deleteEntry,
    entries,
    isHydrated,
    restoreEntry,
    target,
    updateEntry,
    updateTarget,
  } = useNutritionStore();
  const [selectedDate, setSelectedDate] = useState(getDateKeyFromDate(new Date()));
  const [entryDraft, setEntryDraft] = useState<NutritionEntryFormState>(
    getEmptyEntryFormState(),
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<NutritionEntryFormState | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    kind: "idle",
    message: isApiConfigured
      ? "Backend sync is enabled."
      : "Saved locally. Backend sync will activate when API URL is configured.",
  });
  const entriesForDate = entries.filter((entry) => entry.date === selectedDate);
  const totals = getNutritionTotals(entriesForDate);

  async function handleAddEntry() {
    const draft = buildEntryDraft(entryDraft, selectedDate);

    if (!draft) {
      setSyncState({
        kind: "error",
        message: "Enter a food name and valid non-negative nutrition values.",
      });
      return;
    }

    const addedEntry = addEntry(draft);
    setEntryDraft(getEmptyEntryFormState(draft.mealType));
    setSyncState({
      kind: "pending",
      message: "Nutrition entry saved locally. Syncing entry...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Nutrition entry saved locally. Backend sync is not configured yet.",
      });
      return;
    }

    try {
      await createNutritionEntry({
        ...draft,
        clientId: addedEntry.id,
      });
      setSyncState({
        kind: "success",
        message: "Nutrition entry synced.",
      });
    } catch {
      deleteEntry(addedEntry.id);
      setSyncState({
        kind: "error",
        message: "Nutrition sync failed. Local entry was rolled back.",
      });
    }
  }

  async function handleDeleteEntry(entry: NutritionEntry) {
    deleteEntry(entry.id);
    cancelEntryEdit();
    setSyncState({
      kind: "pending",
      message: "Nutrition entry deleted locally. Syncing delete...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Nutrition entry deleted locally. Backend sync is not configured yet.",
      });
      return;
    }

    try {
      await deleteNutritionEntry(entry.id);
      setSyncState({
        kind: "success",
        message: "Nutrition delete synced.",
      });
    } catch {
      restoreEntry(entry);
      setSyncState({
        kind: "error",
        message: "Delete sync failed. Nutrition entry was restored locally.",
      });
    }
  }

  async function handleSaveEntry(entry: NutritionEntry) {
    if (!editDraft) {
      return;
    }

    const update = buildEntryDraft(editDraft, entry.date);

    if (!update) {
      setSyncState({
        kind: "error",
        message: "Enter a food name and valid non-negative nutrition values.",
      });
      return;
    }

    const updatedEntry = updateEntry(entry.id, update);

    if (!updatedEntry) {
      setSyncState({
        kind: "error",
        message: "Could not find that nutrition entry locally.",
      });
      return;
    }

    cancelEntryEdit();
    setSyncState({
      kind: "pending",
      message: "Nutrition entry saved locally. Syncing changes...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Nutrition entry saved locally. Backend sync is not configured yet.",
      });
      return;
    }

    try {
      await updateNutritionEntry(entry.id, update);
      setSyncState({
        kind: "success",
        message: "Nutrition changes synced.",
      });
    } catch {
      restoreEntry(entry);
      setSyncState({
        kind: "error",
        message: "Sync failed. Local nutrition changes were rolled back.",
      });
    }
  }

  async function handleSaveTarget(targetFormState: NutritionTargetFormState) {
    const targetUpdate = buildTargetUpdate(targetFormState);

    if (!targetUpdate) {
      setSyncState({
        kind: "error",
        message: "Enter valid non-negative nutrition targets.",
      });
      return;
    }

    const originalTarget = target;
    updateTarget(targetUpdate);
    setSyncState({
      kind: "pending",
      message: "Nutrition target saved locally. Syncing target...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Nutrition target saved locally. Backend sync is not configured yet.",
      });
      return;
    }

    try {
      await updateNutritionTarget(targetUpdate);
      setSyncState({
        kind: "success",
        message: "Nutrition target synced.",
      });
    } catch {
      updateTarget({
        carbsGrams: originalTarget.carbsGrams,
        dailyCalories: originalTarget.dailyCalories,
        fatGrams: originalTarget.fatGrams,
        proteinGrams: originalTarget.proteinGrams,
      });
      setSyncState({
        kind: "error",
        message: "Target sync failed. Local target was rolled back.",
      });
    }
  }

  function handleDateChange(dayOffset: number) {
    setSelectedDate(getDateKeyFromDate(addDays(parseDateKey(selectedDate), dayOffset)));
    cancelEntryEdit();
  }

  function startEntryEdit(entry: NutritionEntry) {
    setEditingEntryId(entry.id);
    setEditDraft(getEntryFormState(entry));
  }

  function cancelEntryEdit() {
    setEditingEntryId(null);
    setEditDraft(null);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Nutrition" subtitle="Capture meals quickly; detailed trends belong on web." />

        <Card title="Sync Status">
          <Text style={[styles.mutedText, syncState.kind === "error" && styles.errorText]}>
            {syncState.message}
          </Text>
        </Card>

        {!isHydrated ? (
          <EmptyState title="Loading nutrition" message="Preparing local nutrition history." />
        ) : (
          <>
            <Card title={formatSelectedDate(selectedDate)}>
              <View style={styles.actionRow}>
                <Button onPress={() => handleDateChange(-1)} variant="secondary">
                  Previous Day
                </Button>
                <Button onPress={() => handleDateChange(1)} variant="secondary">
                  Next Day
                </Button>
              </View>

              <View style={styles.metricGrid}>
                <NutritionMetric
                  label="Calories"
                  target={target.dailyCalories}
                  unit=""
                  value={totals.calories}
                />
                <NutritionMetric
                  label="Protein"
                  target={target.proteinGrams}
                  unit="g"
                  value={totals.proteinGrams}
                />
                <NutritionMetric
                  label="Carbs"
                  target={target.carbsGrams}
                  unit="g"
                  value={totals.carbsGrams}
                />
                <NutritionMetric
                  label="Fat"
                  target={target.fatGrams}
                  unit="g"
                  value={totals.fatGrams}
                />
              </View>
            </Card>

            <NutritionTargetCard
              key={target.updatedAt}
              onSave={handleSaveTarget}
              target={target}
            />

            <Card title="Add Food">
              <NutritionEntryForm
                draft={entryDraft}
                onChange={(updates) =>
                  setEntryDraft((currentDraft) => ({
                    ...currentDraft,
                    ...updates,
                  }))
                }
                onSubmit={handleAddEntry}
                submitLabel="Add Food"
              />
            </Card>

            <Card title="Meals">
              {entriesForDate.length === 0 ? (
                <EmptyState
                  title="No nutrition entries"
                  message="Add a meal or snack to capture macros for this date."
                />
              ) : (
                <View style={styles.entryList}>
                  {entriesForDate.map((entry) => (
                    <NutritionEntryItem
                      draft={editDraft}
                      entry={entry}
                      isEditing={editingEntryId === entry.id && editDraft !== null}
                      key={entry.id}
                      onCancelEdit={cancelEntryEdit}
                      onDelete={() => handleDeleteEntry(entry)}
                      onSave={() => handleSaveEntry(entry)}
                      onStartEdit={() => startEntryEdit(entry)}
                      onUpdateDraft={(updates) =>
                        setEditDraft((currentDraft) =>
                          currentDraft
                            ? {
                                ...currentDraft,
                                ...updates,
                              }
                            : currentDraft,
                        )
                      }
                    />
                  ))}
                </View>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

type NutritionMetricProps = {
  label: string;
  target: number;
  unit: string;
  value: number;
};

function NutritionMetric({ label, target, unit, value }: NutritionMetricProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.metricValue}>
        {formatNumber(value)}
        {unit}
      </Text>
      <Text style={styles.mutedText}>
        of {formatNumber(target)}
        {unit}
      </Text>
    </View>
  );
}

type NutritionTargetCardProps = {
  onSave: (targetFormState: NutritionTargetFormState) => void;
  target: NutritionTarget;
};

function NutritionTargetCard({ onSave, target }: NutritionTargetCardProps) {
  const [targetDraft, setTargetDraft] = useState<NutritionTargetFormState>(
    getTargetFormState(target),
  );

  return (
    <Card title="Daily Targets">
      <View style={styles.inputGrid}>
        <Input
          keyboardType="numeric"
          label="Calories"
          onChangeText={(value) =>
            setTargetDraft((currentDraft) => ({
              ...currentDraft,
              dailyCalories: value,
            }))
          }
          placeholder="2400"
          value={targetDraft.dailyCalories}
        />
        <Input
          keyboardType="decimal-pad"
          label="Protein"
          onChangeText={(value) =>
            setTargetDraft((currentDraft) => ({
              ...currentDraft,
              proteinGrams: value,
            }))
          }
          placeholder="180"
          value={targetDraft.proteinGrams}
        />
        <Input
          keyboardType="decimal-pad"
          label="Carbs"
          onChangeText={(value) =>
            setTargetDraft((currentDraft) => ({
              ...currentDraft,
              carbsGrams: value,
            }))
          }
          placeholder="260"
          value={targetDraft.carbsGrams}
        />
        <Input
          keyboardType="decimal-pad"
          label="Fat"
          onChangeText={(value) =>
            setTargetDraft((currentDraft) => ({
              ...currentDraft,
              fatGrams: value,
            }))
          }
          placeholder="75"
          value={targetDraft.fatGrams}
        />
      </View>
      <Button onPress={() => onSave(targetDraft)}>Save Targets</Button>
    </Card>
  );
}

type NutritionEntryFormProps = {
  draft: NutritionEntryFormState;
  onChange: (updates: Partial<NutritionEntryFormState>) => void;
  onSubmit: () => void;
  submitLabel: string;
};

function NutritionEntryForm({
  draft,
  onChange,
  onSubmit,
  submitLabel,
}: NutritionEntryFormProps) {
  return (
    <View style={styles.form}>
      <View style={styles.mealTypeRow}>
        {mealTypes.map((mealType) => {
          const isSelected = draft.mealType === mealType;

          return (
            <Pressable
              accessibilityRole="button"
              key={mealType}
              onPress={() => onChange({ mealType })}
              style={({ pressed }) => [
                styles.mealTypeChip,
                isSelected && styles.selectedMealTypeChip,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.mealTypeText, isSelected && styles.selectedMealTypeText]}>
                {formatMealType(mealType)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Input
        label="Food"
        onChangeText={(value) => onChange({ foodName: value })}
        placeholder="Chicken rice bowl"
        value={draft.foodName}
      />

      <View style={styles.inputGrid}>
        <Input
          keyboardType="decimal-pad"
          label="Servings"
          onChangeText={(value) => onChange({ servingQuantity: value })}
          placeholder="1"
          value={draft.servingQuantity}
        />
        <Input
          keyboardType="numeric"
          label="Calories"
          onChangeText={(value) => onChange({ calories: value })}
          placeholder="650"
          value={draft.calories}
        />
        <Input
          keyboardType="decimal-pad"
          label="Protein"
          onChangeText={(value) => onChange({ proteinGrams: value })}
          placeholder="45"
          value={draft.proteinGrams}
        />
        <Input
          keyboardType="decimal-pad"
          label="Carbs"
          onChangeText={(value) => onChange({ carbsGrams: value })}
          placeholder="70"
          value={draft.carbsGrams}
        />
        <Input
          keyboardType="decimal-pad"
          label="Fat"
          onChangeText={(value) => onChange({ fatGrams: value })}
          placeholder="18"
          value={draft.fatGrams}
        />
      </View>

      <Input
        label="Notes"
        onChangeText={(value) => onChange({ notes: value })}
        placeholder="Optional"
        value={draft.notes}
      />

      <Button onPress={onSubmit}>{submitLabel}</Button>
    </View>
  );
}

type NutritionEntryItemProps = {
  draft: NutritionEntryFormState | null;
  entry: NutritionEntry;
  isEditing: boolean;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onStartEdit: () => void;
  onUpdateDraft: (updates: Partial<NutritionEntryFormState>) => void;
};

function NutritionEntryItem({
  draft,
  entry,
  isEditing,
  onCancelEdit,
  onDelete,
  onSave,
  onStartEdit,
  onUpdateDraft,
}: NutritionEntryItemProps) {
  return (
    <View style={styles.entryItem}>
      <Text style={styles.entryTitle}>{entry.foodName}</Text>
      <Text style={styles.mutedText}>
        {formatMealType(entry.mealType)} · {formatNumber(entry.servingQuantity)} serving
      </Text>
      <Text style={styles.bodyText}>
        {entry.calories} cal · P {formatNumber(entry.proteinGrams)}g · C{" "}
        {formatNumber(entry.carbsGrams)}g · F {formatNumber(entry.fatGrams)}g
      </Text>
      {entry.notes ? <Text style={styles.mutedText}>{entry.notes}</Text> : null}

      {isEditing && draft ? (
        <View style={styles.editBox}>
          <NutritionEntryForm
            draft={draft}
            onChange={onUpdateDraft}
            onSubmit={onSave}
            submitLabel="Save Changes"
          />
          <Button onPress={onCancelEdit} variant="secondary">
            Cancel
          </Button>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <Button onPress={onStartEdit} variant="secondary">
            Edit
          </Button>
          <Button onPress={onDelete} variant="danger">
            Delete
          </Button>
        </View>
      )}
    </View>
  );
}

type NutritionTotals = {
  calories: number;
  carbsGrams: number;
  fatGrams: number;
  proteinGrams: number;
};

function addDays(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset, 12);
}

function buildEntryDraft(
  formState: NutritionEntryFormState,
  date: string,
): NutritionEntryDraft | null {
  const calories = parseNonNegativeInteger(formState.calories);
  const carbsGrams = parseNonNegativeNumber(formState.carbsGrams);
  const fatGrams = parseNonNegativeNumber(formState.fatGrams);
  const proteinGrams = parseNonNegativeNumber(formState.proteinGrams);
  const servingQuantity = parsePositiveNumber(formState.servingQuantity);
  const foodName = formState.foodName.trim();

  if (
    !foodName ||
    calories === null ||
    carbsGrams === null ||
    fatGrams === null ||
    proteinGrams === null ||
    servingQuantity === null
  ) {
    return null;
  }

  return {
    calories,
    carbsGrams,
    date,
    fatGrams,
    foodName,
    mealType: formState.mealType,
    notes: formState.notes.trim() || undefined,
    proteinGrams,
    servingQuantity,
  };
}

function buildTargetUpdate(formState: NutritionTargetFormState): NutritionTargetUpdate | null {
  const dailyCalories = parseNonNegativeInteger(formState.dailyCalories);
  const carbsGrams = parseNonNegativeNumber(formState.carbsGrams);
  const fatGrams = parseNonNegativeNumber(formState.fatGrams);
  const proteinGrams = parseNonNegativeNumber(formState.proteinGrams);

  if (
    dailyCalories === null ||
    carbsGrams === null ||
    fatGrams === null ||
    proteinGrams === null
  ) {
    return null;
  }

  return {
    carbsGrams,
    dailyCalories,
    fatGrams,
    proteinGrams,
  };
}

function getEmptyEntryFormState(mealType: MealType = "breakfast"): NutritionEntryFormState {
  return {
    calories: "",
    carbsGrams: "",
    fatGrams: "",
    foodName: "",
    mealType,
    notes: "",
    proteinGrams: "",
    servingQuantity: "1",
  };
}

function getEntryFormState(entry: NutritionEntry): NutritionEntryFormState {
  return {
    calories: String(entry.calories),
    carbsGrams: String(entry.carbsGrams),
    fatGrams: String(entry.fatGrams),
    foodName: entry.foodName,
    mealType: entry.mealType,
    notes: entry.notes ?? "",
    proteinGrams: String(entry.proteinGrams),
    servingQuantity: String(entry.servingQuantity),
  };
}

function getNutritionTotals(entries: NutritionEntry[]): NutritionTotals {
  return entries.reduce<NutritionTotals>(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      carbsGrams: totals.carbsGrams + entry.carbsGrams,
      fatGrams: totals.fatGrams + entry.fatGrams,
      proteinGrams: totals.proteinGrams + entry.proteinGrams,
    }),
    {
      calories: 0,
      carbsGrams: 0,
      fatGrams: 0,
      proteinGrams: 0,
    },
  );
}

function getTargetFormState(target: NutritionTarget): NutritionTargetFormState {
  return {
    carbsGrams: String(target.carbsGrams),
    dailyCalories: String(target.dailyCalories),
    fatGrams: String(target.fatGrams),
    proteinGrams: String(target.proteinGrams),
  };
}

function formatMealType(mealType: MealType) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

function getDateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function parseNonNegativeInteger(value: string) {
  const parsedValue = parseNonNegativeNumber(value);

  return parsedValue === null ? null : Math.round(parsedValue);
}

function parseNonNegativeNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return Math.round(parsedValue * 10) / 10;
}

function parsePositiveNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 1;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return Math.round(parsedValue * 10) / 10;
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  form: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  bodyText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  errorText: {
    color: colors.danger,
  },
  inputGrid: {
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  mealTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mealTypeChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mealTypeText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.caption,
  },
  selectedMealTypeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedMealTypeText: {
    color: colors.background,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  pressed: {
    opacity: 0.84,
  },
  entryList: {
    gap: spacing.md,
  },
  entryItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  entryTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  editBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
});

import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
import { Icon } from "@/components/Icon";
import { Input } from "@/components/Input";
import { ModalShell } from "@/components/ModalShell";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import {
  NutritionEntryEditor,
  type NutritionEntryEditorState,
} from "@/features/nutrition/NutritionEntryEditor";
import { useNutritionStore } from "@/store/useNutritionStore";
import { usePresetStore } from "@/store/usePresetStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type {
  MealType,
  NutritionEntry,
  NutritionEntryDraft,
  NutritionTarget,
  NutritionTargetUpdate,
} from "@/types/nutrition";
import type { MealPreset } from "@/types/preset";
import { addDays, formatDateKey, parseDateKey } from "@/utils/date";
import {
  calculateMacroCalories,
  formatNutritionNumber,
  getNutritionTotals,
  parseNonNegativeDecimal,
  parsePositiveDecimal,
  sanitizeDecimalInput,
} from "@/utils/nutrition";

type SyncState = {
  kind: "idle" | "pending" | "success" | "error";
  message: string;
};

type NutritionTargetFormState = {
  carbsGrams: string;
  dailyCalories: string;
  fatGrams: string;
  proteinGrams: string;
};

type NutritionSectionProps = {
  isCompact?: boolean;
  selectedDate?: string;
  showDateControls?: boolean;
  showIntroCard?: boolean;
};

export function NutritionSection({
  isCompact = false,
  selectedDate: selectedDateProp,
  showDateControls = true,
  showIntroCard = true,
}: NutritionSectionProps) {
  const {
    addEntry,
    deleteEntry,
    entries,
    getTargetForDate,
    isHydrated,
    restoreEntry,
    target,
    updateEntry,
    updateTarget,
  } = useNutritionStore();
  const { addMealPreset, mealPresets } = usePresetStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [localSelectedDate, setLocalSelectedDate] = useState(formatDateKey(new Date()));
  const [entryDraft, setEntryDraft] = useState<NutritionEntryEditorState>(
    getEmptyEntryFormState(),
  );
  const [activeEntryModal, setActiveEntryModal] = useState<"add" | null>(null);
  const [editingEntry, setEditingEntry] = useState<NutritionEntry | null>(null);
  const [editDraft, setEditDraft] = useState<NutritionEntryEditorState | null>(null);
  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({
    kind: "idle",
    message: isApiConfigured
      ? "Backend sync is enabled."
      : "Saved locally. Backend sync will activate when API URL is configured.",
  });
  const selectedDate = selectedDateProp ?? localSelectedDate;
  const entriesForDate = entries.filter((entry) => entry.date === selectedDate);
  const totals = getNutritionTotals(entriesForDate);
  const targetForDate = getTargetForDate(selectedDate);

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
    setActiveEntryModal(null);
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

  async function handleQuickAddMealPreset(preset: MealPreset) {
    const presetEntry = preset.entry;
    const draft: NutritionEntryDraft = {
      calories: presetEntry.calories,
      carbsGrams: presetEntry.carbsGrams,
      date: selectedDate,
      fatGrams: presetEntry.fatGrams,
      foodName: presetEntry.foodName,
      mealType: presetEntry.mealType,
      notes: presetEntry.notes,
      proteinGrams: presetEntry.proteinGrams,
      servingQuantity: presetEntry.servingQuantity,
    };
    const addedEntry = addEntry(draft);

    cancelEntryEdit();
    setSyncState({
      kind: "pending",
      message: "Meal preset added locally. Syncing entry...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Meal preset added locally. Backend sync is not configured yet.",
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
        message: "Meal preset synced.",
      });
    } catch {
      deleteEntry(addedEntry.id);
      setSyncState({
        kind: "error",
        message: "Preset sync failed. Local entry was rolled back.",
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
      return false;
    }

    const originalTarget = target;
    updateTarget(targetUpdate);
    setSyncState({
      kind: "pending",
      message: "Default nutrition target saved locally. Syncing target...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Default nutrition target saved locally. Backend sync is not configured yet.",
      });
      return true;
    }

    try {
      await updateNutritionTarget(targetUpdate);
      setSyncState({
        kind: "success",
        message: "Default nutrition target synced.",
      });
      return true;
    } catch {
      updateTarget({
        carbsGrams: originalTarget.carbsGrams,
        dailyCalories: originalTarget.dailyCalories,
        fatGrams: originalTarget.fatGrams,
        proteinGrams: originalTarget.proteinGrams,
      });
      setSyncState({
        kind: "error",
        message: "Default target sync failed. Local target was rolled back.",
      });
      return true;
    }
  }

  function handleDateChange(dayOffset: number) {
    setLocalSelectedDate(formatDateKey(addDays(parseDateKey(selectedDate), dayOffset)));
    cancelEntryEdit();
  }

  function startEntryEdit(entry: NutritionEntry) {
    if (editingEntry?.id === entry.id) {
      cancelEntryEdit();
      return;
    }

    setEditingEntry(entry);
    setEditDraft(getEntryFormState(entry));
  }

  function handleSaveMealPreset(entry: NutritionEntry) {
    addMealPreset(entry);
    setSyncState({
      kind: "success",
      message: "Meal saved as a preset.",
    });
  }

  function cancelEntryEdit() {
    setActiveEntryModal(null);
    setEditingEntry(null);
    setEditDraft(null);
  }

  function openAddEntryModal() {
    cancelEntryEdit();
    setEntryDraft(getEmptyEntryFormState());
    setActiveEntryModal("add");
  }

  return (
    <View style={[styles.content, isCompact && styles.compactContent]}>
      {!isHydrated ? (
        <EmptyState title="Loading nutrition" message="Preparing local nutrition history." />
      ) : (
        <>
          <Card title="Nutrition" style={isCompact && styles.compactCard}>
            {showIntroCard ? (
              <Text style={styles.mutedText}>Capture meals quickly; detailed trends belong on web.</Text>
            ) : null}
            {syncState.kind !== "idle" ? (
              <Text style={[styles.mutedText, syncState.kind === "error" && styles.errorText]}>
                {syncState.message}
              </Text>
            ) : null}

            {showDateControls ? (
              <View style={styles.actionRow}>
                <Text style={styles.sectionLabel}>{formatSelectedDate(selectedDate)}</Text>
                <Button icon="chevron-left" onPress={() => handleDateChange(-1)} variant="secondary">
                  Previous Day
                </Button>
                <Button
                  icon="chevron-right"
                  iconPosition="right"
                  onPress={() => handleDateChange(1)}
                  variant="secondary"
                >
                  Next Day
                </Button>
              </View>
            ) : null}

            <View style={styles.metricGrid}>
              <NutritionMetric
                isCompact={isCompact}
                label="Calories"
                target={targetForDate.dailyCalories}
                unit=""
                value={totals.calories}
              />
              <NutritionMetric
                isCompact={isCompact}
                label="Protein"
                target={targetForDate.proteinGrams}
                unit="g"
                value={totals.proteinGrams}
              />
              <NutritionMetric
                isCompact={isCompact}
                label="Carbs"
                target={targetForDate.carbsGrams}
                unit="g"
                value={totals.carbsGrams}
              />
              <NutritionMetric
                isCompact={isCompact}
                label="Fat"
                target={targetForDate.fatGrams}
                unit="g"
                value={totals.fatGrams}
              />
            </View>

            <View style={[styles.actionRow, isCompact && styles.compactActionRow]}>
              <Button icon="plus" onPress={openAddEntryModal} style={isCompact && styles.compactActionButton}>
                Add Food
              </Button>
              <Button
                icon="pencil-square"
                onPress={() => setIsTargetModalVisible(true)}
                style={isCompact && styles.compactActionButton}
                variant="secondary"
              >
                Edit Default
              </Button>
            </View>

            <Text style={styles.sectionLabel}>Entries</Text>

            {entriesForDate.length === 0 ? (
              <EmptyState
                title="No nutrition entries"
                message="Your default target still sets the daily goal. Add food to track progress for this date."
              />
            ) : (
              <View style={styles.entryList}>
                {entriesForDate.map((entry) => (
                  <NutritionEntryItem
                    draft={editingEntry?.id === entry.id ? editDraft : null}
                    entry={entry}
                    isExpanded={editingEntry?.id === entry.id}
                    isCompact={isCompact}
                    key={entry.id}
                    onCancel={cancelEntryEdit}
                    onChange={(updates) => {
                      setEditDraft((currentDraft) =>
                        currentDraft
                          ? {
                              ...currentDraft,
                              ...updates,
                            }
                          : currentDraft,
                      );
                    }}
                    onDelete={() => {
                      void handleDeleteEntry(entry);
                    }}
                    onSave={() => {
                      void handleSaveEntry(entry);
                    }}
                    onSavePreset={() => handleSaveMealPreset(entry)}
                    onStartEdit={() => startEntryEdit(entry)}
                  />
                ))}
              </View>
            )}
          </Card>

          <NutritionEntryModal
            draft={entryDraft}
            mode={activeEntryModal}
            onChange={(updates) =>
              setEntryDraft((currentDraft) => ({
                ...currentDraft,
                ...updates,
              }))
            }
            onClose={() => {
              setActiveEntryModal(null);
            }}
            mealPresets={mealPresets}
            onQuickAdd={(preset) => {
              void handleQuickAddMealPreset(preset);
            }}
            onSubmit={() => {
              void handleAddEntry();
            }}
          />

          <NutritionTargetModal
            isVisible={isTargetModalVisible}
            key={target.updatedAt}
            onClose={() => setIsTargetModalVisible(false)}
            onSave={(targetFormState) => {
              void (async () => {
                const didSave = await handleSaveTarget(targetFormState);

                if (didSave) {
                  setIsTargetModalVisible(false);
                }
              })();
            }}
            target={target}
          />
        </>
      )}
    </View>
  );
}

type NutritionMetricProps = {
  isCompact?: boolean;
  label: string;
  target: number;
  unit: string;
  value: number;
};

function NutritionMetric({
  isCompact = false,
  label,
  target,
  unit,
  value,
}: NutritionMetricProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const progress = target > 0 ? Math.min(value / target, 1) : 0;

  return (
    <View style={[styles.metricCard, isCompact && styles.compactMetricCard]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.metricValue, isCompact && styles.compactMetricValue]}>
        {formatNumber(value)}
        {unit}
      </Text>
      <Text style={styles.mutedText}>
        of {formatNumber(target)}
        {unit}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

type NutritionTargetModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onSave: (targetFormState: NutritionTargetFormState) => void;
  target: NutritionTarget;
};

function NutritionTargetModal({
  isVisible,
  onClose,
  onSave,
  target,
}: NutritionTargetModalProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [targetDraft, setTargetDraft] = useState<NutritionTargetFormState>(
    getTargetFormState(target),
  );

  return (
    <ModalShell
      closeAccessibilityLabel="Close nutrition targets"
      eyebrow="Nutrition"
      onClose={onClose}
      title="Edit Default Targets"
      visible={isVisible}
    >
      <View style={styles.inputGrid}>
        <Input
          editable={false}
          keyboardType="numeric"
          label="Calories"
          onChangeText={() => undefined}
          placeholder="2400"
          value={String(calculateTargetDraftCalories(targetDraft))}
        />
        <Input
          keyboardType="decimal-pad"
          label="Protein"
          onChangeText={(value) =>
            setTargetDraft((currentDraft) => ({
              ...currentDraft,
              proteinGrams: sanitizeDecimalInput(value),
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
              carbsGrams: sanitizeDecimalInput(value),
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
              fatGrams: sanitizeDecimalInput(value),
            }))
          }
          placeholder="75"
          value={targetDraft.fatGrams}
        />
      </View>
      <Button icon="check" onPress={() => onSave(targetDraft)}>Save Targets</Button>
    </ModalShell>
  );
}

type NutritionEntryModalProps = {
  draft: NutritionEntryEditorState;
  mealPresets: MealPreset[];
  mode: "add" | null;
  onChange: (updates: Partial<NutritionEntryEditorState>) => void;
  onClose: () => void;
  onQuickAdd: (preset: MealPreset) => void;
  onSubmit: () => void;
};

function NutritionEntryModal({
  draft,
  mealPresets,
  mode,
  onChange,
  onClose,
  onQuickAdd,
  onSubmit,
}: NutritionEntryModalProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [isPresetPickerVisible, setIsPresetPickerVisible] = useState(false);

  return (
    <ModalShell
      closeAccessibilityLabel="Close food editor"
      eyebrow="Nutrition"
      onClose={onClose}
      title="Add Food"
      visible={mode !== null}
    >
      <View style={styles.actionRow}>
        <Button
          disabled={mealPresets.length === 0}
          icon="circle-stack"
          onPress={() => setIsPresetPickerVisible((isVisible) => !isVisible)}
          style={styles.compactActionButton}
          variant="secondary"
        >
          Quick Add
        </Button>
      </View>
      {isPresetPickerVisible ? (
        <View style={styles.presetPicker}>
          {mealPresets.map((preset) => (
            <Pressable
              accessibilityRole="button"
              key={preset.id}
              onPress={() => {
                setIsPresetPickerVisible(false);
                onQuickAdd(preset);
              }}
              style={styles.presetOption}
            >
              <Text style={styles.presetOptionTitle}>{preset.foodName}</Text>
              <Text style={styles.presetOptionMeta}>{preset.entry.calories} cal</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <NutritionEntryEditor
        cancelLabel="Cancel"
        draft={draft}
        onChange={onChange}
        onCancel={onClose}
        onSave={onSubmit}
        saveLabel="Add Food"
      />
    </ModalShell>
  );
}

type NutritionEntryItemProps = {
  draft: NutritionEntryEditorState | null;
  entry: NutritionEntry;
  isExpanded: boolean;
  isCompact?: boolean;
  onCancel: () => void;
  onChange: (updates: Partial<NutritionEntryEditorState>) => void;
  onDelete: () => void;
  onSave: () => void;
  onSavePreset: () => void;
  onStartEdit: () => void;
};

function NutritionEntryItem({
  draft,
  entry,
  isExpanded,
  isCompact = false,
  onCancel,
  onChange,
  onDelete,
  onSave,
  onSavePreset,
  onStartEdit,
}: NutritionEntryItemProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={[styles.entryItem, isCompact && styles.compactEntryItem]}>
      <Pressable
        accessibilityLabel={`${entry.foodName}, ${isExpanded ? "collapse" : "expand"}`}
        accessibilityRole="button"
        onPress={onStartEdit}
        style={styles.expandableEntrySummary}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryCopy}>
            <Text style={styles.entryTitle}>{entry.foodName}</Text>
            <Text style={styles.mutedText}>
              {formatMealType(entry.mealType)} · {formatNumber(entry.servingQuantity)} serving
            </Text>
          </View>
          <View style={styles.entryMetaGroup}>
            <View style={styles.caloriePill}>
              <Text style={styles.caloriePillText}>{entry.calories} cal</Text>
            </View>
            <Icon
              color={colors.textMuted}
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
            />
          </View>
        </View>

        <Text style={styles.bodyText}>
          P {formatNumber(entry.proteinGrams)}g · C{" "}
          {formatNumber(entry.carbsGrams)}g · F {formatNumber(entry.fatGrams)}g
        </Text>
        {entry.notes ? <Text style={styles.mutedText}>{entry.notes}</Text> : null}
      </Pressable>

      {isExpanded && draft ? (
        <>
          <View style={styles.inlineActionRow}>
            <Button
              icon="circle-stack"
              onPress={onSavePreset}
              style={styles.compactActionButton}
              variant="secondary"
            >
              Save Preset
            </Button>
          </View>
          <NutritionEntryEditor
            draft={draft}
            onCancel={onCancel}
            onChange={onChange}
            onDelete={onDelete}
            onSave={onSave}
          />
        </>
      ) : null}
    </View>
  );
}

function buildEntryDraft(
  formState: NutritionEntryEditorState,
  date: string,
): NutritionEntryDraft | null {
  const carbsGrams = parseNonNegativeDecimal(formState.carbsGrams);
  const fatGrams = parseNonNegativeDecimal(formState.fatGrams);
  const proteinGrams = parseNonNegativeDecimal(formState.proteinGrams);
  const servingQuantity = parsePositiveDecimal(formState.servingQuantity, {
    emptyValue: 1,
  });
  const foodName = formState.foodName.trim();

  if (
    !foodName ||
    carbsGrams === null ||
    fatGrams === null ||
    proteinGrams === null ||
    servingQuantity === null
  ) {
    return null;
  }

  return {
    calories: calculateMacroCalories({ carbsGrams, fatGrams, proteinGrams }),
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
  const carbsGrams = parseNonNegativeDecimal(formState.carbsGrams);
  const fatGrams = parseNonNegativeDecimal(formState.fatGrams);
  const proteinGrams = parseNonNegativeDecimal(formState.proteinGrams);

  if (
    carbsGrams === null ||
    fatGrams === null ||
    proteinGrams === null
  ) {
    return null;
  }

  return {
    carbsGrams,
    dailyCalories: calculateMacroCalories({ carbsGrams, fatGrams, proteinGrams }),
    fatGrams,
    proteinGrams,
  };
}

function getEmptyEntryFormState(mealType: MealType = "breakfast"): NutritionEntryEditorState {
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

function getEntryFormState(entry: NutritionEntry): NutritionEntryEditorState {
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

function getTargetFormState(target: NutritionTarget): NutritionTargetFormState {
  return {
    carbsGrams: String(target.carbsGrams),
    dailyCalories: String(
      calculateMacroCalories({
        carbsGrams: target.carbsGrams,
        fatGrams: target.fatGrams,
        proteinGrams: target.proteinGrams,
      }),
    ),
    fatGrams: String(target.fatGrams),
    proteinGrams: String(target.proteinGrams),
  };
}

function calculateTargetDraftCalories(formState: NutritionTargetFormState) {
  return calculateMacroCalories({
    carbsGrams: parseNonNegativeDecimal(formState.carbsGrams) ?? 0,
    fatGrams: parseNonNegativeDecimal(formState.fatGrams) ?? 0,
    proteinGrams: parseNonNegativeDecimal(formState.proteinGrams) ?? 0,
  });
}

function formatMealType(mealType: MealType) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function formatNumber(value: number) {
  return formatNutritionNumber(value);
}

function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  compactContent: {
    gap: spacing.md,
  },
  compactCard: {
    borderRadius: 24,
    gap: spacing.md,
    padding: spacing.lg,
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
    fontWeight: typography.weights.semibold,
    letterSpacing: 0,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0,
    lineHeight: typography.lineHeights.caption,
    marginTop: spacing.sm,
    textTransform: "uppercase",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  compactMetricCard: {
    borderRadius: 18,
    gap: spacing.xs,
    padding: spacing.md,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
  },
  compactMetricValue: {
    fontSize: typography.sizes.subtitle,
    lineHeight: typography.lineHeights.subtitle,
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  entryList: {
    gap: spacing.md,
  },
  entryItem: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  compactEntryItem: {
    borderRadius: 18,
    gap: spacing.sm,
    padding: spacing.md,
  },
  expandableEntrySummary: {
    gap: spacing.sm,
  },
  entryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  entryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  entryMetaGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  entryTitle: {
    color: colors.text,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.subtitle,
  },
  caloriePill: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  caloriePillText: {
    color: colors.text,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  compactActionRow: {
    gap: spacing.sm,
    marginTop: 0,
  },
  compactActionButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  inlineActionRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  presetPicker: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  presetOption: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  presetOptionTitle: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.small,
  },
  presetOptionMeta: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  });
}

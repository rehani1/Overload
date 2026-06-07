import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import {
  NutritionEntryEditor,
  type NutritionEntryEditorState,
} from "@/features/nutrition/NutritionEntryEditor";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useThemeColors } from "@/theme/ThemeProvider";
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
    isHydrated,
    restoreEntry,
    target,
    updateEntry,
    updateTarget,
  } = useNutritionStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [localSelectedDate, setLocalSelectedDate] = useState(getDateKeyFromDate(new Date()));
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
      message: "Nutrition target saved locally. Syncing target...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Nutrition target saved locally. Backend sync is not configured yet.",
      });
      return true;
    }

    try {
      await updateNutritionTarget(targetUpdate);
      setSyncState({
        kind: "success",
        message: "Nutrition target synced.",
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
        message: "Target sync failed. Local target was rolled back.",
      });
      return true;
    }
  }

  function handleDateChange(dayOffset: number) {
    setLocalSelectedDate(getDateKeyFromDate(addDays(parseDateKey(selectedDate), dayOffset)));
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
                target={target.dailyCalories}
                unit=""
                value={totals.calories}
              />
              <NutritionMetric
                isCompact={isCompact}
                label="Protein"
                target={target.proteinGrams}
                unit="g"
                value={totals.proteinGrams}
              />
              <NutritionMetric
                isCompact={isCompact}
                label="Carbs"
                target={target.carbsGrams}
                unit="g"
                value={totals.carbsGrams}
              />
              <NutritionMetric
                isCompact={isCompact}
                label="Fat"
                target={target.fatGrams}
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
                Edit Targets
              </Button>
            </View>

            <Text style={styles.sectionLabel}>Entries</Text>

            {entriesForDate.length === 0 ? (
              <EmptyState
                title="No nutrition entries"
                message="Add a meal or snack to capture macros for this date."
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
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={isVisible}
    >
      <SafeAreaView edges={["top"]} style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleGroup}>
            <Text style={styles.modalEyebrow}>Nutrition</Text>
            <Text numberOfLines={2} style={styles.modalTitle}>Edit Targets</Text>
          </View>
          <Pressable
            accessibilityLabel="Close nutrition targets"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon color={colors.text} name="x-mark" size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGrid}>
            <Input
              keyboardType="numeric"
              label="Calories"
              onChangeText={(value) =>
                setTargetDraft((currentDraft) => ({
                  ...currentDraft,
                  dailyCalories: sanitizeIntegerInput(value),
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
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

type NutritionEntryModalProps = {
  draft: NutritionEntryEditorState;
  mode: "add" | null;
  onChange: (updates: Partial<NutritionEntryEditorState>) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function NutritionEntryModal({
  draft,
  mode,
  onChange,
  onClose,
  onSubmit,
}: NutritionEntryModalProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={mode !== null}
    >
      <SafeAreaView edges={["top"]} style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleGroup}>
            <Text style={styles.modalEyebrow}>Nutrition</Text>
            <Text numberOfLines={2} style={styles.modalTitle}>Add Food</Text>
          </View>
          <Pressable
            accessibilityLabel="Close food editor"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon color={colors.text} name="x-mark" size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <NutritionEntryEditor
            cancelLabel="Cancel"
            draft={draft}
            onChange={onChange}
            onCancel={onClose}
            onSave={onSubmit}
            saveLabel="Add Food"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
        <NutritionEntryEditor
          draft={draft}
          onCancel={onCancel}
          onChange={onChange}
          onDelete={onDelete}
          onSave={onSave}
        />
      ) : null}
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
  formState: NutritionEntryEditorState,
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
  if (!/^\d+$/.test(value.trim())) {
    return null;
  }

  const parsedValue = parseNonNegativeNumber(value);

  return parsedValue === null ? null : parsedValue;
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

function sanitizeDecimalInput(value: string) {
  const cleanedValue = value.replaceAll(",", ".").replace(/[^\d.]/g, "");
  const [wholeValue, ...decimalParts] = cleanedValue.split(".");

  if (decimalParts.length === 0) {
    return wholeValue;
  }

  return `${wholeValue}.${decimalParts.join("")}`;
}

function sanitizeIntegerInput(value: string) {
  return value.replace(/\D/g, "");
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
    letterSpacing: 0.7,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.7,
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
  modalScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  modalTitleGroup: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  modalEyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.8,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: typography.weights.bold,
    lineHeight: 28,
  },
  modalContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
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
  });
}

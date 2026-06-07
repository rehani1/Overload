import { useState } from "react";
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import {
  NutritionEntryEditor,
  type NutritionEntryEditorState,
} from "@/features/nutrition/NutritionEntryEditor";
import { mockUser } from "@/features/profile/mockUser";
import { WorkoutEditor } from "@/features/workouts/WorkoutEditor";
import { useAuthStore } from "@/store/useAuthStore";
import { useNutritionStore } from "@/store/useNutritionStore";
import { usePresetStore } from "@/store/usePresetStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { NutritionEntry, NutritionTargetUpdate } from "@/types/nutrition";
import type { MealPreset, WorkoutPreset } from "@/types/preset";
import type { Workout } from "@/types/workout";

type TargetDraft = {
  carbsGrams: string;
  dailyCalories: string;
  fatGrams: string;
  proteinGrams: string;
};

export default function ProfileScreen() {
  const { target, updateTarget } = useNutritionStore();
  const { updateUser, user } = useAuthStore();
  const {
    addMealPreset,
    addWorkoutPreset,
    deleteMealPreset,
    deleteWorkoutPreset,
    mealPresets,
    updateMealPreset,
    updateWorkoutPreset,
    workoutPresets,
  } = usePresetStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const profileUser = user ?? mockUser;
  const fullName = `${profileUser.firstName} ${profileUser.lastName}`;
  const latestWorkoutPreset = workoutPresets[0];
  const latestMealPreset = mealPresets[0];
  const [goalDraft, setGoalDraft] = useState(profileUser.goal);
  const [isGoalEditing, setIsGoalEditing] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [targetDraft, setTargetDraft] = useState<TargetDraft>(getTargetDraft(target));
  const [isTargetEditing, setIsTargetEditing] = useState(false);
  const [targetError, setTargetError] = useState("");
  const [activePresetType, setActivePresetType] = useState<"meal" | "workout" | null>(null);
  const [editingWorkoutPresetId, setEditingWorkoutPresetId] = useState<string | null>(null);
  const [workoutPresetDraft, setWorkoutPresetDraft] = useState<Workout | null>(null);
  const [editingMealPresetId, setEditingMealPresetId] = useState<string | null>(null);
  const [mealPresetDraft, setMealPresetDraft] = useState<NutritionEntryEditorState | null>(null);
  const targetMacros = [
    {
      label: "Protein",
      value: `${formatNumber(target.proteinGrams)}g`,
    },
    {
      label: "Carbs",
      value: `${formatNumber(target.carbsGrams)}g`,
    },
    {
      label: "Fat",
      value: `${formatNumber(target.fatGrams)}g`,
    },
  ];

  function startGoalEdit() {
    setGoalDraft(profileUser.goal);
    setGoalError("");
    setIsGoalEditing(true);
  }

  function saveGoal() {
    const nextGoal = goalDraft.trim();

    if (!nextGoal) {
      setGoalError("Add a goal before saving.");
      return;
    }

    updateUser({ goal: nextGoal });
    setGoalError("");
    setIsGoalEditing(false);
  }

  function startTargetEdit() {
    setTargetDraft(getTargetDraft(target));
    setTargetError("");
    setIsTargetEditing(true);
  }

  function saveTarget() {
    const nextTarget = buildTargetUpdate(targetDraft);

    if (!nextTarget) {
      setTargetError("Use valid non-negative macro values.");
      return;
    }

    updateTarget(nextTarget);
    setTargetError("");
    setIsTargetEditing(false);
  }

  function closePresetModal() {
    setActivePresetType(null);
    setEditingWorkoutPresetId(null);
    setWorkoutPresetDraft(null);
    setEditingMealPresetId(null);
    setMealPresetDraft(null);
  }

  function startWorkoutPresetEdit(preset: WorkoutPreset) {
    setEditingWorkoutPresetId(preset.id);
    setWorkoutPresetDraft(cloneWorkout(preset.workout));
  }

  function saveWorkoutPreset(preset: WorkoutPreset) {
    if (!workoutPresetDraft) {
      return;
    }

    updateWorkoutPreset(preset.id, {
      ...workoutPresetDraft,
      title: workoutPresetDraft.title.trim() || preset.title,
    });
    setEditingWorkoutPresetId(null);
    setWorkoutPresetDraft(null);
  }

  function startMealPresetEdit(preset: MealPreset) {
    setEditingMealPresetId(preset.id);
    setMealPresetDraft(getMealPresetDraft(preset.entry));
  }

  function saveMealPreset(preset: MealPreset) {
    if (!mealPresetDraft) {
      return;
    }

    const entry = buildMealPresetEntry(mealPresetDraft, preset.entry);

    if (!entry) {
      return;
    }

    updateMealPreset(preset.id, entry);
    setEditingMealPresetId(null);
    setMealPresetDraft(null);
  }

  function addPreset() {
    if (activePresetType === "workout") {
      const preset = addWorkoutPreset(createEmptyWorkoutPreset());
      setEditingWorkoutPresetId(preset.id);
      setWorkoutPresetDraft(cloneWorkout(preset.workout));
      return;
    }

    if (activePresetType === "meal") {
      const preset = addMealPreset(createEmptyMealPreset());
      setEditingMealPresetId(preset.id);
      setMealPresetDraft(getMealPresetDraft(preset.entry));
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title="Profile"
          action={
            <Button icon="cog-6-tooth" onPress={() => router.push("/settings")} variant="secondary">
              Settings
            </Button>
          }
        />

        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profileUser.firstName.charAt(0)}
              {profileUser.lastName.charAt(0)}
            </Text>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{fullName}</Text>
            <Text style={styles.heroSubtitle}>{profileUser.email}</Text>
          </View>
        </View>

        <View style={styles.presetRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActivePresetType("workout")}
            style={styles.presetWidget}
          >
            <Text style={styles.presetLabel}>Workout Preset</Text>
            <Text style={styles.presetCount}>{workoutPresets.length}</Text>
            <Text numberOfLines={1} style={styles.presetMeta}>
              {latestWorkoutPreset?.title ?? "No saved workouts"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActivePresetType("meal")}
            style={styles.presetWidget}
          >
            <Text style={styles.presetLabel}>Meal Preset</Text>
            <Text style={styles.presetCount}>{mealPresets.length}</Text>
            <Text numberOfLines={1} style={styles.presetMeta}>
              {latestMealPreset?.foodName ?? "No saved meals"}
            </Text>
          </Pressable>
        </View>

        {isGoalEditing ? (
          <View style={styles.goalPanel}>
            <View style={styles.panelTitleRow}>
              <Icon color={colors.primary} name="sparkles" size={18} />
              <Text style={styles.panelLabel}>Current goal</Text>
            </View>

            <Input
              label="Goal"
              onChangeText={setGoalDraft}
              placeholder="Build strength while staying consistent"
              value={goalDraft}
            />

            {goalError ? <Text style={styles.errorText}>{goalError}</Text> : null}

            <View style={styles.actionRow}>
              <Button icon="check" onPress={saveGoal} style={styles.actionButton}>
                Save
              </Button>
              <Button
                icon="x-mark"
                onPress={() => {
                  setGoalError("");
                  setIsGoalEditing(false);
                }}
                style={styles.actionButton}
                variant="secondary"
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={startGoalEdit}
            style={styles.goalPanel}
          >
            <View style={styles.panelTitleRow}>
              <Icon color={colors.primary} name="sparkles" size={18} />
              <Text style={styles.panelLabel}>Current goal</Text>
              <Icon color={colors.textMuted} name="pencil-square" size={18} />
            </View>
            <Text style={styles.goalText}>{profileUser.goal}</Text>
          </Pressable>
        )}

        {isTargetEditing ? (
          <View style={styles.targetCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.panelLabel}>Default nutrition target</Text>
                <Text style={styles.sectionTitle}>Edit defaults</Text>
              </View>
              <View style={styles.targetIcon}>
                <Icon color={colors.primary} name="shopping-bag" size={22} />
              </View>
            </View>

            <Input
              editable={false}
              keyboardType="numeric"
              label="Calories"
              onChangeText={() => undefined}
              placeholder="2400"
              value={String(calculateTargetDraftCalories(targetDraft))}
            />

            <View style={styles.targetInputRow}>
              <View style={styles.targetInputColumn}>
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
              </View>
              <View style={styles.targetInputColumn}>
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
              </View>
              <View style={styles.targetInputColumn}>
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
            </View>

            {targetError ? <Text style={styles.errorText}>{targetError}</Text> : null}

            <View style={styles.actionRow}>
              <Button icon="check" onPress={saveTarget} style={styles.actionButton}>
                Save
              </Button>
              <Button
                icon="x-mark"
                onPress={() => {
                  setTargetError("");
                  setIsTargetEditing(false);
                }}
                style={styles.actionButton}
                variant="secondary"
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={startTargetEdit}
            style={styles.targetCard}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.panelLabel}>Default nutrition target</Text>
                <Text style={styles.sectionTitle}>{formatNumber(target.dailyCalories)} calories</Text>
              </View>
              <View style={styles.targetIcon}>
                <Icon color={colors.primary} name="shopping-bag" size={22} />
              </View>
            </View>

            <View style={styles.targetMacroRow}>
              {targetMacros.map((macro) => (
                <View key={macro.label} style={styles.targetMacro}>
                  <Text style={styles.targetMacroLabel}>{macro.label}</Text>
                  <Text style={styles.targetMacroValue}>{macro.value}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        )}
      </ScrollView>

      <PresetManagerModal
        activeType={activePresetType}
        editingMealPresetId={editingMealPresetId}
        editingWorkoutPresetId={editingWorkoutPresetId}
        mealDraft={mealPresetDraft}
        mealPresets={mealPresets}
        onAddPreset={addPreset}
        onClose={closePresetModal}
        onDeleteMeal={(preset) => {
          deleteMealPreset(preset.id);
          setEditingMealPresetId(null);
          setMealPresetDraft(null);
        }}
        onDeleteWorkout={(preset) => {
          deleteWorkoutPreset(preset.id);
          setEditingWorkoutPresetId(null);
          setWorkoutPresetDraft(null);
        }}
        onMealDraftChange={(updates) =>
          setMealPresetDraft((currentDraft) =>
            currentDraft
              ? {
                  ...currentDraft,
                  ...updates,
                }
              : currentDraft,
          )
        }
        onSaveMeal={saveMealPreset}
        onSaveWorkout={saveWorkoutPreset}
        onStartMealEdit={startMealPresetEdit}
        onStartWorkoutEdit={startWorkoutPresetEdit}
        onWorkoutDraftChange={(updater) =>
          setWorkoutPresetDraft((currentDraft) =>
            currentDraft ? updater(currentDraft) : currentDraft,
          )
        }
        unitPreference={profileUser.unitPreference}
        workoutDraft={workoutPresetDraft}
        workoutPresets={workoutPresets}
      />
    </Screen>
  );
}

type PresetManagerModalProps = {
  activeType: "meal" | "workout" | null;
  editingMealPresetId: string | null;
  editingWorkoutPresetId: string | null;
  mealDraft: NutritionEntryEditorState | null;
  mealPresets: MealPreset[];
  onAddPreset: () => void;
  onClose: () => void;
  onDeleteMeal: (preset: MealPreset) => void;
  onDeleteWorkout: (preset: WorkoutPreset) => void;
  onMealDraftChange: (updates: Partial<NutritionEntryEditorState>) => void;
  onSaveMeal: (preset: MealPreset) => void;
  onSaveWorkout: (preset: WorkoutPreset) => void;
  onStartMealEdit: (preset: MealPreset) => void;
  onStartWorkoutEdit: (preset: WorkoutPreset) => void;
  onWorkoutDraftChange: (updater: (workout: Workout) => Workout) => void;
  unitPreference: "lb" | "kg";
  workoutDraft: Workout | null;
  workoutPresets: WorkoutPreset[];
};

function PresetManagerModal({
  activeType,
  editingMealPresetId,
  editingWorkoutPresetId,
  mealDraft,
  mealPresets,
  onAddPreset,
  onClose,
  onDeleteMeal,
  onDeleteWorkout,
  onMealDraftChange,
  onSaveMeal,
  onSaveWorkout,
  onStartMealEdit,
  onStartWorkoutEdit,
  onWorkoutDraftChange,
  unitPreference,
  workoutDraft,
  workoutPresets,
}: PresetManagerModalProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const isWorkout = activeType === "workout";
  const title = isWorkout ? "Workout Presets" : "Meal Presets";
  const hasPresets = isWorkout ? workoutPresets.length > 0 : mealPresets.length > 0;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={activeType !== null}
    >
      <SafeAreaView edges={["top"]} style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleGroup}>
            <Text style={styles.modalEyebrow}>Presets</Text>
            <Text numberOfLines={2} style={styles.modalTitle}>{title}</Text>
          </View>
          <Pressable
            accessibilityLabel="Close presets"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon color={colors.text} name="x-mark" size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <Button icon="plus" onPress={onAddPreset} style={styles.addPresetButton}>
            Add Preset
          </Button>

          {!hasPresets ? (
            <View style={styles.emptyPresetBox}>
              <Text style={styles.emptyPresetTitle}>No presets yet</Text>
              <Text style={styles.emptyPresetText}>
                Save a calendar item as a preset to manage it here.
              </Text>
            </View>
          ) : null}

          {isWorkout
            ? workoutPresets.map((preset) => {
                const isEditing = editingWorkoutPresetId === preset.id;

                return (
                  <View key={preset.id} style={styles.presetDetailCard}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onStartWorkoutEdit(preset)}
                      style={styles.presetSummaryRow}
                    >
                      <View style={styles.presetSummaryCopy}>
                        <Text style={styles.presetDetailTitle}>{preset.title}</Text>
                        <Text style={styles.presetDetailMeta}>
                          {preset.workout.exercises.length} exercises
                        </Text>
                      </View>
                      <Icon
                        color={colors.textMuted}
                        name={isEditing ? "chevron-up" : "chevron-down"}
                        size={18}
                      />
                    </Pressable>

                    {isEditing && workoutDraft ? (
                      <>
                        <WorkoutEditor
                          onCancel={onClose}
                          onSave={() => onSaveWorkout(preset)}
                          onUpdateWorkout={onWorkoutDraftChange}
                          saveLabel="Save Preset"
                          unitPreference={unitPreference}
                          workout={workoutDraft}
                        />
                        <Button
                          icon="trash"
                          onPress={() => onDeleteWorkout(preset)}
                          style={styles.actionButton}
                          variant="danger"
                        >
                          Delete Preset
                        </Button>
                      </>
                    ) : null}
                  </View>
                );
              })
            : mealPresets.map((preset) => {
                const isEditing = editingMealPresetId === preset.id;

                return (
                  <View key={preset.id} style={styles.presetDetailCard}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onStartMealEdit(preset)}
                      style={styles.presetSummaryRow}
                    >
                      <View style={styles.presetSummaryCopy}>
                        <Text style={styles.presetDetailTitle}>{preset.foodName}</Text>
                        <Text style={styles.presetDetailMeta}>
                          {preset.entry.calories} cal
                        </Text>
                      </View>
                      <Icon
                        color={colors.textMuted}
                        name={isEditing ? "chevron-up" : "chevron-down"}
                        size={18}
                      />
                    </Pressable>

                    {isEditing && mealDraft ? (
                      <NutritionEntryEditor
                        draft={mealDraft}
                        onCancel={onClose}
                        onChange={onMealDraftChange}
                        onDelete={() => onDeleteMeal(preset)}
                        onSave={() => onSaveMeal(preset)}
                        saveLabel="Save Preset"
                      />
                    ) : null}
                  </View>
                );
              })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function buildTargetUpdate(draft: TargetDraft): NutritionTargetUpdate | null {
  const carbsGrams = parseDecimal(draft.carbsGrams);
  const fatGrams = parseDecimal(draft.fatGrams);
  const proteinGrams = parseDecimal(draft.proteinGrams);

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

function buildMealPresetEntry(
  draft: NutritionEntryEditorState,
  fallbackEntry: NutritionEntry,
): NutritionEntry | null {
  const carbsGrams = parseDecimal(draft.carbsGrams);
  const fatGrams = parseDecimal(draft.fatGrams);
  const proteinGrams = parseDecimal(draft.proteinGrams);
  const servingQuantity = parsePositiveDecimal(draft.servingQuantity);
  const foodName = draft.foodName.trim();

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
    ...fallbackEntry,
    calories: calculateMacroCalories({ carbsGrams, fatGrams, proteinGrams }),
    carbsGrams,
    fatGrams,
    foodName,
    mealType: draft.mealType,
    notes: draft.notes.trim() || undefined,
    proteinGrams,
    servingQuantity,
    updatedAt: new Date().toISOString(),
  };
}

function calculateTargetDraftCalories(draft: TargetDraft) {
  return calculateMacroCalories({
    carbsGrams: parseDecimal(draft.carbsGrams) ?? 0,
    fatGrams: parseDecimal(draft.fatGrams) ?? 0,
    proteinGrams: parseDecimal(draft.proteinGrams) ?? 0,
  });
}

function calculateMacroCalories({
  carbsGrams,
  fatGrams,
  proteinGrams,
}: {
  carbsGrams: number;
  fatGrams: number;
  proteinGrams: number;
}) {
  return Math.round(proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9);
}

function cloneWorkout(workout: Workout): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((workoutExercise) => ({
      ...workoutExercise,
      exercise: {
        ...workoutExercise.exercise,
      },
      sets: workoutExercise.sets.map((set) => ({
        ...set,
      })),
    })),
  };
}

function createEmptyMealPreset(): NutritionEntry {
  const now = new Date().toISOString();

  return {
    calories: 0,
    carbsGrams: 0,
    createdAt: now,
    date: getDateKeyFromDate(new Date()),
    fatGrams: 0,
    foodName: "Meal Preset",
    id: createId("meal-preset-entry"),
    mealType: "breakfast",
    proteinGrams: 0,
    servingQuantity: 1,
    updatedAt: now,
  };
}

function createEmptyWorkoutPreset(): Workout {
  return {
    date: buildDateTime(new Date(), 12, 0),
    exercises: [],
    id: createId("workout-preset"),
    status: "completed",
    title: "Workout Preset",
  };
}

function buildDateTime(date: Date, hours: number, minutes: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
  ).toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function getDateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMealPresetDraft(entry: NutritionEntry): NutritionEntryEditorState {
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

function getTargetDraft(target: NutritionTargetUpdate): TargetDraft {
  return {
    carbsGrams: String(target.carbsGrams ?? ""),
    dailyCalories: String(
      calculateMacroCalories({
        carbsGrams: target.carbsGrams ?? 0,
        fatGrams: target.fatGrams ?? 0,
        proteinGrams: target.proteinGrams ?? 0,
      }),
    ),
    fatGrams: String(target.fatGrams ?? ""),
    proteinGrams: String(target.proteinGrams ?? ""),
  };
}

function parseDecimal(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return Math.round(parsedValue * 10) / 10;
}

function parsePositiveDecimal(value: string) {
  const parsedValue = parseDecimal(value);

  if (parsedValue === null || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function sanitizeDecimalInput(value: string) {
  const cleanedValue = value.replaceAll(",", ".").replace(/[^\d.]/g, "");
  const [wholeValue, ...decimalParts] = cleanedValue.split(".");

  if (decimalParts.length === 0) {
    return wholeValue;
  }

  return `${wholeValue}.${decimalParts.join("")}`;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    profileHero: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderRadius: 30,
      borderWidth: 1,
      boxShadow: `0px 18px 36px ${colors.shadow}`,
      flexDirection: "row",
      gap: spacing.lg,
      padding: spacing.xl,
    },
    avatar: {
      alignItems: "center",
      backgroundColor: colors.primaryMuted,
      borderRadius: 24,
      height: 72,
      justifyContent: "center",
      width: 72,
    },
    avatarText: {
      color: colors.primary,
      fontSize: typography.sizes.title,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.title,
    },
    heroCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    heroTitle: {
      color: colors.onPrimary,
      fontSize: typography.sizes.title,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.title,
    },
    heroSubtitle: {
      color: colors.heroTextMuted,
      fontSize: typography.sizes.body,
      lineHeight: typography.lineHeights.body,
    },
    presetRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    presetWidget: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 22,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 112,
      padding: spacing.lg,
    },
    presetLabel: {
      color: colors.text,
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.body,
      textAlign: "center",
    },
    presetCount: {
      color: colors.primary,
      fontSize: typography.sizes.title,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.title,
      textAlign: "center",
    },
    presetMeta: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.medium,
      lineHeight: typography.lineHeights.caption,
      maxWidth: "100%",
      textAlign: "center",
    },
    goalPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 26,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
    },
    panelTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    panelLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      letterSpacing: 0,
      lineHeight: typography.lineHeights.caption,
      textTransform: "uppercase",
    },
    goalText: {
      color: colors.text,
      fontSize: typography.sizes.subtitle,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.subtitle,
    },
    sectionHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    sectionHeaderCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: typography.sizes.subtitle,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.subtitle,
    },
    targetCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 26,
      borderWidth: 1,
      gap: spacing.lg,
      padding: spacing.lg,
    },
    targetIcon: {
      alignItems: "center",
      backgroundColor: colors.primaryMuted,
      borderRadius: 18,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    targetMacroRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    targetMacro: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      gap: spacing.xs,
      padding: spacing.md,
    },
    targetMacroLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.caption,
    },
    targetMacroValue: {
      color: colors.text,
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.body,
    },
    targetInputRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    targetInputColumn: {
      flex: 1,
      minWidth: 0,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    actionButton: {
      minHeight: 42,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    addPresetButton: {
      alignSelf: "flex-start",
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    errorText: {
      color: colors.danger,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.caption,
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
    modalContent: {
      gap: spacing.md,
      paddingBottom: spacing.xxxl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    emptyPresetBox: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: spacing.xs,
      padding: spacing.lg,
    },
    emptyPresetTitle: {
      color: colors.text,
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.body,
    },
    emptyPresetText: {
      color: colors.textMuted,
      fontSize: typography.sizes.body,
      lineHeight: typography.lineHeights.body,
    },
    presetDetailCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
    },
    presetSummaryRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    presetSummaryCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    presetDetailTitle: {
      color: colors.text,
      fontSize: typography.sizes.subtitle,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.subtitle,
    },
    presetDetailMeta: {
      color: colors.textMuted,
      fontSize: typography.sizes.body,
      lineHeight: typography.lineHeights.body,
    },
  });
}

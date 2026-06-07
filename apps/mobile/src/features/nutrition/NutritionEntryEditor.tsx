import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Button } from "@/components/Button";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { MealType } from "@/types/nutrition";

export type NutritionEntryEditorState = {
  calories: string;
  carbsGrams: string;
  fatGrams: string;
  foodName: string;
  mealType: MealType;
  notes: string;
  proteinGrams: string;
  servingQuantity: string;
};

type NutritionEntryEditorProps = {
  cancelLabel?: string;
  draft: NutritionEntryEditorState;
  onCancel?: () => void;
  onChange: (updates: Partial<NutritionEntryEditorState>) => void;
  onDelete?: () => void;
  onSave: () => void;
  saveLabel?: string;
};

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function NutritionEntryEditor({
  cancelLabel = "Cancel",
  draft,
  onCancel,
  onChange,
  onDelete,
  onSave,
  saveLabel = "Save",
}: NutritionEntryEditorProps) {
  const styles = createStyles(useThemeColors());

  return (
    <View style={styles.editor}>
      <View style={styles.mealTypeRow}>
        {mealTypes.map((mealType) => {
          const isSelected = draft.mealType === mealType;

          return (
            <Pressable
              accessibilityRole="button"
              key={mealType}
              onPress={() => onChange({ mealType })}
              style={[styles.mealChip, isSelected && styles.mealChipSelected]}
            >
              <Text style={[styles.mealText, isSelected && styles.mealTextSelected]}>
                {formatMealType(mealType)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CompactTextInput
        label="Food"
        onChangeText={(foodName) => onChange({ foodName })}
        value={draft.foodName}
      />

      <View style={styles.fieldRow}>
        <CompactTextInput
          keyboardType="decimal-pad"
          label="Srv"
          onChangeText={(servingQuantity) =>
            onChange({ servingQuantity: sanitizeDecimalInput(servingQuantity) })
          }
          value={draft.servingQuantity}
        />
        <CompactTextInput
          keyboardType="numeric"
          label="Cal"
          onChangeText={(calories) => onChange({ calories: sanitizeIntegerInput(calories) })}
          value={draft.calories}
        />
        <CompactTextInput
          keyboardType="decimal-pad"
          label="P"
          onChangeText={(proteinGrams) =>
            onChange({ proteinGrams: sanitizeDecimalInput(proteinGrams) })
          }
          value={draft.proteinGrams}
        />
        <CompactTextInput
          keyboardType="decimal-pad"
          label="C"
          onChangeText={(carbsGrams) =>
            onChange({ carbsGrams: sanitizeDecimalInput(carbsGrams) })
          }
          value={draft.carbsGrams}
        />
        <CompactTextInput
          keyboardType="decimal-pad"
          label="F"
          onChangeText={(fatGrams) => onChange({ fatGrams: sanitizeDecimalInput(fatGrams) })}
          value={draft.fatGrams}
        />
      </View>

      <CompactTextInput
        label="Notes"
        onChangeText={(notes) => onChange({ notes })}
        value={draft.notes}
      />

      <View style={styles.actionRow}>
        <Button icon="check" onPress={onSave} style={styles.actionButton}>
          {saveLabel}
        </Button>
        {onCancel ? (
          <Button icon="x-mark" onPress={onCancel} style={styles.actionButton} variant="secondary">
            {cancelLabel}
          </Button>
        ) : null}
        {onDelete ? (
          <Button icon="trash" onPress={onDelete} style={styles.actionButton} variant="danger">
            Delete
          </Button>
        ) : null}
      </View>
    </View>
  );
}

type CompactTextInputProps = {
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
  wrapperStyle?: StyleProp<ViewStyle>;
};

function CompactTextInput({
  keyboardType = "default",
  label,
  onChangeText,
  value,
  wrapperStyle,
}: CompactTextInputProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={[styles.inputField, wrapperStyle]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        autoCapitalize="words"
        cursorColor={colors.primary}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function formatMealType(mealType: MealType) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
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
    editor: {
      gap: spacing.md,
    },
    mealTypeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    mealChip: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    mealChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    mealText: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.caption,
    },
    mealTextSelected: {
      color: colors.onPrimary,
    },
    fieldRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.xs,
    },
    inputField: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: typography.weights.semibold,
      lineHeight: 13,
      textTransform: "uppercase",
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text,
      fontSize: typography.sizes.small,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.small,
      minHeight: 38,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    actionButton: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
  });
}

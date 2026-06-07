import type { NutritionEntry } from "@/types/nutrition";

export type MacroValues = Pick<
  NutritionEntry,
  "carbsGrams" | "fatGrams" | "proteinGrams"
>;

export type NutritionTotals = MacroValues & {
  calories: number;
};

export function calculateMacroCalories({
  carbsGrams,
  fatGrams,
  proteinGrams,
}: MacroValues) {
  return Math.round(proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9);
}

export function getNutritionTotals(entries: NutritionEntry[]): NutritionTotals {
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

export function parseNonNegativeDecimal(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return roundOneDecimal(parsedValue);
}

export function parseNonNegativeDecimalOrZero(value: string) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}

export function parsePositiveDecimal(
  value: string,
  options: { emptyValue?: number } = {},
) {
  const trimmedValue = value.trim();

  if (!trimmedValue && options.emptyValue !== undefined) {
    return options.emptyValue;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return roundOneDecimal(parsedValue);
}

export function sanitizeDecimalInput(value: string) {
  const cleanedValue = value.replaceAll(",", ".").replace(/[^\d.]/g, "");
  const [wholeValue, ...decimalParts] = cleanedValue.split(".");

  if (decimalParts.length === 0) {
    return wholeValue;
  }

  return `${wholeValue}.${decimalParts.join("")}`;
}

export function formatNutritionNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatRoundedNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

import type { ApiDecimal } from "../types/api";

export function toNumber(value: ApiDecimal | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function formatDecimal(value: ApiDecimal | null | undefined, fractionDigits = 1) {
  return toNumber(value).toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

export function formatInteger(value: ApiDecimal | number | null | undefined) {
  return Math.round(toNumber(value)).toLocaleString();
}

export function formatPercent(value: ApiDecimal | null | undefined) {
  return `${formatDecimal(value, 1)}%`;
}

export function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDateRange(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));

  return {
    from: toIsoDate(from),
    to: toIsoDate(to),
  };
}

export function splitDateKey(dateKey: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (year == null || month == null || day == null) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  return { year, month, day };
}

export function toLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string): Date {
  const { year, month, day } = splitDateKey(dateKey);
  return new Date(year, month - 1, day);
}

export function addDays(dateKey: string, amount: number): string {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return toLocalDateKey(date);
}

export function addMonths(dateKey: string, amount: number): string {
  const { year, month, day } = splitDateKey(dateKey);
  const date = new Date(year, month - 1 + amount, day);
  return toLocalDateKey(date);
}

export function startOfMonth(dateKey: string): string {
  const { year, month } = splitDateKey(dateKey);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function diffDays(from: string, to: string): number {
  const start = fromDateKey(from).getTime();
  const end = fromDateKey(to).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function weekdayMondayFirst(dateKey: string): number {
  return (fromDateKey(dateKey).getDay() + 6) % 7;
}

export function startOfWeek(dateKey: string): string {
  return addDays(dateKey, -weekdayMondayFirst(dateKey));
}

export function padMonth(month: number): string {
  return String(month).padStart(2, "0");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatLongDate(dateKey: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

export function formatMonthYear(dateKey: string): string {
  return capitalize(
    new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(fromDateKey(dateKey)),
  );
}

export function formatDateRange(start: string, end: string): string {
  const startLabel = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(fromDateKey(start));
  const endLabel = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(fromDateKey(end));
  return `${startLabel} – ${endLabel}`;
}

export const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;

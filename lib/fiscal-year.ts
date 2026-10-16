export const FIRST_FISCAL_YEAR = 2010;
export const BUSINESS_TIME_ZONE = "Asia/Kolkata";

const QUARTER_MONTHS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
];

export function getFiscalYear(date: Date) {
  const { year, month } = kolkataCalendar(date);
  return month < 4 ? year - 1 : year;
}

export function fiscalMonthIndex(date: Date) {
  const { month } = kolkataCalendar(date);
  return (month - 1 + 9) % 12;
}

export function calendarParts(financialYear: number, monthIndex: number) {
  const calendarMonth = monthIndex <= 8 ? monthIndex + 3 : monthIndex - 9;
  const calendarYear = monthIndex <= 8 ? financialYear : financialYear + 1;
  return { calendarMonth, calendarYear };
}

export function quarterContainsMonth(quarter: string, month: string) {
  if (quarter === "all" || month === "all") return true;

  return QUARTER_MONTHS[Number(quarter) - 1]?.includes(Number(month)) ?? false;
}

export function endOfMonth(date: Date) {
  const { year, month } = kolkataCalendar(date);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return parseKolkataDate(
    `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    true,
  );
}

export function kolkataCalendar(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
  };
}

export function parseKolkataDate(isoDate: string, endOfDay = false) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);

  if (!match) {
    throw new Error("Expected a YYYY-MM-DD date.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );

  return new Date(utc - (5 * 60 + 30) * 60 * 1000);
}

export function formatKolkataDate(date: Date) {
  const { year, month, day } = kolkataCalendar(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function fiscalQuarter(date: Date) {
  return String(Math.floor(fiscalMonthIndex(date) / 3) + 1);
}

export function calendarDaysBetween(later: Date, earlier: Date) {
  const end = kolkataCalendar(later);
  const start = kolkataCalendar(earlier);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

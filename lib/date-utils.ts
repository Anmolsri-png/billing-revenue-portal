import { format } from "date-fns";

const BUSINESS_TIME_ZONE = "Asia/Kolkata";

function getBusinessDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(
    parts.find((part) => part.type === "year")?.value,
  );
  const month = Number(
    parts.find((part) => part.type === "month")?.value,
  );
  const day = Number(
    parts.find((part) => part.type === "day")?.value,
  );

  if (!year || !month || !day) {
    return null;
  }

  return { day, month, year };
}

function createDateFromParts(parts: {
  day: number;
  month: number;
  year: number;
}) {
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
  );
}

export function getCurrentFinancialYear(
  referenceDate = new Date(),
) {
  return referenceDate.getMonth() < 3
    ? referenceDate.getFullYear() - 1
    : referenceDate.getFullYear();
}

export function getFinancialYearRange(year: number) {
  const start = new Date(year, 3, 1); 
  start.setHours(0, 0, 0, 0);

  const end = new Date(year + 1, 2, 31); 
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getFinancialYearRangeToDate(
  year: number,
  referenceDate = new Date(),
) {
  const { start, end } = getFinancialYearRange(year);
  const currentFinancialYear = getCurrentFinancialYear(
    referenceDate,
  );

  if (year !== currentFinancialYear) {
    return { start, end };
  }

  const cappedEnd = new Date(referenceDate);
  cappedEnd.setHours(23, 59, 59, 999);

  return {
    start,
    end: cappedEnd < end ? cappedEnd : end,
  };
}

export function parseStoredDateValue(
  value?: Date | string | null,
) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    const parts = getBusinessDateParts(value);
    return parts ? createDateFromParts(parts) : null;
  }

  const dateMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (dateMatch) {
    const [, year, month, day] = dateMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const parts = getBusinessDateParts(parsed);
  return parts ? createDateFromParts(parts) : null;
}

export function toBusinessDateValue(
  value?: Date | string | null,
) {
  const parsed = parseStoredDateValue(value);

  if (!parsed) {
    return null;
  }

  return new Date(
    Date.UTC(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    ),
  );
}

export function formatStoredDate(
  value?: Date | string | null,
  pattern = "dd/MM/yyyy",
) {
  const parsed = parseStoredDateValue(value);

  return parsed ? format(parsed, pattern) : "-";
}

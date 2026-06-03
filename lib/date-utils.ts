import { format } from "date-fns";

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

    return new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
  }

  const dateMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
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

  return new Date(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );
}

export function formatStoredDate(
  value?: Date | string | null,
  pattern = "dd/MM/yyyy",
) {
  const parsed = parseStoredDateValue(value);

  return parsed ? format(parsed, pattern) : "-";
}

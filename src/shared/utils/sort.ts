import { label } from "./text.js";

export const sortByLabel = <T>(
  items: T[],
  getLabel: (item: T) => string | null | undefined,
  getFallback: (item: T) => string,
): T[] =>
  [...items].sort((left, right) =>
    label(getLabel(left), getFallback(left)).localeCompare(
      label(getLabel(right), getFallback(right)),
    ),
  );

export const sortByCode = <T extends { code: string | number }>(
  items: T[],
): T[] =>
  [...items].sort((left, right) =>
    String(left.code).localeCompare(String(right.code)),
  );

export const sortByNumericId = <T extends { numericId: string | number }>(
  items: T[],
): T[] =>
  [...items].sort(
    (left, right) => Number(left.numericId) - Number(right.numericId),
  );

export const mergeById = <T extends { id: string }>(
  current: Map<string, T>,
  records: T[],
): Map<string, T> => {
  const next = new Map(current);
  for (const record of records) next.set(record.id, record);
  return next;
};

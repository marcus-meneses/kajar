export const cleanText = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
};

export const requiredText = (value: string | null | undefined): string =>
  cleanText(value) ?? "";

export const label = (
  value: string | null | undefined,
  fallback: string,
): string => value?.trim() || fallback;

export const fallbackLabel = (
  value: string | null | undefined,
  fallback: string,
): string => value?.trim() || fallback;

export const formatCount = (value: number): string => value.toLocaleString();

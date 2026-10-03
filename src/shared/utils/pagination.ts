export type PageFetcher<T> = (params: {
  limit: number;
  offset: number;
}) => Promise<{ data: T[] }>;

export const fetchAllPages = async <T>(
  fetchPage: PageFetcher<T>,
  limit = 500,
): Promise<T[]> => {
  const records: T[] = [];
  for (let offset = 0; ; offset += limit) {
    const page = await fetchPage({ limit, offset });
    records.push(...page.data);
    if (page.data.length < limit) return records;
  }
};

export const loadPagedUntil = async <T extends { id: string }>(
  fetchPage: PageFetcher<T>,
  targetId: string | null,
  limit = 30,
): Promise<{ rows: T[]; offset: number; hasMore: boolean }> => {
  const rows: T[] = [];
  for (let offset = 0; ; offset += limit) {
    const page = await fetchPage({ limit, offset });
    rows.push(
      ...page.data.filter(
        (item) => !rows.some((current) => current.id === item.id),
      ),
    );
    const nextOffset = offset + page.data.length;
    const hasMore = page.data.length === limit;
    if (!hasMore || (targetId && rows.some((item) => item.id === targetId)))
      return { rows, offset: nextOffset, hasMore };
  }
};

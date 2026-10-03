import { useMemo } from "react";
import type { FiscalCategory } from "../../shared/types.js";

export type FiscalTreeRow = {
  id: string;
  primary: string;
  secondary: string;
  depth: number;
};

export function buildFiscalCategoryTreeRows(
  items: FiscalCategory[],
  query: string,
  expandedIds: string[],
  excludedIds: string[] = [],
): FiscalTreeRow[] {
  const needle = query.trim().toLowerCase();
  const excluded = new Set(excludedIds);
  const children = new Map<string, FiscalCategory[]>();

  for (const item of items) {
    const parent = item.parent ?? "";
    children.set(parent, [...(children.get(parent) ?? []), item]);
  }

  for (const list of children.values()) {
    list.sort((left, right) => left.code.localeCompare(right.code));
  }

  const rows: FiscalTreeRow[] = [];

  const visit = (item: FiscalCategory, depth: number) => {
    const matches =
      !needle ||
      [item.code, item.description].some((value) =>
        value.toLowerCase().includes(needle),
      );

    if (matches && !excluded.has(item.id)) {
      rows.push({
        id: item.id,
        primary: item.code,
        secondary: item.description,
        depth,
      });
    }

    if ((needle || expandedIds.includes(item.id)) && children.has(item.id)) {
      for (const child of children.get(item.id) ?? []) visit(child, depth + 1);
    }
  };

  for (const root of children.get("") ?? []) visit(root, 0);

  return rows;
}

export function useFiscalCategoryTree(
  items: FiscalCategory[],
  query: string,
  expandedIds: string[],
  excludedIds: string[] = [],
) {
  return useMemo(
    () => buildFiscalCategoryTreeRows(items, query, expandedIds, excludedIds),
    [items, query, expandedIds, excludedIds],
  );
}

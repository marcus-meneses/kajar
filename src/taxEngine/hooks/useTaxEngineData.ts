import { useMemo } from "react";
import type {
  FiscalException,
  FiscalFrame,
  FiscalFrameTax,
  TaxRule,
} from "../../shared";

export function useTaxEngineData({
  rules,
  frames,
  frameTaxes,
  exceptions,
}: {
  rules: TaxRule[];
  frames: FiscalFrame[];
  frameTaxes: FiscalFrameTax[];
  exceptions: FiscalException[];
}) {
  const ruleById = useMemo(
    () => new Map(rules.map((item) => [item.id, item])),
    [rules],
  );
  const frameById = useMemo(
    () => new Map(frames.map((item) => [item.id, item])),
    [frames],
  );
  const frameTaxById = useMemo(
    () => new Map(frameTaxes.map((item) => [item.id, item])),
    [frameTaxes],
  );
  return {
    ruleById,
    frameById,
    frameTaxById,
    counts: {
      rules: rules.length,
      frames: frames.length,
      frameTaxes: frameTaxes.length,
      exceptions: exceptions.length,
    },
  };
}

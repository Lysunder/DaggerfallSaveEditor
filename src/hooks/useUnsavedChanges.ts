import { useMemo } from 'react';
import { useSaveStore } from '../store/useSaveStore';
import { diffAll } from '../utils/saveDiff';

/** Unsaved changes in the loaded save and faction data, computed once per state (see diffAll). */
export const useUnsavedChanges = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const factionData = useSaveStore((state) => state.factionData);
  const baselineSaveData = useSaveStore((state) => state.baselineSaveData);
  const baselineFactionData = useSaveStore((state) => state.baselineFactionData);
  const repairs = useSaveStore((state) => state.repairs);

  const changes = diffAll(baselineSaveData, saveData, baselineFactionData, factionData);
  const repairedIds = useMemo(() => new Set(repairs.map((repair) => repair.id)), [repairs]);

  return { changes, count: changes.length, isDirty: changes.length > 0, repairedIds };
};

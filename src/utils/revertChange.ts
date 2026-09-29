// Puts one change back to its baseline value. Works on an Immer draft (or any mutable copy).
import type { Change, PathSegment } from './saveDiff';

const EQUIP_TABLE = ['playerData', 'playerEntity', 'equipTable'];

const step = (container: any, segment: PathSegment): any => {
  if (container == null) return undefined;
  if (typeof segment === 'object') {
    return Array.isArray(container) ? container.find((element) => element?.[segment.key] === segment.value) : undefined;
  }
  return container[segment];
};

const resolve = (root: any, path: PathSegment[]) => path.reduce(step, root);

const indexOfKey = (array: any[], segment: { key: string; value: string | number }) =>
  array.findIndex((element) => element?.[segment.key] === segment.value);

export interface RevertResult {
  /** False when the path no longer exists (e.g. its parent was removed), so nothing changed. */
  applied: boolean;
  /** Equipment slots that couldn't be restored because another item now uses them. */
  occupiedSlots: number[];
}

/**
 * Reverts `change` in `draft`, using `baseline` for the original position of a removed record.
 * Only ever restores baseline values, so reverts can be applied in any order.
 */
export const revertChange = (draft: any, baseline: any, change: Change): RevertResult => {
  const result: RevertResult = { applied: false, occupiedSlots: [] };
  const parentPath = change.path.slice(0, -1);
  const last = change.path[change.path.length - 1];
  const parent = resolve(draft, parentPath);
  if (parent == null || last === undefined) return result;

  if (change.kind === 'changed') {
    if (typeof last === 'object') return result;
    if (change.before === undefined) delete parent[last];
    else parent[last] = change.before;
    result.applied = true;
    return result;
  }

  if (typeof last !== 'object' || !Array.isArray(parent)) return result;

  if (change.kind === 'added') {
    const index = indexOfKey(parent, last);
    if (index >= 0) {
      parent.splice(index, 1);
      result.applied = true;
    }
    return result;
  }

  // Removed: re-insert after the nearest earlier baseline neighbour that still exists.
  if (indexOfKey(parent, last) >= 0) return result;
  const baselineArray: any[] = resolve(baseline, parentPath) ?? [];
  const baselineIndex = indexOfKey(baselineArray, last);
  let insertAt = 0;
  for (let i = baselineIndex - 1; i >= 0; i--) {
    const neighbour = parent.findIndex((element) => element?.[last.key] === baselineArray[i]?.[last.key]);
    if (neighbour >= 0) {
      insertAt = neighbour + 1;
      break;
    }
  }
  parent.splice(insertAt, 0, change.before);
  result.applied = true;

  const equipTable = resolve(draft, EQUIP_TABLE);
  if (change.equipSlots && Array.isArray(equipTable)) {
    for (const slot of change.equipSlots) {
      if (!equipTable[slot]) equipTable[slot] = last.value;
      else if (equipTable[slot] !== last.value) result.occupiedSlots.push(slot);
    }
  }
  return result;
};

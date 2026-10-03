// Compares the save as loaded (or last saved) with the current state.
// The store's Immer updates share every untouched branch with the previous version, so any pair of
// values that are === is skipped without looking inside; only edited branches are visited.

export type SaveFile = 'save' | 'faction';

/** A property name, an array index, or a record in a keyed array. */
export type PathSegment = string | number | { key: string; value: string | number };

export interface RecordRef {
  path: PathSegment[];
  name: string;
}

export interface Change {
  /** Stable identifier derived from file and path. */
  id: string;
  file: SaveFile;
  path: PathSegment[];
  kind: 'changed' | 'added' | 'removed';
  /** undefined means the property didn't exist. */
  before: unknown;
  after: unknown;
  /** The innermost keyed record the change belongs to (an item, a faction…). */
  record?: RecordRef;
  /** For a removed item: equipTable slots that held it before, restored together with it. */
  equipSlots?: number[];
}

/** Arrays whose elements are matched by an identity key instead of by position. */
const KEYED_ARRAYS: Record<SaveFile, Record<string, string>> = {
  save: {
    'playerData.playerEntity.items': 'uid',
    'playerData.playerEntity.wagonItems': 'uid',
    'playerData.playerEntity.globalVars': 'name',
    'playerData.guildMemberships': 'Key',
    bankAccounts: 'regionIndex',
  },
  faction: {
    factionDict: 'Key',
  },
};

const EQUIP_TABLE = 'playerData.playerEntity.equipTable';

/** Dotted path of property names only, used to look up keyed arrays and label patterns. */
export const propertyPath = (path: PathSegment[]) =>
  path.filter((segment): segment is string => typeof segment === 'string').join('.');

const formatSegment = (segment: PathSegment) =>
  typeof segment === 'object' ? `[${segment.key}=${segment.value}]` : typeof segment === 'number' ? `[${segment}]` : `.${segment}`;

export const changeId = (file: SaveFile, path: PathSegment[]) => `${file}:${path.map(formatSegment).join('').replace(/^\./, '')}`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Display name of a record, e.g. an item's shortName or a faction's name. */
export const recordName = (record: unknown, key: string, keyValue: string | number): string => {
  if (isObject(record)) {
    if (typeof record.shortName === 'string') return record.shortName;
    if (typeof record.name === 'string') return record.name;
    if (isObject(record.Value) && typeof record.Value.name === 'string') return record.Value.name;
  }
  return `${key} ${keyValue}`;
};

const walk = (
  before: unknown,
  after: unknown,
  path: PathSegment[],
  file: SaveFile,
  record: RecordRef | undefined,
  out: Change[],
) => {
  if (before === after) return;

  const push = (kind: Change['kind'], b: unknown, a: unknown, p = path, r = record) =>
    out.push({ id: changeId(file, p), file, path: p, kind, before: b, after: a, record: r });

  if (Array.isArray(before) && Array.isArray(after)) {
    const key = KEYED_ARRAYS[file][propertyPath(path)];
    const keyOf = (element: unknown) => (key && isObject(element) ? (element[key] as string | number) : undefined);
    // Matching by key needs unique keys; with duplicates fall back to comparing by position.
    const unique = (array: unknown[]) => new Set(array.map(keyOf)).size === array.length;
    if (key && unique(before) && unique(after)) {
      const beforeByKey = new Map(before.map((element) => [keyOf(element), element]));
      const afterByKey = new Map(after.map((element) => [keyOf(element), element]));
      for (const [value, element] of beforeByKey) {
        if (value === undefined) continue;
        const elementPath = [...path, { key, value }];
        const ref = { path: elementPath, name: recordName(element, key, value) };
        if (!afterByKey.has(value)) push('removed', element, undefined, elementPath, ref);
        else walk(element, afterByKey.get(value), elementPath, file, ref, out);
      }
      for (const [value, element] of afterByKey) {
        if (value === undefined || beforeByKey.has(value)) continue;
        const elementPath = [...path, { key, value }];
        push('added', undefined, element, elementPath, { path: elementPath, name: recordName(element, key, value) });
      }
      return;
    }
    if (before.length === after.length) {
      before.forEach((element, index) => walk(element, after[index], [...path, index], file, record, out));
    } else {
      push('changed', before, after);
    }
    return;
  }

  if (isObject(before) && isObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) {
      walk(before[key], after[key], [...path, key], file, record, out);
    }
    return;
  }

  push('changed', before, after);
};

/** Moves equipTable slot changes caused by deleting an item into that item's "removed" change. */
const foldEquipmentSlots = (changes: Change[]): Change[] => {
  const removedItems = new Map<unknown, Change>();
  for (const change of changes) {
    const last = change.path[change.path.length - 1];
    const parent = propertyPath(change.path);
    if (
      change.kind === 'removed' && typeof last === 'object' && last.key === 'uid' &&
      (parent === 'playerData.playerEntity.items' || parent === 'playerData.playerEntity.wagonItems')
    ) {
      removedItems.set(last.value, change);
    }
  }
  if (removedItems.size === 0) return changes;

  return changes.filter((change) => {
    const slot = change.path[change.path.length - 1];
    if (propertyPath(change.path) !== EQUIP_TABLE || typeof slot !== 'number') return true;
    const item = removedItems.get(change.before);
    if (!item || (change.after !== 0 && change.after !== undefined)) return true;
    item.equipSlots = [...(item.equipSlots ?? []), slot];
    return false;
  });
};

export const diffSave = (before: unknown, after: unknown): Change[] => {
  if (before === after || !before || !after) return [];
  const out: Change[] = [];
  walk(before, after, [], 'save', undefined, out);
  return foldEquipmentSlots(out);
};

export const diffFaction = (before: unknown, after: unknown): Change[] => {
  if (before === after || !before || !after) return [];
  const out: Change[] = [];
  walk(before, after, [], 'faction', undefined, out);
  return out;
};

// Several components use the same result; compute it once per state.
let cache: { args: unknown[]; result: Change[] } | null = null;
export const diffAll = (baselineSave: unknown, save: unknown, baselineFaction: unknown, faction: unknown): Change[] => {
  const args = [baselineSave, save, baselineFaction, faction];
  if (cache && cache.args.every((arg, index) => arg === args[index])) return cache.result;
  const result = [...diffSave(baselineSave, save), ...diffFaction(baselineFaction, faction)];
  cache = { args, result };
  return result;
};

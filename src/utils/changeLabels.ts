// Turns a Change into what the change list shows: a section, a label and formatted values.
import { REGION_NAMES } from '../data/regions';
import { formatGameTime } from './daggerfallDate';
import { propertyPath, type Change } from './saveDiff';

export interface LabelContext {
  /** Faction id → name, from FactionData.txt; used for guild memberships. */
  factionNames?: Map<number, string>;
}

export interface ChangeLabel {
  section: string;
  label: string;
  before: string;
  after: string;
}

export const SECTION_ORDER = [
  'Character', 'Career & Advantages', 'Stats & Skills', 'Inventory', 'Wagon', 'Finances',
  'Factions & Reputation', 'Quest Flags', 'Location & Time', 'Other',
];

const ITEM_FIELDS: Record<string, string> = {
  hits1: 'condition', hits2: 'max condition', hits3: 'hits3', stackCount: 'stack', value1: 'value', weightInKg: 'weight',
};

/** "AcuteHearing" → "Acute Hearing", "reputationCommoners" → "Reputation Commoners". */
export const spacedName = (name: string) =>
  name.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

export const formatValue = (value: unknown): string => {
  if (value === undefined || value === null) return '(none)';
  if (typeof value === 'boolean') return value ? 'on' : 'off';
  if (typeof value === 'string') return value === '' ? '(none)' : value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? 'entry' : 'entries'}`;
  return `${Object.keys(value as object).length} fields`;
};

const lastProperty = (change: Change) => {
  const last = change.path[change.path.length - 1];
  return typeof last === 'string' ? last : typeof last === 'number' ? `#${last}` : '';
};

export const labelChange = (change: Change, context: LabelContext = {}): ChangeLabel => {
  const path = propertyPath(change.path);
  const field = lastProperty(change);
  const values = { before: formatValue(change.before), after: formatValue(change.after) };
  const recordName = change.record?.name ?? '';

  // Whole records added or removed.
  if (change.kind !== 'changed') {
    const verb = change.kind === 'added' ? 'Added' : 'Removed';
    const section = sectionFor(change, path);
    return { section, label: `${verb}: ${recordName}`, before: '', after: '' };
  }

  if (change.file === 'faction') {
    if (path.startsWith('factionDict')) {
      return { section: 'Factions & Reputation', label: `${recordName} – ${field === 'rep' ? 'reputation' : spacedName(field)}`, ...values };
    }
    return { section: 'Factions & Reputation', label: path, ...values };
  }

  if (path === 'dateAndTime.gameTime') {
    const format = (value: unknown) => (typeof value === 'number' ? formatGameTime(value, true) : formatValue(value));
    return { section: 'Location & Time', label: 'In-game time', before: format(change.before), after: format(change.after) };
  }

  const entity = 'playerData.playerEntity.';
  const under = (prefix: string) => path.startsWith(prefix);

  if (under(`${entity}stats.`) || under(`${entity}skills.`)) {
    return { section: 'Stats & Skills', label: spacedName(field), ...values };
  }
  if (under(`${entity}careerTemplate.`)) {
    return { section: 'Career & Advantages', label: spacedName(field), ...values };
  }
  if (under(`${entity}items.`) || under(`${entity}wagonItems.`)) {
    const section = under(`${entity}items.`) ? 'Inventory' : 'Wagon';
    return { section, label: `${recordName} – ${ITEM_FIELDS[field] ?? spacedName(field)}`, ...values };
  }
  if (under(`${entity}globalVars.`)) {
    return { section: 'Quest Flags', label: recordName, ...values };
  }
  if (path === `${entity}goldPieces`) {
    return { section: 'Finances', label: 'Gold', ...values };
  }
  if (under('bankAccounts.')) {
    const region = Number(recordKey(change));
    const regionName = REGION_NAMES[region] ?? `region ${region}`;
    const what = field === 'accountGold' ? 'balance' : field === 'loanTotal' ? 'loan' : spacedName(field);
    return { section: 'Finances', label: `Bank (${regionName}) – ${what}`, ...values };
  }
  if (under('playerData.guildMemberships.')) {
    const factionId = Number(recordKey(change));
    const name = context.factionNames?.get(factionId) ?? `Faction ${factionId}`;
    return { section: 'Factions & Reputation', label: `${name} – ${field === 'rank' ? 'rank' : spacedName(field)}`, ...values };
  }
  if (under(`${entity}reputation`)) {
    return { section: 'Factions & Reputation', label: spacedName(field).replace(/^Reputation /, 'Reputation: '), ...values };
  }
  if (under('playerData.playerPosition.position.')) {
    return { section: 'Location & Time', label: `Position ${field.toUpperCase()}`, ...values };
  }
  if (under('playerData.playerPosition.buildingDiscoveryData.')) {
    return { section: 'Location & Time', label: `Building – ${spacedName(field).toLowerCase()}`, ...values };
  }
  if (under('playerData.playerPosition.')) {
    return { section: 'Location & Time', label: spacedName(field), ...values };
  }
  if (path === `${entity}equipTable`) {
    return { section: 'Inventory', label: `Equipment slot ${field.replace('#', '')}`, ...values };
  }
  if (change.path.length === 3 && under(entity)) {
    return { section: 'Character', label: spacedName(field), ...values };
  }
  return { section: 'Other', label: path + (typeof change.path[change.path.length - 1] === 'number' ? ` ${field}` : ''), ...values };
};

const recordKey = (change: Change) => {
  const keyed = change.path.find((segment) => typeof segment === 'object');
  return typeof keyed === 'object' ? keyed.value : undefined;
};

const sectionFor = (change: Change, path: string) => {
  if (change.file === 'faction') return 'Factions & Reputation';
  if (path === 'playerData.playerEntity.items') return 'Inventory';
  if (path === 'playerData.playerEntity.wagonItems') return 'Wagon';
  if (path === 'playerData.playerEntity.globalVars') return 'Quest Flags';
  if (path === 'bankAccounts') return 'Finances';
  if (path === 'playerData.guildMemberships') return 'Factions & Reputation';
  return 'Other';
};

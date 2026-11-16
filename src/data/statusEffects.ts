// Poisons, diseases and harmful spells on the player, from playerEntity.instancedEffectBundles.
// See docs/clear-status-effects-plan.md and, in the DFU source, EntityEffectManager (EffectBundleSaveData_v1,
// CureAllDiseases, CureAllPoisons), DiseaseEffect, PoisonEffect and DaggerfallStats.

/** BundleTypes, in declaration order (MagicAndEffectsEnums.cs). DFU writes the name. */
const BUNDLE_TYPES = ['None', 'Spell', 'Disease', 'Poison', 'HeldMagicItem', 'Potion'];

/** DFCareer.Stats order, which is also the order of an effect's statMods. */
export const STAT_NAMES = ['Strength', 'Intelligence', 'Willpower', 'Agility', 'Endurance', 'Personality', 'Speed', 'Luck'];

const DISEASE_NAMES: Record<string, string> = {
  WitchesPox: "Witches' Pox", Plague: 'Plague', YellowFever: 'Yellow Fever', StomachRot: 'Stomach Rot',
  Consumption: 'Consumption', BrainFever: 'Brain Fever', SwampRot: 'Swamp Rot', CalironsCurse: "Caliron's Curse",
  Cholera: 'Cholera', Leprosy: 'Leprosy', WoundRot: 'Wound Rot', RedDeath: 'Red Death', BloodRot: 'Blood Rot',
  TyphoidFever: 'Typhoid Fever', Dementia: 'Dementia', Chrondiasis: 'Chrondiasis', WizardFever: 'Wizard Fever',
};

const INFECTION_NAMES: Record<string, string> = {
  'Vampirism-Infection': 'Vampirism (infection)',
  'Werewolf-Infection': 'Werewolf lycanthropy (infection)',
  'Wereboar-Infection': 'Wereboar lycanthropy (infection)',
};

/** Full curses: racial overrides the editor can't cure yet. */
const CURSE_NAMES: Record<string, string> = {
  'Vampirism-Curse': 'Vampirism',
  'Lycanthropy-Curse': 'Lycanthropy',
};

/** Harmful effects an enemy can put on the player, by effect key. */
const HARMFUL_SPELL_NAMES: Record<string, string> = {
  Paralyze: 'Paralysis',
  Silence: 'Silence',
  'ContinuousDamage-Health': 'Continuous Damage Health',
  'ContinuousDamage-Fatigue': 'Continuous Damage Fatigue',
  'ContinuousDamage-SpellPoints': 'Continuous Damage Magicka',
  'Damage-Health': 'Damage Health',
  'Damage-Fatigue': 'Damage Fatigue',
  'Damage-SpellPoints': 'Damage Magicka',
  Disintegrate: 'Disintegrate',
  'Transfer-Health': 'Transfer Health',
  'Transfer-Fatigue': 'Transfer Fatigue',
  ...Object.fromEntries(STAT_NAMES.flatMap((stat) => [[`Drain-${stat}`, `Drain ${stat}`], [`Transfer-${stat}`, `Transfer ${stat}`]])),
};

/** Drains (and attribute transfers, which derive from DrainEffect) last until the attribute is healed. */
const isDrainKey = (key: string) => /^(Drain|Transfer)-(Strength|Intelligence|Willpower|Agility|Endurance|Personality|Speed|Luck)$/.test(key);

/** DiseaseEffect's daysOfSymptomsLeft markers. */
const DISEASE_PERMANENT = 0xff;
const DISEASE_COMPLETED = 0xfe;

const POISON_STATES = ['Waiting', 'Active', 'Complete'];

export type AfflictionKind = 'Disease' | 'Poison' | 'HarmfulSpell' | 'Curse';

export interface Affliction {
  /** Index in instancedEffectBundles. */
  index: number;
  kind: AfflictionKind;
  name: string;
  /** e.g. "showing symptoms", "active", "3 rounds left". */
  state: string;
  /** Attribute changes the bundle is causing, by stat name (negative is damage). */
  statDamage: Record<string, number>;
  /** Why the editor won't remove it, if it won't. */
  notCurable?: string;
}

export interface EffectBundle {
  bundleType?: string | number;
  name?: string;
  casterEntityType?: string | number;
  fromEquippedItemID?: number;
  liveEffects?: LiveEffect[] | null;
  [key: string]: unknown;
}

interface LiveEffect {
  key?: string;
  roundsRemaining?: number;
  statMods?: number[] | null;
  statMaxMods?: number[] | null;
  effectSpecific?: unknown;
  [key: string]: unknown;
}

export const bundleTypeName = (value: unknown): string | undefined =>
  typeof value === 'number' ? BUNDLE_TYPES[value] : typeof value === 'string' ? value : undefined;

/** Fields of an effect's own save data. FullSerializer adds "$type", and may wrap the value in "$content". */
const specific = (effect: LiveEffect): Record<string, unknown> => {
  const value = effect.effectSpecific;
  if (!value || typeof value !== 'object') return {};
  const content = (value as Record<string, unknown>).$content;
  return (content && typeof content === 'object' ? content : value) as Record<string, unknown>;
};

const effectsOf = (bundle: EffectBundle): LiveEffect[] =>
  Array.isArray(bundle.liveEffects) ? bundle.liveEffects.filter((effect) => effect && typeof effect === 'object') : [];

const statDamageOf = (bundle: EffectBundle): Record<string, number> => {
  const damage: Record<string, number> = {};
  for (const effect of effectsOf(bundle)) {
    (effect.statMods ?? []).forEach((mod, i) => {
      if (typeof mod === 'number' && mod !== 0 && STAT_NAMES[i]) damage[STAT_NAMES[i]] = (damage[STAT_NAMES[i]] ?? 0) + mod;
    });
  }
  return damage;
};

const diseaseState = (effect: LiveEffect) => {
  const data = specific(effect);
  const days = data.daysOfSymptomsLeft;
  if (days === DISEASE_COMPLETED) return 'run its course, damage remains';
  if (days === DISEASE_PERMANENT) return data.incubationOver ? 'permanent, showing symptoms' : 'permanent, incubating';
  if (data.incubationOver === false) return 'incubating';
  return typeof days === 'number' ? `showing symptoms, ${days} ${days === 1 ? 'day' : 'days'} left` : 'showing symptoms';
};

const poisonState = (effect: LiveEffect) => {
  const raw = specific(effect).currentState;
  const state = typeof raw === 'number' ? POISON_STATES[raw] : raw;
  return state === 'Waiting' ? 'not yet active' : state === 'Active' ? 'active' : state === 'Complete' ? 'finished' : 'unknown';
};

const spellState = (effects: LiveEffect[]) => {
  if (effects.some((effect) => isDrainKey(effect.key ?? ''))) return 'until healed';
  const rounds = Math.max(...effects.map((effect) => effect.roundsRemaining ?? 0));
  return rounds > 0 ? `${rounds} ${rounds === 1 ? 'round' : 'rounds'} left` : 'ending';
};

const titleCase = (key: string) => key.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

/** What a bundle is, or null if it's not something the Status Effects section shows. */
export const describeAffliction = (bundle: EffectBundle, index: number): Affliction | null => {
  if (!bundle || typeof bundle !== 'object') return null;
  const type = bundleTypeName(bundle.bundleType);
  const effects = effectsOf(bundle);
  const first = effects[0];
  const key = first?.key ?? '';
  const statDamage = statDamageOf(bundle);

  if (type === 'Disease') {
    const disease = key.startsWith('Disease-') ? key.slice('Disease-'.length) : '';
    const name = INFECTION_NAMES[key] ?? DISEASE_NAMES[disease] ?? (bundle.name || titleCase(key || 'Unknown disease'));
    return { index, kind: 'Disease', name, state: first ? diseaseState(first) : 'unknown', statDamage };
  }
  if (type === 'Poison') {
    const poison = key.startsWith('Poison-') ? key.slice('Poison-'.length) : key;
    return { index, kind: 'Poison', name: titleCase(poison || 'Unknown poison'), state: first ? poisonState(first) : 'unknown', statDamage };
  }
  if (CURSE_NAMES[key]) {
    return { index, kind: 'Curse', name: CURSE_NAMES[key], state: 'permanent', statDamage, notCurable: "The editor can't cure this yet." };
  }
  if (type === 'Spell') {
    const harmful = effects.filter((effect) => HARMFUL_SPELL_NAMES[effect.key ?? '']);
    if (harmful.length === 0) return null;
    const name = harmful.map((effect) => HARMFUL_SPELL_NAMES[effect.key!]).join(', ');
    let notCurable: string | undefined;
    if (bundle.fromEquippedItemID) notCurable = 'Comes from an equipped item, which puts it back. Unequip the item instead.';
    else if (harmful.length < effects.length) notCurable = 'This spell also has helpful effects, so it is left alone.';
    return { index, kind: 'HarmfulSpell', name, state: spellState(harmful), statDamage, notCurable };
  }
  return null;
};

export const instancedBundles = (playerEntity: unknown): EffectBundle[] => {
  const bundles = (playerEntity as { instancedEffectBundles?: unknown } | null | undefined)?.instancedEffectBundles;
  return Array.isArray(bundles) ? bundles : [];
};

export const findAfflictions = (playerEntity: unknown): Affliction[] =>
  instancedBundles(playerEntity).flatMap((bundle, index) => describeAffliction(bundle, index) ?? []);

/** Bundles the section doesn't show (helpful spells, potions, item effects), for a count. */
export const otherEffectCount = (playerEntity: unknown) =>
  instancedBundles(playerEntity).filter((bundle, index) => !describeAffliction(bundle, index)).length;

/**
 * Ids ("$id") inside value that a "$ref" elsewhere in root points to. FullSerializer writes a shared
 * object once with an $id; removing it would leave the $ref dangling and DFU would refuse the save.
 */
export const referencedIdsWithin = (root: unknown, value: unknown): string[] => {
  const ids = new Set<string>();
  const collectIds = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (!Array.isArray(node) && typeof (node as Record<string, unknown>).$id === 'string') ids.add((node as Record<string, string>).$id);
    for (const child of Object.values(node)) collectIds(child);
  };
  collectIds(value);
  if (ids.size === 0) return [];

  const referenced = new Set<string>();
  const collectRefs = (node: unknown) => {
    if (!node || typeof node !== 'object' || node === value) return;
    const ref = (node as Record<string, unknown>).$ref;
    if (typeof ref === 'string' && ids.has(ref)) referenced.add(ref);
    for (const child of Object.values(node)) collectRefs(child);
  };
  collectRefs(root);
  return [...referenced];
};

/** DaggerfallStats.GetLiveStatValue: permanent value plus effect mods, clamped to 0..100 plus max mods. */
export const liveStats = (playerEntity: { stats?: Record<string, number> } | null | undefined, bundles: EffectBundle[]) => {
  const mods = new Array(STAT_NAMES.length).fill(0);
  const maxMods = new Array(STAT_NAMES.length).fill(0);
  for (const bundle of bundles) {
    for (const effect of effectsOf(bundle)) {
      (effect.statMods ?? []).forEach((mod, i) => { if (typeof mod === 'number' && i < mods.length) mods[i] += mod; });
      (effect.statMaxMods ?? []).forEach((mod, i) => { if (typeof mod === 'number' && i < maxMods.length) maxMods[i] += mod; });
    }
  }
  return Object.fromEntries(STAT_NAMES.map((stat, i) => {
    const permanent = playerEntity?.stats?.[stat] ?? 0;
    return [stat, Math.max(0, Math.min(100 + maxMods[i], permanent + mods[i]))];
  })) as Record<string, number>;
};

/** Maximum health, magicka and fatigue as DFU computes them (DaggerfallEntity, FormulaHelper.SpellPoints). */
export const maxVitals = (playerEntity: Record<string, any> | null | undefined) => {
  const stats = liveStats(playerEntity, instancedBundles(playerEntity));
  const multiplier = Number(playerEntity?.careerTemplate?.SpellPointMultiplierValue);
  return {
    health: typeof playerEntity?.maxHealth === 'number' ? playerEntity.maxHealth : 0,
    magicka: Math.max(0, Math.floor(stats.Intelligence * (Number.isFinite(multiplier) ? multiplier : 0))),
    fatigue: (stats.Strength + stats.Endurance) * 64,
  };
};

// Enum names as DFU's C# code declares them. DFU saves enums with FullSerializer, which writes
// the member name and, when loading, requires an exact, case-sensitive match. [Flags] values are
// joined with a bare "," ("Iron,Steel"); "Iron, Steel" fails with "Cannot find enum name  Steel",
// and DFU refuses to load the whole save (SaveLoadManager uses AssertSuccessWithoutWarnings).
// A value of 0 on a flags enum with no zero member is written as "".

/** DaggerfallWorkshop.Game.Weather.WeatherType (Assets/Scripts/Game/Weather/Weather.cs). */
export const WEATHER_TYPES = [
  { value: 0, name: 'Sunny' },
  { value: 1, name: 'Cloudy' },
  { value: 2, name: 'Overcast' },
  { value: 3, name: 'Fog' },
  { value: 4, name: 'Rain' },
  { value: 5, name: 'Thunder' },
  { value: 6, name: 'Snow' },
];
/** Aliases DFU declares for the same values (None = Sunny, Rain_Normal = Rain, Snow_Normal = Snow). */
const WEATHER_ALIASES: Record<string, string> = { None: 'Sunny', Rain_Normal: 'Rain', Snow_Normal: 'Snow' };

/** DaggerfallWorkshop.WorldContext (Assets/Scripts/DaggerfallUnityEnums.cs). */
export const WORLD_CONTEXTS = [
  { value: 0, name: 'Nothing' },
  { value: 1, name: 'Exterior' },
  { value: 2, name: 'Interior' },
  { value: 3, name: 'Dungeon' },
];

/** DFLocation.BuildingTypes (Assets/Scripts/API/DFLocation.cs), excluding the search masks (AnyShop, AnyHouse, AllValid). */
export const BUILDING_TYPES = [
  { value: -1, name: 'None' },
  { value: 0, name: 'Alchemist' },
  { value: 1, name: 'HouseForSale' },
  { value: 2, name: 'Armorer' },
  { value: 3, name: 'Bank' },
  { value: 4, name: 'Town4' },
  { value: 5, name: 'Bookseller' },
  { value: 6, name: 'ClothingStore' },
  { value: 7, name: 'FurnitureStore' },
  { value: 8, name: 'GemStore' },
  { value: 9, name: 'GeneralStore' },
  { value: 10, name: 'Library' },
  { value: 11, name: 'GuildHall' },
  { value: 12, name: 'PawnShop' },
  { value: 13, name: 'WeaponSmith' },
  { value: 14, name: 'Temple' },
  { value: 15, name: 'Tavern' },
  { value: 16, name: 'Palace' },
  { value: 17, name: 'House1' },
  { value: 18, name: 'House2' },
  { value: 19, name: 'House3' },
  { value: 20, name: 'House4' },
  { value: 21, name: 'House5' },
  { value: 22, name: 'House6' },
  { value: 23, name: 'Town23' },
  { value: 24, name: 'Ship' },
  { value: 0x74, name: 'Special1' },
  { value: 0xdf, name: 'Special2' },
  { value: 0xf9, name: 'Special3' },
  { value: 0xfa, name: 'Special4' },
];

/** [Flags] fields of DFCareer (Assets/Scripts/API/DFCareer.cs), in declaration order. */
export const CAREER_FLAG_FIELDS: Record<string, string[]> = {
  ForbiddenMaterials: ['Iron', 'Steel', 'Silver', 'Elven', 'Dwarven', 'Mithril', 'Adamantium', 'Ebony', 'Orcish', 'Daedric'],
  ForbiddenShields: ['Buckler', 'RoundShield', 'KiteShield', 'TowerShield'],
  ForbiddenArmors: ['Leather', 'Chain', 'Plate'],
  ForbiddenProficiencies: ['ShortBlades', 'LongBlades', 'HandToHand', 'Axes', 'BluntWeapons', 'MissileWeapons'],
  ExpertProficiencies: ['ShortBlades', 'LongBlades', 'HandToHand', 'Axes', 'BluntWeapons', 'MissileWeapons'],
};

/** Flag names from a stored value. Tolerates the ", " spacing older editor versions wrote. */
export const parseFlags = (value: unknown): string[] =>
  typeof value === 'string' ? value.split(',').map((part) => part.trim()).filter(Boolean) : [];

/** Flags in the form DFU reads: declaration order, joined with a bare comma, "" when none are set. */
export const formatFlags = (flags: string[], order: string[]): string =>
  order.filter((name) => flags.includes(name)).join(',');

/** Name for a stored enum value that may be a name, an alias or a number. */
const toName = (value: unknown, members: { value: number; name: string }[], aliases: Record<string, string> = {}) => {
  if (typeof value === 'number') return members.find((m) => m.value === value)?.name;
  if (typeof value === 'string') return aliases[value] ?? members.find((m) => m.name === value)?.name;
  return undefined;
};

export const weatherName = (value: unknown) => toName(value, WEATHER_TYPES, WEATHER_ALIASES);
export const worldContextName = (value: unknown) => toName(value, WORLD_CONTEXTS);
export const buildingTypeName = (value: unknown) => toName(value, BUILDING_TYPES);

export interface EnumRepair {
  path: string;
  before: string;
  after: string;
}

/**
 * Finds enum values DFU can't read and returns the corrected values. Only unreadable forms are
 * repaired: career flags written with ", " by editor versions up to 1.0.7. Numbers are left alone,
 * since DFU reads those.
 */
export const findEnumRepairs = (saveData: any): EnumRepair[] => {
  const career = saveData?.playerData?.playerEntity?.careerTemplate;
  if (!career) return [];
  const repairs: EnumRepair[] = [];
  for (const [field, order] of Object.entries(CAREER_FLAG_FIELDS)) {
    const value = career[field];
    if (typeof value !== 'string') continue;
    const fixed = formatFlags(parseFlags(value), order);
    // Unknown names are kept as they were rather than silently dropped.
    const unknown = parseFlags(value).filter((name) => !order.includes(name));
    if (fixed !== value && unknown.length === 0) {
      repairs.push({ path: `playerData.playerEntity.careerTemplate.${field}`, before: value, after: fixed });
    }
  }
  return repairs;
};

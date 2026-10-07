// Guild memberships in the save are keyed by DFU's FactionFile.GuildGroups value (e.g. MagesGuild = 10),
// not by faction id. These helpers turn a membership into its faction id and display name.

export const FACTION_NAMES: Record<number, string> = {
  26: 'Temple of Akatosh',
  27: 'Order of Arkay',
  28: 'House of Dibella',
  29: 'School of Julianos',
  30: 'Temple of Kynareth',
  31: 'Benevolence of Mara',
  32: 'Temple of Stendarr',
  33: 'Resolution of Zenithar',
  40: 'Mages Guild',
  41: 'Fighters Guild',
  70: 'Dark Brotherhood',
  84: 'Thieves Guild',
  103: 'Thieves Guild (Alternate)',
  85: 'Knights of the Dragon',
  86: 'Host of the Horn',
  87: 'Knights of the Rose',
  88: 'Knights of the Wheel',
  89: 'Order of the Raven',
  90: 'Knights of the Scarab',
  91: 'Order of the Candle',
  92: 'Knights of the Hawk',
};

export const resolveFactionId = (guildGroup: number, variant: number): number => {
  if (guildGroup === 9) return variant; // KnightlyOrder
  if (guildGroup === 17) return variant; // HolyOrder

  // Basic GuildGroups -> FactionID mapping based on Daggerfall Unity source
  switch (guildGroup) {
    case 3: return 108; // Dark Brotherhood
    case 4: return 42; // Thieves Guild
    case 10: return 40; // Mages Guild
    case 11: return 41; // Fighters Guild
  }

  return variant || guildGroup;
};

/** Name for a guild membership, preferring names from FactionData.txt. */
export const guildName = (guildGroup: number, variant: number, factionNames?: Map<number, string> | Record<number, string>) => {
  const factionId = resolveFactionId(guildGroup, variant);
  const fromFile = factionNames instanceof Map ? factionNames.get(factionId) : factionNames?.[factionId];
  return fromFile || FACTION_NAMES[factionId] || `Unknown Faction (Group: ${guildGroup}, ID: ${factionId})`;
};

export interface Membership {
  Key: number;
  Value: { rank?: number; variant?: number; [key: string]: any };
}

/**
 * Memberships as a list. DFU's guildMemberships and vampireMemberships are Dictionary<int, …>.
 * FullSerializer writes them as an array of { Key, Value }, but an empty dictionary as {} (no keys,
 * so it counts as a string-keyed object). Accepts both, and an object map with entries, just in case.
 */
export const membershipList = (value: unknown): Membership[] => {
  if (Array.isArray(value)) return value.filter((entry) => entry && typeof entry === 'object');
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, any>).map(([key, entry]) => ({ Key: Number(key), Value: entry ?? {} }));
  }
  return [];
};

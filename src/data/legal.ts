// Crime and legal standing, as stored in playerEntity.regionData and playerEntity.crimeCommitted.
// See PlayerEntity.RegionDataRecord, PlayerEntity.Crimes and MacroHelper.LegalReputation in the DFU source.

/** PlayerEntity.Crimes. DFU writes the member name (e.g. "None", "Breaking_And_Entering"). */
export const CRIMES = [
  { value: 0, name: 'None' },
  { value: 1, name: 'Attempted_Breaking_And_Entering' },
  { value: 2, name: 'Trespassing' },
  { value: 3, name: 'Breaking_And_Entering' },
  { value: 4, name: 'Assault' },
  { value: 5, name: 'Murder' },
  { value: 6, name: 'Tax_Evasion' },
  { value: 7, name: 'Criminal_Conspiracy' },
  { value: 8, name: 'Vagrancy' },
  { value: 9, name: 'Smuggling' },
  { value: 10, name: 'Piracy' },
  { value: 11, name: 'High_Treason' },
  { value: 12, name: 'Pickpocketing' },
  { value: 13, name: 'Theft' },
  { value: 14, name: 'Treason' },
  { value: 15, name: 'LoanDefault' },
];

/** Crime name for a stored value, which may be a name or a number. */
export const crimeName = (value: unknown): string | undefined => {
  if (typeof value === 'number') return CRIMES.find((crime) => crime.value === value)?.name;
  if (typeof value === 'string') return CRIMES.find((crime) => crime.name === value)?.name;
  return undefined;
};

export const crimeLabel = (name: string) => name.replace(/_/g, ' ');

/** DFU clamps LegalRep to this range on load (PlayerEntity.ClampLegalReputations). */
export const LEGAL_REP_MIN = -100;
export const LEGAL_REP_MAX = 100;

/** SeverePunishmentFlags bits, set by the court (DaggerfallCourtWindow). */
export const BANISHED = 1;
export const SENTENCED_TO_EXECUTION = 2;

/** "banished", "sentenced to death", both, or "none". */
export const punishmentLabel = (flags: number): string => {
  const parts = [];
  if (flags & BANISHED) parts.push('banished');
  if (flags & SENTENCED_TO_EXECUTION) parts.push('sentenced to death');
  return parts.length > 0 ? parts.join(', ') : 'none';
};

/** "In the eyes of the law you are…" text for a legal reputation (MacroHelper.LegalReputation, %ltn). */
export const legalStanding = (rep: number): string => {
  if (rep > 80) return 'Revered';
  if (rep > 60) return 'Esteemed';
  if (rep > 40) return 'Honored';
  if (rep > 20) return 'Admired';
  if (rep > 10) return 'Respected';
  if (rep > 0) return 'Dependable';
  if (rep === 0) return 'A common citizen';
  if (rep < -80) return 'Hated';
  if (rep < -60) return 'Pond scum';
  if (rep < -40) return 'A villain';
  if (rep < -20) return 'A criminal';
  if (rep < -10) return 'A scoundrel';
  return 'Undependable';
};

export interface RegionLegalRecord {
  LegalRep?: number;
  SeverePunishmentFlags?: number;
  [key: string]: unknown;
}

/** True if the region holds anything against the player: negative reputation, banishment or a death sentence. */
export const hasLegalTrouble = (region: RegionLegalRecord | null | undefined) =>
  !!region && ((region.LegalRep ?? 0) < 0 || (region.SeverePunishmentFlags ?? 0) !== 0);

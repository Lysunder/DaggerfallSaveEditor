import { describe, expect, it } from 'vitest';
import { crimeName, hasLegalTrouble, legalStanding, punishmentLabel } from './legal';

describe('legal helpers', () => {
  it('reads crimes stored by name or number', () => {
    expect(crimeName('Breaking_And_Entering')).toBe('Breaking_And_Entering');
    expect(crimeName(13)).toBe('Theft');
    expect(crimeName('theft')).toBeUndefined();
  });

  it('matches DFU legal standing thresholds', () => {
    expect(legalStanding(0)).toBe('A common citizen');
    expect(legalStanding(-10)).toBe('Undependable');
    expect(legalStanding(-11)).toBe('A scoundrel');
    expect(legalStanding(-81)).toBe('Hated');
    expect(legalStanding(81)).toBe('Revered');
  });

  it('describes punishments and trouble', () => {
    expect(punishmentLabel(0)).toBe('none');
    expect(punishmentLabel(3)).toBe('banished, sentenced to death');
    expect(hasLegalTrouble({ LegalRep: 5, SeverePunishmentFlags: 0 })).toBe(false);
    expect(hasLegalTrouble({ LegalRep: 5, SeverePunishmentFlags: 1 })).toBe(true);
    expect(hasLegalTrouble({ LegalRep: -1 })).toBe(true);
  });
});

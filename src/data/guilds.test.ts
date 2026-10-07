import { describe, expect, it } from 'vitest';
import { guildName, membershipList, resolveFactionId } from './guilds';

describe('guild memberships', () => {
  it('maps DFU guild groups to faction ids', () => {
    expect(resolveFactionId(10, 0)).toBe(40); // MagesGuild
    expect(resolveFactionId(11, 0)).toBe(41); // FightersGuild
    expect(resolveFactionId(9, 87)).toBe(87); // KnightlyOrder uses the variant
    expect(resolveFactionId(17, 29)).toBe(29); // HolyOrder uses the variant
  });

  it('names a membership, preferring FactionData.txt names', () => {
    expect(guildName(10, 0)).toBe('Mages Guild');
    expect(guildName(9, 87)).toBe('Knights of the Rose');
    expect(guildName(10, 0, new Map([[40, 'Guild of Mages']]))).toBe('Guild of Mages');
    expect(guildName(10, 0, { 40: 'Guild of Mages' })).toBe('Guild of Mages');
  });
});

describe('membershipList', () => {
  it('reads the array DFU writes for memberships', () => {
    expect(membershipList([{ Key: 10, Value: { rank: 2 } }])).toEqual([{ Key: 10, Value: { rank: 2 } }]);
  });

  it('treats the {} DFU writes for no memberships as empty', () => {
    expect(membershipList({})).toEqual([]);
    expect(membershipList(null)).toEqual([]);
    expect(membershipList(undefined)).toEqual([]);
  });

  it('accepts an object keyed by guild group', () => {
    expect(membershipList({ 10: { rank: 3 } })).toEqual([{ Key: 10, Value: { rank: 3 } }]);
  });
});

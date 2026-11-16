import { describe, expect, it } from 'vitest';
import {
  bundleTypeName, describeAffliction, findAfflictions, liveStats, maxVitals, otherEffectCount, referencedIdsWithin,
} from './statusEffects';
import { makeEffectBundles } from '../utils/testFixtures';

const entity = (bundles = makeEffectBundles()) => ({
  maxHealth: 80,
  stats: { Strength: 50, Intelligence: 60, Willpower: 40, Agility: 50, Endurance: 40, Personality: 40, Speed: 50, Luck: 50 },
  careerTemplate: { SpellPointMultiplierValue: 1.5 },
  instancedEffectBundles: bundles,
});

describe('status effects', () => {
  it('reads bundle types by name or number', () => {
    expect(bundleTypeName('Disease')).toBe('Disease');
    expect(bundleTypeName(3)).toBe('Poison');
    expect(bundleTypeName(undefined)).toBeUndefined();
  });

  it('describes diseases, poisons, harmful spells and curses, and skips the rest', () => {
    const list = findAfflictions(entity());
    expect(list.map((a) => [a.kind, a.name, a.state])).toEqual([
      ['Disease', "Witches' Pox", 'run its course, damage remains'],
      ['Disease', 'Vampirism (infection)', 'incubating'],
      ['Poison', 'Nux Vomica', 'active'],
      ['HarmfulSpell', 'Drain Strength', 'until healed'],
      ['HarmfulSpell', 'Paralysis', '3 rounds left'],
      ['HarmfulSpell', 'Silence', 'ending'],
      ['Curse', 'Vampirism', 'permanent'],
    ]);
    expect(list[0].statDamage).toEqual({ Strength: -6, Endurance: -3 });
    expect(list[5].notCurable).toMatch(/equipped item/);
    expect(list[6].notCurable).toBeDefined();
    expect(otherEffectCount(entity())).toBe(2); // the Shield spell and the potion
  });

  it('leaves spells that mix helpful and harmful effects alone', () => {
    const mixed = { bundleType: 'Spell', liveEffects: [{ key: 'Paralyze', roundsRemaining: 2 }, { key: 'Heal-Health' }] };
    expect(describeAffliction(mixed, 0)?.notCurable).toMatch(/helpful/);
  });

  it('finds $id values that a $ref elsewhere points to', () => {
    const shared = { $id: '7', value: 1 };
    const root = { a: [shared], b: { $ref: '7' } };
    expect(referencedIdsWithin(root, shared)).toEqual(['7']);
    expect(referencedIdsWithin({ a: [shared] }, shared)).toEqual([]);
  });

  it('computes live attributes and maximum vitals like DFU', () => {
    const player = entity();
    // Strength: 50, Witches' Pox −6, Drain −10, Fortify potion +5. Endurance: 40, Pox −3, Nux Vomica −1.
    expect(liveStats(player, player.instancedEffectBundles)).toMatchObject({ Strength: 39, Endurance: 36 });
    expect(maxVitals(player)).toEqual({ health: 80, magicka: 90, fatigue: (39 + 36) * 64 });
    expect(maxVitals(entity([]))).toEqual({ health: 80, magicka: 90, fatigue: (50 + 40) * 64 });
  });
});

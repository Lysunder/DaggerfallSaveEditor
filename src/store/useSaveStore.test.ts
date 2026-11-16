import { beforeEach, describe, expect, it } from 'vitest';
import { useSaveStore } from './useSaveStore';
import { diffAll } from '../utils/saveDiff';
import { makeEffectBundles, makeSave } from '../utils/testFixtures';
import { labelChange } from '../utils/changeLabels';

const store = () => useSaveStore.getState();
const load = (filePath: string) =>
  store().loadSaveData({ filePath, data: makeSave(), factionData: null, questData: null, notebookData: null, saveInfo: null });
const unsaved = () => {
  const { baselineSaveData, saveData, baselineFactionData, factionData } = store();
  return diffAll(baselineSaveData, saveData, baselineFactionData, factionData);
};

beforeEach(() => store().reset());

describe('markSaved', () => {
  it('only marks the written snapshot as saved, not edits made while writing', () => {
    load('A/SaveData.txt');
    store().updateStat('Strength', 70);
    const written = store().saveData!;

    store().updateStat('Agility', 99); // made while the write is in flight
    store().markSaved('A/SaveData.txt', written, null);

    expect(unsaved().map((change) => change.path.at(-1))).toEqual(['Agility']);
  });

  it('is ignored when another save was loaded during the write', () => {
    load('A/SaveData.txt');
    store().updateStat('Strength', 70);
    const written = store().saveData!;

    load('B/SaveData.txt');
    store().updateStat('Luck', 1);
    store().markSaved('A/SaveData.txt', written, null);

    expect(unsaved().map((change) => change.path.at(-1))).toEqual(['Luck']);
  });
});

describe('legal standing', () => {
  it('clears crimes, negative reputations and punishments only', () => {
    load('A/SaveData.txt');
    store().clearLegalTrouble();
    const entity = store().saveData!.playerData.playerEntity;
    expect(entity.regionData).toEqual([
      { LegalRep: 15, SeverePunishmentFlags: 0, Flags: [false], PrecipitationOverride: 0 },
      { LegalRep: 0, SeverePunishmentFlags: 0, Flags: [false], PrecipitationOverride: 0 },
    ]);
    expect(entity.crimeCommitted).toBe('None');
    expect(entity.haveShownSurrenderToGuardsDialogue).toBe(false);
    // Region 0 was fine, so it isn't reported as changed.
    expect(unsaved().map((change) => change.id).sort()).toEqual([
      'save:playerData.playerEntity.crimeCommitted',
      'save:playerData.playerEntity.haveShownSurrenderToGuardsDialogue',
      'save:playerData.playerEntity.regionData[1].LegalRep',
      'save:playerData.playerEntity.regionData[1].SeverePunishmentFlags',
    ]);
  });

  it('clamps legal reputation to the range DFU allows', () => {
    load('A/SaveData.txt');
    store().updateRegionLegal(0, { LegalRep: 500 });
    store().updateRegionLegal(1, { LegalRep: -250.7 });
    const regions = store().saveData!.playerData.playerEntity.regionData!;
    expect(regions[0].LegalRep).toBe(100);
    expect(regions[1].LegalRep).toBe(-100);
  });
});

describe('guild memberships', () => {
  it('ignores a rank change when the save has no memberships ({})', () => {
    store().loadSaveData({
      filePath: 'A/SaveData.txt',
      data: { ...makeSave(), playerData: { ...makeSave().playerData, guildMemberships: {} } },
      factionData: null, questData: null, notebookData: null, saveInfo: null,
    });
    expect(() => store().updateGuildRank(10, 3)).not.toThrow();
    expect(unsaved()).toEqual([]);
  });
});

describe('status effects', () => {
  const loadWithEffects = () => {
    const data = makeSave();
    Object.assign(data.playerData.playerEntity, {
      instancedEffectBundles: makeEffectBundles(),
      maxHealth: 80, currentHealth: 20, currentMagicka: 0, currentFatigue: 100,
      careerTemplate: { ...data.playerData.playerEntity.careerTemplate, SpellPointMultiplierValue: 2 },
      stats: { Strength: 50, Intelligence: 40, Endurance: 40 },
    });
    store().loadSaveData({ filePath: 'A/SaveData.txt', data, factionData: null, questData: null, notebookData: null, saveInfo: null });
  };
  const keys = () => store().saveData!.playerData.playerEntity.instancedEffectBundles!.map((b) => b.liveEffects?.[0]?.key);

  it('cures one affliction and leaves everything else untouched', () => {
    loadWithEffects();
    const before = store().saveData!.playerData.playerEntity.instancedEffectBundles!;
    expect(store().cureAfflictions([2])).toEqual({ cured: ['Nux Vomica'], skipped: [] });
    const after = store().saveData!.playerData.playerEntity.instancedEffectBundles!;
    expect(after).toHaveLength(before.length - 1);
    expect(after[2]).toBe(before[3]); // remaining bundles are the same objects
  });

  it('cures all of a kind but skips item spells and curses', () => {
    loadWithEffects();
    expect(store().cureAllOfKind('Disease').cured).toEqual(["Witches' Pox", 'Vampirism (infection)']);
    const spells = store().cureAllOfKind('HarmfulSpell');
    expect(spells.cured).toEqual(['Drain Strength', 'Paralysis']);
    expect(store().cureAfflictions([keys().indexOf('Vampirism-Curse')]).skipped).toHaveLength(1);
    expect(keys()).toEqual(['Poison-Nux_Vomica', 'Silence', 'Vampirism-Curse', 'Shield', 'Fortify-Strength']);
  });

  it('labels a cure in the change list and reverts it', () => {
    loadWithEffects();
    store().cureAfflictions([0, 4]);
    const changes = unsaved();
    expect(changes).toHaveLength(1);
    expect(labelChange(changes[0]).label).toBe("Cured: Witches' Pox, Paralysis");
    store().revertChange(changes[0]);
    expect(unsaved()).toEqual([]);
  });

  it('restores each vital to its maximum, separately', () => {
    loadWithEffects();
    store().restoreVital('health');
    let entity = store().saveData!.playerData.playerEntity;
    expect([entity.currentHealth, entity.currentMagicka, entity.currentFatigue]).toEqual([80, 0, 100]);
    store().restoreVital('magicka');
    store().restoreVital('fatigue');
    entity = store().saveData!.playerData.playerEntity;
    // Live INT 40 → 80 magicka. Live STR 50−6−10+5 = 39, END 40−3−1 = 36 → (39+36)×64.
    expect([entity.currentMagicka, entity.currentFatigue]).toEqual([80, 75 * 64]);
  });
});

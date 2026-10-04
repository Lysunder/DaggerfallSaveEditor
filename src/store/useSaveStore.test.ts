import { beforeEach, describe, expect, it } from 'vitest';
import { useSaveStore } from './useSaveStore';
import { diffAll } from '../utils/saveDiff';
import { makeSave } from '../utils/testFixtures';

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

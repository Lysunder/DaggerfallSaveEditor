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

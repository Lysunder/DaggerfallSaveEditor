import { produce } from 'immer';
import { describe, expect, it } from 'vitest';
import { diffAll, diffFaction, diffSave } from './saveDiff';
import { makeFactions, makeSave } from './testFixtures';

describe('diffSave', () => {
  it('reports nothing for identical input, and for an edit that assigns the same value', () => {
    const save = makeSave();
    expect(diffSave(save, save)).toEqual([]);
    expect(diffSave(save, produce(save, (d) => { d.playerData.playerEntity.level = 5; }))).toEqual([]);
  });

  it('reports a single field change with a structured path', () => {
    const save = makeSave();
    const next = produce(save, (d) => { d.playerData.playerEntity.stats.Strength = 70; });
    expect(diffSave(save, next)).toEqual([
      expect.objectContaining({
        path: ['playerData', 'playerEntity', 'stats', 'Strength'], kind: 'changed', before: 55, after: 70,
        id: 'save:playerData.playerEntity.stats.Strength',
      }),
    ]);
  });

  it('reports nothing once an edit is undone, or when an item is rebuilt with the same values', () => {
    const save = makeSave();
    const edited = produce(save, (d) => { d.playerData.playerEntity.stats.Strength = 70; });
    const undone = produce(edited, (d) => { d.playerData.playerEntity.stats.Strength = 55; });
    expect(diffSave(save, undone)).toEqual([]);

    // Like the store's updateItem, which spreads a new object even when nothing differs.
    const respread = produce(save, (d) => {
      d.playerData.playerEntity.items[1] = { ...d.playerData.playerEntity.items[1] };
    });
    expect(diffSave(save, respread)).toEqual([]);
  });

  it('matches items by uid, so deleting one reports one removal with its equipment slot', () => {
    const save = makeSave();
    const next = produce(save, (d) => {
      const entity = d.playerData.playerEntity;
      entity.items.splice(1, 1);
      entity.equipTable = entity.equipTable.map((uid) => (uid === 2 ? 0 : uid));
    });
    const changes = diffSave(save, next);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      kind: 'removed',
      path: ['playerData', 'playerEntity', 'items', { key: 'uid', value: 2 }],
      record: { name: 'Silver Longsword' },
      equipSlots: [1],
    });
  });

  it('attributes field changes to their record', () => {
    const save = makeSave();
    const next = produce(save, (d) => { d.playerData.playerEntity.items[2].stackCount = 99; });
    expect(diffSave(save, next)[0]).toMatchObject({
      path: ['playerData', 'playerEntity', 'items', { key: 'uid', value: 3 }, 'stackCount'],
      record: { name: 'Arrow' },
    });
  });

  it('reports added records and new properties', () => {
    const save = makeSave();
    const next = produce(save, (d) => {
      d.playerData.playerEntity.items.push({ uid: 9, shortName: 'Ruby', hits1: 1, hits2: 1, stackCount: 1 });
      (d.playerData.playerPosition as any).buildingDiscoveryData = { quality: 3 };
    });
    const changes = diffSave(save, next);
    expect(changes.map((c) => c.kind).sort()).toEqual(['added', 'changed']);
    expect(changes.find((c) => c.kind === 'changed')).toMatchObject({ before: undefined, after: { quality: 3 } });
  });

  it('reports type changes', () => {
    const save = makeSave();
    const next = produce(save, (d) => { (d.playerData.playerPosition as any).weather = 4; });
    expect(diffSave(save, next)).toEqual([expect.objectContaining({ before: 'Overcast', after: 4 })]);
  });
});

describe('diffFaction', () => {
  it('finds one reputation change in a large faction list', () => {
    const factions = makeFactions(5000);
    const next = produce(factions, (d) => { d.factionDict[4321].Value.rep = 25; });
    const started = performance.now();
    const changes = diffFaction(factions, next);
    expect(performance.now() - started).toBeLessThan(50);
    expect(changes).toEqual([
      expect.objectContaining({ file: 'faction', path: ['factionDict', { key: 'Key', value: 4321 }, 'Value', 'rep'], before: 0, after: 25 }),
    ]);
  });
});

describe('diffAll', () => {
  it('returns the same array for the same inputs', () => {
    const save = makeSave();
    const next = produce(save, (d) => { d.playerData.playerEntity.level = 6; });
    const first = diffAll(save, next, null, null);
    expect(diffAll(save, next, null, null)).toBe(first);
    expect(first).toHaveLength(1);
  });
});

describe('duplicate keys', () => {
  it('compares by position instead of collapsing duplicate uids', () => {
    const make = (a: number, b: number) => ({
      playerData: { playerEntity: { items: [{ uid: 1, hits1: a }, { uid: 1, hits1: b }] } },
    });
    const changes = diffSave(make(1, 2), make(1, 3));
    expect(changes).toHaveLength(1);
    expect(changes[0].after).toBe(3);
  });
});

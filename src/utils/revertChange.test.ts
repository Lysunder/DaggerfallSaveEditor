import { produce } from 'immer';
import { describe, expect, it } from 'vitest';
import { diffSave, type Change } from './saveDiff';
import { revertChange } from './revertChange';
import { makeSave, type TestSave as Save } from './testFixtures';

const revertAll = (baseline: Save, current: Save, changes: Change[]) =>
  produce(current, (draft) => {
    for (const change of changes) revertChange(draft, baseline, change);
  });

const itemUids = (save: Save) => save.playerData.playerEntity.items.map((item) => item.uid);

describe('revertChange', () => {
  it('reverts a changed value and a new property', () => {
    const base = makeSave();
    const edited = produce(base, (d) => {
      d.playerData.playerEntity.stats.Strength = 70;
      (d.playerData.playerPosition as any).buildingDiscoveryData = { quality: 3 };
    });
    const reverted = revertAll(base, edited, diffSave(base, edited));
    expect(diffSave(base, reverted)).toEqual([]);
    expect('buildingDiscoveryData' in reverted.playerData.playerPosition).toBe(false);
  });

  it('removes an added record', () => {
    const base = makeSave();
    const edited = produce(base, (d) => {
      d.playerData.playerEntity.items.push({ uid: 9, shortName: 'Ruby', hits1: 1, hits2: 1, stackCount: 1 });
    });
    expect(itemUids(revertAll(base, edited, diffSave(base, edited)))).toEqual([1, 2, 3]);
  });

  it('puts a deleted item back in its place and restores its equipment slot', () => {
    const base = makeSave();
    const edited = produce(base, (d) => {
      const entity = d.playerData.playerEntity;
      entity.items.splice(1, 1);
      entity.equipTable = entity.equipTable.map((uid) => (uid === 2 ? 0 : uid));
    });
    const reverted = revertAll(base, edited, diffSave(base, edited));
    expect(itemUids(reverted)).toEqual([1, 2, 3]);
    expect(reverted.playerData.playerEntity.equipTable).toEqual([0, 2, 0, 1]);
    expect(diffSave(base, reverted)).toEqual([]);
  });

  it('inserts at the start when no earlier neighbour survives', () => {
    const base = makeSave();
    const edited = produce(base, (d) => { d.playerData.playerEntity.items.splice(0, 2); });
    const removeFirst = diffSave(base, edited).find((c) => c.record?.name === 'Dagger')!;
    const reverted = produce(edited, (draft) => { revertChange(draft, base, removeFirst); });
    expect(itemUids(reverted)).toEqual([1, 3]);
  });

  it('leaves an equipment slot that another item now uses', () => {
    const base = makeSave();
    const edited = produce(base, (d) => {
      const entity = d.playerData.playerEntity;
      entity.items.splice(1, 1);
      entity.equipTable = entity.equipTable.map((uid) => (uid === 2 ? 0 : uid));
    });
    const [removal] = diffSave(base, edited);
    const reused = produce(edited, (d) => { d.playerData.playerEntity.equipTable[1] = 3; });
    let occupied: number[] = [];
    const reverted = produce(reused, (draft) => { occupied = revertChange(draft, base, removal).occupiedSlots; });
    expect(occupied).toEqual([1]);
    expect(reverted.playerData.playerEntity.equipTable[1]).toBe(3);
    expect(itemUids(reverted)).toEqual([1, 2, 3]);
  });

  it('gives the same result whatever order changes are reverted in', () => {
    const base = makeSave();
    const edited = produce(base, (d) => {
      const entity = d.playerData.playerEntity;
      entity.items.splice(0, 2);
      entity.equipTable = entity.equipTable.map((uid) => (uid === 1 || uid === 2 ? 0 : uid));
      entity.items[0].stackCount = 5;
      entity.level = 9;
    });
    const changes = diffSave(base, edited);
    const forward = revertAll(base, edited, changes);
    const backward = revertAll(base, edited, [...changes].reverse());
    expect(forward).toEqual(backward);
    expect(itemUids(forward)).toEqual([1, 2, 3]);
    expect(diffSave(base, forward)).toEqual([]);
  });
});

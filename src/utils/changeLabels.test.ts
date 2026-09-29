import { produce } from 'immer';
import { describe, expect, it } from 'vitest';
import { labelChange } from './changeLabels';
import { diffFaction, diffSave } from './saveDiff';
import { makeFactions, makeSave, type TestSave as Save } from './testFixtures';

const labelOf = (edit: (draft: Save) => void) => {
  const base = makeSave();
  const [change] = diffSave(base, produce(base, edit));
  // Faction 10 is a decoy: memberships are keyed by guild group, which must not be used as a faction id.
  return labelChange(change, { factionNames: new Map([[40, 'Mages Guild'], [10, 'Wrong Faction']]) });
};

describe('labelChange', () => {
  it('labels each section', () => {
    expect(labelOf((d) => { d.playerData.playerEntity.stats.Strength = 70; }))
      .toEqual({ section: 'Stats & Skills', label: 'Strength', before: '55', after: '70' });
    expect(labelOf((d) => { d.playerData.playerEntity.skills.LongBlade = 50; }))
      .toMatchObject({ section: 'Stats & Skills', label: 'Long Blade' });
    expect(labelOf((d) => { d.playerData.playerEntity.careerTemplate.AcuteHearing = true; }))
      .toEqual({ section: 'Career & Advantages', label: 'Acute Hearing', before: 'off', after: 'on' });
    expect(labelOf((d) => { d.playerData.playerEntity.items[1].hits1 = 480; }))
      .toEqual({ section: 'Inventory', label: 'Silver Longsword – condition', before: '120', after: '480' });
    expect(labelOf((d) => { d.playerData.playerEntity.goldPieces = 5000; }))
      .toEqual({ section: 'Finances', label: 'Gold', before: '150', after: '5000' });
    expect(labelOf((d) => { d.bankAccounts[0].accountGold = 1000; }))
      .toMatchObject({ section: 'Finances', label: 'Bank (Daggerfall) – balance' });
    expect(labelOf((d) => { d.playerData.guildMemberships[0].Value.rank = 5; }))
      .toEqual({ section: 'Factions & Reputation', label: 'Mages Guild – rank', before: '2', after: '5' });
    expect(labelOf((d) => { d.playerData.playerEntity.reputationCommoners = 20; }))
      .toMatchObject({ section: 'Factions & Reputation', label: 'Reputation: Commoners' });
    expect(labelOf((d) => { d.playerData.playerEntity.globalVars[0].value = true; }))
      .toEqual({ section: 'Quest Flags', label: 'LiftedCurse', before: 'off', after: 'on' });
    expect(labelOf((d) => { d.dateAndTime.gameTime += 3600; }))
      .toEqual({ section: 'Location & Time', label: 'In-game time', before: '22nd of Last Seed, 3E405, 13:30', after: '22nd of Last Seed, 3E405, 14:30' });
    expect(labelOf((d) => { d.playerData.playerPosition.position.x = 9; }))
      .toMatchObject({ section: 'Location & Time', label: 'Position X' });
    expect(labelOf((d) => { d.playerData.playerEntity.level = 6; }))
      .toEqual({ section: 'Character', label: 'Level', before: '5', after: '6' });
  });

  it('labels faction reputation from FactionData.txt', () => {
    const factions = makeFactions(10);
    const [change] = diffFaction(factions, produce(factions, (d) => { d.factionDict[3].Value.rep = 25; }));
    expect(labelChange(change)).toEqual({ section: 'Factions & Reputation', label: 'Faction 3 – reputation', before: '0', after: '25' });
  });

  it('labels removed records and falls back to the raw path', () => {
    expect(labelOf((d) => { d.playerData.playerEntity.items.splice(0, 1); }))
      .toMatchObject({ section: 'Inventory', label: 'Removed: Dagger' });
    expect(labelOf((d) => { d.currentUID = 101; }))
      .toEqual({ section: 'Other', label: 'currentUID', before: '100', after: '101' });
  });
});

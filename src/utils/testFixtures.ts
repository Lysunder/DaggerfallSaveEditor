// Small save and faction shapes for unit tests, following the structure of real DFU saves.

export const makeSave = () => ({
  currentUID: 100,
  dateAndTime: { gameTime: 12617127056 },
  bankAccounts: [{ regionIndex: 17, accountGold: 0, loanTotal: 0 }],
  playerData: {
    playerPosition: { weather: 'Overcast', position: { x: 1, y: 2, z: 3 } },
    // Keyed by GuildGroups: 10 is MagesGuild (faction 40).
    guildMemberships: [{ Key: 10, Value: { rank: 2, variant: 0 } }],
    playerEntity: {
      name: 'Lys',
      level: 5,
      goldPieces: 150,
      stats: { Strength: 55, Agility: 60 },
      skills: { LongBlade: 32 },
      careerTemplate: { AcuteHearing: false, ForbiddenMaterials: '' },
      items: [
        { uid: 1, shortName: 'Dagger', hits1: 100, hits2: 100, stackCount: 1 },
        { uid: 2, shortName: 'Silver Longsword', hits1: 120, hits2: 480, stackCount: 1 },
        { uid: 3, shortName: 'Arrow', hits1: 0, hits2: 0, stackCount: 20 },
      ],
      wagonItems: [],
      equipTable: [0, 2, 0, 1],
      globalVars: [{ index: 0, name: 'LiftedCurse', value: false }],
      reputationCommoners: 10,
      // Regions 0 and 1 of 62; 1 has a bad record and a banishment.
      regionData: [
        { LegalRep: 15, SeverePunishmentFlags: 0, Flags: [false], PrecipitationOverride: 0 },
        { LegalRep: -40, SeverePunishmentFlags: 1, Flags: [false], PrecipitationOverride: 0 },
      ],
      crimeCommitted: 'Theft',
      haveShownSurrenderToGuardsDialogue: true,
    },
  },
});

export type TestSave = ReturnType<typeof makeSave>;

export const makeFactions = (count = 500) => ({
  factionDict: Array.from({ length: count }, (_, i) => ({ Key: i, Value: { id: i, name: `Faction ${i}`, rep: 0 } })),
});

/** instancedEffectBundles covering each kind the Status Effects section handles. */
export const makeEffectBundles = () => {
  const mods = (values: Record<number, number>) => Array.from({ length: 8 }, (_, i) => values[i] ?? 0);
  const type = 'DaggerfallWorkshop.Game.MagicAndEffects.MagicEffects';
  return [
    { bundleType: 'Disease', name: 'Witches Pox', liveEffects: [{ key: 'Disease-WitchesPox', statMods: mods({ 0: -6, 4: -3 }), effectSpecific: { $type: `${type}.DiseaseEffect+SaveData_v1`, incubationOver: true, daysOfSymptomsLeft: 0xfe } }] },
    { bundleType: 'Disease', liveEffects: [{ key: 'Vampirism-Infection', statMods: mods({}), effectSpecific: { incubationOver: false, daysOfSymptomsLeft: 3 } }] },
    { bundleType: 3, liveEffects: [{ key: 'Poison-Nux_Vomica', statMods: mods({ 4: -1 }), effectSpecific: { currentState: 'Active' } }] },
    { bundleType: 'Spell', casterEntityType: 'EnemyClass', liveEffects: [{ key: 'Drain-Strength', roundsRemaining: 1, statMods: mods({ 0: -10 }) }] },
    { bundleType: 'Spell', casterEntityType: 'EnemyMonster', liveEffects: [{ key: 'Paralyze', roundsRemaining: 3, statMods: mods({}) }] },
    { bundleType: 'Spell', fromEquippedItemID: 42, liveEffects: [{ key: 'Silence', roundsRemaining: 0, statMods: mods({}) }] },
    { bundleType: 'None', liveEffects: [{ key: 'Vampirism-Curse', statMods: mods({}) }] },
    { bundleType: 'Spell', casterEntityType: 'Player', liveEffects: [{ key: 'Shield', roundsRemaining: 10, statMods: mods({}) }] },
    { bundleType: 'Potion', liveEffects: [{ key: 'Fortify-Strength', roundsRemaining: 5, statMods: mods({ 0: 5 }) }] },
  ];
};

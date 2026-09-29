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
    },
  },
});

export type TestSave = ReturnType<typeof makeSave>;

export const makeFactions = (count = 500) => ({
  factionDict: Array.from({ length: count }, (_, i) => ({ Key: i, Value: { id: i, name: `Faction ${i}`, rep: 0 } })),
});

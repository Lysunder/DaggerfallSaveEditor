import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Stats {
  Strength: number;
  Intelligence: number;
  Willpower: number;
  Agility: number;
  Endurance: number;
  Personality: number;
  Speed: number;
  Luck: number;
  [key: string]: number;
}

interface Skills {
  Medical: number;
  Etiquette: number;
  Streetwise: number;
  Jumping: number;
  Orcish: number;
  Harpy: number;
  Giantish: number;
  Dragonish: number;
  Nymph: number;
  Daedric: number;
  Spriggan: number;
  Centaurian: number;
  Impish: number;
  Lockpicking: number;
  Mercantile: number;
  Pickpocket: number;
  Stealth: number;
  Swimming: number;
  Climbing: number;
  Backstabbing: number;
  Dodging: number;
  Running: number;
  Destruction: number;
  Restoration: number;
  Illusion: number;
  Alteration: number;
  Thaumaturgy: number;
  Mysticism: number;
  ShortBlade: number;
  LongBlade: number;
  HandToHand: number;
  Axe: number;
  BluntWeapon: number;
  Archery: number;
  CriticalStrike: number;
  [key: string]: number;
}

export const DAGGERFALL_SKILLS = [
  'Medical', 'Etiquette', 'Streetwise', 'Jumping', 'Orcish', 'Harpy', 'Giantish',
  'Dragonish', 'Nymph', 'Daedric', 'Spriggan', 'Centaurian', 'Impish', 'Lockpicking',
  'Mercantile', 'Pickpocket', 'Stealth', 'Swimming', 'Climbing', 'Backstabbing',
  'Dodging', 'Running', 'Destruction', 'Restoration', 'Illusion', 'Alteration',
  'Thaumaturgy', 'Mysticism', 'ShortBlade', 'LongBlade', 'HandToHand', 'Axe',
  'BluntWeapon', 'Archery', 'CriticalStrike'
];

export interface Item {
  uid: number;
  shortName: string;
  itemGroup: string;
  weightInKg: number;
  value1: number;
  hits1: number;
  stackCount: number;
  [key: string]: any;
}

export interface GlobalVar {
  name: string;
  value: boolean;
  [key: string]: any;
}

export interface BankAccount {
  regionIndex: number;
  accountGold: number;
  loanTotal: number;
  [key: string]: any;
}

export interface DFCareer {
  Name: string;
  AdvancementMultiplier: number;
  HitPointsPerLevel: number;

  PrimarySkill1: string;
  PrimarySkill2: string;
  PrimarySkill3: string;
  MajorSkill1: string;
  MajorSkill2: string;
  MajorSkill3: string;
  MinorSkill1: string;
  MinorSkill2: string;
  MinorSkill3: string;
  MinorSkill4: string;
  MinorSkill5: string;
  MinorSkill6: string;
  
  // Tolerances
  Paralysis: string;
  Magic: string;
  Poison: string;
  Fire: string;
  Frost: string;
  Shock: string;
  Disease: string;
  
  // Spell Point Multiplier
  SpellPointMultiplier: string;
  SpellPointMultiplierValue: number;
  
  // Magic and Abilities
  DarknessPoweredMagery: string;
  LightPoweredMagery: string;
  SpellAbsorption: string;
  Regeneration: string;
  RapidHealing: string;
  
  // Booleans
  NoRegenSpellPoints: boolean;
  AcuteHearing: boolean;
  Athleticism: boolean;
  AdrenalineRush: boolean;
  DamageFromSunlight: boolean;
  DamageFromHolyPlaces: boolean;
  
  // Bitwise Flags
  ForbiddenMaterials: string;
  ForbiddenShields: string;
  ForbiddenArmors: string;
  ForbiddenProficiencies: string;
  ExpertProficiencies: string;
  
  // Modifiers
  UndeadAttackModifier: number;
  DaedraAttackModifier: number;
  HumanoidAttackModifier: number;
  AnimalsAttackModifier: number;
  
  [key: string]: any;
}

interface PlayerEntity {
  name: string;
  level: number;
  maxHealth: number;
  currentHealth: number;
  currentFatigue: number;
  currentMagicka: number;
  goldPieces: number;
  stats: Stats;
  skills: Skills;
  careerTemplate?: DFCareer;
  items: Item[];
  wagonItems?: Item[];
  equipTable?: number[];
  globalVars: GlobalVar[];
  reputationCommoners?: number;
  reputationMerchants?: number;
  reputationNobility?: number;
  reputationScholars?: number;
  reputationUnderworld?: number;
  reputationSupernaturalBeings?: number;
  reputationGuildMembers?: number;
  startingLevelUpSkillSum?: number;
  currentLevelUpSkillSum?: number;
  [key: string]: any;
}

interface SaveGameData {
  header: {
    saveName: string;
    playTime: number;
  };
  playerData: {
    playerEntity: PlayerEntity;
    playerPosition?: {
      position: { x: number; y: number; z: number };
      yaw: number;
      pitch: number;
      worldPosX: number;
      worldPosZ: number;
      weather: number;
      insideDungeon: boolean;
      insideBuilding: boolean;
      insideTavern: boolean;
      insideResidence: boolean;
      worldContext: number;
      buildingDiscoveryData?: {
        displayName?: string;
        buildingType?: number;
        quality?: number;
        [key: string]: any;
      };
      [key: string]: any;
    };
    guildMemberships?: { Key: number; Value: { rank: number; [key: string]: any } }[];
    vampireMemberships?: any[];
    [key: string]: any;
  };
  bankAccounts: BankAccount[];
  bankDeeds?: {
    shipType: number;
    houses: any[];
    [key: string]: any;
  };
  dateAndTime?: {
    gameTime: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface SaveStore {
  saveData: SaveGameData | null;
  factionData: any | null;
  currentFilePath: string | null;
  loadSaveData: (path: string, data: SaveGameData, factionData?: any) => void;
  updatePlayerField: (field: keyof Omit<PlayerEntity, 'stats' | 'skills' | 'careerTemplate'>, value: number | string) => void;
  updateCareerField: (field: keyof DFCareer, value: any) => void;
  updateStat: (stat: keyof Stats, value: number) => void;
  updateSkill: (skill: keyof Skills | string, value: number) => void;
  updateItem: (uid: number, updates: Partial<Item>) => void;
  deleteItem: (uid: number) => void;
  updateWagonItem: (uid: number, updates: Partial<Item>) => void;
  deleteWagonItem: (uid: number) => void;
  repairAllItems: (target: 'items' | 'wagonItems') => void;
  updateGlobalVar: (name: string, value: boolean) => void;
  updateBankAccount: (regionIndex: number, updates: Partial<BankAccount>) => void;
  updateGuildRank: (factionId: number, newRank: number) => void;
  updateFactionReputation: (factionId: number, newRep: number) => void;
  updatePlayerPosition: (updates: Partial<any>) => void;
  updatePlayerPositionCoords: (coords: Partial<{x: number, y: number, z: number}>) => void;
  updateBuildingDiscoveryData: (updates: Partial<any>) => void;
  updateGameTime: (deltaTick: number) => void;
  reset: () => void;
}

export const useSaveStore = create<SaveStore>()(
  immer((set) => ({
    saveData: null,
    factionData: null,
    currentFilePath: null,

    loadSaveData: (path, data, factionData) =>
      set((state) => {
        state.currentFilePath = path;
        state.saveData = data;
        state.factionData = factionData || null;
      }),

    updatePlayerField: (field, value) =>
      set((state) => {
        if (state.saveData?.playerData?.playerEntity) {
          (state.saveData.playerData.playerEntity as any)[field] = value;
        }
      }),

    updateCareerField: (field, value) =>
      set((state) => {
        if (state.saveData?.playerData?.playerEntity?.careerTemplate) {
          state.saveData.playerData.playerEntity.careerTemplate[field as keyof DFCareer] = value;
        }
      }),

    updateStat: (stat, value) =>
      set((state) => {
        if (state.saveData?.playerData?.playerEntity?.stats) {
          state.saveData.playerData.playerEntity.stats[stat] = value;
        }
      }),

    updateSkill: (skill, value) =>
      set((state) => {
        if (state.saveData?.playerData?.playerEntity?.skills) {
          state.saveData.playerData.playerEntity.skills[skill as keyof Skills] = value;
        }
      }),

    updateItem: (uid, updates) =>
      set((state) => {
        const items = state.saveData?.playerData?.playerEntity?.items;
        if (items) {
          const itemIndex = items.findIndex((i: Item) => i.uid === uid);
          if (itemIndex !== -1) {
            items[itemIndex] = { ...items[itemIndex], ...updates };
          }
        }
      }),

    deleteItem: (uid) =>
      set((state) => {
        const playerEntity = state.saveData?.playerData?.playerEntity;
        if (!playerEntity) return;
        const items = playerEntity.items;
        if (items) {
          const itemIndex = items.findIndex((i: Item) => i.uid === uid);
          if (itemIndex !== -1) {
            items.splice(itemIndex, 1);
          }
        }
        if (playerEntity.equipTable) {
          playerEntity.equipTable = playerEntity.equipTable.map(id => id === uid ? 0 : id);
        }
      }),

    updateWagonItem: (uid, updates) =>
      set((state) => {
        const items = state.saveData?.playerData?.playerEntity?.wagonItems;
        if (items) {
          const itemIndex = items.findIndex((i: Item) => i.uid === uid);
          if (itemIndex !== -1) {
            items[itemIndex] = { ...items[itemIndex], ...updates };
          }
        }
      }),

    deleteWagonItem: (uid) =>
      set((state) => {
        const items = state.saveData?.playerData?.playerEntity?.wagonItems;
        if (items) {
          const itemIndex = items.findIndex((i: Item) => i.uid === uid);
          if (itemIndex !== -1) {
            items.splice(itemIndex, 1);
          }
        }
      }),

    repairAllItems: (target) => 
      set((state) => {
        const items = state.saveData?.playerData?.playerEntity?.[target];
        if (items) {
          items.forEach((item: Item) => {
            item.hits1 = item.hits2;
          });
        }
      }),

    updateGlobalVar: (name, value) =>
      set((state) => {
        const globalVars = state.saveData?.playerData?.playerEntity?.globalVars;
        if (globalVars) {
          const gvar = globalVars.find((g: GlobalVar) => g.name === name);
          if (gvar) {
            gvar.value = value;
          }
        }
      }),

    updateBankAccount: (regionIndex, updates) =>
      set((state) => {
        const bankAccounts = state.saveData?.bankAccounts;
        if (bankAccounts) {
          const account = bankAccounts.find((a: BankAccount) => a.regionIndex === regionIndex);
          if (account) {
            Object.assign(account, updates);
          }
        }
      }),

    updateGuildRank: (factionId, newRank) =>
      set((state) => {
        const memberships = state.saveData?.playerData?.guildMemberships;
        if (memberships) {
          const membership = memberships.find((m: any) => m.Key === factionId);
          if (membership && membership.Value) {
            membership.Value.rank = newRank;
          }
        }
      }),

    updateFactionReputation: (factionId, newRep) =>
      set((state) => {
        const factionDict = state.factionData?.factionDict;
        if (factionDict && Array.isArray(factionDict)) {
          const faction = factionDict.find((f: any) => f.Key === factionId);
          if (faction && faction.Value) {
            faction.Value.rep = newRep;
          }
        }
      }),

    updatePlayerPosition: (updates) =>
      set((state) => {
        if (state.saveData?.playerData?.playerPosition) {
          Object.assign(state.saveData.playerData.playerPosition, updates);
        }
      }),

    updatePlayerPositionCoords: (coords) =>
      set((state) => {
        if (state.saveData?.playerData?.playerPosition?.position) {
          Object.assign(state.saveData.playerData.playerPosition.position, coords);
        }
      }),

    updateBuildingDiscoveryData: (updates) =>
      set((state) => {
        const playerPos = state.saveData?.playerData?.playerPosition;
        if (playerPos) {
          if (!playerPos.buildingDiscoveryData) {
            playerPos.buildingDiscoveryData = {};
          }
          Object.assign(playerPos.buildingDiscoveryData, updates);
        }
      }),

    updateGameTime: (deltaTick) =>
      set((state) => {
        if (state.saveData?.dateAndTime) {
          state.saveData.dateAndTime.gameTime += deltaTick;
        }
      }),

    reset: () =>
      set((state) => {
        state.saveData = null;
        state.factionData = null;
        state.currentFilePath = null;
      }),
  }))
);

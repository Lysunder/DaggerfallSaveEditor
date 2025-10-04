export interface SaveData {
  header: Header;
  currentUID: number;
  dateAndTime: DateAndTime;
  playerData: PlayerData;
  dungeonData: DungeonData;
  enemyData: EnemyData[];
}

export interface Header {
  description: string;
  version: string;
}

export interface DateAndTime {
  gameTime: number;
  realTime: number;
  version: string;
}

export interface PlayerData {
  playerPosition: PlayerPosition;
  playerEntity: PlayerEntity;
  weaponDrawn: boolean;
  usingLeftHand: boolean;
  transportMode: string;
  boardShipPosition: any;
  guildMemberships: Record<string, any>;
  vampireMemberships: Record<string, any>;
  oneTimeQuestsAccepted: any;
  version: string;
}

export interface PlayerPosition {
  position: Position;
  worldCompensation: Position;
  worldContext: string;
  floatingOriginVersion: number;
  yaw: number;
  pitch: number;
  isCrouching: boolean;
  worldPosX: number;
  worldPosZ: number;
  insideDungeon: boolean;
  insideBuilding: boolean;
  insideOpenShop: boolean;
  insideTavern: boolean;
  insideResidence: boolean;
  playerTeleportedIntoDungeon: boolean;
  terrainSamplerName: string;
  terrainSamplerVersion: number;
  smallerDungeonsState: string;
  exteriorDoors: any;
  buildingDiscoveryData: BuildingDiscoveryData;
  weather: string;
  version: string;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface BuildingDiscoveryData {
  buildingKey: number;
  displayName: string;
  oldDisplayName: string;
  isOverrideName: boolean;
  factionID: number;
  quality: number;
  buildingType: string;
  lastLockpickAttempt: number;
  customUserDisplayName: string;
}

export interface PlayerEntity {
  gender: string;
  faceIndex: number;
  raceTemplate: RaceTemplate;
  careerTemplate: CareerTemplate;
  reflexes: string;
  name: string;
  level: number;
  stats: Stats;
  skills: Skills;
  resistances: Resistances;
  maxHealth: number;
  currentHealth: number;
  currentFatigue: number;
  currentMagicka: number;
  currentBreath: number;
  skillUses: number[];
  timeOfLastSkillIncreaseCheck: number;
  skillsRecentlyRaised: number[];
  startingLevelUpSkillSum: number;
  currentLevelUpSkillSum: number;
  equipTable: number[];
  items: Item[];
  wagonItems: Item[];
  otherItems: Item[];
  goldPieces: number;
  globalVars: GlobalVar[];
  minMetalToHit: string;
  biographyResistDiseaseMod: number;
  biographyResistMagicMod: number;
  biographyAvoidHitMod: number;
  biographyResistPoisonMod: number;
  biographyFatigueMod: number;
  biographyReactionMod: number;
  timeForThievesGuildLetter: number;
  timeForDarkBrotherhoodLetter: number;
  thievesGuildRequirementTally: number;
  darkBrotherhoodRequirementTally: number;
  timeToBecomeVampireOrWerebeast: number;
  lastTimePlayerAteOrDrankAtTavern: number;
  timeOfLastSkillTraining: number;
  regionData: RegionData[];
  rentedRooms: any[];
  spellbook: SpellbookEntry[];
  instancedEffectBundles: InstancedEffectBundle[];
  crimeCommitted: string;
  haveShownSurrenderToGuardsDialogue: boolean;
  lightSourceUID: number;
  reputationCommoners: number;
  reputationMerchants: number;
  reputationNobility: number;
  reputationScholars: number;
  reputationUnderworld: number;
  reputationSGroup5: number;
  reputationSupernaturalBeings: number;
  reputationGuildMembers: number;
  reputationSGroup8: number;
  reputationSGroup9: number;
  reputationSGroup10: number;
  previousVampireClan: string;
  daedraSummonDay: number;
  daedraSummonIndex: number;
  anchorPosition: any;
  version: string;
}

export interface RaceTemplate {
  ID: number;
  Name: string;
  DescriptionID: number;
  ClipID: number;
  PaperDollBackground: string;
  PaperDollBodyMaleUnclothed: string;
  PaperDollBodyMaleClothed: string;
  PaperDollBodyFemaleUnclothed: string;
  PaperDollBodyFemaleClothed: string;
  PaperDollHeadsMale: string;
  PaperDollHeadsFemale: string;
  ResistanceFlags: string;
  ImmunityFlags: string;
  LowToleranceFlags: string;
  CriticalWeaknessFlags: string;
  SpecialAbilities: string;
  type: string;
}

export interface CareerTemplate {
  Name: string;
  AdvancementMultiplier: number;
  HitPointsPerLevel: number;
  Strength: number;
  Intelligence: number;
  Willpower: number;
  Agility: number;
  Endurance: number;
  Personality: number;
  Speed: number;
  Luck: number;
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
  Paralysis: string;
  Magic: string;
  Poison: string;
  Fire: string;
  Frost: string;
  Shock: string;
  Disease: string;
  ShortBlades: string;
  LongBlades: string;
  HandToHand: string;
  Axes: string;
  BluntWeapons: string;
  MissileWeapons: string;
  UndeadAttackModifier: string;
  DaedraAttackModifier: string;
  HumanoidAttackModifier: string;
  AnimalsAttackModifier: string;
  DarknessPoweredMagery: string;
  LightPoweredMagery: string;
  ForbiddenMaterials: string;
  ForbiddenShields: string;
  ForbiddenArmors: string;
  ForbiddenProficiencies: string;
  ExpertProficiencies: string;
  SpellPointMultiplier: string;
  SpellPointMultiplierValue: number;
  SpellAbsorption: string;
  NoRegenSpellPoints: boolean;
  AcuteHearing: boolean;
  Athleticism: boolean;
  AdrenalineRush: boolean;
  Regeneration: string;
  RapidHealing: string;
  DamageFromSunlight: boolean;
  DamageFromHolyPlaces: boolean;
}

export interface Stats {
  Strength: number;
  Intelligence: number;
  Willpower: number;
  Agility: number;
  Endurance: number;
  Personality: number;
  Speed: number;
  Luck: number;
}

export interface Skills {
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
}

export interface Resistances {
  Fire: number;
  Frost: number;
  DiseaseOrPoison: number;
  Shock: number;
  Magic: number;
}

export interface Item {
  uid: number;
  shortName: string;
  nativeMaterialValue: number;
  dyeColor: string;
  weightInKg: number;
  drawOrder: number;
  value1: number;
  value2: number;
  hits1: number;
  hits2: number;
  hits3: number;
  stackCount: number;
  enchantmentPoints: number;
  message: number;
  legacyMagic: any;
  customMagic: any;
  playerTextureArchive: number;
  playerTextureRecord: number;
  worldTextureArchive: number;
  worldTextureRecord: number;
  itemGroup: string;
  groupIndex: number;
  currentVariant: number;
  isQuestItem: boolean;
  questUID: number;
  questItemSymbol: string;
  trappedSoulType: string;
  className: string;
  poisonType: string;
  potionRecipe: number;
  repairData: any;
  timeForItemToDisappear: number;
  timeHealthLeechLastUsed: number;
  artifactIndexBitfield: number;
  version: string;
}

export interface GlobalVar {
  index: number;
  name: string;
  value: boolean;
}

export interface RegionData {
  Values: number[];
  Flags: boolean[];
  Flags2: boolean[];
  LegalRep: number;
  PrecipitationOverride: number;
  SeverePunishmentFlags: number;
  IDOfPersecutedTemple: number;
  PriceAdjustment: number;
}

export interface SpellbookEntry {
  Version: number;
  BundleType: string;
  TargetType: string;
  ElementType: string;
  RuntimeFlags: string;
  Name: string;
  IconIndex: number;
  Icon: Icon;
  MinimumCastingCost: boolean;
  NoCastingAnims: boolean;
  Tag: string;
  Effects: SpellEffect[];
  LegacyEffects: any;
  StandardSpellIndex: number;
}

export interface Icon {
  key: string;
  index: number;
}

export interface SpellEffect {
  Key: string;
  Settings: SpellEffectSettings;
  EnchantmentParam: any;
}

export interface SpellEffectSettings {
  DurationBase: number;
  DurationPlus: number;
  DurationPerLevel: number;
  ChanceBase: number;
  ChancePlus: number;
  ChancePerLevel: number;
  MagnitudeBaseMin: number;
  MagnitudeBaseMax: number;
  MagnitudePlusMin: number;
  MagnitudePlusMax: number;
  MagnitudePerLevel: number;
}

export interface InstancedEffectBundle {
  version: number;
  bundleType: string;
  targetType: string;
  elementType: string;
  runtimeFlags: string;
  name: string;
  iconIndex: number;
  icon: Icon;
  casterEntityType: string;
  casterLoadID: number;
  fromEquippedItemID: number;
  castByItemID: number;
  fromPoison: boolean;
  liveEffects: LiveEffect[];
  versionString: string;
}

export interface LiveEffect {
  key: string;
  effectSettings: SpellEffectSettings;
  enchantmentParam: any;
  roundsRemaining: number;
  chanceSuccess: boolean;
  statMods: number[];
  statMaxMods: number[];
  skillMods: number[];
  isIncumbent: boolean;
  variantCount: number;
  currentVariant: number;
  effectEnded: boolean;
  effectSpecific: any;
  version: string;
}

export interface DungeonData {
  actionDoors: ActionDoor[];
  actionObjects: any[];
  version: string;
}

export interface ActionDoor {
  loadID: number;
  currentLockValue: number;
  currentRotation: Rotation;
  currentState: string;
  actionPercentage: number;
  lockpickFailedSkillLevel: number;
  version: string;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface EnemyData {
  loadID: number;
  gameObjectName: string;
  currentPosition: Position;
  localPosition: Position;
  currentRotation: Rotation;
  worldContext: string;
  worldCompensation: Position;
  isDead: boolean;
  startingHealth: number;
  currentHealth: number;
  currentFatigue: number;
  currentMagicka: number;
  entityType: string;
  careerName: string;
  careerIndex: number;
  isHostile: boolean;
  hasEncounteredPlayer: boolean;
  questSpawn: boolean;
  mobileGender: string;
  items: Item[];
  equipTable: number[];
  questResource: QuestResource;
  instancedEffectBundles: InstancedEffectBundle[];
  alliedToPlayer: boolean;
  questFoeSpellQueueIndex: number;
  questFoeItemQueueIndex: number;
  wabbajackActive: boolean;
  team: number;
  specialTransformationCompleted: boolean;
  version: string;
}

export interface QuestResource {
  questUID: number;
  targetSymbol: string;
  isFoeDead: boolean;
  foeSpellQueuePosition: number;
  foeItemQueuePosition: number;
  isAttackableByAI: boolean;
  version: string;
}

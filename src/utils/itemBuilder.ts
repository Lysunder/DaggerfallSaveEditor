// Builds new inventory items the way Daggerfall Unity does.
// Ported from DFU's ItemBuilder.cs (CreateWeapon, CreateArmor, Create*Clothing, SetVariant, SetRace),
// DaggerfallUnityItem.SetItem / GetSaveData, ItemHelper.Get*DyeColor and FormulaHelper.IsItemStackable.
// Static data (templates, group enums, materials) is generated into src/data/itemTemplates.ts.
import {
  ARMOR_MATERIALS, GROUP_TEMPLATES, ITEM_TEMPLATES, WEAPON_MATERIALS,
  type ItemGroupName, type ItemTemplate,
} from '../data/itemTemplates';

export type WeaponMaterial = keyof typeof WEAPON_MATERIALS;
export type ArmorMaterial = Exclude<keyof typeof ARMOR_MATERIALS, 'Chain2'>;
export type Gender = 'Male' | 'Female';

/** An item as DFU saves it (ItemData_v1), without its uid. */
export type NewItemData = Record<string, unknown> & {
  shortName: string;
  itemGroup: ItemGroupName;
  groupIndex: number;
  weightInKg: number;
  value1: number;
  hits1: number;
  hits2: number;
  stackCount: number;
  currentVariant: number;
  dyeColor: string;
  nativeMaterialValue: number;
};

// --- Material tables (ItemBuilder.cs). Index by WeaponMaterialTypes value, Iron through Daedric. ---
const WEIGHT_MULTIPLIERS = [4, 5, 4, 4, 3, 4, 4, 2, 4, 5];
const VALUE_MULTIPLIERS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
const CONDITION_MULTIPLIERS = [4, 6, 6, 8, 12, 16, 20, 24, 28, 32];

/** Armor materials offered in the editor. Chain2 is a legacy duplicate of Chain. */
export const ARMOR_MATERIAL_NAMES = (Object.keys(ARMOR_MATERIALS) as (keyof typeof ARMOR_MATERIALS)[])
  .filter((name): name is ArmorMaterial => name !== 'Chain2');
export const WEAPON_MATERIAL_NAMES = Object.keys(WEAPON_MATERIALS) as WeaponMaterial[];

/**
 * DyeColors names as FullSerializer writes them. Several members share 18 (Unchanged, Chain, Silver,
 * SilverOrElven); DFU writes that value as "SilverOrElven", so that's the name used here.
 */
export const DYE = {
  Unchanged: 'SilverOrElven',
  Iron: 'Iron', Steel: 'Steel', Silver: 'SilverOrElven', Elven: 'Elven', Dwarven: 'Dwarven', Mithril: 'Mithril',
  Adamantium: 'Adamantium', Ebony: 'Ebony', Orcish: 'Orcish', Daedric: 'Daedric',
} as const;

/** Clothing dyes in DFU's order (ItemBuilder.clothingDyes); the first is the default. */
export const CLOTHING_DYES = [
  'Blue', 'Grey', 'Red', 'DarkBrown', 'Purple', 'LightBrown', 'White', 'Aquamarine', 'Yellow', 'Green',
] as const;
export type ClothingDye = typeof CLOTHING_DYES[number];

// --- Templates by enum name, for the rules that single out specific items. ---
const ARMOR = { Cuirass: 102, Gauntlets: 103, Greaves: 104, LeftPauldron: 105, RightPauldron: 106, Helm: 107, Boots: 108 };
const ARROW = 131;
const OIL = 252;
const FEMALE_ARMOR_ARCHIVE = 245;
const MALE_ARMOR_ARCHIVE = 249;

export const templateAt = (index: number): ItemTemplate => ITEM_TEMPLATES[index];

/** Position of a template in its group's enum, or -1. */
export const groupIndexOf = (group: ItemGroupName, templateIndex: number) =>
  GROUP_TEMPLATES[group]?.indexOf(templateIndex) ?? -1;

/** FormulaHelper.IsItemStackable for the items the editor can build (no potions, books or gold). */
export const isStackable = (templateIndex: number) =>
  templateAt(templateIndex).isIngredient || templateIndex === ARROW || templateIndex === OIL;

export const isArrow = (templateIndex: number) => templateIndex === ARROW;

/** BodyMorphology offset for DFU's Races value (GetBodyMorphology). */
export const bodyMorphology = (raceId: number): { offset: number; supported: boolean } => {
  switch (raceId) {
    case 8: return { offset: 0, supported: true };                          // Argonian
    case 4: case 5: case 6: return { offset: 1, supported: true };          // Dark, High, Wood Elf
    case 1: case 2: case 3: return { offset: 2, supported: true };          // Breton, Redguard, Nord
    case 7: return { offset: 3, supported: true };                          // Khajiit
    // DFU throws for anything else (None, Vampire, Werewolf, Wereboar); use Human so the item still works.
    default: return { offset: 2, supported: false };
  }
};

// C# float arithmetic: values are float32, and Mathf.Round rounds halves to even.
const f32 = Math.fround;
const roundHalfEven = (value: number) => {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
};

/** DaggerfallUnityItem.SetItem: a fresh item from its template. */
export const createItem = (group: ItemGroupName, templateIndex: number): NewItemData => {
  const template = templateAt(templateIndex);
  const groupIndex = groupIndexOf(group, templateIndex);
  if (!template || groupIndex < 0) throw new Error(`Template ${templateIndex} is not in group ${group}`);
  return {
    shortName: template.name,
    nativeMaterialValue: 0,
    dyeColor: DYE.Unchanged,
    weightInKg: template.baseWeight,
    drawOrder: template.drawOrderOrEffect,
    value1: template.basePrice,
    value2: 0,
    hits1: template.hitPoints,
    hits2: template.hitPoints,
    hits3: 0,
    stackCount: 1,
    enchantmentPoints: template.enchantmentPoints,
    // DFU picks which painting at random.
    message: group === 'Paintings' ? Math.floor(Math.random() * 65536) : 0,
    legacyMagic: null,
    customMagic: null,
    playerTextureArchive: template.playerTextureArchive,
    playerTextureRecord: template.playerTextureRecord,
    worldTextureArchive: template.worldTextureArchive,
    worldTextureRecord: template.worldTextureRecord,
    itemGroup: group,
    groupIndex,
    currentVariant: 0,
    isQuestItem: false,
    questUID: 0,
    questItemSymbol: null,
    trappedSoulType: 'None',
    className: null,
    poisonType: 'None',
    potionRecipe: 0,
    repairData: null,
    timeForItemToDisappear: 0,
    timeHealthLeechLastUsed: 0,
    artifactIndexBitfield: 0,
    $version: 'v1',
  };
};

/** SetItemPropertiesByMaterial: value, weight and condition for a weapon or plate material (0-9). */
const applyMaterialProperties = (item: NewItemData, material: number) => {
  item.value1 = item.value1 * 3 * VALUE_MULTIPLIERS[material];
  const quarterKgs = Math.trunc(f32(item.weightInKg * 4));
  const materialQuarterKgs = f32((quarterKgs * WEIGHT_MULTIPLIERS[material]) / 4);
  item.weightInKg = roundHalfEven(materialQuarterKgs) / 4;
  item.hits2 = Math.trunc((item.hits2 * CONDITION_MULTIPLIERS[material]) / 4);
  item.hits1 = item.hits2;
};

/** CreateWeapon. Arrows have no material and start at condition 0, as in classic. */
export const buildWeapon = (templateIndex: number, material: WeaponMaterial, gender: Gender): NewItemData => {
  const item = createItem('Weapons', templateIndex);
  if (templateIndex === ARROW) {
    item.hits1 = 0;
    return item;
  }
  const value = WEAPON_MATERIALS[material];
  item.nativeMaterialValue = value;
  applyMaterialProperties(item, value);
  item.dyeColor = DYE[material];
  // Female characters use the previous archive for weapons (233 rather than 234).
  if (gender === 'Female') (item.playerTextureArchive as number) -= 1;
  return item;
};

/**
 * SetVariant: the variant DFU actually stores for this armor piece and material, or null if the
 * requested variant is out of range (DFU then leaves the variant at 0).
 */
const clampVariant = (templateIndex: number, material: number, variant: number): number | null => {
  if (variant < 0 || variant >= templateAt(templateIndex).variants) return null;
  const leather = material === ARMOR_MATERIALS.Leather;
  const chain = material === ARMOR_MATERIALS.Chain || material === ARMOR_MATERIALS.Chain2;
  const clamp = (min: number, max: number) => Math.min(Math.max(variant, min), max);
  switch (templateIndex) {
    case ARMOR.Cuirass: return leather ? 0 : chain ? 4 : clamp(1, 3);
    case ARMOR.Greaves: return leather ? clamp(0, 1) : chain ? 6 : clamp(2, 5);
    case ARMOR.LeftPauldron: case ARMOR.RightPauldron: return leather ? 0 : chain ? 4 : clamp(1, 3);
    case ARMOR.Gauntlets: return leather ? 0 : 1;
    case ARMOR.Boots: return leather ? 0 : clamp(1, 2);
    default: return variant;
  }
};

/** CurrentVariant's setter clamps to the template's range. */
const storeVariant = (templateIndex: number, variant: number) =>
  Math.min(Math.max(variant, 0), Math.max(templateAt(templateIndex).variants - 1, 0));

/** The distinct variants an armor piece can have in this material, in order. */
export const armorVariants = (templateIndex: number, material: ArmorMaterial): number[] => {
  const value = ARMOR_MATERIALS[material];
  const variants = new Set<number>();
  for (let variant = 0; variant < templateAt(templateIndex).variants; variant++) {
    const clamped = clampVariant(templateIndex, value, variant);
    if (clamped !== null) variants.add(storeVariant(templateIndex, clamped));
  }
  return variants.size > 0 ? [...variants] : [0];
};

/** CreateArmor → ApplyArmorSettings: gender archive, body morphology, material, then variant. */
export const buildArmor = (
  templateIndex: number, material: ArmorMaterial, variant: number, gender: Gender, raceId: number,
): NewItemData => {
  const item = createItem('Armor', templateIndex);
  item.playerTextureArchive = (gender === 'Female' ? FEMALE_ARMOR_ARCHIVE : MALE_ARMOR_ARCHIVE) + bodyMorphology(raceId).offset;

  // ApplyArmorMaterial
  const value = ARMOR_MATERIALS[material];
  item.nativeMaterialValue = value;
  if (value === ARMOR_MATERIALS.Leather) {
    // Mathf.Round((int)(weight * 4) / 2) / 4, where the division by 2 is integer division.
    item.weightInKg = Math.trunc(Math.trunc(f32(item.weightInKg * 4)) / 2) / 4;
  } else if (value === ARMOR_MATERIALS.Chain) {
    item.value1 *= 2;
  } else if (value >= ARMOR_MATERIALS.Iron) {
    applyMaterialProperties(item, value - ARMOR_MATERIALS.Iron);
  }
  item.dyeColor = material in DYE ? DYE[material as keyof typeof DYE] : DYE.Unchanged;

  const clamped = clampVariant(templateIndex, value, variant);
  if (clamped !== null) item.currentVariant = storeVariant(templateIndex, clamped);
  return item;
};

/** CreateMensClothing / CreateWomensClothing: body morphology, variant and dye. */
export const buildClothing = (
  group: 'MensClothing' | 'WomensClothing', templateIndex: number, variant: number, dye: ClothingDye, raceId: number,
): NewItemData => {
  const item = createItem(group, templateIndex);
  (item.playerTextureArchive as number) += bodyMorphology(raceId).offset;
  if (variant >= 0 && variant < templateAt(templateIndex).variants) item.currentVariant = storeVariant(templateIndex, variant);
  item.dyeColor = dye;
  return item;
};

// --- What the Add Item dialog offers. ---

export type ItemTypeId = 'weapons' | 'armor' | 'clothing' | 'ingredients' | 'gems' | 'jewellery' | 'religious' | 'misc';

export interface ItemType {
  id: ItemTypeId;
  label: string;
  description: string;
}

export const ITEM_TYPES: ItemType[] = [
  { id: 'weapons', label: 'Weapons', description: 'Blades, axes, blunt weapons, bows and arrows' },
  { id: 'armor', label: 'Armor & Shields', description: 'Leather, chain and plate armor, and shields' },
  { id: 'clothing', label: 'Clothing', description: 'Shirts, robes, cloaks, boots and more, in any dye' },
  { id: 'ingredients', label: 'Ingredients', description: 'Plants, creature parts and metals for potions' },
  { id: 'gems', label: 'Gems', description: 'Rubies, emeralds, diamonds and other gems' },
  { id: 'jewellery', label: 'Jewellery', description: 'Amulets, rings, bracelets, marks and wands' },
  { id: 'religious', label: 'Religious Items', description: 'Symbols, holy water, icons and relics' },
  { id: 'misc', label: 'Miscellaneous', description: 'Torches, lanterns, bandages, oil, maps, drugs and more' },
];

const TYPE_GROUPS: Record<Exclude<ItemTypeId, 'clothing'>, ItemGroupName[]> = {
  weapons: ['Weapons'],
  armor: ['Armor'],
  ingredients: [
    'PlantIngredients1', 'PlantIngredients2', 'CreatureIngredients1', 'CreatureIngredients2', 'CreatureIngredients3',
    'MiscellaneousIngredients1', 'MiscellaneousIngredients2', 'MetalIngredients',
  ],
  gems: ['Gems'],
  jewellery: ['Jewellery'],
  religious: ['ReligiousItems'],
  misc: ['UselessItems2', 'MiscItems', 'Maps', 'Paintings', 'Drugs'],
};

/**
 * MiscItems entries the editor doesn't build: letters of credit (their value is a bank balance),
 * potion recipes (need a recipe key), the unused slot, dead bodies and deeds (quests and ownership).
 */
const EXCLUDED_TEMPLATES = new Set([275, 276, 278, 281, 285, 286]);

const SUBGROUP_LABELS: Partial<Record<ItemGroupName, string>> = {
  PlantIngredients1: 'Plant', PlantIngredients2: 'Plant',
  CreatureIngredients1: 'Creature', CreatureIngredients2: 'Creature', CreatureIngredients3: 'Creature',
  MiscellaneousIngredients1: 'Miscellaneous', MiscellaneousIngredients2: 'Miscellaneous', MetalIngredients: 'Metal',
  UselessItems2: 'General', MiscItems: 'Magic & documents', Maps: 'Map', Paintings: 'Painting', Drugs: 'Drug',
};

export interface CatalogEntry {
  group: ItemGroupName;
  templateIndex: number;
  template: ItemTemplate;
  /** Shown next to the name for types that span several groups (e.g. "Plant", "Metal"). */
  subgroup?: string;
}

export const clothingGroup = (gender: Gender): 'MensClothing' | 'WomensClothing' =>
  gender === 'Female' ? 'WomensClothing' : 'MensClothing';

/** The items of one type, each template once (some ingredients and maps appear in two groups). */
export const catalog = (type: ItemTypeId, gender: Gender): CatalogEntry[] => {
  const groups: ItemGroupName[] = type === 'clothing' ? [clothingGroup(gender)] : TYPE_GROUPS[type];
  const seen = new Set<number>();
  const entries: CatalogEntry[] = [];
  for (const group of groups) {
    for (const templateIndex of GROUP_TEMPLATES[group] ?? []) {
      if (seen.has(templateIndex) || EXCLUDED_TEMPLATES.has(templateIndex)) continue;
      seen.add(templateIndex);
      entries.push({ group, templateIndex, template: templateAt(templateIndex), subgroup: groups.length > 1 ? SUBGROUP_LABELS[group] : undefined });
    }
  }
  return entries;
};

export interface BuildOptions {
  type: ItemTypeId;
  entry: CatalogEntry;
  gender: Gender;
  raceId: number;
  weaponMaterial?: WeaponMaterial;
  armorMaterial?: ArmorMaterial;
  variant?: number;
  dye?: ClothingDye;
  /** Stack size for stackable items; ignored otherwise. */
  quantity?: number;
}

/** Builds the item the dialog describes, without a uid. */
export const buildItem = (options: BuildOptions): NewItemData => {
  const { type, entry, gender, raceId } = options;
  let item: NewItemData;
  if (type === 'weapons') item = buildWeapon(entry.templateIndex, options.weaponMaterial ?? 'Iron', gender);
  else if (type === 'armor') item = buildArmor(entry.templateIndex, options.armorMaterial ?? 'Leather', options.variant ?? 0, gender, raceId);
  else if (type === 'clothing') item = buildClothing(entry.group as 'MensClothing' | 'WomensClothing', entry.templateIndex, options.variant ?? 0, options.dye ?? 'Blue', raceId);
  else item = createItem(entry.group, entry.templateIndex);
  if (isStackable(entry.templateIndex)) item.stackCount = Math.max(1, Math.trunc(options.quantity ?? 1));
  return item;
};

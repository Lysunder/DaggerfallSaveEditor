import { describe, expect, it } from 'vitest';
import {
  armorVariants, buildArmor, buildClothing, buildItem, buildWeapon, catalog, createItem, isStackable,
} from './itemBuilder';
import { GROUP_TEMPLATES, ITEM_TEMPLATES } from '../data/itemTemplates';

// Items DFU built for a female Wood Elf (race 6), copied from a real save. Only the fields the
// builder sets are listed; condition (hits1) is left out where the item has since worn down.
const FEMALE = 'Female' as const;
const WOOD_ELF = 6;

describe('itemBuilder matches items DFU created', () => {
  it('Ebony dagger', () => {
    expect(buildWeapon(113, 'Ebony', FEMALE)).toMatchObject({
      shortName: 'Dagger', itemGroup: 'Weapons', groupIndex: 0, nativeMaterialValue: 7, dyeColor: 'Ebony',
      weightInKg: 0.25, value1: 384, hits1: 300, hits2: 300, enchantmentPoints: 200, drawOrder: 100,
      playerTextureArchive: 233, playerTextureRecord: 5, worldTextureArchive: 207, worldTextureRecord: 5, currentVariant: 0,
    });
  });

  it('Steel dai-katana and Elven longsword', () => {
    expect(buildWeapon(123, 'Steel', FEMALE)).toMatchObject({
      shortName: 'Dai-katana', groupIndex: 10, nativeMaterialValue: 1, dyeColor: 'Steel', weightInKg: 4.5, value1: 300,
      hits2: 1200, playerTextureArchive: 233, playerTextureRecord: 7,
    });
    expect(buildWeapon(120, 'Elven', FEMALE)).toMatchObject({
      shortName: 'Longsword', groupIndex: 7, nativeMaterialValue: 3, dyeColor: 'Elven', weightInKg: 4.5, value1: 360, hits2: 1600,
    });
  });

  it('Iron plate cuirass, greaves and pauldron', () => {
    expect(buildArmor(102, 'Iron', 1, FEMALE, WOOD_ELF)).toMatchObject({
      shortName: 'Cuirass', groupIndex: 0, nativeMaterialValue: 512, dyeColor: 'Iron', weightInKg: 12.5, value1: 300,
      hits1: 4096, hits2: 4096, playerTextureArchive: 246, playerTextureRecord: 3, worldTextureArchive: 207, worldTextureRecord: 11,
      currentVariant: 1, enchantmentPoints: 400, drawOrder: 50,
    });
    expect(buildArmor(104, 'Iron', 3, FEMALE, WOOD_ELF)).toMatchObject({
      groupIndex: 2, nativeMaterialValue: 512, dyeColor: 'Iron', weightInKg: 2.5, value1: 240, hits2: 3072, currentVariant: 3,
    });
    expect(buildArmor(105, 'Iron', 3, FEMALE, WOOD_ELF)).toMatchObject({
      groupIndex: 3, weightInKg: 2, value1: 180, hits2: 2048, currentVariant: 3,
    });
  });

  it('chain helm', () => {
    expect(buildArmor(107, 'Chain', 2, FEMALE, WOOD_ELF)).toMatchObject({
      shortName: 'Helm', groupIndex: 5, nativeMaterialValue: 256, dyeColor: 'SilverOrElven', weightInKg: 2.5, value1: 160,
      hits2: 2560, playerTextureArchive: 246, playerTextureRecord: 27, currentVariant: 2,
    });
  });

  it('leather pauldron, buckler and gauntlets', () => {
    expect(buildArmor(106, 'Leather', 0, FEMALE, WOOD_ELF)).toMatchObject({
      shortName: 'Right Pauldron', nativeMaterialValue: 0, dyeColor: 'SilverOrElven', weightInKg: 1, value1: 60, hits2: 2048, currentVariant: 0,
    });
    expect(buildArmor(109, 'Leather', 0, FEMALE, WOOD_ELF)).toMatchObject({
      shortName: 'Buckler', groupIndex: 7, weightInKg: 1, value1: 10, hits2: 512, playerTextureArchive: 246, playerTextureRecord: 33,
    });
    // The save's gauntlets weigh 0.625: they were made before DFU's 2025 leather weight fix
    // (7d38e7f2), which rounds 1.25 / 2 down to the nearest quarter kilo.
    expect(buildArmor(103, 'Leather', 0, FEMALE, WOOD_ELF)).toMatchObject({
      shortName: 'Gauntlets', groupIndex: 1, weightInKg: 0.5, value1: 50, hits2: 2048, playerTextureArchive: 246, currentVariant: 0,
    });
  });

  it('clothing', () => {
    expect(buildClothing('WomensClothing', 206, 0, 'DarkBrown', WOOD_ELF)).toMatchObject({
      shortName: 'Short Shirt', itemGroup: 'WomensClothing', groupIndex: 24, dyeColor: 'DarkBrown', weightInKg: 0.5, value1: 5,
      hits2: 100, enchantmentPoints: 60, drawOrder: 40, playerTextureArchive: 236, playerTextureRecord: 76, worldTextureArchive: 204,
    });
    expect(buildClothing('WomensClothing', 190, 4, 'Blue', WOOD_ELF)).toMatchObject({
      shortName: 'Casual Pants', groupIndex: 8, dyeColor: 'Blue', currentVariant: 4, hits2: 150, playerTextureRecord: 16,
    });
  });

  it('plain items keep their template values', () => {
    expect(createItem('PlantIngredients1', 8)).toMatchObject({
      shortName: 'Twigs', groupIndex: 0, dyeColor: 'SilverOrElven', weightInKg: 0.5, value1: 2, hits1: 4, hits2: 4,
      drawOrder: 25, worldTextureArchive: 254, worldTextureRecord: 9, stackCount: 1,
    });
    expect(createItem('MiscItems', 132)).toMatchObject({ shortName: 'Spellbook', groupIndex: 0, weightInKg: 0.75, value1: 50, hits1: 75 });
  });

  it('writes every field DFU saves, with defaults', () => {
    const item = createItem('Gems', 0);
    expect(Object.keys(item).sort()).toEqual([
      '$version', 'artifactIndexBitfield', 'className', 'currentVariant', 'customMagic', 'drawOrder', 'dyeColor',
      'enchantmentPoints', 'groupIndex', 'hits1', 'hits2', 'hits3', 'isQuestItem', 'itemGroup', 'legacyMagic', 'message',
      'nativeMaterialValue', 'playerTextureArchive', 'playerTextureRecord', 'poisonType', 'potionRecipe', 'questItemSymbol',
      'questUID', 'repairData', 'shortName', 'stackCount', 'timeForItemToDisappear', 'timeHealthLeechLastUsed',
      'trappedSoulType', 'value1', 'value2', 'weightInKg', 'worldTextureArchive', 'worldTextureRecord',
    ]);
  });
});

describe('itemBuilder rules', () => {
  it('male weapons keep the template archive; arrows skip material', () => {
    expect(buildWeapon(113, 'Iron', 'Male').playerTextureArchive).toBe(234);
    expect(buildWeapon(131, 'Daedric', FEMALE)).toMatchObject({ nativeMaterialValue: 0, hits1: 0, value1: 2, dyeColor: 'SilverOrElven' });
  });

  it('rounds material weight halves to even like Mathf.Round', () => {
    // Claymore 7.5 kg × Daedric (5): 30 quarter-kilos × 5 / 4 = 37.5 → 38 → 9.5 kg.
    expect(buildWeapon(122, 'Daedric', 'Male').weightInKg).toBe(9.5);
    // Saber 3.75 kg × Steel (5): 15 × 5 / 4 = 18.75 → 19 → 4.75 kg.
    expect(buildWeapon(119, 'Steel', 'Male').weightInKg).toBe(4.75);
  });

  it('male armor uses archive 249 plus the body offset; unsupported races fall back to Human', () => {
    expect(buildArmor(102, 'Steel', 1, 'Male', 1).playerTextureArchive).toBe(251);
    expect(buildArmor(102, 'Steel', 1, 'Male', 8).playerTextureArchive).toBe(249);
    expect(buildArmor(102, 'Steel', 1, 'Female', 7).playerTextureArchive).toBe(248);
    expect(buildArmor(102, 'Steel', 1, 'Male', 9).playerTextureArchive).toBe(251);
    expect(buildArmor(102, 'Steel', 1, 'Male', -1).playerTextureArchive).toBe(251);
  });

  it('clamps armor variants per piece and material', () => {
    expect(armorVariants(102, 'Leather')).toEqual([0]);
    expect(armorVariants(102, 'Chain')).toEqual([4]);
    expect(armorVariants(102, 'Ebony')).toEqual([1, 2, 3]);
    expect(armorVariants(104, 'Leather')).toEqual([0, 1]);
    expect(armorVariants(104, 'Chain')).toEqual([6]);
    expect(armorVariants(104, 'Iron')).toEqual([2, 3, 4, 5]);
    expect(armorVariants(103, 'Daedric')).toEqual([1]);
    expect(armorVariants(108, 'Steel')).toEqual([1, 2]);
    expect(armorVariants(107, 'Iron')).toEqual([0, 1, 2, 3, 4, 5]);
    expect(armorVariants(110, 'Iron')).toEqual([0]);
    expect(buildArmor(102, 'Chain', 0, 'Male', 1).currentVariant).toBe(4);
    expect(buildArmor(102, 'Iron', 0, 'Male', 1).currentVariant).toBe(1);
  });

  it('chain armor doubles value; plate uses the weapon tables', () => {
    expect(buildArmor(102, 'Chain', 4, 'Male', 1)).toMatchObject({ value1: 200, weightInKg: 12.5, hits2: 4096 });
    expect(buildArmor(102, 'Daedric', 1, 'Male', 1)).toMatchObject({ value1: 100 * 3 * 512, hits2: 4096 * 8, dyeColor: 'Daedric' });
  });

  it('stacks only ingredients (gems included), arrows and oil', () => {
    expect(isStackable(8)).toBe(true);
    expect(isStackable(0)).toBe(true);
    expect(isStackable(131)).toBe(true);
    expect(isStackable(252)).toBe(true);
    expect(isStackable(247)).toBe(false);
    expect(isStackable(113)).toBe(false);
    const [twigs] = catalog('ingredients', FEMALE);
    expect(buildItem({ type: 'ingredients', entry: twigs, gender: FEMALE, raceId: 6, quantity: 12 }).stackCount).toBe(12);
    const [torch] = catalog('misc', FEMALE);
    expect(buildItem({ type: 'misc', entry: torch, gender: FEMALE, raceId: 6, quantity: 12 }).stackCount).toBe(1);
  });

  it('catalog lists each template once and leaves out items it cannot build', () => {
    const ingredients = catalog('ingredients', FEMALE);
    expect(new Set(ingredients.map((entry) => entry.templateIndex)).size).toBe(ingredients.length);
    expect(ingredients.find((entry) => entry.template.name === 'Black Rose')?.group).toBe('PlantIngredients2');
    const misc = catalog('misc', FEMALE).map((entry) => entry.template.name);
    expect(misc).not.toContain('Letter of Credit');
    expect(misc).not.toContain('Potion recipe');
    expect(catalog('clothing', 'Male').every((entry) => entry.group === 'MensClothing')).toBe(true);
    expect(catalog('clothing', FEMALE).every((entry) => entry.group === 'WomensClothing')).toBe(true);
  });

  it('generated data matches DFU', () => {
    expect(ITEM_TEMPLATES).toHaveLength(288);
    expect(GROUP_TEMPLATES.Weapons).toHaveLength(19);
    expect(GROUP_TEMPLATES.Armor?.[0]).toBe(102);
  });
});

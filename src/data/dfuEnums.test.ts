import { describe, expect, it } from 'vitest';
import {
  CAREER_FLAG_FIELDS, buildingTypeName, findEnumRepairs, formatFlags, parseFlags, weatherName, worldContextName,
} from './dfuEnums';

const materials = CAREER_FLAG_FIELDS.ForbiddenMaterials;

describe('flags', () => {
  it('writes the form DFU reads: bare commas, declaration order, "" for none', () => {
    // Checked against DFU's FullSerializer: "Iron,Steel" loads, "Iron, Steel" fails.
    expect(formatFlags(['Steel', 'Iron'], materials)).toBe('Iron,Steel');
    expect(formatFlags([], materials)).toBe('');
  });

  it('reads both the correct form and the ", " form older editor versions wrote', () => {
    expect(parseFlags('Iron,Steel')).toEqual(['Iron', 'Steel']);
    expect(parseFlags('Iron, Steel')).toEqual(['Iron', 'Steel']);
    expect(parseFlags('')).toEqual([]);
    expect(parseFlags(undefined)).toEqual([]);
  });
});

describe('enum names', () => {
  it('maps stored names, aliases and numbers to the canonical name', () => {
    expect(weatherName('Overcast')).toBe('Overcast');
    expect(weatherName(4)).toBe('Rain');
    expect(weatherName('Rain_Normal')).toBe('Rain');
    expect(weatherName('None')).toBe('Sunny');
    expect(worldContextName('Exterior')).toBe('Exterior');
    expect(worldContextName(3)).toBe('Dungeon');
    expect(buildingTypeName('Alchemist')).toBe('Alchemist');
    expect(buildingTypeName(15)).toBe('Tavern');
  });

  it('returns undefined for values DFU would reject', () => {
    expect(weatherName('overcast')).toBeUndefined();
    expect(worldContextName('Over world')).toBeUndefined();
    expect(buildingTypeName(999)).toBeUndefined();
  });
});

describe('findEnumRepairs', () => {
  const save = (career: Record<string, unknown>) => ({ playerData: { playerEntity: { careerTemplate: career } } });

  it('repairs career flags written with ", "', () => {
    expect(findEnumRepairs(save({ ForbiddenMaterials: 'Iron, Steel', ForbiddenShields: 'TowerShield', ForbiddenArmors: '' }))).toEqual([
      { path: 'playerData.playerEntity.careerTemplate.ForbiddenMaterials', before: 'Iron, Steel', after: 'Iron,Steel' },
    ]);
  });

  it('leaves correct values and unknown names alone', () => {
    expect(findEnumRepairs(save({ ForbiddenMaterials: 'Iron,Steel' }))).toEqual([]);
    expect(findEnumRepairs(save({ ForbiddenMaterials: 'Iron, Unobtainium' }))).toEqual([]);
    expect(findEnumRepairs({})).toEqual([]);
  });
});

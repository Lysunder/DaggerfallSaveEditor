import { describe, expect, it } from 'vitest';
import { formatDaggerfallDate, formatGameTime, gameTimeToDate, ordinal, ticksToDate } from './daggerfallDate';

describe('daggerfallDate', () => {
  it('converts game seconds like DaggerfallDateTime.FromSeconds', () => {
    // 3E405, month 7 (Last Seed), day index 21, 13:30 — from the sample save's SaveInfo.txt.
    expect(gameTimeToDate(12617127056)).toEqual({ Year: 405, Month: 7, Day: 21, Hour: 13, Minute: 30 });
    expect(formatGameTime(12617127056)).toBe('22nd of Last Seed, 3E405');
    expect(formatGameTime(12617127056, true)).toBe('22nd of Last Seed, 3E405, 13:30');
  });

  it('formats quest log dates', () => {
    expect(formatDaggerfallDate({ Year: 405, Month: 0, Day: 0 })).toBe('1st of Morning Star, 3E405');
  });

  it('uses the right ordinal suffixes', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 30].map(ordinal)).toEqual(
      ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '30th'],
    );
  });

  it('converts .NET ticks to a JS date', () => {
    expect(ticksToDate(621355968000000000).getTime()).toBe(0);
    expect(ticksToDate(639261171192014848).getUTCFullYear()).toBe(2026);
  });
});

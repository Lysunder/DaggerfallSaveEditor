// Daggerfall calendar helpers, matching DFU's DaggerfallDateTime (Assets/Scripts/Utility/DaggerfallDateTime.cs):
// 60-second minutes, 60-minute hours, 24-hour days, 30-day months, 12-month years, no epoch offset.

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
export const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
export const SECONDS_PER_MONTH = 30 * SECONDS_PER_DAY;
export const SECONDS_PER_YEAR = 12 * SECONDS_PER_MONTH;

export const MONTH_NAMES = [
  'Morning Star', "Sun's Dawn", 'First Seed', "Rain's Hand", 'Second Seed', 'Midyear',
  "Sun's Height", 'Last Seed', 'Hearthfire', 'Frostfall', "Sun's Dusk", 'Evening Star',
];

/** Zero-based month and day, as DFU stores them. */
export interface DaggerfallDate {
  Year: number;
  Month: number;
  Day: number;
  Hour?: number;
  Minute?: number;
}

export const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
};

/** DaggerfallDateTime.FromSeconds. */
export const gameTimeToDate = (seconds: number): Required<DaggerfallDate> => {
  const days = Math.floor(seconds / SECONDS_PER_DAY);
  const dayClock = seconds % SECONDS_PER_DAY;
  return {
    Year: Math.floor(days / 360),
    Month: Math.floor((days % 360) / 30),
    Day: days % 30,
    Hour: Math.floor(dayClock / SECONDS_PER_HOUR),
    Minute: Math.floor((dayClock % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
  };
};

/** "14th of Last Seed, 3E405", optionally with the time of day. */
export const formatDaggerfallDate = (date: DaggerfallDate, withTime = false) => {
  const day = `${ordinal(date.Day + 1)} of ${MONTH_NAMES[date.Month] ?? '?'}, 3E${date.Year}`;
  if (!withTime || date.Hour === undefined) return day;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${day}, ${pad(date.Hour)}:${pad(date.Minute ?? 0)}`;
};

export const formatGameTime = (seconds: number, withTime = false) => formatDaggerfallDate(gameTimeToDate(seconds), withTime);

/** .NET DateTime.Ticks (100 ns since 0001-01-01) to a JS Date. Precision lost in JSON parsing is well under a second. */
const TICKS_AT_UNIX_EPOCH = 621355968000000000;
export const ticksToDate = (ticks: number) => new Date((ticks - TICKS_AT_UNIX_EPOCH) / 10000);

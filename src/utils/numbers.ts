// DFU stores most of these fields as C# ints, and a value outside that range can't be loaded.
export const INT32_MAX = 2147483647;

/** Clamps to [min, max] and drops any fraction; NaN becomes min. */
export const clampInt = (value: number, min = 0, max = INT32_MAX) =>
  Number.isNaN(value) ? min : Math.max(min, Math.min(max, Math.trunc(value)));

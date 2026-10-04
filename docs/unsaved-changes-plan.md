# Plan: Unsaved-Changes Indicator and Change List

Show when the loaded save has edits that haven't been written, list exactly what changed (old → new) before saving, and warn before those edits are lost by opening another save or closing the app.

Why: the editor rewrites the whole `SaveData.txt` (and `FactionData.txt`) on every save. Today there's no way to see what an edit session changed, **Save** is enabled even with no changes, and opening another save or closing the window silently discards edits.

## How change tracking works

The store uses Zustand with Immer, which makes this cheap:

- **The loaded object is a baseline for free.** `loadSaveData` puts the parsed save into the store unchanged. Immer never mutates it: every edit produces a new root object, and untouched branches keep their original references. So keeping a reference to the object at load time costs no memory or copying.
- **Untouched data is shared.** Checked with the project's Immer version:
  - an edit that assigns an identical value returns the same object;
  - after changing one item, every other branch, and every other item in the same array, is still `===` the baseline's.
- **"Has anything changed?" is one comparison:** `saveData !== baselineSaveData`. That can over-report, for example when a value is edited and then typed back to what it was. It can also happen because `updateItem` builds a new item object with a spread even when nothing differs. So the dirty flag comes from the diff below being non-empty, not from the reference check alone. The reference check is a fast path for the clean case.

### Store changes (`src/store/useSaveStore.ts`)

- New fields `baselineSaveData` and `baselineFactionData`. Set them in `loadSaveData`, and clear them in `reset`.
- New action `markSaved()`: sets both baselines to the current `saveData` / `factionData`. Called after `fs:saveData` succeeds.
- New action `discardChanges()`: sets `saveData` / `factionData` back to the baselines.
- `QuestData`, `NotebookData` and `SaveInfo` are read-only, so they aren't tracked.

## The diff

New pure module `src/utils/saveDiff.ts`, with tests:

- `diffSave(before, after)` walks both trees together and returns a list of changes: `{ path, kind: 'changed' | 'added' | 'removed', before, after }`.
- It skips any pair of values that are `===`. Thanks to structural sharing, it only visits the branches that were edited, even for a 1–2 MB save.
- **Arrays of records are matched by identity, not by position.** Deleting one item would otherwise shift every later index and report dozens of false changes. Identity keys:

  | Array | Key |
  |---|---|
  | `playerEntity.items`, `playerEntity.wagonItems` | `uid` |
  | `playerEntity.globalVars` | `name` |
  | `bankAccounts` | `regionIndex` |
  | `playerData.guildMemberships`, `factionData.factionDict` | `Key` |

  Other arrays (e.g. `equipTable`) are compared by position.
- **Added and removed records are reported once, as a whole.** A deleted item is one "Removed: Silver Longsword" entry, not one per field.
- **Equipment slots follow their item.** Deleting an item also zeroes its slots in `equipTable`. Those slot changes are folded into the item's "Removed" entry, not listed separately, so the two can't be reverted independently and leave a slot pointing at a missing item.
- **Type changes count as changes.** A value that changes type (say `"Rain"` → `4`) is listed like any other change. The editor no longer writes enums as numbers (see "Enum values" below), but a diff that hides type changes could hide a real problem.
- **Each change has a structured path**, not just a string. Segments are a property name, an array index, or a keyed record (`{ key: 'uid', value: 33586189 }`). The same path drives both the label and the revert.

## Enum values

Resolved while writing this plan; the fix is already in the code.

DFU saves enums with FullSerializer as the C# member name, and reads them back with an exact, case-sensitive match. I confirmed this by running DFU's own `FullSerializer - Unity.dll` enum converter:

| Value | Result |
|---|---|
| `"Overcast"`, `"Iron,Steel"`, `""`, and numbers | read |
| `"overcast"`, `"Over cast"` | fail |
| `"Iron, Steel"` (comma and space) | fail |

DFU loads `SaveData.txt` with `AssertSuccessWithoutWarnings()`, so any one of these failures stops the whole save loading.

The editor now writes enums the way the game does. The names live in `src/data/dfuEnums.ts`, with tests:
- **Career flags** (forbidden materials, shields, armors, proficiencies): joined with a bare comma, in declaration order. The editor used to write `', '`, so a class with two forbidden materials produced a save DFU couldn't load.
- **Weather and world context:** written as names (`"Rain"`, `"Exterior"`), not numbers.
- **Building type:** a dropdown of `DFLocation.BuildingTypes` names instead of free text.
- **Building quality:** whole numbers only; it's a C# `int`.
- **Repair on load:** loading a save that an older version damaged fixes the unreadable career flags and says so; saving writes the fix. In the change list these show as **Repaired** and have no **Revert**, since reverting would bring the unloadable value back. The store keeps the repaired paths so the list can mark them.

`diffFaction(before, after)` works the same way for `FactionData.txt`.

## Human-readable labels

`src/utils/changeLabels.ts` turns a change path into a section and a label, using a small table of path patterns that match the editor's sections.

| Path pattern | Section | Label example |
|---|---|---|
| `playerData.playerEntity.stats.<name>` | Stats & Skills | "Strength: 55 → 70" |
| `playerData.playerEntity.skills.<name>` | Stats & Skills | "Long Blade: 32 → 50" |
| `playerData.playerEntity.careerTemplate.<field>` | Career & Advantages | "Acute Hearing: off → on" |
| `playerData.playerEntity.items[uid=…].<field>` | Inventory | "Silver Longsword – condition: 120 → 480" |
| `playerData.playerEntity.wagonItems[…]` | Wagon | same shape as Inventory |
| `playerData.playerEntity.goldPieces`, `bankAccounts[regionIndex=…]` | Finances | "Gold: 150 → 5000", "Bank (Daggerfall) – balance: 0 → 1000" |
| `playerData.playerEntity.reputation*`, `guildMemberships[…]`, `factionDict[…].rep` | Factions & Reputation | "Mages Guild rank: 2 → 5" |
| `playerData.playerEntity.globalVars[name=…]` | Quest Flags | "LiftedCurse: off → on" |
| `playerData.playerPosition.*`, `dateAndTime.gameTime` | Location & Time | "In-game time: 22nd of Last Seed, 3E405, 13:30 → 23rd …" |
| `playerData.playerEntity.<field>` (name, level, health…) | Character | "Level: 5 → 6" |
| anything else | Other | the raw path, e.g. `playerData.playerEntity.foo: 1 → 2` |

Formatting rules:
- Booleans show as on/off.
- Game time uses `formatGameTime`.
- Item and faction labels use the record's own name (`shortName`, faction `name`).
- Bank regions use the region name if the editor has it, otherwise "region 17".
- Split camelCase field names into words ("AcuteHearing" → "Acute Hearing"), as the existing sections already do.
- Long values (objects, arrays) are summarised ("3 fields changed") rather than dumped.

## UI

- **Toolbar:** when there are changes, the **Save** button gets a badge with the change count. A "● Unsaved changes" chip appears next to "Editing: Lys – QuickSave". Clicking the chip opens the change list. **Save** is disabled when there are no changes.
- **Window title:** prefix it with `*` while dirty ("* Daggerfall Unity Save Editor"), the usual desktop convention.
- **Change list dialog** (`src/components/ChangeListDialog.tsx`):
  - changes grouped by section, each showing label, old value → new value;
  - a count per section and in total;
  - a **Revert** button on each change (see "Per-change revert" below);
  - actions: **Save**, **Discard all changes** (with a confirmation) and **Close**.
- **Saving:** **Save** writes immediately, as today. Showing the list before every save would add a click to every edit session. Reviewing is one click away on the chip.
- **After saving:** `markSaved()` clears the indicator. The success notification says how many changes were written.

## Per-change revert

A store action `revertChange(change)` puts one change back to how it was at load (or at the last save). Like every other edit, it goes through Immer. The reverted row disappears from the list, because the diff no longer finds a difference there.

- **Changed value:** walk the change's path in the draft, resolving keyed segments by key, not position, and set the value back to `before`.
- **Added record** (e.g. an item added once the add-item feature exists): remove it from its array by key.
- **Removed record** (e.g. a deleted item):
  - Re-insert the baseline record next to the baseline record that preceded it and is still present. If there is none, insert it at the start. Its position in the inventory is preserved even after other items were deleted or added.
  - For items, also restore the `equipTable` slots that held its `uid` in the baseline, provided those slots are still empty. If a slot now holds a different item, leave it and say so in the notification.
- **Repaired values** have no **Revert**.
- **Several changes to one record:** when one record has several changed fields (e.g. an item's condition and stack count), each is its own row and can be reverted separately. The record's row header also gets **Revert all** for that record.
- **Order doesn't matter.** Reverting only ever restores baseline values, so reverts can be done in any order and are unaffected by reverting others.

Reverting doesn't have its own undo. Re-doing the edit in the section it came from has the same effect.

## Warnings before losing edits

- **Opening another save** (file dialog, save browser, or the **Saves** dialog). When dirty, `useSaveLoader` shows a confirmation first: "You have N unsaved changes to Lys – QuickSave. Discard them and open another save?" It has **Save first**, **Discard** and **Cancel**. **Save first** saves, then continues opening.
- **Closing the window or quitting.** Use Electron's standard pattern for this; no extra IPC is needed:
  - The renderer sets a `beforeunload` handler that cancels unload while dirty (`event.returnValue = false`).
  - In the main process, `win.webContents.on('will-prevent-unload', …)` fires when that happens. It shows a native `dialog.showMessageBoxSync` with **Quit without saving** and **Cancel**. Calling `event.preventDefault()` there lets the window close.
  - Saving from this dialog isn't offered. The renderer is mid-unload, and a save can fail. The user cancels, saves, then quits.
- **Dev reloads.** Vite's hot-reload triggers the same `beforeunload`. That's acceptable, and it even protects edits during development.

## Only write what changed

With a diff available, `fs:saveData` can skip unchanged files. Today it rewrites and backs up `FactionData.txt` on every save, even if only `SaveData.txt` changed. The renderer passes `factionData` only when `diffFaction` is non-empty. This produces fewer `bak_` files and leaves untouched files byte-for-byte as DFU wrote them.

## Implementation steps

1. `src/utils/saveDiff.ts` and `src/utils/saveDiff.test.ts`. Test cases:
   - edit a stat;
   - edit and revert (empty diff);
   - a spread-with-no-change item (empty diff);
   - delete the middle item (one "removed" entry, with its `equipTable` slots folded in);
   - change the rep of one faction in a large `factionDict`;
   - a type change (`"Rain"` → 4);
   - identical inputs.
2. `src/utils/changeLabels.ts` and tests: one case per row of the label table, plus the fallback.
3. `src/utils/revertChange.ts`: applies a revert to an Immer draft, with tests.
   - one test per kind (changed, added, removed);
   - re-inserting a removed item between surviving neighbours, and at the start;
   - restoring equipment slots, and leaving a slot that's been reused;
   - reverting changes in different orders gives the same result;
   - after reverting every change, the diff is empty.
4. Store: baselines, `repairedPaths`, `markSaved`, `discardChanges`, `revertChange`, and a `useUnsavedChanges()` hook. The hook returns the memoised `changes`, `count` and `isDirty`, recomputing only when `saveData` / `factionData` or the baselines change. `useSaveLoader` records the repair paths it applies.
5. `MainLayout`: badge, chip, disabled **Save**, window title, `beforeunload` handler, and the change count in the save notification. Pass `factionData` only when it changed.
6. `ChangeListDialog.tsx`, with per-row **Revert**, per-record **Revert all**, and **Repaired** rows without a revert.
7. `useSaveLoader`: the discard/save-first confirmation before loading.
8. `electron/main.ts`: the `will-prevent-unload` handler.
9. `Feature.md` entry and changelog. Update `CLAUDE.md` (the baselines, and "use the diff, not reference equality, for dirty state").

## Verification

- **Unit tests:** as listed in steps 1–2, including a performance check. Diffing a 1.5 MB save with a single edit should take a few milliseconds, because unchanged branches are skipped by reference.
- **In the app**, with a real save:
  - Change a stat, a skill, an item's condition, delete an item, toggle a quest flag, change a faction rep and shift the time. The list shows each once, in the right section, with correct old/new values.
  - Change a value and change it back; the indicator clears.
  - **Save**: the indicator clears, and the file on disk contains the edits. If only `SaveData` was edited, no new `bak_FactionData` file is created.
  - **Discard all changes** restores every edited value in the UI.
  - **Revert** on single rows: a stat goes back, and a deleted equipped item comes back in its old inventory position and slot. Reverting everything one by one clears the indicator.
  - A save with a `", "` career flag loads with the repair notice. The change list shows **Repaired** with no revert, and after saving, DFU loads the save.
  - Opening another save while dirty asks first. **Cancel** keeps you on the current save with edits intact. **Save first** writes, then opens.
  - Closing the window while dirty shows the native dialog. **Cancel** keeps the app open with edits intact; **Quit without saving** closes it.
- `npm test`, `npm run build`, `npm run lint`.

## Decisions

- **Per-change revert:** in scope; see "Per-change revert".
- **Enum values:** written the way DFU writes and reads them; see "Enum values". Already implemented.

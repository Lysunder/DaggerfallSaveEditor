# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Electron desktop app for editing **Daggerfall Unity** (DFU) save files (`SaveData.txt` and the sibling `FactionData.txt`, both JSON despite the `.txt` extension). Stack: Electron + React 19 + TypeScript + Vite + MUI + Zustand (with Immer middleware). Sample saves for manual testing live in `example/`, which is git-ignored and local only. Design notes and plans for larger features are in `docs/` (`feature-ideas.md` tracks what's done and what's next).

The DFU source is the reference for save formats; the plans in `docs/` cite the relevant files.

## Commands

- `npm run dev` — Vite dev server; `vite-plugin-electron` also builds `electron/` and launches Electron with DevTools open.
- `npm run build` — `tsc -b` type-check (renderer, `electron/` and tests), then Vite build to `dist/` (renderer) and `dist-electron/` (main + preload).
- `npm run build:dist` — package installers with electron-builder into `release/` (run `npm run build` first; add `-- -p never` to skip publishing). `npm run build:pack` produces an unpacked dir instead. Each OS can only package its own targets.
- `npm run lint` — oxlint (config in `.oxlintrc.json`; `react/rules-of-hooks` is an error).
- `npm test` — Vitest (`vitest.config.mts`, separate from `vite.config.ts` so the Electron plugin isn't loaded). Tests live next to the code as `*.test.ts` in `electron/` and `src/`; shared save fixtures are in `src/utils/testFixtures.ts`. Run one file with `npx vitest run electron/saveLocations.test.ts`, or one test with `-t "<name>"`.

Verify changes with `npm test`, `npm run build` and `npm run lint`, and by loading a save (e.g. a local `example/SaveData.txt`) in the running app.

CI (`.github/workflows/build.yml`) runs the tests, then builds on Windows/Linux/macOS for pushes to `master` and `features`, any pushed tag (release tags are plain versions like `1.0.9`; `v*` also works), and manual runs (`workflow_dispatch`); build outputs are uploaded as run artifacts. Tag builds also upload to a draft GitHub Release. Installer names come from the version in `package.json`, not the tag, so tag the commit that has the matching version. User-facing changes are recorded in `Feature.md` (feature list + changelog). macOS builds are ad-hoc signed (`identity: '-'`, hardened runtime off) and not notarized; electron-builder packages only `dist/` and `dist-electron/`, so renderer libraries are `devDependencies`.

## Architecture

**Main process (`electron/main.ts`)** owns all file I/O via IPC handlers:
- `dialog:openSaveData` — opens a file dialog and calls `loadSaveFolder()`, which parses `SaveData.txt` and tries to load the sibling `FactionData.txt`, `QuestData.txt`, `NotebookData.txt` and `SaveInfo.txt` (each silently `null` if missing). Loading records the path in `writableSaveFiles`.
- `fs:saveData` — only writes a `SaveData.txt` that was opened this session (`writableSaveFiles`), and only the files passed (`data` is null / `factionData` omitted when unchanged). Each file is first copied to the next free `bak_<name>.<n><ext>`; if the backup fails the write is aborted. Writes are atomic (`<file>.tmp`, then rename) as 2-space-indented JSON.
- `will-prevent-unload` — the renderer blocks unload while there are unsaved changes; the main process asks "Quit without saving?" natively.
- `app:copyText` — writes an error report to the clipboard. `render-process-gone` and `unresponsive` show native dialogs (copy report / reload / quit), since a dead or hung renderer can't show anything itself.
- `saves:*` — the save browser: `scan`, `addInstall`, `addFolder`, `removeLocation`, `screenshot`, `load`. `screenshot` and `load` only accept `SAVE<n>` folders directly inside a resolved save location (`isSaveFolderInRoots`).

`QuestData.txt`, `NotebookData.txt` and `SaveInfo.txt` are **read-only**: they are never written back (`QuestData.txt` uses FullSerializer `$type`/`$ref` annotations that are unsafe to round-trip).

**Save locations (`electron/saveLocations.ts`)** mirror how DFU finds its saves (`SaveLoadManager.GetUnitySavePath`): `MyDaggerfallUnitySavePath` from `settings*.ini`, else `<persistent data>/Saves`. Portable installs (a `Portable.txt` in the install folder) use `<install>/PortableAppdata` and resolve a relative save path against the install folder. The editor can't discover portable installs itself; the user adds them, and they're stored in the editor's own `userData/settings.json` and re-resolved on every scan. These functions are Electron-free and covered by `saveLocations.test.ts`. See `docs/save-slot-browser-plan.md`. Types shared with the renderer are in `electron/saveTypes.ts`.

**Preload (`electron/preload.ts`)** exposes only the app's own calls on `window.ipcRenderer` (`openSaveData`, `saveData`, and the save browser calls) — there is no generic `invoke`/`send` passthrough. The window runs with `contextIsolation`, `sandbox` and no `nodeIntegration`. To add an IPC channel, add the handler in `main.ts`, the call in `preload.ts`, and its type in `src/global.d.ts`.

**Renderer state (`src/store/useSaveStore.ts`)** is the single source of truth: the whole parsed save (`saveData`), the faction file (`factionData`), `questData`, `notebookData`, `saveInfo`, and `currentFilePath`. `loadSaveData` takes a whole `LoadedSave`; use `useSaveLoader()` (`src/hooks/`) to open a file or save slot (it asks before discarding unsaved changes and repairs enum values DFU can't read) and `useSaveWriter()` to save. Every edit goes through a named store action that mutates the Immer draft in place.

The save is round-tripped whole, so actions must only change the targeted fields and preserve every unknown property — the TypeScript interfaces are partial and use `[key: string]: any` index signatures for this reason. Key data locations:
- `saveData.playerData.playerEntity` — name/level/vitals, `stats`, `skills`, `careerTemplate` (class definition: primary/major/minor skills, tolerances, advantages, flag strings), `items`, `wagonItems`, `equipTable` (item UIDs; deleting an inventory item zeroes its slot), `globalVars`, `reputation*` fields, `regionData` (62 per-region records, indexed by region: `LegalRep` -100..100 and `SeverePunishmentFlags` 1 = banished, 2 = sentenced to death) and `crimeCommitted` (a `Crimes` name, `"None"` when clear). Crime helpers are in `src/data/legal.ts`; region names in `src/data/regions.ts` follow DFU's `MapsFile.RegionNames`.
- `saveData.playerData.playerPosition`, `guildMemberships` / `vampireMemberships` (keyed by DFU's `GuildGroups` value, not faction id — convert with `src/data/guilds.ts`; these are C# dictionaries, which FullSerializer writes as an array of `{ Key, Value }` but as `{}` when empty, so read them with `membershipList`); `saveData.bankAccounts`, `bankDeeds`, `dateAndTime.gameTime` (seconds on DFU's calendar; convert with `src/utils/daggerfallDate.ts`).
- `factionData.factionDict` — array of `{ Key, Value: { id, name, rep, ... } }`.
- `questData.quests` — quests DFU is currently tracking. Finished quests are removed a week after they end, so `src/utils/mainQuestProgress.ts` infers main quest progress from the backbone quest `S0000999`, completed `StartQuest` actions, globals and `notebookData.finishedQuestEntries`. See `docs/main-quest-progress-plan.md`; quest definitions live in `src/data/mainQuest.ts`.

**Values DFU can load**: DFU deserializes `SaveData.txt` with FullSerializer and `AssertSuccessWithoutWarnings()`, so one unreadable field makes it refuse the whole save.
- Enums are stored as the exact C# member name, and multi-flag values joined with a bare comma (`"Iron,Steel"`); wrong case or `"Iron, Steel"` fails. Use the names in `src/data/dfuEnums.ts`.
- Integer fields must stay integers in C# `int` range; use `clampInt` from `src/utils/numbers.ts`. Never write `NaN` (it becomes `null`) or `null` — ignore empty or partial input instead.

**Unsaved changes**: the store keeps `baselineSaveData` / `baselineFactionData` (as loaded or last saved; Immer shares untouched branches, so they're free). `src/utils/saveDiff.ts` diffs current against baseline, skipping `===` branches and matching record arrays by key (items by `uid`, factions by `Key`, …; it falls back to position if keys aren't unique). `useUnsavedChanges()` exposes the result. Derive dirty state from the diff, not reference equality (an edit typed back, or `updateItem`'s spread, creates new objects with no real change). `markSaved` takes the snapshot that was written, so edits made during a write stay unsaved. `changeLabels.ts` turns changes into the change list's text, and `revertChange.ts` undoes one (the store's `revertChange`). Load-time repairs are listed in `repairs`: shown as "Repaired", not revertible, and kept by `discardChanges`. See `docs/unsaved-changes-plan.md`.

**UI**: `src/App.tsx` sets a dark MUI theme and a `HashRouter` (hash routing is required for `file://` loading in the packaged app). `src/layout/MainLayout.tsx` holds the toolbar (unsaved-changes chip, Saves, Open file…, Save) and the save browser and change list dialogs. Confirmation dialogs go through `useConfirm()` (`src/context/confirm.ts`). `src/pages/Home.tsx` shows `SaveBrowser` when no save is loaded, otherwise the character sheet, composed of self-contained section components in `src/components/` — each reads `saveData` from the store, returns `null` if no save is loaded, and calls store actions directly. User feedback goes through `useNotification()` from `src/context/NotificationContext.tsx`.

**Error reporting** (`src/components/errors/`, `src/utils/errorReport.ts`): an `ErrorBoundary` wraps the whole app (`variant="app"`), the page outlet, the dialogs and each character-sheet section in `Home.tsx` (`SECTIONS`), so a render error shows a copyable report instead of a blank window. `GlobalErrorHandler` catches errors outside rendering (`error` / `unhandledrejection`) and offers the same report. Reports contain no save data and redact user names from paths. New sections should be added to `SECTIONS` so they get their own boundary. The renderer bundle is built unminified (`vite.config.ts`) so stack traces in reports name real functions. The app version shown in the title comes from `package.json` via Vite's `define` (`__APP_VERSION__`).

To add a new editable field: add (or extend) the type and an action in `useSaveStore.ts`, then use it from a component in `src/components/` and add that component to `SECTIONS` in `Home.tsx`. If the change list should describe it nicely, add a pattern in `changeLabels.ts`.

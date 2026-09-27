# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Electron desktop app for editing **Daggerfall Unity** save files (`SaveData.txt` and the sibling `FactionData.txt`, both JSON despite the `.txt` extension). Stack: Electron + React 19 + TypeScript + Vite + MUI + Zustand (with Immer middleware). Sample saves for manual testing live in `example/`.

## Commands

- `npm run dev` — Vite dev server; `vite-plugin-electron` also builds `electron/` and launches Electron with DevTools open.
- `npm run build` — `tsc -b` type-check, then Vite build to `dist/` (renderer) and `dist-electron/` (main + preload).
- `npm run build:dist` — package installers with electron-builder into `release/` (run `npm run build` first). `npm run build:pack` produces an unpacked dir instead.
- `npm run lint` — oxlint (config in `.oxlintrc.json`; `react/rules-of-hooks` is an error).

There is no test suite. Verify changes with `npm run build` (type-check) and `npm run lint`, and by loading `example/SaveData.txt` in the running app.

CI (`.github/workflows/build.yml`) builds on Windows/Linux/macOS for pushes to `master` and tags; tag builds upload to a draft GitHub Release. The version in `package.json` drives release naming; user-facing changes are recorded in `Feature.md` (feature list + changelog).

## Architecture

**Main process (`electron/main.ts`)** owns all file I/O via two IPC handlers:
- `dialog:openSaveData` — opens a file dialog, parses the chosen save as JSON, and also tries to load `FactionData.txt` from the same directory (silently `null` if missing).
- `fs:saveData` — before writing, copies the existing file to the next free `bak_<name>.<n><ext>` backup; writes both `SaveData` and (if loaded) `FactionData.txt` as 2-space-indented JSON.

**Preload (`electron/preload.ts`)** exposes `window.ipcRenderer` with generic `on/off/send/invoke` plus `openSaveData()` / `saveData()`. Types for this bridge are in `src/global.d.ts` — update both when adding an IPC channel.

**Renderer state (`src/store/useSaveStore.ts`)** is the single source of truth: the whole parsed save (`saveData`), the faction file (`factionData`), and `currentFilePath`. Every edit goes through a named store action that mutates the Immer draft in place. The save is round-tripped whole, so actions must only change the targeted fields and preserve every unknown property — the TypeScript interfaces are partial and use `[key: string]: any` index signatures for this reason. Key data locations:
- `saveData.playerData.playerEntity` — name/level/vitals, `stats`, `skills`, `careerTemplate` (class definition: primary/major/minor skills, tolerances, advantages, bitflag strings), `items`, `wagonItems`, `equipTable` (item UIDs; deleting an inventory item zeroes its slot), `globalVars`, `reputation*` fields.
- `saveData.playerData.playerPosition`, `guildMemberships`; `saveData.bankAccounts`, `bankDeeds`, `dateAndTime.gameTime`.
- `factionData.factionDict` — array of `{ Key, Value: { id, name, rep, ... } }`.

**UI**: `src/App.tsx` sets a dark MUI theme and a `HashRouter` (hash routing is required for `file://` loading in the packaged app). `src/layout/MainLayout.tsx` holds the Open/Save toolbar that calls the IPC bridge. `src/pages/Home.tsx` is the character sheet, composed of self-contained section components in `src/components/` — each reads `saveData` from the store, returns `null` if no save is loaded, and calls store actions directly. User feedback goes through `useNotification()` from `src/context/NotificationContext.tsx`.

To add a new editable field: add (or extend) the type and an action in `useSaveStore.ts`, then use it from a component in `src/components/` and mount that component in `Home.tsx`.

# Plan: Save Slot Browser

> **Status: shipped in 1.0.8.** This is the original design. Differences in the shipped version: the resolution helpers are `resolveSaveRoot`, `resolvePortable`, `resolveFolder` and `resolveLocations` (there is no `resolveRegular`), and a single `saves:scan` channel replaces `saves:locations` and `saves:list`. Since 1.0.9, `fs:saveData` also only writes save files opened in the current session. IPC channels are documented in `CLAUDE.md`. The sample save mentioned below lives in a gitignored `example/` folder and is not in the repo.

Replace "find `SaveData.txt` in a file dialog" with a list of the player's Daggerfall Unity saves: character, save name, in-game date, real date saved and screenshot. Clicking one loads it. The file dialog stays as a fallback.

Sources: Daggerfall Unity source at `E:\Projects\daggerfall-unity`:
- `Assets/Scripts/Game/Serialization/SaveLoadManager.cs`: save folder names, enumeration, save path resolution
- `Assets/Scripts/Game/Serialization/SerializableGameObject.cs`: `SaveInfo_v1`
- `Assets/Scripts/DaggerfallUnityApplication.cs` and `Assets/Scripts/SettingsManager.cs`: persistent data path, portable installs, `settings.ini`
- `Assets/Scripts/Utility/DaggerfallDateTime.cs`: game time to calendar date

## How DFU stores saves

Each save is a folder named `SAVE<n>` (e.g. `SAVE0`, `SAVE12`) inside the saves root. DFU only treats a folder as a save if it contains `SaveInfo.txt` (`EnumerateSaveFolders`). A folder holds `SaveInfo.txt`, `SaveData.txt`, `FactionData.txt`, `QuestData.txt`, `NotebookData.txt`, `Screenshot.jpg`, `bio.txt` and several other files.

`SaveInfo.txt` is small, so the list can be built without parsing the 1–2 MB `SaveData.txt`:

```json
{
  "saveVersion": 1,
  "saveName": "QuickSave",
  "characterName": "Lys",
  "dateAndTime": { "gameTime": 12617127056, "realTime": 639261171192014862, "$version": "v1" },
  "dfuVersion": "1.1.1",
  "$version": "v1"
}
```

- `saveName`: the name the player typed, or `QuickSave` / `AutoSave`.
- `gameTime`: seconds on DFU's calendar. `DaggerfallDateTime.FromSeconds` uses 60-second minutes, 24-hour days, 30-day months and 12-month years with no offset. So year = `floor(gameTime / 31104000)` (the sample gives 405, i.e. 3E405). Month and day follow the same way. Reuse the month names already in `mainQuestProgress.ts`, moved to a shared `src/utils/daggerfallDate.ts`.
- `realTime`: .NET `DateTime.Ticks` (100 ns since 0001-01-01). The JS date is `(realTime − 621355968000000000) / 10000` ms. Use `BigInt` for the subtraction, because the value is bigger than `Number.MAX_SAFE_INTEGER`. JSON parsing already rounds it, but the error is well under a second, so parsing it as a number and then subtracting is acceptable.

### Where the saves root is

DFU resolves it in `GetUnitySavePath`:

1. `MyDaggerfallUnitySavePath` under `[Daggerfall]` in `settings.ini`, if set and the folder exists.
2. Otherwise `<persistent data path>/Saves`, created if missing.

`settings.ini` lives in the persistent data path. A distribution can rename it to `settings_<suffix>.ini` (`SettingsManager.SettingsName`); look for any `settings*.ini` there. What the persistent data path is depends on whether DFU runs as a regular or a portable install.

#### Regular install

The persistent data path is Unity's `Application.persistentDataPath` for company "Daggerfall Workshop", product "Daggerfall Unity":

| OS | Default saves root |
|---|---|
| Windows | `%USERPROFILE%\AppData\LocalLow\Daggerfall Workshop\Daggerfall Unity\Saves` |
| macOS | `~/Library/Application Support/Daggerfall Workshop/Daggerfall Unity/Saves` |
| Linux | `~/.config/unity3d/Daggerfall Workshop/Daggerfall Unity/Saves` |

A relative `MyDaggerfallUnitySavePath` is not resolved by DFU in this mode. `Directory.Exists` then resolves it against the process's working directory, which is normally the install folder. So treat it as relative to the install folder when the editor knows it; otherwise ignore it and say so.

#### Portable install

DFU runs in portable mode when a file named `Portable.txt` exists in its base directory (`AppDomain.CurrentDomain.BaseDirectory`, i.e. the install folder; `DaggerfallUnityApplication.IsPortableInstall`). Then:

- The persistent data path is `<install folder>/PortableAppdata`. `settings.ini` and DFU's `Player.log` live there.
- The default saves root is `<install folder>/PortableAppdata/Saves`.
- A relative `MyDaggerfallUnitySavePath` is resolved against the **install folder**, not `PortableAppdata` (`SettingsManager.LoadSettings` → `GetFullPath(BaseDirectory, …)`). DFU writes save paths inside the install folder back as relative paths, so a portable install with its own save folder typically has something like `MyDaggerfallUnitySavePath = Saves`, meaning `<install folder>/Saves`.
- If that folder doesn't exist, DFU falls back to `PortableAppdata/Saves`.

A portable install leaves nothing in the regular persistent data path, and there's no registry entry or log that records where it is. The editor can't find it on its own. The user points the editor at the DFU install folder once, and from then on the editor resolves the saves root from that folder every launch, the same way DFU does. It re-resolves rather than caching the final path, so a changed `settings.ini` is picked up.

The base directory by platform:
- **Windows and Linux:** the folder containing `DaggerfallUnity.exe` / `DaggerfallUnity.x86_64` and `DaggerfallUnity_Data`.
- **macOS:** `AppDomain.CurrentDomain.BaseDirectory` for a Unity app bundle isn't confirmed. If the user picks a `.app`, look for `Portable.txt` in the folder containing the bundle, `Contents/`, `Contents/MacOS/` and `Contents/Resources/Data/Managed/`, and use whichever has it. This needs checking on a real Mac.

#### More than one install

A player can have both a regular install and one or more portable installs, each with its own saves. The editor keeps a list of **save locations**, not just one root:
- the regular location (auto-detected)
- each portable install the user has added
- any plain folder the user has added

The browser shows all of them together, labelled by location.

## Behaviour

- **First launch:** detect the regular location. If it has saves, show the browser straight away. If not, show a prompt: "Couldn't find your Daggerfall Unity saves. If you use a portable install, point the editor at it." It has **Add DFU install folder…**, **Add saves folder…** and **Open a save file…** buttons.
- **Adding a DFU install folder:** check for `Portable.txt` as described above.
  - **Portable:** resolve the saves root from its `PortableAppdata/settings*.ini` and add the install as a location labelled "Portable – <folder name>".
  - **Not portable:** explain that this install keeps its saves in the regular location. Still remember the folder, since it's needed to resolve a relative `MyDaggerfallUnitySavePath` for the regular install.
- **Adding a saves folder:** accept a saves root directly, a persistent data folder (it contains `Saves` and `settings.ini`), or a `PortableAppdata` folder. If the choice turns out to be inside a portable install (a parent folder has `Portable.txt`), add it as that install instead, so settings changes are followed.
- **Remembered settings:** store the locations in the editor's own settings file (`app.getPath('userData')/settings.json`), not DFU's. Each entry records its type (`regular`, `portable` with its install folder, or `folder`). The browser has a **Locations** menu to add or remove them.
- **Missing locations:** if a remembered location no longer resolves (install moved or deleted), show it as a warning row with a **Remove** action, not an error dialog.
- **The list:** grouped by character (like DFU's own load screen, `EnumerateCharacterSaves`), newest first by `realTime`. Each row shows:
  - screenshot thumbnail
  - save name
  - in-game date ("14th of Last Seed, 3E405")
  - real date and time saved
  - DFU version
  - folder name, as secondary text
  - the location label ("Regular", "Portable – DFU 1.1.1"), shown only when there's more than one location
- **Location filter:** when several locations exist, a filter chip per location.
- **Search and refresh:** a search box filters by character or save name. **Refresh** rescans the folder.
- **Loading a save:** clicking a save loads it exactly as the file dialog does today: `SaveData.txt`, `FactionData.txt`, `QuestData.txt` and `NotebookData.txt` from that folder. The browser closes, and the current save's name shows in the toolbar.
- **Unreadable saves:** a `SaveInfo.txt` that fails to parse shows as a greyed-out row with the folder name and the error, instead of being hidden, so the user knows it's there.
- **DFU is running:** the game only reads a save when you load it, but it overwrites `QuickSave` and `AutoSave` slots on its own. The browser should show a short note: edit saves while DFU is closed, or at least reload the save in DFU after editing.

## Implementation steps

1. **Main process (`electron/main.ts`)**
   - Pull the body of `dialog:openSaveData` into `loadSaveFolder(saveDataPath)`, so the dialog and the browser share the loading code.
   - `electron/saveLocations.ts`: the resolution rules as plain functions, kept apart from the IPC code so they're easy to test.
     - `resolveRegular(installDir?)`
     - `resolvePortable(installDir)`
     - `findInstallBaseDir(pickedPath)` (handles `.app` bundles)
     - `readSaveSetting(persistentDir)` (parses `settings*.ini` for `[Daggerfall] MyDaggerfallUnitySavePath`)
     
     Each returns `{ root, label, type, warning? }`.
   - `saves:locations`: loads the remembered locations plus the auto-detected regular one, resolves each, and returns them.
   - `saves:addInstall` / `saves:addFolder` / `saves:removeLocation`: folder pickers and edits to the remembered list.
   - `saves:list(roots)`: for each root, finds `SAVE<n>` folders containing `SaveInfo.txt`, reads each `SaveInfo.txt`, and returns `{ location, folder, index, info, error, hasScreenshot }[]`. Read the files in parallel; there can be dozens of saves.
   - `saves:screenshot(folder)`: returns `Screenshot.jpg` as a `data:image/jpeg;base64,…` URL, loaded lazily per row. The renderer can't load arbitrary `file://` images in dev mode, where the page is served from `http://localhost`. The screenshots are small JPEGs, so data URLs are fine.
   - `saves:load(folder)`: calls `loadSaveFolder(path.join(folder, 'SaveData.txt'))`.
   - Only accept folders inside one of the resolved saves roots in `saves:screenshot` and `saves:load`, so the renderer can't ask the main process to read arbitrary paths.
2. **Bridge:** add the calls to `electron/preload.ts` and their types to `src/global.d.ts`.
3. **Shared date helper:** `src/utils/daggerfallDate.ts` with `formatGameTime(seconds)` and `ticksToDate(realTime)`. Switch `mainQuestProgress.ts` to it, and use it for the raw game time in `LocationAndWorldData` while there.
4. **UI:** `src/components/SaveBrowser.tsx`. Show it on the Home page when no save is loaded, in place of today's "Please open a valid save" message, and in a dialog from a new **Saves** toolbar button in `MainLayout`. The existing **Open** button becomes **Open file…**.
5. **Store:** add a `saveInfo` field (from `SaveInfo.txt`) so the toolbar can show "Lys – QuickSave" instead of the full path.
6. **Docs:** a feature entry and changelog in `Feature.md`, and the new IPC channels in `CLAUDE.md`.

## Verification

- **Windows:** with DFU's default location, the browser opens on launch and lists every save. The in-game dates match DFU's load screen, and loading one gives the same result as opening its `SaveData.txt` through the file dialog.
- **Custom save path:** point `MyDaggerfallUnitySavePath` in the regular `settings.ini` at another folder, and check that the browser follows it.
- **Portable install:** add `Portable.txt` to a DFU install and run it once, so it creates `PortableAppdata`. Then add the install folder in the editor:
  - With no `MyDaggerfallUnitySavePath`, it resolves to `<install>/PortableAppdata/Saves`.
  - With `MyDaggerfallUnitySavePath = Saves`, it resolves to `<install>/Saves`, not `PortableAppdata/Saves`.
  - With a path to a folder that doesn't exist, it falls back to `PortableAppdata/Saves`, as DFU does.
  - Changing the setting and pressing **Refresh** picks up the new folder without re-adding the install.
  - Picking `PortableAppdata` or the `Saves` folder inside a portable install is recognised as that install.
  - Moving the install away turns it into a warning row with **Remove**.
  - With both a regular and a portable install, both sets of saves appear, labelled and filterable.
- **Resolution rules:** unit tests for `saveLocations.ts` against fixture folders built in a temp directory, covering each case above. These are the rules most likely to regress, and they don't need DFU installed.
- **Missing and broken data:** a save folder without `Screenshot.jpg` shows a placeholder. A corrupt `SaveInfo.txt` shows as an error row. A root with no saves shows an empty state.
- **Path safety:** `saves:load` and `saves:screenshot` reject folders outside the saves root.
- **macOS and Linux:** can't be tested locally. Confirm the default paths on a real machine. For macOS, also confirm where a portable app bundle expects `Portable.txt`, and ask a Mac user to check that the browser finds their saves.
- `npm run build` and `npm run lint`.

## Out of scope

- Renaming, copying or deleting saves. These are easy to add later, but deleting is irreversible, and a wrong copy could collide with DFU's slot numbering.
- Classic Daggerfall saves (`SAVE0`–`SAVE5` in the original game folder). DFU can import them, but they're a different binary format.

# Plan: Main Quest Progress

Add a read-only panel to the character sheet that shows how far the player is through Daggerfall's main quest. It shows each branch, which quests are done, active, invited, available or locked, and which faction's ending the save is heading toward.

Sources: Daggerfall Unity source at `E:\Projects\daggerfall-unity` (quest scripts in `Assets/StreamingAssets/Quests/`, serialization in `Assets/Scripts/Game/Serialization/SaveLoadManager.cs`, `Assets/Scripts/Game/Questing/` and `Assets/Scripts/Game/Player/PlayerNotebook.cs`), the [UESP Main Quest page](https://en.uesp.net/wiki/Daggerfall:Main_Quest), and the sample save in `example/`.

## How DFU stores main quest state

A save folder holds several JSON files. Four of them matter here:

| File | What's in it | Loaded by the editor today? |
|---|---|---|
| `SaveData.txt` | `playerData.playerEntity.globalVars`: 64 `{index, name, value}` flags. Several are main quest outcomes. Also `playerEntity.level`. | Yes |
| `QuestData.txt` | `quests[]`: every quest the QuestMachine is currently tracking (`questName`, `displayName`, `questComplete`, `questSuccess`, `questTombstoned`, `activeLogMessages`, `tasks[]`). | **No** |
| `NotebookData.txt` | `finishedQuestEntries`: the journal's finished-quest log. Each entry is an array of text lines. | **No** |
| `FactionData.txt` | Faction reputations. | Yes |

Completed quests don't stay in `QuestData.txt`. `QuestMachine` tombstones a quest when it completes and removes it one in-game week later (`QuestMachine.cs` ~L491–511). The sample save shows this: three main quest steps are finished, yet `QuestData.txt` only holds `S0000999` (backbone), `S0000977` (Curse of Daggerfall) and the active `S0000007` (The Werebeast). So finished quests have to be recovered from four durable signals.

### Parsing notes

- **Symbols** are serialized as `{"original": "_S.36_", "name": "S.36"}`. `name` drops the underscores.
- **Action type and parameters:** each action has a `type` (e.g. `DaggerfallWorkshop.Game.Questing.StartQuest`, with no `Actions` namespace, even though the C# class lives in `Questing/Actions/`), `isComplete`, an `actionSpecific` payload and a `debugSource` holding the original script line. Match on `type` and `actionSpecific`, not on `debugSource` text.
- **References:** FullSerializer writes shared objects once with a `"$id"` and later occurrences as `{"$ref": "<id>"}`. The sample has three `$ref`s, all inside quest resources and none in the task or action fields this feature reads. Still, treat any object that is only `{"$ref": …}` as unknown rather than crashing.

### 1. `StartQuest` actions (backbone and any other present quest)

When a `start quest N N` action runs, it sets `isComplete: true` and fills `actionSpecific.questName` with the started quest's ID (e.g. `"S0000007"`). Before that, `questName` is `""`. This is the most direct "quest X was started" signal. Scan **all** quests in `QuestData.txt` for completed `StartQuest` actions and collect their `questName`s; the start task symbols don't need to be hard-coded. In the sample, backbone tasks `S.36` → `S0000005` and `S.37` → `S0000007` are complete and the other five are `""`. Active branch quests carry their own `StartQuest` actions for the next quest in the chain (e.g. `S0000007` → `S0000012`), which covers the week between a quest finishing and being removed.

### 2. Other backbone `S0000999` task state

The backbone is protected (`IsProtectedQuest`) and stays in `QuestData.txt` for the whole main quest. A task's `triggered` flag is **not** durable: once a "start quest" task fires, it unsets its own questgiver task, its `when` condition goes false, and `triggered` reads `false` again. Use these instead:

- **`dropped: true` on the questgiver task** (`S.00`–`S.06`). The `unset` action calls `Task.Drop()`, which is one-way. This backs up signal 1: in the sample, `S.04` (Aubk-i) and `S.06` (Cyndassa) are dropped.
- **Level tasks `S.15`–`S.21`** (`level N completed`) stay triggered once the level is reached. Use these as the level gate instead of `playerEntity.level`, so an edited level doesn't unlock a branch that the game still considers locked.
- **Reputation tasks `S.08`–`S.14`** (`repute with X is at least 0`).
- **Letter tasks `S.45` (Lhotun) / `S.46` (Morgiah).** A completed `give pc _I.0N_` action means the invitation letter was delivered. The player has been invited but hasn't spoken to the questgiver yet.

### 3. Global variables

These are set by quest scripts and never removed. Not every quest sets one; see the graph below.

### 4. Notebook finished-quest log

`PlayerNotebook.AddFinishedQuest` writes an entry when any quest ends. The first line is a header like `"D:Mynisera's Letters completed at 01:50:54 03 Midyear 3E405:"`: the quest's DFU `displayName`, then `completed` (success) or `ended` (not success), then the date.

This is the **only** record of some steps. In the sample, Mynisera's Letters is finished but sets no global, and its start isn't recorded by the backbone (Concern for Nulfaga starts it). Caveats:
- Entries are keyed by display name, not quest ID. `_BRISIEN` has `displayName` "Lady Brisienna", and generic quests can share names.
- Header text is localized. Parse it with a regex that tolerates both words, and treat the notebook as supporting evidence only.
- The player can delete entries.
- Long entries are split, and continuation entries have no `D:` header (the sample has several). Skip any entry whose first line doesn't start with `D:`.
- `ended` doesn't always mean failed. The sample's "Lady Brisienna ended" is a normal finish, because that quest never sets success.

### 5. Later quests in a chain

If a quest is present in `QuestData.txt` (active or tombstoned), or a completed `StartQuest` action names it, every quest before it in the same chain must have succeeded, because each script starts the next quest only on success.

### Active quest details

For an active main quest, the panel can show the current journal entry. `activeLogMessages[]` gives `{stepID, messageID, dateTime}`, and `messages[]` has `{id, lines[]}`. Join the `lines` of each logged message. The text contains DFU macros:
- `%qdt` is the date the entry was logged (from the log entry's `dateTime`).
- `=<clock>_` (e.g. `=2mondung_`) is days remaining on a `Clock` resource: `resourceSpecific.remainingTimeInSeconds / 86400`, when `clockEnabled`. In the sample, that's about 134 days to kill the werebeast at Tristore Laboratory.
- Leave other macros as-is, or strip them.

Don't try to resolve people or places from `resources`. That needs DFU's macro engine and isn't needed for a progress view.

## Quest graph (from `start quest` calls in the DFU scripts)

Intro: `_TUTOR__` Privateer's Hold → starts `S0000977` Curse of Daggerfall (sets `LiftedCurse` when finished). `_BRISIEN` Instructions from the Empire (DFU name "Lady Brisienna", sets `MetLadyBrisienna`) → starts `S0000999` backbone.

The backbone opens seven branches. The level and task columns refer to backbone tasks.

| Branch (questgiver) | Level task | Start task | Chain | Required? | Globals set along the way |
|---|---|---|---|---|---|
| Prince Lhotun, Castle Sentinel | `S.15` (5) | `S.40` | `S0000001` Missing Prince → `S0000017` Painting the Truth → `S0000010` The Ancient Watcher | Yes | — (Missing Prince makes Medora available) |
| Medora | `S.17` (8) | `S.41` | `S0000003` Medora's Freedom → `S0000018` Dust of Restful Death → `S0000022` Lysandus' Revelation → `S0000015` Lysandus' Revenge → `S0000008` Who Gets the Totem → `S0000016` Journey to Aetherius | Yes | `MedoraGotHorn`, `LysandusSatisfied`, `MyniseraSatisfied`, `*GotTotem`, `*Ending` |
| Princess Morgiah, Castle Wayrest | `S.18` (3) | `S.42` | `S0000004` Morgiah's Wedding → `S0000021` Soul of a Lich | Yes | `MorgiahSatisfied`, `KingOfWormsSatisfied` |
| Cyndassa, Castle Daggerfall | `S.21` (5) | `S.37` | `S0000007` The Beast → `S0000012` Emperor's Courier → `S0000020` Orcish Emancipation → `S0000988` Mantella Revealed → `S0000009` Elysana's Betrayal | Yes (last two optional per UESP) | `MyniseraSatisfied` (Orcish Emancipation), `FinishedMantellanCrux` |
| Prince Helseth, Castle Wayrest | `S.16` (4) | `S.39` | `S0000002` Blackmail → `S0000011` Barenziah's Book | Optional | `ElysannaSatisfied`, `BarenziahSatisfied` |
| Queen Aubk-i, Castle Daggerfall | `S.19` (3) | `S.36` | `S0000005` Concern for Nulfaga → `S0000013` Mynisera's Letters | Optional | — (Mynisera's Letters only starts if Aubk-i reputation > 15) |
| Princess Elysana, Castle Wayrest | `S.20` (6) | `S.38` | `S0000006` Elysana's Robe | Optional | `ElysannaSatisfied` |

`S0000100`–`S0000107` are helper quests that the Totem and Nulfaga quests start. They are not shown as steps.

Ending: the backbone ends when `MyniseraSatisfied` and `LiftedCurse` are both set. The final outcome is whichever `*Ending` flag is true (Gothryd, King of Worms, Gortwog, Akorithi, Underking, Eadwyre, Brisienna). `*GotTotem` shows who currently holds the Totem.

Display names differ between the DFU scripts and UESP (for example "Lich's Soul" vs "Soul of a Lich", and "The Werebeast" vs "The Beast"). Show the UESP name, with the DFU name and quest ID as secondary text. The DFU name is also the key used to match notebook entries.

## Status rules

For each quest, in priority order:

1. **Active**: present in `QuestData.quests` and not `questComplete`.
2. **Completed / Failed**: present with `questComplete` (use `questSuccess` to decide which).
3. **Completed (inferred)**: a later quest in the same chain is present, a global that only this quest sets is true, or a notebook header matches its DFU name.
4. **Started, outcome unknown**: a completed `StartQuest` action names this quest, but it's no longer present and none of the evidence above applies. This happens when the player has since deleted the notebook entry.
5. **Invited**: letter task `S.45`/`S.46` done but the branch hasn't started.
6. **Available**: the previous quest is done (or, for a branch opener, the level and reputation tasks are triggered).
7. **Locked**: everything else.

If `QuestData.txt` is missing, fall back to globals + notebook and show a notice that progress is partial.

## Expected result for `example/`

The sample is a level 5 character with `MetLadyBrisienna` as the only true main quest flag, and The Werebeast in progress. This is the acceptance check for the progress function:

| Branch | Expected | Evidence |
|---|---|---|
| Intro | Privateer's Hold ✔, Instructions from the Empire ✔ | backbone present; `MetLadyBrisienna`; notebook "Lady Brisienna ended" |
| Queen Aubk-i | Concern for Nulfaga ✔, Mynisera's Letters ✔ | `S.36` StartQuest → `S0000005`, `S.04` dropped; notebook entries for both |
| Cyndassa | The Beast **active**; Emperor's Courier onward locked | `S0000007` present, `questComplete: false`; `S.37` StartQuest → `S0000007`; `S.06` dropped. Journal: slay the werewolf at Tristore Laboratory in Betony, ~134 days left |
| Prince Lhotun | Invited | `S.45` letter given, `S.15` triggered, `S.40` StartQuest `questName` empty |
| Princess Morgiah | Invited | `S.46` letter given, `S.18` triggered, `S.42` empty |
| Prince Helseth | Available | `S.16` triggered, `S.39` empty |
| Princess Elysana | Locked (level 6) | `S.20` not triggered |
| Medora | Locked (needs Missing Prince + level 8) | `S.17` not triggered |
| Ending | none yet | no `*Ending` / `*GotTotem` flags |

## Implementation steps

1. **Load `QuestData.txt` and `NotebookData.txt`** (read-only).
   - `electron/main.ts`: in `dialog:openSaveData`, read both files from the save directory the same way as `FactionData.txt`, and return them as `questData` / `notebookData` (or `null`). Don't add either to `fs:saveData`; the editor never writes these files.
   - `electron/preload.ts` / `src/global.d.ts`: add both to the `openSaveData` result type.
   - `src/store/useSaveStore.ts`: add `questData` and `notebookData` fields. Set them in `loadSaveData` (new optional args) and clear them in `reset`. Add minimal `QuestSaveData` / `TaskSaveData` / `ActionSaveData` interfaces with `[key: string]: any`.
   - `src/layout/MainLayout.tsx`: pass both through.
2. **Static quest definitions**: new `src/data/mainQuest.ts`, a typed array of branches. Each branch has its questgiver, castle, min level, level task, start task, optional letter task, and reputation task. Each quest has `questName` (`S0000001`), `uespName`, `dfuName`, `required`, `setsGlobals[]` (only globals unique to that quest), and a UESP link.
3. **Progress logic**: new pure function `computeMainQuestProgress({ questData, notebookData, globalVars })` in `src/utils/mainQuestProgress.ts`. It returns per-quest status plus evidence strings (for tooltips), and a summary: required quests done / total, the active quest(s) with journal text, invited/available branches, ending flags, and a partial-data flag. Keep it free of React. Small helpers: `collectStartedQuests(questData)` (completed `StartQuest` actions → quest IDs), `getBackboneTask(name)`, `parseFinishedQuestHeaders(notebook)`, `renderJournal(quest)` (log lines with `%qdt` / clock macros expanded).
4. **UI**: new `src/components/MainQuestProgress.tsx`, following the existing section pattern (reads store, returns `null` without a save, `Paper` with a heading).
   - Overall `LinearProgress` for required quests, like the level progress bar in `StatsAndSkills`.
   - A "Current quest" card at the top for each active main quest, with its journal text and days remaining.
   - One vertical MUI `Stepper` per branch, with status shown as step state. Chips mark "inferred", "invited", and "outcome unknown", with a tooltip listing the evidence. Invited and available branches say where to go (e.g. "Talk to Prince Lhotun in Castle Sentinel").
   - An "Ending" row that shows the true `*Ending` or `*GotTotem` flag.
   - Mount it in `src/pages/Home.tsx` just above `QuestProgress`.
5. **Docs**: add the feature and a 1.0.7 changelog entry to `Feature.md`. Add `QuestData.txt` / `NotebookData.txt` (read-only) to the architecture section of `CLAUDE.md`.

## Verification

- Load `example/SaveData.txt` and check the panel against the expected-result table above.
- Remove `QuestData.txt` and `NotebookData.txt` from a copy of the save folder. The panel should fall back to globals only, show the partial-data notice, and not crash.
- The sample now covers the "Active" path. Still uncovered: a quest that is complete but tombstoned (within a week of finishing), a failed main quest, and a later-chain quest proving earlier ones done. These can be tested with hand-edited copies of `QuestData.txt`, e.g. flip `S0000007` to `questComplete`/`questTombstoned`, or mark its `S0000012` `StartQuest` action complete.
- `npm run build` and `npm run lint`.

## Out of scope

- **Editing main quest progress** (starting, skipping or completing quests). `QuestData.txt` is serialized by FullSerializer with `$type` annotations and cross-referenced symbols, so writing it back safely is a separate, riskier project. Editing the outcome globals already works in the existing Global Variables section.
- **The other save files** that were added to `example/` (`AutomapData`, `ConversationData`, `DiscoveryData`, etc.) aren't needed for this feature.

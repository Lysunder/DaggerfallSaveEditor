# Feature Ideas

Candidate features for the save editor, based on what Daggerfall Unity saves but the editor doesn't expose yet. Field names are from `PlayerEntityData_v1` in the DFU source (`Assets/Scripts/Game/Serialization/SerializableGameObject.cs`). Ordered roughly by usefulness against effort.

## Quick wins: data already loaded, just not editable

- ✅ **Clear bounties and legal reputation.** *Done in 1.0.9.* `regionData[]` holds each region's legal standing, and `crimeCommitted` records the current crime. "I got caught stealing in Daggerfall" is a very common reason people reach for a save editor.
- **Skill training progress.** `skillUses[]` counts progress toward each skill's next increase. The Stats & Skills page could show it as a bar per skill, matching the existing level progress bar.
- **Equipment view.** `equipTable` maps equipment slots to item IDs. Showing what's worn where, with an unequip button, pairs naturally with the inventory manager.
- **Biography modifiers and reflexes.** The six `biography*Mod` values (resist disease, magic, poison, avoid hit and so on) are set by the answers at character creation and are invisible in-game.
- **Room rentals.** `rentedRooms[]` holds the inn rooms the player has paid for and when they expire. Extend one or drop it.

## Medium: needs DFU data or careful handling

- **Add item to inventory.** Planned in [add-inventory-item-plan.md](add-inventory-item-plan.md).
- **Spellbook viewer and editor.** `spellbook[]` stores each custom spell's effects, cost settings and icon. Viewing, renaming and deleting are easy. Creating spells means porting DFU's effect definitions.
- **Cure diseases, vampirism and lycanthropy.** These live in `instancedEffectBundles[]` as active effect bundles. It's a popular request, but lycanthropy and vampirism also touch race, globals (`TookTheCure`) and quests. Removing them cleanly needs research, like the main quest work did.
- **Journal viewer for all active quests.** The main quest panel already renders DFU journal text; reuse it for guild and side quests from `QuestData.txt`.
- **Guild and Daedra timers.** `timeForThievesGuildLetter`, `timeForDarkBrotherhoodLetter` and `daedraSummonDay` control when those invitations and summonings become available. Moving them to "now" is a small but handy cheat.

## Editor quality-of-life

- ✅ **Save slot browser.** *Done in 1.0.8* ([plan](save-slot-browser-plan.md)). DFU keeps each save in its own folder with a `SaveInfo.txt` holding the save name and date. Picking "Before the Mantella – 3E405" is nicer than finding `SAVE12/SaveData.txt` in a file dialog.
- ✅ **Unsaved-changes indicator and change list.** *Done in 1.0.8* ([plan](unsaved-changes-plan.md)), with per-change revert. The whole file is rewritten on every save, so a list of what changed before writing, plus a warning when closing with unsaved edits, would build trust.
- **Restore from backup.** Every save already makes a `bak_SaveData.N.txt`. A menu to list and restore them makes that safety net usable.
- **Automated tests.** Vitest is set up (`npm test`, run in CI) and covers the save locations, date helpers, enum handling, guild data, numeric limits, the store, and the unsaved-changes diff, labels and revert. Still untested: `mainQuestProgress.ts` and the planned item builder. Both are pure functions that are easy to test, and the DFU-built items in a real save make ready-made test data.

## Suggested order

1. ~~**Clear bounties:** high demand, simple data.~~ Done.
2. **Add item:** already planned.
3. ~~**Save slot browser:** improves every session.~~ Done.

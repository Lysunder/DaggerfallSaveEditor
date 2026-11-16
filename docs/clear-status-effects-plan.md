# Plan: Clear Poisons and Diseases

Let the user see the poisons and diseases the character is suffering from, with what each one is doing to them, and cure any or all of them, the same way a temple or a Cure Disease / Cure Poison potion does in the game.

Sources: Daggerfall Unity source at `E:\Projects\daggerfall-unity` (checked against upstream `master` at `3d85a28`):
- `Assets/Scripts/Game/Serialization/SerializableGameObject.cs` (`PlayerEntityData_v1.instancedEffectBundles`)
- `Assets/Scripts/Game/Serialization/SerializablePlayer.cs` (L199 save, L439 restore)
- `Assets/Scripts/Game/MagicAndEffects/EntityEffectManager.cs` (`EffectBundleSaveData_v1`, `EffectSaveData_v1`, `CureAllDiseases`, `CureAllPoisons`, `RemoveBundle`, `CreateVampirismDisease`, `CreateLycanthropyDisease`)
- `Assets/Scripts/Game/MagicAndEffects/MagicAndEffectsEnums.cs` (`BundleTypes`)
- `Assets/Scripts/Game/MagicAndEffects/Effects/Diseases/` (`DiseaseEffect` and one class per disease, plus the vampirism and lycanthropy infections)
- `Assets/Scripts/Game/MagicAndEffects/Effects/Poisons/PoisonEffect.cs`

## How DFU stores them

Every active effect on the player is a **bundle** in `playerData.playerEntity.instancedEffectBundles`, an array of `EffectBundleSaveData_v1`:

| Field | Meaning |
|---|---|
| `bundleType` | `BundleTypes` name: `None`, `Spell`, `Disease`, `Poison`, `HeldMagicItem`, `Potion` (values 0–5). Older saves may hold the number. |
| `name` | Display name of the bundle. |
| `liveEffects[]` | `EffectSaveData_v1`: `key`, `roundsRemaining`, `statMods`, `statMaxMods`, `skillMods[]`, `effectSpecific` (the effect's own save data, written by FullSerializer with a `$type` annotation), and more. |
| others | `targetType`, `elementType`, `casterEntityType`, `casterLoadID`, `fromEquippedItemID`, `castByItemID`, `fromPoison`, icon fields, `version`. |

**Diseases** are bundles with `bundleType: "Disease"` and one live effect whose key is `Disease-<Diseases name>`: `Disease-WitchesPox`, `Disease-Plague`, `Disease-YellowFever`, `Disease-StomachRot`, `Disease-Consumption`, `Disease-BrainFever`, `Disease-SwampRot`, `Disease-CalironsCurse`, `Disease-Cholera`, `Disease-Leprosy`, `Disease-WoundRot`, `Disease-RedDeath`, `Disease-BloodRot`, `Disease-TyphoidFever`, `Disease-Dementia`, `Disease-Chrondiasis`, `Disease-WizardFever`. `effectSpecific` (`DiseaseEffect.SaveData_v1`) holds `incubationOver` and `daysOfSymptomsLeft`.

The **vampirism and lycanthropy infections** (the stage after being bitten, before it takes hold) are also `Disease` bundles, keyed `Vampirism-Infection`, `Werewolf-Infection` and `Wereboar-Infection`.

**Poisons** are bundles with `bundleType: "Poison"` and one live effect keyed `Poison-<Poisons name>`: `Poison-Nux_Vomica`, `Poison-Arsenic`, `Poison-Moonseed`, `Poison-Drothweed`, `Poison-Somnalius`, `Poison-Pyrrhic_Acid`, `Poison-Magebane`, `Poison-Thyrwort`, `Poison-Indulcet`, `Poison-Sursum`, `Poison-Quaesto_Vil`, `Poison-Aegrotat`. `effectSpecific` (`PoisonEffect.SaveData_v1`) holds `minutesToStart`, `minutesRemaining` and `currentState` (`Waiting`, `Active`, `Complete`).

**Full vampirism and lycanthropy** (`Vampirism-Curse`, `Lycanthropy-Curse`) are racial override bundles with `bundleType: "None"`, not diseases.

## What curing does in DFU

`EntityEffectManager.CureAllDiseases()` and `CureAllPoisons()` simply remove every bundle of that type (`RemoveBundle`). There is nothing else to undo:

- **Attribute damage** from a disease or poison is applied with `ChangeStatMod`, so it lives in that effect's `statMods` and disappears with the bundle. A disease whose symptoms have run their course (`daysOfSymptomsLeft` at the completed value) keeps its damage until cured, which is exactly the case this feature is for.
- **Health** a poison already took (`DecreaseHealth`) is not given back by the game either. The user can already set health in Character Basics.
- Infections are cured by the same call, which is how temples and potions cure them in the game.

So the editor cures by **removing the bundle from the array**, nothing more. Removing one bundle is `CureDisease` for a specific disease; removing all of a type is `CureAllDiseases` / `CureAllPoisons`.

## Scope of the first version

- List and cure **diseases** (including the three infections) and **poisons**.
- **Not** full vampirism or lycanthropy. Those also change race, globals (`TookTheCure`), guild memberships and quests; see the "Cure diseases, vampirism and lycanthropy" idea in [feature-ideas.md](feature-ideas.md). Their bundles are shown as read-only so the user knows the editor saw them.
- **Not** other effects (spells, potions, held magic items). Show a count of other active effects for context, but don't offer to remove them: many are beneficial, and some come from equipped items and are recreated on load.

## Data safety

- Never edit a bundle in place. Removal only, so the round-tripped JSON of everything that stays is untouched, including `$type` annotations in `effectSpecific`.
- **References:** FullSerializer writes a shared object once with `"$id"` and later uses `{"$ref": "<id>"}`. Before removing a bundle, check whether its subtree contains an `$id` that a `$ref` elsewhere in the save points to. If so, don't remove it and tell the user why. No such references are expected in bundles (their types are structs), but a dangling `$ref` would make DFU refuse the save, so the check is cheap insurance.
- Accept `bundleType` as a name or a number (`Disease` = 2, `Poison` = 3), the same way `src/data/dfuEnums.ts` reads other enums.
- If `instancedEffectBundles` is missing or not an array, show nothing to cure. (It's a C# array, not a dictionary, so the `{}` quirk from guild memberships shouldn't apply, but read it defensively.)

## UI

A new **Status Effects** section in `SECTIONS` (`src/pages/Home.tsx`), next to Crime & Legal Standing:

- A list of afflictions, each with:
  - its name ("Witches' Pox", "Nux Vomica (poison)", "Vampirism (infection)");
  - its state: "incubating" / "showing symptoms" / "run its course, damage remains" for diseases; "not yet active" / "active" / "finished" for poisons;
  - the attribute damage it is causing, from the live effect's `statMods` (e.g. "Strength −6, Endurance −3");
  - a **Cure** button.
- **Cure all diseases** and **Cure all poisons** buttons, disabled when there is nothing to cure.
- Read-only notes for vampirism and lycanthropy curses ("This editor can't cure vampirism yet").
- An empty state: "No diseases or poisons."

## Implementation steps

1. `src/data/statusEffects.ts`: disease and poison display names by key, `bundleTypeName(value)`, `describeAffliction(bundle)` (name, kind, state, stat damage) and `findAfflictions(saveData)`. Pure, with tests.
2. `src/store/useSaveStore.ts`: add `instancedEffectBundles` to the `PlayerEntity` type, and actions `cureAffliction(index)` and `cureAll(kind: 'Disease' | 'Poison')`. Both splice bundles out of the draft after the `$ref` check.
3. `src/utils/changeLabels.ts`: `instancedEffectBundles` is a positional array, so a cure shows up as one "changed" entry for the whole array. Add a pattern that compares before and after and lists what was removed ("Cured: Witches' Pox, Nux Vomica") under a new "Status Effects" section. Revert already works, since it puts back the whole array.
4. `src/components/StatusEffects.tsx`, added to `SECTIONS`.
5. `Feature.md` (feature entry and changelog), `docs/feature-ideas.md` (link this plan), `CLAUDE.md` (data location).

## Verification

- **Unit tests:** name and state for each disease and poison key, infections, the curses, unknown keys; numeric `bundleType`; curing one vs. all; the `$ref` refusal; the change list label; revert.
- **In game:**
  - Catch a disease (e.g. from a rat) and wait for symptoms, cure it in the editor, load the save: the disease is gone from the status screen and the attribute penalty is lifted.
  - Get poisoned, save while poisoned, cure, load: the poison is gone.
  - Get bitten by a vampire, save during the infection, cure, load: the infection is gone and the transformation never happens.
  - A save with no afflictions loads unchanged after an unrelated edit (`instancedEffectBundles` byte-for-byte the same).
- `npm test`, `npm run build`, `npm run lint`.

## Open questions

- **Health:** should curing a poison also offer to restore health to maximum, like `CureAll` does? The plan leaves health alone, since Character Basics already edits it.
- **Other harmful effects:** paralysis or attribute drains cast by enemies are `Spell` bundles. Worth a later version once the bundle display exists, but harder to tell harmful from helpful reliably.
- **Disease names:** the in-game names come from DFU's text resources. Hard-coding the English names is simplest; confirm the spelling against the game's status screen.

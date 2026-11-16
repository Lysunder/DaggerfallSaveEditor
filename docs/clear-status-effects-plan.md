# Plan: Clear Poisons, Diseases and Harmful Spells

> **Status: built on the `features` branch, not yet released.** Differences from the plan: only `fromEquippedItemID` marks a spell as coming from an item; `castByItemID` (a one-off cast from using an item) is removable, since nothing recreates it. The change list also shows fatigue divided by 64, as the game does.

Let the user see the poisons, diseases and harmful spells affecting the character, with what each one is doing to them, and cure any or all of them, the same way a temple, a Cure Disease / Cure Poison potion or a healing spell does in the game. Separate buttons restore health, magicka and fatigue to full.

Sources: Daggerfall Unity source at `E:\Projects\daggerfall-unity` (checked against upstream `master` at `3d85a28`):
- `Assets/Scripts/Game/Serialization/SerializableGameObject.cs` (`PlayerEntityData_v1.instancedEffectBundles`)
- `Assets/Scripts/Game/Serialization/SerializablePlayer.cs` (L199 save, L439 restore)
- `Assets/Scripts/Game/MagicAndEffects/EntityEffectManager.cs` (`EffectBundleSaveData_v1`, `EffectSaveData_v1`, `CureAllDiseases`, `CureAllPoisons`, `RemoveBundle`, `CreateVampirismDisease`, `CreateLycanthropyDisease`)
- `Assets/Scripts/Game/MagicAndEffects/MagicAndEffectsEnums.cs` (`BundleTypes`)
- `Assets/Scripts/Game/MagicAndEffects/Effects/Diseases/` (`DiseaseEffect` and one class per disease, plus the vampirism and lycanthropy infections)
- `Assets/Scripts/Game/MagicAndEffects/Effects/Poisons/PoisonEffect.cs`
- `Assets/Scripts/Game/MagicAndEffects/Effects/{Alteration,Destruction,Mysticism}/` (spell effect keys; `Destruction/DrainEffect.cs` for drains)
- `Assets/Scripts/Game/Entities/DaggerfallEntity.cs` (`MaxHealth`, `MaxFatigue`, `GetRawMaxMagicka`) and `Assets/Scripts/Game/Formulas/FormulaHelper.cs` (`SpellPoints`)

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

**Spells** cast on the player are bundles with `bundleType: "Spell"`. `casterEntityType` says who cast them and `fromEquippedItemID` / `castByItemID` whether an item did. The harmful effect keys are:

| Effect | Keys | What it does to the player |
|---|---|---|
| Paralyze | `Paralyze` | Can't move until it runs out (`roundsRemaining`). |
| Silence | `Silence` | Can't cast spells. |
| Drain | `Drain-Strength`, `-Intelligence`, `-Willpower`, `-Agility`, `-Endurance`, `-Personality`, `-Speed`, `-Luck` | Lowers an attribute. Per `DrainEffect`, the bundle **persists indefinitely** until the stat is healed, so these are the ones most worth curing. |
| Transfer | `Transfer-<attribute>`, `Transfer-Health`, `Transfer-Fatigue` | The attribute versions derive from `DrainEffect` and persist the same way. |
| Continuous damage | `ContinuousDamage-Health`, `-Fatigue`, `-SpellPoints` | Damage every round until it runs out. |
| Damage | `Damage-Health`, `-Fatigue`, `-SpellPoints`, `Disintegrate` | Instant, so rarely still present in a save; listed for completeness. |

Every other key (Fortify, Heal, Shield, Invisibility, Levitate, Light, Detect, Water Walking and so on) is helpful or neutral and is never offered for removal.

**Full vampirism and lycanthropy** (`Vampirism-Curse`, `Lycanthropy-Curse`) are racial override bundles with `bundleType: "None"`, not diseases. `VampiricFortifyEffect` belongs to vampirism and is left alone too.

## What curing does in DFU

`EntityEffectManager.CureAllDiseases()` and `CureAllPoisons()` simply remove every bundle of that type (`RemoveBundle`). There is nothing else to undo:

- **Attribute damage** from a disease or poison is applied with `ChangeStatMod`, so it lives in that effect's `statMods` and disappears with the bundle. A disease whose symptoms have run their course (`daysOfSymptomsLeft` at the completed value) keeps its damage until cured, which is exactly the case this feature is for.
- **Health** a poison already took (`DecreaseHealth`) is not given back by the game either. The user can already set health in Character Basics.
- Infections are cured by the same call, which is how temples and potions cure them in the game.

So the editor cures by **removing the bundle from the array**, nothing more. Removing one bundle is `CureDisease` for a specific disease; removing all of a type is `CureAllDiseases` / `CureAllPoisons`.

Harmful spells work the same way: like diseases, their attribute damage is in the effect's `statMods`, and `RemoveBundle` is how the game ends any bundle. Removing a drain bundle is what healing the drained attribute to full eventually does (`DrainEffect.HealAttributeDamage` cancels the effect once its magnitude reaches 0).

## Restoring health, magicka and fatigue

Three separate buttons, each setting one current value to its maximum, as DFU's `CureAll` does for all three:

| Value | Saved field | Maximum, per DFU |
|---|---|---|
| Health | `currentHealth` | `maxHealth` (saved). |
| Magicka | `currentMagicka` | `floor(Intelligence × careerTemplate.SpellPointMultiplierValue)` (`FormulaHelper.SpellPoints`). Not saved; computed. |
| Fatigue | `currentFatigue` | `(Strength + Endurance) × 64` (`FatigueMultiplier`). Not saved; computed. The saved fatigue is on this ×64 scale. |

DFU uses *live* attributes, which include the `statMods` of active effects. Compute live attributes as the saved attributes plus the `statMods` of the bundles that remain, so restoring after curing a drain uses the healed value. Effects that change max magicka directly (`MaxMagickaModifier`, e.g. from items) aren't saved, so the computed magicka can be slightly below what the game shows; DFU doesn't clamp current values on load (`restoreMode`), so a slightly low value is harmless.

## Scope of the first version

- List and cure **diseases** (including the three infections), **poisons** and **harmful spells** (table above).
- Restore **health**, **magicka** and **fatigue**, each with its own button.
- **Not** full vampirism or lycanthropy. Those also change race, globals (`TookTheCure`), guild memberships and quests; see the "Cure diseases, vampirism and lycanthropy" idea in [feature-ideas.md](feature-ideas.md). Their bundles are shown as read-only so the user knows the editor saw them.
- **Not** helpful effects, potions or held magic items. Show a count of other active effects for context.
- **Spells from equipped items** (`fromEquippedItemID` set) are listed but not offered for removal: DFU recreates equipped-item effects, so removing one does nothing until the item is unequipped. Say so in the row.
- **Mixed bundles:** a spell bundle can hold several effects. Offer removal only when every effect in it is harmful; otherwise list it as "contains helpful effects too" without a Cure button. Enemy spells in DFU are single-purpose classic spells, so this should be rare.

## Data safety

- Never edit a bundle in place. Removal only, so the round-tripped JSON of everything that stays is untouched, including `$type` annotations in `effectSpecific`.
- **References:** FullSerializer writes a shared object once with `"$id"` and later uses `{"$ref": "<id>"}`. Before removing a bundle, check whether its subtree contains an `$id` that a `$ref` elsewhere in the save points to. If so, don't remove it and tell the user why. No such references are expected in bundles (their types are structs), but a dangling `$ref` would make DFU refuse the save, so the check is cheap insurance.
- Accept `bundleType` as a name or a number (`Disease` = 2, `Poison` = 3), the same way `src/data/dfuEnums.ts` reads other enums.
- If `instancedEffectBundles` is missing or not an array, show nothing to cure. (It's a C# array, not a dictionary, so the `{}` quirk from guild memberships shouldn't apply, but read it defensively.)

## UI

A new **Status Effects** section in `SECTIONS` (`src/pages/Home.tsx`), next to Crime & Legal Standing:

- **Vitals:** current / maximum health, magicka and fatigue, with **Restore health**, **Restore magicka** and **Restore fatigue** buttons, each disabled when that value is already full.
- A list of afflictions, grouped as Diseases, Poisons and Harmful spells, each with:
  - its name, in English ("Witches' Pox", "Nux Vomica", "Vampirism (infection)", "Drain Strength", "Paralysis");
  - its state: "incubating" / "showing symptoms" / "run its course, damage remains" for diseases; "not yet active" / "active" / "finished" for poisons; rounds remaining or "until healed" (drains) for spells;
  - the attribute damage it is causing, from the live effects' `statMods` (e.g. "Strength −6, Endurance −3");
  - a **Cure** button (or the reason there isn't one: from an item, or mixed with helpful effects).
- **Cure all diseases**, **Cure all poisons** and **Remove all harmful spells** buttons, each disabled when there is nothing to remove.
- Read-only notes for vampirism and lycanthropy curses ("This editor can't cure vampirism yet").
- An empty state: "No diseases or poisons."

## Implementation steps

1. `src/data/statusEffects.ts`: English display names by key (diseases, poisons, harmful spell effects), the harmful-key list, `bundleTypeName(value)`, `describeAffliction(bundle)` (name, kind, state, stat damage, whether it can be cured and why not) and `findAfflictions(saveData)`. Plus `liveStats(playerEntity)` and `maxVitals(playerEntity)` for the restore buttons. Pure, with tests.
2. `src/store/useSaveStore.ts`: add `instancedEffectBundles` to the `PlayerEntity` type, and actions `cureAffliction(index)`, `cureAll(kind: 'Disease' | 'Poison' | 'HarmfulSpell')` and `restoreVital('health' | 'magicka' | 'fatigue')`. Cures splice bundles out of the draft after the `$ref` check; restores set the current value with `clampInt`.
3. `src/utils/changeLabels.ts`: `instancedEffectBundles` is a positional array, so a cure shows up as one "changed" entry for the whole array. Add a pattern that compares before and after and lists what was removed ("Cured: Witches' Pox, Nux Vomica, Drain Strength") under a new "Status Effects" section. Revert already works, since it puts back the whole array.
4. `src/components/StatusEffects.tsx`, added to `SECTIONS`.
5. `Feature.md` (feature entry and changelog), `docs/feature-ideas.md` (link this plan), `CLAUDE.md` (data location).

## Verification

- **Unit tests:** name and state for each disease and poison key, infections, the curses, unknown keys; harmful vs. helpful spell keys, item-sourced and mixed bundles; numeric `bundleType`; curing one vs. all of each kind; the `$ref` refusal; max health, magicka and fatigue, including live attributes after a drain is removed; the change list label; revert.
- **In game:**
  - Catch a disease (e.g. from a rat) and wait for symptoms, cure it in the editor, load the save: the disease is gone from the status screen and the attribute penalty is lifted.
  - Get poisoned, save while poisoned, cure, load: the poison is gone.
  - Get bitten by a vampire, save during the infection, cure, load: the infection is gone and the transformation never happens.
  - Get an attribute drained by an enemy spell, cure, load: the attribute is back to normal on the character sheet.
  - Get paralyzed, save while paralyzed, cure, load: the character can move.
  - Use each Restore button on a tired, wounded, low-magicka character and load: the bars are full, and magicka and fatigue match the game's maximum.
  - A save with no afflictions loads unchanged after an unrelated edit (`instancedEffectBundles` byte-for-byte the same).
- `npm test`, `npm run build`, `npm run lint`.

## Decisions

- **Vitals:** separate Restore health / magicka / fatigue buttons; curing doesn't change vitals by itself.
- **Harmful spells:** included in the first version.
- **Names:** English names hard-coded in the editor.

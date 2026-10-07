# Plan: Add an Item to the Inventory

> **Status: not started.** None of the files named below exist yet, and `currentUID` is not in the save types.

Let the user add a new item to the character's inventory or wagon from the Inventory Management section. The flow starts with picking an item type, then the specific item, then only the options that matter for that type, then a preview before it's added.

Sources: Daggerfall Unity source at `E:\Projects\daggerfall-unity`:
- `Assets/Resources/ItemTemplates.txt` (288 item templates)
- `Assets/Scripts/Game/Items/ItemEnums.cs` (groups, per-group item enums, materials, dye colors)
- `Assets/Scripts/Game/Items/ItemBuilder.cs` (how DFU creates each kind of item)
- `Assets/Scripts/Game/Items/DaggerfallUnityItem.cs` (`SetItem`, `GetSaveData`)
- `Assets/Scripts/Game/Formulas/FormulaHelper.cs` (`IsItemStackable`)

## How DFU stores an item

Each entry in `playerEntity.items` / `wagonItems` is an `ItemData_v1`. Fields a new item needs, and where they come from:

| Saved field | Source |
|---|---|
| `uid` | New unique ID (see below) |
| `itemGroup`, `groupIndex` | Group name (serialized as a string, e.g. `"Weapons"`) and the item's **position** within that group's enum in `ItemEnums.cs`. This is not the template index. |
| `shortName` | Template `name` |
| `weightInKg`, `value1`, `hits1`, `hits2`, `enchantmentPoints`, `drawOrder` | Template `baseWeight`, `basePrice`, `hitPoints` (current and max condition), `enchantmentPoints`, `drawOrderOrEffect`, then adjusted by material |
| `worldTextureArchive/Record`, `playerTextureArchive/Record` | Template, then adjusted for gender, race and variant (armor, clothing, weapons) |
| `nativeMaterialValue`, `dyeColor` | Material (weapons and armor); dye color serialized as its enum name (e.g. `"SilverOrElven"`) |
| `currentVariant` | Visual variant (armor, clothing) |
| `stackCount` | 1, or the chosen count for stackable items |
| everything else | Defaults: `value2: 0`, `hits3: 0`, `message: 0`, `legacyMagic: null`, `customMagic: null`, `isQuestItem: false`, `questUID: 0`, `questItemSymbol: null`, `trappedSoulType: "None"`, `className: null`, `poisonType: "None"`, `potionRecipe: 0`, `repairData: null`, `timeForItemToDisappear: 0`, `timeHealthLeechLastUsed: 0`, `artifactIndexBitfield: 0`, `"$version": "v1"` |

`value2` and `hits3` pack DFU's internal `unknown`/`flags` and `unknown2`/`typeDependentData`. They're 0 for a freshly built item (`DaggerfallUnityItem.SetItem`).

### Item IDs

The save's top-level `currentUID` is DFU's ID counter. On load DFU restores it (`SaveLoadManager.cs` L1002) and hands out new IDs by incrementing it. A new item must take `uid = currentUID` and then set `currentUID += 1`. Otherwise the next item the game creates will reuse that ID. Also check that the ID isn't already used by any item in `items` or `wagonItems`, and skip forward if it is.

## Item types in the first version

| Type (UI label) | DFU group(s) | Options after picking the item |
|---|---|---|
| Weapons | `Weapons` | Material (Iron → Daedric); quantity for arrows only |
| Armor & Shields | `Armor` | Material (Leather, Chain, Iron → Daedric), variant |
| Clothing | `MensClothing` or `WomensClothing`, chosen by the character's gender | Variant, dye color |
| Ingredients | `PlantIngredients1/2`, `CreatureIngredients1/2/3`, `MiscellaneousIngredients1/2`, `MetalIngredients` | Quantity |
| Gems | `Gems` | none |
| Jewellery | `Jewellery` | none |
| Religious Items | `ReligiousItems` | none |
| Miscellaneous | `UselessItems2`, `MiscItems`, `Maps`, `Paintings`, `Drugs` | Quantity for Oil only |

Stacking follows `FormulaHelper.IsItemStackable`: ingredients, potions, books, gold, arrows and oil. Everything else is added with `stackCount: 1`, and a quantity greater than 1 adds separate items.

**Left out on purpose** (each needs data or behavior the editor doesn't have):
- **Books**: DFU gets the title and price from the classic game's book files (`CreateBook` reads `ARENA2`).
- **Potions**: `potionRecipe` is a key from DFU's runtime recipe registry.
- **Magic items and artifacts**: enchantments (`legacyMagic`/`customMagic`) are a separate project.
- **Quest items**: only valid while tied to a running quest.
- **Currency**: gold is already editable under Finances.
- **Deeds and transportation (horse, cart)**: these change what the player owns, not just what they carry.

## Porting DFU's item builder

Put the static data in generated files, and port the build rules by hand.

1. **Generated data** (`scripts/generate-item-data.mjs`, run with the DFU source path, output committed as `src/data/itemTemplates.ts`):
   - All 288 templates from `ItemTemplates.txt`.
   - Each group's enum from `ItemEnums.cs` as an ordered list of template indices. The position in the list is the `groupIndex`.
   - `WeaponMaterialTypes`, `ArmorMaterialTypes` and `DyeColors` enum names and values.
   - Names come from the templates; the enum names (e.g. `Left_Pauldron`) are for matching `ItemBuilder` rules only.
2. **Build rules** (`src/utils/itemBuilder.ts`), ported from `ItemBuilder.cs`:
   - `createItem(group, templateIndex)`: `SetItem` defaults as in the table above.
   - `applyWeaponMaterial`: `nativeMaterialValue`, `SetItemPropertiesByMaterial` (value ×3×multiplier, weight by quarter-kg rounding, max/current condition ×multiplier/4) using the three multiplier tables, `GetWeaponDyeColor`, and `playerTextureArchive − 1` for female characters. Arrows skip material and set `hits1: 0`.
   - `applyArmorSettings`: base archive 245 (female) or 249 (male), `SetRace` body-morphology offset, `ApplyArmorMaterial` (leather weight formula, chain ×2 value, plate uses the weapon material tables with `material − 0x0200`), `GetArmorDyeColor`, then `SetVariant` with its per-piece clamping (cuirass, greaves, pauldrons, gauntlets, boots, helm). Shields aren't clamped and use the variant as given.
   - Clothing: `SetRace`, `SetVariant`, dye color.
   - Gender comes from `playerEntity.gender`. Race comes from `playerEntity.raceTemplate.ID`, which uses DFU's `Races` values (Breton 1 … Argonian 8; the sample's Wood Elf is 6), mapped to `BodyMorphology` (`GetBodyMorphology`). DFU throws an error for the Vampire (9) and Werewolf (10) values. If a save ever has one, fall back to Human and show a warning.
   - Everything is deterministic. Where DFU picks a random variant, the UI picks a default (variant 0, or the first valid one after clamping) and lets the user change it.
   - Paintings: DFU sets a random `message` (which painting it is). Pick a random value too.

## UI flow

An **Add Item** button in `InventoryManager`'s toolbar, next to Repair All, opens a dialog with an MUI `Stepper`:

1. **Type**: a grid of cards, one per type in the table above, each with an icon and a one-line description.
2. **Item**: a searchable list of the templates in that type. Show base weight and value. Ingredients and Miscellaneous show a sub-group label (Plant, Creature, Metal…).
3. **Options**: only what applies to that type (material, variant, dye, quantity). If a type has no options, this step is skipped. Material shows the resulting condition, weight and value as you change it.
4. **Review**: the final name, weight, value, condition and stack count, and where it goes: **Inventory** or **Wagon**. Wagon is only enabled if the player owns a cart (a `Transportation` item in `items`) and is the default when that tab is open.

On confirm, call a new store action `addItem(target, item)`. It assigns the ID and bumps `currentUID` inside the same Immer update, then appends the item to the target list. Show a success notification. The item is written to disk the next time the user saves, like every other edit.

## Implementation steps

1. `scripts/generate-item-data.mjs` and the generated `src/data/itemTemplates.ts`.
2. `src/utils/itemBuilder.ts`: the builders above, pure and React-free, returning a complete `ItemData_v1` object minus the `uid`.
3. `src/store/useSaveStore.ts`: `addItem(target: 'items' | 'wagonItems', item)` with ID allocation; add `currentUID` to `SaveGameData`.
4. `src/components/AddItemDialog.tsx`: the stepper dialog. Wire the button into `InventoryManager.tsx`.
5. `Feature.md`: feature entry and changelog.

## Verification

- **Match DFU's own items.** For every weapon, armor and clothing item in the example save (9 armor, 5 weapons), rebuild it from the same template, material, variant, gender and race with `itemBuilder.ts`. Diff the result against the saved item, ignoring `uid`. Every field should match. This is the main correctness check for the ported rules.
- **ID handling.** After adding two items, their IDs are distinct, `currentUID` has moved past both, and neither collides with an existing item.
- **In game.** Add a weapon, a piece of armor, clothing and an ingredient stack to a copy of a save, then load it in DFU. Check that they appear with the right name, icon, weight and value, can be equipped, and that looting or buying an item afterwards doesn't clash with them.
- `npm run build` and `npm run lint`.

## Open questions

- **Wagon without a cart**: should the editor allow adding to the wagon anyway? DFU keeps `wagonItems` even without a cart, but the player can't reach them. The plan disables it.
- **Stack limits**: should quantity be capped for stackable items? DFU doesn't cap stacks, so the plan allows up to 999 in the UI as a sanity limit.

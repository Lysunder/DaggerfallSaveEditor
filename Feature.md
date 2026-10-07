# Features & Changelog

## Features

### 💾 Save Browser
- **Save List**: Browse your Daggerfall Unity saves by character, newest first, with each save's screenshot, name, in-game date and the real date it was saved. Search by character or save name, then click a save to open it.
- **Save Locations**: Finds the default Daggerfall Unity save folder automatically and follows a custom save path set in DFU's `settings.ini`. Portable installs are supported: point the editor at the install folder once, and it resolves the saves the same way DFU does. You can also add any folder of saves, and show or hide saves by location.
- **Open File**: Opening a `SaveData.txt` directly is still available.

### 🧯 Error Reports
- **No More Blank Window**: If part of the editor fails, only that section shows an error; the rest keeps working, including Save. If the whole editor fails, a full-window error screen replaces the blank window.
- **Copyable Report**: Every error screen has a **Copy error report** button. The report says what failed and where, with the app version and system, but contains no save data, and your user name is removed from file paths.
- **Window Crashes**: If the editor window itself crashes or stops responding, a dialog explains what happened and offers to copy the report, reload or quit.

### 📝 Unsaved Changes
- **Change Indicator**: The toolbar shows how many unsaved changes you have, and the window title gets a `*`. **Save** is only enabled when there's something to save.
- **Change List**: Click the indicator to see every change grouped by section, in plain language with old and new values (e.g. "Strength: 55 → 70", "Removed: Silver Longsword").
- **Revert**: Undo any single change, or all changes to one item or faction at once. A deleted item comes back in its old place and equipment slot. **Discard all changes** undoes everything.
- **No Lost Edits**: Opening another save or closing the app with unsaved changes asks first, with the option to save.
- **Smaller Saves**: Only the files you changed are written and backed up.

### 👤 Character & Core Data
- **Basic Information**: Edit character Name and Level, and see Race and Class.
- **Vitals**: Modify current and maximum Health, current Magicka and Fatigue, and carried gold.
- **Attributes (Stats)**: Adjust all core attributes (Strength, Intelligence, Willpower, Agility, Endurance, Personality, Speed, Luck).
- **Skills**: Directly edit the mastery level of all Primary, Major, and Minor skills (Weapon skills, Magic schools, utility skills like Stealth and Climbing, and languages).
- **Level Progress**: View exact skill increases required to reach the next character level, dynamically calculated from your current skills.

### 🛡️ Career & Advantages
- **Special Abilities**: Toggle advantages/disadvantages such as Acute Hearing, Athleticism, Adrenaline Rush, Damage from Sunlight/Holy Places, and No Regen Spell Points.
- **Tolerances & Immunities**: Modify character tolerances (Normal, Immune, Resistant, Low Tolerance, Critical Weakness) for Paralysis, Magic, Poison, Fire, Frost, Shock, and Disease.
- **Magic Abilities**: Configure Spell Absorption, Magicka Regeneration, and Rapid Healing conditions (e.g., In Light, In Darkness, In Water, Always).
- **Equipment Restrictions**: Toggle forbidden materials (Iron, Steel, Daedric, etc.), forbidden armor types, and forbidden shields.
- **Progression Modifiers**: Edit the Skill Advancement Multiplier and Hit Points Per Level.

### 🎒 Inventory & Items
- **Inventory Management**: View and edit items currently in your character's personal inventory.
- **Wagon Management**: View and edit items stored in your wagon.
- **Item Editing**: Modify an item's condition and maximum condition, stack count, value and weight.
- **Quick Repair**: "Repair All Items" functionality to instantly restore all items to maximum condition.
- **Item Removal**: Delete specific items from your inventory or wagon.

### 💰 Finances & Banking
- **Wallet**: Edit the amount of Gold Pieces currently held by the character.
- **Bank Accounts**: Modify bank account balances and outstanding loan totals across all regions in the Illiac Bay.
- **Property Ownership**: View the house deeds stored in the save (read-only).

### 🤝 Factions & Reputation
- **Global Reputations**: Adjust your standing with major societal groups (Commoners, Merchants, Nobility, Scholars, Underworld, Supernatural Beings).
- **Guild Memberships**: Modify your rank within specific guilds you have joined (Mages Guild, Fighters Guild, Temples, etc.).
- **Specific Faction Standing**: Directly edit reputation values for individual factions and localized groups.

### ⚖️ Crime & Legal Standing
- **Clear All Bounties**: One click resets every negative regional legal reputation to 0, lifts banishments and death sentences, and clears the crime the guards are after you for. Positive reputations are kept.
- **Legal Reputation**: See and edit your legal reputation in each region (-100 to 100), with the standing the game shows ("A scoundrel", "Admired"…). Regions you have no record in are hidden unless you turn on "Show all regions".
- **Wanted For**: See or change the crime you're currently wanted for.

### 🗺️ Location & World Data
- **Positioning**: Edit player world coordinates (X, Y, Z) and orientation (Yaw, Pitch).
- **Environment Status**: Toggle whether the player is currently inside a dungeon, building, tavern, or residence.
- **Time Management**: See the current in-game date and time, and move it forward or back by hours or days.
- **Discovery**: Edit or manipulate building discovery data (e.g., revealing buildings in towns).

### 📜 Quests & Global Variables
- **Global Variables**: Toggle specific global game state variables on or off (used for tracking major world events or quest states).
- **Quest Tracking**: Search and filter the quest global variables and toggle them. Quest tasks and journals are not editable.
- **Main Quest Progress**: See how far you are through the main quest: every branch and quest with its status (completed, in progress, invited, available or locked), the current quest's journal entry and time remaining, who holds the Totem, and which ending you reached. Read-only; uses `QuestData.txt` and `NotebookData.txt` from the save folder when present.

> **Note**: Every file that changes is backed up (`bak_SaveData.[n].txt`) before it is written. If the backup can't be made, nothing is written.

---

## Changelog

### Version 1.0.10

✨ **New Features & Improvements:**
- **Error Reports**: Errors no longer leave a blank white window. The failing section (or the whole window) shows what went wrong with a **Copy error report** button, so you can send the details with a bug report. Window crashes and freezes show a dialog with the same option.

🐛 **Bug Fixes:**
- **Blank Window for Characters Without a Guild**: A character who hadn't joined any guild crashed the Factions & Reputation section, and with it the whole window, because Daggerfall Unity saves an empty membership list as `{}` rather than `[]`. The change list had the same problem.
- **Inventory**: An item without a name made the Inventory section crash.

### Version 1.0.9

✨ **New Features & Improvements:**
- **Crime & Legal Standing**: Clear bounties and banishments in every region at once, or edit each region's legal reputation and the crime you're wanted for.

🐛 **Bug Fixes:**
- **Safer Saving**: If a backup can't be made, the save is no longer written, so the original is never overwritten without one. Files are now written to a temporary file and renamed into place, so a crash can't leave a half-written save. The editor also only writes to save files you opened in the current session.
- **Value Limits**: Gold, bank balances, loans, inventory values and character fields are limited to the range Daggerfall Unity can read, skills are limited to 1-100, and item quantity can't go below 1.
- **Region Names**: Most regions after Dwynnen had the wrong name (for example, Phrygias showed as "Daggerfall"), which also mislabelled bank accounts. Names now match Daggerfall Unity.
- **Repair All Items**: Items without a maximum condition are no longer left with an empty condition.
- **Unsaved Changes**: Items that share the same ID are now compared correctly instead of being merged in the change list.
- **Security**: The app window no longer exposes raw IPC access, and leftover debug messaging was removed.

### Version 1.0.8

✨ **New Features & Improvements:**
- **Save Browser**: Pick a save from a list of your Daggerfall Unity saves, with screenshots and dates, instead of finding `SaveData.txt` in a file dialog. Supports portable installs and custom save folders.
- **Unsaved Changes**: See what you've changed before saving, revert individual changes, and get a warning before unsaved edits would be lost.
- **In-Game Date**: The Location & World Data section now shows the in-game date and time (e.g. "22nd of Last Seed, 3E405, 13:30").
- **Version Display**: The app's version number is now shown next to the title.

🐛 **Bug Fixes:**
- **Saves That Wouldn't Load**: Choosing more than one forbidden material, shield, armor or proficiency wrote the value in a form Daggerfall Unity can't read (`Iron, Steel` instead of `Iron,Steel`), so the game refused to load the save. The editor now writes it correctly. Opening a save affected by this repairs it automatically; save to write the fix.
- **Enum Values**: Weather, world context and building type are now written by name, exactly as the game writes them. Building type is a dropdown instead of free text, and building quality only accepts whole numbers, since a typo in either could also stop a save loading.
- **Time Shifting**: The hour and day buttons moved the clock by the wrong amount ("+1 Hour" added 12 minutes). They now move it by exactly one hour or one day.
- **Position Fields**: Clearing a coordinate, yaw, pitch or world position field (for example, to type a new value) and then saving wrote an empty value that Daggerfall Unity can't load. Empty or partial input is now ignored, and the field keeps its last valid value.
- **Bank Accounts**: Clearing an Account Balance or Loan Total cell wrote an empty value that Daggerfall Unity can't load. An emptied cell now keeps its previous value, and balances are stored as whole numbers.
- **Quest Flag Index**: The index shown next to each global variable was its position in the filtered list rather than its real index, so it changed while searching or filtering.
- **Inventory Filter**: A category filter chosen on the Inventory tab carried over to the Wagon tab, which could hide every wagon item. Switching tabs now resets the filter.

### Version 1.0.7

✨ **New Features & Improvements:**
- **Main Quest Progress**: Added a Main Quest Progress section showing each main quest branch, what's done, what's in progress, and where to go next.

### Version 1.0.6

✨ **New Features & Improvements:**
- **Level Progress**: Added a real-time progress bar to the Stats & Skills page showing exactly how many skill increases are needed for your next level.
- **Skill Editing**: Added the ability to edit character skills directly.

### Version 1.0.5

✨ **New Features & Improvements:**
- **Character Advantages**: Added a new Advantages section for editing character special abilities, tolerances, and magic flags.
- **Reputation Management**: Added a new Reputation section to view and edit faction and global reputations.
- **Linux Support**: Added support and build configurations for Linux environments.

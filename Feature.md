# Features & Changelog

## Features

### 👤 Character & Core Data
- **Basic Information**: Edit character Name, Level, and Base Health.
- **Vitals**: Modify current and maximum Health, Magicka, and Fatigue.
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
- **Item Editing**: Modify item conditions (durability/hits) and stack counts.
- **Quick Repair**: "Repair All Items" functionality to instantly restore all items to maximum condition.
- **Item Removal**: Delete specific items from your inventory or wagon.

### 💰 Finances & Banking
- **Wallet**: Edit the amount of Gold Pieces currently held by the character.
- **Bank Accounts**: Modify bank account balances and outstanding loan totals across all regions in the Illiac Bay.
- **Property Ownership**: (Supported via the save data structure) Manage ship ownership and house deeds.

### 🤝 Factions & Reputation
- **Global Reputations**: Adjust your standing with major societal groups (Commoners, Merchants, Nobility, Scholars, Underworld, Supernatural Beings).
- **Guild Memberships**: Modify your rank within specific guilds you have joined (Mages Guild, Fighters Guild, Temples, etc.).
- **Specific Faction Standing**: Directly edit reputation values for individual factions and localized groups.

### 🗺️ Location & World Data
- **Positioning**: Edit player world coordinates (X, Y, Z) and orientation (Yaw, Pitch).
- **Environment Status**: Toggle whether the player is currently inside a dungeon, building, tavern, or residence.
- **Time Management**: Alter the current in-game time and date.
- **Discovery**: Edit or manipulate building discovery data (e.g., revealing buildings in towns).

### 📜 Quests & Global Variables
- **Global Variables**: Toggle specific global game state variables on or off (used for tracking major world events or quest states).
- **Quest Tracking**: View and potentially manipulate active quest states.

> **Note**: All changes automatically generate a backup (`bak_SaveData.[n].txt`) before writing to prevent data loss.

---

## Changelog

### Version 1.0.6

✨ **New Features & Improvements:**
- **Level Progress**: Added a real-time progress bar to the Stats & Skills page showing exactly how many skill increases are needed for your next level.
- **Skill Editing**: Added the ability to edit character skills directly.

### Version 1.0.5

✨ **New Features & Improvements:**
- **Character Advantages**: Added a new Advantages section for editing character special abilities, tolerances, and magic flags.
- **Reputation Management**: Added a new Reputation section to view and edit faction and global reputations.
- **Linux Support**: Added support and build configurations for Linux environments.

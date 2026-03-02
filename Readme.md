# Tab-Quest: The Dungeon Crawler

> **Your browser tabs are monsters. Kill them all.**

Tab-Quest is a **Chrome Extension** that transforms your everyday browsing into a pixel-art RPG. Every tab you open spawns a monster and your hero fights them automatically from the side panel. Slay tabs, earn XP, collect legendary loot, and become the ultimate DOM-geon crawler.





##  What Is Tab-Quest?

Tab-Quest gamifies your browser tabs. Instead of 47 forgotten tabs eating your RAM, each tab becomes a **monster** with HP and attack stats. Your hero auto-fights them in the background, and when a monster dies, **the tab automatically closes** — saving your memory and keeping your browser clean.

**Core idea:** The more tabs you hoard, the more monsters you fight. Close tabs by killing them in-game.

### Key Features

-  **Three playable classes** =Warrior, Mage, Developer (each with unique perks)
-  **Tabs become monsters** Normal, Elite (pinned tabs), and Boss (YouTube, Reddit, etc.)
-  **Auto-combat** Hero attacks every 4 seconds automatically
-  **Manual attacks**Click for bonus 1.5× damage
-  **Death system** 10-second "Lag Curse" respawn with gold penalty
-  **Leveling & XP** Quadratic XP curve with stat scaling
-  **Loot drops** 5 rarity tiers from Common to Legendary
-  **Shop system** Buy weapons, armor, and potions
-  **Auto tab cleanup** — Killed monster tabs close automatically (except your active tab)

---

##  Folder Structure

```
extension/
├── manifest.json                  
├── background/
│   └── service-worker.js          
├── modules/
│   ├── StorageManager.js         
│   ├── MonsterEngine.js           
│   ├── HeroSystem.js              
│   ├── BattleSystem.js            
│   └── ShopSystem.js              
└── sidepanel/
    ├── sidepanel.html             
    ├── sidepanel.css              
    └── sidepanel.js              
```




##  How to Download & Install

### Prerequisites

- **Google Chrome** (version 114 or later — for Side Panel API support)
- **Developer mode** enabled in Chrome

### Step-by-Step Installation

1. **Download the project**
  

2. **Extract the ZIP** 
   - Unzip the file to any folder on your computer

3. **Open Chrome Extensions page**
   - Type `chrome://extensions/` in the address bar and press Enter

4. **Enable Developer Mode**
   - Toggle the **"Developer mode"** switch in the **top-right corner**

5. **Load the extension**
   - Click **"Load unpacked"**
   - Navigate to and select the **`extension/`** folder (not the root project folder — the `extension/` subfolder specifically)

6. **Open Tab-Quest**
   - Click the  Tab-Quest icon in your Chrome toolbar
   - The game side panel opens on the right side of your browser

> **Note:** If you don't see the icon, pin Tab-Quest.

---

## How to Play

### Step 1 — Choose Your Class

When you first open Tab-Quest, you'll pick one of three classes:


|  **Warrior** Tanky survives longer |
| **Mage** Glass cannon kills fast |
|  **Developer** Balanced + **20% bonus gold** |

Your choice is permanent until you reset the game.

### Step 2 — Tabs Become Monsters

Every open browser tab is automatically turned into a monster:



| Regular tab | Normal monster |  | Any website |
|  Pinned tab |  **Elite** monster | | Any pinned tab |
| Social/video site | **Boss** monster |  | YouTube, Reddit, Twitter, Facebook, TikTok |

- **Opening a new tab** → spawns a new monster
- **Closing a tab** → removes that monster
- **Killing a monster** → the tab **auto-closes** (except your currently active tab)

### Step 3 — Combat

Combat runs **automatically**:
-  **Auto-attack:** Your hero strikes the current target every **4 seconds**
-  **Manual attack:** Click the **" ATTACK!"** button for **1.5× damage** — spam it!
-  **Monster retaliation:** After each hit, the monster strikes back. Your DEF reduces incoming damage (minimum 1 damage always gets through)
-  **Targeting:** When a monster dies, the next one is auto-targeted. Click any monster in the **Monsters** tab to switch targets manually

### Step 4 — Death & The Lag Curse

When your HP hits zero:

-  You **die** and enter the **"Lag Curse"** — a **10-second respawn timer**
-  uou **lose 10% of your gold**
-  A skull overlay and countdown appears on screen
-  After 10 seconds, you **respawn at 50% HP** and combat resumes automatically

### Step 5 — Leveling Up

Killing monsters grants XP. Required XP follows a quadratic curve:



| 1 → 2 | 100 XP |
| 2 → 3 | 400 XP |
| 3 → 4 | 900 XP |


Each level up gives you:
-  **Full HP restore**
-  Permanent boosts to **max HP, ATK, and DEF** (scaled by your class)

### Step 6 — Loot Drops

Every monster kill has a chance to drop equipment:

|

|  Common | White =Rusty Sword (+2 ATK) |
|  Uncommon | Green =  Iron Blade (+5 ATK) |
|  Rare | Blue = Flame Sword (+10 ATK) |
|  Epic | Purple  =Void Edge (+18 ATK) |
|  Legendary | Gold =  Excalibur.exe (+30 ATK) |

Boss and Elite monsters have **significantly higher drop chances**.

### Step 7 — The Shop

Open the **Shop** tab to spend your gold:

- **Weapons** — Boost your ATK
- **Armor** — Boost your DEF
- **Health Potions** — Instantly restore HP (consumed immediately on purchase)

All prices **scale with your level** — higher level = better items but higher costs.

### Step 8 — Inventory (Bag)

Open the **Bag** tab to manage your gear:

- View all collected and purchased equipment
- **Equip** a weapon or armor to apply its stat bonus
- Equipping a new item **swaps** the old one back into your inventory
- Your equipped weapon and armor are shown on the **Dashboard**

---






##  Troubleshooting & Common Errors

### "Side panel doesn't open"

- **Cause:** Chrome version too old (Side Panel API requires Chrome 114+)
- **Fix:** Update Chrome to the latest version
- **Alternative:** Right-click the Tab-Quest icon → "Open side panel"

### "No monsters appear"

- **Cause:** The extension doesn't have the `tabs` permission, or tabs were opened before installing
- **Fix:**
  1. Go to `chrome://extensions/`
  2. Click **"Remove"** on Tab-Quest
  3. Re-load the `extension/` folder with "Load unpacked"
  4. Open new tabs — monsters will appear

### "Class selection screen keeps showing"

- **Cause:** Storage permission issue or data corruption
- **Fix:**
  1. Open the side panel
  2. Click **"Reset Game"** at the bottom of the Dashboard
  3. Select your class again

### "Extension shows errors in chrome://extensions/"

- **Cause:** Likely a file path issue
- **Fix:**
  1. Make sure you loaded the **`extension/`** subfolder, NOT the root project folder
  2. Check that all files exist inside `extension/` (especially `background/service-worker.js`)
  3. Click the **"Reload" ↻** button on the extension card

### "Killed monster tab didn't close"

- **This is intentional.** Your **currently active tab** is never auto-closed, even if the monster dies. This prevents losing the page you're actively viewing. Switch to a different tab and the killed monster's tab will close on the next kill.

### "Hero takes too much damage / keeps dying"

- **Tips:**
  - Buy **Health Potions** from the Shop tab
  - Equip **armor** to increase DEF
  - Pick **Warrior** class for maximum survivability
  - Close high-level boss tabs (YouTube, Reddit) if they're too strong






### Base Hero Stats (Before Class Bonus)

| Stat | Base Value |
|---|---|
| HP | 50 |
| ATK | 5 |
| DEF | 2 |
| Gold | 0 |

### Monster Stat Ranges

| Type | HP Range | ATK Range |
|---|---|---|
| Normal | 20–50 | 3–8 |
|  Elite (Pinned) | 36–90 | 4–12 |
|  Boss (Social sites) | 60–150 | 7–20 |


## Pro Tips

1.  **Pin your most-used tabs** — Elites give way more XP and gold
2. 🔮 **Pick Mage** if you want to burn through bosses quickly
3. ⚔️ **Pick Warrior** if you keep dying — extra HP keeps you alive
4. 💻 **Pick Developer** to farm gold and buy the best shop gear
5.  **Spam the Attack button** during boss fights for 1.5× damage
6.  **Buy potions before opening YouTube** — that boss hits hard
7.  **Open lots of tabs** = more monsters = more XP = faster leveling
8.  **Close useless tabs manually** if you don't want to fight them
9.  **Reset the game** anytime to try a different class strategy

---



---

##  Reset Game

Click **"Reset Game"** at the bottom of the Dashboard tab to wipe all progress and pick a new class. This clears all data from `chrome.storage


--------------------------
||from Apsan to Hackclub||
---------------------------

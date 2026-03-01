

# Tab-Quest: The DOM-geon Crawler Complete Chrome Extension

## What We're Building
A fully working Chrome Extension (Manifest V3) where browser tabs become monsters you fight in an RPG-style game. Every file will be complete and tested against each other... A super fun way to save your chrome memory

## File Structure
All extension files will be generated inside the Lovable project for easy copying:

```
/extension/
  manifest.json
  background/service-worker.js
  modules/StorageManager.js
  modules/MonsterEngine.js
  modules/HeroSystem.js
  modules/BattleSystem.js
  modules/ShopSystem.js
  sidepanel/sidepanel.html
  sidepanel/sidepanel.css
  sidepanel/sidepanel.js
```

## Core Features 

### 1. Class Selection 
- Three classes: Warrior, Mage, Developer — each with unique stat bonuses


### 2. Monster System
- Every open tab becomes a monster with HP/ATK based on URL and time open
- Pinned tabs = elite monsters, special URLs = boss monsters
- Monsters appear/disappear as tabs open/close

### 3. Battle System
- Auto-attack loop every 4 seconds in background
- Manual "Attack" button for bonus damage
- Monsters fight back ,hero takes damage
- Death → 10-second respawn cooldown with visual "Lag Curse" effect

### 4. Leveling & XP
- Killing monsters grants XP based on monster strength
- XP curve: 100 × level² to level up
- Each level increases base stats

### 5. Loot & Shop
- Monsters drop gold and random loot (Common → Legendary)
- Shop with weapons, armor, potions  prices scale with level
- Equip items to boost stats

### 6. UI / Side Panel
- Pixel-art themed side panel with hero stats, monster list, shop tab
- Real-time updates via `chrome.runtime.onMessage` broadcasts
- HP bars, XP bars, gold counter, inventory display





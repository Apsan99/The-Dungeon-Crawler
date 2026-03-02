import { StorageManager } from '../modules/StorageManager.js';
import { MonsterEngine } from '../modules/MonsterEngine.js';
import { HeroSystem } from '../modules/HeroSystem.js';
import { BattleSystem } from '../modules/BattleSystem.js';
import { ShopSystem } from '../modules/ShopSystem.js';

const heroSystem = new HeroSystem();
const monsterEngine = new MonsterEngine();
const battleSystem = new BattleSystem(heroSystem, monsterEngine);
const shopSystem = new ShopSystem(heroSystem);

// --- Broadcast helper (also closes killed monster tabs) ---
function broadcast(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {});

  // Auto-close tab when monster is killed (non-active tabs only)
  if (msg.type === 'BATTLE_UPDATE' && msg.monster && msg.monster.hp <= 0) {
    const killedTabId = msg.monster.id;
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const activeId = activeTabs[0]?.id;
      if (killedTabId !== activeId) {
        chrome.tabs.remove(killedTabId).catch(() => {});
      }
    });
  }
}

// --- Init: load hero & scan existing tabs ---
async function init() {
  await heroSystem.load();
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    monsterEngine.addMonster(tab);
  }

  if (heroSystem.getState()) {
    battleSystem.startAutoAttack(broadcast);
  }
}

init();

// --- Tab listeners ---
chrome.tabs.onCreated.addListener((tab) => {
  monsterEngine.addMonster(tab);
  broadcast({ type: 'MONSTERS_UPDATED', monsters: monsterEngine.getAllMonsters() });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  monsterEngine.removeMonster(tabId);
  broadcast({ type: 'MONSTERS_UPDATED', monsters: monsterEngine.getAllMonsters() });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Always re-create the monster with the real URL (fixes new-tab → actual-site issue)
    monsterEngine.addMonster(tab, true);
    broadcast({ type: 'MONSTERS_UPDATED', monsters: monsterEngine.getAllMonsters() });
  }
});

// --- Side panel open on action click ---
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// --- Message handler ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    sendResponse({ error: err.message });
  });
  return true; // CRITICAL: keeps message channel open for async
});

async function handleMessage(message) {
  switch (message.action) {
    case 'GET_STATE': {
      const hero = heroSystem.getState();
      const monsters = monsterEngine.getAllMonsters();
      const target = battleSystem.getTarget();
      const log = battleSystem.getLog(15);
      return { hero, monsters, target, log };
    }

    case 'SELECT_CLASS': {
      const hero = await heroSystem.selectClass(message.className);
      if (hero) {
        battleSystem.startAutoAttack(broadcast);
      }
      return { hero };
    }

    case 'MANUAL_ATTACK': {
      const result = battleSystem.manualAttack(broadcast);
      const hero = heroSystem.getState();
      const target = battleSystem.getTarget();
      return { result, hero, target };
    }

    case 'SET_TARGET': {
      const monster = battleSystem.setTarget(message.tabId);
      return { monster };
    }

    case 'GET_SHOP': {
      return { items: shopSystem.getShopItems() };
    }

    case 'BUY_ITEM': {
      const result = shopSystem.buyItem(message.itemId);
      return { result, hero: heroSystem.getState() };
    }

    case 'EQUIP_ITEM': {
      const success = heroSystem.equipItem(message.index);
      return { success, hero: heroSystem.getState() };
    }

    case 'USE_POTION': {
      const hero = heroSystem.getState();
      if (!hero) return { error: 'No hero' };
      const item = hero.inventory[message.index];
      if (!item || item.type !== 'potion') return { error: 'Not a potion' };
      heroSystem.heal(item.stat);
      hero.inventory.splice(message.index, 1);
      await heroSystem.save();
      return { hero: heroSystem.getState() };
    }

    case 'RESET_GAME': {
      battleSystem.stopAutoAttack();
      await heroSystem.reset();
      return { success: true };
    }

    default:
      return { error: 'Unknown action' };
  }
}

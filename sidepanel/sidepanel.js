// --- DOM refs ---
const classSelect = document.getElementById('class-select');
const gameScreen = document.getElementById('game-screen');
const deathOverlay = document.getElementById('death-overlay');
const killOverlay = document.getElementById('kill-overlay');
const killMonsterName = document.getElementById('kill-monster-name');
const killRewards = document.getElementById('kill-rewards');
const heroClassIcon = document.getElementById('hero-class-icon');
const heroClassName = document.getElementById('hero-class-name');
const heroLevel = document.getElementById('hero-level');
const hpFill = document.getElementById('hp-fill');
const hpCurrent = document.getElementById('hp-current');
const hpMax = document.getElementById('hp-max');
const xpFill = document.getElementById('xp-fill');
const xpCurrent = document.getElementById('xp-current');
const xpMax = document.getElementById('xp-max');
const heroAtk = document.getElementById('hero-atk');
const heroDef = document.getElementById('hero-def');
const heroGold = document.getElementById('hero-gold');
const targetInfo = document.getElementById('target-info');
const attackBtn = document.getElementById('attack-btn');
const logEntries = document.getElementById('log-entries');
const monsterList = document.getElementById('monster-list');
const shopList = document.getElementById('shop-list');
const equippedItems = document.getElementById('equipped-items');
const bagItems = document.getElementById('bag-items');
const respawnTimer = document.getElementById('respawn-timer');

const CLASS_ICONS = { warrior: '🛡️', mage: '🔮', developer: '💻' };

let currentTarget = null;
let logBuffer = [];
let respawnInterval = null;

// --- Send message helper ---
function send(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
      } else {
        resolve(response || {});
      }
    });
  });
}

// --- Init ---
async function init() {
  const state = await send({ action: 'GET_STATE' });

  if (state.hero) {
    showGame(state);
  } else {
    showClassSelect();
  }
}

function showClassSelect() {
  classSelect.classList.remove('hidden');
  gameScreen.classList.add('hidden');
}

function showGame(state) {
  classSelect.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  updateHeroUI(state.hero);
  updateMonsterList(state.monsters);
  if (state.target) {
    currentTarget = state.target;
    updateTargetUI(state.target);
  }
  if (state.log) {
    logBuffer = state.log.map(l => l.text || l);
    renderLog();
  }
}

// --- Class Selection ---
document.querySelectorAll('.class-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const className = btn.dataset.class;
    const res = await send({ action: 'SELECT_CLASS', className });
    if (res.hero) {
      const state = await send({ action: 'GET_STATE' });
      showGame(state);
    }
  });
});

// --- Tab switching ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

    if (btn.dataset.tab === 'shop') loadShop();
    if (btn.dataset.tab === 'inventory') loadInventory();
  });
});

// --- Attack button ---
attackBtn.addEventListener('click', async () => {
  const res = await send({ action: 'MANUAL_ATTACK' });
  if (res.hero) updateHeroUI(res.hero);
  if (res.target) {
    currentTarget = res.target;
    updateTargetUI(res.target);
  }
});

// --- UI Updates ---
function updateHeroUI(hero) {
  if (!hero) return;
  heroClassIcon.textContent = CLASS_ICONS[hero.class] || '⚔️';
  heroClassName.textContent = hero.class.charAt(0).toUpperCase() + hero.class.slice(1);
  heroLevel.textContent = hero.level;
  hpCurrent.textContent = hero.hp;
  hpMax.textContent = hero.maxHp;
  hpFill.style.width = (hero.hp / hero.maxHp * 100) + '%';
  xpCurrent.textContent = hero.xp;
  xpMax.textContent = hero.xpToNext;
  xpFill.style.width = (hero.xp / hero.xpToNext * 100) + '%';
  heroAtk.textContent = hero.atk;
  heroDef.textContent = hero.def;
  heroGold.textContent = hero.gold;

  if (!hero.alive) {
    showDeathOverlay(hero.respawnAt);
  } else {
    hideDeathOverlay();
  }
}

function updateTargetUI(monster) {
  if (!monster) {
    targetInfo.innerHTML = '<p class="no-target">No target selected</p>';
    return;
  }
  const hpPct = (monster.hp / monster.maxHp * 100);
  targetInfo.innerHTML = `
    <div class="monster-name">${monster.name}</div>
    <div class="mon-bar-track"><div class="mon-bar-fill" style="width:${hpPct}%"></div></div>
    <div class="mon-stats">
      <span>HP: ${monster.hp}/${monster.maxHp}</span>
      <span>ATK: ${monster.atk}</span>
    </div>
  `;
}

function updateMonsterList(monsters) {
  if (!monsters || monsters.length === 0) {
    monsterList.innerHTML = '<p class="empty-text">No monsters found. Open more tabs!</p>';
    return;
  }
  monsterList.innerHTML = monsters.map(m => {
    const hpPct = (m.hp / m.maxHp * 100);
    const targeted = currentTarget && currentTarget.id === m.id ? 'targeted' : '';
    const dead = m.hp <= 0 ? 'opacity: 0.4;' : '';
    return `
      <div class="monster-item ${targeted}" style="${dead}" data-id="${m.id}">
        <div class="mon-name">${m.name}</div>
        <div class="mon-domain">${m.domain}</div>
        <div class="mon-bar-track"><div class="mon-bar-fill" style="width:${hpPct}%"></div></div>
        <div class="mon-stats">
          <span>HP: ${m.hp}/${m.maxHp}</span>
          <span>ATK: ${m.atk}</span>
          <span>XP: ${m.xpReward}</span>
        </div>
      </div>
    `;
  }).join('');

  monsterList.querySelectorAll('.monster-item').forEach(el => {
    el.addEventListener('click', async () => {
      const tabId = parseInt(el.dataset.id);
      const res = await send({ action: 'SET_TARGET', tabId });
      if (res.monster) {
        currentTarget = res.monster;
        updateTargetUI(res.monster);
        // Switch to battle tab
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="battle"]').classList.add('active');
        document.getElementById('tab-battle').classList.add('active');
        // Refresh monster list highlighting
        const state = await send({ action: 'GET_STATE' });
        if (state.monsters) updateMonsterList(state.monsters);
      }
    });
  });
}

function addLog(text, type = '') {
  logBuffer.push(text);
  if (logBuffer.length > 30) logBuffer.shift();
  renderLog();
}

function renderLog() {
  logEntries.innerHTML = logBuffer.map(l => {
    let cls = '';
    if (l.includes('defeated')) cls = 'kill';
    if (l.includes('Loot')) cls = 'loot';
    if (l.includes('Level')) cls = 'levelup';
    return `<div class="log-entry ${cls}">${l}</div>`;
  }).reverse().join('');
}

// --- Death overlay ---
function showDeathOverlay(respawnAt) {
  deathOverlay.classList.remove('hidden');
  if (respawnInterval) clearInterval(respawnInterval);
  respawnInterval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((respawnAt - Date.now()) / 1000));
    respawnTimer.textContent = remaining;
    if (remaining <= 0) {
      hideDeathOverlay();
      clearInterval(respawnInterval);
      refreshState();
    }
  }, 250);
}

function hideDeathOverlay() {
  deathOverlay.classList.add('hidden');
  if (respawnInterval) {
    clearInterval(respawnInterval);
    respawnInterval = null;
  }
}

// --- Shop ---
async function loadShop() {
  const res = await send({ action: 'GET_SHOP' });
  if (!res.items) return;
  const hero = (await send({ action: 'GET_STATE' })).hero;

  shopList.innerHTML = res.items.map(item => `
    <div class="shop-item">
      <div class="shop-info">
        <div class="shop-name rarity-${item.rarity}">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
      </div>
      <button class="buy-btn" data-id="${item.id}" ${hero && hero.gold < item.price ? 'disabled' : ''}>
        💰 ${item.price}
      </button>
    </div>
  `).join('');

  shopList.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await send({ action: 'BUY_ITEM', itemId: btn.dataset.id });
      if (res.result?.success) {
        addLog(`Bought ${res.result.item.name}!`);
        if (res.hero) updateHeroUI(res.hero);
        loadShop();
      } else {
        addLog(`Cannot buy: ${res.result?.error || 'unknown error'}`);
      }
    });
  });
}

// --- Inventory ---
async function loadInventory() {
  const state = await send({ action: 'GET_STATE' });
  const hero = state.hero;
  if (!hero) return;

  // Equipped
  let eqHtml = '';
  if (hero.equipped.weapon) {
    eqHtml += `<div class="inv-item"><span class="inv-name">⚔️ ${hero.equipped.weapon.name}</span><span class="inv-stat">+${hero.equipped.weapon.stat}</span></div>`;
  }
  if (hero.equipped.armor) {
    eqHtml += `<div class="inv-item"><span class="inv-name">🛡️ ${hero.equipped.armor.name}</span><span class="inv-stat">+${hero.equipped.armor.stat}</span></div>`;
  }
  equippedItems.innerHTML = eqHtml || '<p class="empty-text">Nothing equipped</p>';

  // Bag
  if (hero.inventory.length === 0) {
    bagItems.innerHTML = '<p class="empty-text">Bag is empty</p>';
  } else {
    bagItems.innerHTML = hero.inventory.map((item, i) => {
      const actionBtn = item.type === 'potion'
        ? `<button class="use-btn" data-index="${i}">Use</button>`
        : `<button class="equip-btn" data-index="${i}">Equip</button>`;
      return `
        <div class="inv-item">
          <span class="inv-name rarity-${item.rarity}">${item.name}</span>
          <span class="inv-stat">+${item.stat}</span>
          ${actionBtn}
        </div>
      `;
    }).join('');

    bagItems.querySelectorAll('.equip-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await send({ action: 'EQUIP_ITEM', index: parseInt(btn.dataset.index) });
        loadInventory();
        const s = await send({ action: 'GET_STATE' });
        if (s.hero) updateHeroUI(s.hero);
      });
    });

    bagItems.querySelectorAll('.use-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const res = await send({ action: 'USE_POTION', index: parseInt(btn.dataset.index) });
        if (res.hero) updateHeroUI(res.hero);
        loadInventory();
        addLog('Used potion!');
      });
    });
  }
}

// --- Reset ---
document.getElementById('reset-btn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset your game?')) {
    await send({ action: 'RESET_GAME' });
    location.reload();
  }
});

// --- Kill animation ---
let killTimeout = null;
function showKillAnimation(monsterName, rewards) {
  killMonsterName.textContent = monsterName;
  let rewardText = '';
  if (rewards) {
    rewardText = `+${rewards.xp} XP  +${rewards.gold} reward`;
    if (rewards.loot) rewardText += `  loot${rewards.loot.name}`;
    if (rewards.leveledUp) rewardText += `  yay LEVEL ${rewards.newLevel}!`;
  }
  killRewards.textContent = rewardText;
  killOverlay.classList.remove('hidden');
 
  killOverlay.style.animation = 'none';
  killOverlay.offsetHeight; 
  killOverlay.style.animation = '';
  if (killTimeout) clearTimeout(killTimeout);
  killTimeout = setTimeout(() => killOverlay.classList.add('hidden'), 1800);
}


chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'BATTLE_UPDATE') {
    if (msg.heroState) updateHeroUI(msg.heroState);
    if (msg.monster) {
      currentTarget = msg.monster;
      updateTargetUI(msg.monster);

      if (msg.monster.hp <= 0) {
        showKillAnimation(msg.monster.name, msg.rewards);
      }
    }
    if (msg.log) addLog(msg.log);
    if (msg.rewards?.leveledUp) {
      addLog(`🎉 LEVEL UP! You are now level ${msg.rewards.newLevel}!`);
    }
  }
  if (msg.type === 'HERO_DEAD') {
    showDeathOverlay(msg.respawnAt);
  }
  if (msg.type === 'MONSTERS_UPDATED') {
    updateMonsterList(msg.monsters);
  }
});


async function refreshState() {
  const state = await send({ action: 'GET_STATE' });
  if (state.hero) {
    updateHeroUI(state.hero);
    updateMonsterList(state.monsters);
    if (state.target) {
      currentTarget = state.target;
      updateTargetUI(state.target);
    }
  }
}

setInterval(refreshState, 3000);


init();

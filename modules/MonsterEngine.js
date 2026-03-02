const BOSS_DOMAINS = ['youtube.com', 'reddit.com', 'twitter.com', 'facebook.com', 'tiktok.com'];

const MONSTER_NAMES = [
  'Goblin Tab', 'Skeleton Page', 'Zombie Link', 'Orc Window', 'Imp Script',
  'Wraith Frame', 'Troll Popup', 'Demon Cache', 'Slime Cookie', 'Phantom DOM',
  'Spider Thread', 'Basilisk Buffer', 'Drake Render', 'Lich Listener', 'Hydra Hook'
];

const BOSS_NAMES = {
  'youtube.com': '🐉 YouTube Wyrm',
  'reddit.com': '👹 Reddit Behemoth',
  'twitter.com': '🦅 X-Bird of Chaos',
  'facebook.com': '🧟 Zuck Lich King',
  'tiktok.com': '🌀 TikTok Vortex Fiend'
};

export class MonsterEngine {
  constructor() {
    this.monsters = new Map();
  }

  addMonster(tab) {
    if (!tab || !tab.id) return null;
    if (this.monsters.has(tab.id)) return this.monsters.get(tab.id);

    const url = tab.url || tab.pendingUrl || '';
    const domain = this._extractDomain(url);
    const isBoss = BOSS_DOMAINS.some(d => domain.includes(d));
    const isElite = tab.pinned === true;

    let baseHp = 20 + Math.floor(Math.random() * 30);
    let baseAtk = 3 + Math.floor(Math.random() * 5);

    if (isElite) {
      baseHp = Math.floor(baseHp * 1.8);
      baseAtk = Math.floor(baseAtk * 1.5);
    }
    if (isBoss) {
      baseHp = Math.floor(baseHp * 3);
      baseAtk = Math.floor(baseAtk * 2.5);
    }

    let name;
    if (isBoss) {
      const bossKey = BOSS_DOMAINS.find(d => domain.includes(d));
      name = BOSS_NAMES[bossKey] || '💀 Unknown Boss';
    } else if (isElite) {
      name = '⭐ Elite ' + MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];
    } else {
      name = MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];
    }

    const monster = {
      id: tab.id,
      name,
      hp: baseHp,
      maxHp: baseHp,
      atk: baseAtk,
      isBoss,
      isElite,
      domain,
      xpReward: Math.floor(baseHp * 0.8) + baseAtk * 2,
      goldReward: Math.floor(Math.random() * 10) + 5 + (isBoss ? 30 : 0) + (isElite ? 15 : 0),
      createdAt: Date.now()
    };

    this.monsters.set(tab.id, monster);
    return monster;
  }

  removeMonster(tabId) {
    this.monsters.delete(tabId);
  }

  getMonster(tabId) {
    return this.monsters.get(tabId) || null;
  }

  getAllMonsters() {
    return Array.from(this.monsters.values());
  }

  getAliveMonsters() {
    return this.getAllMonsters().filter(m => m.hp > 0);
  }

  damageMonster(tabId, damage) {
    const monster = this.monsters.get(tabId);
    if (!monster || monster.hp <= 0) return null;
    monster.hp = Math.max(0, monster.hp - damage);
    return monster;
  }

  _extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
}

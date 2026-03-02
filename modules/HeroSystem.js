import { StorageManager } from './StorageManager.js';

const CLASS_BONUSES = {
  warrior: { hpBonus: 30, atkBonus: 5, defBonus: 3, desc: 'High HP & defense' },
  mage:    { hpBonus: 10, atkBonus: 8, defBonus: 1, desc: 'High attack power' },
  developer: { hpBonus: 20, atkBonus: 6, defBonus: 2, desc: 'Balanced + bonus gold' }
};

const STORAGE_KEY = 'tabquest_hero';

export class HeroSystem {
  constructor() {
    this.storage = new StorageManager();
    this.hero = null;
  }

  async load() {
    const saved = await this.storage.get(STORAGE_KEY);
    if (saved) {
      this.hero = saved;
    }
    return this.hero;
  }

  async save() {
    if (this.hero) {
      await this.storage.set(STORAGE_KEY, this.hero);
    }
  }

  async selectClass(className) {
    const cls = CLASS_BONUSES[className];
    if (!cls) return null;

    this.hero = {
      class: className,
      level: 1,
      xp: 0,
      xpToNext: 100,
      hp: 50 + cls.hpBonus,
      maxHp: 50 + cls.hpBonus,
      atk: 5 + cls.atkBonus,
      def: 2 + cls.defBonus,
      gold: 0,
      inventory: [],
      equipped: { weapon: null, armor: null },
      alive: true,
      respawnAt: 0
    };

    await this.save();
    return this.hero;
  }

  getState() {
    if (!this.hero) {
      return null;
    }
    return { ...this.hero };
  }

  isAlive() {
    if (!this.hero) return false;
    if (!this.hero.alive && Date.now() >= this.hero.respawnAt) {
      this.hero.alive = true;
      this.hero.hp = Math.floor(this.hero.maxHp * 0.5);
      this.save();
    }
    return this.hero.alive;
  }

  takeDamage(amount) {
    if (!this.hero || !this.hero.alive) return;
    const reduced = Math.max(1, amount - this.hero.def);
    this.hero.hp = Math.max(0, this.hero.hp - reduced);
    if (this.hero.hp <= 0) {
      this.hero.alive = false;
      this.hero.respawnAt = Date.now() + 10000;
      const lostGold = Math.floor(this.hero.gold * 0.1);
      this.hero.gold -= lostGold;
    }
    this.save();
  }

  heal(amount) {
    if (!this.hero) return;
    this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + amount);
    this.save();
  }

  addXp(amount) {
    if (!this.hero) return { leveledUp: false };
    this.hero.xp += amount;
    let leveledUp = false;
    while (this.hero.xp >= this.hero.xpToNext) {
      this.hero.xp -= this.hero.xpToNext;
      this.hero.level++;
      this.hero.xpToNext = 100 * this.hero.level * this.hero.level;

      const cls = CLASS_BONUSES[this.hero.class];
      this.hero.maxHp += 5 + Math.floor(cls.hpBonus * 0.2);
      this.hero.hp = this.hero.maxHp;
      this.hero.atk += 1 + Math.floor(cls.atkBonus * 0.15);
      this.hero.def += 1 + Math.floor(cls.defBonus * 0.15);
      leveledUp = true;
    }
    this.save();
    return { leveledUp, level: this.hero.level };
  }

  addGold(amount) {
    if (!this.hero) return;
    const bonus = this.hero.class === 'developer' ? Math.floor(amount * 0.2) : 0;
    this.hero.gold += amount + bonus;
    this.save();
  }

  spendGold(amount) {
    if (!this.hero || this.hero.gold < amount) return false;
    this.hero.gold -= amount;
    this.save();
    return true;
  }

  addItem(item) {
    if (!this.hero) return;
    this.hero.inventory.push(item);
    this.save();
  }

  equipItem(index) {
    if (!this.hero) return false;
    const item = this.hero.inventory[index];
    if (!item || (item.type !== 'weapon' && item.type !== 'armor')) return false;

    const slot = item.type;
    if (this.hero.equipped[slot]) {
      this.hero.inventory.push(this.hero.equipped[slot]);
    }
    this.hero.equipped[slot] = item;
    this.hero.inventory.splice(index, 1);

    this._recalcStats();
    this.save();
    return true;
  }

  _recalcStats() {
    const cls = CLASS_BONUSES[this.hero.class];
    const levelScale = this.hero.level - 1;
    this.hero.atk = 5 + cls.atkBonus + levelScale * (1 + Math.floor(cls.atkBonus * 0.15));
    this.hero.def = 2 + cls.defBonus + levelScale * (1 + Math.floor(cls.defBonus * 0.15));

    if (this.hero.equipped.weapon) this.hero.atk += this.hero.equipped.weapon.stat;
    if (this.hero.equipped.armor) this.hero.def += this.hero.equipped.armor.stat;
  }

  async reset() {
    this.hero = null;
    await this.storage.remove(STORAGE_KEY);
  }
}

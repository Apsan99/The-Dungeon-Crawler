const LOOT_TABLE = [
  { name: 'Rusty Sword', type: 'weapon', stat: 2, rarity: 'common', dropRate: 0.3 },
  { name: 'Wooden Shield', type: 'armor', stat: 1, rarity: 'common', dropRate: 0.3 },
  { name: 'Iron Blade', type: 'weapon', stat: 5, rarity: 'uncommon', dropRate: 0.15 },
  { name: 'Chain Mail', type: 'armor', stat: 3, rarity: 'uncommon', dropRate: 0.15 },
  { name: 'Flame Sword', type: 'weapon', stat: 10, rarity: 'rare', dropRate: 0.06 },
  { name: 'Dragon Plate', type: 'armor', stat: 8, rarity: 'rare', dropRate: 0.06 },
  { name: 'Void Edge', type: 'weapon', stat: 18, rarity: 'epic', dropRate: 0.025 },
  { name: 'Aegis of Code', type: 'armor', stat: 14, rarity: 'epic', dropRate: 0.025 },
  { name: '⚡ Excalibur.exe', type: 'weapon', stat: 30, rarity: 'legendary', dropRate: 0.005 },
  { name: '🛡️ Firewall Supreme', type: 'armor', stat: 25, rarity: 'legendary', dropRate: 0.005 }
];

export class BattleSystem {
  constructor(heroSystem, monsterEngine) {
    this.heroSystem = heroSystem;
    this.monsterEngine = monsterEngine;
    this.targetId = null;
    this.autoAttackTimer = null;
    this.battleLog = [];
  }

  setTarget(tabId) {
    const monster = this.monsterEngine.getMonster(tabId);
    if (monster && monster.hp > 0) {
      this.targetId = tabId;
      return monster;
    }
    return null;
  }

  getTarget() {
    if (!this.targetId) return null;
    return this.monsterEngine.getMonster(this.targetId);
  }

  startAutoAttack(broadcastFn) {
    this.stopAutoAttack();
    this.autoAttackTimer = setInterval(() => {
      this._doAutoRound(broadcastFn);
    }, 4000);
  }

  stopAutoAttack() {
    if (this.autoAttackTimer) {
      clearInterval(this.autoAttackTimer);
      this.autoAttackTimer = null;
    }
  }

  manualAttack(broadcastFn) {
    if (!this.heroSystem.isAlive()) return { error: 'dead' };

    const target = this.getTarget();
    if (!target || target.hp <= 0) {
      this._autoPickTarget();
      const newTarget = this.getTarget();
      if (!newTarget) return { error: 'no_target' };
    }

    const hero = this.heroSystem.getState();
    if (!hero) return { error: 'no_hero' };

    const bonusDmg = Math.floor(hero.atk * 1.5);
    return this._executeAttack(bonusDmg, broadcastFn, true);
  }

  _doAutoRound(broadcastFn) {
    if (!this.heroSystem.isAlive()) {
      broadcastFn({ type: 'HERO_DEAD', respawnAt: this.heroSystem.getState()?.respawnAt });
      return;
    }

    const target = this.getTarget();
    if (!target || target.hp <= 0) {
      this._autoPickTarget();
      if (!this.getTarget()) return;
    }

    const hero = this.heroSystem.getState();
    if (!hero) return;

    this._executeAttack(hero.atk, broadcastFn, false);
  }

  _executeAttack(damage, broadcastFn, isManual) {
    const target = this.getTarget();
    if (!target) return { error: 'no_target' };

    // Hero attacks monster
    const actualDmg = Math.max(1, damage + Math.floor(Math.random() * 3));
    this.monsterEngine.damageMonster(target.id, actualDmg);

    const logEntry = {
      text: `${isManual ? '⚔️' : '🗡️'} You hit ${target.name} for ${actualDmg} dmg!`,
      ts: Date.now()
    };
    this.battleLog.push(logEntry);

    const updatedMonster = this.monsterEngine.getMonster(target.id);

    // Check if monster died
    if (updatedMonster.hp <= 0) {
      const rewards = this._onMonsterKill(updatedMonster);
      broadcastFn({
        type: 'BATTLE_UPDATE',
        heroState: this.heroSystem.getState(),
        monster: updatedMonster,
        log: `${target.name} defeated! +${rewards.xp} XP, +${rewards.gold} gold${rewards.loot ? ', Loot: ' + rewards.loot.name : ''}`,
        rewards
      });
      this._autoPickTarget();
      return { killed: true, rewards };
    }

    // Monster attacks back
    const monsterDmg = Math.max(1, target.atk + Math.floor(Math.random() * 2));
    this.heroSystem.takeDamage(monsterDmg);

    const heroState = this.heroSystem.getState();
    broadcastFn({
      type: 'BATTLE_UPDATE',
      heroState,
      monster: updatedMonster,
      log: `${isManual ? '⚔️' : '🗡️'} Hit ${target.name} for ${actualDmg}. ${target.name} hits back for ${monsterDmg}!`,
    });

    if (!this.heroSystem.isAlive()) {
      broadcastFn({ type: 'HERO_DEAD', respawnAt: heroState.respawnAt });
    }

    return { killed: false, heroDmg: monsterDmg, monsterDmg: actualDmg };
  }

  _onMonsterKill(monster) {
    const xpResult = this.heroSystem.addXp(monster.xpReward);
    this.heroSystem.addGold(monster.goldReward);

    const loot = this._rollLoot(monster);
    if (loot) {
      this.heroSystem.addItem(loot);
    }

    return {
      xp: monster.xpReward,
      gold: monster.goldReward,
      loot,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.level
    };
  }

  _rollLoot(monster) {
    const luckBonus = monster.isBoss ? 0.15 : monster.isElite ? 0.08 : 0;
    for (const item of LOOT_TABLE) {
      if (Math.random() < item.dropRate + luckBonus) {
        return { ...item, id: Date.now() + Math.random() };
      }
    }
    return null;
  }

  _autoPickTarget() {
    const alive = this.monsterEngine.getAliveMonsters();
    if (alive.length > 0) {
      this.targetId = alive[0].id;
    } else {
      this.targetId = null;
    }
  }

  getLog(count = 10) {
    return this.battleLog.slice(-count);
  }
}

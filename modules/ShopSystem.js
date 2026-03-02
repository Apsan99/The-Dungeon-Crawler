export class ShopSystem {
  constructor(heroSystem) {
    this.heroSystem = heroSystem;
  }

  getShopItems() {
    const hero = this.heroSystem.getState();
    const level = hero ? hero.level : 1;

    return [
      {
        id: 'wpn_iron',
        name: 'Iron Sword',
        type: 'weapon',
        stat: 3 + level,
        price: 20 + level * 5,
        rarity: 'common',
        desc: `+${3 + level} ATK`
      },
      {
        id: 'wpn_steel',
        name: 'Steel Blade',
        type: 'weapon',
        stat: 6 + level * 2,
        price: 50 + level * 12,
        rarity: 'uncommon',
        desc: `+${6 + level * 2} ATK`
      },
      {
        id: 'arm_leather',
        name: 'Leather Armor',
        type: 'armor',
        stat: 2 + level,
        price: 15 + level * 4,
        rarity: 'common',
        desc: `+${2 + level} DEF`
      },
      {
        id: 'arm_plate',
        name: 'Plate Armor',
        type: 'armor',
        stat: 5 + level * 2,
        price: 45 + level * 10,
        rarity: 'uncommon',
        desc: `+${5 + level * 2} DEF`
      },
      {
        id: 'pot_health',
        name: 'Health Potion',
        type: 'potion',
        stat: 20 + level * 5,
        price: 10 + level * 2,
        rarity: 'common',
        desc: `Restore ${20 + level * 5} HP`
      },
      {
        id: 'pot_mega',
        name: 'Mega Potion',
        type: 'potion',
        stat: 50 + level * 10,
        price: 30 + level * 5,
        rarity: 'rare',
        desc: `Restore ${50 + level * 10} HP`
      }
    ];
  }

  buyItem(itemId) {
    const items = this.getShopItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return { success: false, error: 'Item not found' };

    const hero = this.heroSystem.getState();
    if (!hero) return { success: false, error: 'No hero' };
    if (hero.gold < item.price) return { success: false, error: 'Not enough gold' };

    const spent = this.heroSystem.spendGold(item.price);
    if (!spent) return { success: false, error: 'Not enough gold' };

    if (item.type === 'potion') {
      this.heroSystem.heal(item.stat);
    } else {
      this.heroSystem.addItem({
        name: item.name,
        type: item.type,
        stat: item.stat,
        rarity: item.rarity,
        id: Date.now() + Math.random()
      });
    }

    return { success: true, item };
  }
}

const SUITS = ['♠', '♣', '♥', '♦'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const CARD_SCORES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11
};

const HAND_NAMES = {
  'Straight Flush': 'Стрит-флеш',
  'Four of a Kind': 'Каре',
  'Full House': 'Фулл-хаус',
  'Flush': 'Флеш',
  'Straight': 'Стрит',
  'Three of a Kind': 'Тройка',
  'Two Pair': 'Две пары',
  'Pair': 'Пара',
  'High Card': 'Старшая карта'
};

const BASE_HANDS = {
  'Straight Flush': { chips: 110, mult: 8 },
  'Four of a Kind': { chips: 86, mult: 5 },
  'Full House': { chips: 64, mult: 4 },
  'Flush': { chips: 52, mult: 4 },
  'Straight': { chips: 42, mult: 4 },
  'Three of a Kind': { chips: 32, mult: 3 },
  'Two Pair': { chips: 22, mult: 2 },
  'Pair': { chips: 12, mult: 2 },
  'High Card': { chips: 5, mult: 1 }
};

const ENHANCEMENTS = [
  { id: 'wild', tag: 'WILD', weight: 8, desc: 'Считается любой мастью для флеша. +6 множителя.' },
  { id: 'glass', tag: 'GLASS', weight: 8, desc: '+16 фишек и X1.25.' },
  { id: 'void', tag: 'VOID', weight: 6, desc: '+10 фишек, X1.2 и эффекты пустоты.' },
  { id: 'solar', tag: 'SOL', weight: 7, desc: '+26 фишек и +4 множителя.' },
  { id: 'lucky', tag: 'LUCK', weight: 7, desc: '+8 фишек, +3 множителя, а 7/A дают еще бонус.' },
  { id: 'steel', tag: 'STEEL', weight: 7, desc: '+14 фишек и +5 множителя.' },
  { id: 'neon', tag: 'NEON', weight: 7, desc: '+4 множителя и X1.12.' },
  { id: 'echo', tag: 'ECHO', weight: 6, desc: 'Если есть дубликат ранга, +18 фишек.' },
  { id: 'cursed', tag: 'CURSE', weight: 4, desc: '+34 фишки, но -5 множителя.' }
];

const ENHANCEMENT_BY_ID = Object.fromEntries(
  ENHANCEMENTS.map(item => [item.id, item])
);

const JOKERS = [
  {
    id: 'riot_core',
    name: 'Ядро Бунта',
    rarity: 'rare',
    price: 9,
    desc: '+10 к множителю, если накал 70%+.',
    apply(ctx) {
      if (ctx.heat >= 70) {
        ctx.mult += 10;
        ctx.note('Ядро Бунта +10 множ.');
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'prism_eye',
    name: 'Глаз Призмы',
    rarity: 'rare',
    price: 10,
    desc: '+20 к множителю, если в руке 4 разные масти.',
    apply(ctx) {
      const suitCount = new Set(ctx.cards.map(card => card.suit)).size;
      if (suitCount === 4) {
        ctx.mult += 20;
        ctx.note('Глаз Призмы +20 множ.');
        ctx.fx.beams = true;
      }
    }
  },
  {
    id: 'meteor_smile',
    name: 'Улыбка Метеора',
    rarity: 'common',
    price: 8,
    desc: '+12 фишек за каждую сыгранную карту.',
    apply(ctx) {
      const bonus = ctx.cards.length * 12;
      ctx.chips += bonus;
      ctx.note(`Улыбка Метеора +${bonus} фишек`);
      ctx.fx.meteors = true;
    }
  },
  {
    id: 'void_mouth',
    name: 'Пасть Пустоты',
    rarity: 'rare',
    price: 11,
    desc: 'Если есть дикая или пустотная карта, X1.5.',
    apply(ctx) {
      if (ctx.hasEnhancement('wild') || ctx.hasEnhancement('void')) {
        ctx.xmult *= 1.5;
        ctx.note('Пасть Пустоты X1.5');
        ctx.fx.blackHole = true;
      }
    }
  },
  {
    id: 'blood_mirror',
    name: 'Кровавое Зеркало',
    rarity: 'common',
    price: 8,
    desc: '+4 к множителю за каждую ♥ и ♦.',
    apply(ctx) {
      const redCount = ctx.cards.filter(card => card.suit === '♥' || card.suit === '♦').length;
      if (redCount > 0) {
        const bonus = redCount * 4;
        ctx.mult += bonus;
        ctx.note(`Кровавое Зеркало +${bonus} множ.`);
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'solar_crown',
    name: 'Солнечная Корона',
    rarity: 'rare',
    price: 11,
    desc: '+18 фишек за каждую J, Q, K, A.',
    apply(ctx) {
      const faceCount = ctx.cards.filter(card => ['J', 'Q', 'K', 'A'].includes(card.value)).length;
      if (faceCount > 0) {
        const bonus = faceCount * 18;
        ctx.chips += bonus;
        ctx.note(`Солнечная Корона +${bonus} фишек`);
        ctx.fx.explosion = true;
      }
    }
  },
  {
    id: 'spiral_engine',
    name: 'Спиральный Двигатель',
    rarity: 'rare',
    price: 10,
    desc: '+12 к множителю для стрита и стрит-флеша.',
    apply(ctx) {
      if (ctx.handType === 'Straight' || ctx.handType === 'Straight Flush') {
        ctx.mult += 12;
        ctx.note('Спиральный Двигатель +12 множ.');
        ctx.fx.beams = true;
      }
    }
  },
  {
    id: 'abyss_clock',
    name: 'Часы Бездны',
    rarity: 'legendary',
    price: 14,
    desc: 'На последней руке X2.4.',
    apply(ctx) {
      if (ctx.handsLeftBefore === 1) {
        ctx.xmult *= 2.4;
        ctx.note('Часы Бездны X2.4');
        ctx.fx.blackHole = true;
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'twin_mask',
    name: 'Двойная Маска',
    rarity: 'common',
    price: 7,
    desc: '+10 к множителю для пары, двух пар и фулл-хауса.',
    apply(ctx) {
      if (ctx.handType === 'Pair' || ctx.handType === 'Two Pair' || ctx.handType === 'Full House') {
        ctx.mult += 10;
        ctx.note('Двойная Маска +10 множ.');
      }
    }
  },
  {
    id: 'glass_printer',
    name: 'Стеклянный Принтер',
    rarity: 'rare',
    price: 10,
    desc: 'Если есть стеклянная карта, X1.6.',
    apply(ctx) {
      if (ctx.hasEnhancement('glass')) {
        ctx.xmult *= 1.6;
        ctx.note('Стеклянный Принтер X1.6');
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'forge_hammer',
    name: 'Молот Кузни',
    rarity: 'common',
    price: 8,
    desc: '+10 фишек за каждую супер-карту в руке.',
    apply(ctx) {
      if (ctx.enhancedCount > 0) {
        const bonus = ctx.enhancedCount * 10;
        ctx.chips += bonus;
        ctx.note(`Молот Кузни +${bonus} фишек`);
      }
    }
  },
  {
    id: 'crown_of_flush',
    name: 'Корона Флеша',
    rarity: 'legendary',
    price: 13,
    desc: 'Флеш и стрит-флеш получают X1.8.',
    apply(ctx) {
      if (ctx.handType === 'Flush' || ctx.handType === 'Straight Flush') {
        ctx.xmult *= 1.8;
        ctx.note('Корона Флеша X1.8');
        ctx.fx.beams = true;
      }
    }
  },
  {
    id: 'steel_hunger',
    name: 'Стальной Голод',
    rarity: 'rare',
    price: 10,
    desc: 'Если есть стальная карта, +40 фишек и +6 множителя.',
    apply(ctx) {
      if (ctx.hasEnhancement('steel')) {
        ctx.chips += 40;
        ctx.mult += 6;
        ctx.note('Стальной Голод +40 фишек и +6 множ.');
      }
    }
  },
  {
    id: 'jackpot_orbit',
    name: 'Орбита Джекпота',
    rarity: 'rare',
    price: 11,
    desc: 'Если сыграно ровно 5 карт, +25 фишек и X1.5.',
    apply(ctx) {
      if (ctx.cards.length === 5) {
        ctx.chips += 25;
        ctx.xmult *= 1.5;
        ctx.note('Орбита Джекпота +25 фишек и X1.5');
        ctx.fx.explosion = true;
      }
    }
  },
  {
    id: 'chaos_tower',
    name: 'Башня Хаоса',
    rarity: 'rare',
    price: 10,
    desc: 'Если в руке 3+ масти, +8 множителя и X1.4.',
    apply(ctx) {
      const suits = new Set(ctx.cards.map(card => card.suit)).size;
      if (suits >= 3) {
        ctx.mult += 8;
        ctx.xmult *= 1.4;
        ctx.note('Башня Хаоса +8 множ. и X1.4');
      }
    }
  },
  {
    id: 'supernova_laugh',
    name: 'Смех Сверхновой',
    rarity: 'legendary',
    price: 14,
    desc: 'Если 2+ картинок или тузов, +30 фишек и X1.25.',
    apply(ctx) {
      const faceCount = ctx.cards.filter(card => ['J', 'Q', 'K', 'A'].includes(card.value)).length;
      if (faceCount >= 2) {
        ctx.chips += 30;
        ctx.xmult *= 1.25;
        ctx.note('Смех Сверхновой +30 фишек и X1.25');
        ctx.fx.explosion = true;
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'reactor_angel',
    name: 'Ангел Реактора',
    rarity: 'rare',
    price: 11,
    desc: 'Накал 90%+ дает X1.8.',
    apply(ctx) {
      if (ctx.heat >= 90) {
        ctx.xmult *= 1.8;
        ctx.note('Ангел Реактора X1.8');
        ctx.fx.flash = true;
        ctx.fx.explosion = true;
      }
    }
  },
  {
    id: 'cheap_trick',
    name: 'Дешевый Фокус',
    rarity: 'common',
    price: 7,
    desc: 'Старшая карта и пара получают +22 фишки.',
    apply(ctx) {
      if (ctx.handType === 'High Card' || ctx.handType === 'Pair') {
        ctx.chips += 22;
        ctx.note('Дешевый Фокус +22 фишки');
      }
    }
  },
  {
    id: 'echo_well',
    name: 'Колодец Эха',
    rarity: 'rare',
    price: 10,
    desc: 'Если есть эхо-карта, X1.5 и +10 множителя.',
    apply(ctx) {
      if (ctx.hasEnhancement('echo')) {
        ctx.xmult *= 1.5;
        ctx.mult += 10;
        ctx.note('Колодец Эха X1.5 и +10 множ.');
      }
    }
  }
];

const JOKER_BY_ID = Object.fromEntries(JOKERS.map(item => [item.id, item]));

const RELICS = [
  {
    id: 'forge_core',
    name: 'Ядро Кузницы',
    rarity: 'rare',
    price: 9,
    desc: '+8% к шансу супер-карт.',
    key: 'superRate',
    delta: 1,
    max: 4
  },
  {
    id: 'extra_hand',
    name: 'Лишняя Рука',
    rarity: 'legendary',
    price: 12,
    desc: '+1 рука каждый раунд.',
    key: 'extraHands',
    delta: 1,
    max: 2
  },
  {
    id: 'extra_discard',
    name: 'Панель Сброса',
    rarity: 'rare',
    price: 9,
    desc: '+1 сброс каждый раунд.',
    key: 'extraDiscards',
    delta: 1,
    max: 2
  },
  {
    id: 'vault_bonus',
    name: 'Золотой Накопитель',
    rarity: 'common',
    price: 7,
    desc: '+3 монеты за победу.',
    key: 'rewardBonus',
    delta: 3,
    max: 3
  },
  {
    id: 'overheat_core',
    name: 'Сердце Перегрева',
    rarity: 'legendary',
    price: 12,
    desc: 'Перегрев дает еще +6 множителя.',
    key: 'overheatBonus',
    delta: 6,
    max: 2
  },
  {
    id: 'starter_heat',
    name: 'Тепловой Запуск',
    rarity: 'rare',
    price: 9,
    desc: 'Каждый раунд начинается с +15% накала.',
    key: 'startHeat',
    delta: 1,
    max: 3
  },
  {
    id: 'void_lens',
    name: 'Линза Пустоты',
    rarity: 'rare',
    price: 10,
    desc: 'Пустотные карты сильнее.',
    key: 'voidBoost',
    delta: 1,
    max: 3
  },
  {
    id: 'glass_lab',
    name: 'Стеклянная Лаборатория',
    rarity: 'rare',
    price: 10,
    desc: 'Стеклянные карты сильнее.',
    key: 'glassBoost',
    delta: 1,
    max: 3
  },
  {
    id: 'lucky_star',
    name: 'Счастливая Звезда',
    rarity: 'rare',
    price: 10,
    desc: 'Удачливые карты сильнее.',
    key: 'luckyBoost',
    delta: 1,
    max: 3
  },
  {
    id: 'boss_purse',
    name: 'Кошель Босса',
    rarity: 'legendary',
    price: 12,
    desc: '+4 монеты за победу над боссом.',
    key: 'bossReward',
    delta: 4,
    max: 2
  }
];

const RELIC_BY_ID = Object.fromEntries(RELICS.map(item => [item.id, item]));

const BOSS_BLINDS = [
  {
    id: 'inferno',
    name: 'ИНФЕРНО',
    scene: 'inferno',
    targetMul: 1.22,
    desc: '+22% к цели. Накал растет быстрее.'
  },
  {
    id: 'void',
    name: 'ПУСТОТА',
    scene: 'void',
    targetMul: 1.14,
    desc: '+14% к цели. X-множители сильнее, но опаснее.'
  },
  {
    id: 'storm',
    name: 'ШТОРМ',
    scene: 'storm',
    targetMul: 1.18,
    desc: '+18% к цели. +1 рука, но -1 сброс.'
  },
  {
    id: 'titan',
    name: 'ТИТАН',
    scene: 'cataclysm',
    targetMul: 1.30,
    desc: '+30% к цели. Большие руки дают больше награды.'
  }
];

const ROOM_POOL = [
  {
    id: 'shop',
    name: 'ЛАВКА',
    type: 'safe',
    desc: 'Купить джокеры и реликвии за монеты.',
    extra: 'Без штрафов.'
  },
  {
    id: 'event',
    name: 'СОБЫТИЕ',
    type: 'risky',
    desc: 'Случайный выбор: можно очень усилиться, но иногда есть цена.',
    extra: 'Опасные варианты всегда показывают предупреждение.'
  },
  {
    id: 'vault',
    name: 'ХРАНИЛИЩЕ',
    type: 'safe',
    desc: 'Мгновенно получить монеты.',
    extra: '+8–16 монет.'
  },
  {
    id: 'rest',
    name: 'ПЕРЕДЫШКА',
    type: 'safe',
    desc: 'Сбросить накал и получить помощь в следующем раунде.',
    extra: '-25% накала и +1 рука на следующий раунд.'
  },
  {
    id: 'forge',
    name: 'КУЗНИЦА',
    type: 'special',
    desc: 'Выбрать одно улучшение забега.',
    extra: 'Усиляет конкретный стиль игры.'
  }
];

const EVENTS = [
  {
    id: 'void_deal',
    title: 'СДЕЛКА ПУСТОТЫ',
    text: 'Разлом шепчет: “Я дам силу сейчас, но цену ты вспомнишь потом.”',
    scene: 'void',
    options: [
      {
        label: 'Принять сделку',
        preview: '+1 случайный легендарный джокер, но -1 рука в следующем раунде.',
        warningTitle: 'СДЕЛКА ПУСТОТЫ',
        warningText: 'Ты получишь очень сильный джокер, но следующий блайнд начнется с одной рукой меньше.',
        apply(state) {
          const joker = giveRandomJoker(state, 'legendary');
          state.temp.extraHands -= 1;
          return joker
            ? `Получен джокер: ${joker.name}. Следующий раунд: -1 рука.`
            : 'Легендарных джокеров уже не осталось.';
        }
      },
      {
        label: 'Собрать пыль',
        preview: '+10 монет и +20% накала.',
        apply(state) {
          state.money += 10;
          state.heat = Math.min(100, state.heat + 20);
          return 'Ты вытащил 10 монет и поднял накал.';
        }
      },
      {
        label: 'Осторожно отступить',
        preview: '+1 сброс в следующем раунде.',
        apply(state) {
          state.temp.extraDiscards += 1;
          return 'Следующий раунд начнется с +1 сбросом.';
        }
      }
    ]
  },
  {
    id: 'shattered_atm',
    title: 'РАЗБИТЫЙ БАНКОМАТ',
    text: 'Автомат искрит. Можно аккуратно забрать деньги, а можно раскурочить его до конца.',
    scene: 'storm',
    options: [
      {
        label: 'Вскрыть тихо',
        preview: '+8 монет без штрафа.',
        apply(state) {
          state.money += 8;
          return 'Ты тихо забрал 8 монет.';
        }
      },
      {
        label: 'Разнести к чертям',
        preview: '+16 монет, но +30% накала.',
        warningTitle: 'ЛОМАЕМ БАНКОМАТ',
        warningText: 'Монет будет больше, но накал резко подскочит уже сейчас.',
        apply(state) {
          state.money += 16;
          state.heat = Math.min(100, state.heat + 30);
          return 'Ты выбил 16 монет, но стол пошел в перегруз.';
        }
      }
    ]
  },
  {
    id: 'star_forge',
    title: 'ЗВЕЗДНАЯ КУЗНЯ',
    text: 'Над столом висит раскаленное кольцо. Оно усиливает карты, но требует выбрать направление.',
    scene: 'cataclysm',
    options: [
      {
        label: 'Питать супер-карты',
        preview: '+8% к шансу супер-карт навсегда.',
        apply(state) {
          state.meta.superRate += 1;
          return 'Шанс супер-карт стал выше.';
        }
      },
      {
        label: 'Стеклянный путь',
        preview: 'Стеклянные карты навсегда сильнее.',
        apply(state) {
          state.meta.glassBoost += 1;
          return 'Стеклянные карты стали сильнее.';
        }
      },
      {
        label: 'Пустотный путь',
        preview: 'Пустотные карты навсегда сильнее.',
        apply(state) {
          state.meta.voidBoost += 1;
          return 'Пустотные карты стали сильнее.';
        }
      }
    ]
  },
  {
    id: 'nurse_of_heat',
    title: 'МЕДСЕСТРА НАКАЛА',
    text: 'Тебе предлагают охладить установку или наоборот завести ее еще сильнее.',
    scene: 'ocean',
    options: [
      {
        label: 'Охлаждение',
        preview: '-35% накала и +1 рука в следующем раунде.',
        apply(state) {
          state.heat = Math.max(0, state.heat - 35);
          state.temp.extraHands += 1;
          return 'Установка остыла. Следующий блайнд: +1 рука.';
        }
      },
      {
        label: 'Разогрев',
        preview: '+35% накала и +1 случайный редкий джокер.',
        warningTitle: 'РАЗГОН РЕАКТОРА',
        warningText: 'Накал резко вырастет, но ты получишь редкий джокер.',
        apply(state) {
          state.heat = Math.min(100, state.heat + 35);
          const joker = giveRandomJoker(state, 'rare');
          return joker ? `Получен джокер: ${joker.name}. Накал вырос.` : 'Редких джокеров уже не осталось.';
        }
      }
    ]
  },
  {
    id: 'cursed_offer',
    title: 'ПРОКЛЯТОЕ ПРЕДЛОЖЕНИЕ',
    text: 'Тень кладет на стол темную реликвию. Она сильна, но в ней нет ничего бесплатного.',
    scene: 'inferno',
    options: [
      {
        label: 'Взять реликвию',
        preview: '+1 рука каждый раунд, но следующая цель станет на 15% выше.',
        warningTitle: 'ПРОКЛЯТАЯ РЕЛИКВИЯ',
        warningText: 'Ты получишь сильный перманентный бонус, но следующий блайнд станет заметно тяжелее.',
        apply(state) {
          state.meta.extraHands += 1;
          state.temp.targetMul *= 1.15;
          return 'Ты взял силу. Следующий блайнд станет тяжелее на 15%.';
        }
      },
      {
        label: 'Сжечь сделку',
        preview: '+12 монет и без штрафа.',
        apply(state) {
          state.money += 12;
          return 'Ты сжег контракт и забрал 12 монет.';
        }
      }
    ]
  },
  {
    id: 'royal_audience',
    title: 'КОРОЛЕВСКАЯ АУДИЕНЦИЯ',
    text: 'Тебе предлагают выбрать стиль следующего рывка.',
    scene: 'base',
    options: [
      {
        label: 'Играть от лицевых',
        preview: '+1 к силе солнечных эффектов и +1 к силе удачливых карт.',
        apply(state) {
          state.meta.luckyBoost += 1;
          return 'Лицевые и удачливые карты стали сильнее.';
        }
      },
      {
        label: 'Играть от перегрева',
        preview: 'Перегрев навсегда становится сильнее.',
        apply(state) {
          state.meta.overheatBonus += 3;
          return 'Перегрев стал еще опаснее и мощнее.';
        }
      },
      {
        label: 'Играть надежно',
        preview: '+1 сброс в следующем раунде и +6 монет.',
        apply(state) {
          state.temp.extraDiscards += 1;
          state.money += 6;
          return 'Следующий раунд будет безопаснее.';
        }
      }
    ]
  }
];

function chooseWeighted(list) {
  const sum = list.reduce((acc, item) => acc + item.weight, 0);
  let roll = Math.random() * sum;
  for (const item of list) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return list[list.length - 1];
}

function getBossForLevel(level) {
  if (level % 4 !== 0) return null;
  const idx = Math.floor(level / 4 - 1) % BOSS_BLINDS.length;
  return BOSS_BLINDS[idx];
}
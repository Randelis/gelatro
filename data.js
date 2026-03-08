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
  { id: 'wild', tag: 'WILD', weight: 8, desc: 'Подходит под любую масть для флеша. Ещё даёт +6 к множителю.' },
  { id: 'glass', tag: 'GLASS', weight: 8, desc: 'Даёт +16 фишек и X1.25.' },
  { id: 'void', tag: 'VOID', weight: 6, desc: 'Даёт +10 фишек, X1.2 и включает пустотные эффекты.' },
  { id: 'solar', tag: 'SOL', weight: 7, desc: 'Даёт +26 фишек и +4 к множителю.' },
  { id: 'lucky', tag: 'LUCK', weight: 7, desc: 'Даёт +8 фишек и +3 к множителю. Семёрка и туз усиливаются ещё сильнее.' },
  { id: 'steel', tag: 'STEEL', weight: 7, desc: 'Даёт +14 фишек и +5 к множителю.' },
  { id: 'neon', tag: 'NEON', weight: 7, desc: 'Даёт +4 к множителю и X1.12.' },
  { id: 'echo', tag: 'ECHO', weight: 6, desc: 'Если в руке есть такая же карта по значению, даёт бонус.' },
  { id: 'cursed', tag: 'CURSE', weight: 4, desc: 'Много фишек сразу, но режет множитель.' }
];

const ENHANCEMENT_BY_ID = Object.fromEntries(
  ENHANCEMENTS.map(item => [item.id, item])
);

const JOKERS = [
  {
    id: 'riot_core',
    name: 'Ядро бунта',
    rarity: 'rare',
    price: 9,
    desc: 'Если накал 70% или выше, даёт +10 к множителю.',
    apply(ctx) {
      if (ctx.heat >= 70) {
        ctx.mult += 10;
        ctx.note('Ядро бунта: +10 к множителю');
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'prism_eye',
    name: 'Глаз призмы',
    rarity: 'rare',
    price: 10,
    desc: 'Если в руке 4 разные масти, даёт +20 к множителю.',
    apply(ctx) {
      const suitCount = new Set(ctx.cards.map(card => card.suit)).size;
      if (suitCount === 4) {
        ctx.mult += 20;
        ctx.note('Глаз призмы: +20 к множителю');
        ctx.fx.beams = true;
      }
    }
  },
  {
    id: 'meteor_smile',
    name: 'Улыбка метеора',
    rarity: 'common',
    price: 8,
    desc: 'Даёт +12 фишек за каждую сыгранную карту.',
    apply(ctx) {
      const bonus = ctx.cards.length * 12;
      ctx.chips += bonus;
      ctx.note(`Улыбка метеора: +${bonus} фишек`);
      ctx.fx.meteors = true;
    }
  },
  {
    id: 'void_mouth',
    name: 'Пасть пустоты',
    rarity: 'rare',
    price: 11,
    desc: 'Если есть дикая или пустотная карта, даёт X1.5.',
    apply(ctx) {
      if (ctx.hasEnhancement('wild') || ctx.hasEnhancement('void')) {
        ctx.xmult *= 1.5;
        ctx.note('Пасть пустоты: X1.5');
        ctx.fx.blackHole = true;
      }
    }
  },
  {
    id: 'blood_mirror',
    name: 'Кровавое зеркало',
    rarity: 'common',
    price: 8,
    desc: 'Даёт +4 к множителю за каждую ♥ и ♦.',
    apply(ctx) {
      const redCount = ctx.cards.filter(card => card.suit === '♥' || card.suit === '♦').length;
      if (redCount > 0) {
        const bonus = redCount * 4;
        ctx.mult += bonus;
        ctx.note(`Кровавое зеркало: +${bonus} к множителю`);
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'solar_crown',
    name: 'Солнечная корона',
    rarity: 'rare',
    price: 11,
    desc: 'Даёт +18 фишек за каждую J, Q, K и A.',
    apply(ctx) {
      const faceCount = ctx.cards.filter(card => ['J', 'Q', 'K', 'A'].includes(card.value)).length;
      if (faceCount > 0) {
        const bonus = faceCount * 18;
        ctx.chips += bonus;
        ctx.note(`Солнечная корона: +${bonus} фишек`);
        ctx.fx.explosion = true;
      }
    }
  },
  {
    id: 'spiral_engine',
    name: 'Спиральный двигатель',
    rarity: 'rare',
    price: 10,
    desc: 'Стрит и стрит-флеш получают +12 к множителю.',
    apply(ctx) {
      if (ctx.handType === 'Straight' || ctx.handType === 'Straight Flush') {
        ctx.mult += 12;
        ctx.note('Спиральный двигатель: +12 к множителю');
        ctx.fx.beams = true;
      }
    }
  },
  {
    id: 'abyss_clock',
    name: 'Часы бездны',
    rarity: 'legendary',
    price: 14,
    desc: 'На последней руке даёт X2.4.',
    apply(ctx) {
      if (ctx.handsLeftBefore === 1) {
        ctx.xmult *= 2.4;
        ctx.note('Часы бездны: X2.4');
        ctx.fx.blackHole = true;
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'twin_mask',
    name: 'Двойная маска',
    rarity: 'common',
    price: 7,
    desc: 'Пара, две пары и фулл-хаус получают +10 к множителю.',
    apply(ctx) {
      if (ctx.handType === 'Pair' || ctx.handType === 'Two Pair' || ctx.handType === 'Full House') {
        ctx.mult += 10;
        ctx.note('Двойная маска: +10 к множителю');
      }
    }
  },
  {
    id: 'glass_printer',
    name: 'Стеклянный принтер',
    rarity: 'rare',
    price: 10,
    desc: 'Если есть стеклянная карта, даёт X1.6.',
    apply(ctx) {
      if (ctx.hasEnhancement('glass')) {
        ctx.xmult *= 1.6;
        ctx.note('Стеклянный принтер: X1.6');
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'forge_hammer',
    name: 'Молот кузни',
    rarity: 'common',
    price: 8,
    desc: 'Даёт +10 фишек за каждую усиленную карту в руке.',
    apply(ctx) {
      if (ctx.enhancedCount > 0) {
        const bonus = ctx.enhancedCount * 10;
        ctx.chips += bonus;
        ctx.note(`Молот кузни: +${bonus} фишек`);
      }
    }
  },
  {
    id: 'crown_of_flush',
    name: 'Корона флеша',
    rarity: 'legendary',
    price: 13,
    desc: 'Флеш и стрит-флеш получают X1.8.',
    apply(ctx) {
      if (ctx.handType === 'Flush' || ctx.handType === 'Straight Flush') {
        ctx.xmult *= 1.8;
        ctx.note('Корона флеша: X1.8');
        ctx.fx.beams = true;
      }
    }
  },
  {
    id: 'steel_hunger',
    name: 'Стальной голод',
    rarity: 'rare',
    price: 10,
    desc: 'Если есть стальная карта, даёт +40 фишек и +6 к множителю.',
    apply(ctx) {
      if (ctx.hasEnhancement('steel')) {
        ctx.chips += 40;
        ctx.mult += 6;
        ctx.note('Стальной голод: +40 фишек и +6 к множителю');
      }
    }
  },
  {
    id: 'jackpot_orbit',
    name: 'Орбита джекпота',
    rarity: 'rare',
    price: 11,
    desc: 'Если сыграно ровно 5 карт, даёт +25 фишек и X1.5.',
    apply(ctx) {
      if (ctx.cards.length === 5) {
        ctx.chips += 25;
        ctx.xmult *= 1.5;
        ctx.note('Орбита джекпота: +25 фишек и X1.5');
        ctx.fx.explosion = true;
      }
    }
  },
  {
    id: 'chaos_tower',
    name: 'Башня хаоса',
    rarity: 'rare',
    price: 10,
    desc: 'Если в руке 3 или больше мастей, даёт +8 к множителю и X1.4.',
    apply(ctx) {
      const suits = new Set(ctx.cards.map(card => card.suit)).size;
      if (suits >= 3) {
        ctx.mult += 8;
        ctx.xmult *= 1.4;
        ctx.note('Башня хаоса: +8 к множителю и X1.4');
      }
    }
  },
  {
    id: 'supernova_laugh',
    name: 'Смех сверхновой',
    rarity: 'legendary',
    price: 14,
    desc: 'Если есть хотя бы 2 картинки или туза, даёт +30 фишек и X1.25.',
    apply(ctx) {
      const faceCount = ctx.cards.filter(card => ['J', 'Q', 'K', 'A'].includes(card.value)).length;
      if (faceCount >= 2) {
        ctx.chips += 30;
        ctx.xmult *= 1.25;
        ctx.note('Смех сверхновой: +30 фишек и X1.25');
        ctx.fx.explosion = true;
        ctx.fx.flash = true;
      }
    }
  },
  {
    id: 'reactor_angel',
    name: 'Ангел реактора',
    rarity: 'rare',
    price: 11,
    desc: 'Если накал 90% или выше, даёт X1.8.',
    apply(ctx) {
      if (ctx.heat >= 90) {
        ctx.xmult *= 1.8;
        ctx.note('Ангел реактора: X1.8');
        ctx.fx.flash = true;
        ctx.fx.explosion = true;
      }
    }
  },
  {
    id: 'cheap_trick',
    name: 'Дешёвый фокус',
    rarity: 'common',
    price: 7,
    desc: 'Старшая карта и пара получают +22 фишки.',
    apply(ctx) {
      if (ctx.handType === 'High Card' || ctx.handType === 'Pair') {
        ctx.chips += 22;
        ctx.note('Дешёвый фокус: +22 фишки');
      }
    }
  },
  {
    id: 'echo_well',
    name: 'Колодец эха',
    rarity: 'rare',
    price: 10,
    desc: 'Если есть эхо-карта, даёт X1.5 и +10 к множителю.',
    apply(ctx) {
      if (ctx.hasEnhancement('echo')) {
        ctx.xmult *= 1.5;
        ctx.mult += 10;
        ctx.note('Колодец эха: X1.5 и +10 к множителю');
      }
    }
  }
];

const JOKER_BY_ID = Object.fromEntries(JOKERS.map(item => [item.id, item]));

const RELICS = [
  {
    id: 'forge_core',
    name: 'Ядро кузницы',
    rarity: 'rare',
    price: 9,
    desc: 'Чаще выпадают усиленные карты.',
    key: 'superRate',
    delta: 1,
    max: 4
  },
  {
    id: 'extra_hand',
    name: 'Лишняя рука',
    rarity: 'legendary',
    price: 12,
    desc: '+1 рука каждый раунд.',
    key: 'extraHands',
    delta: 1,
    max: 2
  },
  {
    id: 'extra_discard',
    name: 'Панель сброса',
    rarity: 'rare',
    price: 9,
    desc: '+1 сброс каждый раунд.',
    key: 'extraDiscards',
    delta: 1,
    max: 2
  },
  {
    id: 'vault_bonus',
    name: 'Золотой накопитель',
    rarity: 'common',
    price: 7,
    desc: '+3 монеты за каждую победу.',
    key: 'rewardBonus',
    delta: 3,
    max: 3
  },
  {
    id: 'overheat_core',
    name: 'Сердце перегрева',
    rarity: 'legendary',
    price: 12,
    desc: 'Перегрев становится сильнее.',
    key: 'overheatBonus',
    delta: 6,
    max: 2
  },
  {
    id: 'starter_heat',
    name: 'Тепловой старт',
    rarity: 'rare',
    price: 9,
    desc: 'Каждый раунд начинается с накалом.',
    key: 'startHeat',
    delta: 1,
    max: 3
  },
  {
    id: 'void_lens',
    name: 'Линза пустоты',
    rarity: 'rare',
    price: 10,
    desc: 'Пустотные карты становятся сильнее.',
    key: 'voidBoost',
    delta: 1,
    max: 3
  },
  {
    id: 'glass_lab',
    name: 'Стеклянная лаборатория',
    rarity: 'rare',
    price: 10,
    desc: 'Стеклянные карты становятся сильнее.',
    key: 'glassBoost',
    delta: 1,
    max: 3
  },
  {
    id: 'lucky_star',
    name: 'Счастливая звезда',
    rarity: 'rare',
    price: 10,
    desc: 'Удачливые карты становятся сильнее.',
    key: 'luckyBoost',
    delta: 1,
    max: 3
  },
  {
    id: 'boss_purse',
    name: 'Кошель босса',
    rarity: 'legendary',
    price: 12,
    desc: 'Победа над боссом даёт больше монет.',
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
    desc: '+14% к цели. X-множители становятся сильнее.'
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
    desc: '+30% к цели. Сильные руки приносят больше награды.'
  }
];

const ROOM_POOL = [
  {
    id: 'shop',
    name: 'Лавка',
    type: 'safe',
    desc: 'Купить джокеры и реликвии за монеты.',
    extra: 'Спокойный вариант.'
  },
  {
    id: 'event',
    name: 'Событие',
    type: 'risky',
    desc: 'Можно хорошо усилиться, но иногда придётся чем-то заплатить.',
    extra: 'Опасные варианты всегда помечены.'
  },
  {
    id: 'vault',
    name: 'Хранилище',
    type: 'safe',
    desc: 'Быстрые монеты без подвоха.',
    extra: '+8–16 монет.'
  },
  {
    id: 'rest',
    name: 'Передышка',
    type: 'safe',
    desc: 'Сбросить часть накала и облегчить следующий раунд.',
    extra: '-25% накала и +1 рука.'
  },
  {
    id: 'forge',
    name: 'Кузница',
    type: 'special',
    desc: 'Выбрать одно постоянное усиление забега.',
    extra: 'Работает на перспективу.'
  }
];

const EVENTS = [
  {
    id: 'void_deal',
    title: 'СДЕЛКА ПУСТОТЫ',
    text: 'Разлом шепчет: «Я дам силу сейчас, но цену ты вспомнишь потом».',
    scene: 'void',
    options: [
      {
        label: 'Принять сделку',
        preview: '+1 случайный легендарный джокер, но -1 рука в следующем раунде.',
        warningTitle: 'СДЕЛКА ПУСТОТЫ',
        warningText: 'Получишь очень сильный джокер, но следующий блайнд начнётся с одной рукой меньше.',
        apply(state) {
          const joker = giveRandomJoker(state, 'legendary');
          state.temp.extraHands -= 1;
          return joker
            ? `Получен джокер: ${joker.name}. Следующий раунд: -1 рука.`
            : 'Легендарных джокеров уже не осталось.';
        }
      },
      {
        label: 'Собрать осколки',
        preview: '+10 монет и +20% накала.',
        apply(state) {
          state.money += 10;
          state.heat = Math.min(100, state.heat + 20);
          return 'Ты забрал 10 монет и поднял накал.';
        }
      },
      {
        label: 'Отойти без шума',
        preview: '+1 сброс в следующем раунде.',
        apply(state) {
          state.temp.extraDiscards += 1;
          return 'Следующий раунд начнётся с +1 сбросом.';
        }
      }
    ]
  },
  {
    id: 'shattered_atm',
    title: 'РАЗБИТЫЙ БАНКОМАТ',
    text: 'Автомат искрит. Можно снять деньги аккуратно, а можно выбить всё сразу.',
    scene: 'storm',
    options: [
      {
        label: 'Забрать спокойно',
        preview: '+8 монет без штрафа.',
        apply(state) {
          state.money += 8;
          return 'Ты спокойно забрал 8 монет.';
        }
      },
      {
        label: 'Разнести его',
        preview: '+16 монет, но +30% накала.',
        warningTitle: 'ЛОМАЕМ БАНКОМАТ',
        warningText: 'Монет будет больше, но накал резко подскочит уже сейчас.',
        apply(state) {
          state.money += 16;
          state.heat = Math.min(100, state.heat + 30);
          return 'Ты выбил 16 монет, но стол пошёл в перегруз.';
        }
      }
    ]
  },
  {
    id: 'star_forge',
    title: 'ЗВЁЗДНАЯ КУЗНЯ',
    text: 'Над столом висит раскалённое кольцо. Оно усиливает карты, если выбрать путь.',
    scene: 'cataclysm',
    options: [
      {
        label: 'Кормить супер-карты',
        preview: '+8% к шансу супер-карт навсегда.',
        apply(state) {
          state.meta.superRate += 1;
          return 'Шанс супер-карт стал выше.';
        }
      },
      {
        label: 'Стеклянный путь',
        preview: 'Стеклянные карты становятся сильнее навсегда.',
        apply(state) {
          state.meta.glassBoost += 1;
          return 'Стеклянные карты усилены.';
        }
      },
      {
        label: 'Пустотный путь',
        preview: 'Пустотные карты становятся сильнее навсегда.',
        apply(state) {
          state.meta.voidBoost += 1;
          return 'Пустотные карты усилены.';
        }
      }
    ]
  },
  {
    id: 'nurse_of_heat',
    title: 'МЕДСЕСТРА НАКАЛА',
    text: 'Тебе предлагают остудить установку или, наоборот, разогнать её ещё сильнее.',
    scene: 'ocean',
    options: [
      {
        label: 'Охладить',
        preview: '-35% накала и +1 рука в следующем раунде.',
        apply(state) {
          state.heat = Math.max(0, state.heat - 35);
          state.temp.extraHands += 1;
          return 'Установка остыла. Следующий блайнд: +1 рука.';
        }
      },
      {
        label: 'Разогнать',
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
    text: 'Тень кладёт на стол тёмную реликвию. Сила в ней есть, но бесплатно её не отдают.',
    scene: 'inferno',
    options: [
      {
        label: 'Взять реликвию',
        preview: '+1 рука каждый раунд, но следующая цель станет на 15% выше.',
        warningTitle: 'ПРОКЛЯТАЯ РЕЛИКВИЯ',
        warningText: 'Ты получишь сильный постоянный бонус, но следующий блайнд станет тяжелее.',
        apply(state) {
          state.meta.extraHands += 1;
          state.temp.targetMul *= 1.15;
          return 'Ты взял силу. Следующий блайнд станет тяжелее на 15%.';
        }
      },
      {
        label: 'Сжечь контракт',
        preview: '+12 монет без штрафа.',
        apply(state) {
          state.money += 12;
          return 'Ты сжёг контракт и забрал 12 монет.';
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
        preview: 'Усиливает удачливые карты.',
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
          return 'Перегрев стал ещё злее.';
        }
      },
      {
        label: 'Играть надёжно',
        preview: '+1 сброс в следующем раунде и +6 монет.',
        apply(state) {
          state.temp.extraDiscards += 1;
          state.money += 6;
          return 'Следующий раунд будет спокойнее.';
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

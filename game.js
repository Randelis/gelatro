const SAVE_KEY = 'neon_riot_run_v8';

const state = {
  level: 1,
  money: 0,
  targetScore: 300,
  currentScore: 0,
  handsLeft: 4,
  discardsLeft: 2,
  heat: 0,
  deck: [],
  hand: [],
  selectedCards: [],
  jokers: [],
  relicsOwned: {},
  meta: {
    superRate: 0,
    extraHands: 0,
    extraDiscards: 0,
    rewardBonus: 0,
    overheatBonus: 0,
    startHeat: 0,
    voidBoost: 0,
    glassBoost: 0,
    luckyBoost: 0,
    bossReward: 0
  },
  temp: {
    extraHands: 0,
    extraDiscards: 0,
    targetMul: 1
  },
  roomChoices: [],
  shopOffers: [],
  routeResolved: false,
  roundWon: false,
  boss: null,
  currentEvent: null,
  pendingConfirm: null,
  tutorialSeen: false
};

const el = {
  app: document.getElementById('app'),
  fxLayer: document.getElementById('fxLayer'),
  floatLayer: document.getElementById('floatLayer'),

  levelDisplay: document.getElementById('levelDisplay'),
  bossTag: document.getElementById('bossTag'),
  moneyDisplay: document.getElementById('moneyDisplay'),
  handsLeft: document.getElementById('handsLeft'),
  discardsLeft: document.getElementById('discardsLeft'),
  currentScore: document.getElementById('currentScore'),
  targetScore: document.getElementById('targetScore'),
  goalFill: document.getElementById('goalFill'),
  heatFill: document.getElementById('heatFill'),
  heatValue: document.getElementById('heatValue'),

  modifierBar: document.getElementById('modifierBar'),
  handInfo: document.getElementById('handInfo'),
  comboName: document.getElementById('comboName'),
  comboFormula: document.getElementById('comboFormula'),
  comboNote: document.getElementById('comboNote'),
  handArea: document.getElementById('handArea'),
  rankRow: document.getElementById('rankRow'),

  discardBtn: document.getElementById('discardBtn'),
  playBtn: document.getElementById('playBtn'),
  nextBtn: document.getElementById('nextBtn'),

  tutorialOverlay: document.getElementById('tutorialOverlay'),
  tutorialSkipBtn: document.getElementById('tutorialSkipBtn'),
  tutorialStartBtn: document.getElementById('tutorialStartBtn'),

  routeOverlay: document.getElementById('routeOverlay'),
  routeText: document.getElementById('routeText'),
  routeList: document.getElementById('routeList'),
  routeCloseBtn: document.getElementById('routeCloseBtn'),

  eventOverlay: document.getElementById('eventOverlay'),
  eventTitle: document.getElementById('eventTitle'),
  eventText: document.getElementById('eventText'),
  eventOptions: document.getElementById('eventOptions'),
  eventCloseBtn: document.getElementById('eventCloseBtn'),

  confirmOverlay: document.getElementById('confirmOverlay'),
  confirmTitle: document.getElementById('confirmTitle'),
  confirmText: document.getElementById('confirmText'),
  confirmWarn: document.getElementById('confirmWarn'),
  confirmCancelBtn: document.getElementById('confirmCancelBtn'),
  confirmAcceptBtn: document.getElementById('confirmAcceptBtn'),

  shopOverlay: document.getElementById('shopOverlay'),
  shopBalance: document.getElementById('shopBalance'),
  shopList: document.getElementById('shopList'),
  shopSkipBtn: document.getElementById('shopSkipBtn'),
  shopDoneBtn: document.getElementById('shopDoneBtn'),

  resultOverlay: document.getElementById('resultOverlay'),
  resultTitle: document.getElementById('resultTitle'),
  resultText: document.getElementById('resultText'),
  resultBig: document.getElementById('resultBig'),
  resultSmall: document.getElementById('resultSmall'),
  resetRunBtn: document.getElementById('resetRunBtn')
};

FX.init({
  layer: el.fxLayer,
  floatLayer: el.floatLayer,
  app: el.app
});

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    level: state.level,
    money: state.money,
    heat: state.heat,
    jokers: state.jokers.map(j => j.id),
    relicsOwned: state.relicsOwned,
    meta: state.meta,
    tutorialSeen: state.tutorialSeen
  }));
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    state.level = Number.isFinite(data.level) ? data.level : 1;
    state.money = Number.isFinite(data.money) ? data.money : 0;
    state.heat = Number.isFinite(data.heat) ? data.heat : 0;
    state.tutorialSeen = !!data.tutorialSeen;

    if (Array.isArray(data.jokers)) {
      state.jokers = data.jokers.map(id => JOKER_BY_ID[id]).filter(Boolean);
    }

    if (data.relicsOwned && typeof data.relicsOwned === 'object') {
      state.relicsOwned = { ...data.relicsOwned };
    }

    if (data.meta && typeof data.meta === 'object') {
      state.meta = {
        superRate: Number.isFinite(data.meta.superRate) ? data.meta.superRate : 0,
        extraHands: Number.isFinite(data.meta.extraHands) ? data.meta.extraHands : 0,
        extraDiscards: Number.isFinite(data.meta.extraDiscards) ? data.meta.extraDiscards : 0,
        rewardBonus: Number.isFinite(data.meta.rewardBonus) ? data.meta.rewardBonus : 0,
        overheatBonus: Number.isFinite(data.meta.overheatBonus) ? data.meta.overheatBonus : 0,
        startHeat: Number.isFinite(data.meta.startHeat) ? data.meta.startHeat : 0,
        voidBoost: Number.isFinite(data.meta.voidBoost) ? data.meta.voidBoost : 0,
        glassBoost: Number.isFinite(data.meta.glassBoost) ? data.meta.glassBoost : 0,
        luckyBoost: Number.isFinite(data.meta.luckyBoost) ? data.meta.luckyBoost : 0,
        bossReward: Number.isFinite(data.meta.bossReward) ? data.meta.bossReward : 0
      };
    }
  } catch (err) {
    console.warn('Ошибка загрузки сохранения', err);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function targetForLevel(level) {
  return Math.floor(300 * Math.pow(1.48, level - 1));
}

function enhancementChance() {
  const base = 0.16;
  const relicBonus = state.meta.superRate * 0.08;
  const levelBonus = Math.min(0.16, state.level * 0.01);
  const bossBonus = state.boss ? 0.03 : 0;
  return Math.min(0.58, base + relicBonus + levelBonus + bossBonus);
}

function rollEnhancement() {
  if (Math.random() > enhancementChance()) return null;
  return chooseWeighted(ENHANCEMENTS).id;
}

function makeDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        id: Math.random().toString(36).slice(2, 11),
        suit,
        value,
        enhancement: rollEnhancement()
      });
    }
  }
  return shuffle(deck);
}

function giveRandomJoker(targetState, rarity = null) {
  let pool = JOKERS.filter(j => !targetState.jokers.some(owned => owned.id === j.id));
  if (rarity) pool = pool.filter(j => j.rarity === rarity);
  if (!pool.length && rarity) pool = JOKERS.filter(j => !targetState.jokers.some(owned => owned.id === j.id));
  if (!pool.length) return null;
  const joker = shuffle(pool)[0];
  targetState.jokers.push(joker);
  return joker;
}

function giveRandomRelic(targetState, rarity = null) {
  let pool = RELICS.filter(r => (targetState.relicsOwned[r.id] || 0) < r.max);
  if (rarity) pool = pool.filter(r => r.rarity === rarity);
  if (!pool.length && rarity) pool = RELICS.filter(r => (targetState.relicsOwned[r.id] || 0) < r.max);
  if (!pool.length) return null;
  const relic = shuffle(pool)[0];
  targetState.relicsOwned[relic.id] = (targetState.relicsOwned[relic.id] || 0) + 1;
  targetState.meta[relic.key] += relic.delta;
  return relic;
}

function startLevel() {
  state.boss = getBossForLevel(state.level);
  state.currentScore = 0;
  state.roundWon = false;
  state.routeResolved = false;
  state.roomChoices = [];
  state.shopOffers = [];
  state.currentEvent = null;
  state.pendingConfirm = null;
  state.selectedCards = [];

  let target = targetForLevel(state.level);
  if (state.boss) target = Math.floor(target * state.boss.targetMul);
  target = Math.floor(target * state.temp.targetMul);
  state.targetScore = target;

  state.handsLeft = 4 + state.meta.extraHands + state.temp.extraHands + (state.boss?.id === 'storm' ? 1 : 0);
  state.discardsLeft = Math.max(0, 2 + state.meta.extraDiscards + state.temp.extraDiscards + (state.boss?.id === 'storm' ? -1 : 0));

  state.heat = clamp(Math.floor(state.heat * 0.35) + state.meta.startHeat * 15, 0, 100);

  state.temp = {
    extraHands: 0,
    extraDiscards: 0,
    targetMul: 1
  };

  state.deck = makeDeck();
  state.hand = [];
  drawCards(8);

  closeAllMidOverlays();
  closeResult();
  updateSelectionPreview();
  updateUI();
  if (!state.tutorialSeen) openTutorial();
}

function drawCards(count) {
  for (let i = 0; i < count; i++) {
    if (state.deck.length > 0 && state.hand.length < 8) {
      state.hand.push(state.deck.pop());
    }
  }
  renderHand();
}

function enhancementBadge(card) {
  if (!card.enhancement) return '';
  const meta = ENHANCEMENT_BY_ID[card.enhancement];
  if (!meta) return '';
  return `<div class="card-badge badge-${meta.id}">${meta.tag}</div>`;
}

function renderHand() {
  el.handArea.innerHTML = '';

  state.hand.forEach(card => {
    const node = document.createElement('div');
    node.className = `card ${(card.suit === '♥' || card.suit === '♦') ? 'red' : 'black'}`;
    node.dataset.id = card.id;
    node.innerHTML = `
      ${enhancementBadge(card)}
      <div class="card-corner top-left">
        <div>${card.value}</div>
        <div style="margin-top:-3px">${card.suit}</div>
      </div>
      <div class="card-center">${card.suit}</div>
      <div class="card-corner bottom-right">
        <div>${card.value}</div>
        <div style="margin-top:-3px">${card.suit}</div>
      </div>
    `;
    node.addEventListener('click', () => toggleSelect(card));
    el.handArea.appendChild(node);
  });

  updateCardsPosition();
  renderRankRow();
}

function renderRankRow() {
  if (!el.rankRow) return;

  el.rankRow.innerHTML = state.hand.map(card => {
    const selected = state.selectedCards.includes(card);
    const red = card.suit === '♥' || card.suit === '♦';
    return `<div class="rank-pill${selected ? ' selected' : ''}${red ? ' red' : ''}">${card.value}</div>`;
  }).join('');
}

function updateCardsPosition() {
  requestAnimationFrame(() => {
    const nodes = el.handArea.querySelectorAll('.card');
    const total = state.hand.length;
    if (!total) return;

    const handRect = el.handArea.getBoundingClientRect();
    const maxWidth = handRect.width - 26;
    const cardWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 64;
    let spacing = 38;

    if (total > 1) spacing = Math.min(38, (maxWidth - cardWidth) / (total - 1));
    const startX = -((total - 1) * spacing) / 2;

    nodes.forEach((node, index) => {
      const card = state.hand[index];
      const x = startX + index * spacing;
      const rotation = (index - total / 2 + 0.5) * 4;
      const selected = state.selectedCards.includes(card);

      if (selected) {
        node.classList.add('selected');
        node.style.transform = `translateX(${x}px) translateY(-42px) rotate(0deg)`;
        node.style.zIndex = String(100 + index);
      } else {
        node.classList.remove('selected');
        node.style.transform = `translateX(${x}px) translateY(0px) rotate(${rotation}deg)`;
        node.style.zIndex = String(index + 1);
      }
    });
  });
}

function toggleSelect(card) {
  if (state.roundWon) return;

  const idx = state.selectedCards.indexOf(card);
  if (idx > -1) {
    state.selectedCards.splice(idx, 1);
  } else {
    if (state.selectedCards.length >= 5) return;
    state.selectedCards.push(card);
  }

  updateCardsPosition();
  renderRankRow();
  updateSelectionPreview();
  updateButtons();
}

function rankValue(card) {
  return VALUES.indexOf(card.value) + 2;
}

function isFlushWithWild(cards) {
  if (cards.length !== 5) return false;

  const wildCount = cards.filter(card => card.enhancement === 'wild').length;
  const suits = cards.filter(card => card.enhancement !== 'wild').map(card => card.suit);
  if (!suits.length) return true;

  const counts = {};
  for (const suit of suits) counts[suit] = (counts[suit] || 0) + 1;
  const maxSuit = Math.max(...Object.values(counts));

  return maxSuit + wildCount === 5;
}

function isStraight(cards) {
  if (cards.length !== 5) return false;
  const ranks = [...new Set(cards.map(rankValue).sort((a, b) => a - b))];
  if (ranks.length !== 5) return false;

  let straight = true;
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] + 1) {
      straight = false;
      break;
    }
  }

  if (straight) return true;
  return ranks.join(',') === '2,3,4,5,14';
}

function getPokerHand(cards) {
  if (!cards.length || cards.length === 1) return 'High Card';

  const counts = {};
  for (const card of cards) counts[card.value] = (counts[card.value] || 0) + 1;
  const valueCounts = Object.values(counts).sort((a, b) => b - a);

  const flush = isFlushWithWild(cards);
  const straight = isStraight(cards);

  if (flush && straight) return 'Straight Flush';
  if (valueCounts[0] === 4) return 'Four of a Kind';
  if (valueCounts[0] === 3 && valueCounts[1] === 2) return 'Full House';
  if (flush) return 'Flush';
  if (straight) return 'Straight';
  if (valueCounts[0] === 3) return 'Three of a Kind';
  if (valueCounts[0] === 2 && valueCounts[1] === 2) return 'Two Pair';
  if (valueCounts[0] === 2) return 'Pair';
  return 'High Card';
}

function getHandAdvice(cards, handType) {
  if (!cards.length) {
    return 'Выбери карты снизу. Для старта проще всего ловить пару или две пары.';
  }

  const suits = {};
  const values = {};
  for (const card of cards) {
    suits[card.suit] = (suits[card.suit] || 0) + 1;
    values[card.value] = (values[card.value] || 0) + 1;
  }

  const maxSuit = Math.max(...Object.values(suits));
  const pairCount = Object.values(values).filter(v => v >= 2).length;
  const topValue = Math.max(...cards.map(rankValue));
  const lowValue = Math.min(...cards.map(rankValue));
  const spread = topValue - lowValue;

  switch (handType) {
    case 'High Card':
      if (maxSuit >= 3) return 'Похоже на заготовку под флеш: попробуй добрать карты той же масти.';
      if (spread <= 4 && cards.length >= 3) return 'Похоже на заготовку под стрит: попробуй добрать соседние значения.';
      return 'Пока рука слабая. Обычно лучше искать пару, две пары или заход на стрит/флеш.';
    case 'Pair':
      if (pairCount >= 2) return 'Уже есть база под две пары или фулл-хаус. Ищи ещё совпадение по значению.';
      return 'Пара — нормальный старт. Дальше обычно выгодно расти в две пары, тройку или фулл-хаус.';
    case 'Two Pair':
      return 'Уже хорошая база. Лучшее продолжение — фулл-хаус.';
    case 'Three of a Kind':
      return 'Тройка — сильная рука. Дальше ищи фулл-хаус или каре.';
    case 'Straight':
      return 'Стрит хорош сам по себе. Особенно силён, если у тебя бонусы на стриты или X-множители.';
    case 'Flush':
      return 'Флеш обычно очень выгодный. Если есть бонусы на масти — это уже почти готовый разнос.';
    case 'Full House':
      return 'Фулл-хаус — очень сильная рука. Можно смело разгонять счёт.';
    case 'Four of a Kind':
      return 'Каре — почти всегда огромный счёт. Здесь уже особенно важны X-множители.';
    case 'Straight Flush':
      return 'Это одна из лучших рук. Если ещё есть сильные джокеры — счёт улетит в космос.';
    default:
      return 'Смотри на формулу в центре: по ней сразу видно, стоит ли играть руку.';
  }
}

function evaluateSelection(cards) {
  if (!cards.length) {
    const bossText = state.boss
      ? `Босс: ${state.boss.name}. ${state.boss.desc}`
      : 'Выбирай карты снизу. Для старта проще всего собирать пару, две пары или заход на флеш.';
    return {
      handType: 'High Card',
      handName: 'Выбери до 5 карт',
      chips: 0,
      mult: 1,
      xmult: 1,
      total: 0,
      formula: '0 × 1 = 0',
      note: bossText,
      fx: {},
      overheat: false
    };
  }

  const handType = getPokerHand(cards);
  const base = BASE_HANDS[handType];

  const ctx = {
    cards,
    handType,
    heat: state.heat,
    handsLeftBefore: state.handsLeft,
    chips: base.chips + cards.reduce((sum, card) => sum + CARD_SCORES[card.value], 0),
    mult: base.mult,
    xmult: 1,
    notes: [],
    fx: {
      explosion: false,
      beams: false,
      blackHole: false,
      flash: false,
      meteors: false
    },
    overheat: false,
    enhancedCount: cards.filter(card => !!card.enhancement).length,
    note(msg) {
      if (this.notes.length < 4) this.notes.push(msg);
    },
    hasEnhancement(id) {
      return cards.some(card => card.enhancement === id);
    }
  };

  for (const card of cards) {
    switch (card.enhancement) {
      case 'wild':
        ctx.mult += 6;
        ctx.note('Дикая карта: +6 к множителю');
        ctx.fx.beams = true;
        break;
      case 'glass':
        ctx.chips += 16 + state.meta.glassBoost * 8;
        ctx.xmult *= 1.25 + state.meta.glassBoost * 0.05;
        ctx.note('Стеклянная карта усилила итог.');
        ctx.fx.flash = true;
        break;
      case 'void':
        ctx.chips += 10 + state.meta.voidBoost * 8;
        ctx.xmult *= 1.2 + state.meta.voidBoost * 0.05;
        ctx.note('Пустотная карта втянула больше силы.');
        ctx.fx.blackHole = true;
        break;
      case 'solar':
        ctx.chips += 26;
        ctx.mult += 4;
        ctx.note('Солнечная карта: +26 фишек и +4 к множителю');
        ctx.fx.explosion = true;
        break;
      case 'lucky':
        ctx.chips += 8;
        ctx.mult += 3 + state.meta.luckyBoost * 2;
        if (card.value === '7' || card.value === 'A') {
          ctx.mult += 7 + state.meta.luckyBoost * 2;
          ctx.note('Удачливая карта на 7/A сработала особенно сильно.');
        } else {
          ctx.note('Удачливая карта дала бонус.');
        }
        ctx.fx.flash = true;
        break;
      case 'steel':
        ctx.chips += 14;
        ctx.mult += 5;
        ctx.note('Стальная карта усилила руку.');
        break;
      case 'neon':
        ctx.mult += 4;
        ctx.xmult *= 1.12;
        ctx.note('Неоновая карта усилила руку.');
        ctx.fx.beams = true;
        break;
      case 'echo': {
        const hasPairByValue = cards.some(other => other !== card && other.value === card.value);
        if (hasPairByValue) {
          ctx.chips += 18;
          ctx.mult += 4;
          ctx.note('Эхо-карта поймала дубликат.');
        }
        break;
      }
      case 'cursed':
        ctx.chips += 34;
        ctx.mult -= 5;
        ctx.note('Проклятая карта дала много фишек, но срезала множитель.');
        ctx.fx.blackHole = true;
        break;
    }
  }

  if (state.heat >= 100) {
    ctx.mult += 15 + state.meta.overheatBonus;
    ctx.xmult *= 1.35;
    ctx.overheat = true;
    ctx.note(`ПЕРЕГРЕВ: +${15 + state.meta.overheatBonus} к множителю и X1.35`);
    ctx.fx.explosion = true;
    ctx.fx.flash = true;
    ctx.fx.beams = true;
  }

  if (state.boss) {
    switch (state.boss.id) {
      case 'void':
        ctx.xmult *= 1.15;
        ctx.note('Босс ПУСТОТА усилил X-множитель.');
        ctx.fx.blackHole = true;
        break;
      case 'storm':
        if (ctx.cards.length === 5) {
          ctx.xmult *= 1.25;
          ctx.note('Босс ШТОРМ усилил полную руку.');
          ctx.fx.beams = true;
        }
        break;
      case 'titan':
        ctx.chips += 12;
        ctx.note('Босс ТИТАН добавил +12 фишек.');
        break;
      case 'inferno':
        ctx.mult += 4;
        ctx.note('Босс ИНФЕРНО дал +4 к множителю.');
        ctx.fx.flash = true;
        break;
    }
  }

  for (const joker of state.jokers) {
    joker.apply(ctx);
  }

  if (handType === 'Straight Flush' || handType === 'Four of a Kind') {
    ctx.fx.explosion = true;
    ctx.fx.blackHole = true;
    ctx.fx.beams = true;
    ctx.fx.flash = true;
  } else if (handType === 'Flush' || handType === 'Straight' || handType === 'Full House') {
    ctx.fx.beams = true;
  }

  const total = Math.floor(ctx.chips * ctx.mult * ctx.xmult);
  let formula = `${ctx.chips} × ${ctx.mult}`;
  if (Math.abs(ctx.xmult - 1) > 0.001) formula += ` × ${ctx.xmult.toFixed(2)}`;
  formula += ` = ${total}`;

  return {
    handType,
    handName: HAND_NAMES[handType],
    chips: ctx.chips,
    mult: ctx.mult,
    xmult: ctx.xmult,
    total,
    formula,
    note: ctx.notes.length
      ? `${ctx.notes.join(' • ')} • ${getHandAdvice(cards, handType)}`
      : getHandAdvice(cards, handType),
    fx: ctx.fx,
    overheat: ctx.overheat
  };
}

function sceneFromPreview(preview) {
  if (preview.overheat || state.heat >= 100) return 'overheat';
  if (preview.fx.blackHole) return 'void';
  if (preview.handType === 'Straight Flush' || preview.handType === 'Four of a Kind') return 'cataclysm';
  if (preview.handType === 'Flush') return 'ocean';
  if (preview.handType === 'Straight') return 'storm';
  if (preview.fx.explosion || preview.handType === 'Full House') return 'inferno';
  if (!state.selectedCards.length && state.boss) return state.boss.scene;
  return 'base';
}

function updateSelectionPreview() {
  const preview = evaluateSelection(state.selectedCards);
  el.comboName.textContent = preview.handName.toUpperCase();
  el.comboFormula.textContent = preview.formula;
  el.comboNote.textContent = preview.note;
  el.handInfo.classList.toggle('overheat', preview.overheat || state.heat >= 100);
  FX.setScene(sceneFromPreview(preview));
}

function renderModifiers() {
  const parts = [];

  for (const joker of state.jokers) {
    parts.push(`<div class="mod-chip joker">🃏 ${joker.name}</div>`);
  }

  for (const relic of RELICS) {
    const count = state.relicsOwned[relic.id] || 0;
    if (count > 0) {
      parts.push(`<div class="mod-chip relic">⚙ ${relic.name} ×${count}</div>`);
    }
  }

  if (!parts.length) {
    el.modifierBar.innerHTML = `<div class="mod-chip empty">ПОКА НЕТ ДЖОКЕРОВ И РЕЛИКВИЙ</div>`;
    return;
  }

  el.modifierBar.innerHTML = parts.join('');
}

function updateButtons() {
  const hasSelection = state.selectedCards.length > 0;
  el.playBtn.disabled = !hasSelection || state.handsLeft <= 0 || state.roundWon;
  el.discardBtn.disabled = !hasSelection || state.discardsLeft <= 0 || state.roundWon;

  if (!state.roundWon) {
    el.nextBtn.disabled = true;
    el.nextBtn.textContent = 'МЕЖРАУНД';
  } else if (!state.routeResolved) {
    el.nextBtn.disabled = false;
    el.nextBtn.textContent = 'МЕЖРАУНД';
  } else {
    el.nextBtn.disabled = false;
    el.nextBtn.textContent = 'СЛЕДУЮЩИЙ';
  }
}

function updateUI() {
  el.levelDisplay.textContent = `БЛАЙНД ${state.level}`;

  if (state.boss) {
    el.bossTag.textContent = state.boss.name;
    el.bossTag.classList.remove('hidden');
  } else {
    el.bossTag.classList.add('hidden');
  }

  el.moneyDisplay.textContent = `💰 ${state.money}`;
  el.handsLeft.textContent = state.handsLeft;
  el.discardsLeft.textContent = state.discardsLeft;
  el.currentScore.textContent = state.currentScore;
  el.targetScore.textContent = state.targetScore;
  el.goalFill.style.width = `${Math.min(100, (state.currentScore / state.targetScore) * 100)}%`;
  el.heatFill.style.width = `${Math.min(100, state.heat)}%`;
  el.heatValue.textContent = `${Math.min(100, Math.floor(state.heat))}%`;

  renderModifiers();
  updateButtons();
}

function computeHeatGain(result) {
  let gain = 14 + Math.min(40, result.total / 34);

  switch (result.handType) {
    case 'Two Pair': gain += 4; break;
    case 'Three of a Kind': gain += 6; break;
    case 'Straight':
    case 'Flush': gain += 10; break;
    case 'Full House': gain += 14; break;
    case 'Four of a Kind': gain += 18; break;
    case 'Straight Flush': gain += 26; break;
  }

  if (result.xmult > 1.5) gain += 10;
  if (result.xmult > 2) gain += 12;
  if (state.boss?.id === 'inferno') gain *= 1.35;

  return gain;
}

function playHand() {
  if (!state.selectedCards.length || state.handsLeft <= 0 || state.roundWon) return;

  const result = evaluateSelection(state.selectedCards);
  const selectedIds = new Set(state.selectedCards.map(card => card.id));

  el.handArea.querySelectorAll('.card').forEach(node => {
    if (selectedIds.has(node.dataset.id)) node.classList.add('played');
  });

  state.currentScore += result.total;
  state.handsLeft -= 1;

  if (result.overheat) {
    state.heat = 28;
  } else {
    state.heat = clamp(state.heat + computeHeatGain(result), 0, 100);
  }

  FX.combo(result);
  FX.floating(
    `+${result.total}`,
    result.handName,
    result.overheat ? '#fb7185' : (result.xmult > 1 ? '#38bdf8' : '#fde047')
  );

  setTimeout(() => {
    state.hand = state.hand.filter(card => !selectedIds.has(card.id));
    state.selectedCards = [];
    drawCards(8 - state.hand.length);
    updateSelectionPreview();
    checkRoundState(result);
    updateUI();
    saveGame();
  }, 360);
}

function discardCards() {
  if (!state.selectedCards.length || state.discardsLeft <= 0 || state.roundWon) return;

  const selectedIds = new Set(state.selectedCards.map(card => card.id));
  state.discardsLeft -= 1;
  state.heat = Math.max(0, state.heat - 12);

  el.handArea.querySelectorAll('.card').forEach(node => {
    if (selectedIds.has(node.dataset.id)) node.style.opacity = '0';
  });

  setTimeout(() => {
    state.hand = state.hand.filter(card => !selectedIds.has(card.id));
    state.selectedCards = [];
    drawCards(8 - state.hand.length);
    updateSelectionPreview();
    updateUI();
    saveGame();
  }, 180);
}

function rewardForWin(lastResult) {
  let reward = 5 + state.handsLeft + state.meta.rewardBonus;
  if (state.heat >= 80) reward += 2;
  if (state.boss) reward += state.meta.bossReward;

  if (
    state.boss?.id === 'titan' &&
    (lastResult.handType === 'Four of a Kind' ||
      lastResult.handType === 'Straight Flush' ||
      lastResult.handType === 'Full House')
  ) {
    reward += 4;
  }

  return reward;
}

function checkRoundState(lastResult) {
  if (state.currentScore >= state.targetScore) {
    state.roundWon = true;
    const reward = rewardForWin(lastResult);
    state.money += reward;
    FX.coins(5 + Math.min(5, reward));
    FX.floating(`+${reward}`, 'Монеты', '#4ade80');
    updateUI();
    saveGame();

    setTimeout(() => {
      openRoute();
    }, 420);
    return;
  }

  if (state.handsLeft <= 0) {
    showResult();
  }
}

function openTutorial() {
  el.tutorialOverlay.classList.add('show');
  el.tutorialOverlay.setAttribute('aria-hidden', 'false');
}

function closeTutorial() {
  state.tutorialSeen = true;
  saveGame();
  el.tutorialOverlay.classList.remove('show');
  el.tutorialOverlay.setAttribute('aria-hidden', 'true');
}

function closeAllMidOverlays() {
  closeRoute();
  closeEvent();
  closeConfirm();
  closeShop();
}

function buildRoomChoices() {
  const otherRooms = shuffle(ROOM_POOL.filter(room => room.id !== 'shop')).slice(0, 2);
  state.roomChoices = [ROOM_POOL.find(room => room.id === 'shop'), ...otherRooms];
}

function renderRoute() {
  buildRoomChoices();

  el.routeText.textContent = state.boss
    ? `Босс ${state.boss.name} позади. Теперь решай, как усиливаться дальше.`
    : 'Раунд пройден. Выбери, что делать дальше.';

  el.routeList.innerHTML = state.roomChoices.map(room => `
    <div class="route-card ${room.type}">
      <b>${room.name}</b>
      <span>${room.desc}</span>
      <small>${room.extra}</small>
      <button data-room="${room.id}">ВЫБРАТЬ</button>
    </div>
  `).join('');
}

function openRoute() {
  renderRoute();
  el.routeOverlay.classList.add('show');
  el.routeOverlay.setAttribute('aria-hidden', 'false');
}

function closeRoute() {
  el.routeOverlay.classList.remove('show');
  el.routeOverlay.setAttribute('aria-hidden', 'true');
}

function renderShop() {
  const ownedJokers = new Set(state.jokers.map(j => j.id));
  const jokerOffers = shuffle(JOKERS.filter(item => !ownedJokers.has(item.id))).slice(0, 3);
  const relicOffers = shuffle(RELICS.filter(item => (state.relicsOwned[item.id] || 0) < item.max)).slice(0, 2);

  state.shopOffers = [
    ...jokerOffers.map(item => ({ kind: 'joker', data: item })),
    ...relicOffers.map(item => ({ kind: 'relic', data: item }))
  ];

  el.shopBalance.textContent = `💰 ${state.money}`;

  if (!state.shopOffers.length) {
    el.shopList.innerHTML = `
      <div class="shop-item">
        <div class="shop-text">
          <div class="shop-name">Пусто</div>
          <div class="shop-desc">Ты уже выкупил всё, что было в этой лавке.</div>
        </div>
      </div>
    `;
    return;
  }

  el.shopList.innerHTML = state.shopOffers.map(offer => {
    const item = offer.data;
    const disabled = state.money < item.price ? 'disabled' : '';
    const icon = offer.kind === 'joker' ? '🃏' : '⚙';
    const className = `shop-item ${offer.kind} ${item.rarity || ''}`;
    const extra = offer.kind === 'relic'
      ? ` <span style="color:#94a3b8">(есть ${state.relicsOwned[item.id] || 0}/${item.max})</span>`
      : '';

    return `
      <div class="${className}">
        <div class="shop-text">
          <div class="shop-name">${icon} ${item.name}${extra}</div>
          <div class="shop-desc">${item.desc}</div>
        </div>
        <button class="buy-btn" data-kind="${offer.kind}" data-id="${item.id}" ${disabled}>💰${item.price}</button>
      </div>
    `;
  }).join('');
}

function openShop() {
  renderShop();
  el.shopOverlay.classList.add('show');
  el.shopOverlay.setAttribute('aria-hidden', 'false');
}

function closeShop() {
  el.shopOverlay.classList.remove('show');
  el.shopOverlay.setAttribute('aria-hidden', 'true');
}

function buyOffer(kind, id) {
  const offer = state.shopOffers.find(item => item.kind === kind && item.data.id === id);
  if (!offer) return;

  const item = offer.data;
  if (state.money < item.price) return;

  state.money -= item.price;

  if (kind === 'joker') {
    state.jokers.push(item);
  } else {
    state.relicsOwned[item.id] = (state.relicsOwned[item.id] || 0) + 1;
    state.meta[item.key] += item.delta;
  }

  renderShop();
  renderModifiers();
  updateSelectionPreview();
  updateUI();
  saveGame();
  FX.buyPulse();
}

function openEvent(eventData) {
  state.currentEvent = eventData;
  el.eventTitle.textContent = eventData.title;
  el.eventText.textContent = eventData.text;
  FX.setScene(eventData.scene || 'base');

  el.eventOptions.innerHTML = eventData.options.map((option, index) => `
    <div class="event-card">
      <b>${option.label}</b>
      <span>${option.preview}</span>
      <button data-option="${index}">ВЫБРАТЬ</button>
    </div>
  `).join('');

  el.eventOverlay.classList.add('show');
  el.eventOverlay.setAttribute('aria-hidden', 'false');
}

function closeEvent() {
  el.eventOverlay.classList.remove('show');
  el.eventOverlay.setAttribute('aria-hidden', 'true');
  state.currentEvent = null;
}

function openConfirm(title, text, warningText, onAccept) {
  state.pendingConfirm = onAccept;
  el.confirmTitle.textContent = title;
  el.confirmText.textContent = text;
  el.confirmWarn.textContent = warningText;
  el.confirmOverlay.classList.add('show');
  el.confirmOverlay.setAttribute('aria-hidden', 'false');
}

function closeConfirm() {
  el.confirmOverlay.classList.remove('show');
  el.confirmOverlay.setAttribute('aria-hidden', 'true');
  state.pendingConfirm = null;
}

function resolveIntermission(message, scene = 'base') {
  state.routeResolved = true;
  closeRoute();
  closeEvent();
  closeConfirm();
  updateSelectionPreview();
  updateUI();
  saveGame();
  FX.setScene(scene);
  if (message) FX.floating('ВЗЯТО', message, '#4ade80');
}

function chooseRoom(roomId) {
  switch (roomId) {
    case 'shop':
      closeRoute();
      openShop();
      break;
    case 'vault': {
      const money = randomInt(8, 16);
      state.money += money;
      resolveIntermission(`+${money} монет`, 'base');
      FX.coins(4);
      break;
    }
    case 'rest':
      state.heat = Math.max(0, state.heat - 25);
      state.temp.extraHands += 1;
      resolveIntermission('-25% накала и +1 рука', 'ocean');
      break;
    case 'forge':
      openForgeEvent();
      break;
    case 'event': {
      const eventData = shuffle(EVENTS)[0];
      closeRoute();
      openEvent(eventData);
      break;
    }
  }
}

function openForgeEvent() {
  closeRoute();
  openEvent({
    title: 'КУЗНИЦА',
    text: 'Выбери, как усилить забег. Тут всё без скрытых штрафов.',
    scene: 'cataclysm',
    options: [
      {
        label: 'Разогнать супер-карты',
        preview: '+8% к шансу супер-карт навсегда.',
        apply(targetState) {
          targetState.meta.superRate += 1;
          return 'Шанс супер-карт стал выше.';
        }
      },
      {
        label: 'Укрепить стекло',
        preview: 'Стеклянные карты становятся сильнее навсегда.',
        apply(targetState) {
          targetState.meta.glassBoost += 1;
          return 'Стеклянные карты усилены.';
        }
      },
      {
        label: 'Углубить пустоту',
        preview: 'Пустотные карты становятся сильнее навсегда.',
        apply(targetState) {
          targetState.meta.voidBoost += 1;
          return 'Пустотные карты усилены.';
        }
      }
    ]
  });
}

function handleEventOption(index) {
  if (!state.currentEvent) return;
  const option = state.currentEvent.options[index];
  if (!option) return;

  const run = () => {
    const msg = option.apply(state);
    const scene = state.currentEvent?.scene || 'base';
    resolveIntermission(msg, scene);
  };

  if (option.warningTitle || option.warningText) {
    openConfirm(
      option.warningTitle || 'ОПАСНЫЙ ВЫБОР',
      option.preview,
      option.warningText || 'У этого решения есть цена.',
      run
    );
  } else {
    run();
  }
}

function showResult() {
  el.resultTitle.textContent = 'ЗАБЕГ КОНЧИЛСЯ';
  el.resultText.textContent = 'До цели не хватило очков.';
  el.resultBig.textContent = `${state.currentScore} / ${state.targetScore}`;
  el.resultSmall.textContent = `Ты дошёл до блайнда ${state.level}. Джокеры, реликвии, накал и деньги будут сброшены.`;
  el.resultOverlay.classList.add('show');
  el.resultOverlay.setAttribute('aria-hidden', 'false');
  FX.setScene('base');
}

function closeResult() {
  el.resultOverlay.classList.remove('show');
  el.resultOverlay.setAttribute('aria-hidden', 'true');
}

function nextRound() {
  if (!state.roundWon) return;
  if (!state.routeResolved) {
    openRoute();
    return;
  }

  closeAllMidOverlays();
  state.level += 1;
  saveGame();
  startLevel();
}

function resetRun() {
  state.level = 1;
  state.money = 0;
  state.heat = 0;
  state.deck = [];
  state.hand = [];
  state.selectedCards = [];
  state.jokers = [];
  state.relicsOwned = {};
  state.meta = {
    superRate: 0,
    extraHands: 0,
    extraDiscards: 0,
    rewardBonus: 0,
    overheatBonus: 0,
    startHeat: 0,
    voidBoost: 0,
    glassBoost: 0,
    luckyBoost: 0,
    bossReward: 0
  };
  state.temp = {
    extraHands: 0,
    extraDiscards: 0,
    targetMul: 1
  };
  saveGame();
  closeResult();
  startLevel();
}

el.playBtn.addEventListener('click', playHand);
el.discardBtn.addEventListener('click', discardCards);
el.nextBtn.addEventListener('click', nextRound);

el.tutorialSkipBtn.addEventListener('click', closeTutorial);
el.tutorialStartBtn.addEventListener('click', closeTutorial);

el.routeCloseBtn.addEventListener('click', closeRoute);
el.routeList.addEventListener('click', event => {
  const button = event.target.closest('[data-room]');
  if (!button) return;
  chooseRoom(button.dataset.room);
});

el.eventCloseBtn.addEventListener('click', closeEvent);
el.eventOptions.addEventListener('click', event => {
  const button = event.target.closest('[data-option]');
  if (!button) return;
  handleEventOption(Number(button.dataset.option));
});

el.confirmCancelBtn.addEventListener('click', closeConfirm);
el.confirmAcceptBtn.addEventListener('click', () => {
  const action = state.pendingConfirm;
  closeConfirm();
  if (action) action();
});

el.shopSkipBtn.addEventListener('click', () => {
  closeShop();
  resolveIntermission('Лавка закрыта', 'base');
});

el.shopDoneBtn.addEventListener('click', () => {
  closeShop();
  resolveIntermission('Покупки завершены', 'base');
});

el.shopList.addEventListener('click', event => {
  const btn = event.target.closest('[data-id]');
  if (!btn) return;
  buyOffer(btn.dataset.kind, btn.dataset.id);
});

el.resetRunBtn.addEventListener('click', resetRun);

window.addEventListener('resize', updateCardsPosition, { passive: true });
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

loadGame();
startLevel();

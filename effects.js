const FX = (() => {
  let layer = null;
  let floatLayer = null;
  let app = null;
  let floatTimer = null;

  function init(config) {
    layer = config.layer;
    floatLayer = config.floatLayer;
    app = config.app;
  }

  function clear() {
    if (layer) layer.innerHTML = '';
  }

  function clearSoon(ms = 1100) {
    setTimeout(() => clear(), ms);
  }

  function setScene(scene) {
    document.body.dataset.scene = scene || 'base';
  }

  function shake(kind = 'light') {
    if (!app) return;
    app.classList.remove('shake-light', 'shake-heavy');
    requestAnimationFrame(() => {
      app.classList.add(kind === 'heavy' ? 'shake-heavy' : 'shake-light');
      setTimeout(() => {
        app.classList.remove('shake-light', 'shake-heavy');
      }, kind === 'heavy' ? 520 : 300);
    });
  }

  function floating(value, note = '', color = '#fde047') {
    if (!floatLayer) return;
    clearTimeout(floatTimer);
    floatLayer.innerHTML = `
      <div class="floating-text" style="color:${color}">
        ${value}
        ${note ? `<small>${note}</small>` : ''}
      </div>
    `;
    floatTimer = setTimeout(() => {
      floatLayer.innerHTML = '';
    }, 900);
  }

  function addParticle(color, tx, ty, size = 8) {
    const node = document.createElement('div');
    node.className = 'fx-particle';
    node.style.left = '50%';
    node.style.top = '54%';
    node.style.color = color;
    node.style.background = color;
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    node.style.setProperty('--sx', '0px');
    node.style.setProperty('--sy', '0px');
    node.style.setProperty('--tx', `${tx}px`);
    node.style.setProperty('--ty', `${ty}px`);
    layer.appendChild(node);
  }

  function explosion(color = '#fde047', count = 22, spread = 170) {
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const dist = 40 + Math.random() * spread;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      addParticle(color, tx, ty, 6 + Math.random() * 5);
    }
  }

  function beams(color = '#38bdf8', count = 8) {
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const beam = document.createElement('div');
      beam.className = 'fx-beam';
      beam.style.color = color;
      beam.style.setProperty('--rot', `${(360 / count) * i + Math.random() * 16}deg`);
      layer.appendChild(beam);
    }
  }

  function shockwave(color = '#fde047') {
    if (!layer) return;
    const ring = document.createElement('div');
    ring.className = 'fx-shockwave';
    ring.style.color = color;
    layer.appendChild(ring);
  }

  function blackHole() {
    if (!layer) return;
    const hole = document.createElement('div');
    hole.className = 'fx-black-hole';
    layer.appendChild(hole);
  }

  function flash(color = '#ffffff') {
    if (!layer) return;
    const node = document.createElement('div');
    node.className = 'fx-flash';
    node.style.color = color;
    layer.appendChild(node);
  }

  function meteors(color = '#fde047', count = 6) {
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const node = document.createElement('div');
      node.className = 'fx-meteor';
      node.style.color = color;
      node.style.left = `${18 + Math.random() * 70}%`;
      node.style.top = `${-10 - Math.random() * 25}px`;
      node.style.setProperty('--mx', `${Math.random() * 120 - 60}px`);
      node.style.animationDelay = `${Math.random() * .18}s`;
      layer.appendChild(node);
    }
  }

  function coins(amount = 4) {
    if (!layer) return;
    for (let i = 0; i < amount; i++) {
      const node = document.createElement('div');
      node.className = 'fx-coin';
      node.textContent = '💰';
      node.style.left = '50%';
      node.style.top = '42%';
      node.style.setProperty('--cx', '0px');
      node.style.setProperty('--cy', '0px');
      node.style.setProperty('--ctx', `${-80 + Math.random() * 160}px`);
      node.style.setProperty('--cty', `${-80 - Math.random() * 90}px`);
      node.style.animationDelay = `${i * 0.03}s`;
      layer.appendChild(node);
    }
  }

  function buyPulse() {
    clear();
    flash('#fde047');
    explosion('#fde047', 10, 90);
    clearSoon(450);
  }

  function combo(result) {
    clear();

    if (result.fx.flash || result.total >= 250) {
      flash(result.overheat ? '#fb7185' : '#ffffff');
    }

    if (result.fx.explosion || result.total >= 300) {
      explosion(
        result.overheat ? '#fb7185' : '#fde047',
        result.overheat ? 30 : 22,
        result.overheat ? 210 : 170
      );
    }

    if (result.fx.beams || result.handType === 'Straight' || result.handType === 'Flush') {
      beams(result.overheat ? '#fb7185' : '#38bdf8', result.overheat ? 12 : 8);
    }

    if (result.fx.blackHole || result.xmult >= 2.1) {
      blackHole();
    }

    if (result.fx.meteors || result.total >= 420) {
      meteors(result.overheat ? '#fb7185' : '#fde047', result.overheat ? 10 : 6);
    }

    if (result.total >= 380 || result.overheat || result.handType === 'Straight Flush') {
      shockwave(result.overheat ? '#fb7185' : '#fde047');
    }

    shake(result.total >= 360 || result.xmult >= 2 ? 'heavy' : 'light');
    clearSoon(result.overheat ? 1450 : 1100);
  }

  return {
    init,
    setScene,
    floating,
    combo,
    clear,
    clearSoon,
    flash,
    explosion,
    beams,
    shockwave,
    blackHole,
    meteors,
    coins,
    buyPulse,
    shake
  };
})();
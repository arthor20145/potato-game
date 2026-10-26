// ===== Potato Vacances Clicker : JavaScript natif, aucune dépendance =====
const $ = id => document.getElementById(id);
const OBJECTIF = 1e12;      // victoire : récolter ce nombre de patates (modifiable)
const COUT_FACTEUR = 1.15;  // hausse du prix d'un bâtiment à chaque achat

// ---- Boutique : 20 bâtiments (production automatique) ----
const NOMS = [['Petite serre','🏡'],['Potager','🌱'],['Ferme','🐄'],['Tracteur','🚜'],['Moulin','🌾'],
  ['Cabane de plage','🛖'],['Parasol','⛱️'],['Plage à patates','🏖️'],['Camping','⛺'],['Hôtel','🏨'],
  ['Club de vacances','🍹'],['Yacht','🛥️'],['Île privée','🏝️'],['Casino','🎰'],['Station de ski','⛷️'],
  ['Croisière','🚢'],['Volcan','🌋'],['Base lunaire','🌙'],['Galaxie','🌌'],['Multivers','🌀']];
const BAT = NOMS.map((n, i) => ({ id: 'b' + i, nom: n[0], ico: n[1],
  base: Math.round(40 * Math.pow(3.3, i)), pps: Math.round(Math.pow(3, i)) }));

// ---- Boutique : 30 améliorations achetables une seule fois ----
const UPS = [];
// 20 x "production x2" d'un bâtiment
BAT.forEach((b, i) => UPS.push({ id: 'u' + i, ico: b.ico, nom: 'Engrais : ' + b.nom,
  desc: b.nom + ' produit x2', cost: b.base * 15, type: 'bat', bat: i }));
// 6 x "clic x2"
[['🧤','Gants de jardin'],['🔱','Fourche'],['🛒','Brouette'],['⚒️','Super fourche'],['✋','Main dorée'],['👑','Main divine']]
  .forEach((c, i) => UPS.push({ id: 'c' + i, ico: c[0], nom: c[1], desc: 'Clic x2',
    cost: 300 * Math.pow(10, i), type: 'clic' }));
// 4 améliorations spéciales
UPS.push({ id: 'sun',  ico: '🧴', nom: 'Crème solaire',   desc: 'Zone de bronzage plus large', cost: 20000,    type: 'sp' });
UPS.push({ id: 'combo',ico: '🔥', nom: 'Combo max x8',    desc: 'Le combo monte jusqu\'à x8',  cost: 300000,   type: 'sp' });
UPS.push({ id: 'gold', ico: '🧲', nom: 'Aimant à dorée',  desc: 'Patate dorée 2x plus fréquente', cost: 3000000, type: 'sp' });
UPS.push({ id: 'frenz',ico: '⏱️', nom: 'Frénésie longue', desc: 'Frénésie x3 dure 15 s',       cost: 30000000, type: 'sp' });

let S, last = 0;

function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' Bn';
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + ' Md';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + ' M';
  return n.toLocaleString('fr-FR');
}
const has = id => S.up[id];
const nbUp = (fn) => UPS.filter(u => S.up[u.id] && fn(u)).length;
const coutBat = b => Math.ceil(b.base * Math.pow(COUT_FACTEUR, S.owned[b.id]));
const pps = () => BAT.reduce((t, b, i) => t + b.pps * S.owned[b.id] * Math.pow(2, nbUp(u => u.bat === i)), 0);
const clicBase = () => (1 + pps() * 0.02) * Math.pow(2, nbUp(u => u.type === 'clic'));

// Mécanique 06 : combo de récolte
const comboMult = () => Math.min(has('combo') ? 8 : 5, 1 + Math.floor(S.combo / 10) * 0.5);
// Mécanique personnelle : le bronzage (zone verte = x2, coup de soleil = patate bloquée)
const zone = () => has('sun') ? [30, 75] : [40, 70];
const heatMult = () => (S.heat >= zone()[0] && S.heat <= zone()[1]) ? 2 : 1;

function init() {
  S = { score: 0, total: 0, combo: 0, comboT: 0, heat: 0, burn: 0, frenzy: 0,
        goldIn: 8 + Math.random() * 8, goldLife: 0, owned: {}, up: {}, run: true };
  BAT.forEach(b => S.owned[b.id] = 0);
  $('golden').hidden = true;
  $('overlay').classList.add('hidden');
  buildShop(); buildMini();
  last = performance.now();
  requestAnimationFrame(loop);
}

function clic(e) {
  if (!S.run || S.burn > 0) return;
  S.combo++; S.comboT = 1.2; S.heat += 9;
  const gain = clicBase() * comboMult() * heatMult() * (S.frenzy > 0 ? 3 : 1);
  ajoute(gain);
  flotte('+' + fmt(gain), e.clientX, e.clientY);
  if (S.heat >= 100) { S.burn = 2.5; S.heat = 0; S.combo = 0; }
}
function ajoute(n) { S.score += n; S.total += n; }
function flotte(txt, x, y) {
  const f = document.createElement('div');
  f.className = 'float'; f.textContent = txt;
  f.style.left = (x - 15) + 'px'; f.style.top = (y - 20) + 'px';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 900);
}

// Mécanique 01 : patate dorée
function clicDoree(e) {
  const gain = 100 + pps() * 20;
  ajoute(gain); S.frenzy = has('frenz') ? 15 : 7;
  flotte('🌟 +' + fmt(gain), e.clientX, e.clientY);
  $('golden').hidden = true;
}
function apparitionDoree() {
  const g = $('golden'), z = $('game');
  g.style.left = (20 + Math.random() * (z.clientWidth - 110)) + 'px';
  g.style.top = (20 + Math.random() * (z.clientHeight - 100)) + 'px';
  g.hidden = false; S.goldLife = 6;
}

// Mécanique 19 : boutique (bâtiments + améliorations)
function buildShop() {
  $('shop').innerHTML = ''; $('ups').innerHTML = '';
  BAT.forEach(b => {
    const el = document.createElement('button');
    el.className = 'item'; el.id = b.id;
    el.innerHTML = `<span class="ico">${b.ico}</span><span><b>${b.nom}</b><small>+${fmt(b.pps)} /s</small><small class="c"></small></span><span class="n">0</span>`;
    el.onclick = () => { const c = coutBat(b); if (S.run && S.score >= c) { S.score -= c; S.owned[b.id]++; } };
    $('shop').appendChild(el);
  });
  UPS.forEach(u => {
    const el = document.createElement('button');
    el.className = 'item up'; el.id = u.id;
    el.innerHTML = `<span class="ico">${u.ico}</span><span><b>${u.nom}</b><small>${u.desc}</small><small>Coût : ${fmt(u.cost)}</small></span>`;
    el.onclick = () => { if (S.run && !S.up[u.id] && S.score >= u.cost) { S.score -= u.cost; S.up[u.id] = true; el.style.display = 'none'; } };
    $('ups').appendChild(el);
  });
}

function render() {
  $('score').textContent = fmt(S.score);
  $('pps').textContent = fmt(pps());
  $('goal').textContent = fmt(S.total) + ' / ' + fmt(OBJECTIF);
  $('combo').textContent = 'Combo x' + comboMult() + (S.frenzy > 0 ? '  🌟 FRÉNÉSIE x3 !' : '');
  const z = zone();
  $('zone').style.left = z[0] + '%'; $('zone').style.width = (z[1] - z[0]) + '%';
  $('heat').style.width = Math.min(100, S.heat) + '%';
  $('potato').classList.toggle('burnt', S.burn > 0);
  $('sunMsg').textContent = S.burn > 0 ? '🔥 Coup de soleil ! Patate bloquée…' :
    heatMult() === 2 ? '☀️ Bronzage parfait : x2 !' : 'Clique vite, mais pas trop ! Reste dans la zone verte (x2).';
  BAT.forEach(b => {
    const el = $(b.id), c = coutBat(b);
    el.disabled = S.score < c;
    el.querySelector('.c').textContent = 'Coût : ' + fmt(c);
    el.querySelector('.n').textContent = S.owned[b.id];
  });
  UPS.forEach(u => { $(u.id).disabled = S.score < u.cost; });
}

// ===== Minijeux débloqués par certains bâtiments =====
const MG = { garden: ['b2', 'une Ferme'], stock: ['b4', 'un Moulin'], magic: ['b7', 'une Plage à patates'] };
const graine = () => Math.ceil(50 + pps() * 8);
const prixAction = () => Math.ceil(50 * (1 + S.owned.b4) * S.st.p / 100);
const manaMax = () => 40 + 5 * S.owned.b7;
const SORTS = [
  { cout: 25, fx: () => { const g = 200 + pps() * 45; ajoute(g); } },                 // pluie de patates
  { cout: 35, fx: () => { S.frenzy = has('frenz') ? 15 : 10; } },                        // frénésie x3
  { cout: 15, fx: () => { S.heat = 0; S.burn = 0; } }                                    // parasol magique
];

function buildMini() {
  S.plots = Array(9).fill(null);
  S.st = { p: 100, held: 0, t: 0, trend: 0 };
  S.mana = 40;
  $('plots').innerHTML = '';
  S.plots.forEach((_, i) => {
    const b = document.createElement('button'); b.id = 'plot' + i;
    b.onclick = () => {
      if (!S.run) return;
      const p = S.plots[i];
      if (!p) { const c = graine(); if (S.score >= c) { S.score -= c; S.plots[i] = { t: 0, c }; } }
      else if (p.t >= 15 && p.t < 30) { ajoute(p.c * 3); S.plots[i] = null; }
      else if (p.t >= 30) S.plots[i] = null;
    };
    $('plots').appendChild(b);
  });
  $('stBuy').onclick = () => { const c = prixAction(); if (S.run && S.score >= c) { S.score -= c; S.st.held++; } };
  $('stSell').onclick = () => { if (S.run && S.st.held > 0) { S.score += prixAction(); S.st.held--; } };
  $('stAll').onclick = () => { if (S.run) { S.score += prixAction() * S.st.held; S.st.held = 0; } };
  SORTS.forEach((sp, i) => $('sp' + i).onclick = () => {
    if (S.run && S.mana >= sp.cout) { S.mana -= sp.cout; sp.fx(); }
  });
}

function tickMini(dt) {
  S.plots.forEach(p => { if (p) p.t += dt; });
  S.st.t += dt;
  if (S.st.t >= 1.5) {                       // le cours évolue au hasard
    S.st.t = 0; const old = S.st.p;
    S.st.p += (100 - S.st.p) * 0.06 + S.st.p * (Math.random() - 0.5) * 0.35;
    S.st.p = Math.max(20, Math.min(300, S.st.p));
    S.st.trend = S.st.p > old ? 1 : -1;
  }
  S.mana = Math.min(manaMax(), S.mana + 1.5 * dt);
}

function renderMini() {
  Object.keys(MG).forEach(k => {
    const ok = S.owned[MG[k][0]] > 0, el = $('mg-' + k);
    el.classList.toggle('locked', !ok);
    el.querySelector('.lock').textContent = '🔒 Achète ' + MG[k][1] + ' pour débloquer ce minijeu.';
  });
  S.plots.forEach((p, i) => {
    const b = $('plot' + i);
    b.className = p && p.t >= 15 && p.t < 30 ? 'ripe' : '';
    b.textContent = !p ? '➕ ' + fmt(graine()) : p.t < 15 ? '🌱 ' + Math.ceil(15 - p.t) + ' s' : p.t < 30 ? '🥔 Récolter !' : '🍂 Pourri';
  });
  $('stPrice').textContent = fmt(prixAction()) + ' 🥔';
  $('stTrend').textContent = S.st.trend > 0 ? '📈' : S.st.trend < 0 ? '📉' : '';
  $('stHeld').textContent = S.st.held;
  $('stBuy').disabled = S.score < prixAction();
  $('stSell').disabled = $('stAll').disabled = S.st.held < 1;
  $('mana').style.width = S.mana / manaMax() * 100 + '%';
  $('manaTxt').textContent = 'Mana : ' + Math.floor(S.mana) + ' / ' + manaMax();
  SORTS.forEach((sp, i) => $('sp' + i).disabled = S.mana < sp.cout);
}

function loop(now) {
  if (!S.run) return;
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  ajoute(pps() * dt);
  S.comboT -= dt; if (S.comboT <= 0) S.combo = 0;
  S.heat = Math.max(0, S.heat - 22 * dt);
  if (S.burn > 0) S.burn -= dt;
  if (S.frenzy > 0) S.frenzy -= dt;
  if ($('golden').hidden) {
    S.goldIn -= dt;
    if (S.goldIn <= 0) { apparitionDoree(); S.goldIn = (15 + Math.random() * 15) / (has('gold') ? 2 : 1); }
  } else { S.goldLife -= dt; if (S.goldLife <= 0) $('golden').hidden = true; }
  tickMini(dt); render(); renderMini();
  if (S.total >= OBJECTIF) return victoire();
  requestAnimationFrame(loop);
}

// Condition de fin : victoire quand l'objectif de récolte est atteint
function victoire() {
  S.run = false;
  $('ovTitle').textContent = 'Victoire ! 🏝️';
  $('ovText').textContent = 'Tu as récolté ' + fmt(S.total) + ' patates : les vacances sont réussies !';
  $('start').textContent = 'Rejouer';
  $('overlay').classList.remove('hidden');
}

$('potato').addEventListener('click', clic);
$('golden').addEventListener('click', clicDoree);
$('start').addEventListener('click', init);
$('restart').addEventListener('click', () => { if (confirm('Recommencer la partie ?')) init(); });

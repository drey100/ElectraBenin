/* ═══════════════════════════════════════════════════════════════
   ElectraBénin — app.js
   Moteur de calcul SBEE + interactions UI
═══════════════════════════════════════════════════════════════ */

/* ── Navigation pages ── */
function startApp() {
  document.getElementById('page-accueil').style.display = 'none';
  var pc = document.getElementById('page-calcul');
  pc.style.display = 'flex';
  window.scrollTo(0, 0);
}

function goBack() {
  document.getElementById('page-calcul').style.display = 'none';
  document.getElementById('page-accueil').style.display = 'flex';
  window.scrollTo(0, 0);
}

/* ═══════════════════════════════════════════════════════════════
   ÉTAT GLOBAL
═══════════════════════════════════════════════════════════════ */
var STATE = { calc: 'BT1', rev: 'BT1', spl: 'BT1' };

/* ═══════════════════════════════════════════════════════════════
   CONSTANTES TARIFAIRES SBEE
   D = 500 FCFA  (prime fixe, soumise TVA)
   E = 3 FCFA/kWh (Taxe Électricité commune)
   F = 3 FCFA/kWh (Fonds d'Électrification Rurale)
   TVA = 18%
═══════════════════════════════════════════════════════════════ */
var C = {
  D: 500, E: 3, F: 3, TVA: 0.18,
  BT1_SOCIALE: 86,
  BT1_T1: 125,
  BT1_T2: 148,
  BT2: 125,
  BT3: 133
};

/* ═══════════════════════════════════════════════════════════════
   MOTEUR DE CALCUL
═══════════════════════════════════════════════════════════════ */
window.calcFacture = function(kwh, bt) {
  kwh = Math.max(0, kwh);
  var D = C.D;
  var E = C.E * kwh;
  var F = C.F * kwh;
  var conso = 0, prixU = 0, tranche = null;

  if (bt === 'BT1') {
    if (kwh <= 20) {
      tranche = 'sociale'; prixU = C.BT1_SOCIALE; conso = C.BT1_SOCIALE * kwh;
    } else if (kwh <= 250) {
      tranche = 't1'; prixU = C.BT1_T1; conso = C.BT1_T1 * kwh;
    } else {
      tranche = 't2'; prixU = null; conso = (C.BT1_T1 * 250) + (kwh - 250) * C.BT1_T2;
    }
  } else if (bt === 'BT2') {
    tranche = 'bt2'; prixU = C.BT2; conso = C.BT2 * kwh;
  } else {
    tranche = 'bt3'; prixU = C.BT3; conso = C.BT3 * kwh;
  }

  var tvaConso      = conso * C.TVA;
  var tvaPrestation = D * C.TVA;
  var tvaTotal      = tvaConso + tvaPrestation;
  var net           = conso + D + tvaTotal + E + F;

  return { kwh: kwh, bt: bt, tranche: tranche, conso: conso, prixU: prixU,
           D: D, E: E, F: F, tvaConso: tvaConso, tvaPrestation: tvaPrestation,
           tvaTotal: tvaTotal, net: net };
};

/* ── Recherche dichotomique kWh ← facture ── */
window.inverseKwh = function(target, bt) {
  if (target <= calcFacture(0, bt).net) return 0;
  var lo = 0, hi = 500000, mid = 0;
  for (var i = 0; i < 80; i++) {
    mid = (lo + hi) / 2;
    var n = calcFacture(mid, bt).net;
    if (Math.abs(n - target) < 0.001) break;
    if (n < target) lo = mid; else hi = mid;
  }
  return Math.round(mid);
};

/* ═══════════════════════════════════════════════════════════════
   CONSTRUCTION HTML FACTURE
═══════════════════════════════════════════════════════════════ */
function buildLines(d) {
  var fmt  = function(n) { return n === 0 ? '' : Math.round(n).toLocaleString('fr-FR'); };
  var fmtF = function(n) { return Math.round(n).toLocaleString('fr-FR') + '\u00A0FCFA'; };
  var h = '';

  if (d.bt === 'BT1') {
    var tranches = [
      { id: 'sociale', label: 'Tranche sociale',  pu: '86',    cls: 'g' },
      { id: 't1',      label: 'Tranche 1',         pu: '125',   cls: 'a' },
      { id: 't2',      label: 'Tranche 2',         pu: 'mixte', cls: 'o' }
    ];
    tranches.forEach(function(tr) {
      var isActive = d.tranche === tr.id;
      if (isActive) {
        var puText = tr.id === 't2' ? '250\u00D7125 + reste\u00D7148' : tr.pu + ' FCFA/kWh';
        h += '<div class="ftr hi ' + tr.cls + '">'
           + '<span class="rub"><span class="tg ' + tr.cls + '">' + (tr.id === 'sociale' ? 'TS' : tr.id.toUpperCase()) + '</span>' + tr.label + '</span>'
           + '<span class="qte">' + d.kwh + '</span>'
           + '<span class="pu">' + puText + '</span>'
           + '<span class="mt ' + tr.cls + '">' + fmtF(d.conso) + '</span>'
           + '</div>';
      } else {
        h += '<div class="ftr"><span class="rub" style="color:var(--text3)">' + tr.label + '</span>'
           + '<span class="qte"></span><span class="pu"></span><span class="mt"></span></div>';
      }
    });
  } else if (d.bt === 'BT2') {
    h += '<div class="ftr hi b"><span class="rub"><span class="tg b">BT2</span>Consommation professionnelle</span>'
       + '<span class="qte">' + d.kwh + '</span><span class="pu">125 FCFA/kWh</span>'
       + '<span class="mt b">' + fmtF(d.conso) + '</span></div>';
  } else {
    h += '<div class="ftr hi t"><span class="rub"><span class="tg t">BT3</span>\u00C9clairage public</span>'
       + '<span class="qte">' + d.kwh + '</span><span class="pu">133 FCFA/kWh</span>'
       + '<span class="mt t">' + fmtF(d.conso) + '</span></div>';
  }

  h += '<div class="ftr sep"><span class="rub"><span class="tg x">D</span>Prime Fixe</span>'
     + '<span class="qte"></span><span class="pu">500 FCFA</span>'
     + '<span class="mt v">' + fmtF(d.D) + '</span></div>';
  h += '<div class="ftr"><span class="rub" style="color:var(--text3)">Autres Primes</span>'
     + '<span class="qte"></span><span class="pu"></span><span class="mt">0</span></div>';
  h += '<div class="ftr"><span class="rub"><span class="tg t">E</span>Communes (\u00C9clairage Public)</span>'
     + '<span class="qte">' + d.kwh + '</span><span class="pu">' + C.E + ' FCFA</span>'
     + '<span class="mt t">' + fmtF(d.E) + '</span></div>';
  h += '<div class="ftr"><span class="rub"><span class="tg t">F</span>Fonds d\u2019\u00C9lectrification Rurale</span>'
     + '<span class="qte">' + d.kwh + '</span><span class="pu">' + C.F + ' FCFA</span>'
     + '<span class="mt t">' + fmtF(d.F) + '</span></div>';
  h += '<div class="ftr"><span class="rub" style="color:var(--text3)">Mensualit\u00E9 branchement</span>'
     + '<span class="qte"></span><span class="pu"></span><span class="mt">0</span></div>';

  var tvaConsoLabel = '<span class="tg b">TVA</span>TVA/Montant consommation';
  h += '<div class="ftr sep"><span class="rub">' + tvaConsoLabel + '</span>'
     + '<span class="qte">' + fmtF(d.conso) + '</span><span class="pu">18 %</span>'
     + '<span class="mt b">' + fmtF(d.tvaConso) + '</span></div>';
  h += '<div class="ftr"><span class="rub"><span class="tg b">TVA</span>TVA sur prestations (prime fixe)</span>'
     + '<span class="qte">' + fmtF(d.D) + '</span><span class="pu">18 %</span>'
     + '<span class="mt b">' + fmtF(d.tvaPrestation) + '</span></div>';
  h += '<div class="ftr sep"><span class="rub" style="font-weight:700;color:var(--text)">TOTAL TTC</span>'
     + '<span class="qte"></span><span class="pu"></span><span class="mt p bold">' + fmtF(d.net) + '</span></div>';
  h += '<div class="ftr"><span class="rub" style="color:var(--text3)">SUBVENTION \u00C9TAT</span>'
     + '<span class="qte"></span><span class="pu"></span><span class="mt">0</span></div>';

  return h;
}

/* ═══════════════════════════════════════════════════════════════
   BADGE TRANCHE EN TEMPS RÉEL
═══════════════════════════════════════════════════════════════ */
function liveTrancheCalc(val) {
  if (STATE.calc !== 'BT1') return;
  var kwh = parseFloat(val);
  var tb = document.getElementById('tb');
  if (isNaN(kwh) || kwh < 0) { tb.className = 'tranche-badge'; return; }
  if (kwh <= 20) {
    tb.className = 'tranche-badge show ts';
    tb.querySelector('.tb-name').textContent    = '\u2705 Tranche Sociale \u2014 86 FCFA/kWh';
    tb.querySelector('.tb-formula').textContent = 'Net = A + D + TVA(A+D) + E\u00D7Q + F\u00D7Q';
  } else if (kwh <= 250) {
    tb.className = 'tranche-badge show t1';
    tb.querySelector('.tb-name').textContent    = '\uD83D\uDFE1 Tranche 1 \u2014 125 FCFA/kWh';
    tb.querySelector('.tb-formula').textContent = 'Net = B + D + (B+D)\u00D718% + E\u00D7Q + F\u00D7Q';
  } else {
    tb.className = 'tranche-badge show t2';
    tb.querySelector('.tb-name').textContent    = '\uD83D\uDFE0 Tranche 2 \u2014 148 FCFA/kWh (au-del\u00E0 de 250)';
    tb.querySelector('.tb-formula').textContent = 'C = (125\u00D7250) + (Q-250)\u00D7148  |  Net = C + D + (C+D)\u00D718% + E\u00D7Q + F\u00D7Q';
  }
}

/* ═══════════════════════════════════════════════════════════════
   SÉLECTION TARIF
═══════════════════════════════════════════════════════════════ */
function setTarif(mode, bt) {
  STATE[mode] = bt;
  var prefix = { calc: 'sel-calc', rev: 'sel-rev', spl: 'sel-spl' }[mode];
  ['BT1','BT2','BT3'].forEach(function(t) {
    var el = document.getElementById(prefix + '-' + t.toLowerCase());
    if (el) el.classList.toggle('active', t === bt);
  });
  if (mode === 'calc') {
    var tb = document.getElementById('tb');
    if (bt !== 'BT1') tb.className = 'tranche-badge';
    else liveTrancheCalc(document.getElementById('c-kwh').value);
  }
  var resultMap = { calc: 'r-calc', rev: 'r-rev', spl: 'r-split' };
  document.getElementById(resultMap[mode]).classList.remove('show');
}

/* ═══════════════════════════════════════════════════════════════
   MODE 1 — kWh → Facture
═══════════════════════════════════════════════════════════════ */
function doCalc() {
  var kwh = vget('c-kwh','ec-kwh', function(v) { return !isNaN(v) && v >= 0; });
  var kva = vget('c-kva','ec-kva', function(v) { return !isNaN(v) && v >= 1; });
  if (kwh === null || kva === null) return;
  var d = calcFacture(kwh, STATE.calc);
  document.getElementById('ft-calc').innerHTML = buildLines(d);
  document.getElementById('c-net').textContent  = f(d.net);
  show('r-calc');
}

/* ═══════════════════════════════════════════════════════════════
   MODE 2 — Facture → kWh
═══════════════════════════════════════════════════════════════ */
function doReverse() {
  var net = vget('r-net','er-net', function(v) { return !isNaN(v) && v > 0; });
  var kva = vget('r-kva','er-kva', function(v) { return !isNaN(v) && v >= 1; });
  if (net === null || kva === null) return;
  var estKwh = inverseKwh(net, STATE.rev);
  var d = calcFacture(estKwh, STATE.rev);
  document.getElementById('rev-kwh').textContent = estKwh + ' kWh';
  document.getElementById('ft-rev').innerHTML    = buildLines(d);
  document.getElementById('rev-net').textContent = f(d.net);
  show('r-rev');
}

/* ═══════════════════════════════════════════════════════════════
   UTILITAIRES
═══════════════════════════════════════════════════════════════ */
function f(n) { return Math.round(n).toLocaleString('fr-FR') + '\u00A0FCFA'; }

function vget(id, eid, cond) {
  var v = parseFloat(document.getElementById(id).value);
  var ok = cond(v);
  document.getElementById(id).classList.toggle('err', !ok);
  document.getElementById(eid).style.display = ok ? 'none' : 'block';
  return ok ? v : null;
}

function show(id) {
  var el = document.getElementById(id);
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Navigation tabs ── */
function goTab(t) {
  document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('.tab[data-t="' + t + '"]').classList.add('active');

  if (t === 'split') {
    document.querySelector('.card').style.display = 'none';
    document.getElementById('p-split').style.display = 'block';
    splInitIfNeeded();
  } else {
    document.querySelector('.card').style.display = '';
    document.getElementById('p-split').style.display = 'none';
    document.getElementById('p-' + t).classList.add('active');
    ['r-calc','r-rev'].forEach(function(id) { document.getElementById(id).classList.remove('show'); });
    if (t === 'calc') document.getElementById('tb').className = 'tranche-badge';
  }
}

/* ── Entrée clavier ── */
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  var p = document.querySelector('.panel.active');
  if (!p) {
    if (document.getElementById('p-split').style.display !== 'none') doSplit();
    return;
  }
  if (p.id === 'p-calc') doCalc();
  else if (p.id === 'p-reverse') doReverse();
});

/* ═══════════════════════════════════════════════════════════════
   MODE 3 — COMPTEUR PARTAGÉ
═══════════════════════════════════════════════════════════════ */
var SPL_COLORS = [
  { cls: 'uc0', hex: '#ed1f24' },
  { cls: 'uc1', hex: '#009944' },
  { cls: 'uc2', hex: '#e09000' },
  { cls: 'uc3', hex: '#3b5998' },
  { cls: 'uc4', hex: '#6b3fa0' },
  { cls: 'uc5', hex: '#007a30' },
  { cls: 'uc6', hex: '#c8181d' }
];

var splUsers  = [];
var splIdSeed = 0;
var splInited = false;

function splInitIfNeeded() {
  if (splInited) return;
  splInited = true;
  splUsers  = [];
  splIdSeed = 0;
  splAddUser(true);
  splAddUser(true);
  splRenderUsers();
  document.getElementById('spl-nb').value = 2;
}

function splNbChange(val) {
  var n = parseInt(val, 10);
  if (isNaN(n) || n < 2 || n > 7) return;
  while (splUsers.length < n) splAddUser(true);
  while (splUsers.length > n) splUsers.pop();
  splRenderUsers();
  document.getElementById('r-split').classList.remove('show');
}

function splAddUser(silent) {
  if (splUsers.length >= 7) return;
  splUsers.push({ id: splIdSeed++ });
  if (!silent) {
    splRenderUsers();
    document.getElementById('spl-nb').value = splUsers.length;
    document.getElementById('r-split').classList.remove('show');
  }
}

function splRemoveUser(id) {
  if (splUsers.length <= 2) return;
  splUsers = splUsers.filter(function(u) { return u.id !== id; });
  splRenderUsers();
  document.getElementById('spl-nb').value = splUsers.length;
  document.getElementById('r-split').classList.remove('show');
}

function splRenderUsers() {
  var list = document.getElementById('spl-users-list');
  var html = '';
  splUsers.forEach(function(u, i) {
    var c = SPL_COLORS[i % SPL_COLORS.length];
    var canDel = splUsers.length > 2;
    html += '<div class="user-bloc">'
          + '<div class="user-bloc-head">'
          + '<div class="user-bloc-title">'
          + '<span class="unum ' + c.cls + '">' + (i + 1) + '</span>'
          + '<span>Utilisateur ' + (i + 1) + '</span>'
          + '</div>';
    if (canDel) html += '<button class="btn-del" onclick="splRemoveUser(' + u.id + ')">\u2715 Retirer</button>';
    html += '</div>';
    html += '<div class="frow c2" style="margin-bottom:0;">';

    html += '<div class="field">'
          + '<label>Consommation du mois</label>'
          + '<div class="iw">'
          + '<input type="number" id="spl-kwh-' + u.id + '" min="0" placeholder="kWh consomm\u00E9s" class="bf"/>'
          + '<span class="utag">kWh</span>'
          + '</div>';
    if (i === 0) {
      html += '<span class="hint" style="color:' + c.hex + ';">\u26A0\uFE0F Au moins un kWh requis</span>';
    } else {
      html += '<span class="hint">Laisser vide = part calcul\u00E9e sur le reste</span>';
    }
    html += '</div>';

    html += '<div class="field">'
          + '<label>Nom / identifiant</label>'
          + '<div class="iw">'
          + '<input type="text" id="spl-name-' + u.id + '" placeholder="ex\u00A0: Appt ' + (i + 1) + '"'
          + ' style="font-family:var(--font);font-size:.88rem;padding:11px 14px;"/>'
          + '</div>'
          + '<span class="hint">Optionnel</span>'
          + '</div>';

    html += '</div></div>';
  });
  list.innerHTML = html;
  document.getElementById('spl-add-btn').style.display = splUsers.length >= 7 ? 'none' : 'flex';
}

function doSplit() {
  var totalFcfa = parseFloat(document.getElementById('spl-total').value);
  if (isNaN(totalFcfa) || totalFcfa <= 0) {
    document.getElementById('spl-total').classList.add('err');
    document.getElementById('e-spltotal').style.display = 'block';
    return;
  }
  document.getElementById('spl-total').classList.remove('err');
  document.getElementById('e-spltotal').style.display = 'none';

  var N  = splUsers.length;
  var bt = STATE.spl;
  var fmtF = function(n) { return Math.round(n).toLocaleString('fr-FR') + '\u00A0FCFA'; };

  /* 1. Lire données utilisateurs */
  var users = splUsers.map(function(u, i) {
    var rawKwh  = parseFloat(document.getElementById('spl-kwh-' + u.id).value);
    var rawName = (document.getElementById('spl-name-' + u.id).value || '').trim();
    return {
      id: u.id, idx: i,
      nom: rawName || ('Utilisateur ' + (i + 1)),
      kwh: (isNaN(rawKwh) || rawKwh < 0) ? null : rawKwh,
      color: SPL_COLORS[i % SPL_COLORS.length]
    };
  });

  var connus = users.filter(function(u) { return u.kwh !== null; });
  if (connus.length === 0) {
    var inp = document.getElementById('spl-kwh-' + splUsers[0].id);
    inp.classList.add('err'); inp.focus(); return;
  }

  /* 2. Estimer kWh total + kWh inconnus */
  var kwhTotal   = inverseKwh(totalFcfa, bt);
  var kwhConnus  = connus.reduce(function(s, u) { return s + u.kwh; }, 0);
  var inconnus   = users.filter(function(u) { return u.kwh === null; });
  var kwhReste   = Math.max(0, kwhTotal - kwhConnus);
  var kwhParInco = inconnus.length > 0 ? kwhReste / inconnus.length : 0;

  /* 3. Frais fixes ÷ N */
  var D_total  = C.D;
  var TVA_D    = C.D * C.TVA;
  var fixeTotal = D_total + TVA_D;
  var fixeParN  = fixeTotal / N;
  var montantVar = totalFcfa - fixeTotal;

  /* 4. Parts par utilisateur */
  var dGl = calcFacture(kwhTotal, bt);
  var results = users.map(function(u) {
    var kwh = u.kwh !== null ? u.kwh : kwhParInco;
    var ratio    = kwhTotal > 0 ? kwh / kwhTotal : 1 / N;
    var partVar  = ratio * montantVar;
    var partTot  = fixeParN + partVar;
    return {
      idx: u.idx, nom: u.nom, color: u.color,
      kwh: kwh, isInconnu: u.kwh === null,
      ratio: ratio,
      partFixe: fixeParN, partVar: partVar, partTot: partTot,
      tranche: dGl.tranche, prixU: dGl.prixU,
      partConso:    ratio * dGl.conso,
      partTVAConso: ratio * dGl.tvaConso,
      partE: C.E * kwh,
      partF: C.F * kwh,
      partD: D_total / N,
      partTVAD: TVA_D / N
    };
  });

  var totalVerif = results.reduce(function(s, r) { return s + r.partTot; }, 0);
  var ecart = Math.abs(totalVerif - totalFcfa);

  /* 5. Labels tranche */
  var tLbl = { sociale: 'Tranche Sociale', t1: 'Tranche 1', t2: 'Tranche 2', bt2: 'BT2', bt3: 'BT3' };
  var tCls = { sociale: 'rt-s', t1: 'rt-1', t2: 'rt-2', bt2: 'rt-p', bt3: 'rt-p' };

  /* 6. Barre proportion */
  var labH = '', barH = '';
  results.forEach(function(r) {
    var pct = (r.partTot / totalFcfa * 100).toFixed(1);
    labH += '<span style="color:' + r.color.hex + ';font-weight:700;">' + r.nom + '\u00A0' + pct + '%</span>';
    barH += '<div style="width:' + pct + '%;background:' + r.color.hex + ';transition:width .5s ease;"></div>';
  });
  document.getElementById('spl-bar-labels').innerHTML = labH;
  document.getElementById('spl-propbar').innerHTML    = barH;

  /* 7. Résumé frais fixes */
  var trGlLbl = tLbl[dGl.tranche] || '';
  var sumH = ''
    + '<div class="sum-row"><span class="sl">kWh total estim\u00E9 (compteur)</span><span class="sv" style="color:var(--yellow2)">' + kwhTotal + ' kWh</span></div>'
    + '<div class="sum-row"><span class="sl">Tranche (toute la facture)</span><span class="sv" style="color:var(--green2)">' + trGlLbl + '</span></div>'
    + '<div class="sum-row"><span class="sl">Prime fixe D</span><span class="sv" style="color:var(--blue)">' + fmtF(D_total) + '</span></div>'
    + '<div class="sum-row"><span class="sl">TVA sur prime (18%)</span><span class="sv" style="color:var(--blue)">' + fmtF(TVA_D) + '</span></div>'
    + '<div class="sum-row"><span class="sl">Total fixes \u00F7 ' + N + ' utilisateurs</span><span class="sv" style="color:var(--red)">' + fmtF(fixeTotal) + ' \u2192 ' + fmtF(fixeParN) + ' / pers.</span></div>'
    + '<div class="sum-row"><span class="sl">Montant variable (conso + TVA + taxes)</span><span class="sv" style="color:var(--yellow2)">' + fmtF(montantVar) + '</span></div>';
  document.getElementById('spl-sum-fixes').innerHTML = sumH;

  /* 8. Cards utilisateurs avec tableau de calcul détaillé */
  var cardsH = '';
  results.forEach(function(r) {
    var pct    = (r.partTot / totalFcfa * 100).toFixed(1);
    var kwhPct = kwhTotal > 0 ? (r.kwh / kwhTotal * 100).toFixed(1) : '—';

    var consoLabel = r.tranche === 't2'
      ? 'Conso (mixte 125/148 FCFA)'
      : 'Conso (' + (r.prixU || '?') + ' FCFA/kWh)';
    var consoFormula = r.tranche === 't2'
      ? Math.round(r.kwh) + ' kWh \u00D7 ratio ' + (r.ratio * 100).toFixed(1) + '%'
      : Math.round(r.kwh) + ' kWh \u00D7 ' + (r.prixU || '?') + ' FCFA';

    cardsH +=
      '<div class="res-card" style="border-left-color:' + r.color.hex + ';">'

      /* En-tête */
      + '<div class="res-head">'
      + '<div class="res-identity">'
      + '<span class="unum ' + r.color.cls + '">' + (r.idx + 1) + '</span>'
      + '<div><div class="res-name">' + r.nom + '</div>'
      + '<div class="res-kwh">'
      + (r.isInconnu ? '~' + Math.round(r.kwh) + ' kWh estim\u00E9s' : r.kwh + ' kWh saisis')
      + ' \u00B7 ' + kwhPct + '% du compteur'
      + '</div></div>'
      + '</div>'
      + '<span class="res-tranche ' + tCls[r.tranche] + '">' + tLbl[r.tranche] + '</span>'
      + '</div>'

      /* Montant */
      + '<div class="res-amount-block">'
      + '<div class="res-amount" style="color:' + r.color.hex + ';">' + fmtF(r.partTot) + '</div>'
      + '<div class="res-amount-sub">Part totale \u00E0 payer \u00B7 ' + pct + '% de la facture</div>'
      + '</div>'

      /* Tableau de calcul */
      + '<div class="detail-label">D\u00E9tail des calculs</div>'
      + '<table class="calc-detail-table">'
      + '<thead><tr><th>Rubrique</th><th>Formule</th><th>Montant</th></tr></thead>'
      + '<tbody>'
      + '<tr class="row-var"><td>' + consoLabel + '</td><td>' + consoFormula + '</td><td>' + fmtF(r.partConso) + '</td></tr>'
      + '<tr class="row-var"><td>TVA / consommation (18%)</td><td>' + fmtF(r.partConso) + ' \u00D7 18%</td><td>' + fmtF(r.partTVAConso) + '</td></tr>'
      + '<tr class="row-var"><td>Taxe communes \u00C9cl. Public (E)</td><td>' + Math.round(r.kwh) + ' kWh \u00D7 ' + C.E + ' FCFA</td><td>' + fmtF(r.partE) + '</td></tr>'
      + '<tr class="row-var"><td>Fonds \u00C9lectrification Rurale (F)</td><td>' + Math.round(r.kwh) + ' kWh \u00D7 ' + C.F + ' FCFA</td><td>' + fmtF(r.partF) + '</td></tr>'
      + '<tr class="row-sep"><td colspan="3" style="font-size:.6rem;color:var(--text3);">Frais fixes partag\u00E9s \u00F7 ' + N + ' utilisateurs</td></tr>'
      + '<tr class="row-fixe"><td>Prime fixe (D)</td><td>' + fmtF(D_total) + ' \u00F7 ' + N + '</td><td>' + fmtF(r.partD) + '</td></tr>'
      + '<tr class="row-fixe"><td>TVA / prime fixe (18%)</td><td>' + fmtF(D_total) + ' \u00D7 18% \u00F7 ' + N + '</td><td>' + fmtF(r.partTVAD) + '</td></tr>'
      + '</tbody>'
      + '<tfoot><tr><td><strong>TOTAL \u00E0 payer</strong></td><td></td><td><strong>' + fmtF(r.partTot) + '</strong></td></tr></tfoot>'
      + '</table>';

    if (r.isInconnu) {
      cardsH += '<div style="margin-top:8px;padding:7px 11px;background:rgba(249,168,37,.07);border:1px solid rgba(249,168,37,.22);border-radius:6px;font-size:.69rem;color:var(--yellow2);">'
              + '\u26A0\uFE0F kWh non saisi \u2014 consommation estim\u00E9e sur les kWh r\u00E9siduels du compteur</div>';
    }

    cardsH += '</div>';
  });

  document.getElementById('spl-res-cards').innerHTML = cardsH;

  /* 9. Écart */
  var resteBox = document.getElementById('spl-reste-box');
  if (ecart > 2) {
    resteBox.classList.remove('hidden');
    document.getElementById('spl-reste-val').textContent = fmtF(ecart) + ' d\u2019\u00E9cart';
  } else {
    resteBox.classList.add('hidden');
  }

  document.getElementById('spl-total-check').textContent = fmtF(totalFcfa);
  show('r-split');
}

/* ── Auto-test de validation ── */
(function() {
  var r = calcFacture(15, 'BT1');
  console.log('[ElectraBénin] Test 15 kWh BT1 =>', Math.round(r.net), 'FCFA', Math.round(r.net) === 2202 ? '✅' : '❌ (attendu 2202)');
})();

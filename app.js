/* ═══════════════════════════════════════════════════════════
   ElectraBénin — app.js
   Hash routing · Calcul SBEE · Swipe Ads · Carousel
═══════════════════════════════════════════════════════════ */

/* ══ NAVIGATION (Hash routing) ══ */
var PAGES = ['page-accueil','page-calcul','page-guide'];

function showPage(hash) {
  var map = {'#accueil':'page-accueil','#calcul':'page-calcul','#guide':'page-guide'};
  var target = map[hash] || 'page-accueil';
  PAGES.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (id === target) {
      el.style.display = (id === 'page-calcul') ? 'flex' : 'block';
    } else {
      el.style.display = 'none';
    }
  });
  window.scrollTo(0,0);
}

function startApp() { window.location.hash = '#calcul'; }
function goBack()   { window.location.hash = '#accueil'; }
function goGuide()  { window.location.hash = '#guide'; }

window.addEventListener('hashchange', function() { showPage(window.location.hash); });
window.addEventListener('DOMContentLoaded', function() { showPage(window.location.hash || '#accueil'); });

/* ══ CONSTANTES TARIFAIRES SBEE ══ */
var C = { D:500, E:3, F:3, TVA:0.18,
  BT1_SOCIALE:86, BT1_T1:125, BT1_T2:148, BT2:125, BT3:133 };

/* ══ MOTEUR DE CALCUL ══ */
window.calcFacture = function(kwh, bt) {
  kwh = Math.max(0, kwh);
  var conso=0, prixU=0, tranche=null;
  if (bt==='BT1') {
    if (kwh<=20)       { tranche='sociale'; prixU=C.BT1_SOCIALE; conso=C.BT1_SOCIALE*kwh; }
    else if (kwh<=250) { tranche='t1';      prixU=C.BT1_T1;      conso=C.BT1_T1*kwh; }
    else               { tranche='t2';      prixU=null;           conso=(C.BT1_T1*250)+(kwh-250)*C.BT1_T2; }
  } else if (bt==='BT2') {
    tranche='bt2'; prixU=C.BT2; conso=C.BT2*kwh;
  } else {
    tranche='bt3'; prixU=C.BT3; conso=C.BT3*kwh;
  }
  var tvaConso=conso*C.TVA, tvaD=C.D*C.TVA, tvaTotal=tvaConso+tvaD;
  var net=conso+C.D+tvaTotal+C.E*kwh+C.F*kwh;
  return {kwh:kwh,bt:bt,tranche:tranche,conso:conso,prixU:prixU,
    D:C.D,E:C.E*kwh,F:C.F*kwh,tvaConso:tvaConso,tvaPrestation:tvaD,tvaTotal:tvaTotal,net:net};
};

window.inverseKwh = function(target, bt) {
  if (target<=calcFacture(0,bt).net) return 0;
  var lo=0,hi=500000,mid=0;
  for (var i=0;i<80;i++) {
    mid=(lo+hi)/2; var n=calcFacture(mid,bt).net;
    if (Math.abs(n-target)<0.001) break;
    if (n<target) lo=mid; else hi=mid;
  }
  return Math.round(mid);
};

/* ══ CONSTRUCTION TABLEAU FACTURE ══ */
function buildLines(d) {
  var fmtF=function(n){return Math.round(n).toLocaleString('fr-FR')+'\u00A0FCFA';};
  var h='';
  if (d.bt==='BT1') {
    var trs=[{id:'sociale',label:'Tranche sociale',pu:'86',cls:'g'},
             {id:'t1',label:'Tranche 1',pu:'125',cls:'a'},
             {id:'t2',label:'Tranche 2',pu:'mixte',cls:'o'}];
    trs.forEach(function(tr){
      if (d.tranche===tr.id) {
        var puTxt=tr.id==='t2'?'250\u00D7125 + reste\u00D7148':tr.pu+' FCFA/kWh';
        h+='<div class="ftr hi '+tr.cls+'"><span class="rub"><span class="tg '+tr.cls+'">'+(tr.id==='sociale'?'TS':tr.id.toUpperCase())+'</span>'+tr.label+'</span>'
          +'<span class="qte">'+d.kwh+'</span><span class="pu">'+puTxt+'</span>'
          +'<span class="mt '+tr.cls+'">'+fmtF(d.conso)+'</span></div>';
      } else {
        h+='<div class="ftr"><span class="rub" style="color:var(--text3)">'+tr.label+'</span>'
          +'<span class="qte"></span><span class="pu"></span><span class="mt"></span></div>';
      }
    });
  } else if (d.bt==='BT2') {
    h+='<div class="ftr hi b"><span class="rub"><span class="tg b">BT2</span>Consommation professionnelle</span>'
      +'<span class="qte">'+d.kwh+'</span><span class="pu">125 FCFA/kWh</span>'
      +'<span class="mt b">'+fmtF(d.conso)+'</span></div>';
  } else {
    h+='<div class="ftr hi t"><span class="rub"><span class="tg t">BT3</span>\u00C9clairage public</span>'
      +'<span class="qte">'+d.kwh+'</span><span class="pu">133 FCFA/kWh</span>'
      +'<span class="mt t">'+fmtF(d.conso)+'</span></div>';
  }
  h+='<div class="ftr sep"><span class="rub"><span class="tg x">D</span>Prime Fixe</span>'
    +'<span class="qte"></span><span class="pu">500 FCFA</span><span class="mt v">'+fmtF(d.D)+'</span></div>';
  h+='<div class="ftr"><span class="rub" style="color:var(--text3)">Autres Primes</span>'
    +'<span class="qte"></span><span class="pu"></span><span class="mt">0</span></div>';
  h+='<div class="ftr"><span class="rub"><span class="tg t">E</span>Communes (\u00C9clairage Public)</span>'
    +'<span class="qte">'+d.kwh+'</span><span class="pu">'+C.E+' FCFA</span><span class="mt t">'+fmtF(d.E)+'</span></div>';
  h+='<div class="ftr"><span class="rub"><span class="tg t">F</span>Fonds d\u2019\u00C9lectrification Rurale</span>'
    +'<span class="qte">'+d.kwh+'</span><span class="pu">'+C.F+' FCFA</span><span class="mt t">'+fmtF(d.F)+'</span></div>';
  h+='<div class="ftr"><span class="rub" style="color:var(--text3)">Mensualit\u00E9 branchement</span>'
    +'<span class="qte"></span><span class="pu"></span><span class="mt">0</span></div>';
  h+='<div class="ftr sep"><span class="rub"><span class="tg b">TVA</span>TVA/Montant consommation</span>'
    +'<span class="qte">'+fmtF(d.conso)+'</span><span class="pu">18 %</span><span class="mt b">'+fmtF(d.tvaConso)+'</span></div>';
  h+='<div class="ftr"><span class="rub"><span class="tg b">TVA</span>TVA sur prestations (prime fixe)</span>'
    +'<span class="qte">'+fmtF(d.D)+'</span><span class="pu">18 %</span><span class="mt b">'+fmtF(d.tvaPrestation)+'</span></div>';
  h+='<div class="ftr"><span class="rub" style="color:var(--text3)">SUBVENTION \u00C9TAT</span>'
    +'<span class="qte"></span><span class="pu"></span><span class="mt">0</span></div>';
  h+='<div class="ftr sep"><span class="rub" style="font-weight:700;color:var(--text)">TOTAL TTC</span>'
    +'<span class="qte"></span><span class="pu"></span><span class="mt p bold">'+fmtF(d.net)+'</span></div>';
  return h;
}

/* ══ BADGE TRANCHE LIVE ══ */
function liveTrancheCalc(val) {
  if (STATE.calc!=='BT1') return;
  var kwh=parseFloat(val), tb=document.getElementById('tb');
  if (isNaN(kwh)||kwh<0){tb.className='tranche-badge';return;}
  if (kwh<=20){
    tb.className='tranche-badge show ts';
    tb.querySelector('.tb-name').textContent='\u2705 Tranche Sociale \u2014 86 FCFA/kWh';
    tb.querySelector('.tb-formula').textContent='Net = A + D + TVA(A+D) + E\u00D7Q + F\u00D7Q';
  } else if (kwh<=250){
    tb.className='tranche-badge show t1';
    tb.querySelector('.tb-name').textContent='\uD83D\uDFE1 Tranche 1 \u2014 125 FCFA/kWh';
    tb.querySelector('.tb-formula').textContent='Net = B + D + (B+D)\u00D718% + E\u00D7Q + F\u00D7Q';
  } else {
    tb.className='tranche-badge show t2';
    tb.querySelector('.tb-name').textContent='\uD83D\uDFE0 Tranche 2 \u2014 148 FCFA/kWh (au-del\u00E0 de 250)';
    tb.querySelector('.tb-formula').textContent='C = (125\u00D7250) + (Q-250)\u00D7148  |  Net = C + D + (C+D)\u00D718% + E\u00D7Q + F\u00D7Q';
  }
}

var STATE = {calc:'BT1',rev:'BT1',spl:'BT1'};

function setTarif(mode, bt) {
  STATE[mode]=bt;
  var prefix={calc:'sel-calc',rev:'sel-rev',spl:'sel-spl'}[mode];
  ['BT1','BT2','BT3'].forEach(function(t){
    var el=document.getElementById(prefix+'-'+t.toLowerCase());
    if(el) el.classList.toggle('active',t===bt);
  });
  if (mode==='calc'){
    var tb=document.getElementById('tb');
    if (bt!=='BT1') tb.className='tranche-badge';
    else liveTrancheCalc(document.getElementById('c-kwh').value);
  }
  var rm={calc:'r-calc',rev:'r-rev',spl:'r-split'}[mode];
  document.getElementById(rm).classList.remove('show');
}

/* ══ UTILITAIRES ══ */
var STATE = {calc:'BT1',rev:'BT1',spl:'BT1'};
function f(n){return Math.round(n).toLocaleString('fr-FR')+'\u00A0FCFA';}
function vget(id,eid,cond){
  var v=parseFloat(document.getElementById(id).value);
  var ok=cond(v);
  document.getElementById(id).classList.toggle('err',!ok);
  document.getElementById(eid).style.display=ok?'none':'block';
  return ok?v:null;
}
function show(id){
  var el=document.getElementById(id);
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

/* ══ MODE 1 — kWh → Facture ══ */
function doCalc(){
  var kwh=vget('c-kwh','ec-kwh',function(v){return !isNaN(v)&&v>=0;});
  var kva=vget('c-kva','ec-kva',function(v){return !isNaN(v)&&v>=1;});
  if(kwh===null||kva===null) return;
  var d=calcFacture(kwh,STATE.calc);
  document.getElementById('ft-calc').innerHTML=buildLines(d);
  document.getElementById('c-net').textContent=f(d.net);
  show('r-calc');
}

/* ══ MODE 2 — Facture → kWh ══ */
function doReverse(){
  var net=vget('r-net','er-net',function(v){return !isNaN(v)&&v>0;});
  var kva=vget('r-kva','er-kva',function(v){return !isNaN(v)&&v>=1;});
  if(net===null||kva===null) return;
  var estKwh=inverseKwh(net,STATE.rev);
  var d=calcFacture(estKwh,STATE.rev);
  document.getElementById('rev-kwh').textContent=estKwh+' kWh';
  document.getElementById('ft-rev').innerHTML=buildLines(d);
  document.getElementById('rev-net').textContent=f(d.net);
  show('r-rev');
}

/* ══ TABS ══ */
function goTab(t){
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('active');});
  document.querySelector('.tab[data-t="'+t+'"]').classList.add('active');
  var mainCard=document.querySelector('.card-wrap .card:not(#p-split)');
  var splitCard=document.getElementById('p-split');
  if (t==='split'){
    if(mainCard) mainCard.style.display='none';
    if(splitCard) splitCard.style.display='block';
    splInitIfNeeded();
  } else {
    if(mainCard) mainCard.style.display='';
    if(splitCard) splitCard.style.display='none';
    document.getElementById('p-'+t).classList.add('active');
    ['r-calc','r-rev'].forEach(function(id){document.getElementById(id).classList.remove('show');});
    if(t==='calc') document.getElementById('tb').className='tranche-badge';
  }
}

document.addEventListener('keydown',function(e){
  if(e.key!=='Enter') return;
  var p=document.querySelector('.panel.active');
  if(!p){if(document.getElementById('p-split').style.display!=='none') doSplit(); return;}
  if(p.id==='p-calc') doCalc(); else if(p.id==='p-reverse') doReverse();
});

/* ══ MODE 3 — COMPTEUR PARTAGÉ ══ */
var SPL_COLORS=[
  {cls:'uc0',hex:'#ed1f24'},{cls:'uc1',hex:'#009944'},{cls:'uc2',hex:'#e09000'},
  {cls:'uc3',hex:'#3b5998'},{cls:'uc4',hex:'#6b3fa0'},{cls:'uc5',hex:'#007a30'},{cls:'uc6',hex:'#c8181d'}
];
var splUsers=[],splIdSeed=0,splInited=false;

function splInitIfNeeded(){
  if(splInited) return; splInited=true; splUsers=[]; splIdSeed=0;
  splAddUser(true); splAddUser(true); splRenderUsers();
  document.getElementById('spl-nb').value=2;
}
function splNbChange(val){
  var n=parseInt(val,10); if(isNaN(n)||n<2||n>7) return;
  while(splUsers.length<n) splAddUser(true);
  while(splUsers.length>n) splUsers.pop();
  splRenderUsers(); document.getElementById('r-split').classList.remove('show');
}
function splAddUser(silent){
  if(splUsers.length>=7) return;
  splUsers.push({id:splIdSeed++});
  if(!silent){splRenderUsers();document.getElementById('spl-nb').value=splUsers.length;document.getElementById('r-split').classList.remove('show');}
}
function splRemoveUser(id){
  if(splUsers.length<=2) return;
  splUsers=splUsers.filter(function(u){return u.id!==id;});
  splRenderUsers(); document.getElementById('spl-nb').value=splUsers.length;
  document.getElementById('r-split').classList.remove('show');
}
function splRenderUsers(){
  var list=document.getElementById('spl-users-list'),html='';
  splUsers.forEach(function(u,i){
    var c=SPL_COLORS[i%SPL_COLORS.length],canDel=splUsers.length>2;
    html+='<div class="user-bloc"><div class="user-bloc-head"><div class="user-bloc-title">'
      +'<span class="unum '+c.cls+'">'+(i+1)+'</span><span>Utilisateur '+(i+1)+'</span></div>';
    if(canDel) html+='<button class="btn-del" onclick="splRemoveUser('+u.id+')">\u2715 Retirer</button>';
    html+='</div><div class="frow c2" style="margin-bottom:0;">'
      +'<div class="field"><label>Consommation du mois</label><div class="iw">'
      +'<input type="number" id="spl-kwh-'+u.id+'" min="0" placeholder="kWh consomm\u00E9s" class="bf"/>'
      +'<span class="utag">kWh</span></div>'
      +(i===0?'<span class="hint" style="color:'+c.hex+';">\u26A0\uFE0F Au moins un kWh requis</span>':'<span class="hint">Laisser vide = calcul\u00E9 sur le reste</span>')
      +'</div>'
      +'<div class="field"><label>Nom / identifiant</label><div class="iw">'
      +'<input type="text" id="spl-name-'+u.id+'" placeholder="ex\u00A0: Appt '+(i+1)+'" style="font-family:var(--font);font-size:.88rem;padding:11px 14px;"/>'
      +'</div><span class="hint">Optionnel</span></div>'
      +'</div></div>';
  });
  list.innerHTML=html;
  document.getElementById('spl-add-btn').style.display=splUsers.length>=7?'none':'flex';
}

function doSplit(){
  var totalFcfa=parseFloat(document.getElementById('spl-total').value);
  if(isNaN(totalFcfa)||totalFcfa<=0){
    document.getElementById('spl-total').classList.add('err');
    document.getElementById('e-spltotal').style.display='block'; return;
  }
  document.getElementById('spl-total').classList.remove('err');
  document.getElementById('e-spltotal').style.display='none';
  var N=splUsers.length,bt=STATE.spl;
  var fmtF=function(n){return Math.round(n).toLocaleString('fr-FR')+'\u00A0FCFA';};
  var users=splUsers.map(function(u,i){
    var kwh=parseFloat(document.getElementById('spl-kwh-'+u.id).value);
    var name=(document.getElementById('spl-name-'+u.id).value||'').trim();
    return {id:u.id,idx:i,nom:name||('Utilisateur '+(i+1)),kwh:(isNaN(kwh)||kwh<0)?null:kwh,color:SPL_COLORS[i%SPL_COLORS.length]};
  });
  var connus=users.filter(function(u){return u.kwh!==null;});
  if(connus.length===0){var inp=document.getElementById('spl-kwh-'+splUsers[0].id);inp.classList.add('err');inp.focus();return;}
  var kwhTotal=inverseKwh(totalFcfa,bt);
  var kwhConnus=connus.reduce(function(s,u){return s+u.kwh;},0);
  var inconnus=users.filter(function(u){return u.kwh===null;});
  var kwhReste=Math.max(0,kwhTotal-kwhConnus);
  var kwhParInco=inconnus.length>0?kwhReste/inconnus.length:0;
  var fixeTotal=C.D+C.D*C.TVA,fixeParN=fixeTotal/N,montantVar=totalFcfa-fixeTotal;
  var dGl=calcFacture(kwhTotal,bt);
  var tLbl={sociale:'Tranche Sociale',t1:'Tranche 1',t2:'Tranche 2',bt2:'BT2',bt3:'BT3'};
  var tCls={sociale:'rt-s',t1:'rt-1',t2:'rt-2',bt2:'rt-p',bt3:'rt-p'};
  var results=users.map(function(u){
    var kwh=u.kwh!==null?u.kwh:kwhParInco;
    var ratio=kwhTotal>0?kwh/kwhTotal:1/N;
    return {idx:u.idx,nom:u.nom,color:u.color,kwh:kwh,isInconnu:u.kwh===null,ratio:ratio,
      partFixe:fixeParN,partVar:ratio*montantVar,partTot:fixeParN+ratio*montantVar,
      tranche:dGl.tranche,prixU:dGl.prixU,
      partConso:ratio*dGl.conso,partTVAConso:ratio*dGl.tvaConso,
      partE:C.E*kwh,partF:C.F*kwh,partD:C.D/N,partTVAD:C.D*C.TVA/N};
  });
  var totalVerif=results.reduce(function(s,r){return s+r.partTot;},0);
  var ecart=Math.abs(totalVerif-totalFcfa);
  var labH='',barH='';
  results.forEach(function(r){
    var pct=(r.partTot/totalFcfa*100).toFixed(1);
    labH+='<span style="color:'+r.color.hex+';font-weight:700;">'+r.nom+'\u00A0'+pct+'%</span>';
    barH+='<div style="width:'+pct+'%;background:'+r.color.hex+';transition:width .5s ease;"></div>';
  });
  document.getElementById('spl-bar-labels').innerHTML=labH;
  document.getElementById('spl-propbar').innerHTML=barH;
  var trGlLbl=tLbl[dGl.tranche]||'';
  document.getElementById('spl-sum-fixes').innerHTML=
    '<div class="sum-row"><span class="sl">kWh total estim\u00E9</span><span class="sv" style="color:var(--yellow2)">'+kwhTotal+' kWh</span></div>'
    +'<div class="sum-row"><span class="sl">Tranche</span><span class="sv" style="color:var(--green2)">'+trGlLbl+'</span></div>'
    +'<div class="sum-row"><span class="sl">Prime fixe D</span><span class="sv" style="color:var(--blue)">'+fmtF(C.D)+'</span></div>'
    +'<div class="sum-row"><span class="sl">TVA sur prime (18%)</span><span class="sv" style="color:var(--blue)">'+fmtF(C.D*C.TVA)+'</span></div>'
    +'<div class="sum-row"><span class="sl">Total fixes \u00F7 '+N+' utilisateurs</span><span class="sv" style="color:var(--red)">'+fmtF(fixeTotal)+' \u2192 '+fmtF(fixeParN)+' / pers.</span></div>'
    +'<div class="sum-row"><span class="sl">Montant variable</span><span class="sv" style="color:var(--yellow2)">'+fmtF(montantVar)+'</span></div>';
  var cardsH='';
  results.forEach(function(r){
    var pct=(r.partTot/totalFcfa*100).toFixed(1);
    var kwhPct=kwhTotal>0?(r.kwh/kwhTotal*100).toFixed(1):'—';
    var consoLabel=r.tranche==='t2'?'Conso (mixte 125/148 FCFA)':'Conso ('+(r.prixU||'?')+' FCFA/kWh)';
    var consoFormula=r.tranche==='t2'?Math.round(r.kwh)+' kWh \u00D7 ratio '+(r.ratio*100).toFixed(1)+'%':Math.round(r.kwh)+' kWh \u00D7 '+(r.prixU||'?')+' FCFA';
    cardsH+='<div class="res-card" style="border-left-color:'+r.color.hex+';">'
      +'<div class="res-head"><div class="res-identity"><span class="unum '+r.color.cls+'">'+(r.idx+1)+'</span>'
      +'<div><div class="res-name">'+r.nom+'</div>'
      +'<div class="res-kwh">'+(r.isInconnu?'~'+Math.round(r.kwh)+' kWh estim\u00E9s':r.kwh+' kWh saisis')+' \u00B7 '+kwhPct+'% du compteur</div></div></div>'
      +'<span class="res-tranche '+tCls[r.tranche]+'">'+tLbl[r.tranche]+'</span></div>'
      +'<div class="res-amount-block"><div class="res-amount" style="color:'+r.color.hex+';">'+fmtF(r.partTot)+'</div>'
      +'<div class="res-amount-sub">Part totale \u00B7 '+pct+'% de la facture</div></div>'
      +'<div class="detail-label">D\u00E9tail des calculs</div>'
      +'<table class="calc-detail-table"><thead><tr><th>Rubrique</th><th>Formule</th><th>Montant</th></tr></thead><tbody>'
      +'<tr class="row-var"><td>'+consoLabel+'</td><td>'+consoFormula+'</td><td>'+fmtF(r.partConso)+'</td></tr>'
      +'<tr class="row-var"><td>TVA / consommation (18%)</td><td>'+fmtF(r.partConso)+' \u00D7 18%</td><td>'+fmtF(r.partTVAConso)+'</td></tr>'
      +'<tr class="row-var"><td>Taxe communes (E)</td><td>'+Math.round(r.kwh)+' kWh \u00D7 '+C.E+' FCFA</td><td>'+fmtF(r.partE)+'</td></tr>'
      +'<tr class="row-var"><td>Fonds \u00C9lectrification Rurale (F)</td><td>'+Math.round(r.kwh)+' kWh \u00D7 '+C.F+' FCFA</td><td>'+fmtF(r.partF)+'</td></tr>'
      +'<tr class="row-sep"><td colspan="3" style="font-size:.6rem;color:var(--text3);">Frais fixes \u00F7 '+N+' utilisateurs</td></tr>'
      +'<tr class="row-fixe"><td>Prime fixe (D)</td><td>'+fmtF(C.D)+' \u00F7 '+N+'</td><td>'+fmtF(r.partD)+'</td></tr>'
      +'<tr class="row-fixe"><td>TVA / prime (18%)</td><td>'+fmtF(C.D)+' \u00D7 18% \u00F7 '+N+'</td><td>'+fmtF(r.partTVAD)+'</td></tr>'
      +'</tbody><tfoot><tr><td><strong>TOTAL \u00E0 payer</strong></td><td></td><td><strong>'+fmtF(r.partTot)+'</strong></td></tr></tfoot></table>';
    if(r.isInconnu) cardsH+='<div style="padding:7px 11px;background:rgba(249,168,37,.07);border:1px solid rgba(249,168,37,.22);border-radius:6px;font-size:.69rem;color:var(--yellow2);">\u26A0\uFE0F kWh non saisi \u2014 consommation estim\u00E9e</div>';
    cardsH+='</div>';
  });
  document.getElementById('spl-res-cards').innerHTML=cardsH;
  var rb=document.getElementById('spl-reste-box');
  if(ecart>2){rb.classList.remove('hidden');document.getElementById('spl-reste-val').textContent=fmtF(ecart)+' d\u2019\u00E9cart';}
  else rb.classList.add('hidden');
  document.getElementById('spl-total-check').textContent=fmtF(totalFcfa);
  show('r-split');
}

/* ══ SWIPE ADS (page accueil) ══ */
(function(){
  var KP='eb_pubs',KC='eb_config',KS='eb_stats';
  function getPubs(){try{return JSON.parse(localStorage.getItem(KP)||'[]');}catch(e){return[];}}
  function getCfg() {try{return JSON.parse(localStorage.getItem(KC)||'{}');}catch(e){return{};}}
  function getStats(){try{return JSON.parse(localStorage.getItem(KS)||'{}');}catch(e){return{};}}
  function saveStats(s){try{localStorage.setItem(KS,JSON.stringify(s));}catch(e){}}
  function isExpired(p){return p.expires&&new Date(p.expires)<new Date();}
  function recView(id){var s=getStats();if(!s[id])s[id]={views:0,clicks:0};s[id].views++;saveStats(s);}
  function recClick(id){var s=getStats();if(!s[id])s[id]={views:0,clicks:0};s[id].clicks++;saveStats(s);}

  /* ── État ── */
  var SW={pubs:[],cur:0,dur:10000,timer:null,busy:false,paused:false,
          raf:null,rafStart:0,rafElapsed:0,
          dx0:0,dy0:0,t0:0,dragging:false,dragDx:0,
          md:false,mx0:0,mt0:0,mdx:0};

  /* ══ BUILD ══ */
  function swBuild(pubs,dur){
    SW.pubs=pubs; SW.dur=dur; SW.cur=0; SW.busy=false; SW.paused=false;
    var track=document.getElementById('sw-track');
    var dots=document.getElementById('sw-dots');
    var ph=document.getElementById('sw-placeholder');
    var outer=document.getElementById('sw-outer');
    var prev=document.querySelector('.sw-arrow-left');
    var next=document.querySelector('.sw-arrow-right');
    if(!track) return;
    if(pubs.length===0){
      if(ph){ph.style.display='flex';}
      if(prev) prev.style.display='none';
      if(next) next.style.display='none';
      return;
    }
    if(ph) ph.remove();
    track.innerHTML='';
    pubs.forEach(function(p,i){
      var card=document.createElement('div');
      card.className='sw-card'+(i===0?' sw-active':'');
      var a=document.createElement('a');
      a.href=p.href; a.target='_blank'; a.className='sw-card-link';
      a.addEventListener('click',function(){recClick(p.id);});
      var sh=document.createElement('div'); sh.className='sw-shimmer on'; a.appendChild(sh);
      var img=document.createElement('img'); img.className='sw-img'; img.alt=p.alt||p.name; img.style.opacity='0';
      (function(pub,imgEl,shEl){
        var tmp=new Image();
        tmp.onload=function(){imgEl.src=pub.img;imgEl.style.transition='opacity .35s';imgEl.style.opacity='1';shEl.classList.remove('on');recView(pub.id);};
        tmp.onerror=function(){shEl.classList.remove('on');};
        tmp.src=pub.img;
      })(p,img,sh);
      var badge=document.createElement('div'); badge.className='sw-badge'; badge.textContent='Pub';
      var cap=document.createElement('div'); cap.className='sw-caption'; cap.textContent=p.name;
      a.appendChild(img); a.appendChild(badge); a.appendChild(cap);
      card.appendChild(a); track.appendChild(card);
    });
    if(dots){
      dots.innerHTML='';
      pubs.forEach(function(_,i){
        var d=document.createElement('button'); d.className='sw-dot'+(i===0?' active':'');
        (function(idx){d.onclick=function(){if(!SW.busy){swGoTo(idx);swResetProgress();}};})(i);
        dots.appendChild(d);
      });
    }
    if(prev) prev.style.display=pubs.length>1?'flex':'none';
    if(next) next.style.display=pubs.length>1?'flex':'none';
    /* Pause au survol */
    if(outer&&pubs.length>1){
      outer.addEventListener('mouseenter',swPause);
      outer.addEventListener('mouseleave',swResume);
    }
    swBindTouch();
    if(pubs.length>1) swStartProgress();
  }

  /* ══ TRANSITION — parallax + fade ══ */
  function swGoTo(idx){
    if(SW.busy||idx===SW.cur||SW.pubs.length===0) return;
    SW.busy=true;
    var track=document.getElementById('sw-track');
    var cards=track.querySelectorAll('.sw-card');
    var dir=idx>SW.cur?1:-1;
    var cOut=cards[SW.cur], cIn=cards[idx];
    var EASE='cubic-bezier(.25,.46,.45,.94)';
    var DUR=500;
    /* cIn : arrive de côté, légèrement scale down */
    cIn.style.transform='translateX('+(dir*100)+'%) scale(.97)';
    cIn.style.opacity='0';
    cIn.style.transition='none';
    cIn.style.display='block';
    void cIn.offsetWidth;
    cIn.style.transition='transform '+DUR+'ms '+EASE+', opacity '+(DUR-60)+'ms ease';
    cOut.style.transition='transform '+DUR+'ms '+EASE+', opacity '+(DUR-60)+'ms ease';
    /* cIn entre, scale → 1 */
    cIn.style.transform='translateX(0) scale(1)';
    cIn.style.opacity='1';
    /* cOut part en parallax (35% de la vitesse) + fondu */
    cOut.style.transform='translateX('+(-dir*35)+'%) scale(.97)';
    cOut.style.opacity='0';
    setTimeout(function(){
      cOut.style.display='none'; cOut.style.transform=''; cOut.style.opacity=''; cOut.style.transition='';
      cIn.style.transition=''; cIn.classList.add('sw-active'); cOut.classList.remove('sw-active');
      SW.cur=idx; SW.busy=false; swUpdateDots(idx);
      if(!SW.paused) swStartProgress();
    },DUR+20);
  }

  function swUpdateDots(idx){
    var dots=document.getElementById('sw-dots');
    if(!dots) return;
    dots.querySelectorAll('.sw-dot').forEach(function(d,i){d.classList.toggle('active',i===idx);});
  }

  window.swNext=function(){swGoTo((SW.cur+1)%Math.max(SW.pubs.length,1));};
  window.swPrev=function(){swGoTo((SW.cur-1+Math.max(SW.pubs.length,1))%Math.max(SW.pubs.length,1));};

  /* ══ PROGRESS BAR — requestAnimationFrame ══ */
  function swStartProgress(){
    swStopProgress();
    SW.rafElapsed=0;
    SW.rafStart=performance.now();
    var bar=document.getElementById('sw-bar');
    if(bar){bar.style.transition='none';bar.style.width='0%';void bar.offsetWidth;}
    function tick(now){
      var elapsed=now-SW.rafStart;
      var pct=Math.min(elapsed/SW.dur*100,100);
      if(bar) bar.style.width=pct+'%';
      if(elapsed>=SW.dur){ window.swNext(); }
      else { SW.raf=requestAnimationFrame(tick); }
    }
    SW.raf=requestAnimationFrame(tick);
  }

  function swStopProgress(){
    if(SW.raf){cancelAnimationFrame(SW.raf);SW.raf=null;}
  }

  function swResetProgress(){
    swStopProgress();
    if(!SW.paused) swStartProgress();
  }

  /* ══ PAUSE / RESUME au survol ══ */
  function swPause(){
    if(SW.paused||SW.pubs.length<=1||SW.busy) return;
    SW.paused=true;
    SW.rafElapsed=performance.now()-SW.rafStart;
    swStopProgress();
    var bar=document.getElementById('sw-bar');
    if(bar) bar.style.transition='none';
  }

  function swResume(){
    if(!SW.paused||SW.pubs.length<=1) return;
    SW.paused=false;
    /* Reprendre depuis le point de pause */
    swStopProgress();
    SW.rafStart=performance.now()-SW.rafElapsed;
    var bar=document.getElementById('sw-bar');
    if(bar){bar.style.transition='none';bar.style.width=(SW.rafElapsed/SW.dur*100)+'%';void bar.offsetWidth;}
    function tick(now){
      var elapsed=now-SW.rafStart;
      var pct=Math.min(elapsed/SW.dur*100,100);
      if(bar) bar.style.width=pct+'%';
      if(elapsed>=SW.dur){ window.swNext(); }
      else { SW.raf=requestAnimationFrame(tick); }
    }
    SW.raf=requestAnimationFrame(tick);
  }

  /* ══ TOUCH & DRAG ══ */
  function swBindTouch(){
    var outer=document.getElementById('sw-outer');
    if(!outer) return;
    /* Touch */
    outer.addEventListener('touchstart',function(e){
      SW.dx0=e.touches[0].clientX;SW.dy0=e.touches[0].clientY;
      SW.t0=performance.now();SW.dragging=true;SW.dragDx=0;
      swPause();
    },{passive:true});
    outer.addEventListener('touchmove',function(e){
      if(!SW.dragging) return;
      var dx=e.touches[0].clientX-SW.dx0,dy=e.touches[0].clientY-SW.dy0;
      if(Math.abs(dy)>Math.abs(dx)+8){SW.dragging=false;swResume();return;}
      SW.dragDx=dx;
      var track=document.getElementById('sw-track');
      var cards=track?track.querySelectorAll('.sw-card'):[];
      if(cards[SW.cur]){cards[SW.cur].style.transform='translateX('+(dx*0.9)+'px)';cards[SW.cur].style.transition='none';}
    },{passive:true});
    outer.addEventListener('touchend',function(){
      if(!SW.dragging) return; SW.dragging=false;
      var velocity=(performance.now()-SW.t0)>0?SW.dragDx/(performance.now()-SW.t0):0;
      var track=document.getElementById('sw-track');
      var cards=track?track.querySelectorAll('.sw-card'):[];
      if(cards[SW.cur]){cards[SW.cur].style.transform='';cards[SW.cur].style.transition='transform .25s ease';}
      if((SW.dragDx<-45||velocity<-0.4)&&SW.pubs.length>1) window.swNext();
      else if((SW.dragDx>45||velocity>0.4)&&SW.pubs.length>1) window.swPrev();
      else swResume();
    },{passive:true});
    /* Souris */
    var md=false,mx0=0,mt0=0,mdx=0;
    outer.addEventListener('mousedown',function(e){md=true;mx0=e.clientX;mt0=performance.now();mdx=0;swPause();e.preventDefault();});
    document.addEventListener('mousemove',function(e){
      if(!md) return; mdx=e.clientX-mx0;
      var track=document.getElementById('sw-track');
      var cards=track?track.querySelectorAll('.sw-card'):[];
      if(cards[SW.cur]){cards[SW.cur].style.transform='translateX('+mdx+'px)';cards[SW.cur].style.transition='none';}
    });
    document.addEventListener('mouseup',function(){
      if(!md) return; md=false;
      var vel=(performance.now()-mt0)>0?mdx/(performance.now()-mt0):0;
      var track=document.getElementById('sw-track');
      var cards=track?track.querySelectorAll('.sw-card'):[];
      if(cards[SW.cur]){cards[SW.cur].style.transform='';cards[SW.cur].style.transition='transform .25s ease';}
      if((mdx<-55||vel<-0.4)&&SW.pubs.length>1) window.swNext();
      else if((mdx>55||vel>0.4)&&SW.pubs.length>1) window.swPrev();
      else swResume();
    });
  }

  /* ── Mélange aléatoire (Fisher-Yates) ── */
  function shuffle(arr){
    var a=arr.slice();
    for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=a[i];a[i]=a[j];a[j]=tmp;}
    return a;
  }

  /* ── INIT ── */
  function run(){
    var cfg=getCfg(),dur=(cfg.duration||10)*1000;
    var all=getPubs().filter(function(p){return p.active&&!isExpired(p);});
    var homePubs=shuffle(all.filter(function(p){return p.slot==='sidebar'||p.slot==='both';}));
    swBuild(homePubs,dur);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run);
  else run();
})();

/* ── Auto-test ── */
(function(){
  var r=calcFacture(15,'BT1');
  console.log('[ElectraBénin] 15 kWh BT1 =>',Math.round(r.net),'FCFA',Math.round(r.net)===2202?'✅':'❌');
})();
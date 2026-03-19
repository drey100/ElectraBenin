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
  if(window.triggerBanner) window.triggerBanner(3000);
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
  if(window.triggerBanner) window.triggerBanner(2000);
}

/* ══ BANNIÈRE FLOTTANTE (coin bas-droit) ══ */
(function(){
  var _pubs = [], _ready = false, _timer = null, _raf = null;
  var CIRCUMFERENCE = 113.1;

  function loadPubs(){
    fetch(EB_API.pubs)
      .then(function(r){ return r.json(); })
      .then(function(pubs){
        /* Bannière : toutes les pubs actives (tous slots) */
        _pubs = pubs;
        _ready = true;
      }).catch(function(){ _ready = true; });
  }

  function shuffle(arr){
    var a=arr.slice();
    for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}
    return a;
  }

  function buildDOM(){
    if(document.getElementById('eb-banner')) return;

    var card = document.createElement('div');
    card.id = 'eb-banner';
    Object.assign(card.style, {
      position:'fixed', bottom:'16px', right:'16px',
      width:'260px', zIndex:'8888',
      background:'#fff', borderRadius:'14px',
      boxShadow:'0 8px 32px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.10)',
      border:'1px solid #e2e5ea',
      overflow:'hidden',
      transform:'translateY(120%)', transition:'transform .4s cubic-bezier(.34,1.52,.64,1)',
      fontFamily:'Poppins,sans-serif'
    });

    /* Header */
    var hdr = document.createElement('div');
    Object.assign(hdr.style, {
      padding:'7px 10px', background:'#f8f9fb',
      borderBottom:'1px solid #eee',
      display:'flex', alignItems:'center', justifyContent:'space-between'
    });
    var lbl = document.createElement('span');
    lbl.textContent = '📢 Publicité';
    Object.assign(lbl.style, {
      fontSize:'.52rem', fontWeight:'700', textTransform:'uppercase',
      letterSpacing:'.1em', color:'#aab0be'
    });

    /* Anneau + bouton fermer groupés */
    var ring = document.createElement('div');
    Object.assign(ring.style, { position:'relative', width:'26px', height:'26px', flexShrink:'0' });

    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 44 44');
    svg.setAttribute('width','26'); svg.setAttribute('height','26');
    Object.assign(svg.style, {
      position:'absolute', inset:'0',
      transform:'rotate(-90deg)', pointerEvents:'none'
    });
    var bgC = document.createElementNS('http://www.w3.org/2000/svg','circle');
    bgC.setAttribute('cx','22');bgC.setAttribute('cy','22');bgC.setAttribute('r','18');
    bgC.setAttribute('fill','none');bgC.setAttribute('stroke','#e0e3e8');bgC.setAttribute('stroke-width','4');
    var arc = document.createElementNS('http://www.w3.org/2000/svg','circle');
    arc.id = 'eb-banner-arc';
    arc.setAttribute('cx','22');arc.setAttribute('cy','22');arc.setAttribute('r','18');
    arc.setAttribute('fill','none');arc.setAttribute('stroke','#ed1f24');arc.setAttribute('stroke-width','4');
    arc.setAttribute('stroke-linecap','round');
    arc.setAttribute('stroke-dasharray', CIRCUMFERENCE);
    arc.setAttribute('stroke-dashoffset','0');
    svg.appendChild(bgC); svg.appendChild(arc);

    var closeBtn = document.createElement('button');
    closeBtn.id = 'eb-banner-close';
    closeBtn.textContent = '✕';
    closeBtn.onclick = function(){ window.closeBanner(); };
    Object.assign(closeBtn.style, {
      position:'absolute', inset:'0',
      width:'100%', height:'100%',
      display:'none',
      alignItems:'center', justifyContent:'center',
      background:'rgba(240,241,244,.95)', border:'none',
      borderRadius:'50%', cursor:'pointer',
      fontSize:'.78rem', color:'#5a6272', zIndex:'2'
    });

    var countEl = document.createElement('span');
    countEl.id = 'eb-banner-count';
    Object.assign(countEl.style, {
      position:'absolute', inset:'0',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'.58rem', fontWeight:'700', color:'#aab0be', zIndex:'1',
      pointerEvents:'none'
    });

    ring.appendChild(svg);
    ring.appendChild(countEl);
    ring.appendChild(closeBtn);
    hdr.appendChild(lbl); hdr.appendChild(ring);

    /* Image cliquable */
    var link = document.createElement('a');
    link.id = 'eb-banner-link';
    link.target = '_blank'; link.rel = 'noopener';
    Object.assign(link.style, { display:'block', width:'100%', textDecoration:'none' });

    var shimmer = document.createElement('div');
    Object.assign(shimmer.style, {
      width:'100%', height:'130px', background:'#f0f1f4',
      display:'flex', alignItems:'center', justifyContent:'center'
    });
    shimmer.innerHTML = '<span style="font-size:1.2rem;opacity:.2;">📷</span>';

    var img = document.createElement('img');
    img.id = 'eb-banner-img'; img.alt = '';
    Object.assign(img.style, {
      width:'100%', height:'130px', objectFit:'cover',
      display:'block', opacity:'0', transition:'opacity .3s'
    });

    link.appendChild(shimmer); link.appendChild(img);

    /* Footer */
    var ftr = document.createElement('div');
    Object.assign(ftr.style, { padding:'10px 12px 12px' });

    var nameEl = document.createElement('div');
    nameEl.id = 'eb-banner-name';
    Object.assign(nameEl.style, {
      fontSize:'.8rem', fontWeight:'700', color:'#1a1d23',
      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
      lineHeight:'1.3'
    });
    var descEl = document.createElement('div');
    descEl.id = 'eb-banner-desc';
    Object.assign(descEl.style, {
      fontSize:'.67rem', color:'#6a7282', marginTop:'4px',
      lineHeight:'1.5', wordBreak:'break-word', display:'none'
    });
    ftr.appendChild(nameEl); ftr.appendChild(descEl);

    card.appendChild(hdr);
    card.appendChild(link);
    card.appendChild(ftr);
    document.body.appendChild(card);
  }

  function showBanner(pub, duration){
    duration = duration || 7000;
    buildDOM();
    var card    = document.getElementById('eb-banner');
    var link    = document.getElementById('eb-banner-link');
    var img     = document.getElementById('eb-banner-img');
    var nameEl  = document.getElementById('eb-banner-name');
    var descEl  = document.getElementById('eb-banner-desc');
    var arc     = document.getElementById('eb-banner-arc');
    var countEl = document.getElementById('eb-banner-count');
    var closeBtn= document.getElementById('eb-banner-close');

    link.href = pub.href || '#';
    link.onclick = function(){ recClick(pub.id); };
    nameEl.textContent = pub.alt || pub.name || '';
    if(pub.description){ descEl.textContent = pub.description; descEl.style.display='block'; }
    else { descEl.style.display='none'; }

    /* Image */
    img.style.opacity = '0';
    img.src = '';
    img.style.display = 'block';
    var prev = img.previousElementSibling; /* shimmer */
    if(prev) prev.style.display = 'flex';
    var tmp = new Image();
    tmp.onload = function(){
      img.src = pub.img; img.style.opacity='1';
      if(prev) prev.style.display='none';
      recView(pub.id);
    };
    tmp.onerror = function(){ if(prev) prev.style.display='none'; };
    tmp.src = pub.img;

    /* Slide in */
    card.style.transition = 'none';
    card.style.transform = 'translateY(120%)';
    card.style.display = 'block';
    void card.offsetWidth;
    card.style.transition = 'transform .4s cubic-bezier(.34,1.52,.64,1)';
    card.style.transform = 'translateY(0)';

    /* Compte à rebours */
    arc.setAttribute('stroke-dashoffset','0');
    closeBtn.style.display = 'none';
    countEl.style.display = 'flex';
    var DURATION = duration;
    var start = null;
    if(_raf) cancelAnimationFrame(_raf);

    function tick(ts){
      if(!start) start = ts;
      var elapsed = ts - start;
      var secs = Math.ceil(Math.max(0, DURATION - elapsed) / 1000);
      countEl.textContent = secs + 's';
      var offset = CIRCUMFERENCE * (elapsed / DURATION);
      arc.setAttribute('stroke-dashoffset', Math.min(offset, CIRCUMFERENCE));
      if(elapsed >= DURATION){
        countEl.style.display = 'none';
        closeBtn.style.display = 'flex';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.justifyContent = 'center';
      } else {
        _raf = requestAnimationFrame(tick);
      }
    }
    _raf = requestAnimationFrame(tick);
  }

  function recView(id){ fetch(EB_API.statView(id),{method:'POST'}).catch(function(){}); }
  function recClick(id){ fetch(EB_API.statClick(id),{method:'POST'}).catch(function(){}); }

  window.closeBanner = function(){
    var card = document.getElementById('eb-banner');
    if(!card) return;
    if(_raf){ cancelAnimationFrame(_raf); _raf=null; }
    card.style.transform = 'translateY(120%)';
    setTimeout(function(){ if(card) card.style.display='none'; }, 420);
  };

  /* Déclenchement immédiat avec durée personnalisée */
  window.triggerBanner = function(dur){
    if(!_ready){
      /* Réessayer dans 500ms si l'API n'a pas encore répondu */
      setTimeout(function(){ window.triggerBanner(dur); }, 500);
      return;
    }
    if(_pubs.length === 0) return;
    showBanner(shuffle(_pubs)[0], dur || 7000);
  };
  window.triggerInterstitielNow = window.triggerBanner;

  /* Accueil — après 10s, une seule fois par session */
  window.triggerInterstitielDelay = function(delay){
    if(_timer) return;
    _timer = setTimeout(function(){
      if(_pubs.length === 0) return;
      try{
        if(sessionStorage.getItem('eb_inter_home')) return;
        sessionStorage.setItem('eb_inter_home','1');
      }catch(e){}
      showBanner(shuffle(_pubs)[0], 7000);
    }, delay || 10000);
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', loadPubs);
  else loadPubs();
})();




/* ── Auto-test ── */
(function(){
  var r=calcFacture(15,'BT1');
  console.log('[ElectraBénin] 15 kWh BT1 =>',Math.round(r.net),'FCFA',Math.round(r.net)===2202?'✅':'❌');
})();
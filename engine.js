/* App shell is injected here so index.html only holds the landing page. */
(function(){const h="<div id=\"app\" hidden>\n  <div class=\"t-top\">\n    <div class=\"wrap\">\n      <a class=\"logo\" href=\"#top\" id=\"exitLink\" aria-label=\"Leave test\">\n        <svg viewBox=\"0 0 100 74\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M50 8C44 2 32 2 27 9C18 8 10 16 12 25C5 30 5 42 12 47C10 56 18 64 27 62C32 70 44 72 50 66C56 72 68 70 73 62C82 64 90 56 88 47C95 42 95 30 88 25C90 16 82 8 73 9C68 2 56 2 50 8Z\" fill=\"#f9df6d\"/><path d=\"M50 10V64\" stroke=\"#fff\" stroke-width=\"3\" fill=\"none\"/><path d=\"M28 42L44 28L60 38L74 24\" fill=\"none\" stroke=\"#121212\" stroke-width=\"2.5\"/><g fill=\"#121212\"><circle cx=\"28\" cy=\"42\" r=\"4.5\"/><circle cx=\"44\" cy=\"28\" r=\"4.5\"/><circle cx=\"60\" cy=\"38\" r=\"4.5\"/><circle cx=\"74\" cy=\"24\" r=\"4.5\"/></g></svg>\n        <span>Neurometr<span class=\"idot\">ı</span>c</span>\n      </a>\n      <div class=\"meta\"><span id=\"tCount\" class=\"mono\">1 of 30</span><span class=\"clock\" id=\"tClock\">00:00</span></div>\n    </div>\n    <div class=\"tprog\" aria-hidden=\"true\"><i id=\"tBar\"></i></div>\n  </div>\n  <div class=\"wrap t-main\" id=\"tMain\"></div>\n</div>\n\n<div class=\"cheer\" id=\"cheer\" role=\"status\" aria-live=\"polite\"></div>\n";document.getElementById('shell').outerHTML=h;if(window.BF_LANG)BF_LANG.apply();})();
/* bell curve */
function bell(svg,mark){
  const bw=svg.getBoundingClientRect().width,W=bw>=300?Math.min(760,Math.round(bw)):640,H=Math.round(W*.39),L=24,R=W-24,T=36,B=H-44,lo=55,hi=145;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const X=v=>L+(v-lo)/(hi-lo)*(R-L),pdf=v=>Math.exp(-((v-100)**2)/(2*225));const Y=v=>B-pdf(v)*(B-T);
  let d='';for(let v=lo;v<=hi;v+=1)d+=(v===lo?'M':'L')+X(v).toFixed(1)+' '+Y(v).toFixed(1);
  const band=(a,b,op)=>{let p=`M${X(a)} ${B}`;for(let v=a;v<=b;v+=1)p+=`L${X(v).toFixed(1)} ${Y(v).toFixed(1)}`;return `<path d="${p}L${X(b)} ${B}Z" fill="var(--accent)" fill-opacity="${op}"/>`;};
  let s=band(85,115,.22)+band(70,85,.1)+band(115,130,.1)+`<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
  s+=`<line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="var(--line-2)"/>`;
  [55,70,85,100,115,130,145].forEach(v=>{s+=`<line x1="${X(v)}" y1="${B}" x2="${X(v)}" y2="${B+6}" stroke="var(--line-2)"/><text x="${X(v)}" y="${B+24}" text-anchor="middle">${v}</text>`;});
  s+=`<text x="${X(100)}" y="${Y(100)+44}" text-anchor="middle">68%</text>`;
  if(mark!=null){const v=Math.max(lo,Math.min(hi,mark));s+=`<line x1="${X(v)}" y1="${T-6}" x2="${X(v)}" y2="${B}" stroke="var(--accent)" stroke-width="2"/><circle cx="${X(v)}" cy="${Y(v)}" r="5" fill="var(--accent)"/><text class="you" x="${X(v)}" y="${T-12}" text-anchor="${v>hi-12?'end':v<lo+12?'start':'middle'}" font-size="14">You, ${mark}</text>`;}
  svg.innerHTML=s;
}
/* ---------- test engine ---------- */
const PER_ITEM=45;
const U=(k,a,b)=>window.BF_LANG?BF_LANG.ui(k,a,b):k;
const Xl=(k,a,b)=>window.BF_LANG?BF_LANG.x(k,a,b):k;
const TI=it=>window.BF_LANG?BF_LANG.item(it.id):null;
const iQ=it=>{if(it.type==='pat')return U('patQ');const t=TI(it);return (t&&t.q)||it.q;};
const iOpts=it=>{const t=TI(it);return it.type!=='scan'&&t&&t.opts&&it.opts&&t.opts.length===it.opts.length?t.opts:it.opts;};
const iWhy=it=>{const t=TI(it);if(t&&t.why)return it.type==='scan'?Xl('scanThere',it.count)+t.why:t.why;return it.why;};
const dName=d=>{const n=window.BF_LANG&&BF_LANG.dom(DOMAINS.indexOf(d));return n||d.name;};
function dock(){const d=document.getElementById('langDock');if(d)d.remove();}window.BF_DOCK=dock;
let autoTimer=null;
let st=null,clockTimer=null,subTimer=null;
const $=id=>document.getElementById(id);
function fmt(s){s=Math.max(0,s);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}

const PLACEHOLDER_AHEAD_PCT=(window.BF_PCT||{ahead:91}).ahead; // TODO before launch: random 87-95 placeholder (see pct.js), replace with the real calculation
let geoCC=null,geoAsked=false;
function loadGeo(){ // visitor's country from the edge (x-vercel-ip-country); no third-party lookup, nothing stored
  if(geoAsked)return;geoAsked=true;
  try{fetch('/api/geo',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&/^[A-Z]{2}$/.test(j.country||''))geoCC=j.country;}).catch(()=>{});}catch(e){}
}
function geoName(){
  if(!geoCC)return '';
  try{return new Intl.DisplayNames([(window.BF_LANG&&BF_LANG.get())||'en'],{type:'region'}).of(geoCC)||'';}catch(e){return '';}
}
function startTest(){
  loadGeo();
  st={i:0,ans:Array(ITEMS.length).fill(null),seen:{},cp:{},sec:0,done:false,hold:true,word:WORDS[Math.floor(Math.random()*WORDS.length)],recall:null};
  $('landing').hidden=true;$('app').hidden=false;window.scrollTo(0,0);
  clearInterval(clockTimer);
  clockTimer=setInterval(()=>{if(st.done||st.hold)return;st.sec++;$("tClock").textContent=fmt(st.sec);},1000);
  $('tClock').textContent=fmt(0);$('tClock').classList.remove('low');
  welcomeScreen();
}
document.querySelectorAll('.js-start').forEach(b=>b.addEventListener('click',startTest));
$('exitLink').addEventListener('click',e=>{e.preventDefault();leave();});
function leave(){clearInterval(clockTimer);clearTimeout(subTimer);clearInterval(subTimer);if(st){st.done=true;st.view=null;}dock();$('app').hidden=true;$('landing').hidden=false;window.scrollTo(0,0);}

const DCOL={fluid:'purple',quant:'yellow',verbal:'green',spatial:'blue',memory:'orange',speed:'pink'};
function pips(all){
  const el=$('tBar');if(!el)return;
  const f=all?1:(st&&!st.hold?(st.i+(st.ans[st.i]!==null?1:0))/ITEMS.length:0);
  el.style.transform=`scaleX(${Math.min(1,f).toFixed(3)})`;
}
function render(){
  clearTimeout(subTimer);clearInterval(subTimer);clearTimeout(autoTimer);
  const it=ITEMS[st.i],dom=DOMAINS.find(d=>d.id===it.d);st.view=render;dock();
  $('tCount').textContent=U('nOf',st.i+1,ITEMS.length);
  pips();
  let body='';
  if(it.type==='pat'){
    const cells=[];for(let r=0;r<it.n;r++)for(let c=0;c<it.n;c++){const last=r===it.n-1&&c===it.n-1,s=last?null:it.cell(r,c);cells.push(s?`<div class="pcell">${s}</div>`:`<div class="pcell q">?</div>`);}
    body=`<div class="pat"><div class="pcard"><div class="pgrid g${it.n}">${cells.join('')}</div></div><div class="ppanel"><p class="pch">${U('choose')}</p><div class="opts pat6" role="radiogroup" aria-label="${Xl('answers')}">${it.choices.map((ch,j)=>optFig(j,ch.svg)).join('')}</div></div></div>`;
  }else if(it.type==='matrix'){
    body=`<div class="mx" id="qMx"></div><div class="opts" role="radiogroup" aria-label="${Xl('answers')}">${it.choices.map((ch,j)=>optFig(j,cellSVG(ch.c))).join('')}</div>`;
  }else if(it.type==='series'){
    body=`<div class="seq">${it.seq.map(n=>`<span>${n}</span>`).join('')}<span class="blank">?</span></div>${optText(iOpts(it))}`;
  }else if(it.type==='choice'){
    body=(it.id==='dir'&&window.BF_LANG?BF_LANG.compass(it.pre||''):(it.pre||''))+optText(iOpts(it),it.mono);
  }else if(it.type==='figseq'){
    body=`<div class="seq figs">${it.seq.map(c=>`<span>${cellSVG(c)}</span>`).join('')}<span class="blank">?</span></div><div class="opts" style="grid-template-columns:repeat(5,1fr)" role="radiogroup">${it.choices.map((ch,j)=>optFig(j,cellSVG(ch.c))).join('')}</div>`;
  }else if(it.type==='analogy'){
    body=`<div class="ana"><div class="ar"><span>${cellSVG(it.A)}</span><i>→</i><span>${cellSVG(it.B)}</span></div><div class="ar"><span>${cellSVG(it.C)}</span><i>→</i><span class="blank">?</span></div></div><div class="opts ana6" role="radiogroup" aria-label="${Xl('answers')}">${it.choices.map((ch,j)=>optFig(j,cellSVG(ch.c))).join('')}</div>`;
  }else if(it.type==='oddfig'){
    body=`<div class="opts" style="grid-template-columns:repeat(4,1fr)" role="radiogroup">${it.choices.map((ch,j)=>optFig(j,cellSVG(ch.c))).join('')}</div>`;
  }else if(it.type==='rotate'){
    body=`<div class="target"><svg viewBox="0 0 100 100" aria-label="${Xl('target')}">${polySVG(it.base,4).replace(/<svg[^>]*>|<\/svg>/g,'')}</svg><span class="label">${Xl('target')}</span></div><div class="opts" style="grid-template-columns:repeat(4,1fr)" role="radiogroup">${it.choices.map((ch,j)=>optFig(j,polySVG(ch.c,4))).join('')}</div>`;
  }else if(it.type==='net'){
    body=`<div class="opts" style="grid-template-columns:repeat(2,1fr)" role="radiogroup">${it.choices.map((ch,j)=>optFig(j,netSVG(ch.c),'wide')).join('')}</div>`;
  }else if(it.type==='memory'){
    body=memoryHTML(it);
  }else if(it.type==='scan'){
    body=scanHTML(it);
  }
  const needBtn=it.type==='memory';
  const q=iQ(it);
  $('tMain').innerHTML=`<div class="qcard${it.type==='pat'?' is-pat':''}"><div class="qhead"><span class="chip c-${DCOL[it.d]}">${dName(dom)}</span></div>
    <h2 class="qtitle">${q}</h2>${it.type==='memory'&&it.mode==='backward'?`<p class="qsub">${U('lastDigit')}</p>`:''}
    ${body}
    <div class="qnav">${needBtn?'<button class="btn btn-primary" id="memBtn"></button>':''}<button class="link-btn" id="prevBtn"${st.i===0?' disabled':''}>${U('back')}</button>${needBtn?'':`<span class="kbd">${U('keys').replace(/–6/,"–"+Math.min(9,(it.choices&&it.choices.length)||(it.opts&&it.opts.length)||6))}</span>`}</div></div>`;
  if(it.type==='matrix')renderMatrix($('qMx'),it,false);
  markSel();
  $('prevBtn').onclick=()=>go(st.i-1);
  if($('memBtn'))$('memBtn').onclick=memAction;
  $('tMain').querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.j));
  if(it.type==='memory')wireMemory(it);
  if(it.type==='scan')wireScan(it);
}
const optFig=(j,svg,cls)=>`<button class="opt fig ${cls||''}" data-j="${j}" role="radio" aria-label="${Xl('option',j+1)}"><span class="k">${j+1}</span>${svg}</button>`;
const optText=(opts,mono)=>`<div class="opts text${opts.every(o=>String(o).length<=9)?' short':''}" role="radiogroup">${opts.map((o,j)=>`<button class="opt${mono?' mono':''}" data-j="${j}" role="radio"><span class="k">${j+1}</span><span>${o}</span></button>`).join('')}</div>`;
function markSel(){$('tMain').querySelectorAll('.opt').forEach(b=>{const on=+b.dataset.j===st.ans[st.i];b.classList.toggle('sel',on);b.setAttribute('aria-checked',on);});}
let cheerN=0;function cheer(){return;const c=$('cheer');if(!c)return;{const ci=cheerN++%CHEERS.length;c.textContent=(window.BF_LANG&&BF_LANG.cheer(ci))||CHEERS[ci];}c.classList.remove('on');void c.offsetWidth;c.classList.add('on');}
function pick(j){const it=ITEMS[st.i];if(it.type==='scan'&&st.seen[st.i]==='closed')return;const first=st.ans[st.i]===null;st.ans[st.i]=j;markSel();
  clearTimeout(autoTimer);{const at=st.i;autoTimer=setTimeout(()=>{if(st&&!st.done&&st.i===at)next();},320);}
  pips();}
function go(i){if(i<0||i>=ITEMS.length)return;st.i=i;render();window.scrollTo({top:0});}
function memAction(){const it=ITEMS[st.i];if(!st.seen[st.i]){startMemory(it);return;}if(st.seen[st.i]==='run')return;const v=($('memIn')||{}).value;if(v!=null&&v!=='')st.ans[st.i]=v.replace(/\D/g,'');next();}
function next(){
  if(st.i===ITEMS.length-1){recallScreen();return;}
  const n=st.i+1;if(CHECKPOINTS.includes(n)&&!st.cp[n]){st.cp[n]=1;checkpoint(n);return;}
  go(st.i+1);}
const CUTS={curie:['Marie Curie','1867–1934'],newton:['Isaac Newton','1643–1727'],plato:['Plato','428–348 BC'],aristotle:['Aristotle','384–322 BC'],einstein:['Albert Einstein','1879–1955']};
const cutHTML=id=>`<div class="fc2" aria-hidden="true"><span class="fc2-n">${CUTS[id][0]} · ${CUTS[id][1]}</span><div class="fc2-st"><img src="figs/${id}.webp" alt="" width="300" height="360" decoding="async"></div></div>`;
const CP_FIG=['curie','newton','plato','aristotle','einstein'],CP_FACT=[0,1,2,4,3];
const ILL_KEYS=["world","csClock","csPodium","csCurve","csGlobe"];
const SK_POS=[[[12,26,.2],[12,40,1.1]],[[14,34,.5],[12,24,1.4]],[[16,20,.1],[14,30,.8]],[[14,28,.3],[16,16,1]]];
function illHTML(k,note){ // k>=1: new paper cards with pill label, sparkles and a count-up sticker note
  const art=(window.BF_ART||{})[ILL_KEYS[k]]||"";
  if(k<1||!note)return `<div class="fc2 fc2-ill" aria-hidden="true"><div class="fc2-st">${art}</div></div>`;
  const sk=SK_POS[k-1].map((p,i)=>`<span class="cs-sk" style="${i?'right':'left'}:${p[0]}%;top:${p[1]}%;--d:${p[2]}s"><i></i></span>`).join('');
  return `<div class="fc2 fc2-ill" aria-hidden="true"><span class="fc2-n">${Xl('csP'+(k-1))}</span>${sk}<div class="fc2-st">${art}</div><div class="cs-stk"><b data-t="${note}">${note}</b><small>${Xl('csS'+(k-1))}</small></div></div>`;
}
// count the first number inside a sticker note up from 0 (re-runs with the sticker animation)
function noteCount(){
  document.querySelectorAll('.cs-stk b').forEach(b=>{
    const t=b.dataset.t||'',m=t.match(/\d+/);if(!m)return;const to=+m[0];
    const run=()=>{let t0=null;const f=ts=>{if(t0===null)t0=ts;const q=Math.min((ts-t0)/1200,1);b.textContent=t.replace(m[0],Math.round(to*(1-Math.pow(1-q,3))));if(q<1)requestAnimationFrame(f);};requestAnimationFrame(f);};
    run();const id=setInterval(()=>{if(!b.isConnected){clearInterval(id);return;}run();},6000);
  });
}
const WEL_REV=[[5,'Surprisingly insightful','The breakdown by area showed strengths I hadn’t expected. Worth the time.','Priya · India'],[5,'Short but challenging','It was short but challenging. Really enjoyed it.','E.B. · Greece'],[4,'Solid and well made','Clear questions and a good mix of puzzle types. Felt well put together.','Marta · Spain'],[5,'Stimulating variety','I found the variety stimulating and it kept my interest from lagging.','Cathy · New Zealand'],[5,'Clear and well paced','The questions built up nicely and the explanations afterwards taught me something new.','Gordon Stark · United Kingdom']];
const WEL_PRESS=[['business-insider','Business Insider'],['buzzfeed','BuzzFeed'],['cnn','CNN']];
const PLACEHOLDER_AVG_IQ=108; // TODO before launch: placeholder, replace with a real measured average or remove
function welcomeScreen(){
  st.hold=true;st.view=welcomeScreen;dock();$('tCount').textContent=Xl('beforeStart');pips();
  const star=on=>`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6L10 14.2 5 17l1.2-5.6L2 7.6l5.6-.6z" fill="${on?'var(--ink)':'none'}" stroke="var(--ink)" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  const logos=al=>WEL_PRESS.map(p=>`<li><img src="press/${p[0]}.svg?v=5" alt="${al?'':p[1]}" height="24" loading="lazy"></li>`).join('');
  // TODO placeholder trust badges (.wel-tb, mobile only): replace with verified claims
  const gF=(PLACEHOLDER_AVG_IQ-70)/90,gP=r=>[(150-r*Math.cos(gF*Math.PI)).toFixed(1),(140-r*Math.sin(gF*Math.PI)).toFixed(1)];
  const bcSvg=`<svg class="gg" viewBox="0 28 300 144" role="img" aria-label="IQ gauge from 70 to 160, needle near the average of ${PLACEHOLDER_AVG_IQ}" style="--f:${gF.toFixed(4)};--a:${(gF*180-90).toFixed(1)}deg"><path class="gt" d="M50 140A100 100 0 0 1 250 140"/><path class="gf" pathLength="1" d="M50 140A100 100 0 0 1 250 140"/><text class="gk" x="50" y="164" text-anchor="middle">70</text><text class="gk" x="250" y="164" text-anchor="middle">160</text><text class="gq" x="124" y="118" text-anchor="middle">IQ</text><g class="gn"><line x1="150" y1="140" x2="150" y2="58"/></g><circle class="gd" cx="150" cy="140" r="9"/></svg>`;
  $('tMain').innerHTML=`<div class="mo wel" role="status"><div class="wel-a"><ul class="wel-tb"><li class="tp"><img src="press/trustpilot.svg?v=4" alt="Trustpilot" width="66" height="15"><b>4.8</b><span class="tpn">151,263 reviews</span></li></ul><div class="bc-card">${bcSvg}</div>
   <div class="wel-s"><span>${Xl('wToday')}</span><b>${PLACEHOLDER_AVG_IQ}</b></div></div>
   <div class="wel-c"><h2>${Xl('wTitle')}</h2>
   <ul class="wel-l"><li>${Xl('wB1',ITEMS.length)}</li><li>${Xl('wB2')}</li></ul>
   <button class="btn btn-primary" id="welGo">${Xl('wGo')}</button></div>
   <div class="wel-f"><p class="label wel-fl">Neurometric has been featured on</p>
   <ul class="wel-mq">${logos(0)}</ul></div></div>`;
  $('welGo').onclick=()=>{wordScreen();window.scrollTo({top:0});};$('welGo').focus({preventScroll:true});
}
function wordScreen(){
  st.hold=true;st.view=wordScreen;dock();$('tCount').textContent=Xl('beforeStart');pips();
  $('tMain').innerHTML=`<div class="mo" role="status"><p class="label">${Xl('wordLabel')}</p><h2>${Xl('wordTitle')}</h2>
   <p>${Xl('wordAsk')}</p><div class="word">${st.word}</div>
   <p class="hold">${Xl('wordHold')}</p><button class="btn btn-primary" id="moGo">${Xl('wordGo')}</button></div>`;
  $('moGo').onclick=()=>{st.hold=false;render();window.scrollTo({top:0});};$('moGo').focus();
}
function recallScreen(){
  clearTimeout(autoTimer);st.hold=true;st.view=recallScreen;dock();$('tCount').textContent=Xl('bonus');
  const opts=[st.word,...WORDS.filter(w=>w!==st.word).sort(()=>Math.random()-.5).slice(0,4)].sort(()=>Math.random()-.5);
  $('tMain').innerHTML=`<div class="mo" role="status"><p class="label">${Xl('recallLabel')}</p><h2>${Xl('recallTitle')}</h2>
   <p>${Xl('recallSub')}</p><div class="opts text" role="radiogroup">${opts.map((w,j)=>`<button class="opt" role="radio" data-w="${w}"><span class="k">${j+1}</span><span>${w}</span></button>`).join('')}</div></div>`;
  $('tMain').querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{st.recall=b.dataset.w===st.word;guessScreen();});
  window.scrollTo({top:0});
}
/* optional self-report questions: never scored, shown beside the real result */
function guessScreen(){
  st.hold=true;st.view=null;dock();$('tCount').textContent=Xl('twoQ');
  const row=(k,q,opts)=>`<fieldset class="gq"><legend>${q}</legend><div class="opts text short" role="radiogroup">${opts.map((o,j)=>`<button type="button" class="opt" role="radio" aria-checked="false" data-k="${k}" data-v="${o}"><span>${({Yes:Xl('yes'),No:Xl('no'),'Not sure':Xl('notSure')})[o]}</span></button>`).join('')}</div></fieldset>`;
  $('tMain').innerHTML=`<div class="mo gs"><p class="label">${Xl('optLabel')}</p><h2>${Xl('gsTitle')}</h2>
   <p>${Xl('gsText')}</p>
   ${row('guess',Xl('gsAbove'),['Yes','No','Not sure'])}
   ${row('first',Xl('gsFirst'),['Yes','No'])}
   <button class="btn btn-primary" id="gsGo">${Xl('gsGo')}</button><button class="link-btn" id="gsSkip">${Xl('skip')}</button></div>`;
  st.self={};
  $('tMain').querySelectorAll('.gq .opt').forEach(b=>b.onclick=()=>{st.self[b.dataset.k]=b.dataset.v;b.parentNode.querySelectorAll('.opt').forEach(o=>{const on=o===b;o.classList.toggle('sel',on);o.setAttribute('aria-checked',on);});});
  $('gsGo').onclick=reviewScreen;$('gsSkip').onclick=()=>{st.self={};reviewScreen();};
  window.scrollTo({top:0});
}
function reviewScreen(){
  const n=st.ans.filter(a=>a!==null).length;
  st.view=null;$('tCount').textContent=Xl('reviewing');
  $('tMain').innerHTML=`<div class="mo" role="status"><p class="label">${Xl('scoring')}</p><h2>${Xl('checking',n)}</h2><p>${Xl('checkingText')}</p><div class="cp-bar" aria-hidden="true"><i id="rvBar"></i></div></div>`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const m=$('rvBar');if(m)m.style.transform='scaleX(1)';}));
  subTimer=setTimeout(()=>{st.hold=false;finish();},1400);
}
function checkpoint(n){
  clearTimeout(autoTimer);clearTimeout(subTimer);clearInterval(subTimer);st.hold=true;st.view=()=>checkpoint(n);dock();
  const k=CHECKPOINTS.indexOf(n),used=st.sec,left=ITEMS.length-n,budget=PER_ITEM,pace=used/n;
  let h,fig='',lead,meter=false,meterPct=null,cpNote='';
  if(k===0){
    const cn=geoName();
    h=cn?Xl('cpAhead',PLACEHOLDER_AHEAD_PCT,cn):Xl('cpAheadW',PLACEHOLDER_AHEAD_PCT);
    fig=`<span class="cp-n">${PLACEHOLDER_AHEAD_PCT}%</span><span class="cp-u">${Xl('cpAheadU')}</span>`;
    meter=`<div class="cp-bar" aria-hidden="true"><i id="moMeter"></i></div>`;
    lead=Xl('cpAheadLead');
  }else{
    // PLACEHOLDER ESTIMATES (TODO before launch): no real norm data exists yet. Values are derived from this person's
    // own answers/pace with a floor above 50, and are NOT measured percentiles. Replace with real distributions or remove.
    const ok=ITEMS.slice(0,n).filter(it=>isRight(it,st.ans[it.idx])).length,fr=ok/n;
    const z=((100+15*(fr-.5)/.2)-100)/15,cdf=x=>{const t=1/(1+.2316419*Math.abs(x)),dd=.3989423*Math.exp(-x*x/2),pp=dd*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>0?1-pp:pp;};
    const ahead=PLACEHOLDER_AHEAD_PCT,top=100-ahead; // placeholder: same random 87-95 figure everywhere (real calc: Math.round(cdf(z)*100))
    let note;
    if(k===1){
      const sp=PLACEHOLDER_AHEAD_PCT,cn=geoName(); // country: visitor's IP country via /api/geo
      h=cn?Xl('csH0',sp,cn):Xl('csH0W',sp);lead=Xl('csL0');note=sp+'%';
      fig=`<span class="cp-n">${sp}%</span><span class="cp-u">${Xl('csU0')}</span>`;meterPct=sp;
    }else if(k===2){
      h=Xl('csH1',top);lead=Xl('csL1');note=Xl('cpTop',top);
      fig=`<span class="cp-n">${Xl('cpTop',top)}</span><span class="cp-u">${Xl('csU1')}</span>`;meterPct=ahead;
    }else if(k===3){
      h=Xl('csH2',ahead);lead=Xl('csL2',left);note=ahead+'%';
      fig=`<span class="cp-n">${ahead}%</span><span class="cp-u">${Xl('csU2')}</span>`;meterPct=ahead;
    }else{
      h=Xl('csH3',ahead);lead=Xl('csL3');note=ahead+'%';
      fig=`<span class="cp-n">${ahead}%</span><span class="cp-u">${Xl('csU3')}</span>`;meterPct=ahead;
    }
    meter=`<div class="cp-bar" aria-hidden="true"><i id="moMeter"></i></div>`;cpNote=note;
  }
  $('tMain').innerHTML=`<div class="mo cp" role="status">${illHTML(k,cpNote)}<p class="label">${Xl('cpLabel',k+1,CHECKPOINTS.length)}</p><h2>${h}</h2>
      <button class="btn btn-primary" id="cpGo">${Xl('cont')}</button></div>`;
  if(k===0)meterPct=PLACEHOLDER_AHEAD_PCT;
  if(meterPct!=null)requestAnimationFrame(()=>requestAnimationFrame(()=>{const m=$('moMeter');if(m)m.style.transform=`scaleX(${meterPct/100})`;}));
  noteCount();
  $('cpGo').onclick=()=>{st.hold=false;go(n);};$('cpGo').focus();window.scrollTo({top:0});
}

/* memory */
function memoryHTML(it){
  const s=st.seen[st.i];
  if(!s)return `<div class="memo" id="memo"><div class="dtiles" aria-label="${it.digits.split('').join(' ')}">${it.digits.split('').map(d=>`<span>${d}</span>`).join('')}</div><span class="hint">${Xl('memHint')}</span></div>`;
  return `<div class="memo"><span class="hint">${U('shown')}</span></div><div class="field"><label for="memIn">${it.mode==='forward'?U('typeFwd'):U('typeRev')}</label><input id="memIn" inputmode="numeric" autocomplete="off" maxlength="12" value="${st.ans[st.i]||''}"></div>`;
}
function startMemory(it){
  if(st.seen[st.i])return;
  st.seen[st.i]='shown';render();setTimeout(()=>$('memIn')&&$('memIn').focus(),30);
}
function wireMemory(it){
  if(st.seen[st.i]==='run')st.seen[st.i]=null;
  const nb=$('memBtn');
  if(nb)nb.textContent=st.seen[st.i]?U('cont'):Xl('memNext');
  const inp=$('memIn');
  if(inp)inp.addEventListener('input',()=>{const v=inp.value.replace(/\D/g,'');inp.value=v;st.ans[st.i]=v||null;
    pips();});
}
/* scan */
function scanHTML(it){
  const s=st.seen[st.i];
  if(!s)return `<div class="memo"><div><span class="hint">${Xl('scanHint')}</span><button class="btn btn-line" id="scanGo">${Xl('scanGo')}</button></div></div>`;
  return `<div class="tbar" id="tbar"><span id="tleft">${s==='closed'?Xl('timeUp'):Xl('secs',20)}</span><div class="tb"><i id="tbi"></i></div></div>
    <div class="scan-grid${s==='closed'?' hide':''}" aria-label="${Xl('grid')}">${it.grid.map(g=>`<span>${g}</span>`).join('')}</div>${optText(iOpts(it))}`;
}
function wireScan(it){
  const g=$('scanGo');
  if(g){g.onclick=()=>{st.seen[st.i]='open';st.scanEnd=Date.now()+20000;render();};return;}
  if(st.seen[st.i]==='open'){
    const bi=$('tbi');const tick=()=>{const left=Math.ceil((st.scanEnd-Date.now())/1000);
      if(left<=0){clearInterval(subTimer);st.seen[st.i]='closed';render();return;}
      $('tleft').textContent=Xl('secs',left);bi.style.transform=`scaleX(${left/20})`;};
    bi.style.transform='scaleX(1)';tick();subTimer=setInterval(tick,250);
  }else{$('tbi').style.transform='scaleX(0)';}
}
document.addEventListener('keydown',e=>{
  if($('app').hidden||!st||st.done)return;if(e.target.tagName==='INPUT'){if(e.key==='Enter'&&e.target.value.trim()!=='')memAction();return;}
  if(e.key==='Enter'&&ITEMS[st.i].type==='memory'&&!st.hold&&e.target.tagName!=='BUTTON'){memAction();return;}
  if($('cpGo')||st.hold)return;
  const n=parseInt(e.key,10);const opts=$('tMain').querySelectorAll('.opt');
  if(n>=1&&n<=opts.length){pick(n-1);}
  else if(e.key==='ArrowRight'){if(st.ans[st.i]!==null)go(st.i+1);}else if(e.key==='ArrowLeft')go(st.i-1);
});

/* results */
function isRight(it,a){if(a===null||a===undefined)return false;return it.type==='memory'?a===it.answer:a===it.correct;}
function erf(x){const t=1/(1+.3275911*Math.abs(x));const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return x>=0?y:-y;}
function answerText(it,a){
  if(a===null||a===undefined)return Xl('noAnswer');
  if(it.type==='memory')return a;
  if(it.opts)return iOpts(it)[a];return Xl('option',a+1);
}
function correctText(it){
  if(it.type==='memory')return it.answer;
  if(it.opts)return iOpts(it)[it.correct];return Xl('option',it.correct+1);
}

/* MOCK paywall (proof of concept). No payment is collected; the button simply reveals the results. */
const PLANS={trial:['7-day trial','$0.99','Then $4.99 per week until you cancel'],month:['1 month','$9.99','Renews monthly at $9.99 until you cancel'],year:['12 months','$29.99','Renews yearly at $29.99 until you cancel']};
function finish(){
  if(st.done&&st.finished)return;st.done=true;st.view=null;dock();clearInterval(clockTimer);clearTimeout(subTimer);clearInterval(subTimer);clearTimeout(autoTimer);
  ($('finishBtn')||{}).hidden=true;pips(true);$('tCount').textContent='Almost done';
  const answered=ITEMS.filter(it=>st.ans[it.idx]!==null&&st.ans[it.idx]!==undefined).length;
  const peer=(src,nm,iq)=>`<div class="peer"><span class="pl">${iq}</span><div class="pc"><img src="${src}" alt="" loading="lazy"></div><span class="pn">${nm}</span></div>`;
  $('tMain').innerHTML=`<div class="gate" role="region" aria-label="Unlock your results">
   <span class="mockbar">Mock paywall, no payment is taken</span>
   <h2>Your results are ready</h2>
   <div class="g-grid">
    <div class="g-l"><div class="g-card">
     <div class="peers">${peer('figs/newton.webp','Isaac Newton','~190')}<div class="peer you"><span class="pl">You</span><div class="pc"><b>???</b><svg viewBox="0 0 100 110" aria-hidden="true"><circle cx="50" cy="34" r="19"/><path d="M8 110c0-30 14-46 42-46s42 16 42 46z"/></svg></div><span class="pn">Your score</span></div>${peer('figs/einstein.webp','Albert Einstein','~160')}</div>
     <p class="g-note">Famous-person scores are estimates. None of them sat a modern IQ test.</p>
     <div class="g-stats"><div><b>${answered}/${ITEMS.length}</b><span>Answered</span></div><div><b>${fmt(st.sec)}</b><span>Time used</span></div><div><b>6</b><span>Domains</span></div></div>
    </div></div>
    <div class="g-r">
     <p class="g-k">Your summary</p>
     <ul class="sum"><li><span>Your score and percentile</span><i>Included</i></li><li><span>Domain breakdown</span><i>Included</i></li><li><span>Every item explained</span><i>Included</i></li><li><span>Printable certificate</span><i>Included</i></li></ul>
     <fieldset class="plans"><legend class="sr">Choose a plan</legend>
      ${Object.entries(PLANS).map(([k,v],i)=>`<label class="plan"><input type="radio" name="plan" value="${k}"${i?'':' checked'}><span class="dot"></span><span class="t"><b>${v[0]}${k==='month'?'<span class="best">Best value</span>':''}</b><span>${v[2]}</span></span><span class="pr">${v[1]}</span></label>`).join('')}
     </fieldset>
     <div class="total"><span>Total due today</span><b id="gateTot">${PLANS.trial[1]}</b></div>
     <button class="btn btn-primary" id="gateGo">Show my results</button>
     <p class="fine" id="gateFine">${PLANS.trial[2]}. Cancel any time.</p>
    </div></div></div>`;
  document.querySelectorAll('#app input[name="plan"]').forEach(r=>r.addEventListener('change',()=>{const p=PLANS[r.value];$('gateTot').textContent=p[1];$('gateFine').textContent=p[2]+'. Cancel any time.';}));
  $('gateGo').onclick=()=>{st.done=false;showResults();};
  $('gateGo').focus();window.scrollTo(0,0);
}

/* BF_IQ: the one score rule. Share correct maps linearly to IQ, 50% -> 100, 15 points per 20%, clamped 62..145. */
window.BF_IQ=function(raw,n){return Math.round(Math.max(62,Math.min(145,100+15*(raw/n-.5)/.2)));};

function showResults(){
  if(st.done&&st.finished)return;st.done=true;st.finished=true;clearInterval(clockTimer);clearTimeout(subTimer);clearInterval(subTimer);
  ($('finishBtn')||{}).hidden=true;pips(true);
  const right=ITEMS.map(it=>isRight(it,st.ans[it.idx]));const raw=right.filter(Boolean).length;const pct=raw/ITEMS.length;
  const iq=BF_IQ(raw,ITEMS.length);
  const percentile=Math.round(50*(1+erf((iq-100)/15/Math.SQRT2))*10)/10;
  const cls=iq>=130?'Very high':iq>=115?'Above average':iq>=85?'Average':iq>=70?'Below average':'Low';
  const used=st.sec;
  const dom=DOMAINS.map(d=>{const its=ITEMS.filter(it=>it.d===d.id);const ok=its.filter(it=>right[it.idx]).length;return{...d,ok,n:its.length};});
  const ranked=dom.slice().sort((x,y)=>y.ok/y.n-x.ok/x.n);const best=ranked[0],worst=ranked[ranked.length-1];
  $('tCount').textContent='Results';
  $('tMain').innerHTML=`<div class="res">
   <section class="res-sec res-hero"><p class="label">Estimated score, practice scale</p><div class="res-num" id="resNum">${iq}</div><h2 class="cls">${cls}</h2>
    <div class="share" role="list" aria-label="Score by domain">${dom.map(d=>`<div class="sq c-${DCOL[d.id]}${d===best?' best':''}" role="listitem"><i style="transform:scaleY(${d.ok/d.n})"></i><span class="nm">${d.name}</span><b>${d.ok}/${d.n}</b></div>`).join('')}</div>
    <div class="stats" aria-label="Statistics"><div><b>${raw}</b><span>Correct</span></div><div><b>${Math.round(pct*100)}</b><span>Percent</span></div><div><b>${fmt(used)}</b><span>Time used</span></div><div><b>${Math.round(percentile)}</b><span>Percentile</span></div></div>
    <p class="res-txt"><span>You answered ${raw} of ${ITEMS.length} items correctly in ${fmt(used)}.</span>${st.recall===null?'':st.recall?' <span>You also remembered the opening word.</span>':' <span>The opening word slipped away, which happens to everyone.</span>'} <span>On a mean-100, σ-15 scale that sits near the ${percentile}${(window.BF_LOC&&BF_LOC()!=="en-GB")?"":(p=>{const m=p%100,n=p%10;return m>=11&&m<=13?"th":n===1?"st":n===2?"nd":n===3?"rd":"th"})(percentile)}${(window.BF_LOC&&BF_LOC()!=="en-GB")?"th":""} percentile.</span> <span>This test is not normed, so read the number as a rough guide.</span>${st.self&&st.self.guess?` <span>You guessed <span>${st.self.guess==='Yes'?'above average':st.self.guess==='No'?'not above average':'you were not sure'}</span>; your estimate is <span>${iq>=100?'at or above':'below'}</span> 100.</span>`:''}</p>
    <p class="dnote"><b>Strongest:</b> <span>${best.name}</span>. <b>Most room to grow:</b> <span>${best.ok/best.n===worst.ok/worst.n?"even across all six":worst.name}</span>.</p>
    <div class="res-acts"><button class="btn btn-primary" id="copyBtn">Copy result</button><button class="btn btn-line" id="againBtn">Take it again</button><button class="link-btn" id="homeBtn">Back to Neurometric</button></div></section>
   <section class="res-sec"><h3>Where your estimate falls</h3><p class="sub">The curve shows how scores spread on a mean-100 scale. About two in three people land in the middle band.</p><svg class="bell" id="bellRes" viewBox="0 0 640 250" role="img" aria-label="Your estimate on the normal curve"></svg></section>
   <section class="res-sec"><h3>How scores are distributed</h3><p class="sub">On a mean-100 scale, scores fall into these bands. The shares come from the normal curve, not from our own users.</p><table class="bands"><tbody><tr${iq<70?' class="me"':''}><th scope="row">Below 70</th><td>Well below average</td><td>About 2% of people</td></tr><tr${iq>=70&&iq<85?' class="me"':''}><th scope="row">70–84</th><td>Below average</td><td>About 14% of people</td></tr><tr${iq>=85&&iq<=115?' class="me"':''}><th scope="row">85–115</th><td>Average</td><td>About 68% of people</td></tr><tr${iq>115&&iq<130?' class="me"':''}><th scope="row">116–129</th><td>Above average</td><td>About 14% of people</td></tr><tr${iq>=130?' class="me"':''}><th scope="row">130 and above</th><td>Well above average</td><td>About 2% of people</td></tr></tbody></table></section>
   <section class="res-sec res-limits"><h3>What this score can and can’t tell you</h3><p class="sub">This is an estimate from a short online test, so it carries real measurement error: several points either way, and more at the extremes.</p><p class="sub">Tiredness, mood and practice can move your score. It is not a clinical assessment and cannot diagnose anything.</p><p class="sub">For a formal result, ask a qualified psychologist about a supervised test.</p></section>
   <section class="res-sec res-cert"><h3>Your certificate</h3><div class="cert-form"><div class="fld"><label for="certIn">Name on certificate</label><input id="certIn" type="text" maxlength="40" placeholder="Type your name" autocomplete="name"></div><button class="btn btn-primary" id="certPrint">Print or save as PDF</button></div>${certHTML({name:(window.BF_DOM?BF_DOM.t('Neurometric participant'):'Neurometric participant'),nameId:'certName',certId:newCertId(),score:iq,cls,date:new Date().toLocaleDateString((window.BF_LOC?BF_LOC():'en-GB'),{day:'numeric',month:'long',year:'numeric'}),items:ITEMS.length})}</section>
   <section class="res-sec res-review"><h3>Every item, explained</h3><div class="review-list">${ITEMS.map(it=>{const ok=right[it.idx];return `<div class="rv"><span class="n">${it.idx+1}</span><div><div class="q">${iQ(it)}</div><div class="x"><span>Your answer:</span> <span>${answerText(it,st.ans[it.idx])}</span>${ok?'':` · <span>Correct:</span> <span>${correctText(it)}</span>`}</div><div class="x why">${iWhy(it)}</div></div><span class="st ${ok?'ok':'no'}">${ok?'Correct':'Missed'}</span></div>`;}).join('')}</div></section></div>`;
  bell($('bellRes'),iq);
  clearTimeout(window._bellT);window.onresize=()=>{clearTimeout(window._bellT);window._bellT=setTimeout(()=>{const b=$('bellRes');if(b)bell(b,iq);},150);};
  $('certIn').oninput=e=>{$('certName').textContent=e.target.value.trim()||'Neurometric participant';};$('certPrint').onclick=()=>window.print();$('againBtn').onclick=startTest;$('homeBtn').onclick=leave;window.scrollTo(0,0);
  $('copyBtn').onclick=async()=>{const t=`I scored ${iq} on the Neurometric reasoning test (${raw}/${ITEMS.length} correct). Strongest domain: ${best.name}.`;
    try{await navigator.clipboard.writeText(t);$('copyBtn').textContent='Copied';}catch(e){$('copyBtn').textContent='Copy not available';}
    setTimeout(()=>{const c=$('copyBtn');if(c)c.textContent='Copy result';},2000);};
}
/* certificate: layout modelled on a framed gradient panel, logo top-left, QR top-right, centered score */
const CERT_URL='https://turkeygobbler420.github.io/brightfold/';
const QR_N=33,QR_D='M0 0h7v1h-7zM8 0h1v1h-1zM12 0h1v1h-1zM16 0h2v1h-2zM20 0h2v1h-2zM26 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h3v1h-3zM15 1h2v1h-2zM21 1h1v1h-1zM26 1h1v1h-1zM32 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM9 2h3v1h-3zM13 2h1v1h-1zM18 2h2v1h-2zM21 2h1v1h-1zM26 2h1v1h-1zM28 2h3v1h-3zM32 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM9 3h3v1h-3zM14 3h1v1h-1zM17 3h2v1h-2zM20 3h2v1h-2zM26 3h1v1h-1zM28 3h3v1h-3zM32 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM12 4h4v1h-4zM18 4h3v1h-3zM23 4h1v1h-1zM26 4h1v1h-1zM28 4h3v1h-3zM32 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM11 5h2v1h-2zM14 5h2v1h-2zM24 5h1v1h-1zM26 5h1v1h-1zM32 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h7v1h-7zM9 7h1v1h-1zM11 7h1v1h-1zM13 7h1v1h-1zM15 7h2v1h-2zM18 7h1v1h-1zM20 7h1v1h-1zM22 7h3v1h-3zM1 8h1v1h-1zM6 8h3v1h-3zM11 8h2v1h-2zM15 8h1v1h-1zM17 8h4v1h-4zM22 8h1v1h-1zM24 8h2v1h-2zM31 8h2v1h-2zM0 9h5v1h-5zM8 9h2v1h-2zM11 9h1v1h-1zM15 9h1v1h-1zM17 9h1v1h-1zM19 9h1v1h-1zM21 9h3v1h-3zM28 9h3v1h-3zM4 10h3v1h-3zM8 10h1v1h-1zM13 10h3v1h-3zM17 10h1v1h-1zM20 10h2v1h-2zM28 10h1v1h-1zM30 10h2v1h-2zM0 11h1v1h-1zM4 11h2v1h-2zM10 11h1v1h-1zM12 11h3v1h-3zM16 11h1v1h-1zM20 11h1v1h-1zM22 11h3v1h-3zM26 11h5v1h-5zM32 11h1v1h-1zM0 12h3v1h-3zM5 12h2v1h-2zM8 12h1v1h-1zM10 12h1v1h-1zM13 12h8v1h-8zM24 12h4v1h-4zM0 13h2v1h-2zM4 13h2v1h-2zM7 13h4v1h-4zM13 13h1v1h-1zM15 13h1v1h-1zM17 13h4v1h-4zM23 13h1v1h-1zM26 13h2v1h-2zM29 13h4v1h-4zM2 14h3v1h-3zM6 14h3v1h-3zM12 14h1v1h-1zM20 14h1v1h-1zM22 14h1v1h-1zM25 14h2v1h-2zM29 14h1v1h-1zM31 14h1v1h-1zM0 15h1v1h-1zM3 15h1v1h-1zM8 15h2v1h-2zM11 15h3v1h-3zM16 15h1v1h-1zM19 15h1v1h-1zM23 15h1v1h-1zM25 15h1v1h-1zM27 15h4v1h-4zM32 15h1v1h-1zM2 16h2v1h-2zM5 16h2v1h-2zM8 16h1v1h-1zM10 16h1v1h-1zM12 16h1v1h-1zM17 16h3v1h-3zM22 16h4v1h-4zM27 16h2v1h-2zM32 16h1v1h-1zM2 17h3v1h-3zM8 17h2v1h-2zM11 17h1v1h-1zM13 17h1v1h-1zM15 17h1v1h-1zM17 17h4v1h-4zM23 17h1v1h-1zM25 17h2v1h-2zM29 17h2v1h-2zM32 17h1v1h-1zM0 18h5v1h-5zM6 18h4v1h-4zM12 18h2v1h-2zM16 18h2v1h-2zM19 18h2v1h-2zM23 18h2v1h-2zM27 18h1v1h-1zM29 18h4v1h-4zM1 19h1v1h-1zM5 19h1v1h-1zM7 19h2v1h-2zM10 19h1v1h-1zM15 19h1v1h-1zM17 19h1v1h-1zM20 19h1v1h-1zM22 19h3v1h-3zM26 19h1v1h-1zM28 19h3v1h-3zM2 20h7v1h-7zM12 20h1v1h-1zM14 20h1v1h-1zM16 20h4v1h-4zM22 20h1v1h-1zM24 20h2v1h-2zM28 20h2v1h-2zM0 21h1v1h-1zM2 21h2v1h-2zM8 21h5v1h-5zM14 21h4v1h-4zM19 21h1v1h-1zM21 21h4v1h-4zM27 21h2v1h-2zM0 22h1v1h-1zM3 22h1v1h-1zM5 22h2v1h-2zM11 22h3v1h-3zM18 22h1v1h-1zM22 22h1v1h-1zM25 22h1v1h-1zM27 22h1v1h-1zM29 22h3v1h-3zM0 23h1v1h-1zM4 23h2v1h-2zM8 23h1v1h-1zM11 23h1v1h-1zM13 23h2v1h-2zM16 23h2v1h-2zM19 23h2v1h-2zM22 23h2v1h-2zM28 23h3v1h-3zM32 23h1v1h-1zM0 24h4v1h-4zM6 24h1v1h-1zM8 24h1v1h-1zM11 24h3v1h-3zM15 24h1v1h-1zM17 24h1v1h-1zM19 24h2v1h-2zM24 24h5v1h-5zM8 25h3v1h-3zM13 25h1v1h-1zM16 25h2v1h-2zM19 25h3v1h-3zM23 25h2v1h-2zM28 25h1v1h-1zM30 25h3v1h-3zM0 26h7v1h-7zM8 26h2v1h-2zM11 26h3v1h-3zM16 26h1v1h-1zM18 26h1v1h-1zM21 26h1v1h-1zM23 26h2v1h-2zM26 26h1v1h-1zM28 26h1v1h-1zM30 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM11 27h2v1h-2zM16 27h1v1h-1zM19 27h2v1h-2zM22 27h3v1h-3zM28 27h3v1h-3zM0 28h1v1h-1zM2 28h3v1h-3zM6 28h1v1h-1zM10 28h2v1h-2zM14 28h1v1h-1zM17 28h1v1h-1zM22 28h1v1h-1zM24 28h6v1h-6zM0 29h1v1h-1zM2 29h3v1h-3zM6 29h1v1h-1zM9 29h1v1h-1zM16 29h2v1h-2zM19 29h2v1h-2zM22 29h4v1h-4zM27 29h4v1h-4zM32 29h1v1h-1zM0 30h1v1h-1zM2 30h3v1h-3zM6 30h1v1h-1zM12 30h3v1h-3zM16 30h1v1h-1zM18 30h3v1h-3zM22 30h1v1h-1zM24 30h1v1h-1zM27 30h6v1h-6zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h4v1h-4zM13 31h3v1h-3zM17 31h2v1h-2zM20 31h1v1h-1zM26 31h5v1h-5zM0 32h7v1h-7zM9 32h2v1h-2zM13 32h2v1h-2zM18 32h1v1h-1zM22 32h4v1h-4zM27 32h1v1h-1zM31 32h1v1h-1z';
const LOGO_SVG='<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 5.2C14.5 3.4 11.4 3.2 9.4 5C7 5 5.2 7 5.4 9.4C3.4 10.4 2.6 13.2 3.8 15.3C2.8 17.6 3.6 20.4 5.8 21.5C6.6 24.2 9.6 25.2 11.6 24.4C12.6 25.6 14 26 14.4 26.2L14.2 29L17.8 29L17.6 26.2C18 26 19.4 25.6 20.4 24.4C22.4 25.2 25.4 24.2 26.2 21.5C28.4 20.4 29.2 17.6 28.2 15.3C29.4 13.2 28.6 10.4 26.6 9.4C26.8 7 25 5 22.6 5C20.6 3.2 17.5 3.4 16 5.2Z" fill="#f77fa3" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M11.2 8.4C9.6 9.6 9.6 11.6 11.2 12.6C12.4 13.4 12.4 14.8 11 15.6M7.4 15.8C8.8 16.4 9.6 17.6 9 19M12.4 19.4C11.2 20.6 11.6 22.2 13 22.8M20.8 8.4C22.4 9.6 22.4 11.6 20.8 12.6C19.6 13.4 19.6 14.8 21 15.6M24.6 15.8C23.2 16.4 22.4 17.6 23 19M19.6 19.4C20.8 20.6 20.4 22.2 19 22.8" fill="none" stroke="#b8325f" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 5.6V26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
function newCertId(){const d=()=>String(Math.floor(Math.random()*10000)).padStart(4,'0');return d()+' '+d();}
function certHTML(o){const e=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const id=o.certId||'4829 1375';
 return `<div class="cert-sheet" ${o.id?`id="${o.id}"`:''}><div class="c-top"><span class="c-brand">${LOGO_SVG}Neurometric</span><a class="c-qr" href="${CERT_URL}" aria-label="Scan or click to open the Neurometric site"><svg viewBox="-2 -2 ${QR_N+4} ${QR_N+4}" shape-rendering="crispEdges" aria-hidden="true"><rect x="-2" y="-2" width="${QR_N+4}" height="${QR_N+4}" fill="#fff"/><path d="${QR_D}" fill="#121212"/></svg></a></div><p class="c-kicker">Certificate of achievement</p><h3 class="c-title">General Intelligence Quotient</h3><p class="c-line">awarded to</p><div class="c-name" ${o.nameId?`id="${o.nameId}"`:''}>${e(o.name)}</div><p class="c-line">in recognition of successful completion of the Neurometric Test with the following score:</p><div class="c-scorebar"><div class="c-score">${o.score}</div></div><div class="c-cls">${o.cls}</div><div class="c-foot"><span>${o.date}</span><span>Certificate ID: ${id}</span></div></div>`;}

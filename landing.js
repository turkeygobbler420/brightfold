/* Landing visuals, built from the real renderers in data.js / engine.js. */

/* step 1: playable sample matrix */
(function(){
  const item=byId('m1'),mx=document.getElementById('heroMx'),opts=document.getElementById('heroOpts'),msg=document.getElementById('heroMsg');
  if(!item||!mx||!opts)return;
  renderMatrix(mx,item,false);
  const qc=mx.querySelector('[data-q]'),board=opts.parentNode;
  opts.innerHTML=item.choices.map((ch,i)=>`<button type="button" class="opt" data-i="${i}" aria-label="Option ${i+1}">${cellSVG(ch.c)}</button>`).join('');
  let tries=0;
  opts.addEventListener('click',e=>{
    const b=e.target.closest('.opt');if(!b||board.classList.contains('done'))return;
    const i=+b.dataset.i;
    if(i===item.correct){
      b.classList.add('ok');board.classList.add('done');
      qc.className='c q hit';qc.innerHTML=cellSVG(item.choices[i].c);
      msg.textContent=(tries?'Got it. ':'First try. ')+'The real test has 30 of these, mixed with other kinds.';
    }else{
      tries++;b.classList.add('no');b.disabled=true;
      msg.textContent='Not that one. Try another tile.';
    }
  });
})();

/* sample ability profile */
const PROFILE=[['Verbal',90,'blue'],['Fluid',82,'yellow'],['Memory',72,'orange'],['Speed',66,'pink'],['Quant',64,'green'],['Spatial',55,'purple']];
function barRow(n,v,c){return `<div class="bar"><span>${n}</span><div class="trk"><i style="width:${v}%;background:var(--${c==='pink'?'pink,#f0a8b8':c})"></i></div><em>${v}</em></div>`;}
(function(){
  const a=document.getElementById('snapBars');
  if(a)a.insertAdjacentHTML('beforeend',PROFILE.map(p=>barRow(...p)).join(''));
  const sb=document.getElementById('stepBell');
  if(sb){let d='';for(let x=0;x<=300;x+=5){const y=94-82*Math.exp(-Math.pow((x-150)/62,2)/2);d+=(x?'L':'M')+x+' '+y.toFixed(1);}
    const mx=206,my=94-82*Math.exp(-Math.pow((mx-150)/62,2)/2);
    sb.innerHTML='<path d="'+d+'L300 94L0 94Z" fill="rgba(18,18,18,.07)"/><path d="'+d+'" fill="none" stroke="#121212" stroke-width="2"/><line x1="'+mx+'" y1="'+my.toFixed(1)+'" x2="'+mx+'" y2="94" stroke="#121212" stroke-width="2"/><circle cx="'+mx+'" cy="'+my.toFixed(1)+'" r="6" fill="#f9df6d" stroke="#121212" stroke-width="2"/>';}
  const hb=document.getElementById('heroBell');
  if(hb){let d='';for(let x=0;x<=300;x+=5){const y=94-82*Math.exp(-Math.pow((x-150)/62,2)/2);d+=(x?'L':'M')+x+' '+y.toFixed(1);}
    const mx=206,my=94-82*Math.exp(-Math.pow((mx-150)/62,2)/2);
    hb.innerHTML='<path d="'+d+'L300 94L0 94Z" fill="rgba(249,223,109,.35)"/><path d="'+d+'" fill="none" stroke="#121212" stroke-width="2"/><line x1="0" y1="94" x2="300" y2="94" stroke="rgba(18,18,18,.15)"/><line x1="'+mx+'" y1="'+my.toFixed(1)+'" x2="'+mx+'" y2="94" stroke="#121212" stroke-width="2"/><circle cx="'+mx+'" cy="'+my.toFixed(1)+'" r="6" fill="#f9df6d" stroke="#121212" stroke-width="2"/>';}
  const hp=document.getElementById('heroProf');
  if(hp)hp.innerHTML=[['Fluid reasoning',44,'yellow'],['Visual processing',62,'purple'],['Working memory',87,'blue']].map(p=>`<div class="pr"><span>${p[0]}</span><div class="trk"><i style="width:${p[1]}%;background:var(--${p[2]})"></i></div><em>${p[1]}</em></div>`).join('');
  const b=document.getElementById('stepBars');
  if(b)b.innerHTML=[['Fluid',44,'yellow'],['Visual',62,'purple'],['Memory',87,'blue']].map(p=>barRow(...p)).join('');
})();

/* domain specimens + rings */
(function(){
  const f=document.getElementById('sFluid');if(f)renderMatrix(f,byId('m4'),false);
  const q=document.getElementById('sQuant');
  if(q)q.innerHTML=[2,5,10,17,'?'].map((n,i,a)=>`<span${i===a.length-1?' class="a"':''}>${n}</span>`).join('');
  const s=document.getElementById('sSpatial');
  if(s)s.innerHTML=polySVG(F_PENT,4)+polySVG(rotN(F_PENT,1),4);
  const sp=document.getElementById('sSpeed');
  if(sp){const r=rng(4),pool=['◆','◇','●','○','▲','△'];let h='';
    for(let k=0;k<18;k++){const g=pool[Math.floor(r()*6)];h+=g==='◆'?`<b>${g}</b>`:`<span>${g}</span>`;}
    sp.innerHTML=h;}
  const e=document.getElementById('endTiles');
  if(e)e.innerHTML=['yellow','green','blue','purple','orange'].map(c=>`<i style="background:var(--${c})"></i>`).join('')+'<i style="background:#f0a8b8"></i>';
  document.querySelectorAll('#domTiles .tile').forEach(t=>{
    const v=+t.dataset.v,slot=t.querySelector('.ring-slot');if(!slot)return;
    const R=26,C=2*Math.PI*R,arc=C*.75,fill=arc*v/100;
    slot.innerHTML=`<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(135 32 32)" fill="none" stroke-width="7" stroke-linecap="round"><circle class="rb" cx="32" cy="32" r="${R}" stroke-dasharray="${arc} ${C}"/><circle class="rf" cx="32" cy="32" r="${R}" stroke-dasharray="${fill} ${C}"/></g></svg><span class="ring-n">${v}</span>`;
    const lab=t.querySelector('.label');
    if(lab)lab.insertAdjacentHTML('afterend',`<span class="tag">${t.dataset.tag}</span>`);
  });
})();

/* scoring curve, with sample marker */
(function(){
  const svg=document.getElementById('bellLanding');if(!svg)return;
  try{bell(svg,120);}catch(e){bell(svg);}
})();

/* group of 100 */
(function(){
  const r=document.getElementById('room');if(!r)return;
  const P=window.BF_PCT||{ahead:91,top:9,country:90,countryTop:10};
  let h='';for(let i=0;i<100;i++){h+=`<i class="${i===P.ahead-1?'me':i<P.ahead?'':'up'}"></i>`;}
  r.innerHTML=h;
  r.setAttribute('aria-label',`A group of 100 people: ${P.ahead} outscored, one marked as the test taker, ${100-P.ahead-1} ahead`);
})();

/* famous minds: full-body cutouts */
(function(){
  const root=document.getElementById('figs');if(!root)return;
  const me=+root.dataset.iq||120;
  const FIGS=[
    ['Isaac Newton','newton','1643–1727','',190],
    ['Albert Einstein','einstein','1879–1955','',160],
    ['Marie Curie','curie','1867–1934','',180],
    ['Plato','plato','c. 428–348 BC','',170],
    ['Aristotle','aristotle','384–322 BC','',165]
  ];
  const list=document.getElementById('figList'),meta=document.getElementById('figMeta'),stage=document.getElementById('pStage'),nm=document.getElementById('pName');
  list.innerHTML=FIGS.map((f,i)=>`<button type="button" data-i="${i}" aria-pressed="false"><span class="fb" aria-hidden="true"><img src="figs/${f[1]}.webp" alt="" width="24" height="24" loading="lazy"></span>${f[0]}</button>`).join('');
  stage.innerHTML=FIGS.map(f=>`<img class="cut" src="figs/${f[1]}.webp" alt="" decoding="async">`).join('')+'<span class="p-fade"></span>';
  const cuts=stage.querySelectorAll('.cut');let cur=-1,timer=null;
  function show(i,user){
    const f=FIGS[i],d=f[4]-me;cur=i;
    cuts.forEach((c,k)=>c.classList.toggle('on',k===i));
    list.querySelectorAll('button').forEach((b,k)=>b.setAttribute('aria-pressed',k===i?'true':'false'));
    nm.textContent=f[0]+' · '+f[2];
    meta.innerHTML=`<div class="fm-row"><div class="stile"><span>Estimated score</span><b>~${f[4]}</b></div><div class="stile"><span>Your score</span><b>${me}</b></div></div><p class="fm-diff">${Math.abs(d)} points ${d>=0?'above':'below'} your ${me}</p>`;
    if(user&&timer){clearInterval(timer);timer=null;}
  }
  list.addEventListener('click',e=>{const b=e.target.closest('button');if(b)show(+b.dataset.i,true);});
  show(0);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show((cur+1)%FIGS.length),4200);
})();

/* certificate sample: click to pop out (native modal dialog) */
(function(){
  const h=document.getElementById('certSample');if(!h)return;
  const data={name:'Alex Morgan',score:120,cls:'Above average',date:'November 12, 2026',id:'4829 1375',items:40};
  h.innerHTML=certHTML(data)+'';
  const dlg=document.createElement('dialog');dlg.className='cert-dlg';dlg.setAttribute('aria-label','Certificate');
  dlg.innerHTML='<button type="button" class="cert-x" aria-label="Close certificate"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><div class="cert-dlg-body">'+certHTML(data)+'</div>';
  document.body.appendChild(dlg);
  let opener=null;
  const open=()=>{opener=document.activeElement;if(!dlg.open)dlg.showModal();document.documentElement.classList.add('cert-lock');};
  const close=()=>{dlg.classList.add('out');setTimeout(()=>{dlg.classList.remove('out');dlg.close();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:160);};
  h.addEventListener('click',e=>{if(e.target.closest('a'))return;open();});
  dlg.addEventListener('click',e=>{if(e.target===dlg||e.target.closest('.cert-x'))close();});
  dlg.addEventListener('cancel',e=>{e.preventDefault();close();});
  dlg.addEventListener('close',()=>{document.documentElement.classList.remove('cert-lock');if(opener&&opener.focus)opener.focus();});
})();

/* review stars */
(function(){
  const star=on=>`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6L10 14.2 5 17l1.2-5.6L2 7.6l5.6-.6z" fill="${on?'var(--ink)':'none'}" stroke="var(--ink)" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  document.querySelectorAll('#landing .stars').forEach(el=>{const n=+el.dataset.n||5;el.innerHTML=[0,1,2,3,4].map(i=>star(i<n)).join('');});
})();

/* stats: count up when scrolled into view */
(function(){
  const els=document.querySelectorAll('#landing .stat-row .big');if(!els.length)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run=el=>{
    const m=el.textContent.trim().match(/^(\d+)(.*)$/);if(!m)return;
    const end=+m[1],suf=m[2],t0=performance.now(),dur=800;
    el.style.minWidth=el.offsetWidth+'px';
    const step=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
      el.textContent=Math.round(end*e)+(p<1?'':suf);
      if(p<1)requestAnimationFrame(step);else el.textContent=end+suf;};
    el.textContent='0'+suf;requestAnimationFrame(step);
  };
  if(reduce||!('IntersectionObserver' in window))return;
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);run(e.target);}}),{threshold:.6});
  els.forEach(el=>io.observe(el));
})();

/* mobile section menu toggle */
(function(){
  var b=document.querySelector('.nav-burger'),n=document.getElementById('navLinks');if(!b||!n)return;
  function set(o,back){n.classList.toggle('open',o);b.setAttribute('aria-expanded',o?'true':'false');if(!o&&back)b.focus();}
  b.addEventListener('click',function(){set(!n.classList.contains('open'));});
  n.addEventListener('click',function(e){if(e.target.closest('a,button'))set(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&n.classList.contains('open'))set(false,true);});
  document.addEventListener('click',function(e){if(n.classList.contains('open')&&!e.target.closest('.nav-links,.nav-burger'))set(false);});
  window.addEventListener('resize',function(){if(innerWidth>900)set(false);});
})();
(function(){
  var bar=document.getElementById('stickyCta'),hero=document.querySelector('.hero-btns .js-start');
  if(!bar||!hero||!('IntersectionObserver' in window))return;
  function set(on){bar.classList.toggle('show',on);bar.setAttribute('aria-hidden',on?'false':'true');var b=bar.firstElementChild;if(b)b.tabIndex=on?0:-1;}
  new IntersectionObserver(function(es){var e=es[0];set(!e.isIntersecting&&e.boundingClientRect.top<0);}).observe(hero);
})();

;(function(){
  var r=document.getElementById('revs'),p=document.getElementById('revPrev'),n=document.getElementById('revNext');
  if(!r||!p||!n)return;
  function step(d){var a=r.querySelector('article');if(!a)return;var w=a.getBoundingClientRect().width+12;
    if(d>0&&r.scrollLeft+r.clientWidth>=r.scrollWidth-4)r.scrollTo({left:0});
    else if(d<0&&r.scrollLeft<=4)r.scrollTo({left:r.scrollWidth});
    else r.scrollBy({left:d*w});}
  p.onclick=function(){step(-1)};n.onclick=function(){step(1)};
  var t=null,still=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  function go(){if(still||t)return;t=setInterval(function(){step(1)},5000)}
  function stop(){clearInterval(t);t=null}
  ['mouseenter','focusin','touchstart'].forEach(function(e){r.parentNode.addEventListener(e,stop,{passive:true})});
  r.parentNode.addEventListener('mouseleave',go);
  go();
})();

/* placeholder percentile figures (see pct.js): every "better than X%" spot on the landing page shares one value */
(function(){
  const P=window.BF_PCT;if(!P)return;
  document.querySelectorAll('[data-pct]').forEach(e=>{
    const k=e.dataset.pct;
    e.textContent=k==='ahead'?P.ahead+'%':k==='top'?'Top '+P.top+'%':k==='ctop'?'Top '+P.countryTop+'%':'You scored higher than '+P.ahead+'% of Neurometric test takers.';
  });
  document.querySelectorAll('[data-pct-ring]').forEach(c=>{const C=2*Math.PI*20;c.setAttribute('stroke-dasharray',(P.ahead/100*C).toFixed(1)+' '+C.toFixed(1));});
})();

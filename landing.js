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
      msg.textContent=(tries?'Got it. ':'First try. ')+'The real test has 20 of these, mixed with other kinds.';
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
  let h='';for(let i=0;i<100;i++){h+=`<i class="${i===90?'me':i<91?'':'up'}"></i>`;}
  r.innerHTML=h;
})();

/* famous minds: full-body cutouts */
(function(){
  const root=document.getElementById('figs');if(!root)return;
  const me=+root.dataset.iq||120;
  const FIGS=[
    ['Abraham Lincoln','newton','1809–1865','',123],
    ['Napoleon Bonaparte','einstein','1769–1821','',118],
    ['George Washington','curie','1732–1799','',113]
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
  show(1);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show((cur+1)%FIGS.length),4200);
})();

/* certificate sample: click to pop out (native modal dialog) */
(function(){
  const h=document.getElementById('certSample');if(!h)return;
  const data={name:'Alex Morgan',score:120,cls:'Above average',date:'November 12, 2026',id:'4829 1375',items:20};
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

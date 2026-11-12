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
  if(hp)hp.innerHTML=[['Fluid reasoning',82,'yellow'],['Visual processing',55,'purple'],['Working memory',72,'blue']].map(p=>`<div class="pr"><span>${p[0]}</span><div class="trk"><i style="width:${p[1]}%;background:var(--${p[2]})"></i></div><em>${p[1]}</em></div>`).join('');
  const b=document.getElementById('stepBars');
  if(b)b.innerHTML=[['Verbal',76,'blue'],['Quant',64,'yellow'],['Spatial',79,'purple']].map(p=>barRow(...p)).join('');
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
  try{bell(svg,114);}catch(e){bell(svg);}
})();

/* group of 100 */
(function(){
  const r=document.getElementById('room');if(!r)return;
  let h='';for(let i=0;i<100;i++){h+=`<i class="${i===81?'me':i<82?'':'up'}"></i>`;}
  r.innerHTML=h;
})();

/* famous minds */
(function(){
  const root=document.getElementById('figs');if(!root)return;
  const me=+root.dataset.iq||114;
  const FIGS=[
    ['Thomas Jefferson',150,'1743–1826','Third US president and principal author of the Declaration of Independence.'],
    ['Mozart',150,'1756–1791','Composer who wrote hundreds of works from childhood.'],
    ['Darwin',160,'1809–1882','Naturalist who set out the theory of evolution by natural selection.'],
    ['Einstein',160,'1879–1955','Physicist who developed the theory of relativity.'],
    ['Marie Curie',180,'1867–1934','Physicist and chemist, pioneer of research on radioactivity.'],
    ['Newton',190,'1643–1727','Mathematician and physicist behind classical mechanics and calculus.'],
    ['Goethe',210,'1749–1832','Poet, playwright and scientist of the German Enlightenment.']
  ];
  /* illustrated SVG portraits: flat, original drawings with period-style hair and facial hair */
  const FACE={
    'Thomas Jefferson':{bg:'#b0c4ef',skin:'#f1c9a5',hair:'<path d="M18 40c-2-16 8-24 22-24s24 8 22 24c-3-8-8-12-22-12s-19 4-22 12z" fill="#c4572d"/><rect x="56" y="38" width="7" height="22" rx="3" fill="#c4572d"/>',coat:'#3a4a7a',extra:'<path d="M32 76l8 8 8-8" fill="#fff"/>'},
    'Mozart':{bg:'#ba81c5',skin:'#f4d2b4',hair:'<path d="M14 46c-4-22 10-32 26-32s30 10 26 32c-2 6-6 8-8 4 0-12-6-18-18-18s-18 6-18 18c-2 4-6 2-8-4z" fill="#f3f0ea"/><circle cx="14" cy="50" r="6" fill="#f3f0ea"/><circle cx="66" cy="50" r="6" fill="#f3f0ea"/><circle cx="16" cy="58" r="5" fill="#f3f0ea"/><circle cx="64" cy="58" r="5" fill="#f3f0ea"/>',coat:'#a33b4b',extra:'<path d="M32 76l8 10 8-10" fill="#fff"/>'},
    'Darwin':{bg:'#a0c35a',skin:'#efc6a0',hair:'<path d="M20 38c0-14 8-22 20-22s20 8 20 22c-4-6-10-8-20-8s-16 2-20 8z" fill="#e9e6df"/>',coat:'#3b3b3b',extra:'<path d="M22 50c-2 18 6 30 18 30s20-12 18-30c-4 10-10 12-18 12s-14-2-18-12z" fill="#e9e6df"/><path d="M26 28l28 0" stroke="#b9886b" stroke-width="3" stroke-linecap="round"/>'},
    'Einstein':{bg:'#f9df6d',skin:'#f0c8a4',hair:'<path d="M14 44c-6-10-2-20 6-22 2-8 14-10 20-6 6-4 18-2 20 6 8 2 12 12 6 22-2-10-8-14-14-14H28c-6 0-12 4-14 14z" fill="#f3f1ec"/>',coat:'#6b6f7a',extra:'<path d="M28 56c4 6 20 6 24 0-2 8-6 10-12 10s-10-2-12-10z" fill="#e5e2da"/>'},
    'Marie Curie':{bg:'#f5a25d',skin:'#f3d0b2',hair:'<path d="M18 42c-2-18 8-26 22-26s24 8 22 26c-4-8-10-14-22-14s-18 6-22 14z" fill="#8a7a6a"/><circle cx="40" cy="14" r="8" fill="#8a7a6a"/>',coat:'#262626',extra:'<path d="M30 78h20l-4 8H34z" fill="#fff"/>'},
    'Newton':{bg:'#efefe6',skin:'#f1c9a5',hair:'<path d="M10 70C6 36 16 14 40 14s34 22 30 56c-4-2-6-8-6-14 0-14-4-24-24-24s-24 10-24 24c0 6-2 12-6 14z" fill="#9c8468"/><circle cx="12" cy="66" r="6" fill="#9c8468"/><circle cx="68" cy="66" r="6" fill="#9c8468"/>',coat:'#6e3a2c',extra:'<path d="M32 76l8 8 8-8" fill="#fff"/>'},
    'Goethe':{bg:'#d4483b',skin:'#f1c9a5',hair:'<path d="M16 44c-4-20 8-30 24-30s28 10 24 30c-2-8-8-14-24-14s-22 6-24 14z" fill="#6b4a3a"/>',coat:'#26402e',extra:'<path d="M32 76l8 8 8-8" fill="#fff"/><path d="M30 80l10 6 10-6" fill="none" stroke="#e8e0cf" stroke-width="3"/>'}
  };
  function face(name,size){
    const f=FACE[name]||FACE['Thomas Jefferson'];
    return `<svg viewBox="0 0 80 80" width="${size}" height="${size}" role="img" aria-label="Illustrated portrait of ${name}"><rect width="80" height="80" fill="${f.bg}"/><path d="M6 80c2-14 14-20 34-20s32 6 34 20z" fill="${f.coat}"/><rect x="35" y="52" width="10" height="12" fill="${f.skin}"/><ellipse cx="40" cy="40" rx="16" ry="19" fill="${f.skin}"/>${f.hair}<circle cx="34" cy="40" r="1.8" fill="#222"/><circle cx="46" cy="40" r="1.8" fill="#222"/><path d="M35 50q5 3 10 0" stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
  }
  const list=document.getElementById('figList'),card=document.getElementById('figCard');
  list.innerHTML=FIGS.map((f,i)=>`<button type="button" data-i="${i}" aria-pressed="false"><span class="fb" aria-hidden="true">${face(f[0],24)}</span>${f[0]}</button>`).join('');
  function show(i){
    const f=FIGS[i],d=f[1]-me;
    list.querySelectorAll('button').forEach((b,k)=>b.setAttribute('aria-pressed',k===i?'true':'false'));
        card.innerHTML=`<div class="fc"><div class="fc-top"><div class="fc-ini">${face(f[0],72)}</div><div><h3>${f[0]}</h3><div class="fc-yrs">${f[2]}</div></div></div>
      <p class="fc-role">${f[3]}</p>
      <div class="fc-row"><div class="stile"><span>Estimated IQ</span><b>~${f[1]}</b></div><div class="stile"><span>Sample taker</span><b>${me}</b></div></div>
      <p class="fc-diff">${Math.abs(d)} points ${d>=0?'above':'below'} your ${me}</p></div>`;
  }
  list.addEventListener('click',e=>{const b=e.target.closest('button');if(b)show(+b.dataset.i);});
  let best=0;FIGS.forEach((f,i)=>{if(Math.abs(f[1]-me)<Math.abs(FIGS[best][1]-me))best=i;});
  show(best);
  /* start card: cycling portrait cutouts */
  const stage=document.getElementById('cutStage'),nm=document.getElementById('cutName');
  if(stage){
    const CUT=['Einstein','Newton','Darwin','Marie Curie','Mozart'];
    stage.innerHTML=CUT.map((n,i)=>{const f=FACE[n];
      return `<div class="cut${i?'':' on'}" style="--c:${f.bg}"><svg viewBox="4 4 72 76" preserveAspectRatio="xMidYMax meet"><path d="M6 80c2-14 14-20 34-20s32 6 34 20z" fill="${f.coat}"/><rect x="35" y="52" width="10" height="12" fill="${f.skin}"/><ellipse cx="40" cy="40" rx="16" ry="19" fill="${f.skin}"/>${f.hair}<circle cx="34" cy="40" r="1.8" fill="#222"/><circle cx="46" cy="40" r="1.8" fill="#222"/><path d="M35 50q5 3 10 0" stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg></div>`;}).join('')+'<span class="cut-fade"></span>';
    const cuts=stage.querySelectorAll('.cut');let ci=0;
    const label=i=>{const f=FIGS.find(x=>x[0]===CUT[i]);nm.textContent=CUT[i]+(f?' · est. ~'+f[1]:'');stage.style.setProperty('--glow',FACE[CUT[i]].bg);};
    label(0);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{cuts[ci].classList.remove('on');ci=(ci+1)%cuts.length;cuts[ci].classList.add('on');label(ci);},3200);
  }
})();

/* certificate sample + QR-like code */
(function(){
  const h=document.getElementById('certSample');
  if(h)h.innerHTML=certHTML({sample:1,name:'Your name here',score:112,cls:'Above average',date:'Date of test',items:20});
  const q=document.getElementById('qrSvg');if(!q)return;
  const r=rng(11),N=21;let s='';
  const fin=(x,y)=>`<rect x="${x}" y="${y}" width="7" height="7" fill="currentColor"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3" fill="currentColor"/>`;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const inF=(x<8&&y<8)||(x>12&&y<8)||(x<8&&y>12);
    if(!inF&&r()>.5)s+=`<rect x="${x}" y="${y}" width="1" height="1" fill="currentColor"/>`;
  }
  q.innerHTML=s+fin(0,0)+fin(14,0)+fin(0,14);
})();

/* review stars */
(function(){
  const star=on=>`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6L10 14.2 5 17l1.2-5.6L2 7.6l5.6-.6z" fill="${on?'var(--ink)':'none'}" stroke="var(--ink)" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  document.querySelectorAll('#landing .stars').forEach(el=>{const n=+el.dataset.n||5;el.innerHTML=[0,1,2,3,4].map(i=>star(i<n)).join('');});
})();

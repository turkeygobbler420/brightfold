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
    ['Thomas Jefferson',150,'1743–1826','Third US president and principal author of the Declaration of Independence.','Cox 1926'],
    ['Mozart',150,'1756–1791','Composer who wrote hundreds of works from childhood.','Cox 1926'],
    ['Darwin',160,'1809–1882','Naturalist who set out the theory of evolution by natural selection.','Popular estimate'],
    ['Einstein',160,'1879–1955','Physicist who developed the theory of relativity.','Popular estimate'],
    ['Marie Curie',180,'1867–1934','Physicist and chemist, pioneer of research on radioactivity.','Popular estimate'],
    ['Newton',190,'1643–1727','Mathematician and physicist behind classical mechanics and calculus.','Cox 1926'],
    ['Goethe',210,'1749–1832','Poet, playwright and scientist of the German Enlightenment.','Cox 1926']
  ];
  const list=document.getElementById('figList'),card=document.getElementById('figCard');
  list.innerHTML=FIGS.map((f,i)=>`<button type="button" data-i="${i}" aria-pressed="false">${f[0]}</button>`).join('');
  function show(i){
    const f=FIGS[i],d=f[1]-me;
    list.querySelectorAll('button').forEach((b,k)=>b.setAttribute('aria-pressed',k===i?'true':'false'));
    const ini=f[0].split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    card.innerHTML=`<div class="fc"><div class="fc-top"><div class="fc-ini" aria-hidden="true">${ini}</div><div><h3>${f[0]}</h3><div class="fc-yrs">${f[2]}</div></div></div>
      <p class="fc-role">${f[3]}</p>
      <div class="fc-row"><div class="stile"><span>Estimated IQ</span><b>~${f[1]}</b></div><div class="stile"><span>Sample taker</span><b>${me}</b></div></div>
      <p class="fc-diff">${Math.abs(d)} points ${d>=0?'above':'below'} your ${me}</p>
      <p class="fc-src">Source: ${f[4]}. Placeholder estimate.</p></div>`;
  }
  list.addEventListener('click',e=>{const b=e.target.closest('button');if(b)show(+b.dataset.i);});
  let best=0;FIGS.forEach((f,i)=>{if(Math.abs(f[1]-me)<Math.abs(FIGS[best][1]-me))best=i;});
  show(best);
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

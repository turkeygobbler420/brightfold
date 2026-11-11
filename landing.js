/* Landing page visuals. Everything here is built from the real puzzle renderers in data.js / engine.js. */

/* ---------- hero: the live matrix ---------- */
(function(){
  const item=byId('m1'),mx=document.getElementById('heroMx'),opts=document.getElementById('heroOpts'),btn=document.getElementById('motionBtn');
  if(!item||!mx||!opts)return;
  renderMatrix(mx,item,false);
  opts.innerHTML=item.choices.map(ch=>`<div>${cellSVG(ch.c)}</div>`).join('');
  const tiles=[...opts.children],qc=mx.querySelector('[data-q]');
  const wrong=item.choices.map((_,i)=>i).filter(i=>i!==item.correct).slice(0,2);
  /* one loop of 3.2s: wrong, wrong, correct, empty */
  const frames=[wrong[0],wrong[1],item.correct,null];
  function show(k){
    tiles.forEach(t=>t.className='');
    if(k==null){qc.className='c q';qc.textContent='?';return;}
    const ok=k===item.correct;
    tiles[k].className=ok?'ok':'on';
    qc.className='c q'+(ok?' hit':'');qc.innerHTML=cellSVG(item.choices[k].c);
  }
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off';
  let step=0,timer=null;
  function play(){clearInterval(timer);show(frames[step]);timer=setInterval(()=>{step=(step+1)%frames.length;show(frames[step]);},800);}
  function pause(){clearInterval(timer);timer=null;show(item.correct);step=2;}
  if(calm){show(item.correct);btn.hidden=true;return;}
  play();
  btn.addEventListener('click',()=>{
    const paused=!timer;
    if(paused){play();btn.textContent='Pause';}else{pause();btn.textContent='Play';}
    btn.setAttribute('aria-pressed',String(!paused));
  });
})();

/* ---------- domain specimens ---------- */
(function(){
  const f=document.getElementById('sFluid');if(f)renderMatrix(f,byId('m4'),false);
  const q=document.getElementById('sQuant');
  if(q)q.innerHTML=[2,5,10,17,26,'?'].map((n,i)=>`<span${i===5?' class="a"':''}>${n}</span>`).join('');
  const s=document.getElementById('sSpatial');
  if(s)s.innerHTML=polySVG(F_PENT,4)+polySVG(rotN(F_PENT,1),4);
  const sp=document.getElementById('sSpeed');
  if(sp){const r=rng(4),pool=['◆','◇','●','○','▲','△'];let h='';
    for(let k=0;k<18;k++){const g=pool[Math.floor(r()*6)];h+=g==='◆'?`<b>${g}</b>`:`<span>${g}</span>`;}
    sp.innerHTML=h;}
})();

/* ---------- scoring curve ---------- */
bell(document.getElementById('bellLanding'));

/* ---------- radar blueprint ---------- */
(function(){
  const svg=document.getElementById('radar');if(!svg)return;
  const L=['Fluid','Quantitative','Verbal','Spatial','Memory','Speed'],V=[.82,.62,.9,.55,.72,.66],cx=200,cy=182,R=112;
  const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/6;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
  let h='';
  [.33,.66,1].forEach(k=>h+=`<polygon class="ring" points="${L.map((_,i)=>pt(i,R*k).join(',')).join(' ')}"/>`);
  L.forEach((l,i)=>{const[x,y]=pt(i,R),[tx,ty]=pt(i,R+22);
    h+=`<line class="ax" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/><text x="${tx}" y="${ty+5}" text-anchor="${Math.abs(tx-cx)<8?'middle':tx>cx?'start':'end'}">${l}</text>`;});
  h+=`<polygon class="shape" points="${V.map((v,i)=>pt(i,R*v).join(',')).join(' ')}"/>`;
  h+=V.map((v,i)=>{const[x,y]=pt(i,R*v);return `<circle class="dot" cx="${x}" cy="${y}" r="4"/>`;}).join('');
  svg.innerHTML=h;
})();

/* ---------- certificate sample ---------- */
(function(){
  const h=document.getElementById('certSample');if(!h)return;
  h.innerHTML=certHTML({sample:1,name:'Your name here',score:112,cls:'Above average',date:'Date of test',items:20});
})();

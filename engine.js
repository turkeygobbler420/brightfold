/* App shell is injected here so index.html only holds the landing page. */
(function(){const h="<div id=\"app\" hidden>\n  <div class=\"t-top\">\n    <div class=\"wrap\">\n      <a class=\"logo\" href=\"#top\" id=\"exitLink\" aria-label=\"Leave test\">\n        <svg viewBox=\"0 0 22 22\" aria-hidden=\"true\"><path d=\"M3 4.5A1.5 1.5 0 0 1 4.5 3H14l5 5v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17.5z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/><path d=\"M14 3v5h5z\" fill=\"var(--accent)\"/><circle cx=\"9\" cy=\"13\" r=\"2.2\" fill=\"currentColor\"/></svg>\n        Brightfold\n      </a>\n      <div class=\"meta\"><span id=\"tCount\" class=\"mono\">1 / 20</span><span class=\"clock\" id=\"tClock\">16:00</span><button class=\"link-btn\" id=\"finishBtn\">Finish</button></div>\n    </div>\n    <div class=\"wrap pipwrap\"><div class=\"pips\" id=\"tPips\" aria-hidden=\"true\"></div></div>\n  </div>\n  <div class=\"wrap t-main\" id=\"tMain\"></div>\n</div>\n\n<div class=\"cheer\" id=\"cheer\" role=\"status\" aria-live=\"polite\"></div>\n";document.getElementById('shell').outerHTML=h;})();
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
const TOTAL=16*60;
let autoTimer=null;
let st=null,clockTimer=null,subTimer=null;
const $=id=>document.getElementById(id);
function fmt(s){s=Math.max(0,s);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}

function startTest(){
  st={i:0,ans:Array(ITEMS.length).fill(null),seen:{},cp:{},left:TOTAL,done:false,hold:true,word:WORDS[Math.floor(Math.random()*WORDS.length)],recall:null};
  $('landing').hidden=true;$('app').hidden=false;window.scrollTo(0,0);
  clearInterval(clockTimer);
  clockTimer=setInterval(()=>{if(st.done||st.hold)return;st.left--;$('tClock').textContent=fmt(st.left);$('tClock').classList.toggle('low',st.left<=60);if(st.left<=0)finish();},1000);
  $('tClock').textContent=fmt(TOTAL);$('tClock').classList.remove('low');$('finishBtn').hidden=false;
  wordScreen();
}
document.querySelectorAll('.js-start').forEach(b=>b.addEventListener('click',startTest));
$('exitLink').addEventListener('click',e=>{e.preventDefault();leave();});
function leave(){clearInterval(clockTimer);clearTimeout(subTimer);clearInterval(subTimer);if(st)st.done=true;$('app').hidden=true;$('landing').hidden=false;window.scrollTo(0,0);}
$('finishBtn').addEventListener('click',()=>{
  const un=st.ans.filter(a=>a===null).length;
  if(un&&!st.confirmFinish){st.confirmFinish=true;$('finishBtn').textContent=`${un} unanswered · finish anyway`;setTimeout(()=>{if(st&&!st.done){st.confirmFinish=false;$('finishBtn').textContent='Finish';}},4000);return;}
  finish();
});

const DCOL={fluid:'purple',quant:'yellow',verbal:'green',spatial:'blue',memory:'orange',speed:'pink'};
function pips(all){
  const el=$('tPips');if(!el)return;
  el.innerHTML=ITEMS.map(it=>{const on=all||(st&&st.ans[it.idx]!==null);const cur=!all&&st&&!st.done&&!st.hold&&it.idx===st.i;return `<i class="${on?'on c-'+DCOL[it.d]:''}${cur?' cur':''}"></i>`;}).join('');
}
function render(){
  clearTimeout(subTimer);clearInterval(subTimer);clearTimeout(autoTimer);
  const it=ITEMS[st.i],dom=DOMAINS.find(d=>d.id===it.d);
  $('tCount').textContent=`${st.i+1} / ${ITEMS.length}`;
  pips();
  let body='';
  if(it.type==='matrix'){
    body=`<div class="mx" id="qMx"></div><div class="opts" role="radiogroup" aria-label="Answers">${it.choices.map((ch,j)=>optFig(j,cellSVG(ch.c))).join('')}</div>`;
  }else if(it.type==='series'){
    body=`<div class="seq">${it.seq.map(n=>`<span>${n}</span>`).join('')}<span class="blank">?</span></div>${optText(it.opts)}`;
  }else if(it.type==='choice'){
    body=(it.pre||'')+optText(it.opts,it.mono);
  }else if(it.type==='figseq'){
    body=`<div class="seq figs">${it.seq.map(c=>`<span>${cellSVG(c)}</span>`).join('')}<span class="blank">?</span></div><div class="opts" style="grid-template-columns:repeat(5,1fr)" role="radiogroup">${it.choices.map((ch,j)=>optFig(j,cellSVG(ch.c))).join('')}</div>`;
  }else if(it.type==='oddfig'){
    body=`<div class="opts" style="grid-template-columns:repeat(4,1fr)" role="radiogroup">${it.choices.map((ch,j)=>optFig(j,cellSVG(ch.c))).join('')}</div>`;
  }else if(it.type==='rotate'){
    body=`<div class="target"><svg viewBox="0 0 100 100" aria-label="Target shape">${polySVG(it.base,4).replace(/<svg[^>]*>|<\/svg>/g,'')}</svg><span class="label">Target shape</span></div><div class="opts" style="grid-template-columns:repeat(4,1fr)" role="radiogroup">${it.choices.map((ch,j)=>optFig(j,polySVG(ch.c,4))).join('')}</div>`;
  }else if(it.type==='net'){
    body=`<div class="opts" style="grid-template-columns:repeat(2,1fr)" role="radiogroup">${it.choices.map((ch,j)=>optFig(j,netSVG(ch.c),'wide')).join('')}</div>`;
  }else if(it.type==='memory'){
    body=memoryHTML(it);
  }else if(it.type==='scan'){
    body=scanHTML(it);
  }
  $('tMain').innerHTML=`<div class="qcard"><div class="qhead"><span class="chip c-${DCOL[it.d]}">${dom.name}</span><span class="num">Item ${st.i+1} of ${ITEMS.length}</span></div>
    <h2 class="qtitle">${it.q}</h2>${it.type==='memory'&&it.mode==='backward'?'<p class="qsub">Last digit first.</p>':''}
    ${body}
    <div class="qnav"><button class="btn btn-primary" id="nextBtn">${st.i===ITEMS.length-1?'Submit':'Next'}</button><button class="link-btn" id="prevBtn"${st.i===0?' disabled':''}>Back</button><span class="kbd">Keys 1–6 to answer · Enter after answering</span></div></div>`;
  if(it.type==='matrix')renderMatrix($('qMx'),it,false);
  markSel();
  $('prevBtn').onclick=()=>go(st.i-1);
  $('nextBtn').onclick=next;
  $('tMain').querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.j));
  if(it.type==='memory')wireMemory(it);
  if(it.type==='scan')wireScan(it);
}
const optFig=(j,svg,cls)=>`<button class="opt fig ${cls||''}" data-j="${j}" role="radio" aria-label="Option ${j+1}"><span class="k">${j+1}</span>${svg}</button>`;
const optText=(opts,mono)=>`<div class="opts text${opts.every(o=>String(o).length<=9)?' short':''}" role="radiogroup">${opts.map((o,j)=>`<button class="opt${mono?' mono':''}" data-j="${j}" role="radio"><span class="k">${j+1}</span><span>${o}</span></button>`).join('')}</div>`;
function markSel(){$('tMain').querySelectorAll('.opt').forEach(b=>{const on=+b.dataset.j===st.ans[st.i];b.classList.toggle('sel',on);b.setAttribute('aria-checked',on);});}
let cheerN=0;function cheer(){const c=$('cheer');if(!c)return;c.textContent=CHEERS[cheerN++%CHEERS.length];c.classList.remove('on');void c.offsetWidth;c.classList.add('on');}
function pick(j){const it=ITEMS[st.i];if(it.type==='scan'&&st.seen[st.i]==='closed')return;const first=st.ans[st.i]===null;st.ans[st.i]=j;markSel();if(first&&(st.ans.filter(a=>a!==null).length%3===2))cheer();
  clearTimeout(autoTimer);if(first&&st.i<ITEMS.length-1){const at=st.i;autoTimer=setTimeout(()=>{if(st&&!st.done&&st.i===at)next();},480);}
  pips();}
function go(i){if(i<0||i>=ITEMS.length)return;st.i=i;render();window.scrollTo({top:0});}
function next(){const it=ITEMS[st.i];if(it.type==='memory'){const v=($('memIn')||{}).value;if(v!=null&&v!=='')st.ans[st.i]=v.replace(/\D/g,'');}
  if(st.i===ITEMS.length-1){recallScreen();return;}
  const n=st.i+1;if(CHECKPOINTS.includes(n)&&!st.cp[n]){st.cp[n]=1;checkpoint(n);return;}
  go(st.i+1);}
function segsHTML(k){return `<div class="segs" aria-hidden="true">${CHECKPOINTS.map((_,x)=>`<i class="${x<=k?'on':''}"></i>`).join('')}</div>`;}
function wordScreen(){
  st.hold=true;$('tCount').textContent='Before you start';pips();
  $('tMain').innerHTML=`<div class="mo" role="status"><p class="label">One quick thing first</p><h2>Memorize this word</h2>
   <p>You will be asked about it after the last question.</p><div class="word">${st.word}</div>
   <p class="hold">The clock starts when you continue.</p><button class="btn btn-primary" id="moGo">I’ve memorized it</button></div>`;
  $('moGo').onclick=()=>{st.hold=false;render();window.scrollTo({top:0});};$('moGo').focus();
}
function recallScreen(){
  clearTimeout(autoTimer);st.hold=true;$('tCount').textContent='Bonus question';
  const opts=[st.word,...WORDS.filter(w=>w!==st.word).sort(()=>Math.random()-.5).slice(0,4)].sort(()=>Math.random()-.5);
  $('tMain').innerHTML=`<div class="mo" role="status"><p class="label">Last one</p><h2>Which word did you memorize?</h2>
   <p>From the very start of the test.</p><div class="opts text" role="radiogroup">${opts.map((w,j)=>`<button class="opt" role="radio" data-w="${w}"><span class="k">${j+1}</span><span>${w}</span></button>`).join('')}</div></div>`;
  $('tMain').querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{st.recall=b.dataset.w===st.word;st.hold=false;finish();});
  window.scrollTo({top:0});
}
function checkpoint(n){
  clearTimeout(autoTimer);clearTimeout(subTimer);clearInterval(subTimer);st.hold=true;
  const k=CHECKPOINTS.indexOf(n),used=TOTAL-st.left,left=ITEMS.length-n,budget=TOTAL/ITEMS.length,pace=used/n;
  let h,fig='',lead,meter=false;
  if(k===0){
    const faster=pace<budget;
    h=faster?'You are ahead of the clock.':'Steady and careful. You have time to think.';
    fig=`<span class="cp-n">${fmt(Math.round(pace))}</span><span class="cp-u">average per item, against a budget of ${fmt(Math.round(budget))}</span>`;
    lead=`Quick, accurate reactions are one of the things this test samples.`;
  }else if(k===1){
    const seen=new Set(ITEMS.slice(0,n).map(x=>x.d));
    h='A pattern is starting to show in how you think.';
    fig=`<span class="cp-n">${seen.size} of ${DOMAINS.length}</span><span class="cp-u">domains covered so far</span>`;
    meter=`<ul class="cp-dom">${DOMAINS.map(d=>`<li class="${seen.has(d.id)?'on c-'+DCOL[d.id]:''}"><span>${d.name}</span><span>${seen.has(d.id)?'Covered':'Still to come'}</span></li>`).join('')}</ul>`;
    lead=`Every answer adds detail to your profile.`;
  }else if(k===2){
    h='Past the halfway mark. Keep that rhythm.';
    fig=`<span class="cp-n">${n} of ${ITEMS.length}</span><span class="cp-u">items done, ${fmt(st.left)} left on the clock</span>`;
    meter=`<div class="cp-bar" aria-hidden="true"><i id="moMeter"></i></div>`;
    lead=`The second half works the same way as the first.`;
  }else{
    h=`Almost there. ${left} questions left.`;
    fig=`<span class="cp-n">${left}</span><span class="cp-u">to go, with ${fmt(st.left)} on the clock</span>`;
    lead=`Take them one at a time.`;
  }
  $('tMain').innerHTML=`<div class="mo cp" role="status"><p class="label">Checkpoint ${k+1} of ${CHECKPOINTS.length}, clock paused</p><h2>${h}</h2><p>${lead}</p>
   <div class="cp-side"><div class="cp-fig">${fig}</div>${meter||''}<p class="fact"><b>Did you know?</b> ${FACTS[k]}</p></div>
   <button class="btn btn-primary" id="cpGo">Continue</button></div>`;
  if(k===2)requestAnimationFrame(()=>requestAnimationFrame(()=>{const m=$('moMeter');if(m)m.style.transform=`scaleX(${n/ITEMS.length})`;}));
  $('cpGo').onclick=()=>{st.hold=false;go(n);};$('cpGo').focus();window.scrollTo({top:0});
}

/* memory */
function memoryHTML(it){
  const s=st.seen[st.i];
  if(!s)return `<div class="memo" id="memo"><div><span class="hint">After a 3-2-1 countdown, ${it.digits.length} digits will appear one at a time, ${(it.digits.length*0.9).toFixed(1)} seconds in total. You see them once.</span><button class="btn btn-line" id="memGo">Show the digits</button></div></div>`;
  return `<div class="memo"><span class="hint">The digits have been shown.</span></div><div class="field"><label for="memIn">${it.mode==='forward'?'Type the digits in order':'Type the digits in reverse order'}</label><input id="memIn" inputmode="numeric" autocomplete="off" maxlength="12" value="${st.ans[st.i]||''}"></div>`;
}
function wireMemory(it){
  const g=$('memGo');
  if(g)g.onclick=()=>{
    const memo=$('memo');let k=0;let cd=3;memo.innerHTML='<span class="count" id="memD">3</span>';
    const show=()=>{if(k<it.digits.length){$('memD').textContent=it.digits[k];k++;subTimer=setTimeout(()=>{$('memD').textContent='';subTimer=setTimeout(show,150);},750);}
      else{st.seen[st.i]='shown';render();setTimeout(()=>$('memIn')&&$('memIn').focus(),30);}};
    const count=()=>{cd--;if(cd>0){$('memD').textContent=cd;subTimer=setTimeout(count,600);}else{$('memD').className='big';$('memD').textContent='';subTimer=setTimeout(show,250);}};
    subTimer=setTimeout(count,600);
  };
  const inp=$('memIn');
  if(inp)inp.addEventListener('input',()=>{const v=inp.value.replace(/\D/g,'');inp.value=v;st.ans[st.i]=v||null;
    pips();});
}
/* scan */
function scanHTML(it){
  const s=st.seen[st.i];
  if(!s)return `<div class="memo"><div><span class="hint">A grid of 45 symbols appears for 20 seconds. Count the targets, then choose your answer.</span><button class="btn btn-line" id="scanGo">Show the grid</button></div></div>`;
  return `<div class="tbar" id="tbar"><span id="tleft">${s==='closed'?'Time is up':'20 s'}</span><div class="tb"><i id="tbi"></i></div></div>
    <div class="scan-grid${s==='closed'?' hide':''}" aria-label="Symbol grid">${it.grid.map(g=>`<span>${g}</span>`).join('')}</div>${optText(it.opts)}`;
}
function wireScan(it){
  const g=$('scanGo');
  if(g){g.onclick=()=>{st.seen[st.i]='open';st.scanEnd=Date.now()+20000;render();};return;}
  if(st.seen[st.i]==='open'){
    const bi=$('tbi');const tick=()=>{const left=Math.ceil((st.scanEnd-Date.now())/1000);
      if(left<=0){clearInterval(subTimer);st.seen[st.i]='closed';render();return;}
      $('tleft').textContent=left+' s';bi.style.transform=`scaleX(${left/20})`;};
    bi.style.transform='scaleX(1)';tick();subTimer=setInterval(tick,250);
  }else{$('tbi').style.transform='scaleX(0)';}
}
document.addEventListener('keydown',e=>{
  if($('app').hidden||!st||st.done)return;if(e.target.tagName==='INPUT'){if(e.key==='Enter'&&e.target.value.trim()!=='')next();return;}
  if($('cpGo')||st.hold)return;
  const n=parseInt(e.key,10);const opts=$('tMain').querySelectorAll('.opt');
  if(n>=1&&n<=opts.length){pick(n-1);}else if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){if(st.ans[st.i]!==null)next();}
  else if(e.key==='ArrowRight'){if(st.ans[st.i]!==null)go(st.i+1);}else if(e.key==='ArrowLeft')go(st.i-1);
});

/* results */
function isRight(it,a){if(a===null||a===undefined)return false;return it.type==='memory'?a===it.answer:a===it.correct;}
function erf(x){const t=1/(1+.3275911*Math.abs(x));const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return x>=0?y:-y;}
function answerText(it,a){
  if(a===null||a===undefined)return 'No answer';
  if(it.type==='memory')return a;
  if(it.opts)return it.opts[a];return 'Option '+(a+1);
}
function correctText(it){
  if(it.type==='memory')return it.answer;
  if(it.opts)return it.opts[it.correct];return 'Option '+(it.correct+1);
}

/* MOCK paywall (proof of concept). No payment is collected; the button simply reveals the results. */
let gateTimer;
function finish(){
  if(st.done&&st.finished)return;st.done=true;clearInterval(clockTimer);clearTimeout(subTimer);clearInterval(subTimer);clearTimeout(autoTimer);
  $('finishBtn').hidden=true;pips(true);$('tCount').textContent='Almost done';
  let left=600;
  $('tMain').innerHTML=`<div class="gate" role="region" aria-label="Unlock your results">
   <div class="g-l"><span class="mockbar">Mock paywall, no payment is taken</span>
   <h2>Your results are ready</h2><div class="blur" aria-hidden="true">104</div>
   <p class="timer">Your result is reserved for <b id="gateT">10:00</b></p></div>
   <div class="g-r"><fieldset class="plans"><legend class="sr">Choose a plan</legend>
    <label class="plan"><input type="radio" name="plan" value="trial" checked><span class="dot"></span><span class="t"><b>7-day trial</b><span>Then billed weekly</span></span><span class="pr">$0.99</span></label>
    <label class="plan"><input type="radio" name="plan" value="month"><span class="dot"></span><span class="t"><b>1 month<span class="best">Best value</span></b><span>Billed monthly</span></span><span class="pr">$9.99</span></label>
    <label class="plan"><input type="radio" name="plan" value="year"><span class="dot"></span><span class="t"><b>12 months</b><span>Billed yearly</span></span><span class="pr">$29.99</span></label>
   </fieldset>
   <ul class="inc"><li>Full score and percentile</li><li>Domain breakdown</li><li>Every item explained</li><li>Printable certificate</li></ul>
   <button class="btn btn-primary" id="gateGo">Show my results</button>
   <p class="fine">Placeholder flow for the proof of concept. Nothing is charged and no card details are asked for.</p></div></div>`;
  const t=$('gateT');gateTimer=setInterval(()=>{left=Math.max(0,left-1);t.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');},1000);
  $('gateGo').onclick=()=>{clearInterval(gateTimer);st.done=false;showResults();};
  $('gateGo').focus();window.scrollTo(0,0);
}

function showResults(){
  if(st.done&&st.finished)return;st.done=true;st.finished=true;clearInterval(clockTimer);clearTimeout(subTimer);clearInterval(subTimer);
  $('finishBtn').hidden=true;pips(true);
  const right=ITEMS.map(it=>isRight(it,st.ans[it.idx]));const raw=right.filter(Boolean).length;const pct=raw/ITEMS.length;
  const iq=Math.round(Math.max(62,Math.min(145,100+15*(pct-.5)/.2)));
  const percentile=Math.round(50*(1+erf((iq-100)/15/Math.SQRT2))*10)/10;
  const cls=iq>=130?'Very high':iq>=115?'Above average':iq>=85?'Average':iq>=70?'Below average':'Low';
  const used=TOTAL-st.left;
  const dom=DOMAINS.map(d=>{const its=ITEMS.filter(it=>it.d===d.id);const ok=its.filter(it=>right[it.idx]).length;return{...d,ok,n:its.length};});
  const ranked=dom.slice().sort((x,y)=>y.ok/y.n-x.ok/x.n);const best=ranked[0],worst=ranked[ranked.length-1];
  $('tCount').textContent='Results';
  $('tMain').innerHTML=`<div class="res">
   <section class="res-sec res-hero"><p class="label">Estimated score, practice scale</p><div class="res-num" id="resNum">${iq}</div><h2 class="cls">${cls}</h2>
    <div class="share" role="list" aria-label="Score by domain">${dom.map(d=>`<div class="sq c-${DCOL[d.id]}${d===best?' best':''}" role="listitem"><i style="transform:scaleY(${d.ok/d.n})"></i><span class="nm">${d.name}</span><b>${d.ok}/${d.n}</b></div>`).join('')}</div>
    <div class="stats" aria-label="Statistics"><div><b>${raw}</b><span>Correct</span></div><div><b>${Math.round(pct*100)}</b><span>Percent</span></div><div><b>${fmt(used)}</b><span>Time used</span></div><div><b>${Math.round(percentile)}</b><span>Percentile</span></div></div>
    <p class="res-txt">You answered ${raw} of ${ITEMS.length} items correctly in ${fmt(used)}.${st.recall===null?'':st.recall?' You also remembered the opening word.':' The opening word slipped away, which happens to everyone.'} On a mean-100, σ-15 scale that sits near the ${percentile}th percentile. This test is not normed, so read the number as a rough guide.</p>
    <p class="dnote"><b>Strongest:</b> ${best.name}. <b>Most room to grow:</b> ${best.ok/best.n===worst.ok/worst.n?"even across all six":worst.name}.</p>
    <div class="res-acts"><button class="btn btn-primary" id="copyBtn">Copy result</button><button class="btn btn-line" id="againBtn">Take it again</button><button class="link-btn" id="homeBtn">Back to Brightfold</button></div></section>
   <section class="res-sec"><h3>Where your estimate falls</h3><p class="sub">The curve shows how scores spread on a mean-100 scale. About two in three people land in the middle band.</p><svg class="bell" id="bellRes" viewBox="0 0 640 250" role="img" aria-label="Your estimate on the normal curve"></svg></section>
   <section class="res-sec res-cert"><h3>Your certificate</h3><div class="cert-form"><div class="fld"><label for="certIn">Name on certificate</label><input id="certIn" type="text" maxlength="40" placeholder="Type your name" autocomplete="name"></div><button class="btn btn-primary" id="certPrint">Print or save as PDF</button></div>${certHTML({name:'Brightfold participant',nameId:'certName',score:iq,cls,date:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}),items:ITEMS.length})}</section>
   <section class="res-sec res-review"><h3>Every item, explained</h3><div class="review-list">${ITEMS.map(it=>{const ok=right[it.idx];return `<div class="rv"><span class="n">${it.idx+1}</span><div><div class="q">${it.q}</div><div class="x">Your answer: ${answerText(it,st.ans[it.idx])}${ok?'':` · Correct: ${correctText(it)}`}</div><div class="x why">${it.why}</div></div><span class="st ${ok?'ok':'no'}">${ok?'Correct':'Missed'}</span></div>`;}).join('')}</div></section></div>`;
  bell($('bellRes'),iq);
  clearTimeout(window._bellT);window.onresize=()=>{clearTimeout(window._bellT);window._bellT=setTimeout(()=>{const b=$('bellRes');if(b)bell(b,iq);},150);};
  $('certIn').oninput=e=>{$('certName').textContent=e.target.value.trim()||'Brightfold participant';};$('certPrint').onclick=()=>window.print();$('againBtn').onclick=startTest;$('homeBtn').onclick=leave;window.scrollTo(0,0);
  $('copyBtn').onclick=async()=>{const t=`I scored ${iq} on the Brightfold reasoning test (${raw}/${ITEMS.length} correct). Strongest domain: ${best.name}.`;
    try{await navigator.clipboard.writeText(t);$('copyBtn').textContent='Copied';}catch(e){$('copyBtn').textContent='Copy not available';}
    setTimeout(()=>{const c=$('copyBtn');if(c)c.textContent='Copy result';},2000);};
}
/* certificate */
function certHTML(o){const e=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 return `<div class="cert-sheet" ${o.id?`id="${o.id}"`:''}>${o.sample?'<span class="c-stamp">Sample</span>':''}<span class="c-brand"><i></i>Brightfold</span><p class="c-kicker">Certificate of completion</p><h3>Reasoning Test</h3><p class="c-line">This certifies that</p><div class="c-name" ${o.nameId?`id="${o.nameId}"`:''}>${e(o.name)}</div><p class="c-line">completed the Brightfold reasoning test with an estimated score of</p><div class="c-score">${o.score}</div><div class="c-cls">${o.cls}</div><div class="c-foot"><span>${o.date}</span><span>${o.items} items · 6 domains</span></div><p class="c-fine">Practice estimate on a mean-100, σ-15 scale. Not normed and not a clinical or diagnostic assessment.</p></div>`;}

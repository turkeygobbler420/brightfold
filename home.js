/* Account home: overview, course library, brain training and settings. */
(function(){
  const E=window.BF_E;
  const ri=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
  const pick=a=>a[ri(0,a.length-1)];
  const shuf=a=>a.slice().sort(()=>Math.random()-.5);
  const ls={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
  const S=()=>window.BF_STORE;

  /* ---------- catalogue ---------- */
  const CATS=[
    {id:'fluid',name:'Logic & patterns',drills:[['Number series','Find the term that comes next.'],['Growth series','Spot the multiplying rule.'],['Zig-zag series','Rules that alternate.'],['Widening gaps','Differences that keep changing.'],['Chain sums','Each term builds on the last two.']]},
    {id:'quant',name:'Math',drills:[['Quick sums','Add and subtract in your head.'],['Times tables','Multiply without a pause.'],['Multiply and add','Two steps, one answer.'],['Brackets','Work the inner step first.'],['Division drills','Clean divisions, fast.']]},
    {id:'verbal',name:'Language',drills:[['Unscramble','Rebuild the hidden word.'],['Opposites','Choose the opposite meaning.'],['Same meaning','Choose the closest meaning.'],['Odd one out','Which word does not belong?'],['Long unscramble','Longer words, tighter letters.']]},
    {id:'spatial',name:'Visual',drills:[['Count triangles','Scan the grid and count.'],['Count circles','Scan the grid and count.'],['Count squares','Scan the grid and count.'],['Count diamonds','Scan the grid and count.'],['Count stars','Scan the grid and count.']]},
    {id:'memory',name:'Memory',drills:[['Digit span','Hold the digits, then recognise them.'],['Digit reversal','Hold them, then flip them.'],['Letter span','Remember the letter string.'],['Word span','Remember a run of words.'],['Long digit span','Longer strings, shorter glance.']]},
    {id:'speed',name:'Speed & focus',drills:[['Largest number','Pick the biggest before time runs out.'],['Smallest number','Pick the smallest, fast.'],['Multiples of three','Find the one multiple of three.'],['Odd one out','Only one is even. Find it.'],['Wide field','Six numbers, one second less.']]}
  ];
  const LEVELS=6,ROUNDS=8;
  const COURSES=[
    ['pattern','fluid','Pattern Recognition Essentials','See the rule behind any sequence.',34,['Spotting sequences|Read the gap between terms.','Rules that change|Handle alternating and growing rules.','Matrices and grids|Apply the rule across two directions.']],
    ['deduce','fluid','Logical Deduction Workshop','Reason step by step from facts to a conclusion.',28,['If this, then that|Build clean chains of reasoning.','Ruling things out|Remove what cannot be true.','Spotting weak arguments|Find the gap in a claim.']],
    ['strategy','fluid','Strategic Thinking','Plan several moves ahead and weigh trade-offs.',31,['Framing the problem|State the real question first.','Options and costs|Compare paths before choosing.','Thinking ahead|Anticipate what comes next.']],
    ['sense','quant','Number Sense & Mental Maths','Estimate, round and calculate without a screen.',26,['Estimation|Get close in seconds.','Mental shortcuts|Split, round and compensate.','Fractions and percentages|Move between forms with ease.']],
    ['quantlab','quant','Quantitative Reasoning Lab','Turn word problems into clean arithmetic.',30,['Reading the problem|Pull out what matters.','Ratios and rates|Scale quantities correctly.','Multi-step problems|Chain steps without losing the thread.']],
    ['vocab','verbal','Vocabulary & Analogies','Widen your word bank and relate ideas.',24,['Roots and prefixes|Decode unfamiliar words.','Word relationships|Solve analogies quickly.','Precision in language|Choose the exact word.']],
    ['reading','verbal','Critical Reading','Read for structure, claims and evidence.',32,['Finding the claim|Locate the main point.','Weighing evidence|Judge support for a claim.','Inference|Read between the lines.']],
    ['visual','spatial','Visual-Spatial Thinking','Build the habits behind shape and space puzzles.',29,['Shapes and symmetry|Compare forms at a glance.','Folding and unfolding|Predict the result of a fold.','Perspective|Imagine objects from other sides.']],
    ['rotate','spatial','Mental Rotation & Mapping','Turn objects and routes in your mind.',27,['Rotating shapes|Hold a shape and turn it.','Reading maps|Move between plan and view.','Route planning|Find the shortest path.']],
    ['memfound','memory','Memory Foundations','How memory works and how to train it.',33,['How memory forms|Encoding, storage and recall.','Chunking|Group items to hold more.','Spaced recall|Review at the right moments.']],
    ['wmem','memory','Working Memory Upgrade','Hold and manipulate more at once.',25,['Holding sequences|Keep order while you work.','Updating|Replace old items with new.','Under distraction|Stay accurate while interrupted.']],
    ['palace','memory','Memory Palace Techniques','Use place and imagery to remember lists.',30,['Choosing a place|Build a route you know well.','Vivid imagery|Make items memorable.','Long lists|Scale to dozens of items.']],
    ['focus','speed','Focus & Attention','Sustain attention and resist distraction.',28,['Sustained attention|Stay on task for longer.','Filtering noise|Ignore what does not matter.','Switching tasks|Change focus without losing pace.']],
    ['speedc','speed','Processing Speed Training','Respond accurately and faster.',31,['Fast and accurate|Balance pace with precision.','Scanning|Search large fields quickly.','Decision speed|Commit sooner with confidence.']],
    ['creative','general','Creative Thinking','Generate ideas and combine them in new ways.',26,['Divergent thinking|Produce many ideas.','Combining ideas|Join unrelated concepts.','Testing ideas|Keep the ones that work.']],
    ['learn','general','Learning How to Learn','Study methods that actually stick.',29,['Active recall|Test yourself, do not re-read.','Spacing and mixing|Schedule practice well.','Feedback|Use mistakes as data.']],
    ['eq','general','Emotional Intelligence','Read emotions in yourself and others.',36,['Self-awareness|Name what you feel.','Regulation|Respond, do not react.','Empathy|Understand another view.']]
  ].map(c=>({id:c[0],cat:c[1],name:c[2],blurb:c[3],lessons:c[4],mods:c[5].map(m=>m.split('|'))}));
  const mins=n=>n*4.5/60; // 4.5 minutes per lesson
  const hrs=n=>(Math.round(mins(n)*10)/10);
  const TOT_L=COURSES.reduce((a,c)=>a+c.lessons,0);
  const TOT_H=Math.round(mins(TOT_L));
  const TOT_EX=CATS.length*5*LEVELS;
  const catName=id=>(CATS.find(c=>c.id===id)||{name:'General'}).name;
  const FREE_LESSONS=3;

  /* ---------- progress ---------- */
  let P=ls.get('bf_prog',{lessons:{},ex:{},last:null,days:[]});
  let syncT=null;
  const pushP=()=>{ls.set('bf_prog',P);clearTimeout(syncT);syncT=setTimeout(()=>{
    const a=window.BF_AUTH,sb=a&&a.sb&&a.sb(),u=a&&a.user&&a.user();
    if(sb&&u)sb.from('progress').upsert({user_id:u.id,data:P,updated_at:new Date().toISOString()}).then(()=>{},()=>{});
  },800);};
  async function pullP(){
    const a=window.BF_AUTH,sb=a&&a.sb&&a.sb(),u=a&&a.user&&a.user();if(!sb||!u)return;
    try{
      const {data}=await sb.from('progress').select('data').eq('user_id',u.id).maybeSingle();
      const r=data&&data.data;if(!r)return pushP();
      Object.keys(r.lessons||{}).forEach(k=>{P.lessons[k]=Array.from(new Set([...(P.lessons[k]||[]),...r.lessons[k]]));});
      Object.keys(r.ex||{}).forEach(k=>{const m=P.ex[k],n=r.ex[k];P.ex[k]=m?{best:Math.max(m.best,n.best),plays:Math.max(m.plays,n.plays)}:n;});
      P.days=Array.from(new Set([...(P.days||[]),...(r.days||[])])).sort().slice(-60);
      P.last=P.last||r.last;ls.set('bf_prog',P);if(root.classList.contains('on'))draw();
    }catch(e){}
  }
  const done=cid=>(P.lessons[cid]||[]).length;
  const paid=()=>!!S().local().paid;
  const today=()=>new Date().toISOString().slice(0,10);
  const mark=()=>{P.days=Array.from(new Set([...(P.days||[]),today()])).sort().slice(-60);};

  /* ---------- shell ---------- */
  const root=document.createElement('div');root.id='home';root.className='hm';root.hidden=true;
  root.setAttribute('role','dialog');root.setAttribute('aria-label','Your Neurometric account');
  document.body.appendChild(root);
  let tab='overview',course=null,drill=null,sess=null,toast=null,seeAll=false;
  const TABS=[['overview','Overview'],['courses','Courses'],['training','Training'],['settings','Settings']];
  const icon={
    lock:'<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4.5" y="9" width="11" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    ok:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const u=()=>{const x=S().user();return x?{email:x.email,name:(x.user_metadata&&x.user_metadata.display_name)||x.name||''}:{email:'',name:''};};
  const first=()=>{const n=u().name||u().email.split('@')[0]||'there';return n.split(' ')[0];};

  function chrome(inner){
    const x=u();const ini=((x.name||x.email||'B')[0]||'B').toUpperCase();
    return `<header class="hm-top"><div class="hm-bar">
      <button class="hm-logo" type="button" data-h="site" aria-label="Back to Neurometric"><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 5.2C14.5 3.4 11.4 3.2 9.4 5C7 5 5.2 7 5.4 9.4C3.4 10.4 2.6 13.2 3.8 15.3C2.8 17.6 3.6 20.4 5.8 21.5C6.6 24.2 9.6 25.2 11.6 24.4C12.6 25.6 14 26 14.4 26.2L14.2 29L17.8 29L17.6 26.2C18 26 19.4 25.6 20.4 24.4C22.4 25.2 25.4 24.2 26.2 21.5C28.4 20.4 29.2 17.6 28.2 15.3C29.4 13.2 28.6 10.4 26.6 9.4C26.8 7 25 5 22.6 5C20.6 3.2 17.5 3.4 16 5.2Z" fill="#f77fa3" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M11.2 8.4C9.6 9.6 9.6 11.6 11.2 12.6C12.4 13.4 12.4 14.8 11 15.6M7.4 15.8C8.8 16.4 9.6 17.6 9 19M12.4 19.4C11.2 20.6 11.6 22.2 13 22.8M20.8 8.4C22.4 9.6 22.4 11.6 20.8 12.6C19.6 13.4 19.6 14.8 21 15.6M24.6 15.8C23.2 16.4 22.4 17.6 23 19M19.6 19.4C20.8 20.6 20.4 22.2 19 22.8" fill="none" stroke="#b8325f" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 5.6V26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Neurometric</button>
      <nav class="hm-tabs" aria-label="Account">${TABS.map(t=>`<button type="button" data-tab="${t[0]}"${tab===t[0]?' class="on" aria-current="page"':''}>${t[1]}</button>`).join('')}</nav>
      <button class="hm-me" type="button" data-tab="settings" aria-label="Settings">${E(ini)}</button></div></header>
      <main class="hm-main">${inner}</main>${toast?`<div class="hm-toast" role="status">${E(toast)}</div>`:''}`;
  }
  const flash=t=>{toast=t;draw();clearTimeout(flash.t);flash.t=setTimeout(()=>{toast=null;const el=root.querySelector('.hm-toast');if(el)el.remove();},2600);};

  /* ---------- overview ---------- */
  const cdf=z=>{const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p;};
  function bell(score){
    const W=320,H=110,x=v=>(v-55)/(145-55)*W,y=v=>H-8-Math.exp(-Math.pow((v-100)/15,2)/2)*(H-26);
    let d='';for(let v=55;v<=145;v+=2)d+=(v===55?'M':'L')+x(v).toFixed(1)+' '+y(v).toFixed(1);
    const s=Math.max(55,Math.min(145,score));
    return `<svg class="hm-bell" viewBox="0 0 ${W} ${H}" role="img" aria-label="Your score on the normal curve"><path d="${d} L${W} ${H-8} L0 ${H-8}Z" fill="var(--blue)" opacity=".35"/><path d="${d}" fill="none" stroke="var(--ink)" stroke-width="1.5"/><line x1="${x(s)}" x2="${x(s)}" y1="${y(s)}" y2="${H-8}" stroke="var(--ink)" stroke-width="2"/><circle cx="${x(s)}" cy="${y(s)}" r="5" fill="var(--ink)"/><line x1="0" x2="${W}" y1="${H-8}" y2="${H-8}" stroke="var(--line)"/></svg>`;
  }
  let RES=null;
  function band(s){return s>=130?'Very superior':s>=120?'Superior':s>=110?'High average':s>=90?'Average':s>=80?'Low average':'Below average';}
  function overview(){
    const r=RES&&RES[0];
    const score=r?`<section class="hm-card hm-score"><div class="hm-k">Your IQ score</div>
      <div class="hm-big">${E(r.score)}</div><div class="hm-sub">${band(r.score)} · taken ${E(new Date(r.at).toLocaleDateString((window.BF_LOC?BF_LOC():'en-GB'),{day:'numeric',month:'short',year:'numeric'}))}</div>
      ${bell(r.score)}<p class="hm-note">You scored higher than <b>${Math.max(1,Math.min(99,Math.round(cdf((r.score-100)/15)*100)))}%</b> of test takers.</p>
      <div class="hm-row"><button class="btn btn-primary btn-sm" type="button" data-h="retake">Retake the test</button></div></section>`
      :`<section class="hm-card hm-score"><div class="hm-k">Your IQ score</div><h2 class="hm-h">Take the test to see your score</h2><p class="hm-note">Thirty questions across six areas. Your score, percentile and cognitive profile appear here.</p><div class="hm-row"><button class="btn btn-primary" type="button" data-h="retake">Start My IQ Test</button></div></section>`;
    const prof=r&&r.domains&&r.domains.length?`<section class="hm-card"><div class="hm-k">Cognitive profile</div><div class="hm-bars">${r.domains.map(d=>{const nm=(DOMAINS.find(x=>x.id===d.id)||{}).name||d.id;const p=d.n?Math.round(d.ok/d.n*100):0;return `<div class="hm-bar-r"><span>${E(nm)}</span><i><b style="width:${p}%"></b></i><em>${d.ok}/${d.n}</em></div>`;}).join('')}</div></section>`:`<section class="hm-card"><div class="hm-k">Cognitive profile</div><p class="hm-note">Your strengths and weak spots by area will show here after your first test.</p></section>`;
    const lastC=P.last&&COURSES.find(c=>c.id===P.last);
    const cont=lastC&&done(lastC.id)<lastC.lessons?`<section class="hm-card hm-cont"><div class="hm-k">Pick up where you left off</div><h3>${E(lastC.name)}</h3><div class="hm-prog"><i><b style="width:${Math.round(done(lastC.id)/lastC.lessons*100)}%"></b></i><span>${done(lastC.id)} of ${lastC.lessons} lessons</span></div><button class="btn btn-primary btn-sm" type="button" data-course="${lastC.id}">Continue</button></section>`:'';
    let rec=COURSES.slice(0,3);
    if(r&&r.domains&&r.domains.length){const w=r.domains.slice().sort((a,b)=>a.ok/a.n-b.ok/b.n).slice(0,2).map(d=>d.id);rec=COURSES.filter(c=>w.includes(c.cat)&&done(c.id)<c.lessons).slice(0,3);if(rec.length<3)rec=rec.concat(COURSES.filter(c=>!rec.includes(c)&&done(c.id)<c.lessons).slice(0,3-rec.length));}
    const total=COURSES.reduce((a,c)=>a+done(c.id),0),plays=Object.values(P.ex).reduce((a,e)=>a+e.plays,0);
    const streak=(()=>{let n=0,d=new Date();const set=new Set(P.days||[]);if(!set.has(d.toISOString().slice(0,10)))d.setDate(d.getDate()-1);while(set.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1);}return n;})();
    const stats=`<section class="hm-card"><div class="hm-k">Your progress</div><div class="hm-stats"><div><b>${total}</b><span>of ${TOT_L} lessons done</span></div><div><b>${plays}</b><span>exercises played</span></div><div><b>${streak}</b><span>day${streak===1?'':'s'} active in a row</span></div></div></section>`;
    const cert=r?`<section class="hm-card"><div class="hm-k">Your certificate</div><p class="hm-note">Your certificate comes with your results and carries a QR code anyone can scan to check it. Retake the test any time to earn a new one.</p><div class="hm-row"><button class="btn btn-line btn-sm" type="button" data-h="retake">Retake the test</button></div></section>`:'';
    const hist=RES&&RES.length>1?`<section class="hm-card"><div class="hm-k">Score history</div><ul class="hm-hist">${RES.slice(0,6).map(x=>`<li><b>${E(x.score)}</b><span>${E(x.raw)}/${E(x.items)} correct</span><time>${E(new Date(x.at).toLocaleDateString((window.BF_LOC?BF_LOC():'en-GB'),{day:'numeric',month:'short'}))}</time></li>`).join('')}</ul></section>`:'';
    return `<div class="hm-hello"><h1>Welcome back, ${E(first())}</h1><p>Your results, training and account in one place.</p></div>
      <div class="hm-grid">${score}${prof}</div>${cont}
      <section class="hm-sec"><div class="hm-head"><h2>Recommended for you</h2><button type="button" class="link-btn" data-tab="courses">All courses</button></div><div class="hm-cards">${rec.map(courseCard).join('')}</div></section>
      <div class="hm-grid">${stats}${cert}</div>${hist}${paid()?'':upsell()}`;
  }
  function upsell(){return `<section class="hm-card hm-up"><div><div class="hm-k">Membership</div><h3>Unlock all ${COURSES.length} courses and ${TOT_EX} exercises</h3><p class="hm-note">${TOT_L} lessons, about ${TOT_H} hours of learning, retests and progress tracking. $0.99 today, then $4.99 every week until you cancel.</p></div><button class="btn btn-primary" type="button" data-h="trial">Get full access</button></section>`;}

  /* ---------- courses ---------- */
  let cf='all';
  function courseCard(c){
    const d=done(c.id),p=Math.round(d/c.lessons*100);
    return `<article class="hm-course"><div class="hm-ctag">${E(catName(c.cat))}</div><h3>${E(c.name)}</h3><p>${E(c.blurb)}</p>
      <div class="hm-meta">${c.lessons} lessons · ${hrs(c.lessons)} hours</div>
      <div class="hm-prog"><i><b style="width:${p}%"></b></i><span>${d?`${d} of ${c.lessons}`:'Not started'}</span></div>
      <button class="btn ${d?'btn-primary':'btn-line'} btn-sm" type="button" data-course="${c.id}">${d>=c.lessons?'Review':d?'Continue':'Start course'}</button></article>`;
  }
  function courses(){
    const cats=[['all','All']].concat(Array.from(new Set(COURSES.map(c=>c.cat))).map(id=>[id,catName(id)]));
    const list=COURSES.filter(c=>cf==='all'||c.cat===cf);
    return `<div class="hm-hello"><h1>Courses</h1><p>Short lessons that build the skills behind each part of the test.</p></div>
      <div class="hm-strip"><div><b>${COURSES.length}</b><span>courses</span></div><div><b>${TOT_L}</b><span>lessons</span></div><div><b>${TOT_H}+</b><span>hours of learning</span></div></div>
      ${paid()?'':upsell()}
      <div class="hm-chips" role="tablist">${cats.map(c=>`<button type="button" data-cf="${c[0]}"${cf===c[0]?' class="on"':''}>${E(c[1])}</button>`).join('')}</div>
      <div class="hm-cards">${list.map(courseCard).join('')}</div>`;
  }
  function courseView(){
    const c=COURSES.find(x=>x.id===course),dn=new Set(P.lessons[c.id]||[]),pd=paid();
    let n=0;const per=Math.floor(c.lessons/c.mods.length);
    const mods=c.mods.map((m,mi)=>{const cnt=mi===c.mods.length-1?c.lessons-per*(c.mods.length-1):per;const rows=[];
      for(let k=0;k<cnt;k++){const i=n++,lock=!pd&&i>=FREE_LESSONS,ok=dn.has(i);
        rows.push(`<li class="${ok?'ok':''}${lock?' lk':''}"><button type="button" data-les="${i}"${lock?' data-lock="1"':''} aria-label="Open lesson ${i+1}"><span class="hm-tick">${ok?icon.ok:lock?icon.lock:''}</span><span class="hm-lt">${i+1}. ${E(ltitle(c,i,m[0],k))}</span><em>${ok?'Done':lock?'Members':'4–5 min'}</em></button></li>`);}
      return `<section class="hm-mod"><h3>Module ${mi+1}: ${E(m[0])}</h3><p>${E(m[1])}</p><ul>${rows.join('')}</ul></section>`;}).join('');
    const nxt=(()=>{for(let i=0;i<c.lessons;i++)if(!dn.has(i)&&(pd||i<FREE_LESSONS))return i;return -1;})();
    if(CC[c.id]===undefined)loadJ(c.id).then(()=>{if(course===c.id&&les==null&&!sess&&root.classList.contains('on'))draw();});
    return `<button class="hm-back" type="button" data-h="back">${icon.back}All courses</button>
      <div class="hm-ctag">${E(catName(c.cat))}</div><h1 class="hm-h1">${E(c.name)}</h1><p class="hm-lead">${E(c.blurb)}</p>
      <div class="hm-meta">${c.lessons} lessons · ${hrs(c.lessons)} hours · ${c.mods.length} modules</div>
      <div class="hm-prog big"><i><b style="width:${Math.round(dn.size/c.lessons*100)}%"></b></i><span>${dn.size} of ${c.lessons} lessons</span></div>
      <div class="hm-row">${nxt>=0?`<button class="btn btn-primary" type="button" data-les="${nxt}">${dn.size?'Continue':'Start course'}</button>`:dn.size>=c.lessons?'':`<button class="btn btn-primary" type="button" data-h="trial">Unlock the rest</button>`}${pdfBtn(c.id,true,'Study guide (PDF)')}</div>${mods}`;
  }

  /* ---------- training ---------- */
  let tf='all';
  function exId(cat,v,l){return cat+'-'+v+'-'+l;}
  function training(){
    const pd=paid(),cats=[['all','All']].concat(CATS.map(c=>[c.id,c.name]));
    const plays=Object.values(P.ex).reduce((a,e)=>a+e.plays,0);
    return `<div class="hm-hello"><h1>Brain training</h1><p>Quick eight-round drills in six areas. Each has six levels.</p></div>
      <div class="hm-strip"><div><b>${TOT_EX}</b><span>exercises</span></div><div><b>${CATS.length}</b><span>skill areas</span></div><div><b>${plays}</b><span>sessions played</span></div></div>
      ${pd?'':upsell()}<div class="hm-chips">${cats.map(c=>`<button type="button" data-tf="${c[0]}"${tf===c[0]?' class="on"':''}>${E(c[1])}</button>`).join('')}</div>
      ${CATS.filter(c=>tf==='all'||c.id===tf).map(cat=>`<section class="hm-sec"><div class="hm-head"><h2>${E(cat.name)}</h2><button class="btn btn-line btn-sm" type="button" data-guide="${cat.id}">Guide and tips</button></div><div class="hm-cards">${cat.drills.map((d,v)=>`<article class="hm-drill"><h3>${E(d[0])}</h3><p>${E(d[1])}</p><div class="hm-lv">${Array.from({length:LEVELS},(_,i)=>{const l=i+1,id=exId(cat.id,v,l),b=P.ex[id],lock=!pd&&l>1;return `<button type="button" data-ex="${id}" class="${b?'pl':''}${lock?' lk':''}" aria-label="${E(d[0])} level ${l}${b?', best '+b.best+' of '+ROUNDS:''}${lock?', members only':''}" title="${b?'Best '+b.best+'/'+ROUNDS:lock?'Members':'Level '+l}">${lock?icon.lock:l}</button>`;}).join('')}</div></article>`).join('')}</div></section>`).join('')}`;
  }

  /* ---------- drill engines ---------- */
  const WL=['planet','garden','bridge','silver','window','market','stream','candle','pillow','rocket','island','forest','anchor','pencil','mirror','orange','cotton','jungle','harbor','thunder','balance','chapter','journey','kitchen','library','mystery','pattern','weather','history','science','teacher','bicycle','diamond','element','factory','harvest'];
  const ANT=[['hot','cold'],['early','late'],['brave','timid'],['rich','poor'],['expand','shrink'],['ancient','modern'],['generous','selfish'],['rapid','slow'],['victory','defeat'],['simple','complex'],['arrive','depart'],['strong','weak']];
  const SYN=[['big','large'],['quick','fast'],['begin','start'],['smart','clever'],['tired','weary'],['happy','glad'],['silent','quiet'],['buy','purchase'],['brave','bold'],['rich','wealthy'],['angry','furious'],['hard','difficult']];
  const ODD=[[['apple','pear','plum','grape'],['chair','table','sofa','desk']],[['red','blue','green','pink'],['iron','gold','silver','copper']],[['river','lake','ocean','pond'],['cat','dog','horse','sheep']]];
  const uniq=(ans,mk,n)=>{const s=new Set([String(ans)]);let g=0;while(s.size<n&&g++<60)s.add(String(mk()));return shuf(Array.from(s));};
  function round(ci,v,l){
    const cat=CATS[ci].id;
    if(cat==='fluid'){
      let s=[],a=ri(1,4+l*2),d=ri(2,3+l),r=ri(2,3);
      if(v===0)for(let i=0;i<6;i++)s.push(a+i*d);
      else if(v===1)for(let i=0;i<6;i++)s.push(a*Math.pow(r,i)%1e6);
      else if(v===2){s=[a];for(let i=1;i<6;i++)s.push(s[i-1]+(i%2?d+l:-ri(1,d)));}
      else if(v===3){s=[a];for(let i=1;i<6;i++)s.push(s[i-1]+d+i*(l>3?2:1));}
      else{s=[ri(1,5),ri(2,7)];for(let i=2;i<6;i++)s.push(s[i-1]+s[i-2]);}
      const ans=s.pop(),o=uniq(ans,()=>ans+ri(-6,6)||ans+7,4);
      return {q:`<div class="hm-seq">${s.join(', ')}, ?</div><p>What comes next?</p>`,o,a:o.indexOf(String(ans))};
    }
    if(cat==='quant'){
      const m=l*4+8;let q,ans;const A=ri(3,m),B=ri(2,m),C=ri(2,12);
      if(v===0){q=`${A+B} − ${B} + ${C}`;ans=A+C;}
      else if(v===1){const x=ri(2,6+l),y=ri(3,9+l);q=`${x} × ${y}`;ans=x*y;}
      else if(v===2){const x=ri(2,6+l),y=ri(3,9+l);q=`${x} × ${y} + ${C}`;ans=x*y+C;}
      else if(v===3){const x=ri(2,6+l),y=ri(2,6);q=`(${A} + ${B}) × ${y}`;ans=(A+B)*y;void x;}
      else{const y=ri(2,5+l),z=ri(2,9+l);q=`${y*z} ÷ ${y}`;ans=z;}
      const o=uniq(ans,()=>ans+ri(-9,9)||ans+10,4);
      return {q:`<div class="hm-seq">${q} = ?</div>`,o,a:o.indexOf(String(ans))};
    }
    if(cat==='verbal'){
      if(v===0||v===4){const len=v===4?[7,8,9,9,10,10][l-1]:[5,5,6,6,7,7][l-1],pool=WL.filter(w=>w.length===len||w.length===len+1);const w=pick(pool.length?pool:WL);let sc=w;for(let i=0;i<9&&sc===w;i++)sc=shuf(w.split('')).join('');
        const o=uniq(w,()=>pick(WL.filter(x=>x[0]!==w[0]||x.length===w.length)),4);return {q:`<div class="hm-seq">${sc.toUpperCase()}</div><p>Which word is hidden in these letters?</p>`,o,a:o.indexOf(w)};}
      if(v===1||v===2){const T=v===1?ANT:SYN,p=pick(T);const o=uniq(p[1],()=>pick(T)[1],4);return {q:`<div class="hm-seq">${p[0]}</div><p>${v===1?'Choose the opposite.':'Choose the closest meaning.'}</p>`,o,a:o.indexOf(p[1])};}
      const g=pick(ODD),[main,oth]=Math.random()<.5?g:[g[1],g[0]],odd=pick(oth),set=shuf(main.slice(0,3).concat(odd));
      return {q:`<p>Which one does not belong?</p>`,o:set,a:set.indexOf(odd)};
    }
    if(cat==='spatial'){
      const sy=['▲','●','■','◆','★'],tg=sy[v],oth=sy.filter(x=>x!==tg),n=24+l*6;let cnt=0,cells=[];
      for(let i=0;i<n;i++){if(Math.random()<.28){cells.push(tg);cnt++;}else cells.push(pick(oth));}
      const o=uniq(cnt,()=>cnt+ri(-3,3)||cnt+4,4);
      return {q:`<p>Count the ${tg}</p><div class="hm-sym">${cells.join(' ')}</div>`,o,a:o.indexOf(String(cnt)),lim:4+l*3};
    }
    if(cat==='memory'){
      const len=3+l+(v===4?2:0);let seq,fmt=x=>x.join(' '),mk;
      if(v===2){const L='BCDFGHJKLMNPRSTVWXZ'.split('');mk=()=>Array.from({length:len},()=>pick(L));}
      else if(v===3){mk=()=>Array.from({length:Math.min(len,6)},()=>pick(WL));fmt=x=>x.join(', ');}
      else mk=()=>Array.from({length:len},()=>ri(0,9));
      seq=mk();const target=v===1?seq.slice().reverse():seq;
      const o=uniq(fmt(target),()=>{const t=target.slice();const i=ri(0,t.length-1);t[i]=v===3?pick(WL):v===2?pick('BCDFGHJKLMNPRSTVWXZ'.split('')):(t[i]+ri(1,8))%10;if(Math.random()<.5&&t.length>2){const j=ri(0,t.length-2);[t[j],t[j+1]]=[t[j+1],t[j]];}return fmt(t);},4);
      return {show:{html:`<div class="hm-seq">${fmt(seq)}</div>`,ms:700+len*(v===4?420:520)},q:`<p>${v===1?'Which is the sequence in reverse order?':'Which sequence did you see?'}</p>`,o,a:o.indexOf(fmt(target))};
    }
    const cnt=v===4?6:4,lim=Math.max(2,6.5-l*.7-(v===4?1:0));let nums=[],ans;
    if(v===0||v===1||v===4){const base=ri(10,60+l*20);nums=Array.from(new Set(Array.from({length:cnt*3},()=>base+ri(0,60+l*10)))).slice(0,cnt);ans=v===1?Math.min(...nums):Math.max(...nums);}
    else if(v===2){const m=ri(2,30)*3;const w=new Set([m]);while(w.size<4){const x=ri(10,99);if(x%3)w.add(x);}nums=Array.from(w);ans=m;}
    else{const e=ri(5,49)*2;const w=new Set([e]);while(w.size<4)w.add(ri(5,49)*2+1);nums=Array.from(w);ans=e;}
    const o=shuf(nums).map(String);
    return {q:`<p>${v===0||v===4?'Largest':v===1?'Smallest':v===2?'Divisible by three':'The even one'}</p>`,o,a:o.indexOf(String(ans)),lim};
  }

  /* ---------- session ---------- */
  let tm=null;
  function startEx(id){
    const [cat,v,l]=id.split('-'),ci=CATS.findIndex(c=>c.id===cat);
    if(!paid()&&+l>1)return trialBox();
    sess={id,ci,v:+v,l:+l,i:0,ok:0,rs:null,ph:'q'};nextRound();
  }
  function nextRound(){
    clearTimeout(tm);
    if(sess.i>=ROUNDS)return finishEx();
    sess.rs=round(sess.ci,sess.v,sess.l);sess.ph=sess.rs.show?'show':'q';sess.pick=null;
    draw();
    if(sess.rs.show)tm=setTimeout(()=>{sess.ph='q';draw();limit();},sess.rs.show.ms);else limit();
  }
  function limit(){clearTimeout(tm);const L=sess.rs&&sess.rs.lim;if(!L)return;const el=root.querySelector('.hm-timer b');if(el){el.style.transition='none';el.style.width='100%';void el.offsetWidth;el.style.transition='width '+L+'s linear';el.style.width='0%';}tm=setTimeout(()=>answer(-1),L*1000);}
  function answer(k){
    if(!sess||sess.pick!=null)return;clearTimeout(tm);sess.pick=k;if(k===sess.rs.a)sess.ok++;draw();
    tm=setTimeout(()=>{sess.i++;nextRound();},650);
  }
  function finishEx(){
    const e=P.ex[sess.id]||{best:0,plays:0};e.best=Math.max(e.best,sess.ok);e.plays++;P.ex[sess.id]=e;mark();pushP();
    sess.ph='end';draw();
  }
  function sessView(){
    const cat=CATS[sess.ci],name=cat.drills[sess.v][0];
    if(sess.ph==='end'){const p=sess.ok/ROUNDS,msg=p>=.875?'Excellent.':p>=.625?'Solid work.':'Keep practising. Each run gets easier.';
      return `<div class="hm-play end"><div class="hm-k">${E(cat.name)} · ${E(name)} · level ${sess.l}</div><div class="hm-big">${sess.ok}/${ROUNDS}</div><p class="hm-lead">${msg}</p>
        <div class="hm-row"><button class="btn btn-primary" type="button" data-h="again">Play again</button>${sess.l<LEVELS&&p>=.75?`<button class="btn btn-line" type="button" data-h="levelup">Next level</button>`:''}<button class="btn btn-line" type="button" data-h="exit">Back to training</button></div></div>`;}
    const rs=sess.rs;
    return `<div class="hm-play"><div class="hm-play-top"><button class="hm-back" type="button" data-h="exit">${icon.back}Exit</button><span>${E(name)} · level ${sess.l}</span><span>${sess.i+1} / ${ROUNDS}</span></div>
      <div class="hm-prog"><i><b style="width:${sess.i/ROUNDS*100}%"></b></i></div>
      ${sess.ph==='show'?`<div class="hm-stage"><p>Remember this</p>${rs.show.html}</div>`:`<div class="hm-stage">${rs.q}${rs.lim?'<div class="hm-timer"><b></b></div>':''}</div>
      <div class="hm-opts">${rs.o.map((o,k)=>`<button type="button" data-pick="${k}" class="${sess.pick==null?'':k===rs.a?'right':k===sess.pick?'wrong':''}"${sess.pick!=null?' disabled':''}>${E(o)}</button>`).join('')}</div>`}</div>`;
  }

  /* ---------- learning content ---------- */
  const CL=()=>{try{return (window.BF_LANG&&BF_LANG.get())||'en';}catch(e){return 'en';}},CS={},CONTENT_LANGS={es:1,pt:1,fr:1,de:1,it:1,tr:1,pl:1};
  const CC=new Proxy({},{get:(_,k)=>CS[CL()+':'+k],set:(_,k,v)=>{CS[CL()+':'+k]=v;return true;}});
  const loadJ=key=>{const L=CL();if(CC[key]!==undefined)return Promise.resolve(CC[key]);const url=(CONTENT_LANGS[L]?'content/'+L+'/':'content/')+key+'.json?v=20261168';const store=v=>{CS[L+':'+key]=v;return v;};return fetch(url).then(r=>r.ok?r.json():Promise.reject()).catch(()=>L==='en'?null:fetch('content/'+key+'.json?v=20261168').then(r=>r.ok?r.json():null).catch(()=>null)).then(store);};
  const modOf=(c,i)=>{const m=c.mods.length,per=Math.floor(c.lessons/m);return i>=per*(m-1)?m-1:Math.floor(i/per);};
  const ltitle=(c,i,fallback,k)=>{const J=CC[c.id],L=J&&J.lessons&&J.lessons[i];return L&&L.t?L.t:`${fallback} · part ${k+1}`;};
  const PAL={a:'#121212',b:'#3b6fd4',c:'#d98a1f'};
  const ICO={
    bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    brain:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>',
    chart:'<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
    link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    spark:'<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
    book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5"/>',
    puzzle:'<path d="M10 4h4v3a2 2 0 1 1 0 4h3v4h-3a2 2 0 1 0-4 0H6v-4h3a2 2 0 1 0 0-4h1z"/>',
    heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>'
  };
  const ico=n=>`<svg viewBox="0 0 24 24" class="hm-ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICO[n]||ICO.bulb}</svg>`;
  function tok(s){
    s=String(s);
    if(s[0]==='@'){const [n,c]=s.slice(1).split(':'),f=PAL[c]||PAL.a;
      const p={circle:`<circle cx="14" cy="14" r="10" fill="${f}"/>`,square:`<rect x="4" y="4" width="20" height="20" rx="2" fill="${f}"/>`,triangle:`<path d="M14 3l11 20H3z" fill="${f}"/>`,diamond:`<path d="M14 2l11 12-11 12L3 14z" fill="${f}"/>`,star:`<path d="M14 2l3.5 7.6 8.3.9-6.2 5.6 1.8 8.2L14 20l-7.4 4.3 1.8-8.2L2.2 10.5l8.3-.9z" fill="${f}"/>`}[n];
      if(p)return `<svg viewBox="0 0 28 28" class="hm-shape" role="img" aria-label="${E(n)}">${p}</svg>`;}
    return E(s);
  }
  function fig(f){
    if(!f||!f.type)return '';
    const ttl=f.title?`<div class="hm-ft">${E(f.title)}</div>`:'',nt=f.note?`<p class="hm-fn">${E(f.note)}</p>`:'';let b='';
    if(f.type==='seq')b=`<div class="hm-fseq">${(f.items||[]).map((x,i)=>`<span class="hm-fi${x==='?'?' q':''}" style="--d:${(i*.28).toFixed(2)}s">${tok(x)}</span>`).join('')}</div>`;
    else if(f.type==='grid'){const R=f.rows||[],cols=Math.max(1,...R.map(r=>r.length));
      b=`<div class="hm-fgrid" style="--c:${cols}">${R.map((r,ri)=>r.map((x,ci)=>`<span class="${f.hi&&f.hi[0]===ri&&f.hi[1]===ci?'hi':''}${x==='?'?' q':''}" style="--d:${((ri*cols+ci)*.12).toFixed(2)}s">${tok(x)}</span>`).join('')).join('')}</div>`;}
    else if(f.type==='bars'){const D=f.data||[],mx=Math.max(1,...D.map(d=>+d[1]||0));
      b=`<div class="hm-fbars">${D.map((d,i)=>`<div class="hm-fbar"><span>${E(d[0])}</span><i><b style="--w:${((+d[1]||0)/mx*100).toFixed(1)}%;--d:${(i*.15).toFixed(2)}s"></b></i><em>${E(d[1])}</em></div>`).join('')}</div>`;}
    else if(f.type==='steps')b=`<ol class="hm-fsteps">${(f.steps||[]).map((x,i)=>`<li style="--d:${(i*.3).toFixed(2)}s"><b>${i+1}</b>${E(x)}</li>`).join('')}</ol>`;
    else if(f.type==='compare'){const side=s=>s?`<div class="hm-fcmp"><h4>${E(s.h)}</h4><ul>${(s.pts||[]).map(p=>`<li>${E(p)}</li>`).join('')}</ul></div>`:'';b=`<div class="hm-fcmps">${side(f.left)}${side(f.right)}</div>`;}
    else if(f.type==='cycle'){const N=f.nodes||[],n=N.length||1;
      const pts=N.map((t,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return `<g class="hm-fnode" style="--d:${(i*.3).toFixed(2)}s"><rect x="${(150+100*Math.cos(a)-44).toFixed(1)}" y="${(110+68*Math.sin(a)-14).toFixed(1)}" width="88" height="28" rx="14"/><text x="${(150+100*Math.cos(a)).toFixed(1)}" y="${(110+68*Math.sin(a)+4.5).toFixed(1)}" text-anchor="middle">${E(t)}</text></g>`;}).join('');
      b=`<svg viewBox="0 0 300 220" class="hm-fcyc" role="img" aria-label="${E(f.title||'Cycle')}"><ellipse class="hm-ring" cx="150" cy="110" rx="100" ry="68" fill="none"/>${pts}</svg>`;}
    return b?`<figure class="hm-fig">${ttl}${b}${nt}</figure>`:'';
  }
  const QS={};let lq={};
  function qBlock(q,key){
    key=(course||'')+'|'+(les==null?'':les)+'|'+(gd||'')+'|'+key;
    QS[key]=q;const p=lq[key];
    return `<div class="hm-q" data-qk="${key}"><p class="hm-qq">${E(q.q)}</p><div class="hm-opts">${(q.o||[]).map((o,k)=>`<button type="button" data-qa="${key}" data-k="${k}" class="${p==null?'':k===q.a?'right':k===p?'wrong':''}"${p!=null?' disabled':''}>${E(o)}</button>`).join('')}</div>${p!=null?`<p class="hm-why"><b>${p===q.a?'Correct.':'Not quite.'}</b> ${E(q.why)}</p>`:''}</div>`;
  }
  const pdfBtn=(file,mem,label)=>`<button class="btn btn-line btn-sm" type="button" data-pdf="${file}"${mem?' data-mem="1"':''}>${label}</button>`;
  let les=null;
  function lessonView(){
    const c=COURSES.find(x=>x.id===course),i=les,J=CC[c.id],L=J&&J.lessons&&J.lessons[i],mi=modOf(c,i),m=c.mods[mi];
    const back=`<button class="hm-back" type="button" data-h="lback">${icon.back}${E(c.name)}</button>`;
    if(!L)return `${back}<h1 class="hm-h1">Lesson ${i+1}</h1><p class="hm-lead">${J===undefined?'Loading the lesson...':'This lesson could not load. Check your connection and try again.'}</p>`;
    const dn=new Set(P.lessons[c.id]||[]).has(i),pd=paid(),nx=i+1<c.lessons&&(pd||i+1<FREE_LESSONS);
    return `${back}<div class="hm-ctag">Module ${mi+1}: ${E(m[0])}</div><h1 class="hm-h1">${E(L.t)}</h1><div class="hm-meta">Lesson ${i+1} of ${c.lessons} · 4–5 min</div>
      <p class="hm-lead">${E(L.intro)}</p>${fig(L.fig)}
      <div class="hm-lcards">${(L.cards||[]).map((k,n)=>`<article class="hm-lc" style="--d:${(n*.12).toFixed(2)}s">${ico(k.i)}<h3>${E(k.h)}</h3><p>${E(k.b)}</p></article>`).join('')}</div>
      <section class="hm-card"><div class="hm-k">Worked example</div>${qBlock(L.ex,'ex')}</section>
      <section class="hm-card hm-tipc">${ico('spark')}<div><div class="hm-k">Remember</div><p>${E(L.tip)}</p></div></section>
      <section class="hm-card"><div class="hm-k">Check yourself</div>${(L.quiz||[]).map((q,n)=>qBlock(q,String(n))).join('')}</section>
      <div class="hm-row hm-lnav">${i>0?'<button class="btn btn-line" type="button" data-h="lprev">Previous</button>':''}<button class="btn btn-primary" type="button" data-h="ldone">${dn?(nx?'Next lesson':'Back to course'):(nx?'Complete and continue':'Complete lesson')}</button>${pdfBtn(c.id,true,'Study guide (PDF)')}</div>`;
  }
  function openLesson(i){
    const c=COURSES.find(x=>x.id===course);if(!paid()&&i>=FREE_LESSONS)return trialBox();
    les=i;lq={};P.last=c.id;pushP();draw();root.scrollTop=0;
    if(CC[c.id]===undefined)loadJ(c.id).then(()=>{if(les===i)draw();});
  }
  function complete(i){
    const c=COURSES.find(x=>x.id===course),set=new Set(P.lessons[c.id]||[]);
    if(!set.has(i)){set.add(i);P.last=c.id;mark();P.lessons[c.id]=Array.from(set).sort((a,b)=>a-b);pushP();
      toast=set.size>=c.lessons?'Course complete. Well done.':'Lesson complete';clearTimeout(flash.t);flash.t=setTimeout(()=>{toast=null;const el=root.querySelector('.hm-toast');if(el)el.remove();},2200);}
  }
  let gd=null;
  function guideView(){
    const cat=CATS.find(x=>x.id===gd),G=CC['train-'+gd];
    const back=`<button class="hm-back" type="button" data-h="gback">${icon.back}Training</button>`;
    if(!G)return `${back}<h1 class="hm-h1">${E(cat.name)} guide</h1><p class="hm-lead">${G===undefined?'Loading the guide...':'This guide could not load. Check your connection and try again.'}</p>`;
    return `${back}<div class="hm-ctag">Training guide</div><h1 class="hm-h1">${E(cat.name)}</h1><p class="hm-lead">${E(G.overview)}</p>
      <div class="hm-row">${pdfBtn('train-'+gd,false,'Download guide (PDF)')}<button class="btn btn-primary btn-sm" type="button" data-h="gplay">Start training</button></div>
      ${fig(G.fig)}
      <section class="hm-sec"><div class="hm-head"><h2>Strategy</h2></div><div class="hm-lcards four">${(G.strategy||[]).map((k,n)=>`<article class="hm-lc" style="--d:${(n*.12).toFixed(2)}s">${ico(k.i)}<h3>${E(k.h)}</h3><p>${E(k.b)}</p></article>`).join('')}</div></section>
      <section class="hm-sec"><div class="hm-head"><h2>The five drills</h2></div>${(G.drills||[]).map((d,v)=>`<article class="hm-card hm-gd"><h3>${E(d.name)}</h3><p>${E(d.how)}</p><div class="hm-gtips"><div><b>Tip</b><span>${E(d.tip)}</span></div><div><b>Watch out</b><span>${E(d.mistake)}</span></div></div>${d.ex?qBlock(d.ex,'g'+v):''}</article>`).join('')}</section>
      <div class="hm-grid"><section class="hm-card"><div class="hm-k">The six levels</div><ol class="hm-ol">${(G.levels||[]).map(x=>`<li>${E(x)}</li>`).join('')}</ol></section>
      <section class="hm-card"><div class="hm-k">Five-day routine</div><ol class="hm-ol">${(G.routine||[]).map(x=>`<li>${E(x)}</li>`).join('')}</ol></section></div>`;
  }
  function openGuide(id){gd=id;lq={};draw();root.scrollTop=0;if(CC['train-'+id]===undefined)loadJ('train-'+id).then(()=>{if(gd===id)draw();});}

  /* ---------- settings ---------- */
  let box=null;
  function trialBox(){box='trial';draw();}
  function modal(){
    if(box==='trial')return `<div class="hm-modal" data-h="closebox"><div class="hm-mbox" role="dialog" aria-label="Membership"><h3>Full access: $0.99 today</h3>
      <p>Full access to ${COURSES.length} courses (${TOT_L} lessons), ${TOT_EX} exercises, retests and progress tracking.</p>
      <p><b>Your plan then renews at $4.99 every week</b> until you cancel. Cancel any time in Settings, and you keep access until the paid period ends.</p>
      <div class="hm-row"><button class="btn btn-primary" type="button" data-h="startTrial">Continue</button><button class="btn btn-line" type="button" data-h="closebox">Not now</button></div></div></div>`;
    if(box==='cancel')return `<div class="hm-modal" data-h="closebox"><div class="hm-mbox" role="dialog" aria-label="Cancel membership"><h3>Cancel your membership?</h3><p>You will not be charged again. You keep access until the end of the period you have paid for.</p>
      <div class="hm-row"><button class="btn btn-primary" type="button" data-h="doCancel">Cancel membership</button><button class="btn btn-line" type="button" data-h="closebox">Keep it</button></div></div></div>`;
    return '';
  }
  function settings(){
    const x=u(),d=S().local(),pd=!!d.paid,mode=S().mode();
    const renew=d.since?new Date(new Date(d.since).getTime()+7*864e5):null;
    return `<div class="hm-hello"><h1>Settings</h1><p>Your account and membership.</p></div>
      <div class="hm-grid"><section class="hm-card"><div class="hm-k">Account</div>
        <dl class="hm-dl"><dt>Name</dt><dd>${E(x.name||'Not set')}</dd><dt>Email</dt><dd>${E(x.email)}</dd><dt>Sign-in</dt><dd>${mode==='demo'?'Demo account, stored on this device':'Email and password'}</dd></dl>
        <div class="hm-row">${mode==='live'?'<button class="btn btn-line btn-sm" type="button" data-h="manage">Change name, email or password</button>':'<button class="btn btn-line btn-sm" type="button" data-h="real">Create a real account</button>'}</div></section>
        <section class="hm-card"><div class="hm-k">Membership</div>
        ${pd?`<p class="hm-status on">Active</p><p class="hm-note">Full access to every course and exercise.${renew?` Current period ends ${E(renew.toLocaleDateString((window.BF_LOC?BF_LOC():'en-GB'),{day:'numeric',month:'long'}))}, then $4.99 every week until cancelled.`:''}</p><div class="hm-row"><button class="btn btn-line btn-sm" type="button" data-h="cancel">Cancel membership</button></div>`
        :`<p class="hm-status">Free</p><p class="hm-note">Your results and the first lessons are free. A membership unlocks everything: $0.99 today, then $4.99 every week until you cancel.</p><div class="hm-row"><button class="btn btn-primary btn-sm" type="button" data-h="trial">Get full access</button></div>`}</section></div>
      <section class="hm-card"><div class="hm-k">Your data</div><p class="hm-note">${mode==='live'?'Results and progress are saved to your account.':'Results and progress are saved in this browser.'} You can delete your account and everything in it at any time.</p>
        <div class="hm-row">${mode==='live'?'<button class="btn btn-line btn-sm" type="button" data-h="manage">Delete account</button>':''}<button class="btn btn-line btn-sm" type="button" data-h="logout">${mode==='live'?'Log out':'Leave demo'}</button></div></section>`;
  }

  /* ---------- render + events ---------- */
  function draw(){
    const keep=root.querySelector('.hm-main'),st0=keep?keep.scrollTop:0,wy=root.scrollTop;
    let inner;
    if(sess)inner=sessView();else if(tab==='courses'&&course&&les!=null)inner=lessonView();else if(tab==='training'&&gd)inner=guideView();else if(tab==='courses'&&course)inner=courseView();else inner=({overview,courses,training,settings})[tab]();
    root.innerHTML=chrome(inner)+modal();root.scrollTop=wy;
    if(window.BF_MODAL){if(box){const mb=root.querySelector('.hm-mbox');BF_MODAL.open(mb,{key:'hmbox'});}else BF_MODAL.release('hmbox');}
    if(sess&&sess.ph==='q')limit();
  }
  function go(t){lq={};tab=t;course=null;les=null;gd=null;sess=null;clearTimeout(tm);draw();root.scrollTop=0;}
  async function refresh(){RES=await S().results();if(root.classList.contains('on'))draw();}
  function open(t){
    if(t)tab=t;root.hidden=false;root.classList.add('on');document.documentElement.classList.add('hm-lock');
    P=ls.get('bf_prog',P);draw();root.scrollTop=0;refresh();pullP();if(window.BF_MODAL)BF_MODAL.open(root,{key:'home'});
  }
  function close(){if(window.BF_MODAL){BF_MODAL.release('hmbox');BF_MODAL.release('home');}lq={};clearTimeout(tm);sess=null;course=null;les=null;gd=null;box=null;root.classList.remove('on');root.hidden=true;document.documentElement.classList.remove('hm-lock');}
  root.addEventListener('click',e=>{
    const t=e.target.closest('[data-tab],[data-h],[data-course],[data-les],[data-cf],[data-tf],[data-ex],[data-pick],[data-qa],[data-pdf],[data-guide]');
    if(!t){return;}
    if(t.dataset.tab)return go(t.dataset.tab);
    if(t.dataset.cf){cf=t.dataset.cf;return draw();}
    if(t.dataset.tf){tf=t.dataset.tf;return draw();}
    if(t.dataset.course){tab='courses';course=t.dataset.course;draw();root.scrollTop=0;return;}
    if(t.dataset.les!=null)return openLesson(+t.dataset.les);
    if(t.dataset.guide)return openGuide(t.dataset.guide);
    if(t.dataset.qa){lq[t.dataset.qa]=+t.dataset.k;const y=root.scrollTop;draw();root.scrollTop=y;return;}
    if(t.dataset.pdf){if(t.dataset.mem&&!paid())return trialBox();const a=document.createElement('a');a.href='pdf/'+t.dataset.pdf+'.pdf';a.download='neurometric-'+t.dataset.pdf+'.pdf';document.body.appendChild(a);a.click();a.remove();return;}
    if(t.dataset.ex)return startEx(t.dataset.ex);
    if(t.dataset.pick!=null)return answer(+t.dataset.pick);
    const h=t.dataset.h;
    if(h==='closebox'){if(e.target.closest('.hm-mbox')&&!t.classList.contains('btn'))return;box=null;return draw();}
    if(h==='site')return close();
    if(h==='back'){course=null;les=null;return draw();}
    if(h==='lback'){les=null;return draw();}
    if(h==='lprev'){return openLesson(les-1);}
    if(h==='ldone'){const c=COURSES.find(x=>x.id===course),i=les,was=new Set(P.lessons[c.id]||[]).has(i);complete(i);if(i+1<c.lessons&&(paid()||i+1<FREE_LESSONS))return openLesson(i+1);les=null;draw();root.scrollTop=0;return;}
    if(h==='gback'){gd=null;return draw();}
    if(h==='gplay'){tf=gd;gd=null;draw();root.scrollTop=0;return;}
    if(h==='exit'){clearTimeout(tm);sess=null;return draw();}
    if(h==='again')return startEx(sess.id);
    if(h==='levelup'){const p=sess.id.split('-');p[2]=+p[2]+1;return startEx(p.join('-'));}
    if(h==='trial')return trialBox();
    if(h==='startTrial'){const d=S().local();d.paid=true;d.since=new Date().toISOString();S().saveLocal(d);box=null;toast='Membership active. Everything is unlocked.';draw();setTimeout(()=>{toast=null;const el=root.querySelector('.hm-toast');if(el)el.remove();},2600);return;}
    if(h==='cancel'){box='cancel';return draw();}
    if(h==='doCancel'){const d=S().local();d.paid=false;delete d.since;S().saveLocal(d);box=null;toast='Membership cancelled. You will not be charged again.';draw();setTimeout(()=>{toast=null;const el=root.querySelector('.hm-toast');if(el)el.remove();},2800);return;}
    if(h==='retake'){close();const b=document.querySelector('.js-start');if(b)b.click();return;}
    if(h==='cert'){close();location.hash='#cert';const b=document.querySelector('[data-cert],.js-cert');if(b)b.click();return;}
    if(h==='manage'){close();window.BF_AUTH&&window.BF_AUTH.manage&&window.BF_AUTH.manage();return;}
    if(h==='real'){close();window.BF_AUTH&&window.BF_AUTH.signup&&window.BF_AUTH.signup();return;}
    if(h==='logout'){const A=window.BF_AUTH;close();A&&A.logout&&A.logout();return;}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('on')&&!sess&&!box)close();else if(e.key==='Escape'&&box){box=null;draw();}});
  function relang(){if(!root||!root.classList.contains('on'))return;const ks=[];try{if(course)ks.push(course);if(gd)ks.push('train-'+gd);}catch(e){}Promise.all(ks.map(loadJ)).then(()=>{try{draw();}catch(e){}});try{draw();}catch(e){}}
  window.BF_HOME={open,close,go,relang};
})();

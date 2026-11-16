/* After the last question: calculating screen, engagement pop-ups, email capture, checkout, then results. */
(function(){
  const E=window.BF_E;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const ls={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};

  /* ---------- storage: signed-in account, demo account, or this browser only ---------- */
  const DEMO={email:'demo@neurometric.app',name:'Demo user'};
  const S=window.BF_STORE={
    demoUser(){return ls.get('bf_demo',null);},
    startDemo(){ls.set('bf_demo',DEMO);return DEMO;},
    endDemo(){try{localStorage.removeItem('bf_demo');}catch(e){}},
    user(){const a=window.BF_AUTH;const u=a&&a.user&&a.user();return u||S.demoUser();},
    mode(){const a=window.BF_AUTH;return a&&a.user&&a.user()?'live':S.demoUser()?'demo':'guest';},
    local(){return ls.get('bf_data',{results:[],leads:[],paid:false});},
    saveLocal(d){ls.set('bf_data',d);},
    async saveLead(email){
      const d=S.local();if(!d.leads.includes(email))d.leads.push(email);S.saveLocal(d);
      const a=window.BF_AUTH,sb=a&&a.sb&&a.sb();
      if(sb){try{await sb.rpc('capture_lead',{p_email:email});}catch(e){}}
    },
    async saveResult(r){
      const d=S.local();d.results.unshift({...r,at:new Date().toISOString()});d.results=d.results.slice(0,20);S.saveLocal(d);
      const a=window.BF_AUTH,sb=a&&a.sb&&a.sb();
      if(sb&&a.user&&a.user()){let ok=false;for(let i=0;i<2&&!ok;i++){try{const {error}=await sb.rpc('save_result',{p_score:r.score,p_items:r.items,p_raw:r.raw,p_domains:r.domains});ok=!error;}catch(e){}}
        if(!ok){const t=document.createElement('div');t.setAttribute('role','status');t.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:92vw;padding:12px 16px;border-radius:10px;background:#1c1c1c;color:#fff;font:500 14px/1.4 system-ui,sans-serif;z-index:9999';t.textContent='We could not save this result to your account. It is kept on this device.';document.body.appendChild(t);setTimeout(()=>t.remove(),8000);}}
    },
    async results(){
      const a=window.BF_AUTH,sb=a&&a.sb&&a.sb();
      if(sb&&a.user&&a.user()){
        try{const {data}=await sb.from('test_results').select('score,items,raw,created_at').order('created_at',{ascending:false}).limit(20);
          if(data)return data.map(x=>({score:x.score,items:x.items,raw:x.raw,at:x.created_at}));}catch(e){}
      }
      return S.local().results;
    },
    unlock(){const d=S.local();d.paid=true;S.saveLocal(d);}
  };

  /* ---------- helpers ---------- */
  function calc(){
    const right=ITEMS.map(it=>isRight(it,st.ans[it.idx]));const raw=right.filter(Boolean).length;const iq=BF_IQ(raw,ITEMS.length);
    const domains=DOMAINS.map(d=>{const its=ITEMS.filter(it=>it.d===d.id);return {id:d.id,ok:its.filter(it=>right[it.idx]).length,n:its.length};});
    return {score:iq,raw,items:ITEMS.length,domains};
  }
  function halt(){
    st.done=true;clearInterval(clockTimer);clearTimeout(subTimer);clearInterval(subTimer);clearTimeout(autoTimer);
    ($('finishBtn')||{}).hidden=true;pips(true);
  }
  function ov(html){
    close();const o=document.createElement('div');o.className='fq-ov';o.innerHTML=`<div class="fq" role="dialog" aria-modal="true">${html}</div>`;
    $('app').appendChild(o);document.documentElement.classList.add('cert-lock');
    const b=o.querySelector('button');if(b)b.focus();if(window.BF_MODAL)BF_MODAL.open(o.querySelector('.fq'),{key:'fq',focus:false});return o;
  }
  function close(){if(window.BF_MODAL)BF_MODAL.release('fq');document.querySelectorAll('.fq-ov').forEach(n=>n.remove());document.documentElement.classList.remove('cert-lock');}
  const alive=()=>st&&st.flow&&document.getElementById('rf');

  /* ---------- 1. calculating ---------- */
  const STAGES=["Patterns","Logic","Numbers","Language","Memory","Speed"],SIC={"pat":"<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/><circle cx=\"17.5\" cy=\"17.5\" r=\"3.5\"/>","log":"<circle cx=\"6\" cy=\"6\" r=\"2.5\"/><circle cx=\"18\" cy=\"6\" r=\"2.5\"/><circle cx=\"12\" cy=\"18\" r=\"2.5\"/><path d=\"M8 7l3 9M16 7l-3 9\"/>","num":"<path d=\"M4 9h16M4 15h16M10 3L8 21M16 3l-2 18\"/>","lan":"<path d=\"M4 5h16v10H9l-5 4z\"/><path d=\"M8 9h8M8 12h5\"/>","mem":"<path d=\"M12 3a5 5 0 0 0-5 5c0 1.5.6 2.4 1.5 3.4V14h7v-2.6c.9-1 1.5-1.9 1.5-3.4a5 5 0 0 0-5-5z\"/><path d=\"M9.5 18h5M10.5 21h3\"/>","spd":"<path d=\"M13 2L5 14h6l-1 8 8-12h-6z\"/>"},SK=["pat","log","num","lan","mem","spd"],MAT=[0,14,30,48,66,82];

  function analyze(){
    if(st.flow)return;st.flow=1;halt();$('tCount').textContent='Calculating';
    const R=2*Math.PI*54,Lx=k=>(window.BF_LANG&&BF_LANG.x(k))||'';
    $('tMain').innerHTML=`<div class="an" id="an"><section class="an-card">
      <div class="an-h"><h2>Calculating your <em>IQ score…</em></h2><p>Hang tight while we compare your answers across six skill areas.</p></div>
      <div class="ringw"><span class="orb" aria-hidden="true"></span><div class="ring" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rt" cx="60" cy="60" r="54"/><circle class="rf" id="rf" cx="60" cy="60" r="54" stroke-dasharray="${R}" stroke-dashoffset="${R}"/></svg><b id="rp">0%</b></div></div>
      <p class="an-st" aria-hidden="true"><i></i><span id="anSt">${STAGES[0]}</span></p>
      <ul class="an-m">${STAGES.map((m,i)=>`<li data-i="${i}"><svg viewBox="0 0 24 24" aria-hidden="true">${SIC[SK[i]]}</svg><span>${m}</span><em class="bar"><i></i></em><u class="tick" aria-hidden="true"></u></li>`).join('')}</ul>
      <p class="an-fact" id="anFact" aria-live="off"></p></section></div>`;
    let fi=Math.floor(Math.random()*FACTS.length);const fe=$('anFact');
    const paintF=()=>{fe.classList.remove('in');void fe.offsetWidth;fe.innerHTML='<b>'+E(Lx('didYouKnow')||'Did you know?')+'</b> '+E((window.BF_LANG&&BF_LANG.fact(fi))||FACTS[fi]);fe.classList.add('in');};
    paintF();
    const rt=setInterval(()=>{if(!alive())return clearInterval(rt);fi=(fi+1)%FACTS.length;paintF();},5200);

    const mem=ITEMS.find(i=>i.type==='memory'&&i.mode==='forward');
    const real=mem?mem.digits:'58294';
    const fake=shuffle(real.split('')).join('');const decoyN=fake===real?real.split('').reverse().join(''):fake;
    const decoyW=shuffle(WORDS.filter(w=>w!==st.word))[0];
    const two=(title,a,b,fn)=>{const o=ov(`<span class="fq-bar"></span><h3>${title}</h3><div class="fq-opts"><button class="fq-o" data-v="0">${E(a)}</button><button class="fq-o" data-v="1">${E(b)}</button></div>`);
      o.querySelectorAll('.fq-o').forEach(x=>x.onclick=()=>{fn(+x.dataset.v);close();paused=false;});};
    const STOPS=[
      [83,()=>{two('Have you ever taken an IQ test?','Yes','No',v=>{st.tookIQ=!v;});}],
      [90,()=>{const flip=Math.random()<.5;const A=flip?st.word:decoyW,B=flip?decoyW:st.word;two('The word you memorized was…',A,B,v=>{st.recallWord=(v?B:A)===st.word;});}]
    ];
    let p=0,paused=false,si=0;
    const draw=()=>{const v=Math.min(100,p);$('rf').style.strokeDashoffset=R*(1-v/100);$('rp').textContent=Math.floor(v)+'%';$('ring').setAttribute('aria-valuenow',Math.floor(v));
      document.querySelectorAll('.an-m li').forEach((li,i)=>{const lo=MAT[i],hi=i<5?MAT[i+1]:100,f=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));
        li.style.setProperty('--f',f);li.classList.toggle('on',f>=1);li.classList.toggle('cur',f>0&&f<1);});const ci=Math.min(5,MAT.filter(m=>v>=m).length-1);const se=$('anSt');if(se&&se.dataset.i!=ci){se.dataset.i=ci;se.textContent=STAGES[ci];}};
    const tick=()=>{
      if(!alive())return;
      if(!paused){
        p+=rnd(.25,1.9);
        if(si<STOPS.length&&p>=STOPS[si][0]){p=STOPS[si][0];paused=true;draw();const f=STOPS[si++][1];setTimeout(()=>{if(alive())f();},350);}
        else draw();
      }
      if(p>=100){draw();clearInterval(rt);setTimeout(()=>{if(alive())emailScreen();},700);return;}
      setTimeout(tick,paused?200:rnd(80,420));
    };
    draw();setTimeout(tick,500);window.scrollTo(0,0);
  }

  /* ---------- 2. email capture ---------- */
  function emailScreen(){
    close();$('tCount').textContent='Almost done';
    const u=S.user();const pre=u&&u.email&&u.email!==DEMO.email?u.email:(u?u.email:'');
    $('tMain').innerHTML=`<div class="em"><h2>Where should we send <em>your IQ certificate</em>?</h2>
      <p class="em-sub">Enter your email to unlock your complete analysis and personalised cognitive profile.</p>
      <form id="emF" novalidate><div class="em-f"><label for="emIn">Email</label><input id="emIn" type="email" autocomplete="email" inputmode="email" value="${E(pre)}" required></div>
      <p class="em-err" id="emErr" role="alert"></p>
      <p class="em-fine">Neurometric keeps your personal information confidential. By clicking “Continue” you acknowledge that you have read, understood and accepted our terms and privacy policy.</p>
      <button class="btn btn-primary em-go" type="submit">Continue</button></form></div>`;
    const inp=$('emIn');inp.focus();
    $('emF').onsubmit=async e=>{e.preventDefault();const v=inp.value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){$('emErr').textContent='Enter a valid email address.';inp.focus();return;}
      $('emErr').textContent='';st.email=v;const b=e.target.querySelector('button');b.disabled=true;b.textContent='Please wait…';
      const r=calc();st.result=r;
      await Promise.race([Promise.all([S.saveLead(v),S.saveResult(r)]),new Promise(ok=>setTimeout(ok,1200))]);
      checkout();};
    window.scrollTo(0,0);
  }

  /* ---------- 3. checkout ---------- */
  const SOLD=[['Ade***','her','126','ZA'],['Mar***','his','118','ES'],['Lin***','her','131','SG'],['Joh***','his','109','CA'],['Sam***','their','122','AU'],['Ola***','his','115','NG']];
  let sellT=null,offerT=null;
  function glimpse(){
    const r=st.result||calc();const ds=r.domains.filter(x=>x.n).map(x=>{const dm=DOMAINS.find(q=>q.id===x.id);return {id:x.id,name:dm?dm.name:x.id,f:x.ok/x.n};}).sort((a,b)=>b.f-a.f);
    if(!ds.length)return '';
    return `<section class="gl" aria-label="A glimpse of your profile"><p class="gl-k">A glimpse of your profile</p>
     <p class="gl-s"><span>&#9733; Strongest: ${E(ds[0].name)}</span></p>
     <div class="gl-b"><span>Your estimated IQ</span><b aria-hidden="true">1&#8226;&#8226;</b><i>Unlocks with your report</i></div>
     ${ds.slice(0,3).map((x,i)=>`<div class="gl-r c-${DCOL[x.id]}"><span>${E(x.name)}</span><div><i style="width:${Math.max(8,Math.round(x.f*100))}%"></i></div></div>`).join('')}
     <p class="gl-n">Based on your own answers. Exact scores and the full breakdown are in the report.</p></section>`;
  }
  /* Payment screen. With a Whop plan set (offers.js WHOP_PLAN) the card form is embedded on this page via Whop Elements,
     the same method as tradingascension. Otherwise the affiliate offer opens in a pop-out window (or this tab if blocked). */
  function whopEmbed(plan){
    let m=document.getElementById('bfEmbed');if(m)m.remove();
    m=document.createElement('div');m.id='bfEmbed';
    m.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(10,14,30,.72);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto';
    m.innerHTML='<div role="dialog" aria-label="Secure checkout" style="background:#fff;border-radius:14px;width:min(520px,100%);max-height:100%;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e5e7eb;font:600 15px system-ui,sans-serif;color:#111">Secure checkout<button id="bfEmbedX" type="button" aria-label="Close" style="border:0;background:none;font-size:24px;line-height:1;cursor:pointer">&times;</button></div>'+
      '<div id="bfWhopMount" style="min-height:22rem;padding:12px 16px"><p style="text-align:center;color:#555;font:14px system-ui,sans-serif;padding:2rem 0">Loading secure payment…</p></div>'+
      '<p style="text-align:center;font:12px system-ui,sans-serif;color:#777;margin:0 0 14px">Secure payment processed by Whop.</p></div>';
    document.body.appendChild(m);
    const x=()=>{m.remove();document.querySelectorAll('.co-b').forEach(b=>b.disabled=false);};
    document.getElementById('bfEmbedX').onclick=x;
    new Promise((res,rej)=>{
      if(window.WhopElements)return res();
      const sc=document.createElement('script');sc.src='https://cdn.whop.com/elements/amber/elements.js';sc.setAttribute('data-whop-elements','');
      sc.onload=()=>window.WhopElements?res():rej();sc.onerror=rej;document.head.appendChild(sc);
    }).then(()=>{
      const mount=document.getElementById('bfWhopMount');mount.innerHTML='';
      const c=window.WhopElements().checkout.create({
        plan:plan,metadata:{click_id:window.bfTrack.clickId},returnUrl:location.origin+location.pathname+'?checkout=return',
        onComplete:r=>{if(r&&r.result==='payment'){x();S.unlock();st.done=false;showResults();}}
      });
      c.create('checkout').mount(mount);
    }).catch(()=>{x();alert('Could not load the secure payment form. Please try again.');});
  }
  function embedCheckout(url){
    const plan=window.bfTrack&&window.bfTrack.whopPlan;
    if(plan){whopEmbed(plan);return;}
    const w=Math.min(520,screen.availWidth||520),h=Math.min(820,screen.availHeight||820);
    const win=window.open(url,'bfCheckout','popup=yes,width='+w+',height='+h+',left='+Math.max(0,((screen.availWidth||w)-w)/2)+',top=40');
    if(!win){location.href=url;return;}
    try{win.focus();}catch(e){}
    document.querySelectorAll('.co-b').forEach(b=>b.disabled=false);
  }
  function checkout(){
    close();$('tCount').textContent='Your score';clearInterval(sellT);clearInterval(offerT);
    const peer=(src,nm,iq)=>{const sc=(iq-100)/60;return `<div class="peer"><span class="pl">IQ ${iq}</span><div class="pc" style="aspect-ratio:${(3/(4*sc)).toFixed(3)}"><img src="${src}" alt="" loading="lazy"></div><span class="pn">${nm}</span></div>`;};
    const sold=k=>{const s=SOLD[k%SOLD.length];return `<span class="dotg"></span><b>${s[0]}</b> just bought ${s[1]} IQ score! <img class="where" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${[...s[3]].map(c=>(0x1f1e6+c.charCodeAt(0)-65).toString(16)).join('-')}.svg" alt="" width="20" height="20" draggable="false"> <a>IQ ${s[2]}</a>`;};
    let left=Math.max(60,Math.min(600,Math.round(ls.get('bf_offer',600))));
    $('tMain').innerHTML=`<div class="co">
      <div class="co-tick" id="coTick" aria-live="off">${sold(0)}</div>
      <div class="co-user"><span class="av">${E((st.email||'?')[0].toUpperCase())}</span><span>${E(st.email||'')}</span></div>
      <p class="co-offer">IQ score only <b>$0.99</b>! <span>Offer ends in</span> <i id="coT">10:00</i></p>
      <h2 class="co-h">Congratulations! Your score is ready!</h2>
      ${glimpse()}
      <div class="gate"><div class="g-grid">
       <div class="g-l"><div class="g-card">
        <div class="peers">${peer('figs/einstein.webp','Albert Einstein',160)}<div class="peer you"><span class="pl">You</span><div class="pc" style="aspect-ratio:${(3/(4*1.25)).toFixed(3)}"><b>???</b><svg viewBox="0 0 100 110" aria-hidden="true"><circle cx="50" cy="34" r="19"/><path d="M8 110c0-30 14-46 42-46s42 16 42 46z"/></svg></div><span class="pn">Your score</span></div>${peer('figs/newton.webp','Isaac Newton',190)}</div>
        <div class="g-stats"><div><b>107</b><span>Average IQ today</span></div><div><b id="coN">18,397</b><span>Tests taken today</span></div><div><b>6</b><span>Skill areas measured</span></div></div>
       </div></div>
       <div class="g-r"><p class="g-k">Your summary</p>
        <ul class="sum"><li><span>Your IQ score &amp; certificate</span><i class="pr">$0.99</i></li><li><span>Detailed cognitive report</span><i>Included</i></li><li><span>Global &amp; country ranking</span><i>Included</i></li><li><span>150+ brain training exercises</span><i>Included</i></li></ul>
        <div class="promo"><span class="tg"></span><div><b>Promo code BRIGHT-85 applied</b><span>You save 85%</span></div><i>−85%</i></div>
        <div class="co-pay"><div class="total"><span>Total due:</span><b><s>$6.60</s> $0.99</b></div>
         <button class="btn btn-primary co-b" data-m="express" type="button">Express checkout</button>
         <button class="btn btn-line co-b" data-m="card" type="button">Credit or debit card</button>
         <p class="co-demo" id="coDemo">Demo checkout. No payment is taken and no card details are collected.</p></div>
        <p class="fine">Get a 7-day trial for just $0.99. <b>After the trial, we’ll charge $4.99 every week until you cancel.</b></p>
       </div></div></div></div>`;
    let k=0;sellT=setInterval(()=>{const t=$('coTick');if(!t)return clearInterval(sellT);t.classList.remove('in');void t.offsetWidth;t.innerHTML=sold(++k);t.classList.add('in');},5200);
    const paint=()=>{const e=$('coT');if(!e)return clearInterval(offerT);e.textContent=fmt(left);if(left>0){left--;ls.set('bf_offer',left);}};
    paint();offerT=setInterval(paint,1000);
    let n=18397;const nt=setInterval(()=>{const e=$('coN');if(!e)return clearInterval(nt);n+=Math.floor(rnd(1,4));e.textContent=n.toLocaleString('en-US');},3500);
    const offer=window.bfTrack&&window.bfTrack.offerUrl();
    if(offer){const dm=$('coDemo');if(dm)dm.style.display='none';}
    document.querySelectorAll('.co-b').forEach(b=>b.onclick=()=>{
      if(offer){window.bfTrack.event('GoToCheckout',{value:0.99,currency:'USD'});embedCheckout(offer);return;}
      document.querySelectorAll('.co-b').forEach(x=>x.disabled=true);b.textContent='Processing…';
      setTimeout(()=>{clearInterval(sellT);clearInterval(offerT);clearInterval(nt);S.unlock();st.done=false;showResults();},1300);
    });
    window.scrollTo(0,0);
  }

  /* take over the end of the test */
  window.guessScreen=analyze;window.reviewScreen=analyze;
  window.finish=function(){analyze();};
})();

/* TEMP DEV: "Skip quiz" button, jumps straight to the calculating screen. REMOVE before launch. */
(function(){
  var b=document.createElement('button');b.type='button';b.id='devSkip';b.textContent='Skip quiz (dev)';
  b.style.cssText='position:fixed;left:12px;bottom:12px;z-index:99999;padding:8px 12px;border-radius:8px;border:2px dashed #121212;background:#fff;color:#121212;font:700 13px system-ui;cursor:pointer;display:none';
  b.onclick=function(){if(window.guessScreen)window.guessScreen();};
  document.body.appendChild(b);
  setInterval(function(){var t=document.getElementById('tMain');b.style.display=(t&&!t.querySelector('.an,.em,.co,.gate')&&document.getElementById('tCount')&&/of/.test(document.getElementById('tCount').textContent))?'block':'none';},400);
})();

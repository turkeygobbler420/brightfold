/* After the last question: calculating screen, engagement pop-ups, email capture, checkout, then results. */
(function(){
  const E=window.BF_E;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const ls={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};

  /* ---------- storage: signed-in account, demo account, or this browser only ---------- */
  try{localStorage.removeItem('bf_demo');}catch(e){}
  const DEMO={email:'demo@mindmetric.info',name:'Demo user'};
  const FN='https://llyanlleeynuznywttjg.supabase.co/functions/v1/',LINK_API='https://mmedge.vercel.app/api/link',STATUS_API=FN+'status';
  const S=window.BF_STORE={
    demoUser(){return null;},
    
    endDemo(){try{localStorage.removeItem('bf_demo');}catch(e){}},
    user(){const a=window.BF_AUTH;const u=a&&a.user&&a.user();return u||S.demoUser();},
    mode(){const a=window.BF_AUTH;return a&&a.user&&a.user()?'live':S.demoUser()?'demo':'guest';},
    local(){return ls.get('bf_data',{results:[],leads:[],paid:false});},
    saveLocal(d){ls.set('bf_data',d);},
    async saveLead(email){
      const d=S.local();if(!d.leads.includes(email))d.leads.push(email);S.saveLocal(d);
      /* Direct RPC with the public anon key so capture never depends on the auth client being loaded. */
      const c=window.BF_SUPABASE,q=new URLSearchParams(location.search),t=window.bfTrack||{};
      const sc=(st&&st.result&&st.result.score)||null;
      if(c&&c.url){try{await fetch(c.url+'/rest/v1/rpc/capture_lead',{method:'POST',keepalive:true,
        headers:{'content-type':'application/json',apikey:c.anonKey,authorization:'Bearer '+c.anonKey},
        body:JSON.stringify({p_email:email,p_click_id:t.clickId||null,p_utm_source:q.get('utm_source')||q.get('src')||null,p_utm_medium:q.get('utm_medium'),
          p_utm_campaign:q.get('utm_campaign'),p_referrer:document.referrer||null,p_device:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop',
          p_lang:(navigator.language||'').slice(0,10),p_score:sc})});}catch(e){}}
      try{if(window.BF_EV)BF_EV('email_submitted',{has_click_id:!!t.clickId});
        if(window.posthog&&posthog.setPersonProperties)posthog.setPersonProperties({email:email});}catch(e){}
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
    /* Payment <-> email <-> account. The click id is linked server-side to every email used (quiz email, account email),
       the postback marks the click paid, and paid state is kept per email so a different account on this device is not unlocked. */
    async link(email){
      email=String(email||'').trim().toLowerCase();const id=window.bfTrack&&window.bfTrack.clickId;if(!email||!id)return;
      const d=S.local();d.linked=d.linked||[];if(!d.linked.includes(email)){d.linked.push(email);S.saveLocal(d);}
      try{if(window.BF_IDENTIFY)BF_IDENTIFY(email);}catch(e){}
      try{await fetch(LINK_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...(window.BF_TT?BF_TT():{}),click_id:id,email})});}catch(e){}
    },
    cancelRequested(){return S.local().cancelAt||null;},
    async requestCancel(){
      const d=S.local();d.cancelAt=new Date().toISOString();S.saveLocal(d);
      const a=window.BF_AUTH,sb=a&&a.sb&&a.sb(),u=S.user();
      if(sb&&u&&u.email&&u.email!==DEMO.email){ /* signed in: the server resolves the account's payments from the token */
        try{const {data}=await sb.auth.getSession();const tok=data&&data.session&&data.session.access_token;
          if(tok){const r=await fetch(FN+'cancel',{method:'POST',headers:{Authorization:'Bearer '+tok},cache:'no-store'});if(r.ok)return true;}}catch(e){}
      }
      const id=window.bfTrack&&window.bfTrack.clickId,emails=[...new Set([...(d.paidEmails||[]),...(d.linked||[]),(u||{}).email].filter(e=>e&&e!==DEMO.email).map(e=>String(e).toLowerCase()))];
      let ok=!!id&&emails.length>0;
      for(const email of emails){try{const r=await fetch(FN+'cancel',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({click_id:id,email})});if(!r.ok)ok=false;}catch(e){ok=false;}}
      return ok;
    },
    optedOut(){return !!S.local().optOut;},
    async setOptOut(out){
      const d=S.local();d.optOut=!!out;S.saveLocal(d);
      const emails=[...new Set([...(d.leads||[]),...(d.linked||[]),(S.user()||{}).email].filter(e=>e&&e!==DEMO.email).map(e=>String(e).toLowerCase()))];
      let ok=true;
      for(const email of emails){try{const r=await fetch(FN+'unsubscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,subscribe:!out})});if(!r.ok)ok=false;}catch(e){ok=false;}}
      return ok;
    },
    isPaid(){
      const d=S.local();if(!d.paid)return false;if(S.mode()!=='live')return true;
      const e=String((S.user()||{}).email||'').toLowerCase();return (d.paidEmails||[]).includes(e);
    },
    unlock(){
      const d=S.local();delete d.cancelAt;d.paid=true;d.paidEmails=[...new Set([...(d.paidEmails||[]),...(d.linked||[])])];d.since=d.since||new Date().toISOString();S.saveLocal(d);
      try{window.dispatchEvent(new Event('bf:paid'));}catch(e){}
    },
    /* signed in: link this browser's click to the account email, then ask the server whether any linked click is paid */
    async syncMembership(){
      const a=window.BF_AUTH,sb=a&&a.sb&&a.sb(),u=a&&a.user&&a.user();if(!sb||!u||!u.email)return;
      try{
        await S.link(u.email);
        const {data}=await sb.auth.getSession();const tok=data&&data.session&&data.session.access_token;if(!tok)return;
        const r=await fetch(STATUS_API,{headers:{Authorization:'Bearer '+tok},cache:'no-store'});if(!r.ok)return;
        const j=await r.json();if(j&&j.paid&&!S.isPaid())S.unlock();
        if(j&&j.cancelled&&!S.local().cancelAt){const d=S.local();d.cancelAt=new Date().toISOString();S.saveLocal(d);window.dispatchEvent(new Event('bf:paid'));}
      }catch(e){}
    }
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
    if(st.flow)return;st.flow=1;window.BF_EV&&BF_EV('analyzing_viewed');halt();$('tCount').textContent='Calculating';
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
      [33,()=>{two('Have you ever taken an IQ test?','Yes','No',v=>{st.tookIQ=!v;});}],
      [66,()=>{const flip=Math.random()<.5;const A=flip?st.word:decoyW,B=flip?decoyW:st.word;two('The word you memorized was…',A,B,v=>{st.recallWord=(v?B:A)===st.word;});}]
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
    window.BF_EV&&BF_EV('email_screen_viewed');close();$('tCount').textContent='Almost done';
    const u=S.user();const pre=u&&u.email&&u.email!==DEMO.email?u.email:'';
    $('tMain').innerHTML=`<div class="em"><h2>Where should we send <em>your IQ certificate</em>?</h2>
      <p class="em-sub">Enter your email to unlock your complete analysis and personalised cognitive profile.</p>
      <form id="emF" novalidate><div class="em-f"><label for="emIn">Email</label><input id="emIn" type="email" autocomplete="email" inputmode="email" value="${E(pre)}" required></div>
      <p class="em-err" id="emErr" role="alert"></p>
      <p class="em-fine">Mindmetric keeps your personal information confidential. By clicking “Continue” you acknowledge that you have read, understood and accepted our terms and privacy policy.</p>
      <button class="btn btn-primary em-go" type="submit">Continue</button></form></div>`;
    const inp=$('emIn');inp.focus({preventScroll:true});
    $('emF').onsubmit=async e=>{e.preventDefault();const v=inp.value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)||v.toLowerCase()===DEMO.email){$('emErr').textContent='Enter a valid email address.';inp.focus();return;}
      $('emErr').textContent='';st.email=v;const b=e.target.querySelector('button');b.disabled=true;b.textContent='Please wait…';
      const r=calc();st.result=r;
      await Promise.race([Promise.all([S.saveLead(v),S.saveResult(r),S.link(v)]),new Promise(ok=>setTimeout(ok,1200))]);
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
     ${ds.slice(0,3).map(x=>`<div class="gl-r c-${DCOL[x.id]}"><span>${E(x.name)}</span><div><i style="width:${75+Math.floor(Math.random()*16)}%"></i></div></div>`).join('')}
     </section>`;
  }
  /* Payment screen: Whop-style on-page checkout modal (order summary + secure pay button).
     The provider's page sends X-Frame-Options: DENY so it cannot be framed; the pay button opens it in a
     pop-out window sized like a card form (falls back to this tab if pop-ups are blocked). */
  /* Polls the status function (filled by the network postback) and unlocks the results once the click is paid.
     Adaptive schedule with jitter, error backoff, instant re-check when the tab regains focus, 30 min cap,
     and the pending state survives a reload / same-tab checkout via localStorage. */
  const PEND_KEY='bf_pay_pending',PEND_MAX=30*60e3;
  let payT=null,payRun=0,payWin=null,payChk=null;
  const pend={get(){try{const t=+localStorage.getItem(PEND_KEY);return t&&Date.now()-t<PEND_MAX?t:0;}catch(e){return 0;}},
    set(){try{localStorage.setItem(PEND_KEY,String(Date.now()));}catch(e){}},
    clear(){try{localStorage.removeItem(PEND_KEY);}catch(e){}}};
  const payMsg=h=>{const m=document.getElementById('bfPayMsg');if(m)m.innerHTML=h;};
  function stopPay(){payRun++;clearTimeout(payT);payT=null;
    if(payChk){document.removeEventListener('visibilitychange',payChk);window.removeEventListener('focus',payChk);window.removeEventListener('pageshow',payChk);payChk=null;}}
  function watchPayment(win){
    stopPay();
    const id=window.bfTrack&&window.bfTrack.clickId;if(!id)return;
    payWin=win||null;const run=++payRun,t0=pend.get()||Date.now();pend.set();
    let fails=0,busy=false;
    const delay=()=>{if(fails)return Math.min(30e3,3e3*Math.pow(2,fails));
      const e=Date.now()-t0,b=e<30e3?3e3:e<120e3?5e3:e<600e3?10e3:20e3;return b*(0.8+Math.random()*0.4);};
    const giveUp=()=>{stopPay();
      payMsg('We have not received your payment confirmation yet. <button id="bfRecheck" type="button" style="border:0;background:none;color:#4f46e5;text-decoration:underline;cursor:pointer;font:inherit;padding:0">Check again</button>');
      const r=document.getElementById('bfRecheck');if(r)r.onclick=()=>{pend.set();watchPayment(payWin);};};
    const unlock=(amt,cur)=>{stopPay();pend.clear();try{window.BF_PURCHASE&&window.BF_PURCHASE(amt,cur);}catch(e){}clearInterval(sellT);clearInterval(offerT);
      try{payWin&&!payWin.closed&&payWin.close();}catch(e){}
      const em=document.getElementById('bfEmbed');if(em)em.remove();
      S.unlock();if(st&&st.flow){st.done=false;showResults();}};
    const check=async()=>{
      if(run!==payRun||busy)return;
      if(Date.now()-t0>PEND_MAX){pend.clear();return giveUp();}
      busy=true;
      try{
        const r=await fetch(STATUS_API+'?click_id='+encodeURIComponent(id),{cache:'no-store'});
        if(!r.ok)throw new Error('status '+r.status);
        const j=await r.json();fails=0;
        if(run!==payRun)return;
        if(j&&j.paid)return unlock(j.amount,j.currency);
      }catch(e){fails++;console.warn('bf status check failed',e&&e.message);}
      finally{busy=false;}
      if(run===payRun){clearTimeout(payT);payT=setTimeout(check,delay());}
    };
    payChk=()=>{if(document.visibilityState!=='hidden'&&run===payRun){clearTimeout(payT);check();}};
    document.addEventListener('visibilitychange',payChk);window.addEventListener('focus',payChk);window.addEventListener('pageshow',payChk);
    payT=setTimeout(check,1500);
  }
  function embedCheckout(url,inline,explicit){
    /* link the click id to the email(s) in use, then send the visitor straight to the hosted checkout */
    const u=S.user();[st&&st.email,u&&u.email].forEach(e=>{if(e&&e!==DEMO.email)S.link(e);});
    const m=/\/checkout\/(plan_\w+)/.exec(url||'');
    if(!m){pend.set();location.href=url;return;}
    whopEmbed(m[1],url,inline,explicit);
  }
  /* Whop embedded checkout (modal on our page). Unlock still comes from the webhook via watchPayment polling. */
  function whopEmbed(plan,url,inline,explicit){
    if(document.getElementById('bfEmbed'))return;
    if(!inline&&!explicit)return; /* popup only ever opens from an explicit click on a pay/continue button */
    if(inline&&!document.getElementById('bfCk'))return; /* inline checkout screen gone: never fall back to a popup */
    const ov=inline?null:document.createElement('div');if(ov){ov.id='bfEmbed';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
    ov.style.cssText='position:fixed;inset:0;z-index:2147482000;background:rgba(0,0,0,.6);overflow:auto;padding:16px;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif';
    ov.innerHTML='<div style="max-width:480px;margin:0 auto;background:#fff;color:#121212;border-radius:14px;padding:16px;position:relative"><button id="bfCkX" type="button" aria-label="Close" style="position:absolute;right:10px;top:8px;border:0;background:none;font-size:24px;line-height:1;cursor:pointer;color:#555">&times;</button><div id="bfPayMsg" style="margin:0 28px 10px 0;color:#555">Secure checkout</div><div id="bfCk" style="min-height:240px"></div></div>';
    document.body.appendChild(ov);}
    const ob=document.body.style.overflow;if(ov)document.body.style.overflow='hidden';
    let h=null,dead=false;
    const shut=()=>{dead=true;try{h&&h.destroy();}catch(e){}stopPay();pend.clear();if(ov){ov.remove();document.body.style.overflow=ob;}};
    if(ov)document.getElementById('bfCkX').onclick=shut;
    const fallback=()=>{if(dead)return;shut();pend.set();location.href=url;};
    const mount=()=>{
      try{
        h=window.WhopElements().checkout.create({plan,metadata:{click_id:String(window.bfTrack&&window.bfTrack.clickId||'')},returnUrl:location.origin+location.pathname,
          onComplete:()=>{payMsg('Payment received. Unlocking your results...');window.BF_EV&&BF_EV('payment_complete_client');pend.set();watchPayment(null);}});
        h.create('checkout').mount('#bfCk');
        pend.set();watchPayment(null);
      }catch(e){console.warn('whop embed failed',e);fallback();}
    };
    if(window.WhopElements)return mount();
    const s=document.createElement('script');s.src='https://cdn.whop.com/elements/amber/elements.js';s.setAttribute('data-whop-elements','');
    s.onload=()=>{let n=0;const w=setInterval(()=>{if(window.WhopElements){clearInterval(w);mount();}else if(++n>40){clearInterval(w);fallback();}},100);};
    s.onerror=fallback;document.head.appendChild(s);
  }
  function checkout(){
    window.BF_URL&&BF_URL('/payment');window.BF_EV&&BF_EV('checkout_viewed');
    close();$('tCount').textContent='Your score';clearInterval(sellT);clearInterval(offerT);
    const peer=(src,nm,iq)=>{const sc=(iq-100)/60;return `<div class="peer"><span class="pl">IQ ${iq}</span><div class="pc" style="aspect-ratio:${(3/(4*sc)).toFixed(3)}"><img src="${src}" alt="" loading="lazy"></div><span class="pn">${nm}</span></div>`;};
    const sold=k=>{const s=SOLD[k%SOLD.length];return `<span class="dotg"></span><b>${s[0]}</b> just bought ${s[1]} IQ score! <img class="where" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${[...s[3]].map(c=>(0x1f1e6+c.charCodeAt(0)-65).toString(16)).join('-')}.svg" alt="" width="20" height="20" draggable="false"> <a>IQ ${s[2]}</a>`;};
    $('tMain').innerHTML=`<div class="co">
      <div class="co-user"><span class="av">${E((st.email||'?')[0].toUpperCase())}</span><span>${E(st.email||'')}</span></div>
      <div class="co-tix"><div class="co-tix-t"><span>Your IQ report is unlocked</span><strong id="coP">Ready<small>pay below</small></strong></div></div>
      <h2 class="co-h">Congratulations! Your score is ready!</h2>
      ${glimpse()}
      <div class="gate"><div class="g-grid">
       <div class="g-l"><div class="g-card">
        <div class="peers">${peer('figs/einstein.webp','Albert Einstein',160)}<div class="peer you"><span class="pl">You</span><div class="pc" style="aspect-ratio:${(3/(4*1.25)).toFixed(3)}"><b>???</b><svg viewBox="0 0 100 110" aria-hidden="true"><circle cx="50" cy="34" r="19"/><path d="M8 110c0-30 14-46 42-46s42 16 42 46z"/></svg></div><span class="pn">Your score</span></div>${peer('figs/newton.webp','Isaac Newton',190)}</div>
        <div class="g-stats"><div><b>107</b><span>Average IQ today</span></div><div><b>${ITEMS.length}</b><span>Questions answered</span></div><div><b>${DOMAINS.length}</b><span>Skill areas measured</span></div></div>
       </div></div>
       <div class="g-r"><p class="g-k">Your summary</p>
        <ul class="sum"><li><span>Your IQ score &amp; certificate</span><i class="pr" id="coS">See price below</i></li><li><span>Detailed cognitive report</span><i>Included</i></li><li><span>Global &amp; country ranking</span><i>Included</i></li><li><span>150+ brain training exercises</span><i>Included</i></li></ul>
        <div class="co-pay">
         <div id="bfPayMsg" style="margin:8px 0;color:#555;font-size:13px"></div><div id="bfCk" style="min-height:260px"></div></div>
       </div></div></div></div>`;
    const offer=window.bfTrack&&window.bfTrack.offerUrl();
    window.BF_EV&&BF_EV('checkout_clicked',{has_offer:!!offer});
    if(offer){window.bfTrack.event('GoToCheckout',{});embedCheckout(offer,true);}
    else payMsg('Checkout is unavailable right now');
    const top=document.querySelector('#app .t-top');
    if(top&&!$('coBar')){const bar=document.createElement('div');bar.id='coBar';bar.className='co-bar';
      bar.innerHTML='<span><b id="coB">Your IQ report is ready</b></span><button class="btn btn-primary" type="button">Get IQ Report</button>';
      top.appendChild(bar);bar.querySelector('button').onclick=()=>{const b=document.getElementById('bfCk');if(b)b.scrollIntoView({behavior:'smooth',block:'center'});};
      new MutationObserver((m,ob)=>{if(!document.querySelector('#tMain .co')){bar.remove();ob.disconnect();}}).observe($('tMain'),{childList:true,subtree:true});}
    window.__bfExact=false;
    if(!window.__bfWhopPx){window.__bfWhopPx=1;window.addEventListener('message',e=>{
      if(e.origin!=='https://cdn.whop.com')return;const d=e.data,o=d&&d.whop==='resource-open'&&d.options;
      if(!o||!o.currency||!(o.amount>0)||!document.getElementById('coP'))return;
      try{const nf=new Intl.NumberFormat(navigator.language||'en-US',{style:'currency',currency:String(o.currency).toUpperCase()});
        const t=nf.format(o.amount/Math.pow(10,nf.resolvedOptions().maximumFractionDigits));window.__bfExact=true;
        const set=(i,h)=>{const x=document.getElementById(i);if(x)x.innerHTML=h;};
        set('coP',t+'<small>today</small>');set('coS',t+' today');set('coB',t+' today');
        const cu=String(o.currency).toUpperCase(),am=o.amount/Math.pow(10,nf.resolvedOptions().maximumFractionDigits);
        window.__bfPlan.then(async p=>{if(!p||!(p.today>0))return;const base=p.currency||'USD';if(cu===base)return;const fx=await window.__bfFx(base);const x=fx&&fx[cu];if(!(x>0))return;const m=am/(p.today*x);
          if(m>0.95&&m<1.2){try{localStorage.setItem('bf_fxm_'+cu,m.toFixed(4));}catch(_){}window.BF_EV&&BF_EV('whop_price_seen',{currency:cu,amount:am,usd:p.today,mid_rate:x,markup:+m.toFixed(4)});}});}catch(_){}
    });}
    window.__bfFx=bs=>{const c=window.__bfFxC=window.__bfFxC||{};return c[bs]||(c[bs]=fetch('https://open.er-api.com/v6/latest/'+bs).then(r=>r.json()).then(j=>j&&j.rates).catch(()=>null));};
    window.__bfPlan=fetch('https://llyanlleeynuznywttjg.supabase.co/functions/v1/price').then(r=>r.ok?r.json():null).catch(()=>null);
    window.__bfPlan.then(async d=>{
      if(!d||!(d.then>0)||!document.getElementById('coP')||window.__bfExact)return;
      let cc='';try{cc=(sessionStorage.getItem('bf_geo')||'').toUpperCase();}catch(e){}
      const loc=navigator.language||'en-US';for(let i=0;i<14&&!/^[A-Z]{2}$/.test(cc)&&!window.__bfExact;i++){await new Promise(r=>setTimeout(r,300));try{cc=(sessionStorage.getItem('bf_geo')||'').toUpperCase();}catch(e){}}if(window.__bfExact)return;if(!/^[A-Z]{2}$/.test(cc))cc='';
      const EU='AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' '),M={};EU.forEach(c=>M[c]='EUR');
      'ZA:ZAR,GB:GBP,AU:AUD,CA:CAD,NZ:NZD,IN:INR,NG:NGN,KE:KES,GH:GHS,AE:AED,SA:SAR,SG:SGD,MY:MYR,PH:PHP,ID:IDR,TH:THB,VN:VND,JP:JPY,KR:KRW,HK:HKD,TW:TWD,CN:CNY,BR:BRL,MX:MXN,AR:ARS,CL:CLP,CO:COP,PE:PEN,CH:CHF,SE:SEK,NO:NOK,DK:DKK,PL:PLN,CZ:CZK,HU:HUF,RO:RON,BG:BGN,TR:TRY,IL:ILS,EG:EGP,PK:PKR,BD:BDT,UA:UAH'.split(',').forEach(x=>{M[x.slice(0,2)]=x.slice(3);});
      let cur=d.currency||'USD',rate=1,approx=false;const want=M[cc];
      if(want&&want!==cur){try{const fx=await window.__bfFx(cur);const x=fx&&fx[want];if(x>0){let mk=1.0206;try{const s=parseFloat(localStorage.getItem('bf_fxm_'+want));if(s>0.95&&s<1.2)mk=s;}catch(e){}rate=x*mk;cur=want;approx=true;}}catch(e){}}
      const f=n=>{try{return (approx?'≈ ':'')+new Intl.NumberFormat(loc,{style:'currency',currency:cur}).format(n*rate);}catch(e){return '$'+n.toFixed(2);}};
      const per=d.period===7?'week':d.period===30||d.period===31?'month':d.period===365?'year':'period',t=f(d.today);
      const set=(i,h)=>{const e=document.getElementById(i);if(e)e.innerHTML=h;};
      const td=d.today>0?t+' today':'Free today';
      set('coP',(d.today>0?t:'Free')+'<small>today</small>');
      
      set('coS',td);set('coB',td);
    });
    window.scrollTo(0,0);
  }

  /* membership checkout from the account area (same flow, no quiz): returns false when no real checkout is configured */
  window.BF_PAY={start(userClick){if(userClick!==true)return false;const o=window.bfTrack&&window.bfTrack.offerUrl();if(!o)return false;window.bfTrack.event('GoToCheckout',{});embedCheckout(o,false,true);return true;}};
  const syncSoon=()=>setTimeout(()=>S.syncMembership(),0);
  window.addEventListener('load',syncSoon);

  /* resume polling after a reload or same-tab checkout */
  if(pend.get())setTimeout(()=>{try{watchPayment(null);}catch(e){console.warn(e);}},800);

  /* take over the end of the test */
  window.guessScreen=analyze;window.reviewScreen=analyze;
  window.finish=function(){analyze();};

})();

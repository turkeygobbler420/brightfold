/* Accounts: sign up, log in, password reset, account management (Supabase Auth). */
(function(){
  const cfg=window.BF_SUPABASE||{};
  if(!cfg.url||!cfg.anonKey)return; // accounts stay hidden until Supabase is connected

  const slot=document.querySelector('.nav .wrap .btn.js-start');
  if(!slot)return;
  let navBtn=document.querySelector('.nav .nav-login');
  if(!navBtn){navBtn=document.createElement('button');
  navBtn.type='button';navBtn.className='btn btn-sm nav-login';navBtn.textContent='Log in';
  slot.parentNode.insertBefore(navBtn,slot);}

  const dlg=document.createElement('dialog');dlg.className='auth-dlg';dlg.setAttribute('aria-label','Account');
  document.body.appendChild(dlg);

  let sb=null,session=null,view='login',busy=false;
  window.BF_AUTH={user:()=>session?session.user:null,sb:()=>sb,
    manage:()=>openDlg(),signup:()=>{render('signup');if(!dlg.open)dlg.showModal();},
    logout:async()=>{if(session&&sb)await sb.auth.signOut();else window.BF_STORE.endDemo();setNav();}};
  const goHome=()=>{closeDlg();window.BF_HOME&&window.BF_HOME.open('overview');};
  const demoOn=()=>window.BF_STORE&&window.BF_STORE.demoUser();
  const X='<button type="button" class="auth-x" aria-label="Close"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
  const $=(s)=>dlg.querySelector(s);
  const esc=window.BF_E;

  function loadLib(){
    return new Promise((res,rej)=>{
      if(window.supabase)return res();
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      s.onload=res;s.onerror=()=>rej(new Error('load'));document.head.appendChild(s);
    });
  }
  function msg(t,k){const m=$('.auth-msg');if(m){m.textContent=t||'';m.className='auth-msg'+(k?' '+k:'');}}
  function friendly(e){
    const m=(e&&e.message)||'';
    if(/invalid login/i.test(m))return 'That email or password is not right.';
    if(/already registered|already been registered/i.test(m))return 'An account with that email already exists. Try logging in.';
    if(/email not confirmed/i.test(m))return 'Please confirm your email first. Check your inbox for the link.';
    if(/rate limit|too many/i.test(m))return 'Too many attempts. Please wait a minute and try again.';
    if(/password/i.test(m)&&/(least|weak|short)/i.test(m))return 'Choose a password with at least 8 characters.';
    return m||'Something went wrong. Please try again.';
  }
  async function run(btn,fn){
    if(busy)return;busy=true;const t=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='Please wait…';}
    try{await fn();}catch(e){msg(friendly(e),'err');}
    busy=false;if(btn&&btn.isConnected){btn.disabled=false;btn.textContent=t;}
  }

  const FORMS={
    login:()=>`<h2>Log in</h2><p class="auth-sub">Welcome back to Mindmetric.</p>
      <form novalidate><label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
      <p class="auth-msg" role="status"></p><button class="btn btn-primary" type="submit">Log in</button></form>
      <p class="auth-alt"><button type="button" data-v="forgot">Forgot password?</button></p>
      <p class="auth-alt">New here? <button type="button" data-v="signup">Create an account</button></p>`,
    signup:()=>`<h2>Create your account</h2><p class="auth-sub">Save your results and certificate.</p>
      <form novalidate><label>Name<input name="name" type="text" autocomplete="name" maxlength="60"></label>
      <label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label>Password<input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
      <p class="auth-msg" role="status"></p><button class="btn btn-primary" type="submit">Create account</button></form>
      <p class="auth-alt">Already have an account? <button type="button" data-v="login">Log in</button></p>`,
    forgot:()=>`<h2>Reset your password</h2><p class="auth-sub">We will email you a link to choose a new one.</p>
      <form novalidate><label>Email<input name="email" type="email" autocomplete="email" required></label>
      <p class="auth-msg" role="status"></p><button class="btn btn-primary" type="submit">Send reset link</button></form>
      <p class="auth-alt"><button type="button" data-v="login">Back to log in</button></p>`,
    recover:()=>`<h2>Choose a new password</h2><p class="auth-sub">Use at least 8 characters.</p>
      <form novalidate><label>New password<input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
      <p class="auth-msg" role="status"></p><button class="btn btn-primary" type="submit">Save password</button></form>`,
    account:()=>{
      if(!session){
        return `<h2>Demo account</h2><p class="auth-sub">Signed in as <strong>${esc(demoOn().email)}</strong>. Everything works on this device only.</p>
        <div class="auth-acct"><section><h3>Your results</h3><div class="auth-hist" data-hist>Loading…</div></section>
        <section><button class="btn btn-primary" type="button" data-a="out">Leave demo</button></section>
        <section><p class="auth-sub">Want your results saved everywhere?</p><button class="btn btn-line" type="button" data-a="real">Create a real account</button></section></div>`;
      }
      const u=session.user,name=(u.user_metadata&&u.user_metadata.display_name)||'';
      return `<h2>Your account</h2><p class="auth-sub">Signed in as <strong>${esc(u.email)}</strong></p>
      <div class="auth-acct">
        <section><h3>Name</h3><form data-f="name" novalidate><label>Display name<input name="name" type="text" maxlength="60" value="${esc(name)}"></label><button class="btn btn-line" type="submit">Save name</button></form></section>
        <section><h3>Email</h3><form data-f="email" novalidate><label>New email<input name="email" type="email" autocomplete="email" required></label><button class="btn btn-line" type="submit">Change email</button></form></section>
        <section><h3>Password</h3><form data-f="password" novalidate><label>New password<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><button class="btn btn-line" type="submit">Change password</button></form></section>
        <section><h3>Your results</h3><div class="auth-hist" data-hist>Loading…</div></section>
        <p class="auth-msg" role="status"></p>
        <section><button class="btn btn-primary" type="button" data-a="out">Log out</button></section>
        <section><h3>Delete account</h3><p class="auth-sub">This permanently removes your account and saved results.</p><button class="btn auth-danger" type="button" data-a="del">Delete my account</button></section>
      </div>`;
    }
  };

  function render(v){
    view=v;dlg.innerHTML=X+'<div class="auth-in">'+FORMS[v]()+'</div>';
    const f=$('input');if(f&&v!=='account')setTimeout(()=>f.focus(),30);
    const h=dlg.querySelector('[data-hist]');
    if(h&&window.BF_STORE)window.BF_STORE.results().then(rs=>{
      h.innerHTML=rs.length?'<ul>'+rs.slice(0,8).map(r=>`<li><b>${esc(r.score)}</b><span>${esc(r.raw)}/${esc(r.items)} correct</span><time>${esc(new Date(r.at).toLocaleDateString((window.BF_LOC?BF_LOC():'en-GB'),{day:'numeric',month:'short',year:'numeric'}))}</time></li>`).join('')+'</ul>':'<p class="auth-sub">No results yet. Take the test and your score will appear here.</p>';
    });
  }
  function setNav(){navBtn.textContent=(session||demoOn())?'Account':'Log in';}

  const val=(f,n)=>f.elements[n]?f.elements[n].value.trim():'';
  const okEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const okPw=p=>p.length>=8;

  async function submit(form){
    const btn=form.querySelector('button[type=submit]'),email=val(form,'email'),pw=form.elements.password?form.elements.password.value:'';
    const f=form.dataset.f;
    if(view==='login')return run(btn,async()=>{
      if(!okEmail(email)||!pw)return msg('Enter your email and password.','err');
      const {error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error;
    });
    if(view==='signup')return run(btn,async()=>{
      if(!okEmail(email))return msg('Enter a valid email address.','err');
      if(!okPw(pw))return msg('Choose a password with at least 8 characters.','err');
      const {data,error}=await sb.auth.signUp({email,password:pw,options:{data:{display_name:val(form,'name')},emailRedirectTo:location.origin+location.pathname}});
      if(error)throw error;
      if(!data.session){msg('Check your inbox to confirm your email, then log in.','ok');form.reset();}
    });
    if(view==='forgot')return run(btn,async()=>{
      if(!okEmail(email))return msg('Enter a valid email address.','err');
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;
      msg('If that email has an account, a reset link is on its way.','ok');
    });
    if(view==='recover')return run(btn,async()=>{
      if(!okPw(pw))return msg('Choose a password with at least 8 characters.','err');
      const {error}=await sb.auth.updateUser({password:pw});if(error)throw error;
      msg('Password updated.','ok');setTimeout(()=>{session=session||null;render('account');},900);
    });
    if(view==='account'&&f==='name')return run(btn,async()=>{
      const {error}=await sb.auth.updateUser({data:{display_name:val(form,'name')}});if(error)throw error;
      await sb.from('profiles').update({display_name:val(form,'name')||null}).eq('id',session.user.id);msg('Name saved.','ok');
    });
    if(view==='account'&&f==='email')return run(btn,async()=>{
      if(!okEmail(email))return msg('Enter a valid email address.','err');
      const {error}=await sb.auth.updateUser({email},{emailRedirectTo:location.origin+location.pathname});if(error)throw error;
      msg('Check both inboxes to confirm the change.','ok');form.reset();
    });
    if(view==='account'&&f==='password')return run(btn,async()=>{
      if(!okPw(pw))return msg('Choose a password with at least 8 characters.','err');
      const {error}=await sb.auth.updateUser({password:pw});if(error)throw error;msg('Password changed.','ok');form.reset();
    });
  }

  function openDlg(){
    render(session||demoOn()?'account':'login');
    if(!dlg.open)dlg.showModal();document.documentElement.classList.add('cert-lock');
  }
  function closeDlg(){if(dlg.open)dlg.close();}

  dlg.addEventListener('submit',e=>{e.preventDefault();submit(e.target);});
  dlg.addEventListener('click',e=>{
    if(e.target===dlg||e.target.closest('.auth-x'))return closeDlg();
    const v=e.target.closest('[data-v]');if(v)return render(v.dataset.v);
    const a=e.target.closest('[data-a]');if(!a)return;
    if(a.dataset.a==='real'){window.BF_STORE.endDemo();setNav();return render('signup');}
    if(a.dataset.a==='out'&&!session){window.BF_STORE.endDemo();setNav();return closeDlg();}
    if(a.dataset.a==='out')run(a,async()=>{await sb.auth.signOut();closeDlg();});
    if(a.dataset.a==='del'){
      if(!confirm('Delete your account and all saved results? This cannot be undone.'))return;
      run(a,async()=>{const {error}=await sb.rpc('delete_my_account');if(error)throw error;await sb.auth.signOut();closeDlg();});
    }
  });
  dlg.addEventListener('close',()=>document.documentElement.classList.remove('cert-lock'));
  navBtn.addEventListener('click',()=>{if((session||demoOn())&&window.BF_HOME)window.BF_HOME.open('overview');else openDlg();});

  const needNow=/access_token|type=recovery|[?&#]code=/.test(location.hash+location.search)||(()=>{try{return Object.keys(localStorage).some(k=>/^sb-/.test(k));}catch(e){return false;}})();
  new Promise(r=>needNow?r():(window.requestIdleCallback?requestIdleCallback(()=>r(),{timeout:1200}):setTimeout(r,800))).then(loadLib).then(()=>{
    const sync=()=>setTimeout(()=>{const st=window.BF_STORE;if(st&&st.syncMembership)st.syncMembership();},0);
    sb=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    sb.auth.getSession().then(({data})=>{session=data.session;setNav();sync();});
    sb.auth.onAuthStateChange((ev,s)=>{
      session=s;setNav();
      if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION'||ev==='USER_UPDATED')sync();
      if(ev==='PASSWORD_RECOVERY'){render('recover');if(!dlg.open)dlg.showModal();}
      else if(ev==='SIGNED_IN'&&dlg.open&&view!=='recover')goHome();
      else if(ev==='SIGNED_OUT'){if(window.BF_HOME)window.BF_HOME.close();if(dlg.open)render('login');}
    });
  }).catch(()=>{navBtn.hidden=true;});
})();

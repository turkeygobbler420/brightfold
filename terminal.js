/* Own payment terminal: Whop PCI-isolated elements (email/card) + our PAY NOW button. Unlock still comes from the webhook. */
window.BF_TERMINAL=function(o){
  /* o: {mount:'#bfCk', plan, clickId, onPaid(), onError(msg), fallback()} */
  const API=/(^|\.)vercel\.app$|^localhost$|^127\./.test(location.hostname)?'':'https://brightfold-nine.vercel.app'; /* GitHub Pages has no server code: use Vercel production */
  const root=document.querySelector(o.mount);if(!root)return;
  const say=m=>{const e=document.getElementById('bfPayMsg');if(e)e.textContent=m||'';};
  const ADDR='123 Main Street, Springfield, IL 62701, United States';// PLACEHOLDER for the test branch: replace with the real address before merging
  const DESC='MINDMETRIC.INFO';// PLACEHOLDER: set to the real bank-statement descriptor
  const lk='color:#4a4ae0;text-decoration:none';
  const lab='display:block;color:#3a3a40;font-size:13px;font-weight:650;letter-spacing:.04em;margin:14px 0 8px';
  root.style.cssText='background:#fff;padding:4px 20px 20px';
  root.innerHTML='<label style="'+lab+'">BILLING EMAIL</label><div id="bfTE"></div><div style="color:#6b6b73;font-size:12px;margin-top:6px">You can edit this. Your receipt is sent here.</div><label style="'+lab+'">BILLING ADDRESS</label><div id="bfTA"></div><label style="'+lab+'">CARD DETAILS</label><div id="bfTP"></div><div id="bfTB" style="margin-top:12px"></div>'+
   '<button id="bfTPay" type="button" disabled style="width:100%;height:66px;border:0;border-radius:19px;background:#121212;color:#fff;font-size:21px;font-weight:750;margin-top:22px;cursor:pointer;opacity:.55">PAY NOW</button>';
  const lg=document.createElement('div');lg.innerHTML=
   '<div style="text-align:center;color:#8a8a92;font-size:11px;line-height:1.45;padding:2px 4px 0">'+
   '<p id="bfTD" style="margin:10px 0 0"></p>'+
   '<p style="margin:7px 0 0">By continuing on this page, you confirm that you have read and agree to the MindMetric <a href="/terms" target="_blank" style="'+lk+'">Terms</a> &amp; <a href="/privacy" target="_blank" style="'+lk+'">Privacy Policy</a> and to the payment terms shown above, including the details presented on this page.</p>'+
   '<p style="margin:7px 0 0">This order is processed securely by Whop. You are purchasing access to the digital IQ score report provided and operated by MindMetric.info. For order questions, cancellations, refunds and returns, visit <a href="/help" target="_blank" style="'+lk+'">mindmetric.info/help</a>.</p>'+
   '<p style="margin:7px 0 0">Charges may appear on your bank statement as '+DESC+'</p>'+
   '<p style="margin:7px 0 0">MindMetric.info'+(ADDR?', '+ADDR:'')+'</p></div>';
  root.parentNode.insertAdjacentElement('afterend',lg.firstChild);
  const btn=document.getElementById('bfTPay');let ready=false,busy=false;
  let addrOk=false;
  const set=()=>{btn.disabled=!ready||!addrOk||busy;btn.style.opacity=btn.disabled?'.55':'1';btn.textContent=busy?'Processing…':'PAY NOW';};
  fetch(API+'/api/pay').then(r=>r.json()).then(c=>{
    if(!c.ready||!window.WhopElements)throw 0;
    const pr=c.price;
    if(pr&&pr.currency){
      const f=n=>new Intl.NumberFormat(undefined,{style:'currency',currency:pr.currency.toUpperCase()}).format(n);
      const d=pr.days,per=d==7?'week':d==30||d==31?'month':d==365?'year':d==1?'day':d+' days';
      const el=document.getElementById('coPlanP');if(el)el.textContent=f(pr.initial);
      // other price spots on the paywall use the plan's price too, not the separate /price estimate
      const T=f(pr.initial),H=pr.initial>0?T+' today':'Free today',st=(i,h)=>{const e=document.getElementById(i);if(e)e.innerHTML=h;};
      st('coP',(pr.initial>0?T:'Free')+'<small>today</small>');st('coS',H);st('coB',H);window.__bfExact=true;
      const dis=document.getElementById('bfTD');
      if(dis)dis.textContent=pr.renewal&&pr.days?'You will be charged '+f(pr.initial)+' for '+(pr.trial||pr.days)+' days, then '+f(pr.renewal)+' per '+per+'. Auto renews unless cancelled. Cancel anytime at mindmetric.info/cancel.':'You will be charged '+f(pr.initial)+' once.';
    }
    const whop=window.WhopElements();
    const pay=whop.payments.create({accountId:c.account,plan:o.plan||c.plan,returnUrl:location.origin+'/payment',appearance:{theme:{appearance:'light',accentColor:'gray',grayColor:'slate'},variables:{'--radius':'13px'}}});
    pay.create('email').mount('#bfTE');
    pay.create('address',{mode:'billing',name:'split',scope:'full',line2:'toggle',onChange:e=>{addrOk=!!e.complete;set();}}).mount('#bfTA');
    pay.create('payment',{fields:{billingDetails:'never'},excludedPaymentMethodTypes:['us_bank_account'],wallets:{},order:['card'],onChange:e=>{ready=!!e.complete;set();}}).mount('#bfTP');
    pay.create('branding').mount('#bfTB');
    btn.onclick=async()=>{
      if(busy)return;busy=true;say('');set();
      const fail=m=>{busy=false;set();say(m);o.onError&&o.onError(m);};
      try{
        const {confirmationToken}=await pay.createConfirmationToken({});
        const r=await fetch(API+'/api/pay',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmationToken,clickId:o.clickId})});
        const p=await r.json();
        if(!r.ok||!p.id)return fail(p.error&&p.error!=='payment_failed'?'Payment could not be started. Please try again.':'Your card was declined. Please try another card.');
        if(p.status!=='paid'){
          o.onAction&&o.onAction();
          const x=await whop.payments.handleNextAction({clientSecret:p.client_secret});
          if(x.redirected)return;
          if(x.status!=='succeeded'&&x.status!=='processing')return fail((x.lastPaymentError&&x.lastPaymentError.message)||'The payment step was not completed. Please try again.');
        }
        say('Payment received. Confirming…');o.onPaid&&o.onPaid(); /* success is only shown by the webhook-driven unlock */
      }catch(e){fail((e&&e.message)||'Something went wrong. Please try again.');}
    };
  }).catch(()=>{o.fallback&&o.fallback();});
};

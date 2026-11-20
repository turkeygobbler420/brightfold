/* Own payment terminal: Whop PCI-isolated elements (email/card) + our PAY NOW button. Unlock still comes from the webhook. */
window.BF_TERMINAL=function(o){
  /* o: {mount:'#bfCk', plan, clickId, onPaid(), onError(msg), fallback()} */
  const root=document.querySelector(o.mount);if(!root)return;
  const say=m=>{const e=document.getElementById('bfPayMsg');if(e)e.textContent=m||'';};
  const lab='display:block;color:#c8c8c8;font-size:13px;font-weight:650;letter-spacing:.04em;margin:14px 0 8px';
  root.style.cssText='background:#1d1d1d;padding:4px 20px 20px';
  root.innerHTML='<label style="'+lab+'">EMAIL ADDRESS</label><div id="bfTE"></div><label style="'+lab+'">CARD DETAILS</label><div id="bfTP"></div><div id="bfTB" style="margin-top:12px"></div>'+
   '<button id="bfTPay" type="button" disabled style="width:100%;height:66px;border:0;border-radius:19px;background:#fff;color:#050505;font-size:21px;font-weight:750;margin-top:20px;cursor:pointer;opacity:.55">PAY NOW</button>';
  const btn=document.getElementById('bfTPay');let ready=false,busy=false;
  const set=()=>{btn.disabled=!ready||busy;btn.style.opacity=btn.disabled?'.55':'1';btn.textContent=busy?'Processing…':'PAY NOW';};
  fetch('/api/pay').then(r=>r.json()).then(c=>{
    if(!c.ready||!window.WhopElements)throw 0;
    const pr=c.price;
    if(pr&&pr.currency){
      const f=n=>new Intl.NumberFormat(undefined,{style:'currency',currency:pr.currency.toUpperCase()}).format(n);
      const d=pr.days,per=d==7?'week':d==30||d==31?'month':d==365?'year':d==1?'day':d+' days';
      const el=document.getElementById('coPlanP');if(el)el.textContent=f(pr.initial);
    }
    const whop=window.WhopElements();
    const pay=whop.payments.create({accountId:c.account,plan:o.plan||c.plan,returnUrl:location.origin+'/payment',appearance:{theme:{appearance:'dark',accentColor:'gray',grayColor:'slate'},variables:{'--radius':'13px'}}});
    pay.create('email').mount('#bfTE');
    pay.create('payment',{fields:{billingDetails:'never'},excludedPaymentMethodTypes:['us_bank_account'],wallets:{},order:['card'],onChange:e=>{ready=!!e.complete;set();}}).mount('#bfTP');
    pay.create('branding').mount('#bfTB');
    btn.onclick=async()=>{
      if(busy)return;busy=true;say('');set();
      const fail=m=>{busy=false;set();say(m);o.onError&&o.onError(m);};
      try{
        const {confirmationToken}=await pay.createConfirmationToken({});
        const r=await fetch('/api/pay',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmationToken,clickId:o.clickId})});
        const p=await r.json();
        if(!r.ok||!p.id)return fail(p.error&&p.error!=='payment_failed'?'Payment could not be started. Please try again.':'Your card was declined. Please try another card.');
        if(p.status!=='paid'){
          const x=await whop.payments.handleNextAction({clientSecret:p.client_secret});
          if(x.redirected)return;
          if(x.status!=='succeeded'&&x.status!=='processing')return fail((x.lastPaymentError&&x.lastPaymentError.message)||'The payment step was not completed. Please try again.');
        }
        say('Payment received. Confirming…');o.onPaid&&o.onPaid(); /* success is only shown by the webhook-driven unlock */
      }catch(e){fail((e&&e.message)||'Something went wrong. Please try again.');}
    };
  }).catch(()=>{o.fallback&&o.fallback();});
};

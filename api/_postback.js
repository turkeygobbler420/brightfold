// Sends the server-to-server postback to the ad network / tracker. Only call this after a payment is verified.
// POSTBACK_URL format (partner's): https://partner.example/postback?click_id={sub1}&payout={payout_amount}
// Supported placeholders: {sub1} (= click id), {sub3}, {payout_amount}, {txn_id}, {currency}, {amount} (what the customer paid), {status} (+ legacy {click_id}, {payout}).
const PAYOUT=process.env.POSTBACK_PAYOUT||'24.00';
const CURRENCY=process.env.POSTBACK_CURRENCY||'USD';
module.exports=async function sendPostback({clickId,txnId,sub3,amount,currency,status}){
  const tpl=process.env.POSTBACK_URL;
  if(!tpl)return {ok:false,reason:'POSTBACK_URL not set'};
  if(!clickId)return {ok:false,reason:'no click id (organic visitor)'};
  const enc=encodeURIComponent;
  const url=tpl.replace(/\{(?:sub1|click_id)\}/g,enc(clickId)).replace(/\{sub3\}/g,enc(sub3||'')).replace(/\{(?:payout_amount|payout)\}/g,enc(PAYOUT)).replace(/\{payout\}/g,enc(PAYOUT)).replace(/\{txn_id\}/g,enc(txnId||'')).replace(/\{currency\}/g,enc(currency||CURRENCY)).replace(/\{amount\}/g,enc(amount==null?'':amount)).replace(/\{status\}/g,enc(status||'paid'));
  let lastErr='';
  for(let i=0;i<3;i++){
    try{
      const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),5000);
      const r=await fetch(url,{method:'GET',signal:ctl.signal});clearTimeout(t);
      if(r.ok)return {ok:true,status:r.status};
      lastErr='HTTP '+r.status;
    }catch(e){lastErr=String(e&&e.message||e);}
    await new Promise(r=>setTimeout(r,500*(i+1)));
  }
  return {ok:false,reason:lastErr};
};

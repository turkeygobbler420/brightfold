// Called by the payment provider (server to server) when a charge succeeds. Fires the $24 postback.
// Security: requires a valid HMAC-SHA256 signature of the raw body in the `x-signature` header (hex), using PAYMENT_WEBHOOK_SECRET.
// NOTE: provider-specific signature schemes (Stripe, Paddle, ...) differ; replace verify() with the provider's official check when one is chosen.
const crypto=require('crypto');
const sendPostback=require('./_postback');
const seen=new Map(); // best-effort in-memory de-dup per warm instance; the tracker should also de-dup on txn_id
function raw(req){return new Promise((ok,no)=>{let b='';req.on('data',c=>{b+=c;if(b.length>1e5){no(new Error('big'));req.destroy();}});req.on('end',()=>ok(b));req.on('error',no);});}
function verify(body,sig){
  const secret=process.env.PAYMENT_WEBHOOK_SECRET;if(!secret||!sig)return false;
  const mac=crypto.createHmac('sha256',secret).update(body).digest('hex');
  const a=Buffer.from(mac),b=Buffer.from(String(sig));
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  let body;try{body=await raw(req);}catch(e){return res.status(400).end();}
  if(!verify(body,req.headers['x-signature']))return res.status(401).end();
  let ev;try{ev=JSON.parse(body);}catch(e){return res.status(400).end();}
  // Expected: {txn_id, status:'paid', sub1 (click id), sub3?, amount?, currency?}. Only a confirmed, paid charge triggers a postback.
  if(ev.status!=='paid'||!ev.txn_id)return res.status(200).json({skipped:true});
  if(seen.has(ev.txn_id))return res.status(200).json({duplicate:true});
  const r=await sendPostback({clickId:ev.sub1||ev.click_id,txnId:ev.txn_id,sub3:ev.sub3,amount:ev.amount,currency:ev.currency,status:ev.status});
  if(r.ok)seen.set(ev.txn_id,Date.now());
  console.log('postback',ev.txn_id,r.ok?'sent':'failed: '+r.reason);
  res.status(r.ok||r.reason.startsWith('no click')?200:502).json({postback:r.ok});
};

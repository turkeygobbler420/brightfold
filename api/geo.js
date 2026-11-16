// Returns the visitor's country (ISO code) as seen by Vercel's edge. Nothing is stored or logged.
module.exports=(req,res)=>{
  const cc=String(req.headers['x-vercel-ip-country']||'').toUpperCase();
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.status(200).send(JSON.stringify({country:/^[A-Z]{2}$/.test(cc)?cc:null}));
};

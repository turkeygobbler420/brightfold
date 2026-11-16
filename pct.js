/* PLACEHOLDER percentile figures (TODO: replace with the real calculation).
   One random integer 87-95, stable for the browser session, so every "ahead of X% of test takers" text and card agree. */
(function(){
  var a=0;
  try{a=+sessionStorage.getItem('bf_ph_pct')||0;}catch(e){}
  if(!(a>=87&&a<=95)){a=87+Math.floor(Math.random()*9);try{sessionStorage.setItem('bf_ph_pct',a);}catch(e){}}
  var c=Math.max(87,a-1);
  window.BF_PCT={ahead:a,top:100-a,country:c,countryTop:100-c};
})();

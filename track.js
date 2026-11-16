/* Captures the ad network's click ID from the landing URL so a paid conversion can be attributed to it later.
   Stored locally only; it is sent to our own server at checkout, never to third parties from the browser. */
(function(){
  var KEYS=['sub1','click_id','clickid','cid','subid','sub_id','aff_sub','transaction_id','irclickid','gclid','ttclid','fbclid'];
  var SK='bf_click';
  function get(){try{return JSON.parse(localStorage.getItem(SK)||'null');}catch(e){return null;}}
  try{
    var q=new URLSearchParams(location.search),found=null;
    for(var i=0;i<KEYS.length;i++){var v=q.get(KEYS[i]);if(v&&/^[\w.\-:]{1,200}$/.test(v)){found={k:KEYS[i],v:v,t:Date.now()};break;}}
    var s3=q.get('sub3');if(found){if(s3&&/^[\w.\-:]{1,200}$/.test(s3))found.s3=s3;localStorage.setItem(SK,JSON.stringify(found));}
  }catch(e){}
  window.BF_TRACK={sub3:function(){var c=get();return c&&c.s3||null;},clickId:function(){var c=get();return c&&Date.now()-c.t<30*864e5?c.v:null;}};
})();

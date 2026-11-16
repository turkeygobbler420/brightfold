/* Runtime page translator: swaps English UI text for the selected language using a per-language dictionary
   (site-i18n-<lang>.js defines BF_SD[lang] = {english: translated}). Keys may hold {#0},{#1}… placeholders. */
(function(){
  var SD=window.BF_SD=window.BF_SD||{};
  var lang='en',pats={},loading={};
  var orig=new WeakMap();   // text node -> original English
  var oattr=new WeakMap();  // element -> {attr: original}
  var ATTR=['aria-label','title','placeholder','alt','content'];
  var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,NOSCRIPT:1,CODE:1};
  var busy=false,obs=null,cache={};
  var esc=function(s){return s.replace(/[.*+?^$|()\[\]\\]/g,'\\$&');};

  function build(l){
    var d=SD[l];if(!d||pats[l])return;var a=[];
    for(var k in d){if(k.indexOf('{#')<0)continue;
      var re='^'+esc(k).replace(/\{#\d+\}/g,'(.+?)')+'$',n=(k.match(/\{#\d+\}/g)||[]).length;
      var i=k.indexOf('{#'),j=k.lastIndexOf('}')+1;
      a.push({re:new RegExp(re),v:d[k],n:n,len:k.length,pre:k.slice(0,i),suf:k.slice(j),min:i+k.length-j});}
    a.sort(function(x,y){return y.len-x.len;});pats[l]=a;cache[l]=Object.create(null);
  }
  function tr(s,depth){
    var d=SD[lang];if(!d)return null;
    var m=s.match(/^(\s*)([\s\S]*?)(\s*)$/),core=m[2];if(!core)return null;
    var key=core.replace(/\s+/g,' ');
    if(Object.prototype.hasOwnProperty.call(d,key))return m[1]+d[key]+m[3];
    if(/^[^A-Za-zÀ-ɏ]*$/.test(key))return null;
    var mc=cache[lang],hit=!depth&&mc?mc[key]:void 0;
    if(hit!==void 0)return hit===null?null:m[1]+hit+m[3];
    var p=pats[lang]||[],res=null;
    for(var i=0;i<p.length;i++){var q=p[i];
      if(key.length<q.min||(q.pre&&key.lastIndexOf(q.pre,0)!==0)||(q.suf&&key.indexOf(q.suf,key.length-q.suf.length)<0))continue;
      var r=q.re.exec(key);if(r){
      res=q.v.replace(/\{#(\d+)\}/g,function(x,n){var c=r[+n+1];if(c==null)return '';var t=(depth||0)<2?tr(c,(depth||0)+1):null;return t==null?c:t.trim();});
      break;}}
    if(!depth&&mc)mc[key]=res;
    return res===null?null:m[1]+res+m[3];
  }
  function textNode(n){
    var o=orig.has(n)?orig.get(n):n.nodeValue;
    if(lang==='en'){if(orig.has(n)&&n.nodeValue!==o){n.nodeValue=o;}return;}
    var t=tr(o);
    if(t!==null){if(!orig.has(n))orig.set(n,o);if(n.nodeValue!==t)n.nodeValue=t;}
    else if(orig.has(n)&&n.nodeValue===orig.get(n)){/* unchanged */}
  }
  function attrs(el){
    if(el.nodeType!==1)return;
    var tag=el.tagName;
    for(var i=0;i<ATTR.length;i++){var a=ATTR[i];
      if(a==='content'&&!(tag==='META'&&/^(description|og:title|og:description|twitter:title|twitter:description)$/.test(el.getAttribute('name')||el.getAttribute('property')||'')))continue;
      if(!el.hasAttribute(a))continue;
      var rec=oattr.get(el);if(!rec){rec={};oattr.set(el,rec);}
      var cur=el.getAttribute(a),o=a in rec?rec[a]:cur;
      if(lang==='en'){if(a in rec&&cur!==o)el.setAttribute(a,o);continue;}
      var t=tr(o);
      if(t!==null){rec[a]=o;if(cur!==t)el.setAttribute(a,t);}
    }
  }
  function walk(root){
    if(!root)return;
    if(root.nodeType===3){if(!(root.parentNode&&SKIP[root.parentNode.nodeName]))textNode(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1){if(SKIP[root.tagName]||root.hasAttribute('data-no-i18n'))return;attrs(root);}
    var c=root.firstChild;
    while(c){walk(c);c=c.nextSibling;}
  }
  function run(){
    busy=true;
    try{walk(document.documentElement);}catch(e){}
    if(obs)obs.takeRecords();busy=false;
  }
  function start(){
    if(obs)return;
    obs=new MutationObserver(function(recs){
      if(busy||lang==='en')return;busy=true;
      try{
        for(var i=0;i<recs.length;i++){var r=recs[i];
          if(r.type==='characterData'){var p=r.target.parentNode;if(!(p&&SKIP[p.nodeName]))textNode(r.target);}
          else if(r.type==='attributes')attrs(r.target);
          else for(var j=0;j<r.addedNodes.length;j++)walk(r.addedNodes[j]);}
      }catch(e){}
      obs.takeRecords();busy=false;
    });
    obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});
  }
  function load(l,cb){
    if(l==='en'||SD[l])return cb();
    if(loading[l]){loading[l].push(cb);return;}
    loading[l]=[cb];
    var s=document.createElement('script');
    var base=(document.querySelector('script[src*="i18n-dom.js"]')||{}).src||'';var v=(base.match(/\?v=\w+/)||[''])[0];
    s.src='site-i18n-'+l+'.js'+v;
    var done=function(){var q=loading[l]||[];delete loading[l];q.forEach(function(f){f();});};
    s.onload=done;s.onerror=done;document.head.appendChild(s);
  }
  function setLang(l){
    lang=l||'en';start();
    if(pats[lang]){run();return;}
    load(lang,function(){build(lang);run();});
  }
  var warmed={};
  function warm(l){ /* prefetch dictionaries so a later switch needs no download */
    var all=l?[l]:['es','pt','fr','de','it','tr','pl'];
    all.forEach(function(x){if(x==='en'||SD[x]||warmed[x]||loading[x])return;warmed[x]=1;
      var base=(document.querySelector('script[src*="i18n-dom.js"]')||{}).src||'',v=(base.match(/\?v=\w+/)||[''])[0];
      var k=document.createElement('link');k.rel='prefetch';k.as='script';k.href='site-i18n-'+x+'.js'+v;document.head.appendChild(k);});
  }
  try{var sv=localStorage.getItem('bf_lang');if(sv&&sv!=='en'&&/^[a-z]{2}$/.test(sv)){lang=sv;load(sv,function(){build(sv);});}}catch(e){}
  document.addEventListener('pointerover',function(e){var b=e.target.closest&&e.target.closest('.lang-menu,[data-lang]');if(b)warm();},{passive:true,once:true});
  document.addEventListener('focusin',function(e){var b=e.target.closest&&e.target.closest('.lang-menu,[data-lang]');if(b)warm();},{passive:true,once:true});
  document.addEventListener('touchstart',function(e){var b=e.target.closest&&e.target.closest('.lang-menu,[data-lang]');if(b)warm();},{passive:true,once:true});
  function tt(s){var t=lang==='en'?null:tr(String(s));return t===null?s:t;}
  function left(){ /* debugging aid: visible strings that found no translation */
    var out={},w=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT,null);
    while(w.nextNode()){var n=w.currentNode,p=n.parentNode;if(!p||SKIP[p.nodeName])continue;
      var s=n.nodeValue.replace(/\s+/g,' ').trim();if(!/[A-Za-z]{3}/.test(s))continue;
      if(orig.has(n))continue;if(tr(s)===null)out[s]=1;}
    document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(function(e){['aria-label','title','placeholder','alt'].forEach(function(a){
      var v=e.getAttribute(a);if(v&&/[A-Za-z]{3}/.test(v)&&!(oattr.get(e)&&a in oattr.get(e))&&tr(v)===null)out[v.trim()]=1;});});
    return Object.keys(out);
  }
  window.BF_DOM={set:setLang,t:tt,run:run,left:left};
  window.BF_LOC=function(){return lang==='en'?'en-GB':lang;};
  ['alert','confirm','prompt'].forEach(function(n){var f=window[n];if(typeof f!=='function')return;
    window[n]=function(m){var a=[].slice.call(arguments);if(typeof m==='string')a[0]=tt(m);return f.apply(window,a);};});
})();

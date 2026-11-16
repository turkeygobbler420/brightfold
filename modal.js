/* Shared dialog helper: keeps Tab focus inside the top-most dialog, optional Escape, and restores focus on release. */
window.BF_E=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});};
(function(){
  var stack=[];
  var SEL='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function focusables(el){return [].filter.call(el.querySelectorAll(SEL),function(e){return e.offsetParent!==null;});}
  function top(){return stack[stack.length-1];}
  function open(el,o){
    if(!el)return;o=o||{};
    var t=top();
    if(t&&t.key===o.key&&o.key){t.el=el;t.o=o;}
    else stack.push({key:o.key||'',el:el,o:o,prev:document.activeElement});
    el.setAttribute('aria-modal','true');if(!el.getAttribute('role'))el.setAttribute('role','dialog');
    if(!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')){
      var h=el.querySelector('h1,h2,h3');if(h){if(!h.id)h.id='bfm'+Math.random().toString(36).slice(2,8);el.setAttribute('aria-labelledby',h.id);}
    }
    if(o.focus!==false&&!el.contains(document.activeElement)){
      var f=focusables(el)[0];
      if(f)f.focus();else{el.tabIndex=-1;el.focus();}
    }
  }
  function release(key){
    var i=stack.length-1;
    if(key)for(;i>=0&&stack[i].key!==key;i--);
    if(i<0)return;
    var rec=stack.splice(i,1)[0];
    var p=rec.prev;
    if(p&&p.focus&&document.contains(p)&&(!document.activeElement||document.activeElement===document.body||!document.contains(document.activeElement)||rec.el.contains(document.activeElement)))try{p.focus();}catch(e){}
  }
  document.addEventListener('keydown',function(e){
    var t=top();if(!t)return;
    if(e.key==='Escape'&&t.o.onEscape){e.preventDefault();t.o.onEscape();return;}
    if(e.key!=='Tab')return;
    var f=focusables(t.el);
    if(!f.length){e.preventDefault();return;}
    var first=f[0],last=f[f.length-1],a=document.activeElement;
    if(!t.el.contains(a)){e.preventDefault();first.focus();}
    else if(e.shiftKey&&a===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&a===last){e.preventDefault();first.focus();}
  });
  window.BF_MODAL={open:open,release:release};
})();

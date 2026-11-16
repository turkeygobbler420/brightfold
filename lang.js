(function(){
var L=[['en','English'],['es','Español'],['pt','Português'],['fr','Français'],['de','Deutsch'],['it','Italiano'],['tr','Türkçe'],['pl','Polski']];
var T={
 label:{en:'Language:',es:'Idioma:',pt:'Idioma:',fr:'Langue :',de:'Sprache:',it:'Lingua:',tr:'Dil:',pl:'Język:'},
 start:{en:'Start My IQ Test',es:'Empezar mi test de CI',pt:'Começar meu teste de QI',fr:'Commencer mon test de QI',de:'Meinen IQ-Test starten',it:'Inizia il mio test del QI',tr:'IQ Testimi Başlat',pl:'Rozpocznij mój test IQ'},
 product:{en:'Product',es:'Producto',pt:'Produto',fr:'Produit',de:'Produkt',it:'Prodotto',tr:'Ürün',pl:'Produkt'},
 support:{en:'Support',es:'Soporte',pt:'Suporte',fr:'Assistance',de:'Support',it:'Assistenza',tr:'Destek',pl:'Wsparcie'},
 legal:{en:'Legal',es:'Legal',pt:'Legal',fr:'Mentions légales',de:'Rechtliches',it:'Note legali',tr:'Yasal',pl:'Informacje prawne'},
 how:{en:'How it works',es:'Cómo funciona',pt:'Como funciona',fr:'Comment ça marche',de:'So funktioniert es',it:'Come funziona',tr:'Nasıl çalışır',pl:'Jak to działa'},
 courses:{en:'Courses',es:'Cursos',pt:'Cursos',fr:'Cours',de:'Kurse',it:'Corsi',tr:'Kurslar',pl:'Kursy'},
 reviews:{en:'Reviews',es:'Opiniones',pt:'Avaliações',fr:'Avis',de:'Bewertungen',it:'Recensioni',tr:'Yorumlar',pl:'Opinie'},
 pricing:{en:'Pricing',es:'Precios',pt:'Preços',fr:'Tarifs',de:'Preise',it:'Prezzi',tr:'Fiyatlar',pl:'Cennik'},
 faq:{en:'FAQ',es:'Preguntas frecuentes',pt:'Perguntas frequentes',fr:'FAQ',de:'FAQ',it:'FAQ',tr:'SSS',pl:'FAQ'},
 help:{en:'Help',es:'Ayuda',pt:'Ajuda',fr:'Aide',de:'Hilfe',it:'Aiuto',tr:'Yardım',pl:'Pomoc'},
 cancel:{en:'How to cancel',es:'Cómo cancelar',pt:'Como cancelar',fr:'Comment résilier',de:'Kündigen',it:'Come annullare',tr:'Nasıl iptal edilir',pl:'Jak anulować'},
 contact:{en:'Contact',es:'Contacto',pt:'Contato',fr:'Contact',de:'Kontakt',it:'Contatti',tr:'İletişim',pl:'Kontakt'},
 privacy:{en:'Privacy Policy',es:'Política de privacidad',pt:'Política de privacidade',fr:'Politique de confidentialité',de:'Datenschutz',it:'Informativa sulla privacy',tr:'Gizlilik Politikası',pl:'Polityka prywatności'},
 terms:{en:'Terms of Service',es:'Términos del servicio',pt:'Termos de serviço',fr:'Conditions d’utilisation',de:'Nutzungsbedingungen',it:'Termini di servizio',tr:'Hizmet Şartları',pl:'Regulamin'},
 cookie:{en:'Cookie Policy',es:'Política de cookies',pt:'Política de cookies',fr:'Politique de cookies',de:'Cookie-Richtlinie',it:'Cookie Policy',tr:'Çerez Politikası',pl:'Polityka cookies'},
 refund:{en:'Refund Policy',es:'Política de reembolso',pt:'Política de reembolso',fr:'Politique de remboursement',de:'Rückerstattung',it:'Politica di rimborso',tr:'İade Politikası',pl:'Polityka zwrotów'},
 copy:{en:'Copyright © 2024-2026 Mindmetric.',es:'Copyright © 2024-2026 Mindmetric.',pt:'Copyright © 2024-2026 Mindmetric.',fr:'Copyright © 2024-2026 Mindmetric.',de:'Copyright © 2024-2026 Mindmetric.',it:'Copyright © 2024-2026 Mindmetric.',tr:'Telif Hakkı © 2024-2026 Mindmetric.',pl:'Prawa autorskie © 2024-2026 Mindmetric.'}
};
var MH={
 en:function(n,s){return 'Press Start. After a 3-2-1 countdown, '+n+' digits will appear one at a time, '+s+' seconds in total. You see them once.'},
 es:function(n,s){return 'Pulsa Empezar. Tras una cuenta atrás 3-2-1, aparecerán '+n+' dígitos uno a uno, '+s+' segundos en total. Los ves una sola vez.'},
 pt:function(n,s){return 'Toque em Começar. Após uma contagem 3-2-1, '+n+' dígitos aparecerão um por vez, '+s+' segundos no total. Você os vê uma só vez.'},
 fr:function(n,s){return 'Appuyez sur Commencer. Après un compte à rebours 3-2-1, '+n+' chiffres apparaîtront un par un, '+s+' secondes au total. Vous ne les voyez qu’une fois.'},
 de:function(n,s){return 'Drücke Start. Nach einem 3-2-1-Countdown erscheinen '+n+' Ziffern nacheinander, insgesamt '+s+' Sekunden. Du siehst sie nur einmal.'},
 it:function(n,s){return 'Premi Avvia. Dopo un conto alla rovescia 3-2-1, appariranno '+n+' cifre una alla volta, '+s+' secondi in totale. Le vedi una sola volta.'},
 tr:function(n,s){return 'Başlat’a basın. 3-2-1 geri sayımından sonra '+n+' rakam tek tek görünecek, toplam '+s+' saniye. Her birini yalnızca bir kez görürsünüz.'},
 pl:function(n,s){return 'Naciśnij Start. Po odliczaniu 3-2-1 pojawi się '+n+' cyfr jedna po drugiej, łącznie '+s+' sekundy. Widzisz je tylko raz.'}
};
var UI={"en":{"back":"Back","choose":"Choose your answer:","nOf":"{n} of {N}","finish":"Finish","finishAny":"{n} unanswered · finish anyway","start":"Start","cont":"Continue","keys":"Keys 1–6 to answer","patQ":"Which tile completes the pattern?","item":"Item {n} of {N}","lastDigit":"Last digit first.","typeFwd":"Type the digits in order","typeRev":"Type the digits in reverse order","shown":"The digits have been shown.","lang":"Language"},"de":{"back":"Zurück","choose":"Wähle deine Antwort:","nOf":"{n} von {N}","finish":"Abschließen","finishAny":"{n} offen · trotzdem abschließen","start":"Starten","cont":"Weiter","keys":"Tasten 1–6 zum Antworten","patQ":"Welche Kachel vervollständigt das Muster?","item":"Element {n} von {N}","lastDigit":"Zuerst die letzte Ziffer.","typeFwd":"Tippe die Ziffern in der richtigen Reihenfolge ein","typeRev":"Tippe die Ziffern in umgekehrter Reihenfolge ein","shown":"Die Ziffern wurden angezeigt.","lang":"Sprache"},"it":{"back":"Indietro","choose":"Scegli la tua risposta:","nOf":"{n} di {N}","finish":"Termina","finishAny":"{n} senza risposta · termina comunque","start":"Inizia","cont":"Continua","keys":"Tasti 1–6 per rispondere","patQ":"Quale tessera completa il motivo?","item":"Elemento {n} di {N}","lastDigit":"Prima l'ultima cifra.","typeFwd":"Scrivi le cifre in ordine","typeRev":"Scrivi le cifre in ordine inverso","shown":"Le cifre sono state mostrate.","lang":"Lingua"},"es":{"back":"Atrás","choose":"Elige tu respuesta:","nOf":"{n} de {N}","finish":"Terminar","finishAny":"{n} sin responder · terminar igual","start":"Empezar","cont":"Continuar","keys":"Teclas 1–6 para responder","patQ":"¿Qué ficha completa el patrón?","item":"Elemento {n} de {N}","lastDigit":"Primero el último dígito.","typeFwd":"Escribe los dígitos en orden","typeRev":"Escribe los dígitos en orden inverso","shown":"Los dígitos ya se han mostrado.","lang":"Idioma"},"fr":{"back":"Retour","choose":"Choisissez votre réponse :","nOf":"{n} sur {N}","finish":"Terminer","finishAny":"{n} sans réponse · terminer quand même","start":"Commencer","cont":"Continuer","keys":"Touches 1 à 6 pour répondre","patQ":"Quelle tuile complète le motif ?","item":"Élément {n} sur {N}","lastDigit":"Commencez par le dernier chiffre.","typeFwd":"Saisissez les chiffres dans l'ordre","typeRev":"Saisissez les chiffres dans l'ordre inverse","shown":"Les chiffres ont été affichés.","lang":"Langue"}};
function ui(k,a,b){var d=UI[cur]||UI.en;var v=d[k]||UI.en[k]||k;return v.replace('{n}',a).replace('{N}',b);}
var cur='en';
try{var sv=localStorage.getItem('bf_lang');if(sv&&T.label.hasOwnProperty(sv))cur=sv;}catch(e){}
var globe='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.7 3.9 5.8 3.9 9.2s-1.3 6.5-3.9 9.2c-2.6-2.7-3.9-5.8-3.9-9.2S9.4 5.5 12 2.8z"/></svg>';
function t(k){return (T[k]&&(T[k][cur]||T[k].en))||''}
function pill(cls){
 return '<div class="lang '+(cls||'')+'" role="group" aria-label="Language">'+globe+'<span class="lang-l">'+t('label')+'</span>'+
 L.map(function(l){return '<button type="button" data-lang="'+l[0]+'" title="'+l[1]+'" aria-pressed="'+(l[0]===cur)+'">'+l[0].toUpperCase()+'</button>'}).join('')+'</div>';
}
var FL={en:'1f1ec-1f1e7',es:'1f1ea-1f1f8',pt:'1f1f5-1f1f9',fr:'1f1eb-1f1f7',de:'1f1e9-1f1ea',it:'1f1ee-1f1f9',tr:'1f1f9-1f1f7',pl:'1f1f5-1f1f1'};
function flag(l,c){return '<img class="'+(c||'flag')+'" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/'+FL[l]+'.svg" alt="" width="20" height="20" draggable="false" decoding="async">';}
function menu(){
 var nm='';L.forEach(function(l){if(l[0]===cur)nm=l[1]});
 return '<button type="button" class="lm-btn" aria-haspopup="true" aria-expanded="false" aria-label="'+t('label').replace(/[:：]\s*$/,'')+': '+nm+'">'+flag(cur)+'<span class="lm-c">'+cur.toUpperCase()+'</span><svg class="lm-car" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
 '<ul class="lm-list" hidden>'+L.map(function(l){return '<li><button type="button" data-lang="'+l[0]+'" lang="'+l[0]+'" aria-pressed="'+(l[0]===cur)+'">'+flag(l[0])+'<span>'+l[1]+'</span></button></li>'}).join('')+'</ul>';
}
function apply(){
 var ms=document.querySelectorAll('[data-lang-menu]');
 for(var m=0;m<ms.length;m++)ms[m].innerHTML=menu();
 document.documentElement.lang=cur;
 var els=document.querySelectorAll('[data-i18n]');
 for(var i=0;i<els.length;i++){var v=t(els[i].getAttribute('data-i18n'));if(v)els[i].textContent=v;}
 var sb=document.querySelectorAll('.js-start');
 for(var j=0;j<sb.length;j++){if(!sb[j].closest('#app'))sb[j].textContent=t('start');}
 var hosts=document.querySelectorAll('[data-lang-host]');
 for(var h=0;h<hosts.length;h++)hosts[h].innerHTML=pill(hosts[h].getAttribute('data-lang-host'));
 try{window.BF_DOM&&BF_DOM.set(cur);}catch(e){}
}
function set(l){
 if(!T.label.hasOwnProperty(l))return;cur=l;
 try{localStorage.setItem('bf_lang',l)}catch(e){}
 apply();
 try{if(typeof st!=='undefined'&&st&&!st.done&&st.view&&st.seen[st.i]!=='run')st.view();}catch(e){}
 try{window.BF_DOCK&&window.BF_DOCK();}catch(e){}
 try{window.BF_HOME&&BF_HOME.relang&&BF_HOME.relang();}catch(e){}
}
function Q(){return window.BF_Q&&window.BF_Q[cur];}
function x(k,a,b){var q=Q(),v=(q&&q._ui&&q._ui[k])||(window.BF_Q&&BF_Q.en._ui[k])||k;return String(v).replace(/\{n\}/g,a).replace(/\{N\}/g,b);}
function item(id){var q=Q();return q&&q[id]||null;}
function dom(i){var q=Q();return q&&q._domains&&q._domains[i]||null;}
function fact(k){var q=Q();return q&&q._facts&&q._facts[k]||null;}
function cheer(i){var q=Q();return q&&q._cheers&&q._cheers[i]||null;}
function compass(h){var m={de:['N','O','S','W'],it:['N','E','S','O'],es:['N','E','S','O'],fr:['N','E','S','O']}[cur];if(!m)return h;var f=['N','E','S','W'],i=0;return h.replace(/<span>([NESW])<\/span>/g,function(){return '<span>'+m[i++]+'</span>';});}
function closeMenus(){var o=document.querySelectorAll('[data-lang-menu] .lm-list');for(var i=0;i<o.length;i++){o[i].hidden=true;var bt=o[i].parentNode.querySelector('.lm-btn');if(bt)bt.setAttribute('aria-expanded','false');}}
document.addEventListener('click',function(e){
 var tg=e.target.closest?e.target:e.target.parentNode;
 var tb=tg.closest&&tg.closest('.lm-btn');
 if(tb){var ul=tb.parentNode.querySelector('.lm-list'),was=!ul.hidden;closeMenus();if(!was){ul.hidden=false;tb.setAttribute('aria-expanded','true');}return;}
 var b=tg.closest&&tg.closest('[data-lang]');
 if(b&&b.tagName==='BUTTON'){e.preventDefault();closeMenus();set(b.getAttribute('data-lang'));return;}
 if(!(tg.closest&&tg.closest('[data-lang-menu]')))closeMenus();
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){var o=document.querySelector('[data-lang-menu] .lm-list:not([hidden])');if(o){var bt=o.parentNode.querySelector('.lm-btn');closeMenus();if(bt)bt.focus();}}});
window.BF_LANG={pill:pill,t:t,get:function(){return cur},set:set,ui:ui,memoHint:function(n,s){return (MH[cur]||MH.en)(n,s)},apply:apply,x:x,item:item,dom:dom,fact:fact,cheer:cheer,compass:compass};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();

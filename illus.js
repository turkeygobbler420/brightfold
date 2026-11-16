/* Original flat illustrations for the motivation interruptions.
   Drawn here (not borrowed), styled as die-cut stickers by .fc2-st svg in app.css.
   Each scene animates the message it accompanies (classes .ia-* in app.css):
   steady pace -> ticking clock + running; top % -> rising onto the podium;
   halfway -> building and climbing the steps; strongest area -> bulb switching on;
   almost done -> climbing to the summit and planting the flag.
   Base styles are the finished pose, so reduced-motion users see a complete picture. */
(function(){
const INK='#121212',SK=['#f1c27d','#c68642','#8d5524','#f7d7b5'];
function man(x,y,o){
  const s=o.skin,h=o.hair,sh=o.shirt,pa=o.pants||'#2b3a67';
  const la=o.la||[-18,30],ra=o.ra||[18,30],ll=o.ll||[-8,44],rl=o.rl||[8,44];
  const hipY=y+40;
  const line=(x1,y1,x2,y2,c,w)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  let g='';
  g+=line(x-6,hipY,x+ll[0],hipY+ll[1],pa,12)+line(x+6,hipY,x+rl[0],hipY+rl[1],pa,12);
  g+=`<ellipse cx="${x+ll[0]-2}" cy="${hipY+ll[1]+3}" rx="9" ry="5" fill="${INK}"/><ellipse cx="${x+rl[0]+2}" cy="${hipY+rl[1]+3}" rx="9" ry="5" fill="${INK}"/>`;
  if(o.long)g+=`<rect x="${x-20}" y="${y-30}" width="40" height="52" rx="18" fill="${h}"/>`;
  g+=`<rect x="${x-15}" y="${y}" width="30" height="${hipY-y+4}" rx="12" fill="${sh}"/>`;
  g+=line(x-13,y+7,x+la[0],y+la[1],sh,10)+line(x+13,y+7,x+ra[0],y+ra[1],sh,10);
  g+=`<circle cx="${x+la[0]}" cy="${y+la[1]}" r="5.5" fill="${s}"/><circle cx="${x+ra[0]}" cy="${y+ra[1]}" r="5.5" fill="${s}"/>`;
  g+=`<rect x="${x-5}" y="${y-8}" width="10" height="12" rx="4" fill="${s}"/><circle cx="${x}" cy="${y-22}" r="17" fill="${s}"/>`;
  g+=`<path d="M${x-18} ${y-24}a18 18 0 0 1 36 0q-10-9-18-8q-9-1-18 8z" fill="${h}"/>`;
  if(o.bun)g+=`<circle cx="${x+10}" cy="${y-40}" r="8" fill="${h}"/>`;
  g+=`<circle cx="${x-6}" cy="${y-20}" r="1.8" fill="${INK}"/><circle cx="${x+6}" cy="${y-20}" r="1.8" fill="${INK}"/><path d="M${x-5} ${y-13}q5 5 10 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return g;
}
// confetti pieces; each sits in its own group so it can drift/twinkle independently
const confetti=(pts,cls)=>pts.map(([x,y,c,t],i)=>`<g class="${cls||'ia-fall'}" style="animation-delay:${(-(i*.43)).toFixed(2)}s">`+(t?`<rect x="${x}" y="${y}" width="9" height="5" rx="1.5" fill="${c}" transform="rotate(${20+i*37} ${x} ${y})"/>`:`<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`)+'</g>').join('');
const V='viewBox="0 0 320 250"',GROUND=`<path d="M12 236H308" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
const ART={
  // ahead of the crowd (people from your country): a globe with a bouncing pin, you cheering in front
  world:`<svg ${V}>${GROUND}
   <circle class="ia-halo" cx="116" cy="124" r="92" fill="#f9df6d" opacity=".35"/>
   <circle cx="116" cy="124" r="70" fill="#b0c4ef" stroke="${INK}" stroke-width="6"/>
   <path d="M76 100q14-22 38-18 10 10-4 20t-8 20q-16 4-26-6zM130 134q18-6 28 8-4 22-22 24-10-14-6-32z" fill="#a0c35a"/>
   <ellipse cx="116" cy="124" rx="30" ry="70" fill="none" stroke="${INK}" stroke-width="3" opacity=".5"/><path d="M46 124h140" stroke="${INK}" stroke-width="3" opacity=".5"/>
   <g class="ia-pin"><path d="M116 30c-16 0-26 11-26 25 0 18 26 40 26 40s26-22 26-40c0-14-10-25-26-25z" fill="#d6453a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><circle cx="116" cy="54" r="9" fill="#fff"/></g>
   <path d="M60 236l16-20h80l16 20z" fill="#dcd6c4"/>
   <g class="ia-cheer">${man(250,150,{skin:SK[1],hair:'#2b2118',shirt:'#ba81c5',la:[-26,-26],ra:[26,-26],ll:[-9,40],rl:[9,40]})}</g>
   ${confetti([[40,50,'#f9df6d'],[200,40,'#ba81c5',1],[290,70,'#a0c35a'],[24,160,'#f5a25d',1],[206,118,'#5b7fd6']],'ia-tw')}</svg>`,
  // steady pace: the clock hand sweeps round at an even speed while the runner keeps up
  clock:`<svg ${V}>${GROUND}
   <rect x="96" y="30" width="28" height="14" rx="4" fill="${INK}"/><rect x="104" y="40" width="12" height="14" fill="${INK}"/>
   <circle cx="110" cy="132" r="78" fill="#fff" stroke="${INK}" stroke-width="7"/>
   <path d="M110 132L110 56A76 76 0 0 1 176 94z" fill="#f9df6d"/>
   ${[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{const a=i*Math.PI/6,r1=64,r2=i%3?58:54;return `<path d="M${110+r1*Math.sin(a)} ${132-r1*Math.cos(a)}L${110+r2*Math.sin(a)} ${132-r2*Math.cos(a)}" stroke="${INK}" stroke-width="${i%3?3:5}" stroke-linecap="round"/>`}).join('')}
   <g class="ia-hand"><path d="M110 132L110 70" stroke="#d6453a" stroke-width="4" stroke-linecap="round"/><circle cx="110" cy="132" r="0" /></g>
   <path d="M110 132L110 90" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M110 132L142 148" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="110" cy="132" r="8" fill="${INK}"/>
   <g class="ia-bolt"><path d="M196 70l-14 24h14l-10 22 28-30h-16l12-16z" fill="#5b7fd6"/></g>
   <g class="ia-lines"><path d="M214 112h-24M218 128h-34M214 144h-24" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g>
   <g class="ia-run">${man(256,126,{skin:SK[1],hair:'#2b2118',shirt:'#ba81c5',la:[-24,10],ra:[22,-14],ll:[-26,34],rl:[22,40]})}</g></svg>`,
  // top percentile: you rise up onto the winner's podium and the confetti comes down
  podium:`<svg ${V}>${GROUND}
   <rect x="36" y="196" width="72" height="40" rx="10" fill="#dcd6c4"/><rect x="212" y="178" width="72" height="58" rx="10" fill="#dcd6c4"/>
   <g class="ia-block"><rect x="124" y="150" width="72" height="86" rx="10" fill="#5b7fd6"/><text x="160" y="198" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="22" fill="#fff">You</text></g>
   <g class="ia-up"><g class="ia-cheer">${man(160,70,{skin:SK[0],hair:'#c0501e',shirt:'#7fa83a',long:1,la:[-28,-26],ra:[28,-26],ll:[-9,40],rl:[9,40]})}</g></g>
   ${confetti([[60,60,'#f9df6d'],[262,52,'#ba81c5'],[88,110,'#f5a25d',1],[240,100,'#a0c35a',1],[40,150,'#5b7fd6'],[284,138,'#f9df6d'],[118,40,'#5b7fd6',1],[206,34,'#f5a25d']])}</svg>`,
  // halfway: your cognitive profile starts to take shape on a radar, you point at it
  radar:`<svg ${V}>${GROUND}
   <circle class="ia-halo" cx="116" cy="124" r="96" fill="#b0c4ef" opacity=".35"/>
   <polygon points="116.0,40.0 195.9,98.0 165.4,192.0 66.6,192.0 36.1,98.0" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
   <polygon points="116.0,68.6 168.7,106.9 148.6,168.9 83.4,168.9 63.3,106.9" fill="none" stroke="${INK}" stroke-width="2" opacity=".35"/><polygon points="116.0,96.3 142.4,115.4 132.3,146.4 99.7,146.4 89.6,115.4" fill="none" stroke="${INK}" stroke-width="2" opacity=".35"/>
   <path d="M116 124L116.0 40.0M116 124L195.9 98.0M116 124L165.4 192.0M116 124L66.6 192.0M116 124L36.1 98.0" stroke="${INK}" stroke-width="2" opacity=".35"/>
   <g class="ia-radar"><polygon points="116.0,48.4 165.5,107.9 155.5,178.4 88.8,161.4 56.9,104.8" fill="#f9df6d" fill-opacity=".8" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><circle class="ia-tw" cx="116.0" cy="48.4" r="6" fill="#d6453a" stroke="#121212" stroke-width="3"/><circle class="ia-tw" cx="165.5" cy="107.9" r="6" fill="#f5a25d" stroke="#121212" stroke-width="3"/><circle class="ia-tw" cx="155.5" cy="178.4" r="6" fill="#a0c35a" stroke="#121212" stroke-width="3"/><circle class="ia-tw" cx="88.8" cy="161.4" r="6" fill="#5b7fd6" stroke="#121212" stroke-width="3"/><circle class="ia-tw" cx="56.9" cy="104.8" r="6" fill="#ba81c5" stroke="#121212" stroke-width="3"/></g>
   <g class="ia-cheer">${man(262,150,{skin:SK[2],hair:'#2b2118',shirt:'#7fa83a',la:[-30,-6],ra:[24,30],ll:[-9,40],rl:[9,40]})}</g>
   ${confetti([[40,40,'#f9df6d'],[214,30,'#ba81c5',1],[292,84,'#f5a25d'],[24,190,'#a0c35a',1]],'ia-tw')}</svg>`,
  // strongest area: the bulb flickers on, glows and sends out rays
  bulb:`<svg ${V}>${GROUND}
   <circle class="ia-halo" cx="118" cy="84" r="86" fill="#f9df6d" opacity=".35"/>
   <g class="ia-rays" stroke="${INK}" stroke-width="5" stroke-linecap="round"><path d="M118 20v-12M70 38l-9-9M166 38l9-9M44 84H30M192 84h14"/></g>
   <path d="M118 28a58 58 0 0 0-30 106c6 6 8 12 8 22h44c0-10 2-16 8-22a58 58 0 0 0-30-106z" fill="#e2dcc8" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
   <path class="ia-lit" d="M118 28a58 58 0 0 0-30 106c6 6 8 12 8 22h44c0-10 2-16 8-22a58 58 0 0 0-30-106z" fill="#f9df6d" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
   <rect x="94" y="160" width="48" height="12" rx="5" fill="#fff" stroke="${INK}" stroke-width="5"/><rect x="100" y="174" width="36" height="12" rx="5" fill="#fff" stroke="${INK}" stroke-width="5"/>
   <path d="M104 118l14-26 14 26M104 118l14 22 14-22" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
   <g class="ia-cheer">${man(252,154,{skin:SK[3],hair:'#7a3b1e',shirt:'#5b7fd6',bun:1,la:[-26,-24],ra:[18,30],ll:[-8,42],rl:[10,42]})}</g>
   ${confetti([[210,40,'#ba81c5'],[286,70,'#a0c35a',1],[20,140,'#f5a25d'],[290,120,'#f9df6d']],'ia-tw')}</svg>`,
  // almost there: walk up the slope, then cheer beside the flag on the summit
  summit:`<svg ${V}>${GROUND}
   <path d="M18 236L148 86l142 150z" fill="#a0c35a"/><path d="M148 86l-30 34 14-8 16 14 12-14 14 10z" fill="#fff"/>
   <path d="M148 86V34" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><g class="ia-wave2"><path d="M148 36l38 12-38 12z" fill="#f9df6d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>
   <g class="ia-trek"><g transform="translate(176 44) scale(.8)">${man(0,0,{skin:SK[0],hair:'#d9a441',shirt:'#ba81c5',long:1,la:[-16,26],ra:[16,26],ll:[-12,42],rl:[12,42]})}</g></g>
   <g class="ia-win"><g transform="translate(176 44) scale(.8)">${man(0,0,{skin:SK[0],hair:'#d9a441',shirt:'#ba81c5',long:1,la:[-26,-28],ra:[26,-28],ll:[-10,42],rl:[10,42]})}</g></g>
   ${confetti([[60,80,'#f5a25d'],[96,40,'#5b7fd6',1],[270,70,'#f9df6d'],[44,150,'#ba81c5',1]])}</svg>`,
  // checkpoint scenes (Q10/15/20/25): stopwatch, podium+trophy, score curve+flag, globe+orbiting ball
  csClock:`<svg viewBox="0 -4 300 300">
<g class="cs-streak" style="animation-delay:0s"><rect x="14" y="96" width="46" height="8" rx="4" fill="#121212"/></g>
<g class="cs-streak" style="animation-delay:.35s"><rect x="4" y="128" width="62" height="8" rx="4" fill="#d6453a"/></g>
<g class="cs-streak" style="animation-delay:.7s"><rect x="20" y="160" width="40" height="8" rx="4" fill="#5b7fd6"/></g>
<rect x="135" y="22" width="30" height="22" rx="6" fill="#121212"/><rect x="144" y="12" width="12" height="14" rx="3" fill="#121212"/>
<circle cx="160" cy="140" r="84" fill="#fffdf5" stroke="#121212" stroke-width="8"/>
<circle cx="160" cy="140" r="66" fill="none" stroke="#f1e3a0" stroke-width="12"/>
<circle class="cs-ring" cx="160" cy="140" r="66" fill="none" stroke="#d6453a" stroke-width="12" stroke-linecap="round" transform="rotate(-90 160 140)"/>
<g stroke="#121212" stroke-width="4" stroke-linecap="round"><path d="M160 66v12M160 202v12M86 140h12M222 140h12"/></g>
<g class="cs-hand"><rect x="157" y="82" width="6" height="58" rx="3" fill="#121212"/></g>
<circle cx="160" cy="140" r="9" fill="#f9df6d" stroke="#121212" stroke-width="4"/></svg>`,
  csPodium:`<svg viewBox="0 -4 300 300">
<g class="cs-blk" style="--d:.2s"><rect x="40" y="150" width="68" height="84" fill="#5b7fd6" stroke="#121212" stroke-width="6" stroke-linejoin="round"/><text x="74" y="204" text-anchor="middle" font-family="Source Serif 4,serif" font-weight="700" font-size="34" fill="#fffdf5">2</text></g>
<g class="cs-blk" style="--d:.4s"><rect x="192" y="170" width="68" height="64" fill="#a0c35a" stroke="#121212" stroke-width="6" stroke-linejoin="round"/><text x="226" y="216" text-anchor="middle" font-family="Source Serif 4,serif" font-weight="700" font-size="34" fill="#fffdf5">3</text></g>
<g class="cs-blk" style="--d:0s"><rect x="108" y="110" width="84" height="124" fill="#f9df6d" stroke="#121212" stroke-width="6" stroke-linejoin="round"/><text x="150" y="182" text-anchor="middle" font-family="Source Serif 4,serif" font-weight="700" font-size="44" fill="#121212">1</text></g>
<g class="cs-drop"><g class="cs-bob"><path d="M118 40h64v22c0 22-14 36-32 36s-32-14-32-36z" fill="#f9df6d" stroke="#121212" stroke-width="6" stroke-linejoin="round"/><path d="M118 50h-14c0 20 8 28 18 30M182 50h14c0 20-8 28-18 30" fill="none" stroke="#121212" stroke-width="6" stroke-linecap="round"/><rect x="140" y="98" width="20" height="10" fill="#121212"/><path d="M150 52l5 10 11 2-8 8 2 11-10-6-10 6 2-11-8-8 11-2z" fill="#d6453a"/></g></g>
</svg>`,
  csCurve:`<svg viewBox="0 -4 300 300">
<g transform="translate(0 -26)"><rect x="20" y="40" width="260" height="190" rx="14" fill="#fffdf5" stroke="#121212" stroke-width="6"/>
<path class="cs-fill" d="M40 200C80 200 100 70 150 70S220 200 260 200z" fill="#f9df6d"/>
<path class="cs-curve" d="M40 200C80 200 100 70 150 70S220 200 260 200" fill="none" stroke="#121212" stroke-width="6" stroke-linecap="round"/>
<path d="M36 200H264" stroke="#121212" stroke-width="6" stroke-linecap="round"/>
<g class="cs-flag"><path d="M258 200V92" stroke="#121212" stroke-width="6" stroke-linecap="round"/><path d="M258 92h30l-8 12 8 12h-30z" fill="#d6453a" stroke="#121212" stroke-width="5" stroke-linejoin="round"/></g>
</g></svg>`,
  csGlobe:`<svg viewBox="0 -4 300 300">
<defs><clipPath id="csB"><rect x="0" y="-100" width="300" height="230"/></clipPath><clipPath id="csF"><rect x="0" y="130" width="300" height="230"/></clipPath></defs>
<g transform="rotate(-18 150 130)"><path d="M26 130a124 32 0 0 1 248 0" fill="none" stroke="#121212" stroke-width="5" stroke-linecap="round"/><g clip-path="url(#csB)"><circle r="11" fill="#d6453a" stroke="#121212" stroke-width="4"><animateMotion dur="7s" repeatCount="indefinite" path="M26 130a124 32 0 1 0 248 0a124 32 0 1 0 -248 0"/></circle></g></g>
<circle cx="150" cy="130" r="86" fill="#5b7fd6" stroke="#121212" stroke-width="8"/>
<g fill="none" stroke="#fffdf5" stroke-width="4" opacity=".85"><ellipse class="cs-mer" cx="150" cy="130" rx="86" ry="86"/><ellipse cx="150" cy="130" rx="44" ry="86"/><path d="M64 130h172M76 94h148M76 166h148"/></g>
<path d="M96 96c10-14 30-14 38-4s-6 22-14 22-14 10-24-4zM160 138c12-6 30 0 32 12s-14 26-24 22-14-26-8-34z" fill="#a0c35a" stroke="#121212" stroke-width="4" stroke-linejoin="round"/>
<g transform="rotate(-18 150 130)"><path d="M26 130a124 32 0 0 0 248 0" fill="none" stroke="#121212" stroke-width="5" stroke-linecap="round"/><g clip-path="url(#csF)"><circle r="11" fill="#d6453a" stroke="#121212" stroke-width="4"><animateMotion dur="7s" repeatCount="indefinite" path="M26 130a124 32 0 1 0 248 0a124 32 0 1 0 -248 0"/></circle></g></g>
<g class="cs-pin"><g class="cs-bob"><path d="M196 54c-14 0-24 10-24 24 0 18 24 40 24 40s24-22 24-40c0-14-10-24-24-24z" fill="#f9df6d" stroke="#121212" stroke-width="6" stroke-linejoin="round"/><path d="M196 62l4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1z" fill="#121212"/></g></g>
</svg>`
};
window.BF_ART=ART;
})();

/* ---------- shape drawing ---------- */
const POS={1:[[50,50]],2:[[30,50],[70,50]],3:[[50,29],[29,69],[71,69]],4:[[31,31],[69,31],[31,69],[69,69]]};
function shape(s,cx,cy,r,fill,rot){
  const f=fill==='solid'?'fill="currentColor"':fill==='hatch'?'fill="url(#gm-hatch)"':'fill="none"';
  const a=`${f} stroke="currentColor" stroke-width="3" stroke-linejoin="round"`;
  const t=rot?` transform="rotate(${rot} ${cx} ${cy})"`:'';
  const p=(pts)=>`<polygon points="${pts.map(q=>q.map(v=>v.toFixed(1)).join(',')).join(' ')}" ${a}${t}/>`;
  if(s==='circle')return `<circle cx="${cx}" cy="${cy}" r="${r*.92}" ${a}/>`;
  if(s==='square')return `<rect x="${cx-r*.8}" y="${cy-r*.8}" width="${r*1.6}" height="${r*1.6}" rx="2" ${a}${t}/>`;
  if(s==='triangle')return p([[cx,cy-r],[cx+r*.95,cy+r*.75],[cx-r*.95,cy+r*.75]]);
  if(s==='diamond')return p([[cx,cy-r],[cx+r*.78,cy],[cx,cy+r],[cx-r*.78,cy]]);
  if(s==='arrow')return p([[cx,cy-r],[cx+r*.75,cy-r*.05],[cx+r*.28,cy-r*.05],[cx+r*.28,cy+r],[cx-r*.28,cy+r],[cx-r*.28,cy-r*.05],[cx-r*.75,cy-r*.05]]);
  return '';
}
function cellSVG(c){
  const n=c.count||1, sz=c.size||1, r=(n===1?24:13)*sz;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${POS[n].map(([x,y])=>shape(c.shape,x,y,r,c.fill||'outline',c.rot||0)).join('')}</svg>`;
}
/* polyomino helpers */
const norm=cs=>{const mx=Math.min(...cs.map(c=>c[0])),my=Math.min(...cs.map(c=>c[1]));return cs.map(([x,y])=>[x-mx,y-my]);};
const rot90=cs=>norm(cs.map(([x,y])=>[-y,x]));
const mirror=cs=>norm(cs.map(([x,y])=>[-x,y]));
const rotN=(cs,n)=>{let o=norm(cs);for(let i=0;i<n;i++)o=rot90(o);return o;};
function polySVG(cs,box){
  cs=norm(cs);const w=Math.max(...cs.map(c=>c[0]))+1,h=Math.max(...cs.map(c=>c[1]))+1;
  const B=box||5,u=100/(B+1),ox=(100-w*u)/2,oy=(100-h*u)/2;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${cs.map(([x,y])=>`<rect x="${(ox+x*u).toFixed(1)}" y="${(oy+y*u).toFixed(1)}" width="${u.toFixed(1)}" height="${u.toFixed(1)}" fill="currentColor" fill-opacity=".9" stroke="var(--bg)" stroke-width="2"/>`).join('')}</svg>`;
}
function netSVG(cs){
  cs=norm(cs);const w=Math.max(...cs.map(c=>c[0]))+1,h=Math.max(...cs.map(c=>c[1]))+1;
  const u=Math.min(150/w,82/h),ox=(166-w*u)/2,oy=(100-h*u)/2;
  return `<svg viewBox="0 0 166 100" aria-hidden="true">${cs.map(([x,y])=>`<rect x="${(ox+x*u).toFixed(1)}" y="${(oy+y*u).toFixed(1)}" width="${u.toFixed(1)}" height="${u.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="2"/>`).join('')}</svg>`;
}
/* seeded rng */
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function shuffle(arr,seed){const r=rng(seed),a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ---------- item bank ---------- */
const S3=['circle','square','triangle'];
const DOMAINS=[
  {id:'fluid',name:'Fluid reasoning'},
  {id:'quant',name:'Quantitative reasoning'},
  {id:'verbal',name:'Verbal reasoning'},
  {id:'spatial',name:'Visual-spatial'},
  {id:'memory',name:'Working memory'},
  {id:'speed',name:'Processing speed'}
];
const F_PENT=[[1,0],[2,0],[0,1],[1,1],[1,2]];
const P_PENT=[[0,0],[1,0],[0,1],[1,1],[0,2]];
const L_HEX=[[0,0],[0,1],[0,2],[1,2],[2,2],[2,3]];

const RAW=[
 {id:'m1',d:'fluid',type:'matrix',q:'Which tile completes the grid?',
  cell:(r,c)=>({shape:S3[r],count:c+1}),
  ans:{shape:'triangle',count:3},
  wrong:[{shape:'triangle',count:2},{shape:'square',count:3},{shape:'triangle',count:3,fill:'solid'},{shape:'circle',count:3},{shape:'triangle',count:4}],
  why:'Each row keeps one shape, and the count rises by one from left to right. Row three is triangles, so the last tile holds three outlined triangles.'},
 {id:'m2',d:'fluid',type:'matrix',q:'Which tile completes the grid?',
  cell:(r,c)=>({shape:S3[(r+c)%3],fill:['outline','solid','hatch'][(c-r+3)%3]}),
  ans:{shape:'square',fill:'outline'},
  wrong:[{shape:'square',fill:'solid'},{shape:'square',fill:'hatch'},{shape:'triangle',fill:'outline'},{shape:'circle',fill:'outline'},{shape:'diamond',fill:'outline'}],
  why:'Every row and column contains each shape once and each fill once. Row three already has a solid triangle and a hatched circle, so it needs an outlined square.'},
 {id:'m3',d:'fluid',type:'matrix',q:'Which tile completes the grid?',
  cell:(r,c)=>({shape:'arrow',fill:'solid',rot:r*90+c*45}),
  ans:{shape:'arrow',fill:'solid',rot:270},
  wrong:[{shape:'arrow',fill:'solid',rot:225},{shape:'arrow',fill:'solid',rot:90},{shape:'arrow',fill:'solid',rot:315},{shape:'arrow',fill:'solid',rot:0},{shape:'arrow',fill:'outline',rot:270}],
  why:'The arrow turns 45° clockwise with each step right, and each row starts 90° further round than the row above. Row three starts pointing down (180°), so the third tile points left (270°).'},
 {id:'m4',d:'fluid',type:'matrix',q:'Which tile completes the grid?',
  cell:(r,c)=>({shape:['circle','triangle','square'][r],fill:'solid',count:[[1,2,3],[2,2,4],[3,1,4]][r][c]}),
  ans:{shape:'square',fill:'solid',count:4},
  wrong:[{shape:'square',fill:'solid',count:3},{shape:'square',fill:'solid',count:2},{shape:'circle',fill:'solid',count:4},{shape:'triangle',fill:'solid',count:4},{shape:'square',fill:'outline',count:4}],
  why:'In every row the third tile holds the sum of the first two. Three squares plus one square gives four solid squares.'},
 {id:'m5',d:'fluid',type:'matrix',q:'Which tile completes the grid?',
  cell:(r,c)=>({shape:['diamond','circle','triangle'][r],size:[.62,.86,1.12][c],fill:(r+c)%2?'solid':'outline'}),
  ans:{shape:'triangle',size:1.12,fill:'outline'},
  wrong:[{shape:'triangle',size:1.12,fill:'solid'},{shape:'triangle',size:.86,fill:'outline'},{shape:'diamond',size:1.12,fill:'outline'},{shape:'triangle',size:.62,fill:'outline'},{shape:'circle',size:1.12,fill:'outline'}],
  why:'Shape is set by the row, size grows across the columns, and fill alternates like a chessboard. The bottom-right square of a chessboard matches the top-left, so it is a large outlined triangle.'},
 {id:'odd',d:'fluid',type:'oddfig',q:'Which tile is the odd one out?',
  figs:[{shape:'circle',count:2},{shape:'square',count:2},{shape:'triangle',count:3},{shape:'diamond',count:2}],a:2,
  why:'Every other tile holds two shapes. The triangle tile holds three. Shape changes in every tile, so it cannot be the rule.'},

 {id:'q1',d:'quant',type:'series',q:'What number comes next?',seq:[3,6,12,24],opts:['48','36','42','96'],a:0,
  why:'Each term doubles the one before: 24 × 2 = 48.'},
 {id:'q2',d:'quant',type:'series',q:'What number comes next?',seq:[2,5,10,17,26],opts:['35','36','37','39'],a:2,
  why:'The terms are n² + 1 for n = 1 to 5. Next is 6² + 1 = 37. The gaps (3, 5, 7, 9, 11) show the same thing.'},
 {id:'q3',d:'quant',type:'series',q:'What number comes next?',seq:[4,9,7,12,10],opts:['8','13','15','17'],a:2,
  why:'The rule alternates +5 and −2. After 10 comes +5, giving 15.'},
 {id:'q4',d:'quant',type:'series',q:'What number comes next?',seq:[2,6,3,9,6,18],opts:['54','12','15','21'],a:2,
  why:'The rule alternates × 3 and − 3: 2→6→3→9→6→18, so the next step is 18 − 3 = 15.'},
 {id:'q5',d:'quant',type:'series',q:'What number comes next?',seq:[81,27,9,3],opts:['0','1','1/3','2'],a:1,
  why:'Each term is divided by 3. 3 ÷ 3 = 1.'},
 {id:'q6',d:'quant',type:'series',q:'Which letter comes next?',seq:['A','C','F','J','O'],opts:['T','U','V','S'],a:1,
  why:'The gaps grow by one each time: +2, +3, +4, +5. O is the 15th letter, and 15 + 6 = 21, which is U.'},
 {id:'q7',d:'quant',type:'choice',q:'Five printers take five minutes to print five posters. How long do 100 printers take to print 100 posters?',opts:['5 minutes','20 minutes','100 minutes','1 minute'],a:0,
  why:'Each printer makes one poster in five minutes. A hundred printers working side by side make a hundred posters in the same five minutes.'},
 {id:'q8',d:'quant',type:'choice',q:'A jacket costs $40 after a 20% discount. What was the original price?',opts:['$48','$50','$52','$60'],a:1,
  why:'After the discount you pay 80% of the original. $40 ÷ 0.8 = $50. Adding 20% of $40 back gives the tempting wrong answer of $48.'},

 {id:'v1',d:'verbal',type:'choice',q:'Seed is to tree as egg is to …',opts:['nest','bird','shell','yolk'],a:1,
  why:'A seed grows into a tree; an egg grows into a bird. The other words are parts of or places for an egg.'},
 {id:'v2',d:'verbal',type:'choice',q:'Which word does not belong with the others?',opts:['violin','cello','trumpet','viola'],a:2,
  why:'Violin, cello and viola are bowed string instruments. The trumpet is a brass instrument.'},
 {id:'v3',d:'verbal',type:'choice',q:'Telescope is to distant as microscope is to …',opts:['lens','small','laboratory','bright'],a:1,
  why:'A telescope makes distant things visible; a microscope makes small things visible. The pairing is instrument to what it reveals.'},
 {id:'v4',d:'verbal',type:'choice',q:'Which word is most nearly the opposite of “ephemeral”?',opts:['fleeting','enduring','delicate','invisible'],a:1,
  why:'Ephemeral means lasting a very short time. Enduring means lasting a long time. Fleeting is a synonym, not an opposite.'},
 {id:'v5',d:'verbal',type:'choice',q:'All glims are tops. Some tops are rells. Which statement must be true?',opts:['All glims are rells','Some glims are rells','No glims are rells','None of these must be true'],a:3,
  why:'The rells might sit entirely in the part of “tops” that holds no glims, or they might overlap them. Nothing about glims and rells is forced, so none must be true.'},
 {id:'v6',d:'verbal',type:'choice',q:'Bea is taller than Ari. Ari is taller than Cy. Dev is shorter than Cy. Who is the second shortest?',opts:['Bea','Ari','Cy','Dev'],a:2,
  why:'The order from tallest is Bea, Ari, Cy, Dev. Dev is shortest, so Cy is second shortest.'},
 {id:'v7',d:'verbal',type:'choice',q:'Which word completes both? FIRE ____ / ____ HOUSE',pre:'<div class="seq"><span>FIRE</span><span class="blank">?</span><span>HOUSE</span></div>',opts:['light','place','side','fly'],a:0,
  why:'Firelight and lighthouse. Fireplace, fireside and firefly work on the left, but none of them make a word with house.'},
 {id:'v8',d:'verbal',type:'choice',q:'Which word uses exactly the letters of CARTHORSE?',opts:['orchestra','stretcher','chartreuse','cathedral'],a:0,
  why:'ORCHESTRA uses the same nine letters, including both Rs. The others add or drop letters.'},

 {id:'s1',d:'spatial',type:'rotate',q:'Which option is the shape on the left rotated, not mirrored?',base:F_PENT,
  build:b=>({ans:rotN(b,1),wrong:[mirror(b),rotN(mirror(b),1),rotN(mirror(b),2)]}),
  why:'Only one option can be reached by turning the shape in the plane. The other three are its mirror image, which no rotation can produce.'},
 {id:'s2',d:'spatial',type:'net',q:'Which of these flat patterns folds into a closed cube?',
  nets:[[[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]],[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]],[[0,1],[1,1],[2,1],[3,1],[4,1],[1,0]],[[0,1],[1,1],[2,1],[3,1],[0,0],[1,0]]],a:0,
  why:'The cross folds a band of four faces with one lid on each side. A 2 × 3 block and a row of five both overlap, and two lids above neighbouring squares land on the same face.'},
 {id:'s3',d:'spatial',type:'rotate',q:'Which option is the shape on the left rotated, not mirrored?',base:P_PENT,
  build:b=>({ans:rotN(b,2),wrong:[mirror(b),rotN(mirror(b),1),rotN(mirror(b),3)]}),
  why:'Turning the shape 180° gives the correct option. The others are reflections, so they cannot be matched by rotation alone.'},
 {id:'s4',d:'spatial',type:'choice',q:'A square sheet is folded in half, then in half again. One hole is punched through all layers near a corner. How many holes are there when it is unfolded?',opts:['1','2','4','8'],a:2,
  why:'Two folds stack four layers. One punch passes through all four, giving four holes.'},
 {id:'s5',d:'spatial',type:'choice',q:'What is the smaller angle between the hands at 3:30?',pre:'<div class="target"><svg viewBox="0 0 100 100" aria-label="Clock showing 3:30"><circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="2"/>'+Array.from({length:12},(_,h)=>{const a=h*Math.PI/6;return `<line x1="${(50+36*Math.sin(a)).toFixed(1)}" y1="${(50-36*Math.cos(a)).toFixed(1)}" x2="${(50+41*Math.sin(a)).toFixed(1)}" y2="${(50-41*Math.cos(a)).toFixed(1)}" stroke="currentColor" stroke-width="${h%3?1.5:3}"/>`;}).join('')+'<line x1="50" y1="50" x2="71.3" y2="55.7" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="50" x2="50" y2="84" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="50" r="3" fill="currentColor"/></svg></div>',opts:['60°','75°','90°','105°'],a:1,
  why:'At 3:30 the hour hand has moved halfway from 3 to 4, so it sits at 105°. The minute hand points at 180°. The gap is 75°. Picking 90° forgets that the hour hand moves.'},

 {id:'fs1',d:'fluid',type:'figseq',q:'Which figure comes next in the sequence?',
  seq:[{shape:'arrow',rot:0},{shape:'arrow',rot:90,fill:'solid'},{shape:'arrow',rot:180},{shape:'arrow',rot:270,fill:'solid'}],
  ans:{shape:'arrow',rot:0},wrong:[{shape:'arrow',rot:0,fill:'solid'},{shape:'arrow',rot:90},{shape:'arrow',rot:270},{shape:'arrow',rot:45}],
  why:'The arrow turns 90° clockwise each step, and the fill switches between outline and solid. After a solid arrow pointing left comes an outlined arrow pointing up.'},
 {id:'fs2',d:'fluid',type:'figseq',q:'Which figure comes next in the sequence?',
  seq:[{shape:'circle',size:.6},{shape:'square',size:.85},{shape:'triangle',size:1.12},{shape:'circle',size:.6},{shape:'square',size:.85}],
  ans:{shape:'triangle',size:1.12},wrong:[{shape:'triangle',size:.6},{shape:'circle',size:1.12},{shape:'square',size:1.12},{shape:'triangle',size:1.12,fill:'solid'}],
  why:'Shape and size move together in a cycle of three: small circle, medium square, large triangle. The sixth figure repeats the third.'},
 {id:'bal',d:'quant',type:'choice',q:'The scales balance. How many triangles balance one circle?',
  pre:'<div class="scales"><div><span>▲ ▲</span><i>=</i><span>■</span></div><div><span>■ ■</span><i>=</i><span>●</span></div><div><span>●</span><i>=</i><span class="blank">? ▲</span></div></div>',
  opts:['3','4','6','8'],a:1,
  why:'One square weighs two triangles, and one circle weighs two squares. Two squares × two triangles = four triangles.'},
 {id:'age',d:'quant',type:'choice',q:'In six years Mira will be twice as old as she was four years ago. How old is she now?',opts:['10','12','14','16'],a:2,
  why:'Write it as a + 6 = 2(a − 4). That gives a + 6 = 2a − 8, so a = 14. Check: in six years she is 20, and four years ago she was 10.'},
 {id:'ciph',d:'verbal',type:'choice',q:'In a code, CAT is written DBU. How is DOG written?',
  pre:'<div class="seq"><span>C→D</span><span>A→B</span><span>T→U</span></div>',opts:['EPH','CNF','EPI','FQI'],a:0,
  why:'Each letter shifts one place forward in the alphabet. D→E, O→P, G→H gives EPH.'},
 {id:'hid',d:'verbal',type:'choice',q:'Which word hides an animal inside it, reading left to right?',opts:['planet','scatter','border','fringe'],a:1,
  why:'sCATter holds the word cat. None of the other words contain an animal name in a row.'},
 {id:'dir',d:'spatial',type:'choice',q:'You face north. You turn right, right again, then left. Which way are you facing?',
  pre:'<div class="compass" aria-hidden="true"><span>N</span><span>E</span><span>S</span><span>W</span></div>',opts:['North','East','South','West'],a:1,
  why:'Right takes you from north to east, right again to south, then left brings you back to east.'},
 {id:'pair',d:'speed',type:'choice',q:'Quick: which pair is not identical?',opts:['7Q2X9 · 7Q2X9','84KM1 · 84KM1','H5TR0 · H5RT0','B3ZP6 · B3ZP6'],a:2,mono:true,
  why:'In H5TR0 · H5RT0 the T and R swap places. Spotting transpositions fast is a classic clerical-speed task.'},
 {id:'w1',d:'memory',type:'memory',q:'Remember the digits in order',digits:'5829471',mode:'forward',
  why:'Seven digits forward is close to the typical adult span, which sits around seven items.'},
 {id:'w2',d:'memory',type:'memory',q:'Remember the digits, then type them in reverse',digits:'39614',mode:'backward',
  why:'Backward recall makes you hold and reorder the digits at once. The sequence 3 9 6 1 4 reversed is 4 1 6 9 3.'},

 {id:'p1',d:'speed',type:'scan',q:'Count every ◆ in the grid',target:'◆',pool:['◆','◇','●','○','▲','△'],seed:17,
  why:'Scanning tasks measure how quickly you can tell near-identical symbols apart. The filled and hollow diamonds are the trap.'},
 {id:'p2',d:'speed',type:'scan',q:'Count every ▲ in the grid',target:'▲',pool:['▲','△','◆','◇','■','□'],seed:91,
  why:'The hollow triangles look the same at a glance. Steady row-by-row scanning beats jumping around the grid.'},
 {id:'p3',d:'speed',type:'choice',q:'Use the key to decode the symbols',pre:'<div class="codekey"><span>◆<b>3</b></span><span>●<b>7</b></span><span>▲<b>1</b></span><span>■<b>5</b></span></div><div class="seq"><span>▲</span><span>◆</span><span>■</span><span>●</span></div>',opts:['1357','1375','3157','1537'],a:0,
  why:'▲ is 1, ◆ is 3, ■ is 5 and ● is 7, which reads 1357. Coding tasks like this are a standard processing-speed measure.'}
];
/* mixed order: no two neighbours share a domain, a memory item lands third, and grid matrices are only 2 of 20 */
const ORDER=['odd','q1','w1','v1','dir','fs1','bal','p1','v7','s2','m1','q7','ciph','w2','pair','s1','m4','age','p3','v5'];
const CHECKPOINTS=[4,8,12,16];
const FACTS=[
  'Raven’s Progressive Matrices, the model for the grid items, were first published in 1938 and are still used today.',
  'Average raw scores on IQ tests rose by about three points a decade across much of the 20th century. Researchers call it the Flynn effect.',
  'Classic memory research put the adult digit span at around seven items. Grouping digits into chunks is how people stretch it.',
  'Modern batteries score separate indices such as reasoning, memory and speed, then combine them into one composite.'
];
const WORDS=['Lantern','Compass','Meadow','Harbor','Cobalt','Ember','Orchard','Summit','Willow','Quartz','Thistle','Saffron'];
const CHEERS=['Locked in.','Good instincts.','Nice rhythm.','Steady hands.','One more down.','Keep that focus.','Clean work.','You are in the groove.'];
const GLYPH={
 bolt:'<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2z"/></svg>',
 eye:'<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
 target:'<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
 flag:'<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h12l-2.5 4 2.5 4H5" fill="currentColor" fill-opacity=".18"/></svg>'
};
const moIco=g=>`<div class="mo-ico" aria-hidden="true"><span class="halo"></span><span class="ring"></span><svg class="orbit" viewBox="0 0 168 168"><circle cx="84" cy="84" r="82"/></svg>${GLYPH[g]}</div>`;

/* build items */
const ITEMS=ORDER.map((id,i)=>{
  const it=RAW.find(x=>x.id===id);
  const o={...it,idx:i};
  if(it.type==='matrix'||it.type==='figseq'){
    const all=[{k:'a',c:it.ans},...it.wrong.map((w,j)=>({k:'w'+j,c:w}))];
    o.choices=shuffle(all,i*31+7);o.correct=o.choices.findIndex(x=>x.k==='a');
  }else if(it.type==='oddfig'){
    const all=it.figs.map((f,j)=>({k:j===it.a?'a':'w'+j,c:f}));
    o.choices=shuffle(all,i*19+11);o.correct=o.choices.findIndex(x=>x.k==='a');
  }else if(it.type==='rotate'){
    const b=it.build(it.base);const all=[{k:'a',c:b.ans},...b.wrong.map((w,j)=>({k:'w'+j,c:w}))];
    o.choices=shuffle(all,i*13+3);o.correct=o.choices.findIndex(x=>x.k==='a');
  }else if(it.type==='net'){
    const all=it.nets.map((n,j)=>({k:j===it.a?'a':'w'+j,c:n}));
    o.choices=shuffle(all,i*17+5);o.correct=o.choices.findIndex(x=>x.k==='a');
  }else if(it.type==='scan'){
    const r=rng(it.seed);const g=[];for(let k=0;k<45;k++)g.push(it.pool[Math.floor(r()*it.pool.length)]);
    o.grid=g;const n=g.filter(x=>x===it.target).length;o.count=n;
    const opts=shuffle([n,n-1,n+1,n+2],it.seed);o.opts=opts.map(String);o.correct=opts.indexOf(n);
    o.why=`There were ${n}. `+it.why;
  }else if(it.type==='memory'){
    o.answer=it.mode==='forward'?it.digits:it.digits.split('').reverse().join('');
  }else{o.correct=it.a;}
  return o;
});
const byId=id=>ITEMS.find(x=>x.id===id);

let motionOn=!matchMedia('(prefers-reduced-motion: reduce)').matches;
function renderMatrix(el,item,showAns){
  let h='';for(let r=0;r<3;r++)for(let c=0;c<3;c++){
    if(r===2&&c===2)h+=`<div class="c q${showAns?' hit':''}" data-q>${showAns?cellSVG(item.ans):'?'}</div>`;
    else h+=`<div class="c">${cellSVG(item.cell(r,c))}</div>`;}
  el.innerHTML=h;
}

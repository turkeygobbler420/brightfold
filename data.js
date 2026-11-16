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
/* pattern-card cell drawings (original designs, 100 x 100) */
const svg100=s=>`<svg viewBox="0 0 100 100" aria-hidden="true">${s}</svg>`;
function plusSVG(arms){
  const D={N:[50,50,50,12],E:[50,50,88,50],S:[50,50,50,88],W:[50,50,12,50]};
  return svg100(arms.map(a=>`<line x1="${D[a][0]}" y1="${D[a][1]}" x2="${D[a][2]}" y2="${D[a][3]}" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`).join('')+`<circle cx="50" cy="50" r="7" fill="currentColor"/>`);
}
function diaSVG(p,hollow){
  const P=[[50,28],[72,50],[50,72],[28,50]];
  let m='';if(p>=0){const[x,y]=P[p];m=hollow?`<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="currentColor" stroke-width="3"/>`:`<circle cx="${x}" cy="${y}" r="7" fill="currentColor"/>`;}
  return svg100(`<polygon points="50,8 92,50 50,92 8,50" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`+m);
}
function quadSVG(q){
  const R=[[18,18],[50,18],[50,50],[18,50]];
  return svg100(q.map(i=>`<rect x="${R[i][0]}" y="${R[i][1]}" width="32" height="32" fill="currentColor"/>`).join('')+`<rect x="18" y="18" width="64" height="64" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 18V82M18 50H82" stroke="currentColor" stroke-width="1.5" opacity=".5"/>`);
}
function dotsSVG(s){
  let o='';for(let i=0;i<9;i++){const x=17+(i%3)*22,y=17+Math.floor(i/3)*22;o+=s.includes(i)?`<rect x="${x}" y="${y}" width="18" height="18" rx="2" fill="currentColor"/>`:`<rect x="${x}" y="${y}" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".25"/>`;}
  return svg100(o);
}
function pieSVG(q){
  const D=['M50 50L14 50A36 36 0 0 1 50 14Z','M50 50L50 14A36 36 0 0 1 86 50Z','M50 50L86 50A36 36 0 0 1 50 86Z','M50 50L50 86A36 36 0 0 1 14 50Z'];
  return svg100(q.map(i=>`<path d="${D[i]}" fill="currentColor"/>`).join('')+`<circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 14V86M14 50H86" stroke="currentColor" stroke-width="1.5" opacity=".5"/>`);
}
function nestSVG(o,i,f){return svg100(shape(o,50,50,38,'outline',0)+shape(i,50,50,17,f||'solid',0));}
function linesSVG(a,n){
  let o='';for(let k=0;k<n;k++){const y=50+(k-(n-1)/2)*15;o+=`<line x1="22" y1="${y}" x2="78" y2="${y}" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`;}
  return svg100(`<g transform="rotate(${a} 50 50)">${o}</g>`);
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
const Z_HEX=[[0,0],[1,0],[2,0],[2,1],[3,1],[1,2]];
const L_TET=[[0,0],[0,1],[0,2],[1,2]];
const N_PENT=[[0,0],[1,0],[2,0],[2,1],[3,1]];
const L_PENT=[[0,0],[0,1],[0,2],[0,3],[1,3]];
const SH3=['circle','square','triangle'];

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
 {id:'q2',d:'quant',type:'series',q:'What number comes next?',seq:[5,10,15,20],opts:['25','30','24','35'],a:0,
  why:'Each term goes up by 5: 20 + 5 = 25.'},
 {id:'q3',d:'quant',type:'series',q:'What number comes next?',seq:[1,3,5,7,9],opts:['10','11','12','13'],a:1,
  why:'The numbers go up by 2 each time: 9 + 2 = 11.'},
 {id:'q4',d:'quant',type:'series',q:'What number comes next?',seq:[20,17,14,11],opts:['9','8','7','10'],a:1,
  why:'Each term goes down by 3: 11 − 3 = 8.'},
 {id:'q5',d:'quant',type:'series',q:'What number comes next?',seq:[81,27,9,3],opts:['0','1','1/3','2'],a:1,
  why:'Each term is divided by 3. 3 ÷ 3 = 1.'},
 {id:'q6',d:'quant',type:'series',q:'Which letter comes next?',seq:['A','C','E','G'],opts:['H','I','J','K'],a:1,
  why:'The letters skip one each time: A, C, E, G, then I.'},
 {id:'q7',d:'quant',type:'choice',q:'A box holds 6 eggs. How many eggs are in 4 boxes?',opts:['10','18','24','30'],a:2,
  why:'Four boxes of 6 eggs make 4 × 6 = 24 eggs.'},
 {id:'q8',d:'quant',type:'choice',q:'You pay for a $12 book with a $20 note. How much change do you get?',opts:['$6','$8','$10','$12'],a:1,
  why:'The change is $20 − $12 = $8.'},

 {id:'v1',d:'verbal',type:'choice',q:'Seed is to tree as egg is to …',opts:['nest','bird','shell','yolk'],a:1,
  why:'A seed grows into a tree; an egg grows into a bird. The other words are parts of or places for an egg.'},
 {id:'v2',d:'verbal',type:'choice',q:'Which word does not belong with the others?',opts:['violin','cello','trumpet','viola'],a:2,
  why:'Violin, cello and viola are bowed string instruments. The trumpet is a brass instrument.'},
 {id:'v3',d:'verbal',type:'choice',q:'Telescope is to distant as microscope is to …',opts:['lens','small','laboratory','bright'],a:1,
  why:'A telescope makes distant things visible; a microscope makes small things visible. The pairing is instrument to what it reveals.'},
 {id:'v4',d:'verbal',type:'choice',q:'Cartographer is to map as composer is to…',opts:['orchestra','score','instrument','concert'],a:1, why:'A cartographer produces a map. A composer produces a score. The orchestra, the instrument and the concert are used to perform the music, not what the composer creates.'},
 {id:'v5',d:'verbal',type:'choice',q:'All glims are tops. Some tops are rells. Which statement must be true?',opts:['All glims are rells','Some glims are rells','No glims are rells','None of these must be true'],a:3,
  why:'The rells might sit entirely in the part of “tops” that holds no glims, or they might overlap them. Nothing about glims and rells is forced, so none must be true.'},
 {id:'v6',d:'verbal',type:'choice',q:'Bea is taller than Ari. Ari is taller than Cy. Dev is shorter than Cy. Who is the second shortest?',opts:['Bea','Ari','Cy','Dev'],a:2,
  why:'The order from tallest is Bea, Ari, Cy, Dev. Dev is shortest, so Cy is second shortest.'},
 {id:'v7',d:'verbal',type:'choice',q:'Which word completes both? FIRE ____ / ____ HOUSE',pre:'<div class="seq"><span>FIRE</span><span class="blank">?</span><span>HOUSE</span></div>',opts:['light','place','side','fly'],a:0,
  why:'Firelight and lighthouse. Fireplace, fireside and firefly work on the left, but none of them make a word with house.'},
 {id:'v8',d:'verbal',type:'choice',q:'Which word uses exactly the letters of CARTHORSE?',opts:['orchestra','stretcher','chartreuse','cathedral'],a:0,
  why:'ORCHESTRA uses the same nine letters, including both Rs. The others add or drop letters.'},

 {id:'s1',d:'spatial',type:'rotate',q:'Which option is the shape on the left rotated, not mirrored?',base:L_TET,
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
 {id:'pair',d:'speed',type:'choice',q:'Quick: which pair is not identical?',opts:['7Q2 · 7Q2','84K · 84K','H5T · H6T','B3Z · B3Z'],a:2,mono:true,
  why:'In H5T · H6T the middle digit differs. Spotting small differences fast is a classic clerical-speed task.'},
 {id:'w1',d:'memory',type:'memory',q:'Remember the digits in order',digits:'58294',mode:'forward',
  why:'Five digits forward is a short span that most adults manage, so it mainly checks attention.'},
 {id:'w2',d:'memory',type:'memory',q:'Remember the digits, then type them in reverse',digits:'39614',mode:'backward',
  why:'Backward recall makes you hold and reorder the digits at once. The sequence 3 9 6 1 4 reversed is 4 1 6 9 3.'},

 {id:'p1',d:'speed',type:'scan',q:'Count every ◆ in the grid',target:'◆',pool:['◆','●','▲'],cells:18,seed:17,
  why:'Scanning tasks measure how quickly you can pick out one symbol among others. Work row by row and count each ◆.'},
 {id:'p2',d:'speed',type:'scan',q:'Count every ▲ in the grid',target:'▲',pool:['▲','■','●'],cells:18,seed:91,
  why:'Steady row-by-row scanning beats jumping around the grid. Count each ▲ as you go.'},
 {id:'p3',d:'speed',type:'choice',q:'Use the key to decode the symbols',pre:'<div class="codekey"><span>◆<b>3</b></span><span>●<b>7</b></span><span>▲<b>1</b></span></div><div class="seq"><span>▲</span><span>◆</span><span>●</span></div>',opts:['137','173','317','731'],a:0,
  why:'▲ is 1, ◆ is 3 and ● is 7, which reads 137. Coding tasks like this are a standard processing-speed measure.'},

 /* pattern-recognition cards: a matrix with a missing tile and six answer tiles */
 {id:'pa1',d:'fluid',type:'pat',n:3,q:'Which tile completes the pattern?',
  cell:(r,c)=>plusSVG([[['N'],['E'],['N','E']],[['S'],['N','S'],['N','S']],[['E'],['S','W'],null]][r][c]),
  ans:plusSVG(['E','S','W']),
  wrong:[plusSVG(['S','W']),plusSVG(['E','S']),plusSVG(['E','W']),plusSVG(['N','E','S','W']),plusSVG(['N','S','W'])],
  why:'In every row the third cross keeps each arm that appears in either of the first two. Row three has an east arm, then south and west arms, so the last cross has east, south and west.'},
 {id:'pa2',d:'fluid',type:'pat',n:3,q:'Which tile completes the pattern?',
  cell:(r,c)=>diaSVG((2*r+c)%4),
  ans:diaSVG(2),
  wrong:[diaSVG(0),diaSVG(1),diaSVG(3),diaSVG(2,true),diaSVG(-1)],
  why:'The marker moves one corner clockwise with each step to the right, and each row starts two corners further round than the row above. Row three starts at the top, so the third diamond has its marker at the bottom.'},
 {id:'pa3',d:'fluid',type:'pat',n:2,q:'Which tile completes the pattern?',
  cell:(r,c)=>[[cellSVG({shape:'arrow',rot:0}),cellSVG({shape:'arrow',rot:90,fill:'solid'})],[cellSVG({shape:'triangle',rot:0}),null]][r][c],
  ans:cellSVG({shape:'triangle',rot:90,fill:'solid'}),
  wrong:[cellSVG({shape:'triangle',rot:90}),cellSVG({shape:'triangle',rot:270,fill:'solid'}),cellSVG({shape:'triangle',rot:180,fill:'solid'}),cellSVG({shape:'arrow',rot:90,fill:'solid'}),cellSVG({shape:'triangle',rot:0,fill:'solid'})],
  why:'Moving right, the shape turns a quarter turn clockwise and becomes solid. Apply the same change to the outlined triangle on the bottom row.'},
 {id:'pa4',d:'fluid',type:'pat',n:3,q:'Which tile completes the pattern?',
  cell:(r,c)=>quadSVG([[0],[0,1],[0,1,3]][r].map(x=>(x+c)%4)),
  ans:quadSVG([1,2,3]),
  wrong:[quadSVG([0,1,3]),quadSVG([0,1,2]),quadSVG([0,2,3]),quadSVG([2,3]),quadSVG([0,1,2,3])],
  why:'Each row has its own shaded pattern, and the pattern turns a quarter turn clockwise with every step to the right. Turning the three-quarter shape twice leaves the top-left quarter empty.'},
 {id:'pa5',d:'fluid',type:'pat',n:3,q:'Which tile completes the pattern?',
  cell:(r,c)=>{const A=[[[0,1,3],[1,4,5]],[[2,5,8],[4,5,6]],[[0,4,7],[1,4,8]]][r];const x=(a,b)=>a.filter(v=>!b.includes(v)).concat(b.filter(v=>!a.includes(v)));return dotsSVG(c===0?A[0]:c===1?A[1]:x(A[0],A[1]));},
  ans:dotsSVG([0,1,7,8]),
  wrong:[dotsSVG([0,1,4,7,8]),dotsSVG([4]),dotsSVG([0,7]),dotsSVG([0,1,7]),dotsSVG([0,1,2,7,8])],
  why:'In each row the third grid keeps the squares that are filled in exactly one of the first two. Squares filled in both cancel out, so the middle square of row three disappears.'},
 {id:'pa6',d:'fluid',type:'pat',n:3,q:'Which tile completes the pattern?',
  cell:(r,c)=>cellSVG({shape:S3[(r+c)%3],count:r+1}),
  ans:cellSVG({shape:'square',count:3}),
  wrong:[cellSVG({shape:'square',count:2}),cellSVG({shape:'circle',count:3}),cellSVG({shape:'triangle',count:3}),cellSVG({shape:'square',count:4}),cellSVG({shape:'square',count:1})],
  why:'The count is set by the row: one shape in row one, two in row two, three in row three. The shape changes along each row, and each shape appears once in every row and column. Row three already has a triangle and a circle, so it needs three squares.'},
 {id:'pa7',d:'fluid',type:'pat',n:3,q:'Which tile completes the pattern?',
  cell:(r,c)=>pieSVG([[[0,1,2],[1],[0,2]],[[1,2,3],[2,3],[1]],[[0,2,3],[2],null]][r][c]),
  ans:pieSVG([0,3]),
  wrong:[pieSVG([0,2,3]),pieSVG([0]),pieSVG([3]),pieSVG([0,1,3]),pieSVG([2,3])],
  why:'In each row the third circle keeps the quarters of the first circle that are not shaded in the second. Row three starts with the top-left, bottom-right and bottom-left quarters, and the middle circle removes the bottom-right one, leaving the top-left and bottom-left.'},
 {id:'pa8',d:'fluid',type:'pat',n:3,q:'Which tile completes the pattern?',
  cell:(r,c)=>nestSVG(SH3[r],SH3[(c+2*r)%3],'solid'),
  ans:nestSVG('triangle','circle','solid'),
  wrong:[nestSVG('triangle','square','solid'),nestSVG('triangle','triangle','solid'),nestSVG('circle','triangle','solid'),nestSVG('square','circle','solid'),nestSVG('triangle','circle','outline')],
  why:'The outer shape is set by the row. The inner shape changes in every column, and each inner shape appears once in every row and column. Row three already has a square and a triangle inside, so the last inner shape is a solid circle.'},
 {id:'pa9',d:'fluid',type:'pat',n:3,q:'Which tile completes the pattern?',
  cell:(r,c)=>linesSVG(c*45,r+1),
  ans:linesSVG(90,3),
  wrong:[linesSVG(45,3),linesSVG(90,2),linesSVG(135,3),linesSVG(90,4),linesSVG(0,3)],
  why:'The number of lines is set by the row: one, two, then three. Moving right, the lines turn 45° clockwise each step. The last tile in row three has three lines turned a quarter turn from flat, so they stand upright.'},
 {id:'an1',d:'spatial',type:'analogy',q:'Shape A turns into shape B. Apply the same change to shape C.',
  A:{shape:'circle',count:1},B:{shape:'circle',count:3},C:{shape:'square',count:1},
  ans:{shape:'square',count:3},wrong:[{shape:'square',count:1},{shape:'square',count:2},{shape:'circle',count:3},{shape:'triangle',count:3}],
  why:'From A to B the shape stays the same and the count goes from one to three. Applied to the square, that gives three squares.'},
 {id:'an2',d:'spatial',type:'analogy',q:'Shape A turns into shape B. Apply the same change to shape C.',
  A:{shape:'arrow',rot:0},B:{shape:'arrow',rot:180},C:{shape:'arrow',rot:90},
  ans:{shape:'arrow',rot:270},wrong:[{shape:'arrow',rot:90},{shape:'arrow',rot:0},{shape:'arrow',rot:180},{shape:'arrow',rot:315}],
  why:'From A to B the arrow makes a half turn. The arrow in C points right, so a half turn makes it point left.'},
 {id:'an3',d:'spatial',type:'analogy',q:'Shape A turns into shape B. Apply the same change to shape C.',
  A:{shape:'circle',count:1},B:{shape:'circle',count:1,fill:'solid'},C:{shape:'triangle',count:1},
  ans:{shape:'triangle',count:1,fill:'solid'},wrong:[{shape:'triangle',count:1},{shape:'square',count:1,fill:'solid'},{shape:'circle',count:1,fill:'solid'},{shape:'triangle',count:2,fill:'solid'}],
  why:'From A to B the shape stays the same and only the fill changes from outline to solid. Applied to the triangle, that gives a solid triangle.'},
 {id:'od2',d:'fluid',type:'oddfig',q:'Which tile is the odd one out?',
  figs:[{shape:'arrow',rot:0},{shape:'arrow',rot:90},{shape:'arrow',rot:45},{shape:'arrow',rot:270}],a:2,
  why:'Three arrows point straight up, right or left. The fourth points diagonally.'},
 {id:'r1',d:'spatial',type:'rotate',q:'Which option is the shape on the left rotated, not mirrored?',base:L_PENT,
  build:b=>({ans:rotN(b,3),wrong:[mirror(b),rotN(mirror(b),1),rotN(mirror(b),2)]}),
  why:'Turning the shape three quarter turns gives the correct option. The other three are mirror images, which no turning can produce.'},
 {id:'r2',d:'spatial',type:'rotate',q:'Which option is the shape on the left rotated, not mirrored?',base:N_PENT,
  build:b=>({ans:rotN(b,1),wrong:[mirror(b),rotN(mirror(b),2),rotN(mirror(b),3)]}),
  why:'Only one option can be reached by turning the shape a quarter turn. The other three are reflections, so they cannot be matched by rotation alone.'},
 {id:'mw1',d:'quant',type:'choice',q:'A train leaves at 9:40 and the journey takes 2 hours 35 minutes. When does it arrive?',opts:['12:05','12:15','12:25','12:35'],a:1,
  why:'Add the hours first: 9:40 plus 2 hours is 11:40. Then add 35 minutes: 40 + 35 = 75 minutes, which is one hour and 15 minutes, so the train arrives at 12:15.'},
 {id:'mw2',d:'quant',type:'choice',q:'A shop raises a price by 25%, then cuts the new price by 20%. Compared with the original price, the final price is…',opts:['5% lower','the same','5% higher','impossible to tell'],a:1, why:'Raising by 25% multiplies the price by 1.25 and cutting by 20% multiplies it by 0.8. Since 1.25 × 0.8 = 1, the final price equals the original.'},
 {id:'mw3',d:'quant',type:'choice',q:'Tap A fills a tank in 6 hours. Tap B fills it in 3 hours. How long do both taps take together?',opts:['1 hour','2 hours','4.5 hours','9 hours'],a:1,
  why:'In one hour tap A fills one sixth of the tank and tap B fills one third. Together that is one half per hour, so the tank fills in 2 hours.'}
];
/* mixed order: no two neighbours share a domain, and the nine pattern cards are spread through the test */
const ORDER=['odd','q1','w1','q8','v2','pa1','ciph','dir','q3','bal','v7','s3','p3','an1','v3','pair','r1','mw2','pa8','v4','an3','s1','od2','r2','pa9','mw3','pa6','pa2','s4','an2'];
const CHECKPOINTS=[5,10,15,20,25];
const FACTS=[
  'Raven’s Progressive Matrices, the model for the grid items, were first published in 1938 and are still used today.',
  'Average raw scores on IQ tests rose by about three points a decade across much of the 20th century. Researchers call it the Flynn effect.',
  'Classic memory research put the adult digit span at around seven items. Grouping digits into chunks is how people stretch it.',
  'Modern batteries score separate indices such as reasoning, memory and speed, then combine them into one composite.',
  'In 1904 Charles Spearman noticed that people who do well on one kind of mental test tend to do well on others, an idea he called general intelligence.'
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
const buildItem=(id,i)=>{
  const it=RAW.find(x=>x.id===id);
  const o={...it,idx:i};
  if(it.type==='matrix'||it.type==='figseq'){
    const all=[{k:'a',c:it.ans},...it.wrong.map((w,j)=>({k:'w'+j,c:w}))];
    o.choices=shuffle(all,i*31+7);o.correct=o.choices.findIndex(x=>x.k==='a');
  }else if(it.type==='analogy'){
    const all=[{k:'a',c:it.ans},...it.wrong.map((w,j)=>({k:'w'+j,c:w}))];
    o.choices=shuffle(all,i*29+13);o.correct=o.choices.findIndex(x=>x.k==='a');
  }else if(it.type==='pat'){
    const all=[{k:'a',svg:it.ans},...it.wrong.map((s,j)=>({k:'w'+j,svg:s}))];
    o.choices=shuffle(all,i*23+9);o.correct=o.choices.findIndex(x=>x.k==='a');
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
    const r=rng(it.seed);const g=[];for(let k=0;k<(it.cells||45);k++)g.push(it.pool[Math.floor(r()*it.pool.length)]);
    o.grid=g;const n=g.filter(x=>x===it.target).length;o.count=n;
    const opts=shuffle([n,n-1,n+1,n+2],it.seed);o.opts=opts.map(String);o.correct=opts.indexOf(n);
    o.why=`There were ${n}. `+it.why;
  }else if(it.type==='memory'){
    o.answer=it.mode==='forward'?it.digits:it.digits.split('').reverse().join('');
  }else{o.correct=it.a;}
  return o;
};
const ITEMS=ORDER.map(buildItem);
const byId=id=>ITEMS.find(x=>x.id===id)||buildItem(id,ITEMS.length);

let motionOn=!matchMedia('(prefers-reduced-motion: reduce)').matches;
function renderMatrix(el,item,showAns){
  let h='';for(let r=0;r<3;r++)for(let c=0;c<3;c++){
    if(r===2&&c===2)h+=`<div class="c q${showAns?' hit':''}" data-q>${showAns?cellSVG(item.ans):'?'}</div>`;
    else h+=`<div class="c">${cellSVG(item.cell(r,c))}</div>`;}
  el.innerHTML=h;
}

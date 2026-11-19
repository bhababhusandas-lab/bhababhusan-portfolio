import {projects} from './projects.js';
const $=s=>document.querySelector(s);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousFocus=null;
const artTemplates=[
 `<div class="tender-window"><div class="window-head"><span>TENDER / INTELLIGENCE</span><span>✳</span></div><h4>Many perspectives.<br>One clearer picture.</h4><div class="agent-chips"><span>LEGAL</span><span>FINANCE</span><span>TECHNICAL</span></div><div class="document-lines"><i></i><i></i><i></i></div></div>`,
 `<span class="legal-symbol">§</span><div class="legal-card"><small>LEGAL ASSISTANT</small><strong>Complex questions.<br>A simpler starting point.</strong><span>What would you like to understand?</span></div>`,
 `<div class="link-sheet"><small>LINKS, WITH A LITTLE MORE MEANING.</small><strong>Short links.<br>Clear insights.</strong><div class="link-url"><span>your.link / a-new-idea</span><span>↗</span></div><div class="analytics">${'<i></i>'.repeat(14)}</div></div>`,
 `<div class="site-window"><div class="site-nav"><span>THE COMPANY</span><span>ABOUT / SERVICES / CONTACT</span></div><div class="site-content"><strong>A digital home.<br>Built for people.</strong><span>✳</span></div><span class="site-pill">EXPLORE THE SERVICES</span></div>`
];
function makeArt(i){const art=document.createElement('div');art.className='project-art art-'+i;art.setAttribute('aria-hidden','true');art.innerHTML=`<span class="art-label">${projects[i].tag}</span>${artTemplates[i]}<span class="art-foot">PROJECT CONCEPT / INTERFACE STUDY</span>`;return art}
const track=$('#project-track');
projects.forEach((p,i)=>{const button=document.createElement('button');button.type='button';button.className='project-card';button.setAttribute('aria-label','Explore '+p.title);button.append(makeArt(i));const caption=document.createElement('div');caption.className='card-caption';const h=document.createElement('h3');h.textContent=p.title;const icon=document.createElement('span');icon.textContent='↗';caption.append(h,icon);button.append(caption);const meta=document.createElement('div');meta.className='project-meta';const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0')+' / SELECTED WORK';const stack=document.createElement('span');stack.textContent=p.stack.slice(0,3).join(' · ');meta.append(number,stack);button.append(meta);button.onclick=()=>openProject(i,button);track.append(button)});
function openProject(i,source){const p=projects[i];previousFocus=source;$('#dialog-art').replaceChildren(makeArt(i));$('#dialog-tag').textContent=p.tag;$('#project-title').textContent=p.title;$('#dialog-description').textContent=p.description;$('#dialog-points').replaceChildren(...p.points.map(s=>{const li=document.createElement('li');li.textContent=s;return li}));$('#dialog-stack').replaceChildren(...p.stack.map(s=>{const label=document.createElement('span');label.textContent=s;return label}));$('#project-dialog').showModal();$('#project-cursor').style.opacity=0}
$('#read-story').onclick=()=>{previousFocus=$('#read-story');$('#story-dialog').showModal()};
for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.close-dialog').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});dialog.addEventListener('close',()=>previousFocus?.focus({preventScroll:true}))}
const themeButton=$('#theme-toggle');
function syncTheme(){const dark=document.documentElement.dataset.theme==='dark';themeButton.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');themeButton.textContent=dark?'☼':'◐';document.querySelector('meta[name="theme-color"]').content=dark?'#171b1c':'#f4f3ef'}
syncTheme();themeButton.onclick=()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('portfolio-theme',theme)}catch(e){}syncTheme()};
$('#ribbon-toggle').onclick=()=>{const paused=$('.ribbon').classList.toggle('paused');$('#ribbon-toggle').setAttribute('aria-label',paused?'Resume scrolling text':'Pause scrolling text');$('#ribbon-toggle').textContent=paused?'▶':'Ⅱ'};
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}},{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
const work=$('.work'),sticky=$('.work-sticky'),position=$('#work-position'),fill=$('#work-progress-fill'),pageFill=$('#page-progress-fill');let workTop=0,workRange=1,travel=0,queued=false;
const panels=Array.from(document.querySelectorAll('.stack-panel'));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function measure(){workTop=work.getBoundingClientRect().top+scrollY;workRange=Math.max(1,work.offsetHeight-sticky.offsetHeight);travel=Math.max(0,track.scrollWidth-innerWidth);panels.forEach((panel,i)=>{const inset=innerWidth>650?24+i*16:12+i*10;panel.style.setProperty('--pin-top',Math.min(inset,innerHeight-panel.offsetHeight)+'px')});paint()}
function paint(){queued=false;
 if(!reduce){
 const nextPositions=panels.slice(1).map(panel=>panel.getBoundingClientRect().top);
 panels.slice(0,-1).forEach((panel,i)=>{const cover=clamp((innerHeight-nextPositions[i])/innerHeight,0,1);panel.style.setProperty('--stack-scale',String(1-cover*.045));panel.style.setProperty('--stack-shade',String(cover*.1))});
 }
 const progress=clamp((scrollY-workTop)/workRange,0,1);if(innerWidth>650){track.style.transform=`translateX(${-progress*travel}px)`;position.textContent=String(Math.min(4,Math.floor(progress*4)+1)).padStart(2,'0')+' / 04';fill.style.transform=`scaleX(${.25+progress*.75})`}else track.style.transform='none';const max=document.documentElement.scrollHeight-innerHeight;pageFill.style.transform=`scaleX(${max>0?scrollY/max:0})`}
function requestPaint(){if(!queued){queued=true;requestAnimationFrame(paint)}}
addEventListener('scroll',requestPaint,{passive:true});addEventListener('resize',measure,{passive:true});
// A custom pointer only appears over project illustrations on a precise pointer device.
const cursor=$('#project-cursor');let pointerX=0,pointerY=0,cursorQueued=false;
function moveCursor(){cursorQueued=false;cursor.style.transform=`translate(${pointerX-47}px,${pointerY-47}px)`}
if(matchMedia('(pointer:fine)').matches&&!reduce){for(const card of track.children){const art=card.querySelector('.project-art');art.addEventListener('pointerenter',()=>cursor.style.opacity=1);art.addEventListener('pointerleave',()=>cursor.style.opacity=0);art.addEventListener('pointermove',event=>{pointerX=event.clientX;pointerY=event.clientY;if(!cursorQueued){cursorQueued=true;requestAnimationFrame(moveCursor)}})}for(const button of document.querySelectorAll('.magnetic')){button.addEventListener('pointermove',event=>{const r=button.getBoundingClientRect();button.style.transform=`translate(${(event.clientX-r.left-r.width/2)*.12}px,${(event.clientY-r.top-r.height/2)*.16}px)`});button.addEventListener('pointerleave',()=>button.style.transform='translate(0,0)')}}
// Wait for the essential portrait and fonts, but always release the loader.
document.body.classList.add('booting');
const bounded=promise=>Promise.race([promise,new Promise(resolve=>setTimeout(resolve,2200))]);
Promise.all([bounded($('.portrait img').decode().catch(()=>{})),bounded(document.fonts.ready)]).then(()=>{setTimeout(()=>{document.body.classList.add('ready');$('#loader').classList.add('done');document.body.classList.remove('booting');measure()},reduce?0:300)});
measure();

(() => {
 const safeImage=v=>typeof v==='string'&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v);
 const section=document.createElement('section');section.id='results';section.className='section-shell proof-section';section.hidden=true;
 section.innerHTML='<div class="section-heading"><h2>نتايج وآراء عملائنا</h2><p>رحلات مختلفة. وخطة تخص كل شخص.</p></div><div id="transformations-block" hidden><h3>قبل وبعد</h3><div class="proof-grid" id="transformations-grid"></div></div><div id="testimonials-block" hidden><h3>آراء العملاء</h3><div class="proof-grid" id="testimonials-grid"></div></div>';
 document.querySelector('#packages').before(section);
 function image(src,alt){const im=document.createElement('img');im.src=src;im.alt=alt;im.loading='lazy';return im;}
 function render(data){
  for(const key of ['transformations','testimonials']){
   const grid=document.querySelector('#'+key+'-grid');
   for(const item of (Array.isArray(data[key])?data[key]:[]).slice(0,50)){
    if(!safeImage(item.image)&&!(safeImage(item.before)&&safeImage(item.after)))continue;
    const card=document.createElement('article');card.className='proof-card';
    if(key==='transformations'&&safeImage(item.before)&&safeImage(item.after)){
     const pair=document.createElement('div');pair.className='proof-pair';
     for(const [field,label] of [['before','قبل'],['after','بعد']]){const f=document.createElement('figure');const caption=document.createElement('figcaption');caption.textContent=label;f.append(image(item[field],label+' — '+(item.title||'رحلة عميل')),caption);pair.append(f)}card.append(pair);
    }else card.append(image(item.image,key==='testimonials'?'رأي عميل ShapeX':(item.title||'قبل وبعد')));
    if(item.title){const h=document.createElement('h4');h.textContent=String(item.title).slice(0,100);card.append(h)}
    if(item.caption){const p=document.createElement('p');p.textContent=String(item.caption).slice(0,500);card.append(p)}grid.append(card);
   }
   document.querySelector('#'+key+'-block').hidden=!grid.children.length;
   if(grid.children.length)makeRail(grid,key);
  }
  section.hidden=!section.querySelector('.proof-card');
 }
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const rails=[];
 const viewer=document.createElement('dialog');viewer.className='proof-viewer';
 const close=document.createElement('button');close.className='proof-close';close.type='button';close.textContent='×';close.setAttribute('aria-label','إغلاق الصورة');const viewBody=document.createElement('div');viewer.append(close,viewBody);document.body.append(viewer);
 close.onclick=()=>viewer.close();viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close()});
 let restoreFocus;
 viewer.addEventListener('close',()=>{viewBody.replaceChildren();restoreFocus?.focus()});
 function makeRail(grid,key){
  grid.classList.add('proof-rail');grid.setAttribute('aria-label',key==='transformations'?'صور قبل وبعد':'صور آراء العملاء');
  const cards=[...grid.children],group=document.createElement('div');group.className='proof-group';cards.forEach(c=>group.append(c));grid.append(group);
  const controls=document.createElement('div');controls.className='proof-controls';const prev=document.createElement('button'),next=document.createElement('button'),pause=document.createElement('button');
  prev.type=next.type=pause.type='button';prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','عرض الصور السابقة');next.setAttribute('aria-label','عرض الصور التالية');
  const state={grid,group,reverse:key==='testimonials',visible:false,hover:false,focus:false,until:0,auto:(!reducedMotion.matches||document.documentElement.classList.contains('motion-enabled'))&&cards.length>1};rails.push(state);
  function label(){pause.textContent=state.auto?'إيقاف الحركة':'تشغيل الحركة';pause.setAttribute('aria-pressed',String(state.auto))}label();
  pause.onclick=()=>{state.auto=!state.auto;label()};
  const step=sign=>{state.until=performance.now()+12000;grid.scrollBy({left:sign*(cards[0].getBoundingClientRect().width+20),behavior:reducedMotion.matches?'instant':'smooth'})};
  prev.onclick=()=>step(-1);next.onclick=()=>step(1);prev.disabled=next.disabled=cards.length<2;
  controls.append(prev,pause,next);grid.before(controls);
  grid.tabIndex=0;grid.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1)}};
  grid.addEventListener('mouseenter',()=>state.hover=true);grid.addEventListener('mouseleave',()=>state.hover=false);
  grid.addEventListener('focusin',()=>state.focus=true);grid.addEventListener('focusout',e=>{if(!grid.contains(e.relatedTarget))state.focus=false});
  grid.addEventListener('pointerdown',()=>state.until=performance.now()+12000,{passive:true});grid.addEventListener('wheel',()=>state.until=performance.now()+12000,{passive:true});
  cards.forEach(card=>{const button=document.createElement('button');button.type='button';button.className='proof-open';button.textContent='تكبير الصور';button.onclick=()=>{restoreFocus=button;viewBody.replaceChildren();for(const child of card.children)if(child!==button)viewBody.append(child.cloneNode(true));viewer.showModal();close.focus()};card.append(button)});
  if(cards.length>1){const twin=group.cloneNode(true);twin.setAttribute('aria-hidden','true');twin.inert=true;twin.classList.add('proof-twin');grid.append(twin);}
  const observer=new IntersectionObserver(entries=>state.visible=entries[0].isIntersecting,{rootMargin:'80px'});observer.observe(grid);
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){state.auto=false;label()}});
 }
 let last=0;
 function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;
  for(const s of rails){if(!s.visible||!s.auto||s.hover||s.focus||now<s.until||document.hidden||viewer.open||document.documentElement.classList.contains('motion-disabled'))continue;const span=s.group.getBoundingClientRect().width;if(!span)continue;s.carry=(s.carry||0)+22*dt;const pixels=Math.floor(s.carry);s.carry-=pixels;if(!pixels)continue;let next=s.grid.scrollLeft+(s.reverse?-1:1)*pixels;if(next<0)next+=span;if(next>=span)next-=span;s.grid.scrollLeft=next;}
  requestAnimationFrame(tick);
 }requestAnimationFrame(tick);
 fetch('site-content.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject()).then(render).catch(()=>{});
 document.querySelector('#language')?.addEventListener('click',()=>{const en=document.documentElement.lang==='en';section.querySelector('h2').textContent=en?'Client results & reviews':'نتايج وآراء عملائنا';section.querySelector('.section-heading p').textContent=en?'Different journeys. A plan for each person.':'رحلات مختلفة. وخطة تخص كل شخص.';document.querySelector('#transformations-block h3').textContent=en?'Before & after':'قبل وبعد';document.querySelector('#testimonials-block h3').textContent=en?'Client reviews':'آراء العملاء';});
})();


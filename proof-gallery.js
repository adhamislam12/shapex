(() => {
 const safeImage=v=>window.ShapeXCloud?.isPhoto(v)||typeof v==='string'&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v);
 const section=document.createElement('section');section.id='results';section.className='section-shell proof-section';section.hidden=true;
 section.innerHTML='<div class="section-heading"><h2>نتايج وآراء عملائنا</h2><p>رحلات مختلفة. وخطة تخص كل شخص.</p></div><div id="transformations-block" hidden><h3>قبل وبعد</h3><div class="proof-grid" id="transformations-grid"></div></div><div id="testimonials-block" hidden><h3>آراء العملاء</h3><div class="proof-grid" id="testimonials-grid"></div></div>';
 document.querySelector('#packages').before(section);
 const photoObserver=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;photoObserver.unobserve(e.target);window.ShapeXCloud.photo(e.target.dataset.photo).then(value=>e.target.src=value).catch(()=>e.target.alt='الصورة غير متاحة');}},{rootMargin:'200px'});
 function image(src,alt){const im=document.createElement('img');if(window.ShapeXCloud.isPhoto(src)){im.dataset.photo=src;im.width=600;im.height=600}else im.src=src;im.alt=alt;im.loading='lazy';return im;}
 function observePhotos(root){root.querySelectorAll('img[data-photo]').forEach(im=>photoObserver.observe(im))}
 function render(data){
  photoObserver.disconnect();
  for(const state of rails.splice(0))state.dispose();
  section.querySelectorAll('.proof-controls').forEach(el=>el.remove());
  for(const key of ['transformations','testimonials']){
   const grid=document.querySelector('#'+key+'-grid');
   grid.replaceChildren();grid.scrollLeft=0;
   for(const item of (Array.isArray(data[key])?data[key]:[]).slice(0,50)){
    if(!safeImage(item.image)&&!(safeImage(item.before)&&safeImage(item.after))&&!(key==='testimonials'&&(item.title||item.caption)))continue;
    const card=document.createElement('article');card.className='proof-card';
    if(key==='transformations'&&safeImage(item.before)&&safeImage(item.after)){
     const pair=document.createElement('div');pair.className='proof-pair';
     for(const [field,label] of [['before','قبل'],['after','بعد']]){const f=document.createElement('figure');const caption=document.createElement('figcaption');caption.textContent=label;f.append(image(item[field],label+' — '+(item.title||'رحلة عميل')),caption);pair.append(f)}card.append(pair);
    }else if(safeImage(item.image))card.append(image(item.image,key==='testimonials'?'رأي عميل ShapeX':(item.title||'قبل وبعد')));
    if(item.title){const h=document.createElement('h4');h.textContent=String(item.title).slice(0,100);card.append(h)}
    if(item.caption){const p=document.createElement('p');p.textContent=String(item.caption).slice(0,500);card.append(p)}grid.append(card);
   }
   document.querySelector('#'+key+'-block').hidden=!grid.children.length;
   if(grid.children.length){makeRail(grid,key);observePhotos(grid)}
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
  const events=new AbortController(),signal=events.signal;
  grid.addEventListener('mouseenter',()=>state.hover=true,{signal});grid.addEventListener('mouseleave',()=>state.hover=false,{signal});
  grid.addEventListener('focusin',()=>state.focus=true,{signal});grid.addEventListener('focusout',e=>{if(!grid.contains(e.relatedTarget))state.focus=false},{signal});
  grid.addEventListener('pointerdown',()=>state.until=performance.now()+12000,{passive:true,signal});grid.addEventListener('wheel',()=>state.until=performance.now()+12000,{passive:true,signal});
  cards.forEach(card=>{const button=document.createElement('button');button.type='button';button.className='proof-open';button.textContent='تكبير الصور';button.onclick=()=>{restoreFocus=button;viewBody.replaceChildren();for(const child of card.children)if(child!==button)viewBody.append(child.cloneNode(true));viewer.showModal();observePhotos(viewBody);close.focus()};card.append(button)});
  if(cards.length>1){const twin=group.cloneNode(true);twin.setAttribute('aria-hidden','true');twin.inert=true;twin.classList.add('proof-twin');grid.append(twin);}
  const observer=new IntersectionObserver(entries=>state.visible=entries[0].isIntersecting,{rootMargin:'80px'});observer.observe(grid);
  const motionChange=()=>{if(reducedMotion.matches){state.auto=false;label()}};
  reducedMotion.addEventListener('change',motionChange);
  state.dispose=()=>{events.abort();observer.disconnect();reducedMotion.removeEventListener('change',motionChange)};
 }
 let last=0;
 function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;
  for(const s of rails){if(!s.visible||!s.auto||s.hover||s.focus||now<s.until||document.hidden||viewer.open||document.documentElement.classList.contains('motion-disabled'))continue;const span=s.group.getBoundingClientRect().width;if(!span)continue;s.carry=(s.carry||0)+22*dt;const pixels=Math.floor(s.carry);s.carry-=pixels;if(!pixels)continue;let next=s.grid.scrollLeft+(s.reverse?-1:1)*pixels;if(next<0)next+=span;if(next>=span)next-=span;s.grid.scrollLeft=next;}
  requestAnimationFrame(tick);
 }requestAnimationFrame(tick);
 let currentRevision,refreshing=false;
 async function refresh(){
  if(refreshing||document.hidden||viewer.open)return;
  refreshing=true;
  try{const result=await window.ShapeXCloud.load();if(result.revision!==currentRevision){render(result.data);currentRevision=result.revision;}}
  catch(error){console.warn('ShapeX gallery refresh failed:',error.message)}finally{refreshing=false}
 }
 refresh();window.addEventListener('focus',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 window.addEventListener('storage',event=>{if(event.key==='shapex-gallery-updated')refresh()});
 setInterval(refresh,30000);
 document.querySelector('#language')?.addEventListener('click',()=>{const en=document.documentElement.lang==='en';section.querySelector('h2').textContent=en?'Client results & reviews':'نتايج وآراء عملائنا';section.querySelector('.section-heading p').textContent=en?'Different journeys. A plan for each person.':'رحلات مختلفة. وخطة تخص كل شخص.';document.querySelector('#transformations-block h3').textContent=en?'Before & after':'قبل وبعد';document.querySelector('#testimonials-block h3').textContent=en?'Client reviews':'آراء العملاء';});
})();


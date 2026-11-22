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
 viewer.addEventListener('close',()=>{viewBody.replaceChildren();restoreFocus?.focus({preventScroll:true});for(const state of rails){state.focus=false;state.until=performance.now()+1500}});
 function makeRail(grid,key){
  grid.classList.add('proof-rail');grid.setAttribute('aria-label',key==='transformations'?'صور قبل وبعد':'صور آراء العملاء');
  const cards=[...grid.children],group=document.createElement('div');group.className='proof-group';cards.forEach(c=>group.append(c));grid.append(group);
  const controls=document.createElement('div');controls.className='proof-controls';const prev=document.createElement('button'),next=document.createElement('button'),pause=document.createElement('button');
  prev.type=next.type=pause.type='button';prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','عرض الصور السابقة');next.setAttribute('aria-label','عرض الصور التالية');
  // Decreasing scrollLeft moves the cards visually from left to right.
  const state={grid,group,direction:key==='transformations'?-1:1,span:0,visible:false,hover:false,focus:false,pressed:false,until:0,auto:!reducedMotion.matches||document.documentElement.classList.contains('motion-enabled')};rails.push(state);
  const events=new AbortController(),signal=events.signal;
  function label(){pause.textContent=state.auto?'إيقاف الحركة':'تشغيل الحركة';pause.setAttribute('aria-pressed',String(state.auto))}label();
  pause.onclick=()=>{state.auto=!state.auto;label()};
  const step=sign=>{state.until=performance.now()+1500;grid.scrollLeft+=sign*(cards[0].getBoundingClientRect().width+20)};
  prev.onclick=()=>step(-1);next.onclick=()=>step(1);controls.append(prev,pause,next);grid.before(controls);
  grid.tabIndex=0;grid.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1)}};
  grid.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')state.hover=true},{signal});
  grid.addEventListener('pointerleave',()=>state.hover=false,{signal});
  grid.addEventListener('focusin',e=>state.focus=e.target.matches(':focus-visible'),{signal});
  grid.addEventListener('focusout',e=>{if(!grid.contains(e.relatedTarget))state.focus=false},{signal});
  grid.addEventListener('pointerdown',()=>state.pressed=true,{passive:true,signal});
  const release=()=>{if(state.pressed){state.pressed=false;state.until=performance.now()+1500}};
  window.addEventListener('pointerup',release,{passive:true,signal});window.addEventListener('pointercancel',release,{passive:true,signal});
  grid.addEventListener('wheel',()=>state.until=performance.now()+1500,{passive:true,signal});
  cards.forEach((card,index)=>{const button=document.createElement('button');button.type='button';button.className='proof-open';button.dataset.proofIndex=index;button.textContent='تكبير الصور';card.append(button)});
  // Delegate clicks so every visible copy opens the same original result.
  grid.addEventListener('click',e=>{const button=e.target.closest('.proof-open');if(!button)return;const card=cards[Number(button.dataset.proofIndex)];if(!card)return;restoreFocus=button;viewBody.replaceChildren();for(const child of card.children)if(!child.classList.contains('proof-open'))viewBody.append(child.cloneNode(true));viewer.showModal();observePhotos(viewBody);close.focus()},{signal});
  function copy(element){const twin=element.cloneNode(true);twin.setAttribute('aria-hidden','true');twin.querySelectorAll('button').forEach(button=>button.tabIndex=-1);return twin}
  let lastWidth=0;
  function layout(){
   const width=grid.clientWidth;if(!width)return;
   const phase=state.span?((grid.scrollLeft-state.span)%state.span+state.span)%state.span/state.span:0;
   grid.replaceChildren(group);group.replaceChildren(...cards);
   const base=group.getBoundingClientRect().width;if(!base)return;
   // A complete cycle must cover even a desktop viewport with only one image.
   const repeats=Math.max(1,Math.ceil((width+40)/base));
   for(let n=1;n<repeats;n++)for(const card of cards)group.append(copy(card));
   const before=copy(group),after=copy(group);before.classList.add('proof-twin');after.classList.add('proof-twin');grid.prepend(before);grid.append(after);
   state.span=group.getBoundingClientRect().width;grid.scrollLeft=state.span*(1+phase);lastWidth=width;observePhotos(grid);
  }
  const sizeObserver=new ResizeObserver(()=>{if(Math.abs(grid.clientWidth-lastWidth)>1)layout()});sizeObserver.observe(grid);requestAnimationFrame(layout);
  const observer=new IntersectionObserver(entries=>state.visible=entries[0].isIntersecting,{rootMargin:'80px'});observer.observe(grid);
  const motionChange=()=>{if(reducedMotion.matches){state.auto=false;label()}};reducedMotion.addEventListener('change',motionChange);
  state.dispose=()=>{events.abort();sizeObserver.disconnect();observer.disconnect();reducedMotion.removeEventListener('change',motionChange)};
 }
 let last=0;
 function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;
  for(const s of rails){
   if(!s.span||!s.visible)continue;
   // Keep the viewport in the middle cycle, including after manual swiping.
   if(!s.pressed&&(s.grid.scrollLeft<s.span||s.grid.scrollLeft>=2*s.span))s.grid.scrollLeft=s.span+((s.grid.scrollLeft-s.span)%s.span+s.span)%s.span;
   if(!s.auto||s.hover||s.focus||s.pressed||now<s.until||document.hidden||viewer.open||document.documentElement.classList.contains('motion-disabled'))continue;
   s.carry=(s.carry||0)+32*dt;const pixels=Math.floor(s.carry);s.carry-=pixels;if(pixels)s.grid.scrollLeft+=s.direction*pixels;
  }
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


(() => {
 const safeImage=v=>typeof v==='string'&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v);
 const section=document.createElement('section');section.id='results';section.className='section-shell proof-section';section.hidden=true;
 section.innerHTML='<div class="section-heading"><h2>نتايج وآراء عملائنا</h2><p>رحلات مختلفة. وخطة تخص كل شخص.</p></div><div id="transformations-block" hidden><h3>قبل وبعد</h3><div class="proof-grid" id="transformations-grid"></div></div><div id="testimonials-block" hidden><h3>آراء العملاء</h3><div class="proof-grid" id="testimonials-grid"></div></div>';
 document.querySelector('#packages').before(section);
 function image(src,alt){const im=document.createElement('img');im.src=src;im.alt=alt;im.loading='lazy';return im;}
 function render(data){
  for(const key of ['transformations','testimonials']){
   const grid=document.querySelector('#'+key+'-grid');
   for(const item of (Array.isArray(data[key])?data[key]:[]).slice(0,40)){
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
  }
  section.hidden=!section.querySelector('.proof-card');
 }
 fetch('site-content.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject()).then(render).catch(()=>{});
 document.querySelector('#language')?.addEventListener('click',()=>{const en=document.documentElement.lang==='en';section.querySelector('h2').textContent=en?'Client results & reviews':'نتايج وآراء عملائنا';section.querySelector('.section-heading p').textContent=en?'Different journeys. A plan for each person.':'رحلات مختلفة. وخطة تخص كل شخص.';document.querySelector('#transformations-block h3').textContent=en?'Before & after':'قبل وبعد';document.querySelector('#testimonials-block h3').textContent=en?'Client reviews':'آراء العملاء';});
})();

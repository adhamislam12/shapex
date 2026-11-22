'use strict';
(() => {
 const $=s=>document.querySelector(s),cloud=window.ShapeXCloud;
 let data={version:1,transformations:[],testimonials:[]},tab='transformations',signedIn=false,revision=null,dirty=false,busy=false;
 const safeImage=v=>cloud.isPhoto(v)||typeof v==='string'&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v);
 const message=text=>$('#status').textContent=text;
 function buttons(){ $('#publish').disabled=!signedIn||!dirty||busy;$('#add-button').disabled=busy;$('#connect button').disabled=busy||signedIn;$('#logout').disabled=busy; }
 function changed(){dirty=true;render();}
 function render(){
  for(const key of ['transformations','testimonials']){$('#count-'+key).textContent=data[key].length;$('#tab-'+key).setAttribute('aria-pressed',String(tab===key));}
  $('#items').replaceChildren();$('#empty').hidden=!!data[tab].length;
  data[tab].forEach((item,index)=>{
   const card=document.createElement('article');card.className='item';
   const media=document.createElement('div');media.className=item.before?'pair':'';
   for(const [src,label] of item.before?[[item.before,'قبل'],[item.after,'بعد']]:[[item.image,'صورة العميل']]){if(!safeImage(src))continue;const img=document.createElement('img');img.alt=label;cloud.photo(src).then(value=>img.src=value).catch(()=>img.alt='تعذر تحميل الصورة');media.append(img)}card.append(media);
   const h=document.createElement('h4');h.textContent=item.title|| (tab==='transformations'?'قبل وبعد':'رأي عميل');const p=document.createElement('p');p.textContent=item.caption||'';card.append(h,p);
   const actions=document.createElement('div');actions.className='actions';
   for(const [label,action,disabled] of [['للأعلى',()=>{[data[tab][index-1],data[tab][index]]=[data[tab][index],data[tab][index-1]];changed()},index===0],['للأسفل',()=>{[data[tab][index+1],data[tab][index]]=[data[tab][index],data[tab][index+1]];changed()},index===data[tab].length-1],['حذف من الموقع',()=>{if(confirm('حذف هذه الصورة من العرض؟ لن يتغير الموقع حتى تضغط نشر.')){data[tab].splice(index,1);changed()}},false]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled||busy;b.onclick=action;actions.append(b)}card.append(actions);$('#items').append(card);
  });buttons();
 }
 function fields(){const pair=tab==='transformations'&&$('#mode').value==='pair';$('#pair-inputs').hidden=!pair;$('#single-input').hidden=pair;$('#mode-wrap').hidden=tab!=='transformations';$('#editor-title').textContent=tab==='transformations'?'إضافة نتيجة قبل وبعد':'إضافة رأي عميل / محادثة واتساب';}
 for(const key of ['transformations','testimonials'])$('#tab-'+key).onclick=()=>{tab=key;fields();render()};$('#mode').onchange=fields;
 async function compress(file){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('اختر صورة JPG أو PNG أو WebP.');
  if(file.size>15*1024*1024)throw Error('الصورة أكبر من 15 ميجابايت.');
  const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);const result=canvas.toDataURL('image/webp',.82);if(result.length>800000)throw Error('الصورة كبيرة بعد الضغط. جرّب صورة أصغر.');return result;}finally{bitmap.close()}
 }
 $('#add').onsubmit=async e=>{e.preventDefault();if(busy)return;if(data[tab].length>=50){message('الحد الأقصى 50 مشاركة لكل قسم.');return}busy=true;buttons();try{
  const item={id:crypto.randomUUID(),title:$('#title').value.trim(),caption:$('#caption').value.trim()};
  if(tab==='transformations'&&$('#mode').value==='pair'){item.before=await compress($('#before').files[0]);item.after=await compress($('#after').files[0])}else item.image=await compress($('#image').files[0]);
  if(new Blob([JSON.stringify(data)]).size+new Blob([JSON.stringify(item)]).size>40*1024*1024)throw Error('المكتبة وصلت للحجم المتاح (40 ميجابايت). احذف صورًا قديمة أو صغّرها.');
  data[tab].push(item);$('#add').reset();fields();dirty=true;message('اتضافت للمسودة. راجع المعاينة واضغط نشر لإظهارها للزوار.');
 }catch(err){message(err.message)}finally{busy=false;render()}};
 function errorText(err){if(err.code==='auth/popup-blocked')return 'المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة واضغط دخول مرة أخرى.';if(err.code==='auth/popup-closed-by-user')return 'تم إغلاق نافذة الدخول. يمكنك المحاولة مرة أخرى.';if(err.code==='auth/unauthorized-domain')return 'دومين الموقع غير مضاف لإعدادات Google.';return err.message||'تعذر الاتصال. حاول مرة أخرى.';}
 async function loadPublished(){const result=await cloud.load();data=result.data;revision=result.revision;dirty=false;render();}
 $('#connect').onsubmit=async e=>{e.preventDefault();if(busy)return;if(dirty&&!confirm('تحميل المحتوى المنشور سيستبدل المسودة. تكمّل؟'))return;busy=true;buttons();message('جاري تسجيل الدخول بحساب Google…');try{await cloud.connect();signedIn=true;await loadPublished();$('#connection').textContent='تم الدخول بحساب إدارة ShapeX';$('#logout').hidden=false;message('جاهز لرفع الصور والنشر.');}catch(err){message(errorText(err))}finally{busy=false;render()}};
 $('#logout').onclick=async()=>{if(dirty&&!confirm('عند تسجيل الخروج ستفقد التعديلات غير المنشورة. تكمّل؟'))return;try{await cloud.disconnect();signedIn=false;data={version:1,transformations:[],testimonials:[]};dirty=false;revision=null;$('#logout').hidden=true;$('#connection').textContent='سجّل بحساب Google لبدء الإدارة';message('تم تسجيل الخروج.');render()}catch(err){message(errorText(err))}};
 $('#publish').onclick=async()=>{if(!signedIn||!dirty||busy)return;if(!confirm('نشر الصور والآراء للعامة على موقع ShapeX؟'))return;busy=true;render();message('جاري نشر الصور…');try{const result=await cloud.publish(data,revision,(done,total)=>message('جاري رفع الصور '+done+' / '+total));data=result.data;revision=result.revision;dirty=false;message('تم النشر. الصور متاحة الآن على الموقع لكل الزوار.');}catch(err){message(errorText(err))}finally{busy=false;render()}};
 cloud.session(async user=>{signedIn=!!user;$('#logout').hidden=!signedIn;$('#connect button').disabled=signedIn;$('#connection').textContent=signedIn?'تم الدخول بحساب إدارة ShapeX':'سجّل بحساب Google لبدء الإدارة';if(signedIn&&!dirty&&!busy){try{await loadPublished()}catch(err){message(errorText(err))}}buttons()}).catch(err=>message(errorText(err)));
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
 fields();render();
})();

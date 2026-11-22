'use strict';
(() => {
 const $=s=>document.querySelector(s),repo='adhamislam12/shapex',path='site-content.json';
 let data={version:1,transformations:[],testimonials:[]},tab='transformations',token='',sha=null,dirty=false,busy=false;
 const safeImage=v=>typeof v==='string'&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v);
 const message=text=>$('#status').textContent=text;
 function buttons(){ $('#publish').disabled=!token||!dirty||busy;$('#add-button').disabled=busy;$('#connect button').disabled=busy;$('#logout').disabled=busy; }
 function changed(){dirty=true;render();}
 function render(){
  for(const key of ['transformations','testimonials']){$('#count-'+key).textContent=data[key].length;$('#tab-'+key).setAttribute('aria-pressed',String(tab===key));}
  $('#items').replaceChildren();$('#empty').hidden=!!data[tab].length;
  data[tab].forEach((item,index)=>{
   const card=document.createElement('article');card.className='item';
   const media=document.createElement('div');media.className=item.before?'pair':'';
   for(const [src,label] of item.before?[[item.before,'قبل'],[item.after,'بعد']]:[[item.image,'صورة العميل']]){if(!safeImage(src))continue;const img=document.createElement('img');img.src=src;img.alt=label;media.append(img)}card.append(media);
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
 $('#add').onsubmit=async e=>{e.preventDefault();if(busy)return;if(data[tab].length>=30){message('الحد الأقصى 30 مشاركة لكل قسم.');return}busy=true;buttons();try{
  const item={id:crypto.randomUUID(),title:$('#title').value.trim(),caption:$('#caption').value.trim()};
  if(tab==='transformations'&&$('#mode').value==='pair'){item.before=await compress($('#before').files[0]);item.after=await compress($('#after').files[0])}else item.image=await compress($('#image').files[0]);
  if(new Blob([JSON.stringify(data)]).size+new Blob([JSON.stringify(item)]).size>6*1024*1024)throw Error('المكتبة وصلت للحجم المتاح (6 ميجابايت). احذف صورًا قديمة أو صغّرها.');
  data[tab].push(item);$('#add').reset();fields();dirty=true;message('اتضافت للمسودة. راجع المعاينة واضغط نشر لإظهارها للزوار.');
 }catch(err){message(err.message)}finally{busy=false;render()}};
 async function api(endpoint,method='GET',body){
  const r=await fetch('https://api.github.com/repos/'+repo+'/'+endpoint,{method,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok){const code=r.status;if(code===401)throw Error('مفتاح GitHub غير صالح أو انتهت صلاحيته.');if(code===403||code===404)throw Error('لا توجد صلاحية كافية. اختر مستودع shapex وصلاحية Contents: Read and write.');if(code===409||code===422)throw Error('تغير المحتوى على GitHub أثناء التعديل. أعد الاتصال لتحميل آخر نسخة قبل النشر.');throw Error('تعذر الاتصال بـGitHub ('+code+'). حاول مرة أخرى.');}return r.json();
 }
 const decode=b64=>new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g,'')),c=>c.charCodeAt(0)));
 function normalize(value){if(!value||value.version!==1||!Array.isArray(value.transformations)||!Array.isArray(value.testimonials))throw Error('ملف المحتوى غير صالح.');for(const key of ['transformations','testimonials'])for(const item of value[key])if(!item||(!safeImage(item.image)&&!(safeImage(item.before)&&safeImage(item.after))))throw Error('إحدى الصور في ملف المحتوى غير صالحة.');return value;}
 $('#connect').onsubmit=async e=>{e.preventDefault();if(busy)return;if(dirty&&!confirm('تحميل آخر نسخة سيستبدل المسودة الحالية. تكمّل؟'))return;busy=true;buttons();token=$('#token').value.trim();$('#token').value='';message('جاري الاتصال…');try{
  const content=await api('contents/'+path+'?ref=main');const text=content.content?decode(content.content):decode((await api('git/blobs/'+content.sha)).content);data=normalize(JSON.parse(text));sha=content.sha;dirty=false;$('#connection').textContent='متصل بمستودع shapex — جاهز للنشر';$('#logout').hidden=false;message('تم تحميل المحتوى المنشور.');
 }catch(err){token='';sha=null;message(err.message)}finally{busy=false;render()}};
 $('#logout').onclick=()=>{token='';sha=null;$('#token').value='';$('#logout').hidden=true;$('#connection').textContent='غير متصل — المسودة موجودة حتى إغلاق الصفحة';message('تم مسح مفتاح الاتصال من ذاكرة الصفحة.');buttons()};
 $('#publish').onclick=async()=>{if(!token||!dirty||busy)return;if(!confirm('نشر هذه الصور والآراء للعامة على موقع ShapeX؟'))return;busy=true;render();message('جاري نشر المحتوى…');try{
  const encoded=new TextEncoder().encode(JSON.stringify(data));let binary='';for(let i=0;i<encoded.length;i+=8192)binary+=String.fromCharCode(...encoded.subarray(i,i+8192));
  const result=await api('contents/'+path,'PUT',{message:'Update ShapeX results and client reviews',content:btoa(binary),sha,branch:'main'});sha=result.content.sha;dirty=false;message('تم حفظ المحتوى على GitHub. سيظهر بالموقع بعد اكتمال النشر التلقائي (عادةً خلال دقائق).');
 }catch(err){message(err.message)}finally{busy=false;render()}};
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
 fetch(path,{cache:'no-cache'}).then(r=>r.json()).then(value=>{if(!dirty&&!token){data=normalize(value);render()}}).catch(()=>{});
 fields();render();
})();

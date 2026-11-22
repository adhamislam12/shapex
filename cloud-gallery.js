/* Public Firebase app configuration is separate from private Google sessions. */
(() => {
 const cfg=window.SHAPEX_FIREBASE;
 const root=`https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents`;
 const key='?key='+encodeURIComponent(cfg.apiKey),photoCache=new Map();
 let auth,authModule,ready;
 const isPhoto=value=>typeof value==='string'&&/^photo:[a-f0-9-]{36}$/.test(value);
 async function read(path){const r=await fetch(root+'/'+path+key,{cache:'no-cache'});if(r.status===404)return null;if(!r.ok)throw Error('تعذر تحميل المحتوى. حاول مرة أخرى.');return r.json()}
 async function initialize(){
  const app=await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js');
  authModule=await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js');
  auth=authModule.getAuth(app.initializeApp(cfg));
  await authModule.setPersistence(auth,authModule.browserSessionPersistence);
  await auth.authStateReady();
 }
 const init=()=>ready??(ready=initialize());
 async function commit(writes){
  await init();const user=auth.currentUser;if(!user||!user.emailVerified||user.email?.toLowerCase()!=='shapex52@gmail.com')throw Error('النشر متاح لحساب إدارة ShapeX فقط.');
  const r=await fetch(root+':commit'+key,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await user.getIdToken()},body:JSON.stringify({writes})});
  if(!r.ok){const err=await r.json().catch(()=>({}));if(r.status===409||err.error?.status==='FAILED_PRECONDITION')throw Error('تم تعديل المحتوى من جهاز آخر. أعد تحميل آخر نسخة قبل النشر.');if(r.status===403)throw Error('حسابك غير مسموح له بالنشر. استخدم حساب ShapeX.');throw Error('لم يكتمل النشر. المسودة ما زالت موجودة. حاول مرة أخرى.');}return r.json();
 }
 window.ShapeXCloud={
  isPhoto,
  async load(){const doc=await read('public/gallery');return {data:doc?JSON.parse(doc.fields.json.stringValue):{version:1,transformations:[],testimonials:[]},revision:doc?.updateTime??null}},
  photo(ref){if(!isPhoto(ref))return Promise.resolve(ref);if(!photoCache.has(ref)){const promise=read('photos/'+ref.slice(6)).then(doc=>{const data=doc?.fields?.data?.stringValue;if(!/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(data??''))throw Error('الصورة غير متاحة.');return data}).catch(e=>{photoCache.delete(ref);throw e});photoCache.set(ref,promise);}return photoCache.get(ref)},
  async session(callback){await init();return authModule.onAuthStateChanged(auth,u=>callback(u&&u.emailVerified&&u.email?.toLowerCase()==='shapex52@gmail.com'?{email:u.email}:null))},
  async connect(){await init();const provider=new authModule.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account',login_hint:'shapex52@gmail.com'});const result=await authModule.signInWithPopup(auth,provider);if(!result.user.emailVerified||result.user.email?.toLowerCase()!=='shapex52@gmail.com'){await authModule.signOut(auth);throw Error('الحساب ده مش حساب الإدارة. اختار حساب ShapeX.');}return {email:result.user.email}},
  async disconnect(){await init();await authModule.signOut(auth)},
  async publish(source,revision,progress=()=>{}){
   const data=JSON.parse(JSON.stringify(source)),items=[...data.transformations,...data.testimonials];
   if(data.transformations.length>50||data.testimonials.length>50)throw Error('الحد الأقصى ٥٠ مشاركة في كل قسم.');
   let done=0;const images=items.flatMap(item=>['image','before','after'].filter(k=>item[k]&&!isPhoto(item[k])).map(k=>({item,k})));
   for(const {item,k} of images){const value=item[k];if(!/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(value)||value.length>800000)throw Error('إحدى الصور كبيرة أو غير صالحة.');const id=crypto.randomUUID();await commit([{update:{name:root.slice('https://firestore.googleapis.com/v1/'.length)+'/photos/'+id,fields:{data:{stringValue:value}}},currentDocument:{exists:false}}]);item[k]='photo:'+id;photoCache.set(item[k],Promise.resolve(value));progress(++done,images.length);}
   const result=await commit([{update:{name:root.slice('https://firestore.googleapis.com/v1/'.length)+'/public/gallery',fields:{json:{stringValue:JSON.stringify(data)}}},currentDocument:revision?{updateTime:revision}:{exists:false}}]);
   return {data,revision:result.writeResults[0].updateTime};
  }
 };
})();

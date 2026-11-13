'use strict';
// Six generated poses, each with six actual arm/leg animation frames.
// CSS displays an equal 3 x 2 grid; the original reference file remains intact.
(() => {
 const sequences={wave:[0,1,2,3,4,5,4,3,2,1],point:[0,1,2,3,5,4,5,3,2,1],
  'point-left':[0,1,2,3,5,4,5,3,2,1],sit:[0,1,2,3,2,4,5,4],lean:[0,1,2,3,2,4,5,4],drop:[0,1,2,3,4,3,2,1]};
 const loaded=new Set(),pending=new Set(),sprites=[];
 let override=null,overrideUntil=0,lastSection=null,entranceUntil=0,lastFrameAt=0;
 const labels={wave:'ترحيب',point:'إشارة يمين','point-left':'إشارة شمال',sit:'قعدة',lean:'استناد',drop:'نزول'};
 function loadPose(pose){
  if(loaded.has(pose)||pending.has(pose))return;
  pending.add(pose);const image=new Image();image.decoding='async';image.src=`${pose}.webp`;
  image.onload=()=>{if(image.naturalWidth===1152&&image.naturalHeight===768)loaded.add(pose);pending.delete(pose)};
  image.onerror=()=>pending.delete(pose);
 }
 function addSprite(host,type){if(!host)return;const sprite=document.createElement('span');sprite.className='robot-sprite';sprite.setAttribute('aria-hidden','true');host.append(sprite);sprites.push({sprite,host,type,pose:null,frame:-1});}
 addSprite($('.hero-robot-pose'),'hero');addSprite($('#robot-body'),'guide');
 function choosePose(now){
  if(override&&now<overrideUntil)return override;
  if(now<entranceUntil)return 'drop';
  if(activeSection==='packages')return assistant.dataset.pointSide==='left'?'point-left':'point';
  if(activeSection==='method'||activeSection==='roadmap')return 'sit';
  if(activeSection==='promise'||activeSection==='faq')return 'lean';
  return 'wave';
 }
 function paint(item,pose,now){
  loadPose(pose);if(!loaded.has(pose)){pose=loaded.has('wave')?'wave':null;if(!pose)return;}
  const staticFrame=pose.startsWith('point')?2:0;
  if(item.pose!==pose){item.sprite.style.backgroundImage=`url("${pose}.webp")`;item.sprite.dataset.pose=pose;item.host.dataset.pose=pose;item.host.classList.add('has-sprite');item.pose=pose;item.frame=-1;item.started=now;}
  const seq=sequences[pose],frame=reduced.matches||robotMuted?staticFrame:seq[Math.floor((now-item.started)/(pose==='drop'?160:220))%seq.length];
  if(frame!==item.frame){item.sprite.style.backgroundPosition=`${frame%3*50}% ${Math.floor(frame/3)*100}%`;item.sprite.dataset.frame=String(frame);item.frame=frame;}
 }
 function tick(now){
  if(now-lastFrameAt>=70&&!document.hidden&&!menuOpen&&!modalOpen&&$('#chat').hidden){
   lastFrameAt=now;const visible=getComputedStyle(assistant).opacity>.15&&!assistant.hidden;
   if(visible&&lastSection!==activeSection){lastSection=activeSection;if(!reduced.matches&&!robotMuted){entranceUntil=now+1150;$('.robot-motion').classList.remove('is-descending');void $('.robot-motion').offsetWidth;$('.robot-motion').classList.add('is-descending');setTimeout(()=>$('.robot-motion').classList.remove('is-descending'),1150);}}
   const hero=$('#hero-robot-button').getBoundingClientRect();
   if(hero.bottom>0&&hero.top<innerHeight&&getComputedStyle($('.hero-logo-move')).visibility!=='hidden')paint(sprites[0],'wave',now);
   if(visible)paint(sprites[1],choosePose(now),now);
  }
  requestAnimationFrame(tick);
 }
 window.ShapeXRobotMotion={gesture(pose,duration=1300){if(pose==='wave'||pose==='enter'||pose==='celebrate'){override=pose==='enter'?'drop':'wave';overrideUntil=performance.now()+duration;}},labels};
 loadPose('wave');loadPose('drop');
 let requested=false;function preloadOthers(){if(requested)return;requested=true;['point','point-left','sit','lean'].forEach(loadPose)}
 window.addEventListener('scroll',preloadOthers,{passive:true,once:true});
 document.addEventListener('pointerdown',preloadOthers,{once:true});
 requestAnimationFrame(tick);
})();

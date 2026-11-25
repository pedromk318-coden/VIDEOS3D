import React, {useEffect, useMemo} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {EffectComposer} from "@react-three/postprocessing";
import {BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode} from "postprocessing";
import {bodyFront, Pen, type Outfit} from "../bridge/toon";
import {Actor, Pool} from "../bridge/cast";
import {InkPass, noInkFallback} from "../bridge/ink";
import {LensBlur, GrainEffect} from "../bridge/lensblur";
import {GradeEffect, GRADES, GRADE_STRENGTH, gradeFor} from "../bridge/grade";
import {LIGHTS} from "../bridge/lights";
import {CHAR, TONE, twoTone} from "../bridge/shade";
import {planksHD, stoneHD, beamHD, rep} from "../bridge/paint";

const clamp={extrapolateLeft:"clamp" as const,extrapolateRight:"clamp" as const};
const MAN:Outfit={jacket:"#b94f35",pants:"#35445e",boots:"#282536",hair:"#302326",skin:"#f3c9a5",build:"adult"};
const PLASTER=stoneHD("ratRoomPlaster",["#d9c7aa","#cdbb9f","#e2d2b8","#c5b294"],"#8e7d6a");
const WOOD=rep(planksHD(),1.4,1.4);
const BEAM=rep(beamHD(),1,1);
const FLOOR_MAT=twoTone(new THREE.MeshLambertMaterial({map:WOOD}),.85);
const WALL_MAT=twoTone(new THREE.MeshLambertMaterial({map:PLASTER}),.75);
const BEAM_MAT=twoTone(new THREE.MeshLambertMaterial({map:BEAM}),.8);
const makeBloom=()=>{
 const b=new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.5,luminanceThreshold:1,luminanceSmoothing:.2,mipmapBlur:true,levels:6,radius:.6});
 const mip=b.mipmapBlurPass,setSize=mip.setSize.bind(mip);
 mip.setSize=(w:number,h:number)=>setSize(Math.round(1920*w/Math.max(h,1)),1920);
 return b;
};
const drawRat=(p:Pen,frame:number)=>{
 const bob=Math.sin(frame/7)*5, chew=frame>40&&frame<130?Math.max(0,Math.sin(frame/3))*9:0;
 // long curved tail behind the body
 p.line([[235,390],[150,405+ bob],[95,445+bob],[48,420+bob]],"#a65f58",15);
 p.ell(48,420+bob,9,9,"#d98b83",2);
 // ears behind head
 p.ell(805,170+bob,82,105,"#a66e73",9,0,360,-18);
 p.ell(805,170+bob,48,70,"#e6a0a1",0,0,360,-18);
 p.ell(925,185+bob,72,92,"#a66e73",9,0,360,14);
 p.ell(925,185+bob,42,60,"#e6a0a1",0,0,360,14);
 // body and head
 p.ell(480,355+bob,300,155,"#777d89",13,0,360,-4);
 p.ell(750,280+bob,180,150,"#89909c",13,0,360,-7);
 p.ell(845,330+bob,115,70,"#b8a1a0",9,0,360,8);
 // feet
 p.line([[340,445+bob],[320,505+bob],[275,510+bob]],"#6e737f",24);
 p.line([[600,440+bob],[620,500+bob],[675,502+bob]],"#6e737f",24);
 // muzzle, nose, mouth
 p.ell(880,340+bob,35,24,"#d98b91",5);
 p.ell(895,333+bob,12,9,"#392733",0);
 p.arc(880,365+bob,24,16,20,155,7,"#392733");
 // eyes / brows / whiskers
 p.ell(775,250+bob,20,25,"#fff0dc",3);p.ell(782,253+bob,9,16,"#241726",0);
 p.ell(865,247+bob,20,25,"#fff0dc",3);p.ell(871,250+bob,9,16,"#241726",0);
 p.line([[858,345+bob],[1030,320+bob]],"#e4d9d0",5,false);
 p.line([[860,360+bob],[1040,370+bob]],"#e4d9d0",5,false);
 p.line([[850,373+bob],[1010,415+bob]],"#e4d9d0",5,false);
 // painted fur highlights and ink tufts
 p.arc(490,300+bob,190,82,205,330,7,"#aeb4bd");
 p.stroke([[640,215+bob],[675,190+bob],[710,205+bob]],8,"#241726");
 if(chew>0){p.ell(915,390+bob,18,12,"#e36c73",0);p.stroke([[900,402+bob],[920,410+bob]],5);}
};
const drawTail=(p:Pen,frame:number)=>{
 const grow=interpolate(frame,[190,225,270,299],[0,.28,1,1],clamp);
 if(grow<=0)return;
 const curl=interpolate(frame,[205,260,299],[0,1,1],clamp);
 const pts:[[number,number],[number,number],[number,number],[number,number],[number,number]]=[
  [100,360],[170,350-grow*55],[245,315-grow*110],[315,350-grow*170],[365,270-grow*220]
 ];
 p.line(pts,"#bd765c",20+grow*12);
 p.stroke(pts,5,"#6f3e37");
 p.ell(pts[4][0],pts[4][1],13+grow*3,13+grow*3,"#d99275",3);
 if(curl>.4)p.arc(335,260-grow*170,65,55,190,350,7,"#6f3e37");
};
const Room:React.FC<{frame:number}>=({frame})=>{
 const {scene,camera}=useThree();
 const root=useMemo(()=>new THREE.Group(),[]);
 const pool=useMemo(()=>new Pool(),[]);
 const man=useMemo(()=>new Actor(root),[root]);
 const rat=useMemo(()=>new Actor(root,new THREE.PlaneGeometry(1.75,.96)),[root]);
 const tail=useMemo(()=>new Actor(root,new THREE.PlaneGeometry(.9,.72)),[root]);
 const ink=useMemo(()=>new InkPass(scene,camera as THREE.PerspectiveCamera),[scene,camera]);
 const lens=useMemo(()=>new LensBlur({maxCoC:24,nearScale:1.2}),[]);
 const bloom=useMemo(()=>makeBloom(),[]);
 const tone=useMemo(()=>new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),[]);
 const grade=useMemo(()=>new GradeEffect(GRADES.golden,GRADE_STRENGTH.golden),[]);
 const grain=useMemo(()=>new GrainEffect({amount:.012,cellPx:1.5}),[]);
 const post=useMemo(()=><EffectComposer multisampling={4}>
  <primitive object={ink} dispose={null}/>
  <primitive object={lens.pre} dispose={null}/>
  <primitive object={lens.main} dispose={null}/>
  <primitive object={bloom} dispose={null}/>
  <primitive object={tone} dispose={null}/>
  <primitive object={grade} dispose={null}/>
  <primitive object={grain} dispose={null}/>
 </EffectComposer>,[ink,lens,bloom,tone,grade,grain]);
 useEffect(()=>()=>{ink.dispose();lens.dispose();bloom.dispose();tone.dispose();grade.dispose();grain.dispose();},[ink,lens,bloom,tone,grade,grain]);

 const eating=frame>=48&&frame<126, sick=frame>=126&&frame<205, transformed=frame>=205;
 const pose=frame<48?"march":frame<126?"stand":frame<205?"fall":"shock";
 const expr=transformed?"shock":sick?"pained":eating?"lick":"nervous";
 man.r=pool.req("rat-man-"+pose+"-"+expr+"-"+Math.round(frame/2),1800,3000,3,(p)=>{
  bodyFront(p,MAN,{phase:frame/18,mode:pose==="march"?"march":pose==="fall"?"fall":"stand",expr,seed:27,light:-Math.PI/2,tilt:sick?8:transformed?-7:0,headTilt:eating?-10:transformed?-8:0,prop:eating?"icecream":null});
  if(sick||transformed){
   const a=interpolate(frame,[126,155,205],[0,.85,.3],clamp);
   p.ell(205,390,48,65,"rgba(255,190,70,"+a+")",0);
   if(frame%10<5)p.stroke([[170,310],[145,270]],7,"#fff0a6");
  }
 });
 rat.r=pool.req("rat-creature-"+Math.round(frame/2),1200,650,2,(p)=>drawRat(p,frame));
 tail.r=pool.req("rat-tail-"+Math.round(frame/2),600,480,1,(p)=>drawTail(p,frame));
 pool.flush();man.bind();rat.bind();tail.bind();
 man.mesh.visible=true;man.mesh.position.set(-.82,0,.15);man.mesh.rotation.set(0,0,0);man.mesh.scale.set(1,1,1);
 rat.mesh.visible=frame<132;rat.mesh.position.set(1.03,.73,.2);rat.mesh.rotation.y=-.08;rat.mesh.scale.set(1,1,1);
 tail.mesh.visible=frame>=205;tail.mesh.position.set(-.05,.76,.55);tail.mesh.rotation.y=-.08;tail.mesh.scale.setScalar(interpolate(frame,[205,235,270],[.15,.55,1],clamp));

 const target=new THREE.Vector3(-.05,1.12,0);
 const push=interpolate(frame,[0,48,100,150,205,299],[0,.12,.25,.45,.28,.5],clamp);
 camera.position.set(.1+Math.sin(frame/35)*.035,2.15,7.1-push);
 camera.lookAt(target);camera.updateMatrixWorld();
 const light=LIGHTS.golden;
 TONE.uLitCol.value.set(...light.lit);TONE.uShadeCol.value.set(...light.shade);TONE.uShadeLift.value.set(...light.lift);
 TONE.uLambert.value=light.lambert;TONE.uSideK.value=light.sideK;TONE.uTerm.value=light.term;
 CHAR.uCharTint.value.set(...light.charTint);CHAR.uCharShade.value=light.charShade;CHAR.uGrad.value=light.charGrad;
 CHAR.uBodyGrad.value=light.bodyGrad;CHAR.uSideTint.value.set(...light.sideTint);
 const sun=new THREE.Vector3(-.55,.78,.42).normalize();
 const forward=new THREE.Vector3();camera.getWorldDirection(forward);
 lens.focus=Math.max(.3,target.clone().sub(camera.position).dot(forward));lens.cInf=frame<48?8:frame<205?13:10;
 gradeFor(grade,"golden");grain.seed=frame;
 noInkFallback(scene);
 return <>
  <color attach="background" args={["#b8a0a0"]}/>
  <fog attach="fog" args={["#c58f83",16,36]}/>
  <ambientLight intensity={.18} color="#9b86a8"/>
  <hemisphereLight args={["#ffd9b0","#4e3448",.5]}/>
  <directionalLight position={sun.clone().multiplyScalar(12).toArray()} intensity={LIGHTS.golden.sunI} color={LIGHTS.golden.sunCol} castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096}/>
  <directionalLight position={[4,4,3]} intensity={.3} color="#8a9fe0"/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.05,-1]} receiveShadow>
   <planeGeometry args={[22,22]}/>
   <primitive object={FLOOR_MAT} attach="material"/>
  </mesh>
  <mesh position={[0,3.25,-3.2]} receiveShadow>
   <boxGeometry args={[12,6.5,.32]}/>
   <primitive object={WALL_MAT} attach="material"/>
  </mesh>
  <mesh position={[-1.75,2.55,-2.99]}>
   <boxGeometry args={[2.65,2.1,.06]}/>
   <meshBasicMaterial color="#526d91"/>
  </mesh>
  <mesh position={[-1.75,2.55,-2.94]}>
   <boxGeometry args={[.13,2.25,.1]}/>
   <primitive object={BEAM_MAT} attach="material"/>
  </mesh>
  <mesh position={[-1.75,3.62,-2.94]}>
   <boxGeometry args={[2.75,.13,.1]}/>
   <meshLambertMaterial map={BEAM}/>
  </mesh>
  <mesh position={[1.55,.7,-.8]} castShadow receiveShadow>
   <boxGeometry args={[2.8,1.35,1.05]}/>
   <meshLambertMaterial map={BEAM}/>
  </mesh>
  <mesh position={[1.55,1.4,-.8]} castShadow receiveShadow>
   <boxGeometry args={[2.9,.12,1.12]}/>
   <meshLambertMaterial map={WOOD}/>
  </mesh>
  <mesh position={[-2.3,1.4,-1.8]} castShadow>
   <boxGeometry args={[.18,2.8,.18]}/>
   <meshLambertMaterial map={BEAM}/>
  </mesh>
  <mesh position={[0,2.6,-3.0]} castShadow>
   <boxGeometry args={[.12,5.2,.12]}/>
   <meshLambertMaterial map={BEAM}/>
  </mesh>
  <primitive object={root} dispose={null}/>
  {post}
 </>;
};
export const RatShort:React.FC=()=>{
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:"#b8a0a0"}}>
  <ThreeCanvas width={1080} height={1920} shadows gl={{antialias:false,stencil:false,powerPreference:"high-performance",toneMappingExposure:1}} camera={{position:[0,2.15,7.1],fov:40,near:.2,far:1500}}>
   <Room frame={frame}/>
  </ThreeCanvas>
  <Audio src={staticFile("audio/rat-sfx.wav")}/>
 </AbsoluteFill>;
};

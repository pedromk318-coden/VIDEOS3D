import React, {useEffect, useMemo} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {EffectComposer} from "@react-three/postprocessing";
import {BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode} from "postprocessing";
import {Pen, bodyFront, type Outfit} from "../bridge/toon";
import {cardShade} from "../bridge/cardshade";
import {CHAR, TONE, twoTone} from "../bridge/shade";
import {InkPass, NOINK, noInkFallback} from "../bridge/ink";
import {LensBlur} from "../bridge/lensblur";
import {GradeEffect, GRADES, GRADE_STRENGTH} from "../bridge/grade";
import {ctex} from "../bridge/paint";

const clamp={extrapolateLeft:"clamp" as const,extrapolateRight:"clamp" as const};
const MAN:Outfit={jacket:"#c85a38",pants:"#34445e",boots:"#282536",hair:"#302326",skin:"#ffe0bd",build:"adult"};
const BODY_GEO=(()=>{const g=new THREE.PlaneGeometry(600*.00216,1000*.00216);g.translate(0,(975-500)*.00216,0);return g;})();
const makeWood=()=>ctex("rat-room-wood-v2",512,512,(g,r)=>{
 g.fillStyle="#bd8150";g.fillRect(0,0,512,512);
 for(let y=0;y<16;y++){g.fillStyle=["#c98d58","#b87846","#d49b63","#bd804d"][y%4];g.fillRect(0,y*32,512,32);
  g.strokeStyle="rgba(75,42,25,.38)";g.lineWidth=2;for(let k=0;k<4;k++){const yy=y*32+5+r()*22;g.beginPath();g.moveTo(0,yy);g.bezierCurveTo(130,yy-4,340,yy+5,512,yy);g.stroke();}
  g.fillStyle="rgba(55,31,22,.55)";g.fillRect(0,y*32,512,2);
 }
});
const makeWall=()=>ctex("rat-room-wall-v2",512,512,(g,r)=>{
 g.fillStyle="#d8b99b";g.fillRect(0,0,512,512);
 for(let i=0;i<170;i++){g.fillStyle=i%2?"rgba(255,239,214,.13)":"rgba(99,66,54,.07)";g.beginPath();g.ellipse(r()*512,r()*512,8+r()*28,3+r()*10,r()*3,0,Math.PI*2);g.fill();}
 g.strokeStyle="rgba(88,56,48,.18)";g.lineWidth=2;for(let y=64;y<512;y+=64){g.beginPath();g.moveTo(0,y);g.lineTo(512,y);g.stroke();}
});
const wood=makeWood(), wall=makeWall();
const mat=(color:string)=>twoTone(new THREE.MeshLambertMaterial({color}));
const woodMat=twoTone(new THREE.MeshLambertMaterial({map:wood}));
const wallMat=twoTone(new THREE.MeshLambertMaterial({map:wall}));
function makeActor(){
 const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=2000;
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
 const material=cardShade(new THREE.MeshLambertMaterial({map:tex,transparent:true,alphaTest:.45,side:THREE.DoubleSide}));
 const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:tex,alphaTest:.45,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(BODY_GEO,material);mesh.customDepthMaterial=depth;mesh.layers.set(NOINK);mesh.castShadow=false;mesh.receiveShadow=true;
 return {canvas,tex,mesh,material,depth};
}
function drawActor(actor:ReturnType<typeof makeActor>,frame:number){
 const g=actor.canvas.getContext("2d")!;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,1200,2000);g.setTransform(2,0,0,2,0,0);
 const p=new Pen(g);
 const eating=frame<88, sick=frame>=88&&frame<178, shock=frame>=178;
 bodyFront(p,MAN,{phase:frame/8,mode:"stand",expr:shock?"shock":sick?"pained":eating?"lick":"nervous",seed:27,light:-2.1,tilt:shock?-4:sick?5:0,headTilt:shock?-7:0,prop:null});
 if(frame<105){
  const armY=interpolate(frame,[0,70,105],[490,430,510],clamp);
  p.line([[380,490],[405,armY],[448,armY-20]],"#ffe0bd",25);
  p.ell(458,armY-23,19,15,"#ffe0bd",3);
  p.ell(478,armY-27,24,17,"#a89a92",4);p.ell(488,armY-30,7,5,"#704a49",0);
 }
 if(sick||shock){
  const a=interpolate(frame,[88,115,178],[0,.9,.15],clamp);
  p.ell(300,650,62,78,"rgba(255,190,70,"+a+")",0);
  p.ell(300,650,40,54,"rgba(255,245,150,"+(a*.42)+")",0);
  if(frame%12<6){p.stroke([[205,340],[175,300]],7,"#fff1a6");p.stroke([[405,345],[438,302]],7,"#fff1a6");}
 }
 actor.tex.needsUpdate=true;
}
const Room:React.FC<{frame:number}> = ({frame})=>{
 const {scene,camera}=useThree();
 const actor=useMemo(()=>makeActor(),[]);
 const ink=useMemo(()=>new InkPass(scene,camera as THREE.PerspectiveCamera),[scene,camera]);
 const lens=useMemo(()=>new LensBlur({maxCoC:24,nearScale:1.2}),[]);
 const bloom=useMemo(()=>new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.55,luminanceThreshold:1,luminanceSmoothing:.2,mipmapBlur:true,levels:6,radius:.6}),[]);
 const tone=useMemo(()=>new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),[]);
 const grade=useMemo(()=>new GradeEffect(GRADES.day,GRADE_STRENGTH.day),[]);
 const post=useMemo(()=><EffectComposer multisampling={4}>
  <primitive object={ink} dispose={null}/><primitive object={lens.pre} dispose={null}/><primitive object={lens.main} dispose={null}/>
  <primitive object={bloom} dispose={null}/><primitive object={tone} dispose={null}/><primitive object={grade} dispose={null}/>
 </EffectComposer>,[ink,lens,bloom,tone,grade]);
 useEffect(()=>()=>{ink.dispose();lens.dispose();bloom.dispose();tone.dispose();grade.dispose();actor.tex.dispose();actor.material.dispose();actor.depth.dispose();actor.mesh.geometry.dispose();},[ink,lens,bloom,tone,grade,actor]);
 useEffect(()=>{drawActor(actor,frame);},[actor,frame]);
 useEffect(()=>{
  CHAR.uCharTint.value.set(1,.94,.92);CHAR.uCharShade.value=.86;CHAR.uGrad.value=.07;CHAR.uBodyGrad.value=.2;CHAR.uSideTint.value.set(.92,.9,.96);
  TONE.uLitCol.value.set(1.5,1.44,1.32);TONE.uShadeCol.value.set(.3,.29,.36);TONE.uShadeLift.value.set(.05,.06,.11);
  TONE.uLambert.value=.35;TONE.uSideK.value=.84;TONE.uTerm.value=.2;TONE.uBounce.value.set(0,0,0);TONE.uSat.value=1.08;
 },[]);
 const tail=interpolate(frame,[178,210,260,299],[0,.65,1,1],clamp);
 const tailCurve=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.35,.12,0),new THREE.Vector3(.7,.38,.02),new THREE.Vector3(1.05,.15,.04),new THREE.Vector3(1.28,.72,.06)]),[]);
 const tailGeo=useMemo(()=>new THREE.TubeGeometry(tailCurve,40,.065,10,false),[tailCurve]);
 const focus= new THREE.Vector3(0,1.4,0).applyMatrix4((camera as THREE.PerspectiveCamera).matrixWorld);
 (camera as THREE.PerspectiveCamera).getWorldDirection(new THREE.Vector3());
 lens.focus=7.5;lens.cInf=frame>80&&frame<180?1.7:2.2;
 const shake=frame>=178?Math.sin(frame*2.4)*.018:0;
 camera.position.x=shake;
 camera.position.y=2.05+Math.sin(frame*.018)*.018;
 camera.lookAt(0,1.35,0);
 actor.mesh.position.set(-.75,0,.15);actor.mesh.rotation.y=-.06;
 noInkFallback(scene);
 return <>
  <color attach="background" args={["#5b83ad"]}/>
  <fog attach="fog" args={["#b8d0ec",12,34]}/>
  <ambientLight intensity={.48} color="#8ca8df"/>
  <hemisphereLight args={["#9ec8ff","#74536b",.65]}/>
  <directionalLight position={[-4,7,5]} intensity={3.1} color="#ffd2a0" castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096}/>
  <directionalLight position={[4,3,1]} intensity={.48} color="#788dff"/>
  <pointLight position={[2.5,2.4,1.3]} intensity={1.1} color="#e18a64"/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.03,0]} receiveShadow><planeGeometry args={[18,18]}/><primitive object={woodMat} attach="material"/></mesh>
  <mesh position={[0,3,-3.1]}><boxGeometry args={[12,6,.35]}/><primitive object={wallMat} attach="material"/></mesh>
  <mesh position={[0,2.95,-2.88]}><boxGeometry args={[3.3,2.35,.08]}/><meshBasicMaterial color="#4d8eb9"/></mesh>
  <mesh position={[-1.65,2.95,-2.78]}><boxGeometry args={[.12,2.5,.16]}/><meshLambertMaterial color="#f3dfc4"/></mesh>
  <mesh position={[0,4.15,-2.78]}><boxGeometry args={[3.4,.12,.16]}/><meshLambertMaterial color="#f3dfc4"/></mesh>
  <mesh position={[0,1.72,-2.78]}><boxGeometry args={[3.4,.12,.16]}/><meshLambertMaterial color="#f3dfc4"/></mesh>
  <mesh position={[1.55,.7,-1.1]}><boxGeometry args={[2.4,1.4,.7]}/><primitive object={woodMat} attach="material"/></mesh>
  <mesh position={[1.55,1.42,-1.1]}><boxGeometry args={[2.5,.13,.8]}/><meshLambertMaterial color="#e7bf8b"/></mesh>
  <mesh position={[-2.9,1.5,-1.9]}><boxGeometry args={[.16,3,.16]}/><meshLambertMaterial color="#754638"/></mesh>
  <mesh position={[-.75,1.1,.1]}><sphereGeometry args={[.48,24,18]}/><meshLambertMaterial color="#c85a38" transparent opacity={0}/></mesh>
  <primitive object={actor.mesh}/>
  <group position={[.55,.32,.45]} rotation={[0,0,tail*.3]} visible={tail>0}>
   <mesh geometry={tailGeo} scale={[tail,tail,tail]} castShadow><meshLambertMaterial color="#9b644b"/></mesh>
  </group>
  <group position={[1.55,.55,.15]} rotation={[0,Math.PI/2,0]}>
   <mesh position={[0,.05,0]} scale={[.7,.4,.45]} castShadow><sphereGeometry args={[1,32,24]}/><meshLambertMaterial color="#9299a5"/></mesh>
   <mesh position={[-.42,.34,.02]} scale={[.3,.28,.26]} castShadow><sphereGeometry args={[1,24,18]}/><meshLambertMaterial color="#aeb2bd"/></mesh>
   <mesh position={[-.53,.57,.02]} scale={[.16,.18,.1]}><sphereGeometry args={[1,20,16]}/><meshLambertMaterial color="#d68a9a"/></mesh>
   <mesh position={[-.29,.42,.25]}><sphereGeometry args={[.035,12,12]}/><meshBasicMaterial color="#14131a"/></mesh>
   <mesh position={[-.64,.35,.2]}><sphereGeometry args={[.035,10,8]}/><meshBasicMaterial color="#28212a"/></mesh>
   <mesh position={[-.68,.32,.22]}><sphereGeometry args={[.025,8,8]}/><meshBasicMaterial color="#28212a"/></mesh>
   <mesh position={[-.72,.29,.24]}><sphereGeometry args={[.018,8,8]}/><meshBasicMaterial color="#28212a"/></mesh>
   <mesh position={[.55,.24,0]} rotation={[0,0,-.2]}><tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.34,.12,0),new THREE.Vector3(.62,-.1,0)]),24,.035,8,false]}/><meshLambertMaterial color="#c47b82"/></mesh>
  </group>
  {post}
 </>;
};
export const RatShort:React.FC=()=>{
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:"#5b83ad"}}>
  <ThreeCanvas width={1080} height={1920} shadows gl={{antialias:false,stencil:false,powerPreference:"high-performance",toneMappingExposure:1}} camera={{position:[0,2.05,8.4],fov:38,near:.2,far:150}}>
   <Room frame={frame}/>
  </ThreeCanvas>
  <Audio src={staticFile("audio/rat-sfx.wav")}/>
 </AbsoluteFill>;
};

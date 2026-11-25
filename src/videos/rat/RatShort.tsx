import React, {useEffect, useMemo} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {EffectComposer} from "@react-three/postprocessing";
import {BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode} from "postprocessing";
import {bodyFront, fxBurst, fxPuff, Pen, type Outfit} from "../bridge/toon";
import {Actor, Pool} from "../bridge/cast";
import {InkPass, noInkFallback} from "../bridge/ink";
import {LensBlur} from "../bridge/lensblur";
import {GradeEffect, GRADES, GRADE_STRENGTH} from "../bridge/grade";
import {LIGHTS} from "../bridge/lights";

const clamp={extrapolateLeft:"clamp" as const,extrapolateRight:"clamp" as const};
const MAN:Outfit={jacket:"#b94f35",pants:"#35445e",boots:"#282536",hair:"#302326",skin:"#f3c9a5",build:"adult"};
const FLOOR=new THREE.MeshStandardMaterial({color:"#987052",roughness:.88});
const WALL=new THREE.MeshStandardMaterial({color:"#b99c83",roughness:.95});
const WOOD=new THREE.MeshStandardMaterial({color:"#754a35",roughness:.72});
const METAL=new THREE.MeshStandardMaterial({color:"#393744",roughness:.48});
const RAT=new THREE.MeshStandardMaterial({color:"#858b98",roughness:.8});
const PINK=new THREE.MeshStandardMaterial({color:"#d58b9a",roughness:.75});
const makeRat=()=>{
 const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.SphereGeometry(.32,32,24),RAT);body.scale.set(1.35,.72,.8);body.position.y=.34;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.2,28,20),RAT);head.position.set(.34,.52,0);g.add(head);
 for(const z of [-.14,.14]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.105,20,16),PINK);ear.scale.set(.55,1,.35);ear.position.set(.27,.69,z);g.add(ear);}
 const eyeMat=new THREE.MeshBasicMaterial({color:"#17131b"});
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,12,10),eyeMat);eye.position.set(.49,.56,.16);g.add(eye);
 const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.38,.34,0),new THREE.Vector3(-.68,.28,0),new THREE.Vector3(-.9,.38,.02),new THREE.Vector3(-1.08,.28,.03)]);
 const tail=new THREE.Mesh(new THREE.TubeGeometry(tailCurve,32,.018,8,false),PINK);g.add(tail);
 return g;
};
const ctex=(name:string,draw:(g:CanvasRenderingContext2D)=>void)=>{
 const c=document.createElement("canvas");c.width=c.height=1024;const g=c.getContext("2d")!;draw(g);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;
};
const floorTex=ctex("floor",(g)=>{g.fillStyle="#a87952";g.fillRect(0,0,1024,1024);for(let y=0;y<32;y++){g.fillStyle=y%2?"#b8865d":"#986a49";g.fillRect(0,y*32,1024,30);g.strokeStyle="rgba(49,29,23,.35)";g.lineWidth=2;for(let x=0;x<1024;x+=140){g.beginPath();g.moveTo(x,y*32);g.lineTo(x+80,y*32+30);g.stroke();}}});
FLOOR.map=floorTex;FLOOR.needsUpdate=true;
const wallTex=ctex("wall",(g)=>{g.fillStyle="#c9ad91";g.fillRect(0,0,1024,1024);for(let y=0;y<1024;y+=128){g.strokeStyle="rgba(83,56,47,.18)";g.lineWidth=3;g.beginPath();g.moveTo(0,y);g.lineTo(1024,y);g.stroke();}for(let i=0;i<500;i++){g.fillStyle=i%2?"rgba(255,239,215,.12)":"rgba(82,57,49,.07)";g.beginPath();g.ellipse(Math.random()*1024,Math.random()*1024,2+Math.random()*10,2+Math.random()*6,0,0,Math.PI*2);g.fill();}});
WALL.map=wallTex;WALL.needsUpdate=true;

const Room:React.FC<{frame:number}>=({frame})=>{
 const {scene,camera}=useThree();
 const root=useMemo(()=>new THREE.Group(),[]);
 const pool=useMemo(()=>new Pool(),[]);
 const man=useMemo(()=>new Actor(root),[root]);
 const rat=useMemo(()=>makeRat(),[]);
 const ink=useMemo(()=>new InkPass(scene,camera as THREE.PerspectiveCamera),[scene,camera]);
 const lens=useMemo(()=>new LensBlur({maxCoC:24,nearScale:1.2}),[]);
 const bloom=useMemo(()=>new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.5,luminanceThreshold:1,luminanceSmoothing:.2,mipmapBlur:true,levels:6,radius:.6}),[]);
 const tone=useMemo(()=>new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),[]);
 const grade=useMemo(()=>new GradeEffect(GRADES.golden,GRADE_STRENGTH.golden),[]);
 const post=useMemo(()=><EffectComposer multisampling={4}><primitive object={ink} dispose={null}/><primitive object={lens.pre} dispose={null}/><primitive object={lens.main} dispose={null}/><primitive object={bloom} dispose={null}/><primitive object={tone} dispose={null}/><primitive object={grade} dispose={null}/></EffectComposer>,[ink,lens,bloom,tone,grade]);
 useEffect(()=>()=>{ink.dispose();lens.dispose();bloom.dispose();tone.dispose();grade.dispose();},[ink,lens,bloom,tone,grade]);
 const eating=frame>=45&&frame<122, sick=frame>=122&&frame<205, transformed=frame>=205;
 const reach=interpolate(frame,[0,25,45,100,122],[0,0.15,1,1,0],clamp);
 const pose=frame<45?"march":frame<122?"stand":frame<205?"fall":"shock";
 const expr=transformed?"shock":sick?"pained":eating?"lick":"nervous";
 man.r=pool.req("rat-man-"+pose+"-"+expr+"-"+Math.round(frame/2),1800,3000,3,(p)=>{
  bodyFront(p,MAN,{phase:frame/18,mode:pose==="march"?"march":pose==="fall"?"fall":"stand",expr,seed:27,light:-Math.PI/2,tilt:sick?8:transformed?-7:0,headTilt:eating?-10:transformed?-8:0,prop:null});
  if(eating){const y=interpolate(frame,[45,72,100,122],[515,455,455,510],clamp);p.stroke([[390,480],[420,y],[460,y-15]],30,"#b94f35");p.ell(466,y-18,18,16,"#f3c9a5",4);}
  if(sick||transformed){const a=interpolate(frame,[122,150,205],[0,.9,.25],clamp);p.ell(205,390,48,65,"rgba(255,190,70,"+a+")",0);if(frame%10<5)p.stroke([[170,310],[145,270]],7,"#fff0a6");}
 });
 pool.flush();man.bind();man.mesh.visible=true;man.mesh.position.set(-.78,0,.25);man.mesh.rotation.set(0,0,0);man.mesh.scale.set(1,1,1);
 const tailGrow=interpolate(frame,[205,235,270,299],[0,.35,1,1],clamp);
 camera.position.set(.05,2.05,7.7);camera.lookAt(0,1.18,0);camera.updateMatrixWorld();
 const shake=frame>205?Math.sin(frame*2.1)*.025:0;camera.position.x=shake;
 rat.position.set(1.1,0,.2);rat.rotation.y=-.35+Math.sin(frame/9)*.08;rat.scale.setScalar(1);
 const newTail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.2,.08,0),new THREE.Vector3(.42,.25,.02),new THREE.Vector3(.65,.18,.04),new THREE.Vector3(.82,.55,.05)]),36,.055,10,false),new THREE.MeshStandardMaterial({color:"#9b644b",roughness:.8}));
 newTail.scale.setScalar(tailGrow);newTail.position.set(-.2,.9,.5);
 noInkFallback(scene);
 return <>
  <color attach="background" args={["#8da4bd"]}/><fog attach="fog" args={["#c3c9d3",10,26]}/>
  <ambientLight intensity={.38} color="#a7b9df"/>
  <hemisphereLight args={["#c4dcff","#60465b",.75]}/>
  <directionalLight position={[-4,7,5]} intensity={3.2} color="#ffd0a0" castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096}/>
  <directionalLight position={[4,3,1]} intensity={.5} color="#8296ff"/>
  <pointLight position={[2.2,2.4,1.2]} intensity={1.1} color="#f2a078"/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.04,0]} receiveShadow><planeGeometry args={[18,18]}/><primitive object={FLOOR} attach="material"/></mesh>
  <mesh position={[0,3,-3.2]}><boxGeometry args={[12,6,.35]}/><primitive object={WALL} attach="material"/></mesh>
  <mesh position={[-1.25,2.85,-2.95]}><boxGeometry args={[2.6,2.2,.12]}/><meshBasicMaterial color="#426f9a"/></mesh>
  <mesh position={[-1.25,2.85,-2.86]}><boxGeometry args={[.12,2.3,.15]}/><meshStandardMaterial color="#f2d9b7"/></mesh>
  <mesh position={[-1.25,3.98,-2.86]}><boxGeometry args={[2.7,.12,.15]}/><meshStandardMaterial color="#f2d9b7"/></mesh>
  <mesh position={[1.65,.65,-1.1]} castShadow receiveShadow><boxGeometry args={[2.4,1.3,.8]}/><primitive object={WOOD} attach="material"/></mesh>
  <mesh position={[1.65,1.32,-1.1]} castShadow><boxGeometry args={[2.5,.12,.9]}/><meshStandardMaterial color="#b8865d"/></mesh>
  <primitive object={root}/><primitive object={rat}/><primitive object={newTail}/>
  {post}
 </>;
};
export const RatShort:React.FC=()=>{
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:"#8da4bd"}}><ThreeCanvas width={1080} height={1920} shadows gl={{antialias:false,stencil:false,powerPreference:"high-performance",toneMappingExposure:1}} camera={{position:[0,2.05,7.7],fov:40,near:.2,far:150}}><Room frame={frame}/></ThreeCanvas><Audio src={staticFile("audio/rat-sfx.wav")}/></AbsoluteFill>;
};

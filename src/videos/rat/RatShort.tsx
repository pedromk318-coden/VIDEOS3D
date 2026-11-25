import React, {useMemo} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {Pen, bodyFront, fxBurst, fxStars, type Outfit} from "../bridge/toon";

const clamp={extrapolateLeft:"clamp" as const,extrapolateRight:"clamp" as const};
const MAN: Outfit={jacket:"#d65b35",pants:"#34445e",boots:"#252333",hair:"#3a2928",skin:"#ffe2c2",build:"adult"};

function actorTexture(frame:number) {
 const c=document.createElement("canvas"); c.width=600; c.height=1000;
 const g=c.getContext("2d")!; const p=new Pen(g);
 const eating=frame<112, shocked=frame>128, tail=frame>185;
 bodyFront(p,MAN,{phase:frame/10,mode:"stand",expr:shocked?"shock":eating?"lick":"dazed",seed:27,light:-2.1,tilt:shocked?-3:0,headTilt:shocked?-5:0,prop:null});
 if(eating){p.ell(410,455,34,22,"#c7a9a0",5);p.ell(423,450,8,8,"#8f4d48",0);}
 if(tail){const t=Math.min(1,(frame-185)/42);p.line([[310,920],[350+55*t,875],[395+75*t,915],[430+95*t,850]],"#a76d50",22);}
 if(shocked){p.stroke([[190,300],[160,255]],8,"#fff3b0");p.stroke([[410,290],[445,245]],8,"#fff3b0");}
 const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.needsUpdate=true; return tex;
}
const Actor:React.FC<{frame:number}> = ({frame})=>{
 const texture=useMemo(()=>actorTexture(frame),[frame]);
 return <sprite position={[-0.65,2.35,0.25]} scale={[2.9,4.85,1]}><spriteMaterial map={texture} transparent depthWrite={false}/></sprite>;
};
const Room:React.FC<{frame:number}> = ({frame})=>{
 const pulse=interpolate(frame,[175,205,260],[0,1,0.15],clamp);
 return <>
  <color attach="background" args={["#39749a"]}/>
  <fog attach="fog" args={["#39749a",10,24]}/>
  <ambientLight intensity={0.75} color="#b9c9ff"/>
  <directionalLight position={[-4,7,5]} intensity={3.2} color="#ffd09a" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
  <pointLight position={[3,3,1]} intensity={1.8} color="#68b9ff"/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[18,18]}/><meshStandardMaterial color="#bd8059" roughness={0.92}/></mesh>
  <mesh position={[0,3,-3]}><boxGeometry args={[12,6,0.35]}/><meshStandardMaterial color="#e5b78e" roughness={1}/></mesh>
  <mesh position={[0,3,-2.78]}><boxGeometry args={[4.6,2.5,0.05]}/><meshStandardMaterial color="#5b9ebc" emissive="#173d58" emissiveIntensity={0.3}/></mesh>
  <mesh position={[0,3.02,-2.7]}><boxGeometry args={[0.13,2.5,0.08]}/><meshStandardMaterial color="#f8e5c9"/></mesh>
  <mesh position={[0,3.02,-2.68]}><boxGeometry args={[4.6,0.13,0.08]}/><meshStandardMaterial color="#f8e5c9"/></mesh>
  <mesh position={[0,1.15,-2.7]}><boxGeometry args={[12,0.12,0.3]}/><meshStandardMaterial color="#754a3b"/></mesh>
  <Actor frame={frame}/>
  <group position={[1.55,0.72,0.1]} rotation={[0,0,Math.sin(frame*.15)*.035]}>
   <mesh position={[0,.28,0]} scale={[.68,.42,.4]} castShadow><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color="#8c929b" roughness={.88}/></mesh>
   <mesh position={[-.42,.55,.03]} scale={[.28,.3,.25]} castShadow><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#aeb2ba"/></mesh>
   <mesh position={[-.52,.8,.03]} scale={[.15,.18,.09]} castShadow><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#d98b9c"/></mesh>
   <mesh position={[-.28,.62,.24]}><sphereGeometry args={[.045,12,12]}/><meshStandardMaterial color="#17151b"/></mesh>
   <mesh position={[.55,.28,.02]} rotation={[0,0,-.25]}><tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.35,.12,0),new THREE.Vector3(.62,-.1,0)]),24,.035,8,false]}/><meshStandardMaterial color="#c47b82"/></mesh>
  </group>
  {pulse>0.02&&<pointLight position={[-.6,2.6,.5]} color="#ffe36e" intensity={pulse*4} distance={5}/>}
 </>;
};
export const RatShort:React.FC=()=>{
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:"#39749a"}}>
  <ThreeCanvas width={1080} height={1920} shadows gl={{antialias:true,alpha:false}} camera={{position:[0,2.8,9],fov:38,near:.1,far:100}}>
   <Room frame={frame}/>
  </ThreeCanvas>
  <Audio src={staticFile("audio/rat-sfx.wav")}/>
 </AbsoluteFill>;
};

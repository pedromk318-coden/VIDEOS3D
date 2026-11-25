import React from "react";
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from "remotion";

const clamp = {extrapolateLeft:"clamp" as const, extrapolateRight:"clamp" as const};

const Man: React.FC<{frame:number}> = ({frame}) => {
  const bite = interpolate(frame,[35,48,58,70],[0,1,1,0],clamp);
  const shock = interpolate(frame,[125,145,175],[0,1,1],clamp);
  const tail = interpolate(frame,[165,205,299],[0,1,1],clamp);
  const tremble = frame>205 ? Math.sin(frame*1.7)*3 : 0;
  return <g transform={`translate(${tremble} 0)`}>
    <ellipse cx="540" cy="1555" rx="250" ry="45" fill="#17212b" opacity=".18"/>
    <path d="M370 1130 Q330 1250 360 1490 L725 1490 Q750 1280 690 1130Z" fill="#c95e3d" stroke="#572d2a" strokeWidth="18"/>
    <path d="M405 1190 Q310 1260 290 1435" fill="none" stroke="#e0a17c" strokeWidth="75" strokeLinecap="round"/>
    <path d="M660 1190 Q770 1270 770 1415" fill="none" stroke="#e0a17c" strokeWidth="75" strokeLinecap="round"/>
    <path d="M430 1475 Q395 1570 390 1630" fill="none" stroke="#343c50" strokeWidth="95" strokeLinecap="round"/>
    <path d="M650 1475 Q690 1570 710 1630" fill="none" stroke="#343c50" strokeWidth="95" strokeLinecap="round"/>
    <path d="M375 1635 Q330 1670 410 1685 L475 1680" fill="none" stroke="#242b39" strokeWidth="48" strokeLinecap="round"/>
    <path d="M690 1635 Q660 1670 740 1685 L800 1680" fill="none" stroke="#242b39" strokeWidth="48" strokeLinecap="round"/>
    <g transform="translate(0 -25)">
      <path d="M385 810 Q360 560 520 520 Q710 500 720 760 L690 1110 Q545 1180 395 1080Z" fill="#e8b18d" stroke="#572d2a" strokeWidth="18"/>
      <path d="M390 700 Q360 480 555 475 Q725 485 730 680 Q650 610 575 625 Q485 650 390 700Z" fill="#392d2c" stroke="#241f24" strokeWidth="18"/>
      <path d="M420 835 Q465 795 505 835" fill="none" stroke="#543b35" strokeWidth="16" strokeLinecap="round"/>
      <path d="M590 835 Q640 795 675 835" fill="none" stroke="#543b35" strokeWidth="16" strokeLinecap="round"/>
      <ellipse cx="468" cy="875" rx="19" ry={shock?24:14} fill="#202632"/>
      <ellipse cx="625" cy="875" rx="19" ry={shock?24:14} fill="#202632"/>
      <path d={shock?"M510 960 Q550 900 595 960 Q560 1040 510 960Z":"M510 970 Q550 995 595 970"} fill="#713b43" stroke="#572d2a" strokeWidth="13"/>
      <path d="M500 1080 Q545 1125 600 1080" fill="none" stroke="#a85d58" strokeWidth="12" strokeLinecap="round"/>
    </g>
    <g transform={`translate(0 ${-bite*40}) rotate(${bite*-18} 760 1000)`}>
      <path d="M700 1030 Q770 1000 825 930" fill="none" stroke="#e0a17c" strokeWidth="62" strokeLinecap="round"/>
      <path d="M820 930 Q870 890 900 920" fill="none" stroke="#e0a17c" strokeWidth="48" strokeLinecap="round"/>
    </g>
    <g opacity={tail}>
      <path d={`M540 1465 C${540+tail*180} 1390 ${540+tail*250} 1480 ${540+tail*285} 1380`} fill="none" stroke="#8f5a43" strokeWidth="34" strokeLinecap="round"/>
      <path d={`M${540+tail*275} 1388 q28 -30 42 -5 q-7 36 -42 5`} fill="#a86c50" stroke="#613d32" strokeWidth="9"/>
    </g>
  </g>;
};

const Rat: React.FC<{frame:number}> = ({frame}) => {
 const chew=frame<85?Math.sin(frame*.6)*5:0;
 return <g transform={`translate(0 ${chew})`}>
   <ellipse cx="805" cy="1040" rx="100" ry="58" fill="#8e929b" stroke="#353b48" strokeWidth="13"/>
   <circle cx="735" cy="1000" r="48" fill="#aeb1b9" stroke="#353b48" strokeWidth="12"/>
   <circle cx="720" cy="965" r="27" fill="#d58d9b" stroke="#353b48" strokeWidth="9"/>
   <circle cx="750" cy="992" r="9" fill="#1d2430"/>
   <path d="M895 1045 Q980 1050 1000 1120" fill="none" stroke="#bd8588" strokeWidth="13" strokeLinecap="round"/>
   <path d="M700 1040 Q670 1085 720 1095" fill="none" stroke="#353b48" strokeWidth="11" strokeLinecap="round"/>
 </g>;
};

export const RatShort: React.FC = () => {
 const f=useCurrentFrame();
 const title=interpolate(f,[0,18,45],[0,1,0],clamp);
 const glow=interpolate(f,[170,210,299],[0,1,.15],clamp);
 const bg=f<170?"#f1d7b7":"#b8c9d1";
 return <AbsoluteFill style={{background:bg,overflow:"hidden"}}>
   <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position:"absolute"}}>
     <defs><linearGradient id="wall" x2="0" y2="1"><stop stopColor={bg}/><stop offset="1" stopColor="#e6bfa0"/></linearGradient></defs>
     <rect width="1080" height="1920" fill="url(#wall)"/>
     <path d="M0 1450 Q260 1390 540 1450 T1080 1440 V1920 H0Z" fill="#b47a5b"/>
     <path d="M0 1450 H1080" stroke="#704c42" strokeWidth="18"/>
     <rect x="90" y="250" width="900" height="460" rx="35" fill="#f7e8d5" stroke="#72564b" strokeWidth="22"/>
     <rect x="145" y="305" width="790" height="350" rx="15" fill="#b8d8dc"/>
     <path d="M540 305 V655 M145 480 H935" stroke="#f8f0e7" strokeWidth="22"/>
     <g transform={`translate(0 ${interpolate(f,[0,100],[80,0],clamp)})`}>
       <Man frame={f}/>
       {f<125 && <Rat frame={f}/>}
     </g>
     {glow>0 && <circle cx="540" cy="1000" r={180+glow*100} fill="#e8d76a" opacity={glow*.24}/>}
     {f>175 && <g opacity={interpolate(f,[175,195],[0,1],clamp)}>
       <path d="M250 520 l-45 -55 M830 520 l45 -55 M540 390 v-70" stroke="#fff7d4" strokeWidth="18" strokeLinecap="round"/>
       <text x="540" y="300" textAnchor="middle" fontSize="64" fontWeight="900" fill="#713c42" stroke="#fff3df" strokeWidth="5" paintOrder="stroke">QUE ISSO?!</text>
     </g>}
     <g opacity={title} transform="translate(0 180)">
       <rect x="120" y="80" width="840" height="140" rx="40" fill="#352c35" opacity=".9"/>
       <text x="540" y="173" textAnchor="middle" fontSize="68" fontWeight="900" fill="#fff3df">O RATO MISTERIOSO</text>
     </g>
   </svg>
   <Audio src={staticFile("audio/rat-sfx.wav")}/>
 </AbsoluteFill>;
};

import math, random, wave, struct
from pathlib import Path
sr=48000
duration=10
n=sr*duration
buf=[0.0]*n
def add_tone(start,dur,freq,amp,slide=0,noise=0):
    a=int(start*sr); count=int(dur*sr)
    for i in range(count):
        t=i/sr
        env=min(1,i/(sr*.012))*max(0,1-i/count)
        hz=freq+slide*t
        v=math.sin(2*math.pi*hz*t)
        if noise: v=(1-noise)*v+noise*random.uniform(-1,1)
        if a+i<n: buf[a+i]+=amp*env*v
# crunchy bite, comic stomach rumble, magical mutation pop, tail whip, startled squeak
add_tone(1.35,.28,170,.24,slide=-90,noise=.45)
add_tone(3.8,1.1,58,.20,slide=38,noise=.35)
add_tone(5.85,.42,420,.22,slide=850,noise=.2)
add_tone(7.65,.25,260,.20,slide=-180,noise=.4)
add_tone(8.55,.65,620,.18,slide=480,noise=.25)
out=Path("public/audio/rat-sfx.wav")
out.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(out),"wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
    for x in buf:
        v=max(-1,min(1,x*.8))
        sample=struct.pack("<hh",int(v*32767),int(v*32767))
        w.writeframesraw(sample)

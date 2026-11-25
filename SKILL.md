---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D town/world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + march-style music), rendered with three.js inside Remotion. Use when the user asks for another video in this cartoon 3D style, or a history/science story short with cartoon characters in 3D.
---

# Cartoon 3D story short (three.js + Remotion)

Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- Code: `src/videos/bridge/` of your Remotion project (composition `BridgeShort`, 1080x1920, 30 fps).
- Script, voice and sound: `~/bridge-short/`.
- Style research: private reference material. Never upload, publish or send those reference videos, frames, or sheets.
- Never copy reference scripts, characters or shots. Story, characters and voice must be original.

## User rules

- No captions or labels in the video.
- English only.
- Voice: one steady tone.
- Jokes are researched real facts.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- Final export 2K vertical: 1440x2560, `--scale 1.3333`.
- Verify every check and save after every step.

## Pipeline

1. **Topic and facts.** Pick one surprising true story with a physical cause and effect that is visually understandable, plus a simple everyday analogy. Put sources at the top of `SCRIPT.md`.
2. **Script.** Target ~3.7 words/s and 55–70 s. Use hook, setting, escalating action, snap, deadpan double line, explanation, consequence and callback twist. Never describe on screen what the viewer already sees.
3. **Voice.** Record or generate `voice.wav`, create word timings in `words.json`, then hand-fix the timings. Everything is timed to this file.
4. **Shot plan.** In `story.ts`, define shots, crossfades, flash, camera keys, impact shakes, depth of field and foreground props. Land visual reactions 0–3 frames before the corresponding word.
5. **World.** Build the town, props, painted textures, lighting, sky, fog and river. Cull objects that block camera sight lines.
6. **Characters.** Draw camera-facing character cards with expressive faces, blinks and walk cycles. Keep character cards on a no-world-ink layer and give them their own outlines and contact shadows.
7. **Post.** Use the order ink → lens pre → lens main → bloom → NEUTRAL tone map → grade. Use MSAA 4. Scale pixel-sized parameters with output height.
8. **Sound.** Create original synthesized SFX and score, duck music under voice, and export a 48 kHz mix plus stems and cue notes. Lock picture timing before sound; timing changes require a new mix.
9. **Look checks.** Render representative stills, compare them against your own approved style targets, and run frame-by-frame QA. Do not use or redistribute private reference frames.
10. **Final render.** Render H.264 at CRF 16 and scale 1.3333. Mux the intended audio stream explicitly. Check for black, white, frozen and pop frames, plus loudness.
11. **Deliver.** Provide the final MP4 and a concise QA report.

## Visual direction

### Lighting
- Day: blue sky transitioning to a brighter horizon, cool-tinted shadows, natural fog matching the horizon.
- Golden hour: low backlight, peach horizon, violet-blue shadows, restrained bloom and contact shadows.
- Avoid lemon-yellow highlights and lavender lit faces.

### Materials and colour
- Use muted brick, cream, ochre and terracotta architecture.
- Use warm grey/beige stone and desaturated dark iron.
- Keep seams readable as dark painted tints.
- Avoid crushed blacks; preserve detail in shadows.

### Ink and depth
- World outlines should be near-black, consistent and limited to silhouettes, depth discontinuities and meaningful creases.
- Character outlines are dark plum and should not be replaced by the world ink pass.
- Use depth of field for close-ups and medium shots; keep establishing wides sharp.
- Bloom only on bright emissive elements.

### Characters
- Adults are about 3.5 head-heights tall.
- Use bean-shaped heads, narrow stick limbs and expressive faces.
- Avoid blush and eye highlights.
- Use planted feet, subtle walk bob, slight body lean and natural blinking.
- Add tight contact shadows beneath feet.

### Camera
- Hard cuts for large location/time jumps.
- Use smooth glides for continuous movement.
- Every hold should include a subtle push-in to avoid looking frozen.
- Use short decaying impact shakes for major events.
- Add foreground framing props sparingly and keep them recognizable.

## Important production cautions

- Keep Remotion temporary bundles on a drive with sufficient free space; bundles can consume substantial disk space.
- Remotion may write a silent audio track; when muxing, map the intended video and audio streams explicitly.
- Scratch TypeScript files inside output folders can break project type-checking.
- Do not delete shared temporary render folders while another render is active.
- Re-check foreground props whenever camera positions change.
- Avoid visual elements that can be misread because of silhouette or framing.
- Film grain can dramatically increase output size; leave it off unless deliberately required.

// RatShort render target: 1080x1920, 30 fps, 10 seconds; no narration, original SFX only.
import React from "react";
import {Composition, registerRoot} from "remotion";
import {RatShort} from "./videos/rat/RatShort";

const Root: React.FC = () => (
  <Composition id="RatShort" component={RatShort} durationInFrames={300} fps={30} width={1080} height={1920} />
);
registerRoot(Root);

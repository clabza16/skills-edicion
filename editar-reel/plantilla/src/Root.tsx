import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { FPS, TOTAL } from "./plan";

export const RemotionRoot: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);

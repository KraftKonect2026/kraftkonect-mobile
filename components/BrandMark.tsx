import React from "react";
import { Image } from "expo-image";

const blueMark = require("@/assets/brand/kk-mark-blue.png");
const whiteMark = require("@/assets/brand/kk-mark-white.png");
const MARK_ASPECT_RATIO = 434.10357666015625 / 533.53369140625;

/** Original approved Figma artwork (982:1798 / 982:1819), stored locally. */
export function BrandMark({ height = 78, tone = "blue", decorative = false }: {
  height?: number;
  tone?: "blue" | "white";
  decorative?: boolean;
}) {
  return (
    <Image
      source={tone === "white" ? whiteMark : blueMark}
      style={{ width: height * MARK_ASPECT_RATIO, height }}
      contentFit="contain"
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : "KraftKonect"}
    />
  );
}

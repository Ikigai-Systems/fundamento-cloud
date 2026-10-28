import React from "react";
import type {ColorName} from "../types.js";

type Props = {
  color?: ColorName | null,
  children: React.ReactNode,
}

// Underlines its text in the object's colour. Without a colour it adds no element.
export default function ColorLabel({color, children}: Props) {
  if (!color) return <>{children}</>;

  return <span className="color-label" data-color={color}>{children}</span>;
}

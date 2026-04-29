import { scaledSeconds } from "./storeMotionDebug";

export function getProductMediaLayoutTransition(): {
  type: "tween";
  duration: number;
  ease: readonly [number, number, number, number];
} {
  return {
    type: "tween",
    duration: scaledSeconds(0.48),
    ease: [0.22, 1, 0.36, 1] as const,
  };
}

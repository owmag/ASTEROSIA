import { useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

/** Half-turn: clockwise (+deg) when going deeper or browse→overlay; counter-clockwise (−deg) when backing out or shallower X context. */
const BRAND_MARK_SPIN = {
  rotateDeg: 180,
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

/** Higher = deeper UI stack — aligns with App overlay modes (cart over footer/detail, etc.). */
function overlaySignatureDepth(sig: string): number {
  if (sig === "idle") return 0;
  if (sig === "open") return 1;
  if (sig.startsWith("footer")) return 2;
  if (sig.startsWith("detail:")) return 3;
  if (sig === "cart") return 4;
  return 1;
}

type Props = {
  overlayOpen: boolean;
  /** Changes when overlay stays open but context does (e.g. detail → cart) — triggers X-only spin. */
  overlaySpinSignature: string;
  cartDialogOpen: boolean;
  onActivate: () => void;
};

/** Fixed viewBox from project marks — paths match `X.png.svg` / `STAR.png.svg`. */
function BrandMarkX({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2480 2480"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M 424.02268,2066.7194 248.52414,1891.2187 571.86908,1567.8726 895.21401,1244.5265 572.86825,922.1189 C 395.57808,744.7948 249.94418,598.97293 249.23737,598.07045 c -1.12585,-1.4375 5.10717,-8.03677 50.29104,-53.24609 28.3669,-28.38286 52.00771,-51.60521 52.53513,-51.60521 0.52742,0 0.95895,-0.42227 0.95895,-0.93838 0,-1.26367 244.87232,-246.06162 246.13637,-246.06162 0.54717,0 146.49776,145.50532 324.33466,323.34516 l 323.33978,323.34519 323.3442,-323.3453 323.3441,-323.34527 175.5,175.5 175.5,175.5 -323.3453,323.34647 -323.3453,323.3465 322.3457,322.4076 c 177.2902,177.3241 322.9241,323.1459 323.6309,324.0484 1.1259,1.4375 -5.1071,8.0368 -50.291,53.2461 -28.3669,28.3829 -52.0077,51.6052 -52.5351,51.6052 -0.5275,0 -0.959,0.4223 -0.959,0.9384 0,1.2637 -244.8723,246.0616 -246.1364,246.0616 -0.5471,0 -146.4976,-145.5052 -324.3344,-323.345 l -323.3397,-323.3449 -323.34537,323.3454 -323.3454,323.3454 z"
      />
    </svg>
  );
}

function BrandMarkStar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2480 2480"
      aria-hidden
    >
      <g transform="translate(3.1799907,-5.529458)">
        <path
          fill="#a6a6a6"
          d="m 1739.5427,1242.0691 c -0.3164,-0.512 -0.193,-1.1672 0.2743,-1.456 0.4673,-0.2888 0.8497,0.1301 0.8497,0.9309 0,1.6862 -0.3154,1.8335 -1.124,0.5251 z"
        />
        <path
          fill="#4c4c4c"
          d="m 991.49462,2039 c 0,-201.575 0.11491,-284.0375 0.25536,-183.25 0.14045,100.7875 0.14045,265.7125 0,366.5 -0.14045,100.7875 -0.25536,18.325 -0.25536,-183.25 z m 497.99998,0.5 c 0,-201.3 0.1149,-283.5009 0.2554,-182.6687 0.1404,100.8322 0.1404,265.5322 0,366 -0.1405,100.4678 -0.2554,17.9687 -0.2554,-183.3313 z m 0,-1594 c 0,-201.3 0.1149,-283.50091 0.2554,-182.66869 0.1404,100.83222 0.1404,265.53222 0,366 C 1489.6095,729.29909 1489.4946,646.8 1489.4946,445.5 Z M 991.49461,445 c 0,-201.025 0.11492,-283.2625 0.25537,-182.75 0.14046,100.5125 0.14046,264.9875 0,365.5 -0.14045,100.5125 -0.25537,18.275 -0.25537,-182.75 z"
        />
        <path
          fill="#404040"
          d="m 1116.3304,79.250028 c 68.6567,-0.141803 180.7067,-0.141796 249,1.5e-5 68.2933,0.141812 12.1196,0.257832 -124.8304,0.257824 -136.95,-9e-6 -192.8263,-0.116036 -124.1696,-0.257839 z"
        />
        <path
          fill="#333333"
          d="m 992,2038.893 c 0,-294.8425 -0.24631,-366.0125 -1.26534,-365.6214 -0.69594,0.267 -142.87624,82.4402 -315.95623,182.607 -173.07998,100.1668 -315.04808,182.1174 -315.48465,182.1125 -1.16747,-0.013 -249.51896,-430.4036 -248.58619,-430.7973 3.98215,-1.6806 628.56508,-364.9216 628.66268,-365.6137 C 739.44162,1241.0742 597.975,1158.8663 425,1058.8959 252.025,958.92551 110.5938,876.70804 110.70845,876.19043 c 0.31056,-1.40217 246.37701,-427.49433 247.67624,-428.87969 0.84742,-0.90361 76.76557,42.41779 316.06966,180.3598 173.22489,99.85198 315.53739,181.7728 316.25,182.04625 C 991.76376,810.12332 992,743.6426 992,445.10699 V 80 h 248.5 248.5 v 365.5 c 0,254.54487 0.3187,365.5 1.0497,365.5 0.5774,0 142.5841,-81.91056 315.5704,-182.02347 172.9864,-100.1129 315.0155,-182.1254 315.6203,-182.25 0.6048,-0.12459 57.0265,96.52347 125.3815,214.77347 119.1795,206.17314 124.2,215.05751 122.2866,216.40081 -1.0974,0.77044 -143.0048,82.67044 -315.3497,181.99999 -172.3448,99.3296 -313.437,181.0002 -313.5382,181.4903 -0.1012,0.4901 141.7153,83.0038 315.1477,183.3636 173.4324,100.3599 315.4459,182.5731 315.5855,182.696 0.5083,0.4477 -248.2771,430.5342 -249.0487,430.5416 -0.4372,0 -142.4001,-81.945 -315.4732,-182.1093 -173.073,-100.1644 -315.2528,-182.3375 -315.9551,-182.607 -1.0343,-0.3969 -1.2768,69.0392 -1.2768,365.617 V 2405 H 1240.5 992 Z"
        />
      </g>
    </svg>
  );
}

export function HeaderBrandMark({
  overlayOpen,
  overlaySpinSignature,
  cartDialogOpen,
  onActivate,
}: Props) {
  const reduceMotion = useReducedMotion();
  const rotate = useMotionValue(0);
  const [mark, setMark] = useState<"star" | "x">(() => (overlayOpen ? "x" : "star"));
  const prevOverlay = useRef(overlayOpen);
  const prevSignature = useRef(overlaySpinSignature);

  useLayoutEffect(() => {
    const prevOpen = prevOverlay.current;
    const prevSig = prevSignature.current;
    const overlayChanged = prevOpen !== overlayOpen;
    const signatureChanged = prevSig !== overlaySpinSignature;
    if (!overlayChanged && !signatureChanged) return;

    const targetMark = overlayOpen ? "x" : "star";
    const starSwap = overlayChanged;
    const xOnlySpin =
      overlayOpen && !overlayChanged && signatureChanged && targetMark === "x";

    let rotateDeg = BRAND_MARK_SPIN.rotateDeg;
    if (starSwap) {
      rotateDeg = overlayOpen ? BRAND_MARK_SPIN.rotateDeg : -BRAND_MARK_SPIN.rotateDeg;
    } else if (xOnlySpin) {
      const dOld = overlaySignatureDepth(prevSig);
      const dNew = overlaySignatureDepth(overlaySpinSignature);
      rotateDeg = dNew < dOld ? -BRAND_MARK_SPIN.rotateDeg : BRAND_MARK_SPIN.rotateDeg;
    }

    prevOverlay.current = overlayOpen;
    prevSignature.current = overlaySpinSignature;

    if (reduceMotion) {
      setMark(targetMark);
      rotate.set(0);
      return;
    }

    if (!starSwap && !xOnlySpin) return;

    let cancelled = false;
    const ease = BRAND_MARK_SPIN.ease;
    const fullDuration = BRAND_MARK_SPIN.duration;
    const halfTravel = Math.abs(rotateDeg) / 2;

    void (async () => {
      if (cancelled) return;
      const from = rotate.get();
      const to = from + rotateDeg;

      let markSwapped = false;
      const maybeSwapMidSpin =
        starSwap &&
        (() => {
          if (cancelled || markSwapped) return;
          const r = rotate.get();
          if (Math.abs(r - from) < halfTravel - 0.5) return;
          markSwapped = true;
          setMark(targetMark);
        });

      await animate(rotate, to, {
        duration: fullDuration,
        ease,
        ...(maybeSwapMidSpin ? { onUpdate: maybeSwapMidSpin } : {}),
      });
      if (cancelled) return;
      rotate.set(0);
    })();

    return () => {
      cancelled = true;
    };
  }, [overlayOpen, overlaySpinSignature, reduceMotion, rotate]);

  const hitAriaLabel = overlayOpen ? (cartDialogOpen ? "Back" : "Close") : "ASTEROSIA";

  return (
    <div className="app__header-start-brand">
      <button
        type="button"
        className="app__header-brand-hit"
        aria-label={hitAriaLabel}
        onClick={onActivate}
      >
        <div className="app__header-brand-slot">
          <motion.div className="app__header-brand-spin" style={{ rotate }}>
            <span
              className="app__header-brand-inner app__header-brand-inner--layer"
              style={{ opacity: mark === "star" ? 1 : 0 }}
              aria-hidden
            >
              <BrandMarkStar className="app__header-brand-svg" />
            </span>
            <span
              className="app__header-brand-inner app__header-brand-inner--layer"
              style={{ opacity: mark === "x" ? 1 : 0 }}
              aria-hidden
            >
              <BrandMarkX className="app__header-brand-svg" />
            </span>
          </motion.div>
        </div>
        <span className="app__header-wordmark" aria-hidden>
          ASTEROSIA
        </span>
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

const WORDS_RAW =
  "Tân Á Đại Thành là tập đoàn kinh tế tư nhân đa ngành hàng đầu Việt Nam, phát triển trên ba trụ cột chiến lược Công nghiệp, Công nghệ cao & Bất động sản, với khát vọng kiến tạo những chuẩn sống mới vì một cộng đồng phồn vinh.";

const C_START = { r: 199, g: 216, b: 235 }; // #C7D8EB
const C_END   = { r:   7, g:  95, b: 199 }; // #075FC7

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(t: number) {
  const r = Math.round(lerp(C_START.r, C_END.r, t));
  const g = Math.round(lerp(C_START.g, C_END.g, t));
  const b = Math.round(lerp(C_START.b, C_END.b, t));
  return `rgb(${r},${g},${b})`;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

const SECTION_HEIGHT_DESIGN = 371; // design-px height set via visual editor

export default function ScrollRevealText({ scale }: { scale: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!outerRef.current) return;
        const rect = outerRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const sectionCenter = rect.top + rect.height / 2;

        // Start shortly after the section enters and finish around the viewport
        // midpoint, then ease out so the blue value rises earlier and smoothly.
        const raw = clamp01((vh * 0.92 - sectionCenter) / (vh * 0.42));
        setProgress(easeOutCubic(raw));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const words = WORDS_RAW.split(" ");
  const n = words.length;

  // Mirror the original paragraph's design coordinates
  const leftPx  = (1660 * 0.0833 + 51.67) * scale; // calc(8.33% + 51.67px) of 1660
  const widthPx = 1239.987 * scale;
  const fs      = 48 * scale;
  const lh      = 56 * scale;
  const ls      = -2 * scale;

  return (
    <div
      ref={outerRef}
      className="scroll-reveal-section"
      style={{ height: SECTION_HEIGHT_DESIGN * scale, position: "relative", background: "#fff" }}
    >
      <div
        style={{
          position: "relative",
          paddingLeft: leftPx,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            margin: 0,
            padding: 0,
            width: widthPx,
            fontSize: fs,
            fontFamily: "'DM-Aptos:SemiBold', sans-serif",
            fontWeight: 600,
            letterSpacing: ls,
            lineHeight: `${lh}px`,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {words.map((word, i) => {
            // Several neighbouring words blend at once instead of switching one
            // at a time, which removes the stepped feeling while scrolling.
            const blendWindow = 5;
            const t = clamp01((progress * (n + blendWindow) - i) / blendWindow);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  color: lerpColor(t),
                  opacity: lerp(0.45, 1, t),
                  transform: `translateY(${lerp(4 * scale, 0, t)}px)`,
                  transition: "color 100ms linear, opacity 100ms linear, transform 100ms ease-out",
                }}
              >
                {word}&nbsp;
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}

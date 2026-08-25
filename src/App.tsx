import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Component from "@/components/CorporateLandingPage";
import ScrollRevealText from "@/components/ScrollRevealText";

const DESIGN_WIDTH  = 1660;
const TOTAL_HEIGHT  = 8230;
const CLIP_TOP      = 1600; // just above the paragraph at 1603; Tuyên ngôn label (1558) stays in top
const CLIP_BOTTOM   = 1945; // Frame25 (blue industry) starts here
const ACTIVITY_2    = 2994;
const ACTIVITY_3    = 3994;
const ACTIVITY_END  = 5415;
const FOOTER_TOP    = 7619;

type DesignSliceProps = {
  from: number;
  to: number;
  scale: number;
};

// Keep these components outside App so viewport scale updates preserve their
// DOM nodes and the reveal classes attached by the observer.
function DesignSlice({ from, to, scale }: DesignSliceProps) {
  return (
    <div
      style={{
        width: "100%",
        height: (to - from) * scale,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -from * scale,
          width: DESIGN_WIDTH,
          height: TOTAL_HEIGHT,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        <Component />
      </div>
    </div>
  );
}

function ActivityPanel({ from, to, index, scale }: DesignSliceProps & { index: number }) {
  return (
    <section
      className="activity-panel"
      style={{ height: (to - from) * scale, zIndex: index }}
    >
      <DesignSlice from={from} to={to} scale={scale} />
    </section>
  );
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / DESIGN_WIDTH);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const selector = 'p, button, div[class*="rounded-"]';
    const items = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const footerItems = items.filter((item) => item.closest(".footer-fixed"));
    const pageItems = items.filter((item) => !item.closest(".footer-fixed"));

    items.forEach((item, index) => {
      item.classList.add("reveal-item");
      item.classList.add(item.tagName === "P" ? "reveal-text" : "reveal-box");
      item.style.setProperty("--reveal-delay", `${(index % 6) * 45}ms`);
    });

    root.classList.add("reveal-enabled");

    if (reduceMotion) {
      items.forEach((item) => item.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
    );

    pageItems.forEach((item) => observer.observe(item));

    // The desktop footer is fixed behind the page, so reveal it only when its
    // transparent spacer reaches the viewport instead of on initial load.
    const footerSpacer = root.querySelector(".footer-reveal-spacer");
    const footerObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        footerItems.forEach((item) => item.classList.add("is-revealed"));
        footerObserver.disconnect();
      },
      { threshold: 0.08 },
    );

    if (footerSpacer) footerObserver.observe(footerSpacer);

    return () => {
      observer.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="site-shell"
      style={{ width: "100%", overflowX: "clip" }}
    >
      <main className="site-content">
        {/* Top: hero → tuyên ngôn label */}
        <DesignSlice from={0} to={CLIP_TOP} scale={scale} />

        {/* Scroll reveal: 180 vh sticky word-by-word animation */}
        <ScrollRevealText scale={scale} />

        {/* Three activity areas pin and are successively covered while scrolling. */}
        <div className="activity-stack">
          <ActivityPanel from={CLIP_BOTTOM} to={ACTIVITY_2} index={1} scale={scale} />
          <ActivityPanel from={ACTIVITY_2} to={ACTIVITY_3} index={2} scale={scale} />
          <ActivityPanel from={ACTIVITY_3} to={ACTIVITY_END} index={3} scale={scale} />
        </div>

        {/* Remaining content ends immediately before the footer. */}
        <DesignSlice from={ACTIVITY_END} to={FOOTER_TOP} scale={scale} />
      </main>

      {/* Desktop: this transparent space lets the fixed footer appear from behind the page. */}
      <div
        aria-hidden="true"
        className="footer-reveal-spacer"
        style={{ height: (TOTAL_HEIGHT - FOOTER_TOP) * scale }}
      />

      <footer className="footer-fixed">
        <DesignSlice from={FOOTER_TOP} to={TOTAL_HEIGHT} scale={scale} />
      </footer>

      {/* Mobile/tablet fallback keeps the footer in the normal document flow. */}
      <footer className="footer-flow">
        <DesignSlice from={FOOTER_TOP} to={TOTAL_HEIGHT} scale={scale} />
      </footer>
    </div>
  );
}

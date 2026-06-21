"use client";

import { useMemo } from "react";

interface SparklesProps {
  n?: number;
  colors?: string[];
}

// Simple seeded PRNG so the component stays pure and deterministic.
function createSeededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function Sparkles({ n = 18, colors }: SparklesProps) {
  const parts = useMemo(() => {
    const cols = colors ?? [
      "var(--color-accent)",
      "var(--color-sage)",
      "var(--color-glow)",
      "#f4d6a8",
    ];
    const seed = n * 31 + cols.length * 17;
    const random = createSeededRandom(seed);

    return Array.from({ length: n }, (_, i) => {
      const ang = (i / n) * Math.PI * 2 + random();
      const dist = 70 + random() * 90;
      return {
        dx: `${Math.cos(ang) * dist}px`,
        dy: `${Math.sin(ang) * dist}px`,
        dr: `${random() * 360 - 180}deg`,
        bg: cols[i % cols.length],
        delay: `${random() * 0.12}s`,
        key: i,
        rounded: i % 2 === 0,
      };
    });
  }, [n, colors]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <style>{`
        @keyframes spark-burst {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--dr)) scale(0); opacity: 0; }
        }
        .spark {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 6px;
          height: 6px;
          animation: spark-burst 0.85s ease-out forwards;
        }
      `}</style>
      {parts.map((pt) => (
        <span
          key={pt.key}
          className="spark"
          style={{
            background: pt.bg,
            borderRadius: pt.rounded ? "50%" : "2px",
            animationDelay: pt.delay,
            // @ts-expect-error CSS custom properties
            "--dx": pt.dx,
            "--dy": pt.dy,
            "--dr": pt.dr,
          }}
        />
      ))}
    </div>
  );
}

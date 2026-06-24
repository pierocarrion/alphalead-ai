"use client";

import { useEffect, useState } from "react";
import type { ContributionReport, GoalProgress } from "@/features/projects/domain/entities/SmartGoal";

interface SmartCylinderProps {
  progress: GoalProgress;
  contributions: ContributionReport;
  size?: number;
}

/**
 * SMART Cylinder Visualization.
 *
 * A vertical 3D-looking cylinder (SVG) that fills from the bottom according to
 * the goal's real progress. Each contributor's share is rendered as a colored
 * layer inside the liquid, and a dashed marker shows the expected pace.
 *
 * Pure presentational component — animation is a CSS height transition so the
 * fill glides when progress updates in real time.
 */
export function SmartCylinder({
  progress,
  contributions,
  size = 220,
}: SmartCylinderProps) {
  const [animatedFill, setAnimatedFill] = useState(0);

  useEffect(() => {
    // Defer one frame so the CSS transition runs on the first paint too.
    const id = requestAnimationFrame(() => setAnimatedFill(progress.goalProgress));
    return () => cancelAnimationFrame(id);
  }, [progress.goalProgress]);

  const width = size;
  const height = size * 1.5;
  const padX = size * 0.18;
  const rimRy = size * 0.085;
  const bodyX = padX;
  const bodyW = width - padX * 2;
  const bodyTop = rimRy;
  const bodyH = height - rimRy * 3;
  const bodyBottom = bodyTop + bodyH;

  const fillHeight = (bodyH * animatedFill) / 100;
  const fillTop = bodyBottom - fillHeight;

  const expectedY = bodyBottom - (bodyH * Math.min(progress.expectedProgress, 100)) / 100;

  // Build contribution layers (stacked from the bottom of the liquid up).
  const layers = buildLayers(contributions, animatedFill);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Progreso del objetivo: ${progress.goalProgress} por ciento`}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="cyl-glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </linearGradient>
          <linearGradient id="cyl-liquid-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          <clipPath id="cyl-body-clip">
            <rect x={bodyX} y={bodyTop} width={bodyW} height={bodyH} rx={2} />
          </clipPath>
        </defs>

        {/* Cylinder body backdrop */}
        <rect
          x={bodyX}
          y={bodyTop}
          width={bodyW}
          height={bodyH}
          rx={2}
          fill="var(--color-surface-2)"
        />

        {/* Liquid + contribution layers (clipped to the body) */}
        <g clipPath="url(#cyl-body-clip)">
          {fillHeight > 0 &&
            layers.map((layer) => {
              const layerHeight = (bodyH * layer.heightPct) / 100;
              const layerY =
                bodyBottom - (bodyH * layer.cumulativePct) / 100 - layerHeight;
              return (
                <rect
                  key={layer.key}
                  x={bodyX}
                  y={layerY}
                  width={bodyW}
                  height={layerHeight + 0.5}
                  fill={layer.color}
                  opacity={0.92}
                  style={{ transition: "all 0.8s ease" }}
                />
              );
            })}

          {/* Liquid surface shimmer */}
          {fillHeight > 2 && (
            <ellipse
              cx={bodyX + bodyW / 2}
              cy={fillTop}
              rx={bodyW / 2}
              ry={rimRy * 0.9}
              fill="url(#cyl-liquid-top)"
              style={{ transition: "cy 0.8s ease" }}
            />
          )}

          {/* Glass highlight overlay */}
          <rect
            x={bodyX}
            y={bodyTop}
            width={bodyW}
            height={bodyH}
            fill="url(#cyl-glass)"
          />
        </g>

        {/* Expected-pace marker */}
        {progress.expectedProgress > 0 && progress.expectedProgress < 100 && (
          <g>
            <line
              x1={bodyX - 4}
              y1={expectedY}
              x2={bodyX + bodyW + 4}
              y2={expectedY}
              stroke="var(--color-ink)"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.7}
            />
            <text
              x={bodyX + bodyW + 6}
              y={expectedY + 3}
              fontSize={9}
              fill="var(--color-ink-2)"
              fontWeight={600}
            >
              meta {progress.expectedProgress}%
            </text>
          </g>
        )}

        {/* Top rim */}
        <ellipse
          cx={bodyX + bodyW / 2}
          cy={bodyTop}
          rx={bodyW / 2}
          ry={rimRy}
          fill="var(--color-surface-3)"
          stroke="var(--color-line-2)"
          strokeWidth={1}
        />
        {/* Bottom rim */}
        <ellipse
          cx={bodyX + bodyW / 2}
          cy={bodyBottom}
          rx={bodyW / 2}
          ry={rimRy}
          fill="none"
          stroke="var(--color-line-2)"
          strokeWidth={1}
        />
      </svg>

      {/* Percentage readout */}
      <div className="-mt-2 flex flex-col items-center">
        <div className="font-display text-[34px] leading-none text-ink">
          {progress.goalProgress}%
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          {progress.status}
        </div>
      </div>
    </div>
  );
}

interface CylinderLayer {
  key: string;
  color: string;
  heightPct: number; // share of the whole cylinder height (0..100)
  cumulativePct: number; // height already stacked below this layer (0..100)
}

function buildLayers(
  contributions: ContributionReport,
  fillPct: number
): CylinderLayer[] {
  const totalShare = contributions.members.reduce((s, m) => s + m.share, 0);
  if (totalShare <= 0 || fillPct <= 0) return [];

  const scaled = contributions.members.map((m) => ({
    key: m.userId,
    color: m.color,
    heightPct: (m.share / totalShare) * fillPct,
  }));

  // Stack from the bottom up, accumulating in cylinder-percentage space.
  const layers: CylinderLayer[] = [];
  let cumulative = 0;
  for (const layer of scaled) {
    layers.push({ ...layer, cumulativePct: cumulative });
    cumulative += layer.heightPct;
  }
  return layers;
}

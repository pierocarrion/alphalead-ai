"use client";

interface WeatherProps {
  level?: number;
  size?: number;
}

export function Weather({ level = 0.5, size = 56 }: WeatherProps) {
  const hue = level < 0.4 ? "var(--color-sage)" : level < 0.7 ? "var(--color-accent)" : "#E6A0B0";
  const radius = size * 0.428;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - level);

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line-2)"
          strokeWidth={size * 0.089}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={hue}
          strokeWidth={size * 0.089}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full opacity-85" style={{ width: size * 0.286, height: size * 0.286, background: hue }} />
      </div>
    </div>
  );
}

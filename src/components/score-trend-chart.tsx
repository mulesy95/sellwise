"use client";

interface TrendPoint {
  week: string;
  avg: number;
}

interface ScoreTrendChartProps {
  data: TrendPoint[];
  className?: string;
}

export function ScoreTrendChart({ data, className }: ScoreTrendChartProps) {
  if (data.length < 2) return null;

  const HEIGHT = 40;
  const WIDTH = 200;
  const PADDING = 4;

  const minScore = Math.min(...data.map((d) => d.avg));
  const maxScore = Math.max(...data.map((d) => d.avg));
  const range = maxScore - minScore || 1;

  const points = data.map((d, i) => {
    const x = PADDING + (i / (data.length - 1)) * (WIDTH - PADDING * 2);
    const y = PADDING + ((maxScore - d.avg) / range) * (HEIGHT - PADDING * 2);
    return { x, y, avg: d.avg };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];
  const first = points[0];
  const trending = last.avg >= first.avg;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-10"
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={trending ? "stroke-emerald-500" : "stroke-amber-500"}
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="2.5"
          className={trending ? "fill-emerald-500" : "fill-amber-500"}
        />
      </svg>
    </div>
  );
}

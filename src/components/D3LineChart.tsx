import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { TrendingUp, BarChart, Map, Award } from "lucide-react";

interface TrendPoint {
  week: string;
  date: Date;
  volume: number;
}

const TRENDS_DATA: Record<"total" | "physical" | "remote", TrendPoint[]> = {
  total: [
    { week: "Week 21 (May 04)", date: new Date(2026, 4, 4), volume: 135 },
    { week: "Week 22 (May 11)", date: new Date(2026, 4, 11), volume: 154 },
    { week: "Week 23 (May 18)", date: new Date(2026, 4, 18), volume: 142 },
    { week: "Week 24 (May 25)", date: new Date(2026, 4, 25), volume: 178 },
    { week: "Week 25 (Jun 01)", date: new Date(2026, 5, 1), volume: 195 },
    { week: "Week 26 (Jun 08)", date: new Date(2026, 5, 8), volume: 168 },
    { week: "Week 27 (Jun 15)", date: new Date(2026, 5, 15), volume: 220 },
    { week: "Week 28 (Jun 22)", date: new Date(2026, 5, 22), volume: 245 }
  ],
  physical: [
    { week: "Week 21 (May 04)", date: new Date(2026, 4, 4), volume: 92 },
    { week: "Week 22 (May 11)", date: new Date(2026, 4, 11), volume: 108 },
    { week: "Week 23 (May 18)", date: new Date(2026, 4, 18), volume: 98 },
    { week: "Week 24 (May 25)", date: new Date(2026, 4, 25), volume: 125 },
    { week: "Week 25 (Jun 01)", date: new Date(2026, 5, 1), volume: 136 },
    { week: "Week 26 (Jun 08)", date: new Date(2026, 5, 8), volume: 114 },
    { week: "Week 27 (Jun 15)", date: new Date(2026, 5, 15), volume: 158 },
    { week: "Week 28 (Jun 22)", date: new Date(2026, 5, 22), volume: 175 }
  ],
  remote: [
    { week: "Week 21 (May 04)", date: new Date(2026, 4, 4), volume: 43 },
    { week: "Week 22 (May 11)", date: new Date(2026, 4, 11), volume: 46 },
    { week: "Week 23 (May 18)", date: new Date(2026, 4, 18), volume: 44 },
    { week: "Week 24 (May 25)", date: new Date(2026, 4, 25), volume: 53 },
    { week: "Week 25 (Jun 01)", date: new Date(2026, 5, 1), volume: 59 },
    { week: "Week 26 (Jun 08)", date: new Date(2026, 5, 8), volume: 54 },
    { week: "Week 27 (Jun 15)", date: new Date(2026, 5, 15), volume: 62 },
    { week: "Week 28 (Jun 22)", date: new Date(2026, 5, 22), volume: 70 }
  ]
};

export default function D3LineChart() {
  const [metric, setMetric] = useState<"total" | "physical" | "remote">("total");
  const [dimensions, setDimensions] = useState({ width: 600, height: 280 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const data = TRENDS_DATA[metric];

  // Responsive resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // set dimensions but prevent heights from becoming too small
        setDimensions({
          width: Math.max(width, 300),
          height: 280
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Margins
  const margin = { top: 25, right: 30, bottom: 40, left: 45 };
  const { width, height } = dimensions;

  // Scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, (d: TrendPoint) => d.date) as [Date, Date])
    .range([margin.left, width - margin.right]);

  const yMax = d3.max(data, (d: TrendPoint) => d.volume) || 100;
  const yScale = d3.scaleLinear()
    .domain([0, Math.ceil(yMax * 1.15)])
    .range([height - margin.bottom, margin.top]);

  // Line Generator
  const lineGenerator = d3.line<TrendPoint>()
    .x(d => xScale(d.date))
    .y(d => yScale(d.volume))
    .curve(d3.curveMonotoneX);

  // Area Generator
  const areaGenerator = d3.area<TrendPoint>()
    .x(d => xScale(d.date))
    .y0(height - margin.bottom)
    .y1(d => yScale(d.volume))
    .curve(d3.curveMonotoneX);

  const pathD = lineGenerator(data) || "";
  const areaD = areaGenerator(data) || "";

  // Ticks
  const xTicks = data.map(d => ({
    value: d.date,
    label: d.week.split(" ")[0] + " " + d.week.split(" ")[1] // e.g. "Week 21"
  }));

  const yTicksCount = 5;
  const yTicks = yScale.ticks(yTicksCount);

  // Hover detection using closest point
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;

    // Find the closest point on the X axis
    let closestPt = data[0];
    let minDiff = Infinity;

    data.forEach((pt) => {
      const ptX = xScale(pt.date);
      const diff = Math.abs(ptX - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestPt = pt;
      }
    });

    if (closestPt) {
      setHoveredPoint(closestPt);
      setHoverCoords({
        x: xScale(closestPt.date),
        y: yScale(closestPt.volume)
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverCoords(null);
  };

  const activeColor = metric === "total" ? "#FF6B00" : metric === "physical" ? "#10B981" : "#3B82F6";

  return (
    <div 
      className="bg-[#1A1D26] border border-gray-800 rounded-xl p-5 shadow-sm transition-transform hover:scale-[1.01]" 
      id="d3-training-trends-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Zonal Weekly Training Volume trends
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Historical weekly metrics of training volume & site visits
            </p>
          </div>
        </div>

        {/* Toggle selectors */}
        <div className="flex bg-[#0F1117] p-1 rounded-lg border border-gray-800/80 self-start sm:self-auto">
          <button
            onClick={() => setMetric("total")}
            className={`px-3 py-1 text-[10px] uppercase font-black rounded-md transition-all cursor-pointer ${
              metric === "total" ? "bg-[#FF6B00] text-black font-extrabold" : "text-gray-400 hover:text-white"
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setMetric("physical")}
            className={`px-3 py-1 text-[10px] uppercase font-black rounded-md transition-all cursor-pointer ${
              metric === "physical" ? "bg-emerald-600 text-white font-extrabold" : "text-gray-400 hover:text-white"
            }`}
          >
            Physical
          </button>
          <button
            onClick={() => setMetric("remote")}
            className={`px-3 py-1 text-[10px] uppercase font-black rounded-md transition-all cursor-pointer ${
              metric === "remote" ? "bg-blue-600 text-white font-extrabold" : "text-gray-400 hover:text-white"
            }`}
          >
            Remote
          </button>
        </div>
      </div>

      <div className="relative w-full" ref={containerRef}>
        {/* SVG Wrapper */}
        <svg
          width="100%"
          height={height}
          className="overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={activeColor} stopOpacity={0.00} />
            </linearGradient>
          </defs>

          {/* Grid lines (Y-axis) */}
          {yTicks.map((tick, idx) => (
            <g key={idx} className="opacity-40">
              <line
                x1={margin.left}
                y1={yScale(tick)}
                x2={width - margin.right}
                y2={yScale(tick)}
                stroke="#1F2937"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={margin.left - 10}
                y={yScale(tick) + 3}
                fill="#9CA3AF"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
                className="font-semibold"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Area under curve */}
          <path
            d={areaD}
            fill="url(#chartAreaGrad)"
          />

          {/* Line path */}
          <path
            d={pathD}
            fill="none"
            stroke={activeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X Axis ticks and labels */}
          {xTicks.map((tick, idx) => (
            <g key={idx}>
              <text
                x={xScale(tick.value)}
                y={height - margin.bottom + 18}
                fill="#9CA3AF"
                fontSize="9"
                fontFamily="Inter, sans-serif"
                textAnchor="middle"
                className="font-medium"
              >
                {tick.label}
              </text>
              <line
                x1={xScale(tick.value)}
                y1={height - margin.bottom}
                x2={xScale(tick.value)}
                y2={height - margin.bottom + 4}
                stroke="#374151"
                strokeWidth={1.5}
              />
            </g>
          ))}

          {/* Axis borders */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#374151"
            strokeWidth={1.5}
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#374151"
            strokeWidth={1.5}
          />

          {/* Hover Interaction Guideline */}
          {hoverCoords && (
            <g>
              <line
                x1={hoverCoords.x}
                y1={margin.top}
                x2={hoverCoords.x}
                y2={height - margin.bottom}
                stroke={activeColor}
                strokeWidth={1}
                strokeDasharray="4 4"
                className="opacity-75"
              />
              <circle
                cx={hoverCoords.x}
                cy={hoverCoords.y}
                r={6}
                fill={activeColor}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                className="shadow-md"
              />
              <circle
                cx={hoverCoords.x}
                cy={hoverCoords.y}
                r={12}
                fill={activeColor}
                fillOpacity={0.15}
                className="animate-ping"
              />
            </g>
          )}

          {/* Static dots for all data points */}
          {!hoverCoords && data.map((pt, idx) => (
            <circle
              key={idx}
              cx={xScale(pt.date)}
              cy={yScale(pt.volume)}
              r={3.5}
              fill="#1A1D26"
              stroke={activeColor}
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* HTML Tooltip on hover */}
        {hoveredPoint && hoverCoords && (
          <div
            className="absolute z-10 bg-[#0F1117] border border-gray-800 text-white rounded-lg p-3 text-xs shadow-xl pointer-events-none transition-all duration-75"
            style={{
              left: `${Math.min(hoverCoords.x + 10, width - 150)}px`,
              top: `${Math.max(hoverCoords.y - 75, 10)}px`
            }}
          >
            <div className="font-bold text-[#FF6B00] mb-0.5">{hoveredPoint.week}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }}></span>
              <span className="text-gray-400 uppercase text-[9px] tracking-wider font-semibold">Sessions:</span>
              <span className="font-extrabold text-white text-sm">{hoveredPoint.volume}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800/60 text-center">
        <div>
          <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide block">Current Peak</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{d3.max(data, (d: TrendPoint) => d.volume)} sessions</span>
        </div>
        <div>
          <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide block">8-Week Average</span>
          <span className="text-sm font-bold text-white mt-0.5 block">
            {Math.round(d3.mean(data, (d: TrendPoint) => d.volume) || 0)} sessions
          </span>
        </div>
        <div>
          <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide block">Volume Growth</span>
          <span className="text-sm font-bold text-emerald-400 mt-0.5 block flex items-center justify-center gap-0.5">
            +{( ((data[data.length - 1].volume - data[0].volume) / data[0].volume) * 100 ).toFixed(0)}% MoM
          </span>
        </div>
      </div>
    </div>
  );
}

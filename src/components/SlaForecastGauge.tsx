import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { ShieldAlert, TrendingDown, Users, CheckCircle, RefreshCw } from "lucide-react";
import { Trainer, Summary } from "../types";

interface SlaForecastGaugeProps {
  trainers: Trainer[];
  summary: Summary | null;
}

export default function SlaForecastGauge({ trainers = [], summary = null }: SlaForecastGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 180 });

  // Calculate shift and session telemetry
  const totalTrainers = trainers.length;
  const activeTrainersCount = trainers.filter(t => t.is_checked_in).length;
  const currentSessionVolume = summary ? summary.total_sessions : 18;

  // 1 Trainer capacity = ~4 sessions per day
  const totalCapacity = Math.max(4, activeTrainersCount * 4);
  const capacityUtilization = currentSessionVolume / totalCapacity;

  // Forecast breach probability
  let breachProbability = Math.round(capacityUtilization * 75);
  // Add penalties for low trainer availability or high unresolved Zoho fatal blocks
  const fatalIssues = summary ? summary.fatal_issues : 0;
  if (activeTrainersCount < 3) breachProbability += 22;
  if (fatalIssues > 0) breachProbability += (fatalIssues * 8);
  
  // Bound probability between 8% and 98% for realistic forecasting
  breachProbability = Math.min(98, Math.max(8, breachProbability));

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" = "low";
  let riskColor = "#10B981"; // Emerald
  let riskLabel = "Low Risk";
  let riskAdvice = "Zonal roster capacity is optimal. Trainer headcount is fully prepared to absorb on-site ticket volumes within the 15-minute SLA buffer.";

  if (breachProbability >= 70) {
    riskLevel = "high";
    riskColor = "#EF4444"; // Rose/Red
    riskLabel = "CRITICAL RISK";
    riskAdvice = "HIGH BREACH PROBABILITY! Immediate roster reinforcements needed. Deploy standby remote trainers to Coimbatore, Madurai, or Bangalore.";
  } else if (breachProbability >= 35) {
    riskLevel = "medium";
    riskColor = "#F59E0B"; // Amber/Orange
    riskLabel = "MODERATE RISK";
    riskAdvice = "Capacity limit tightening. Coordinate with Team Leaders to fast-track pending Zoho check-ins and suppress response latency.";
  }

  // Handle responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 240),
          height: 180
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render D3 Gauge Arc Chart
  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous renders

    // Radius parameters
    const outerRadius = Math.min(width / 2 - 20, height - 20);
    const innerRadius = outerRadius - 20;

    // Root group translated to bottom-center of the half circle
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height - 15})`);

    // Scale mapping probability (0-100) to angle (-Math.PI/2 to Math.PI/2)
    const scale = d3.scaleLinear()
      .domain([0, 100])
      .range([-Math.PI / 2, Math.PI / 2]);

    // Background track arc
    const arcBackground = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2)
      .cornerRadius(4);

    g.append("path")
      .attr("d", arcBackground as any)
      .attr("fill", "#1F2937") // dark slate background track
      .attr("opacity", 0.6);

    // Colored sectors arcs
    const drawSector = (start: number, end: number, color: string) => {
      const sectorArc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(scale(start))
        .endAngle(scale(end))
        .cornerRadius(idx => (start === 0 || end === 100) ? 4 : 0);

      g.append("path")
        .attr("d", sectorArc as any)
        .attr("fill", color)
        .attr("opacity", 0.25);
    };

    // Draw three bands: Green (0-35), Amber (35-70), Red (70-100)
    drawSector(0, 35, "#10B981");
    drawSector(35, 70, "#F59E0B");
    drawSector(70, 100, "#EF4444");

    // Value/Progress arc (fill up to current probability)
    const arcProgress = d3.arc()
      .innerRadius(innerRadius - 1)
      .outerRadius(outerRadius + 1)
      .startAngle(-Math.PI / 2)
      .endAngle(scale(breachProbability))
      .cornerRadius(4);

    g.append("path")
      .attr("d", arcProgress as any)
      .attr("fill", riskColor);

    // Draw central node/hub for the needle
    g.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 8)
      .attr("fill", "#FFFFFF")
      .attr("stroke", "#0F1117")
      .attr("stroke-width", 2);

    // Needle generator
    const needleAngle = scale(breachProbability);
    const needleLength = outerRadius - 10;
    
    // Calculate needle tip coordinate
    const needleX = needleLength * Math.sin(needleAngle);
    const needleY = -needleLength * Math.cos(needleAngle);

    g.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", needleX)
      .attr("y2", needleY)
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 3.5)
      .attr("stroke-linecap", "round");

    // Add arc tick annotations (0%, 50%, 100%)
    const ticks = [0, 50, 100];
    ticks.forEach(t => {
      const angle = scale(t);
      const tickXOuter = (outerRadius + 8) * Math.sin(angle);
      const tickYOuter = -(outerRadius + 8) * Math.cos(angle);
      
      g.append("text")
        .attr("x", tickXOuter)
        .attr("y", tickYOuter + 3)
        .attr("fill", "#9CA3AF")
        .attr("font-size", "9px")
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text(`${t}%`);
    });

  }, [dimensions, breachProbability, riskColor]);

  return (
    <div 
      className="bg-[#1A1D26] border border-gray-800 rounded-xl p-5 shadow-sm flex flex-col justify-between h-56 transition-transform hover:scale-[1.01]"
      id="sla-breach-forecast-gauge-card"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Roster SLA Breach Forecast</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">D3 gauge tracking roster overload threat index</p>
        </div>
        <span 
          className="px-2 py-0.5 text-[9px] font-black uppercase rounded tracking-widest font-mono"
          style={{ backgroundColor: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}30` }}
        >
          {riskLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        {/* Gauge Visual */}
        <div ref={containerRef} className="md:col-span-6 flex justify-center items-center h-[115px]">
          <svg 
            ref={svgRef} 
            width={dimensions.width} 
            height={dimensions.height}
            className="overflow-visible"
          />
        </div>

        {/* Telemetry metadata metrics */}
        <div className="md:col-span-6 space-y-2 text-xs">
          <div className="bg-[#0F1117] border border-gray-800/60 p-2 rounded-lg grid grid-cols-2 gap-2 text-center">
            <div>
              <span className="text-[8px] text-gray-500 uppercase font-mono block">Volume Today</span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">{currentSessionVolume} sess</span>
            </div>
            <div>
              <span className="text-[8px] text-gray-500 uppercase font-mono block">Duty Shifts</span>
              <span className="text-sm font-extrabold text-[#FF6B00] mt-0.5 block">{activeTrainersCount} slots</span>
            </div>
          </div>

          <div className="p-2 border border-gray-800/40 bg-gray-900/10 rounded-lg">
            <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Impact Scenario:</span>
            <p className="text-[10px] text-gray-300 leading-normal line-clamp-3">
              {riskAdvice}
            </p>
          </div>
        </div>
      </div>

      <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
        <ShieldAlert className="w-3 h-3 text-amber-500" />
        <span>Predictive analysis based on standard 4 sessions per shift capacity quota.</span>
      </div>
    </div>
  );
}

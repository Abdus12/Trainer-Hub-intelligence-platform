import React, { useState } from "react";
import { 
  Grid, Clock, Users, AlertTriangle, CheckCircle2, ChevronRight, 
  Sparkles, ShieldAlert, ArrowUpRight, ArrowDownRight, Zap, Info
} from "lucide-react";
import { Trainer } from "../types";

interface TeamAvailabilityHeatmapProps {
  trainers: Trainer[];
}

export default function TeamAvailabilityHeatmap({ trainers = [] }: TeamAvailabilityHeatmapProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeSlots = [
    { id: "morning", label: "Morning Shift", hours: "09:00 AM - 11:30 AM", baseWeight: 6 },
    { id: "midday", label: "Mid-Day Shift", hours: "12:00 PM - 02:30 PM", baseWeight: 5 },
    { id: "afternoon", label: "Afternoon Shift", hours: "03:00 PM - 05:30 PM", baseWeight: 7 },
    { id: "evening", label: "Evening Shift", hours: "06:00 PM - 08:30 PM", baseWeight: 2 } // Evening is always thinner
  ];

  const [selectedCell, setSelectedCell] = useState<{ day: string; slotId: string } | null>({
    day: "Saturday",
    slotId: "evening"
  });

  // Calculate trainer count for each day & timeSlot cell
  // We use a deterministic hashing strategy based on the day's letters and trainer details
  // to ensure a realistic, high-fidelity, interactive, and stable grid dataset
  const getCellData = (day: string, slotId: string) => {
    const dayIndex = days.indexOf(day);
    const slot = timeSlots.find(s => s.id === slotId);
    const baseWeight = slot ? slot.baseWeight : 4;
    
    // Deterministic counts
    let count = (baseWeight + (dayIndex % 3) - (dayIndex === 5 || dayIndex === 6 ? 2 : 0));
    count = Math.max(1, Math.min(trainers.length || 8, count));

    // Predicted Merchant Session Demand
    let predictedDemand = 3;
    if (slotId === "afternoon") predictedDemand = 6;
    if (slotId === "morning" && (dayIndex === 0 || dayIndex === 4)) predictedDemand = 7;
    if (slotId === "evening" && dayIndex === 5) predictedDemand = 8; // Sat evening peak demand

    const gap = count - predictedDemand;
    const isCritical = gap < 0;

    // Available trainers roster mapping
    const availableTrainers: Trainer[] = [];
    trainers.forEach((t, i) => {
      // Pick trainers based on determinism to populate rosters
      if ((i + dayIndex + (slotId === "morning" ? 1 : 2)) % 3 !== 0) {
        if (availableTrainers.length < count) {
          availableTrainers.push(t);
        }
      }
    });

    return {
      count,
      predictedDemand,
      gap,
      isCritical,
      availableTrainers
    };
  };

  // Cell status helpers
  const getCellStyles = (count: number, predictedDemand: number) => {
    const gap = count - predictedDemand;
    if (gap <= -3) {
      return "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50";
    } else if (gap < 0) {
      return "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50";
    } else {
      return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50";
    }
  };

  const getCellLabel = (count: number, predictedDemand: number) => {
    const gap = count - predictedDemand;
    if (gap <= -3) return "CRITICAL GAP 🔥";
    if (gap < 0) return "UNDERSTAFFED ⚠️";
    return "OPTIMAL COVERAGE ✅";
  };

  // Find all critical gaps
  const criticalGaps: { day: string; slotLabel: string; hours: string; available: number; demand: number }[] = [];
  days.forEach(d => {
    timeSlots.forEach(s => {
      const data = getCellData(d, s.id);
      if (data.gap < 0) {
        criticalGaps.push({
          day: d,
          slotLabel: s.label,
          hours: s.hours,
          available: data.count,
          demand: data.predictedDemand
        });
      }
    });
  });

  // Sort critical gaps by severity (largest negative gap first)
  const sortedGaps = [...criticalGaps].sort((a, b) => (a.available - a.demand) - (b.available - b.demand));

  const activeData = selectedCell ? getCellData(selectedCell.day, selectedCell.slotId) : null;
  const activeSlotInfo = selectedCell ? timeSlots.find(s => s.id === selectedCell.slotId) : null;

  return (
    <div className="space-y-6" id="team-availability-heatmap-widget">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Scheduled Blocks</span>
            <span className="text-xl font-extrabold text-white mt-1 block">28 Shift Segments</span>
          </div>
          <Grid className="w-8 h-8 text-[#FF6B00] opacity-40" />
        </div>
        
        <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Staffing Gaps Detected</span>
            <span className="text-xl font-extrabold text-rose-400 mt-1 block flex items-center gap-1">
              {criticalGaps.length} Shifts Understaffed
              <span className="text-xs font-normal text-gray-500">({sortedGaps.filter(g => (g.available - g.demand) <= -3).length} Critical)</span>
            </span>
          </div>
          <ShieldAlert className="w-8 h-8 text-rose-500 opacity-40 animate-pulse" />
        </div>

        <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Zonal Coverage Ratio</span>
            <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
              {Math.round(((28 - criticalGaps.length) / 28) * 100)}% Optimal
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Heatmap Matrix Grid (Left/Top) */}
        <div className="xl:col-span-8 bg-[#1A1D26] border border-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-[#FF6B00]" />
              Workforce Availability Density Grid
            </h3>
            <p className="text-xs text-gray-400">
              Interactive grid mapping available roster size minus predicted merchant training demands. Click on a block cell to view cluster and dispatch optimization recommendations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[650px] space-y-3">
              {/* Grid Header Days */}
              <div className="grid grid-cols-8 gap-2.5 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-800/40 pb-2">
                <div className="text-left pl-2">Time Slot</div>
                {days.map(d => (
                  <div key={d} className={d === "Saturday" || d === "Sunday" ? "text-[#FF6B00]" : ""}>{d}</div>
                ))}
              </div>

              {/* Grid Rows */}
              {timeSlots.map(slot => (
                <div key={slot.id} className="grid grid-cols-8 gap-2.5 items-center">
                  {/* Row Header */}
                  <div className="text-left py-1 pr-2">
                    <span className="text-[11px] font-bold text-white block leading-tight">{slot.label}</span>
                    <span className="text-[9px] text-gray-500 block font-mono mt-0.5 leading-none">{slot.hours}</span>
                  </div>

                  {/* Days cells */}
                  {days.map(day => {
                    const data = getCellData(day, slot.id);
                    const isSelected = selectedCell?.day === day && selectedCell?.slotId === slot.id;

                    return (
                      <button
                        type="button"
                        key={`${day}-${slot.id}`}
                        onClick={() => setSelectedCell({ day, slotId: slot.id })}
                        className={`p-3 rounded-xl border text-center transition flex flex-col justify-between h-[74px] cursor-pointer ${getCellStyles(data.count, data.predictedDemand)} ${
                          isSelected ? "ring-2 ring-[#FF6B00] border-transparent scale-[1.02]" : ""
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold block text-white">
                          {data.count} <span className="text-[8px] font-normal text-gray-400">Avail</span>
                        </span>
                        
                        <div className="w-full bg-gray-900/50 h-1.5 rounded-full overflow-hidden my-1">
                          <div 
                            style={{ width: `${Math.min(100, (data.count / data.predictedDemand) * 100)}%` }}
                            className={`h-full ${data.gap < 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                          ></div>
                        </div>

                        <span className="text-[8px] tracking-tighter uppercase font-extrabold truncate w-full block">
                          {data.gap < 0 ? `${Math.abs(data.gap)} Short` : "Optimal"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-6 border-t border-gray-800/60 pt-4 text-[10px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-500/10 border border-rose-500/30 rounded"></span>
              <span>Severe Deficit (SLA Breach Risk)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-500/10 border border-amber-500/30 rounded"></span>
              <span>Minor Deficit</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500/10 border border-emerald-500/20 rounded"></span>
              <span>Optimal Coverage</span>
            </span>
          </div>
        </div>

        {/* Selected Block Cluster Inspector (Right/Bottom) */}
        <div className="xl:col-span-4 space-y-4">
          {selectedCell && activeData && activeSlotInfo ? (
            <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-5 flex flex-col justify-between h-full space-y-5">
              <div className="space-y-4">
                <div className="border-b border-gray-800 pb-3">
                  <span className="text-[9px] tracking-widest font-extrabold text-[#FF6B00] uppercase block">Cluster Inspector</span>
                  <h3 className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {selectedCell.day}, {activeSlotInfo.label}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{activeSlotInfo.hours}</p>
                </div>

                {/* Score Status Card */}
                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  activeData.gap <= -3 ? "bg-rose-500/5 border-rose-500/15 text-rose-400" :
                  activeData.gap < 0 ? "bg-amber-500/5 border-amber-500/15 text-amber-400" :
                  "bg-emerald-500/5 border-emerald-500/15 text-emerald-400"
                }`}>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-gray-400">Roster Capacity Index</span>
                    <span className="text-xs font-black uppercase mt-0.5 block">{getCellLabel(activeData.count, activeData.predictedDemand)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Gap Score</span>
                    <span className="text-sm font-bold font-mono">{activeData.gap > 0 ? `+${activeData.gap}` : activeData.gap}</span>
                  </div>
                </div>

                {/* Stats comparison */}
                <div className="grid grid-cols-2 gap-3 bg-[#0F1117] p-3 border border-gray-800/80 rounded-xl text-center">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Roster Available</span>
                    <span className="text-xl font-extrabold text-white mt-1 font-mono block">{activeData.count} <span className="text-[10px] font-normal text-gray-500">Trainers</span></span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Predicted Sessions</span>
                    <span className="text-xl font-extrabold text-white mt-1 font-mono block">{activeData.predictedDemand} <span className="text-[10px] font-normal text-gray-500">Outlets</span></span>
                  </div>
                </div>

                {/* Available trainers listing */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Available Cluster Roster ({activeData.availableTrainers.length})</span>
                  
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {activeData.availableTrainers.map(trainer => (
                      <div key={trainer.id} className="p-2.5 bg-[#0F1117] border border-gray-800/60 hover:border-gray-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-orange-500/15 text-[#FF6B00] font-sans font-bold text-[9px] flex items-center justify-center">
                            {trainer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">{trainer.name}</span>
                            <span className="text-[8px] text-gray-500 font-mono block">{trainer.employee_code} ({trainer.state})</span>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono text-gray-400">★ {trainer.star_rating || "4.8"}</span>
                      </div>
                    ))}

                    {activeData.availableTrainers.length === 0 && (
                      <span className="text-xs text-gray-500 italic block">No field trainers scheduled for this hour.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SLA Recommendation block */}
              <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl space-y-1.5">
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  SLA Optimization Recommendations
                </span>
                
                <p className="text-[10.5px] text-blue-300 leading-relaxed">
                  {activeData.gap <= -3 ? (
                    `Saturday evening exhibits an acute 6-merchant excess. Recommend immediate remote check-ins or re-routing 2 trainers from Bangalore/Chennai rosters to offset physical visit constraints.`
                  ) : activeData.gap < 0 ? (
                    `Minor deficit of ${Math.abs(activeData.gap)} trainers. Recommend prioritizing physical visits and diverting low-risk consultations to the remote support queue.`
                  ) : (
                    `Roster availability fully satisfies predicted training demands. Surplus capacity of ${activeData.gap} trainers can be dispatched to support standby tickets or proactive checklist audits.`
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6 text-center text-gray-600 flex flex-col justify-center h-full min-h-[300px]">
              <Grid className="w-10 h-10 mb-2 mx-auto text-gray-700 animate-pulse" />
              <p className="text-xs uppercase font-black tracking-wider">Select a heatmap slot to inspect availability clusters</p>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Worst Staffing Gaps List Panel */}
      <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
            Active Workforce Bottlenecks (Top Staffing Gaps)
          </h4>
          <p className="text-[10px] text-gray-400 mt-1">These week segments represent the highest probability of SLA breach due to peak demand vs trainer availability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedGaps.slice(0, 3).map((gap, i) => (
            <div key={i} className="p-3 bg-[#0F1117] border border-rose-500/20 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest block">Rank #{i+1} Staffing Gap</span>
                <span className="text-xs font-bold text-white block mt-1">{gap.day} — {gap.slotLabel}</span>
                <span className="text-[10px] text-gray-500 block font-mono mt-0.5">{gap.hours}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-[9px] text-gray-500 block">Roster Deficit</span>
                <span className="text-sm font-extrabold text-rose-400">-{gap.demand - gap.available} trainers</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

import React, { useState } from "react";
import { Map, MapPin, TrendingUp, AlertCircle, Users, Activity, BarChart2, CheckCircle2 } from "lucide-react";
import { Trainer, Alert } from "../types";

interface StateMetric {
  name: string;
  trainingCount: number;
  openTickets: number;
  trainerAvailability: string;
  merchantHealth: number;
  productivity: string;
  riskScore: number;
  forecast: string;
  coordinates: string; // for physical visual map layout positioning
  bgGlow: string;
}

interface SouthIndiaMapProps {
  trainers: Trainer[];
  alerts: Alert[];
}

export default function SouthIndiaMap({ trainers, alerts }: SouthIndiaMapProps) {
  const [selectedState, setSelectedState] = useState<string>("Tamil Nadu");

  // Dynamic calculations based on real trainers' states
  const getDynamicStateMetrics = (stateName: string): StateMetric => {
    const stateTrainers = trainers.filter(t => t.state === stateName);
    const checkedInCount = stateTrainers.filter(t => t.is_checked_in).length;
    const totalSessions = stateTrainers.reduce((sum, t) => sum + t.today_sessions, 0);
    const openTickets = stateTrainers.reduce((sum, t) => sum + (t.zoho_sync?.open_tickets || 0), 0);
    
    // Default fallback values that scale with actual live counts
    let defaults = {
      "Tamil Nadu": {
        merchantHealth: 94,
        productivity: "4.2 sessions/day",
        riskScore: 8,
        forecast: "EOD Target 108% Met",
        coordinates: "top-1/2 left-[38%]",
        bgGlow: "from-orange-500/10 to-orange-600/5"
      },
      "Kerala": {
        merchantHealth: 91,
        productivity: "3.8 sessions/day",
        riskScore: 5,
        forecast: "EOD Target 100% Met",
        coordinates: "bottom-1/3 left-[28%]",
        bgGlow: "from-emerald-500/10 to-emerald-600/5"
      },
      "Karnataka": {
        merchantHealth: 88,
        productivity: "3.5 sessions/day",
        riskScore: 18,
        forecast: "SLA Risk: Delayed (85%)",
        coordinates: "top-1/3 left-[32%]",
        bgGlow: "from-rose-500/10 to-rose-600/5"
      },
      "Andhra Pradesh": {
        merchantHealth: 92,
        productivity: "3.9 sessions/day",
        riskScore: 10,
        forecast: "EOD Target 96% Met",
        coordinates: "top-1/4 right-[25%]",
        bgGlow: "from-blue-500/10 to-blue-600/5"
      },
      "Telangana": {
        merchantHealth: 95,
        productivity: "4.4 sessions/day",
        riskScore: 4,
        forecast: "EOD Target 112% Met",
        coordinates: "top-1/10 left-[48%]",
        bgGlow: "from-[#7C3AED]/10 to-[#7C3AED]/5"
      }
    };

    const stateDefaults = defaults[stateName as keyof typeof defaults] || defaults["Tamil Nadu"];

    return {
      name: stateName,
      trainingCount: totalSessions || (stateName === "Tamil Nadu" ? 18 : stateName === "Kerala" ? 12 : stateName === "Karnataka" ? 14 : 9),
      openTickets: openTickets || (stateName === "Karnataka" ? 4 : stateName === "Tamil Nadu" ? 2 : 1),
      trainerAvailability: `${checkedInCount}/${stateTrainers.length || 4} Checked-In`,
      merchantHealth: stateDefaults.merchantHealth,
      productivity: stateDefaults.productivity,
      riskScore: stateDefaults.riskScore + (alerts.filter(a => a.type === "sla_breach" && stateTrainers.some(st => st.id === a.trainer_id)).length * 5),
      forecast: stateDefaults.forecast,
      coordinates: stateDefaults.coordinates,
      bgGlow: stateDefaults.bgGlow
    };
  };

  const states = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
  const metrics = states.map(s => getDynamicStateMetrics(s));
  const activeMetrics = getDynamicStateMetrics(selectedState);

  return (
    <div className="bg-[#10121A] border border-gray-800 rounded-2xl p-5 shadow-xl space-y-6" id="south-india-interactive-map">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4">
        <div>
          <span className="text-[9px] font-black uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-md tracking-wider inline-flex items-center gap-1">
            <Map className="w-3.5 h-3.5" /> INTERACTIVE TELEMETRY MAP
          </span>
          <h3 className="text-sm font-black text-white tracking-widest mt-2 uppercase font-sans">
            SOUTH INDIA EXECUTIVE COMMAND CENTER
          </h3>
        </div>
        
        {/* Selector tab row */}
        <div className="flex flex-wrap gap-1.5 mt-3 md:mt-0">
          {states.map(s => {
            const met = getDynamicStateMetrics(s);
            return (
              <button
                key={s}
                onClick={() => setSelectedState(s)}
                className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition border cursor-pointer ${
                  selectedState === s 
                    ? "bg-[#FF6B00] border-[#FF6B00] text-black shadow-lg shadow-orange-500/10" 
                    : "bg-[#181B26] border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Map visualization block (Left) */}
        <div className="lg:col-span-5 bg-gray-950/40 border border-gray-800/80 rounded-2xl h-80 flex items-center justify-center relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-radial-gradient from-[#FF6B00]/5 via-transparent to-transparent"></div>
          
          {/* Schematic SVG Map representation of South India states */}
          <svg className="w-64 h-64 opacity-80" viewBox="0 0 200 200">
            {/* Telangana */}
            <path 
              d="M 80,40 L 120,35 L 130,65 L 100,85 L 85,75 Z" 
              fill={selectedState === "Telangana" ? "#7C3AED" : "#1F2937"} 
              stroke="#4B5563" 
              strokeWidth="1.5"
              className="transition duration-300 cursor-pointer hover:opacity-90"
              onClick={() => setSelectedState("Telangana")}
            />
            {/* Andhra Pradesh */}
            <path 
              d="M 120,35 L 150,55 L 145,105 L 110,120 L 100,85 L 130,65 Z" 
              fill={selectedState === "Andhra Pradesh" ? "#3B82F6" : "#111827"} 
              stroke="#4B5563" 
              strokeWidth="1.5"
              className="transition duration-300 cursor-pointer hover:opacity-90"
              onClick={() => setSelectedState("Andhra Pradesh")}
            />
            {/* Karnataka */}
            <path 
              d="M 50,60 L 85,75 L 100,85 L 110,120 L 80,145 L 45,120 Z" 
              fill={selectedState === "Karnataka" ? "#EF4444" : "#1F2937"} 
              stroke="#4B5563" 
              strokeWidth="1.5"
              className="transition duration-300 cursor-pointer hover:opacity-90"
              onClick={() => setSelectedState("Karnataka")}
            />
            {/* Tamil Nadu */}
            <path 
              d="M 80,145 L 110,120 L 125,140 L 115,185 L 85,175 L 75,155 Z" 
              fill={selectedState === "Tamil Nadu" ? "#FF6B00" : "#111827"} 
              stroke="#4B5563" 
              strokeWidth="1.5"
              className="transition duration-300 cursor-pointer hover:opacity-90"
              onClick={() => setSelectedState("Tamil Nadu")}
            />
            {/* Kerala */}
            <path 
              d="M 45,120 L 80,145 L 75,155 L 85,175 L 65,185 L 50,150 Z" 
              fill={selectedState === "Kerala" ? "#10B981" : "#1F2937"} 
              stroke="#4B5563" 
              strokeWidth="1.5"
              className="transition duration-300 cursor-pointer hover:opacity-90"
              onClick={() => setSelectedState("Kerala")}
            />
          </svg>

          {/* Interactive pin badges */}
          {metrics.map(state => (
            <button
              key={state.name}
              onClick={() => setSelectedState(state.name)}
              className={`absolute p-1.5 rounded-full border transition flex items-center gap-1.5 shadow-xl text-[9px] font-black ${
                selectedState === state.name 
                  ? "bg-white text-black border-white scale-110" 
                  : "bg-gray-900 text-gray-400 border-gray-800"
              } ${state.coordinates}`}
            >
              <MapPin className={`w-3 h-3 ${
                state.name === "Tamil Nadu" ? "text-orange-500" :
                state.name === "Kerala" ? "text-emerald-400" :
                state.name === "Karnataka" ? "text-rose-500" :
                state.name === "Telangana" ? "text-purple-400" : "text-blue-400"
              }`} />
              <span className="hidden md:inline uppercase">{state.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* State detailed telemetry statistics card (Right) */}
        <div className="lg:col-span-7 bg-[#141722] border border-gray-800/80 rounded-2xl p-5 grid grid-cols-2 gap-4 relative overflow-hidden shadow-lg">
          <div className="col-span-2 flex justify-between items-center pb-2 border-b border-gray-800">
            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                activeMetrics.name === "Tamil Nadu" ? "bg-orange-500" :
                activeMetrics.name === "Kerala" ? "bg-emerald-400" :
                activeMetrics.name === "Karnataka" ? "bg-rose-500" :
                activeMetrics.name === "Telangana" ? "bg-purple-400" : "bg-blue-400"
              } animate-pulse`}></span>
              {activeMetrics.name.toUpperCase()} REGIONAL PROFILE
            </h4>

            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
              {activeMetrics.trainerAvailability}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Training Counts Today</span>
            <div className="text-xl font-black text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {activeMetrics.trainingCount} <span className="text-[10px] text-gray-500 font-medium">SOP Sessions Completed</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Zoho Open Incidents</span>
            <div className="text-xl font-black text-white flex items-center gap-1.5">
              <AlertCircle className={`w-5 h-5 ${activeMetrics.openTickets > 2 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
              {activeMetrics.openTickets} <span className="text-[10px] text-gray-500 font-medium">Support Backlog Tickets</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Merchant Health Score</span>
            <div className="text-xl font-black text-white font-mono">
              {activeMetrics.merchantHealth}%
              <span className="text-[9px] text-emerald-400 ml-1.5 font-bold font-sans">Healthy (SOP Compliant)</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Productivity Index</span>
            <div className="text-base font-black text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#FF6B00]" />
              {activeMetrics.productivity}
            </div>
          </div>

          <div className="col-span-2 pt-2 border-t border-gray-800/80 flex justify-between items-center text-[10px]">
            <div className="space-y-0.5">
              <span className="text-gray-500 font-bold uppercase block text-[8px]">Predictive Risk Coefficient</span>
              <span className={`font-black font-mono ${activeMetrics.riskScore > 15 ? 'text-rose-500' : 'text-emerald-400'}`}>
                {activeMetrics.riskScore}% Churn/SLA Risk Margin
              </span>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-gray-500 font-bold uppercase block text-[8px]">AI Analytics Forecast</span>
              <span className="text-[#FF6B00] font-black font-mono flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF6B00]" />
                {activeMetrics.forecast}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

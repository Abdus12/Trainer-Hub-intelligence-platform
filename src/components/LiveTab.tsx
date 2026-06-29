import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { 
  MapPin, AlertCircle, RefreshCw, MessageSquare, Phone, Map, 
  Layers, Search, Target, Users, Zap, Bug, Sparkles
} from "lucide-react";
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from "recharts";
import { Trainer, Alert } from "../types";

interface LiveTabProps {
  trainers?: Trainer[];
  alerts?: Alert[];
  onRefreshState: () => void;
  onTriggerEvent: (action: string) => void;
}

export default function LiveTab({ trainers = [], alerts = [], onRefreshState, onTriggerEvent }: LiveTabProps) {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filter calculations
  const totalTrainersCount = trainers ? trainers.length : 0;
  const activeCount = trainers ? trainers.filter(t => t.is_checked_in).length : 0;
  
  // Calculate SLA status per trainer
  const getTrainerSLA = (t: Trainer) => {
    if (!t.is_checked_in) {
      if (t.check_out_time) return { status: "CHECKED_OUT", color: "bg-gray-500", text: "Checked Out" };
      return { status: "ABSENT", color: "bg-gray-700", text: "Absent / Leave" };
    }
    const sessions = t.today_sessions;
    if (sessions >= 4) return { status: "MET", color: "bg-emerald-500", text: "SLA Met" };
    if (sessions >= 2) return { status: "ON_TRACK", color: "bg-amber-500", text: "On Track" };
    return { status: "BREACH", color: "bg-rose-500", text: "SLA Breach" };
  };

  const filteredTrainers = trainers.filter(t => {
    const slaInfo = getTrainerSLA(t);
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedStateFilter === "all" || t.state === selectedStateFilter;
    const matchesStatus = selectedStatusFilter === "all" || 
                         (selectedStatusFilter === "active" && t.is_checked_in) ||
                         (selectedStatusFilter === "breach" && slaInfo.status === "BREACH" && t.is_checked_in) ||
                         (selectedStatusFilter === "checked_out" && t.check_out_time !== null);
    
    return matchesSearch && matchesState && matchesStatus;
  });

  // Calculate Zone session velocity pace (Completed sessions / Target sessions for checked in)
  const totalSessionsDone = trainers.reduce((acc, t) => acc + t.today_sessions, 0);
  const totalTargetSessions = activeCount * 4;
  const velocityPercentage = totalTargetSessions > 0 
    ? Math.min(100, Math.round((totalSessionsDone / totalTargetSessions) * 100)) 
    : 0;

  // Radial Bar Chart Data for Recharts Session Velocity Gauge
  const velocityChartData = [
    {
      name: "SLA Progress",
      value: velocityPercentage,
      fill: velocityPercentage >= 80 ? "#00C896" : (velocityPercentage >= 50 ? "#FFB020" : "#FF4444")
    }
  ];

  // Group tickets and categories for Zoho fatal issues
  // Category breakdown: Login Issue, Sync Error, Menu Error, Printer Issue
  const fatalIssues = trainers.filter(t => t.zoho_sync.fatal_issues > 0);
  const ticketCategoryCount = {
    "Login Issue": 0,
    "Sync Error": 0,
    "Menu Error": 0,
    "Printer Issue": 0
  };

  // Populate Zoho issues categories mock breakdown based on states
  fatalIssues.forEach((f, idx) => {
    const keys = Object.keys(ticketCategoryCount) as Array<keyof typeof ticketCategoryCount>;
    const category = keys[idx % keys.length];
    ticketCategoryCount[category] += 1;
  });

  const tlFatalTicketCounts = trainers.reduce<Record<string, number>>((acc, t) => {
    if (t.zoho_sync.fatal_issues > 0) {
      acc[t.team_leader] = (acc[t.team_leader] || 0) + t.zoho_sync.fatal_issues;
    }
    return acc;
  }, {
    "Anil Kumar P": 0,
    "Priya R": 0,
    "Mushtaq Ahmed": 0,
    "Shyju V": 0,
    "Kiran D": 0
  });

  const sortedTlFatal = Object.entries(tlFatalTicketCounts).sort((a, b) => b[1] - a[1]);

  // SLA breach panel sorted by severity
  const slaBreaches = trainers.filter(t => t.is_checked_in && t.today_sessions < 4).sort((a, b) => a.today_sessions - b.today_sessions);

  // Quick Action triggers
  const getWhatsAppLink = (t: Trainer) => {
    const missing = 4 - t.today_sessions;
    const msg = `Hi ${t.name}, you need ${missing} more sessions today by 6 PM to meet your SLA. Please log visits and update Petpooja Track App immediately.`;
    return `https://wa.me/${t.phone.replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`;
  };

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      // Bangalore is central to South India
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 6,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers when filtered trainers state or selectedTrainer state changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredTrainers.forEach((t) => {
      const lat = t.last_location?.lat || 12.9716;
      const lng = t.last_location?.lng || 77.5946;
      const sla = getTrainerSLA(t);

      let markerColor = "#6B7280";
      if (t.is_checked_in) {
        if (sla.status === "MET") {
          markerColor = "#10B981";
        } else if (sla.status === "ON_TRACK") {
          markerColor = "#F59E0B";
        } else {
          markerColor = "#EF4444";
        }
      }

      // Add simple pulse wrapper for breach/critical
      const pulseHtml = (t.is_checked_in && sla.status === "BREACH") 
        ? `<div class="absolute w-6 h-6 rounded-full bg-rose-500 opacity-35 animate-ping"></div>` 
        : "";

      const customIcon = L.divIcon({
        className: "bg-transparent",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            ${pulseHtml}
            <div class="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-125 cursor-pointer" style="background-color: ${markerColor}">
              <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -10]
      });

      const popupContent = `
        <div class="text-xs p-1 leading-normal font-sans">
          <div class="font-bold text-sm text-white mb-1 border-b border-gray-800 pb-1 flex justify-between items-center gap-2">
            <span>${t.name}</span>
            <span class="text-[9px] uppercase tracking-wide px-1.5 py-0.5 bg-gray-900 text-gray-400 border border-gray-800 rounded font-mono">${t.employee_code}</span>
          </div>
          <div class="space-y-1 mt-1.5 text-gray-300">
            <div><strong class="text-gray-500 font-medium">TL:</strong> <span class="text-gray-200">${t.team_leader}</span></div>
            <div><strong class="text-gray-500 font-medium">State:</strong> <span class="text-gray-200">${t.state}</span></div>
            <div><strong class="text-gray-500 font-medium">SLA:</strong> <span class="font-bold font-mono px-1 py-0.5 rounded text-[10px]" style="color: ${markerColor}; background: ${markerColor}15">${sla.text}</span></div>
            <div><strong class="text-gray-500 font-medium">Completed:</strong> <span class="font-bold text-white font-mono">${t.today_sessions} / 4</span></div>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindPopup(popupContent, { minWidth: 160 })
        .on("click", () => {
          setSelectedTrainer(t);
        });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [filteredTrainers, selectedTrainer]);

  // Handle map center fly-to when selectedTrainer changes
  useEffect(() => {
    if (selectedTrainer && mapRef.current && selectedTrainer.last_location) {
      mapRef.current.setView(
        [selectedTrainer.last_location.lat, selectedTrainer.last_location.lng],
        8,
        { animate: true, duration: 1.5 }
      );
    }
  }, [selectedTrainer]);

  // Handle dynamic map resize/invalidation
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 350);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [selectedTrainer]);

  return (
    <div className="space-y-6">
      
      {/* Top Controls Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1A1D26] p-4 border border-gray-800 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search trainer code/name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0F1117] border border-gray-800 text-gray-300 text-xs pl-9 pr-4 py-2 rounded-lg w-56 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <select 
            value={selectedStateFilter}
            onChange={(e) => setSelectedStateFilter(e.target.value)}
            className="bg-[#0F1117] border border-gray-800 text-xs text-gray-300 py-2 px-3 rounded-lg focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All States</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Kerala">Kerala</option>
            <option value="Telangana">Telangana</option>
          </select>

          <select 
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-[#0F1117] border border-gray-800 text-xs text-gray-300 py-2 px-3 rounded-lg focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Checked In)</option>
            <option value="breach">In SLA Breach</option>
            <option value="checked_out">Checked Out</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onRefreshState}
            className="p-2 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync State
          </button>
        </div>
      </div>

      {/* Grid: Map and Mini Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Real-time Interactive Map (Plotting South India Cities) */}
        <div className="xl:col-span-8 bg-[#1A1D26] border border-gray-800 rounded-xl overflow-hidden relative flex flex-col justify-between h-[520px]">
          <div className="bg-[#0F1117]/60 border-b border-gray-800 p-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-sm font-semibold text-white">South Zone Command Interactive GPS Map</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Met</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> On Track</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> SLA Breach</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500"></span> Checked Out</span>
            </div>
          </div>

          {/* Real interactive Leaflet map container */}
          <div ref={mapContainerRef} className="flex-1 min-h-[440px] relative z-0 overflow-hidden select-none" id="real-live-map">
            {/* Empty view map query warning */}
            {filteredTrainers.length === 0 && (
              <div className="absolute inset-0 bg-[#0F1117] z-10 flex items-center justify-center text-gray-500 text-xs">
                No active trainers match the current filter query.
              </div>
            )}
          </div>

          {/* Selected Trainer Inspector Panel (Bottom Drawer Style) */}
          {selectedTrainer && (
            <div className="absolute bottom-0 inset-x-0 bg-[#1A1D26] border-t border-gray-800 p-4 transition-all z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${getTrainerSLA(selectedTrainer).color}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{selectedTrainer.name}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">
                      {selectedTrainer.employee_code}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    TL: {selectedTrainer.team_leader} | State: {selectedTrainer.state}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedTrainer.screen_active ? "bg-emerald-500" : "bg-gray-500"}`}></span>
                    Device State: {selectedTrainer.screen_active ? "Screen On (Active)" : "Offline / Stale"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center md:border-l md:border-gray-800 md:pl-6">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block">SLA Target</span>
                  <span className="text-lg font-bold text-white">{selectedTrainer.today_sessions} <span className="text-xs text-gray-500">/ 4</span></span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Petpooja Compliance</span>
                  <span className="text-xs font-semibold text-gray-300">
                    {selectedTrainer.leadsquared_sync.activities_today} logged
                  </span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <a 
                  href={getWhatsAppLink(selectedTrainer)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  SLA Alert
                </a>
                <a 
                  href={`tel:${selectedTrainer.phone}`}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs rounded-lg border border-gray-700 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
                <button 
                  onClick={() => setSelectedTrainer(null)}
                  className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Mini Dash Panels */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Radial Bar Gauge: Session Velocity Progress */}
          <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5 self-start">
              <Zap className="w-4 h-4 text-amber-400" />
              SLA Session Velocity Pace
            </h3>
            
            <div className="w-48 h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="75%" 
                  outerRadius="100%" 
                  barSize={12} 
                  data={velocityChartData}
                  startAngle={180}
                  endAngle={-180}
                >
                  <RadialBar 
                    background 
                    dataKey="value" 
                    cornerRadius={6}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-white">{velocityPercentage}%</span>
                <span className="text-[10px] text-gray-500 block uppercase mt-0.5">Velocity Target</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-2 px-4 leading-relaxed">
              Zonal Pace: <span className="text-white font-semibold">{totalSessionsDone} sessions</span> completed against pacing SLA expectation of <span className="text-white font-semibold">{totalTargetSessions} sessions</span>.
            </p>
          </div>

          {/* Zoho Desk Fatal Issue Tracker */}
          <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Bug className="w-4 h-4 text-red-500" />
              Zoho Desk Ticket Pipeline
            </h3>

            {/* TL open ticket breakdown */}
            <div className="space-y-3 mb-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unresolved Blocks by TL</span>
              {sortedTlFatal.map(([tl, count]) => (
                <div key={tl} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">{tl}</span>
                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <div className="h-1.5 bg-gray-800 rounded-full flex-1 overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, (count / 10) * 100)}%` }}
                        className={`h-full rounded-full ${count > 0 ? "bg-red-500" : "bg-gray-700"}`}
                      ></div>
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${count > 0 ? 'text-red-400' : 'text-gray-500'}`}>{count}</span>
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            <div className="border-t border-gray-800 pt-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Issue Category Distribution</span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {Object.entries(ticketCategoryCount).map(([category, count]) => (
                  <div key={category} className="p-2 bg-[#0F1117] border border-gray-800 rounded-lg flex justify-between items-center">
                    <span className="text-gray-400 font-medium">{category}</span>
                    <span className={`font-bold font-mono ${count > 0 ? 'text-amber-400' : 'text-gray-600'}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* SLA Breach Panel List */}
      <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-rose-500" />
          Urgent Action Panel: SLA Breach Escalations ({slaBreaches.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2">
          {slaBreaches.map(t => {
            const gap = 4 - t.today_sessions;
            return (
              <div 
                key={t.id} 
                className="p-4 bg-[#0F1117] border border-gray-800 rounded-xl flex flex-col justify-between hover:border-gray-700 transition"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white leading-tight">{t.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded font-bold uppercase">
                      -{gap} SESS
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">TL: {t.team_leader} | State: {t.state}</p>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-400">Pace Progress:</span>
                    <span className="text-xs font-extrabold text-amber-500">{t.today_sessions} / 4</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800/60">
                  <a 
                    href={getWhatsAppLink(t)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-bold rounded-lg transition"
                  >
                    Send WhatsApp Alert
                  </a>
                  <a 
                    href={`tel:${t.phone}`}
                    className="flex items-center justify-center p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}

          {slaBreaches.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 text-xs">
              Exceptional day! No active checked-in trainers are currently breaching SLA velocity.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

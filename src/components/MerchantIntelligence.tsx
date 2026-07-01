import React, { useState } from "react";
import { 
  Building, Search, ShieldCheck, TrendingUp, AlertTriangle, Play, HelpCircle, 
  MapPin, CheckCircle2, DollarSign, RefreshCw, BarChart, FileText, ArrowUpRight
} from "lucide-react";
import { Merchant, Session, Trainer } from "../types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface MerchantIntelligenceProps {
  merchants: Merchant[];
  sessions: Session[];
  trainers: Trainer[];
}

export default function MerchantIntelligence({ merchants, sessions, trainers }: MerchantIntelligenceProps) {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    merchants.length > 0 ? merchants[0].id : null
  );

  // Helper functions for merchant training status
  const getTrainingStatusKey = (m: Merchant) => {
    const completedCount = sessions.filter(s => s.merchant_id === m.id && s.status === "completed").length;
    if (completedCount >= 3) return "fully_trained";
    if (completedCount > 0) return "partially_trained";
    return "untrained";
  };

  const getTrainingStatusLabel = (m: Merchant) => {
    const completedCount = sessions.filter(s => s.merchant_id === m.id && s.status === "completed").length;
    if (completedCount >= 3) return "Fully Trained";
    if (completedCount > 0) return "Partially Trained";
    return "Untrained (At Risk)";
  };

  // Filter merchants based on inputs
  const filteredMerchants = merchants.filter(m => {
    const statusKey = getTrainingStatusKey(m);
    const statusLabel = getTrainingStatusLabel(m);
    
    // Search can match merchant name, outlet name, contact person, city, state/zone, or training status text
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.outlet_name.toLowerCase().includes(search.toLowerCase()) ||
      m.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      m.city.toLowerCase().includes(search.toLowerCase()) ||
      m.state.toLowerCase().includes(search.toLowerCase()) ||
      statusLabel.toLowerCase().includes(search.toLowerCase());

    const matchesState = selectedState === "all" || m.state === selectedState;
    const matchesStatus = selectedStatus === "all" || statusKey === selectedStatus;

    return matchesSearch && matchesState && matchesStatus;
  });

  const activeMerchant = merchants.find(m => m.id === selectedMerchantId) || merchants[0];

  // Derive Merchant Sessions
  const merchantSessions = sessions.filter(s => s.merchant_id === activeMerchant?.id);
  const trainer = trainers.find(t => t.id === activeMerchant?.assigned_trainer_id);

  // Generate dynamic, realistic values for the Merchant 360° view based on their state/training
  const calculateHealthScore = (m: Merchant) => {
    const completedSessions = sessions.filter(s => s.merchant_id === m.id && s.status === "completed").length;
    if (completedSessions >= 3) return 96;
    if (completedSessions === 2) return 82;
    if (completedSessions === 1) return 65;
    return 48; // risk
  };

  const activeHealth = activeMerchant ? calculateHealthScore(activeMerchant) : 85;
  const isChurnRisk = activeHealth < 70;
  const renewalPrediction = activeHealth > 80 ? "Highly Likely (94%)" : activeHealth > 60 ? "Moderate (68%)" : "At Churn Risk (32%)";
  const revenuePotential = activeHealth > 85 ? "High (KDS + Aggregator Addon)" : "Medium (Online Menu Upsell)";
  const systemUptime = activeHealth > 90 ? "99.98%" : "98.42%";

  // Create demo ticket history list
  const merchantTickets = [
    { id: "TK-4021", date: "2026-06-20", issue: "Printer Connection Dropped", status: "Resolved", type: "KOT" },
    { id: "TK-3891", date: "2026-06-12", issue: "Menu Rates Mismatch on Swiggy", status: "Resolved", type: "Menu" },
    { id: "TK-4112", date: "2026-06-23", issue: "Reports Export Double Count", status: "Open", type: "Reports" }
  ].filter(t => activeHealth < 90 || t.id !== "TK-4112"); // Open ticket only if health is not optimal

  // Chart data: Monthly POS orders trend
  const trendData = [
    { month: "Jan", orders: 1200, supportTickets: 4 },
    { month: "Feb", orders: 1450, supportTickets: 2 },
    { month: "Mar", orders: 1900, supportTickets: 5 },
    { month: "Apr", orders: 2100, supportTickets: 1 },
    { month: "May", orders: 2500, supportTickets: 3 },
    { month: "Jun", orders: 2800, supportTickets: activeHealth < 70 ? 7 : 1 }
  ];

  return (
    <div className="space-y-6" id="merchant-intelligence">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Building className="w-6 h-6 text-[#FF6B00]" />
          MERCHANT INTELLIGENCE & 360° INSIGHTS
        </h1>
        <p className="text-xs text-gray-400">
          Executive CRM profiling, dynamic churn assessment, upsell indicators, and unified support-training history maps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Merchant list */}
        <div className="lg:col-span-4 bg-[#0E1118] border border-gray-800 rounded-2xl p-4 flex flex-col h-[700px]">
          <span className="text-[10px] tracking-widest font-black text-[#FF6B00] mb-3 block">
            MERCHANT OUTLETS DIRECTORY
          </span>
          
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search name, zone, state, status..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#181B26] border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select 
                value={selectedState}
                onChange={e => setSelectedState(e.target.value)}
                className="w-full bg-[#181B26] border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B00] transition"
              >
                <option value="all">All Zones / States</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
              </select>

              <select 
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-[#181B26] border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B00] transition"
              >
                <option value="all">All Statuses</option>
                <option value="fully_trained">Fully Trained</option>
                <option value="partially_trained">Partially Trained</option>
                <option value="untrained">Untrained / At Risk</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredMerchants.map(m => {
              const hScore = calculateHealthScore(m);
              const statusKey = getTrainingStatusKey(m);
              const statusLabel = getTrainingStatusLabel(m);
              
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMerchantId(m.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    selectedMerchantId === m.id 
                      ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" 
                      : "bg-[#141722] border-gray-800/60 hover:bg-[#1C1F2E] text-gray-300"
                  }`}
                >
                  <div className="truncate flex-1">
                    <h4 className="text-xs font-bold truncate text-white">{m.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{m.city}, {m.state}</span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        statusKey === "fully_trained" ? "bg-emerald-400 animate-pulse" :
                        statusKey === "partially_trained" ? "bg-amber-400" : "bg-rose-500"
                      }`} />
                      <span className="text-[9px] text-gray-400 font-medium truncate">
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-mono font-black ${
                      hScore >= 90 ? "text-emerald-400" :
                      hScore >= 75 ? "text-amber-400" : "text-rose-500"
                    }`}>
                      {hScore}%
                    </span>
                    <span className="block text-[8px] text-gray-500 uppercase mt-0.5">Health</span>
                  </div>
                </button>
              );
            })}
            {filteredMerchants.length === 0 && (
              <div className="text-center py-8 text-gray-600">No merchants matched filters.</div>
            )}
          </div>
        </div>

        {/* Right column: 360 view panel */}
        {activeMerchant ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header profile block */}
            <div className="bg-[#10121A] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF6B00] font-black text-2xl shadow-inner">
                  {activeMerchant.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white font-sans">{activeMerchant.name}</h2>
                    <span className="text-[9px] px-2 py-0.5 bg-gray-800 text-gray-400 font-mono font-bold rounded border border-gray-700">
                      ID: {activeMerchant.id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Outlet: {activeMerchant.outlet_name} | City: {activeMerchant.city}, {activeMerchant.state}
                  </p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-start md:items-end gap-3 md:gap-1">
                <span className="text-[10px] text-gray-500 uppercase font-black">ASSIGNED TRAINING OFFICER</span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {trainer ? trainer.name : "Unassigned Manager"}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">{trainer?.phone}</span>
              </div>
            </div>

            {/* Dashboard metrics widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Health card */}
              <div className="p-4 bg-[#141722] border border-gray-800 rounded-2xl flex flex-col justify-between shadow">
                <span className="text-[9px] text-gray-500 uppercase font-black">MERCHANT HEALTH SCORE</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${
                    activeHealth >= 90 ? "text-emerald-400" :
                    activeHealth >= 75 ? "text-amber-400" : "text-rose-500"
                  }`}>{activeHealth}%</span>
                  <span className="text-[9px] text-gray-400 font-medium">SOP Target Met</span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[10px]">
                  {isChurnRisk ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-400 font-bold">CRITICAL CHURN RISK</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">HEALTHY ACCOUNT</span>
                    </>
                  )}
                </div>
              </div>

              {/* Renewal prediction */}
              <div className="p-4 bg-[#141722] border border-gray-800 rounded-2xl flex flex-col justify-between shadow">
                <span className="text-[9px] text-gray-500 uppercase font-black">RENEWAL PROBABILITY</span>
                <div className="mt-2">
                  <span className="text-lg font-black text-white">{renewalPrediction}</span>
                  <span className="block text-[8px] text-gray-500 font-mono mt-1">Forecast model v3.1</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-2 block">Trigger: Completed all CRM POS stages</span>
              </div>

              {/* Upsell potential */}
              <div className="p-4 bg-[#141722] border border-gray-800 rounded-2xl flex flex-col justify-between shadow">
                <span className="text-[9px] text-gray-500 uppercase font-black">UPSELL POTENTIAL</span>
                <div className="mt-2">
                  <span className="text-sm font-black text-purple-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    {revenuePotential}
                  </span>
                  <span className="block text-[8px] text-gray-500 font-mono mt-1">Estimated MRR Uplift: INR 450</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-2 block">CRM status: Pipeline ready</span>
              </div>

              {/* System uptime */}
              <div className="p-4 bg-[#141722] border border-gray-800 rounded-2xl flex flex-col justify-between shadow">
                <span className="text-[9px] text-gray-500 uppercase font-black">POS CLOUD CONNECTOR</span>
                <div className="mt-2">
                  <span className="text-xl font-black text-white font-mono">{systemUptime}</span>
                  <span className="block text-[8px] text-emerald-400 font-mono mt-1">● Active Handshake Signal</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-2 block">Uptime based on live terminal pings</span>
              </div>
            </div>

            {/* Charts & historical logs split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left chart */}
              <div className="md:col-span-7 bg-[#10121A] border border-gray-800 rounded-2xl p-4 shadow-lg flex flex-col">
                <span className="text-[10px] tracking-widest font-black text-[#FF6B00] mb-4 block uppercase">
                  MONTHLY BILLING VOLUMES & TICKET CORRELATION
                </span>
                
                <div className="h-60 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#4B5563" fontSize={10} tickLine={false} />
                      <YAxis stroke="#4B5563" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }} />
                      <Area type="monotone" dataKey="orders" stroke="#FF6B00" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Terminal Orders" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right: Technical Support Log */}
              <div className="md:col-span-5 bg-[#10121A] border border-gray-800 rounded-2xl p-4 shadow-lg flex flex-col">
                <span className="text-[10px] tracking-widest font-black text-[#FF6B00] mb-3 block uppercase">
                  ZOHO DESK RECENT INCIDENTS
                </span>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-60 pr-1">
                  {merchantTickets.map(t => (
                    <div key={t.id} className="p-3 bg-gray-950/40 border border-gray-800/80 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-gray-500 font-bold">{t.id} - {t.date}</span>
                        <span className={`px-1.5 py-0.5 rounded font-black ${
                          t.status === "Resolved" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400 animate-pulse"
                        }`}>{t.status}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{t.issue}</h4>
                      <span className="text-[9px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-md">{t.type} Module</span>
                    </div>
                  ))}
                  {merchantTickets.length === 0 && (
                    <div className="text-center py-8 text-gray-600">Zero support incidents recorded.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section: Training Session logs completed */}
            <div className="bg-[#10121A] border border-gray-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] tracking-widest font-black text-[#FF6B00] mb-4 block uppercase">
                TRAINING PROGRAM PROGRESS (SOP COMPLIANCE)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {merchantSessions.length > 0 ? (
                  merchantSessions.map(sess => (
                    <div key={sess.id} className="p-4 bg-[#161922] border border-gray-800/80 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="text-emerald-400 w-3.5 h-3.5" />
                          Module: {sess.module}
                        </span>
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded">
                          COMPLETED
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed italic">"{sess.notes}"</p>

                      <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
                        <span>Duration: {sess.duration_minutes} mins</span>
                        <span>Date: {new Date(sess.start_time).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-6 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">No completed training modules registered yet</p>
                    <p className="text-[10px] text-gray-600 mt-1">Check trainer check-ins or log training modules in the Trainer Simulator Tab.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 bg-[#0E1118] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Building className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Select a merchant from the directory list</p>
          </div>
        )}
      </div>
    </div>
  );
}

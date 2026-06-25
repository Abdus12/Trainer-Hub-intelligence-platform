import React, { useState } from "react";
import { 
  Sparkles, ShieldAlert, AlertTriangle, Play, HelpCircle, RefreshCw, 
  CornerDownRight, CheckCircle, Zap, User, Clock, CheckSquare, MessageSquare, 
  Send, Phone, Volume2, ChevronRight, ChevronLeft, Award
} from "lucide-react";
import { Trainer, Alert, Summary } from "../types";

interface AICopilotSidebarProps {
  trainers: Trainer[];
  alerts: Alert[];
  summary: Summary | null;
  onRefreshState: () => void;
  onTriggerEvent: (action: string) => void;
}

export default function AICopilotSidebar({ trainers, alerts, summary, onRefreshState, onTriggerEvent }: AICopilotSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [nlQuery, setNlQuery] = useState("");
  const [voiceSimulating, setVoiceSimulating] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);

  // Quick automated predictive calculation simulation
  const handlePredictiveAction = (type: string) => {
    setCopilotResponse("Recalculating weights and scanning live training vectors...");
    setTimeout(() => {
      if (type === "sla") {
        setCopilotResponse("🎯 PREDICTION: SLA risk is high for 2 Karnataka trainers. Recommending shifting 1 remote session to Suresh Iyer to maintain optimal SLA counts.");
      } else if (type === "churn") {
        setCopilotResponse("🎯 PREDICTION: 1 outlet in Hyderabad reports terminal idle for 4 days. Churn risk set at 68%. Directing immediate on-site training follow-up.");
      } else if (type === "volume") {
        setCopilotResponse("🎯 PREDICTION: Estimated ticket volume for evening shift is 12 ± 2. Heavy focus on kitchen printer configuration expected.");
      } else if (type === "resource") {
        setCopilotResponse("🎯 RECOMMENDATION: Tamil Nadu region is over-utilized. Shift Venkatesh Prasad from remote support to physical site handovers for maximum yield.");
      } else {
        setCopilotResponse("🎯 Morning Briefing compiled. Sending PDF report directly to South Zone Slack / WhatsApp registry.");
      }
    }, 1000);
  };

  const handleNlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    const q = nlQuery.toLowerCase();
    setCopilotResponse("Querying Petpooja operational state...");
    setTimeout(() => {
      if (q.includes("trainer") || q.includes("who")) {
        setCopilotResponse(`Found ${trainers.length} active trainers. ${trainers.filter(t => t.is_checked_in).length} are currently checked in and running SOP sessions.`);
      } else if (q.includes("alert") || q.includes("issue")) {
        setCopilotResponse(`There are currently ${alerts.length} active zonal exceptions on the monitor, including ${alerts.filter(a => a.severity === "high").length} high priority.`);
      } else if (q.includes("ticket") || q.includes("zoho")) {
        setCopilotResponse(`Zoho Desk sync registers ${summary?.fatal_issues || 0} critical fatal escalations active in the South Zone.`);
      } else {
        setCopilotResponse(`Understood. Analyzing "${nlQuery}". Recommendations compiled and flagged inside the Action Center.`);
      }
      setNlQuery("");
    }, 800);
  };

  const triggerVoiceAssistant = () => {
    setVoiceSimulating(true);
    setCopilotResponse("Listening for South Zone voice operations protocol...");
    setTimeout(() => {
      setVoiceSimulating(false);
      setCopilotResponse("🎙️ VOICE COMMAND RECVD: 'List all checked in trainers in Tamil Nadu'. Ramanathan, Ramesh and 2 others found. GPS tracking is live.");
    }, 2000);
  };

  // Netflix-style insights items calculated dynamically
  const insights = [
    {
      id: "ins-1",
      title: `${trainers.filter(t => !t.is_checked_in).length} trainers currently offline`,
      category: "Workforce",
      conf: "98% AI Confidence",
      color: "border-l-2 border-rose-500",
      text: "Pending schedule submissions may trigger SLA breaches on the Petpooja Track App database."
    },
    {
      id: "ins-2",
      title: "Kerala region expected to meet 100% SLA target",
      category: "Performance",
      conf: "92% AI Confidence",
      color: "border-l-2 border-emerald-400",
      text: "Optimal physical routing detected. All certified field personnel logged in before 10 AM."
    },
    {
      id: "ins-3",
      title: `${alerts.filter(a => a.type === "sla_breach").length} potential SLA breaches flagged`,
      category: "SLA Risk",
      conf: "89% AI Confidence",
      color: "border-l-2 border-amber-400",
      text: "Outlets reporting delayed terminal configuration times. Initiate remote assistance."
    }
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-[#FF6B00] hover:bg-orange-600 text-black p-2.5 rounded-l-xl flex items-center justify-center font-black shadow-xl transition-all duration-300"
        title="Open AI Copilot & Action Center"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside className="w-full xl:w-96 bg-[#0E1118] border-t xl:border-t-0 xl:border-l border-gray-800/80 p-5 flex flex-col justify-between gap-6 overflow-y-auto h-full shadow-2xl relative">
      
      {/* Collapse button */}
      <button 
        onClick={() => setIsOpen(false)}
        className="absolute top-4 left-4 text-gray-500 hover:text-white transition"
        title="Minimize panel"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="space-y-6 pt-2">
        {/* Title */}
        <div className="text-right">
          <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md tracking-wider inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#7C3AED]" /> PERSISTENT CO-PILOT
          </span>
          <h2 className="text-sm font-black text-white tracking-widest mt-2 uppercase font-sans">
            AI COMMAND ENGINE
          </h2>
        </div>

        {/* Predictive control dock */}
        <div className="bg-[#121520] border border-gray-800/60 rounded-2xl p-4 space-y-3.5 shadow-inner">
          <span className="text-[9px] font-black tracking-widest text-[#FF6B00] uppercase block">
            PREDICTIVE FORECASTING TERMINAL
          </span>
          
          <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold">
            <button 
              onClick={() => handlePredictiveAction("briefing")}
              className="p-2.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 rounded-xl transition text-center cursor-pointer"
            >
              Morning Brief
            </button>
            <button 
              onClick={() => handlePredictiveAction("sla")}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl transition text-center cursor-pointer"
            >
              Predict SLA
            </button>
            <button 
              onClick={() => handlePredictiveAction("churn")}
              className="p-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20 rounded-xl transition text-center cursor-pointer"
            >
              Predict Churn
            </button>
            <button 
              onClick={() => handlePredictiveAction("volume")}
              className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl transition text-center cursor-pointer"
            >
              Predict Ticket Vol
            </button>
          </div>

          <button 
            onClick={() => handlePredictiveAction("resource")}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-[10px] uppercase rounded-xl hover:opacity-90 transition cursor-pointer"
          >
            Run Dynamic Resource Allocation
          </button>
        </div>

        {/* AI response display block */}
        {copilotResponse && (
          <div className="p-4 bg-purple-950/10 border border-purple-500/20 rounded-xl text-xs space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black text-[#7C3AED] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#7C3AED]" /> AI Agent response
              </span>
              <button onClick={() => setCopilotResponse(null)} className="text-gray-500 hover:text-white font-bold text-[9px]">✕</button>
            </div>
            <p className="text-gray-300 leading-relaxed font-medium">{copilotResponse}</p>
          </div>
        )}

        {/* Netflix-style AI Insights Feed */}
        <div className="space-y-3">
          <span className="text-[9px] font-black tracking-widest text-[#FF6B00] uppercase block">
            AI REALTIME INSIGHTS FEED
          </span>

          <div className="space-y-3.5">
            {insights.map(item => (
              <div 
                key={item.id}
                className={`p-3.5 bg-[#141722] border border-gray-800/80 rounded-2xl flex flex-col gap-1.5 transition hover:bg-[#1C1F2E] cursor-pointer ${item.color}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-bold uppercase">{item.category}</span>
                  <span className="text-[9px] text-[#7C3AED] font-black font-mono">{item.conf}</span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">{item.title}</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Center Widget */}
        <div className="space-y-3">
          <span className="text-[9px] font-black tracking-widest text-[#FF6B00] uppercase block">
            ACTION CENTER (HOT REGISTER)
          </span>

          <div className="bg-[#121520] border border-gray-800/60 rounded-2xl p-4 space-y-3 shadow-inner text-xs">
            {alerts.length > 0 ? (
              alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="p-3 bg-[#181B26] border border-gray-850 rounded-xl flex items-start gap-2.5">
                  <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg shrink-0 mt-0.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono text-gray-500 font-bold uppercase">{alert.type}</span>
                      <span className="text-[8px] font-black uppercase text-rose-400">{alert.severity}</span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-bold truncate mt-1">{alert.trainer_name}</p>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5 line-clamp-2">{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-600 uppercase font-black tracking-wider text-[9px]">
                Zero Critical Alerts Flagged
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Dynamic Voice Assistant input block */}
      <div className="border-t border-gray-800/60 pt-4 mt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[8px] text-gray-500 font-bold uppercase">Copilot Natural Query Engine</span>
          <button 
            onClick={triggerVoiceAssistant}
            className={`p-2 rounded-xl transition ${voiceSimulating ? "bg-[#7C3AED] text-white animate-pulse" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-[#FF6B00]"}`}
            title="Simulate Voice assistant input"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleNlSubmit} className="relative">
          <input 
            type="text" 
            placeholder="Ask Copilot: 'Who is checked in?'" 
            value={nlQuery}
            onChange={e => setNlQuery(e.target.value)}
            className="w-full bg-[#181B26] border border-gray-800 rounded-xl py-2 pl-3.5 pr-10 text-[11px] text-white focus:outline-none focus:border-[#7C3AED] transition"
          />
          <button 
            type="submit"
            className="absolute right-2.5 top-2 text-[#7C3AED] hover:text-[#FF6B00]"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </aside>
  );
}

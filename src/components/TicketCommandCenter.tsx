import React, { useState } from "react";
import { 
  AlertTriangle, CheckCircle, Clock, ShieldAlert, User, Search, Filter, 
  Sparkles, Send, Play, RefreshCw, Zap, ArrowRight, CornerDownRight, PlusCircle
} from "lucide-react";
import { Trainer, Session, Alert } from "../types";

interface Ticket {
  id: string;
  merchantName: string;
  priority: "critical" | "high" | "medium" | "low";
  product: string;
  ageMinutes: number;
  slaTimeLeft: number; // in minutes
  assignedTrainerId: string;
  status: "New" | "Assigned" | "In Progress" | "Waiting" | "Escalated" | "Resolved";
  aiSummary: string;
  suggestedFix: string;
}

interface TicketCommandCenterProps {
  trainers: Trainer[];
  sessions: Session[];
  alerts: Alert[];
  onRefreshState: () => void;
}

export default function TicketCommandCenter({ trainers, sessions, alerts, onRefreshState }: TicketCommandCenterProps) {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [newTicketModal, setNewTicketModal] = useState(false);
  
  // Create a base list of realistic dynamic tickets synchronized with the state
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const baseTickets: Ticket[] = [
      {
        id: "ZOHO-9128",
        merchantName: "Karthik Biryani & Grill",
        priority: "critical",
        product: "KOT Printer Sync",
        ageMinutes: 45,
        slaTimeLeft: 15,
        assignedTrainerId: "1", // Ramesh Kumar
        status: "In Progress",
        aiSummary: "The secondary kitchen printer is not receiving KOT tickets. Cloud signal reports error code ZP-404.",
        suggestedFix: "Perform manual gateway IP reset. Rebind printer to port 9100 inside local router settings."
      },
      {
        id: "ZOHO-8842",
        merchantName: "Nandu's Dhaba",
        priority: "high",
        product: "Reports Dashboard",
        ageMinutes: 120,
        slaTimeLeft: 60,
        assignedTrainerId: "2", // Suresh Iyer
        status: "Assigned",
        aiSummary: "Multi-outlet tax summary counts are double-logging on PDF export since the morning update.",
        suggestedFix: "Clear local cache database. Recalculate historical aggregated logs via the Petpooja Track utility."
      },
      {
        id: "ZOHO-9410",
        merchantName: "Sagar Ratna Cafe",
        priority: "medium",
        product: "POS Cash Drawer",
        ageMinutes: 15,
        slaTimeLeft: 165,
        assignedTrainerId: "3", // Meena Naidu
        status: "New",
        aiSummary: "Solenoid trigger failing to kick open during physical billing checkout flow.",
        suggestedFix: "Verify 24V supply connector. Toggle the physical override key to confirm mechanical integrity."
      },
      {
        id: "ZOHO-7512",
        merchantName: "Paradise Biryani Hub",
        priority: "critical",
        product: "Menu Sync",
        ageMinutes: 180,
        slaTimeLeft: -30, // Breached
        assignedTrainerId: "4", // Venkatesh Prasad
        status: "Escalated",
        aiSummary: "Online aggregator menu prices failed to update during peak hours. Customer getting old rates.",
        suggestedFix: "Force cloud webhook manual sync. Run external API clearance tool for Swiggy and Zomato integrations."
      },
      {
        id: "ZOHO-9915",
        merchantName: "Chai Point Express",
        priority: "low",
        product: "Settings",
        ageMinutes: 240,
        slaTimeLeft: 120,
        assignedTrainerId: "5", // Ananya Gowda
        status: "Waiting",
        aiSummary: "Request to configure customized receipt header logo and dynamic seasonal billing footer.",
        suggestedFix: "Upload high-res JPG under Settings -> Receipt Layout. Adjust printer width spacing to 80mm."
      },
      {
        id: "ZOHO-6012",
        merchantName: "Royal Court Family Diner",
        priority: "low",
        product: "Full Training",
        ageMinutes: 320,
        slaTimeLeft: 0,
        assignedTrainerId: "1",
        status: "Resolved",
        aiSummary: "SOP training complete for 4 billing managers. Handover checklist signed off.",
        suggestedFix: "Mark CRM status to Trained. Automated PDF Certificate sent via SMTP."
      }
    ];

    // dynamically add some tickets based on high severity alerts
    alerts.forEach((alert, i) => {
      if (alert.severity === "high" && alert.type === "fatal_issue") {
        baseTickets.push({
          id: `ZOHO-EXT-${1000 + i}`,
          merchantName: alert.message.split(" - ")[0] || "Escalated Merchant",
          priority: "critical",
          product: alert.message.includes("SLA") ? "SLA Escalation" : "Device Hardware Sync",
          ageMinutes: 10,
          slaTimeLeft: 50,
          assignedTrainerId: alert.trainer_id || "1",
          status: "Escalated",
          aiSummary: `Triggered via real-time telemetry alert: ${alert.message}`,
          suggestedFix: "Contact state representative immediately to dispatch local field trainer to outlet location."
        });
      }
    });

    return baseTickets;
  });

  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Quick state transitions inside Kanban board
  const moveTicketStatus = (ticketId: string, newStatus: Ticket["status"]) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
  };

  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newT: Ticket = {
      id: `ZOHO-${Math.floor(1000 + Math.random() * 9000)}`,
      merchantName: formData.get("merchantName") as string || "Unnamed Outlet",
      priority: formData.get("priority") as Ticket["priority"] || "medium",
      product: formData.get("product") as string || "POS Core",
      ageMinutes: 1,
      slaTimeLeft: formData.get("priority") === "critical" ? 30 : formData.get("priority") === "high" ? 60 : 180,
      assignedTrainerId: formData.get("assignedTrainerId") as string || "1",
      status: "New",
      aiSummary: formData.get("summary") as string || "Manual portal override log",
      suggestedFix: "Re-install operational profile and trigger real-time telemetry cloud handshake."
    };
    setTickets(prev => [newT, ...prev]);
    setNewTicketModal(false);
  };

  const columns: { label: string; status: Ticket["status"]; color: string; bg: string }[] = [
    { label: "NEW INBOX", status: "New", color: "text-[#00C2FF]", bg: "border-t-2 border-[#00C2FF]" },
    { label: "ASSIGNED", status: "Assigned", color: "text-amber-400", bg: "border-t-2 border-amber-400" },
    { label: "IN PROGRESS", status: "In Progress", color: "text-[#FF6B00]", bg: "border-t-2 border-[#FF6B00]" },
    { label: "WAITING", status: "Waiting", color: "text-purple-400", bg: "border-t-2 border-purple-400" },
    { label: "ESCALATED", status: "Escalated", color: "text-rose-500 font-black animate-pulse", bg: "border-t-2 border-rose-500 bg-rose-950/10" },
    { label: "RESOLVED", status: "Resolved", color: "text-emerald-400", bg: "border-t-2 border-emerald-400" }
  ];

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.merchantName.toLowerCase().includes(search.toLowerCase()) || 
                          t.id.toLowerCase().includes(search.toLowerCase()) ||
                          t.product.toLowerCase().includes(search.toLowerCase());
    const matchesProduct = selectedProduct === "all" || t.product.includes(selectedProduct);
    const matchesPriority = selectedPriority === "all" || t.priority === selectedPriority;
    return matchesSearch && matchesProduct && matchesPriority;
  });

  return (
    <div className="space-y-6" id="ticket-command-center">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#FF6B00]" />
            ZOHO DESK INTEGRATION COMMAND CENTER
          </h1>
          <p className="text-xs text-gray-400">
            Unified incident management dashboard. Live ticket SLA clocks synchronized with Petpooja Support SLAs.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setNewTicketModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-600 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 hover:opacity-90 shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            LOG NEW SUPPORT TICKET
          </button>
          <button 
            onClick={onRefreshState}
            className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 text-gray-300 transition"
            title="Force synchronization"
          >
            <RefreshCw className="w-4 h-4 text-[#FF6B00]" />
          </button>
        </div>
      </div>

      {/* Filter and Command Strip */}
      <div className="bg-[#10121A] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search tickets, merchants..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#181B26] border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#FF6B00] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs bg-[#181B26] border border-gray-800 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Product:</span>
            <select 
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none font-bold"
            >
              <option value="all">All Modules</option>
              <option value="Printer">Printer</option>
              <option value="Reports">Reports</option>
              <option value="Drawer">Drawer</option>
              <option value="Menu">Menu</option>
              <option value="SLA">SLA Escalation</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs bg-[#181B26] border border-gray-800 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Priority:</span>
            <select 
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="bg-transparent text-white border-none focus:outline-none font-bold"
            >
              <option value="all">All Priorities</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>

          <div className="text-xs font-mono font-bold text-gray-500 ml-auto md:ml-0 bg-[#0F1117] border border-gray-800 px-3 py-1.5 rounded-xl">
            Total Displayed: <span className="text-white">{filteredTickets.length}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colTickets = filteredTickets.filter(t => t.status === col.status);
          return (
            <div 
              key={col.status} 
              className={`bg-[#0E1118] border border-gray-800/80 rounded-2xl p-3 flex flex-col min-h-[500px] w-full min-w-[200px] ${col.bg}`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] tracking-widest font-black ${col.color}`}>
                  {col.label}
                </span>
                <span className="px-2 py-0.5 bg-[#1C1F2E] text-gray-400 rounded-md text-[10px] font-mono font-black">
                  {colTickets.length}
                </span>
              </div>

              {/* Ticket Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                {colTickets.map(ticket => {
                  const trainer = trainers.find(t => t.id === ticket.assignedTrainerId);
                  const isBreached = ticket.slaTimeLeft <= 0 && ticket.status !== "Resolved";
                  const isNearBreach = ticket.slaTimeLeft > 0 && ticket.slaTimeLeft <= 30;

                  return (
                    <div 
                      key={ticket.id}
                      className={`p-3 bg-[#161922] border rounded-xl hover:border-gray-700 transition duration-200 shadow flex flex-col gap-2 relative group cursor-pointer ${
                        ticket.priority === "critical" ? "border-rose-950 hover:border-rose-800" : "border-gray-800/60"
                      }`}
                      onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                    >
                      {/* Priority Tag & SLA Indicator */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                          ticket.priority === "critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          ticket.priority === "high" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          ticket.priority === "medium" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {ticket.priority}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <Clock className={`w-3 h-3 ${isBreached ? "text-rose-500 animate-pulse" : "text-gray-500"}`} />
                          <span className={`text-[9px] font-mono font-bold ${
                            isBreached ? "text-rose-400 font-extrabold" :
                            isNearBreach ? "text-amber-400 animate-pulse" :
                            "text-gray-400"
                          }`}>
                            {ticket.status === "Resolved" ? "RESOLVED" : isBreached ? "SLA BREACH" : `${ticket.slaTimeLeft}m`}
                          </span>
                        </div>
                      </div>

                      {/* Merchant and ticket ID */}
                      <div>
                        <div className="text-[10px] text-gray-500 font-mono tracking-wide">{ticket.id}</div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#FF6B00] transition line-clamp-2 mt-0.5">
                          {ticket.merchantName}
                        </h4>
                      </div>

                      {/* Product category */}
                      <div className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded-md self-start font-medium">
                        {ticket.product}
                      </div>

                      {/* Assigned trainer info */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-800/40 text-[10px] text-gray-400">
                        <div className="w-4 h-4 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-[9px]">
                          {trainer ? trainer.name.charAt(0) : <User className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{trainer ? trainer.name : "Unassigned"}</span>
                      </div>

                      {/* Expanded Summary Block */}
                      {expandedTicketId === ticket.id && (
                        <div className="mt-2 pt-2 border-t border-gray-800/60 text-[10px] space-y-2 text-gray-300 bg-gray-950/40 p-2 rounded-lg">
                          <div>
                            <span className="text-[#7C3AED] font-bold block uppercase tracking-wider text-[8px] flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> AI Case Intelligence Summary
                            </span>
                            <p className="mt-1 text-gray-300 leading-relaxed font-sans">{ticket.aiSummary}</p>
                          </div>
                          <div>
                            <span className="text-emerald-400 font-bold block uppercase tracking-wider text-[8px] flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" /> Suggested Fix Recommendation
                            </span>
                            <p className="mt-1 text-emerald-300 leading-relaxed font-sans">{ticket.suggestedFix}</p>
                          </div>
                          
                          {/* SLA timer indicator breakdown */}
                          <div className="text-[9px] text-gray-500 font-mono flex justify-between">
                            <span>Incident Age: {ticket.ageMinutes}m</span>
                            <span>Target SLA: {ticket.priority === "critical" ? "60m" : "180m"}</span>
                          </div>

                          {/* Action triggers */}
                          <div className="flex gap-1.5 pt-2">
                            {ticket.status !== "In Progress" && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveTicketStatus(ticket.id, "In Progress");
                                }}
                                className="flex-1 py-1 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black font-extrabold rounded text-[8px] uppercase tracking-wider transition text-center"
                              >
                                START FIX
                              </button>
                            )}
                            {ticket.status !== "Resolved" && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveTicketStatus(ticket.id, "Resolved");
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black font-extrabold rounded text-[8px] uppercase tracking-wider transition text-center"
                              >
                                RESOLVE
                              </button>
                            )}
                            {ticket.status !== "Escalated" && ticket.priority === "critical" && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveTicketStatus(ticket.id, "Escalated");
                                }}
                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-extrabold rounded text-[8px] uppercase transition"
                              >
                                ESCALATE
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {colTickets.length === 0 && (
                  <div className="h-28 border border-dashed border-gray-800 rounded-2xl flex items-center justify-center text-center p-4">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">
                      No tickets
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SLA Alert Ticker Banner */}
      <div className="bg-rose-950/10 border border-rose-500/20 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-rose-400 tracking-wider uppercase">SUPPORT COUPLING COMPLIANCE PROTOCOL</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
              High Priority or unresolved critical tickets that exceed 120 minutes without checked-in trainer dispatch are automatically flags inside the Petpooja Track CEO notification registry.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              // Quick resolve all criticals
              setTickets(prev => prev.map(t => t.priority === "critical" ? { ...t, status: "Resolved" } : t));
            }}
            className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition font-black text-[10px] uppercase rounded-xl cursor-pointer"
          >
            DISPATCH EXPEDITED BULK RESOLUTIONS
          </button>
        </div>
      </div>

      {/* Log Ticket Modal */}
      {newTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111420] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#181B28]">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#FF6B00]" /> Create Support Incident Record
              </h3>
              <button 
                onClick={() => setNewTicketModal(false)}
                className="text-gray-500 hover:text-white font-black font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Merchant / Outlet Outlet Name</label>
                <input 
                  type="text" 
                  name="merchantName"
                  required 
                  placeholder="e.g. Biryani Paradise Indiranagar" 
                  className="w-full bg-[#181B26] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Priority Escalation</label>
                  <select 
                    name="priority"
                    className="w-full bg-[#181B26] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-bold"
                  >
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                    <option value="high">🟠 High Priority</option>
                    <option value="critical">🔴 Critical SLA Escalation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Core System Module</label>
                  <input 
                    type="text" 
                    name="product"
                    placeholder="e.g. KOT Printer / Billing POS"
                    required
                    className="w-full bg-[#181B26] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Assign Active Trainer</label>
                <select 
                  name="assignedTrainerId"
                  className="w-full bg-[#181B26] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-bold"
                >
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.state} - {t.is_checked_in ? "Checked In" : "Offline"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Detailed Issue Summary</label>
                <textarea 
                  name="summary"
                  required 
                  rows={3}
                  placeholder="Describe failure symptoms, error codes, and local physical conditions..." 
                  className="w-full bg-[#181B26] border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:border-[#FF6B00] leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setNewTicketModal(false)}
                  className="flex-1 py-2.5 bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800 font-bold rounded-xl transition uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-[#FF6B00] text-black font-extrabold rounded-xl hover:opacity-90 transition uppercase"
                >
                  Submit Zoho Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

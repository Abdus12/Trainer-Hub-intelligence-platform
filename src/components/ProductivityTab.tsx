import React, { useState } from "react";
import { 
  TrendingUp, Award, ArrowUpRight, ArrowDownRight, Download, Mail, 
  Send, AlertCircle, RefreshCw, BarChart3, Clock, Grid, HelpCircle,
  FileCheck, Calendar, Search, Filter, Info, User, CheckCircle2, ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, 
  Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, LineChart, Line
} from "recharts";
import { Trainer, Session, EmailLog, Summary, Alert } from "../types";
import GanttSessionTimeline from "./GanttSessionTimeline";

interface ProductivityTabProps {
  trainers?: Trainer[];
  sessions?: Session[];
  emailLogs?: EmailLog[];
  summary?: Summary | null;
  alerts?: Alert[];
  isPolling: boolean;
  onTogglePolling: (val: boolean) => void;
  onRetryEmail: (logId: string) => void;
  onRefreshState: () => void;
}

export default function ProductivityTab({ 
  trainers = [], sessions: propSessions = [], emailLogs = [], summary = null, alerts = [], isPolling, onTogglePolling, onRetryEmail, onRefreshState 
}: ProductivityTabProps) {
  const [localSessions, setLocalSessions] = useState<Session[]>(propSessions);

  React.useEffect(() => {
    setLocalSessions(propSessions);
  }, [propSessions]);

  const sessions = localSessions;

  const handleUpdateSessionNotes = (sessionId: string, newNotes: string) => {
    setLocalSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: newNotes } : s));
  };

  const [selectedTLFilter, setSelectedTLFilter] = useState<string>("all");
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("name");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [emailFilter, setEmailFilter] = useState<string>("failed");

  // New interactive states
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [sessionSearch, setSessionSearch] = useState<string>("");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all");
  const [sessionStartDate, setSessionStartDate] = useState<string>("");
  const [sessionEndDate, setSessionEndDate] = useState<string>("");

  // Filter criteria for daily scorecard
  const filteredTrainers = trainers.filter(t => {
    const matchesTL = selectedTLFilter === "all" || t.team_leader === selectedTLFilter;
    const matchesState = selectedStateFilter === "all" || t.state === selectedStateFilter;
    return matchesTL && matchesState;
  });

  // Sorting logic
  const sortedTrainers = [...filteredTrainers].sort((a, b) => {
    let valA: any = a[sortField as keyof Trainer];
    let valB: any = b[sortField as keyof Trainer];

    // Handle deep properties
    if (sortField === "last_crm_update") {
      valA = new Date(a.last_crm_update).getTime();
      valB = new Date(b.last_crm_update).getTime();
    }

    if (valA === undefined || valA === null) return sortAsc ? 1 : -1;
    if (valB === undefined || valB === null) return sortAsc ? -1 : 1;

    if (typeof valA === "string") {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortAsc ? valA - valB : valB - valA;
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // CSV Exporter for Daily Scorecard
  const exportToCSV = () => {
    const headers = ["Trainer Name", "Team Leader", "State", "Employee Code", "Checked In", "Check-In Time", "Sessions Today", "SLA Status", "Last CRM Update"];
    const rows = sortedTrainers.map(t => [
      t.name,
      t.team_leader,
      t.state,
      t.employee_code,
      t.is_checked_in ? "YES" : "NO",
      t.check_in_time ? new Date(t.check_in_time).toLocaleTimeString() : "N/A",
      t.today_sessions,
      t.today_sessions >= 4 ? "MET" : "BREACH",
      t.last_crm_update ? new Date(t.last_crm_update).toLocaleTimeString() : "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Petpooja_SouthZone_DailyScorecard_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Exporter for Session Metrics & Performance Alerts
  const exportMetricsAndAlertsCSV = () => {
    // 1. Session metrics block
    const metricsHeaders = ["Metric Parameter", "Value", "Notes/Context"];
    const metricsRows = [
      ["Total Sessions Logged Today", summary?.total_sessions || 0, "All sessions completed today"],
      ["SLA Targets Met (>= 4 SESS/Day)", summary?.sla_met_count || 0, "Trainers with completed target daily volume"],
      ["SLA Target Breaches (< 4 SESS/Day)", summary?.sla_breach_count || 0, "Active trainers currently short of target volume"],
      ["Physical On-Site Visits", physicalCount, `Target is 70% of total visits (Current: ${Math.round((physicalCount / (sessions.length || 1)) * 100)}%)`],
      ["Remote Support Sessions", remoteCount, "Off-site remote setup and trainer loops"],
      ["Active Shift Check-ins", summary?.total_checkins || 0, "Trainers currently checked in"],
      ["Outbound Emails Delivered", summary?.emails_sent || 0, "Merchant confirmation SMTP logs"],
      ["Outbound Emails Failed", summary?.emails_failed || 0, "SMTP queue timeouts or errors"],
      ["Next-Day Schedule Declarations", summary?.availability_submitted_count || 0, "Mandatory schedule availability submitted"],
      ["Schedules Pending Submission", summary?.availability_missing_count || 0, "Mandatory availability missing"]
    ];

    // 2. Performance alerts block
    const alertsHeaders = ["Timestamp", "Trainer Name", "Alert Type", "Severity", "Message Description", "Resolution Status"];
    const alertsRows = alerts.map(a => [
      new Date(a.timestamp).toLocaleString("en-IN"),
      a.trainer_name,
      a.type.toUpperCase().replace("_", " "),
      a.severity.toUpperCase(),
      a.message,
      a.resolved ? "RESOLVED" : "ACTIVE"
    ]);

    // Build CSV Content
    let csvString = "PETPOOJA SOUTH ZONE OPERATIONS SUMMARY REPORT\n";
    csvString += `Generated At: ${new Date().toLocaleString("en-IN")}\n\n`;
    
    csvString += "=== SECTION 1: CORE OPERATIONAL & SESSION METRICS ===\n";
    csvString += metricsHeaders.join(",") + "\n";
    metricsRows.forEach(row => {
      const escapedRow = row.map(cell => {
        const val = String(cell);
        if (val.includes(",") || val.includes("\n") || val.includes('"')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvString += escapedRow.join(",") + "\n";
    });

    csvString += "\n=== SECTION 2: LIVE PERFORMANCE ALERTS & SLA BREACHES ===\n";
    csvString += alertsHeaders.join(",") + "\n";
    if (alertsRows.length > 0) {
      alertsRows.forEach(row => {
        const escapedRow = row.map(cell => {
          const val = String(cell);
          if (val.includes(",") || val.includes("\n") || val.includes('"')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csvString += escapedRow.join(",") + "\n";
      });
    } else {
      csvString += "No active SLA breaches or unresolved alerts detected.,,,,,\n";
    }

    // Download CSV
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Petpooja_SouthZone_SLA_Alerts_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TL Leaderboard rankings calculation
  const uniqueTLs = Array.from(new Set(trainers.map(t => t.team_leader)));
  const tlLeaderboard = uniqueTLs.map(tl => {
    const tlTrainers = trainers.filter(t => t.team_leader === tl);
    const totalSessions = tlTrainers.reduce((sum, tr) => sum + tr.today_sessions, 0);
    const avgSessions = parseFloat((totalSessions / tlTrainers.length).toFixed(2));
    const metSlaCount = tlTrainers.filter(tr => tr.today_sessions >= 4).length;
    const slaPercent = Math.round((metSlaCount / tlTrainers.length) * 100);
    const fatalCount = tlTrainers.reduce((sum, tr) => sum + tr.zoho_sync.fatal_issues, 0);

    return { tl, avgSessions, slaPercent, fatalCount };
  }).sort((a, b) => b.avgSessions - a.avgSessions);

  // Top 10 and Bottom 10 trainers
  const rankedAll = [...trainers].sort((a, b) => b.today_sessions - a.today_sessions);
  const topTrainers = rankedAll.slice(0, 8);
  const bottomTrainers = [...rankedAll].reverse().slice(0, 8).filter(t => t.is_checked_in);

  // Work Hours vs Sessions Scatter Plot Data
  // Estimate daily working hours (since checkin)
  const scatterData = trainers.filter(t => t.is_checked_in && t.check_in_time).map(t => {
    const checkInMs = new Date(t.check_in_time!).getTime();
    const hrsElapsed = Math.min(9, parseFloat(((Date.now() - checkInMs) / (1000 * 60 * 60)).toFixed(1)));
    return {
      name: t.name,
      hours: hrsElapsed,
      sessions: t.today_sessions,
      tl: t.team_leader
    };
  });

  // Physical vs Remote Split Data (Recharts Pie Chart)
  const physicalCount = sessions.filter(s => s.session_type === "physical").length;
  const remoteCount = sessions.filter(s => s.session_type === "remote").length;
  const sessionSplitData = [
    { name: "Physical Visits", value: physicalCount || 75, fill: "#FF6B00" }, // standard default if 0
    { name: "Remote Support", value: remoteCount || 25, fill: "#00C896" }
  ];

  const getSLAStyle = (sessions: number) => {
    if (sessions >= 4) return "text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded";
    if (sessions >= 2) return "text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded";
    return "text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded";
  };

  const getHeatmapColor = (count: number) => {
    if (count >= 5) return "bg-emerald-700 text-white";
    if (count >= 4) return "bg-emerald-500 text-white";
    if (count >= 2) return "bg-emerald-500/30 text-emerald-300 border border-emerald-500/20";
    if (count > 0) return "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/10";
    return "bg-gray-800/40 text-gray-600";
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1A1D26] p-4 border border-gray-800 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedTLFilter}
            onChange={(e) => setSelectedTLFilter(e.target.value)}
            className="bg-[#0F1117] border border-gray-800 text-xs text-gray-300 py-2 px-3 rounded-lg focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Teams (TL)</option>
            {uniqueTLs.map(tl => (
              <option key={tl} value={tl}>{tl}</option>
            ))}
          </select>

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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Automatic Refresh Toggle */}
          <div className="flex items-center gap-2 bg-[#0F1117] border border-gray-800 px-3 py-2 rounded-lg">
            <span className="text-[11px] text-gray-400 font-semibold select-none">Auto-Refresh:</span>
            <button 
              onClick={() => onTogglePolling(!isPolling)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                isPolling ? "bg-[#FF6B00]" : "bg-gray-700"
              }`}
              title={isPolling ? "Click to Pause live auto-refresh" : "Click to Enable live 15s auto-refresh"}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                isPolling ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider text-gray-400 select-none">
              {isPolling ? "ON" : "OFF"}
            </span>
          </div>

          <button 
            onClick={exportToCSV}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download Daily Performance Scorecard CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export Scorecard
          </button>
          <button 
            onClick={exportMetricsAndAlertsCSV}
            className="px-3 py-2 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download Session Metrics and Active Performance Alerts CSV"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Export SLA & Alerts
          </button>
          <button 
            onClick={onRefreshState}
            className="p-2 bg-[#0F1117] border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
            title="Force Manual Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gantt-style Timeline Center */}
      <GanttSessionTimeline 
        sessions={sessions} 
        trainers={trainers} 
        onUpdateSessionNotes={handleUpdateSessionNotes} 
      />

      {/* Main Grid: Heatmap & Team Leader Leaderboard */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Weekly Productivity Heatmap Matrix */}
        <div className="xl:col-span-8 bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Grid className="w-4 h-4 text-[#FF6B00]" />
            Weekly Session Volume Matrix (Trainer × Weekday)
          </h3>
          <p className="text-[11px] text-gray-400 mb-4">Historical sessions conducted this week. Color transitions from 0 (Dark Slate) to 5+ (Deep Emerald).</p>

          <div className="overflow-x-auto">
            <div className="min-w-[650px] space-y-1.5">
              {/* Table header row */}
              <div className="grid grid-cols-8 gap-1.5 text-center text-[10px] uppercase font-bold text-gray-500 pb-2 border-b border-gray-800/40">
                <div className="text-left font-semibold">Trainer</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div className="font-semibold text-gray-400">Total</div>
              </div>

              {/* Data rows */}
              <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
                {sortedTrainers.slice(0, 15).map(t => {
                  const total = t.weekly_sessions.reduce((a, b) => a + b, 0) + t.today_sessions;
                  return (
                    <div key={t.id} className="grid grid-cols-8 gap-1.5 text-center text-xs items-center py-0.5 hover:bg-[#0F1117]/20 rounded">
                      <div className="text-left font-medium text-gray-300 truncate pr-2">
                        {t.name}
                      </div>
                      {t.weekly_sessions.map((count, index) => (
                        <div key={index} className={`py-1.5 rounded-md font-mono font-bold text-[10px] ${getHeatmapColor(count)}`}>
                          {count}
                        </div>
                      ))}
                      {/* Today's column slot */}
                      <div className={`py-1.5 rounded-md font-mono font-bold text-[10px] ${getHeatmapColor(t.today_sessions)}`}>
                        {t.today_sessions}
                      </div>
                      <div className="font-mono font-bold text-white text-[11px] py-1.5 bg-gray-800/20 rounded">
                        {total}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TL Daily Performance Rankings Leaderboard */}
        <div className="xl:col-span-4 bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            Team Leader SLA Leaderboard
          </h3>

          <div className="space-y-3">
            {tlLeaderboard.map((item, index) => (
              <div 
                key={item.tl} 
                className="p-3 bg-[#0F1117] border border-gray-800 hover:border-gray-700 transition rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    index === 0 ? "bg-amber-500/10 text-amber-500" : (index === 1 ? "bg-gray-400/10 text-gray-400" : "bg-[#1A1D26] text-gray-500")
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.tl}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">SLA COMPLIANCE: {item.slaPercent}%</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block uppercase font-medium">Avg Daily SESS</span>
                  <span className="text-sm font-extrabold text-white">{item.avgSessions}</span>
                  {item.fatalCount > 0 && (
                    <span className="text-[9px] block text-red-400 mt-0.5">{item.fatalCount} Open POS blocks</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Interactive Grid: Weekly Performance Trends & Live Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Weekly Performance Trend Line Chart */}
        <div className="xl:col-span-8 bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
                Daily Session Performance Trend
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Aggregated Zonal training volume and SLA averages over the current week</p>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#FF6B00] rounded-full inline-block"></span>
                Total Sessions
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#00C896] rounded-full inline-block"></span>
                SLA Daily Average
              </span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={
                ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today (SLA)"].map((day, idx) => {
                  let totalSessions = 0;
                  if (idx < 6) {
                    totalSessions = trainers.reduce((sum, t) => sum + (t.weekly_sessions[idx] || 0), 0);
                  } else {
                    totalSessions = trainers.reduce((sum, t) => sum + t.today_sessions, 0);
                  }
                  return {
                    name: day,
                    "Total Sessions": totalSessions,
                    "Avg/Trainer": parseFloat((totalSessions / (trainers.length || 1)).toFixed(1))
                  };
                })
              } margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#555" fontSize={10} />
                <YAxis stroke="#555" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1A1D26", borderColor: "#333", color: "#FFF" }}
                  itemStyle={{ color: "#FF6B00" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="Total Sessions" stroke="#FF6B00" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Avg/Trainer" stroke="#00C896" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Performance Alerts & SLA Breaches Panel */}
        <div className="xl:col-span-4 bg-[#1A1D26] border border-gray-800 rounded-xl p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Active SLA & Performance Alerts
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Click an alert for full metadata analysis and trainer escalation profile</p>
          </div>

          <div className="flex-1 space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {alerts.slice(0, 8).map(a => (
              <div 
                key={a.id}
                onClick={() => setSelectedAlert(a)}
                className="p-3 bg-[#0F1117] hover:bg-gray-800/40 border border-[#2A1D23] hover:border-rose-500/40 transition rounded-xl cursor-pointer flex items-start gap-2.5 group"
              >
                <div className={`mt-0.5 p-1 rounded-md ${
                  a.severity === "high" 
                    ? "bg-rose-500/10 text-rose-400" 
                    : (a.severity === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400")
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-gray-400 font-mono">{a.trainer_name}</span>
                    <span className="text-[9px] text-gray-500 font-mono">{new Date(a.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium truncate group-hover:text-[#FF6B00] transition mt-0.5">{a.message}</p>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 text-gray-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mb-2" />
                <p className="text-xs font-semibold">Zonal Health Nominal</p>
                <p className="text-[10px] text-gray-600 mt-0.5">All checked-in trainers currently meeting SLA compliance.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grid: Daily Scorecard Data Table */}
      <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Trainer Daily Performance Register</h3>
            <p className="text-xs text-gray-400 mt-1">Daily metrics matching active checked-in and out registers</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider text-[10px] select-none">
                <th className="pb-3 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort("name")}>Trainer</th>
                <th className="pb-3 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort("team_leader")}>Team Leader</th>
                <th className="pb-3 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort("state")}>State</th>
                <th className="pb-3 font-semibold text-center cursor-pointer hover:text-white" onClick={() => handleSort("is_checked_in")}>Status</th>
                <th className="pb-3 font-semibold text-center cursor-pointer hover:text-white" onClick={() => handleSort("today_sessions")}>Today SESS</th>
                <th className="pb-3 font-semibold text-center">SLA Status</th>
                <th className="pb-3 font-semibold text-right cursor-pointer hover:text-white" onClick={() => handleSort("last_crm_update")}>Last CRM Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {sortedTrainers.map(t => (
                <tr key={t.id} className="hover:bg-[#0F1117]/30 transition">
                  <td className="py-3 font-medium text-white">{t.name}</td>
                  <td className="py-3 text-gray-300">{t.team_leader}</td>
                  <td className="py-3 text-gray-400">{t.state}</td>
                  <td className="py-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      t.is_checked_in 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-gray-800 text-gray-500"
                    }`}>
                      {t.is_checked_in ? "ACTIVE" : (t.check_out_time ? "CHECK OUT" : "OFFLINE")}
                    </span>
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-white text-[13px]">{t.today_sessions}</td>
                  <td className="py-3 text-center">
                    <span className={getSLAStyle(t.today_sessions)}>
                      {t.today_sessions >= 4 ? "MET" : "BREACH"}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-gray-500">
                    {t.last_crm_update ? new Date(t.last_crm_update).toLocaleTimeString("en-IN") : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Top vs Bottom Performers & Correlation/Split charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Top 8 & Bottom 8 Performers lists */}
        <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 8 Performers */}
          <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-5">
            <h4 className="text-xs font-bold text-[#00C896] uppercase tracking-wider mb-3 flex items-center gap-1">
              <Award className="w-4 h-4" />
              SLA Leaders Today (Top 8)
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {topTrainers.map(t => (
                <div key={t.id} className="p-2.5 bg-[#0F1117] rounded-lg flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">{t.name}</span>
                    <span className="text-[9px] text-gray-500">{t.team_leader}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-400">{t.today_sessions} sessions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom 8 Performers */}
          <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-5">
            <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Lagging SLA Warnings (Bottom 8)
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {bottomTrainers.map(t => (
                <div key={t.id} className="p-2.5 bg-[#0F1117] rounded-lg flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">{t.name}</span>
                    <span className="text-[9px] text-gray-500">{t.team_leader}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-rose-400">{t.today_sessions} sessions</span>
                  </div>
                </div>
              ))}
              {bottomTrainers.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-xs">
                  Nominal coverage today. No lagging SLA warnings detected.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recharts Analytics Charts: Session Split & Scatter correlation */}
        <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Physical vs Remote Visit split */}
          <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#FF6B00]" />
              Physical vs Remote Visit Split
            </h4>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionSplitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sessionSplitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1A1D26", borderColor: "#333", color: "#FFF" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              South Zone targets 70% physical on-site presence.
            </p>
          </div>

          {/* Working Hours vs Sessions Correlation */}
          <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              Hours Active vs Session Velocity
            </h4>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis type="number" dataKey="hours" name="Active Hours" unit="h" stroke="#555" fontSize={9} />
                  <YAxis type="number" dataKey="sessions" name="Sessions" unit="s" stroke="#555" fontSize={9} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#1A1D26", borderColor: "#333" }} />
                  <Scatter name="Trainers" data={scatterData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              Verifies if longer check-in times lead to higher session SLA.
            </p>
          </div>

        </div>

      </div>

      {/* Outbound Merchant Email Delivery Status Panel */}
      <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Outbound Merchant CC Ops Email Monitor</h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time mail delivery sync tracking CC internal ops receipts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setEmailFilter("all")}
              className={`px-3 py-1 rounded text-xs transition ${emailFilter === "all" ? "bg-gray-800 text-white font-bold" : "text-gray-400 hover:text-white"}`}
            >
              All Logs
            </button>
            <button 
              onClick={() => setEmailFilter("failed")}
              className={`px-3 py-1 rounded text-xs transition ${emailFilter === "failed" ? "bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20" : "text-gray-400 hover:text-white"}`}
            >
              Failed Delivery ({emailLogs.filter(e => e.status === "failed").length})
            </button>
          </div>
        </div>

        {/* Email Logs Table */}
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider text-[9px]">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Merchant</th>
                <th className="pb-3">Registered Email</th>
                <th className="pb-3">Trainer</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3">SMTP Error Logs</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {emailLogs
                .filter(log => emailFilter === "all" || log.status === emailFilter)
                .map(log => (
                  <tr key={log.id} className="hover:bg-[#0F1117]/30 transition">
                    <td className="py-2.5 font-mono text-[10px] text-gray-400">
                      {new Date(log.sent_at || Date.now()).toLocaleTimeString("en-IN")}
                    </td>
                    <td className="py-2.5 font-bold text-white">{log.merchant_name}</td>
                    <td className="py-2.5 font-mono text-gray-300">{log.to_merchant}</td>
                    <td className="py-2.5 text-gray-400">{trainers.find(tr => tr.id === log.trainer_id)?.name || "Trainer"}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "sent" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 text-rose-400 italic text-[11px] max-w-[200px] truncate" title={log.error_message || ""}>
                      {log.error_message || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-2.5 text-right">
                      {log.status === "failed" && (
                        <button 
                          onClick={() => onRetryEmail(log.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
                        >
                          Retry Delivery
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

              {emailLogs.filter(log => emailFilter === "all" || log.status === emailFilter).length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 text-xs">
                    No failed outbound SMTP reports detected in the buffer queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Zonal Session History Logs Panel */}
      <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Zonal Session History Logs</h3>
              <p className="text-xs text-gray-400 mt-0.5">Filter, track, and audit physical visits and remote sessions across the South Zone</p>
            </div>
          </div>

          {/* Controls: Search, Select, and Date pickers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Trainer Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search trainer name..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#0F1117] border border-gray-800 text-xs text-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B00] w-48"
              />
            </div>

            {/* Session Type filter */}
            <div className="flex items-center gap-1.5 bg-[#0F1117] border border-gray-800 px-3 py-1.5 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select 
                value={sessionTypeFilter}
                onChange={(e) => setSessionTypeFilter(e.target.value)}
                className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="physical">Physical Visits</option>
                <option value="remote">Remote Support</option>
              </select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1 bg-[#0F1117] border border-gray-800 px-2 py-1 rounded-lg">
              <span className="text-[10px] text-gray-500 font-mono uppercase px-1">From:</span>
              <input 
                type="date" 
                value={sessionStartDate}
                onChange={(e) => setSessionStartDate(e.target.value)}
                className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer font-mono"
              />
              <span className="text-[10px] text-gray-500 font-mono uppercase px-1">To:</span>
              <input 
                type="date" 
                value={sessionEndDate}
                onChange={(e) => setSessionEndDate(e.target.value)}
                className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer font-mono"
              />
            </div>

            {/* Reset Filters */}
            {(sessionSearch || sessionTypeFilter !== "all" || sessionStartDate || sessionEndDate) && (
              <button 
                onClick={() => {
                  setSessionSearch("");
                  setSessionTypeFilter("all");
                  setSessionStartDate("");
                  setSessionEndDate("");
                }}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Session logs table */}
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider text-[9px] select-none">
                <th className="pb-3">Session Date</th>
                <th className="pb-3">Trainer</th>
                <th className="pb-3">Merchant Restaurant</th>
                <th className="pb-3 text-center">Support Mode</th>
                <th className="pb-3 text-center">Module Covered</th>
                <th className="pb-3 text-center">Petpooja Sync</th>
                <th className="pb-3 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {sessions
                .filter(s => {
                  const matchesSearch = sessionSearch === "" || s.trainer_name.toLowerCase().includes(sessionSearch.toLowerCase());
                  const matchesType = sessionTypeFilter === "all" || s.session_type === sessionTypeFilter;
                  let matchesDate = true;
                  if (s.start_time) {
                    const sessionDate = new Date(s.start_time).toISOString().split("T")[0];
                    if (sessionStartDate && sessionDate < sessionStartDate) matchesDate = false;
                    if (sessionEndDate && sessionDate > sessionEndDate) matchesDate = false;
                  }
                  return matchesSearch && matchesType && matchesDate;
                })
                .map(s => (
                  <tr key={s.id} className="hover:bg-[#0F1117]/30 transition">
                    <td className="py-3 font-mono text-[10px] text-gray-400">
                      {new Date(s.start_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 font-medium text-white">{s.trainer_name}</td>
                    <td className="py-3 text-gray-300">
                      <span className="block font-semibold text-white">{s.merchant_name}</span>
                      <span className="text-[10px] text-gray-500">{s.notes}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        s.session_type === "physical" 
                          ? "bg-orange-500/10 text-[#FF6B00] border border-orange-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {s.session_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 bg-[#0F1117] border border-gray-800 rounded text-[10px] text-gray-300 font-semibold">
                        {s.module}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        s.leadsquared_updated 
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/10 animate-pulse"
                      }`}>
                        {s.leadsquared_updated ? "SYNCED" : "PENDING"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-gray-400 font-bold">{s.duration_minutes} Mins</td>
                  </tr>
                ))}

              {sessions.filter(s => {
                const matchesSearch = sessionSearch === "" || s.trainer_name.toLowerCase().includes(sessionSearch.toLowerCase());
                const matchesType = sessionTypeFilter === "all" || s.session_type === sessionTypeFilter;
                let matchesDate = true;
                if (s.start_time) {
                  const sessionDate = new Date(s.start_time).toISOString().split("T")[0];
                  if (sessionStartDate && sessionDate < sessionStartDate) matchesDate = false;
                  if (sessionEndDate && sessionDate > sessionEndDate) matchesDate = false;
                }
                return matchesSearch && matchesType && matchesDate;
              }).length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 text-xs">
                    No matching trainer session logs found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Metadata & Associated Trainer Profile Modal */}
      {selectedAlert && (() => {
        const associatedTrainer = trainers.find(t => t.id === selectedAlert.trainer_id || t.name === selectedAlert.trainer_name);
        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#1A1D26] border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className={`p-5 border-b border-gray-800 flex items-center justify-between ${
                selectedAlert.severity === "high" 
                  ? "bg-rose-500/10" 
                  : (selectedAlert.severity === "medium" ? "bg-amber-500/10" : "bg-blue-500/10")
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    selectedAlert.severity === "high" 
                      ? "bg-rose-500/20 text-rose-400" 
                      : (selectedAlert.severity === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400")
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-gray-900 border border-gray-800 text-gray-400 rounded-md">
                        {selectedAlert.severity.toUpperCase()} ALERT
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(selectedAlert.timestamp).toLocaleTimeString("en-IN")}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide mt-1">
                      SLA & Operational Incident Details
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-white text-sm bg-gray-900/40 hover:bg-gray-800 border border-gray-800 h-8 w-8 rounded-full flex items-center justify-center transition cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                
                {/* Alert details card */}
                <div className="p-4 bg-[#0F1117] border border-gray-800/80 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Incident Message</span>
                  <p className="text-sm text-gray-100 font-semibold leading-relaxed">{selectedAlert.message}</p>
                  <div className="pt-2 flex justify-between text-xs text-gray-400 border-t border-gray-800/40">
                    <span>Type: <strong className="text-gray-300 font-mono">{selectedAlert.type.toUpperCase().replace("_", " ")}</strong></span>
                    <span>Status: <strong className={selectedAlert.resolved ? "text-emerald-400" : "text-rose-400 animate-pulse"}>{selectedAlert.resolved ? "RESOLVED" : "ACTIVE"}</strong></span>
                  </div>
                </div>

                {/* Associated Trainer Details */}
                {associatedTrainer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800/60 pb-2">
                      <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        Assigned Field Trainer Profile
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        associatedTrainer.badge_level === "gold" 
                          ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" 
                          : (associatedTrainer.badge_level === "silver" ? "bg-gray-300/10 text-gray-300 border border-gray-300/20" : "bg-orange-500/10 text-[#FF6B00] border border-orange-500/20")
                      }`}>
                        👑 {associatedTrainer.badge_level.toUpperCase()}
                      </span>
                    </div>

                    {/* Trainer primary info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 bg-[#0F1117]/40 p-3 border border-gray-800/60 rounded-xl">
                        <div>
                          <span className="text-[10px] font-medium text-gray-500 block uppercase">Name & Code</span>
                          <span className="text-xs font-bold text-white">{associatedTrainer.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 block mt-0.5">{associatedTrainer.employee_code}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-gray-500 block uppercase mt-1">Zonal State</span>
                          <span className="text-xs font-bold text-gray-300">{associatedTrainer.state}</span>
                        </div>
                      </div>

                      <div className="space-y-2 bg-[#0F1117]/40 p-3 border border-gray-800/60 rounded-xl">
                        <div>
                          <span className="text-[10px] font-medium text-gray-500 block uppercase">Management Line</span>
                          <span className="text-xs font-bold text-white">TL: {associatedTrainer.team_leader}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-gray-500 block uppercase mt-1">Current Shift Status</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block ${
                            associatedTrainer.is_checked_in 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-gray-800 text-gray-500 border border-gray-700/55"
                          }`}>
                            {associatedTrainer.is_checked_in ? "CHECKED IN & ON-FIELD" : "OFFLINE / SHIFT END"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational stats */}
                    <div className="grid grid-cols-3 gap-3 bg-[#0F1117]/20 border border-gray-800/60 p-3 rounded-xl text-center">
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase font-medium">Today Sessions</span>
                        <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">{associatedTrainer.today_sessions}</span>
                        <span className="text-[9px] text-gray-500">SLA compliance ({associatedTrainer.today_sessions >= 4 ? "MET" : "SHORT"})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase font-medium">Customer Rating</span>
                        <span className="text-sm font-extrabold text-amber-400 font-mono mt-0.5 block">⭐ {associatedTrainer.star_rating}</span>
                        <span className="text-[9px] text-gray-500 font-medium">Zonal average: 4.3</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase font-medium">Open POS Issues</span>
                        <span className={`text-sm font-extrabold font-mono mt-0.5 block ${associatedTrainer.zoho_sync.fatal_issues > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {associatedTrainer.zoho_sync.open_tickets} / {associatedTrainer.zoho_sync.fatal_issues} Fatal
                        </span>
                        <span className="text-[9px] text-gray-500 font-medium">From Zoho desk live</span>
                      </div>
                    </div>

                    {/* Contact section */}
                    <div className="p-3 bg-gray-900/30 border border-gray-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-400 gap-1">
                      <span className="font-mono">📧 {associatedTrainer.email}</span>
                      <span className="font-mono">📞 {associatedTrainer.phone}</span>
                    </div>

                    {/* Availability Declarations */}
                    {associatedTrainer.next_day_availability ? (
                      <div className="p-3 bg-[#FF6B00]/5 border border-[#FF6B00]/10 rounded-xl space-y-1">
                        <span className="text-[9px] font-bold text-[#FF6B00] uppercase tracking-widest block">Declared Next-Day Availability</span>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white font-semibold uppercase">{associatedTrainer.next_day_availability.status}</span>
                          <span className="text-gray-400 font-mono">{associatedTrainer.next_day_availability.available_from} - {associatedTrainer.next_day_availability.available_until}</span>
                        </div>
                        {associatedTrainer.next_day_availability.notes && (
                          <p className="text-[11px] text-gray-400 italic">" {associatedTrainer.next_day_availability.notes} "</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest block">Next-Day Availability Declaration</span>
                        <p className="text-[11px] text-rose-400 font-semibold">⚠️ PENDING SUBMISSION — Trainer has not declared availability yet.</p>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    Detailed trainer records not found for this alert.
                  </div>
                )}

              </div>

              {/* Modal Footer actions */}
              <div className="p-4 bg-[#0F1117] border-t border-gray-800 flex justify-end gap-2.5">
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Dismiss View
                </button>
                {associatedTrainer && (
                  <a 
                    href={`mailto:${associatedTrainer.email}?subject=Urgent: South Zone Command SLA Alert Escalation`}
                    className="px-4 py-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Escalate to Trainer
                  </a>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}

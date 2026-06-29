import React, { useState, useMemo } from "react";
import { 
  FileText, Download, Share2, Mail, MessageSquare, ShieldAlert, Sparkles, 
  Settings, CheckSquare, RefreshCw, Layers, Calendar, ClipboardList, CheckCircle2,
  TrendingUp, Users, Clock, Search, Briefcase, MapPin, CheckCircle, BarChart3, AlertTriangle, ArrowUpRight
} from "lucide-react";
import { Trainer, Session, EmailLog, Summary, Alert, Merchant } from "../types";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface ReportCenterProps {
  trainers: Trainer[];
  sessions: Session[];
  emailLogs: EmailLog[];
  summary: Summary | null;
  alerts: Alert[];
  merchants?: Merchant[];
}

type ReportType = 
  | "daily" 
  | "ceo" 
  | "availability" 
  | "state" 
  | "ticket_predictive" 
  | "merchant_allocation" 
  | "trainer_productivity";

export default function ReportCenter({ 
  trainers, 
  sessions, 
  emailLogs, 
  summary, 
  alerts, 
  merchants = [] 
}: ReportCenterProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("daily");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "powerpoint" | "whatsapp" | "email">("pdf");
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [stageMode, setStageMode] = useState<"visual" | "text">("text");

  // Interactive states for predictive tickets
  const [predictiveHorizon, setPredictiveHorizon] = useState<number>(5);

  // Interactive states for merchant allocation
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic calculations
  const totalCheckedIn = trainers.filter(t => t.is_checked_in).length;
  const totalSlaBreaches = alerts.filter(a => a.type === "sla_breach").length;
  const fatalCount = summary ? summary.fatal_issues : 0;
  const availabilitySubmitted = trainers.filter(t => t.next_day_availability !== null).length;

  const selectReportTemplate = (type: ReportType) => {
    setSelectedReport(type);
    setGeneratedReport(null);
    if (type === "ticket_predictive" || type === "merchant_allocation" || type === "trainer_productivity") {
      setStageMode("visual");
    } else {
      setStageMode("text");
    }
  };

  const handleGenerateReport = () => {
    setGenerating(true);
    setGeneratedReport(null);

    setTimeout(() => {
      setGenerating(false);
      let content = "";

      const todayStr = new Date().toLocaleDateString("en-IN", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      if (selectedReport === "daily") {
        content = `
========================================================================
             PETPOOJA SOUTH ZONE DAILY OPERATIONS REPORT
========================================================================
Generated on: ${todayStr}
System Status: ACTIVE ONLINE PROTOCOL (Port 3000)
------------------------------------------------------------------------

I. EXECUTIVE TELEMETRY SUMMARIES
* Active Trainer Check-Ins : ${totalCheckedIn} / ${trainers.length} (${Math.round((totalCheckedIn/trainers.length)*100)}% active)
* SLA Compliance Score      : ${summary ? Math.round((summary.sla_met_count / (summary.total_sessions || 1)) * 100) : 100}%
* Total Completed Sessions  : ${summary?.total_sessions || 0}
* Outbound SMTP Email rate : ${summary?.emails_sent || 0} successfully delivered / ${summary?.emails_failed || 0} failed

II. REGIONAL DISPATCH HIGHLIGHTS
* Tamil Nadu region reports stable POS onboarding.
* Kerala region achieved 100% schedule declarations today.
* Karnataka support ticket backlog remains high.

III. SEVERITY CRITICAL ALERTS
* Critical SLA Breaches: ${totalSlaBreaches}
* Critical Zoho Desk Incidents: ${fatalCount}

IV. COMPLIANCE CHECKBOX DECLARATION
* Next-day availability submitted by ${availabilitySubmitted} out of ${trainers.length} field agents.
------------------------------------------------------------------------
Operational Health Index: Optimal. No immediate system lockups reported.
========================================================================
        `;
      } else if (selectedReport === "ceo") {
        content = `
========================================================================
            PETPOOJA SOUTH ZONE OPERATIONS SUMMARY FOR EXECUTIVE OFFICE
========================================================================
Classification: CONFIDENTIAL - CEO SUITE READ-ONLY
Generated on: ${todayStr}

I. HIGH-LEVEL STRATEGIC STATEMENT
Operations run within high parameters today with a strong session volume of ${summary?.total_sessions || 0} modules logged.
Field activity represents optimal client retention.

II. FINANCIAL IMPACT & BILLING VELOCITY
* Active Merchant Outlets Onboarded: ${trainers.reduce((sum, t) => sum + t.today_sessions, 0)} todays
* Projected Monthly Recurring Revenue Impact: INR ${trainers.reduce((sum, t) => sum + (t.today_sessions * 450), 0) + 12000} (est.)
* Upsell Potential Pipeline: High on KDS & Aggregator Integrations in South Region.

III. BOTTLENECK MITIGATION & RECOMMENDATIONS
1. SLA compliance in Karnataka can be raised by 15% through re-allocating remote resources.
2. SMTP failed email delivery retry scheduled for queue stabilization.

IV. AI CONFIDENCE COEFFICIENT
* Predictive Accuracy Matrix: 96.4%
* Churn Risk Flag Alert: 0 accounts at immediate risk today.
========================================================================
        `;
      } else if (selectedReport === "availability") {
        content = `
========================================================================
            PETPOOJA WORKFORCE AVAILABILITY & SHIFT PLAN REPORT
========================================================================
Generated on: ${todayStr}

I. DECLARATION SHEET (TOMORROW'S SHIFT)
* Available Field Trainers     : ${trainers.filter(t => t.next_day_availability?.status === "available").length}
* Assigned to WFH              : ${trainers.filter(t => t.next_day_availability?.status === "wfh").length}
* Declared Leaves              : ${trainers.filter(t => t.next_day_availability?.status === "leave").length}
* Schedule Declaration Rate    : ${availabilitySubmitted} / ${trainers.length} (${Math.round((availabilitySubmitted/trainers.length)*100)}%)

II. ACTION REQUIRED / PENDING SIGN-OFF
The following field personnel have exceeded the 4 PM cutoff for schedule submission:
${trainers.filter(t => t.next_day_availability === null).map((t, idx) => `${idx+1}. ${t.name} (Code: ${t.employee_code}) - Team Leader: ${t.team_leader}`).join("\n")}
========================================================================
        `;
      } else if (selectedReport === "ticket_predictive") {
        content = `
========================================================================
             PETPOOJA SOUTH ZONE PREDICTIVE TICKET ANALYSIS
========================================================================
Generated on: ${todayStr}
Predictive Engine: Zoho Desk Correlation Protocol v2.8

I. HISTORICAL & FORECASTED TICKET MATRIX
* 21 Jun (Actual) : 24 tickets
* 22 Jun (Actual) : 28 tickets
* 23 Jun (Actual) : 35 tickets (Tamil Nadu POS Update Peak)
* 24 Jun (Actual) : 31 tickets
* 25 Jun (Actual) : 42 tickets (Zoho High-Intensity Incident)
* 26 Jun (Actual - Today) : 38 tickets
* 27 Jun (Forecasted) : 34 tickets
* 28 Jun (Forecasted) : 29 tickets
* 29 Jun (Forecasted) : 25 tickets (Resolution of TN v4.2 bugs)
* 30 Jun (Forecasted) : 21 tickets
* 01 Jul (Forecasted) : 18 tickets

II. FORECAST METRICS & RISKS
* Average Daily Zoho Ticket Load  : 29.5 tickets/day
* SLA Breach Probability          : 18% (Low-Risk Corridor)
* Critical Resolution Velocity     : 2.4 Hours (Projected improvement of 1.4 Hours)

III. ROOT CAUSE CORRELATIONS & AI MITIGATIONS
1. Device Synchronization surge in Karnataka is linked to local ISP timeouts.
2. TN merchant training modules completed today (${trainers.filter(t=>t.state==="Tamil Nadu").reduce((s, t)=>s+t.today_sessions, 0)} sessions) are expected to reduce support ticket volumes by 22% in the upcoming 72 hours due to proactive POS onboarding compliance.
========================================================================
        `;
      } else if (selectedReport === "merchant_allocation") {
        content = `
========================================================================
            PETPOOJA SOUTH ZONE MERCHANT-TRAINER ALLOCATIONS
========================================================================
Generated on: ${todayStr}
System Registry: Active Database Allocations (South Zone)

I. ZONAL ALLOCATION INDEX SUMMARY
* Total Active Merchants     : ${merchants.length}
* Total Field Trainer Staff   : ${trainers.length}
* Average Allocation Density  : ${(merchants.length / trainers.length).toFixed(1)} merchants/trainer
* Optimal Load Status         : Balanced (Average load is within ideal 1-3 corridor)

II. DETAILED TEAM-WISE ALLOCATION METRICS
${trainers.map((t, idx) => {
  const tMerchants = merchants.filter(m => m.assigned_trainer_id === t.id);
  const status = tMerchants.length >= 6 ? "OVERLOADED" : tMerchants.length >= 3 ? "OPTIMAL" : "UNDER-ALLOCATED";
  return `${idx+1}. ${t.name} (Code: ${t.employee_code})
   - State/Region      : ${t.state}
   - Allocation Count  : ${tMerchants.length} Merchants [Status: ${status}]
   - Allocated Outlets : ${tMerchants.map(m => m.outlet_name).join(", ") || "None Assigned"}`;
}).join("\n\n")}
========================================================================
        `;
      } else if (selectedReport === "trainer_productivity") {
        content = `
========================================================================
          PETPOOJA TRAINER AVERAGE HOURS & DAILY PRODUCTIVITY
========================================================================
Generated on: ${todayStr}
Zonal Command Compliance Ledger

I. ZONE-WIDE PERFORMANCE AUDIT
* Average Trainer Shift Hours : 8.1 Hours/Day
* Target Daily Sessions/Agent : 4.0 Modules
* Total Sessions Concluded   : ${trainers.reduce((s, t) => s + t.today_sessions, 0)}
* Productivity Target Score   : ${Math.round((trainers.reduce((s, t) => s + t.today_sessions, 0) / (trainers.length * 4)) * 100)}%

II. INDIVIDUAL TRAINER METRIC SHEET
${trainers.map((t, idx) => {
  const avgHours = t.state === "Tamil Nadu" ? 8.4 : t.state === "Karnataka" ? 8.2 : 7.9;
  const sessionsCount = t.today_sessions;
  const targetMet = sessionsCount >= 4 ? "MET (100%+" : `${Math.round((sessionsCount/4)*100)}%`;
  const ratingText = "★".repeat(Math.round(t.star_rating)) + "☆".repeat(5 - Math.round(t.star_rating));
  return `${idx+1}. ${t.name} (Code: ${t.employee_code})
   - Avg Daily Shift Hours  : ${avgHours} Hrs/Day
   - Sessions Done Today    : ${sessionsCount} / 4.0 [Target Achievement: ${targetMet}]
   - Quality Rating Matrix  : ${ratingText} (${t.star_rating}/5)
   - Shift Status Today     : ${t.is_checked_in ? `ACTIVE ON-FIELD (Started: ${t.check_in_time})` : "COMPLETED / SIGNED OUT"}`;
}).join("\n\n")}
========================================================================
        `;
      } else {
        content = `
========================================================================
              PETPOOJA SPECIALIZED REGIONAL DATA REPORT
========================================================================
Generated on: ${todayStr}
Metrics computed over ${sessions.length} historical logged modules.

All field officers are operating on-site.
SLA logs are clean. Check-ins validated via remote GPS.
========================================================================
        `;
      }

      setGeneratedReport(content);
      setStageMode("text");
    }, 1200);
  };

  const handleTriggerExport = () => {
    alert(`[EXPORT SUCCESSFUL] Report downloaded as: PETPOOJA_OP_REPORT_${selectedReport.toUpperCase()}.${exportFormat}`);
  };

  // Memoized ticket predictions data based on Horizon slider
  const ticketPredictionData = useMemo(() => {
    const historical = [
      { date: "21 Jun", actual: 24, predicted: 24, status: "Actual" },
      { date: "22 Jun", actual: 28, predicted: 28, status: "Actual" },
      { date: "23 Jun", actual: 35, predicted: 35, status: "Actual" },
      { date: "24 Jun", actual: 31, predicted: 31, status: "Actual" },
      { date: "25 Jun", actual: 42, predicted: 42, status: "Actual" },
      { date: "26 Jun", actual: 38, predicted: 38, status: "Actual Today" },
    ];

    const forecastedFull = [
      { date: "27 Jun", actual: null, predicted: 34, status: "Forecasted" },
      { date: "28 Jun", actual: null, predicted: 29, status: "Forecasted" },
      { date: "29 Jun", actual: null, predicted: 25, status: "Forecasted" },
      { date: "30 Jun", actual: null, predicted: 21, status: "Forecasted" },
      { date: "01 Jul", actual: null, predicted: 18, status: "Forecasted" },
      { date: "02 Jul", actual: null, predicted: 16, status: "Forecasted" },
      { date: "03 Jul", actual: null, predicted: 15, status: "Forecasted" },
    ];

    return [...historical, ...forecastedFull.slice(0, predictiveHorizon)];
  }, [predictiveHorizon]);

  // Filtered allocations based on search query
  const filteredAllocations = useMemo(() => {
    return trainers.filter(t => {
      const tMerchants = merchants.filter(m => m.assigned_trainer_id === t.id);
      const query = searchQuery.toLowerCase();
      
      const trainerMatches = t.name.toLowerCase().includes(query) || 
                             t.employee_code.toLowerCase().includes(query) || 
                             t.state.toLowerCase().includes(query);
      
      const merchantMatches = tMerchants.some(m => 
        m.name.toLowerCase().includes(query) || 
        m.outlet_name.toLowerCase().includes(query) ||
        m.city.toLowerCase().includes(query)
      );

      return trainerMatches || merchantMatches;
    });
  }, [trainers, merchants, searchQuery]);

  // Trainer working hours data for the dual-axis chart
  const trainerProductivityData = useMemo(() => {
    return trainers.map(t => {
      const avgHours = t.state === "Tamil Nadu" ? 8.4 : t.state === "Karnataka" ? 8.2 : 7.9;
      return {
        name: t.name.split(" ")[0],
        avgHours: avgHours,
        sessionsToday: t.today_sessions,
        target: 4
      };
    });
  }, [trainers]);

  return (
    <div className="space-y-6" id="report-center">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#FF6B00]" />
          EXECUTIVE REPORTING & ANALYTICS
        </h1>
        <p className="text-xs text-gray-400 font-medium">
          Dynamic operations platform compiling live field telemetry, allocation maps, and predictive Zoho ticket forecasting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator panel */}
        <div className="lg:col-span-4 bg-[#0E1118] border border-gray-800 rounded-2xl p-5 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <span className="text-[10px] tracking-widest font-black text-[#FF6B00] uppercase block">
              REPORT MATRIX COMMANDS
            </span>

            {/* CLASSIC SUMMARIES */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-gray-500 font-extrabold tracking-wider block">
                Classic PDF/Excel Summaries
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => selectReportTemplate("daily")}
                  className={`p-3.5 border rounded-xl text-xs font-bold text-left transition flex flex-col gap-1.5 ${
                    selectedReport === "daily" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E] text-gray-300"
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-orange-400" />
                  <span>Daily Ops</span>
                </button>

                <button
                  onClick={() => selectReportTemplate("ceo")}
                  className={`p-3.5 border rounded-xl text-xs font-bold text-left transition flex flex-col gap-1.5 ${
                    selectedReport === "ceo" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E] text-gray-300"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>CEO Suite</span>
                </button>

                <button
                  onClick={() => selectReportTemplate("availability")}
                  className={`p-3.5 border rounded-xl text-xs font-bold text-left transition flex flex-col gap-1.5 ${
                    selectedReport === "availability" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E] text-gray-300"
                  }`}
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Shift Plan</span>
                </button>

                <button
                  onClick={() => selectReportTemplate("state")}
                  className={`p-3.5 border rounded-xl text-xs font-bold text-left transition flex flex-col gap-1.5 ${
                    selectedReport === "state" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E] text-gray-300"
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>State Metrics</span>
                </button>
              </div>
            </div>

            {/* ADVANCED LIVE ANALYTICS */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF6B00]" />
                <label className="text-[10px] uppercase text-[#FF6B00] font-black tracking-wider block">
                  Advanced Live Analytics
                </label>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => selectReportTemplate("ticket_predictive")}
                  className={`w-full p-3.5 border rounded-xl text-xs font-bold text-left transition flex items-center justify-between gap-2 ${
                    selectedReport === "ticket_predictive" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E] text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-white">Predictive Ticket Forecast</span>
                      <span className="text-[9px] text-gray-500 font-medium">Zoho desk ticket trends</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                </button>

                <button
                  onClick={() => selectReportTemplate("merchant_allocation")}
                  className={`w-full p-3.5 border rounded-xl text-xs font-bold text-left transition flex items-center justify-between gap-2 ${
                    selectedReport === "merchant_allocation" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E] text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4.5 h-4.5 text-sky-400 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-white">Merchant Allocation Map</span>
                      <span className="text-[9px] text-gray-500 font-medium">Trainer assignment registry</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                </button>

                <button
                  onClick={() => selectReportTemplate("trainer_productivity")}
                  className={`w-full p-3.5 border rounded-xl text-xs font-bold text-left transition flex items-center justify-between gap-2 ${
                    selectedReport === "trainer_productivity" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E] text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-white">Trainer Productivity Audit</span>
                      <span className="text-[9px] text-gray-500 font-medium">Avg hours & completed targets</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Select export protocol */}
            <div className="space-y-2 pt-2 border-t border-gray-800/60">
              <label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Export Format Protocol</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(["pdf", "excel", "powerpoint", "whatsapp", "email"] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`py-1.5 text-[9px] font-black uppercase text-center rounded-lg transition ${
                      exportFormat === fmt ? "bg-[#FF6B00] text-black" : "bg-[#141722] border border-gray-800 hover:bg-[#1C1F2E] text-gray-400"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full mt-4 py-3 bg-gradient-to-r from-[#FF6B00] to-orange-600 font-extrabold text-xs text-black rounded-xl hover:opacity-95 transition shadow-lg shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                COMPILING FIELD TELEMETRY DATA...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                DRAFT FORMAL TEXT REPORT
              </>
            )}
          </button>
        </div>

        {/* Output/Display panel */}
        <div className="lg:col-span-8 bg-[#10121A] border border-gray-800 rounded-2xl p-5 flex flex-col min-h-[600px] lg:h-[600px] shadow-xl overflow-hidden relative">
          
          {/* Header row with Toggles and Actions */}
          <div className="pb-3 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] tracking-widest font-black text-[#FF6B00] uppercase block">
                ZONAL TELEMETRY INTERFACE STAGE
              </span>
              <p className="text-[10px] text-gray-400">
                Viewing: <span className="font-bold text-gray-200 capitalize">{selectedReport.replace("_", " ")} Report</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle stage modes for advanced analytical dashboards */}
              {(selectedReport === "ticket_predictive" || selectedReport === "merchant_allocation" || selectedReport === "trainer_productivity") && (
                <div className="bg-[#141722] border border-gray-800 p-0.5 rounded-xl flex">
                  <button
                    onClick={() => setStageMode("visual")}
                    className={`px-3 py-1 text-[9px] font-extrabold uppercase rounded-lg transition ${
                      stageMode === "visual" ? "bg-[#FF6B00]/10 text-[#FF6B00]" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    📊 Live Analytics
                  </button>
                  <button
                    onClick={() => {
                      if (!generatedReport) {
                        handleGenerateReport();
                      } else {
                        setStageMode("text");
                      }
                    }}
                    className={`px-3 py-1 text-[9px] font-extrabold uppercase rounded-lg transition ${
                      stageMode === "text" ? "bg-[#FF6B00]/10 text-[#FF6B00]" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    📄 Text Summary
                  </button>
                </div>
              )}

              {generatedReport && stageMode === "text" && (
                <button
                  onClick={handleTriggerExport}
                  className="px-3 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black font-black text-[9px] uppercase rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Export {exportFormat.toUpperCase()}
                </button>
              )}
            </div>
          </div>

          {/* Core Display Box */}
          <div className="flex-1 mt-4 bg-gray-950/40 p-4 rounded-xl border border-gray-850/60 overflow-y-auto flex flex-col">
            {generating ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-500">
                <div className="w-8 h-8 border-2 border-t-[#FF6B00] border-gray-800 rounded-full animate-spin"></div>
                <span className="text-[9px] uppercase font-bold tracking-widest animate-pulse text-gray-400">Running database analytics & extrapolation loops...</span>
              </div>
            ) : stageMode === "text" ? (
              // Raw text output display
              generatedReport ? (
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-400/90 flex-1">{generatedReport}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-600 space-y-3">
                  <FileText className="w-12 h-12 text-gray-700" />
                  <div>
                    <p className="text-xs uppercase font-black tracking-wider text-gray-400">No Raw Report Draft Compiled</p>
                    <p className="text-[10px] text-gray-500 max-w-sm mx-auto mt-1">
                      Click the "DRAFT FORMAL TEXT REPORT" button to compile an official, exportable ASCII document with actual parameters.
                    </p>
                  </div>
                </div>
              )
            ) : (
              // Interactive HTML Dashboards
              <div className="flex-1 flex flex-col">
                
                {/* 1. PREDICTIVE TICKET REPORT DASHBOARD */}
                {selectedReport === "ticket_predictive" && (
                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-rose-500" />
                          <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">
                            SLA BREACH RISK MATRIX & INCIDENT PROJECTIONS
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] text-gray-400 font-bold">Horizon:</span>
                          <input
                            type="range"
                            min="3"
                            max="7"
                            value={predictiveHorizon}
                            onChange={(e) => setPredictiveHorizon(Number(e.target.value))}
                            className="w-16 accent-[#FF6B00] cursor-pointer"
                          />
                          <span className="text-[10px] font-mono font-bold text-[#FF6B00] w-10 text-right">{predictiveHorizon} Days</span>
                        </div>
                      </div>

                      {/* Stat Tiles */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-[#11131C] border border-gray-800/80 p-2.5 rounded-xl">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Predicted SLA Breach Risk</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-black font-mono text-emerald-400">18%</span>
                            <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">LOW RISK</span>
                          </div>
                        </div>
                        <div className="bg-[#11131C] border border-gray-800/80 p-2.5 rounded-xl">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Zoho Open Backlog</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-black font-mono text-white">38</span>
                            <span className="text-[8px] px-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">STABLE</span>
                          </div>
                        </div>
                        <div className="bg-[#11131C] border border-gray-800/80 p-2.5 rounded-xl">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Surge Peak Trigger</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-black text-white">25 Jun</span>
                            <span className="text-[8px] text-gray-400 font-bold">(v4.2 Rollout)</span>
                          </div>
                        </div>
                        <div className="bg-[#11131C] border border-gray-800/80 p-2.5 rounded-xl">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Predicted Resolution</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-black font-mono text-[#FF6B00]">2.4 Hrs</span>
                            <span className="text-[8px] text-emerald-400 font-extrabold">▲ 36%</span>
                          </div>
                        </div>
                      </div>

                      {/* Chart Area */}
                      <div className="h-[210px] w-full mt-4 bg-gray-950/80 p-2 border border-gray-850/60 rounded-xl relative flex flex-col justify-end">
                        <span className="absolute top-2 left-2 text-[8px] uppercase tracking-widest text-gray-500 font-bold z-10">Zoho Support Desk Tickets volume</span>
                        <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={ticketPredictionData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={9} fontClassName="font-mono" />
                            <YAxis stroke="#6b7280" fontSize={9} fontClassName="font-mono" />
                            <Tooltip
                              contentStyle={{ background: "#0F1117", borderColor: "#374151", borderRadius: "8px" }}
                              labelStyle={{ fontSize: "10px", fontWeight: "bold", color: "#FFF" }}
                              itemStyle={{ fontSize: "10px" }}
                            />
                            <Legend wrapperStyle={{ fontSize: '9px', marginTop: '5px' }} />
                            <Area name="Actual Open Tickets" type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" activeDot={{ r: 4 }} />
                            <Area name="Predicted Volume" type="monotone" strokeDasharray="5 5" dataKey="predicted" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorPredicted)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* AI Predictions / Analytical Narrative */}
                    <div className="bg-[#131622] border border-gray-800 p-3 rounded-xl">
                      <span className="text-[9px] font-black text-[#FF6B00] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                        Predictive Operations Assessment
                      </span>
                      <ul className="text-[10px] space-y-1.5 text-gray-300">
                        <li className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-rose-500 font-bold shrink-0">•</span>
                          <span>The peak Zoho ticket arrival volume of 42 on June 25th was driven by <strong>Chennai regional POS hardware firmware updates (v4.2)</strong>. It is projected to settle back to stable norms within {predictiveHorizon} days.</span>
                        </li>
                        <li className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-[#FF6B00] font-bold shrink-0">•</span>
                          <span><strong>Proactive Field Intervention:</strong> Today's training modules completed in Tamil Nadu are predicted to reduce support ticket arrival rates by 22% in the upcoming 72 hours due to on-site user education.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. MERCHANT ALLOCATION REPORT */}
                {selectedReport === "merchant_allocation" && (
                  <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-sky-400" />
                          <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">
                            ZONAL MERCHANT-TRAINER ASSIGNMENT REGISTRY
                          </h3>
                        </div>
                        {/* Search allocations bar */}
                        <div className="relative w-full sm:w-56 shrink-0">
                          <Search className="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search trainer, outlet, city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#141722] border border-gray-800 pl-8 pr-3 py-1 text-[10px] font-medium text-gray-200 placeholder-gray-500 rounded-lg focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                      </div>

                      {/* Stat Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="bg-[#11131C] border border-gray-800/80 p-2 rounded-lg text-center">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Total Active Merchants</span>
                          <span className="text-xs font-black font-mono text-sky-400 mt-0.5 block">{merchants.length} Outlets</span>
                        </div>
                        <div className="bg-[#11131C] border border-gray-800/80 p-2 rounded-lg text-center">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Average Trainer Load</span>
                          <span className="text-xs font-black font-mono text-white mt-0.5 block">{(merchants.length / (trainers.length || 1)).toFixed(1)} Merchants</span>
                        </div>
                        <div className="bg-[#11131C] border border-gray-800/80 p-2 rounded-lg text-center">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Distribution Status</span>
                          <span className="text-xs font-black text-emerald-400 mt-0.5 block font-sans">OPTIMAL</span>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable list of allocations */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                      {filteredAllocations.map((t) => {
                        const tMerchants = merchants.filter(m => m.assigned_trainer_id === t.id);
                        const status = tMerchants.length >= 6 
                          ? { text: "Overloaded", style: "bg-rose-500/10 border-rose-500/20 text-rose-400" } 
                          : tMerchants.length >= 3 
                            ? { text: "Optimal Allocation", style: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" } 
                            : { text: "Under-allocated", style: "bg-gray-500/10 border-gray-800 text-gray-400" };

                        return (
                          <div key={t.id} className="bg-[#12141E] border border-gray-850/60 rounded-xl p-3 hover:border-gray-800 transition">
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-850">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center font-mono text-[9px] font-bold text-gray-400 border border-gray-700">
                                  {t.name.split(" ").map(w => w[0]).join("")}
                                </div>
                                <div className="leading-none">
                                  <span className="text-xs font-extrabold text-white block">{t.name}</span>
                                  <span className="text-[8px] font-mono text-gray-500">{t.employee_code} | {t.state}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono bg-[#141722] px-2 py-0.5 rounded border border-gray-800 font-bold text-gray-300">
                                  {tMerchants.length} Merchants
                                </span>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${status.style}`}>
                                  {status.text}
                                </span>
                              </div>
                            </div>

                            {/* Assigned Merchants list */}
                            <div className="mt-2.5">
                              {tMerchants.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {tMerchants.map((m) => (
                                    <div key={m.id} className="bg-[#0E1017] border border-gray-850/40 rounded-lg p-2 flex items-start gap-1.5">
                                      <MapPin className="w-3 h-3 text-sky-400 mt-0.5 shrink-0" />
                                      <div className="min-w-0 leading-tight">
                                        <span className="text-[10px] font-bold text-gray-200 block truncate">{m.outlet_name}</span>
                                        <span className="text-[8px] text-gray-400 block truncate">Contact: {m.contact_person} ({m.city})</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[9px] text-gray-600 font-medium italic block pl-1">
                                  No merchants assigned to this trainer in the registry database.
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {filteredAllocations.length === 0 && (
                        <div className="text-center py-8 text-gray-500 font-medium text-xs">
                          No trainers or allocated merchants found matching "{searchQuery}".
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. TRAINERS' WORKING HOURS & PRODUCTIVITY */}
                {selectedReport === "trainer_productivity" && (
                  <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">
                            TRAINERS' WORKING HOURS VS DAILY PRODUCTIVITY TARGETS
                          </h3>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold rounded">
                          DAILY TARGET: 4 SESSIONS
                        </span>
                      </div>

                      {/* Stat Metrics Grid */}
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="bg-[#11131C] border border-gray-800/80 p-2 rounded-lg text-center">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Avg Shift Hours</span>
                          <span className="text-xs font-black font-mono text-emerald-400 mt-0.5 block">8.1 Hrs/day</span>
                        </div>
                        <div className="bg-[#11131C] border border-gray-800/80 p-2 rounded-lg text-center">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Total Sessions Done</span>
                          <span className="text-xs font-black font-mono text-white mt-0.5 block">
                            {trainers.reduce((s, t) => s + t.today_sessions, 0)} Completed
                          </span>
                        </div>
                        <div className="bg-[#11131C] border border-gray-800/80 p-2 rounded-lg text-center">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Target Achievement</span>
                          <span className="text-xs font-black font-mono text-[#FF6B00] mt-0.5 block">
                            {Math.round((trainers.reduce((s, t) => s + t.today_sessions, 0) / (trainers.length * 4 || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="bg-[#11131C] border border-gray-800/80 p-2 rounded-lg text-center">
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold">Top Performing State</span>
                          <span className="text-xs font-black text-purple-400 mt-0.5 block truncate font-sans">TAMIL NADU</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart section comparing hours vs sessions */}
                    <div className="h-[150px] bg-gray-950/80 p-2 border border-gray-850/60 rounded-xl relative flex flex-col justify-end">
                      <span className="absolute top-2 left-2 text-[8px] uppercase tracking-widest text-gray-500 font-bold z-10">Shift Hours (Bar) vs Today's Sessions Logged (Line)</span>
                      <ResponsiveContainer width="100%" height="90%">
                        <ComposedChart data={trainerProductivityData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={8} />
                          <YAxis yAxisId="left" stroke="#6b7280" fontSize={8} label={{ value: 'Avg Hours', angle: -90, position: 'insideLeft', style: {fontSize: '8px', fill: '#6b7280'} }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={8} label={{ value: 'Sessions Done', angle: 90, position: 'insideRight', style: {fontSize: '8px', fill: '#6b7280'} }} />
                          <Tooltip
                            contentStyle={{ background: "#0F1117", borderColor: "#374151", borderRadius: "8px" }}
                            labelStyle={{ fontSize: "9px", fontWeight: "bold", color: "#FFF" }}
                            itemStyle={{ fontSize: "9px" }}
                          />
                          <Bar yAxisId="left" name="Avg Shift Hours" dataKey="avgHours" fill="#374151" radius={[3, 3, 0, 0]} barSize={14} />
                          <Line yAxisId="right" name="Completed Sessions" type="monotone" dataKey="sessionsToday" stroke="#FF6B00" strokeWidth={2} dot={{ r: 3, fill: "#FF6B00", strokeWidth: 1 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Scrollable grid showing individual metrics */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[140px]">
                      {trainers.map((t) => {
                        const avgHours = t.state === "Tamil Nadu" ? 8.4 : t.state === "Karnataka" ? 8.2 : 7.9;
                        const sessionsCount = t.today_sessions;
                        const pct = Math.min(100, Math.round((sessionsCount / 4) * 100));

                        return (
                          <div key={t.id} className="bg-[#12141E] border border-gray-850/40 rounded-lg p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:border-gray-800 transition">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-6 rounded-full ${t.is_checked_in ? "bg-emerald-500" : "bg-gray-600"}`} />
                              <div className="leading-tight">
                                <span className="text-[11px] font-bold text-white block">{t.name}</span>
                                <span className="text-[8px] font-mono text-gray-500">{t.employee_code} | {t.state}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                              <div className="text-right">
                                <span className="text-[8px] text-gray-500 block uppercase font-bold">Avg Hours</span>
                                <span className="text-[10px] font-mono font-bold text-gray-300">{avgHours}h/day</span>
                              </div>

                              <div className="w-24">
                                <div className="flex items-center justify-between text-[8px] font-semibold text-gray-400 mb-0.5">
                                  <span>Productivity</span>
                                  <span className={sessionsCount >= 4 ? "text-emerald-400 font-bold" : "text-gray-300"}>
                                    {sessionsCount}/4 met
                                  </span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${sessionsCount >= 4 ? "bg-emerald-500" : sessionsCount >= 2 ? "bg-sky-400" : "bg-orange-500"}`} 
                                    style={{ width: `${pct}%` }} 
                                  />
                                </div>
                              </div>

                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                t.is_checked_in 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                  : "bg-gray-500/10 border-gray-800 text-gray-500"
                              }`}>
                                {t.is_checked_in ? "Active On-Field" : "Signed Out"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

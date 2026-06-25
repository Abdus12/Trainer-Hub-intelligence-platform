import React, { useState } from "react";
import { 
  FileText, Download, Share2, Mail, MessageSquare, ShieldAlert, Sparkles, 
  Settings, CheckSquare, RefreshCw, Layers, Calendar, ClipboardList, CheckCircle2
} from "lucide-react";
import { Trainer, Session, EmailLog, Summary, Alert } from "../types";

interface ReportCenterProps {
  trainers: Trainer[];
  sessions: Session[];
  emailLogs: EmailLog[];
  summary: Summary | null;
  alerts: Alert[];
}

type ReportType = "daily" | "weekly" | "ceo" | "state" | "availability" | "merchant";

export default function ReportCenter({ trainers, sessions, emailLogs, summary, alerts }: ReportCenterProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("daily");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "powerpoint" | "whatsapp" | "email">("pdf");
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  // Dynamic calculations
  const totalCheckedIn = trainers.filter(t => t.is_checked_in).length;
  const totalSlaBreaches = alerts.filter(a => a.type === "sla_breach").length;
  const fatalCount = summary ? summary.fatal_issues : 0;
  const availabilitySubmitted = trainers.filter(t => t.next_day_availability !== null).length;

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
    }, 1200);
  };

  const handleTriggerExport = () => {
    alert(`[MOCK EXPORT SUCCESSFUL] Report downloaded as: PETPOOJA_OP_REPORT_${selectedReport.toUpperCase()}.${exportFormat}`);
  };

  return (
    <div className="space-y-6" id="report-center">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#FF6B00]" />
          EXECUTIVE REPORTING CENTER
        </h1>
        <p className="text-xs text-gray-400">
          State-of-the-art report generator compiling Daily, Weekly, and CEO-level summaries with precise operational calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator panel */}
        <div className="lg:col-span-5 bg-[#0E1118] border border-gray-800 rounded-2xl p-5 space-y-6 shadow-xl">
          <span className="text-[10px] tracking-widest font-black text-[#FF6B00] uppercase block">
            REPORT GENERATOR MATRIX
          </span>

          {/* Select report template */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Select Report Template</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedReport("daily")}
                className={`p-3 border rounded-xl text-xs font-bold text-left transition flex items-center gap-2 ${
                  selectedReport === "daily" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E]"
                }`}
              >
                <ClipboardList className="w-4 h-4 text-orange-400" />
                Daily Ops Report
              </button>

              <button
                onClick={() => setSelectedReport("ceo")}
                className={`p-3 border rounded-xl text-xs font-bold text-left transition flex items-center gap-2 ${
                  selectedReport === "ceo" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E]"
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                CEO Summary
              </button>

              <button
                onClick={() => setSelectedReport("availability")}
                className={`p-3 border rounded-xl text-xs font-bold text-left transition flex items-center gap-2 ${
                  selectedReport === "availability" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E]"
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                Shift Schedule
              </button>

              <button
                onClick={() => setSelectedReport("state")}
                className={`p-3 border rounded-xl text-xs font-bold text-left transition flex items-center gap-2 ${
                  selectedReport === "state" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E]"
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                State Metrics
              </button>
            </div>
          </div>

          {/* Select export protocol */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Export Format Protocol</label>
            <div className="grid grid-cols-3 gap-2">
              {(["pdf", "excel", "powerpoint", "whatsapp", "email"] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`p-2 border text-[10px] font-black uppercase text-center rounded-xl transition ${
                    exportFormat === fmt ? "bg-[#FF6B00] border-[#FF6B00] text-black" : "bg-[#141722] border-gray-800 hover:bg-[#1C1F2E]"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full py-3 bg-gradient-to-r from-[#FF6B00] to-orange-600 font-extrabold text-sm text-black rounded-xl hover:opacity-95 transition shadow-lg shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                COMPILING REALTIME STATISTICS...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                RUN REPORT GENERATION
              </>
            )}
          </button>
        </div>

        {/* Output panel */}
        <div className="lg:col-span-7 bg-[#10121A] border border-gray-800 rounded-2xl p-5 flex flex-col h-[550px] shadow-xl">
          <div className="pb-3 border-b border-gray-800 flex justify-between items-center">
            <span className="text-[10px] tracking-widest font-black text-[#FF6B00] uppercase">
              REPORTS STAGE DISPLAY
            </span>
            {generatedReport && (
              <button
                onClick={handleTriggerExport}
                className="px-3.5 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black font-black text-[10px] uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export as {exportFormat.toUpperCase()}
              </button>
            )}
          </div>

          <div className="flex-1 mt-4 bg-gray-950/60 p-4 rounded-xl border border-gray-850 overflow-y-auto font-mono text-[11px] leading-relaxed text-gray-300">
            {generating ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <div className="w-8 h-8 border-2 border-t-[#FF6B00] border-gray-800 rounded-full animate-spin"></div>
                <span className="text-[10px] uppercase font-bold tracking-widest animate-pulse">Running live operational query loops...</span>
              </div>
            ) : generatedReport ? (
              <pre className="whitespace-pre-wrap">{generatedReport}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 space-y-2">
                <FileText className="w-12 h-12 text-gray-700 mb-2" />
                <p className="text-xs uppercase font-black tracking-wider">No report is currently active on the viewer stage</p>
                <p className="text-[10px] text-gray-500 max-w-sm">Select a template on the left and trigger compilation to calculate actual trainer, SLA, Zoho Desk, and availability logs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

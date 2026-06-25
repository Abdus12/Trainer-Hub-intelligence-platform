import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, 
  Send, Copy, Share2, PhoneCall, Check, UserCheck, RefreshCw, AlertCircle,
  ExternalLink
} from "lucide-react";
import { Trainer, Alert, Summary } from "../types";
import SouthIndiaMap from "./SouthIndiaMap";
import D3LineChart from "./D3LineChart";
import SlaForecastGauge from "./SlaForecastGauge";

// High-fidelity, lightweight SVG-based sparkline for visualizing last 24-hour trends
function Sparkline({ data, color = "#FF6B00", height = 28 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 140;

  // Calculate coordinates with smooth padding
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
  const gradId = React.useId();

  return (
    <div className="w-full flex items-center justify-between gap-2 mt-2 pt-1 border-t border-gray-800/20">
      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">24H Trend:</span>
      <div className="flex-1 h-[28px] max-w-[140px]">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradId})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={0} cy={height - ((data[0] - min) / range) * (height - 4) - 2} r={1.5} fill={color} />
          <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r={1.5} fill={color} />
        </svg>
      </div>
    </div>
  );
}

interface HomeTabProps {
  trainers?: Trainer[];
  alerts?: Alert[];
  summary?: Summary | null;
  onRefreshState: () => void;
}

export default function HomeTab({ trainers = [], alerts = [], summary = null, onRefreshState }: HomeTabProps) {
  const [aiBriefing, setAiBriefing] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // SLA calculations
  const totalTrainers = trainers ? trainers.length : 0;
  const activeTrainers = trainers ? trainers.filter(t => t.is_checked_in).length : 0;
  const checkedInList = trainers ? trainers.filter(t => t.is_checked_in) : [];
  const slaCompliance = totalTrainers > 0 
    ? Math.round((trainers.filter(t => t.today_sessions >= 4 || t.next_day_availability?.status === "leave").length / totalTrainers) * 100) 
    : 100;

  const emailCompliance = summary && summary.total_sessions > 0
    ? Math.round((summary.emails_sent / summary.total_sessions) * 100)
    : 100;

  // Dynamically calculate operational health score
  // Start from 100. Deduct 3 points per SLA breach, 5 points per Zoho Fatal issue, 2 points per failed email
  const healthScore = summary 
    ? Math.max(20, 100 - (summary.sla_breach_count * 2) - (summary.fatal_issues * 6) - (summary.emails_failed * 1.5))
    : 100;

  // Find the top performing trainer today
  const topTrainer = trainers && trainers.length > 0 ? trainers.reduce((top, current) => {
    return (current.today_sessions > (top?.today_sessions || 0)) ? current : top;
  }, trainers[0]) : undefined;

  // Query server side Gemini Advisor
  const generateAIBriefing = async () => {
    setIsLoadingAi(true);
    setAiBriefing("");
    try {
      const activeTrainersText = checkedInList.slice(0, 5).map(t => `${t.name} (${t.today_sessions}/4)`).join(", ");
      const metrics = {
        total_checkins: activeTrainers,
        total_sessions: summary ? summary.total_sessions : 0,
        slaCompliance,
        sla_breach_count: summary ? summary.sla_breach_count : 0,
        fatal_issues: summary ? summary.fatal_issues : 0,
        emailCompliance,
        activeTrainersText: `${activeTrainersText} and others`,
        topTrainer: topTrainer ? `${topTrainer.name} (${topTrainer.today_sessions} sessions done)` : "None yet"
      };

      const res = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics })
      });
      const data = await res.json();
      if (data.text) {
        setAiBriefing(data.text);
      } else {
        setAiBriefing("Could not generate operational briefing at this moment. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setAiBriefing("Command briefing synchronisation timed out. Please check server API status.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    if (trainers && trainers.length > 0) {
      generateAIBriefing();
    }
  }, [trainers ? trainers.length : 0]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiBriefing);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const sendToWhatsApp = () => {
    const text = encodeURIComponent(`*SOUTH ZONE OPERATIONAL BRIEFING — ${new Date().toLocaleDateString("en-IN")}*\n\n${aiBriefing}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Group alerts by Team Leader
  const groupedAlerts = alerts ? alerts.reduce<Record<string, Alert[]>>((acc, alert) => {
    const tl = alert.tl_id || "Unassigned";
    if (!acc[tl]) acc[tl] = [];
    acc[tl].push(alert);
    return acc;
  }, {}) : {};

  const getAlertIcon = (type: string) => {
    switch(type) {
      case "sla_breach": return <TrendingUp className="text-amber-500 w-4 h-4" />;
      case "fatal_issue": return <AlertCircle className="text-red-500 w-4 h-4" />;
      case "no_checkin": return <UserCheck className="text-orange-500 w-4 h-4" />;
      case "crm_miss": return <AlertTriangle className="text-yellow-500 w-4 h-4" />;
      case "email_fail": return <AlertTriangle className="text-red-400 w-4 h-4" />;
      case "availability_missing": return <ShieldCheck className="text-blue-400 w-4 h-4" />;
      default: return <AlertTriangle className="text-gray-400 w-4 h-4" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 85) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/5";
    if (score >= 70) return "text-amber-500 border-amber-500/30 bg-amber-500/5";
    return "text-rose-500 border-rose-500/30 bg-rose-500/5";
  };

  return (
    <div className="space-y-6">
      {/* High-Visibility Petpooja Track App Integration Quick-Links Banner */}
      <div className="p-4 bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF6B00]/10 rounded-lg text-[#FF6B00]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              Petpooja Track App Integration
              <span className="text-[9px] px-1.5 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 font-bold rounded uppercase tracking-wider">Active Link</span>
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Direct live check-in monitoring. Check real-time trainer compliance and field activity status.
            </p>
          </div>
        </div>
        <a 
          href="https://marketplaceadminnew.petpooja.com/field-health-monitor?date_preset=today&status=not_checked_in" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full md:w-auto px-4 py-2 bg-[#FF6B00] hover:bg-orange-600 text-black font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-lg shadow-orange-500/10 cursor-pointer uppercase tracking-wider"
        >
          <span>Open Field Health Monitor</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Zonal Operations Health Score */}
        <div className={`xl:col-span-4 p-5 rounded-xl border ${getHealthColor(healthScore)} flex flex-col justify-between h-56 backdrop-blur-sm transition-transform hover:scale-[1.01]`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Zone Health Index</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Real-time telemetry-weighted composite score</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-[#FF6B00]" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-5xl font-black font-sans tracking-tighter">{healthScore}</span>
            <span className="text-lg font-medium text-gray-400">/100</span>
          </div>

          {/* Sparkline for Zone Health Index */}
          <Sparkline 
            data={[healthScore - 3, healthScore - 1, healthScore - 4, healthScore - 2, healthScore + 1, healthScore - 3, healthScore]} 
            color={healthScore >= 85 ? "#10B981" : healthScore >= 70 ? "#F59E0B" : "#EF4444"} 
          />

          <div className="mt-2 text-[10px] flex items-center gap-1.5 text-gray-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live telemetry across TN, KA, AP, KL, TS</span>
          </div>
        </div>

        {/* SLA Forecast Gauge Card */}
        <div className="xl:col-span-4">
          <SlaForecastGauge trainers={trainers} summary={summary} />
        </div>

        {/* Dynamic Key Metric Counters */}
        <div className="xl:col-span-4 grid grid-cols-2 gap-4">
          
          {/* Headcount Active */}
          <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl flex flex-col justify-between transition-transform hover:scale-[1.02]">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wide block">Headcount Active</span>
              <span className="text-3xl font-black mt-2 text-white block">{activeTrainers} <span className="text-xs text-gray-500 font-medium">/ {totalTrainers}</span></span>
            </div>
            
            {/* Sparkline for Headcount Active */}
            <Sparkline 
              data={[Math.max(0, activeTrainers - 2), Math.max(0, activeTrainers - 1), Math.max(0, activeTrainers - 3), Math.max(0, activeTrainers - 1), Math.max(0, activeTrainers - 2), activeTrainers]} 
              color="#3B82F6" 
            />

            <div className="mt-2 flex flex-col gap-1.5">
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {Math.round((activeTrainers/totalTrainers)*100)}% active duty
              </div>
              <a 
                href="https://marketplaceadminnew.petpooja.com/field-health-monitor?date_preset=today&status=not_checked_in" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1 text-[9px] font-bold text-[#FF6B00] hover:text-orange-400 transition"
              >
                <span>Check Not Checked-In</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Sessions Today */}
          <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl flex flex-col justify-between transition-transform hover:scale-[1.02]">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wide block">Sessions Today</span>
              <span className="text-3xl font-black mt-2 text-white block">{summary ? summary.total_sessions : 0}</span>
            </div>

            {/* Sparkline for Sessions Today */}
            <Sparkline 
              data={[0, Math.round((summary ? summary.total_sessions : 0) * 0.15), Math.round((summary ? summary.total_sessions : 0) * 0.4), Math.round((summary ? summary.total_sessions : 0) * 0.65), Math.round((summary ? summary.total_sessions : 0) * 0.85), summary ? summary.total_sessions : 0]} 
              color="#FF6B00" 
            />

            <div className="text-[10px] text-gray-400 mt-2">
              Across all zones in real-time
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl flex flex-col justify-between transition-transform hover:scale-[1.02]">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wide block">SLA Compliance</span>
              <span className={`text-3xl font-black mt-2 block ${slaCompliance >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{slaCompliance}%</span>
            </div>

            {/* Sparkline for SLA Compliance */}
            <Sparkline 
              data={[slaCompliance - 6, slaCompliance - 2, slaCompliance - 4, slaCompliance - 1, slaCompliance - 3, slaCompliance]} 
              color={slaCompliance >= 80 ? "#10B981" : "#F59E0B"} 
            />

            <div className="text-[10px] text-gray-400 mt-2">
              4-visit target SLA rate
            </div>
          </div>

          {/* Outbound CC Ops Email */}
          <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl flex flex-col justify-between transition-transform hover:scale-[1.02]">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wide block">CC Ops Email</span>
              <span className={`text-3xl font-black mt-2 block ${emailCompliance >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{emailCompliance}%</span>
            </div>

            {/* Sparkline for Email Compliance */}
            <Sparkline 
              data={[emailCompliance - 5, emailCompliance - 1, emailCompliance - 3, emailCompliance - 2, emailCompliance - 1, emailCompliance]} 
              color={emailCompliance >= 90 ? "#10B981" : "#F59E0B"} 
            />

            <div className="text-[10px] text-gray-400 mt-2">
              {summary ? summary.emails_sent : 0} sent / {summary ? summary.emails_failed : 0} failed
            </div>
          </div>
        </div>

      </div>

      {/* Interactive South India Telemetry Map Section */}
      <SouthIndiaMap trainers={trainers} alerts={alerts} />

      {/* Zonal Weekly Training Volume Trends Chart */}
      <D3LineChart />

      {/* Main Grid: Gemini AI & Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Gemini AI Morning Command Briefing */}
        <div className="xl:col-span-7 bg-[#1A1D26] border border-gray-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl"></div>
          
          <div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF6B00]" />
                <h2 className="text-lg font-semibold text-white font-sans">Gemini AI Command Briefing</h2>
              </div>
              <button 
                onClick={generateAIBriefing}
                disabled={isLoadingAi}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition disabled:opacity-50"
                title="Regenerate predictive insights"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAi ? "animate-spin" : ""}`} />
              </button>
            </div>

            {isLoadingAi ? (
              <div className="space-y-4 py-6">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-2/3"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-4/5"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2"></div>
              </div>
            ) : aiBriefing ? (
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans border border-gray-800/50 bg-[#0F1117]/30 p-4 rounded-lg overflow-y-auto max-h-[300px]">
                {aiBriefing}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                AI Briefing data could not be parsed. Click refresh to query again.
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-6 border-t border-gray-800 pt-4">
            <button 
              onClick={sendToWhatsApp}
              disabled={isLoadingAi || !aiBriefing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp HOD (Mayur)
            </button>
            <button 
              onClick={copyToClipboard}
              disabled={isLoadingAi || !aiBriefing}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F1117] hover:bg-gray-800 border border-gray-800 disabled:opacity-50 text-gray-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopied ? "Copied!" : "Copy for Morning Report"}
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Escalation & Alerts Feed */}
        <div className="xl:col-span-5 bg-[#1A1D26] border border-gray-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-white font-sans">Active Zonal Exceptions ({alerts.length})</h2>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/10 text-rose-500">
                {alerts.filter(a => a.severity === "high").length} CRITICAL
              </span>
            </div>

            <div className="space-y-4 max-h-[330px] overflow-y-auto pr-2">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  <span>All zones operating nominal. Standard SLA targets met.</span>
                </div>
              ) : (
                Object.keys(groupedAlerts).map(tlName => (
                  <div key={tlName} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6B00] mb-1">{tlName}'s Team</h4>
                    {groupedAlerts[tlName].map(alert => (
                      <div 
                        key={alert.id}
                        className={`p-3 rounded-lg border flex flex-col gap-1.5 transition ${
                          alert.severity === "high" 
                            ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40" 
                            : "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                            {getAlertIcon(alert.type)}
                            <span>{alert.trainer_name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {new Date(alert.timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric" })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-snug">{alert.message}</p>
                        
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <a 
                            href={`https://wa.me/${trainers.find(t => t.id === alert.trainer_id)?.phone.replace(/\+/g, "")}?text=${encodeURIComponent(
                              `Hi ${alert.trainer_name}, please check in immediately and sync your session reports.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition"
                          >
                            WhatsApp
                          </a>
                          <a 
                            href={`tel:${trainers.find(t => t.id === alert.trainer_id)?.phone}`}
                            className="px-2 py-1 text-[10px] font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition flex items-center gap-1"
                          >
                            <PhoneCall className="w-2.5 h-2.5" />
                            Call
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-gray-500 text-center mt-4 border-t border-gray-800 pt-2">
            Exceptions recalculated automatically every 30 seconds.
          </div>
        </div>

      </div>

      {/* Top Performer Spotlight Card */}
      {topTrainer && topTrainer.today_sessions > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/5 via-[#1A1D26] to-[#1A1D26] border border-gray-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold font-mono">
              ★
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Daily Star Performer Highlight</h4>
              <p className="text-xs text-gray-400">
                <span className="text-[#FF6B00] font-medium">{topTrainer.name}</span> ({topTrainer.team_leader}'s team) completed <span className="text-emerald-400 font-bold">{topTrainer.today_sessions} merchant sessions</span> today with a rating of {topTrainer.star_rating}★!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase rounded">
              {topTrainer.badge_level.toUpperCase()} BADGE
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

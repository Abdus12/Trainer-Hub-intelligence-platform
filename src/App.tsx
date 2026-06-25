import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, MapPin, BarChart3, CalendarRange, Sliders,
  RefreshCw, Database, AlertCircle, Sparkles, CheckCircle2,
  Clock, ShieldAlert, HeartHandshake, Sun, Moon, MessageSquare, FileText, Building, Bot, Settings
} from "lucide-react";
import { Trainer, Merchant, Session, EmailLog, Alert, Summary } from "./types";
import {generateDatabase, getState, simulationTick,
  actionCheckIn, actionCheckOut, actionLogSession,
  actionRetryEmail, actionZohoSync, actionLeadsquaredSync, actionSimulation
} from "./clientEngine";
import HomeTab from "./components/HomeTab";
import LiveTab from "./components/LiveTab";
import ProductivityTab from "./components/ProductivityTab";
import TeamTab from "./components/TeamTab";
import ProfileTab from "./components/ProfileTab";
import TicketCommandCenter from "./components/TicketCommandCenter";
import MerchantIntelligence from "./components/MerchantIntelligence";
import CommunicationHub from "./components/CommunicationHub";
import ReportCenter from "./components/ReportCenter";
import AICopilotSidebar from "./components/AICopilotSidebar";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "home" | "live" | "productivity" | "ticket" | "merchant" | "team" | "communication" | "reports" | "profile"
  >("home");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("petpooja_theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("petpooja_theme", nextTheme);
  };

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState<boolean>(true);

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch full state from backend Express API
  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error("Failed to fetch operational state");
      const data = await res.json();
      setTrainers(data.trainers);
      setMerchants(data.merchants);
      setSessions(data.sessions);
      setEmailLogs(data.emailLogs);
      setAlerts(data.alerts);
      setSummary(data.summary);
    } catch (err) {
      console.error("Error retrieving state:", err);
    }
  };

  // Poll state every 15 seconds to fetch simulated live events
  useEffect(() => {
    fetchState();
    let pollInterval: any;
    if (isPolling) {
      pollInterval = setInterval(fetchState, 15000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isPolling]);

  // Handler: Manual SMTP delivery retry
  const handleRetryEmail = async (logId: string) => {
    try {
      setSyncStatusMsg("Retrying email delivery...");
      const res = await fetch("/api/retry-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId })
      });
      if (!res.ok) throw new Error("Retry failed");
      await fetchState();
      setSyncStatusMsg("Email delivered successfully ✅");
      setTimeout(() => setSyncStatusMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("SMTP retry failed ❌");
    }
  };

  // Handler: Check-In Shift
  const handleCheckIn = async (trainerId: string, lat: number, lng: number) => {
    try {
      setSyncStatusMsg("Processing Shift Check In...");
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId, lat, lng })
      });
      if (!res.ok) throw new Error("Check-in failed");
      await fetchState();
      setSyncStatusMsg("Shift started successfully! ✅");
      setTimeout(() => setSyncStatusMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("Check-in error ❌");
    }
  };

  // Handler: Checkout & Availability Submit
  const handleCheckOut = async (
    trainerId: string, 
    status: string, 
    from: string, 
    to: string, 
    notes: string
  ) => {
    try {
      setSyncStatusMsg("Submitting availability & checkout...");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          trainerId, 
          availabilityStatus: status, 
          availableFrom: from, 
          availableUntil: to, 
          notes 
        })
      });
      if (!res.ok) throw new Error("Checkout failed");
      await fetchState();
      setSyncStatusMsg("Availability declared. Checkout complete! ✅");
      setTimeout(() => setSyncStatusMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("Checkout error ❌");
    }
  };

  // Handler: Log Visit Session
  const handleLogSession = async (data: any) => {
    try {
      setSyncStatusMsg("Saving session & queuing SMTP Summary...");
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Session log failed");
      await fetchState();
      setSyncStatusMsg("Session saved! SMTP Summary Triggered ✅");
      setTimeout(() => setSyncStatusMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("Failed to save session ❌");
    }
  };

  // Handler: Zoho tickets forced sync
  const handleZohoSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStatusMsg("Retrieving unresolved Zoho Desk tickets...");
      const res = await fetch("/api/zoho/sync", { method: "POST" });
      if (!res.ok) throw new Error("Zoho Sync failed");
      await fetchState();
      setSyncStatusMsg("Zoho Desk Sync Completed! ✅");
      setTimeout(() => setSyncStatusMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("Zoho Sync Failed ❌");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Petpooja Track App forced sync
  const handlePetpoojaTrackSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStatusMsg("Pushing training metrics to Petpooja Track App...");
      const res = await fetch("/api/leadsquared/sync", { method: "POST" });
      if (!res.ok) throw new Error("Petpooja Track App Sync failed");
      await fetchState();
      setSyncStatusMsg("Petpooja Track App Sync Completed! ✅");
      setTimeout(() => setSyncStatusMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("Petpooja Track App Sync Failed ❌");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Simulation controls
  const handleTriggerSimulation = async (action: string) => {
    try {
      setSyncStatusMsg(`Simulating event: ${action.replace("_", " ")}...`);
      const res = await fetch("/api/simulation/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error("Simulation trigger failed");
      await fetchState();
      setSyncStatusMsg("Simulation state updated! ✅");
      setTimeout(() => setSyncStatusMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatusMsg("Simulation update error ❌");
    }
  };

  if (!summary) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center text-gray-400 gap-4">
        <div className="w-10 h-10 border-4 border-t-[#FF6B00] border-gray-800 rounded-full animate-spin"></div>
        <p className="text-sm font-sans tracking-wider font-semibold uppercase">Petpooja South Zone Command Hub Booting...</p>
      </div>
    );
  }

  // Calculate local vs UTC times
  const formattedLocal = currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedUTC = currentTime.toUTCString().split(" ")[4];

  return (
    <div className={`min-h-screen ${theme} bg-[#0A0C10] text-gray-100 font-sans selection:bg-[#FF6B00]/30 selection:text-white flex flex-col`}>
      
      {/* Dynamic Top Ops Status Header Ribbon */}
      <header className="bg-[#10121A] border-b border-gray-800/80 px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sticky top-0 z-40">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-orange-600 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-orange-500/10">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-widest text-white uppercase font-sans">
                South Zone Operations Command
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded">
                ● LIVE SYSTEM
              </span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
              Petpooja SaaS Merchant Training Hub — Manager Portal
            </p>
          </div>
        </div>

        {/* Global telemetry & Sync Status Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          
          {/* Action messages */}
          {syncStatusMsg && (
            <div className="px-3 py-1 bg-gray-900 border border-gray-800 text-[#FF6B00] rounded-lg animate-pulse flex items-center gap-1.5 font-sans font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{syncStatusMsg}</span>
            </div>
          )}

          {/* Time block */}
          <div className="bg-[#161922] border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-3 text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>IST: {formattedLocal}</span>
            </span>
            <span className="text-gray-700">|</span>
            <span>UTC: {formattedUTC}</span>
          </div>

          {/* High-Contrast Theme Toggle Selector */}
          <button 
            onClick={handleToggleTheme}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              theme === "dark" 
                ? "bg-amber-500/10 hover:bg-amber-500/25 border-amber-500/20 hover:border-amber-500/40 text-amber-400" 
                : "bg-blue-500/10 hover:bg-blue-500/25 border-blue-500/20 hover:border-blue-500/40 text-blue-600 font-bold"
            }`}
            title={theme === "dark" ? "Switch to Light Mode for high visibility" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-sans uppercase text-[10px] tracking-wide">Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-sans uppercase text-[10px] tracking-wide">Dark Theme</span>
              </>
            )}
          </button>

          {/* Polling controller */}
          <button 
            onClick={() => setIsPolling(!isPolling)}
            className={`px-2 py-1.5 rounded border text-[10px] uppercase font-bold transition cursor-pointer flex items-center gap-1 ${
              isPolling 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-gray-800 border-gray-700 text-gray-500"
            }`}
            title={isPolling ? "15s polling active" : "Polling disabled"}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPolling ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`}></span>
            {isPolling ? "Polling ON" : "Polling OFF"}
          </button>
        </div>

      </header>

      {/* Main Core Dashboard Layout */}
      <div className="flex-1 flex flex-col xl:flex-row">
        
        {/* Navigation Rail & Quick CRM/Zoho triggers */}
        <aside className="w-full xl:w-64 bg-[#0F1117] border-b xl:border-b-0 xl:border-r border-gray-800/60 p-4 flex flex-col justify-between gap-6 shrink-0">
          
          {/* Command selections */}
          <div className="space-y-6">
            <div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-3">Zonal Command Navigation</span>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab("home")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "home" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 ${activeTab === "home" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Executive Overview
                </button>

                <button 
                  onClick={() => setActiveTab("live")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "live" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <MapPin className={`w-4 h-4 ${activeTab === "live" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Operations Command
                </button>

                <button 
                  onClick={() => setActiveTab("productivity")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "productivity" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <BarChart3 className={`w-4 h-4 ${activeTab === "productivity" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Training Command Center
                </button>

                <button 
                  onClick={() => setActiveTab("ticket")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "ticket" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 ${activeTab === "ticket" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Ticket Command Center
                </button>

                <button 
                  onClick={() => setActiveTab("merchant")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "merchant" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <Building className={`w-4 h-4 ${activeTab === "merchant" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Merchant Intelligence
                </button>

                <button 
                  onClick={() => setActiveTab("team")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "team" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <CalendarRange className={`w-4 h-4 ${activeTab === "team" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Workforce Intelligence
                </button>

                <button 
                  onClick={() => setActiveTab("communication")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "communication" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 ${activeTab === "communication" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Communication Hub
                </button>

                <button 
                  onClick={() => setActiveTab("reports")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "reports" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <FileText className={`w-4 h-4 ${activeTab === "reports" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Reports
                </button>

                <button 
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                    activeTab === "profile" 
                      ? "bg-[#FF6B00]/10 border-l-2 border-[#FF6B00] text-white" 
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  }`}
                >
                  <Sliders className={`w-4 h-4 ${activeTab === "profile" ? "text-[#FF6B00]" : "text-gray-500"}`} />
                  Administration
                </button>
              </nav>
            </div>

            {/* External API Integration Statuses */}
            <div className="space-y-3 pt-4 border-t border-gray-800/60 text-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Force Synch Sync Protocols</span>
              
              <button 
                onClick={handlePetpoojaTrackSync}
                disabled={isSyncing}
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg font-semibold text-gray-300 flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? "animate-spin" : ""}`} />
                Petpooja Track App Sync
              </button>

              <button 
                onClick={handleZohoSync}
                disabled={isSyncing}
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg font-semibold text-gray-300 flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${isSyncing ? "animate-spin" : ""}`} />
                Zoho Desk Sync
              </button>
            </div>

          </div>

          {/* Quick Mock Simulation Triggers to demonstrate capabilities */}
          <div className="pt-4 border-t border-gray-800/60 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Simulation Presets</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleTriggerSimulation("trigger_breach")}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold rounded text-[10px] text-center transition cursor-pointer"
                title="Mock 0 sessions for TN trainers after 3 PM"
              >
                SLA Breach
              </button>
              <button 
                onClick={() => handleTriggerSimulation("trigger_zoho")}
                className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 font-bold rounded text-[10px] text-center transition cursor-pointer"
                title="Inject critical device sync ticket"
              >
                Zoho Incident
              </button>
              <button 
                onClick={() => handleTriggerSimulation("trigger_email_fail")}
                className="p-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-bold rounded text-[10px] text-center transition cursor-pointer"
                title="Force outbound email timeout"
              >
                SMTP Error
              </button>
              <button 
                onClick={() => handleTriggerSimulation("reset")}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-[10px] font-bold text-center transition cursor-pointer flex items-center justify-center gap-1"
                title="Regenerate full zonal database parameters"
              >
                <Database className="w-3 h-3 text-[#FF6B00]" />
                Reset
              </button>
            </div>
          </div>

        </aside>

        {/* Dynamic Display Tab Component Stage */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === "home" && (
            <HomeTab 
              trainers={trainers}
              alerts={alerts}
              summary={summary}
              onRefreshState={fetchState}
            />
          )}

          {activeTab === "live" && (
            <LiveTab 
              trainers={trainers}
              alerts={alerts}
              onRefreshState={fetchState}
              onTriggerEvent={handleTriggerSimulation}
            />
          )}

          {activeTab === "productivity" && (
            <ProductivityTab 
              trainers={trainers}
              sessions={sessions}
              emailLogs={emailLogs}
              summary={summary}
              alerts={alerts}
              isPolling={isPolling}
              onTogglePolling={setIsPolling}
              onRetryEmail={handleRetryEmail}
              onRefreshState={fetchState}
            />
          )}

          {activeTab === "ticket" && (
            <TicketCommandCenter 
              trainers={trainers}
              sessions={sessions}
              alerts={alerts}
              onRefreshState={fetchState}
            />
          )}

          {activeTab === "merchant" && (
            <MerchantIntelligence 
              merchants={merchants}
              sessions={sessions}
              trainers={trainers}
            />
          )}

          {activeTab === "team" && (
            <TeamTab 
              trainers={trainers}
              onRefreshState={fetchState}
            />
          )}

          {activeTab === "communication" && (
            <CommunicationHub 
              trainers={trainers}
              onRefreshState={fetchState}
            />
          )}

          {activeTab === "reports" && (
            <ReportCenter 
              trainers={trainers}
              sessions={sessions}
              emailLogs={emailLogs}
              summary={summary}
              alerts={alerts}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab 
              trainers={trainers}
              merchants={merchants}
              onRefreshState={fetchState}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onLogSession={handleLogSession}
            />
          )}
        </main>

        {/* Persistent AI Copilot Command Center Sidebar */}
        <AICopilotSidebar 
          trainers={trainers}
          alerts={alerts}
          summary={summary}
          onRefreshState={fetchState}
          onTriggerEvent={handleTriggerSimulation}
        />

      </div>

      {/* Footer Info rail */}
      <footer className="bg-[#0B0D13] border-t border-gray-800/40 py-3 px-6 text-center text-gray-600 text-[10px] flex flex-col md:flex-row justify-between items-center gap-2">
        <p>© 2026 Petpooja Operations Suite. Authorized Access Only. Designed for South Zone Command Hub.</p>
        <p className="flex items-center gap-1 font-mono text-[9px] text-[#FF6B00]">
          <HeartHandshake className="w-3 h-3 text-[#FF6B00]" />
          TELEMETRY PORT: 3000 | COMPENSATIVE COMPLIANCE SLA METRICS ACTIVE
        </p>
      </footer>

    </div>
  );
}

import React, { useState } from "react";
import { 
  Mail, Calendar, Clock, Users, Send, CheckCircle, Trash2, 
  Sparkles, Filter, ChevronRight, AlertCircle, RefreshCw
} from "lucide-react";

interface ScheduledJob {
  id: string;
  templateTitle: string;
  targetCount: number;
  region: string;
  timezone: string;
  contactWindow: string;
  scheduledTime: string;
  status: "pending" | "processing" | "sent";
}

export default function BulkEmailScheduler() {
  const [region, setRegion] = useState("Tamil Nadu");
  const [timezone, setTimezone] = useState("Asia/Kolkata (GMT+5:30)");
  const [contactWindow, setContactWindow] = useState("Post-Lunch (3:00 PM - 5:00 PM)");
  const [templateType, setTemplateType] = useState("menu_sync");
  const [scheduleDate, setScheduleDate] = useState("2026-06-26");
  const [scheduleTime, setScheduleTime] = useState("15:00");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  
  // Roster queue list
  const [jobs, setJobs] = useState<ScheduledJob[]>([
    {
      id: "job-1",
      templateTitle: "Urgent Petpooja Menu Cache Sync",
      targetCount: 14,
      region: "Tamil Nadu",
      timezone: "Asia/Kolkata (GMT+5:30)",
      contactWindow: "Post-Lunch (3:00 PM - 5:00 PM)",
      scheduledTime: "2026-06-25 15:30",
      status: "pending"
    },
    {
      id: "job-2",
      templateTitle: "Weekly SLA Check-In Reminders",
      targetCount: 8,
      region: "Karnataka",
      timezone: "Asia/Kolkata (GMT+5:30)",
      contactWindow: "Morning Rush (9:30 AM - 11:30 AM)",
      scheduledTime: "2026-06-26 10:00",
      status: "pending"
    },
    {
      id: "job-3",
      templateTitle: "Zoho GST Tax Configuration Settle Alert",
      targetCount: 22,
      region: "All South Zone",
      timezone: "Asia/Kolkata (GMT+5:30)",
      contactWindow: "Post-Dinner Handover (11:00 PM - Midnight)",
      scheduledTime: "2026-06-24 23:15",
      status: "sent"
    }
  ]);

  // Handle template selection to prefill subject and body
  const templates: Record<string, { subject: string; body: string }> = {
    menu_sync: {
      subject: "Urgent Action Required: Please sync your Petpooja POS Menu Cache",
      body: "Dear Partner, we detected menu alterations pending sync on your Petpooja POS billing terminal. Please navigate to Settings -> Sync Menu to flush cache immediately to avoid billing interruptions."
    },
    sla_checkin: {
      subject: "Operations Notice: Merchant SLA Support Check-In Window",
      body: "Dear Merchant, your assigned training supervisor is arriving within the next 30 minutes. Please keep your billing staff ready and POS terminal online to run through the check-in audit."
    },
    zoho_gst: {
      subject: "Escalation: Split GST Tax Duplication Anomaly in Zoho Reports",
      body: "Dear Store Manager, an update to composite taxation rules requires a split GST layout. Our technical lead will host a screen-share configuration session at your preferred contact window today."
    }
  };

  const handleTemplateChange = (val: string) => {
    setTemplateType(val);
    if (templates[val]) {
      setCustomSubject(templates[val].subject);
      setCustomBody(templates[val].body);
    }
  };

  // Lazy prefill on initial load
  React.useEffect(() => {
    handleTemplateChange("menu_sync");
  }, []);

  const getTargetCount = (reg: string) => {
    switch (reg) {
      case "Tamil Nadu": return 14;
      case "Karnataka": return 19;
      case "Telangana": return 11;
      case "Kerala": return 8;
      case "Andhra Pradesh": return 12;
      default: return 64; // All South Zone
    }
  };

  const handleQueueJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubject || !customBody) return;

    const newJob: ScheduledJob = {
      id: `job-${Date.now()}`,
      templateTitle: customSubject.substring(0, 45) + "...",
      targetCount: getTargetCount(region),
      region,
      timezone,
      contactWindow,
      scheduledTime: `${scheduleDate} ${scheduleTime}`,
      status: "pending"
    };

    setJobs([newJob, ...jobs]);
    setStatusMsg(`Bulk reminders scheduled for ${newJob.targetCount} merchants! ⏰`);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleDeleteJob = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  const handleTriggerNow = (id: string) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status: "processing" } : j));
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "sent" } : j));
      setStatusMsg("Immediate bulk dispatch processed successfully! ✅");
      setTimeout(() => setStatusMsg(""), 3000);
    }, 1500);
  };

  return (
    <div className="bg-[#1A1D26] border border-gray-800 rounded-2xl p-6 space-y-6" id="bulk-email-scheduler-widget">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#FF6B00]" />
            Scheduled Bulk Reminders Manager
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Configure automated batch reminders dispatched to merchants customized for regional timezones and shift peak windows.
          </p>
        </div>

        {statusMsg && (
          <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg animate-pulse flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {statusMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Scheduler Form (Left/Top) */}
        <form onSubmit={handleQueueJob} className="xl:col-span-7 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Region */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Region / State</label>
              <select 
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="All South Zone">All South Zone</option>
                <option value="Tamil Nadu">Tamil Nadu (Chennai/Coimbatore)</option>
                <option value="Karnataka">Karnataka (Bangalore/Mysore)</option>
                <option value="Telangana">Telangana (Hyderabad)</option>
                <option value="Kerala">Kerala (Kochi/Trivandrum)</option>
                <option value="Andhra Pradesh">Andhra Pradesh (Vijayawada)</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Merchant Timezone</label>
              <select 
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30) - Indian Standard</option>
                <option value="Asia/Dubai (GMT+4:00)">Asia/Dubai (GMT+4:00) - Middle East Partner</option>
                <option value="Asia/Singapore (GMT+8:00)">Asia/Singapore (GMT+8:00) - SE Asia Outlet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preferred Window */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Preferred Contact Window</label>
              <select 
                value={contactWindow}
                onChange={e => setContactWindow(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Morning Rush (9:30 AM - 11:30 AM)">Morning Rush (9:30 AM - 11:30 AM)</option>
                <option value="Post-Lunch (3:00 PM - 5:00 PM)">Post-Lunch Sync (3:00 PM - 5:00 PM)</option>
                <option value="Post-Dinner Handover (11:00 PM - Midnight)">Post-Dinner Handover (11:00 PM - Midnight)</option>
              </select>
            </div>

            {/* Target Template preset */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Preset Reminder Template</label>
              <select 
                value={templateType}
                onChange={e => handleTemplateChange(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="menu_sync">Petpooja POS Menu Sync Reminder</option>
                <option value="sla_checkin">15-Minute Field SLA Dispatch reminder</option>
                <option value="zoho_gst">Zoho GST Tax Configuration Settle Alert</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Schedule Dispatch Date</label>
              <input 
                type="date" 
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#FF6B00] font-mono"
              />
            </div>

            {/* Time */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Schedule Dispatch Time</label>
              <input 
                type="time" 
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#FF6B00] font-mono"
              />
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Email Outbound Subject</label>
            <input 
              type="text" 
              value={customSubject}
              onChange={e => setCustomSubject(e.target.value)}
              className="w-full bg-[#0F1117] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF6B00]"
              placeholder="Enter reminder email subject header..."
            />
          </div>

          {/* Body Field */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Email Outbound Body</label>
            <textarea 
              value={customBody}
              onChange={e => setCustomBody(e.target.value)}
              className="w-full bg-[#0F1117] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF6B00] leading-relaxed"
              rows={4}
              placeholder="Draft reminder contents..."
            />
          </div>

          <div className="flex justify-between items-center bg-[#0F1117] p-3 border border-gray-800/80 rounded-xl">
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Targeting: <strong className="text-white font-mono">{getTargetCount(region)}</strong> merchants in {region} timezone window</span>
            </div>

            <button 
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:opacity-95 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-orange-500/10 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              SCHEDULE BATCH REMINDER
            </button>
          </div>
        </form>

        {/* Pending Queue List (Right/Bottom) */}
        <div className="xl:col-span-5 bg-[#0F1117] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Scheduled Batch Queue</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-gray-400 font-mono rounded-md">
                {jobs.filter(j => j.status === "pending").length} Pending
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {jobs.map(job => (
                <div 
                  key={job.id} 
                  className={`p-3 bg-[#141722] border rounded-xl flex flex-col gap-2 relative transition ${
                    job.status === "sent" ? "border-emerald-500/10 opacity-70" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-gray-800 text-gray-300 font-bold px-1.5 py-0.5 rounded uppercase">
                      {job.region}
                    </span>
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                      job.status === "sent" ? "bg-emerald-500/10 text-emerald-400" :
                      job.status === "processing" ? "bg-yellow-500/10 text-yellow-400 animate-pulse" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{job.templateTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-mono">TZ: {job.timezone}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#FF6B00]" />
                      Window: {job.contactWindow}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-800/60 pt-2 mt-1">
                    <span className="text-[9px] font-mono text-gray-500">
                      ETA: {job.scheduledTime}
                    </span>

                    {job.status === "pending" && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleTriggerNow(job.id)}
                          className="px-2 py-1 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 font-bold text-[9px] rounded uppercase transition cursor-pointer flex items-center gap-0.5"
                          title="Trigger immediate dispatch"
                        >
                          <Send className="w-2.5 h-2.5" />
                          Send Now
                        </button>
                        <button 
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1 hover:bg-rose-500/10 rounded text-gray-500 hover:text-rose-400 transition"
                          title="Cancel scheduled dispatch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl text-[10px] text-blue-400 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
            <span>
              All reminders synchronize with Petpooja's dynamic CRM contact sheets. Store emails invalid or bouncing are automatically re-routed to SMS queues within 5 minutes of scheduled trigger.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

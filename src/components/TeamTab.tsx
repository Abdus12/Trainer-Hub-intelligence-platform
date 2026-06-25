import React, { useState } from "react";
import { 
  Users, Calendar, Clock, AlertTriangle, Send, Phone, MessageSquare, 
  Search, ShieldAlert, Check, HelpCircle, Grid, Filter, MapPin
} from "lucide-react";
import { Trainer } from "../types";
import TeamAvailabilityHeatmap from "./TeamAvailabilityHeatmap";

interface TeamTabProps {
  trainers: Trainer[];
  onRefreshState: () => void;
}

export default function TeamTab({ trainers, onRefreshState }: TeamTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTLFilter, setSelectedTLFilter] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [selectedShiftStatus, setSelectedShiftStatus] = useState<string>("all");
  const [availabilityView, setAvailabilityView] = useState<"directory" | "calendar" | "heatmap">("calendar");

  // Filter trainers
  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTL = selectedTLFilter === "all" || t.team_leader === selectedTLFilter;
    
    // Skill set filter match
    const matchesSkill = selectedSkill === "all" || (t.skills && t.skills.includes(selectedSkill));

    // Shift status filter match
    let matchesShift = true;
    if (selectedShiftStatus === "active") {
      matchesShift = t.is_checked_in;
    } else if (selectedShiftStatus === "offline") {
      matchesShift = !t.is_checked_in && t.check_out_time !== null;
    } else if (selectedShiftStatus === "not_checked_in") {
      matchesShift = !t.is_checked_in && t.check_out_time === null;
    }

    return matchesSearch && matchesTL && matchesSkill && matchesShift;
  });

  // Calculate team leader counts
  const uniqueTLs = Array.from(new Set(trainers.map(t => t.team_leader)));

  // Tomorrow calculations
  const getTomorrowString = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // Skip Sunday (move to Monday if tomorrow is Sunday)
    if (tomorrow.getDay() === 0) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    return tomorrow.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  };

  const tomorrowLabel = getTomorrowString();

  // Availability statuses stats
  const tomorrowStats = trainers.reduce((acc, t) => {
    if (t.next_day_availability) {
      const status = t.next_day_availability.status;
      acc[status] = (acc[status] || 0) + 1;
      acc.submitted += 1;
    } else {
      acc.pending += 1;
    }
    return acc;
  }, {
    available: 0,
    wfh: 0,
    leave: 0,
    half_day: 0,
    field_visit: 0,
    submitted: 0,
    pending: 0
  });

  // TL-wise counts for Tomorrow
  const tlSummaryTomorrow = uniqueTLs.map(tl => {
    const tlTrainers = trainers.filter(t => t.team_leader === tl);
    const total = tlTrainers.length;
    const submitted = tlTrainers.filter(t => t.next_day_availability !== null).length;
    const pending = total - submitted;
    const available = tlTrainers.filter(t => t.next_day_availability?.status === "available").length;
    const leave = tlTrainers.filter(t => t.next_day_availability?.status === "leave").length;
    const wfh = tlTrainers.filter(t => t.next_day_availability?.status === "wfh").length;

    return { tl, total, submitted, pending, available, leave, wfh };
  });

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case "available":
        return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded">Available</span>;
      case "wfh":
        return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded">WFH</span>;
      case "leave":
        return <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase rounded">Leave</span>;
      case "half_day":
        return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase rounded">Half Day</span>;
      case "field_visit":
        return <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase rounded">Out of City</span>;
      default:
        return <span className="px-2 py-1 bg-gray-800 text-gray-500 text-[10px] font-bold uppercase rounded">Pending</span>;
    }
  };

  const triggerBulkAvailabilityPing = () => {
    const pendingTrainers = trainers.filter(t => !t.next_day_availability);
    const msg = "Hi team, this is an automated prompt to submit your next-day availability calendar on the Command Hub app before checkout tonight.";
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Switch & Top Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAvailabilityView("calendar")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              availabilityView === "calendar" ? "bg-[#FF6B00] text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Tomorrow's Availability
          </button>
          <button 
            onClick={() => setAvailabilityView("heatmap")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              availabilityView === "heatmap" ? "bg-[#FF6B00] text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Availability Heatmap Clusters
          </button>
          <button 
            onClick={() => setAvailabilityView("directory")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              availabilityView === "directory" ? "bg-[#FF6B00] text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Trainer Directory ({filteredTrainers.length})
          </button>
        </div>

        {availabilityView === "calendar" && (
          <span className="text-xs bg-[#0F1117] px-3 py-1.5 rounded-lg border border-gray-800 text-[#FF6B00] font-semibold">
            Planned Schedule For: <span className="text-white font-bold">{tomorrowLabel}</span>
          </span>
        )}
      </div>

      {availabilityView === "calendar" ? (
        <div className="space-y-6">
          
          {/* Missing Availability Alert Warning Banner */}
          {tomorrowStats.pending > 0 && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Outstanding Availability Alerts</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="text-rose-400 font-bold">{tomorrowStats.pending} trainers</span> haven't declared their plan for tomorrow. Zonal SLA coverage tracking might be impacted.
                  </p>
                </div>
              </div>
              <button 
                onClick={triggerBulkAvailabilityPing}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 self-end md:self-auto"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Send Bulk Reminders
              </button>
            </div>
          )}

          {/* Tomorrow Availability KPI Panels */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block">Full Duty</span>
              <span className="text-2xl font-bold mt-1 text-emerald-400 block">{tomorrowStats.available}</span>
              <span className="text-[9px] text-gray-400">Available to deploy</span>
            </div>
            <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block">WFH / Remote</span>
              <span className="text-2xl font-bold mt-1 text-blue-400 block">{tomorrowStats.wfh}</span>
              <span className="text-[9px] text-gray-400">Online support desk</span>
            </div>
            <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block">Out of City</span>
              <span className="text-2xl font-bold mt-1 text-purple-400 block">{tomorrowStats.field_visit}</span>
              <span className="text-[9px] text-gray-400">Coimbatore/Madurai</span>
            </div>
            <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block">Half Day / Leave</span>
              <span className="text-2xl font-bold mt-1 text-rose-400 block">{tomorrowStats.leave + tomorrowStats.half_day}</span>
              <span className="text-[9px] text-gray-400">Not available</span>
            </div>
            <div className="p-4 bg-[#1A1D26] border border-gray-800 rounded-xl">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block">Pending declaration</span>
              <span className="text-2xl font-bold mt-1 text-yellow-500 block">{tomorrowStats.pending}</span>
              <span className="text-[9px] text-gray-400">Need immediate sync</span>
            </div>
          </div>

          {/* Tomorrow Availability Detailed Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Tomorrow Schedule Table */}
            <div className="lg:col-span-8 bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#FF6B00]" />
                Command Center Tomorrow Schedule Grid
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">Trainer</th>
                      <th className="pb-3 font-semibold">Team Leader</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                      <th className="pb-3 font-semibold text-center">Timing</th>
                      <th className="pb-3 font-semibold">Zonal Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {trainers.map(t => (
                      <tr key={t.id} className="hover:bg-[#0F1117]/30 transition group">
                        <td className="py-3 font-medium">
                          <div>
                            <span className="text-white block group-hover:text-[#FF6B00] transition">{t.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{t.employee_code} ({t.state})</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-300 font-sans">{t.team_leader}</td>
                        <td className="py-3 text-center">
                          {getAvailabilityBadge(t.next_day_availability?.status || "pending")}
                        </td>
                        <td className="py-3 text-center font-mono text-gray-400 text-[11px]">
                          {t.next_day_availability 
                            ? `${t.next_day_availability.available_from} - ${t.next_day_availability.available_until}` 
                            : "—"
                          }
                        </td>
                        <td className="py-3 text-gray-400 italic text-[11px] max-w-[150px] truncate" title={t.next_day_availability?.notes || ""}>
                          {t.next_day_availability?.notes || <span className="text-gray-600">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side: TL-wise Coverage Panel summaries */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-blue-400" />
                  TL Coverage Matrix (Tomorrow)
                </h3>

                <div className="space-y-4">
                  {tlSummaryTomorrow.map(item => (
                    <div key={item.tl} className="p-3 bg-[#0F1117] border border-gray-800 rounded-lg space-y-2">
                      <div className="flex justify-between items-center border-b border-gray-800/40 pb-1.5">
                        <span className="text-xs font-bold text-[#FF6B00]">{item.tl}</span>
                        <span className="text-[10px] text-gray-500">{item.submitted} / {item.total} Submitted</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                        <div className="p-1 bg-emerald-500/5 rounded">
                          <span className="text-emerald-400 font-bold block">{item.available}</span>
                          <span className="text-gray-500 text-[8px] uppercase">Avail</span>
                        </div>
                        <div className="p-1 bg-blue-500/5 rounded">
                          <span className="text-blue-400 font-bold block">{item.wfh}</span>
                          <span className="text-gray-500 text-[8px] uppercase">WFH</span>
                        </div>
                        <div className="p-1 bg-rose-500/5 rounded">
                          <span className="text-rose-400 font-bold block">{item.leave}</span>
                          <span className="text-gray-500 text-[8px] uppercase">Leave</span>
                        </div>
                        <div className="p-1 bg-yellow-500/5 rounded">
                          <span className="text-yellow-400 font-bold block">{item.pending}</span>
                          <span className="text-gray-500 text-[8px] uppercase">Pend.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : availabilityView === "heatmap" ? (
        <TeamAvailabilityHeatmap trainers={trainers} />
      ) : (
        /* Trainer Directory List Grid */
        <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Trainer Directory Register</h3>
              <p className="text-xs text-gray-400 mt-1">Zonal directory listing coordinates, ratings, and phone numbers</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Filter name / employee code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0F1117] border border-gray-800 text-gray-300 text-xs pl-9 pr-4 py-2 rounded-lg w-48 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <select 
                value={selectedTLFilter}
                onChange={(e) => setSelectedTLFilter(e.target.value)}
                className="bg-[#0F1117] border border-gray-800 text-xs text-gray-300 py-2 px-3 rounded-lg focus:outline-none focus:border-[#FF6B00] cursor-pointer"
              >
                <option value="all">All TLs</option>
                {uniqueTLs.map(tl => (
                  <option key={tl} value={tl}>{tl}</option>
                ))}
              </select>

              {/* Specific Skill Sets Dropdown */}
              <select 
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="bg-[#0F1117] border border-gray-800 text-xs text-gray-300 py-2 px-3 rounded-lg focus:outline-none focus:border-[#FF6B00] cursor-pointer"
              >
                <option value="all">All Skills</option>
                <option value="POS">POS</option>
                <option value="Standalone offline POS">Standalone offline POS</option>
                <option value="Inventory">Inventory</option>
                <option value="Payroll">Payroll</option>
                <option value="Petpooja Retail Invoice">Petpooja Retail Invoice</option>
                <option value="Task Management">Task Management</option>
                <option value="Table Reservation">Table Reservation</option>
                <option value="Petpooja Purchase Manager">Petpooja Purchase Manager</option>
                <option value="Marketplace services">Marketplace services</option>
                <option value="Integration">Integration</option>
              </select>

              {/* Current Shift Status Dropdown */}
              <select 
                value={selectedShiftStatus}
                onChange={(e) => setSelectedShiftStatus(e.target.value)}
                className="bg-[#0F1117] border border-gray-800 text-xs text-gray-300 py-2 px-3 rounded-lg focus:outline-none focus:border-[#FF6B00] cursor-pointer"
              >
                <option value="all">All Shifts</option>
                <option value="active">Active (Checked In)</option>
                <option value="offline">Offline (Checked Out)</option>
                <option value="not_checked_in">Absent / Pending Check-In</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredTrainers.map(t => (
              <div 
                key={t.id} 
                className="p-4 bg-[#0F1117] border border-gray-800 hover:border-gray-700 transition rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white block">{t.name}</h4>
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          t.is_checked_in 
                            ? "bg-emerald-400 animate-pulse" 
                            : t.check_out_time !== null 
                              ? "bg-gray-500" 
                              : "bg-amber-400"
                        }`} title={
                          t.is_checked_in 
                            ? "Active / Checked In" 
                            : t.check_out_time !== null 
                              ? "Offline / Checked Out" 
                              : "Absent / Pending Check-In"
                        } />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono uppercase">{t.employee_code}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-1.5 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] text-[9px] font-bold rounded">
                        {t.star_rating} ★
                      </span>
                      <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded font-mono ${
                        t.is_checked_in 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : t.check_out_time !== null 
                            ? "bg-gray-500/10 text-gray-400" 
                            : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {t.is_checked_in 
                          ? "Active" 
                          : t.check_out_time !== null 
                            ? "Ended" 
                            : "Absent"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-[11px] text-gray-400">
                    <p className="flex justify-between"><span className="text-gray-500">Zonal State:</span> <span className="text-gray-300 font-medium">{t.state}</span></p>
                    <p className="flex justify-between"><span className="text-gray-500">Team Leader:</span> <span className="text-gray-300 font-medium">{t.team_leader}</span></p>
                    <p className="flex justify-between"><span className="text-gray-500">Latest Sync:</span> <span className="text-gray-300 font-mono">{t.leadsquared_sync.last_sync ? new Date(t.leadsquared_sync.last_sync).toLocaleTimeString() : "—"}</span></p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">Location Map:</span> 
                      <span className="text-[#FF6B00] flex items-center gap-0.5 font-mono text-[10px]">
                        <MapPin className="w-3 h-3" />
                        {t.last_location.lat.toFixed(4)}, {t.last_location.lng.toFixed(4)}
                      </span>
                    </p>

                    {/* Skill Sets Badges */}
                    {t.skills && t.skills.length > 0 && (
                      <div className="pt-2 border-t border-gray-800/40 mt-2">
                        <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider block mb-1">Expertise:</span>
                        <div className="flex flex-wrap gap-1 max-h-[44px] overflow-y-auto">
                          {t.skills.map(sk => (
                            <span 
                              key={sk} 
                              className="text-[9px] bg-[#161922] text-gray-300 border border-gray-800 px-1.5 py-0.5 rounded"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gray-800/60 mt-4 pt-3">
                  <a 
                    href={`https://wa.me/${t.phone.replace(/\+/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-bold rounded-lg transition"
                  >
                    <MessageSquare className="w-3 h-3" />
                    WhatsApp
                  </a>
                  <a 
                    href={`tel:${t.phone}`}
                    className="flex items-center justify-center px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}

            {filteredTrainers.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 text-xs">
                No trainers found matching the search filters.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from "react";
import { 
  User, Settings, Phone, Mail, MapPin, Map, Shield, 
  BookOpen, Clock, LogIn, LogOut, Camera, Clipboard, 
  CheckCircle, ChevronRight, Lock, Eye, CheckCircle2, AlertCircle
} from "lucide-react";
import { Trainer, Merchant } from "../types";

interface ProfileTabProps {
  trainers: Trainer[];
  merchants: Merchant[];
  onRefreshState: () => void;
  onCheckIn: (trainerId: string, lat: number, lng: number) => void;
  onCheckOut: (trainerId: string, status: string, from: string, to: string, notes: string) => void;
  onLogSession: (data: any) => void;
}

export default function ProfileTab({ 
  trainers, merchants, onRefreshState, onCheckIn, onCheckOut, onLogSession 
}: ProfileTabProps) {
  const [activeMode, setActiveMode] = useState<"manager" | "trainer">("manager");
  
  // Trainer Simulator selection state
  const [selectedSimTrainerId, setSelectedSimTrainerId] = useState<string>(trainers[0]?.id || "");
  const [isPhotoCaptured, setIsPhotoCaptured] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("POS");
  const [sessionType, setSessionType] = useState<"physical" | "remote">("physical");
  const [modulesCovered, setModulesCovered] = useState<string[]>(["POS"]);
  const [merchantNameInput, setMerchantNameInput] = useState<string>("");
  const [merchantEmailInput, setMerchantEmailInput] = useState<string>("");

  // Availability Gated Checkout Bottom Sheet/Modal state
  const [showCheckoutGate, setShowCheckoutGate] = useState<boolean>(false);
  const [availStatus, setAvailStatus] = useState<"available" | "leave" | "half_day" | "wfh" | "field_visit">("available");
  const [availFrom, setAvailFrom] = useState<string>("09:00");
  const [availUntil, setAvailUntil] = useState<string>("18:00");
  const [availNotes, setAvailNotes] = useState<string>("");

  const currentSimTrainer = trainers.find(t => t.id === selectedSimTrainerId) || trainers[0];

  const handleSimCheckIn = () => {
    // Attempt Geolocation trigger
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onCheckIn(currentSimTrainer.id, pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Default to Chennai coordinates
          onCheckIn(currentSimTrainer.id, 13.0827, 80.2707);
        }
      );
    } else {
      onCheckIn(currentSimTrainer.id, 13.0827, 80.2707);
    }
  };

  const handleSimCheckoutInitiate = () => {
    // Hard-gate check: Show availability declarer sheet
    setShowCheckoutGate(true);
  };

  const handleSimCheckoutComplete = () => {
    onCheckOut(currentSimTrainer.id, availStatus, availFrom, availUntil, availNotes);
    setShowCheckoutGate(false);
    // Reset form states
    setAvailStatus("available");
    setAvailNotes("");
  };

  const handleFormLogSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantNameInput) return;

    onLogSession({
      trainerId: currentSimTrainer.id,
      merchantName: merchantNameInput,
      merchantEmail: merchantEmailInput,
      module: selectedModule,
      sessionType,
      modulesCovered,
      notes: sessionNotes || `Conducted comprehensive training walkthrough on ${selectedModule} modules with standard POS workflows.`,
      duration: 45,
      nextSessionDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
    });

    // Reset inputs
    setMerchantNameInput("");
    setMerchantEmailInput("");
    setSessionNotes("");
    setIsPhotoCaptured(false);
  };

  const handleModuleCheckbox = (mod: string) => {
    if (modulesCovered.includes(mod)) {
      setModulesCovered(modulesCovered.filter(m => m !== mod));
    } else {
      setModulesCovered([...modulesCovered, mod]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Selector Toggle Bar */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveMode("manager")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === "manager" ? "bg-[#FF6B00] text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Zonal Manager Config
          </button>
          <button 
            onClick={() => setActiveMode("trainer")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === "trainer" ? "bg-[#FF6B00] text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Trainer App Simulator
          </button>
        </div>
      </div>

      {activeMode === "manager" ? (
        /* Executive Profile Panel - Abdus Salam */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column Profile info card */}
          <div className="lg:col-span-4 bg-[#1A1D26] border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 border-2 border-[#FF6B00] flex items-center justify-center font-bold font-sans text-[#FF6B00] text-2xl relative">
              AS
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1A1D26] rounded-full animate-pulse"></span>
            </div>

            <h3 className="text-sm font-bold text-white mt-4">Abdus Salam</h3>
            <span className="text-[10px] uppercase font-bold text-[#FF6B00] mt-0.5">Zonal Manager — South India Command</span>
            <p className="text-[11px] text-gray-400 mt-2 max-w-[200px]">Overseeing merchant SaaS integrations, trainer SLAs, and operations compliance.</p>

            <div className="w-full border-t border-gray-800/60 my-5 pt-4 space-y-2 text-left text-xs">
              <p className="flex justify-between text-gray-400"><span className="text-gray-500">Command ID:</span> <span className="font-mono text-white">PJ-ZM-001</span></p>
              <p className="flex justify-between text-gray-400"><span className="text-gray-500">Zonal Email:</span> <span className="text-white">abdus.salam74@gmail.com</span></p>
              <p className="flex justify-between text-gray-400"><span className="text-gray-500">Primary Office:</span> <span className="text-white">Chennai Command HQ</span></p>
            </div>
          </div>

          {/* Right Column: General Settings and Zone coverages */}
          <div className="lg:col-span-8 bg-[#1A1D26] border border-gray-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Zonal Command Settings</h3>
              <p className="text-xs text-gray-400">Configure core synchronization parameters and target SLAs for the South zone.</p>
            </div>

            {/* Custom parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[#0F1117] border border-gray-800 rounded-lg">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hourly Target SLA threshold</span>
                <span className="text-xl font-extrabold text-white mt-1 block">4 Sessions <span className="text-xs font-normal text-gray-500">/ Day</span></span>
              </div>
              <div className="p-3 bg-[#0F1117] border border-gray-800 rounded-lg">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Automated Escalation Rule</span>
                <span className="text-xs font-semibold text-gray-300 mt-1.5 block">Trigger WhatsApp alert if &lt;4 Sessions by 3 PM</span>
              </div>
            </div>

            <div className="border-t border-gray-800/60 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">South Zone Jurisdiction Coverage</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded text-xs">Tamil Nadu (Chennai, Coimbatore, Madurai)</span>
                <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded text-xs">Karnataka (Bangalore)</span>
                <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded text-xs">Andhra Pradesh (Vijayawada)</span>
                <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded text-xs">Kerala (Kochi)</span>
                <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded text-xs">Telangana (Hyderabad)</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Full-featured Trainer app workspace Simulator */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* Gated Checkout Next-day Availability Modal Bottom Sheet */}
          {showCheckoutGate && (
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-[#1A1D26] border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                  <Lock className="w-5 h-5 text-[#FF6B00]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">📅 Next-Day Availability Declaration</h3>
                </div>

                <p className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Checkout Gated: Declaration is mandatory before checkout completion.
                </p>

                {/* Form fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1">Availability Status *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setAvailStatus("available")}
                        className={`p-2 rounded border text-[11px] font-semibold text-center transition ${availStatus === "available" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "border-gray-800 text-gray-400 hover:text-white"}`}
                      >
                        Available (Full Day)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAvailStatus("wfh")}
                        className={`p-2 rounded border text-[11px] font-semibold text-center transition ${availStatus === "wfh" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "border-gray-800 text-gray-400 hover:text-white"}`}
                      >
                        Work From Home
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAvailStatus("half_day")}
                        className={`p-2 rounded border text-[11px] font-semibold text-center transition ${availStatus === "half_day" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "border-gray-800 text-gray-400 hover:text-white"}`}
                      >
                        Half Day
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAvailStatus("leave")}
                        className={`p-2 rounded border text-[11px] font-semibold text-center transition ${availStatus === "leave" ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" : "border-gray-800 text-gray-400 hover:text-white"}`}
                      >
                        Leave
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-400 block mb-1">Available From</label>
                      <input 
                        type="text" 
                        value={availFrom}
                        onChange={(e) => setAvailFrom(e.target.value)}
                        className="w-full bg-[#0F1117] border border-gray-800 text-white rounded p-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Available Until</label>
                      <input 
                        type="text" 
                        value={availUntil}
                        onChange={(e) => setAvailUntil(e.target.value)}
                        className="w-full bg-[#0F1117] border border-gray-800 text-white rounded p-1.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Notes (Optional)</label>
                    <textarea 
                      placeholder="e.g. Coimbatore merchant demo setup, out-of-station client meet"
                      value={availNotes}
                      onChange={(e) => setAvailNotes(e.target.value)}
                      className="w-full bg-[#0F1117] border border-gray-800 text-white rounded p-2 focus:outline-none h-16 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-800">
                  <button 
                    type="button"
                    onClick={handleSimCheckoutComplete}
                    className="flex-1 py-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Submit & Check Out
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowCheckoutGate(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Left Column Trainer Selector & Status Timer */}
          <div className="lg:col-span-4 bg-[#1A1D26] border border-gray-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Trainer to Mock</h3>
              <select 
                value={selectedSimTrainerId}
                onChange={(e) => setSelectedSimTrainerId(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-800 text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-[#FF6B00]"
              >
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.employee_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Checkin checkout card layout */}
            <div className="p-4 bg-[#0F1117] border border-gray-800 rounded-xl flex flex-col items-center text-center space-y-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Device Shift Status</span>
              
              {currentSimTrainer.is_checked_in ? (
                <>
                  <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Checked In ✅
                  </div>
                  <div className="text-white mt-1">
                    <span className="text-2xl font-extrabold font-mono">6h 32m</span>
                    <span className="text-[10px] text-gray-500 block uppercase mt-0.5">Shift Active Duration</span>
                  </div>

                  <button 
                    onClick={handleSimCheckoutInitiate}
                    className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Check Out
                  </button>
                </>
              ) : (
                <>
                  <div className="px-3 py-1 bg-gray-800 text-gray-500 text-xs font-bold rounded-full">
                    Checked Out 🔒
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">Press Check In button to boot background tracking service and clear active registers.</p>

                  <button 
                    onClick={handleSimCheckIn}
                    className="w-full py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    Check In Shift
                  </button>
                </>
              )}
            </div>

            {/* Availability mirror display */}
            <div className="p-3 bg-gray-900/30 rounded-lg text-xs space-y-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Plan Saved For Tomorrow</span>
              {currentSimTrainer.next_day_availability ? (
                <div className="text-white space-y-1 mt-1 font-sans">
                  <p className="flex justify-between font-semibold">
                    <span>Plan:</span> 
                    <span className="text-[#FF6B00]">{currentSimTrainer.next_day_availability.status.toUpperCase()}</span>
                  </p>
                  <p className="flex justify-between text-[11px] text-gray-400">
                    <span>Target Hours:</span> 
                    <span>{currentSimTrainer.next_day_availability.available_from} - {currentSimTrainer.next_day_availability.available_until}</span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic mt-1 text-[11px]">No next-day plan saved. Gated checkout rule remains armed 🔒.</p>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Form to mock Logging Sessions */}
          <div className="lg:col-span-8 bg-[#1A1D26] border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Trainer Visit Session Logger Form</h3>
            <p className="text-xs text-gray-400 mb-6 border-b border-gray-800/40 pb-4">
              Submit merchant training visits. Upon completion, the system automatically triggers the SMTP template delivery to the merchant with ops carbon-copy (CC: <span className="font-mono text-[#FF6B00]">training.ops@petpooja.com</span>).
            </p>

            <form onSubmit={handleFormLogSession} className="space-y-4 text-xs text-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Merchant Outlet Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Imperial Madras Pizzas"
                    value={merchantNameInput}
                    onChange={(e) => setMerchantNameInput(e.target.value)}
                    className="w-full bg-[#0F1117] border border-gray-800 text-white rounded p-2 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Merchant Contact Email *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. contact@imperialpizzas.com"
                    value={merchantEmailInput}
                    onChange={(e) => setMerchantEmailInput(e.target.value)}
                    className="w-full bg-[#0F1117] border border-gray-800 text-white rounded p-2 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Primary Module Trained</label>
                  <select 
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="w-full bg-[#0F1117] border border-gray-800 text-white p-2 rounded focus:outline-none"
                  >
                    <option value="POS">POS Walkthrough</option>
                    <option value="KOT">KOT Setup & Printer Routing</option>
                    <option value="Reports">Zonal Reports & Admin Dashboard</option>
                    <option value="Menu">Menu Editor & Modifiers</option>
                    <option value="Settings">Billing printers & Tax Setup</option>
                    <option value="Full Training">Initial Launch Full Training</option>
                    <option value="Retraining">Retraining Loop</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Session Protocol Type</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setSessionType("physical")}
                      className={`flex-1 p-2 rounded border text-center transition ${sessionType === "physical" ? "bg-[#FF6B00]/15 border-[#FF6B00] text-white" : "border-gray-800 text-gray-400"}`}
                    >
                      Physical On-Site
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSessionType("remote")}
                      className={`flex-1 p-2 rounded border text-center transition ${sessionType === "remote" ? "bg-[#FF6B00]/15 border-[#FF6B00] text-white" : "border-gray-800 text-gray-400"}`}
                    >
                      Remote Support
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-modules covered checkboxes */}
              <div>
                <label className="text-gray-400 block mb-2">Check sub-modules Covered Today</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["Bill Punching", "Captain App Setup", "Zomato/Swiggy Sync", "Tax Configuration"].map(mod => (
                    <label key={mod} className="flex items-center gap-1.5 p-2 bg-[#0F1117] border border-gray-800 rounded cursor-pointer hover:border-gray-700">
                      <input 
                        type="checkbox"
                        checked={modulesCovered.includes(mod)}
                        onChange={() => handleModuleCheckbox(mod)}
                        className="rounded border-gray-800 text-[#FF6B00] focus:ring-0"
                      />
                      <span>{mod}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photo Upload Attachment Simulation */}
              <div>
                <label className="text-gray-400 block mb-1">Visit Visual Verification Photo Attachment</label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsPhotoCaptured(true)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Simulate Camera Shoot
                  </button>
                  {isPhotoCaptured && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      visit_receipt_photo.jpg attached
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Session Walkthrough Documentation Notes</label>
                <textarea 
                  placeholder="Conducted POS/KOT training. Successfully synced billing modifiers, and configured printer ports..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full bg-[#0F1117] border border-gray-800 text-white rounded p-2 focus:outline-none h-20 resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={!currentSimTrainer.is_checked_in}
                className="w-full py-2.5 bg-[#FF6B00] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition cursor-pointer"
              >
                {currentSimTrainer.is_checked_in ? "Log Training Session & Trigger CC Email" : "Shift Check In Required to Log Sessions"}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}

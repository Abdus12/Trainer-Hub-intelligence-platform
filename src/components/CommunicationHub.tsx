import React, { useState } from "react";
import { 
  Mail, MessageSquare, ShieldAlert, Sparkles, Send, User, Search, Filter, 
  Trash2, CornerDownRight, CheckSquare, PlusCircle, ArrowUpRight, CheckCircle
} from "lucide-react";
import { Trainer } from "../types";
import BulkEmailScheduler from "./BulkEmailScheduler";

interface Message {
  id: string;
  source: "gmail" | "whatsapp" | "zoho";
  senderName: string;
  senderContact: string;
  subject: string;
  snippet: string;
  timestamp: string;
  read: boolean;
  aiSuggestedReply: string;
}

interface CommunicationHubProps {
  trainers: Trainer[];
  onRefreshState: () => void;
}

interface CannedTemplate {
  title: string;
  body: string;
}

const CANNED_TEMPLATES: CannedTemplate[] = [
  {
    title: "SLA Dispatch Alert",
    body: "Operational notice: You have exceeded the 15-minute on-site SLA check-in window. Please proceed immediately to the merchant outlet and complete your GPS check-in."
  },
  {
    title: "Menu Sync Guide",
    body: "We have flushed the menu cache for your outlet. Please open your Petpooja POS dashboard, go to Settings, and click 'Sync Menu' to sync the latest changes."
  },
  {
    title: "Tax Multiplier Fix",
    body: "The tax duplication anomaly has been escalated. Technical Lead Suresh Iyer will coordinate a screen-share session with you at 3:00 PM today to configure split GST."
  },
  {
    title: "Settle Device Bug",
    body: "Barcode reader hardware conflict resolved. Please restart your handheld terminal and confirm if the driver status displays Green."
  },
  {
    title: "Remote Training Invite",
    body: "Your remote training request has been approved. A calendar invitation with the Google Meet link has been dispatched to your registered operations email."
  },
  {
    title: "Shift Check-In Error",
    body: "GPS coordinate variance detected for your check-in. Please ensure your device location is set to High Accuracy mode and refresh your check-in portal."
  }
];

export default function CommunicationHub({ trainers, onRefreshState }: CommunicationHubProps) {
  const [filter, setFilter] = useState<"all" | "gmail" | "whatsapp" | "zoho">("all");
  const [search, setSearch] = useState("");
  const [activeMessageId, setActiveMessageId] = useState<string | null>("msg-1");
  const [draftReply, setDraftReply] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      source: "whatsapp",
      senderName: "Gopal Jha (Katihar Sweets)",
      senderContact: "+91 98451 22910",
      subject: "URGENT Menu Update Issue",
      snippet: "Hi, we are starting dinner service in 20 minutes but our menu changes made on portal are not showing on POS. Please help, customers are waiting.",
      timestamp: "10:24 AM",
      read: false,
      aiSuggestedReply: "Dear Gopal, we are triggering an immediate manual cache flush for Katihar Sweets. Please click 'Sync Menu' inside your POS terminal dashboard within 2 minutes. Our team leader Ananya Gowda is on standby for physical dispatch if required."
    },
    {
      id: "msg-2",
      source: "gmail",
      senderName: "operations.hq@petpooja.com",
      senderContact: "operations.hq@petpooja.com",
      subject: "South Zone SLA Compliance Risk Alert",
      snippet: "Alert: Three outlets in the Tamil Nadu region have gone 3 hours past their scheduled on-site session start without GPS check-in logs. Dispatching checklist is pending.",
      timestamp: "09:45 AM",
      read: true,
      aiSuggestedReply: "Understood. Re-routing nearby available field trainer Ramesh Kumar to complete site handovers. Availability sheet updated."
    },
    {
      id: "msg-3",
      source: "zoho",
      senderName: "Ayesha Ahmed (A1 Pizza)",
      senderContact: "ayesha@a1pizza.in",
      subject: "Reports dashboard double counting taxes",
      snippet: "We compared Zoho books with our Petpooja POS daily reports and noticed a tax duplication error. Need technical help to configure split GST correctly.",
      timestamp: "08:12 AM",
      read: true,
      aiSuggestedReply: "Hi Ayesha, our financial reporting engine requires updating to split SGST and CGST rules on composite billing. Let me assign technical manager Suresh Iyer to coordinate a screen-share session with your account manager today."
    },
    {
      id: "msg-4",
      source: "whatsapp",
      senderName: "Vikram Reddy (Ananya Garden)",
      senderContact: "+91 81230 44510",
      subject: "Request for additional billing scanner training",
      snippet: "We purchased two new handheld barcode scanners and need someone to configure the driver drivers and train our cashiers.",
      timestamp: "Yesterday",
      read: true,
      aiSuggestedReply: "Hello Vikram, we are happy to assist. A remote training session is scheduled for tomorrow at 11:00 AM. A calendar invitation has been sent to your email address."
    }
  ]);

  const activeMessage = messages.find(m => m.id === activeMessageId) || messages[0];

  const handleApplyAiReply = () => {
    if (activeMessage) {
      setDraftReply(activeMessage.aiSuggestedReply);
      setStatusMessage("AI Draft Loaded! Feel free to edit.");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleSendMessage = () => {
    if (!draftReply.trim()) return;
    setStatusMessage("Outbound route sync triggered... Sent successfully! ✅");
    setDraftReply("");
    
    // Mark as read
    setMessages(prev => prev.map(m => m.id === activeMessageId ? { ...m, read: true } : m));

    setTimeout(() => setStatusMessage(""), 3000);
  };

  const filteredMessages = messages.filter(m => {
    const matchesSource = filter === "all" || m.source === filter;
    const matchesSearch = m.senderName.toLowerCase().includes(search.toLowerCase()) || 
                          m.subject.toLowerCase().includes(search.toLowerCase()) ||
                          m.snippet.toLowerCase().includes(search.toLowerCase());
    return matchesSource && matchesSearch;
  });

  return (
    <div className="space-y-6" id="communication-hub">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#FF6B00]" />
            OMNICHANNEL OPERATIONS INBOX
          </h1>
          <p className="text-xs text-gray-400">
            Unified communication hub binding WhatsApp Business, Gmail SLA reports, and Zoho Desk messaging streams.
          </p>
        </div>
        
        {statusMessage && (
          <div className="px-4 py-2 bg-[#1A1D26] border border-gray-800 rounded-xl text-xs font-semibold text-[#FF6B00] animate-pulse">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Main Inbox layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[650px]">
        {/* Left message list sidebar */}
        <div className="lg:col-span-5 bg-[#0E1118] border border-gray-800 rounded-2xl p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] tracking-widest font-black text-[#FF6B00] uppercase">
              Omnichannel Stream
            </span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 text-[9px] uppercase font-black rounded-md ${
                  filter === "all" ? "bg-[#FF6B00] text-black" : "bg-gray-900 border border-gray-800 text-gray-400"
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter("gmail")}
                className={`px-2.5 py-1 text-[9px] uppercase font-black rounded-md ${
                  filter === "gmail" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-900 border border-gray-800 text-gray-400"
                }`}
              >
                Gmail
              </button>
              <button 
                onClick={() => setFilter("whatsapp")}
                className={`px-2.5 py-1 text-[9px] uppercase font-black rounded-md ${
                  filter === "whatsapp" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-gray-900 border border-gray-800 text-gray-400"
                }`}
              >
                WhatsApp
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search chat or sender name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#181B26] border border-gray-800 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredMessages.map(msg => (
              <button
                key={msg.id}
                onClick={() => {
                  setActiveMessageId(msg.id);
                  setDraftReply("");
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-2 relative ${
                  activeMessageId === msg.id 
                    ? "bg-[#FF6B00]/10 border-[#FF6B00] text-white" 
                    : "bg-[#141722] border-gray-800/60 hover:bg-[#1C1F2E] text-gray-300"
                }`}
              >
                {!msg.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
                )}

                <div className="flex justify-between items-start pr-4">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    msg.source === "whatsapp" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    msg.source === "gmail" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {msg.source}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">{msg.timestamp}</span>
                </div>

                <div>
                  <h4 className="text-xs font-black truncate">{msg.senderName}</h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{msg.subject}</p>
                </div>

                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{msg.snippet}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane: Message Viewer & Action Center */}
        <div className="lg:col-span-7 bg-[#10121A] border border-gray-800 rounded-2xl p-5 flex flex-col h-full shadow-xl">
          {activeMessage ? (
            <div className="flex flex-col h-full justify-between space-y-4">
              
              {/* Message Header */}
              <div className="pb-4 border-b border-gray-800 flex justify-between items-start">
                <div>
                  <h2 className="text-sm font-black text-white">{activeMessage.subject}</h2>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    From: <span className="text-gray-300 font-bold">{activeMessage.senderName}</span> ({activeMessage.senderContact})
                  </p>
                </div>
                
                <span className="text-[9px] font-mono text-gray-500 bg-[#161922] border border-gray-800 px-3 py-1.5 rounded-xl uppercase font-black">
                  Source: {activeMessage.source}
                </span>
              </div>

              {/* Message Snippet body */}
              <div className="flex-1 bg-gray-950/40 border border-gray-800 p-4 rounded-xl overflow-y-auto">
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {activeMessage.snippet}
                </p>
              </div>

              {/* AI Suggestion Box */}
              <div className="p-4 bg-purple-950/10 border border-purple-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                    AI Auto-Copilot Suggested Response Draft
                  </span>
                  <button 
                    onClick={handleApplyAiReply}
                    className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500 hover:text-white border border-purple-500/20 text-purple-400 font-black text-[9px] uppercase rounded-md transition"
                  >
                    Apply Draft
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-normal italic">
                  "{activeMessage.aiSuggestedReply}"
                </p>
              </div>

              {/* Quick Action buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] uppercase font-black">
                <button 
                  onClick={() => {
                    setStatusMessage("Escalated to Team Leader registry successfully.");
                    setTimeout(() => setStatusMessage(""), 3000);
                  }}
                  className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  Escalate Case
                </button>
                <button 
                  onClick={() => {
                    setStatusMessage("Support call queued on remote Asterisk bridge.");
                    setTimeout(() => setStatusMessage(""), 3000);
                  }}
                  className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition cursor-pointer"
                >
                  Schedule Call
                </button>
                <button 
                  onClick={() => {
                    setStatusMessage("Follow-up alarm pinned on CRM dashboard.");
                    setTimeout(() => setStatusMessage(""), 3000);
                  }}
                  className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition cursor-pointer"
                >
                  CRM Follow-Up
                </button>
                <button 
                  onClick={() => {
                    setStatusMessage("Status flagged as completed.");
                    setTimeout(() => setStatusMessage(""), 3000);
                  }}
                  className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                >
                  Mark Handled
                </button>
              </div>

              {/* Canned Response Template Library */}
              <div className="bg-[#151821] border border-gray-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-orange-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-[#FF6B00]" />
                    Canned Response Template Library
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">Select a preset to populate editor</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CANNED_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setDraftReply(tpl.body);
                        setStatusMessage(`Template "${tpl.title}" applied!`);
                        setTimeout(() => setStatusMessage(""), 3000);
                      }}
                      className="text-left p-2.5 bg-[#0F1117] border border-gray-800/80 rounded-lg hover:border-[#FF6B00]/40 hover:bg-[#1E2230] transition text-gray-300 flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="font-bold text-[10px] text-white group-hover:text-[#FF6B00] transition truncate w-full">{tpl.title}</div>
                      <div className="text-[9px] text-gray-500 mt-1 line-clamp-1 italic">"{tpl.body}"</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Outbound Response Text Editor */}
              <div className="space-y-2">
                <textarea 
                  value={draftReply}
                  onChange={e => setDraftReply(e.target.value)}
                  placeholder="Type an official reply or import the AI Copilot template..."
                  rows={3}
                  className="w-full bg-[#181B26] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF6B00] leading-relaxed"
                />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <CornerDownRight className="w-3 h-3" />
                    <span>Outbound path: SMTP / Secure Twilio Gateway</span>
                  </div>

                  <button 
                    onClick={handleSendMessage}
                    disabled={!draftReply.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-600 disabled:opacity-40 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-orange-500/10 hover:opacity-90 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    TRANSMIT RESPONSE
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full py-12 text-gray-600">
              <Mail className="w-12 h-12 mb-4 text-gray-700 animate-pulse" />
              <p className="text-xs uppercase font-black tracking-wider">Select a message stream item to respond</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Email Scheduling Center */}
      <BulkEmailScheduler />
    </div>
  );
}

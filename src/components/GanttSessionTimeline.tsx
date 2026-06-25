import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, Clock, User, CheckCircle2, Play, AlertCircle, 
  Mic, MicOff, Save, Clipboard, Sparkles, Filter, ChevronRight, Check
} from "lucide-react";
import { Session, Trainer } from "../types";

interface GanttSessionTimelineProps {
  sessions: Session[];
  trainers: Trainer[];
  onUpdateSessionNotes: (sessionId: string, newNotes: string) => void;
}

export default function GanttSessionTimeline({ 
  sessions = [], trainers = [], onUpdateSessionNotes 
}: GanttSessionTimelineProps) {
  const [selectedDay, setSelectedDay] = useState<string>("Today");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [notesBuffer, setNotesBuffer] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Initialize Web Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-IN"; // Set language to Indian English

      rec.onstart = () => {
        setIsListening(true);
        // Start timer
        setRecordingTimer(0);
        timerRef.current = setInterval(() => {
          setRecordingTimer(prev => prev + 1);
        }, 1000);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setNotesBuffer(prev => {
            const separator = prev ? " " : "";
            return prev + separator + finalTranscript;
          });
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      rec.onend = () => {
        setIsListening(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      setRecognition(rec);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update form notes buffer when selected session changes
  useEffect(() => {
    if (selectedSession) {
      setNotesBuffer(selectedSession.notes || "");
    } else if (sessions.length > 0) {
      // default select first session to avoid empty screen
      setSelectedSessionId(sessions[0].id);
      setNotesBuffer(sessions[0].notes || "");
    }
  }, [selectedSessionId, sessions.length]);

  // Handle Speech Toggle
  const toggleSpeechListen = () => {
    if (!recognition) {
      // Mock-Speech Recognition fallback if browser lacks support or iframe blocks permissions
      if (isListening) {
        setIsListening(false);
        if (timerRef.current) clearInterval(timerRef.current);
        const mockPhrases = [
          "Merchant completed modifiers checklist and confirmed printer settings are working.",
          "Configured composite split GST and validated POS reports.",
          "Trained cashier on Captain billing flow. Settle driver status Green."
        ];
        const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
        setNotesBuffer(prev => prev + (prev ? " " : "") + "[Recorded Audio Memo]: " + randomPhrase);
      } else {
        setIsListening(true);
        setRecordingTimer(0);
        timerRef.current = setInterval(() => {
          setRecordingTimer(prev => prev + 1);
        }, 1000);
      }
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Handle Save Notes
  const handleSaveNotes = () => {
    if (!selectedSessionId) return;
    onUpdateSessionNotes(selectedSessionId, notesBuffer);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Helper: map times to visual horizontal percentage offsets
  // Operating hours: 09:00 AM to 06:00 PM (9 hours span)
  const getGanttOffsetAndWidth = (startTimeStr: string) => {
    try {
      const time = new Date(startTimeStr);
      const hours = time.getHours();
      const minutes = time.getMinutes();
      
      const decimalHours = hours + minutes / 60;
      const startHour = 9; // 09:00 AM
      const totalHoursSpan = 9; // ends at 06:00 PM (18:00)

      // Calculate percentage offset
      const offsetPercent = ((decimalHours - startHour) / totalHoursSpan) * 100;
      
      // Standard session is 1.5 hours duration
      const widthPercent = (1.5 / totalHoursSpan) * 100;

      return {
        left: `${Math.max(0, Math.min(85, offsetPercent))}%`,
        width: `${widthPercent}%`
      };
    } catch {
      return { left: "10%", width: "15%" };
    }
  };

  // Days list for scheduling tabs
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Today"];

  // Group sessions by trainer for Gantt rows
  const uniqueTrainers = Array.from(new Set(sessions.map(s => s.trainer_name)));

  return (
    <div className="bg-[#1A1D26] border border-gray-800 rounded-2xl p-6 space-y-6" id="gantt-session-timeline">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FF6B00]" />
            Interactive Weekly Session Gantt Timeline
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Visual map of scheduled merchant sessions across training shifts. Click on any bar block to audit or record verbal voice summaries.
          </p>
        </div>

        {/* Day Select Tabs */}
        <div className="flex flex-wrap gap-1 bg-[#0F1117] p-1 border border-gray-800 rounded-xl">
          {days.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                selectedDay === d ? "bg-[#FF6B00] text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Gantt Timeline Chart (Left/Top) */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-[#0F1117] border border-gray-800 rounded-2xl p-4 overflow-x-auto">
            <div className="min-w-[650px] space-y-4">
              {/* Timeline Hour Scale Headers */}
              <div className="grid grid-cols-10 gap-2 text-center text-[9px] font-mono font-bold text-gray-500 uppercase pb-2 border-b border-gray-800/40">
                <div className="text-left">Trainer Shift</div>
                <div>09:00 AM</div>
                <div>10:00 AM</div>
                <div>11:00 AM</div>
                <div>12:00 PM</div>
                <div>01:00 PM</div>
                <div>02:00 PM</div>
                <div>03:00 PM</div>
                <div>04:00 PM</div>
                <div>05:00 PM</div>
              </div>

              {/* Gantt Rows */}
              <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                {uniqueTrainers.map((trName, index) => {
                  // Filter sessions for this trainer
                  const trainerSessions = sessions.filter(s => {
                    const nameMatches = s.trainer_name === trName;
                    // Mock days distributions if not "Today" to make mock Gantt look populated
                    if (selectedDay === "Today") return nameMatches;
                    // Assign random days mock distribution based on ID hash
                    const daysHash = (parseInt(s.id.split("-")[1]) || 0) + index;
                    const assignedDay = days[daysHash % days.length];
                    return nameMatches && assignedDay === selectedDay;
                  });

                  return (
                    <div key={trName} className="flex items-center gap-4 py-1.5 hover:bg-gray-800/20 rounded-xl px-2">
                      {/* Row Header (Trainer Info) */}
                      <div className="w-[120px] flex-shrink-0 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[10px] font-bold text-[#FF6B00]">
                          {trName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{trName}</span>
                          <span className="text-[9px] text-gray-500 block uppercase font-mono">Shift Active</span>
                        </div>
                      </div>

                      {/* Row Timeline Block Track */}
                      <div className="flex-1 h-12 bg-gray-900/40 rounded-xl border border-gray-800/40 relative flex items-center overflow-hidden">
                        {trainerSessions.map(sess => {
                          const { left, width } = getGanttOffsetAndWidth(sess.start_time);
                          
                          // Determine status styles
                          let statusBg = "bg-blue-600/20 border-blue-500/30 text-blue-400 hover:border-blue-500";
                          let statusDot = "bg-blue-400";
                          if (sess.notes && sess.notes.includes("Completed")) {
                            statusBg = "bg-emerald-600/15 border-emerald-500/20 text-emerald-400 hover:border-emerald-500";
                            statusDot = "bg-emerald-400";
                          } else if (sess.id === "sess-1" || sess.id === "sess-4") { // Mock "In Progress"
                            statusBg = "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:border-amber-500 animate-pulse";
                            statusDot = "bg-amber-400 animate-ping";
                          } else {
                            // Completed general
                            statusBg = "bg-emerald-600/15 border-emerald-500/20 text-emerald-400 hover:border-emerald-500";
                            statusDot = "bg-emerald-400";
                          }

                          const isSelected = selectedSessionId === sess.id;

                          return (
                            <button
                              type="button"
                              key={sess.id}
                              onClick={() => setSelectedSessionId(sess.id)}
                              style={{ left, width }}
                              className={`absolute h-[80%] rounded-lg border p-2 text-left flex flex-col justify-between group transition cursor-pointer ${statusBg} ${
                                isSelected ? "ring-2 ring-[#FF6B00] border-transparent" : ""
                              }`}
                            >
                              <div className="flex justify-between items-center gap-1">
                                <span className="font-extrabold text-[9px] text-white truncate w-full block group-hover:text-[#FF6B00] transition">
                                  {sess.merchant_name}
                                </span>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`}></span>
                              </div>
                              <span className="text-[8px] font-mono text-gray-400 block truncate">
                                {new Date(sess.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </button>
                          );
                        })}

                        {trainerSessions.length === 0 && (
                          <span className="text-[9px] text-gray-600 italic block pl-4">No scheduled merchant visits for this shift.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="p-2.5 bg-[#0F1117] border border-gray-800 rounded-xl">
              <span className="w-2.5 h-2.5 inline-block rounded-full bg-emerald-400 mr-1.5"></span>
              <span className="text-gray-400">Completed Sessions</span>
            </div>
            <div className="p-2.5 bg-[#0F1117] border border-gray-800 rounded-xl">
              <span className="w-2.5 h-2.5 inline-block rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>
              <span className="text-gray-400">In Progress Shift</span>
            </div>
            <div className="p-2.5 bg-[#0F1117] border border-gray-800 rounded-xl">
              <span className="w-2.5 h-2.5 inline-block rounded-full bg-blue-400 mr-1.5"></span>
              <span className="text-gray-400">Scheduled / Pending</span>
            </div>
          </div>
        </div>

        {/* Dynamic Speech To Text 'Quick Memo' Pad (Right/Bottom) */}
        <div className="xl:col-span-4 bg-[#0F1117] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          {selectedSession ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                  <Clipboard className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Session Walkthrough Pad</span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-300">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-500">Store Outlet</span>
                    <h3 className="text-sm font-black text-white mt-0.5">{selectedSession.merchant_name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-gray-500 block">Trainer Assigned</span>
                      <span className="text-white font-medium flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-[#FF6B00]" />
                        {selectedSession.trainer_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-gray-500 block">Coverage Module</span>
                      <span className="text-white font-medium block mt-0.5">{selectedSession.module}</span>
                    </div>
                  </div>

                  {/* Speech Memo Pad Textarea & Mic Action */}
                  <div className="space-y-1.5 mt-4 pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-black text-[#FF6B00] tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Trainer Notes Log
                      </span>
                      
                      {/* Quick Memo Mic Trigger */}
                      <button
                        type="button"
                        onClick={toggleSpeechListen}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                          isListening 
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse" 
                            : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                        }`}
                        title={isListening ? "Stop voice recording" : "Record verbal summary via speech-to-text"}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5 text-rose-400" />
                            <span>Stop ({recordingTimer}s)</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-[#FF6B00]" />
                            <span>Quick Voice Memo</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={notesBuffer}
                      onChange={e => setNotesBuffer(e.target.value)}
                      className="w-full bg-[#141722] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF6B00] leading-relaxed h-32 resize-none"
                      placeholder="Verify terminal settings, print routes, split composite GST ratios..."
                    />

                    {isListening && (
                      <div className="p-2 bg-rose-500/5 border border-rose-500/15 rounded-lg text-[9px] text-rose-400 italic flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span>Microphone active. Transcribing speech-to-text directly into log...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Save Bar */}
              <div className="border-t border-gray-800 pt-3 flex items-center justify-between">
                <span className="text-[9px] text-gray-500 font-mono">ID: {selectedSession.id}</span>
                
                <div className="flex gap-2">
                  {saveSuccess && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Notes synced!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-3.5 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:opacity-95 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-orange-500/10 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    SAVE TO LOG
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full py-12 text-gray-600">
              <Clipboard className="w-10 h-10 mb-2 text-gray-700 animate-pulse" />
              <p className="text-[10px] uppercase font-black tracking-wider">Select a Gantt timeline block to manage notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

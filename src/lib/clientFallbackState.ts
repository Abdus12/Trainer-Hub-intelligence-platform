import { Trainer, Merchant, Session, EmailLog, Alert, Summary } from "../types";
import { RAW_SOUTH_ZONE_TRAINERS, CITY_COORDS } from "../southZoneTrainersData";

const BASE_COORDS: Record<string, { lat: number; lng: number }> = {
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
  "Karnataka": { lat: 15.3173, lng: 75.7139 },
  "Kerala": { lat: 10.8505, lng: 76.2711 },
  "Andhra Pradesh": { lat: 15.9129, lng: 79.7400 },
  "Telangana": { lat: 18.1124, lng: 79.0193 }
};

const TEAM_LEADERS = ["Abdus Salam", "Manoj P", "Akhil Srinivas", "Ranganatha K M"];

export interface FullState {
  trainers: Trainer[];
  merchants: Merchant[];
  sessions: Session[];
  emailLogs: EmailLog[];
  alerts: Alert[];
  summary: Summary;
  integrationLogs: any[];
  reportSchedules: any[];
  scheduledDispatchLogs: any[];
}

export function computeSummary(
  trainersList: Trainer[],
  sessionsList: Session[],
  emailLogsList: EmailLog[],
  alertsList: Alert[]
): Summary {
  return {
    total_checkins: trainersList.filter(t => t.is_checked_in).length,
    total_sessions: sessionsList.length,
    sla_met_count: trainersList.filter(t => t.today_sessions >= 4).length,
    sla_breach_count: alertsList.filter(a => a.type === "sla_breach").length,
    fatal_issues: trainersList.reduce((sum, t) => sum + (t.zoho_sync?.fatal_issues || 0), 0),
    emails_sent: emailLogsList.filter(e => e.status === "sent").length,
    emails_failed: emailLogsList.filter(e => e.status === "failed").length,
    availability_submitted_count: trainersList.filter(t => t.next_day_availability !== null).length,
    availability_missing_count: trainersList.filter(t => !t.is_checked_in && t.check_out_time !== null && !t.next_day_availability).length
  };
}

export function generateAlerts(trainersList: Trainer[], emailLogsList: EmailLog[]): Alert[] {
  const alertsList: Alert[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  trainersList.forEach(t => {
    // 1. Check-In alert (No check-in by 10 AM)
    if (!t.is_checked_in && t.check_out_time === null && currentHour >= 10) {
      alertsList.push({
        id: `alert-no-checkin-${t.id}`,
        type: "no_checkin",
        trainer_id: t.id,
        trainer_name: t.name,
        tl_id: t.team_leader,
        message: `${t.name} is scheduled but has not checked in by 10:00 AM today.`,
        severity: "high",
        timestamp: new Date(new Date().setHours(10, 0, 0)).toISOString(),
        resolved: false
      });
    }

    // 2. SLA Breach alerts
    if (t.is_checked_in) {
      const targetSessions = 4;
      const hour = currentHour;
      const workdayStart = 9;
      const elapsedHours = Math.max(1, hour - workdayStart);
      const expectedByNow = Math.ceil((elapsedHours / 9) * targetSessions);

      if (t.today_sessions < expectedByNow && expectedByNow > 0) {
        alertsList.push({
          id: `alert-sla-${t.id}`,
          type: "sla_breach",
          trainer_id: t.id,
          trainer_name: t.name,
          tl_id: t.team_leader,
          message: `${t.name} is running behind SLA pace (${t.today_sessions}/${targetSessions} completed at ${hour}:00). Expected: ${expectedByNow}.`,
          severity: t.today_sessions === 0 && hour >= 14 ? "high" : "medium",
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      // 3. Update delay
      if (t.last_crm_update) {
        const lastCrmUpdateMs = new Date(t.last_crm_update).getTime();
        const diffHrs = (Date.now() - lastCrmUpdateMs) / (1000 * 60 * 60);
        if (diffHrs > 2 && t.today_sessions > 0) {
          alertsList.push({
            id: `alert-crm-${t.id}`,
            type: "crm_miss",
            trainer_id: t.id,
            trainer_name: t.name,
            tl_id: t.team_leader,
            message: `${t.name} conducted training sessions but has not updated Petpooja Track App in the last 2+ hours.`,
            severity: "medium",
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            resolved: false
          });
        }
      }

      // 4. Fatal issues
      if (t.zoho_sync && t.zoho_sync.fatal_issues > 0) {
        alertsList.push({
          id: `alert-zoho-${t.id}`,
          type: "fatal_issue",
          trainer_id: t.id,
          trainer_name: t.name,
          tl_id: t.team_leader,
          message: `CRITICAL: ${t.name} has a fatal client POS hardware/sync issue pending in Zoho Desk for over 4 hours.`,
          severity: "high",
          timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          resolved: false
        });
      }
    }

    // 5. Availability missing
    if (!t.is_checked_in && t.check_out_time !== null && !t.next_day_availability) {
      alertsList.push({
        id: `alert-avail-${t.id}`,
        type: "availability_missing",
        trainer_id: t.id,
        trainer_name: t.name,
        tl_id: t.team_leader,
        message: `${t.name} checked out without declaring next-day availability plan.`,
        severity: "medium",
        timestamp: t.check_out_time,
        resolved: false
      });
    }
  });

  // 6. Email failures
  emailLogsList.forEach(log => {
    if (log.status === "failed") {
      alertsList.push({
        id: `alert-email-fail-${log.id}`,
        type: "email_fail",
        trainer_id: log.trainer_id,
        trainer_name: trainersList.find(tr => tr.id === log.trainer_id)?.name || "Trainer",
        tl_id: trainersList.find(tr => tr.id === log.trainer_id)?.team_leader || "TL",
        message: `Post-Session Email Failed: Outbound summary to ${log.merchant_name} (${log.to_merchant}) failed to send.`,
        severity: "medium",
        timestamp: log.sent_at,
        resolved: false
      });
    }
  });

  return alertsList;
}

export function generateInitialDatabase(): FullState {
  const trainers: Trainer[] = [];
  const merchants: Merchant[] = [];
  const sessions: Session[] = [];
  const emailLogs: EmailLog[] = [];

  // Limit to first 25 for efficient client performance
  const sourceTrainers = RAW_SOUTH_ZONE_TRAINERS.slice(0, 25);

  sourceTrainers.forEach((t, i) => {
    const fullName = t.name;
    const state = t.state;
    const city = t.city || "Unknown";
    const empCode = t.employee_code;
    const email = t.email;
    const phone = t.phone.startsWith("+91") ? t.phone : `+91 ${t.phone}`;

    const baseCoord = CITY_COORDS[city] || BASE_COORDS[state] || { lat: 12.9716, lng: 77.5946 };
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lngOffset = (Math.random() - 0.5) * 0.05;
    const lat = baseCoord.lat + latOffset;
    const lng = baseCoord.lng + lngOffset;

    const rand = Math.random();
    let isCheckedIn = true;
    let todaySessions = 0;
    let checkInTime: string | null = new Date(new Date().setHours(9, Math.floor(Math.random() * 45), 0)).toISOString();
    let checkOutTime: string | null = null;
    let availability: Trainer["next_day_availability"] = null;

    if (rand < 0.1) {
      isCheckedIn = false;
      checkInTime = null;
      todaySessions = 0;
    } else if (rand < 0.25) {
      isCheckedIn = false;
      todaySessions = Math.floor(Math.random() * 2) + 3;
      checkOutTime = new Date(new Date().setHours(17, Math.floor(Math.random() * 30), 0)).toISOString();
      availability = {
        status: Math.random() < 0.85 ? "available" : "wfh",
        available_from: "09:00",
        available_until: "18:00",
        notes: `Demo in ${city}`,
        submitted_at: checkOutTime,
        submitted_for_date: new Date(Date.now() + 86400000).toISOString().split("T")[0]
      };
    } else {
      todaySessions = Math.floor(Math.random() * 5);
    }

    const weeklySessions = Array.from({ length: 6 }, () => Math.floor(Math.random() * 4) + 2);
    const avgRating = parseFloat((3.8 + Math.random() * 1.2).toFixed(1));
    const badgeLevel = avgRating >= 4.7 ? "gold" : (avgRating >= 4.2 ? "silver" : "bronze");
    const lastCrmUpdate = new Date(Date.now() - Math.floor(Math.random() * 180) * 60 * 1000).toISOString();

    const assignedSkills = ["POS", "Inventory", "Menu Setup"];

    const trainerRecord: Trainer = {
      id: `trainer-${i}`,
      name: fullName,
      email,
      team_leader: t.team_leader,
      state,
      employee_code: empCode,
      phone,
      is_checked_in: isCheckedIn,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      last_location: {
        lat,
        lng,
        timestamp: new Date().toISOString()
      },
      screen_active: isCheckedIn ? Math.random() > 0.3 : false,
      today_sessions: todaySessions,
      weekly_sessions: weeklySessions,
      badge_level: badgeLevel,
      star_rating: avgRating,
      next_day_availability: availability,
      last_crm_update: lastCrmUpdate,
      leadsquared_sync: {
        activities_today: todaySessions,
        leads_created: Math.floor(Math.random() * 2),
        leads_updated: Math.floor(Math.random() * 3),
        last_sync: new Date().toISOString()
      },
      zoho_sync: {
        open_tickets: Math.floor(Math.random() * 2),
        fatal_issues: Math.random() < 0.1 ? 1 : 0,
        avg_resolution_time: 45,
        last_sync: new Date().toISOString()
      },
      skills: assignedSkills,
      vercel_hub_insights: {
        performance_prediction: "Optimal trajectory predicted.",
        sentiment_analysis: "Positive",
        sentiment_score: 90,
        risk_score: 10,
        fatigue_level: "low",
        predicted_sla_score: 95
      },
      vercel_hub_modules: []
    };

    trainers.push(trainerRecord);

    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Partner";

    const merchantRecord: Merchant = {
      id: `merchant-${i}`,
      name: `${firstName}'s Restaurant Elite`,
      contact_person: `Owner ${lastName}`,
      email: `${firstName.toLowerCase()}.restaurant@gmail.com`,
      phone: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
      outlet_name: `${firstName}'s Pizzas & Grills`,
      city: city,
      state,
      assigned_trainer_id: trainerRecord.id
    };
    merchants.push(merchantRecord);

    for (let s = 0; s < todaySessions; s++) {
      const duration = 45 + Math.floor(Math.random() * 45);
      const startTime = new Date(new Date().setHours(10 + s * 2, 0, 0)).toISOString();
      const endTime = new Date(new Date().setHours(10 + s * 2, duration, 0)).toISOString();

      const sessionRecord: Session = {
        id: `session-${i}-${s}`,
        trainer_id: trainerRecord.id,
        trainer_name: trainerRecord.name,
        trainer_email: trainerRecord.email,
        merchant_id: merchantRecord.id,
        merchant_name: merchantRecord.outlet_name,
        merchant_email: merchantRecord.email,
        session_type: "physical",
        module: "POS",
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        notes: `Conducted full walkthrough of the POS module. Merchant is successfully operating.`,
        modules_covered: ["POS", "KOT Setup"],
        next_session_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        leadsquared_updated: true,
        zoho_ticket_id: "",
        status: "completed",
        email_status: {
          sent: true,
          sent_at: endTime,
          recipient_merchant: merchantRecord.email,
          recipient_ops: "training.ops@petpooja.com",
          error: null
        }
      };
      sessions.push(sessionRecord);

      emailLogs.push({
        id: `log-${sessionRecord.id}`,
        session_id: sessionRecord.id,
        trainer_id: trainerRecord.id,
        merchant_name: merchantRecord.outlet_name,
        to_merchant: merchantRecord.email,
        to_ops: "training.ops@petpooja.com",
        subject: `Training Session Summary – ${merchantRecord.outlet_name} | POS`,
        sent_at: startTime,
        status: "sent",
        retry_count: 0,
        error_message: null
      });
    }
  });

  const alerts = generateAlerts(trainers, emailLogs);
  const summary = computeSummary(trainers, sessions, emailLogs, alerts);

  const integrationLogs = [
    {
      id: "log-init-1",
      timestamp: new Date().toISOString(),
      direction: "outbound",
      endpoint: "https://nmngoqurkcxzeurjjwfl.supabase.co/rest/v1/telemetry_logs",
      payload: { action: "CLIENT_MODE_BOOT" },
      response: { success: true, message: "Client storage fallback generated." },
      status: "success"
    }
  ];

  return {
    trainers,
    merchants,
    sessions,
    emailLogs,
    alerts,
    summary,
    integrationLogs,
    reportSchedules: [
      {
        id: "schedule-1",
        reportType: "daily",
        frequency: "daily",
        time: "08:00",
        daysOfWeek: [],
        recipients: ["abdus.salam74@gmail.com"],
        active: true,
        createdAt: new Date().toISOString(),
        lastDispatchedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ],
    scheduledDispatchLogs: []
  };
}

export function loadLocalState(): FullState {
  const saved = localStorage.getItem("petpooja_full_state");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Could not parse saved state, regenerating...");
    }
  }
  const newState = generateInitialDatabase();
  saveLocalState(newState);
  return newState;
}

export function saveLocalState(state: FullState) {
  localStorage.setItem("petpooja_full_state", JSON.stringify(state));
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  team_leader: string;
  state: string;
  employee_code: string;
  phone: string;
  is_checked_in: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
  last_location: { lat: number; lng: number; timestamp: string };
  screen_active: boolean;
  today_sessions: number;
  weekly_sessions: number[];
  badge_level: "bronze" | "silver" | "gold";
  star_rating: number;
  next_day_availability: {
    status: "available" | "leave" | "half_day" | "wfh" | "field_visit";
    available_from: string;
    available_until: string;
    notes: string;
    submitted_at: string;
    submitted_for_date: string;
  } | null;
  last_crm_update: string;
  leadsquared_sync: {
    activities_today: number;
    leads_created: number;
    leads_updated: number;
    last_sync: string;
  };
  zoho_sync: {
    open_tickets: number;
    fatal_issues: number;
    avg_resolution_time: number;
    last_sync: string;
  };
  skills?: string[];
}

export interface Merchant {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  outlet_name: string;
  city: string;
  state: string;
  assigned_trainer_id: string;
}

export interface Session {
  id: string;
  trainer_id: string;
  trainer_name: string;
  trainer_email: string;
  merchant_id: string;
  merchant_name: string;
  merchant_email: string;
  session_type: "physical" | "remote";
  module: "POS" | "KOT" | "Reports" | "Menu" | "Settings" | "Full Training" | "Retraining";
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes: string;
  modules_covered: string[];
  next_session_date: string;
  leadsquared_updated: boolean;
  zoho_ticket_id: string;
  status: "completed" | "pending" | "rescheduled";
  email_status: {
    sent: boolean;
    sent_at: string | null;
    recipient_merchant: string;
    recipient_ops: string;
    error: string | null;
  };
}

export interface EmailLog {
  id: string;
  session_id: string;
  trainer_id: string;
  merchant_name: string;
  to_merchant: string;
  to_ops: string;
  subject: string;
  sent_at: string;
  status: "sent" | "failed" | "pending";
  retry_count: number;
  error_message: string | null;
}

export interface Alert {
  id: string;
  type: "sla_breach" | "fatal_issue" | "no_checkin" | "crm_miss" | "email_fail" | "availability_missing" | "location_stale";
  trainer_id: string;
  trainer_name: string;
  tl_id: string;
  message: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
  resolved: boolean;
}

export interface Summary {
  total_checkins: number;
  total_sessions: number;
  sla_met_count: number;
  sla_breach_count: number;
  fatal_issues: number;
  emails_sent: number;
  emails_failed: number;
  availability_submitted_count: number;
  availability_missing_count: number;
}

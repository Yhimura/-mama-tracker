export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface FetalInfo {
  week: number;
  fruit_name: string;
  fruit_emoji: string;
  weight_grams?: number;
  length_cm?: number;
  description: string;
}

export interface PregnancyCalculation {
  current_week: number;
  current_day: number;
  days_pregnant_total: number;
  days_left: number;
  trimester: number;
  trimester_title: string;
  fetal_info: FetalInfo;
}

export interface PregnancyProfile {
  id: string;
  user_id: number;
  start_date?: string;
  conception_date?: string;
  estimated_due_date: string;
  initial_weight?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  calculation?: PregnancyCalculation;
}

export interface DailyLog {
  id?: string;
  user_id?: number;
  log_date: string; // YYYY-MM-DD
  nausea_level: number; // 0-5
  energy_level: number; // 1-5
  symptoms: string[];
  water_cups: number; // 250ml cups
  food_notes?: string;
  food_tags: string[];
  weight?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  kick_count: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarDayStatus {
  date: string; // YYYY-MM-DD
  has_log: boolean;
  nausea_level?: number;
  energy_level?: number;
  water_cups?: number;
  kick_count?: number;
  symptoms_count: number;
  weight?: number;
}

export interface MetricPoint {
  date: string;
  value: number;
}

export interface AnalyticsSummary {
  days_count: number;
  logged_days_count: number;
  average_energy: number;
  toxicosis: {
    average_nausea: number;
    max_nausea: number;
    days_with_vomiting: number;
  };
  weight_dynamics: MetricPoint[];
  nausea_dynamics: MetricPoint[];
  water_dynamics: MetricPoint[];
  kicks_dynamics: MetricPoint[];
  top_symptoms: Record<string, number>;
}

export interface DoctorReport {
  period_start: string;
  period_end: string;
  patient_name: string;
  gestational_age: string;
  total_days_logged: number;
  average_blood_pressure?: string;
  weight_change?: string;
  frequent_symptoms: string[];
  notes_and_questions: string[];
  formatted_markdown_text: string;
}

import { tg } from './telegram';
import type {
  PregnancyProfile,
  DailyLog,
  CalendarDayStatus,
  AnalyticsSummary,
  DoctorReport,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const initData = tg.initData;
  if (initData) {
    headers.set('X-Telegram-Init-Data', initData);
  } else {
    // Dev fallback
    headers.set('X-Dev-User-Id', String(tg.user.id || 999999999));
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[API] Remote call to ${endpoint} failed, checking mock fallback...`, error);
    throw error;
  }
}

export const api = {
  // Profiles
  async getProfile(): Promise<PregnancyProfile | null> {
    try {
      return await request<PregnancyProfile | null>('/profile');
    } catch {
      // LocalStorage fallback for standalone preview
      const local = localStorage.getItem('mompulse_profile');
      if (local) return JSON.parse(local);
      return null;
    }
  },

  async createProfile(data: { start_date?: string; estimated_due_date?: string; initial_weight?: number }): Promise<PregnancyProfile> {
    try {
      return await request<PregnancyProfile>('/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      // Mock calculation for offline/standalone mode
      const today = new Date();
      let lmp = data.start_date ? new Date(data.start_date) : new Date();
      if (!data.start_date && data.estimated_due_date) {
        lmp = new Date(new Date(data.estimated_due_date).getTime() - 280 * 24 * 3600 * 1000);
      }
      const days = Math.max(0, Math.floor((today.getTime() - lmp.getTime()) / (24 * 3600 * 1000)));
      const weeks = Math.floor(days / 7);
      const mockProfile: PregnancyProfile = {
        id: 'mock-profile-uuid',
        user_id: tg.user.id,
        start_date: data.start_date,
        estimated_due_date: data.estimated_due_date || new Date(lmp.getTime() + 280 * 24 * 3600 * 1000).toISOString().split('T')[0],
        initial_weight: data.initial_weight,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        calculation: {
          current_week: weeks || 14,
          current_day: days % 7,
          days_pregnant_total: days,
          days_left: Math.max(0, 280 - days),
          trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
          trimester_title: weeks < 14 ? 'I триместр' : weeks < 28 ? 'II триместр' : 'III триместр',
          fetal_info: {
            week: weeks || 14,
            fruit_name: 'Персик',
            fruit_emoji: '🍑',
            weight_grams: 45,
            length_cm: 8.7,
            description: 'Малыш уже двигает ручками и активно растет!',
          },
        },
      };
      localStorage.setItem('mompulse_profile', JSON.stringify(mockProfile));
      return mockProfile;
    }
  },

  // Daily Logs
  async getDailyLog(dateStr: string): Promise<DailyLog | null> {
    try {
      return await request<DailyLog | null>(`/logs/by-date/${dateStr}`);
    } catch {
      const local = localStorage.getItem(`mompulse_log_${dateStr}`);
      return local ? JSON.parse(local) : null;
    }
  },

  async upsertDailyLog(log: DailyLog): Promise<DailyLog> {
    try {
      return await request<DailyLog>('/logs', {
        method: 'POST',
        body: JSON.stringify(log),
      });
    } catch {
      localStorage.setItem(`mompulse_log_${log.log_date}`, JSON.stringify(log));
      return log;
    }
  },

  async getCalendarLogs(year: number, month: number): Promise<CalendarDayStatus[]> {
    try {
      return await request<CalendarDayStatus[]>(`/logs/calendar?year=${year}&month=${month}`);
    } catch {
      // Mock calendar status
      const daysCount = new Date(year, month, 0).getDate();
      const list: CalendarDayStatus[] = [];
      for (let d = 1; d <= daysCount; d++) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const local = localStorage.getItem(`mompulse_log_${dStr}`);
        if (local) {
          const parsed = JSON.parse(local);
          list.push({
            date: dStr,
            has_log: true,
            nausea_level: parsed.nausea_level,
            energy_level: parsed.energy_level,
            water_cups: parsed.water_cups,
            kick_count: parsed.kick_count,
            symptoms_count: parsed.symptoms?.length || 0,
            weight: parsed.weight,
          });
        } else {
          list.push({ date: dStr, has_log: false, symptoms_count: 0 });
        }
      }
      return list;
    }
  },

  async getAnalyticsSummary(days: number = 30): Promise<AnalyticsSummary> {
    try {
      return await request<AnalyticsSummary>(`/logs/analytics/summary?days=${days}`);
    } catch {
      return {
        days_count: days,
        logged_days_count: 5,
        average_energy: 3.8,
        toxicosis: { average_nausea: 1.2, max_nausea: 3, days_with_vomiting: 0 },
        weight_dynamics: [
          { date: '2026-10-01', value: 62.0 },
          { date: '2026-10-06', value: 62.3 },
          { date: '2026-10-12', value: 62.7 },
        ],
        nausea_dynamics: [
          { date: '2026-10-08', value: 2 },
          { date: '2026-10-10', value: 1 },
          { date: '2026-10-12', value: 0 },
        ],
        water_dynamics: [
          { date: '2026-10-08', value: 6 },
          { date: '2026-10-10', value: 8 },
          { date: '2026-10-12', value: 7 },
        ],
        kicks_dynamics: [
          { date: '2026-10-08', value: 8 },
          { date: '2026-10-10', value: 14 },
          { date: '2026-10-12', value: 16 },
        ],
        top_symptoms: { 'Сонливость': 4, 'Легкая изжога': 2, 'Тянет на соленое': 3 },
      };
    }
  },

  async getDoctorReport(days: number = 14): Promise<DoctorReport> {
    try {
      return await request<DoctorReport>(`/logs/export/doctor-summary?days=${days}`);
    } catch {
      return {
        period_start: '2026-09-28',
        period_end: '2026-10-12',
        patient_name: tg.user.first_name || 'Мама',
        gestational_age: '16 нед. 2 дн. (II триместр)',
        total_days_logged: 12,
        average_blood_pressure: '115/75',
        weight_change: '62.7 кг (+0.7 кг)',
        frequent_symptoms: ['Сонливость (5 дн.)', 'Легкая тошнота утром (2 дн.)'],
        notes_and_questions: ['10.10: Спросить у врача про витамины с железом'],
        formatted_markdown_text: `📋 **ОТЧЕТ САМОЧУВСТВИЯ ДЛЯ ВРАЧА — «МамаТрекер»**\n👤 Пациент: ${tg.user.first_name}\n👶 Срок: 16 недель 2 дня (II триместр)\n🩺 Давление: 115/75\n⚖️ Вес: 62.7 кг (+0.7 кг за 14 дн.)\n⚠️ Частые симптомы: Сонливость, легкая тошнота утром.`,
      };
    }
  },
};

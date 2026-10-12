import React, { useState, useEffect } from 'react';
import {
  Heart,
  TrendingUp,
  Baby,
  Calendar,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import { tg } from './services/telegram';
import { api } from './services/api';
import type {
  PregnancyProfile,
  DailyLog,
  CalendarDayStatus,
  AnalyticsSummary,
} from './types';
import { FetalCard } from './components/FetalCard';
import { CalendarStrip } from './components/CalendarStrip';
import { DiaryForm } from './components/DiaryForm';
import { ContractionTimer } from './components/ContractionTimer';
import { HospitalBag } from './components/HospitalBag';
import { OnboardingModal } from './components/OnboardingModal';
import { AnalyticsModal } from './components/AnalyticsModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'diary' | 'contractions' | 'bag'>('diary');
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [calendarStatuses, setCalendarStatuses] = useState<CalendarDayStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [currentLog, setCurrentLog] = useState<DailyLog | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Telegram WebApp
  useEffect(() => {
    tg.init();
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Profile
      const prof = await api.getProfile();
      setProfile(prof);
      if (!prof) {
        setIsOnboardingOpen(true);
      }

      // 2. Fetch Calendar logs for current month
      const now = new Date();
      const logs = await api.getCalendarLogs(now.getFullYear(), now.getMonth() + 1);
      setCalendarStatuses(logs);

      // 3. Fetch today's log
      const todayStr = now.toISOString().split('T')[0];
      const todayLog = await api.getDailyLog(todayStr);
      setCurrentLog(todayLog);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload log when date changes
  useEffect(() => {
    let isSubscribed = true;
    api.getDailyLog(selectedDate).then((log) => {
      if (isSubscribed) {
        setCurrentLog(log);
      }
    });
    return () => {
      isSubscribed = false;
    };
  }, [selectedDate]);

  // Handle month change in calendar
  const handleMonthChange = async (year: number, month: number) => {
    const logs = await api.getCalendarLogs(year, month);
    setCalendarStatuses(logs);
  };

  // Handle saving daily log
  const handleSaveDailyLog = async (logToSave: DailyLog) => {
    const saved = await api.upsertDailyLog(logToSave);
    setCurrentLog(saved);

    // Refresh calendar dots
    const d = new Date(selectedDate);
    const updatedStatuses = await api.getCalendarLogs(d.getFullYear(), d.getMonth() + 1);
    setCalendarStatuses(updatedStatuses);
  };

  // Handle saving profile from onboarding
  const handleSaveProfile = async (data: {
    start_date?: string;
    estimated_due_date?: string;
    initial_weight?: number;
  }) => {
    const updated = await api.createProfile(data);
    setProfile(updated);
  };

  // Open analytics
  const handleOpenAnalytics = async () => {
    tg.hapticImpact('light');
    try {
      const summary = await api.getAnalyticsSummary(30);
      setAnalytics(summary);
      setIsAnalyticsOpen(true);
    } catch (e) {
      console.error(e);
      setIsAnalyticsOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FFF9F9] text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-400 mb-4 animate-bounce">
          <Baby className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-gray-800">МамаТрекер</h2>
        <p className="text-xs text-gray-400 mt-1">Загружаем ваш персональный дневник...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] px-4 pt-3 pb-24 max-w-md mx-auto select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-400 to-rose-300 flex items-center justify-center text-white shadow-soft">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-gray-800 tracking-tight leading-none">
              МамаТрекер
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">
              Привет, {tg.user.first_name || 'Мама'}! ✨
            </p>
          </div>
        </div>

        {/* Analytics & Export Button */}
        <button
          onClick={handleOpenAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-100 rounded-2xl shadow-soft text-gray-700 text-xs font-bold hover:bg-rose-50 active:scale-95 transition-all"
        >
          <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
          <span>Аналитика</span>
        </button>
      </header>

      {/* Main Screen Content based on Active Tab */}
      <main className="space-y-3">
        {activeTab === 'diary' && (
          <>
            {/* 1. Baby Gestational Widget Card */}
            <FetalCard
              profile={profile}
              onEditProfile={() => {
                tg.hapticImpact('light');
                setIsOnboardingOpen(true);
              }}
            />

            {/* 2. Interactive Calendar Strip (Horizontal + Expanded) */}
            <CalendarStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              calendarStatuses={calendarStatuses}
              onMonthChange={handleMonthChange}
            />

            {/* 3. Daily Diary Check-in Form */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Чек-ин за {selectedDate}
                </h3>
                {selectedDate === new Date().toISOString().split('T')[0] && (
                  <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                    Сегодня
                  </span>
                )}
              </div>

              <DiaryForm
                dateStr={selectedDate}
                initialLog={currentLog}
                onSave={handleSaveDailyLog}
                currentWeek={profile?.calculation?.current_week ?? 14}
              />
            </div>
          </>
        )}

        {activeTab === 'contractions' && <ContractionTimer />}

        {activeTab === 'bag' && <HospitalBag />}
      </main>

      {/* Medical Disclaimer Footer */}
      <footer className="text-center py-4 px-2">
        <p className="text-[10px] text-gray-400 max-w-xs mx-auto leading-relaxed">
          🌸 МамаТрекер создан для заботливого мониторинга самочувствия. Сервис носит информационный характер и не заменяет консультацию акушера-гинеколога.
        </p>
      </footer>

      {/* Bottom Sticky Tab Navigation Bar */}
      <nav className="fixed bottom-3 left-4 right-4 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md rounded-3xl p-1.5 shadow-2xl border border-rose-100 flex items-center justify-around">
        <button
          onClick={() => {
            tg.hapticImpact('light');
            setActiveTab('diary');
          }}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-2xl transition-all ${
            activeTab === 'diary'
              ? 'bg-rose-50 text-rose-500 font-bold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Дневник</span>
        </button>

        <button
          onClick={() => {
            tg.hapticImpact('light');
            setActiveTab('contractions');
          }}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-2xl transition-all ${
            activeTab === 'contractions'
              ? 'bg-rose-50 text-rose-500 font-bold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Clock className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Схватки</span>
        </button>

        <button
          onClick={() => {
            tg.hapticImpact('light');
            setActiveTab('bag');
          }}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-2xl transition-all ${
            activeTab === 'bag'
              ? 'bg-rose-50 text-rose-500 font-bold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">В роддом</span>
        </button>
      </nav>

      {/* Onboarding / Profile Edit Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSave={handleSaveProfile}
        initialStartDate={profile?.start_date}
        initialEdd={profile?.estimated_due_date}
        initialWeight={profile?.initial_weight}
      />

      {/* Analytics & Doctor Export Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        analytics={analytics}
        onGenerateReport={api.getDoctorReport}
      />
    </div>
  );
};

export default App;

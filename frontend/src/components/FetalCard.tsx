import React from 'react';
import { Sparkles, Baby } from 'lucide-react';
import type { PregnancyProfile } from '../types';

interface FetalCardProps {
  profile: PregnancyProfile | null;
  onEditProfile: () => void;
}

export const FetalCard: React.FC<FetalCardProps> = ({ profile, onEditProfile }) => {
  if (!profile || !profile.calculation) {
    return (
      <div className="bg-gradient-to-r from-rose-100 to-lavender-100 p-5 rounded-3xl border border-rose-200/60 shadow-soft text-center">
        <div className="w-12 h-12 mx-auto bg-white/80 rounded-2xl flex items-center justify-center text-rose-400 mb-2 shadow-sm">
          <Baby className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">Добро пожаловать в МамаТрекер!</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          Укажите дату последних месячных или предполагаемую дату родов, чтобы рассчитать срок
        </p>
        <button
          onClick={onEditProfile}
          className="mt-3 px-5 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-xs font-semibold rounded-2xl shadow-button transition-transform active:scale-95"
        >
          Рассчитать срок
        </button>
      </div>
    );
  }

  const { calculation } = profile;
  const { current_week, current_day, trimester_title, days_left, fetal_info } = calculation;
  const progressPercent = Math.min(100, Math.round((current_week / 40) * 100));

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-lavender-50 p-5 rounded-3xl border border-rose-100/80 shadow-soft">
      {/* Decorative background blurs */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-200/40 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-lavender-200/40 rounded-full blur-xl pointer-events-none" />

      {/* Top Header with Weeks & Trimester Badge */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-white/90 border border-rose-200/60 text-rose-500 text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-rose-400" />
            {trimester_title}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {days_left > 0 ? `до встречи ${days_left} дн.` : 'Доношенный срок!'}
          </span>
        </div>
        <button
          onClick={onEditProfile}
          className="text-[11px] text-gray-400 hover:text-rose-500 transition-colors underline decoration-dotted"
        >
          Изменить срок
        </button>
      </div>

      {/* Main Content: Baby Size & Fruit Analogy */}
      <div className="flex items-center justify-between gap-4 my-2 relative z-10">
        <div className="flex-1">
          <div className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-baseline gap-1.5">
            <span>{current_week} недель</span>
            <span className="text-sm font-semibold text-rose-400">
              {current_day > 0 ? `+ ${current_day} дн.` : ''}
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
            <span>Малыш размером с:</span>
            <strong className="text-gray-800 font-bold">{fetal_info.fruit_name}</strong>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
            {fetal_info.weight_grams ? (
              <span className="bg-white/70 px-2 py-0.5 rounded-lg border border-gray-100">
                ⚖️ ~{fetal_info.weight_grams} г
              </span>
            ) : null}
            {fetal_info.length_cm ? (
              <span className="bg-white/70 px-2 py-0.5 rounded-lg border border-gray-100">
                📏 ~{fetal_info.length_cm} см
              </span>
            ) : null}
          </div>
        </div>

        {/* Big Fruit Emoji Card */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 bg-white/90 rounded-2xl border border-rose-100 flex flex-col items-center justify-center shadow-card shrink-0 p-2 text-center animate-gentle-pulse">
          <span className="text-4xl filter drop-shadow-sm leading-none">
            {fetal_info.fruit_emoji}
          </span>
          <span className="text-[10px] font-medium text-rose-400 mt-1 truncate max-w-[70px]">
            {fetal_info.fruit_name}
          </span>
        </div>
      </div>

      {/* Fetal Description */}
      <p className="text-xs text-gray-600 bg-white/60 p-2.5 rounded-2xl border border-rose-50 mt-3 relative z-10 leading-relaxed">
        {fetal_info.description}
      </p>

      {/* 40-week Progress Bar */}
      <div className="mt-3 relative z-10">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-medium">
          <span>1 неделя</span>
          <span className="font-semibold text-rose-500">{progressPercent}% пути</span>
          <span>40 недель</span>
        </div>
        <div className="w-full bg-rose-100/60 h-2 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-rose-400 to-lavender-400 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

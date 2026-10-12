import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarDayStatus } from '../types';
import { tg } from '../services/telegram';

interface CalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  calendarStatuses: CalendarDayStatus[];
  onMonthChange: (year: number, month: number) => void;
}

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onSelectDate,
  calendarStatuses,
  onMonthChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedDateObj = new Date(selectedDate);
  const currentYear = selectedDateObj.getFullYear();
  const currentMonth = selectedDateObj.getMonth() + 1;

  const todayStr = new Date().toISOString().split('T')[0];

  // Map day status by date string for fast lookup
  const statusMap = new Map<string, CalendarDayStatus>();
  calendarStatuses.forEach((st) => statusMap.set(st.date, st));

  // Generate days for the week around selected date (Monday to Sunday)
  const getDaysForCurrentWeek = () => {
    const curr = new Date(selectedDate);
    const dayOfWeek = (curr.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }
    return weekDays;
  };

  const weekDays = getDaysForCurrentWeek();

  // Handle month navigation in expanded mode
  const handlePrevMonth = () => {
    tg.hapticImpact('light');
    let newYear = currentYear;
    let newMonth = currentMonth - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange(newYear, newMonth);
  };

  const handleNextMonth = () => {
    tg.hapticImpact('light');
    let newYear = currentYear;
    let newMonth = currentMonth + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange(newYear, newMonth);
  };

  const handleDateClick = (dStr: string) => {
    tg.hapticSelection();
    onSelectDate(dStr);
  };

  // Generate full month grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7;

  return (
    <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-rose-100/60 my-3">
      {/* Header with Month Title and Toggle */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-bold text-gray-800">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isExpanded && (
            <div className="flex items-center mr-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-xl hover:bg-rose-50 text-gray-400 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-xl hover:bg-rose-50 text-gray-400 active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            onClick={() => {
              tg.hapticImpact('light');
              setIsExpanded(!isExpanded);
            }}
            className="text-[11px] font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl transition-colors"
          >
            {isExpanded ? 'Свернуть' : 'Весь месяц'}
          </button>
        </div>
      </div>

      {/* Week Strip Mode */}
      {!isExpanded ? (
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((dateStr, idx) => {
            const dateObj = new Date(dateStr);
            const dayNum = dateObj.getDate();
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const status = statusMap.get(dateStr);
            const hasLog = status?.has_log;

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-rose-400 text-white shadow-button scale-105'
                    : isToday
                    ? 'bg-rose-50/80 text-rose-500 font-bold'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  {DAYS_OF_WEEK[idx]}
                </span>
                <span className="text-sm font-bold mt-0.5">{dayNum}</span>

                {/* Status Dot */}
                <span className="h-1.5 w-1.5 mt-1 rounded-full flex items-center justify-center">
                  {hasLog ? (
                    <span className={`block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-400 ring-2 ring-emerald-100'}`} />
                  ) : (
                    <span className="block w-1 h-1 rounded-full bg-transparent" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Full Month Grid Mode */
        <div className="space-y-1">
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty offset placeholders */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dStr === selectedDate;
              const isToday = dStr === todayStr;
              const status = statusMap.get(dStr);
              const hasLog = status?.has_log;

              return (
                <button
                  key={dStr}
                  onClick={() => handleDateClick(dStr)}
                  className={`h-10 flex flex-col items-center justify-center rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-rose-400 text-white font-bold shadow-button scale-105'
                      : isToday
                      ? 'bg-rose-50 text-rose-500 font-bold border border-rose-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasLog && (
                    <span
                      className={`block w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : 'bg-emerald-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

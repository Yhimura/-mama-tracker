import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, AlertTriangle, Clock, HeartHandshake } from 'lucide-react';
import { tg } from '../services/telegram';

interface Contraction {
  id: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  intervalSeconds?: number;
}

export const ContractionTimer: React.FC = () => {
  const [contractions, setContractions] = useState<Contraction[]>(() => {
    const saved = localStorage.getItem('mompulse_contractions');
    return saved ? JSON.parse(saved) : [];
  });

  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStartTime, setCurrentStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Timer tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && currentStartTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - currentStartTime) / 1000));
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, currentStartTime]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('mompulse_contractions', JSON.stringify(contractions));
  }, [contractions]);

  const handleToggleContraction = () => {
    tg.hapticImpact('heavy');
    const now = Date.now();

    if (!isActive) {
      // Start contraction
      setIsActive(true);
      setCurrentStartTime(now);
      setElapsedSeconds(0);
    } else {
      // Stop contraction
      if (currentStartTime) {
        const duration = Math.max(1, Math.floor((now - currentStartTime) / 1000));

        // Calculate interval from previous contraction start
        let intervalSec: number | undefined = undefined;
        if (contractions.length > 0) {
          intervalSec = Math.floor((currentStartTime - contractions[0].startTime) / 1000);
        }

        const newContraction: Contraction = {
          id: String(now),
          startTime: currentStartTime,
          endTime: now,
          durationSeconds: duration,
          intervalSeconds: intervalSec,
        };

        setContractions([newContraction, ...contractions]);
      }
      setIsActive(false);
      setCurrentStartTime(null);
      setElapsedSeconds(0);
      tg.hapticNotification('success');
    }
  };

  const handleReset = () => {
    tg.hapticImpact('medium');
    if (confirm('Сбросить историю схваток?')) {
      setContractions([]);
      setIsActive(false);
      setCurrentStartTime(null);
      setElapsedSeconds(0);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Rule 5-1-1 analysis:
  // Contractions every 5 minutes, lasting 1 minute (60s), for at least several in a row
  const recentContractions = contractions.slice(0, 5);
  const avgDuration =
    recentContractions.length > 0
      ? recentContractions.reduce((acc, c) => acc + c.durationSeconds, 0) / recentContractions.length
      : 0;

  const validIntervals = recentContractions
    .map((c) => c.intervalSeconds)
    .filter((iv): iv is number => iv !== undefined && iv > 0);

  const avgInterval =
    validIntervals.length > 0
      ? validIntervals.reduce((acc, iv) => acc + iv, 0) / validIntervals.length
      : 0;

  // Analysis status
  let statusBadge = {
    title: 'Наблюдаем за динамикой',
    desc: 'Зафиксируйте 3-4 схватки для анализа регулярности.',
    color: 'bg-gray-50 border-gray-200 text-gray-700',
    alert: false,
  };

  if (contractions.length >= 3) {
    if (avgInterval <= 360 && avgInterval >= 180 && avgDuration >= 45) {
      statusBadge = {
        title: '🚗 Пора выезжать в роддом!',
        desc: 'Схватки идут каждые 3-5 минут и длятся около минуты. Свяжитесь с врачом или вызовите скорую!',
        color: 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse',
        alert: true,
      };
    } else if (avgInterval <= 600 && avgInterval > 360) {
      statusBadge = {
        title: '⚠️ Регулярные схватки — готовьтесь',
        desc: 'Интервал около 6–10 минут. Проверьте сумку в роддом и документы.',
        color: 'bg-amber-50 border-amber-300 text-amber-800',
        alert: false,
      };
    } else {
      statusBadge = {
        title: '🌿 Тренировочные схватки (Брэкстона-Хикса)',
        desc: 'Интервалы пока нерегулярные. Попробуйте выпить стакан теплой воды и отдохнуть.',
        color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        alert: false,
      };
    }
  }

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Analysis Card */}
      <div className={`p-4 rounded-3xl border shadow-soft ${statusBadge.color}`}>
        <div className="flex items-start gap-2.5">
          {statusBadge.alert ? (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <HeartHandshake className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-extrabold">{statusBadge.title}</h4>
            <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{statusBadge.desc}</p>
          </div>
        </div>
      </div>

      {/* Big Action Button */}
      <div className="bg-white/95 rounded-3xl p-6 shadow-soft border border-rose-100/60 text-center flex flex-col items-center justify-center">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {isActive ? 'Схватка длится' : 'Готовы к измерению'}
        </span>

        {/* Big Stopwatch Display */}
        <div className="text-5xl font-black text-gray-800 tracking-tight font-mono mb-6">
          {formatTime(elapsedSeconds)}
        </div>

        {/* Start / Stop Circular Tap Button */}
        <button
          onClick={handleToggleContraction}
          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-white font-extrabold shadow-button transition-transform active:scale-95 duration-200 ${
            isActive
              ? 'bg-gradient-to-tr from-rose-500 to-red-500 animate-gentle-pulse'
              : 'bg-gradient-to-tr from-rose-400 to-lavender-400 hover:from-rose-500 hover:to-lavender-500'
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-8 h-8 fill-white mb-1" />
              <span className="text-xs uppercase tracking-wide">Закончилась</span>
            </>
          ) : (
            <>
              <Play className="w-8 h-8 fill-white mb-1 translate-x-0.5" />
              <span className="text-xs uppercase tracking-wide">Схватка!</span>
            </>
          )}
        </button>

        {isActive && (
          <p className="text-[11px] text-gray-400 mt-4 animate-pulse">
            Дышите глубоко и расслабьте плечи 🌸
          </p>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-rose-100/60">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold text-gray-800">История схваток ({contractions.length})</h4>
          </div>

          {contractions.length > 0 && (
            <button
              onClick={handleReset}
              className="text-[11px] font-semibold text-gray-400 hover:text-rose-500 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Сброс
            </button>
          )}
        </div>

        {contractions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            Здесь будут отображаться интервалы и длительность ваших схваток
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
            {contractions.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100 text-xs"
              >
                <div>
                  <span className="font-bold text-gray-800">{formatTimestamp(c.startTime)}</span>
                  <span className="text-[10px] text-gray-400 block">
                    #{contractions.length - idx}
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-gray-400 block">Длительность</span>
                  <span className="font-bold text-rose-500">{c.durationSeconds} сек.</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Интервал</span>
                  <span className="font-bold text-gray-700">
                    {c.intervalSeconds ? `${Math.round(c.intervalSeconds / 60)} мин.` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

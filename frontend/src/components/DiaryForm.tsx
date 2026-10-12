import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Activity,
  Plus,
  Minus,
  Smile,
  Zap,
  Scale,
  FileText,
  CheckCircle,
  Footprints,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DailyLog } from '../types';
import { tg } from '../services/telegram';

interface DiaryFormProps {
  dateStr: string;
  initialLog: DailyLog | null;
  onSave: (log: DailyLog) => Promise<void>;
  currentWeek?: number;
}

const NAUSEA_LEVELS = [
  { level: 0, emoji: '😊', label: 'Отлично' },
  { level: 1, emoji: '😐', label: 'Легкая мутность' },
  { level: 2, emoji: '🤢', label: 'Тошнит' },
  { level: 3, emoji: '😣', label: 'Сильная тошнота' },
  { level: 4, emoji: '😫', label: 'Позывы к рвоте' },
  { level: 5, emoji: '🤮', label: 'Рвота' },
];

const SYMPTOM_OPTIONS = [
  'Изжога',
  'Отеки',
  'Боль в пояснице',
  'Головная боль',
  'Судороги',
  'Сонливость',
  'Перепады настроения',
  'Частые позывы',
  'Заложенность носа',
  'Тяжесть в ногах',
];

const FOOD_TAG_OPTIONS = [
  'Тянет на сладкое',
  'Тянет на соленое',
  'Аппетит снижен',
  'Здоровая еда',
  'Срывы на фастфуд',
  'Дробное питание',
];

export const DiaryForm: React.FC<DiaryFormProps> = ({
  dateStr,
  initialLog,
  onSave,
  currentWeek = 14,
}) => {
  const [nauseaLevel, setNauseaLevel] = useState<number>(initialLog?.nausea_level ?? 0);
  const [energyLevel, setEnergyLevel] = useState<number>(initialLog?.energy_level ?? 3);
  const [symptoms, setSymptoms] = useState<string[]>(initialLog?.symptoms ?? []);
  const [waterCups, setWaterCups] = useState<number>(initialLog?.water_cups ?? 0);
  const [foodNotes, setFoodNotes] = useState<string>(initialLog?.food_notes ?? '');
  const [foodTags, setFoodTags] = useState<string[]>(initialLog?.food_tags ?? []);
  const [kickCount, setKickCount] = useState<number>(initialLog?.kick_count ?? 0);
  const [weight, setWeight] = useState<string>(initialLog?.weight ? String(initialLog.weight) : '');
  const [bpSys, setBpSys] = useState<string>(
    initialLog?.blood_pressure_sys ? String(initialLog.blood_pressure_sys) : ''
  );
  const [bpDia, setBpDia] = useState<string>(
    initialLog?.blood_pressure_dia ? String(initialLog.blood_pressure_dia) : ''
  );
  const [notes, setNotes] = useState<string>(initialLog?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when initialLog or date changes
  useEffect(() => {
    setNauseaLevel(initialLog?.nausea_level ?? 0);
    setEnergyLevel(initialLog?.energy_level ?? 3);
    setSymptoms(initialLog?.symptoms ?? []);
    setWaterCups(initialLog?.water_cups ?? 0);
    setFoodNotes(initialLog?.food_notes ?? '');
    setFoodTags(initialLog?.food_tags ?? []);
    setKickCount(initialLog?.kick_count ?? 0);
    setWeight(initialLog?.weight ? String(initialLog.weight) : '');
    setBpSys(initialLog?.blood_pressure_sys ? String(initialLog.blood_pressure_sys) : '');
    setBpDia(initialLog?.blood_pressure_dia ? String(initialLog.blood_pressure_dia) : '');
    setNotes(initialLog?.notes ?? '');
    setSavedSuccess(false);
  }, [dateStr, initialLog]);

  const toggleSymptom = (sym: string) => {
    tg.hapticImpact('light');
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const toggleFoodTag = (tag: string) => {
    tg.hapticImpact('light');
    setFoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleWaterDelta = (delta: number) => {
    tg.hapticImpact('light');
    setWaterCups((prev) => Math.max(0, Math.min(24, prev + delta)));
  };

  const handleKickIncrement = () => {
    tg.hapticImpact('medium');
    setKickCount((prev) => prev + 1);
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const logToSave: DailyLog = {
      log_date: dateStr,
      nausea_level: nauseaLevel,
      energy_level: energyLevel,
      symptoms,
      water_cups: waterCups,
      food_notes: foodNotes.trim() || undefined,
      food_tags: foodTags,
      weight: weight ? parseFloat(weight) : undefined,
      blood_pressure_sys: bpSys ? parseInt(bpSys, 10) : undefined,
      blood_pressure_dia: bpDia ? parseInt(bpDia, 10) : undefined,
      kick_count: kickCount,
      notes: notes.trim() || undefined,
    };

    try {
      await onSave(logToSave);
      setSavedSuccess(true);
      tg.hapticNotification('success');

      // Celebration confetti
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FB7193', '#C084FC', '#FDBF98'],
        });
      } catch {
        // ignore
      }

      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      tg.hapticNotification('error');
      console.error('Failed to save log', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Bind to Telegram MainButton
  useEffect(() => {
    tg.showMainButton(`Сохранить за ${dateStr.slice(5)}`, () => {
      handleFormSubmit();
    });

    return () => {
      tg.hideMainButton();
    };
  }, [
    dateStr,
    nauseaLevel,
    energyLevel,
    symptoms,
    waterCups,
    foodNotes,
    foodTags,
    kickCount,
    weight,
    bpSys,
    bpDia,
    notes,
  ]);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 pb-20">
      {/* 1. Toxicosis & Nausea */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-rose-100/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 text-rose-500 rounded-xl">
              <Smile className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-gray-800">Токсикоз и тошнота</h4>
          </div>
          <span className="text-xs font-semibold text-rose-500">
            {NAUSEA_LEVELS[nauseaLevel].label}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 mt-2">
          {NAUSEA_LEVELS.map((item) => (
            <button
              type="button"
              key={item.level}
              onClick={() => {
                tg.hapticImpact('light');
                setNauseaLevel(item.level);
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                nauseaLevel === item.level
                  ? 'bg-rose-100/80 border-2 border-rose-400 scale-105 shadow-sm'
                  : 'bg-gray-50/80 border border-gray-100 hover:bg-gray-100/60'
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">{item.level}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Caring Red Flags Safety Banner */}
      {(nauseaLevel >= 4 ||
        (bpSys && parseInt(bpSys, 10) >= 140) ||
        (bpDia && parseInt(bpDia, 10) >= 90)) && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Внимание к самочувствию:</strong>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
              При непрекращающейся рвоте или давлении выше 140/90 рекомендуем не откладывать звонок врачу или обратиться за медицинской помощью (103 / 112).
            </p>
          </div>
        </div>
      )}

      {/* 2. Energy Level */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-lavender-100/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-lavender-50 text-lavender-500 rounded-xl">
              <Zap className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-gray-800">Уровень энергии</h4>
          </div>
          <span className="text-xs font-bold text-lavender-500">{energyLevel} из 5</span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              type="button"
              key={lvl}
              onClick={() => {
                tg.hapticImpact('light');
                setEnergyLevel(lvl);
              }}
              className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all ${
                energyLevel === lvl
                  ? 'bg-lavender-400 text-white shadow-button scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-lavender-50'
              }`}
            >
              {lvl === 1 ? '😴 1' : lvl === 3 ? '⚡ 3' : lvl === 5 ? '🚀 5' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Symptoms Chips */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-rose-100/60">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="p-1.5 bg-peach-50 text-peach-400 rounded-xl">
            <Activity className="w-4 h-4" />
          </span>
          <h4 className="text-sm font-bold text-gray-800">Симптомы сегодня</h4>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SYMPTOM_OPTIONS.map((sym) => {
            const isSelected = symptoms.includes(sym);
            return (
              <button
                type="button"
                key={sym}
                onClick={() => toggleSymptom(sym)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-rose-400 text-white shadow-sm scale-102 font-semibold'
                    : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
                }`}
              >
                {isSelected ? '✓ ' : ''}
                {sym}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Hydration: Water tracker */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-sky-100/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-50 text-sky-500 rounded-xl">
              <Droplets className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-gray-800">Водный баланс</h4>
          </div>
          <span className="text-xs font-bold text-sky-600">
            {waterCups} стаканов (~{(waterCups * 0.25).toFixed(1)} л)
          </span>
        </div>

        <div className="flex items-center justify-between bg-sky-50/50 p-2.5 rounded-2xl border border-sky-100">
          <button
            type="button"
            onClick={() => handleWaterDelta(-1)}
            disabled={waterCups <= 0}
            className="w-10 h-10 rounded-xl bg-white text-gray-600 shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 disabled:opacity-40"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Visual water cups indicator */}
          <div className="flex items-center gap-1 overflow-x-auto px-2 no-scrollbar">
            {Array.from({ length: Math.min(8, Math.max(waterCups, 4)) }).map((_, i) => (
              <span
                key={i}
                className={`text-lg transition-transform ${
                  i < waterCups ? 'opacity-100 scale-105' : 'opacity-25 grayscale'
                }`}
              >
                💧
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleWaterDelta(1)}
            className="w-10 h-10 rounded-xl bg-sky-400 text-white shadow-button flex items-center justify-center hover:bg-sky-500 active:scale-95 font-bold"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 5. Baby Kicks Counter (especially active from week 18+) */}
      <div className="bg-gradient-to-r from-peach-50 to-rose-50 rounded-3xl p-4 shadow-soft border border-peach-200/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white text-peach-400 rounded-xl shadow-sm">
              <Footprints className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Счетчик шевелений</h4>
              <p className="text-[10px] text-gray-400">
                {currentWeek >= 18 ? 'Активно для II и III триместра' : 'Начиная с 18–20 недели'}
              </p>
            </div>
          </div>
          <span className="text-lg font-extrabold text-peach-400">{kickCount}</span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleKickIncrement}
            className="flex-1 py-3 bg-white hover:bg-rose-50 border border-peach-200 text-gray-800 font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="text-lg">👣</span>
            <span className="text-xs">Зафиксировать толчок (+1)</span>
          </button>
          {kickCount > 0 && (
            <button
              type="button"
              onClick={() => {
                tg.hapticImpact('light');
                setKickCount(0);
              }}
              className="px-3 py-3 bg-white/70 text-gray-400 text-xs rounded-2xl hover:text-gray-600"
            >
              Сброс
            </button>
          )}
        </div>
      </div>

      {/* 6. Food & Nutrition */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-rose-100/60">
        <h4 className="text-sm font-bold text-gray-800 mb-2">Питание и аппетит</h4>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {FOOD_TAG_OPTIONS.map((tag) => {
            const isSelected = foodTags.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleFoodTag(tag)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-rose-400 text-white font-semibold shadow-sm'
                    : 'bg-gray-50 text-gray-600 border border-gray-100'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={foodNotes}
          onChange={(e) => setFoodNotes(e.target.value)}
          placeholder="Что вкусного ела сегодня? (заметка о еде)"
          className="w-full text-xs p-3 rounded-2xl bg-gray-50/80 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      </div>

      {/* 7. Vitals: Weight & Blood Pressure */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-rose-100/60">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 bg-rose-50 text-rose-500 rounded-xl">
            <Scale className="w-4 h-4" />
          </span>
          <h4 className="text-sm font-bold text-gray-800">Вес и давление (опционально)</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-400 block mb-1">Вес (кг)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="62.5"
              className="w-full text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-400 block mb-1">
              Давление (АД)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={bpSys}
                onChange={(e) => setBpSys(e.target.value)}
                placeholder="110"
                className="w-full text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <span className="text-gray-400 text-xs">/</span>
              <input
                type="number"
                value={bpDia}
                onChange={(e) => setBpDia(e.target.value)}
                placeholder="70"
                className="w-full text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 8. Personal Notes & Questions for Doctor */}
      <div className="bg-white/95 rounded-3xl p-4 shadow-soft border border-rose-100/60">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 bg-lavender-50 text-lavender-500 rounded-xl">
            <FileText className="w-4 h-4" />
          </span>
          <h4 className="text-sm font-bold text-gray-800">Заметки и вопросы к врачу</h4>
        </div>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Как прошел день? Какие мысли или вопросы записать к следующему приему?"
          className="w-full text-xs p-3 rounded-2xl bg-gray-50/80 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-lavender-200"
        />
      </div>

      {/* Submit button on screen (for browsers outside Telegram or easy tap) */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-3.5 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-2xl shadow-button flex items-center justify-center gap-2 transition-transform active:scale-98"
      >
        {savedSuccess ? (
          <>
            <CheckCircle className="w-5 h-5 text-white" />
            <span>Сохранено! ❤️</span>
          </>
        ) : (
          <span>{isSaving ? 'Сохранение...' : `Сохранить запись за ${dateStr}`}</span>
        )}
      </button>
    </form>
  );
};

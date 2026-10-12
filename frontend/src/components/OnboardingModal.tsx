import React, { useState } from 'react';
import { X, Sparkles, Baby } from 'lucide-react';
import { tg } from '../services/telegram';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { start_date?: string; estimated_due_date?: string; initial_weight?: number }) => Promise<void>;
  initialStartDate?: string;
  initialEdd?: string;
  initialWeight?: number;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStartDate,
  initialEdd,
  initialWeight,
}) => {
  const [calcMethod, setCalcMethod] = useState<'lmp' | 'edd'>(initialEdd && !initialStartDate ? 'edd' : 'lmp');
  const [dateValue, setDateValue] = useState<string>(
    initialStartDate || initialEdd || new Date().toISOString().split('T')[0]
  );
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : '');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Real-time calculation preview
  const calculatePreview = () => {
    if (!dateValue) return null;
    try {
      const today = new Date();
      let lmpDate: Date;
      if (calcMethod === 'lmp') {
        lmpDate = new Date(dateValue);
      } else {
        lmpDate = new Date(new Date(dateValue).getTime() - 280 * 24 * 3600 * 1000);
      }
      const days = Math.max(0, Math.floor((today.getTime() - lmpDate.getTime()) / (24 * 3600 * 1000)));
      const weeks = Math.floor(days / 7);
      return { weeks, days: days % 7 };
    } catch {
      return null;
    }
  };

  const preview = calculatePreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateValue) return;

    setIsLoading(true);
    tg.hapticImpact('medium');

    try {
      const payload: { start_date?: string; estimated_due_date?: string; initial_weight?: number } = {
        initial_weight: weight ? parseFloat(weight) : undefined,
      };

      if (calcMethod === 'lmp') {
        payload.start_date = dateValue;
      } else {
        payload.estimated_due_date = dateValue;
      }

      await onSave(payload);
      tg.hapticNotification('success');
      onClose();
    } catch (err) {
      console.error(err);
      tg.hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto bg-gradient-to-tr from-rose-200 to-lavender-200 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm mb-2">
            <Baby className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-800">Календарь беременности</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Укажите данные для автоматического расчета срока и рекомендаций
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method selector tab */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                tg.hapticImpact('light');
                setCalcMethod('lmp');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                calcMethod === 'lmp' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              По месячным (LMP)
            </button>
            <button
              type="button"
              onClick={() => {
                tg.hapticImpact('light');
                setCalcMethod('edd');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                calcMethod === 'edd' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              По дате родов (ПДР)
            </button>
          </div>

          {/* Date Picker Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {calcMethod === 'lmp'
                ? 'Первый день последних месячных:'
                : 'Предполагаемая дата родов (ПДР):'}
            </label>
            <input
              type="date"
              required
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="w-full text-xs p-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-200 font-medium"
            />
          </div>

          {/* Initial weight */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Вес до беременности (кг, опционально):
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Например: 60.5"
              className="w-full text-xs p-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>

          {/* Real-time Calculation Badge */}
          {preview && preview.weeks > 0 && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span className="text-xs text-gray-700">Расчетный срок:</span>
              </div>
              <span className="text-xs font-extrabold text-rose-500">
                {preview.weeks} нед. {preview.days > 0 ? `+ ${preview.days} дн.` : ''}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !dateValue}
            className="w-full py-3.5 bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-button transition-transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить и рассчитать'}
          </button>
        </form>
      </div>
    </div>
  );
};

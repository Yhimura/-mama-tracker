import React, { useState } from 'react';
import { X, TrendingUp, FileText, Check, Copy } from 'lucide-react';
import type { AnalyticsSummary, DoctorReport } from '../types';
import { tg } from '../services/telegram';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: AnalyticsSummary | null;
  onGenerateReport: (days: number) => Promise<DoctorReport>;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics,
  onGenerateReport,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'doctor'>('trends');
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (days: number) => {
    setIsGenerating(true);
    tg.hapticImpact('medium');
    try {
      const rep = await onGenerateReport(days);
      setReport(rep);
      setActiveTab('doctor');
      tg.hapticNotification('success');
    } catch (e) {
      console.error(e);
      tg.hapticNotification('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.formatted_markdown_text);
    setCopied(true);
    tg.hapticNotification('success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-lavender-100 text-lavender-600 rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-800">Аналитика и Отчеты</h3>
            <p className="text-[11px] text-gray-400">Динамика самочувствия за 30 дней</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              tg.hapticImpact('light');
              setActiveTab('trends');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'trends' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            Графики и динамика
          </button>
          <button
            type="button"
            onClick={() => {
              tg.hapticImpact('light');
              if (!report) handleGenerate(14);
              else setActiveTab('doctor');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'doctor' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            Отчет для врача
          </button>
        </div>

        {/* Tab 1: Trends & Dynamics */}
        {activeTab === 'trends' && analytics && (
          <div className="space-y-4">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-rose-50 p-3 rounded-2xl text-center border border-rose-100">
                <span className="text-[10px] text-gray-500 block">Дней с записями</span>
                <span className="text-base font-extrabold text-rose-500">
                  {analytics.logged_days_count} из {analytics.days_count}
                </span>
              </div>
              <div className="bg-lavender-50 p-3 rounded-2xl text-center border border-lavender-100">
                <span className="text-[10px] text-gray-500 block">Ср. тошнота</span>
                <span className="text-base font-extrabold text-lavender-600">
                  {analytics.toxicosis.average_nausea.toFixed(1)} / 5
                </span>
              </div>
              <div className="bg-sky-50 p-3 rounded-2xl text-center border border-sky-100">
                <span className="text-[10px] text-gray-500 block">Ср. энергия</span>
                <span className="text-base font-extrabold text-sky-600">
                  {analytics.average_energy.toFixed(1)} / 5
                </span>
              </div>
            </div>

            {/* Toxicosis Weekly dynamics */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 mb-2">Токсикоз (шкала 0-5)</h4>
              {analytics.nausea_dynamics.length > 0 ? (
                <div className="h-20 flex items-end gap-1.5 pt-2">
                  {analytics.nausea_dynamics.slice(-10).map((pt, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-rose-400 rounded-t-lg transition-all"
                        style={{ height: `${Math.max(12, (pt.value / 5) * 60)}px` }}
                      />
                      <span className="text-[8px] text-gray-400 mt-1">{pt.date.slice(8)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">Данных о тошноте пока нет</p>
              )}
            </div>

            {/* Weight dynamics */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 mb-2">Динамика веса (кг)</h4>
              {analytics.weight_dynamics.length > 0 ? (
                <div className="flex items-center justify-between text-xs py-2 px-1">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Первый замер</span>
                    <strong className="text-gray-800">{analytics.weight_dynamics[0].value} кг</strong>
                  </div>
                  <div className="h-0.5 flex-1 bg-gray-200 mx-3 relative">
                    <div className="w-2 h-2 rounded-full bg-rose-400 absolute right-0 -top-[3px]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Текущий</span>
                    <strong className="text-rose-500">
                      {analytics.weight_dynamics[analytics.weight_dynamics.length - 1].value} кг
                    </strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-3">Вносите вес в чек-ин дня для отслеживания динамики</p>
              )}
            </div>

            {/* Top Frequent Symptoms */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 mb-2">Частые симптомы</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(analytics.top_symptoms).length > 0 ? (
                  Object.entries(analytics.top_symptoms).map(([s, count]) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 bg-white rounded-xl border border-gray-200 text-xs text-gray-700 font-medium"
                    >
                      {s} <b className="text-rose-500">×{count}</b>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">Симптомы не отмечались</p>
                )}
              </div>
            </div>

            {/* Generate Report Action Button */}
            <button
              onClick={() => handleGenerate(14)}
              disabled={isGenerating}
              className="w-full py-3.5 bg-gradient-to-r from-rose-400 to-lavender-400 hover:from-rose-500 hover:to-lavender-500 text-white font-bold text-xs rounded-2xl shadow-button flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{isGenerating ? 'Генерация...' : 'Сформировать сводку для врача'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Doctor Report View */}
        {activeTab === 'doctor' && (
          <div className="space-y-4">
            {report ? (
              <>
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-rose-100">
                    <span className="font-bold text-gray-800">{report.patient_name}</span>
                    <span className="text-rose-500 font-semibold">{report.gestational_age}</span>
                  </div>
                  <p className="text-gray-600">
                    <strong>Период:</strong> {report.period_start} — {report.period_end} ({report.total_days_logged} дн.)
                  </p>
                  <p className="text-gray-600">
                    <strong>АД:</strong> {report.average_blood_pressure}
                  </p>
                  <p className="text-gray-600">
                    <strong>Вес:</strong> {report.weight_change}
                  </p>
                  <div>
                    <strong className="block text-gray-700 mb-1">Симптомы:</strong>
                    <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                      {report.frequent_symptoms.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  {report.notes_and_questions.length > 0 && (
                    <div className="pt-2 border-t border-rose-100">
                      <strong className="block text-gray-700 mb-1">Вопросы к врачу:</strong>
                      <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                        {report.notes_and_questions.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="flex-1 py-3 bg-rose-400 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-button flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Скопировано!' : 'Скопировать текст'}</span>
                  </button>

                  <button
                    onClick={() => {
                      tg.hapticImpact('light');
                      handleGenerate(30);
                    }}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl"
                  >
                    За 30 дней
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">Нажмите кнопку ниже для генерации отчета</p>
                <button
                  onClick={() => handleGenerate(14)}
                  className="mt-3 px-5 py-2.5 bg-rose-400 text-white text-xs font-bold rounded-2xl shadow-button"
                >
                  Сформировать отчет
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

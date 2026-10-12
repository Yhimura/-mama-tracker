import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, ShoppingBag, FolderCheck, Baby, Heart } from 'lucide-react';
import { tg } from '../services/telegram';

interface BagItem {
  id: string;
  category: 'docs' | 'labor' | 'postpartum' | 'baby' | 'discharge';
  title: string;
  checked: boolean;
}

const DEFAULT_ITEMS: BagItem[] = [
  // Документы
  { id: '1', category: 'docs', title: 'Паспорт и копия', checked: false },
  { id: '2', category: 'docs', title: 'Обменная карта беременной', checked: false },
  { id: '3', category: 'docs', title: 'Полис ОМС / ДМС и СНИЛС', checked: false },
  { id: '4', category: 'docs', title: 'Родовый сертификат / Контракт', checked: false },
  // В родильное
  { id: '5', category: 'labor', title: 'Моющиеся тапочки', checked: false },
  { id: '6', category: 'labor', title: 'Компрессионные чулки 1-2 класса', checked: false },
  { id: '7', category: 'labor', title: 'Вода без газа (2 бут. по 0.5л со спорт-дозатором)', checked: false },
  { id: '8', category: 'labor', title: 'Гигиеническая помада (губы сохнут)', checked: false },
  { id: '9', category: 'labor', title: 'Телефон и длинный провод зарядки', checked: false },
  { id: '10', category: 'labor', title: 'Перекус (батончики / орехи)', checked: false },
  // Послеродовое
  { id: '11', category: 'postpartum', title: 'Послеродовые гигиенические прокладки', checked: false },
  { id: '12', category: 'postpartum', title: 'Одноразовые сетчатые трусики (3–5 шт.)', checked: false },
  { id: '13', category: 'postpartum', title: 'Бюстгальтер для кормления и вкладыши', checked: false },
  { id: '14', category: 'postpartum', title: 'Крем с чистым ланолином для сосков (Пурелан)', checked: false },
  { id: '15', category: 'postpartum', title: 'Зубная щетка, паста, мини-шампунь', checked: false },
  // Для малыша
  { id: '16', category: 'baby', title: 'Подгузники для новорожденных 0–1 (маленькая пачка)', checked: false },
  { id: '17', category: 'baby', title: 'Влажные салфетки без отдушек 0+', checked: false },
  { id: '18', category: 'baby', title: 'Одноразовые впитывающие пеленки 60х60', checked: false },
  { id: '19', category: 'baby', title: 'Крем под подгузник с цинком', checked: false },
  { id: '20', category: 'baby', title: '2 слипа / боди с закрытыми ручками (р. 56)', checked: false },
  // На выписку
  { id: '21', category: 'discharge', title: 'Комплект одежды и обувь для мамы', checked: false },
  { id: '22', category: 'discharge', title: 'Конверт или комбинезон малышу по погоде', checked: false },
];

const CATEGORIES = [
  { key: 'docs', label: 'Документы', icon: FolderCheck },
  { key: 'labor', label: 'В родильное', icon: Heart },
  { key: 'postpartum', label: 'После родов', icon: ShoppingBag },
  { key: 'baby', label: 'Для малыша', icon: Baby },
  { key: 'discharge', label: 'На выписку', icon: Check },
] as const;

export const HospitalBag: React.FC = () => {
  const [items, setItems] = useState<BagItem[]>(() => {
    const saved = localStorage.getItem('mompulse_hospital_bag');
    return saved ? JSON.parse(saved) : DEFAULT_ITEMS;
  });

  const [activeCategory, setActiveCategory] = useState<string>('docs');
  const [newItemTitle, setNewItemTitle] = useState('');

  useEffect(() => {
    localStorage.setItem('mompulse_hospital_bag', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    tg.hapticImpact('light');
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    tg.hapticImpact('medium');

    const newItem: BagItem = {
      id: String(Date.now()),
      category: activeCategory as any,
      title: newItemTitle.trim(),
      checked: false,
    };
    setItems([...items, newItem]);
    setNewItemTitle('');
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    tg.hapticImpact('light');
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalCount = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const percentPacked = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const currentCategoryItems = items.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Overall Progress Card */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-lavender-50 p-5 rounded-3xl border border-rose-100 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-100 text-rose-500 rounded-2xl shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-gray-800">Сумка в роддом</h4>
              <p className="text-[11px] text-gray-400">
                Собрано {checkedCount} из {totalCount} вещей
              </p>
            </div>
          </div>
          <span className="text-lg font-black text-rose-500">{percentPacked}%</span>
        </div>

        <div className="w-full bg-rose-100/60 h-2.5 rounded-full overflow-hidden p-0.5 mt-2">
          <div
            className="bg-gradient-to-r from-rose-400 to-lavender-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentPacked}%` }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.key;
          const catItems = items.filter((i) => i.category === cat.key);
          const catChecked = catItems.filter((i) => i.checked).length;

          return (
            <button
              key={cat.key}
              onClick={() => {
                tg.hapticSelection();
                setActiveCategory(cat.key);
              }}
              className={`px-3 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-rose-400 text-white shadow-button scale-102'
                  : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {catChecked}/{catItems.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add Custom Item Input */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="Добавить свой предмет в эту категорию..."
          className="flex-1 text-xs p-3 rounded-2xl bg-white border border-gray-100 shadow-soft focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <button
          type="submit"
          className="px-4 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl shadow-button flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Items Checklist for Selected Category */}
      <div className="bg-white/95 rounded-3xl p-3 shadow-soft border border-rose-100/60 space-y-1.5">
        {currentCategoryItems.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">В этой категории пока нет вещей</p>
        ) : (
          currentCategoryItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                item.checked
                  ? 'bg-rose-50/50 text-gray-400'
                  : 'bg-gray-50/80 text-gray-800 hover:bg-gray-100/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                    item.checked
                      ? 'bg-rose-400 text-white shadow-sm'
                      : 'border-2 border-gray-300 bg-white'
                  }`}
                >
                  {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-xs font-medium leading-tight ${
                    item.checked ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {item.title}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteItem(item.id, e)}
                className="p-1 text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

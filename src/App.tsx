/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addDays, 
  subDays, 
  startOfToday, 
  startOfYear, 
  endOfYear, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO,
  differenceInDays
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  RefreshCw, 
  CalendarDays,
  Filter,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Task {
  text: string;
  completed: boolean;
}

interface DayData {
  [hour: string]: Task;
}

interface GlobalData {
  [date: string]: DayData;
}

const HOURS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"
];

const STORAGE_KEY = 'planner-data-v1';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [data, setData] = useState<GlobalData>({});
  const [filterUncompleted, setFilterUncompleted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse localStorage data", e);
      }
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const currentDayData = data[dateKey] || {};

  // Helpers
  const updateTask = (hour: string, text: string, completed: boolean) => {
    setData(prev => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {}),
        [hour]: { text, completed }
      }
    }));
  };

  const clearDay = () => {
    if (window.confirm("Bütün günü temizlemek istediğinize emin misiniz?")) {
      setData(prev => {
        const newData = { ...prev };
        delete newData[dateKey];
        return newData;
      });
    }
  };

  const clearTask = (hour: string) => {
    setData(prev => {
      const dayData = { ...(prev[dateKey] || {}) };
      delete dayData[hour];
      return {
        ...prev,
        [dateKey]: dayData
      };
    });
  };

  const getStats = (dayKey: string) => {
    const dayData = data[dayKey] || {};
    const tasks = Object.values(dayData) as Task[];
    const total = tasks.filter(t => t.text.trim() !== "").length;
    const completed = tasks.filter(t => t.text.trim() !== "" && t.completed).length;
    return { 
      total, 
      completed, 
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalPossible: HOURS.length
    };
  };

  const stats = getStats(dateKey);
  const remainingDaysInYear = differenceInDays(endOfYear(new Date()), startOfToday());

  const yearlyDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfToday(),
      end: endOfYear(new Date())
    });
  }, []);

  return (
    <div className="flex h-screen bg-brand-bg relative overflow-hidden">
      {/* Sidebar - Yearly Overview */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-brand-bg border-r border-brand-border flex flex-col transition-transform duration-300 transform
        md:translate-x-0 md:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 text-xs font-bold uppercase tracking-widest text-brand-text-dim border-b border-brand-border">
          Yıllık Genel Bakış
        </div>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-2">
          {yearlyDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayStats = getStats(dayKey);
            const isActive = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, startOfToday());

            return (
              <button
                key={dayKey}
                onClick={() => {
                  setSelectedDate(day);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full text-left p-4 rounded-xl border transition-all group
                  ${isActive 
                    ? 'bg-brand-primary/10 border-brand-primary text-brand-text' 
                    : 'bg-brand-surface/40 border-transparent hover:bg-brand-surface text-brand-text-muted hover:text-brand-text'}
                `}
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-sm truncate">
                        {format(day, 'd MMM yyyy', { locale: tr })}
                      </div>
                      {isToday && (
                        <span className="text-[9px] font-black uppercase bg-brand-primary text-white px-1.5 py-0.5 rounded-full">
                          Bugün
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-60">
                      {format(day, 'EEEE', { locale: tr })}
                    </div>
                  </div>
                  
                  <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle 
                        cx="18" cy="18" r="15" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        className="text-brand-border"
                      />
                      <motion.circle 
                        cx="18" cy="18" r="15" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeDasharray="94.2"
                        initial={{ strokeDashoffset: 94.2 }}
                        animate={{ strokeDashoffset: 94.2 - (94.2 * dayStats.percent) / 100 }}
                        className={isActive ? 'text-white' : 'text-brand-primary'}
                      />
                    </svg>
                    <span className="text-[9px] font-bold z-10">{dayStats.completed}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-5 border-t border-brand-border text-center">
            <div className="inline-block px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold">
              {remainingDaysInYear} Gün Kaldı
            </div>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-grow flex flex-col h-full min-w-0 relative">
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <header className="px-6 py-6 border-b border-brand-border bg-gradient-to-r from-brand-bg to-brand-surface flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-muted hover:text-white md:hidden"
            >
              <CalendarDays className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-muted hover:text-brand-text transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center md:text-left min-w-[140px]">
                <h1 className="text-xl md:text-2xl font-bold text-brand-text tracking-tight uppercase">
                  {format(selectedDate, 'MMMM d, yyyy', { locale: tr })}
                </h1>
                <div className="text-xs text-brand-text-dim font-medium uppercase tracking-widest">
                  {format(selectedDate, 'EEEE', { locale: tr })}
                </div>
              </div>
              <button 
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-muted hover:text-brand-text transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedDate(startOfToday())}
              className="hidden sm:block px-4 py-2 bg-brand-surface border border-brand-border rounded-lg text-sm font-bold text-brand-text-muted hover:text-white transition-colors"
            >
              Bugün
            </button>
            <button 
              onClick={() => setFilterUncompleted(!filterUncompleted)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                filterUncompleted 
                ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                : 'bg-brand-surface border-brand-border text-brand-text-muted hover:text-white'
              }`}
            >
              {filterUncompleted ? 'Filtre: Tamamlanmamış' : 'Filtre: Tümü'}
            </button>
          </div>
        </header>

        {/* Todo Grid */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">
            {HOURS.map((hour) => {
              const task = currentDayData[hour] || { text: "", completed: false };
              
              if (filterUncompleted && task.completed && task.text.trim() !== "") {
                return null;
              }

              return (
                <div 
                  key={hour} 
                  className={`
                    group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                    ${task.completed 
                      ? 'bg-brand-bg/50 border-brand-border/50 opacity-60' 
                      : 'bg-brand-surface border-brand-border hover:border-brand-primary focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20'}
                  `}
                >
                  <button 
                    onClick={() => updateTask(hour, task.text, !task.completed)}
                    className={`
                      w-6 h-6 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all
                      ${task.completed 
                        ? 'bg-brand-primary border-brand-primary text-white' 
                        : 'border-brand-text-dim/40 text-transparent hover:border-brand-primary'}
                    `}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>

                  <div className="w-14 flex-shrink-0 font-mono text-sm font-bold text-brand-text-dim">
                    {hour}
                  </div>

                  <div className="flex-grow">
                    <textarea
                      placeholder="Neler var?"
                      rows={1}
                      value={task.text}
                      onChange={(e) => updateTask(hour, e.target.value, task.completed)}
                      className={`
                        w-full bg-transparent border-none focus:ring-0 p-0 text-brand-text placeholder:text-brand-text-dim/30 transition-all resize-none block leading-relaxed font-medium text-sm
                        ${task.completed ? 'line-through text-brand-text-dim' : ''}
                      `}
                    />
                  </div>

                  <button 
                    onClick={() => clearTask(hour)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-brand-text-dim hover:text-red-400 transition-all rounded-md hover:bg-red-400/10"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <footer className="p-6 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-6 bg-brand-bg">
          <div>
            <button 
              onClick={clearDay}
              className="flex items-center gap-2 px-4 py-2 text-red-400 font-bold text-sm border border-red-400/20 rounded-lg hover:bg-red-400/10 transition-all uppercase tracking-wider"
            >
              <Trash2 className="w-4 h-4" />
               Günü Temizle
            </button>
          </div>

          <div className="flex-grow max-w-xl w-full mx-0 md:mx-10 relative">
            <div className="h-2 w-full bg-brand-border rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.percent}%` }}
                className="h-full bg-gradient-to-r from-brand-primary to-purple-500"
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-brand-text-dim">
              İlerleme
            </div>
          </div>

          <div className="text-sm font-black flex items-center gap-2">
            <span className="text-brand-primary">%{stats.percent}</span>
            <span className="text-brand-text-dim">TAMAMLANDI</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';

const WEEKS = [
  { number: 1, label: 'Week 1', date: 'Kickoff Weekend' },
  { number: 2, label: 'Week 2', date: 'Sept 5 - 7' },
  { number: 3, label: 'Week 3', date: 'Sept 12 - 14' },
  { number: 4, label: 'Week 4', date: 'Sept 19 - 21' },
  { number: 5, label: 'Week 5', date: 'Sept 26 - 28' },
  { number: 6, label: 'Week 6', date: 'Oct 3 - 5' },
  { number: 7, label: 'Week 7', date: 'Oct 10 - 12' },
  { number: 8, label: 'Week 8', date: 'Oct 17 - 19' },
  { number: 9, label: 'Week 9', date: 'Oct 24 - 26' },
  { number: 10, label: 'Week 10', date: 'Oct 31 - Nov 2' },
  { number: 11, label: 'Week 11', date: 'Nov 7 - 9' },
  { number: 12, label: 'Week 12', date: 'Nov 14 - 16' },
  { number: 13, label: 'Week 13', date: 'Nov 21 - 23' },
  { number: 14, label: 'Week 14', date: 'Rivalry Week' },
  { number: 15, label: 'CCG Week', date: 'Championships' },
  { number: 16, label: 'CFP First Round', date: '12-Team Playoff' },
  { number: 17, label: 'Bowls & CFP', date: 'Quarter/Semis' },
  { number: 18, label: 'Natl Championship', date: 'Title Game' }
];

export function WeekSelector({ currentWeek, onSelectWeek, year = 2026 }) {
  const currentIndex = WEEKS.findIndex(w => w.number === currentWeek);
  const currentWeekObj = WEEKS[currentIndex] || WEEKS[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectWeek(WEEKS[currentIndex - 1].number);
    }
  };

  const handleNext = () => {
    if (currentIndex < WEEKS.length - 1) {
      onSelectWeek(WEEKS[currentIndex + 1].number);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Current Week Banner with Prev/Next buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 text-slate-300 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white uppercase tracking-wide">
                  {currentWeekObj.label}
                </h2>
                {currentWeek === 1 && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                    LIVE NOW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {year} NCAA Football Season • {currentWeekObj.date}
              </p>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === WEEKS.length - 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 text-slate-300 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Week Scroller */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full sm:max-w-xl pb-1 scrollbar-none">
          {WEEKS.map(w => {
            const isSelected = w.number === currentWeek;
            return (
              <button
                key={w.number}
                onClick={() => onSelectWeek(w.number)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                {w.number <= 14 ? `W${w.number}` : w.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

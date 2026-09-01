import React from 'react';
import { Shield, Sparkles, Globe, Flame } from 'lucide-react';

const CONFERENCES = [
  { id: 'ALL', label: 'All FBS Games', badge: '100+ Games', color: 'border-slate-600' },
  { id: 'TOP25', label: 'Top 25 Matchups', badge: 'Ranked', color: 'border-amber-500 text-amber-300' },
  { id: 'SEC', label: 'SEC', badge: 'Power 4', color: 'border-yellow-600' },
  { id: 'BIGTEN', label: 'Big Ten', badge: 'Power 4', color: 'border-blue-600' },
  { id: 'ACC', label: 'ACC', badge: 'Power 4', color: 'border-indigo-600' },
  { id: 'BIG12', label: 'Big 12', badge: 'Power 4', color: 'border-red-600' },
  { id: 'AAC', label: 'AAC', badge: 'Group of 5', color: 'border-sky-600' },
  { id: 'MWC', label: 'Mountain West', badge: 'Group of 5', color: 'border-purple-600' },
  { id: 'SUNBELT', label: 'Sun Belt', badge: 'Group of 5', color: 'border-emerald-600' },
  { id: 'MAC', label: 'MAC', badge: 'Group of 5', color: 'border-green-600' },
  { id: 'CUSA', label: 'C-USA', badge: 'Group of 5', color: 'border-orange-600' },
  { id: 'INDEPENDENTS', label: 'Independents', badge: 'FBS', color: 'border-teal-600' },
];

export function ConferenceFilter({ activeConference, onSelectConference, gameCount }) {
  return (
    <div className="w-full">
      {/* Category Pills Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Conference Filter</span>
        </div>
        {gameCount !== undefined && (
          <div className="text-xs text-slate-400">
            Showing <span className="text-amber-400 font-bold">{gameCount}</span> matchups
          </div>
        )}
      </div>

      {/* Horizontal scrolling pill bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {CONFERENCES.map((conf) => {
          const isSelected = activeConference === conf.id;
          return (
            <button
              key={conf.id}
              onClick={() => onSelectConference(conf.id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition duration-150 ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-500'
              }`}
            >
              <span>{conf.label}</span>
              {conf.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-tight font-extrabold ${
                    isSelected
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {conf.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TeamScheduleView } from './TeamScheduleView';
import { 
  Shield, LayoutGrid, Sparkles, ChevronRight, 
  Award, Flame, CheckCircle2 
} from 'lucide-react';

const CONFERENCES = [
  { id: 'SEC', label: 'SEC', count: 16, color: '#f59e0b' },
  { id: 'Big Ten', label: 'Big Ten', count: 18, color: '#3b82f6' },
  { id: 'ACC', label: 'ACC', count: 17, color: '#6366f1' },
  { id: 'Big 12', label: 'Big 12', count: 16, color: '#ef4444' },
  { id: 'Group of 5', label: 'Group of 5', count: 24, color: '#10b981' },
  { id: 'Independents', label: 'Independents', count: 5, color: '#14b8a6' }
];

export function MakePicksView() {
  const { user } = useAuth();
  const [activeConference, setActiveConference] = useState('SEC');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, [activeConference]);

  async function loadTeams() {
    setLoading(true);
    try {
      const data = await api.getTeams(activeConference);
      setTeams(data?.teams || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  }

  // If a team is selected, show their full verified 2026 schedule
  if (selectedTeam) {
    return (
      <TeamScheduleView
        team={selectedTeam}
        onBack={() => {
          setSelectedTeam(null);
          loadTeams();
        }}
        onPickChanged={() => {
          loadTeams();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Conference Filter Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center space-x-2">
          {CONFERENCES.map((conf) => {
            const isSelected = activeConference === conf.id;
            return (
              <button
                key={conf.id}
                onClick={() => {
                  setActiveConference(conf.id);
                  setSelectedTeam(null);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  isSelected
                    ? 'bg-[#faf6e8] text-black shadow-lg scale-105'
                    : 'bg-[#0e1218] hover:bg-[#151b24] text-[#dcd8c8] border border-white/5 hover:border-white/20'
                }`}
              >
                <span>{conf.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-black/60 text-[#9a978a]'
                }`}>
                  {conf.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TEAMS GRID VIEW */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs font-bold text-[#dcd8c8] flex items-center space-x-1.5 uppercase">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeConference} Teams (Select a team to predict their 2026 schedule)</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#9a978a]">
            <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            Loading {activeConference} teams...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {teams.map((team) => {
              const rec = team.projectedRecord || { wins: 0, losses: 0, unpicked: 12 };
              return (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className="group cursor-pointer bg-[#0e1218] hover:bg-[#141b24] rounded-2xl p-4 border border-white/5 hover:border-amber-400/60 transition-all duration-200 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden"
                >
                  {/* Top Color Accent */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                    style={{ backgroundColor: team.colors?.primary || '#faf6e8' }}
                  />

                  {/* Logo & Ranking */}
                  <div className="relative my-2">
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="w-14 h-14 object-contain drop-shadow-md transition-transform group-hover:scale-110"
                      onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                    />
                    {team.ranking && (
                      <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full shadow">
                        #{team.ranking}
                      </span>
                    )}
                  </div>

                  {/* Team Name */}
                  <div className="w-full">
                    <div className="text-sm font-extrabold text-white athletic-title line-clamp-1 group-hover:text-amber-400 transition">
                      {team.name}
                    </div>
                    <div className="text-[10px] text-[#9a978a] line-clamp-1">
                      {team.nickname}
                    </div>
                  </div>

                  {/* Projected Record Pill */}
                  <div className="mt-3 w-full bg-black/60 py-1.5 px-2 rounded-xl border border-white/5 flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-[#86efac]">{rec.wins}W</span>
                    <span className="text-[#9a978a]">-</span>
                    <span className="text-[#fca5a5]">{rec.losses}L</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

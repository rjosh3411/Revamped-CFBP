import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Award, TrendingUp, TrendingDown, Minus, RefreshCw, 
  Shield, Sparkles, Trophy 
} from 'lucide-react';

export function RankingsView({ onSync, isSyncing }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePollIndex, setActivePollIndex] = useState(0);

  useEffect(() => {
    loadRankings();
  }, []);

  async function loadRankings(refresh = false) {
    setLoading(true);
    try {
      const data = await api.getRankings(refresh);
      if (data?.rankings) {
        setRankings(data.rankings);
      }
    } catch (err) {
      console.error('Failed to load rankings:', err);
    } finally {
      setLoading(false);
    }
  }

  const currentPoll = rankings[activePollIndex] || rankings[0];
  const ranks = currentPoll?.ranks || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Official NCAA Football Polls</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display uppercase tracking-wide">
              {currentPoll?.name || 'AP Top 25 College Football Rankings'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentPoll?.headline || 'Official live AP Poll rankings synced with ESPN'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadRankings(true)}
              disabled={loading}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 shadow transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Poll</span>
            </button>
          </div>
        </div>

        {/* Poll Selector Tabs (AP Top 25, Coaches Poll) */}
        {rankings.length > 1 && (
          <div className="mt-5 flex items-center space-x-2 overflow-x-auto pb-1">
            {rankings.map((poll, idx) => (
              <button
                key={poll.name}
                onClick={() => setActivePollIndex(idx)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  activePollIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                {poll.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rankings Table / Cards */}
      {loading && ranks.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
          Loading AP Top 25 rankings...
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-extrabold text-slate-400">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3 text-center">Record</th>
                  <th className="py-3 px-3 text-center">Prev</th>
                  <th className="py-3 px-3 text-center">Trend</th>
                  <th className="py-3 px-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ranks.map((r) => {
                  const team = r.team || {};
                  const isTop5 = r.rank <= 5;
                  const isTop10 = r.rank <= 10;

                  return (
                    <tr 
                      key={r.rank}
                      className="hover:bg-slate-800/40 transition duration-150"
                    >
                      {/* Rank Number Badge */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shadow-md ${
                            r.rank === 1
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                              : r.rank === 2
                                ? 'bg-slate-300 text-slate-950 ring-1 ring-white'
                                : r.rank === 3
                                  ? 'bg-amber-700 text-slate-100'
                                  : isTop5
                                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                                    : isTop10
                                      ? 'bg-slate-800 text-amber-400 border border-slate-700'
                                      : 'bg-slate-850 text-slate-300 border border-slate-800'
                          }`}>
                            #{r.rank}
                          </span>
                        </div>
                      </td>

                      {/* Team Logo & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={team.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`}
                            alt={team.displayName || team.name}
                            className="w-9 h-9 object-contain drop-shadow"
                            onError={(e) => {
                              e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png';
                            }}
                          />
                          <div>
                            <div className="font-bold text-white text-sm hover:text-amber-400 transition">
                              {team.displayName || team.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {team.nickname || ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Record */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {r.record || '0-0'}
                        </span>
                      </td>

                      {/* Previous Rank */}
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">
                        {r.previousRank ? `#${r.previousRank}` : '-'}
                      </td>

                      {/* Trend Movement */}
                      <td className="py-3 px-3 text-center">
                        {r.changeType === 'up' ? (
                          <span className="inline-flex items-center text-emerald-400 font-bold text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {r.rankChange}
                          </span>
                        ) : r.changeType === 'down' ? (
                          <span className="inline-flex items-center text-red-400 font-bold text-[11px] bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {r.rankChange}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-500 text-[11px]">
                            <Minus className="w-3 h-3 mr-0.5" />
                            {r.rankChange || '--'}
                          </span>
                        )}
                      </td>

                      {/* Points */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-black text-amber-400 font-display text-base">
                          {r.points ? r.points.toLocaleString() : '0'} pts
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Award, TrendingUp, TrendingDown, Minus, RefreshCw, 
  Shield, Trophy, Sparkles, BarChart2 
} from 'lucide-react';

export function StandingsView({ onSync, isSyncing }) {
  const [activeTab, setActiveTab] = useState('POLL'); // 'POLL' or 'PROJECTED'
  const [rankings, setRankings] = useState([]);
  const [projectedConference, setProjectedConference] = useState('SEC');
  const [conferenceTeams, setConferenceTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRankings();
  }, []);

  useEffect(() => {
    if (activeTab === 'PROJECTED') {
      loadProjectedTeams();
    }
  }, [activeTab, projectedConference]);

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

  async function loadProjectedTeams() {
    setLoading(true);
    try {
      const data = await api.getTeams(projectedConference);
      const sorted = (data?.teams || []).sort((a, b) => {
        const aWins = a.projectedRecord?.wins || 0;
        const bWins = b.projectedRecord?.wins || 0;
        if (bWins !== aWins) return bWins - aWins;
        return (a.ranking || 99) - (b.ranking || 99);
      });
      setConferenceTeams(sorted);
    } catch (err) {
      console.error('Failed to load projected teams:', err);
    } finally {
      setLoading(false);
    }
  }

  const currentPoll = rankings[0] || {};
  const ranks = currentPoll.ranks || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BarChart2 className="w-4 h-4" />
              <span>Standings & National Polls</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#faf6e8] athletic-title uppercase tracking-wide">
              {activeTab === 'POLL' ? 'AP Top 25 College Football Rankings' : `${projectedConference} Projected Standings`}
            </h1>
            <p className="text-xs text-[#dcd8c8] mt-0.5">
              {activeTab === 'POLL'
                ? 'Official 2026 live AP Poll rankings synced with ESPN'
                : 'Projected 2026 conference standings calculated from your predictions!'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('POLL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                  activeTab === 'POLL'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-[#9a978a] hover:text-white'
                }`}
              >
                AP Top 25
              </button>
              <button
                onClick={() => setActiveTab('PROJECTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                  activeTab === 'PROJECTED'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-[#9a978a] hover:text-white'
                }`}
              >
                My Standings
              </button>
            </div>

            {activeTab === 'POLL' && (
              <button
                onClick={() => loadRankings(true)}
                disabled={loading}
                className="flex items-center space-x-1 bg-black/60 hover:bg-black text-[#dcd8c8] px-3 py-2 rounded-xl text-xs font-bold border border-white/10 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Conference Selector for Projected Standings */}
        {activeTab === 'PROJECTED' && (
          <div className="mt-5 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {['SEC', 'Big Ten', 'ACC', 'Big 12', 'Group of 5'].map(conf => (
              <button
                key={conf}
                onClick={() => setProjectedConference(conf)}
                className={`px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition ${
                  projectedConference === conf
                    ? 'bg-[#faf6e8] text-black shadow'
                    : 'bg-black/60 text-[#9a978a] hover:text-white border border-white/5'
                }`}
              >
                {conf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: AP TOP 25 TABLE & MOBILE CARDS */}
      {activeTab === 'POLL' && (
        <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-3 sm:p-6 shadow-2xl overflow-hidden">
          {loading && ranks.length === 0 ? (
            <div className="text-center py-16 text-[#9a978a]">
              <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading AP Top 25 poll...
            </div>
          ) : (
            <>
              {/* Mobile View: Clean Spaced Cards */}
              <div className="sm:hidden space-y-2.5">
                {ranks.map((r) => {
                  const team = r.team || {};
                  return (
                    <div
                      key={r.rank}
                      className="bg-black/40 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          r.rank === 1 ? 'bg-amber-500 text-black shadow-md' : 'bg-black/80 text-[#faf6e8] border border-white/10'
                        }`}>
                          #{r.rank}
                        </span>
                        <img
                          src={team.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`}
                          alt={team.displayName || team.name}
                          className="w-9 h-9 object-contain shrink-0"
                          onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-white text-sm athletic-title truncate">
                            {team.displayName || team.name}
                          </div>
                          <div className="text-[11px] text-[#9a978a] flex items-center space-x-2">
                            <span>{team.nickname}</span>
                            {r.previousRank && (
                              <span className="text-[10px] text-slate-500">Prev #{r.previousRank}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-xs bg-black/80 px-2.5 py-1 rounded-lg border border-white/10 text-white">
                          {r.record || '0-0'}
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono font-bold mt-1">
                          {r.points ? `${r.points.toLocaleString()} pts` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Wide Spacious Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase font-black text-[#9a978a]">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4 text-center">Record</th>
                      <th className="py-3 px-4 text-center">Prev</th>
                      <th className="py-3 px-4 text-center">Trend</th>
                      <th className="py-3 px-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ranks.map((r) => {
                      const team = r.team || {};
                      return (
                        <tr key={r.rank} className="hover:bg-white/5 transition">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                              r.rank === 1 ? 'bg-amber-500 text-black shadow' : 'bg-black/60 text-[#faf6e8] border border-white/10'
                            }`}>
                              #{r.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <img
                                src={team.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`}
                                alt={team.displayName || team.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                              />
                              <div>
                                <div className="font-extrabold text-white text-sm athletic-title">
                                  {team.displayName || team.name}
                                </div>
                                <div className="text-[10px] text-[#9a978a]">{team.nickname}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="font-mono font-bold bg-black/60 px-2.5 py-1 rounded-lg border border-white/5">
                              {r.record || '0-0'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-[#9a978a] font-mono whitespace-nowrap">
                            {r.previousRank ? `#${r.previousRank}` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {r.changeType === 'up' ? (
                              <span className="inline-flex items-center text-[#86efac] font-bold text-[11px]">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {r.rankChange}
                              </span>
                            ) : r.changeType === 'down' ? (
                              <span className="inline-flex items-center text-[#fca5a5] font-bold text-[11px]">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                {r.rankChange}
                              </span>
                            ) : (
                              <span className="text-[#9a978a] text-[11px]">--</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-amber-400 font-mono text-sm whitespace-nowrap">
                            {r.points ? r.points.toLocaleString() : '0'} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 2: PROJECTED CONFERENCE STANDINGS */}
      {activeTab === 'PROJECTED' && (
        <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-3 sm:p-6 shadow-2xl overflow-hidden">
          {/* Mobile View: Spacious Structured Cards (No Cramped Wrapping) */}
          <div className="sm:hidden space-y-3">
            {conferenceTeams.map((team, idx) => {
              const rec = team.projectedRecord || { wins: 0, losses: 0, unpicked: 12 };
              const isBowlEligible = rec.wins >= 6;
              return (
                <div
                  key={team.id}
                  className="bg-black/50 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3"
                >
                  {/* Row 1: Position, Logo, Team Name & Projected Record */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0 ? 'bg-amber-500 text-black shadow' : 'bg-black/80 text-[#faf6e8] border border-white/10'
                      }`}>
                        {idx + 1}
                      </span>
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-9 h-9 object-contain shrink-0 drop-shadow"
                        onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-white text-sm athletic-title truncate flex items-center">
                          {team.ranking && (
                            <span className="text-amber-400 text-xs mr-1 font-mono">#{team.ranking}</span>
                          )}
                          <span>{team.name}</span>
                        </div>
                        <div className="text-[11px] text-[#9a978a]">{team.nickname}</div>
                      </div>
                    </div>

                    {/* Projected Record Tag */}
                    <div className="shrink-0 bg-black/80 border border-white/10 px-3 py-1 rounded-xl font-mono text-sm font-bold whitespace-nowrap shadow-inner">
                      <span className="text-[#86efac]">{rec.wins}W</span>
                      <span className="text-slate-500 mx-1">-</span>
                      <span className="text-[#fca5a5]">{rec.losses}L</span>
                    </div>
                  </div>

                  {/* Row 2: Status & Bowl Eligibility Badges */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <div>
                      {rec.unpicked > 0 ? (
                        <span className="text-[11px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          {rec.unpicked} unpicked
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#86efac] font-bold bg-[#86efac]/10 px-2.5 py-1 rounded-lg border border-[#86efac]/30 flex items-center space-x-1">
                          <span>✓</span>
                          <span>12/12 Picked</span>
                        </span>
                      )}
                    </div>

                    <div>
                      {isBowlEligible ? (
                        <span className="text-[11px] font-black text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center space-x-1 shadow-sm">
                          <span>🏆</span>
                          <span>Bowl Eligible ({rec.wins}W)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {6 - rec.wins > 0 ? `${6 - rec.wins} more wins needed` : 'Eligible'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Wide Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-black text-[#9a978a]">
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-center">Projected Record</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Bowl Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {conferenceTeams.map((team, idx) => {
                  const rec = team.projectedRecord || { wins: 0, losses: 0, unpicked: 12 };
                  const isBowlEligible = rec.wins >= 6;
                  return (
                    <tr key={team.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          idx === 0 ? 'bg-amber-500 text-black shadow' : 'bg-black/60 text-[#faf6e8] border border-white/10'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                          />
                          <div>
                            <div className="font-extrabold text-white text-sm athletic-title flex items-center">
                              {team.ranking && <span className="text-amber-400 mr-1">#{team.ranking}</span>}
                              <span>{team.name}</span>
                            </div>
                            <div className="text-[10px] text-[#9a978a]">{team.nickname}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-sm bg-black/60 px-3 py-1 rounded-xl border border-white/5">
                          <span className="text-[#86efac]">{rec.wins}W</span>
                          <span className="text-slate-500 mx-1.5">-</span>
                          <span className="text-[#fca5a5]">{rec.losses}L</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {rec.unpicked > 0 ? (
                          <span className="text-[10px] text-[#9a978a] bg-black/60 px-2.5 py-1 rounded-lg border border-white/5">
                            {rec.unpicked} unpicked
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#86efac] font-bold bg-[#86efac]/10 px-2.5 py-1 rounded-lg border border-[#86efac]/30">
                            ✓ 12/12 Picked
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isBowlEligible ? (
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                            🏆 Bowl Eligible ({rec.wins}W)
                          </span>
                        ) : (
                          <span className="text-xs text-[#9a978a]">
                            {6 - rec.wins > 0 ? `${6 - rec.wins} more wins needed` : 'Eligible'}
                          </span>
                        )}
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

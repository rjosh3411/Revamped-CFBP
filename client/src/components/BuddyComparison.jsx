import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Shield, CheckCircle2, XCircle, Clock, 
  Flame, Sparkles, Award, ArrowRightLeft, Filter, AlertCircle, ChevronDown, Check, Swords
} from 'lucide-react';

export function BuddyComparison({ parties, currentWeek, currentYear }) {
  const { user } = useAuth();
  const [selectedPartyId, setSelectedPartyId] = useState(parties?.[0]?.id || '');
  const [selectedBuddyId, setSelectedBuddyId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'AGREED', 'DISAGREED'

  useEffect(() => {
    if (parties?.length > 0 && !selectedPartyId) {
      setSelectedPartyId(parties[0].id);
    }
  }, [parties]);

  useEffect(() => {
    if (selectedPartyId) {
      loadComparison();
    }
  }, [selectedPartyId, selectedBuddyId, currentWeek, currentYear]);

  async function loadComparison() {
    if (!selectedPartyId) return;
    setLoading(true);
    try {
      const data = await api.getBuddyComparison(selectedPartyId, {
        year: currentYear,
        week: currentWeek,
        buddyId: selectedBuddyId || undefined
      });
      setComparisonData(data);
      if (data?.selectedBuddy && !selectedBuddyId) {
        setSelectedBuddyId(data.selectedBuddy.id);
      }
    } catch (err) {
      console.error('Failed to load buddy comparison:', err);
    } finally {
      setLoading(false);
    }
  }

  const selectedParty = (parties || []).find(p => p.id === selectedPartyId);
  const buddies = comparisonData?.buddies || [];
  const selectedBuddy = comparisonData?.selectedBuddy;
  const summary = comparisonData?.summary || { totalCompared: 0, agreedCount: 0, disagreedCount: 0, agreementRate: 0 };
  const comparisons = comparisonData?.comparisons || [];

  // Filter comparisons
  const filteredComparisons = comparisons.filter(c => {
    if (filterMode === 'AGREED') return c.comparisonStatus === 'AGREED';
    if (filterMode === 'DISAGREED') return c.comparisonStatus === 'DISAGREED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Selectors */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Swords className="w-4 h-4" />
              <span>Head-to-Head Buddy Comparison Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display uppercase tracking-wide">
              Peer Agreement & Rivalry Picks
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Compare your game-by-game predictions against fellow party members. Discover where you agree, where you clash, and who has bragging rights!
            </p>
          </div>

          {/* Party and Buddy Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Party Selector */}
            <div className="relative flex-1 sm:flex-none">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Prediction Party</label>
              <select
                value={selectedPartyId}
                onChange={(e) => {
                  setSelectedPartyId(e.target.value);
                  setSelectedBuddyId('');
                }}
                className="w-full sm:w-56 bg-slate-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 transition"
              >
                {parties.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>

            {/* Buddy Selector */}
            <div className="relative flex-1 sm:flex-none">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Compare Against Buddy</label>
              <select
                value={selectedBuddyId}
                onChange={(e) => setSelectedBuddyId(e.target.value)}
                disabled={buddies.length === 0}
                className="w-full sm:w-56 bg-slate-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 transition disabled:opacity-50"
              >
                {buddies.length === 0 ? (
                  <option value="">No other party members</option>
                ) : (
                  buddies.map(b => (
                    <option key={b.id} value={b.id}>
                      👤 {b.display_name} ({b.favorite_team})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Head-to-Head Comparison Card Summary */}
        {selectedBuddy && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* You vs Buddy Avatar Matchup */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
              {/* You */}
              <div className="flex items-center space-x-3">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400/80" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg ring-2 ring-amber-400">
                    {user?.display_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase">You</div>
                  <div className="text-sm font-bold text-white truncate max-w-[90px]">{user?.display_name}</div>
                  <div className="text-xs text-slate-400 font-semibold">{summary.myWeeklyPoints} pts (W{currentWeek})</div>
                </div>
              </div>

              {/* VS Pill */}
              <div className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-black text-slate-400">
                VS
              </div>

              {/* Buddy */}
              <div className="flex items-center space-x-3 text-right flex-row-reverse space-x-reverse">
                {selectedBuddy.avatarUrl ? (
                  <img src={selectedBuddy.avatarUrl} alt={selectedBuddy.displayName} className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-400/80" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg ring-2 ring-indigo-400">
                    {selectedBuddy.displayName?.charAt(0) || 'B'}
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase">Buddy</div>
                  <div className="text-sm font-bold text-white truncate max-w-[90px]">{selectedBuddy.displayName}</div>
                  <div className="text-xs text-slate-400 font-semibold">{summary.buddyWeeklyPoints} pts (W{currentWeek})</div>
                </div>
              </div>
            </div>

            {/* Agreement Rate Meter */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                <span>Agreement Rate</span>
                <span className="text-amber-400 font-extrabold text-sm">{summary.agreementRate}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${summary.agreementRate}%` }}
                  title="Agreed Picks"
                />
                <div 
                  className="bg-orange-500 h-full transition-all duration-500" 
                  style={{ width: `${100 - summary.agreementRate}%` }}
                  title="Disagreed Picks"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
                  {summary.agreedCount} Agreed Picks
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
                  {summary.disagreedCount} Split Picks
                </span>
              </div>
            </div>

            {/* Point Differential & Status */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Point Margin</div>
                <div className={`text-2xl font-black font-display ${
                  summary.pointDifferential > 0 ? 'text-emerald-400' : summary.pointDifferential < 0 ? 'text-red-400' : 'text-slate-300'
                }`}>
                  {summary.pointDifferential > 0 ? `+${summary.pointDifferential} pts ahead` : summary.pointDifferential < 0 ? `${Math.abs(summary.pointDifferential)} pts behind` : 'Tied 0 pts'}
                </div>
                <div className="text-xs text-slate-400">
                  {summary.totalCompared} matchups compared
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confidence Records Panel — shows all party members' confidence pick W-L records */}
      {buddies.length > 0 && (
        <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-base">🔥</span>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">Party Confidence Pick Records</h3>
            <span className="text-[10px] text-[#9a978a] ml-2">Season totals for graded games only</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-2 pr-4 font-bold text-[#9a978a] uppercase text-[10px]">Member</th>
                  <th className="pb-2 pr-4 font-bold text-[#9a978a] uppercase text-[10px] text-center">🔥 High</th>
                  <th className="pb-2 pr-4 font-bold text-[#9a978a] uppercase text-[10px] text-center">👍 Medium</th>
                  <th className="pb-2 font-bold text-[#9a978a] uppercase text-[10px] text-center">🤷 Low</th>
                </tr>
              </thead>
              <tbody>
                {/* Current user row */}
                {comparisonData?.currentUser && (() => {
                  const me = buddies.find(b => b.id !== comparisonData.currentUser.id) ? comparisonData.currentUser : comparisonData.currentUser;
                  // We show all members including current user from buddies list + currentUser
                  return null;
                })()}
                {[...buddies].map(b => (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center space-x-2">
                        {b.avatar_url ? (
                          <img src={b.avatar_url} alt={b.display_name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                            {b.display_name?.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-white truncate max-w-[100px]">{b.display_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      {b.high_conf_total > 0 ? (
                        <span className="font-black text-[#86efac] font-mono">
                          {b.high_conf_correct}-{b.high_conf_total - b.high_conf_correct}
                        </span>
                      ) : (
                        <span className="text-[#9a978a]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      {b.med_conf_total > 0 ? (
                        <span className="font-black text-[#60a5fa] font-mono">
                          {b.med_conf_correct}-{b.med_conf_total - b.med_conf_correct}
                        </span>
                      ) : (
                        <span className="text-[#9a978a]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {b.low_conf_total > 0 ? (
                        <span className="font-black text-[#9a978a] font-mono">
                          {b.low_conf_correct}-{b.low_conf_total - b.low_conf_correct}
                        </span>
                      ) : (
                        <span className="text-[#9a978a]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterMode === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Matchups ({comparisons.length})
          </button>
          <button
            onClick={() => setFilterMode('AGREED')}
            className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterMode === 'AGREED'
                ? 'bg-emerald-500 text-slate-950 font-black shadow'
                : 'text-emerald-400 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Agreed Picks ({summary.agreedCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('DISAGREED')}
            className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterMode === 'DISAGREED'
                ? 'bg-orange-500 text-slate-950 font-black shadow'
                : 'text-orange-400 hover:bg-slate-800'
            }`}
          >
            <Swords className="w-3.5 h-3.5 mr-1" />
            <span>Split / Rivalry Picks ({summary.disagreedCount})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Comparing Week <span className="text-amber-400 font-bold">{currentWeek}</span>
        </div>
      </div>

      {/* Comparisons List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
          Loading head-to-head comparison matrix...
        </div>
      ) : filteredComparisons.length === 0 ? (
        <div className="bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-800 text-slate-400">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No picks match this filter</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try switching the filter above or make your predictions on the Matchups & Picks tab!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComparisons.map((c, index) => {
            const g = c.game;
            const myPick = c.myPick;
            const buddyPick = c.buddyPick;
            const isAgreed = c.comparisonStatus === 'AGREED';
            const isDisagreed = c.comparisonStatus === 'DISAGREED';

            return (
              <div
                key={g.id || index}
                className={`bg-slate-900/90 rounded-2xl border transition-all duration-200 p-4 shadow-xl ${
                  isAgreed
                    ? 'border-emerald-500/40 hover:border-emerald-500/70'
                    : isDisagreed
                      ? 'border-orange-500/50 hover:border-orange-500/80 shadow-orange-500/5'
                      : 'border-slate-800'
                }`}
              >
                {/* Header: Game Status & Agreement Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-300">{g.shortName || g.name}</span>
                    {g.broadcast && (
                      <span className="bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded text-[10px]">
                        {g.broadcast}
                      </span>
                    )}
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{g.statusDetail || 'Scheduled'}</span>
                  </div>

                  {/* Agreement Status Badge */}
                  <div>
                    {isAgreed ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/50 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Consensus: Both Agreed on {myPick.predicted_winner_name}
                      </span>
                    ) : isDisagreed ? (
                      <span className="inline-flex items-center text-xs font-bold text-orange-400 bg-orange-950/70 border border-orange-500/50 px-2.5 py-0.5 rounded-full">
                        <Swords className="w-3.5 h-3.5 mr-1" />
                        Split Duel: {user?.display_name?.split(' ')[0]} ({myPick.predicted_winner_name}) vs {selectedBuddy?.displayName?.split(' ')[0]} ({buddyPick.predicted_winner_name})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                        {myPick ? 'Only You Picked' : buddyPick ? 'Only Buddy Picked' : 'Unpicked'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Matchup Grid: Game Scoreboard vs Side-by-Side Picks */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Game Scoreboard Area (5 cols) */}
                  <div className="lg:col-span-5 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      {/* Away Team */}
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={g.awayTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${g.awayTeam.id}.png`} 
                          alt={g.awayTeam.name} 
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1">
                            {g.awayTeam.rank && <span className="text-amber-400 text-[10px]">#{g.awayTeam.rank}</span>}
                            <span>{g.awayTeam.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{g.awayTeam.record || '0-0'}</div>
                        </div>
                      </div>
                      <div className="text-lg font-black text-white font-display">{g.awayTeam.score}</div>
                    </div>

                    <div className="h-px bg-slate-800 my-2"></div>

                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={g.homeTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${g.homeTeam.id}.png`} 
                          alt={g.homeTeam.name} 
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1">
                            {g.homeTeam.rank && <span className="text-amber-400 text-[10px]">#{g.homeTeam.rank}</span>}
                            <span>{g.homeTeam.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{g.homeTeam.record || '0-0'}</div>
                        </div>
                      </div>
                      <div className="text-lg font-black text-white font-display">{g.homeTeam.score}</div>
                    </div>
                  </div>

                  {/* Your Pick Box (3 cols) */}
                  <div className="lg:col-span-3 bg-slate-800/60 rounded-xl p-3 border border-slate-700/80">
                    <div className="text-[10px] uppercase font-bold text-amber-400 mb-1 flex items-center justify-between">
                      <span>Your Pick</span>
                      {myPick && <span className="text-slate-400">{myPick.confidence_points || 1}x Conf</span>}
                    </div>
                    {myPick ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate max-w-[130px]">
                          {myPick.predicted_winner_name}
                        </span>
                        {myPick.is_correct === 1 ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            +{myPick.points_awarded || 10} pts
                          </span>
                        ) : myPick.is_correct === 0 ? (
                          <span className="text-[11px] font-bold text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-500/40">
                            0 pts
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">⏳</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No pick locked</span>
                    )}
                  </div>

                  {/* Buddy's Pick Box (4 cols) */}
                  <div className="lg:col-span-4 bg-slate-800/60 rounded-xl p-3 border border-slate-700/80">
                    <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center justify-between">
                      <span>{selectedBuddy?.displayName || 'Buddy'}'s Pick</span>
                      {buddyPick && <span className="text-slate-400">{buddyPick.confidence_points || 1}x Conf</span>}
                    </div>
                    {buddyPick ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate max-w-[130px]">
                          {buddyPick.predicted_winner_name}
                        </span>
                        {buddyPick.is_correct === 1 ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            +{buddyPick.points_awarded || 10} pts
                          </span>
                        ) : buddyPick.is_correct === 0 ? (
                          <span className="text-[11px] font-bold text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-500/40">
                            0 pts
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">⏳</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No pick locked</span>
                    )}
                  </div>
                </div>

                {/* Party Consensus Progress Line */}
                {c.consensus?.totalPicks > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Party Consensus: <strong className="text-amber-400">{c.consensus.consensusTeam}</strong></span>
                    <span className="text-slate-500">{c.partyPicksCount} party members submitted picks</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

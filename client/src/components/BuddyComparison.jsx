import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Shield, CheckCircle2, XCircle, Clock, 
  Flame, Sparkles, Award, ArrowRightLeft, Filter, AlertCircle, ChevronDown, Check, Swords, Copy
} from 'lucide-react';

export function BuddyComparison({ parties, currentWeek, currentYear }) {
  const { user } = useAuth();
  const [selectedPartyId, setSelectedPartyId] = useState(parties?.[0]?.id || '');
  const [selectedBuddyId, setSelectedBuddyId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'AGREED', 'DISAGREED'
  const [copiedCode, setCopiedCode] = useState(false);

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

  const selectedParty = (parties || []).find(p => p.id === selectedPartyId) || comparisonData?.party;
  const buddies = comparisonData?.buddies || [];
  const selectedBuddy = comparisonData?.selectedBuddy;
  const summary = comparisonData?.summary || { totalCompared: 0, agreedCount: 0, disagreedCount: 0, agreementRate: 0 };
  const comparisons = comparisonData?.comparisons || [];

  const handleCopyCode = () => {
    if (selectedParty?.invite_code) {
      navigator.clipboard.writeText(selectedParty.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

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
              Compare your 2026 predictions against fellow party members. Discover where you agree, where you clash, and who has bragging rights!
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
            {buddies.length > 0 && (
              <div className="relative flex-1 sm:flex-none">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Compare Against Buddy</label>
                <select
                  value={selectedBuddyId}
                  onChange={(e) => setSelectedBuddyId(e.target.value)}
                  className="w-full sm:w-56 bg-slate-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 transition"
                >
                  {buddies.map(b => (
                    <option key={b.id} value={b.id}>
                      👤 {b.display_name} ({b.favorite_team})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Head-to-Head Comparison Card Summary (when buddy exists) */}
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
                  <div className="text-xs text-slate-400 font-semibold">{summary.myWeeklyPoints} pts</div>
                </div>
              </div>

              <div className="text-slate-500 font-extrabold text-sm px-2">VS</div>

              {/* Buddy */}
              <div className="flex items-center space-x-3 text-right">
                <div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase">Opponent</div>
                  <div className="text-sm font-bold text-white truncate max-w-[90px]">{selectedBuddy.display_name}</div>
                  <div className="text-xs text-slate-400 font-semibold">{summary.buddyWeeklyPoints} pts</div>
                </div>
                {selectedBuddy.avatar_url ? (
                  <img src={selectedBuddy.avatar_url} alt={selectedBuddy.display_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/80" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg ring-2 ring-indigo-500">
                    {selectedBuddy.display_name?.charAt(0) || 'B'}
                  </div>
                )}
              </div>
            </div>

            {/* Agreement Rate Meter */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-400 uppercase">Agreement Rate</span>
                <span className="font-extrabold text-white">{summary.agreementRate}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.agreementRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-medium">
                <span className="text-emerald-400 font-bold">{summary.agreedCount} Agreed</span>
                <span className="text-orange-400 font-bold">{summary.disagreedCount} Clashing</span>
              </div>
            </div>

            {/* Rivalry Differential */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Point Differential</div>
                <div className="text-2xl font-extrabold font-mono mt-0.5">
                  {summary.pointDifferential > 0 ? (
                    <span className="text-emerald-400">+{summary.pointDifferential} pts</span>
                  ) : summary.pointDifferential < 0 ? (
                    <span className="text-red-400">{summary.pointDifferential} pts</span>
                  ) : (
                    <span className="text-slate-300">Tied (0)</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {summary.pointDifferential > 0 ? '🏆 You are in the lead!' : summary.pointDifferential < 0 ? '⚡ Chasing your buddy' : '🤝 Dead heat!'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EMPTY STATE: When alone in party */}
      {buddies.length === 0 ? (
        <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-2xl max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
            👥
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
              Waiting for Friends to Join
            </h2>
            <p className="text-xs sm:text-sm text-[#9a978a] max-w-md mx-auto mt-2 leading-relaxed">
              You're currently the only member in <span className="text-amber-400 font-bold">{selectedParty?.name || 'this party'}</span>. Invite friends using your invite code to compare picks, calculate agreement ratings, and track confidence records!
            </p>
          </div>

          {selectedParty?.invite_code && (
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-md mx-auto">
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-[#9a978a]">Party Invite Code</div>
                <div className="text-xl font-black text-amber-400 font-mono tracking-widest">{selectedParty.invite_code}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-lg active:scale-95"
              >
                {copiedCode ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Confidence Records Panel */}
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
                          <span className="font-bold text-white truncate max-w-[120px]">{b.display_name}</span>
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
                All 2026 Matchups ({comparisons.length})
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
              Comparing Week <span className="text-amber-400 font-bold">{currentWeek}</span> (2026 Season)
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
              <h3 className="text-lg font-bold text-white mb-1">No picks match this filter for Week {currentWeek}</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Head to the <strong>Make Picks</strong> tab to submit your predictions for this matchup!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComparisons.map((c) => {
                const g = c.game;
                const myPick = c.myPick;
                const buddyPick = c.buddyPick;

                return (
                  <div 
                    key={g.id}
                    className="bg-[#0e1218] border border-white/10 rounded-3xl p-5 shadow-2xl hover:border-white/20 transition space-y-4"
                  >
                    {/* Game Matchup Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <img src={g.awayTeam.logo} alt={g.awayTeam.name} className="w-6 h-6 object-contain" />
                          <span className="font-bold text-white text-sm">
                            {g.awayTeam.rank ? `#${g.awayTeam.rank} ` : ''}{g.awayTeam.name}
                          </span>
                        </div>
                        <span className="text-[#9a978a] font-black text-xs">@</span>
                        <div className="flex items-center space-x-2">
                          <img src={g.homeTeam.logo} alt={g.homeTeam.name} className="w-6 h-6 object-contain" />
                          <span className="font-bold text-white text-sm">
                            {g.homeTeam.rank ? `#${g.homeTeam.rank} ` : ''}{g.homeTeam.name}
                          </span>
                        </div>
                      </div>

                      {/* Status / Agreement Badge */}
                      <div className="flex items-center space-x-2">
                        {c.comparisonStatus === 'AGREED' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Agreed Pick</span>
                          </span>
                        )}
                        {c.comparisonStatus === 'DISAGREED' && (
                          <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black uppercase flex items-center space-x-1">
                            <Swords className="w-3 h-3" />
                            <span>Split Rivalry Pick</span>
                          </span>
                        )}
                        <span className="text-[10px] text-[#9a978a] font-medium">
                          {g.statusDetail || '2026 Matchup'}
                        </span>
                      </div>
                    </div>

                    {/* Head-to-Head Comparison Boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Your Pick Box */}
                      <div className={`p-3.5 rounded-2xl border transition ${
                        myPick 
                          ? 'bg-black/50 border-amber-500/30' 
                          : 'bg-black/20 border-white/5 text-[#9a978a]'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-amber-400">Your Prediction</span>
                          {myPick?.confidence_level && (
                            <span className="text-[10px] text-amber-300 font-bold">
                              {myPick.confidence_level === 3 ? '🔥 High' : myPick.confidence_level === 2 ? '👍 Medium' : '🤷 Low'}
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-white text-sm">
                          {myPick?.predicted_winner_name || 'No prediction made'}
                        </div>
                      </div>

                      {/* Buddy Pick Box */}
                      <div className={`p-3.5 rounded-2xl border transition ${
                        buddyPick 
                          ? 'bg-black/50 border-indigo-500/30' 
                          : 'bg-black/20 border-white/5 text-[#9a978a]'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-indigo-400">
                            {selectedBuddy?.display_name || 'Buddy'}
                          </span>
                          {buddyPick?.confidence_level && (
                            <span className="text-[10px] text-indigo-300 font-bold">
                              {buddyPick.confidence_level === 3 ? '🔥 High' : buddyPick.confidence_level === 2 ? '👍 Medium' : '🤷 Low'}
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-white text-sm">
                          {buddyPick?.predicted_winner_name || 'No prediction made'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

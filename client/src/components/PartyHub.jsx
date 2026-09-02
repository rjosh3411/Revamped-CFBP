import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Trophy, Plus, Copy, Check, Send, Flame, 
  Crown, Shield, Sparkles, MessageSquare, ArrowRight, LogOut, Trash2,
  CheckCircle2, Target, DollarSign, Star, TrendingUp 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SCORING_PRESETS = [
  {
    id: 'STRAIGHT_UP',
    name: 'Straight-Up (SU)',
    icon: '🏆',
    description: 'Classic pick\'em: Pick the outright winner of each game (10 pts per win).'
  },
  {
    id: 'ATS',
    name: 'Against The Spread (ATS)',
    icon: '🎯',
    description: 'Vegas lines: Your picked team must cover the point spread.'
  },
  {
    id: 'OVER_UNDER',
    name: 'Over / Under (O/U)',
    icon: '🎲',
    description: 'Points total: Predict if the combined game score goes Over or Under.'
  },
  {
    id: 'CONFIDENCE',
    name: 'Confidence Points',
    icon: '⭐',
    description: 'Assign confidence values (1 to 10) to maximize your top matchup predictions.'
  }
];

export function PartyHub({ parties, onPartyCreated, onPartyJoined, onPartyLeft, onSelectPartyForComparison }) {
  const { user } = useAuth();
  const [selectedPartyId, setSelectedPartyId] = useState(parties?.[0]?.id || '');
  const [partyDetails, setPartyDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [leavingParty, setLeavingParty] = useState(false);
  const [syncingPicks, setSyncingPicks] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Form states
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyDesc, setNewPartyDesc] = useState('');
  const [newPartyConf, setNewPartyConf] = useState('ALL');
  const [newPartyScoring, setNewPartyScoring] = useState('STRAIGHT_UP');
  const [newPartyIcon, setNewPartyIcon] = useState('🏈');
  const [carryOverPicks, setCarryOverPicks] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (parties?.length > 0 && (!selectedPartyId || !parties.some(p => p.id === selectedPartyId))) {
      setSelectedPartyId(parties[0].id);
    }
  }, [parties]);

  useEffect(() => {
    if (selectedPartyId) {
      loadPartyInfo(selectedPartyId);
    }
  }, [selectedPartyId]);

  async function loadPartyInfo(partyId) {
    setLoading(true);
    try {
      const [details, msgs] = await Promise.all([
        api.getPartyDetails(partyId),
        api.getPartyMessages(partyId)
      ]);
      setPartyDetails(details);
      setMessages(msgs?.messages || []);
    } catch (err) {
      console.error('Failed to load party:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleLeaveParty = async (party) => {
    if (!window.confirm(`Are you sure you want to leave "${party.name}"?`)) {
      return;
    }

    setLeavingParty(true);
    try {
      await api.leaveParty(party.id);
      onPartyLeft && onPartyLeft(party.id);
    } catch (err) {
      console.error('Leave party error:', err);
      alert('Failed to leave party: ' + err.message);
    } finally {
      setLeavingParty(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartyId) return;

    try {
      const res = await api.sendPartyMessage(selectedPartyId, newMessage.trim());
      if (res?.message) {
        setMessages(prev => [...prev, res.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleSyncPicks = async (partyId) => {
    if (!partyId) return;
    setSyncingPicks(true);
    setSyncFeedback('');
    try {
      const res = await api.syncPartyPicks(partyId);
      setSyncFeedback(res.message || 'All your 2026 picks are synced and active in this party!');
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      await loadPartyInfo(partyId);
      setTimeout(() => setSyncFeedback(''), 5000);
    } catch (err) {
      console.error('Failed to sync picks:', err);
      alert('Failed to sync picks: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncingPicks(false);
    }
  };

  const handleCreateParty = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newPartyName.trim()) {
      setFormError('Party name is required');
      return;
    }

    try {
      const res = await api.createParty({
        name: newPartyName.trim(),
        description: newPartyDesc.trim(),
        conferenceFocus: newPartyConf,
        scoringType: newPartyScoring,
        icon: newPartyIcon
      });

      if (res?.party) {
        setCreateModalOpen(false);
        setNewPartyName('');
        setNewPartyDesc('');
        onPartyCreated && onPartyCreated(res.party);
        setSelectedPartyId(res.party.id);

        if (carryOverPicks) {
          try {
            await api.syncPartyPicks(res.party.id);
          } catch (e) {}
        }

        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create party');
    }
  };

  const handleJoinParty = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!joinCode.trim()) {
      setFormError('Invite code is required');
      return;
    }

    try {
      const res = await api.joinParty(joinCode.trim().toUpperCase());
      if (res?.party) {
        setJoinModalOpen(false);
        setJoinCode('');
        onPartyJoined && onPartyJoined(res.party);
        setSelectedPartyId(res.party.id);

        if (carryOverPicks) {
          try {
            await api.syncPartyPicks(res.party.id);
          } catch (e) {}
        }

        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      setFormError(err.message || 'Invalid invite code or party error');
    }
  };

  const currentParty = partyDetails?.party || parties.find(p => p.id === selectedPartyId);
  const members = partyDetails?.members || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Party Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Prediction Parties Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#faf6e8] athletic-title uppercase tracking-wide">
            Your Prediction Leagues
          </h1>
          <p className="text-xs text-[#dcd8c8]">
            Compete weekly with friends, select custom scoring rules (SU, Spread, O/U, Confidence), and track standings!
          </p>
        </div>

        {/* Action Buttons: Create / Join Party */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            onClick={() => { setFormError(''); setJoinModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-black/60 hover:bg-black text-[#faf6e8] px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 shadow transition"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Join With Code</span>
          </button>

          <button
            onClick={() => { setFormError(''); setCreateModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Party</span>
          </button>
        </div>
      </div>

      {/* Parties Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {parties.map(p => {
          const isSelected = p.id === selectedPartyId;
          const scoringPreset = SCORING_PRESETS.find(s => s.id === p.scoring_type) || SCORING_PRESETS[0];

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPartyId(p.id)}
              className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'bg-[#141b24] border-amber-400 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/10'
                  : 'bg-[#0e1218] hover:bg-[#12161f] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                    {p.icon || '🏈'}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white athletic-title line-clamp-1">{p.name}</h3>
                    <div className="text-[11px] text-[#9a978a] flex items-center space-x-2 mt-0.5">
                      <span>{p.member_count || 1} Members</span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold uppercase text-[10px]">{p.conference_focus || 'ALL'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  {isSelected && (
                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                      ACTIVE
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-[#86efac] bg-[#86efac]/10 px-1.5 py-0.2 rounded border border-[#86efac]/20 font-mono">
                    {scoringPreset.name.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Code and Copy */}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-[#9a978a]">
                  <span className="text-[10px] uppercase font-bold">Code:</span>
                  <span className="font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded text-[11px] border border-white/10">
                    {p.invite_code}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode(p.invite_code);
                  }}
                  className="text-[#9a978a] hover:text-amber-400 text-xs flex items-center space-x-1 transition"
                  title="Copy Invite Code"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Party Dashboard */}
      {currentParty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Party Standings Leaderboard (2 Cols) */}
          <div className="lg:col-span-2 bg-[#0e1218] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{currentParty.icon || '🏆'}</span>
                  <h2 className="text-xl font-extrabold text-white athletic-title">{currentParty.name}</h2>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-[#9a978a]">{currentParty.description || 'College Football prediction showdown'}</span>
                  <span>•</span>
                  <span className="text-xs text-amber-400 font-bold">
                    Mode: {SCORING_PRESETS.find(s => s.id === currentParty.scoring_type)?.name || 'Straight-Up'}
                  </span>
                </div>
              </div>

              {/* Top Action Pills: Invite Code & Leave Party */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-[11px] text-[#9a978a]">Code:</span>
                  <span className="font-mono font-bold text-amber-400">{currentParty.invite_code}</span>
                  <button
                    onClick={() => handleCopyCode(currentParty.invite_code)}
                    className="p-1 text-[#9a978a] hover:text-amber-400 transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#86efac]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Leave Party Button */}
                <button
                  onClick={() => handleLeaveParty(currentParty)}
                  disabled={leavingParty}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950 text-[#fca5a5] border border-red-500/30 text-xs font-bold transition"
                  title="Leave this prediction party"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave</span>
                </button>
              </div>
            </div>

            {/* Sync & Carry Over Picks Banner */}
            <div className="mb-4 p-3 rounded-2xl bg-[#070b10] border border-amber-400/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                  📥
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white flex items-center space-x-1.5">
                    <span>Carry Over & Sync 2026 Predictions</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9a978a]">
                    Your season picks automatically populate into this party so you never lose or re-select picks.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSyncPicks(currentParty.id)}
                disabled={syncingPicks}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition flex items-center justify-center space-x-1.5 shadow"
              >
                <TrendingUp className={`w-3.5 h-3.5 ${syncingPicks ? 'animate-spin' : ''}`} />
                <span>{syncingPicks ? 'Syncing...' : 'Sync My Picks'}</span>
              </button>
            </div>

            {syncFeedback && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-semibold animate-in fade-in flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Standings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase font-black text-[#9a978a]">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Player / School</th>
                    <th className="py-2.5 px-3 text-center">Correct</th>
                    <th className="py-2.5 px-3 text-center">Win %</th>
                    <th className="py-2.5 px-3 text-center">Streak</th>
                    <th className="py-2.5 px-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {members.map((m, index) => {
                    const isCurrentUser = m.id === user?.id;
                    return (
                      <tr
                        key={m.id}
                        className={`transition ${isCurrentUser ? 'bg-amber-500/10 font-semibold' : 'hover:bg-white/5'}`}
                      >
                        <td className="py-3 px-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                            index === 0 ? 'bg-amber-500 text-black' : 'bg-black/60 text-[#faf6e8] border border-white/10'
                          }`}>
                            {index + 1}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2.5">
                            {m.avatar_url ? (
                              <img src={m.avatar_url} alt={m.display_name} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center font-bold text-xs">
                                {m.display_name?.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="text-white font-bold flex items-center space-x-1.5">
                                <span>{m.display_name}</span>
                                {isCurrentUser && (
                                  <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-black">
                                    YOU
                                  </span>
                                )}
                                {m.role === 'owner' && <Crown className="w-3 h-3 text-amber-400" />}
                              </div>
                              <div className="text-[10px] text-[#9a978a]">{m.favorite_team}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center text-[#dcd8c8] font-mono">
                          {m.party_correct || 0} / {m.party_total_picks || 0}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-white">
                          {m.winPercentage || 0}%
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          {m.current_streak > 0 ? (
                            <span className="inline-flex items-center text-orange-400 font-bold">
                              <Flame className="w-3 h-3 fill-orange-400 mr-0.5" />
                              {m.current_streak}W
                            </span>
                          ) : (
                            <span className="text-[#9a978a]">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-black text-amber-400 font-mono text-sm">
                          {m.party_points || m.total_points || 0} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Party Live Chat & Trash Talk (1 Col) */}
          <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col h-[500px]">
            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-white/10">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm athletic-title uppercase">Party Trash Talk</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-[#9a978a] text-xs">
                  No messages yet. Send a friendly message or trash talk your picks!
                </div>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`p-2.5 rounded-xl text-xs ${
                      msg.type === 'system'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                        : msg.user_id === user?.id
                          ? 'bg-[#151b24] border border-white/10 text-white ml-4'
                          : 'bg-black/60 border border-white/5 text-[#dcd8c8] mr-4'
                    }`}
                  >
                    {msg.type !== 'system' && (
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9a978a] mb-1">
                        <span className="text-amber-400">{msg.display_name}</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-white/10 flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Talk game smack..."
                className="flex-1 bg-black text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black rounded-xl transition font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PARTY MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1218] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-white mb-1 athletic-title uppercase">Create Prediction Party</h2>
            <p className="text-xs text-[#9a978a] mb-4">Set up a weekly pick'em league for your squad.</p>

            {formError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateParty} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#faf6e8] font-bold mb-1">Party Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEC Saturday Clash, Power 4 Crew"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="w-full bg-black text-white p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Scoring Preset Selector Cards */}
              <div>
                <label className="block text-[#faf6e8] font-bold mb-1.5">League Scoring Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SCORING_PRESETS.map(preset => {
                    const isSelected = newPartyScoring === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setNewPartyScoring(preset.id)}
                        className={`cursor-pointer p-3 rounded-xl border transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#141b24] border-amber-400 ring-1 ring-amber-400/50 text-white font-bold'
                            : 'bg-black/60 border-white/10 hover:border-white/20 text-[#dcd8c8]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1.5">
                            <span>{preset.icon}</span>
                            <span className="font-extrabold text-xs">{preset.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-[#9a978a] leading-tight mt-1">{preset.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[#faf6e8] font-bold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Winner takes the bragging rights trophy!"
                  value={newPartyDesc}
                  onChange={(e) => setNewPartyDesc(e.target.value)}
                  className="w-full bg-black text-white p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#faf6e8] font-bold mb-1">Conference Focus</label>
                  <select
                    value={newPartyConf}
                    onChange={(e) => setNewPartyConf(e.target.value)}
                    className="w-full bg-black text-white p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-bold"
                  >
                    <option value="ALL">All FBS & Top 25</option>
                    <option value="SEC">SEC Only</option>
                    <option value="BIGTEN">Big Ten Only</option>
                    <option value="ACC">ACC Only</option>
                    <option value="BIG12">Big 12 Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#faf6e8] font-bold mb-1">Party Icon</label>
                  <select
                    value={newPartyIcon}
                    onChange={(e) => setNewPartyIcon(e.target.value)}
                    className="w-full bg-black text-white p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-bold"
                  >
                    <option value="🏈">🏈 Football</option>
                    <option value="🏆">🏆 Trophy</option>
                    <option value="🎯">🎯 Target (ATS)</option>
                    <option value="🔥">🔥 Fire</option>
                    <option value="👑">👑 Crown</option>
                  </select>
                </div>
              </div>

              {/* Carry Over Existing Picks Option */}
              <div 
                onClick={() => setCarryOverPicks(prev => !prev)}
                className="cursor-pointer p-3 rounded-xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition flex items-start space-x-2.5"
              >
                <input
                  type="checkbox"
                  checked={carryOverPicks}
                  onChange={(e) => setCarryOverPicks(e.target.checked)}
                  className="mt-0.5 rounded accent-amber-500"
                />
                <div>
                  <div className="font-bold text-white text-xs flex items-center space-x-1">
                    <span>Bring Over My 2026 Predictions</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 rounded">Recommended</span>
                  </div>
                  <p className="text-[10px] text-[#9a978a] mt-0.5 leading-tight">
                    Automatically link all your existing 2026 game picks, confidence ratings, and projected records into this party so you don't lose them!
                  </p>
                </div>
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-black/60 hover:bg-black text-[#faf6e8] rounded-xl font-bold transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black transition"
                >
                  Create & Get Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN PARTY MODAL */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1218] border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-extrabold text-white mb-1 athletic-title uppercase">Join Prediction Party</h2>
            <p className="text-xs text-[#9a978a] mb-4">Enter the 6-character party invite code.</p>

            {formError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleJoinParty} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#faf6e8] font-bold mb-1">Invite Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEC-892K or CFB-2026"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-black text-white p-3 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-mono text-center text-lg uppercase tracking-wider font-bold"
                />
              </div>

              {/* Carry Over Existing Picks Option */}
              <div 
                onClick={() => setCarryOverPicks(prev => !prev)}
                className="cursor-pointer p-3 rounded-xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition flex items-start space-x-2.5"
              >
                <input
                  type="checkbox"
                  checked={carryOverPicks}
                  onChange={(e) => setCarryOverPicks(e.target.checked)}
                  className="mt-0.5 rounded accent-amber-500"
                />
                <div>
                  <div className="font-bold text-white text-xs flex items-center space-x-1">
                    <span>Bring Over My 2026 Predictions</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 rounded">Recommended</span>
                  </div>
                  <p className="text-[10px] text-[#9a978a] mt-0.5 leading-tight">
                    Automatically link all your existing 2026 game picks and standings to this new party.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="flex-1 py-2.5 bg-black/60 hover:bg-black text-[#faf6e8] rounded-xl font-bold transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black transition"
                >
                  Join Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, MapPin, 
  Tv, Award, Sparkles, ChevronRight, Flame, Shield, Lock, DollarSign 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getMascotForTeam } from '../utils/mascotData';

export function TeamScheduleView({ team, onBack, onPickChanged }) {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Map of gameId -> confidence level (1=Low🤷, 2=Medium👍, 3=High🔥, null=unset)
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [mascotBounce, setMascotBounce] = useState(false);

  useEffect(() => {
    if (team) {
      loadSchedule();
    }
  }, [team]);

  async function loadSchedule() {
    setLoading(true);
    try {
      const data = await api.getTeamSchedule(team.id);
      const schedule = data?.schedule || [];
      setScheduleData(schedule);
      // Pre-populate confidence from existing picks
      const existing = {};
      schedule.forEach(g => {
        if (g.userPick?.confidence_level) {
          existing[g.gameId] = g.userPick.confidence_level;
        }
      });
      setConfidenceLevels(existing);
    } catch (err) {
      console.error('Failed to load team schedule:', err);
    } finally {
      setLoading(false);
    }
  }

  const handlePick = async (gameId, isWin, isLocked) => {
    if (isLocked) return;

    const game = scheduleData.find(g => g.gameId === gameId);
    if (!game) return;

    const oppName = game.opponent?.name || game.opponentName || game.opponent || 'Opponent';
    const winnerName = isWin ? team.name : oppName;
    const winnerId = isWin ? team.id : oppName.toLowerCase().replace(/\s+/g, '-');
    const currentConfidence = confidenceLevels[gameId] || null;

    try {
      await api.submitPick({
        gameId,
        seasonYear: 2026,
        weekNumber: game.week,
        predictedWinnerId: winnerId,
        predictedWinnerName: winnerName,
        confidencePoints: 1,
        confidenceLevel: currentConfidence
      });

      // Update local state
      setScheduleData(prev => prev.map(g => {
        if (g.gameId === gameId) {
          return {
            ...g,
            userPrediction: isWin ? 'WIN' : 'LOSS',
            userPick: {
              predicted_winner_name: winnerName,
              predicted_winner_id: winnerId,
              confidence_level: currentConfidence
            }
          };
        }
        return g;
      }));

      onPickChanged && onPickChanged();

      // Trigger mascot peeking bounce animation
      setMascotBounce(true);
      setTimeout(() => setMascotBounce(false), 600);

      if (isWin) {
        try {
          confetti({
            particleCount: 20,
            spread: 50,
            origin: { y: 0.8 },
            colors: [team.colors?.primary || '#faf6e8', '#86efac', '#f59e0b']
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to save pick:', err);
      alert(err.message || 'Failed to save pick. This game may be locked.');
    }
  };

  // Save confidence level for a picked game immediately
  const handleConfidence = async (gameId, level, game) => {
    if (!game.userPrediction) return; // Only allow on picked games
    const newLevel = confidenceLevels[gameId] === level ? null : level; // Toggle off if same
    setConfidenceLevels(prev => ({ ...prev, [gameId]: newLevel }));

    try {
      const winnerName = game.userPick?.predicted_winner_name;
      const winnerId = game.userPick?.predicted_winner_id;
      if (!winnerId || !winnerName) return;
      await api.submitPick({
        gameId,
        seasonYear: 2026,
        weekNumber: game.week,
        predictedWinnerId: winnerId,
        predictedWinnerName: winnerName,
        confidencePoints: 1,
        confidenceLevel: newLevel
      });
    } catch (err) {
      console.error('Failed to save confidence:', err);
    }
  };

  const winCount = scheduleData.filter(g => g.userPrediction === 'WIN').length;
  const lossCount = scheduleData.filter(g => g.userPrediction === 'LOSS').length;
  const unpickedCount = scheduleData.filter(g => !g.userPrediction).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Team Info & Back Button */}
      <div 
        className="rounded-3xl p-6 border shadow-2xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${team.colors?.primary || '#1e293b'}44 0%, #0d1117 100%)`,
          borderColor: `${team.colors?.primary || '#faf6e8'}40`
        }}
      >
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center space-x-2 text-xs font-bold text-[#faf6e8] bg-black/60 hover:bg-black/80 px-3.5 py-1.5 rounded-full border border-white/10 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {team.conference} Teams</span>
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={team.logoUrl}
                alt={team.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl"
              />
              {team.ranking && (
                <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded-full shadow-lg border border-amber-300">
                  #{team.ranking}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#faf6e8] tracking-wide font-sans">
                  {team.name} {team.nickname}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-[#dcd8c8] font-medium">
                  {team.conference} • 2026 Schedule & Lines
                </p>
                <span className="text-[11px] font-mono font-black text-amber-300 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10 shadow-sm">
                  Record: {team.currentRecord || '0-0'}
                </span>
              </div>
            </div>
          </div>

          {/* User Projected Record Badge with Authentic Peeking Mascot */}
          {(() => {
            const mascot = getMascotForTeam(team);
            const totalPicked = winCount + lossCount;
            let mascotMood = 'CURIOUS';
            if (winCount >= 10) {
              mascotMood = 'HYPE';
            } else if (winCount >= 6 && winCount >= lossCount) {
              mascotMood = 'CONFIDENT';
            } else if (lossCount > winCount && lossCount >= 3) {
              mascotMood = 'NERVOUS';
            } else if (totalPicked > 0 && winCount > lossCount) {
              mascotMood = 'CONFIDENT';
            }

            return (
              <div className="relative pt-8 min-w-[160px] self-center sm:self-auto">
                {/* Dynamic Peeking Mascot Container */}
                {mascot && (
                  <div 
                    className={`absolute left-1/2 -translate-x-1/2 z-0 pointer-events-none transition-all duration-500 ease-out flex flex-col items-center ${
                      mascotBounce ? 'animate-mascot-peek' : ''
                    } ${
                      mascotMood === 'HYPE'
                        ? '-top-8 scale-110'
                        : mascotMood === 'CONFIDENT'
                          ? '-top-6 scale-100'
                          : mascotMood === 'NERVOUS'
                            ? '-top-2 scale-90 opacity-80 animate-mascot-nervous'
                            : '-top-4 scale-95 opacity-95'
                    }`}
                  >
                    {/* Mood Floating Badge & Mascot Name Tooltip */}
                    <div className="text-[11px] font-black mb-0.5 filter drop-shadow select-none flex items-center space-x-1 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 text-amber-300">
                      <span>{mascotMood === 'HYPE' ? '🔥' : mascotMood === 'CONFIDENT' ? '👍' : mascotMood === 'NERVOUS' ? '💧' : '👀'}</span>
                      <span className="text-[9px] font-sans font-bold text-white max-w-[90px] truncate">{mascot.name}</span>
                    </div>

                    {/* Mascot Character Head (Real Costume Headshot Photo or SVG) */}
                    {mascot.photoUrl ? (
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-t-full overflow-hidden border-2 border-amber-400/60 shadow-2xl bg-black/50">
                        <img
                          src={mascot.photoUrl}
                          alt={mascot.name}
                          className="w-full h-full object-cover object-top filter contrast-105"
                        />
                      </div>
                    ) : (
                      <div 
                        className={`w-14 h-14 drop-shadow-2xl transition-all ${
                          mascotMood === 'HYPE' ? 'animate-mascot-hype' : ''
                        }`}
                        dangerouslySetInnerHTML={{ __html: mascot.svg }}
                      />
                    )}

                    {/* Mascot Paws Resting On Top Border */}
                    <div className="flex items-center justify-between w-11 -mt-2 z-20">
                      <div 
                        className="w-3.5 h-3 rounded-t-full shadow-lg border-t-2 border-x"
                        style={{ 
                          backgroundColor: mascot.pawColor || team.colors?.primary || '#faf6e8', 
                          borderColor: mascot.pawBorder || 'rgba(255,255,255,0.7)' 
                        }}
                      />
                      <div 
                        className="w-3.5 h-3 rounded-t-full shadow-lg border-t-2 border-x"
                        style={{ 
                          backgroundColor: mascot.pawColor || team.colors?.primary || '#faf6e8', 
                          borderColor: mascot.pawBorder || 'rgba(255,255,255,0.7)' 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Projection Card Box with 12-Segment Progress Bar & Milestones */}
                <div className="relative z-10 bg-black/85 p-3.5 rounded-2xl border border-white/15 text-center shadow-2xl backdrop-blur-md min-w-[175px]">
                  <div className="text-[10px] uppercase font-bold text-[#9a978a] tracking-wider">Your 2026 Projection</div>
                  
                  {/* Record Numbers */}
                  <div className="text-2xl font-black text-[#faf6e8] font-mono mt-0.5 flex items-center justify-center space-x-1.5">
                    <span className="text-[#86efac]">{winCount}W</span>
                    <span className="text-[#9a978a] font-light">-</span>
                    <span className="text-[#fca5a5]">{lossCount}L</span>
                  </div>

                  {/* 12-Game Season Segmented Progress Bar */}
                  <div className="flex items-center justify-center gap-1 my-2 px-1">
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const game = scheduleData[idx];
                      const isWin = game?.userPrediction === 'WIN';
                      const isLoss = game?.userPrediction === 'LOSS';
                      return (
                        <div
                          key={idx}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            isWin
                              ? 'bg-[#86efac] shadow-[0_0_8px_rgba(134,239,172,0.6)]'
                              : isLoss
                                ? 'bg-[#fca5a5] shadow-[0_0_8px_rgba(252,165,165,0.6)]'
                                : 'bg-white/10'
                          }`}
                          title={`Game ${idx + 1}: ${isWin ? 'Win' : isLoss ? 'Loss' : 'Unpicked'}`}
                        />
                      );
                    })}
                  </div>

                  {/* Dynamic Milestone Badge */}
                  <div className="mt-1">
                    {winCount === 12 ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-300 text-black shadow-md animate-pulse">
                        <span>👑 Undefeated Season</span>
                      </span>
                    ) : winCount >= 10 ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        <span>🏆 CFP Contender</span>
                      </span>
                    ) : winCount >= 6 ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        <span>🏈 Bowl Eligible</span>
                      </span>
                    ) : lossCount >= 7 ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-white/10">
                        <span>🔨 Rebuilding</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#9a978a]">
                        {unpickedCount > 0 ? `${unpickedCount} games unpicked` : 'All games picked!'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Schedule Matchups List */}
      {loading ? (
        <div className="text-center py-16 text-[#9a978a]">
          <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
          Loading {team.name}'s verified 2026 Schedule & Lines...
        </div>
      ) : scheduleData.length === 0 ? (
        <div className="bg-[#0e1218] rounded-3xl p-12 text-center border border-white/10 text-[#9a978a]">
          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No schedule found for this team</h3>
          <p className="text-xs text-[#9a978a]">Please select another team from the conference grid.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduleData.map((item, idx) => {
            const isWin = item.userPrediction === 'WIN';
            const isLoss = item.userPrediction === 'LOSS';
            const isLocked = item.isLocked || false;
            const odds = item.bettingLine || {};

            const gameDate = new Date(item.date);
            const dateFormatted = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeFormatted = gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={item.gameId || idx}
                className={`bg-[#0e1218] rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-lg relative overflow-hidden ${
                  isLocked 
                    ? 'opacity-85 border-white/10 bg-[#0b0e14]'
                    : isWin
                      ? 'border-[#86efac]/40 bg-[#0e1218]/90 shadow-[0_0_20px_rgba(134,239,172,0.08)]'
                      : isLoss
                        ? 'border-[#fca5a5]/40 bg-[#0e1218]/90 shadow-[0_0_20px_rgba(252,165,165,0.08)]'
                        : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Week, Opponent, Date & Venue */}
                  <div className="flex items-start sm:items-center space-x-3.5">
                    {/* Week Badge */}
                    <div className="w-11 h-11 rounded-xl bg-black/60 border border-white/10 flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="text-[9px] uppercase font-bold text-[#9a978a]">WK</span>
                      <span className="text-xs font-black text-amber-400">{item.week}</span>
                    </div>

                    {/* Opponent Logo & Matchup Details */}
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.opponent?.logo || item.opponentLogo || 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'}
                          alt={item.opponent?.name || item.opponentName || item.opponent || 'Opponent'}
                          className="w-11 h-11 object-contain drop-shadow"
                          onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                        />
                        {(item.opponent?.rank || item.opponentRank) && (
                          <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[9px] font-black px-1 rounded-full">
                            #{item.opponent?.rank || item.opponentRank}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 text-xs text-[#9a978a]">
                          <span className="font-extrabold uppercase text-[#faf6e8] bg-black/50 px-1.5 py-0.2 rounded">
                            {item.isHome ? 'VS' : '@'}
                          </span>
                          <span>•</span>
                          <span>{dateFormatted}</span>
                          {item.broadcast && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">{item.broadcast}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm sm:text-base font-extrabold text-white line-clamp-1 athletic-title mt-0.5">
                          {item.opponent?.name || item.opponentName || item.opponent || 'Opponent'}
                        </div>
                        <div className="text-[10px] text-[#9a978a] flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate max-w-xs">{item.venue || 'College Stadium'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Sportsbook Vegas Betting Lines Badge */}
                  <div className="flex flex-wrap items-center gap-2 bg-black/60 px-3 py-2 rounded-xl border border-white/10 text-xs self-start lg:self-center">
                    <div className="flex items-center space-x-1 text-amber-400 font-black uppercase text-[10px]">
                      <span>🎲 LINE:</span>
                    </div>

                    <div className="font-mono font-bold text-white text-[11px]">
                      {odds.spreadText || 'PK -110'}
                    </div>

                    <span className="text-[#9a978a]">•</span>

                    <div className="font-mono text-[#dcd8c8] text-[11px]">
                      {odds.overUnderText || 'O/U 50.5'}
                    </div>

                    <div className="hidden sm:inline-flex items-center space-x-1 text-[10px] text-[#9a978a] border-l border-white/10 pl-2">
                      <span>ML:</span>
                      <span className="text-amber-300 font-mono font-bold">{odds.moneylineFav || '-110'}</span>
                    </div>
                  </div>

                  {/* Right: Tactile Stadium WIN / LOSS Buttons OR Lock Badge */}
                  <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
                    {isLocked ? (
                      <div className="flex items-center space-x-2 bg-black/80 px-4 py-2 rounded-xl border border-white/10 text-xs">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-[#9a978a] uppercase text-[11px]">
                          {item.isFinal ? `Final (${item.score?.teamScore}-${item.score?.opponentScore})` : 'Picks Locked'}
                        </span>
                        {item.userPrediction && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ml-1 ${
                            isWin ? 'bg-[#86efac] text-black' : 'bg-[#fca5a5] text-black'
                          }`}>
                            {item.userPrediction}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handlePick(item.gameId, true, isLocked)}
                          className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                            isWin
                              ? 'bg-gradient-to-b from-[#86efac] to-[#4ade80] text-[#052e16] shadow-[0_0_20px_rgba(134,239,172,0.45)] ring-2 ring-[#86efac] scale-105'
                              : 'bg-[#0a180f] hover:bg-[#122e1c] text-[#86efac] border border-[#86efac]/35 hover:border-[#86efac]/70 hover:shadow-md'
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${isWin ? 'stroke-[2.5]' : ''}`} />
                          <span>WIN</span>
                        </button>

                        <button
                          onClick={() => handlePick(item.gameId, false, isLocked)}
                          className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                            isLoss
                              ? 'bg-gradient-to-b from-[#fca5a5] to-[#f87171] text-[#450a0a] shadow-[0_0_20px_rgba(252,165,165,0.45)] ring-2 ring-[#fca5a5] scale-105'
                              : 'bg-[#1a0a0c] hover:bg-[#2e1014] text-[#fca5a5] border border-[#fca5a5]/35 hover:border-[#fca5a5]/70 hover:shadow-md'
                          }`}
                        >
                          <XCircle className={`w-4 h-4 ${isLoss ? 'stroke-[2.5]' : ''}`} />
                          <span>LOSS</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Confidence Selector — appears only after a pick is made, hidden on locked games */}
                {(isWin || isLoss) && !isLocked && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-[#9a978a] tracking-wider mr-1">
                      Confidence:
                    </span>
                    {[
                      { level: 1, icon: '🤷', label: 'Low' },
                      { level: 2, icon: '👍', label: 'Medium' },
                      { level: 3, icon: '🔥', label: 'High' }
                    ].map(({ level, icon, label }) => {
                      const isSelected = confidenceLevels[item.gameId] === level;
                      return (
                        <button
                          key={level}
                          onClick={() => handleConfidence(item.gameId, level, item)}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[11px] font-black border transition ${
                            isSelected
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                              : 'bg-black/50 text-[#dcd8c8] border-white/10 hover:border-amber-400/40 hover:bg-black/80'
                          }`}
                          title={`Set confidence: ${label}`}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                    {confidenceLevels[item.gameId] && (
                      <span className="text-[10px] text-amber-400 font-bold ml-1">
                        {confidenceLevels[item.gameId] === 3 ? '🔥 High Confidence Pick!' : confidenceLevels[item.gameId] === 2 ? '👍 Feeling Good' : '🤷 Coin Flip Territory'}
                      </span>
                    )}
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

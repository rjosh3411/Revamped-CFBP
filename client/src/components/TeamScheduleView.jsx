import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, MapPin, 
  Tv, Award, Sparkles, ChevronRight, Flame, Shield, Lock, DollarSign 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function TeamScheduleView({ team, onBack, onPickChanged }) {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Map of gameId -> confidence level (1=Low🤷, 2=Medium👍, 3=High🔥, null=unset)
  const [confidenceLevels, setConfidenceLevels] = useState({});

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

    const winnerName = isWin ? team.name : game.opponent.name;
    const winnerId = isWin ? team.id : (game.opponent.name.toLowerCase().replace(/\s+/g, '-'));
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

          {/* User Projected Record Badge */}
          <div className="bg-black/70 p-3.5 rounded-2xl border border-white/10 text-center min-w-[140px]">
            <div className="text-[10px] uppercase font-bold text-[#9a978a]">Your 2026 Projection</div>
            <div className="text-2xl font-black text-[#faf6e8] font-mono mt-0.5">
              <span className="text-[#86efac]">{winCount}</span> - <span className="text-[#fca5a5]">{lossCount}</span>
            </div>
            <div className="text-[10px] text-[#9a978a] mt-0.5">
              {unpickedCount > 0 ? `${unpickedCount} games unpicked` : 'All games picked!'}
            </div>
          </div>
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
                      ? 'border-[#86efac]/40 bg-[#0e1218]/90'
                      : isLoss
                        ? 'border-[#fca5a5]/40 bg-[#0e1218]/90'
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
                          src={item.opponent.logo}
                          alt={item.opponent.name}
                          className="w-11 h-11 object-contain drop-shadow"
                          onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                        />
                        {item.opponent.rank && (
                          <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[9px] font-black px-1 rounded-full">
                            #{item.opponent.rank}
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
                          {item.opponent.name}
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

                  {/* Right: Interactive WIN / LOSS Prediction Buttons OR Lock Badge */}
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
                          className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition flex items-center justify-center space-x-1.5 ${
                            isWin
                              ? 'bg-[#86efac] text-black shadow-lg shadow-[#86efac]/20 scale-105'
                              : 'bg-black/60 hover:bg-[#86efac]/20 text-[#86efac] border border-[#86efac]/40'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>WIN</span>
                        </button>

                        <button
                          onClick={() => handlePick(item.gameId, false, isLocked)}
                          className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition flex items-center justify-center space-x-1.5 ${
                            isLoss
                              ? 'bg-[#fca5a5] text-black shadow-lg shadow-[#fca5a5]/20 scale-105'
                              : 'bg-black/60 hover:bg-[#fca5a5]/20 text-[#fca5a5] border border-[#fca5a5]/40'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
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

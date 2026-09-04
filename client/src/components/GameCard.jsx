import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Tv, MapPin, 
  Flame, Lock, Award, ChevronRight, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function GameCard({ game, onPick, isSaving }) {
  const home = game.homeTeam;
  const away = game.awayTeam;
  const userPick = game.userPick;

  const pickId = userPick?.predicted_winner_id || userPick?.predictedWinnerId || null;
  const pickName = userPick?.predicted_winner_name || userPick?.predictedWinnerName || null;
  const pickConfidence = userPick?.confidence_points || userPick?.confidencePoints || 1;

  const [selectedTeamId, setSelectedTeamId] = useState(pickId);
  const [confidence, setConfidence] = useState(pickConfidence);

  useEffect(() => {
    if (pickId) {
      setSelectedTeamId(pickId);
    }
    if (pickConfidence) {
      setConfidence(pickConfidence);
    }
  }, [pickId, pickConfidence]);

  const isFinal = game.isFinal;
  const isInProgress = game.isInProgress;
  const hasPick = !!userPick || !!selectedTeamId;

  const effectiveWinnerId = selectedTeamId || pickId || null;
  const effectiveWinnerName = pickName || null;

  const isAwaySelected = !!(effectiveWinnerId && (
    effectiveWinnerId === away.id ||
    (away.name && effectiveWinnerId.toLowerCase() === away.name.toLowerCase()) ||
    (effectiveWinnerName && away.name && (effectiveWinnerName.toLowerCase() === away.name.toLowerCase() || effectiveWinnerName.toLowerCase().includes(away.name.toLowerCase()))) ||
    (away.espnId && String(effectiveWinnerId) === String(away.espnId)) ||
    (away.abbreviation && effectiveWinnerId.toUpperCase() === away.abbreviation.toUpperCase())
  ));

  const isHomeSelected = !!(effectiveWinnerId && (
    effectiveWinnerId === home.id ||
    (home.name && effectiveWinnerId.toLowerCase() === home.name.toLowerCase()) ||
    (effectiveWinnerName && home.name && (effectiveWinnerName.toLowerCase() === home.name.toLowerCase() || effectiveWinnerName.toLowerCase().includes(home.name.toLowerCase()))) ||
    (home.espnId && String(effectiveWinnerId) === String(home.espnId)) ||
    (home.abbreviation && effectiveWinnerId.toUpperCase() === home.abbreviation.toUpperCase())
  ));

  const handleSelectWinner = (teamId, teamName) => {
    setSelectedTeamId(teamId);
    if (onPick) {
      onPick({
        gameId: game.id,
        seasonYear: game.seasonYear || 2026,
        weekNumber: game.weekNumber || 1,
        predictedWinnerId: teamId,
        predictedWinnerName: teamName,
        confidencePoints: confidence
      });

      // Subtle celebration confetti
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#22c55e', '#3b82f6']
        });
      } catch (e) {}
    }
  };

  const handleConfidenceChange = (pts) => {
    setConfidence(pts);
    if (selectedTeamId && onPick) {
      const chosenTeam = selectedTeamId === home.id ? home.name : away.name;
      onPick({
        gameId: game.id,
        seasonYear: game.seasonYear || 2026,
        weekNumber: game.weekNumber || 1,
        predictedWinnerId: selectedTeamId,
        predictedWinnerName: chosenTeam,
        confidencePoints: pts
      });
    }
  };

  // Format date and time
  const gameDate = new Date(game.date);
  const timeString = gameDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    timeZoneName: 'short' 
  });
  const dateString = gameDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div className={`relative rounded-2xl bg-slate-900/90 border transition-all duration-200 shadow-xl overflow-hidden ${
      hasPick 
        ? userPick?.is_correct === 1
          ? 'border-emerald-500/60 shadow-emerald-500/10'
          : userPick?.is_correct === 0
            ? 'border-red-500/60 shadow-red-500/10'
            : 'border-amber-500/50 shadow-amber-500/10'
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Top Game Info Bar */}
      <div className="bg-slate-950/80 px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800/80">
        <div className="flex items-center space-x-2 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{dateString} • {timeString}</span>
        </div>

        {/* Live Status or Broadcast */}
        <div className="flex items-center space-x-2">
          {game.broadcast && (
            <span className="flex items-center text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              <Tv className="w-3 h-3 mr-1 text-amber-400" />
              {game.broadcast}
            </span>
          )}

          {isFinal ? (
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {game.statusDetail || 'Final'}
            </span>
          ) : isInProgress ? (
            <span className="flex items-center text-[11px] font-extrabold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-ping"></span>
              LIVE
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">
              Scheduled
            </span>
          )}
        </div>
      </div>

      {/* Main Teams Matchup Area */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* AWAY TEAM BOX */}
          <button
            onClick={() => handleSelectWinner(away.id, away.name)}
            className={`group text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between relative overflow-hidden ${
              isAwaySelected
                ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 hover:border-slate-600'
            }`}
          >
            {/* Team Primary Color Left Accent */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5" 
              style={{ backgroundColor: away.color || '#991b1b' }}
            />

            <div className="flex items-center space-x-3 pl-1.5">
              {/* Team Logo with AP Rank Badge */}
              <div className="relative flex-shrink-0">
                <img
                  src={away.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${away.id}.png`}
                  alt={away.name}
                  className="w-12 h-12 object-contain drop-shadow-md transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png';
                  }}
                />
                {away.rank && (
                  <span className="absolute -top-1 -left-1 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-md border border-amber-300">
                    #{away.rank}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {away.abbreviation || 'AWAY'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({away.record || '0-0'})
                  </span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                  {away.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  Away
                </div>
              </div>
            </div>

            {/* Score & Pick Status */}
            <div className="flex items-center space-x-3">
              {(isFinal || isInProgress) && (
                <div className="text-xl font-black text-white font-display">
                  {away.score}
                </div>
              )}

              <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition ${
                isAwaySelected
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black scale-110 shadow'
                  : 'border-slate-600 text-transparent group-hover:border-slate-400'
              }`}>
                ✓
              </div>
            </div>
          </button>

          {/* HOME TEAM BOX */}
          <button
            onClick={() => handleSelectWinner(home.id, home.name)}
            className={`group text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between relative overflow-hidden ${
              isHomeSelected
                ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 hover:border-slate-600'
            }`}
          >
            {/* Team Primary Color Left Accent */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5" 
              style={{ backgroundColor: home.color || '#1e3a8a' }}
            />

            <div className="flex items-center space-x-3 pl-1.5">
              {/* Team Logo with AP Rank Badge */}
              <div className="relative flex-shrink-0">
                <img
                  src={home.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${home.id}.png`}
                  alt={home.name}
                  className="w-12 h-12 object-contain drop-shadow-md transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png';
                  }}
                />
                {home.rank && (
                  <span className="absolute -top-1 -left-1 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-md border border-amber-300">
                    #{home.rank}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {home.abbreviation || 'HOME'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({home.record || '0-0'})
                  </span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                  {home.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  Home
                </div>
              </div>
            </div>

            {/* Score & Pick Status */}
            <div className="flex items-center space-x-3">
              {(isFinal || isInProgress) && (
                <div className="text-xl font-black text-white font-display">
                  {home.score}
                </div>
              )}

              <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition ${
                isHomeSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black scale-110 shadow'
                  : 'border-slate-600 text-transparent group-hover:border-slate-400'
              }`}>
                ✓
              </div>
            </div>
          </button>
        </div>

        {/* Odds & Stadium Venue */}
        {(game.odds || game.venue) && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1">
            {game.odds && (
              <span className="text-amber-400/90 font-medium">
                Line: {typeof game.odds === 'object' ? (game.odds.fullLine || game.odds.spreadText || '') : game.odds}
              </span>
            )}
            {game.venue && (
              <span className="flex items-center text-slate-400 truncate max-w-xs">
                <MapPin className="w-3 h-3 mr-1 text-slate-500 flex-shrink-0" />
                <span className="truncate">{game.venue}</span>
              </span>
            )}
          </div>
        )}

        {/* Prediction Status & Confidence Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          {/* User's Pick Status Badge */}
          <div className="flex items-center space-x-2">
            {hasPick ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Your Pick:</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {userPick.predicted_winner_name}
                </span>

                {/* Outcome Badge */}
                {userPick.is_correct === 1 && (
                  <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Correct (+{userPick.points_awarded || 10} pts)
                  </span>
                )}
                {userPick.is_correct === 0 && (
                  <span className="flex items-center text-xs font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40">
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Missed ({userPick.points_awarded !== undefined && userPick.points_awarded !== null ? `${userPick.points_awarded > 0 ? `-${userPick.points_awarded}` : userPick.points_awarded}` : `-${(userPick.confidence_points || 1) * 10}`} pts)
                  </span>
                )}
                {userPick.is_correct === null && (
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    Pending Outcome
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">
                Tap a team to make your prediction
              </span>
            )}
          </div>

          {/* Confidence points selector */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Confidence:</span>
            {[1, 2, 3].map(pts => (
              <button
                key={pts}
                onClick={() => handleConfidenceChange(pts)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  confidence === pts
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title={`${pts * 10} points on correct prediction`}
              >
                {pts}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

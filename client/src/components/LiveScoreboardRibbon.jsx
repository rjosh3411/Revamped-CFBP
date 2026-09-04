import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function extractGameDetails(g) {
  if (!g) return null;

  // Normalized backend object (from /api/games/live-tracker or /api/games)
  if (g.homeTeam && g.awayTeam) {
    const isLive = g.isLive || g.isInProgress || g.status === 'STATUS_IN_PROGRESS' || g.statusState === 'in';
    const isFinal = g.isFinal || g.status === 'STATUS_FINAL' || g.statusState === 'post';
    return {
      id: g.id || g.game_id || g.gameId,
      home: {
        id: g.homeTeam.id,
        name: g.homeTeam.name || 'Home Team',
        logo: g.homeTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${g.homeTeam.id || 7}.png`,
        rank: g.homeTeam.rank || null,
        score: parseInt(g.homeTeam.score ?? g.home_team_score ?? 0, 10),
        abbr: g.homeTeam.abbreviation || (g.homeTeam.name ? g.homeTeam.name.slice(0, 4) : 'HOME')
      },
      away: {
        id: g.awayTeam.id,
        name: g.awayTeam.name || 'Away Team',
        logo: g.awayTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${g.awayTeam.id || 7}.png`,
        rank: g.awayTeam.rank || null,
        score: parseInt(g.awayTeam.score ?? g.away_team_score ?? 0, 10),
        abbr: g.awayTeam.abbreviation || (g.awayTeam.name ? g.awayTeam.name.slice(0, 4) : 'AWAY')
      },
      status: g.statusDetail || (isFinal ? 'FINAL' : (isLive ? 'LIVE' : 'SCHEDULED')),
      statusDetail: g.statusDetail || (isFinal ? 'Final' : (isLive ? 'In Progress' : 'Scheduled')),
      isLive,
      isFinal,
      period: g.period || null,
      clock: g.clock || null,
      downDistance: g.downDistance || null,
      possession: g.possession || null,
      date: g.date || g.game_date || '',
      broadcast: g.broadcast || 'ESPN',
      odds: g.odds || null,
      winnerId: g.winnerId || (isFinal ? (g.homeTeam.score > g.awayTeam.score ? g.homeTeam.id : g.awayTeam.id) : null),
      userPick: g.userPick || null
    };
  }

  // ESPN raw event structure fallback
  const comp = g.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const homeComp = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
  const awayComp = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};

  const homeTeamObj = homeComp.team || {};
  const awayTeamObj = awayComp.team || {};

  const statusType = g.status?.type?.name || comp.status?.type?.name || g.status || 'STATUS_SCHEDULED';
  const statusState = g.status?.type?.state || 'pre';
  const isFinal = statusState === 'post' || statusType === 'STATUS_FINAL';
  const isLive = statusState === 'in' || statusType === 'STATUS_IN_PROGRESS';

  return {
    id: g.id || g.game_id || comp.id,
    home: {
      id: homeTeamObj.id,
      name: homeTeamObj.displayName || homeTeamObj.name || g.home_team_name || 'Home Team',
      logo: homeTeamObj.logos?.[0]?.href || homeTeamObj.logo || g.home_team_logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${homeTeamObj.id || 7}.png`,
      rank: (homeComp.curatedRank?.current && homeComp.curatedRank.current <= 25) ? homeComp.curatedRank.current : (g.home_team_rank || null),
      score: parseInt(homeComp.score || g.home_team_score || 0, 10),
      abbr: homeTeamObj.abbreviation || (homeTeamObj.name ? homeTeamObj.name.slice(0, 4) : 'HOME')
    },
    away: {
      id: awayTeamObj.id,
      name: awayTeamObj.displayName || awayTeamObj.name || g.away_team_name || 'Away Team',
      logo: awayTeamObj.logos?.[0]?.href || awayTeamObj.logo || g.away_team_logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${awayTeamObj.id || 7}.png`,
      rank: (awayComp.curatedRank?.current && awayComp.curatedRank.current <= 25) ? awayComp.curatedRank.current : (g.away_team_rank || null),
      score: parseInt(awayComp.score || g.away_team_score || 0, 10),
      abbr: awayTeamObj.abbreviation || (awayTeamObj.name ? awayTeamObj.name.slice(0, 4) : 'AWAY')
    },
    status: g.status?.type?.detail || comp.status?.type?.detail || g.status_detail || (isFinal ? 'FINAL' : (isLive ? 'LIVE' : 'SCHEDULED')),
    statusDetail: g.status?.type?.detail || comp.status?.type?.detail || (isFinal ? 'Final' : (isLive ? 'In Progress' : 'Scheduled')),
    isLive,
    isFinal,
    period: g.status?.period || comp.status?.period || null,
    clock: g.status?.displayClock || comp.status?.displayClock || null,
    downDistance: comp.situation?.downDistanceText || null,
    possession: comp.situation?.possession || null,
    date: g.date || comp.date || g.game_date || '',
    broadcast: comp.broadcasts?.[0]?.names?.[0] || g.broadcast || 'ESPN',
    odds: comp.odds?.[0]?.details || null,
    winnerId: isFinal ? (homeComp.winner ? homeTeamObj.id : awayTeamObj.id) : null,
    userPick: null
  };
}

export function LiveScoreboardRibbon({ onSelectGame }) {
  const { user } = useAuth();
  const [liveGames, setLiveGames] = useState([]);
  const [userPicks, setUserPicks] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    loadScoreboard(false);

    // Continuous real-time auto-refresh every 15 seconds
    pollTimerRef.current = setInterval(() => {
      loadScoreboard(true);
    }, 15000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [user]);

  async function loadScoreboard(isBackground = false) {
    if (!isBackground) setIsRefreshing(true);
    try {
      let rawEvents = [];

      // 1. Primary: Direct ESPN Scoreboard fetch from client (super-fast, real-time CORS enabled)
      try {
        const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=100');
        if (espnRes.ok) {
          const espnJson = await espnRes.json();
          if (espnJson && Array.isArray(espnJson.events) && espnJson.events.length > 0) {
            rawEvents = espnJson.events;
          }
        }
      } catch (e) {
        console.warn('Direct ESPN fetch failed, falling back to server route:', e);
      }

      // 2. Secondary: Fallback to backend live-tracker route
      if (rawEvents.length === 0) {
        try {
          const liveRes = await api.getLiveTracker();
          if (liveRes && liveRes.games && liveRes.games.length > 0) {
            rawEvents = liveRes.games;
          }
        } catch (err) {
          console.warn('Server live tracker route failed:', err);
        }
      }

      // 3. Tertiary: Fallback to standard 2026 week 1 games
      if (rawEvents.length === 0) {
        const gamesData = await api.getGames({ year: 2026, week: 1 });
        rawEvents = gamesData?.games || [];
      }

      // User picks
      let userPicksData = [];
      if (user) {
        try {
          const picksRes = await api.getMyPicks({ year: 2026, week: 1 });
          userPicksData = picksRes?.picks || [];
        } catch {
          userPicksData = [];
        }
      }

      const seenMatchups = new Set();
      const liveList = [];
      const finalList = [];
      const scheduledList = [];

      for (const rawGame of rawEvents) {
        const details = extractGameDetails(rawGame);
        if (!details) continue;

        const key = `${details.home.name.toLowerCase()}_${details.away.name.toLowerCase()}`;
        if (seenMatchups.has(key)) continue;
        seenMatchups.add(key);

        const item = { rawGame, details };
        if (details.isLive) {
          liveList.push(item);
        } else if (details.isFinal) {
          finalList.push(item);
        } else {
          scheduledList.push(item);
        }
      }

      // Priority: Active LIVE games first, followed by Recent Finals, followed by Upcoming Today/Week 1
      const combined = [...liveList, ...finalList, ...scheduledList];

      setLiveGames(combined.slice(0, 20));
      setUserPicks(userPicksData);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Failed to load live scores:', err);
    } finally {
      if (!isBackground) setIsRefreshing(false);
    }
  }

  // If no games, hide ribbon
  if (!liveGames || liveGames.length === 0) {
    return null;
  }

  const picksMap = new Map();
  userPicks.forEach(p => picksMap.set(p.game_id, p));

  return (
    <div className="w-full bg-[#080b0f] border-b border-white/10 py-2 px-3 sm:px-6 relative z-30 shadow-md select-none animate-in fade-in">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Live Badge & Live Status */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-wider uppercase text-white font-mono leading-none">
              LIVE TRACKER
            </span>
            {lastUpdated && (
              <span className="text-[8px] text-white/40 font-mono hidden sm:inline leading-tight mt-0.5">
                UPDATED {lastUpdated}
              </span>
            )}
          </div>
        </div>

        {/* Horizontal Ticker */}
        <div className="flex items-center space-x-2.5 overflow-x-auto py-1 scrollbar-none scroll-smooth">
          {liveGames.map(({ rawGame, details }, idx) => {
            const pick = picksMap.get(details.id) || details.userPick;
            const { home, away, isLive, isFinal, broadcast, statusDetail, period, clock, downDistance, possession } = details;

            // Pick outcome status
            let pickBadge = null;
            if (pick) {
              const pickedHome = (pick.predicted_winner_name || '').toLowerCase().includes(home.name.toLowerCase()) || 
                                 (pick.predicted_winner_name || '').toLowerCase() === home.abbr.toLowerCase() ||
                                 (pick.predicted_winner_id && String(pick.predicted_winner_id) === String(home.id));
              const pointDiff = Math.abs(home.score - away.score);
              const isHomeWinning = home.score > away.score;
              const isAwayWinning = away.score > home.score;

              if (isFinal) {
                if (pick.is_correct === 1 || (details.winnerId && String(details.winnerId) === String(pick.predicted_winner_id))) {
                  pickBadge = <span className="text-[9px] text-[#86efac] font-black bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/30">✓ WON</span>;
                } else {
                  pickBadge = <span className="text-[9px] text-[#fca5a5] font-black bg-red-950/60 px-1 py-0.5 rounded border border-red-500/30">✗ LOSS</span>;
                }
              } else if (isLive) {
                const isLeading = (pickedHome && isHomeWinning) || (!pickedHome && isAwayWinning);
                const isTied = home.score === away.score;
                if (isTied) {
                  pickBadge = <span className="text-[9px] text-amber-300 font-bold bg-amber-950/50 px-1 py-0.5 rounded">TIED</span>;
                } else {
                  pickBadge = isLeading 
                    ? <span className="text-[9px] text-[#86efac] font-bold bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/30">🟢 +{pointDiff}</span>
                    : <span className="text-[9px] text-[#fca5a5] font-bold bg-red-950/60 px-1 py-0.5 rounded border border-red-500/30">🔴 -{pointDiff}</span>;
                }
              } else {
                pickBadge = (
                  <span className="text-[9px] text-amber-300/90 font-medium truncate max-w-[70px]">
                    PICK: {(pick.predicted_winner_name || '').split(' ')[0]}
                  </span>
                );
              }
            }

            // Period & Clock label
            let timeStatus = statusDetail || 'Scheduled';
            if (isLive) {
              if (clock && period) {
                timeStatus = `Q${period} ${clock}`;
              } else if (period) {
                timeStatus = `Q${period}`;
              }
            }

            return (
              <div
                key={details.id || idx}
                onClick={() => onSelectGame && onSelectGame(rawGame)}
                className="flex-shrink-0 bg-[#0e1218] hover:bg-[#151b24] border border-white/10 hover:border-amber-400/40 rounded-xl p-2 min-w-[200px] max-w-[230px] transition cursor-pointer shadow-sm group"
              >
                {/* Header status */}
                <div className="flex items-center justify-between text-[9px] text-[#9a978a] mb-1 font-mono border-b border-white/5 pb-1">
                  <span className={`font-bold flex items-center gap-1 truncate ${isLive ? 'text-red-400 font-black' : isFinal ? 'text-[#86efac]' : 'text-[#9a978a]'}`}>
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {isLive ? timeStatus : isFinal ? 'FINAL' : (timeStatus.length > 14 ? timeStatus.slice(0, 14) + '…' : timeStatus)}
                  </span>
                  <div className="flex items-center gap-1">
                    {pickBadge}
                    {!pickBadge && <span className="text-white/40">{broadcast || 'ESPN'}</span>}
                  </div>
                </div>

                {/* Away Team Row */}
                <div className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center space-x-1.5 truncate pr-2">
                    <img 
                      src={away.logo} 
                      alt="" 
                      className="w-4 h-4 object-contain flex-shrink-0"
                      onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                    />
                    <span className="font-bold text-white truncate text-[11px] group-hover:text-amber-300 transition-colors">
                      {away.rank && <span className="text-amber-400 mr-1 font-mono text-[10px]">#{away.rank}</span>}
                      {away.name.split(' ')[0]}
                    </span>
                    {possession && String(possession) === String(away.id) && (
                      <span className="text-[9px] animate-bounce" title="Possession">🏈</span>
                    )}
                  </div>
                  <span className={`font-mono font-black text-xs ${isLive || isFinal ? (away.score > home.score ? 'text-amber-400' : 'text-white') : 'text-white/30'}`}>
                    {isLive || isFinal ? away.score : '-'}
                  </span>
                </div>

                {/* Home Team Row */}
                <div className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center space-x-1.5 truncate pr-2">
                    <img 
                      src={home.logo} 
                      alt="" 
                      className="w-4 h-4 object-contain flex-shrink-0"
                      onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                    />
                    <span className="font-bold text-white truncate text-[11px] group-hover:text-amber-300 transition-colors">
                      {home.rank && <span className="text-amber-400 mr-1 font-mono text-[10px]">#{home.rank}</span>}
                      {home.name.split(' ')[0]}
                    </span>
                    {possession && String(possession) === String(home.id) && (
                      <span className="text-[9px] animate-bounce" title="Possession">🏈</span>
                    )}
                  </div>
                  <span className={`font-mono font-black text-xs ${isLive || isFinal ? (home.score > away.score ? 'text-amber-400' : 'text-white') : 'text-white/30'}`}>
                    {isLive || isFinal ? home.score : '-'}
                  </span>
                </div>

                {/* Down & distance footer if live */}
                {isLive && downDistance && (
                  <div className="mt-1 pt-1 border-t border-white/5 text-[8px] text-white/50 font-mono flex items-center justify-between">
                    <span className="truncate">{downDistance}</span>
                    <span className="text-red-400 font-bold">🔴 LIVE</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

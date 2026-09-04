import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function cleanTeamName(name, abbr) {
  if (!name) return abbr || 'Team';
  // Remove common mascot words if they make the name overly long
  return name
    .replace(/\s+(Crimson Tide|Golden Gophers|Demon Deacons|Scarlet Knights|Fighting Irish|Yellow Jackets|Blue Hens|Great Danes|Nittany Lions|Horned Frogs|Rainbow Warriors|Sun Devils|Red Raiders|Thundering Herd|Mean Green|Golden Lions|Trailblazers|Minutemen|Spartans|Bulldogs|Wildcats|Tigers|Buckeyes|Wolverines|Seminoles|Hurricanes|Volunteers|Gators|Aggies|Sooners|Longhorns|Cougars|Badgers|Ducks|Huskies|Cardinals|Mustangs|Rebels|Owls|Knights|Wolves|Bulls|Eagles|Bison|Hornets|Bears|Panthers|Zips|Warriors)/gi, '')
    .trim() || name;
}

function extractGameDetails(g) {
  if (!g) return null;

  // 1. If from normalized backend object (/api/games/live-tracker or /api/games)
  if (g.homeTeam && g.awayTeam) {
    const isLive = g.isLive || g.isInProgress || g.status === 'STATUS_IN_PROGRESS' || g.statusState === 'in';
    const isFinal = g.isFinal || g.status === 'STATUS_FINAL' || g.statusState === 'post';
    const homeScore = parseInt(g.homeTeam.score ?? g.home_team_score ?? 0, 10);
    const awayScore = parseInt(g.awayTeam.score ?? g.away_team_score ?? 0, 10);

    return {
      id: String(g.id || g.game_id || g.gameId),
      home: {
        id: String(g.homeTeam.id),
        name: cleanTeamName(g.homeTeam.name, g.homeTeam.abbreviation),
        fullName: g.homeTeam.name || 'Home Team',
        logo: g.homeTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${g.homeTeam.id || 7}.png`,
        rank: g.homeTeam.rank || null,
        score: homeScore,
        abbr: g.homeTeam.abbreviation || (g.homeTeam.name ? g.homeTeam.name.slice(0, 4).toUpperCase() : 'HOME')
      },
      away: {
        id: String(g.awayTeam.id),
        name: cleanTeamName(g.awayTeam.name, g.awayTeam.abbreviation),
        fullName: g.awayTeam.name || 'Away Team',
        logo: g.awayTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${g.awayTeam.id || 7}.png`,
        rank: g.awayTeam.rank || null,
        score: awayScore,
        abbr: g.awayTeam.abbreviation || (g.awayTeam.name ? g.awayTeam.name.slice(0, 4).toUpperCase() : 'AWAY')
      },
      status: g.statusDetail || (isFinal ? 'FINAL' : (isLive ? 'LIVE' : 'SCHEDULED')),
      statusDetail: g.statusDetail || (isFinal ? 'Final' : (isLive ? 'In Progress' : 'Scheduled')),
      isLive,
      isFinal,
      period: g.period || null,
      clock: g.clock || null,
      downDistance: g.downDistance || null,
      possession: g.possession ? String(g.possession) : null,
      date: g.date || g.game_date || '',
      broadcast: g.broadcast || 'ESPN',
      odds: g.odds || null,
      winnerId: g.winnerId || (isFinal ? (homeScore > awayScore ? String(g.homeTeam.id) : String(g.awayTeam.id)) : null),
      userPick: g.userPick || null
    };
  }

  // 2. If direct ESPN raw event structure
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

  const homeScore = parseInt(homeComp.score || 0, 10);
  const awayScore = parseInt(awayComp.score || 0, 10);

  const homeRank = (homeComp.curatedRank?.current && homeComp.curatedRank.current <= 25) ? homeComp.curatedRank.current : null;
  const awayRank = (awayComp.curatedRank?.current && awayComp.curatedRank.current <= 25) ? awayComp.curatedRank.current : null;

  return {
    id: String(g.id || g.game_id || comp.id),
    home: {
      id: String(homeTeamObj.id || 'home'),
      name: cleanTeamName(homeTeamObj.displayName || homeTeamObj.name || 'Home Team', homeTeamObj.abbreviation),
      fullName: homeTeamObj.displayName || homeTeamObj.name || 'Home Team',
      logo: homeTeamObj.logos?.[0]?.href || homeTeamObj.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${homeTeamObj.id || 7}.png`,
      rank: homeRank,
      score: homeScore,
      abbr: homeTeamObj.abbreviation || (homeTeamObj.name ? homeTeamObj.name.slice(0, 4).toUpperCase() : 'HOME')
    },
    away: {
      id: String(awayTeamObj.id || 'away'),
      name: cleanTeamName(awayTeamObj.displayName || awayTeamObj.name || 'Away Team', awayTeamObj.abbreviation),
      fullName: awayTeamObj.displayName || awayTeamObj.name || 'Away Team',
      logo: awayTeamObj.logos?.[0]?.href || awayTeamObj.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${awayTeamObj.id || 7}.png`,
      rank: awayRank,
      score: awayScore,
      abbr: awayTeamObj.abbreviation || (awayTeamObj.name ? awayTeamObj.name.slice(0, 4).toUpperCase() : 'AWAY')
    },
    status: g.status?.type?.detail || comp.status?.type?.detail || (isFinal ? 'FINAL' : (isLive ? 'LIVE' : 'SCHEDULED')),
    statusDetail: g.status?.type?.detail || comp.status?.type?.detail || (isFinal ? 'Final' : (isLive ? 'In Progress' : 'Scheduled')),
    isLive,
    isFinal,
    period: g.status?.period || comp.status?.period || null,
    clock: g.status?.displayClock || comp.status?.displayClock || null,
    downDistance: comp.situation?.downDistanceText || null,
    possession: comp.situation?.possession ? String(comp.situation.possession) : null,
    date: g.date || comp.date || '',
    broadcast: comp.broadcasts?.[0]?.names?.[0] || g.broadcast || 'ESPN',
    odds: comp.odds?.[0]?.details || null,
    winnerId: isFinal ? (homeComp.winner ? String(homeTeamObj.id) : (awayComp.winner ? String(awayTeamObj.id) : (homeScore > awayScore ? String(homeTeamObj.id) : String(awayTeamObj.id)))) : null,
    userPick: null
  };
}

export function LiveScoreboardRibbon({ onSelectGame }) {
  const { user } = useAuth();
  const [liveGames, setLiveGames] = useState([]);
  const [userPicks, setUserPicks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    loadScoreboard(false);

    // Auto-refresh scores every 1 minute (60,000 ms)
    pollTimerRef.current = setInterval(() => {
      loadScoreboard(true);
    }, 60000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [user]);

  async function loadScoreboard(isBackground = false) {
    try {
      let rawEvents = [];

      // 1. Primary: Direct ESPN Scoreboard fetch with groups=80 (all FBS games)
      try {
        const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=100');
        if (espnRes.ok) {
          const espnJson = await espnRes.json();
          if (espnJson && Array.isArray(espnJson.events) && espnJson.events.length > 0) {
            rawEvents = espnJson.events;
          }
        }
      } catch (e) {
        console.warn('Direct ESPN fetch warning:', e);
      }

      // 2. Secondary: Fallback to backend live-tracker route
      if (rawEvents.length === 0) {
        try {
          const liveRes = await api.getLiveTracker();
          if (liveRes && liveRes.games && liveRes.games.length > 0) {
            rawEvents = liveRes.games;
          }
        } catch (err) {
          console.warn('Server live tracker route error:', err);
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

        const key = `${details.home.fullName.toLowerCase()}_${details.away.fullName.toLowerCase()}`;
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

      // Always order: In-Progress LIVE games FIRST -> Recent Finals -> Upcoming Week 1 / Today
      const combined = [...liveList, ...finalList, ...scheduledList];

      setLiveGames(combined.slice(0, 25));
      setUserPicks(userPicksData);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Failed to load live scores:', err);
    }
  }

  // If no games loaded yet, hide ribbon
  if (!liveGames || liveGames.length === 0) {
    return null;
  }

  const picksMap = new Map();
  userPicks.forEach(p => {
    if (p.game_id) picksMap.set(String(p.game_id), p);
  });

  // Duplicate the games array to create an infinite seamless loop
  const marqueeGames = [...liveGames, ...liveGames];

  return (
    <div className="w-full bg-[#080b0f] border-b border-amber-500/20 py-2 relative z-30 shadow-2xl select-none overflow-hidden scoreboard-mask group">
      <div className="animate-scoreboard-marquee flex items-center space-x-3 px-2">
        {marqueeGames.map(({ rawGame, details }, idx) => {
          const pick = picksMap.get(String(details.id)) || details.userPick;
          const { home, away, isLive, isFinal, broadcast, possession } = details;

          // Determine if user made a pick on this game
          let pickBadge = null;
          if (pick) {
            if (isFinal) {
              if (pick.is_correct === 1 || (details.winnerId && String(details.winnerId) === String(pick.predicted_winner_id))) {
                pickBadge = <span className="text-[9px] text-[#86efac] font-black bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">✓ WON</span>;
              } else {
                pickBadge = <span className="text-[9px] text-[#fca5a5] font-black bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/40">✗ LOSS</span>;
              }
            } else {
              pickBadge = (
                <span className="text-[9px] text-amber-300/90 font-bold truncate max-w-[80px]">
                  PICK: {(pick.predicted_winner_name || '').split(' ')[0]}
                </span>
              );
            }
          }

          const isAwayLeading = (isLive || isFinal) && away.score > home.score;
          const isHomeLeading = (isLive || isFinal) && home.score > away.score;

          return (
            <div
              key={`${details.id}-${idx}`}
              onClick={() => onSelectGame && onSelectGame(rawGame)}
              className={`flex-shrink-0 bg-[#0e1218] hover:bg-[#151b24] rounded-xl p-2.5 min-w-[210px] max-w-[230px] transition cursor-pointer shadow-md ${
                isLive 
                  ? 'border border-red-500/50 shadow-red-950/40' 
                  : isFinal 
                    ? 'border border-white/10 hover:border-emerald-500/30' 
                    : 'border border-white/5 hover:border-amber-400/30'
              }`}
            >
              {/* Header status bar (Clean LIVE / FINAL indicator) */}
              <div className="flex items-center justify-between text-[10px] text-[#9a978a] mb-1.5 font-mono border-b border-white/5 pb-1">
                <span className={`font-black flex items-center gap-1.5 ${isLive ? 'text-red-400 tracking-wider' : isFinal ? 'text-emerald-400' : 'text-[#9a978a]'}`}>
                  {isLive && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                  {isLive ? 'LIVE' : isFinal ? 'FINAL' : 'UPCOMING'}
                </span>
                <div className="flex items-center gap-1">
                  {pickBadge}
                  {!pickBadge && <span className="text-white/40 text-[9px]">{broadcast || 'ESPN'}</span>}
                </div>
              </div>

              {/* Away Team Row */}
              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2 truncate pr-2">
                  <img 
                    src={away.logo} 
                    alt="" 
                    className="w-4 h-4 object-contain flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                  />
                  <span className={`font-bold truncate text-xs ${isAwayLeading ? 'text-white' : (isLive || isFinal ? 'text-slate-300' : 'text-slate-200')} group-hover:text-amber-300 transition-colors`}>
                    {away.rank && <span className="text-amber-400 mr-1 font-mono text-[10px]">#{away.rank}</span>}
                    {away.name}
                  </span>
                  {possession && possession === away.id && (
                    <span className="text-[10px] animate-bounce ml-0.5" title="Possession">🏈</span>
                  )}
                </div>
                {/* Away Score Number */}
                <span className={`font-mono font-black text-sm px-1.5 py-0.2 rounded ${
                  isLive || isFinal 
                    ? (isAwayLeading ? 'text-amber-400 font-extrabold bg-amber-400/10' : 'text-white') 
                    : 'text-white/30 text-xs'
                }`}>
                  {isLive || isFinal ? away.score : '-'}
                </span>
              </div>

              {/* Home Team Row */}
              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2 truncate pr-2">
                  <img 
                    src={home.logo} 
                    alt="" 
                    className="w-4 h-4 object-contain flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                  />
                  <span className={`font-bold truncate text-xs ${isHomeLeading ? 'text-white' : (isLive || isFinal ? 'text-slate-300' : 'text-slate-200')} group-hover:text-amber-300 transition-colors`}>
                    {home.rank && <span className="text-amber-400 mr-1 font-mono text-[10px]">#{home.rank}</span>}
                    {home.name}
                  </span>
                  {possession && possession === home.id && (
                    <span className="text-[10px] animate-bounce ml-0.5" title="Possession">🏈</span>
                  )}
                </div>
                {/* Home Score Number */}
                <span className={`font-mono font-black text-sm px-1.5 py-0.2 rounded ${
                  isLive || isFinal 
                    ? (isHomeLeading ? 'text-amber-400 font-extrabold bg-amber-400/10' : 'text-white') 
                    : 'text-white/30 text-xs'
                }`}>
                  {isLive || isFinal ? home.score : '-'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

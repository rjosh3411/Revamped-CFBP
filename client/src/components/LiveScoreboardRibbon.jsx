import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function extractGameDetails(g) {
  if (!g) return null;

  // If already normalized
  if (g.homeTeam && g.awayTeam) {
    const isLive = g.isInProgress || g.status === 'STATUS_IN_PROGRESS';
    const isFinal = g.isFinal || g.status === 'STATUS_FINAL';
    return {
      id: g.id || g.game_id,
      home: {
        name: g.homeTeam.name || 'Home Team',
        logo: g.homeTeam.logo || 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png',
        rank: g.homeTeam.rank || null,
        score: g.homeTeam.score || 0,
        abbr: g.homeTeam.abbreviation || (g.homeTeam.name ? g.homeTeam.name.slice(0, 4) : 'HOME')
      },
      away: {
        name: g.awayTeam.name || 'Away Team',
        logo: g.awayTeam.logo || 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png',
        rank: g.awayTeam.rank || null,
        score: g.awayTeam.score || 0,
        abbr: g.awayTeam.abbreviation || (g.awayTeam.name ? g.awayTeam.name.slice(0, 4) : 'AWAY')
      },
      status: g.statusDetail || (isFinal ? 'Final' : (isLive ? 'Live' : 'Scheduled')),
      isLive,
      isFinal,
      date: g.date || g.game_date || '',
      broadcast: g.broadcast || 'ESPN',
      winnerId: g.winnerId
    };
  }

  // If ESPN event format with competitions
  const comp = g.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const homeComp = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
  const awayComp = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};

  const homeTeamObj = homeComp.team || {};
  const awayTeamObj = awayComp.team || {};

  const statusType = g.status?.type?.name || comp.status?.type?.name || g.status || 'STATUS_SCHEDULED';
  const isFinal = statusType === 'STATUS_FINAL';
  const isLive = statusType === 'STATUS_IN_PROGRESS';

  return {
    id: g.id || g.game_id || comp.id,
    home: {
      name: homeTeamObj.displayName || homeTeamObj.name || g.home_team_name || 'Home Team',
      logo: homeTeamObj.logos?.[0]?.href || homeTeamObj.logo || g.home_team_logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${homeTeamObj.id || 7}.png`,
      rank: (homeComp.curatedRank?.current && homeComp.curatedRank.current <= 25) ? homeComp.curatedRank.current : (g.home_team_rank || null),
      score: parseInt(homeComp.score || g.home_team_score || 0, 10),
      abbr: homeTeamObj.abbreviation || (homeTeamObj.name ? homeTeamObj.name.slice(0, 4) : 'HOME')
    },
    away: {
      name: awayTeamObj.displayName || awayTeamObj.name || g.away_team_name || 'Away Team',
      logo: awayTeamObj.logos?.[0]?.href || awayTeamObj.logo || g.away_team_logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${awayTeamObj.id || 7}.png`,
      rank: (awayComp.curatedRank?.current && awayComp.curatedRank.current <= 25) ? awayComp.curatedRank.current : (g.away_team_rank || null),
      score: parseInt(awayComp.score || g.away_team_score || 0, 10),
      abbr: awayTeamObj.abbreviation || (awayTeamObj.name ? awayTeamObj.name.slice(0, 4) : 'AWAY')
    },
    status: g.status?.type?.detail || comp.status?.type?.detail || g.status_detail || (isFinal ? 'Final' : (isLive ? 'Live' : 'Scheduled')),
    isLive,
    isFinal,
    date: g.date || comp.date || g.game_date || '',
    broadcast: comp.broadcasts?.[0]?.names?.[0] || g.broadcast || 'ESPN',
    winnerId: isFinal ? (homeComp.winner ? homeTeamObj.id : awayTeamObj.id) : null
  };
}

export function LiveScoreboardRibbon({ onSelectGame }) {
  const { user } = useAuth();
  const [liveGames, setLiveGames] = useState([]);
  const [userPicks, setUserPicks] = useState([]);

  useEffect(() => {
    loadScoreboard();
  }, [user]);

  async function loadScoreboard() {
    try {
      const [gamesData, picksData] = await Promise.all([
        api.getGames({ year: 2026, week: 1 }),
        user ? api.getMyPicks({ year: 2026, week: 1 }).catch(() => ({ picks: [] })) : Promise.resolve({ picks: [] })
      ]);

      const gList = gamesData?.games || [];
      const todayStr = new Date().toDateString();

      // Filter to ONLY live games or games scheduled for today, and deduplicate
      const seenMatchups = new Set();
      const filtered = [];

      for (const rawGame of gList) {
        const details = extractGameDetails(rawGame);
        if (!details) continue;

        const isToday = details.date ? new Date(details.date).toDateString() === todayStr : false;

        // ONLY show if game is LIVE in progress or scheduled/played TODAY
        if (details.isLive || isToday) {
          const key = `${details.home.name.toLowerCase()}_${details.away.name.toLowerCase()}`;
          if (!seenMatchups.has(key)) {
            seenMatchups.add(key);
            filtered.push({ rawGame, details });
          }
        }
      }

      setLiveGames(filtered);
      setUserPicks(picksData?.picks || []);
    } catch (err) {
      console.warn('Failed to load scoreboard ribbon:', err);
    }
  }

  // If there are no live games and no games scheduled for today, hide the ticker
  if (!liveGames || liveGames.length === 0) {
    return null;
  }

  const picksMap = new Map();
  userPicks.forEach(p => picksMap.set(p.game_id, p));

  return (
    <div className="w-full bg-[#080b0f] border-b border-white/10 py-2 px-4 sm:px-6 relative z-30 shadow-md animate-in fade-in">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Live Badge */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-black tracking-wider uppercase text-white font-mono hidden sm:inline">
            LIVE GAME TRACKER
          </span>
        </div>

        {/* Horizontal Ticker */}
        <div className="flex items-center space-x-3 overflow-x-auto py-1 scrollbar-none scroll-smooth">
          {liveGames.map(({ rawGame, details }, idx) => {
            const pick = picksMap.get(details.id);
            const { home, away, isLive, isFinal, broadcast } = details;

            // Pick outcome status
            let pickBadge = null;
            if (pick) {
              const pickedHome = (pick.predicted_winner_name || '').toLowerCase().includes(home.name.toLowerCase()) || 
                                 (pick.predicted_winner_name || '').toLowerCase() === home.abbr.toLowerCase();
              const leadingTeam = home.score > away.score ? 'home' : (away.score > home.score ? 'away' : 'tied');

              if (isFinal) {
                if (pick.is_correct === 1 || (details.winnerId && details.winnerId === pick.predicted_winner_id)) {
                  pickBadge = <span className="text-[9px] text-[#86efac] font-bold">✓ WON</span>;
                } else {
                  pickBadge = <span className="text-[9px] text-[#fca5a5] font-bold">✗ LOSS</span>;
                }
              } else if (isLive) {
                const isLeading = (pickedHome && leadingTeam === 'home') || (!pickedHome && leadingTeam === 'away');
                pickBadge = isLeading 
                  ? <span className="text-[9px] text-[#86efac] font-bold">🟢 LEADING</span>
                  : <span className="text-[9px] text-[#fca5a5] font-bold">🔴 TRAILING</span>;
              } else {
                pickBadge = <span className="text-[9px] text-amber-300 font-bold">PICK: {(pick.predicted_winner_name || '').split(' ')[0]}</span>;
              }
            }

            return (
              <div
                key={details.id || idx}
                onClick={() => onSelectGame && onSelectGame(rawGame)}
                className="flex-shrink-0 bg-[#0e1218] hover:bg-[#151b24] border border-white/5 hover:border-white/20 rounded-xl p-2 min-w-[195px] max-w-[220px] transition cursor-pointer shadow-sm"
              >
                {/* Header status */}
                <div className="flex items-center justify-between text-[9px] text-[#9a978a] mb-1 font-mono">
                  <span className={isLive ? 'text-red-400 font-black flex items-center' : 'text-[#9a978a]'}>
                    {isLive ? '🔴 LIVE' : isFinal ? 'FINAL' : 'TODAY'}
                  </span>
                  {pickBadge || <span className="text-white/40">{broadcast || 'ESPN'}</span>}
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
                    <span className="font-bold text-white truncate text-[11px]">
                      {away.rank && <span className="text-amber-400 mr-1 font-mono text-[10px]">#{away.rank}</span>}
                      {away.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className={`font-mono font-bold text-xs ${isLive || isFinal ? 'text-white' : 'text-[#9a978a]'}`}>
                    {isLive || isFinal ? away.score : ''}
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
                    <span className="font-bold text-white truncate text-[11px]">
                      {home.rank && <span className="text-amber-400 mr-1 font-mono text-[10px]">#{home.rank}</span>}
                      {home.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className={`font-mono font-bold text-xs ${isLive || isFinal ? 'text-white' : 'text-[#9a978a]'}`}>
                    {isLive || isFinal ? home.score : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

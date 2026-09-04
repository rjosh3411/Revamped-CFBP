import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TeamScheduleView } from './TeamScheduleView';
import { CoverflowWeekSelector } from './CoverflowWeekSelector';
import { GameCard } from './GameCard';
import { 
  Shield, Calendar, Sparkles, ChevronRight, 
  Award, Flame, CheckCircle2, Layers, Filter 
} from 'lucide-react';

const CONFERENCES = [
  { id: 'SEC', label: 'SEC', count: 16, color: '#f59e0b' },
  { id: 'Big Ten', label: 'Big Ten', count: 18, color: '#3b82f6' },
  { id: 'ACC', label: 'ACC', count: 17, color: '#6366f1' },
  { id: 'Big 12', label: 'Big 12', count: 16, color: '#ef4444' },
  { id: 'Group of 5', label: 'Group of 5', count: 24, color: '#10b981' },
  { id: 'Independents', label: 'Independents', count: 5, color: '#14b8a6' }
];

const WEEK_CONFERENCE_FILTERS = [
  { id: 'ALL', label: 'All Games' },
  { id: 'TOP25', label: 'Top 25' },
  { id: 'SEC', label: 'SEC' },
  { id: 'B1G', label: 'Big Ten' },
  { id: 'ACC', label: 'ACC' },
  { id: 'B12', label: 'Big 12' },
  { id: 'G5', label: 'Group of 5' }
];

const SEC_TEAMS = new Set([
  'georgia', 'alabama', 'texas', 'ole-miss', 'tennessee', 'lsu', 'missouri', 
  'oklahoma', 'texas-am', 'kentucky', 'auburn', 'florida', 'south-carolina', 
  'arkansas', 'vanderbilt', 'mississippi-state'
]);

const B1G_TEAMS = new Set([
  'ohio-state', 'oregon', 'penn-state', 'michigan', 'usc', 'iowa', 'nebraska', 
  'wisconsin', 'washington', 'indiana', 'illinois', 'rutgers', 'michigan-state', 
  'minnesota', 'maryland', 'ucla', 'northwestern', 'purdue'
]);

const ACC_TEAMS = new Set([
  'florida-state', 'clemson', 'miami', 'nc-state', 'louisville', 'virginia-tech', 
  'smu', 'north-carolina', 'georgia-tech', 'california', 'duke', 'syracuse', 
  'boston-college', 'virginia', 'pittsburgh', 'wake-forest', 'stanford'
]);

const B12_TEAMS = new Set([
  'utah', 'kansas-state', 'oklahoma-state', 'arizona', 'kansas', 'iowa-state', 
  'west-virginia', 'ucf', 'texas-tech', 'tcu', 'colorado', 'baylor', 
  'byu', 'cincinnati', 'arizona-state', 'houston'
]);

const G5_TEAMS = new Set([
  'boise-state', 'memphis', 'unlv', 'army', 'tulane', 'usf', 'utsa', 'app-state',
  'james-madison', 'liberty', 'fresno-state', 'san-diego-state', 'san-jose-state',
  'colorado-state', 'air-force', 'coastal-carolina', 'texas-state', 'toledo',
  'miami-oh', 'western-kentucky', 'jacksonville-state', 'hawaii', 'nevada', 'wyoming',
  'notre-dame', 'uconn', 'umass', 'oregon-state', 'washington-state'
]);

export function MakePicksView() {
  const { user } = useAuth();
  
  // Mode: 'WEEK' (Weekly Matchups with 3D Coverflow) or 'TEAM' (Full Team Schedules & Stadiums)
  const [pickMode, setPickMode] = useState('WEEK');
  
  // Week Mode State
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [weekConference, setWeekConference] = useState('ALL');
  const [weeklyGames, setWeeklyGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [savingPickId, setSavingPickId] = useState(null);

  // Team Mode State
  const [activeConference, setActiveConference] = useState('SEC');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    if (pickMode === 'WEEK') {
      loadWeeklyGames();
    } else {
      loadTeams();
    }
  }, [pickMode, selectedWeek, weekConference, activeConference, user]);

  async function loadWeeklyGames() {
    setLoadingGames(true);
    try {
      // 1. Fetch base games & live ESPN feed in parallel with 1.5s timeout
      const fetchEspnLive = async () => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1500);
          const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=100', {
            signal: controller.signal
          });
          clearTimeout(timer);
          if (r.ok) {
            const d = await r.json();
            return d?.events || [];
          }
        } catch (e) {}
        return [];
      };

      const [gamesData, espnEvents] = await Promise.all([
        api.getGames({
          year: 2026,
          week: selectedWeek,
          conference: weekConference
        }),
        fetchEspnLive()
      ]);

      const rawGames = gamesData?.games || [];

      // Helper function to clean strings for robust matching
      const cleanStr = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Seamlessly merge with real-time live scores and localStorage picks
      const merged = rawGames.map(g => {
        let updatedGame = { ...g };

        // Match with ESPN live scores
        if (espnEvents.length > 0 && g.homeTeam && g.awayTeam) {
          const gHomeClean = cleanStr(g.homeTeam.name);
          const gAwayClean = cleanStr(g.awayTeam.name);

          const liveMatch = espnEvents.find(e => {
            const comp = e.competitions?.[0] || {};
            const competitors = comp.competitors || [];
            const h = competitors.find(c => c.homeAway === 'home') || {};
            const a = competitors.find(c => c.homeAway === 'away') || {};
            const eHomeClean = cleanStr(h.team?.displayName || h.team?.name);
            const eAwayClean = cleanStr(a.team?.displayName || a.team?.name);

            return (
              (eHomeClean.includes(gHomeClean) || gHomeClean.includes(eHomeClean) || eHomeClean.includes(cleanStr(g.homeTeam.id))) &&
              (eAwayClean.includes(gAwayClean) || gAwayClean.includes(eAwayClean) || eAwayClean.includes(cleanStr(g.awayTeam.id)))
            );
          });

          if (liveMatch) {
            const comp = liveMatch.competitions?.[0] || {};
            const competitors = comp.competitors || [];
            const hComp = competitors.find(c => c.homeAway === 'home') || {};
            const aComp = competitors.find(c => c.homeAway === 'away') || {};
            const state = liveMatch.status?.type?.state;
            const isLive = state === 'in';
            const isFinal = state === 'post';

            updatedGame.isLive = isLive;
            updatedGame.isInProgress = isLive;
            updatedGame.isFinal = isFinal;
            updatedGame.statusDetail = liveMatch.status?.type?.detail || (isFinal ? 'Final' : (isLive ? 'LIVE' : 'Scheduled'));
            updatedGame.homeTeam = {
              ...g.homeTeam,
              score: parseInt(hComp.score ?? g.homeTeam.score ?? 0, 10)
            };
            updatedGame.awayTeam = {
              ...g.awayTeam,
              score: parseInt(aComp.score ?? g.awayTeam.score ?? 0, 10)
            };
          }
        }

        // Merge localStorage user pick if not yet saved on server
        if (!updatedGame.userPick || !updatedGame.userPick.predicted_winner_id) {
          try {
            const local = localStorage.getItem(`cfb_local_pick_${updatedGame.seasonYear || 2026}_${updatedGame.id}`);
            if (local) {
              updatedGame.userPick = JSON.parse(local);
            }
          } catch (e) {}
        }

        return updatedGame;
      });

      setWeeklyGames(merged);
    } catch (err) {
      console.error('Failed to load weekly games:', err);
    } finally {
      setLoadingGames(false);
    }
  }

  // Filter games strictly by selected conference tab
  const displayedGames = weeklyGames.filter(g => {
    if (weekConference === 'ALL') return true;
    if (weekConference === 'TOP25') {
      return (g.homeTeam?.rank !== null && g.homeTeam?.rank <= 25) || (g.awayTeam?.rank !== null && g.awayTeam?.rank <= 25);
    }
    const hId = (g.homeTeam?.id || '').toLowerCase();
    const aId = (g.awayTeam?.id || '').toLowerCase();
    const hConf = (g.homeTeam?.conference || '').toUpperCase();
    const aConf = (g.awayTeam?.conference || '').toUpperCase();

    if (weekConference === 'SEC') {
      return hConf === 'SEC' || aConf === 'SEC' || SEC_TEAMS.has(hId) || SEC_TEAMS.has(aId);
    }
    if (weekConference === 'B1G' || weekConference === 'BIGTEN') {
      return hConf.includes('BIG TEN') || aConf.includes('BIG TEN') || hConf.includes('BIGTEN') || aConf.includes('BIGTEN') || B1G_TEAMS.has(hId) || B1G_TEAMS.has(aId);
    }
    if (weekConference === 'ACC') {
      return hConf === 'ACC' || aConf === 'ACC' || ACC_TEAMS.has(hId) || ACC_TEAMS.has(aId);
    }
    if (weekConference === 'B12' || weekConference === 'BIG12') {
      return hConf.includes('BIG 12') || aConf.includes('BIG 12') || hConf.includes('BIG12') || aConf.includes('BIG12') || B12_TEAMS.has(hId) || B12_TEAMS.has(aId);
    }
    if (weekConference === 'G5') {
      return hConf.includes('GROUP') || aConf.includes('GROUP') || G5_TEAMS.has(hId) || G5_TEAMS.has(aId);
    }
    return true;
  });

  async function loadTeams() {
    setLoadingTeams(true);
    try {
      const data = await api.getTeams(activeConference);
      setTeams(data?.teams || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  }

  const handlePick = async (pickData) => {
    // 1. Instant local storage persistence so picks are NEVER lost across reloads
    try {
      localStorage.setItem(`cfb_local_pick_${pickData.seasonYear || 2026}_${pickData.gameId}`, JSON.stringify({
        game_id: pickData.gameId,
        predicted_winner_id: pickData.predictedWinnerId,
        predicted_winner_name: pickData.predictedWinnerName,
        confidence_points: pickData.confidencePoints || 1,
        confidence_level: pickData.confidenceLevel || pickData.confidencePoints || 1
      }));
    } catch (e) {}

    // 2. Update local state immediately
    setWeeklyGames(prev => prev.map(g => {
      if (g.id === pickData.gameId) {
        return {
          ...g,
          userPick: {
            ...g.userPick,
            predicted_winner_id: pickData.predictedWinnerId,
            predicted_winner_name: pickData.predictedWinnerName,
            confidence_points: pickData.confidencePoints || 1,
            confidence_level: pickData.confidenceLevel || pickData.confidencePoints || 1
          }
        };
      }
      return g;
    }));

    if (!user) {
      return;
    }

    setSavingPickId(pickData.gameId);
    try {
      await api.savePick({
        gameId: pickData.gameId,
        seasonYear: pickData.seasonYear || 2026,
        weekNumber: pickData.weekNumber || selectedWeek,
        predictedWinnerId: pickData.predictedWinnerId,
        predictedWinnerName: pickData.predictedWinnerName,
        confidencePoints: pickData.confidencePoints || 1,
        confidenceLevel: pickData.confidenceLevel || pickData.confidencePoints || 1
      });
    } catch (err) {
      console.error('Failed to save pick:', err);
    } finally {
      setSavingPickId(null);
    }
  };

  // If a team is selected in Team Mode, show their full 2026 schedule view
  if (pickMode === 'TEAM' && selectedTeam) {
    return (
      <TeamScheduleView
        team={selectedTeam}
        onBack={() => {
          setSelectedTeam(null);
          loadTeams();
        }}
        onPickChanged={() => {
          loadTeams();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Dual Mode Switcher Bar */}
      <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>2026 College Football Predictions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#faf6e8] athletic-title uppercase tracking-wide">
            {pickMode === 'WEEK' ? `Week ${selectedWeek} Matchup Pick'em Slate` : `${activeConference} Team Season Schedules`}
          </h1>
          <p className="text-xs text-[#dcd8c8] mt-0.5">
            {pickMode === 'WEEK'
              ? 'Select any week in 3D Coverflow to pick all live college football matchups with point spreads!'
              : 'Choose a team to predict their complete 12-game schedule with on-campus stadium views and mascots!'}
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center space-x-1.5 bg-black/80 p-1.5 rounded-2xl border border-white/10 shrink-0 shadow-inner">
          <button
            onClick={() => setPickMode('WEEK')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              pickMode === 'WEEK'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-102'
                : 'text-[#9a978a] hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>By Week</span>
          </button>

          <button
            onClick={() => setPickMode('TEAM')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              pickMode === 'TEAM'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-102'
                : 'text-[#9a978a] hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>By Team</span>
          </button>
        </div>
      </div>

      {/* MODE 1: PICK BY WEEK (3D Coverflow + Live Game Cards) */}
      {pickMode === 'WEEK' && (
        <div className="space-y-6">
          {/* 3D Coverflow Week Selector */}
          <CoverflowWeekSelector
            currentWeek={selectedWeek}
            onSelectWeek={(w) => setSelectedWeek(w)}
            year={2026}
          />

          {/* Conference Filter Pills for Current Week */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center space-x-2">
              {WEEK_CONFERENCE_FILTERS.map((f) => {
                const isSelected = weekConference === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setWeekConference(f.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#faf6e8] text-black shadow-md scale-105'
                        : 'bg-[#0e1218] hover:bg-[#151b24] text-[#9a978a] hover:text-white border border-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-mono font-bold text-amber-400 shrink-0">
              {displayedGames.length} {displayedGames.length === 1 ? 'Game' : 'Games'}
            </div>
          </div>

          {/* Weekly Matchups Grid */}
          {loadingGames ? (
            <div className="text-center py-20 bg-[#0e1218] border border-white/10 rounded-3xl text-[#9a978a]">
              <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading Week {selectedWeek} college football games...
            </div>
          ) : displayedGames.length === 0 ? (
            <div className="text-center py-16 bg-[#0e1218] border border-white/10 rounded-3xl p-6">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-black text-white athletic-title uppercase">
                No Matchups Found for Week {selectedWeek} ({weekConference})
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Try selecting a different conference filter or browse another week via the 3D Coverflow above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPick={handlePick}
                  isSaving={savingPickId === game.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: PICK BY TEAM (Full 12-Game Schedule with Stadiums & Mascots) */}
      {pickMode === 'TEAM' && (
        <div className="space-y-6">
          {/* Conference Filter Bar */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center space-x-2">
              {CONFERENCES.map((conf) => {
                const isSelected = activeConference === conf.id;
                return (
                  <button
                    key={conf.id}
                    onClick={() => {
                      setActiveConference(conf.id);
                      setSelectedTeam(null);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#faf6e8] text-black shadow-[0_0_20px_rgba(250,246,232,0.3)] scale-105 ring-1 ring-white/50'
                        : 'bg-[#0e1218] hover:bg-[#151b24] text-[#dcd8c8] border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: conf.color }}
                    />
                    <span>{conf.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-black/20 text-black font-bold' : 'bg-black/60 text-[#9a978a]'
                    }`}>
                      {conf.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TEAMS GRID VIEW */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-bold text-[#dcd8c8] flex items-center space-x-1.5 uppercase">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeConference} Teams (Select a team to predict their 2026 schedule)</span>
              </div>
            </div>

            {loadingTeams ? (
              <div className="text-center py-16 text-[#9a978a]">
                <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
                Loading {activeConference} teams...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {teams.map((team) => {
                  const rec = team.projectedRecord || { wins: 0, losses: 0, unpicked: 12 };
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className="group cursor-pointer bg-[#0e1218] hover:bg-[#141b24] rounded-2xl p-4 border border-white/5 hover:border-amber-400/60 transition-all duration-200 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden"
                    >
                      {/* Top Color Accent */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                        style={{ backgroundColor: team.colors?.primary || '#faf6e8' }}
                      />

                      {/* Logo & Ranking */}
                      <div className="relative mt-2 mb-1">
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="w-14 h-14 object-contain drop-shadow-md transition-transform group-hover:scale-110"
                          onError={(e) => { e.target.src = 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png'; }}
                        />
                        {team.ranking && (
                          <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full shadow">
                            #{team.ranking}
                          </span>
                        )}
                      </div>

                      {/* Current Real-World Record */}
                      <div className="mb-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-amber-300">
                        <span>Record: {team.currentRecord || '0-0'}</span>
                      </div>

                      {/* Team Name */}
                      <div className="w-full">
                        <div className="text-sm font-extrabold text-white athletic-title line-clamp-1 group-hover:text-amber-400 transition">
                          {team.name}
                        </div>
                        <div className="text-[10px] text-[#9a978a] line-clamp-1">
                          {team.nickname}
                        </div>
                      </div>

                      {/* Projected Record Pill */}
                      <div className="mt-3 w-full bg-black/60 py-1.5 px-2 rounded-xl border border-white/5 flex items-center justify-between text-[11px] font-mono font-bold">
                        <span className="text-[#86efac]">{rec.wins}W</span>
                        <span className="text-[#9a978a]">-</span>
                        <span className="text-[#fca5a5]">{rec.losses}L</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

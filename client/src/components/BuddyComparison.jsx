import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { UserRecordBanner } from './UserRecordBanner';
import { 
  Swords, Shield, CheckCircle2, ChevronDown, Copy, Check, 
  Flame, Award, Trophy, Users, Star, ArrowRight, Zap, Target
} from 'lucide-react';

function cleanStr(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const CANONICAL_MAP = {
  'lsu': 'lsu', 'lsutigers': 'lsu', 'louisianastate': 'lsu', 'louisianastatetigers': 'lsu', '99': 'lsu',
  'clemson': 'clemson', 'clemsontigers': 'clemson', '228': 'clemson',
  'uga': 'georgia', 'georgia': 'georgia', 'georgiabulldogs': 'georgia', '61': 'georgia',
  'bama': 'alabama', 'alabama': 'alabama', 'alabamacrimsontide': 'alabama', 'crimsontide': 'alabama', '333': 'alabama',
  'tex': 'texas', 'texas': 'texas', 'texaslonghorns': 'texas', 'longhorns': 'texas', '251': 'texas',
  'tam': 'texas-am', 'tamu': 'texas-am', 'texasam': 'texas-am', 'texasaandm': 'texas-am', 'texasammaggies': 'texas-am', 'texasamaggies': 'texas-am', 'aggies': 'texas-am', '245': 'texas-am',
  'miss': 'ole-miss', 'olemiss': 'ole-miss', 'olemissrebels': 'ole-miss', 'rebels': 'ole-miss', '145': 'ole-miss',
  'msst': 'mississippi-state', 'mississippistate': 'mississippi-state', 'mississippistatebulldogs': 'mississippi-state', '344': 'mississippi-state',
  'tenn': 'tennessee', 'tennessee': 'tennessee', 'tennesseevolunteers': 'tennessee', 'vols': 'tennessee', 'volunteers': 'tennessee', '2633': 'tennessee',
  'fla': 'florida', 'florida': 'florida', 'floridagators': 'florida', 'gators': 'florida', '57': 'florida',
  'ou': 'oklahoma', 'oklahoma': 'oklahoma', 'oklahomasooners': 'oklahoma', 'sooners': 'oklahoma', '201': 'oklahoma',
  'miz': 'missouri', 'mizzou': 'missouri', 'missouritigers': 'missouri', '142': 'missouri',
  'aub': 'auburn', 'auburn': 'auburn', 'auburntigers': 'auburn', '2': 'auburn',
  'sc': 'south-carolina', 'southcarolina': 'south-carolina', 'southcarolinagamecocks': 'south-carolina', 'gamecocks': 'south-carolina', '2579': 'south-carolina',
  'ark': 'arkansas', 'arkansas': 'arkansas', 'arkansasrazorbacks': 'arkansas', 'razorbacks': 'arkansas', '8': 'arkansas',
  'uk': 'kentucky', 'kentucky': 'kentucky', 'kentuckywildcats': 'kentucky', '96': 'kentucky',
  'van': 'vanderbilt', 'vandy': 'vanderbilt', 'vanderbiltcommodores': 'vanderbilt', 'commodores': 'vanderbilt', '238': 'vanderbilt',
  'osu': 'ohio-state', 'ohiostate': 'ohio-state', 'ohiostatebuckeyes': 'ohio-state', 'buckeyes': 'ohio-state', '194': 'ohio-state',
  'mich': 'michigan', 'michigan': 'michigan', 'michiganwolverines': 'michigan', 'wolverines': 'michigan', '130': 'michigan',
  'ore': 'oregon', 'oregon': 'oregon', 'oregongoldenducks': 'oregon', 'oregonducks': 'oregon', 'ducks': 'oregon', '2483': 'oregon',
  'psu': 'penn-state', 'pennstate': 'penn-state', 'pennstatenittanylions': 'penn-state', 'nittanylions': 'penn-state', '213': 'penn-state',
  'usc': 'usc', 'usctrojans': 'usc', 'trojans': 'usc', 'southerncal': 'usc', '30': 'usc',
  'nd': 'notre-dame', 'notredame': 'notre-dame', 'notredamefightingirish': 'notre-dame', 'fightingirish': 'notre-dame', 'irish': 'notre-dame', '87': 'notre-dame',
  'fsu': 'florida-state', 'floridastate': 'florida-state', 'floridastateseminoles': 'florida-state', 'seminoles': 'florida-state', 'noles': 'florida-state', '52': 'florida-state',
  'mia': 'miami', 'miami': 'miami', 'miamihurricanes': 'miami', 'hurricanes': 'miami', 'canes': 'miami', '2390': 'miami',
  'cin': 'cincinnati', 'cincinnati': 'cincinnati', 'cincinnatibearcats': 'cincinnati', 'bearcats': 'cincinnati', '2132': 'cincinnati',
  'bc': 'boston-college', 'bostoncollege': 'boston-college', 'bostoncollegeeagles': 'boston-college', 'eagles': 'boston-college', '103': 'boston-college',
  'smu': 'smu', 'smumustangs': 'smu', 'mustangs': 'smu', '2567': 'smu',
  'cal': 'california', 'california': 'california', 'californiagoldenbears': 'california', 'goldenbears': 'california', '25': 'california',
  'ucla': 'ucla', 'uclabruins': 'ucla', 'bruins': 'ucla', '26': 'ucla',
  'uw': 'washington', 'washington': 'washington', 'washingtonhuskies': 'washington', 'huskies': 'washington', '264': 'washington',
  'wsu': 'washington-state', 'washingtonstate': 'washington-state', 'washingtonstatecougars': 'washington-state', 'cougars': 'washington-state', '265': 'washington-state',
  'cards': 'louisville', 'cardinals': 'louisville', 'louisville': 'louisville', 'louisvillecardinals': 'louisville', '97': 'louisville',
  'wisc': 'wisconsin', 'wisconsin': 'wisconsin', 'wisconsinbadgers': 'wisconsin', 'badgers': 'wisconsin', '275': 'wisconsin',
  'vt': 'virginia-tech', 'virginiatech': 'virginia-tech', 'virginiatechhokies': 'virginia-tech', 'hokies': 'virginia-tech', '259': 'virginia-tech',
  'uva': 'virginia', 'virginia': 'virginia', 'virginiacavaliers': 'virginia', 'cavaliers': 'virginia', '258': 'virginia',
  'duke': 'duke', 'dukebluedevils': 'duke', 'bluedevils': 'duke', '150': 'duke',
  'gt': 'georgia-tech', 'georgiatech': 'georgia-tech', 'georgiatechyellowjackets': 'georgia-tech', 'yellowjackets': 'georgia-tech', '59': 'georgia-tech',
  'ncst': 'nc-state', 'ncstate': 'nc-state', 'ncstatewolfpack': 'nc-state', 'wolfpack': 'nc-state', '152': 'nc-state',
  'unc': 'north-carolina', 'northcarolina': 'north-carolina', 'northcarolinatarheels': 'north-carolina', 'tarheels': 'north-carolina', '153': 'north-carolina',
  'pitt': 'pittsburgh', 'pittsburgh': 'pittsburgh', 'pittsburghpanthers': 'pittsburgh', 'panthers': 'pittsburgh', '221': 'pittsburgh',
  'cuse': 'syracuse', 'syracuse': 'syracuse', 'syracuseorange': 'syracuse', 'orange': 'syracuse', '183': 'syracuse',
  'wfu': 'wake-forest', 'wakeforest': 'wake-forest', 'wakeforestdemondeacons': 'wake-forest', 'demondeacons': 'wake-forest', '154': 'wake-forest',
  'zona': 'arizona', 'arizona': 'arizona', 'arizonawildcats': 'arizona', '12': 'arizona',
  'asu': 'arizona-state', 'arizonastate': 'arizona-state', 'arizonastatesundevils': 'arizona-state', 'sundevils': 'arizona-state', '9': 'arizona-state',
  'byu': 'byu', 'byucougars': 'byu', '252': 'byu',
  'uh': 'houston', 'houston': 'houston', 'houstoncougars': 'houston', '248': 'houston',
  'isu': 'iowa-state', 'iowastate': 'iowa-state', 'iowastatecyclones': 'iowa-state', 'cyclones': 'iowa-state', '66': 'iowa-state',
  'ku': 'kansas', 'kansas': 'kansas', 'kansasjayhawks': 'kansas', 'jayhawks': 'kansas', '2305': 'kansas',
  'ksu': 'kansas-state', 'kstate': 'kansas-state', 'kansasstate': 'kansas-state', 'kansasstatewildcats': 'kansas-state', '2306': 'kansas-state',
  'okst': 'oklahoma-state', 'okstate': 'oklahoma-state', 'oklahomastate': 'oklahoma-state', 'oklahomastatecowboys': 'oklahoma-state', 'cowboys': 'oklahoma-state', '197': 'oklahoma-state',
  'tcu': 'tcu', 'tcuhornedfrogs': 'tcu', 'hornedfrogs': 'tcu', '2628': 'tcu',
  'ttu': 'texas-tech', 'texastech': 'texas-tech', 'texastechredraiders': 'texas-tech', 'redraiders': 'texas-tech', '2641': 'texas-tech',
  'ucf': 'ucf', 'ucfknights': 'ucf', 'knights': 'ucf', '2116': 'ucf',
  'utah': 'utah', 'utahutes': 'utah', 'utes': 'utah', '254': 'utah',
  'wvu': 'west-virginia', 'westvirginia': 'west-virginia', 'westvirginiamountaineers': 'west-virginia', 'mountaineers': 'west-virginia', '277': 'west-virginia',
  'purdue': 'purdue', 'purdueboilermakers': 'purdue', 'boilermakers': 'purdue', '2509': 'purdue',
  'rutgers': 'rutgers', 'rutgersscarletknights': 'rutgers', 'scarletknights': 'rutgers', '164': 'rutgers',
  'terps': 'maryland', 'maryland': 'maryland', 'marylandterrapins': 'maryland', 'terrapins': 'maryland', '120': 'maryland',
  'northwestern': 'northwestern', 'northwesternwildcats': 'northwestern', '77': 'northwestern'
};

function normalizeTeamKey(strOrPick) {
  if (!strOrPick) return '';
  let raw = '';
  if (typeof strOrPick === 'object') {
    raw = strOrPick.predicted_winner_id || strOrPick.predictedWinnerId || strOrPick.predicted_winner_name || strOrPick.predictedWinnerName || strOrPick.id || strOrPick.name || '';
  } else {
    raw = String(strOrPick);
  }
  const clean = cleanStr(raw);
  if (!clean) return '';
  return CANONICAL_MAP[clean] || clean;
}

function resolvePickToTeam(pick, homeTeam, awayTeam) {
  if (!pick) return null;
  const pId = String(pick.predicted_winner_id || pick.predictedWinnerId || '').toLowerCase().trim();
  const pName = String(pick.predicted_winner_name || pick.predictedWinnerName || '').toLowerCase().trim();
  const pClean = cleanStr(pName || pId);
  const pCanonical = normalizeTeamKey(pName || pId);

  const hId = String(homeTeam?.id || '').toLowerCase().trim();
  const hName = String(homeTeam?.name || '').toLowerCase().trim();
  const hAbbr = String(homeTeam?.abbreviation || '').toLowerCase().trim();
  const hClean = cleanStr(hName);
  const hCanonical = normalizeTeamKey(hName || hId);

  const aId = String(awayTeam?.id || '').toLowerCase().trim();
  const aName = String(awayTeam?.name || '').toLowerCase().trim();
  const aAbbr = String(awayTeam?.abbreviation || '').toLowerCase().trim();
  const aClean = cleanStr(aName);
  const aCanonical = normalizeTeamKey(aName || aId);

  if (pCanonical && hCanonical && pCanonical === hCanonical) return 'HOME';
  if (pCanonical && aCanonical && pCanonical === aCanonical) return 'AWAY';

  if (pId && (pId === hId || (homeTeam?.espnId && pId === String(homeTeam.espnId)))) return 'HOME';
  if (pId && (pId === aId || (awayTeam?.espnId && pId === String(awayTeam.espnId)))) return 'AWAY';

  if (pClean && hClean && (pClean === hClean || pClean.includes(hClean) || hClean.includes(pClean) || pClean === cleanStr(hAbbr) || pClean === cleanStr(hId))) return 'HOME';
  if (pClean && aClean && (pClean === aClean || pClean.includes(aClean) || aClean.includes(pClean) || pClean === cleanStr(aAbbr) || pClean === cleanStr(aId))) return 'AWAY';

  return pClean;
}

function arePicksAgreed(pickA, pickB, homeTeam, awayTeam) {
  if (!pickA || !pickB) return false;

  const idA = (pickA.predicted_winner_id || pickA.predictedWinnerId || '').toLowerCase().trim();
  const idB = (pickB.predicted_winner_id || pickB.predictedWinnerId || '').toLowerCase().trim();
  if (idA && idB && idA === idB) return true;

  const nameA = (pickA.predicted_winner_name || pickA.predictedWinnerName || '').toLowerCase().trim();
  const nameB = (pickB.predicted_winner_name || pickB.predictedWinnerName || '').toLowerCase().trim();
  if (nameA && nameB && nameA === nameB) return true;

  const keyA = normalizeTeamKey(pickA);
  const keyB = normalizeTeamKey(pickB);
  if (keyA && keyB && keyA === keyB) return true;

  const keyAName = normalizeTeamKey(nameA);
  const keyBName = normalizeTeamKey(nameB);
  if (keyAName && keyBName && keyAName === keyBName) return true;
  if (keyA && keyBName && keyA === keyBName) return true;
  if (keyAName && keyB && keyAName === keyB) return true;

  if (homeTeam && awayTeam) {
    const sideA = resolvePickToTeam(pickA, homeTeam, awayTeam);
    const sideB = resolvePickToTeam(pickB, homeTeam, awayTeam);
    if (sideA && sideB && (sideA === 'HOME' || sideA === 'AWAY') && sideA === sideB) {
      return true;
    }
  }

  return false;
}

export function BuddyComparison({ parties, currentWeek, currentYear }) {
  const { user } = useAuth();
  const [selectedPartyId, setSelectedPartyId] = useState(parties?.[0]?.id || '');
  const [selectedBuddyId, setSelectedBuddyId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'DISAGREED', 'AGREED', 'LOCKS'
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
        year: currentYear || 2026,
        week: currentWeek || 1,
        buddyId: selectedBuddyId || undefined
      });
      setComparisonData(data);
      if (data.selectedBuddy && !selectedBuddyId) {
        setSelectedBuddyId(data.selectedBuddy.id);
      }
    } catch (err) {
      console.error('Failed to load buddy comparison:', err);
    } finally {
      setLoading(false);
    }
  }

  const selectedParty = parties.find(p => p.id === selectedPartyId) || parties[0];
  const buddies = comparisonData?.buddies || [];
  const selectedBuddy = comparisonData?.selectedBuddy;
  const rivalryRoster = comparisonData?.rivalryRoster || [];
  const headToHeadClash = comparisonData?.headToHeadClash;
  const mySeasonRecord = comparisonData?.currentUser?.seasonRecord;
  const buddySeasonRecord = comparisonData?.selectedBuddy?.seasonRecord;

  const comparisons = (comparisonData?.comparisons || []).map(c => {
    if (c.myPick && c.buddyPick) {
      const isAgreed = arePicksAgreed(c.myPick, c.buddyPick, c.game?.homeTeam, c.game?.awayTeam);
      return {
        ...c,
        comparisonStatus: isAgreed ? 'AGREED' : 'DISAGREED'
      };
    }
    return c;
  });

  const agreedCount = comparisons.filter(c => c.comparisonStatus === 'AGREED').length;
  const disagreedCount = comparisons.filter(c => c.comparisonStatus === 'DISAGREED').length;
  const totalCompared = agreedCount + disagreedCount;
  const agreementRate = totalCompared > 0 ? Math.round((agreedCount / totalCompared) * 100) : 0;

  const lockClashes = comparisons.filter(c => {
    const isLock = (c.myPick?.confidence_level === 3 || c.myPick?.confidence_points === 3) ||
                   (c.buddyPick?.confidence_level === 3 || c.buddyPick?.confidence_points === 3);
    return isLock && c.comparisonStatus === 'DISAGREED';
  });

  const summary = {
    ...comparisonData?.summary,
    totalCompared,
    agreedCount,
    disagreedCount,
    agreementRate
  };

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
    if (filterMode === 'LOCKS') {
      const isLock = (c.myPick?.confidence_level === 3 || c.myPick?.confidence_points === 3) ||
                     (c.buddyPick?.confidence_level === 3 || c.buddyPick?.confidence_points === 3);
      return isLock && c.comparisonStatus === 'DISAGREED';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overall Season Performance Banner */}
      <UserRecordBanner activeWeek={currentWeek} />

      {/* Top Header & Party Controls */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0d121c] to-slate-950 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Swords className="w-4 h-4" />
              <span>Head-to-Head Party Rivalry Matrix</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
              Split Decisions & Head-to-Head Clash
            </h1>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl mt-0.5">
              Confidence-weighted head-to-head competition. Challenge your party friends on contested matchups and claim ultimate bragging rights!
            </p>
          </div>

          {/* Party Selector */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <label className="block text-[10px] uppercase font-bold text-white/50 mb-1 tracking-wider">Active Party</label>
              <div className="relative group">
                <select
                  value={selectedPartyId}
                  onChange={(e) => {
                    setSelectedPartyId(e.target.value);
                    setSelectedBuddyId('');
                  }}
                  className="w-full sm:w-64 appearance-none bg-[#090d14]/90 hover:bg-[#121824] text-white text-xs font-bold pl-3.5 pr-10 py-2.5 rounded-2xl border border-white/10 hover:border-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 shadow-xl transition backdrop-blur-md cursor-pointer"
                >
                  {parties.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0e1218] text-white py-1.5">{p.icon} {p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-80 group-hover:opacity-100 transition" />
              </div>
            </div>
          </div>
        </div>

        {/* Party Rivalry Quick-Switcher Roster */}
        {buddies.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5">
              <span className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Rival to Challenge ({buddies.length} Members)</span>
              </span>
              <span className="text-[10px] text-amber-400/80">Click a friend to compare head-to-head</span>
            </div>

            <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
              {rivalryRoster.map(b => {
                const isSelected = selectedBuddyId === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBuddyId(b.id)}
                    className={`shrink-0 flex items-center space-x-2.5 px-3 py-2 rounded-2xl border transition-all duration-200 text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/80 shadow-lg shadow-amber-500/10 scale-102'
                        : 'bg-black/40 hover:bg-black/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Mini Avatar */}
                    {b.avatarUrl ? (
                      <img src={b.avatarUrl} alt={b.displayName} className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ring-1 ${
                        isSelected ? 'bg-amber-500 text-black ring-amber-400' : 'bg-white/10 text-white ring-white/20'
                      }`}>
                        {b.displayName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{b.displayName}</span>
                        {b.rivalryStatus === 'WINNING' && (
                          <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">W</span>
                        )}
                        {b.rivalryStatus === 'LOSING' && (
                          <span className="text-[9px] px-1 rounded bg-red-500/20 text-red-300 font-bold">L</span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/50 font-mono font-bold">
                        {b.myContestedPoints} - {b.buddyContestedPoints} PTS
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MARQUEE "TALE OF THE TAPE" CLASH BANNER */}
        {selectedBuddy && (
          <div className="mt-5 bg-gradient-to-b from-[#090d14] to-[#040608] rounded-2xl border border-amber-500/30 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Corner Glows */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left Fighter: YOU */}
              <div className="flex items-center space-x-3.5 bg-black/40 p-3.5 rounded-2xl border border-white/10">
                <div className="relative shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400 shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-black flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-amber-400">
                      {user?.display_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-amber-500 text-black px-1.5 py-0.2 rounded-full border border-black">
                    YOU
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-amber-400 uppercase truncate">{user?.display_name}</div>
                  <div className="text-xs text-white/60 font-semibold truncate">{user?.favorite_team}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-black text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">
                      {mySeasonRecord?.wins || 0}-{mySeasonRecord?.losses || 0} ({mySeasonRecord?.winRate || 0}%)
                    </span>
                    <span className="text-xs font-black text-amber-300 font-mono">
                      {mySeasonRecord?.totalPoints || 0} PTS
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Arena: CONTESTED HEAD-TO-HEAD CLASH SCORE */}
              <div className="text-center flex flex-col items-center justify-center py-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2 shadow-inner">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>Contested Head-to-Head</span>
                </div>

                {/* Big Bold Head-to-Head Score */}
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
                      {headToHeadClash?.myContestedPoints || 0}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-amber-400/70">Your PTS</div>
                  </div>

                  <div className="text-xs font-black text-white/30 uppercase px-2 py-1 rounded bg-white/5">
                    VS
                  </div>

                  <div className="text-left">
                    <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono tracking-tight">
                      {headToHeadClash?.buddyContestedPoints || 0}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-indigo-400/70">Rival PTS</div>
                  </div>
                </div>

                {/* Series Status Pill */}
                <div className="mt-2.5">
                  {headToHeadClash?.seriesLeader === 'YOU_LEADING' && (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      🏆 LEADING BY {Math.abs(headToHeadClash.pointDifferential)} PTS ({headToHeadClash.myContestedWins}-{headToHeadClash.buddyContestedWins} Split W-L)
                    </span>
                  )}
                  {headToHeadClash?.seriesLeader === 'BUDDY_LEADING' && (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
                      ⚡ TRAILING BY {Math.abs(headToHeadClash.pointDifferential)} PTS ({headToHeadClash.myContestedWins}-{headToHeadClash.buddyContestedWins} Split W-L)
                    </span>
                  )}
                  {headToHeadClash?.seriesLeader === 'TIED' && (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20">
                      ⚔️ SERIES TIED ({headToHeadClash?.myContestedWins || 0}-{headToHeadClash?.buddyContestedWins || 0} Split W-L)
                    </span>
                  )}
                </div>

                {/* Agreement Meter Bar */}
                <div className="w-full max-w-xs mt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-white/60 mb-1">
                    <span>Agreement: {summary.agreementRate}%</span>
                    <span>{summary.agreedCount} Agreed / {summary.disagreedCount} Split</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden flex">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${summary.agreementRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Fighter: RIVAL */}
              <div className="flex items-center space-x-3.5 bg-black/40 p-3.5 rounded-2xl border border-white/10 justify-end text-right">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-indigo-400 uppercase truncate">{selectedBuddy.display_name}</div>
                  <div className="text-xs text-white/60 font-semibold truncate">{selectedBuddy.favorite_team}</div>
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    <span className="text-xs font-black text-indigo-300 font-mono">
                      {buddySeasonRecord?.totalPoints || 0} PTS
                    </span>
                    <span className="text-xs font-black text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">
                      {buddySeasonRecord?.wins || 0}-{buddySeasonRecord?.losses || 0} ({buddySeasonRecord?.winRate || 0}%)
                    </span>
                  </div>
                </div>
                <div className="relative shrink-0">
                  {selectedBuddy.avatar_url ? (
                    <img src={selectedBuddy.avatar_url} alt={selectedBuddy.display_name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-indigo-500">
                      {selectedBuddy.display_name?.charAt(0) || 'B'}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.2 rounded-full border border-black">
                    RIVAL
                  </span>
                </div>
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
          {/* Filter & View Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  filterMode === 'ALL'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All Matchups ({comparisons.length})
              </button>
              <button
                onClick={() => setFilterMode('DISAGREED')}
                className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  filterMode === 'DISAGREED'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-orange-400 hover:bg-white/5'
                }`}
              >
                <Swords className="w-3.5 h-3.5 mr-1" />
                <span>Split Rivalry ({summary.disagreedCount})</span>
              </button>
              <button
                onClick={() => setFilterMode('AGREED')}
                className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  filterMode === 'AGREED'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-emerald-400 hover:bg-white/5'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Consensus ({summary.agreedCount})</span>
              </button>
              {lockClashes.length > 0 && (
                <button
                  onClick={() => setFilterMode('LOCKS')}
                  className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    filterMode === 'LOCKS'
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 animate-pulse'
                      : 'text-amber-300 hover:bg-white/5'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 mr-1 fill-amber-400" />
                  <span>Lock Clashes ({lockClashes.length})</span>
                </button>
              )}
            </div>

            <div className="text-xs text-white/50">
              Week <span className="text-amber-400 font-bold">{currentWeek}</span> Slate
            </div>
          </div>

          {/* Comparisons Matchup List */}
          {loading ? (
            <div className="text-center py-16 text-white/50">
              <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading head-to-head matchup matrix...
            </div>
          ) : filteredComparisons.length === 0 ? (
            <div className="bg-[#0e1218] rounded-3xl p-12 text-center border border-white/10 text-white/50">
              <Shield className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No matchups found for this filter</h3>
              <p className="text-sm text-white/40 max-w-md mx-auto">
                {filterMode === 'DISAGREED' ? 'You and your buddy made identical predictions on all games!' : 'Submit your predictions in Make Picks to compare results!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredComparisons.map((c) => {
                const g = c.game;
                const myPick = c.myPick;
                const buddyPick = c.buddyPick;
                const isSplit = c.comparisonStatus === 'DISAGREED';

                return (
                  <div 
                    key={g.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                      isSplit
                        ? 'bg-gradient-to-br from-[#121008] via-[#0e1218] to-[#120808] border-orange-500/30 shadow-xl'
                        : 'bg-[#0e1218] border-white/10 shadow-lg'
                    }`}
                  >
                    {/* Game Matchup Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <img src={g.awayTeam.logo} alt={g.awayTeam.name} className="w-6 h-6 object-contain" />
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {g.awayTeam.rank ? `#${g.awayTeam.rank} ` : ''}{g.awayTeam.name}
                          </span>
                        </div>
                        <span className="text-white/40 font-black text-xs">@</span>
                        <div className="flex items-center space-x-2">
                          <img src={g.homeTeam.logo} alt={g.homeTeam.name} className="w-6 h-6 object-contain" />
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {g.homeTeam.rank ? `#${g.homeTeam.rank} ` : ''}{g.homeTeam.name}
                          </span>
                        </div>
                      </div>

                      {/* Status / Agreement Badge */}
                      <div className="flex items-center space-x-2">
                        {isSplit ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black uppercase flex items-center space-x-1">
                            <Swords className="w-3 h-3" />
                            <span>Split Rivalry Matchup</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Agreed Consensus</span>
                          </span>
                        )}
                        <span className="text-[10px] text-white/40 font-medium">
                          {g.odds || g.broadcast || '2026 Matchup'}
                        </span>
                      </div>
                    </div>

                    {/* Head-to-Head Comparison Boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      {/* Your Pick Box */}
                      <div className={`p-3.5 rounded-2xl border transition ${
                        myPick 
                          ? 'bg-black/60 border-amber-500/40 shadow-inner' 
                          : 'bg-black/20 border-white/5 text-white/40'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center space-x-1">
                            <span>YOUR PICK</span>
                          </span>
                          {myPick?.confidence_points && (
                            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {myPick.confidence_points * 10} PTS {myPick.confidence_level === 3 ? '⭐️⭐️⭐️' : myPick.confidence_level === 2 ? '⭐️⭐️' : '⭐️'}
                            </span>
                          )}
                        </div>
                        <div className="font-black text-white text-sm">
                          {myPick?.predicted_winner_name || 'No prediction made'}
                        </div>
                      </div>

                      {/* Buddy Pick Box */}
                      <div className={`p-3.5 rounded-2xl border transition ${
                        buddyPick 
                          ? 'bg-black/60 border-indigo-500/40 shadow-inner' 
                          : 'bg-black/20 border-white/5 text-white/40'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-indigo-400">
                            {selectedBuddy?.display_name || 'RIVAL'}'S PICK
                          </span>
                          {buddyPick?.confidence_points && (
                            <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {buddyPick.confidence_points * 10} PTS {buddyPick.confidence_level === 3 ? '⭐️⭐️⭐️' : buddyPick.confidence_level === 2 ? '⭐️⭐️' : '⭐️'}
                            </span>
                          )}
                        </div>
                        <div className="font-black text-white text-sm">
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

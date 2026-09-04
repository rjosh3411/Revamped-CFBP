import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Shield, CheckCircle2, XCircle, Clock, 
  Flame, Sparkles, Award, ArrowRightLeft, Filter, AlertCircle, ChevronDown, Check, Swords, Copy
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
  'miz': 'missouri', 'mizzou': 'missouri', 'missouri': 'missouri', 'missouritigers': 'missouri', '142': 'missouri',
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

  // Canonical match against home or away
  if (pCanonical && hCanonical && pCanonical === hCanonical) return 'HOME';
  if (pCanonical && aCanonical && pCanonical === aCanonical) return 'AWAY';

  // Exact ID match
  if (pId && (pId === hId || (homeTeam?.espnId && pId === String(homeTeam.espnId)))) return 'HOME';
  if (pId && (pId === aId || (awayTeam?.espnId && pId === String(awayTeam.espnId)))) return 'AWAY';

  // Name or abbreviation matching on home
  if (pClean && hClean && (pClean === hClean || pClean.includes(hClean) || hClean.includes(pClean) || pClean === cleanStr(hAbbr) || pClean === cleanStr(hId))) return 'HOME';
  
  // Name or abbreviation matching on away
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
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Prediction Party</label>
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

            {/* Buddy Selector */}
            {buddies.length > 0 && (
              <div className="relative flex-1 sm:flex-none">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Compare Against Buddy</label>
                <div className="relative group">
                  <select
                    value={selectedBuddyId}
                    onChange={(e) => setSelectedBuddyId(e.target.value)}
                    className="w-full sm:w-64 appearance-none bg-[#090d14]/90 hover:bg-[#121824] text-white text-xs font-bold pl-3.5 pr-10 py-2.5 rounded-2xl border border-white/10 hover:border-indigo-400/50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 shadow-xl transition backdrop-blur-md cursor-pointer"
                  >
                    {buddies.map(b => (
                      <option key={b.id} value={b.id} className="bg-[#0e1218] text-white py-1.5">
                        👤 {b.display_name} ({b.favorite_team})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-80 group-hover:opacity-100 transition" />
                </div>
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

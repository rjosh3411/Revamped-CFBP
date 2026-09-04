const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { TEAMS_2026 } = require('../db/teamsData');
const { calculateBettingLine } = require('../services/oddsService');
const { authenticateToken } = require('../middleware/auth');

// GET /api/comparison/party/:partyId
router.get('/party/:partyId', authenticateToken, async (req, res) => {
  try {
    const partyId = req.params.partyId;
    const year = parseInt(req.query.year || 2026, 10);
    const week = parseInt(req.query.week || 1, 10);
    const buddyId = req.query.buddyId;

    // Check party membership & details
    const party = await db.prepare('SELECT * FROM parties WHERE id = ?').get(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const isMember = await db.prepare('SELECT id FROM party_members WHERE party_id = ? AND user_id = ?').get(partyId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this party' });
    }

    // Get all party members
    const members = await db.prepare(`
      SELECT u.id, u.username, u.display_name, u.favorite_team, u.avatar_url,
             u.total_points, u.correct_picks, u.total_picks, u.current_streak,
             pm.role,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 3 AND is_correct = 1) as high_conf_correct,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 3 AND is_correct IS NOT NULL) as high_conf_total,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 2 AND is_correct = 1) as med_conf_correct,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 2 AND is_correct IS NOT NULL) as med_conf_total,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 1 AND is_correct = 1) as low_conf_correct,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 1 AND is_correct IS NOT NULL) as low_conf_total
      FROM party_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.party_id = ?
      ORDER BY u.display_name ASC
    `).all(partyId);

    const buddies = members.filter(m => m.id !== req.user.id);

    // If alone in party (no other buddies), return empty comparisons with party metadata
    if (buddies.length === 0) {
      return res.json({
        partyId,
        party,
        year,
        week,
        currentUser: {
          id: req.user.id,
          displayName: req.user.display_name,
          avatarUrl: req.user.avatar_url,
          favoriteTeam: req.user.favorite_team,
          weeklyPoints: 0
        },
        buddies: [],
        selectedBuddy: null,
        summary: {
          totalGames: 0,
          totalCompared: 0,
          agreedCount: 0,
          disagreedCount: 0,
          agreementRate: 0,
          myWeeklyPoints: 0,
          buddyWeeklyPoints: 0,
          pointDifferential: 0
        },
        comparisons: []
      });
    }

    let selectedBuddy = null;
    if (buddyId) {
      selectedBuddy = buddies.find(b => b.id === buddyId) || null;
    }
    if (!selectedBuddy && buddies.length > 0) {
      selectedBuddy = buddies[0];
    }

    // Fetch verified 2026 schedules for this week
    const weekSchedules = await db.prepare(`
      SELECT * FROM team_schedules 
      WHERE (season_year = 2026 OR season_year = '2026') AND week_number = ?
      ORDER BY game_date ASC
    `).all(week);

    // Group schedules by game_id to construct complete 2026 matchups
    const gamesMap = new Map();
    for (const s of weekSchedules) {
      if (!gamesMap.has(s.game_id)) {
        const teamObj = TEAMS_2026.find(t => t.id === s.team_id) || {
          id: s.team_id,
          name: s.team_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          logoUrl: `https://a.espncdn.com/i/teamlogos/ncaa/500/${s.team_id}.png`,
          ranking: null,
          colors: { primary: '#1e3a8a' }
        };

        const oppObj = TEAMS_2026.find(t => t.name.toLowerCase() === s.opponent_name.toLowerCase() || t.id === s.opponent_name.toLowerCase().replace(/\s+/g, '-')) || {
          id: s.opponent_name.toLowerCase().replace(/\s+/g, '-'),
          name: s.opponent_name,
          logoUrl: s.opponent_logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/7.png`,
          ranking: s.opponent_rank || null,
          colors: { primary: '#991b1b' }
        };

        const homeTeam = s.is_home === 1 ? {
          id: teamObj.id,
          name: teamObj.name,
          logo: teamObj.logoUrl,
          rank: teamObj.ranking,
          score: s.team_score || 0
        } : {
          id: oppObj.id,
          name: oppObj.name,
          logo: oppObj.logoUrl,
          rank: oppObj.ranking,
          score: s.opponent_score || 0
        };

        const awayTeam = s.is_home === 1 ? {
          id: oppObj.id,
          name: oppObj.name,
          logo: oppObj.logoUrl,
          rank: oppObj.ranking,
          score: s.opponent_score || 0
        } : {
          id: teamObj.id,
          name: teamObj.name,
          logo: teamObj.logoUrl,
          rank: teamObj.ranking,
          score: s.team_score || 0
        };

        const odds = calculateBettingLine({
          homeTeamName: homeTeam.name,
          homeRank: homeTeam.rank,
          awayTeamName: awayTeam.name,
          awayRank: awayTeam.rank,
          isHome: true
        });

        gamesMap.set(s.game_id, {
          id: s.game_id,
          seasonYear: year,
          weekNumber: week,
          date: s.game_date,
          name: `${awayTeam.name} at ${homeTeam.name}`,
          shortName: `${awayTeam.name} @ ${homeTeam.name}`,
          status: s.status,
          statusDetail: s.status_detail,
          isFinal: s.status === 'STATUS_FINAL',
          isInProgress: s.status === 'STATUS_IN_PROGRESS',
          winnerId: null,
          broadcast: s.broadcast || 'ESPN',
          venue: s.venue_name || 'College Stadium',
          odds,
          homeTeam,
          awayTeam
        });
      }
    }

    const allWeekGames = Array.from(gamesMap.values());

    // Fetch current user picks
    const myPicks = await db.prepare(`
      SELECT * FROM picks 
      WHERE user_id = ? AND (season_year = ? OR season_year = ?) AND week_number = ?
    `).all(req.user.id, year, String(year), week);

    const myPicksMap = new Map();
    myPicks.forEach(p => myPicksMap.set(p.game_id, p));

    // Fetch buddy picks if buddy exists
    const buddyPicksMap = new Map();
    if (selectedBuddy) {
      const buddyPicks = await db.prepare(`
        SELECT * FROM picks 
        WHERE user_id = ? AND (season_year = ? OR season_year = ?) AND week_number = ?
      `).all(selectedBuddy.id, year, String(year), week);
      buddyPicks.forEach(p => buddyPicksMap.set(p.game_id, p));
    }

    // Fetch all party members' picks for party consensus
    const allPartyPicks = await db.prepare(`
      SELECT p.*, u.display_name, u.avatar_url
      FROM picks p
      JOIN party_members pm ON p.user_id = pm.user_id
      JOIN users u ON p.user_id = u.id
      WHERE pm.party_id = ? AND (p.season_year = ? OR p.season_year = ?) AND p.week_number = ?
    `).all(partyId, year, String(year), week);

    const partyPicksByGame = new Map();
    allPartyPicks.forEach(p => {
      if (!partyPicksByGame.has(p.game_id)) {
        partyPicksByGame.set(p.game_id, []);
      }
      partyPicksByGame.get(p.game_id).push(p);
    });

    let totalCompared = 0;
    let agreedCount = 0;
    let disagreedCount = 0;
    let myWeeklyPoints = 0;
    let buddyWeeklyPoints = 0;

    // Filter games to either games that have picks by party members OR all scheduled 2026 games
    const gamesWithPicks = allWeekGames.filter(g => {
      return myPicksMap.has(g.id) || (selectedBuddy && buddyPicksMap.has(g.id)) || partyPicksByGame.has(g.id);
    });

    // If no picks made yet, show top scheduled games for the week
    const targetGames = gamesWithPicks.length > 0 ? gamesWithPicks : allWeekGames.slice(0, 15);

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

    const gameComparisons = targetGames.map(g => {
      const myPick = myPicksMap.get(g.id) || null;
      const buddyPick = selectedBuddy ? (buddyPicksMap.get(g.id) || null) : null;
      const allPicksForGame = partyPicksByGame.get(g.id) || [];

      let comparisonStatus = 'UNPICKED';
      let headToHeadResult = 'PENDING';

      if (myPick && buddyPick) {
        totalCompared++;
        const isAgreed = arePicksAgreed(myPick, buddyPick, g.homeTeam, g.awayTeam);

        if (isAgreed) {
          comparisonStatus = 'AGREED';
          agreedCount++;
        } else {
          comparisonStatus = 'DISAGREED';
          disagreedCount++;
        }

        if (g.isFinal && g.winnerId) {
          const myCorrect = myPick.predicted_winner_id === g.winnerId || myPick.is_correct === 1;
          const buddyCorrect = buddyPick.predicted_winner_id === g.winnerId || buddyPick.is_correct === 1;

          if (myCorrect && buddyCorrect) headToHeadResult = 'BOTH_CORRECT';
          else if (!myCorrect && !buddyCorrect) headToHeadResult = 'BOTH_INCORRECT';
          else if (myCorrect && !buddyCorrect) headToHeadResult = 'YOU_WON';
          else if (!myCorrect && buddyCorrect) headToHeadResult = 'BUDDY_WON';
        }
      } else if (myPick) {
        comparisonStatus = 'MY_ONLY';
      } else if (buddyPick) {
        comparisonStatus = 'BUDDY_ONLY';
      }

      if (myPick && myPick.points_awarded) {
        myWeeklyPoints += myPick.points_awarded;
      }
      if (buddyPick && buddyPick.points_awarded) {
        buddyWeeklyPoints += buddyPick.points_awarded;
      }

      const homePicksCount = allPicksForGame.filter(p => {
        return resolvePickToTeam(p, g.homeTeam, g.awayTeam) === 'HOME';
      }).length;

      const awayPicksCount = allPicksForGame.filter(p => {
        return resolvePickToTeam(p, g.homeTeam, g.awayTeam) === 'AWAY';
      }).length;

      const totalPartyPicks = homePicksCount + awayPicksCount;

      const consensus = {
        totalPicks: totalPartyPicks,
        homePct: totalPartyPicks > 0 ? Math.round((homePicksCount / totalPartyPicks) * 100) : 50,
        awayPct: totalPartyPicks > 0 ? Math.round((awayPicksCount / totalPartyPicks) * 100) : 50,
        consensusTeam: homePicksCount > awayPicksCount ? g.homeTeam.name : (awayPicksCount > homePicksCount ? g.awayTeam.name : 'Split 50/50')
      };

      return {
        game: g,
        myPick,
        buddyPick,
        comparisonStatus,
        headToHeadResult,
        consensus,
        partyPicksCount: allPicksForGame.length,
        partyPicksList: allPicksForGame.map(p => ({
          userId: p.user_id,
          userName: p.display_name,
          predictedId: p.predicted_winner_id,
          predictedName: p.predicted_winner_name,
          isCorrect: p.is_correct
        }))
      };
    });

    const agreementRate = totalCompared > 0 ? Math.round((agreedCount / totalCompared) * 100) : 0;

    return res.json({
      partyId,
      party,
      year,
      week,
      currentUser: {
        id: req.user.id,
        displayName: req.user.display_name,
        avatarUrl: req.user.avatar_url,
        favoriteTeam: req.user.favorite_team,
        weeklyPoints: myWeeklyPoints
      },
      buddies,
      selectedBuddy: selectedBuddy ? {
        id: selectedBuddy.id,
        displayName: selectedBuddy.display_name,
        avatarUrl: selectedBuddy.avatar_url,
        favoriteTeam: selectedBuddy.favorite_team,
        weeklyPoints: buddyWeeklyPoints
      } : null,
      summary: {
        totalGames: targetGames.length,
        totalCompared,
        agreedCount,
        disagreedCount,
        agreementRate,
        myWeeklyPoints,
        buddyWeeklyPoints,
        pointDifferential: myWeeklyPoints - buddyWeeklyPoints
      },
      comparisons: gameComparisons
    });
  } catch (err) {
    console.error('Buddy comparison error:', err);
    return res.status(500).json({ error: 'Failed to generate buddy comparison matrix' });
  }
});

module.exports = router;

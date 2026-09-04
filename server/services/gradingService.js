const db = require('../db/database');
const { TEAMS_2026 } = require('../db/teamsData');

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

function normalizeTeamKey(str) {
  if (!str) return '';
  const clean = cleanStr(str);
  return CANONICAL_MAP[clean] || clean;
}

function isPickWinnerMatch(pick, winningTeam) {
  if (!pick || !winningTeam) return false;
  const pId = String(pick.predicted_winner_id || '').toLowerCase().trim();
  const pName = String(pick.predicted_winner_name || '').toLowerCase().trim();

  const wId = String(winningTeam.id || '').toLowerCase().trim();
  const wEspnId = String(winningTeam.espnId || '').toLowerCase().trim();
  const wName = String(winningTeam.name || '').toLowerCase().trim();
  const wAbbr = String(winningTeam.abbreviation || '').toLowerCase().trim();

  // 1. Direct ID matches
  if (pId && (pId === wId || pId === wEspnId)) return true;

  // 2. Canonical dictionary matches
  const pCanonical = normalizeTeamKey(pName || pId);
  const wCanonical = normalizeTeamKey(wName || wId);
  if (pCanonical && wCanonical && pCanonical === wCanonical) return true;

  // 3. Substring / clean text match
  const pClean = cleanStr(pName || pId);
  const wClean = cleanStr(wName || wId);
  if (pClean && wClean && (pClean === wClean || pClean.includes(wClean) || wClean.includes(pClean))) return true;
  if (pName && wAbbr && pName === wAbbr) return true;

  return false;
}

class GradingService {
  /**
   * Evaluates finished games in real-time and awards points or deducts confidence penalties.
   * @param {Array} games List of game objects from ESPN scoreboard or database
   */
  async gradeFinishedGames(games = []) {
    if (!games || games.length === 0) return { gradedCount: 0 };

    const finalGames = games.filter(g => {
      const isFinal = g.isFinal || g.status === 'STATUS_FINAL' || g.statusDetail?.toLowerCase().includes('final');
      return isFinal;
    });

    if (finalGames.length === 0) {
      return { gradedCount: 0, message: 'No finished games to grade.' };
    }

    const gameMap = new Map();
    for (const g of finalGames) {
      let winningTeam = null;

      if (g.winnerId) {
        if (g.homeTeam && (g.homeTeam.id === g.winnerId || g.homeTeam.espnId === g.winnerId)) {
          winningTeam = g.homeTeam;
        } else if (g.awayTeam && (g.awayTeam.id === g.winnerId || g.awayTeam.espnId === g.winnerId)) {
          winningTeam = g.awayTeam;
        } else {
          winningTeam = { id: g.winnerId, name: g.winnerId };
        }
      } else if (g.homeTeam && g.awayTeam && g.homeTeam.score !== undefined && g.awayTeam.score !== undefined) {
        const hScore = parseInt(g.homeTeam.score || 0, 10);
        const aScore = parseInt(g.awayTeam.score || 0, 10);
        if (hScore > aScore) {
          winningTeam = g.homeTeam;
        } else if (aScore > hScore) {
          winningTeam = g.awayTeam;
        }
      }

      if (winningTeam) {
        gameMap.set(g.id, winningTeam);
      }
    }

    const gameIds = Array.from(gameMap.keys());
    if (gameIds.length === 0) return { gradedCount: 0 };

    // Sync final scores into team_schedules
    for (const g of finalGames) {
      try {
        if (g.homeTeam && g.awayTeam && g.homeTeam.score !== undefined && g.awayTeam.score !== undefined) {
          const hScore = parseInt(g.homeTeam.score || 0, 10);
          const aScore = parseInt(g.awayTeam.score || 0, 10);
          await db.prepare(`
            UPDATE team_schedules
            SET status = 'STATUS_FINAL',
                status_detail = 'Final',
                team_score = CASE WHEN is_home = 1 THEN ? ELSE ? END,
                opponent_score = CASE WHEN is_home = 1 THEN ? ELSE ? END,
                updated_at = CURRENT_TIMESTAMP
            WHERE game_id = ?
          `).run(hScore, aScore, aScore, hScore, g.id);
        }
      } catch (e) {
        // non-blocking
      }
    }

    const placeholders = gameIds.map(() => '?').join(',');
    const picksToGrade = await db.prepare(`
      SELECT * FROM picks 
      WHERE game_id IN (${placeholders})
    `).all(...gameIds);

    let gradedCount = 0;
    const affectedUserIds = new Set();

    for (const pick of picksToGrade) {
      const winningTeam = gameMap.get(pick.game_id);
      if (!winningTeam) continue;

      const isCorrect = isPickWinnerMatch(pick, winningTeam) ? 1 : 0;
      const confLevel = pick.confidence_level || pick.confidence_points || 1;
      const confPoints = confLevel * 10;

      // Dynamic confidence scoring: Positive points if correct, Negative penalty if incorrect!
      const pointsAwarded = isCorrect === 1 ? confPoints : -confPoints;

      // Only update if grade or points changed
      if (pick.is_correct !== isCorrect || pick.points_awarded !== pointsAwarded) {
        await db.prepare(`
          UPDATE picks 
          SET is_correct = ?, points_awarded = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(isCorrect, pointsAwarded, pick.id);

        affectedUserIds.add(pick.user_id);
        gradedCount++;
      }
    }

    for (const userId of affectedUserIds) {
      await this.recalculateUserStats(userId);
    }

    return {
      gradedCount,
      affectedUsers: affectedUserIds.size,
      finalGamesCount: finalGames.length
    };
  }

  /**
   * Syncs latest ESPN live scoreboard and automatically grades all completed games.
   */
  async syncAndGradeLiveScores() {
    try {
      const espnService = require('./espnService');
      const live = await espnService.getLiveScoreboard();
      if (live && live.games && live.games.length > 0) {
        return await this.gradeFinishedGames(live.games);
      }
    } catch (err) {
      console.warn('Live score sync warning:', err.message);
    }
    return { gradedCount: 0 };
  }

  /**
   * Grades all picks for a specific week by fetching the latest ESPN scoreboard.
   */
  async gradeWeekPicks(year = 2026, week = 1) {
    const espnService = require('./espnService');
    const scoreboard = await espnService.getScoreboard({ year, week, forceRefresh: true });
    return await this.gradeFinishedGames(scoreboard.games || []);
  }

  /**
   * Recalculates total points, correct picks, and streaks for a user.
   */
  async recalculateUserStats(userId) {
    const picks = await db.prepare(`
      SELECT p.*, g.game_date 
      FROM picks p
      LEFT JOIN games_cache g ON p.game_id = g.game_id
      WHERE p.user_id = ? AND p.is_correct IS NOT NULL
      ORDER BY g.game_date ASC, p.created_at ASC
    `).all(userId);

    const totalPicks = picks.length;
    const correctPicks = picks.filter(p => p.is_correct === 1).length;
    const totalPoints = picks.reduce((sum, p) => sum + (p.points_awarded || 0), 0);

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (const p of picks) {
      if (p.is_correct === 1) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    currentStreak = tempStreak;

    await db.prepare(`
      UPDATE users 
      SET total_points = ?, total_picks = ?, correct_picks = ?, current_streak = ?, best_streak = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(totalPoints, totalPicks, correctPicks, currentStreak, bestStreak, userId);
  }

  /**
   * Retroactively updates all previously graded picks to apply negative confidence deductions.
   */
  async regradeAllExistingPicks() {
    const gradedPicks = await db.prepare(`
      SELECT * FROM picks WHERE is_correct IS NOT NULL
    `).all();

    const affectedUserIds = new Set();

    for (const pick of gradedPicks) {
      const confLevel = pick.confidence_level || pick.confidence_points || 1;
      const confPoints = confLevel * 10;
      const expectedPoints = pick.is_correct === 1 ? confPoints : -confPoints;

      if (pick.points_awarded !== expectedPoints) {
        await db.prepare(`
          UPDATE picks 
          SET points_awarded = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(expectedPoints, pick.id);

        affectedUserIds.add(pick.user_id);
      }
    }

    for (const userId of affectedUserIds) {
      await this.recalculateUserStats(userId);
    }

    return { updatedPicks: gradedPicks.length, affectedUsers: affectedUserIds.size };
  }
}

module.exports = new GradingService();

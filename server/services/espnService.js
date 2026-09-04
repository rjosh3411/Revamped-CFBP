const db = require('../db/database');
const { TEAMS_2026 } = require('../db/teamsData');
const { calculateBettingLine } = require('./oddsService');

const CONFERENCE_GROUPS = {
  ALL: 80,         // All FBS
  TOP25: 80,       // FBS with curatedRank <= 25
  SEC: 8,          // Southeastern Conference
  BIGTEN: 5,       // Big Ten Conference
  B1G: 5,          // Big Ten alias
  ACC: 1,          // Atlantic Coast Conference
  BIG12: 4,        // Big 12 Conference
  B12: 4,          // Big 12 alias
  G5: 151,         // Group of 5
  AAC: 151,        // American Athletic Conference
  MWC: 17,         // Mountain West Conference
  SUNBELT: 37,     // Sun Belt Conference
  MAC: 12,         // Mid-American Conference
  CUSA: 15,        // Conference USA
  INDEPENDENTS: 18 // FBS Independents
};

const CONFERENCE_TEAMS = {
  SEC: [
    'Georgia', 'Alabama', 'Texas', 'Ole Miss', 'Tennessee', 'LSU', 'Missouri', 
    'Oklahoma', 'Texas A&M', 'Kentucky', 'Auburn', 'Florida', 'South Carolina', 
    'Arkansas', 'Vanderbilt', 'Mississippi State'
  ],
  BIGTEN: [
    'Ohio State', 'Oregon', 'Penn State', 'Michigan', 'USC', 'Iowa', 'Nebraska', 
    'Wisconsin', 'Washington', 'Indiana', 'Illinois', 'Rutgers', 'Michigan State', 
    'Minnesota', 'Maryland', 'UCLA', 'Northwestern', 'Purdue'
  ],
  B1G: [
    'Ohio State', 'Oregon', 'Penn State', 'Michigan', 'USC', 'Iowa', 'Nebraska', 
    'Wisconsin', 'Washington', 'Indiana', 'Illinois', 'Rutgers', 'Michigan State', 
    'Minnesota', 'Maryland', 'UCLA', 'Northwestern', 'Purdue'
  ],
  ACC: [
    'Florida State', 'Clemson', 'Miami', 'NC State', 'Louisville', 'Virginia Tech', 
    'SMU', 'North Carolina', 'Georgia Tech', 'California', 'Duke', 'Syracuse', 
    'Boston College', 'Virginia', 'Pittsburgh', 'Wake Forest', 'Stanford'
  ],
  BIG12: [
    'Utah', 'Kansas State', 'Oklahoma State', 'Arizona', 'Kansas', 'Iowa State', 
    'West Virginia', 'UCF', 'Texas Tech', 'TCU', 'Colorado', 'Baylor', 
    'BYU', 'Cincinnati', 'Arizona State', 'Houston'
  ],
  B12: [
    'Utah', 'Kansas State', 'Oklahoma State', 'Arizona', 'Kansas', 'Iowa State', 
    'West Virginia', 'UCF', 'Texas Tech', 'TCU', 'Colorado', 'Baylor', 
    'BYU', 'Cincinnati', 'Arizona State', 'Houston'
  ],
  G5: [
    'Boise State', 'Memphis', 'UNLV', 'Army', 'Tulane', 'South Florida', 'USF', 'UTSA',
    'App State', 'James Madison', 'Liberty', 'Fresno State', 'San Diego State', 'San José State',
    'Colorado State', 'Air Force', 'Coastal Carolina', 'Texas State', 'Toledo'
  ],
  AAC: [
    'Memphis', 'UTSA', 'Tulane', 'South Florida', 'Army', 'Navy', 'Rice', 
    'East Carolina', 'Florida Atlantic', 'North Texas', 'UAB', 'Tulsa', 'Charlotte', 'Temple'
  ],
  MWC: [
    'Boise State', 'UNLV', 'Fresno State', 'Colorado State', 'Air Force', 
    'San Diego State', 'San José State', 'San Jose State', 'Wyoming', 'Utah State', 'Hawaii', 'Nevada', 'New Mexico'
  ],
  SUNBELT: [
    'App State', 'Appalachian State', 'James Madison', 'Texas State', 'Troy', 
    'Louisiana', 'Coastal Carolina', 'South Alabama', 'Georgia Southern', 'Marshall', 'Old Dominion', 'Arkansas State', 'Southern Miss', 'Louisiana Monroe', 'Georgia State'
  ],
  MAC: [
    'Miami (OH)', 'Toledo', 'Bowling Green', 'Northern Illinois', 'Ohio', 
    'Western Michigan', 'Central Michigan', 'Eastern Michigan', 'Buffalo', 'Ball State', 'Akron', 'Kent State'
  ],
  CUSA: [
    'Liberty', 'Western Kentucky', 'Jacksonville State', 'Middle Tennessee', 
    'New Mexico State', 'Sam Houston', 'Louisiana Tech', 'FIU', 'UTEP', 'Kennesaw State'
  ],
  INDEPENDENTS: [
    'Notre Dame', 'UConn', 'Connecticut', 'UMass', 'Massachusetts', 'Oregon State', 'Washington State'
  ]
};

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

class EspnService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheExpiry = 60 * 1000;
  }

  async fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      if (!res.ok) {
        throw new Error(`ESPN API returned HTTP ${res.status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  getCanonicalTeam(rawName, fallback = {}) {
    if (!rawName) return fallback;
    const lower = rawName.toLowerCase().trim();
    
    // 0. Check alias dictionary
    const TEAM_ALIASES = {
      'massachusetts': 'umass',
      'massachusetts minutemen': 'umass',
      'connecticut': 'uconn',
      'connecticut huskies': 'uconn',
      'pitt': 'pittsburgh',
      'pitt panthers': 'pittsburgh',
      'ole miss': 'ole-miss',
      'ole miss rebels': 'ole-miss',
      'mississippi rebels': 'ole-miss',
      'miss state': 'mississippi-state',
      'mississippi state bulldogs': 'mississippi-state',
      'texas a&m': 'texas-am',
      'texas am': 'texas-am',
      'texas a&m aggies': 'texas-am',
      'texas am aggies': 'texas-am',
      'appalachian state': 'app-state',
      'appalachian state mountaineers': 'app-state',
      'southern cal': 'usc',
      'southern california': 'usc',
      'miami florida': 'miami',
      'miami fl': 'miami',
      'miami ohio': 'miami-oh'
    };

    const targetKey = TEAM_ALIASES[lower] || lower;

    // 1. Exact match by id, name, nickname, or abbreviation
    const exact = TEAMS_2026.find(t => 
      t.id.toLowerCase() === targetKey || 
      t.name.toLowerCase() === targetKey || 
      (t.nickname && t.nickname.toLowerCase() === targetKey) ||
      t.abbreviation.toLowerCase() === targetKey
    );
    if (exact) return exact;

    // 2. Full displayName match (e.g. "Florida Gators", "TCU Horned Frogs")
    const fullMatch = TEAMS_2026.find(t => 
      targetKey === `${t.name.toLowerCase()} ${t.nickname ? t.nickname.toLowerCase() : ''}`.trim()
    );
    if (fullMatch) return fullMatch;

    // 3. Fallback for FCS or other non-P4 opponents
    return {
      id: targetKey.replace(/[^a-z0-9]/g, '-'),
      name: rawName,
      nickname: rawName,
      abbreviation: rawName.substring(0, 4).toUpperCase(),
      logoUrl: fallback.logoUrl || 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png',
      ranking: null,
      conference: 'FBS',
      colors: { primary: '#1e3a8a', secondary: '#ffffff' }
    };
  }

  async get2026SeasonGames(year = 2026, week = 0, conference = 'ALL') {
    const confKey = (conference || 'ALL').toUpperCase();
    const queryWeek = parseInt(week !== undefined ? week : 0, 10);

    try {
      const schedules = await db.prepare(`
        SELECT * FROM team_schedules 
        WHERE (season_year = ? OR season_year = ?) AND (week_number = ? OR week_number = ?)
        ORDER BY game_date ASC
      `).all(year, String(year), queryWeek, String(queryWeek));

      if (!schedules || schedules.length === 0) {
        return [];
      }

      const gameMap = new Map();

      for (const s of schedules) {
        const thisTeam = this.getCanonicalTeam(s.team_id, { name: s.team_id });
        const oppTeam = this.getCanonicalTeam(s.opponent_name, { name: s.opponent_name, logoUrl: s.opponent_logo });

        const isHome = s.is_home === 1;
        const homeTeam = isHome ? thisTeam : oppTeam;
        const awayTeam = isHome ? oppTeam : thisTeam;

        const pairKey = [homeTeam.id, awayTeam.id].sort().join('___') + '_w' + queryWeek;

        if (!gameMap.has(pairKey)) {
          const odds = calculateBettingLine({
            homeTeamName: homeTeam.name,
            homeRank: homeTeam.ranking || null,
            awayTeamName: awayTeam.name,
            awayRank: awayTeam.ranking || null
          });

          gameMap.set(pairKey, {
            id: s.game_id || `game_2026_w${queryWeek}_${homeTeam.id}_vs_${awayTeam.id}`,
            seasonYear: year,
            weekNumber: queryWeek,
            date: s.game_date || '2026-09-05T19:00:00Z',
            name: `${awayTeam.name} at ${homeTeam.name}`,
            shortName: `${awayTeam.abbreviation || awayTeam.name} @ ${homeTeam.abbreviation || homeTeam.name}`,
            status: 'STATUS_SCHEDULED',
            statusDetail: 'Scheduled',
            isFinal: false,
            isInProgress: false,
            winnerId: null,
            broadcast: s.broadcast || 'ESPN/ABC',
            venue: s.venue_name || 'College Stadium',
            odds: odds ? odds.fullLine || odds.details || `${homeTeam.name} -7.0` : null,
            homeTeam: {
              id: homeTeam.id,
              name: homeTeam.name,
              nickname: homeTeam.nickname || homeTeam.name,
              abbreviation: homeTeam.abbreviation || homeTeam.name?.substring(0, 4).toUpperCase(),
              color: homeTeam.colors?.primary || '#1e3a8a',
              alternateColor: homeTeam.colors?.secondary || '#ffffff',
              logo: homeTeam.logoUrl || `https://a.espncdn.com/i/teamlogos/ncaa/500/${homeTeam.espnId || 7}.png`,
              score: 0,
              rank: homeTeam.ranking || null,
              record: '0-0',
              conference: homeTeam.conference || 'FBS'
            },
            awayTeam: {
              id: awayTeam.id,
              name: awayTeam.name,
              nickname: awayTeam.nickname || awayTeam.name,
              abbreviation: awayTeam.abbreviation || awayTeam.name?.substring(0, 4).toUpperCase(),
              color: awayTeam.colors?.primary || '#991b1b',
              alternateColor: awayTeam.colors?.secondary || '#ffffff',
              logo: awayTeam.logoUrl || `https://a.espncdn.com/i/teamlogos/ncaa/500/${awayTeam.espnId || 7}.png`,
              score: 0,
              rank: awayTeam.ranking || null,
              record: '0-0',
              conference: awayTeam.conference || 'FBS'
            },
            conferenceCompetition: homeTeam.conference === awayTeam.conference
          });
        }
      }

      let allGames = Array.from(gameMap.values());

      // Filter by conference if specified
      if (confKey !== 'ALL') {
        allGames = this.filterByConference(allGames, confKey);
      }

      return allGames;
    } catch (e) {
      console.error('Error in get2026SeasonGames:', e);
      return [];
    }
  }

  async getScoreboard({ year = 2026, week = 0, seasonType = 2, conference = 'ALL', forceRefresh = false } = {}) {
    const confKey = (conference || 'ALL').toUpperCase();
    const queryWeek = parseInt(week !== undefined ? week : 0, 10);
    const cacheKey = `scoreboard_${year}_w${queryWeek}_st${seasonType}_${confKey}`;
    const cached = this.memoryCache.get(cacheKey);

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
      return cached.data;
    }

    // For 2026 season schedules, strictly load authentic 2026 week matchups
    if (year === 2026 || year === '2026') {
      const season2026Games = await this.get2026SeasonGames(year, queryWeek, conference);
      const result = {
        season: { year: 2026, type: seasonType },
        week: { number: queryWeek },
        conference,
        games: season2026Games || [],
        total: (season2026Games || []).length,
        fromLiveEspn: false,
        source: 'Official 2026 College Football Schedule'
      };
      this.memoryCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }

    const groupId = CONFERENCE_GROUPS[confKey] || 80;
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${year}&seasontype=${seasonType}&week=${week}&groups=${groupId}&limit=150`;

    try {
      const data = await this.fetchJson(url);
      let normalizedGames = this.normalizeScoreboard(data, year, week);

      // Save to SQLite game cache
      this.saveGamesToDb(normalizedGames, year, week);

      // Apply conference filter if specific conference was requested and groupId was 80
      if (confKey !== 'ALL' && confKey !== 'TOP25' && CONFERENCE_TEAMS[confKey]) {
        normalizedGames = this.filterByConference(normalizedGames, confKey);
      }

      const result = {
        season: data.season || { year, type: seasonType },
        week: data.week || { number: week },
        games: normalizedGames,
        total: normalizedGames.length,
        fromLiveEspn: true
      };

      this.memoryCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err) {
      console.warn(`[ESPN Service] Network fetch failed (${err.message}). Falling back to database cache.`);
      let dbGames = await this.getGamesFromDb(year, week);
      if (confKey !== 'ALL' && confKey !== 'TOP25' && CONFERENCE_TEAMS[confKey]) {
        dbGames = this.filterByConference(dbGames, confKey);
      }
      if (dbGames.length > 0) {
        return {
          season: { year, type: seasonType },
          week: { number: week },
          games: dbGames,
          total: dbGames.length,
          fromLiveEspn: false,
          warning: 'Serving cached data from database'
        };
      }
      return {
        season: { year, type: seasonType },
        week: { number: week },
        games: [],
        total: 0,
        fromLiveEspn: false,
        warning: 'No games found for requested week'
      };
    }
  }

  filterByConference(games, conferenceKey) {
    const key = (conferenceKey || '').toUpperCase();
    if (key === 'ALL') return games;
    if (key === 'TOP25') {
      return games.filter(g => (g.homeTeam?.rank !== null && g.homeTeam?.rank <= 25) || (g.awayTeam?.rank !== null && g.awayTeam?.rank <= 25));
    }

    const SEC_IDS = new Set(TEAMS_2026.filter(t => t.conference === 'SEC').map(t => t.id));
    const B1G_IDS = new Set(TEAMS_2026.filter(t => t.conference === 'Big Ten').map(t => t.id));
    const ACC_IDS = new Set(TEAMS_2026.filter(t => t.conference === 'ACC').map(t => t.id));
    const B12_IDS = new Set(TEAMS_2026.filter(t => t.conference === 'Big 12').map(t => t.id));
    const G5_IDS = new Set(TEAMS_2026.filter(t => t.conference === 'Group of 5').map(t => t.id));

    return games.filter(g => {
      const hId = (g.homeTeam?.id || '').toLowerCase();
      const aId = (g.awayTeam?.id || '').toLowerCase();
      const hConf = (g.homeTeam?.conference || '').toUpperCase();
      const aConf = (g.awayTeam?.conference || '').toUpperCase();

      if (key === 'SEC') {
        return hConf === 'SEC' || aConf === 'SEC' || SEC_IDS.has(hId) || SEC_IDS.has(aId);
      }
      if (key === 'B1G' || key === 'BIGTEN') {
        return hConf.includes('BIG TEN') || aConf.includes('BIG TEN') || hConf.includes('BIGTEN') || aConf.includes('BIGTEN') || B1G_IDS.has(hId) || B1G_IDS.has(aId);
      }
      if (key === 'ACC') {
        return hConf === 'ACC' || aConf === 'ACC' || ACC_IDS.has(hId) || ACC_IDS.has(aId);
      }
      if (key === 'B12' || key === 'BIG12') {
        return hConf.includes('BIG 12') || aConf.includes('BIG 12') || hConf.includes('BIG12') || aConf.includes('BIG12') || B12_IDS.has(hId) || B12_IDS.has(aId);
      }
      if (key === 'G5') {
        return hConf.includes('GROUP') || aConf.includes('GROUP') || G5_IDS.has(hId) || G5_IDS.has(aId);
      }
      return false;
    });
  }

  normalizeScoreboard(data, year, week) {
    if (!data.events || !Array.isArray(data.events)) return [];

    return data.events.map(event => {
      const comp = event.competitions?.[0] || {};
      const competitors = comp.competitors || [];
      const homeComp = competitors.find(c => c.homeAway === 'home') || {};
      const awayComp = competitors.find(c => c.homeAway === 'away') || {};

      const homeTeam = homeComp.team || {};
      const awayTeam = awayComp.team || {};

      const homeRank = (homeComp.curatedRank?.current && homeComp.curatedRank.current <= 25) ? homeComp.curatedRank.current : null;
      const awayRank = (awayComp.curatedRank?.current && awayComp.curatedRank.current <= 25) ? awayComp.curatedRank.current : null;

      const statusType = event.status?.type?.name || 'STATUS_SCHEDULED';
      const statusDetail = event.status?.type?.detail || event.status?.type?.description || 'Scheduled';
      const isFinal = statusType === 'STATUS_FINAL';
      const isInProgress = statusType === 'STATUS_IN_PROGRESS';

      let winnerId = null;
      if (isFinal) {
        const homeScore = parseInt(homeComp.score || 0, 10);
        const awayScore = parseInt(awayComp.score || 0, 10);
        if (homeComp.winner || homeScore > awayScore) {
          winnerId = homeTeam.id;
        } else if (awayComp.winner || awayScore > homeScore) {
          winnerId = awayTeam.id;
        }
      }

      const odds = comp.odds?.[0]?.details || comp.odds?.[0]?.overUnder ? `${comp.odds[0].details || ''} O/U: ${comp.odds[0].overUnder || ''}`.trim() : null;
      const broadcast = comp.broadcasts?.[0]?.names?.[0] || comp.geoBroadcasts?.[0]?.media?.shortName || 'ESPN/ABC';
      const venue = comp.venue?.fullName ? `${comp.venue.fullName}${comp.venue.address?.city ? `, ${comp.venue.address.city}` : ''}` : 'College Stadium';

      return {
        id: event.id,
        seasonYear: year,
        weekNumber: week,
        date: event.date,
        name: event.name || `${awayTeam.displayName || 'Away'} at ${homeTeam.displayName || 'Home'}`,
        shortName: event.shortName || `${awayTeam.abbreviation || 'AWAY'} @ ${homeTeam.abbreviation || 'HOME'}`,
        status: statusType,
        statusDetail: statusDetail,
        isFinal,
        isInProgress,
        winnerId,
        broadcast,
        venue,
        odds,
        homeTeam: {
          id: homeTeam.id || 'home_' + event.id,
          name: homeTeam.displayName || 'Home Team',
          nickname: homeTeam.name || homeTeam.nickname || 'Home',
          abbreviation: homeTeam.abbreviation || 'HOME',
          color: homeTeam.color ? `#${homeTeam.color}` : '#1e3a8a',
          alternateColor: homeTeam.alternateColor ? `#${homeTeam.alternateColor}` : '#ffffff',
          logo: homeTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${homeTeam.id}.png`,
          score: parseInt(homeComp.score || 0, 10),
          rank: homeRank,
          record: homeComp.records?.[0]?.summary || '0-0',
          conference: homeTeam.conferenceId || 'FBS'
        },
        awayTeam: {
          id: awayTeam.id || 'away_' + event.id,
          name: awayTeam.displayName || 'Away Team',
          nickname: awayTeam.name || awayTeam.nickname || 'Away',
          abbreviation: awayTeam.abbreviation || 'AWAY',
          color: awayTeam.color ? `#${awayTeam.color}` : '#991b1b',
          alternateColor: awayTeam.alternateColor ? `#${awayTeam.alternateColor}` : '#ffffff',
          logo: awayTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${awayTeam.id}.png`,
          score: parseInt(awayComp.score || 0, 10),
          rank: awayRank,
          record: awayComp.records?.[0]?.summary || '0-0',
          conference: awayTeam.conferenceId || 'FBS'
        },
        conferenceCompetition: comp.conferenceCompetition || false
      };
    });
  }

  async saveGamesToDb(games, year, week) {
    const statements = games.map(g => ({
      sql: `
        INSERT INTO games_cache (
          game_id, season_year, week_number, game_date, status, status_detail,
          home_team_id, home_team_name, home_team_rank, home_team_logo, home_team_score,
          away_team_id, away_team_name, away_team_rank, away_team_logo, away_team_score,
          winner_team_id, conference_competition, venue_name, broadcast, raw_json, last_synced
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
        )
        ON CONFLICT(game_id) DO UPDATE SET
          status = excluded.status,
          status_detail = excluded.status_detail,
          home_team_score = excluded.home_team_score,
          away_team_score = excluded.away_team_score,
          home_team_rank = excluded.home_team_rank,
          away_team_rank = excluded.away_team_rank,
          winner_team_id = excluded.winner_team_id,
          raw_json = excluded.raw_json,
          last_synced = CURRENT_TIMESTAMP
      `,
      args: [
        g.id, year, week, g.date, g.status, g.statusDetail,
        g.homeTeam.id, g.homeTeam.name, g.homeTeam.rank, g.homeTeam.logo, g.homeTeam.score,
        g.awayTeam.id, g.awayTeam.name, g.awayTeam.rank, g.awayTeam.logo, g.awayTeam.score,
        g.winnerId, g.conferenceCompetition ? 1 : 0, g.venue, g.broadcast, JSON.stringify(g)
      ]
    }));

    try {
      if (statements.length > 0) {
        await db.batch(statements);
      }
    } catch (e) {
      console.warn('Could not batch save games:', e.message);
    }
  }

  async getGamesFromDb(year, week) {
    const rows = await db.prepare(`
      SELECT * FROM games_cache 
      WHERE (season_year = ? OR season_year = ?) AND week_number = ?
      ORDER BY game_date ASC
    `).all(year, String(year), week);

    return rows.map(r => {
      if (r.raw_json) {
        try {
          return JSON.parse(r.raw_json);
        } catch (e) {}
      }
      return {
        id: r.game_id,
        seasonYear: r.season_year,
        weekNumber: r.week_number,
        date: r.game_date,
        status: r.status,
        statusDetail: r.status_detail,
        isFinal: r.status === 'STATUS_FINAL',
        isInProgress: r.status === 'STATUS_IN_PROGRESS',
        winnerId: r.winner_team_id,
        venue: r.venue_name,
        broadcast: r.broadcast,
        homeTeam: {
          id: r.home_team_id,
          name: r.home_team_name,
          rank: r.home_team_rank,
          logo: r.home_team_logo,
          score: r.home_team_score
        },
        awayTeam: {
          id: r.away_team_id,
          name: r.away_team_name,
          rank: r.away_team_rank,
          logo: r.away_team_logo,
          score: r.away_team_score
        }
      };
    });
  }

  async getRankings({ forceRefresh = false } = {}) {
    const cacheKey = 'cfb_rankings';
    const cached = this.memoryCache.get(cacheKey);

    // Dynamic cache expiration: 10 minutes on Mondays when AP releases, 30 mins otherwise
    const dayOfWeek = new Date().getDay(); // 1 = Monday
    const cacheDuration = dayOfWeek === 1 ? (10 * 60 * 1000) : (30 * 60 * 1000);

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < cacheDuration)) {
      return cached.data;
    }

    const url = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings';

    try {
      const data = await this.fetchJson(url);
      const normalizedRankings = this.normalizeRankings(data);

      await this.saveRankingsToDb(normalizedRankings);
      this.syncTeamRankings(normalizedRankings);

      this.memoryCache.set(cacheKey, { timestamp: Date.now(), data: normalizedRankings });
      return normalizedRankings;
    } catch (err) {
      console.warn(`[ESPN Rankings] Fetch failed (${err.message}). Using DB rankings.`);
      const dbRankings = await this.getRankingsFromDb();
      if (dbRankings && dbRankings.length > 0) {
        return dbRankings;
      }
      const fallback = this.generateFallbackRankings();
      await this.saveRankingsToDb(fallback);
      return fallback;
    }
  }

  syncTeamRankings(polls) {
    const apPoll = polls.find(p => p.name?.includes('AP') || p.type === 'ap') || polls[0];
    if (!apPoll || !apPoll.ranks) return;

    for (const r of apPoll.ranks) {
      const teamId = r.team?.id;
      const teamName = (r.team?.displayName || r.team?.name || '').toLowerCase();
      const match = TEAMS_2026.find(t => t.id === teamId || t.name.toLowerCase().includes(teamName) || teamName.includes(t.name.toLowerCase()));
      if (match) {
        match.ranking = r.rank;
      }
    }
  }

  async getStandingsMap() {
    const cacheKey = 'cfb_standings_map';
    const cached = this.memoryCache.get(cacheKey);

    const dayOfWeek = new Date().getDay();
    const cacheDuration = dayOfWeek === 1 ? (10 * 60 * 1000) : (30 * 60 * 1000);

    if (cached && (Date.now() - cached.timestamp < cacheDuration)) {
      return cached.data;
    }

    const recordsMap = new Map();

    try {
      const url = 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings';
      const data = await this.fetchJson(url);

      if (data && data.children) {
        for (const group of data.children) {
          if (group.standings && group.standings.entries) {
            for (const entry of group.standings.entries) {
              const espnId = String(entry.team?.id || '');
              const teamName = (entry.team?.displayName || entry.team?.name || '').toLowerCase();
              const overallStat = entry.stats?.find(s => s.name === 'overall' || s.type === 'total');
              const overallRecord = overallStat?.displayValue || '0-0';

              const confStat = entry.stats?.find(s => s.name === 'vs. Conf.' || s.type === 'vsconf');
              const confRecord = confStat?.displayValue || '0-0';

              const recordInfo = {
                overall: overallRecord,
                conference: confRecord,
                displayName: entry.team?.displayName || ''
              };

              if (espnId) recordsMap.set(espnId, recordInfo);
              if (teamName) recordsMap.set(teamName, recordInfo);
            }
          }
        }
      }

      this.memoryCache.set(cacheKey, { timestamp: Date.now(), data: recordsMap });
      return recordsMap;
    } catch (e) {
      console.warn('Standings fetch warning:', e.message);
      return recordsMap;
    }
  }

  normalizeRankings(data) {
    if (!data.rankings || !Array.isArray(data.rankings)) return [];

    return data.rankings.map(poll => ({
      name: poll.name || 'AP Top 25',
      type: poll.type || 'ap',
      headline: poll.headline || 'NCAA Football Rankings',
      ranks: (poll.ranks || []).map(r => {
        const team = r.team || {};
        let changeText = '0';
        let changeType = 'none';
        if (r.trend && r.trend !== '-') {
          changeText = r.trend;
          if (r.trend.startsWith('+') || r.trend.startsWith('▲')) changeType = 'up';
          else if (r.trend.startsWith('-') || r.trend.startsWith('▼')) changeType = 'down';
        } else if (r.previous && r.previous !== r.current) {
          const diff = r.previous - r.current;
          changeText = diff > 0 ? `+${diff}` : `${diff}`;
          changeType = diff > 0 ? 'up' : 'down';
        }

        return {
          rank: r.current,
          previousRank: r.previous || r.current,
          rankChange: changeText,
          changeType: changeType,
          points: r.points || 0,
          firstPlaceVotes: r.firstPlaceVotes || 0,
          record: r.recordSummary || '0-0',
          team: {
            id: team.id,
            name: team.name || team.nickname,
            nickname: team.nickname || team.name,
            displayName: team.displayName || team.name,
            abbreviation: team.abbreviation || '',
            color: team.color ? `#${team.color}` : '#1e3a8a',
            logo: team.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`
          }
        };
      })
    }));
  }

  async saveRankingsToDb(polls) {
    const statements = [];
    for (const p of polls) {
      for (const r of p.ranks || []) {
        statements.push({
          sql: `INSERT OR REPLACE INTO rankings_cache (
            poll_name, rank, team_id, team_name, team_nickname, logo_url, record, points, previous_rank, rank_change, headline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            p.name,
            r.rank,
            r.team?.id || '',
            r.team?.displayName || r.team?.name || '',
            r.team?.nickname || '',
            r.team?.logo || '',
            r.record || '0-0',
            r.points || 0,
            r.previousRank || r.rank,
            r.rankChange || '0',
            p.headline || ''
          ]
        });
      }
    }
    try {
      if (statements.length > 0) {
        await db.batch(statements);
      }
    } catch (e) {
      console.warn('Could not save rankings to db:', e.message);
    }
  }

  async getRankingsFromDb() {
    const rows = await db.prepare(`SELECT * FROM rankings_cache ORDER BY poll_name, rank ASC`).all();
    if (rows.length === 0) return null;

    const pollsMap = {};
    for (const r of rows) {
      if (!pollsMap[r.poll_name]) {
        pollsMap[r.poll_name] = {
          name: r.poll_name,
          headline: r.headline,
          ranks: []
        };
      }
      pollsMap[r.poll_name].ranks.push({
        rank: r.rank,
        previousRank: r.previous_rank,
        rankChange: r.rank_change,
        points: r.points,
        record: r.record,
        team: {
          id: r.team_id,
          name: r.team_name,
          nickname: r.team_nickname,
          displayName: r.team_name,
          logo: r.logo_url
        }
      });
    }

    return Object.values(pollsMap);
  }

  generateFallbackRankings() {
    const top25 = [
      { rank: 1, name: 'Ohio State Buckeyes', id: '194', record: '0-0', points: 1672, prev: 1, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png' },
      { rank: 2, name: 'Oregon Ducks', id: '2483', record: '0-0', points: 1597, prev: 2, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png' },
      { rank: 3, name: 'Georgia Bulldogs', id: '61', record: '0-0', points: 1513, prev: 3, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png' },
      { rank: 4, name: 'Notre Dame Fighting Irish', id: '87', record: '0-0', points: 1510, prev: 4, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png' },
      { rank: 5, name: 'Texas Longhorns', id: '251', record: '0-0', points: 1483, prev: 5, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png' },
      { rank: 6, name: 'Alabama Crimson Tide', id: '333', record: '0-0', points: 1398, prev: 6, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png' },
      { rank: 7, name: 'Penn State Nittany Lions', id: '213', record: '0-0', points: 1320, prev: 7, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/213.png' },
      { rank: 8, name: 'Miami Hurricanes', id: '2390', record: '0-0', points: 1250, prev: 8, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2390.png' },
      { rank: 9, name: 'Tennessee Volunteers', id: '2633', record: '0-0', points: 1195, prev: 9, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png' },
      { rank: 10, name: 'Indiana Hoosiers', id: '84', record: '0-0', points: 1120, prev: 10, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/84.png' },
      { rank: 11, name: 'Ole Miss Rebels', id: '145', record: '0-0', points: 1050, prev: 11, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/145.png' },
      { rank: 12, name: 'Clemson Tigers', id: '228', record: '0-0', points: 980, prev: 12, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png' },
      { rank: 13, name: 'Boise State Broncos', id: '68', record: '0-0', points: 910, prev: 13, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/68.png' },
      { rank: 14, name: 'Arizona State Sun Devils', id: '9', record: '0-0', points: 840, prev: 14, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/9.png' },
      { rank: 15, name: 'SMU Mustangs', id: '2567', record: '0-0', points: 770, prev: 15, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2567.png' },
      { rank: 16, name: 'Iowa State Cyclones', id: '66', record: '0-0', points: 700, prev: 16, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/66.png' },
      { rank: 17, name: 'BYU Cougars', id: '252', record: '0-0', points: 630, prev: 17, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/252.png' },
      { rank: 18, name: 'Colorado Buffaloes', id: '38', record: '0-0', points: 560, prev: 18, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/38.png' },
      { rank: 19, name: 'South Carolina Gamecocks', id: '2579', record: '0-0', points: 490, prev: 19, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2579.png' },
      { rank: 20, name: 'Texas A&M Aggies', id: '245', record: '0-0', points: 420, prev: 20, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png' },
      { rank: 21, name: 'Army Black Knights', id: '349', record: '0-0', points: 350, prev: 21, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/349.png' },
      { rank: 22, name: 'LSU Tigers', id: '99', record: '0-0', points: 280, prev: 22, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/99.png' },
      { rank: 23, name: 'Michigan Wolverines', id: '130', record: '0-0', points: 210, prev: 23, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/130.png' },
      { rank: 24, name: 'UNLV Rebels', id: '2439', record: '0-0', points: 140, prev: 24, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2439.png' },
      { rank: 25, name: 'Memphis Tigers', id: '235', record: '0-0', points: 95, prev: 25, logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/235.png' }
    ];

    return [{
      name: 'AP Top 25',
      headline: '2026 NCAA Football Rankings - AP Poll',
      ranks: top25.map(t => ({
        rank: t.rank,
        previousRank: t.prev,
        rankChange: '0',
        points: t.points,
        record: t.record,
        team: {
          id: t.id,
          name: t.name,
          displayName: t.name,
          logo: t.logo
        }
      }))
    }];
  }

  generateFallbackGames(year, week) {
    return [
      {
        id: '401628467',
        seasonYear: year,
        weekNumber: week,
        date: '2026-09-05T23:30:00Z',
        name: 'Georgia Bulldogs vs Clemson Tigers',
        shortName: 'CLEM vs UGA',
        status: 'STATUS_FINAL',
        statusDetail: 'Final',
        isFinal: true,
        isInProgress: false,
        winnerId: '61',
        broadcast: 'ABC',
        venue: 'Mercedes-Benz Stadium, Atlanta, GA',
        odds: 'UGA -13.5 O/U: 48.5',
        homeTeam: {
          id: '61',
          name: 'Georgia Bulldogs',
          nickname: 'Bulldogs',
          abbreviation: 'UGA',
          color: '#ba0c2f',
          logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png',
          score: 34,
          rank: 3,
          record: '1-0',
          conference: 'SEC'
        },
        awayTeam: {
          id: '228',
          name: 'Clemson Tigers',
          nickname: 'Tigers',
          abbreviation: 'CLEM',
          color: '#f56600',
          logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png',
          score: 3,
          rank: 12,
          record: '0-1',
          conference: 'ACC'
        }
      },
      {
        id: '401628468',
        seasonYear: year,
        weekNumber: week,
        date: '2026-09-05T20:00:00Z',
        name: 'Texas Longhorns at Michigan Wolverines',
        shortName: 'TEX @ MICH',
        status: 'STATUS_FINAL',
        statusDetail: 'Final',
        isFinal: true,
        isInProgress: false,
        winnerId: '251',
        broadcast: 'FOX',
        venue: 'Michigan Stadium, Ann Arbor, MI',
        odds: 'TEX -7.0 O/U: 42.0',
        homeTeam: {
          id: '130',
          name: 'Michigan Wolverines',
          nickname: 'Wolverines',
          abbreviation: 'MICH',
          color: '#00274c',
          logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/130.png',
          score: 12,
          rank: 23,
          record: '0-1',
          conference: 'BIGTEN'
        },
        awayTeam: {
          id: '251',
          name: 'Texas Longhorns',
          nickname: 'Longhorns',
          abbreviation: 'TEX',
          color: '#bf5700',
          logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png',
          score: 31,
          rank: 5,
          record: '1-0',
          conference: 'SEC'
        }
      },
      {
        id: '401628469',
        seasonYear: year,
        weekNumber: week,
        date: '2026-09-05T19:30:00Z',
        name: 'Notre Dame Fighting Irish at Texas A&M Aggies',
        shortName: 'ND @ TA&M',
        status: 'STATUS_FINAL',
        statusDetail: 'Final',
        isFinal: true,
        isInProgress: false,
        winnerId: '87',
        broadcast: 'ABC',
        venue: 'Kyle Field, College Station, TX',
        odds: 'TA&M -3.0 O/U: 47.0',
        homeTeam: {
          id: '245',
          name: 'Texas A&M Aggies',
          nickname: 'Aggies',
          abbreviation: 'TA&M',
          color: '#500000',
          logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png',
          score: 13,
          rank: 20,
          record: '0-1',
          conference: 'SEC'
        },
        awayTeam: {
          id: '87',
          name: 'Notre Dame Fighting Irish',
          nickname: 'Fighting Irish',
          abbreviation: 'ND',
          color: '#0c2340',
          logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png',
          score: 23,
          rank: 4,
          record: '1-0',
          conference: 'INDEPENDENTS'
        }
      }
    ];
  }
}

module.exports = new EspnService();

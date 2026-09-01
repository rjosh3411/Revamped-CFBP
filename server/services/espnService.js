const db = require('../db/database');

const CONFERENCE_GROUPS = {
  ALL: 80,         // All FBS
  TOP25: 80,       // FBS with curatedRank <= 25
  SEC: 8,          // Southeastern Conference
  BIGTEN: 5,       // Big Ten Conference
  ACC: 1,          // Atlantic Coast Conference
  BIG12: 4,        // Big 12 Conference
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

  async getScoreboard({ year = 2026, week = 1, seasonType = 2, conference = 'ALL', forceRefresh = false } = {}) {
    const confKey = conference.toUpperCase();
    const cacheKey = `scoreboard_${year}_w${week}_st${seasonType}_${confKey}`;
    const cached = this.memoryCache.get(cacheKey);

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
      return cached.data;
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
      console.warn(`[ESPN Service] Network fetch failed (${err.message}). Falling back to SQLite cache.`);
      let dbGames = this.getGamesFromDb(year, week);
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
      const fallbackGames = this.generateFallbackGames(year, week);
      this.saveGamesToDb(fallbackGames, year, week);
      let filteredFallback = fallbackGames;
      if (confKey !== 'ALL' && confKey !== 'TOP25') {
        filteredFallback = this.filterByConference(fallbackGames, confKey);
      }
      return {
        season: { year, type: seasonType },
        week: { number: week },
        games: filteredFallback,
        total: filteredFallback.length,
        fromLiveEspn: false,
        warning: 'Serving initialized schedule'
      };
    }
  }

  filterByConference(games, conferenceKey) {
    const teams = CONFERENCE_TEAMS[conferenceKey] || [];
    if (teams.length === 0) return games;

    return games.filter(g => {
      const homeName = (g.homeTeam?.name || '').toLowerCase();
      const awayName = (g.awayTeam?.name || '').toLowerCase();

      return teams.some(t => {
        const target = t.toLowerCase();
        return homeName.includes(target) || awayName.includes(target);
      });
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

  saveGamesToDb(games, year, week) {
    const upsertStmt = db.prepare(`
      INSERT INTO games_cache (
        game_id, season_year, week_number, game_date, status, status_detail,
        home_team_id, home_team_name, home_team_rank, home_team_logo, home_team_score,
        away_team_id, away_team_name, away_team_rank, away_team_logo, away_team_score,
        winner_team_id, conference_competition, venue_name, broadcast, raw_json, last_synced
      ) VALUES (
        @id, @seasonYear, @weekNumber, @date, @status, @statusDetail,
        @homeId, @homeName, @homeRank, @homeLogo, @homeScore,
        @awayId, @awayName, @awayRank, @awayLogo, @awayScore,
        @winnerId, @confComp, @venue, @broadcast, @rawJson, CURRENT_TIMESTAMP
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
    `);

    const transaction = db.transaction((gameList) => {
      for (const g of gameList) {
        upsertStmt.run({
          id: g.id,
          seasonYear: year,
          weekNumber: week,
          date: g.date,
          status: g.status,
          statusDetail: g.statusDetail,
          homeId: g.homeTeam.id,
          homeName: g.homeTeam.name,
          homeRank: g.homeTeam.rank,
          homeLogo: g.homeTeam.logo,
          homeScore: g.homeTeam.score,
          awayId: g.awayTeam.id,
          awayName: g.awayTeam.name,
          awayRank: g.awayTeam.rank,
          awayLogo: g.awayTeam.logo,
          awayScore: g.awayTeam.score,
          winnerId: g.winnerId,
          confComp: g.conferenceCompetition ? 1 : 0,
          venue: g.venue,
          broadcast: g.broadcast,
          rawJson: JSON.stringify(g)
        });
      }
    });

    transaction(games);
  }

  getGamesFromDb(year, week) {
    const rows = db.prepare(`
      SELECT * FROM games_cache 
      WHERE season_year = ? AND week_number = ?
      ORDER BY game_date ASC
    `).all(year, week);

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

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < 10 * 60 * 1000)) {
      return cached.data;
    }

    const url = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings';

    try {
      const data = await this.fetchJson(url);
      const normalizedRankings = this.normalizeRankings(data);

      this.saveRankingsToDb(normalizedRankings);

      this.memoryCache.set(cacheKey, { timestamp: Date.now(), data: normalizedRankings });
      return normalizedRankings;
    } catch (err) {
      console.warn(`[ESPN Rankings] Fetch failed (${err.message}). Using DB rankings.`);
      const dbRankings = this.getRankingsFromDb();
      if (dbRankings && dbRankings.length > 0) {
        return dbRankings;
      }
      const fallback = this.generateFallbackRankings();
      this.saveRankingsToDb(fallback);
      return fallback;
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

  saveRankingsToDb(polls) {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO rankings_cache (
        poll_name, rank, team_id, team_name, team_nickname, logo_url, record, points, previous_rank, rank_change, headline
      ) VALUES (
        @pollName, @rank, @teamId, @teamName, @teamNickname, @logoUrl, @record, @points, @prevRank, @rankChange, @headline
      )
    `);

    const transaction = db.transaction((pollList) => {
      for (const p of pollList) {
        for (const r of p.ranks || []) {
          insertStmt.run({
            pollName: p.name,
            rank: r.rank,
            teamId: r.team?.id || '',
            teamName: r.team?.displayName || r.team?.name || '',
            teamNickname: r.team?.nickname || '',
            logoUrl: r.team?.logo || '',
            record: r.record || '0-0',
            points: r.points || 0,
            prevRank: r.previousRank || r.rank,
            rankChange: r.rankChange || '0',
            headline: p.headline || ''
          });
        }
      }
    });

    transaction(polls);
  }

  getRankingsFromDb() {
    const rows = db.prepare(`SELECT * FROM rankings_cache ORDER BY poll_name, rank ASC`).all();
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

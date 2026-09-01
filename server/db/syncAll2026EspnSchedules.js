const db = require('./database');
const { TEAMS_2026 } = require('./teamsData');

// Create team_schedules table to store exact verified team-by-team schedules
db.exec(`
  CREATE TABLE IF NOT EXISTS team_schedules (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    season_year INTEGER NOT NULL DEFAULT 2026,
    week_number INTEGER NOT NULL,
    game_date DATETIME NOT NULL,
    is_home INTEGER NOT NULL,
    opponent_name TEXT NOT NULL,
    opponent_logo TEXT,
    opponent_rank INTEGER,
    venue_name TEXT,
    broadcast TEXT,
    status TEXT DEFAULT 'STATUS_SCHEDULED',
    status_detail TEXT DEFAULT 'Scheduled',
    team_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    raw_json TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, week_number)
  );

  CREATE INDEX IF NOT EXISTS idx_team_sched_team ON team_schedules(team_id);
`);

async function syncAll2026EspnSchedules() {
  console.log(`🏈 Fetching official 2026 schedules from ESPN for all ${TEAMS_2026.length} FBS teams...`);

  const insertGameStmt = db.prepare(`
    INSERT INTO games_cache (
      game_id, season_year, week_number, game_date, status, status_detail,
      home_team_id, home_team_name, home_team_rank, home_team_logo, home_team_score,
      away_team_id, away_team_name, away_team_rank, away_team_logo, away_team_score,
      winner_team_id, conference_competition, venue_name, broadcast, raw_json, last_synced
    ) VALUES (
      @id, 2026, @weekNumber, @date, @status, @statusDetail,
      @homeId, @homeName, @homeRank, @homeLogo, @homeScore,
      @awayId, @awayName, @awayRank, @awayLogo, @awayScore,
      @winnerId, @confComp, @venue, @broadcast, @rawJson, CURRENT_TIMESTAMP
    )
    ON CONFLICT(game_id) DO UPDATE SET
      week_number = excluded.week_number,
      game_date = excluded.game_date,
      home_team_name = excluded.home_team_name,
      away_team_name = excluded.away_team_name,
      home_team_logo = excluded.home_team_logo,
      away_team_logo = excluded.away_team_logo,
      home_team_rank = excluded.home_team_rank,
      away_team_rank = excluded.away_team_rank,
      venue_name = excluded.venue_name,
      raw_json = excluded.raw_json,
      last_synced = CURRENT_TIMESTAMP
  `);

  const insertScheduleStmt = db.prepare(`
    INSERT INTO team_schedules (
      id, team_id, game_id, season_year, week_number, game_date, is_home,
      opponent_name, opponent_logo, opponent_rank, venue_name, broadcast,
      status, status_detail, team_score, opponent_score, raw_json, updated_at
    ) VALUES (
      @id, @teamId, @gameId, 2026, @weekNumber, @gameDate, @isHome,
      @oppName, @oppLogo, @oppRank, @venue, @broadcast,
      @status, @statusDetail, @teamScore, @oppScore, @rawJson, CURRENT_TIMESTAMP
    )
    ON CONFLICT(team_id, week_number) DO UPDATE SET
      game_id = excluded.game_id,
      game_date = excluded.game_date,
      is_home = excluded.is_home,
      opponent_name = excluded.opponent_name,
      opponent_logo = excluded.opponent_logo,
      opponent_rank = excluded.opponent_rank,
      venue_name = excluded.venue_name,
      status = excluded.status,
      status_detail = excluded.status_detail,
      raw_json = excluded.raw_json,
      updated_at = CURRENT_TIMESTAMP
  `);

  let totalGamesProcessed = 0;
  let totalTeamsProcessed = 0;

  for (const team of TEAMS_2026) {
    if (!team.espnId) continue;

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${team.espnId}/schedule?season=2026`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
      });

      if (!res.ok) {
        console.warn(`[ESPN] HTTP ${res.status} for ${team.name}`);
        continue;
      }

      const data = await res.json();
      const events = data.events || [];
      if (events.length === 0) continue;

      const transaction = db.transaction((eventList) => {
        let weekIndex = 1;
        for (const ev of eventList) {
          const comp = ev.competitions?.[0] || {};
          const competitors = comp.competitors || [];
          const homeComp = competitors.find(c => c.homeAway === 'home') || {};
          const awayComp = competitors.find(c => c.homeAway === 'away') || {};

          const isHome = (homeComp.id == team.espnId || homeComp.team?.id == team.espnId);
          const currentComp = isHome ? homeComp : awayComp;
          const oppComp = isHome ? awayComp : homeComp;

          const oppTeam = oppComp.team || {};
          const oppName = oppTeam.displayName || oppTeam.name || 'Opponent';
          const oppLogo = oppTeam.logos?.[0]?.href || oppTeam.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${oppTeam.id || 7}.png`;
          const oppRank = (oppComp.curatedRank?.current && oppComp.curatedRank.current <= 25) ? oppComp.curatedRank.current : null;

          const weekNum = ev.week?.number || weekIndex;
          weekIndex++;

          const statusType = ev.status?.type?.name || 'STATUS_SCHEDULED';
          const statusDetail = ev.status?.type?.detail || ev.status?.type?.description || 'Scheduled';
          const isFinal = statusType === 'STATUS_FINAL';
          const venue = comp.venue?.fullName || 'College Stadium';
          const broadcast = comp.broadcasts?.[0]?.names?.[0] || 'ESPN/ABC';

          // Insert / update team_schedules
          insertScheduleStmt.run({
            id: `${team.id}_2026_w${weekNum}`,
            teamId: team.id,
            gameId: ev.id,
            weekNumber: weekNum,
            gameDate: ev.date || '2026-09-05T19:00Z',
            isHome: isHome ? 1 : 0,
            oppName,
            oppLogo,
            oppRank,
            venue,
            broadcast,
            status: statusType,
            statusDetail,
            teamScore: parseInt(currentComp.score || 0, 10),
            oppScore: parseInt(oppComp.score || 0, 10),
            rawJson: JSON.stringify(ev)
          });

          // Also insert / update games_cache
          insertGameStmt.run({
            id: ev.id,
            weekNumber: weekNum,
            date: ev.date || '2026-09-05T19:00Z',
            status: statusType,
            statusDetail,
            homeId: (homeComp.team?.id || 'home_' + ev.id),
            homeName: homeComp.team?.displayName || homeComp.team?.name || 'Home Team',
            homeRank: (homeComp.curatedRank?.current && homeComp.curatedRank.current <= 25) ? homeComp.curatedRank.current : null,
            homeLogo: homeComp.team?.logos?.[0]?.href || homeComp.team?.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${homeComp.team?.id || 7}.png`,
            homeScore: parseInt(homeComp.score || 0, 10),
            awayId: (awayComp.team?.id || 'away_' + ev.id),
            awayName: awayComp.team?.displayName || awayComp.team?.name || 'Away Team',
            awayRank: (awayComp.curatedRank?.current && awayComp.curatedRank.current <= 25) ? awayComp.curatedRank.current : null,
            awayLogo: awayComp.team?.logos?.[0]?.href || awayComp.team?.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${awayComp.team?.id || 7}.png`,
            awayScore: parseInt(awayComp.score || 0, 10),
            winnerId: isFinal ? (homeComp.winner ? homeComp.team?.id : awayComp.team?.id) : null,
            confComp: comp.conferenceCompetition ? 1 : 0,
            venue,
            broadcast,
            rawJson: JSON.stringify(ev)
          });

          totalGamesProcessed++;
        }
      });

      transaction(events);
      totalTeamsProcessed++;
      console.log(`✓ [${totalTeamsProcessed}/${TEAMS_2026.length}] Synced ${team.name} (${events.length} 2026 games)`);
    } catch (err) {
      console.error(`Error syncing schedule for ${team.name}:`, err.message);
    }
  }

  console.log(`🎉 Finished syncing official 2026 ESPN schedules! Processed ${totalTeamsProcessed} teams and ${totalGamesProcessed} games.`);
}

if (require.main === module) {
  syncAll2026EspnSchedules().then(() => process.exit(0));
}

module.exports = syncAll2026EspnSchedules;

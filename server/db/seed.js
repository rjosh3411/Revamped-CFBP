const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./database');
const espnService = require('../services/espnService');
const gradingService = require('../services/gradingService');

async function seedDatabase() {
  console.log('🏈 Seeding CFB Prediction Database...');

  // 1. Create realistic users
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const usersData = [
    {
      id: 'usr_coach_reed',
      email: 'josh@cfbpredictions.com',
      username: 'CoachReed',
      displayName: 'Josh "Coach" Reed',
      favoriteTeam: 'Georgia Bulldogs',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_sec_expert',
      email: 'sec.expert@cfb.com',
      username: 'SECGuru',
      displayName: 'Tyler "SEC Guru" Vance',
      favoriteTeam: 'Alabama Crimson Tide',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_bigten_boss',
      email: 'buckeye.mike@cfb.com',
      username: 'BuckeyeMike',
      displayName: 'Mike "Buckeye" Miller',
      favoriteTeam: 'Ohio State Buckeyes',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_texas_horns',
      email: 'sarah.longhorn@cfb.com',
      username: 'SarahHorns',
      displayName: 'Sarah "HookEm" Davis',
      favoriteTeam: 'Texas Longhorns',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_notredame_fan',
      email: 'notredame.dan@cfb.com',
      username: 'IrishDan',
      displayName: 'Dan O\'Connor',
      favoriteTeam: 'Notre Dame Fighting Irish',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    }
  ];

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, email, username, password_hash, display_name, favorite_team, avatar_url
    ) VALUES (
      @id, @email, @username, @passwordHash, @displayName, @favoriteTeam, @avatarUrl
    )
  `);

  for (const u of usersData) {
    insertUser.run({
      ...u,
      passwordHash
    });
  }
  console.log(`✅ Seeded ${usersData.length} users (password for all: "${password}")`);

  // 2. Create Prediction Parties
  const partiesData = [
    {
      id: 'pty_all_american',
      name: 'CFB All-American Championship Party',
      description: 'The premier weekly pick\'em league for Power 4, Group of 5 & Independents!',
      inviteCode: 'CFB-2026',
      creatorId: 'usr_coach_reed',
      conferenceFocus: 'ALL',
      icon: '🏆'
    },
    {
      id: 'pty_sec_powerhouse',
      name: 'SEC & Power 4 Gridiron Crew',
      description: 'Head to head predictions exclusively for SEC, Big Ten, ACC, Big 12 matchups.',
      inviteCode: 'SEC-892K',
      creatorId: 'usr_sec_expert',
      conferenceFocus: 'SEC',
      icon: '🏈'
    }
  ];

  const insertParty = db.prepare(`
    INSERT OR REPLACE INTO parties (
      id, name, description, invite_code, creator_id, conference_focus, icon
    ) VALUES (
      @id, @name, @description, @inviteCode, @creatorId, @conferenceFocus, @icon
    )
  `);

  for (const p of partiesData) {
    insertParty.run(p);
  }

  // 3. Add members to parties
  const insertMember = db.prepare(`
    INSERT OR REPLACE INTO party_members (id, party_id, user_id, role)
    VALUES (?, ?, ?, ?)
  `);

  for (const u of usersData) {
    insertMember.run('pm_' + u.id + '_all', 'pty_all_american', u.id, u.id === 'usr_coach_reed' ? 'owner' : 'member');
    insertMember.run('pm_' + u.id + '_sec', 'pty_sec_powerhouse', u.id, u.id === 'usr_sec_expert' ? 'owner' : 'member');
  }

  // 4. Fetch ESPN games to ensure games cache is filled
  console.log('📡 Syncing ESPN 2026 Schedule & AP Top 25 Rankings...');
  try {
    const scoreboard = await espnService.getScoreboard({ year: 2026, week: 1, forceRefresh: true });
    const rankings = await espnService.getRankings({ forceRefresh: true });
    console.log(`✅ Loaded ${scoreboard.games?.length || 0} Week 1 games and AP Poll rankings.`);

    // 5. Seed diverse predictions for party buddies to show agreement vs disagreement
    const games = scoreboard.games || [];
    if (games.length >= 4) {
      const g1 = games[0]; // e.g. Georgia vs Clemson
      const g2 = games[1]; // e.g. Texas vs Michigan
      const g3 = games[2]; // e.g. Notre Dame vs Texas A&M
      const g4 = games[3]; // e.g. LSU vs USC
      const g5 = games[4] || games[0];

      const seedPicks = [
        // Coach Reed (Current User)
        { userId: 'usr_coach_reed', gameId: g1.id, winnerId: g1.homeTeam.id, winnerName: g1.homeTeam.name, conf: 3 },
        { userId: 'usr_coach_reed', gameId: g2.id, winnerId: g2.awayTeam.id, winnerName: g2.awayTeam.name, conf: 2 },
        { userId: 'usr_coach_reed', gameId: g3.id, winnerId: g3.awayTeam.id, winnerName: g3.awayTeam.name, conf: 1 },
        { userId: 'usr_coach_reed', gameId: g4.id, winnerId: g4.awayTeam.id, winnerName: g4.awayTeam.name, conf: 2 },
        { userId: 'usr_coach_reed', gameId: g5.id, winnerId: g5.homeTeam.id, winnerName: g5.homeTeam.name, conf: 1 },

        // Tyler Vance (SEC Guru) - AGREES on g1, g2; DISAGREES on g3, g4
        { userId: 'usr_sec_expert', gameId: g1.id, winnerId: g1.homeTeam.id, winnerName: g1.homeTeam.name, conf: 3 }, // AGREED
        { userId: 'usr_sec_expert', gameId: g2.id, winnerId: g2.awayTeam.id, winnerName: g2.awayTeam.name, conf: 2 }, // AGREED
        { userId: 'usr_sec_expert', gameId: g3.id, winnerId: g3.homeTeam.id, winnerName: g3.homeTeam.name, conf: 2 }, // DISAGREED (Picks Texas A&M)
        { userId: 'usr_sec_expert', gameId: g4.id, winnerId: g4.homeTeam.id, winnerName: g4.homeTeam.name, conf: 3 }, // DISAGREED (Picks LSU)
        { userId: 'usr_sec_expert', gameId: g5.id, winnerId: g5.homeTeam.id, winnerName: g5.homeTeam.name, conf: 1 },

        // Mike Miller (BuckeyeMike)
        { userId: 'usr_bigten_boss', gameId: g1.id, winnerId: g1.homeTeam.id, winnerName: g1.homeTeam.name, conf: 2 },
        { userId: 'usr_bigten_boss', gameId: g2.id, winnerId: g2.homeTeam.id, winnerName: g2.homeTeam.name, conf: 3 }, // DISAGREED (Picks Michigan)
        { userId: 'usr_bigten_boss', gameId: g3.id, winnerId: g3.awayTeam.id, winnerName: g3.awayTeam.name, conf: 1 },
        { userId: 'usr_bigten_boss', gameId: g4.id, winnerId: g4.awayTeam.id, winnerName: g4.awayTeam.name, conf: 2 },

        // Sarah Davis
        { userId: 'usr_texas_horns', gameId: g1.id, winnerId: g1.awayTeam.id, winnerName: g1.awayTeam.name, conf: 1 },
        { userId: 'usr_texas_horns', gameId: g2.id, winnerId: g2.awayTeam.id, winnerName: g2.awayTeam.name, conf: 3 }, // Picks Texas!
        { userId: 'usr_texas_horns', gameId: g3.id, winnerId: g3.awayTeam.id, winnerName: g3.awayTeam.name, conf: 2 },
        { userId: 'usr_texas_horns', gameId: g4.id, winnerId: g4.awayTeam.id, winnerName: g4.awayTeam.name, conf: 1 },

        // Dan O'Connor
        { userId: 'usr_notredame_fan', gameId: g1.id, winnerId: g1.homeTeam.id, winnerName: g1.homeTeam.name, conf: 2 },
        { userId: 'usr_notredame_fan', gameId: g2.id, winnerId: g2.awayTeam.id, winnerName: g2.awayTeam.name, conf: 1 },
        { userId: 'usr_notredame_fan', gameId: g3.id, winnerId: g3.awayTeam.id, winnerName: g3.awayTeam.name, conf: 3 }, // Picks Notre Dame!
        { userId: 'usr_notredame_fan', gameId: g4.id, winnerId: g4.homeTeam.id, winnerName: g4.homeTeam.name, conf: 1 }
      ];

      const insertPick = db.prepare(`
        INSERT OR REPLACE INTO picks (
          id, user_id, game_id, season_year, week_number, predicted_winner_id, predicted_winner_name,
          confidence_points, is_correct, points_awarded
        ) VALUES (
          ?, ?, ?, 2026, 1, ?, ?, ?, NULL, 0
        )
      `);

      for (const p of seedPicks) {
        insertPick.run(
          'pk_' + crypto.randomBytes(6).toString('hex'),
          p.userId,
          p.gameId,
          p.winnerId,
          p.winnerName,
          p.conf
        );
      }
      console.log(`✅ Seeded ${seedPicks.length} predictions across party members.`);

      // 6. Grade picks and calculate scores
      const gradeRes = await gradingService.gradeWeekPicks(2026, 1);
      console.log(`✅ Pick grading completed: ${gradeRes.gradedCount} picks graded.`);
    }

    // 7. Seed Party Messages
    const insertMsg = db.prepare(`
      INSERT OR REPLACE INTO party_messages (id, party_id, user_id, message, type, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', ?))
    `);

    insertMsg.run('msg_1', 'pty_all_american', 'usr_coach_reed', 'Welcome everyone to the 2026 College Football Season! Don\'t forget to lock in your Week 1 picks!', 'chat', '-3 hours');
    insertMsg.run('msg_2', 'pty_all_american', 'usr_sec_expert', 'Georgia looking dangerous, but don\'t sleep on Alabama this year. Ready for Week 1!', 'chat', '-2 hours');
    insertMsg.run('msg_3', 'pty_all_american', 'usr_texas_horns', 'Texas is taking the SEC by storm! Check our buddy comparison matrix for the Texas game.', 'chat', '-1 hour');
    insertMsg.run('msg_4', 'pty_all_american', 'usr_bigten_boss', 'Big Ten has 4 teams in the top 10. Let\'s go Buckeyes!', 'chat', '-30 minutes');

  } catch (err) {
    console.error('Seed ESPN error:', err);
  }

  console.log('🎉 Database seeding complete!');
}

if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}

module.exports = seedDatabase;

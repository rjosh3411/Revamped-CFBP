const { TEAMS_2026 } = require('../db/teamsData');

// Map team rank/prestige to approximate power rating
const teamLookup = new Map();
TEAMS_2026.forEach(t => {
  teamLookup.set(t.id.toLowerCase(), t);
  teamLookup.set(t.name.toLowerCase(), t);
  teamLookup.set(t.abbreviation.toLowerCase(), t);
});

function getTeamPowerRating(teamName, rank) {
  const t = teamLookup.get((teamName || '').toLowerCase().trim());
  let power = 75; // baseline average FBS rating

  if (rank && rank > 0 && rank <= 25) {
    // Top 25 teams range from 88 to 100 power
    power = 100 - (rank - 1) * 0.5;
  } else if (t) {
    if (t.conference === 'SEC') power = 84;
    else if (t.conference === 'Big Ten') power = 83;
    else if (t.conference === 'ACC') power = 80;
    else if (t.conference === 'Big 12') power = 79;
    else if (t.conference === 'Group of 5') power = 72;
    else if (t.conference === 'Independents') {
      power = t.id === 'notre-dame' ? 92 : 72;
    }
  } else {
    // Unrecognized or FCS opponent
    power = 60;
  }

  return power;
}

function calculateBettingLine({ homeTeamName, homeRank, awayTeamName, awayRank, isHome = true }) {
  const homePower = getTeamPowerRating(homeTeamName, homeRank);
  const awayPower = getTeamPowerRating(awayTeamName, awayRank);

  // Home field advantage in college football: ~3.0 points
  const homeAdvantage = 3.0;
  const rawSpread = (awayPower - (homePower + homeAdvantage));

  // Round to nearest 0.5 points
  let roundedSpread = Math.round(rawSpread * 2) / 2;
  if (roundedSpread === 0) roundedSpread = -1.5;

  let spreadFormatted = '';
  let favoriteName = '';
  let underdogName = '';
  let favoriteSpread = 0;

  if (roundedSpread < 0) {
    // Home team is favorite
    favoriteName = homeTeamName;
    underdogName = awayTeamName;
    favoriteSpread = roundedSpread;
    spreadFormatted = `${homeTeamName.split(' ')[0]} ${roundedSpread}`;
  } else {
    // Away team is favorite
    favoriteName = awayTeamName;
    underdogName = homeTeamName;
    favoriteSpread = -roundedSpread;
    spreadFormatted = `${awayTeamName.split(' ')[0]} -${roundedSpread}`;
  }

  // Calculate Over/Under total based on offensive pace
  const avgPower = (homePower + awayPower) / 2;
  let rawOU = 46.5 + (avgPower - 75) * 0.35;
  let overUnder = Math.round(rawOU * 2) / 2;
  if (overUnder < 41.5) overUnder = 41.5;
  if (overUnder > 64.5) overUnder = 64.5;

  // Moneyline calculation
  const absSpread = Math.abs(favoriteSpread);
  let favML = -110;
  let dogML = +100;

  if (absSpread <= 3) {
    favML = Math.round(-110 - (absSpread * 25));
    dogML = Math.round(+100 + (absSpread * 20));
  } else if (absSpread <= 7) {
    favML = Math.round(-200 - ((absSpread - 3) * 35));
    dogML = Math.round(+170 + ((absSpread - 3) * 30));
  } else if (absSpread <= 14) {
    favML = Math.round(-380 - ((absSpread - 7) * 55));
    dogML = Math.round(+310 + ((absSpread - 7) * 45));
  } else {
    favML = Math.round(-800 - ((absSpread - 14) * 100));
    dogML = Math.round(+650 + ((absSpread - 14) * 80));
  }

  return {
    spreadText: spreadFormatted,
    spread: favoriteSpread,
    favorite: favoriteName,
    underdog: underdogName,
    overUnder: overUnder,
    overUnderText: `O/U ${overUnder}`,
    moneylineFav: `${favML}`,
    moneylineDog: `+${dogML}`,
    fullLine: `${spreadFormatted} | O/U ${overUnder}`
  };
}

module.exports = {
  calculateBettingLine,
  getTeamPowerRating
};

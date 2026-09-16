export function getCurrentSeasonWeek(date = new Date()) {
  const month = date.getMonth(); // 0-indexed (0 = Jan, 7 = Aug, 8 = Sep, 9 = Oct, 10 = Nov, 11 = Dec)
  const day = date.getDate();

  // January (Playoff Semis / National Championship)
  if (month === 0) {
    if (day <= 5) return 17;
    return 18;
  }

  // February - July (Off-season -> default to upcoming season Week 1 or Week 0)
  if (month >= 1 && month <= 6) {
    return 1;
  }

  // August
  if (month === 7) {
    return day >= 22 ? 0 : 0;
  }

  // September
  if (month === 8) {
    if (day <= 8) return 1;
    if (day <= 15) return 2;
    if (day <= 22) return 3;
    if (day <= 29) return 4;
    return 5;
  }

  // October
  if (month === 9) {
    if (day <= 6) return 5;
    if (day <= 13) return 6;
    if (day <= 20) return 7;
    if (day <= 27) return 8;
    return 9;
  }

  // November
  if (month === 10) {
    if (day <= 3) return 9;
    if (day <= 10) return 10;
    if (day <= 17) return 11;
    if (day <= 24) return 12;
    return 13;
  }

  // December
  if (month === 11) {
    if (day <= 6) return 14;
    if (day <= 13) return 15;
    if (day <= 25) return 16;
    return 17;
  }

  return 1;
}

/**
 * Official College Football Stadium Aerial Background Registry
 * Maps each FBS team to their official on-campus stadium aerial background image
 */

export const STADIUM_REGISTRY = {
  // SEC
  'georgia': {
    name: 'Sanford Stadium',
    location: 'Athens, GA',
    capacity: '92,746',
    image: '/stadiums/georgia.jpg'
  }
};

/**
 * Get stadium aerial background image and metadata for a team
 */
export function getStadiumForTeam(team) {
  if (!team) return null;
  const tid = team.id?.toLowerCase() || '';
  return STADIUM_REGISTRY[tid] || null;
}

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
  },
  'texas': {
    name: 'Darrell K Royal–Texas Memorial Stadium',
    location: 'Austin, TX',
    capacity: '100,119',
    image: '/stadiums/texas.jpg'
  },
  'florida': {
    name: 'Ben Hill Griffin Stadium (The Swamp)',
    location: 'Gainesville, FL',
    capacity: '88,548',
    image: '/stadiums/florida.jpg'
  },
  'texas-am': {
    name: 'Kyle Field',
    location: 'College Station, TX',
    capacity: '102,733',
    image: '/stadiums/texas-am.jpg'
  },
  'oklahoma': {
    name: 'Gaylord Family Oklahoma Memorial Stadium',
    location: 'Norman, OK',
    capacity: '80,126',
    image: '/stadiums/oklahoma.jpg'
  },
  'arkansas': {
    name: 'Donald W. Reynolds Razorback Stadium',
    location: 'Fayetteville, AR',
    capacity: '76,412',
    image: '/stadiums/arkansas.jpg'
  },
  'missouri': {
    name: 'Faurot Field at Memorial Stadium',
    location: 'Columbia, MO',
    capacity: '62,621',
    image: '/stadiums/missouri.jpg'
  },
  'kentucky': {
    name: 'Kroger Field',
    location: 'Lexington, KY',
    capacity: '61,000',
    image: '/stadiums/kentucky.jpg'
  },
  'mississippi-state': {
    name: 'Davis Wade Stadium',
    location: 'Starkville, MS',
    capacity: '60,311',
    image: '/stadiums/mississippi-state.jpg'
  },
  'vanderbilt': {
    name: 'FirstBank Stadium',
    location: 'Nashville, TN',
    capacity: '28,500',
    image: '/stadiums/vanderbilt.jpg'
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

const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('cfb_jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Authentication
  login: (login, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password })
  }),
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getDemoUsers: () => request('/auth/demo-users'),
  switchDemoUser: (userId) => request('/auth/switch-demo', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),

  // Teams & Conferences
  getTeams: (conference = 'ALL') =>
    request(`/teams?conference=${encodeURIComponent(conference)}`),
  getTeamSchedule: (teamId) =>
    request(`/teams/${encodeURIComponent(teamId)}/schedule`),

  // Games & Schedules
  getGames: ({ year = 2026, week = 1, conference = 'ALL', refresh = false } = {}) => 
    request(`/games?year=${year}&week=${week}&conference=${encodeURIComponent(conference)}&refresh=${refresh}`),
  getLiveTracker: () => request('/games/live-tracker'),
  syncEspn: ({ year = 2026, week = 1 } = {}) =>
    request('/games/sync', {
      method: 'POST',
      body: JSON.stringify({ year, week })
    }),

  // Picks
  submitPick: (pickData) => request('/picks', {
    method: 'POST',
    body: JSON.stringify(pickData)
  }),
  savePick: (pickData) => request('/picks', {
    method: 'POST',
    body: JSON.stringify(pickData)
  }),
  bulkSubmitPicks: (picks) => request('/picks/bulk', {
    method: 'POST',
    body: JSON.stringify({ picks })
  }),
  getMyPicks: ({ year = 2026, week = 1 } = {}) =>
    request(`/picks/my-picks?year=${year}&week=${week}`),
  getMyStats: ({ year = 2026 } = {}) =>
    request(`/picks/my-stats?year=${year}`),

  // Prediction Parties
  getMyParties: () => request('/parties/my-parties'),
  createParty: (partyData) => request('/parties/create', {
    method: 'POST',
    body: JSON.stringify(partyData)
  }),
  joinParty: (inviteCode) => request('/parties/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode })
  }),
  leaveParty: (partyId) => request(`/parties/${encodeURIComponent(partyId)}/leave`, {
    method: 'POST'
  }),
  getPartyDetails: (partyId) => request(`/parties/${partyId}`),
  getPartyMessages: (partyId) => request(`/parties/${partyId}/messages`),
  sendPartyMessage: (partyId, message, type = 'chat') => request(`/parties/${partyId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message, type })
  }),
  syncPartyPicks: (partyId) => request(`/parties/${encodeURIComponent(partyId)}/sync-picks`, {
    method: 'POST'
  }),

  // Buddy Comparison
  getBuddyComparison: (partyId, { year = 2026, week = 1, buddyId } = {}) => {
    let query = `/comparison/party/${partyId}?year=${year}&week=${week}`;
    if (buddyId) query += `&buddyId=${encodeURIComponent(buddyId)}`;
    return request(query);
  },

  // Rankings & Polls
  getRankings: (refresh = false) => request(`/rankings?refresh=${refresh}`)
};

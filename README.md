# 🏈 CFB Prediction Party (Revamped College Football Predictions App)

A full-featured, social College Football Predictions platform built with **React**, **Tailwind CSS**, **Node.js/Express**, and a **persistent SQLite database (WAL mode)**, featuring live ESPN synchronization.

---

## 🌟 Key Features

1. **Prediction Parties & Leagues**:
   - Create private or public prediction parties with custom names, conference focus, and icons.
   - Generate unique 6-character party invite codes (e.g. `SEC-892K`, `CFB-2026`).
   - 1-click invite code copying for sharing with friends and peers.
   - Live party standings leaderboard, win rates, points, and trash talk chat feed.

2. **Head-to-Head Buddy Comparison Matrix**:
   - Compare your game-by-game predictions side-by-side with any peer in your party.
   - **🟢 Agreed Picks**: Clear visual consensus badges when both of you pick the same winner.
   - **🟠 Disagreed / Split Picks**: High-stakes rivalry matchup badges when your picks clash.
   - Live outcome indicators (🏆 You Won, ❌ Buddy Won, 🤝 Both Correct, 💀 Both Missed, ⏳ Pending).
   - Agreement rate percentage meter and point differential tracking.

3. **Complete Power 4, Group of 5 & Independents Coverage**:
   - **Power 4**: SEC (16 teams), Big Ten (18 teams), ACC (17 teams), Big 12 (16 teams).
   - **Group of 5**: AAC, Mountain West, Sun Belt, MAC, Conference USA.
   - **Independents & Pac-12**: Notre Dame, UConn, UMass, Oregon State, Washington State.
   - **AP Top 25 Matchups filter** and full conference pill filters.
   - Full 18-week schedule support (Week 1 through CCG, Bowl Season, and CFP 12-Team Playoffs).

4. **Live ESPN Synchronization & AP Poll Rankings**:
   - Live ESPN Scoreboard integration pulling real 2026 NCAA football schedules, scores, quarters, and venues.
   - High-definition official school logos from ESPN CDN.
   - **AP Poll Rank badges** (`#1`, `#2`, ... `#25`) displayed directly beside ranked team logos.
   - Dedicated **AP Top 25 & AFCA Coaches Poll** standings section with records, points, and trend movement (▲, ▼).
   - Real-time pick evaluation: Final scores automatically grade picks (Correct/Missed) and award points.

5. **Permanent Account Storage & Onboarding**:
   - Email registration and login with secure PBKDF2/bcrypt password hashing and JWT tokens.
   - SQLite WAL database ensures **user accounts and weekly predictions are never forgotten or lost** across reloads, restarts, or browser closing.
   - Instant Demo User Switcher to test multi-user party dynamics and buddy comparisons with one click.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
npm install --prefix client
```

### 2. Seed Database (Optional - Pre-populated with 2026 games & buddy test parties)
```bash
npm run seed
```

### 3. Start Development Server
```bash
# Runs backend on port 5001 and Vite frontend on port 5173 with proxy
npm run dev
```

### 4. Or Run Full Production App
```bash
npm run build
npm start
```
Then open your browser to **http://localhost:5001**

---

## 📁 Project Structure

```
├── client/                     # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation, live ESPN status & profile switcher
│   │   │   ├── GameCard.jsx         # Pick cards with team logos, AP ranks & odds
│   │   │   ├── BuddyComparison.jsx  # Head-to-Head agreed vs split matrix
│   │   │   ├── PartyHub.jsx         # Prediction parties, invite codes & leaderboards
│   │   │   ├── RankingsView.jsx     # Live AP Top 25 & Coaches Poll
│   │   │   ├── ConferenceFilter.jsx # Power 4, G5 & Top 25 pills
│   │   │   ├── WeekSelector.jsx     # 18-week season navigator
│   │   │   └── AuthModal.jsx        # Email sign-in / registration onboarding
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Persistent session management
│   │   └── utils/
│   │       └── api.js               # API client
├── server/                     # Node.js & Express API Backend
│   ├── db/
│   │   ├── database.js              # SQLite connection (WAL mode)
│   │   └── seed.js                  # Seed realistic parties & picks
│   ├── services/
│   │   ├── espnService.js           # ESPN API Scoreboard, Rankings & Conferences
│   │   └── gradingService.js        # Pick outcome evaluation & leaderboard scoring
│   ├── routes/
│   │   ├── auth.js                  # User registration, login, profile & demo switch
│   │   ├── games.js                 # Weekly games, conference filter & ESPN sync
│   │   ├── picks.js                 # Prediction locking & submission
│   │   ├── parties.js               # Party creation, invite codes & leaderboards
│   │   ├── comparison.js            # Buddy agreed/disagreed analytics
│   │   └── rankings.js              # AP Top 25 poll cache
│   └── index.js                     # Express server & static build host
└── package.json
```

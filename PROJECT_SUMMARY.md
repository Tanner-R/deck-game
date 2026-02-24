# 🃏 Deck Game — Project Summary & Documentation

## Project Overview

**Deck Game** is a web application built to track a gamified group fitness challenge. The concept turns working out into a card-game-based competition where participants earn points through daily workouts, with bonus points available by matching workouts to weekly playing card draws.

The app was designed, built, and deployed as a full-stack project using **React** (Vite), **Supabase** (PostgreSQL backend), and **Vercel** (hosting). It's mobile-friendly and meant to be used primarily from a phone for quick workout logging.

---

## The Game Rules

**Goal:** Reach 100 points as a team by the end of each month.

**Weekly Cards:**
- 7 playing cards are drawn from a real deck each week
- Cards apply to everyone, but each card can only be claimed (cashed in) once per week

**Card Suit Meanings:**
- ♠ Spades = Strength workout
- ♥ Hearts = Cardio or movement
- ♣ Clubs = Wild (any activity)
- ♦ Diamonds = Group or social workout/activity

**Bonus Points by Card Value:**
- 2–5 = +1 bonus point
- 6–10 = +2 bonus points
- Jack, Queen, King = +3 bonus points
- Ace = +5 bonus points

**Scoring:**
- Any workout or intentional movement = 1 base point per person
- If the workout matches a card's suit category, the person can claim that card for bonus points
- One point claim per person per day
- Each card can only be claimed once per week

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | UI framework and build tool |
| Styling | Custom CSS (DM Sans + Playfair Display fonts) | Dark theme card-game aesthetic |
| Charts | Recharts | Line charts, bar charts for progress visualization |
| Backend/Database | Supabase (PostgreSQL) | Data storage, REST API |
| Hosting | Vercel | Free-tier deployment with auto-deploy from GitHub |
| Version Control | Git + GitHub | Source control and CI/CD pipeline to Vercel |

---

## Database Schema (Supabase)

### Table: `people`
Stores the roster of participants.

| Column | Type | Notes |
|--------|------|-------|
| id | int8 | Primary key, auto-increment |
| name | text | Player name |
| created_at | timestamptz | Auto-timestamp |

### Table: `weekly_cards`
Stores the 7 cards drawn each week and their claim status.

| Column | Type | Notes |
|--------|------|-------|
| id | int8 | Primary key, auto-increment |
| week_start_date | date | Monday of that week |
| card_name | text | e.g., "Ace of Diamonds" |
| suit | text | Spades, Hearts, Clubs, or Diamonds |
| value | text | 2–10, J, Q, K, or A |
| bonus_points | int4 | 1, 2, 3, or 5 |
| claimed_by | text | Person who claimed it (nullable) |
| status | text | "Available" or "Claimed" |

### Table: `workouts`
Stores every logged workout entry.

| Column | Type | Notes |
|--------|------|-------|
| id | int8 | Primary key, auto-increment |
| date | date | Workout date |
| persons | text | Comma-separated names |
| activity | text | Description of the workout |
| num_people | int4 | Count of participants |
| card_used | text | Card name if used (nullable) |
| bonus_points | int4 | Bonus from card (default 0) |
| total_points | int4 | Base + bonus points |
| notes | text | Optional notes (nullable) |
| created_at | timestamptz | Auto-timestamp |

**Note:** Row Level Security (RLS) is disabled on all tables since the app uses the Supabase anon key without user authentication. This is fine for a private/friends-only app.

---

## App Features

### 📊 Dashboard
- **Goal progress bar** — visual progress toward 100 monthly points with percentage and days remaining
- **Quick stats** — total workouts logged, cards available this week, number of players
- **Leaderboard** — ranked list with bar visualization showing each person's contribution
- **Cumulative points chart** — line chart tracking point accumulation over the month
- **Suit usage chart** — bar chart showing which card suit categories are being used most

### 🃏 Weekly Cards
- **Manual card picker** — select the value (2–A) and suit to match what was drawn from the real deck
- **Live card preview** — see the card rendered before adding
- **7-card limit** — counter shows progress (e.g., "4/7 Cards Set")
- **Claim/unclaim** — tap a card to assign it to a player, with a person selector modal
- **Remove individual cards** — fix mistakes with per-card delete
- **Clear all** — reset the entire week's cards
- **Duplicate protection** — prevents adding the same card twice in one week
- **Suit legend** — always visible reminder of what each suit means

### 💪 Log Workout
- **People selector** — chip-style toggles to select who participated
- **Activity description** — free text for what the workout was
- **Card selection** — shows only available (unclaimed) cards for the current week
- **Points preview** — live calculation showing base points + card bonus before submitting
- **Auto card claiming** — when a workout is logged with a card, the card is automatically marked as claimed
- **Success feedback** — toast notification on successful log

### 📋 History
- **Chronological list** — all workouts sorted newest first
- **Entry details** — date, participants, activity, card used (with suit color), notes
- **Delete with confirmation** — hover to reveal delete button, with a confirm step to prevent accidents

### ⚙️ Settings (Gear Icon)
- **Add/remove players** — manage the participant roster from the header

---

## Project Structure

```
deck-game/
├── index.html          # Entry point with mobile viewport meta tags
├── package.json        # Dependencies and build scripts
├── vite.config.js      # Vite configuration
├── vercel.json         # Vercel deployment config
├── .gitignore          # Excludes node_modules, dist, .env
├── README.md           # Quick start guide
├── PROJECT_SUMMARY.md  # This document
└── src/
    ├── main.jsx        # React mount point
    ├── App.jsx         # All components (single-file app)
    └── index.css       # All styles
```

---

## Design Decisions

**Single-file architecture:** All React components live in `App.jsx`. For a project this size with a single developer, this keeps things simple and avoids over-engineering. Components can be split into separate files later if needed.

**Dark theme with card-game aesthetic:** The UI uses a deep navy/slate color palette with amber/gold accents, inspired by classic card tables. Typography pairs Playfair Display (serif, for headers) with DM Sans (sans-serif, for body text).

**Mobile-first:** The bottom tab navigation, chip selectors, and card grid are all designed for thumb-friendly mobile use since the primary use case is logging workouts on the go.

**Manual card entry over random generation:** The original version had a random card draw feature, but since the game uses a real physical deck, the card picker was redesigned to let the user input the actual cards drawn in real life.

**No authentication:** Since this is a private group app managed by one person (Tanner), auth was intentionally skipped to keep things simple. Supabase RLS is disabled and the anon key is used directly.

---

## Development Timeline

1. **Concept & game rules** — Designed the Deck Game challenge format with card suits mapped to workout categories and a point-based scoring system
2. **Google Sheets prototype** — Built an initial tracker in Google Sheets with formulas, charts, conditional formatting, and data validation dropdowns
3. **Supabase setup** — Created the PostgreSQL database with three tables (`people`, `weekly_cards`, `workouts`)
4. **React app development** — Built the full frontend with dashboard, card management, workout logging, and history views
5. **Vercel deployment** — Connected GitHub repo to Vercel for automatic deployments
6. **Bug fixes** — Fixed Supabase anon key typo causing 401 errors, resolved paused project issues
7. **Feature update** — Replaced random card draw with manual card picker to match real-deck usage

---

## How to Run Locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## How to Deploy

Push to the connected GitHub repo — Vercel automatically rebuilds and deploys:

```bash
git add .
git commit -m "your message"
git push
```

---

## Future Improvements (Ideas)

- Monthly archive view to compare performance across months
- Streak tracking (consecutive days with workouts)
- Individual player stats pages
- Push notifications or reminders
- Photo proof uploads for workouts
- Card draw history across weeks
- Export data to CSV
- PWA support for home screen install

# 🃏 Deck Game - Workout Challenge Tracker

A web app for tracking your group's Deck Game workout challenge, powered by Supabase and deployed on Vercel.

## Features
- **Dashboard** - Team progress toward 100 points, leaderboard, charts
- **Weekly Cards** - Draw 7 random playing cards, claim them when workouts match
- **Log Workouts** - Quick logging with person selection, card claiming, and auto-scoring
- **History** - Full workout log with search and delete capability
- **Player Management** - Add/remove players from settings

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

## Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Import Project" → select this repo
4. Vercel auto-detects Vite — just click Deploy
5. Done! Your app is live.

## Supabase Setup
The app connects to your existing Supabase project. Tables required:
- `workouts` - workout log entries
- `weekly_cards` - weekly card draws
- `people` - player roster

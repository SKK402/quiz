---
description: How to set up and run the Trivia Encyclopedia with Supabase auth and data sync
---

# Trivia Encyclopedia — Full Setup & Run Workflow

## 1. Install Dependencies
// turbo
```bash
cd C:\Users\somku\Downloads\nothing-to-watch-main\trivia-encyclopedia
npm install
```

## 2. Supabase Database Setup

Go to your **Supabase Dashboard** → **SQL Editor** and run this SQL:

```sql
-- ==========================================
-- TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fact_title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fact_title)
);

CREATE TABLE IF NOT EXISTS progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id TEXT NOT NULL,
  fact_title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, fact_title)
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  pct INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  category TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Favorites: users can only CRUD their own
CREATE POLICY "Users manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Progress: users can only CRUD their own
CREATE POLICY "Users manage own progress"
  ON progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Leaderboard: users can insert/update their own
CREATE POLICY "Users manage own leaderboard"
  ON leaderboard FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Leaderboard: anyone authenticated can READ all (global leaderboard)
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  TO authenticated
  USING (true);
```

## 3. Google OAuth Setup

### 3a. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or select a project
3. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**
4. Choose **Web Application**
5. Add these **Authorized redirect URIs**:
   - `https://ntmbqgvlqongaetzpeyv.supabase.co/auth/v1/callback`
6. Copy the **Client ID** and **Client Secret**

### 3b. Supabase Dashboard
1. Go to **Authentication** → **Providers** → **Google**
2. Toggle **Enable** ON
3. Paste the **Client ID** and **Client Secret** from Google Cloud
4. Save

### 3c. Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add your dev URL to **Redirect URLs**: `http://localhost:3001`
3. For production, add your deployed URL too

## 4. Run the Dev Server
// turbo
```bash
cd C:\Users\somku\Downloads\nothing-to-watch-main\trivia-encyclopedia
npm run dev
```
The app runs at **http://localhost:3001**

## 5. Test the App

### Auth Flow
1. Click **"Sign In"** button (top-right navbar)
2. Google OAuth popup appears → sign in with Google
3. You're redirected back, navbar shows your name + avatar
4. Click the logout icon (red door) to sign out

### Favorites
1. Open any category → click a fact card
2. Click the ❤️ **Favorite** button
3. If not signed in → toast: "Sign in to save favorites!"
4. If signed in → fact is saved to Supabase

### Quiz
1. Click **Quiz** in navbar
2. Choose difficulty (Easy=20s, Medium=40s, Hard=60s)
3. Choose category and question count
4. Click **Start Quiz**
5. Use 💡 **Hint** to reveal category (reduces points: 5→2)
6. Build streaks: 🔥 On Fire (3+), 💎 Unstoppable (5+)
7. Results show total points and **Global Leaderboard** (all users)

### Progress Tracking
1. Open a category → click on fact cards
2. Progress bar on landing page updates as you read facts
3. Progress is synced to Supabase per user

## 6. Project Structure

```
trivia-encyclopedia/
├── index.html          ← Main HTML (auth UI in navbar)
├── main.js             ← App logic, Supabase data layer
├── quiz.js             ← Quiz engine (points, hints, streaks)
├── supabase.js         ← Supabase client init
├── auth.js             ← Google OAuth + session management
├── styles.css          ← All styles including auth + quiz UI
├── webgl-bg.js         ← WebGL background
├── categories-data.js  ← Category definitions
├── categories-phase4.js
├── facts-expansion-*.js ← Expanded fact data
├── package.json
└── vite.config.js
```

## 7. Key Config Values

| Key | Value |
|---|---|
| Supabase URL | `https://ntmbqgvlqongaetzpeyv.supabase.co` |
| Supabase Anon Key | In `supabase.js` |
| Dev Server Port | 3001 |
| Auth Provider | Google OAuth |

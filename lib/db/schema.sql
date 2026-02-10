-- ============================================================================
-- POOL COMPETITIE DATABASE SCHEMA
-- ============================================================================

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Jesse en Flip
INSERT INTO players (name) VALUES ('Jesse'), ('Flip')
ON CONFLICT (name) DO NOTHING;

-- Game sessions table (maandelijkse competitie)
CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  jesse_streak INTEGER DEFAULT 0,
  flip_streak INTEGER DEFAULT 0,
  jesse_monthly_total DECIMAL(10,2) DEFAULT 0,
  flip_monthly_total DECIMAL(10,2) DEFAULT 0,
  jesse_power_ups JSONB DEFAULT '{"ballenBakBizarre":1,"cumbackKid":1,"toep":5,"ballenBak":5,"pullThePlug":1,"sniper":3,"speedpot":2,"doubleTrouble":2,"bbc":3}',
  flip_power_ups JSONB DEFAULT '{"ballenBakBizarre":1,"cumbackKid":1,"toep":5,"ballenBak":5,"pullThePlug":1,"sniper":3,"speedpot":2,"doubleTrouble":2,"bbc":3}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
  winner VARCHAR(50) NOT NULL,
  loser VARCHAR(50) NOT NULL,
  win_condition VARCHAR(20) DEFAULT 'normal', -- 'normal' of 'blackBall'
  opponent_balls_remaining INTEGER NOT NULL,
  jesse_power_ups_used JSONB DEFAULT '{}',
  flip_power_ups_used JSONB DEFAULT '{}',
  streak_before_jesse INTEGER NOT NULL,
  streak_before_flip INTEGER NOT NULL,
  streak_after_jesse INTEGER NOT NULL,
  streak_after_flip INTEGER NOT NULL,
  amount_won DECIMAL(10,2) NOT NULL,
  ballenbak_bonus DECIMAL(10,2) DEFAULT 0,
  black_ball_bonus BOOLEAN DEFAULT FALSE,
  capped_amount BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (winner IN ('Jesse', 'Flip')),
  CHECK (loser IN ('Jesse', 'Flip')),
  CHECK (winner != loser)
);

-- Live games table (voor live gameplay tijdens potje)
CREATE TABLE IF NOT EXISTS live_games (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'finished', 'cancelled'
  current_toep_stake INTEGER DEFAULT 0, -- Huidige inzet multiplier (0 = nog niet getoept, 1 = getoept, 2 = overgetoept, etc.)
  toep_initiated_by VARCHAR(50), -- Wie heeft getoept
  toep_response VARCHAR(20), -- 'pending', 'accepted', 'rejected'
  jesse_balls_remaining INTEGER DEFAULT 7,
  flip_balls_remaining INTEGER DEFAULT 7,
  jesse_pending_power_ups JSONB DEFAULT '{}',
  flip_pending_power_ups JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (toep_initiated_by IN ('Jesse', 'Flip') OR toep_initiated_by IS NULL),
  CHECK (toep_response IN ('pending', 'accepted', 'rejected') OR toep_response IS NULL)
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_matches_session ON matches(session_id);
CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_games_status ON live_games(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_month ON game_sessions(month);

-- Functie om updated_at te updaten
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger voor game_sessions
CREATE TRIGGER update_game_sessions_updated_at 
  BEFORE UPDATE ON game_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

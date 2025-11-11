-- Database Schema Fixes for Mafia Game Backend
-- This migration fixes critical security and performance issues

-- Fix User table constraints
ALTER TABLE users
  ADD CONSTRAINT chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT chk_users_level_positive CHECK (level >= 1),
  ADD CONSTRAINT chk_users_xp_non_negative CHECK (xp >= 0),
  ADD CONSTRAINT chk_users_games_non_negative CHECK (total_games >= 0 AND wins >= 0 AND losses >= 0);

-- Fix Game table constraints
ALTER TABLE games
  ADD CONSTRAINT chk_games_max_players CHECK (max_players BETWEEN 4 AND 20),
  ADD CONSTRAINT chk_games_current_players CHECK (current_players >= 0 AND current_players <= max_players),
  ADD CONSTRAINT chk_games_day_positive CHECK (day_number >= 1),
  ADD CONSTRAINT chk_games_winner_format CHECK (winner IS NULL OR winner IN ('mafia', 'citizen'));

-- Fix GamePlayers table constraints
ALTER TABLE game_players
  ADD CONSTRAINT chk_game_players_votes_non_negative CHECK (votes_received >= 0);

-- Fix GameHistory table constraints
ALTER TABLE game_history
  ADD CONSTRAINT chk_game_history_xp_positive CHECK (xp_earned > 0),
  ADD CONSTRAINT chk_game_history_duration_positive CHECK (duration_minutes >= 0);

-- Add indexes for performance and security
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_games_status_created ON games(status, created_at);
CREATE INDEX idx_games_phase_status ON games(phase, status);
CREATE INDEX idx_game_players_game_user ON game_players(game_id, user_id);
CREATE INDEX idx_game_players_game_alive ON game_players(game_id, is_alive);
CREATE INDEX idx_game_history_user_date ON game_history(user_id, played_at DESC);
CREATE INDEX idx_game_history_game_date ON game_history(game_id, played_at DESC);

-- Add foreign key constraints if they don't exist
-- Note: These may already exist due to TypeORM relations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'fk_game_players_game_id') THEN
        ALTER TABLE game_players
        ADD CONSTRAINT fk_game_players_game_id
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'fk_game_players_user_id') THEN
        ALTER TABLE game_players
        ADD CONSTRAINT fk_game_players_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'fk_games_created_by') THEN
        ALTER TABLE games
        ADD CONSTRAINT fk_games_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'fk_game_history_user_id') THEN
        ALTER TABLE game_history
        ADD CONSTRAINT fk_game_history_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'fk_game_history_game_id') THEN
        ALTER TABLE game_history
        ADD CONSTRAINT fk_game_history_game_id
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add composite unique constraints to prevent data integrity issues
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'uq_game_players_game_user') THEN
        ALTER TABLE game_players
        ADD CONSTRAINT uq_game_players_game_user
        UNIQUE (game_id, user_id);
    END IF;
END $$;
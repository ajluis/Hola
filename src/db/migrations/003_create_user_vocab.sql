-- Migration: 003_create_user_vocab
-- Create user vocabulary progress tracking

CREATE TABLE user_vocab (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vocab_id UUID REFERENCES vocab_items(id) ON DELETE CASCADE,

    -- First encounter
    introduced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    introduced_in_unit INTEGER,
    introduced_in_lesson INTEGER,

    -- Spaced Repetition State (SM-2)
    ease_factor DECIMAL(4,2) DEFAULT 2.50,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review TIMESTAMP WITH TIME ZONE,

    -- Mastery Tracking
    times_seen INTEGER DEFAULT 0,
    times_produced_correctly INTEGER DEFAULT 0,
    times_produced_with_help INTEGER DEFAULT 0,
    times_corrected INTEGER DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE,

    -- Mastery Score (calculated)
    mastery_score DECIMAL(3,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'new',

    UNIQUE(user_id, vocab_id)
);

-- Indexes
CREATE INDEX idx_user_vocab_user_review ON user_vocab(user_id, next_review);
CREATE INDEX idx_user_vocab_user_status ON user_vocab(user_id, status);
CREATE INDEX idx_user_vocab_mastery ON user_vocab(user_id, mastery_score DESC);

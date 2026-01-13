-- Migration: 005_create_daily_activity
-- Create daily activity tracking

CREATE TABLE daily_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Engagement
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,

    -- Learning
    vocab_introduced UUID[],
    vocab_reviewed UUID[],
    vocab_mastered UUID[],

    -- Errors & Corrections
    errors_made INTEGER DEFAULT 0,
    errors_corrected INTEGER DEFAULT 0,

    -- XP
    xp_earned INTEGER DEFAULT 0,

    -- Flags
    streak_counted BOOLEAN DEFAULT FALSE,
    summary_sent BOOLEAN DEFAULT FALSE,

    UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, date DESC);
CREATE INDEX idx_daily_activity_streak ON daily_activity(user_id, streak_counted);

-- Grammar concepts table (simplified for MVP)
CREATE TABLE grammar_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    level VARCHAR(10) NOT NULL,
    unit INTEGER NOT NULL,

    explanation_en TEXT,
    explanation_short VARCHAR(300),

    examples JSONB DEFAULT '[]',
    common_errors JSONB DEFAULT '[]',

    prerequisite_ids UUID[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grammar_level_unit ON grammar_concepts(level, unit);

-- User grammar progress
CREATE TABLE user_grammar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    grammar_id UUID REFERENCES grammar_concepts(id) ON DELETE CASCADE,

    introduced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    times_practiced INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_corrected INTEGER DEFAULT 0,

    mastery_score DECIMAL(3,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'new',
    last_practiced TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, grammar_id)
);

CREATE INDEX idx_user_grammar_user ON user_grammar(user_id, status);

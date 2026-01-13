-- Migration: 004_create_conversation_sessions
-- Create conversation session tracking

CREATE TABLE conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,

    session_type VARCHAR(30) NOT NULL,
    scenario_id UUID,

    -- Messages
    messages JSONB DEFAULT '[]',

    -- Performance
    vocab_introduced UUID[],
    vocab_practiced UUID[],
    vocab_produced_correctly UUID[],
    errors_made JSONB DEFAULT '[]',

    -- Outcome
    xp_earned INTEGER DEFAULT 0,
    scenario_completed BOOLEAN DEFAULT FALSE,
    completion_criteria_met JSONB
);

-- Indexes
CREATE INDEX idx_conversation_user ON conversation_sessions(user_id, started_at DESC);
CREATE INDEX idx_conversation_active ON conversation_sessions(user_id)
    WHERE ended_at IS NULL;
CREATE INDEX idx_conversation_type ON conversation_sessions(session_type);

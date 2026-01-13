-- Migration: 002_create_vocab_items
-- Create vocabulary content library

CREATE TABLE vocab_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    spanish VARCHAR(100) NOT NULL,
    english VARCHAR(200) NOT NULL,
    phonetic VARCHAR(200),
    part_of_speech VARCHAR(30),

    -- Leveling
    level VARCHAR(10) NOT NULL,
    unit INTEGER NOT NULL,
    frequency_rank INTEGER,

    -- Context
    category VARCHAR(50),
    gender VARCHAR(20),

    -- Examples
    example_sentence_es TEXT,
    example_sentence_en TEXT,

    -- For verbs
    is_irregular BOOLEAN DEFAULT FALSE,
    conjugations JSONB,

    -- Related
    related_vocab_ids UUID[],
    common_collocations TEXT[],

    -- Ordering
    sequence_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vocab_level_unit ON vocab_items(level, unit);
CREATE INDEX idx_vocab_category ON vocab_items(category);
CREATE INDEX idx_vocab_sequence ON vocab_items(level, unit, sequence_order);

-- Migration: 001_create_users
-- Create users table

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,

    -- Onboarding state
    onboarding_step INTEGER DEFAULT 0,
    onboarding_completed BOOLEAN DEFAULT FALSE,

    -- Profile
    name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'America/New_York',

    -- Learning state (from spec)
    current_level VARCHAR(10) DEFAULT 'A0',
    current_unit INTEGER DEFAULT 1,
    current_lesson INTEGER DEFAULT 1,

    -- Learning preferences
    dialect_preference VARCHAR(20) DEFAULT 'latam',
    goals TEXT[] DEFAULT '{}',
    daily_lesson_count INTEGER DEFAULT 2,
    lesson_time_morning TIME DEFAULT '09:00:00',
    lesson_time_evening TIME,
    accountability_level VARCHAR(20) DEFAULT 'medium',
    spanish_immersion_level VARCHAR(20) DEFAULT 'low',

    -- XP & Progression
    xp_total INTEGER DEFAULT 0,
    xp_current_level INTEGER DEFAULT 0,

    -- Streak
    streak_days INTEGER DEFAULT 0,
    streak_last_active DATE,
    longest_streak INTEGER DEFAULT 0,

    -- Engagement
    total_messages_sent INTEGER DEFAULT 0,
    total_messages_received INTEGER DEFAULT 0,
    conversations_completed INTEGER DEFAULT 0,
    scenarios_completed INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_lesson_schedule ON users(lesson_time_morning, daily_lesson_count)
    WHERE onboarding_completed = TRUE;
CREATE INDEX idx_users_level ON users(current_level, current_unit);

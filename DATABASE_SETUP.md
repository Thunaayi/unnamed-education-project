# Database Setup

## Schema Overview

This document describes the PostgreSQL schema for the 9th Grade Exam Prep application.

### Tables

#### `topics`
Stores exam topics with their importance metrics.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | Unique topic name |
| frequency | INTEGER | 0-10 scale (how often it appears in past papers) |
| marks_weight | INTEGER | 0-100 scale (importance in exam) |
| priority | ENUM (high\|medium\|low) | Study priority |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-set |

#### `questions`
Stores practice questions linked to topics.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| topic_id | UUID | Foreign key to topics |
| type | ENUM (mcq\|short) | Question type |
| question_text | TEXT | The question |
| correct_answer | TEXT | Correct answer |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-set |

#### `attempts`
Tracks user attempts at questions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| question_id | UUID | Foreign key to questions |
| is_correct | BOOLEAN | Whether the attempt was correct |
| created_at | TIMESTAMP | Auto-set |

#### `topic_progress`
Tracks user progress per topic (one record per user-topic pair).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| topic_id | UUID | Foreign key to topics |
| accuracy | NUMERIC(5,2) | 0-100, calculated from attempts |
| last_practiced | TIMESTAMP | When user last practiced this topic |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-set |

## Setup Instructions

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `database.sql`
5. Click **Run** to execute

### Option 2: Using Supabase CLI

```bash
supabase db push
```

## Key Features

- **UUIDs**: All IDs use PostgreSQL UUIDs for better security and scalability
- **ENUM Types**: Enforces valid values for priority and question type
- **Row Level Security (RLS)**: Enabled on all tables to ensure users can only access their own data
- **Indexes**: Created on foreign keys for query performance
- **Cascading Deletes**: Deleting a topic deletes all related questions and attempts
- **Constraints**: Data validation (e.g., frequency 0-10, accuracy 0-100)

## Data Flow

1. **Topics** are created with metadata (frequency, marks_weight, priority)
2. **Questions** are linked to topics
3. When a user **practices**, an **Attempt** record is created
4. **Topic Progress** is updated (accuracy calculated from attempts)
5. **Recommendations** API uses priority and user accuracy to suggest topics

## Notes for Development

- `auth.users` is managed by Supabase Auth - don't create manually
- Always use `auth.uid()` in your application to get the current user
- The RLS policies ensure data isolation between users
- For MVP, you can manually insert topics and questions or create a seeding script

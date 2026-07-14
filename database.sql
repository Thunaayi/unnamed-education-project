-- ============================================================
-- BSEK 9th Grade Exam Prep Platform — Database Schema
-- Updated to reflect structured past-paper data
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────────
CREATE TYPE priority_level  AS ENUM ('high', 'medium', 'low');
CREATE TYPE question_type   AS ENUM ('mcq', 'short_answer', 'detailed_answer');
CREATE TYPE section_label   AS ENUM ('A', 'B', 'C');

-- ── topics ────────────────────────────────────────────────────
-- One row per syllabus topic (e.g. "Logarithms", "Geometry").
-- frequency and marks_weight are computed from past-paper analysis.
CREATE TABLE topics (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT          NOT NULL UNIQUE,
  subject      TEXT          NOT NULL DEFAULT 'Mathematics',
  frequency    INTEGER       NOT NULL DEFAULT 0 CHECK (frequency >= 0 AND frequency <= 10),
  marks_weight INTEGER       NOT NULL DEFAULT 0 CHECK (marks_weight >= 0 AND marks_weight <= 100),
  priority     priority_level NOT NULL DEFAULT 'medium',
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- ── exams ─────────────────────────────────────────────────────
-- One row per yearly exam paper.
CREATE TABLE exams (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  year         INTEGER       NOT NULL UNIQUE,
  subject      TEXT          NOT NULL DEFAULT 'Mathematics',
  board        TEXT          NOT NULL DEFAULT 'BSEK',
  grade        INTEGER       NOT NULL DEFAULT 9,
  "group"      TEXT          NOT NULL DEFAULT 'Science',
  total_marks  INTEGER       NOT NULL DEFAULT 75,
  time_hours   INTEGER       NOT NULL DEFAULT 3,
  source_files JSONB         NOT NULL DEFAULT '[]',  -- list of filenames
  pages_found  JSONB         NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- ── questions ─────────────────────────────────────────────────
-- One row per individual question (MCQ sub-part, or long question).
CREATE TABLE questions (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id          UUID          NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  topic_id         UUID          REFERENCES topics(id) ON DELETE SET NULL,
  section          section_label NOT NULL,
  type             question_type NOT NULL,
  question_number  TEXT          NOT NULL,   -- "i", "ii" for MCQs; "2","12" for B/C
  question_text    TEXT          NOT NULL,
  marks            INTEGER       NOT NULL DEFAULT 1,
  has_alternative  BOOLEAN       NOT NULL DEFAULT FALSE,
  alternative_text TEXT,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- ── mcq_options ───────────────────────────────────────────────
-- Options for Section A MCQ questions only.
CREATE TABLE mcq_options (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID    NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text     TEXT    NOT NULL,
  is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
  display_order   INTEGER NOT NULL DEFAULT 0
);

-- ── attempts ─────────────────────────────────────────────────
CREATE TABLE attempts (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID    NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_correct  BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── topic_progress ────────────────────────────────────────────
CREATE TABLE topic_progress (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id       UUID         NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  accuracy       NUMERIC(5,2) CHECK (accuracy >= 0 AND accuracy <= 100),
  last_practiced TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, topic_id)
);

-- ── profiles ────────────────────────────────────────────────────
-- One row per user, created on signup via trigger or manually.
CREATE TABLE profiles (
  id           UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT         NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_questions_exam_id   ON questions(exam_id);
CREATE INDEX idx_questions_topic_id  ON questions(topic_id);
CREATE INDEX idx_questions_section   ON questions(section);
CREATE INDEX idx_mcq_options_q_id    ON mcq_options(question_id);
CREATE INDEX idx_attempts_user_id    ON attempts(user_id);
CREATE INDEX idx_attempts_question   ON attempts(question_id);
CREATE INDEX idx_progress_user       ON topic_progress(user_id);
CREATE INDEX idx_progress_topic      ON topic_progress(topic_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE topics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_options    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "public_read_topics"      ON topics      FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public_read_exams"       ON exams       FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public_read_questions"   ON questions   FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public_read_mcq_options" ON mcq_options FOR SELECT TO authenticated, anon USING (true);

-- Users manage only their own data
CREATE POLICY "own_attempts"  ON attempts       FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_progress"  ON topic_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_profile"   ON profiles       FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT TO authenticated USING (true);

-- ── Grants ────────────────────────────────────────────────────
GRANT SELECT ON topics, exams, questions, mcq_options TO authenticated, anon;
GRANT ALL    ON attempts, topic_progress, profiles  TO authenticated;

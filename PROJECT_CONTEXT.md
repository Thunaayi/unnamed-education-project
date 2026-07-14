# 9th Grade Exam Prep Platform - Pakistan BSEK

## 🎯 Project Overview

A comprehensive web application designed to help Pakistani students prepare for 9th grade board examinations (BSEK - Board of Secondary Education Karachi for now we will scale it later). The platform focuses on past paper analysis and personalized practice recommendations.

## 🏗️ Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth)
- **OCR Processing**: Python with Tesseract, OpenCV, pdf2image
- **Deployment**: Vercel (recommended)

## 📊 Database Schema

### Core Tables

#### `topics`
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  frequency INTEGER NOT NULL DEFAULT 0 CHECK (frequency >= 0 AND frequency <= 10),
  marks_weight INTEGER NOT NULL DEFAULT 0 CHECK (marks_weight >= 0 AND marks_weight <= 100),
  priority priority_level NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `exams`
```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  subject TEXT NOT NULL DEFAULT 'Mathematics',
  board TEXT NOT NULL DEFAULT 'BSEK',
  grade INTEGER NOT NULL DEFAULT 9,
  "group" TEXT NOT NULL DEFAULT 'Science',
  total_marks INTEGER NOT NULL DEFAULT 75,
  time_hours INTEGER NOT NULL DEFAULT 3,
  source_files JSONB NOT NULL DEFAULT '[]',
  pages_found JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `questions`
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  section section_label NOT NULL,
  type question_type NOT NULL,
  question_number TEXT NOT NULL,
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  has_alternative BOOLEAN NOT NULL DEFAULT FALSE,
  alternative_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `mcq_options`
```sql
CREATE TABLE mcq_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0
);
```

#### `attempts`
```sql
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `topic_progress`
```sql
CREATE TABLE topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  accuracy NUMERIC(5, 2) CHECK (accuracy >= 0 AND accuracy <= 100),
  last_practiced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);
```

### Enums
```sql
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE question_type AS ENUM ('mcq', 'short_answer', 'detailed_answer');
CREATE TYPE section_label AS ENUM ('A', 'B', 'C');
```

## 🔗 API Routes

### GET `/api/topics`
Returns all topics sorted by priority.

**Response:**
```json
{
  "topics": [
    {
      "id": "uuid",
      "name": "Algebra",
      "frequency": 8,
      "marks_weight": 25,
      "priority": "high",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/api/recommendations`
Returns top 3 topics to study based on priority and user performance.

**Response:**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "name": "Geometry",
      "frequency": 7,
      "marks_weight": 20,
      "priority": "high",
      "user_accuracy": 65.5,
      "last_practiced": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST `/api/attempt`
Records a user attempt and updates topic progress.

**Request:**
```json
{
  "question_id": "uuid",
  "is_correct": true
}
```

**Response:**
```json
{
  "attempt": {
    "id": "uuid",
    "user_id": "uuid",
    "question_id": "uuid",
    "is_correct": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "topic_progress": {
    "id": "uuid",
    "user_id": "uuid",
    "topic_id": "uuid",
    "accuracy": 75.0,
    "last_practiced": "2024-01-01T00:00:00Z"
  }
}
```

## 📱 Pages Structure

### `/` (Home)
- Landing page with link to dashboard
- Basic project description

### `/dashboard`
- Mock exam countdown
- Recommended topics to study
- User progress overview

### `/topics`
- List all topics with priority labels
- Show user accuracy for each topic
- Links to practice pages

### `/practice/[topicId]`
- Display 5 questions for the selected topic
- Allow answering with immediate feedback
- Track attempts and update progress

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Python 3.8+ (for OCR tool)
- Tesseract OCR installed
- Supabase account

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up Python environment for OCR:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Configure environment variables:**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up database:**
- Run the SQL in `database.sql` in your Supabase SQL editor
- Or use: `supabase db push`

5. **Start development server:**
```bash
npm run dev
```

## 📊 Data Processing Pipeline

### OCR Extraction Tool

Located in `extract_questions.py` - processes exam paper images to extract questions.

**Features:**
- Supports JPG, PNG, PDF formats
- Image preprocessing for better OCR accuracy
- Structured JSON output with question metadata
- Batch processing of multiple images

**Usage:**
```bash
source venv/bin/activate
python extract_questions.py
```

**Output Format (structured_questions.json):**
```json
[
  {
    "year": 2024,
    "subject": "Mathematics",
    "group": "Science",
    "total_marks": 75,
    "time_hours": 3,
    "sections": {
      "A": {
        "type": "mcq",
        "label": "Multiple Choice Questions",
        "marks": 15,
        "questions": [
          {
            "number": "i",
            "question_text": "If log₄x = 5, then x =:",
            "options": ["4", "6", "8", "10"],
            "correct_answer": null,
            "topic": "Logarithms"
          }
        ]
      },
      "B": {
        "type": "short_answer",
        "questions": [
          {
            "number": 5,
            "question_text": "By using factor theorem find the factors...",
            "topic": "Polynomials",
            "has_alternative": false
          }
        ]
      }
    }
  }
]
```

## 🎯 Key Features

### Past Paper Analysis
- Topics rated by frequency (0-10) and marks weight (0-100)
- Priority levels: high, medium, low
- Based on historical exam patterns

### Personalized Recommendations
- Algorithm considers:
  - Topic priority (high/medium/low)
  - User weakness (low accuracy topics)
  - Recent practice history

### Progress Tracking
- Individual topic accuracy calculation
- Last practiced timestamps
- Attempt history with correct/incorrect tracking

### Practice Mode
- 5 questions per practice session
- Immediate feedback on answers
- Automatic progress updates

## 🔒 Security & Data

### Row Level Security (RLS)
- Users can only access their own attempts and progress
- Topics and questions are publicly readable
- Supabase Auth handles user management

### Data Validation
- Database constraints on all numeric fields
- Type checking with TypeScript
- Input sanitization in API routes

## 📈 Current Status

### ✅ Completed
- Project scaffolding with Next.js 16
- Database schema design and SQL
- TypeScript type definitions
- API route structure (`/api/topics`, `/api/recommendations`, `/api/attempt`, `/api/questions`, `/api/stats`)
- Landing page with polished design
- Dashboard page (live data from API, recommendations, stats, topic radar)
- Topics hub with live data, priority badges, frequency bars, accuracy display
- Practice engine (`/practice/[topicId]`) — MCQ with instant green/red feedback, short/detailed answer with self-grading rubric reveal
- Recommendation algorithm (priority × frequency × weakness boost)
- OCR extraction tool with image processing
- Environment setup and documentation
- User authentication flow (login, register, auth callback, middleware route protection)
- Supabase browser + server client setup
- Navigation bar with auth-aware sign in/out
- Sample seed data (`structured_questions.json`)
- Progress visualization (accuracy bars, streak tracking, weak area detection)
- Performance analytics (stats endpoint with attempts, accuracy, streak calculation)

### 🚧 In Progress
- Data seeding automation (seed.js ready, needs DB connection)

### 📋 TODO
- Admin interface for content management
- Spaced repetition features
- Advanced performance analytics (weekly charts, trend lines)
- Email confirmation flow polish

## 🤝 Contributing

### For AI Agents/LLMs
When working on this project:

1. **Always check current file contents** before making changes
2. **Use the defined TypeScript types** from `types/index.ts`
3. **Follow the database schema** exactly
4. **Test API routes** after implementation
5. **Update this document** when adding new features

### Code Style
- Use TypeScript for all new code
- Follow Next.js 16 App Router conventions
- Use Tailwind CSS for styling
- Keep components modular and reusable

### Database Changes
- Always update the SQL schema in `database.sql`
- Test migrations on a development database first
- Update TypeScript types when schema changes

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tesseract OCR](https://tesseract-ocr.github.io/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎓 Educational Context

This platform serves Pakistani students preparing for 9th grade board exams under the BSEK curriculum. The focus is on:

- **Mathematics**: Algebra, Geometry, Trigonometry
- **Science**: Physics, Chemistry, Biology
- **Languages**: Urdu, English
- **Social Studies**: Pakistan Studies, History

The platform uses past paper analysis to identify high-frequency topics and help students focus their study time effectively.

---

**Last Updated:** April 27, 2026
**Version:** 0.1.0
**Status:** Development
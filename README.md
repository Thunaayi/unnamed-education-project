# 🇵🇰 BSEK 9th Grade Board Exam Preparation Platform

> A data-driven preparation app that helps Pakistani students study smarter by analyzing past papers, identifying high-frequency topics, and prioritizing study materials with interactive MCQs and written questions.

---

## 🎯 Project Vision & Core Idea

Preparing for board examinations in Pakistan (starting with the **Board of Secondary Education Karachi - BSEK**) has traditionally relied on generic, printed "five-year" or "ten-year" past paper books. Students often spend excessive time memorizing everything without knowing what matters most.

This application solves that by introducing **Data-Driven Prep Prioritization**:
1. **Past Paper Analytics**: Analyzes past papers to assign each syllabus topic a **Frequency (0-10)** and **Marks Weight (0-100)** score.
2. **Dynamic Study Recommendations**: Recommends the highest-yield topics for students to focus on, dynamically updated based on their individual practice accuracy.
3. **Interactive Practice Engine**: Features full MCQ and written question practice, giving students immediate feedback and tracking their strengths and weaknesses.

---

## 🏗️ Technical Stack & Architecture

- **Frontend Framework**: Next.js 16 (App Router) with TypeScript & React 19
- **Styling**: Tailwind CSS (v4) with vanilla CSS utilities
- **Database & Auth**: Supabase (PostgreSQL with RLS, Row Level Security)
- **Data Ingestion Engine**: Python 3.8+ with OpenCV, Tesseract OCR, and NumPy

---

## 📁 Repository Blueprint

```text
├── app/                        # Next.js App Router root
│   ├── api/                    # Backend API routes
│   │   ├── attempt/            # POST /api/attempt - records user attempts & updates progress
│   │   ├── recommendations/    # GET /api/recommendations - smart topic suggester
│   │   └── topics/             # GET /api/topics - returns list of topics with accuracy
│   ├── dashboard/              # /dashboard - student analytics and recommendations
│   ├── practice/               # /practice/[topicId] - interactive quiz interface
│   ├── topics/                 # /topics - list of syllabus topics and priorities
│   ├── globals.css             # Tailwind v4 globals
│   ├── layout.tsx              # Root HTML layout
│   └── page.tsx                # Landing / Home page
├── lib/                        # Shared utility libraries
│   └── supabase/               # Supabase clients (server/client configurations)
├── types/                      # TypeScript definitions
│   └── index.ts                # Central interfaces for DB entities and API payloads
├── images/                     # (Create locally) Exam past paper JPEG scans for OCR
├── extract_questions.py        # Python past-paper OCR and structured extraction engine
├── debug_ocr.py                # Preprocessing and OCR testing script
├── seed.js                     # Node.js DB seeder (populates database from OCR output)
├── database.sql                # Supabase schema definitions, indexes, and RLS policies
├── PROJECT_CONTEXT.md          # Original project description and requirements
├── AI_CONTEXT.md               # [RECOMMENDED] Comprehensive dossier for AI assistants
├── .cursorrules                # Cursor-specific directives for AI coding models
└── .clinerules                 # Cline / Roo Code instructions for AI agents
```

---

## 🚀 Setup & Execution

### 1. Database & Authentication Setup
1. Create a free project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in Supabase.
3. Paste the contents of `database.sql` and run it to create tables, enums, indexes, and Row Level Security (RLS) policies.

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Local Installation & Web Server
```bash
# Install dependencies
npm install

# Start local Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Data Extraction Pipeline (OCR)
To digest physical past papers into structured database entries:
```bash
# Initialize and activate Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install OCR dependencies
pip install -r requirements.txt

# Run the extraction script
python extract_questions.py
```
*Note: Make sure Tesseract OCR is installed on your local operating system.*

### 5. Seeding the Database
Once the OCR tool generates `structured_questions.json`, seed your Supabase database:
```bash
node seed.js
```

---

## 🤖 AI-Agent Ingestion & Context Hub

If you are an **AI coding assistant** (such as Cursor, Claude Dev, Cline, or Roo Code) working on this repository, please review our specialized guidance documents:

- **[.cursorrules](file:///.cursorrules)** / **[.clinerules](file:///.clinerules)**: Defines active rules for file modification, code conventions, styling requirements, and RLS validation.
- **[AI_CONTEXT.md](file:///AI_CONTEXT.md)**: A deep-dive dossier covering the exact educational context, mathematical formulas for the recommendation engine, database schema relations, and future implementation requirements.
- **[PROJECT_CONTEXT.md](file:///PROJECT_CONTEXT.md)**: Contains supplementary details on Completed vs In-Progress features.

Please read **[AI_CONTEXT.md](file:///AI_CONTEXT.md)** first before starting any coding task to ensure alignment with our high-standard architecture.

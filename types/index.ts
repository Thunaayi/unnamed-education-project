export type PriorityLevel  = 'high' | 'medium' | 'low';
export type QuestionType   = 'mcq' | 'short_answer' | 'detailed_answer';
export type SectionLabel   = 'A' | 'B' | 'C';

export interface Topic {
  id:           string;
  name:         string;
  subject:      string;
  frequency:    number;
  marks_weight: number;
  priority:     PriorityLevel;
  created_at:   string;
  updated_at:   string;
}

export interface StatsResponse {
  total_attempts: number;
  correct_attempts: number;
  accuracy: number;
  today_attempts: number;
  topics_practiced: number;
  streak_days: number;
  topics_by_subject: { subject: string; accuracy: number; count: number }[];
  mastery_history: { label: string; value: number }[];
}

export interface Exam {
  id:           string;
  year:         number;
  subject:      string;
  board:        string;
  grade:        number;
  group:        string;
  total_marks:  number;
  time_hours:   number;
  source_files: string[];
  pages_found:  number[];
  created_at:   string;
}

export interface Question {
  id:               string;
  exam_id:          string;
  topic_id:         string | null;
  section:          SectionLabel;
  type:             QuestionType;
  question_number:  string;   // "i","ii" for MCQs; "2","12" for B/C
  question_text:    string;
  marks:            number;
  has_alternative:  boolean;
  alternative_text: string | null;
  created_at:       string;
  updated_at:       string;
}

export interface McqOption {
  id:            string;
  question_id:   string;
  option_text:   string;
  is_correct:    boolean;
  display_order: number;
}

export interface Attempt {
  id:          string;
  user_id:     string;
  question_id: string;
  is_correct:  boolean;
  created_at:  string;
}

export interface TopicProgress {
  id:             string;
  user_id:        string;
  topic_id:       string;
  accuracy:       number | null;  // 0-100
  last_practiced: string | null;
  created_at:     string;
  updated_at:     string;
}

// ── Enriched / joined types ────────────────────────────────────
export interface QuestionWithOptions extends Question {
  options: McqOption[];
  topic:   Topic | null;
}

export interface TopicWithProgress extends Topic {
  user_accuracy:  number | null;
  last_practiced: string | null;
}

// ── API request / response types ───────────────────────────────
export interface GetTopicsResponse {
  topics: TopicWithProgress[];
}

export interface GetRecommendationsResponse {
  recommendations: TopicWithProgress[];
}

export interface GetQuestionsResponse {
  questions: QuestionWithOptions[];
  exam:      Exam;
}

export interface PostAttemptRequest {
  question_id: string;
  is_correct:  boolean;
}

export interface PostAttemptResponse {
  attempt:        Attempt;
  topic_progress: TopicProgress;
}

// ── structured_questions.json shape (OCR pipeline output) ──────
export interface McqOptionRaw {
  option_text:   string;
  is_correct:    boolean;
}

export interface QuestionRaw {
  number:           string | number;
  order?:           number;
  question_text:    string;
  marks:            number;
  topic:            string;
  has_alternative:  boolean;
  alternative_text: string | null;
  // MCQ-specific
  options?:         string[];
  correct_answer?:  string | null;
}

export interface SectionRaw {
  type:            QuestionType | 'unparsed';
  label:           string;
  marks:           number;
  instruction?:    string;
  questions_count: number;
  questions:       QuestionRaw[];
  note?:           string;
}

export interface ExamRaw {
  year:         number;
  subject:      string;
  board:        string;
  grade:        number;
  group:        string;
  total_marks:  number;
  time_hours:   number;
  source_files: string[];
  pages_found:  number[];
  missing_pages?: number[];
  sections:     { A?: SectionRaw; B?: SectionRaw; C?: SectionRaw };
}

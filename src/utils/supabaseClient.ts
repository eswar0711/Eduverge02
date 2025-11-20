import { createClient } from '@supabase/supabase-js';

// Remove local ImportMeta/ImportMetaEnv interfaces and use a global declaration in a .d.ts file for Vite env typing.

// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project settings
const supabaseUrl =  'https://jonwdiwqzvbznpbgxouw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbndkaXdxenZiem5wYmd4b3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjI5MjUsImV4cCI6MjA3OTE5ODkyNX0.TxkBmKnk-wOV2U0yyW6gqxlklVKp7uAPpnynhDgk1wA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'faculty' | 'student';
  created_at: string;
}

export interface Assessment {
  id: string;
  faculty_id: string;
  subject: string;
  unit: string;
  title: string;
  duration_minutes: number;
  created_at: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  type: 'MCQ' | 'Theory';
  question_text: string;
  options?: string[]; // Only for MCQ
  correct_answer?: string; // Only for MCQ
  marks: number;
  created_at: string;
}

export interface Submission {
  id: string;
  assessment_id: string;
  student_id: string;
  answers: Record<string, string>; // { question_id: answer }
  mcq_score: number;
  theory_score: number | null;
  total_score: number;
  submitted_at: string;
}
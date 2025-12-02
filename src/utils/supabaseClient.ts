import { createClient } from '@supabase/supabase-js';

// Remove local ImportMeta/ImportMetaEnv interfaces and use a global declaration in a .d.ts file for Vite env typing.

// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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


export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  department: string;
  description: string | null;
  created_at: string;
}

export interface CourseMaterial {
  id: string;
  subject_id: string;
  faculty_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  material_type: 'pdf' | 'syllabus' | 'notes' | 'assignment';
  semester: number;
  created_at: string;
  updated_at: string;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  subject_id: string;
  semester: number;
  enrolled_at: string;
}

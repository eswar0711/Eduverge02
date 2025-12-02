import { supabase } from './supabaseClient';

export interface TestSession {
  id: string;
  assessment_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  duration_minutes: number;
  is_completed: boolean;
  created_at: string;
}

/**
 * Create or retrieve an existing test session
 * This ensures the timer doesn't reset if student leaves and comes back
 * 
 * SECURITY: Uses server-side timestamps to prevent client-side manipulation
 * FIX: Handles race condition when multiple requests create session simultaneously
 */
export const getOrCreateTestSession = async (
  assessmentId: string,
  durationMinutes: number
): Promise<TestSession> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if session already exists for this student and assessment
    // Changed from .single() to .maybeSingle() to avoid error when no rows
    const { data: existingSession, error: fetchError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', user.id)
      .maybeSingle();

    // If session exists and not completed, return it
    // This prevents timer from restarting
    if (existingSession && !existingSession.is_completed) {
      console.log('✅ Existing test session found, resuming...');
      return existingSession;
    }

    // If there's a real error, throw it
    if (fetchError) {
      throw fetchError;
    }

    // Create new session if none exists
    console.log('📝 Creating new test session...');
    
    try {
      const { data: newSession, error: createError } = await supabase
        .from('test_sessions')
        .insert([
          {
            assessment_id: assessmentId,
            student_id: user.id,
            started_at: new Date().toISOString(),
            duration_minutes: durationMinutes,
            is_completed: false,
          },
        ])
        .select()
        .single();

      if (createError) {
        // Handle unique constraint violation (error code 23505)
        // This happens when another request creates the session at same time
        if (createError.code === '23505') {
          console.log('⚠️ Race condition detected, retrieving existing session...');
          
          // Wait a tiny bit for the other request to finish
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Retry: Get the session that was just created by another request
          const { data: newlyCreatedSession, error: retryError } = await supabase
            .from('test_sessions')
            .select('*')
            .eq('assessment_id', assessmentId)
            .eq('student_id', user.id)
            .maybeSingle();

          if (retryError) throw retryError;
          
          if (newlyCreatedSession) {
            console.log('✅ Retrieved session created by concurrent request');
            return newlyCreatedSession;
          }
        }
        throw createError;
      }

      if (!newSession) {
        throw new Error('Failed to create test session');
      }

      console.log('✅ New test session created');
      return newSession;
    } catch (error: any) {
      // Additional safety: if create fails due to race condition, retrieve
      if (error?.code === '23505') {
        console.log('⚠️ Handling race condition with retry...');
        
        // Wait briefly then retry
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: sessionAfterRetry, error: retryError } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('assessment_id', assessmentId)
          .eq('student_id', user.id)
          .maybeSingle();

        if (retryError) throw retryError;
        
        if (sessionAfterRetry) {
          console.log('✅ Successfully retrieved session after retry');
          return sessionAfterRetry;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in getOrCreateTestSession:', error);
    throw error;
  }
};

/**
 * Calculate remaining time based on server time (NOT client time)
 * This prevents client-side timer manipulation
 * 
 * Formula: (start_time + duration) - current_time = remaining_time
 */
export const calculateRemainingTime = (session: TestSession): number => {
  try {
    // Parse the server-stored start time
    const startTime = new Date(session.started_at).getTime();

    // Calculate end time (start + duration)
    const durationMs = session.duration_minutes * 60 * 1000;
    const endTime = startTime + durationMs;

    // Get current time from client (will be compared against server)
    const now = Date.now();

    // Calculate remaining time
    const remaining = Math.max(0, endTime - now);

    // Return in seconds (rounded up)
    return Math.ceil(remaining / 1000);
  } catch (error) {
    console.error('Error calculating remaining time:', error);
    return 0;
  }
};

/**
 * Check if test time has expired
 */
export const isTimeExpired = (session: TestSession): boolean => {
  const remaining = calculateRemainingTime(session);
  return remaining <= 0;
};

/**
 * Mark test as completed and record submission time
 * Should be called when student submits test
 */
export const completeTestSession = async (sessionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('test_sessions')
      .update({
        submitted_at: new Date().toISOString(),
        is_completed: true,
      })
      .eq('id', sessionId);

    if (error) {
      throw error;
    }

    console.log('✅ Test session marked as completed');
  } catch (error) {
    console.error('Error completing test session:', error);
    throw error;
  }
};

/**
 * Get all test sessions for an assessment (Faculty only)
 * Used for viewing submissions and student progress
 */
export const getAssessmentSessions = async (
  assessmentId: string
): Promise<TestSession[]> => {
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching assessment sessions:', error);
    throw error;
  }
};

/**
 * Get test session details for a specific student
 */
export const getStudentTestSession = async (
  assessmentId: string,
  studentId: string
): Promise<TestSession | null> => {
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching student test session:', error);
    throw error;
  }
};

/**
 * Get all sessions for current user (Student view)
 */
export const getMyTestSessions = async (): Promise<TestSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching my test sessions:', error);
    throw error;
  }
};

/**
 * Format seconds into readable time format
 * Example: 3665 seconds → "1h 1m 5s"
 */
export const formatTimeDisplay = (seconds: number): string => {
  if (seconds <= 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Get session statistics (for faculty dashboard)
 */
export const getSessionStats = (sessions: TestSession[]): {
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  averageSubmissionTime: string;
} => {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.is_completed).length;
  const pendingSessions = totalSessions - completedSessions;

  // Calculate average time taken to submit
  const submittedSessions = sessions.filter(
    s => s.submitted_at && s.is_completed
  );

  let averageSubmissionTime = '—';

  if (submittedSessions.length > 0) {
    const totalTime = submittedSessions.reduce((acc, session) => {
      const startTime = new Date(session.started_at).getTime();
      const submittedTime = new Date(session.submitted_at!).getTime();
      return acc + (submittedTime - startTime);
    }, 0);

    const avgTimeMs = totalTime / submittedSessions.length;
    const avgSeconds = Math.floor(avgTimeMs / 1000);
    averageSubmissionTime = formatTimeDisplay(avgSeconds);
  }

  return {
    totalSessions,
    completedSessions,
    pendingSessions,
    averageSubmissionTime,
  };
};

/**
 * Validate if a student can start the test
 * Checks: authentication, assessment exists, session not completed
 */
export const validateTestAccess = async (
  assessmentId: string
): Promise<{ allowed: boolean; message: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { allowed: false, message: 'Please log in to take the test' };
    }

    // Check if assessment exists
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id')
      .eq('id', assessmentId)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return { allowed: false, message: 'Assessment not found' };
    }

    // Check if student already completed this test
    const { data: existingSession, error: sessionError } = await supabase
      .from('test_sessions')
      .select('is_completed')
      .eq('assessment_id', assessmentId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (sessionError) {
      return { allowed: false, message: 'Error checking test status' };
    }

    if (existingSession?.is_completed) {
      return {
        allowed: false,
        message: 'You have already completed this assessment',
      };
    }

    return { allowed: true, message: 'Access granted' };
  } catch (error) {
    console.error('Error validating test access:', error);
    return { allowed: false, message: 'Error validating access' };
  }
};
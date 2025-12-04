import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ====================================================================
// ADMIN USERS MANAGEMENT
// ====================================================================

export async function getAdminUsers(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('admin_users')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { adminUsers: data || [], total: count || 0 };
}

export async function createAdminUser(userId: string, role: string = 'admin') {
  const { data, error } = await supabase
    .from('admin_users')
    .insert([
      {
        id: userId,
        role,
        is_active: true,
        created_at: new Date(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateAdminUser(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deactivateAdminUser(userId: string) {
  return updateAdminUser(userId, {
    is_active: false,
    updated_at: new Date(),
  });
}

export async function deleteAdminUser(userId: string) {
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}

// ====================================================================
// USER PROFILES MANAGEMENT
// ====================================================================

export async function getUserProfiles(
  page = 1,
  limit = 10,
  role?: string,
  search?: string
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' });

  if (role && role !== 'all') {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { profiles: data || [], total: count || 0 };
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createUserProfile(profileData: any) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profileData])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date(),
    })
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function blockUser(userId: string) {
  return updateUserProfile(userId, { is_blocked: true });
}

export async function unblockUser(userId: string) {
  return updateUserProfile(userId, { is_blocked: false });
}

// ====================================================================
// FACULTY REQUESTS MANAGEMENT
// ====================================================================

export async function getFacultyRequests(
  page = 1,
  limit = 10,
  status: string = 'all'
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('faculty_requests')
    .select('*', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return { requests: data || [], total: count || 0 };
}

export async function getFacultyRequest(requestId: string) {
  const { data, error } = await supabase
    .from('faculty_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) throw error;
  return data;
}

export async function approveFacultyRequest(
  requestId: string,
  adminId: string
) {
  const { data, error } = await supabase
    .from('faculty_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date(),
      reviewed_by: adminId,
    })
    .eq('id', requestId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function rejectFacultyRequest(
  requestId: string,
  adminId: string,
  reason: string
) {
  const { data, error } = await supabase
    .from('faculty_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date(),
      reviewed_by: adminId,
    })
    .eq('id', requestId)
    .select();

  if (error) throw error;
  return data?.[0];
}

// ====================================================================
// SUBJECT MANAGEMENT
// ====================================================================

export async function getSubjects(
  page = 1,
  limit = 10,
  status: string = 'active',
  search?: string
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('subjects')
    .select('*', { count: 'exact' });

  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'archived') {
    query = query.eq('is_active', false);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { subjects: data || [], total: count || 0 };
}

export async function createSubject(
  subjectData: any,
  createdBy: string
) {
  const { data, error } = await supabase
    .from('subjects')
    .insert([
      {
        ...subjectData,
        created_by: createdBy,
        created_at: new Date(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateSubject(subjectId: string, updates: any) {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', subjectId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function archiveSubject(subjectId: string) {
  return updateSubject(subjectId, { is_active: false });
}

export async function activateSubject(subjectId: string) {
  return updateSubject(subjectId, { is_active: true });
}

// ====================================================================
// SUBJECT ASSIGNMENTS (Faculty to Subject Mapping)
// ====================================================================

export async function getSubjectAssignments(subjectId: string) {
  const { data, error } = await supabase
    .from('subject_assignments')
    .select('*, faculty:faculty_id(id, email, name)')
    .eq('subject_id', subjectId);

  if (error) throw error;
  return data || [];
}

export async function getFacultyList() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, full_name')
    .eq('role', 'faculty')
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

export async function assignFacultyToSubject(
  subjectId: string,
  facultyIds: string[],
  assignedBy: string
) {
  const assignments = facultyIds.map((faculty_id) => ({
    subject_id: subjectId,
    faculty_id,
    assigned_by: assignedBy,
    assigned_at: new Date(),
    role: 'instructor',
  }));

  const { data, error } = await supabase
    .from('subject_assignments')
    .insert(assignments)
    .select();

  if (error) throw error;
  return data;
}

export async function removeFacultyFromSubject(
  subjectId: string,
  facultyId: string
) {
  const { error } = await supabase
    .from('subject_assignments')
    .delete()
    .eq('subject_id', subjectId)
    .eq('faculty_id', facultyId);

  if (error) throw error;
}

// ====================================================================
// ACTIVITY LOGS (Audit Trail)
// ====================================================================

export async function getActivityLogs(
  page = 1,
  limit = 10,
  action?: string,
  resourceType?: string
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' });

  if (action && action !== 'all') {
    query = query.eq('action', action);
  }

  if (resourceType && resourceType !== 'all') {
    query = query.eq('target_type', resourceType);
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { logs: data || [], total: count || 0 };
}

export async function logActivity(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  description: string,
  oldValues?: any,
  newValues?: any
) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([
      {
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        description,
        old_values: oldValues,
        new_values: newValues,
        ip_address: null,
        created_at: new Date(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

// ====================================================================
// API KEYS MANAGEMENT
// ====================================================================

export async function getAPIKeys(createdBy?: string) {
  let query = supabase.from('api_keys').select('*');

  if (createdBy) {
    query = query.eq('created_by', createdBy);
  }

  const { data, error } = await query
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAPIKey(
  keyName: string,
  serviceType: string,
  createdBy: string
) {
  const apiKey = generateAPIKey();

  const { data, error } = await supabase
    .from('api_keys')
    .insert([
      {
        key_name: keyName,
        key_value: apiKey,
        service_type: serviceType,
        created_by: createdBy,
        is_active: true,
        created_at: new Date(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deleteAPIKey(keyId: string) {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId);

  if (error) throw error;
}

export async function updateAPIKeyUsage(keyId: string) {
  const { error } = await supabase
    .from('api_keys')
    .update({ last_used: new Date() })
    .eq('id', keyId);

  if (error) throw error;
}

// ====================================================================
// SYSTEM SETTINGS
// ====================================================================

export async function getSystemSettings(key?: string) {
  let query = supabase.from('system_settings').select('*');

  if (key) {
    query = query.eq('key', key);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateSystemSetting(
  key: string,
  value: any,
  description: string,
  updatedBy: string
) {
  const { data, error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      description,
      updated_by: updatedBy,
      updated_at: new Date(),
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

// ====================================================================
// ANALYTICS
// ====================================================================

export async function getAnalyticsOverview() {
  // Total Students
  const { count: totalStudents } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Total Subjects
  const { count: totalSubjects } = await supabase
    .from('subjects')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Average Score from submissions
  const { data: avgData } = await supabase
    .from('submissions')
    .select('total_score');

  const averageScore =
    avgData && avgData.length > 0
      ? avgData.reduce((sum: number, s: any) => sum + (s.total_score || 0), 0) /
        avgData.length
      : 0;

  // Completion Rate (submitted vs total sessions)
  const { count: completedSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  const { count: totalSessions } = await supabase
    .from('test_sessions')
    .select('*', { count: 'exact', head: true });

  const completionRate =
    totalSessions && totalSessions > 0
      ? (completedSubmissions! / totalSessions) * 100
      : 0;

  return {
    totalStudents: totalStudents || 0,
    totalCourses: totalSubjects || 0,
    averageScore: Math.round(averageScore * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
  };
}

export async function getStudentPerformanceData() {
  const { data, error } = await supabase
    .from('submissions')
    .select('student_id, total_score, test_sessions!submissions_test_session_id_fkey(id)')
    .order('student_id', { ascending: true });

  if (error) throw error;

  // Group by student
  const performance = data?.reduce((acc: any, submission: any) => {
    const existing = acc.find(
      (p: any) => p.student_id === submission.student_id
    );
    if (existing) {
      existing.scores.push(submission.total_score || 0);
    } else {
      acc.push({
        student_id: submission.student_id,
        scores: [submission.total_score || 0],
      });
    }
    return acc;
  }, []);

  return (
    performance?.map((p: any) => ({
      name: `Student ${p.student_id.slice(0, 8)}`,
      averageScore:
        Math.round(
          (p.scores.reduce((a: number, b: number) => a + b, 0) /
            p.scores.length) *
            100
        ) / 100,
      totalTests: p.scores.length,
      completedTests: p.scores.length,
    })) || []
  );
}

export async function getQuestionAnalyticsData() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, difficulty, correct_answer, marks');

  if (error) throw error;

  // Get submission answers
  const { data: submissions } = await supabase
    .from('submissions')
    .select('answers');

  return (
    data?.map((question: any) => {
      let correctCount = 0;
      let totalAttempts = 0;

      submissions?.forEach((submission: any) => {
        if (submission.answers && submission.answers[question.id]) {
          totalAttempts++;
          if (submission.answers[question.id] === question.correct_answer) {
            correctCount++;
          }
        }
      });

      return {
        question: question.question_text.substring(0, 50),
        difficulty: question.difficulty,
        correctAnswers: correctCount,
        totalAttempts: totalAttempts || 1,
        successRate:
          totalAttempts > 0
            ? Math.round((correctCount / totalAttempts) * 100 * 100) / 100
            : 0,
      };
    }) || []
  );
}

export async function getActivityMetrics() {
  // Get last 7 days
  const days = 7;
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Logins (from test_sessions)
    const { count: logins } = await supabase
      .from('test_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', `${dateStr}T00:00:00`)
      .lt('started_at', `${dateStr}T23:59:59`);

    // Submissions
    const { count: submissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', `${dateStr}T00:00:00`)
      .lt('submitted_at', `${dateStr}T23:59:59`);

    // New users
    const { count: newUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${dateStr}T23:59:59`);

    data.push({
      date: new Date(date).toLocaleDateString(),
      logins: logins || 0,
      submissions: submissions || 0,
      newUsers: newUsers || 0,
    });
  }

  return data;
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

function generateAPIKey(): string {
  const prefix = 'sk_';
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix;

  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
}

export async function getCurrentAdmin() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}

export async function checkAdminAccess(): Promise<boolean> {
  const admin = await getCurrentAdmin();
  return admin?.is_active === true;
}

export { supabase };
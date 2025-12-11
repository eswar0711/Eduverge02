import { supabase } from './supabaseClient';
import type { User, UserProfile } from './supabaseClient';


export interface AuthState {
  user: User | null;
  loading: boolean;
}

// ====================================================================
// SIGN UP - Auth user + Admin profile insert
// ====================================================================
export const signUp = async (
  email: string,
  password: string,
  full_name: string,
  role: 'faculty' | 'student'
) => {
  try {
    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error("No auth user returned");

    const userId = data.user.id;

    // Insert into public.users (client allowed)
    const { error: usersError } = await supabase
      .from("users")
      .insert({
        id: userId,
        full_name,
        email,
        role,
      });

    if (usersError) throw usersError;

    // Insert into user_profiles
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        full_name,
        email,
        role,
        is_active: true,
        is_blocked: false,
      });

    if (profileError) throw profileError;

    return data;

  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
};



// ====================================================================
// SIGN IN
// ====================================================================
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Sign in error:', error);
    throw error;
  }
};

// ====================================================================
// SIGN OUT
// ====================================================================
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('❌ Sign out error:', error);
    throw error;
  }
};

// ====================================================================
// GET CURRENT USER + PROFILE
// ====================================================================
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching profile:', error);
      return null;
    }

    return profile as UserProfile;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
};

// ====================================================================
// GET SESSION
// ====================================================================
export const getSession = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('❌ Error getting session:', error);
    return null;
  }
};

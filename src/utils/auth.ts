import { supabase } from './supabaseClient';
import type { User } from './supabaseClient';

export interface AuthState {
  user: User | null;
  loading: boolean;
}

// Sign up new user
export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: 'faculty' | 'student'
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (error) throw error;
  return data;
};

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Sign out current user
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user profile
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return null;

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return userProfile;
};

// Check if user is authenticated
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
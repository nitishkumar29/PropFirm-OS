import { createSupabaseClient } from '@/lib/supabase/client';

export const authService = {
  async signUp(email: string, password: string, fullName?: string) {
    const supabase = createSupabaseClient();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName ?? '' },
      },
    });
  },

  async signIn(email: string, password: string, rememberMe = false) {
    const supabase = createSupabaseClient();
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    const supabase = createSupabaseClient();
    return supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    const supabase = createSupabaseClient();
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  },

  async verifyOtp(email: string, token: string) {
    const supabase = createSupabaseClient();
    return supabase.auth.verifyOtp({ email, token, type: 'email' });
  },
};

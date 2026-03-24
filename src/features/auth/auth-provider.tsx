import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import type { StaffProfile, StaffRole } from '../../types/domain';
import { AuthContext, type AuthContextValue } from './auth-context';

interface FetchProfileResult {
  profile: StaffProfile | null;
  errorMessage?: string;
}

async function fetchProfile(userId: string): Promise<FetchProfileResult> {
  if (!supabase) {
    return {
      profile: null,
      errorMessage: 'Supabase client is not configured.',
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return {
      profile: null,
      errorMessage: `Profile query failed: ${error.message}`,
    };
  }

  if (!data) {
    return {
      profile: null,
      errorMessage: `No profile row found for auth user ${userId}.`,
    };
  }

  return {
    profile: {
      id: String(data.id),
      email: (data.email as string | null | undefined) ?? null,
      fullName: String(data.full_name ?? ''),
      role: data.role as StaffRole,
      createdAt: String(data.created_at ?? new Date().toISOString()),
    } satisfies StaffProfile,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) {
        return;
      }

      const nextSession = data.session;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        const profileResult = await fetchProfile(nextSession.user.id);
        setProfile(profileResult.profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      fetchProfile(nextSession.user.id).then((result) => {
        setProfile(result.profile);
        setLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      async signIn(email, password) {
        if (!supabase) {
          throw new Error('Supabase environment variables are missing.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error('Sign-in succeeded, but no user session was returned.');
        }

        const nextProfileResult = await fetchProfile(data.user.id);

        if (!nextProfileResult.profile) {
          await supabase.auth.signOut();
          throw new Error(
            nextProfileResult.errorMessage ??
              'This account exists in Supabase Auth, but it has no staff profile yet. Insert a matching row into public.profiles first.',
          );
        }
      },
      async signOut() {
        if (!supabase) {
          return;
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      },
    }),
    [loading, profile, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

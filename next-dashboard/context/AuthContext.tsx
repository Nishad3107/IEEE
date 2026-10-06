"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "../utils/supabase/client";

export type UserRole = "student" | "guide" | "coordinator";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
};

type AuthContextValue = {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(
    () => (typeof window === "undefined" ? null : createClient()),
    [],
  );

  const fetchProfile = useCallback(
    async (authUser: SupabaseUser | null) => {
      if (!authUser || !supabase) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, role")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Unable to load user profile:", error.message);
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
    },
    [supabase],
  );

  useEffect(() => {
    let mounted = true;

    const loadSession = async (session: Session | null) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      await fetchProfile(session?.user ?? null);
      if (mounted) setLoading(false);
    };

    if (!supabase) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    void supabase.auth.getSession().then(({ data }) => loadSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Supabase authentication is not configured." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Unable to sign out:", error.message);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile(user);
  }, [fetchProfile, user]);

  const value = useMemo(
    () => ({ user, profile, role: profile?.role ?? null, loading, signIn, signOut, refreshProfile }),
    [user, profile, loading, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

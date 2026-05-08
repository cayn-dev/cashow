import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { tt } from '@/lib/i18nToast';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GUEST_MODE_KEY = 'finance_guest_mode';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem(GUEST_MODE_KEY) === 'true';
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          // If user logs in, exit guest mode
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: displayName || email.split('@')[0],
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: new Error(tt('toast.emailExists')) };
        }
        return { error };
      }

      toast.success(tt('toast.signupSuccess'));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error(tt('toast.invalidCreds')) };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: new Error(tt('toast.emailNotConfirmed')) };
        }
        return { error };
      }

      // Exit guest mode on successful login
      setIsGuest(false);
      localStorage.removeItem(GUEST_MODE_KEY);
      toast.success(tt('toast.signinSuccess'));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    toast.info(tt('toast.signedOut'));
  }, []);

  const enterGuestMode = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem(GUEST_MODE_KEY, 'true');
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuest(false);
    localStorage.removeItem(GUEST_MODE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isGuest,
        signUp,
        signIn,
        signOut,
        enterGuestMode,
        exitGuestMode,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
 import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
 import { User, Session } from '@supabase/supabase-js';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface AuthContextType {
   user: User | null;
   session: Session | null;
   loading: boolean;
   signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
   signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
   signOut: () => Promise<void>;
   isAuthenticated: boolean;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     // Set up auth state listener FIRST
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setSession(session);
         setUser(session?.user ?? null);
         setLoading(false);
       }
     );
 
     // THEN check for existing session
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
           return { error: new Error('Email già registrata. Prova ad accedere.') };
         }
         return { error };
       }
 
       toast.success('Registrazione completata! Controlla la tua email per confermare.');
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
           return { error: new Error('Credenziali non valide. Riprova.') };
         }
         if (error.message.includes('Email not confirmed')) {
           return { error: new Error('Email non confermata. Controlla la tua casella.') };
         }
         return { error };
       }
 
       toast.success('Accesso effettuato!');
       return { error: null };
     } catch (err) {
       return { error: err as Error };
     }
   }, []);
 
   const signOut = useCallback(async () => {
     await supabase.auth.signOut();
     toast.info('Disconnesso');
   }, []);
 
   return (
     <AuthContext.Provider
       value={{
         user,
         session,
         loading,
         signUp,
         signIn,
         signOut,
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
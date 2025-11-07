import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Define the context shape
interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setData = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);

      // If a user has logged in, check for and create a profile if it doesn't exist.
      // This handles the first login after email confirmation and fixes the registration bug.
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        // If no profile is found, create one.
        if (!profile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              // Use email as a default display name, stripping the domain for privacy/brevity.
              display_name: session.user.email?.split('@')[0] || 'New User',
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError.message);
            // This error will likely be due to RLS policies. The user must ensure
            // that authenticated users are allowed to insert into the profiles table.
          }
        }
      }
      
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setData(session);
    });
    
    // Fetch the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setData(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(() => ({
    session,
    user,
    signOut,
    loading
  }), [session, user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

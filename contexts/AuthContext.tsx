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
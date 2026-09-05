import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // profile from our `users` table
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return; }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await api.get('/users/me');
      setProfile({
        ...res.data,
        email: authUser.email || res.data?.email
      });
    } catch (err) {
      console.error('Could not fetch user profile:', err.message);
      setProfile({ email: authUser.email });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      fetchProfile(authUser).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      fetchProfile(authUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    isAdmin: profile?.is_admin === true,
    signUp: ({ email, password }) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => {
      setProfile(null);
      return supabase.auth.signOut();
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

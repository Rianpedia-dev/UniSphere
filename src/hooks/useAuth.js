// src/hooks/useAuth.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    try {
      if (!userId || !isMountedRef.current) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Row not found
          // Create profile if it doesn't exist
          if (!isMountedRef.current) return null;

          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user && isMountedRef.current) {
            const newProfile = {
              id: userId,
              username: authUser.user.email?.split('@')[0] || `user_${Math.floor(Math.random() * 10000)}`,
              full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0],
              avatar_url: authUser.user.user_metadata?.avatar_url || null,
              bio: '',
            };

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .upsert(newProfile, { onConflict: 'id' })
              .select()
              .single();

            if (createError) {
              console.error('Error creating profile:', createError);
              return null;
            }
            return createdProfile;
          }
        } else {
          console.error('Error fetching profile:', error);
          return null;
        }
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  const processSession = useCallback(async (session) => {
    if (!session?.user) {
      if (isMountedRef.current) {
        setUser(null);
      }
      return;
    }

    const userProfile = await fetchProfile(session.user.id);
    if (isMountedRef.current) {
      const combinedUser = {
        ...session.user,
        user_metadata: {
          ...session.user.user_metadata,
          ...userProfile,
        },
      };
      setUser(combinedUser);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const getSessionAndSubscribe = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (isMountedRef.current) {
          await processSession(session);
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error('Error getting initial session:', err);
          setError(err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (isMountedRef.current) {
            await processSession(session);
          }
        }
      );

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    };

    const unsubscribePromise = getSessionAndSubscribe();

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      }).catch(error => {
        console.error('Error unsubscribing from auth state changes:', error);
      });
    };
  }, [processSession]);

  const signUp = useCallback(async (email, password, profileData = {}) => {
    const metadata = {
      username: profileData.username || email.split('@')[0],
      full_name: profileData.full_name || email.split('@')[0],
      avatar_url: profileData.avatar_url || null,
      ...profileData,
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    if (data.user && isMountedRef.current) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            email: email,
            username: metadata.username,
            full_name: metadata.full_name,
            bio: profileData.bio || '',
            avatar_url: metadata.avatar_url,
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        console.error('Error creating profile after sign up:', profileError);
      }
    }

    return data;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (isMountedRef.current) {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profileData }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    if (isMountedRef.current) {
      const updatedProfile = { ...data };

      if (updatedProfile.avatar_url) {
        const baseUrl = updatedProfile.avatar_url.split('?')[0];
        updatedProfile.avatar_url = `${baseUrl}?t=${new Date().getTime()}`;
      }

      const newUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...updatedProfile,
        },
      };
      setUser(newUser);
    }

    return data;
  }, [user, isMountedRef]);

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };
};
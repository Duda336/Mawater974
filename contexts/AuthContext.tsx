'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSignOutMessage: (message: string) => void;
  signOutMessage: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  setSignOutMessage: () => {},
  signOutMessage: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  // Function to ensure user profile exists
  const ensureProfile = async (user: User) => {
    try {
      // Check if profile exists
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata.full_name || user.email?.split('@')[0],
              phone_number: user.user_metadata.phone_number || null,
              role: 'normal_user',
            },
          ]);

        if (insertError) throw insertError;
      } else if (fetchError) {
        throw fetchError;
      } else if (profile) {
        // Profile exists, update it with any new metadata
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: user.email,
            full_name: user.user_metadata.full_name || profile.full_name,
            phone_number: user.user_metadata.phone_number || profile.phone_number,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          await ensureProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await ensureProfile(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        // Clear any stored redirect paths
        localStorage.removeItem('redirectAfterLogin');
        
        // Redirect to home page
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error(t('auth.error.emailInUse'));
        } else if (error.message.includes('password')) {
          throw new Error(t('auth.error.weakPassword'));
        } else if (error.message.includes('email')) {
          throw new Error(t('auth.error.invalidEmail'));
        }
        throw new Error(t('auth.error.signUp'));
      }

      // Profile will be created by ensureProfile when auth state changes
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error(error instanceof Error ? error.message : t('auth.error.signUpFailed'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error(t('auth.error.invalidCredentials'));
        }
        throw new Error(t('auth.error.signIn'));
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error instanceof Error ? error.message : t('auth.error.signInFailed'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(t('auth.error.signOut'));
        return;
      }

      // Optional: set a sign-out message that can be displayed on home page
      setSignOutMessage(t('auth.success.signedOut'));
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t('auth.error.signOutFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        setSignOutMessage,
        signOutMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

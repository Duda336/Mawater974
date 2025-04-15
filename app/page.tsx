'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RootPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToCountry = async () => {
      try {
        // Check if we have a saved country in localStorage
        const savedCountryId = typeof window !== 'undefined' ? localStorage.getItem('selectedCountryId') : null;
        
        if (savedCountryId) {
          // Get country code from the saved country ID
          const { data: countryData, error: countryError } = await supabase
            .from('countries')
            .select('code')
            .eq('id', savedCountryId)
            .single();
            
          if (!countryError && countryData) {
            router.push(`/${countryData.code.toLowerCase()}`);
            return;
          }
        }
        
        // If user is logged in, check their profile for country
        if (user && profile?.country_id) {
          const { data: countryData, error: countryError } = await supabase
            .from('countries')
            .select('code')
            .eq('id', profile.country_id)
            .single();
            
          if (!countryError && countryData) {
            router.push(`/${countryData.code.toLowerCase()}`);
            return;
          }
        }
        
        // Default to Qatar if no country is found
        router.push('/qa');
      } catch (error) {
        console.error('Error redirecting to country:', error);
        // Default to Qatar if there's an error
        router.push('/qa');
      } finally {
        setIsLoading(false);
      }
    };
    
    redirectToCountry();
  }, [router, user, profile]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('auth.loading.redirect')}</p>
      </div>
    </div>
  );
}

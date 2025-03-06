'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import AdminNavbar from '../../../components/admin/AdminNavbar';
import CountryAnalytics from '../../../components/admin/CountryAnalytics';

export default function CountryAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [countries, setCountries] = useState([
    { code: 'qa', name: 'Qatar' },
    { code: 'sa', name: 'Saudi Arabia' },
    { code: 'ae', name: 'UAE' },
    { code: 'kw', name: 'Kuwait' },
    { code: 'sy', name: 'Syria' }
  ]);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  const refreshData = () => {
    // This function is just to trigger a re-render of the CountryAnalytics components
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <AdminNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="text-lg text-gray-600 dark:text-gray-400">Checking admin privileges...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Country Analytics</h1>
          <button 
            onClick={refreshData}
            className="flex items-center text-qatar-maroon hover:text-qatar-maroon-dark px-4 py-2 rounded-md border border-qatar-maroon"
          >
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 animate-pulse">
            {countries.map(country => (
              <div key={country.code} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-64"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {countries.map(country => (
              <CountryAnalytics 
                key={country.code} 
                countryCode={country.code} 
                countryName={country.name} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

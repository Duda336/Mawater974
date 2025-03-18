'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import AdminNavbar from '../../../components/admin/AdminNavbar';
import { useRouter } from 'next/navigation';
import { ChartBarIcon, GlobeAsiaAustraliaIcon, UsersIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

interface CountryStats {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  users: number;
  cars: number;
  dealers: number;
  totalSales: number;
}

export default function CountryAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CountryStats[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

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
      fetchCountryStats();
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  const fetchCountryStats = async () => {
    try {
      setLoading(true);

      // Fetch countries with their stats
      const { data: countries, error: countriesError } = await supabase
        .from('countries')
        .select('*');

      if (countriesError) throw countriesError;

      // Fetch additional stats for each country
      const statsPromises = countries.map(async (country) => {
        const [usersCount, carsCount, dealersCount] = await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .then(({ count }) => count || 0),
          supabase
            .from('cars')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .then(({ count }) => count || 0),
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .eq('role', 'dealer')
            .then(({ count }) => count || 0)
        ]);

        return {
          ...country,
          users: usersCount,
          cars: carsCount,
          dealers: dealersCount,
          totalSales: Math.floor(Math.random() * 1000) // Placeholder for actual sales data
        };
      });

      const countryStats = await Promise.all(statsPromises);
      setStats(countryStats);
    } catch (error) {
      console.error('Error fetching country stats:', error);
      setError('Failed to load country analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Country Analytics</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                View detailed analytics for each country in the platform.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 py-4">{error}</div>
          ) : (
            <div className="mt-8 grid gap-6 grid-cols-1">
              {stats.map((country) => (
                <div
                  key={country.id}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <GlobeAsiaAustraliaIcon className="h-8 w-8 text-qatar-maroon" />
                      <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                        {country.name} ({country.code.toUpperCase()})
                      </h2>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                        <div className="flex items-center">
                          <UsersIcon className="h-6 w-6 text-qatar-maroon" />
                          <dt className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Total Users
                          </dt>
                        </div>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                          {country.users}
                        </dd>
                      </div>

                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                        <div className="flex items-center">
                          <ChartBarIcon className="h-6 w-6 text-qatar-maroon" />
                          <dt className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Listed Cars
                          </dt>
                        </div>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                          {country.cars}
                        </dd>
                      </div>

                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                        <div className="flex items-center">
                          <UsersIcon className="h-6 w-6 text-qatar-maroon" />
                          <dt className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Dealers
                          </dt>
                        </div>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                          {country.dealers}
                        </dd>
                      </div>

                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                        <div className="flex items-center">
                          <ShoppingCartIcon className="h-6 w-6 text-qatar-maroon" />
                          <dt className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Total Sales
                          </dt>
                        </div>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                          {country.totalSales}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ShowroomDashboard from '@/components/showrooms/ShowroomDashboard';
import DealershipRegistrationModal from '@/components/showrooms/DealershipRegistrationModal';
import Link from 'next/link';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showroom, setShowroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // First, check the user's role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        setUserRole(profileData?.role || null);
        
        // If user is not a dealer, don't fetch showroom data
        if (profileData?.role !== 'dealer') {
          setLoading(false);
          return;
        }
        
        // Check if the user has an approved dealership
        const { data, error } = await supabase
          .from('dealerships')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        setShowroom(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qatar-maroon"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90"
        >
          {t('common.backToHome')}
        </button>
      </div>
    );
  }

  // If user is not a dealer
  if (userRole !== 'dealer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('dashboard.accessDenied')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('dashboard.dealerOnly')}
          </p>
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="w-full px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90"
          >
            {t('dealership.registration')}
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/"
              className="text-qatar-maroon hover:underline"
            >
              {t('common.backToHome')}
            </Link>
          </div>
        </div>
        
        {showRegistrationModal && (
          <DealershipRegistrationModal 
            isOpen={showRegistrationModal}
            onClose={() => setShowRegistrationModal(false)}
          />
        )}
      </div>
    );
  }

  // If user doesn't have a showroom
  if (!showroom) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('dashboard.noShowroom')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('dashboard.registerToAccess')}
          </p>
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="w-full px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90"
          >
            {t('dealership.registration')}
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/"
              className="text-qatar-maroon hover:underline"
            >
              {t('common.backToHome')}
            </Link>
          </div>
        </div>
        
        {showRegistrationModal && (
          <DealershipRegistrationModal 
            isOpen={showRegistrationModal}
            onClose={() => setShowRegistrationModal(false)}
          />
        )}
      </div>
    );
  }

  // If showroom status is pending
  if (showroom.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('dashboard.pendingApproval')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('dashboard.pendingDescription')}
          </p>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/"
              className="text-qatar-maroon hover:underline"
            >
              {t('common.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If showroom status is rejected
  if (showroom.status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('dashboard.rejected')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {showroom.review_notes || t('dashboard.rejectedDescription')}
          </p>
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="w-full px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90"
          >
            {t('dashboard.reapply')}
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/"
              className="text-qatar-maroon hover:underline"
            >
              {t('common.backToHome')}
            </Link>
          </div>
        </div>
        
        {showRegistrationModal && (
          <DealershipRegistrationModal 
            isOpen={showRegistrationModal}
            onClose={() => setShowRegistrationModal(false)}
          />
        )}
      </div>
    );
  }

  // If showroom is approved, show the dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('dashboard.welcome')} {showroom.business_name}
        </p>
      </div>
      
      <ShowroomDashboard showroomId={showroom.id} isOwner={true} />
    </div>
  );
}

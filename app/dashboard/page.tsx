'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ShowroomDashboard from '@/components/showrooms/ShowroomDashboard';
import DealershipRegistrationModal from '@/components/showrooms/DealershipRegistrationModal';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

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

  const fetchUserData = async () => {
    if (!user) return;
    
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
      
      // Check if the user has a dealership (any status)
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

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    fetchUserData();
    
    // Set up real-time subscription for dealership status changes
    const channel = supabase
      .channel('dealership-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dealerships',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Dealership update received:', payload);
          
          // Update the showroom data
          setShowroom(payload.new);
          
          // Show notification if status changed
          if (payload.old.status !== payload.new.status) {
            if (payload.new.status === 'approved') {
              toast.success(t('dealership.approved'), {
                duration: 5000,
                icon: '✅',
              });
              
              // Refresh the page to update user role and access
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else if (payload.new.status === 'rejected') {
              toast.error(t('dealership.rejected'), {
                duration: 5000,
                icon: '❌',
              });
            }
          }
        }
      )
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qatar-maroon"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <>
          {userRole === 'dealer' ? (
            <ShowroomDashboard showroomId={showroom.id} isOwner={true} />
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{t('dashboard.welcome')}</h2>
              
              {showroom ? (
                <div className="mb-6">
                  {showroom.status === 'pending' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded mb-4">
                      <h3 className="font-bold text-lg">{t('dashboard.pendingTitle')}</h3>
                      <p>{t('dashboard.pendingDescription')}</p>
                    </div>
                  )}
                  
                  {showroom.status === 'rejected' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
                      <h3 className="font-bold text-lg">{t('dashboard.rejectedTitle')}</h3>
                      <p>{t('dashboard.rejectedDescription')}</p>
                      {showroom.review_notes && (
                        <div className="mt-2">
                          <h4 className="font-semibold">{t('dashboard.feedback')}:</h4>
                          <p className="italic">{showroom.review_notes}</p>
                        </div>
                      )}
                      <button
                        onClick={() => setShowRegistrationModal(true)}
                        className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                      >
                        {t('dashboard.reapply')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <p className="mb-4">{t('dashboard.registerDealershipDescription')}</p>
                  <button
                    onClick={() => setShowRegistrationModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                  >
                    {t('dashboard.registerDealership')}
                  </button>
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">{t('dashboard.exploreOptions')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/showrooms" className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-4 rounded-lg transition-colors">
                    <h4 className="font-medium text-lg mb-2">{t('dashboard.exploreShowrooms')}</h4>
                    <p className="text-gray-600 dark:text-gray-300">{t('dashboard.exploreShowroomsDescription')}</p>
                  </Link>
                  <Link href="/cars" className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-4 rounded-lg transition-colors">
                    <h4 className="font-medium text-lg mb-2">{t('dashboard.exploreCars')}</h4>
                    <p className="text-gray-600 dark:text-gray-300">{t('dashboard.exploreCarsDescription')}</p>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      <DealershipRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
      />
    </div>
  );
}

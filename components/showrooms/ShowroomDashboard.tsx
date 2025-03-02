'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import CarListingForm from './CarListingForm';
import CarListingCard from './CarListingCard';

interface ShowroomDashboardProps {
  showroomId: number;
  isOwner: boolean;
}

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
}

export default function ShowroomDashboard({ showroomId, isOwner }: ShowroomDashboardProps) {
  const { t } = useLanguage();
  const { supabase } = useSupabase();
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalInquiries: 0
  });
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('car_listings')
        .select('*')
        .eq('showroom_id', showroomId)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;
      setListings(listingsData || []);

      // Calculate stats
      const activeListings = listingsData?.filter(l => l.status === 'active').length || 0;
      const totalViews = listingsData?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0;

      // Fetch inquiries count
      const { count: inquiriesCount, error: inquiriesError } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('showroom_id', showroomId);

      if (inquiriesError) throw inquiriesError;

      setStats({
        totalListings: listingsData?.length || 0,
        activeListings,
        totalViews,
        totalInquiries: inquiriesCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [showroomId]);

  const handleDeleteListing = async (listingId: number) => {
    if (!confirm(t('car.deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('car_listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert(t('errors.deleteListing'));
    }
  };

  if (!isOwner) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{t('dashboard.totalListings')}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalListings}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{t('dashboard.activeListings')}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.activeListings}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{t('dashboard.totalViews')}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{t('dashboard.totalInquiries')}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('dashboard.yourListings')}</h2>
        <button
          onClick={() => setIsAddingCar(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          <PlusIcon className="h-5 w-5" />
          {t('car.addNew')}
        </button>
      </div>

      {/* Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div key={listing.id} className="relative group">
            <CarListingCard listing={listing} />
            
            {/* Actions Overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDeleteListing(listing.id)}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
                title={t('common.delete')}
              >
                <TrashIcon className="h-5 w-5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Car Modal */}
      <CarListingForm
        showroomId={showroomId}
        isOpen={isAddingCar}
        onClose={() => setIsAddingCar(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}

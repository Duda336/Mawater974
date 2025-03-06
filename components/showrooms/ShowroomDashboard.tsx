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
      // Fetch listings from car_listings table
      const { data: carListingsData, error: carListingsError } = await supabase
        .from('car_listings')
        .select('*')
        .eq('showroom_id', showroomId)
        .order('created_at', { ascending: false });

      if (carListingsError) throw carListingsError;
      
      // Fetch cars from cars table with dealership_id
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*, brands(name), models(name)')
        .eq('dealership_id', showroomId)
        .order('created_at', { ascending: false });

      if (carsError) throw carsError;
      
      // Transform cars data to match car_listings format
      const transformedCarsData = carsData?.map(car => ({
        id: car.id,
        showroom_id: car.dealership_id,
        title: `${car.brands?.name || ''} ${car.models?.name || ''} ${car.year}`,
        title_ar: `${car.brands?.name || ''} ${car.models?.name || ''} ${car.year}`,
        description: car.description || '',
        description_ar: car.description || '',
        price: car.price,
        year: car.year,
        make: car.brands?.name || '',
        model: car.models?.name || '',
        mileage: car.mileage,
        exterior_color: car.color,
        transmission: car.gearbox_type,
        fuel_type: car.fuel_type,
        body_type: car.body_type,
        condition: car.condition,
        images: car.images || [car.image].filter(Boolean),
        status: car.status,
        is_featured: car.is_featured,
        views_count: car.views_count || 0,
        created_at: car.created_at,
        updated_at: car.updated_at,
        source_table: 'cars' // Add a field to identify the source table
      })) || [];
      
      // Combine both data sources
      const combinedListings = [
        ...(carListingsData || []).map(listing => ({ ...listing, source_table: 'car_listings' })),
        ...transformedCarsData
      ];
      
      setListings(combinedListings);

      // Calculate stats
      const totalListings = combinedListings.length;
      const activeListings = combinedListings.filter(l => 
        (l.source_table === 'car_listings' && l.status === 'active') || 
        (l.source_table === 'cars' && l.status === 'Approved')
      ).length;
      const totalViews = combinedListings.reduce((sum, l) => sum + (l.views_count || 0), 0);

      // Fetch inquiries count
      const { count: inquiriesCount, error: inquiriesError } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('showroom_id', showroomId);

      if (inquiriesError) throw inquiriesError;

      setStats({
        totalListings,
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

  const handleDeleteListing = async (listingId: number, sourceTable: string) => {
    if (!confirm(t('car.deleteConfirm'))) return;

    try {
      let error;
      
      if (sourceTable === 'car_listings') {
        const { error: deleteError } = await supabase
          .from('car_listings')
          .delete()
          .eq('id', listingId);
        error = deleteError;
      } else {
        const { error: deleteError } = await supabase
          .from('cars')
          .delete()
          .eq('id', listingId);
        error = deleteError;
      }

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.totalListings')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalListings}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.activeListings')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeListings}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.totalViews')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.totalInquiries')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalInquiries}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('dashboard.yourListings')}</h2>
        <button
          onClick={() => setIsAddingCar(true)}
          className="flex items-center gap-2 px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          {t('car.addNew')}
        </button>
      </div>

      {/* Listings */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={`${listing.source_table}-${listing.id}`} className="relative group">
              <CarListingCard listing={listing} />
              
              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeleteListing(listing.id, listing.source_table)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  title={t('common.delete')}
                >
                  <TrashIcon className="h-5 w-5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-300 mb-4">{t('dashboard.noListings')}</p>
          <button
            onClick={() => setIsAddingCar(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            {t('car.addNew')}
          </button>
        </div>
      )}

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

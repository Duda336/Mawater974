'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  TruckIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

type Car = Database['public']['Tables']['cars']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];
type Model = Database['public']['Tables']['models']['Row'];

interface ExtendedCar extends Car {
  brand: Brand;
  model: Model;
  images: { url: string; is_main: boolean }[];
}

export default function MyAdsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'sold'>('all');
  const [selectedCar, setSelectedCar] = useState<ExtendedCar | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
  }>>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserCars();
      fetchNotifications();
    }
  }, [user]);

  const fetchUserCars = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }

      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(*),
          model:models(*),
          images:car_images(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cars:', error);
        throw error;
      }

      if (!data) {
        console.log('No cars found');
        setCars([]);
        return;
      }

      // Transform the data to match ExtendedCar interface
      const transformedCars = data.map(car => ({
        ...car,
        brand: car.brand,
        model: car.model,
        images: car.images.map(img => ({
          url: img.url,
          is_main: img.is_main
        }))
      }));

      console.log('Fetched cars:', transformedCars);
      setCars(transformedCars);
    } catch (error) {
      console.error('Error fetching user cars:', error);
      toast.error(t('myAds.error.loadListings'));
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Get total count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get recent notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNotifications(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'Sold':
        return <TagIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const filteredCars = cars.filter(car => {
    if (filter === 'all') return true;
    return car.status.toLowerCase() === filter;
  });

  const handleDelete = async () => {
    if (!selectedCar) return;
    
    setActionLoading(true);
    try {
      // Delete car images first
      const { error: imagesError } = await supabase
        .from('car_images')
        .delete()
        .eq('car_id', selectedCar.id);

      if (imagesError) throw imagesError;

      // Then delete the car
      const { error: carError } = await supabase
        .from('cars')
        .delete()
        .eq('id', selectedCar.id);

      if (carError) throw carError;

      toast.success(t('myAds.success.deleted'));
      setShowDeleteModal(false);
      fetchUserCars(); // Refresh the list
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error(t('myAds.error.delete'));
    } finally {
      setActionLoading(false);
      setSelectedCar(null);
    }
  };

  const handleMarkAsSold = async () => {
    if (!selectedCar) return;
    
    setActionLoading(true);
    try {
      // Update car status
      const { error: carError } = await supabase
        .from('cars')
        .update({ status: 'Sold' })
        .eq('id', selectedCar.id);

      if (carError) throw carError;

      // Create notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          title: t('myAds.success.soldNotification'),
          message: t('myAds.success.soldMessage', { brand: selectedCar.brand.name, model: selectedCar.model.name }),
          type: 'sold',
          is_read: false,
        });

      if (notificationError) throw notificationError;

      toast.success(t('myAds.success.markedSold'));
      setShowSoldModal(false);
      await Promise.all([
        fetchUserCars(), // Refresh the cars list
        fetchNotifications(), // Refresh notifications
      ]);
    } catch (error) {
      console.error('Error marking car as sold:', error);
      toast.error(t('myAds.error.markSold'));
    } finally {
      setActionLoading(false);
      setSelectedCar(null);
    }
  };

  const handleEdit = async (car: ExtendedCar) => {
    try {
      // If the car was approved, set it back to pending
      if (car.status === 'Approved') {
        const { error: updateError } = await supabase
          .from('cars')
          .update({ status: 'Pending' })
          .eq('id', car.id);

        if (updateError) throw updateError;

        // Create notification for status change
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: user?.id,
            title: t('myAds.notifications.statusChange'),
            message: t('myAds.notifications.pendingReview'),
            type: 'status_change',
            is_read: false,
          });

        if (notificationError) throw notificationError;

        toast.success(t('myAds.success.pendingReview'));
      }

      // Navigate to edit page
      router.push(`/sell?edit=${car.id}`);
    } catch (error) {
      console.error('Error updating car status:', error);
      toast.error(t('myAds.error.statusUpdate'));
    }
  };

  const handleSetMainPhoto = async (carId: number, imageUrl: string) => {
    setActionLoading(true);
    try {
      // First, reset all images to not main
      const { error: resetError } = await supabase
        .from('car_images')
        .update({ is_main: false })
        .eq('car_id', carId);

      if (resetError) throw resetError;

      // Then set the selected image as main
      const { error: updateError } = await supabase
        .from('car_images')
        .update({ is_main: true })
        .eq('car_id', carId)
        .eq('url', imageUrl);

      if (updateError) throw updateError;

      toast.success(t('myAds.success.mainPhoto'));
      fetchUserCars(); // Refresh the list
    } catch (error) {
      console.error('Error setting main photo:', error);
      toast.error(t('myAds.error.mainPhoto'));
    } finally {
      setActionLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('myAds.title')}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t('myAds.subtitle')}
              </p>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
            >
              <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              {t('myAds.createListing')}
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-0">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setFilter('all')}
                className={`${
                  filter === 'all'
                    ? 'border-qatar-maroon text-qatar-maroon'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('myAds.filter.all')}
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`${
                  filter === 'pending'
                    ? 'border-qatar-maroon text-qatar-maroon'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('myAds.filter.pending')}
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`${
                  filter === 'approved'
                    ? 'border-qatar-maroon text-qatar-maroon'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('myAds.filter.approved')}
              </button>
              <button
                onClick={() => setFilter('sold')}
                className={`${
                  filter === 'sold'
                    ? 'border-qatar-maroon text-qatar-maroon'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('myAds.filter.sold')}
              </button>
            </nav>
          </div>
        </div>

        {/* Car Listings */}
        {!loading && filteredCars.length > 0 && (
          <div className="mt-8 px-4 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCars.map((car) => (
                <div
                  key={car.id}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
                >
                  {/* Car Image and Status */}
                  <div className="aspect-w-16 aspect-h-9 relative h-48">
                    {car.images && car.images.length > 0 ? (
                      <Image
                        src={car.images.find(img => img.is_main)?.url || car.images[0].url}
                        alt={`${car.brand.name} ${car.model.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                        className="object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                        <TruckIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium shadow-lg" style={{
                      backgroundColor: car.status === 'Approved' ? 'rgba(34, 197, 94, 0.9)' : 
                                     car.status === 'Pending' ? 'rgba(234, 179, 8, 0.9)' :
                                     car.status === 'Sold' ? 'rgba(59, 130, 246, 0.9)' :
                                     'rgba(239, 68, 68, 0.9)',
                      color: 'white'
                    }}>
                      {t(`myAds.status.${car.status}`)}
                    </div>
                  </div>

                  {/* Car Details */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {car.brand.name} {car.model.name}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      <p>
                        <span className="font-medium">{t('myAds.car.price')}:</span>{' '}
                        {car.price.toLocaleString()} QAR
                      </p>
                      <p>
                        <span className="font-medium">{t('myAds.car.mileage')}:</span>{' '}
                        {car.mileage.toLocaleString()} km
                      </p>
                      <p>
                        <span className="font-medium">{t('myAds.car.location')}:</span>{' '}
                        {t(`myAds.locations.${car.location.toLowerCase().replace(/\s+/g, '')}`)}
                      </p>
                      <p>
                        <span className="font-medium">{t('myAds.car.posted')}:</span>{' '}
                        {new Date(car.created_at).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">{t('myAds.car.views')}:</span>{' '}
                        {car.views || 0}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(car)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                      >
                        <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                        {t('myAds.actions.edit')}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCar(car);
                          setShowSoldModal(true);
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                      >
                        <ShoppingBagIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                        {t('myAds.actions.markSold')}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCar(car);
                          setShowDeleteModal(true);
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                      >
                        <TrashIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                        {t('myAds.actions.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No listings state */}
        {!loading && filteredCars.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('myAds.noListings')}
            </h3>
            <div className="mt-6">
              <Link
                href="/sell"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                {t('myAds.createListing')}
              </Link>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
              ></div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {t('myAds.delete.title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('myAds.delete.message')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                    onClick={handleDelete}
                    disabled={actionLoading}
                  >
                    {t('myAds.delete.confirm')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    {t('myAds.delete.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mark as Sold Modal */}
        {showSoldModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
              ></div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {t('myAds.sold.title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('myAds.sold.message')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    onClick={handleMarkAsSold}
                    disabled={actionLoading}
                  >
                    {t('myAds.sold.confirm')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setShowSoldModal(false)}
                  >
                    {t('myAds.sold.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

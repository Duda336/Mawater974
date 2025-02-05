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

type Car = Database['public']['Tables']['cars']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];
type Model = Database['public']['Tables']['models']['Row'];

interface ExtendedCar extends Car {
  brand: Brand;
  model: Model;
  images: { url: string }[];
}

export default function MyAdsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'sold'>('all');
  const [selectedCar, setSelectedCar] = useState<ExtendedCar | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserCars();
    }
  }, [user]);

  const fetchUserCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(*),
          model:models(*),
          images:car_images(url)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching user cars:', error);
      toast.error('Failed to load your car listings');
    } finally {
      setLoading(false);
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

      toast.success('Car listing deleted successfully');
      setShowDeleteModal(false);
      fetchUserCars(); // Refresh the list
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error('Failed to delete car listing');
    } finally {
      setActionLoading(false);
      setSelectedCar(null);
    }
  };

  const handleMarkAsSold = async () => {
    if (!selectedCar) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: 'Sold' })
        .eq('id', selectedCar.id);

      if (error) throw error;

      toast.success('Car marked as sold');
      setShowSoldModal(false);
      fetchUserCars(); // Refresh the list
    } catch (error) {
      console.error('Error marking car as sold:', error);
      toast.error('Failed to mark car as sold');
    } finally {
      setActionLoading(false);
      setSelectedCar(null);
    }
  };

  const handleEdit = (car: ExtendedCar) => {
    router.push(`/sell?edit=${car.id}`);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
              My Car Listings
            </h1>
            <Link
              href="/sell"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              List New Car
            </Link>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            {(['all', 'pending', 'approved', 'sold'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap ${
                  filter === status
                    ? 'bg-qatar-maroon text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'All Listings' : `${status} Cars`}
              </button>
            ))}
          </div>
        </div>

        {filteredCars.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No cars found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all'
                ? "You haven't listed any cars yet"
                : `You don't have any ${filter} car listings`}
            </p>
            <div className="mt-6">
              <Link
                href="/sell"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                List Your First Car
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCars.map((car) => (
              <div
                key={car.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link href={`/cars/${car.id}`} className="block">
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <Image
                      src={car.images?.[0]?.url || '/placeholder-car.png'}
                      alt={`${car.brand.name} ${car.model.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {car.brand.name} {car.model.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {car.year} • {car.mileage.toLocaleString()} km
                        </p>
                      </div>
                      {getStatusIcon(car.status)}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-qatar-maroon text-lg font-semibold">
                        QAR {car.price.toLocaleString()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${car.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        car.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        car.status === 'Sold' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}
                      >
                        {car.status}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
                  <div className="flex justify-between">
                    <button
                      onClick={() => handleEdit(car)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    {car.status !== 'Sold' && (
                      <button
                        onClick={() => {
                          setSelectedCar(car);
                          setShowSoldModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <ShoppingBagIcon className="h-4 w-4 mr-1" />
                        Mark as Sold
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCar(car);
                        setShowDeleteModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delete Car Listing
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete this car listing? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCar(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Sold Modal */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Mark Car as Sold
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to mark this car as sold? This will remove it from active listings.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSoldModal(false);
                  setSelectedCar(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsSold}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Mark as Sold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

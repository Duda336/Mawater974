'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Car } from '../../../types/supabase';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ExtendedCar extends Car {
  brand: {
    name: string;
  };
  model: {
    name: string;
  };
  user: {
    full_name: string;
    email: string;
  };
  images: {
    id: number;
    car_id: number;
    url: string;
  }[];
}

export default function AdminCarsPage() {
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchCars();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(profile?.role === 'admin');
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(name),
          model:models(name),
          images:car_images(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (carId: number, newStatus: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: newStatus })
        .eq('id', carId);

      if (error) throw error;

      // Create notification for the user
      const car = cars.find(c => c.id === carId);
      if (car) {
        await supabase.from('notifications').insert({
          user_id: car.user_id,
          title: `Car Listing ${newStatus}`,
          message: `Your car listing for ${car.brand.name} ${car.model.name} has been ${newStatus.toLowerCase()}.`
        });
      }

      // Refresh the cars list
      fetchCars();
    } catch (err) {
      console.error('Error updating car status:', err);
      setError('Failed to update car status');
    }
  };

  const handleDelete = async (carId: number) => {
    if (!confirm('Are you sure you want to delete this car listing?')) return;

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;

      // Refresh the cars list
      fetchCars();
    } catch (err) {
      console.error('Error deleting car:', err);
      setError('Failed to delete car');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">You do not have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Car Listings</h1>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-qatar-maroon border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Car</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {cars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {car.images && car.images.length > 0 && (
                            <img
                              src={car.images[0].url}
                              alt={`${car.brand.name} ${car.model.name}`}
                              className="h-10 w-10 rounded-full object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {car.brand.name} {car.model.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {car.year} • {car.mileage.toLocaleString()} km
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{car.user.full_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{car.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            car.status === 'Approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : car.status === 'Rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }
                        `}>
                          {car.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {car.price.toLocaleString()} QAR
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(car.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {car.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(car.id, 'Approved')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
                              title="Approve"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(car.id, 'Rejected')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                              title="Reject"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <Link
                          href={`/cars/${car.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(car.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

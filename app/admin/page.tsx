'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database, Profile, CarBrand, CarModel } from '../../types/supabase';
import Image from 'next/image';
import ImageUpload from '../../components/ImageUpload';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type Car = Database['public']['Tables']['cars']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];
type Model = Database['public']['Tables']['models']['Row'];

interface ExtendedCar extends Car {
  brand: Brand;
  model: Model;
  seller: Profile;
  images: { url: string }[];
}

interface Analytics {
  totalCars: number;
  pendingCars: number;
  approvedCars: number;
  soldCars: number;
  totalUsers: number;
  recentActivity: {
    timestamp: string;
    action: string;
    details: string;
  }[];
  carsByBrand: {
    brand: string;
    count: number;
  }[];
}

interface UserWithStats extends Profile {
  total_ads: number;
}

interface CarDetails extends Car {
  brand: Brand;
  model: Model;
  seller: Profile;
  images: { url: string }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'cars' | 'users'>('analytics');
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCars: 0,
    pendingCars: 0,
    approvedCars: 0,
    soldCars: 0,
    totalUsers: 0,
    recentActivity: [],
    carsByBrand: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCar, setSelectedCar] = useState<CarDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [selectedTab, setSelectedTab] = useState('cars');
  const [carListings, setCarListings] = useState<ExtendedCar[]>([]);
  const [carListingsStatus, setCarListingsStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [isLoading, setIsLoading] = useState(false);
  const [errorCar, setErrorCar] = useState<string | null>(null);

  const fetchCarListings = async (status: 'Pending' | 'Approved' | 'Rejected') => {
    setIsLoading(true);
    setErrorCar(null);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(id, name),
          model:models(id, name),
          user:profiles(id, full_name, email, phone_number),
          images:car_images(id, url)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarListings(data as ExtendedCar[]);
    } catch (error: any) {
      console.error('Error fetching car listings:', error);
      setErrorCar(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCarAction = async (carId: number, newStatus: 'Approved' | 'Rejected') => {
    try {
      // Update car status
      const { error: updateError } = await supabase
        .from('cars')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);

      if (updateError) throw updateError;

      // Log admin action
      const { error: logError } = await supabase
        .from('admin_logs')
        .insert([{
          admin_id: user?.id,
          action_type: 'update',
          table_name: 'cars',
          record_id: carId,
          changes: {
            status: {
              old: carListingsStatus,
              new: newStatus
            }
          },
          created_at: new Date().toISOString()
        }]);

      if (logError) throw logError;

      // Update local state
      setCarListings(prevListings => prevListings.filter(car => car.id !== carId));
      
      // Show success message
      // toast.success(`Car listing ${newStatus.toLowerCase()} successfully`);

      // Send notification to the user (if we have a notifications table)
      try {
        const car = carListings.find(c => c.id === carId);
        if (car) {
          await supabase
            .from('notifications')
            .insert([{
              user_id: car.user_id,
              type: 'car_status_update',
              title: `Car Listing ${newStatus}`,
              message: `Your car listing (${car.brand.name} ${car.model.name}) has been ${newStatus.toLowerCase()}.`,
              created_at: new Date().toISOString()
            }]);
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }

    } catch (error: any) {
      console.error('Error updating car status:', error);
      // toast.error(error.message || 'Failed to update car status');
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (!profile || profile.role !== 'admin') {
          console.log('Not an admin, redirecting...', profile);
          router.push('/');
          return;
        }

        setIsAdmin(true);
        fetchData();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      }
    };

    checkAdminStatus();
  }, [user, router, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch cars with related data
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(*),
          model:models(*),
          seller:profiles!user_id(*),
          images:car_images(url)
        `)
        .order('created_at', { ascending: false });

      if (carsError) throw carsError;

      // Fetch users with their car counts
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          cars:cars(count)
        `);

      if (usersError) throw usersError;

      // Process analytics data
      const analyticsData: Analytics = {
        totalCars: carsData?.length || 0,
        pendingCars: carsData?.filter(car => car.status === 'Pending').length || 0,
        approvedCars: carsData?.filter(car => car.status === 'Approved').length || 0,
        soldCars: carsData?.filter(car => car.status === 'Sold').length || 0,
        totalUsers: usersData?.length || 0,
        recentActivity: [],
        carsByBrand: []
      };

      // Calculate cars by brand
      const brandCounts = new Map<string, number>();
      carsData?.forEach(car => {
        const brandName = car.brand?.name || 'Unknown';
        brandCounts.set(brandName, (brandCounts.get(brandName) || 0) + 1);
      });
      analyticsData.carsByBrand = Array.from(brandCounts.entries())
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count);

      // Get recent activity
      const recentCars = carsData?.slice(0, 5).map(car => ({
        timestamp: car.created_at,
        action: 'New Car Listed',
        details: `${car.brand?.name} ${car.model?.name} (${car.year})`
      })) || [];

      const recentUsers = usersData?.slice(0, 5).map(user => ({
        timestamp: user.created_at,
        action: 'New User Joined',
        details: user.full_name || user.email || 'Anonymous'
      })) || [];

      analyticsData.recentActivity = [...recentCars, ...recentUsers]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      const usersWithStats = usersData.map(user => ({
        ...user,
        total_ads: user.cars?.[0]?.count || 0
      }));

      setCars(carsData);
      setUsers(usersWithStats);
      setAnalytics(analyticsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;

      setCars(cars.filter(car => car.id !== carId));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting car:', error);
      setError(error.message);
    }
  };

  const handleEditCar = async (carData: CarDetails) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({
          price: carData.price,
          mileage: carData.mileage,
          description: carData.description,
          status: carData.status,
            updated_at: new Date().toISOString()
        })
        .eq('id', carData.id);

      if (error) throw error;

      setCars(cars.map(car => car.id === carData.id ? { ...car, ...carData } : car));
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating car:', error);
      setError(error.message);
    }
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Cars</p>
              <p className="text-2xl font-semibold">{analytics.totalCars}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-2xl font-semibold">{analytics.pendingCars}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Listings</p>
              <p className="text-2xl font-semibold">{analytics.approvedCars}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold">{analytics.totalUsers}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Cars by Brand */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Cars by Brand</h3>
        <div className="space-y-4">
          {analytics.carsByBrand.slice(0, 5).map(({ brand, count }) => (
            <div key={brand} className="flex items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{brand}</span>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(count / analytics.totalCars) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {analytics.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {activity.action.includes('Car') ? (
                    <TagIcon className="h-4 w-4 text-blue-500" />
                  ) : (
                    <UsersIcon className="h-4 w-4 text-purple-500" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-sm text-gray-500">{activity.details}</p>
                <p className="text-xs text-gray-400">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const handleCarStatusChange = async (carId: number, newStatus: 'Pending' | 'Approved' | 'Sold') => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: newStatus })
        .eq('id', carId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert([{
        admin_id: user!.id,
        action_type: 'update_car_status',
        table_name: 'cars',
        record_id: carId,
        changes: { status: newStatus }
      }]);

      setCars(cars.map(car => 
        car.id === carId ? { ...car, status: newStatus } : car
      ));
    } catch (error: any) {
      console.error('Error updating car status:', error);
      setError(error.message);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: 'normal_user' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert([{
        admin_id: user!.id,
        action_type: 'update_user_role',
        table_name: 'profiles',
        record_id: parseInt(userId),
        changes: { role: newRole }
      }]);

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error: any) {
      console.error('Error updating user role:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    if (selectedTab === 'cars') {
      fetchCarListings(carListingsStatus);
    }
  }, [selectedTab, carListingsStatus]);

  const renderCarListings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Car Listings</h2>
        <div className="flex space-x-4">
          {(['Pending', 'Approved', 'Rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setCarListingsStatus(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                carListingsStatus === status
                  ? 'bg-qatar-maroon text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {errorCar && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200">{errorCar}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
        </div>
      ) : carListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No {carListingsStatus.toLowerCase()} listings found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {carListings.map((car) => (
            <div key={car.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {car.brand.name} {car.model.name} ({car.year})
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Listed by {car.user.full_name} • {new Date(car.created_at).toLocaleDateString()}
                  </p>
                </div>
                {carListingsStatus === 'Pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCarAction(car.id, 'Approved')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleCarAction(car.id, 'Rejected')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</label>
                      <p className="text-sm text-gray-900 dark:text-white">{car.price.toLocaleString()} QAR</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mileage</label>
                      <p className="text-sm text-gray-900 dark:text-white">{car.mileage.toLocaleString()} km</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fuel Type</label>
                      <p className="text-sm text-gray-900 dark:text-white">{car.fuel_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Transmission</label>
                      <p className="text-sm text-gray-900 dark:text-white">{car.gearbox_type}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{car.description || 'No description provided'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Images</label>
                  <div className="grid grid-cols-3 gap-2">
                    {car.images && car.images.length > 0 ? (
                      car.images.map((image, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <Image
                            src={image.url}
                            alt={`${car.brand.name} ${car.model.name}`}
                            fill
                            sizes="(max-width: 768px) 33vw, 25vw"
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No images</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Show loading state while checking auth and admin status
  if (authLoading || (loading && !isAdmin)) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
          </div>
        </div>
      </div>
    );
  }

  // If not admin, this will redirect but we'll show loading state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-qatar-maroon text-qatar-maroon'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5" />
                <span>Analytics</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cars')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cars'
                  ? 'border-qatar-maroon text-qatar-maroon'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TagIcon className="h-5 w-5" />
                <span>Cars</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-qatar-maroon text-qatar-maroon'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5" />
                <span>Users</span>
              </div>
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-md mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            {activeTab === 'analytics' ? (
              renderAnalytics()
            ) : activeTab === 'cars' ? (
              renderCarListings()
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                {/* Users Table */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}<br />
                            {user.phone_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleUserRoleChange(user.id, user.role === 'admin' ? 'normal_user' : 'admin')}
                            className="text-qatar-maroon hover:text-qatar-maroon-dark"
                          >
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // View Car Modal
  if (isViewModalOpen && selectedCar) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedCar.brand.name} {selectedCar.model.name}
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {selectedCar.images?.map((image, index) => (
                <Image
                  key={index}
                  src={image.url}
                  alt={`Car image ${index + 1}`}
                  width={300}
                  height={200}
                  className="rounded-lg object-cover"
                />
              ))}
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Details</h4>
                <dl className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Year</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{selectedCar.year}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Mileage</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {selectedCar.mileage.toLocaleString()} km
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Price</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      QAR {selectedCar.price.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{selectedCar.status}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Description</h4>
                <p className="mt-2 text-sm text-gray-500">{selectedCar.description}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Seller Information</h4>
                <dl className="mt-2">
                  <div>
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {selectedCar.seller.full_name}
                    </dd>
                  </div>
                  <div className="mt-2">
                    <dt className="text-sm text-gray-500">Contact</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {selectedCar.seller.phone_number}
                      <br />
                      {selectedCar.seller.email}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit Car Modal
  if (isEditModalOpen && selectedCar) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Edit Car Listing
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditCar(selectedCar);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (QAR)
                </label>
                <input
                  type="number"
                  value={selectedCar.price}
                  onChange={(e) => setSelectedCar({ ...selectedCar, price: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mileage (km)
                </label>
                <input
                  type="number"
                  value={selectedCar.mileage}
                  onChange={(e) => setSelectedCar({ ...selectedCar, mileage: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={selectedCar.description || ''}
                  onChange={(e) => setSelectedCar({ ...selectedCar, description: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={selectedCar.status}
                  onChange={(e) => setSelectedCar({ ...selectedCar, status: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-qatar-maroon rounded-md hover:bg-qatar-maroon-dark"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Delete Confirmation Modal
  if (isDeleteModalOpen && selectedCar) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Car Listing
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this car listing? This action cannot be undone.
                  </p>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCar(selectedCar.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

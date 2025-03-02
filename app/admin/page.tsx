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
  StarIcon,
  CurrencyDollarIcon,
  DatabaseIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import PlaceholderCar from '../../components/PlaceholderCar';
import DatabaseManager from '../../components/admin/DatabaseManager';
import { ChevronRightIcon, PlusIcon, PencilIcon as PencilIcon2, CogIcon, TrashIcon as TrashIcon2 } from '@heroicons/react/24/outline';

type Car = Database['public']['Tables']['cars']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];
type Model = Database['public']['Tables']['models']['Row'];

interface ExtendedCar extends Car {
  brand: Brand;
  model: Model;
  seller: Profile;
  images: string[];
  thumbnail: string;
}

interface Analytics {
  totalCars: number;
  pendingCars: number;
  activeCars: number;
  soldCars: number;
  featuredCars: number;
  featuredPercentage: number;
  totalRevenue: number;
  averagePrice: number;
  totalUsers: number;
  adminUsers: number;
  normalUsers: number;
  recentActivity: {
    timestamp: string;
    action: string;
    details: string;
  }[];
  carsByBrand: {
    brand: string;
    count: number;
    activeCount: number;
    soldCount: number;
    pendingCount: number;
    totalRevenue: number;
    averagePrice: number;
  }[];
  pendingCarsList: {
    id: number;
    brand: string;
    model: string;
    year: number;
    price: number;
    seller: string;
  }[];
}

interface UserWithStats extends Profile {
  total_ads: number;
}

interface CarDetails extends Car {
  brand: Brand;
  model: Model;
  seller: Profile;
  images: string[];
  thumbnail: string;
}

type ViewMode = 'grid' | 'list';
type CarStatus = 'Pending' | 'Approved' | 'Rejected' | 'Sold';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'database'>('analytics');
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCars: 0,
    pendingCars: 0,
    activeCars: 0,
    soldCars: 0,
    featuredCars: 0,
    featuredPercentage: 0,
    totalRevenue: 0,
    averagePrice: 0,
    totalUsers: 0,
    adminUsers: 0,
    normalUsers: 0,
    recentActivity: [],
    carsByBrand: [],
    pendingCarsList: []
  });
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('cars');
  const [carListings, setCarListings] = useState<ExtendedCar[]>([]);
  const [carListingsStatus, setCarListingsStatus] = useState<CarStatus>('Pending');
  const [isLoading, setIsLoading] = useState(false);
  const [errorCar, setErrorCar] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('oldest');
  const [expandedBrands, setExpandedBrands] = useState<{ [key: string]: boolean }>({});
  const [showAllBrands, setShowAllBrands] = useState(false);

  const handleUpdateBrand = async (brand: any) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ name: brand.name, logo_url: brand.logo_url })
        .eq('id', brand.id);

      if (error) throw error;

      setBrands(brands.map((b) => (b.id === brand.id ? brand : b)));
      setEditingBrand(null);
    } catch (error) {
      console.error('Error updating brand:', error);
      setError(error.message);
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;

      setBrands(brands.filter((brand) => brand.id !== brandId));
    } catch (error) {
      console.error('Error deleting brand:', error);
      setError(error.message);
    }
  };

  const handleUpdateModel = async (model: any) => {
    try {
      const { error } = await supabase
        .from('models')
        .update({ name: model.name })
        .eq('id', model.id);

      if (error) throw error;

      setModels(models.map((m) => (m.id === model.id ? model : m)));
      setEditingModel(null);
    } catch (error) {
      console.error('Error updating model:', error);
      setError(error.message);
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', modelId);

      if (error) throw error;

      setModels(models.filter((model) => model.id !== modelId));
    } catch (error) {
      console.error('Error deleting model:', error);
      setError(error.message);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.name.trim()) {
      setError('Brand name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brands')
        .insert([
          {
            name: newBrand.name.trim(),
            logo_url: newBrand.logo_url.trim()
          }
        ])
        .select();

      if (error) throw error;

      setBrands([...brands, data[0]]);
      setNewBrand({ name: '', logo_url: '' });
    } catch (error) {
      console.error('Error adding brand:', error);
      setError(error.message);
    }
  };

  const handleAddModel = async () => {
    if (!selectedBrand) {
      setError('Please select a brand first');
      return;
    }

    if (!newModel.name.trim()) {
      setError('Model name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('models')
        .insert([
          {
            name: newModel.name.trim(),
            brand_id: selectedBrand
          }
        ])
        .select();

      if (error) throw error;

      setModels([...models, data[0]]);
      setNewModel({ name: '', brand_id: '' });
    } catch (error) {
      console.error('Error adding model:', error);
      setError(error.message);
    }
  };

  const fetchCarListings = async (status: 'Pending' | 'Approved' | 'Rejected' | 'Sold') => {
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
          images:car_images(url, is_main)
        `)
        .eq('status', status)
        .order('created_at', { ascending: sortOrder === 'oldest' });

      if (error) throw error;

      setCarListings(data);
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

  const handleToggleFeature = async (carId: number, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          is_featured: !currentFeatured,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);

      if (error) throw error;

      // Update local state
      setCars(cars.map(car => 
        car.id === carId 
          ? { ...car, is_featured: !currentFeatured }
          : car
      ));

      // Log admin action
      await supabase
        .from('admin_logs')
        .insert([{
          admin_id: user?.id,
          action_type: 'update',
          table_name: 'cars',
          record_id: carId,
          changes: {
            is_featured: {
              old: currentFeatured,
              new: !currentFeatured
            }
          }
        }]);

      // toast.success(`Car ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error) {
      console.error('Error toggling feature status:', error);
      // toast.error('Failed to update feature status');
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

  const handleCarStatusChange = async (carId: number, newStatus: 'Approved' | 'Rejected' | 'Sold') => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);

      if (error) throw error;

      // Update local state
      setCars(prevCars => 
        prevCars.map(car => 
          car.id === carId ? { ...car, status: newStatus } : car
        )
      );

      // Log admin action
      await supabase.from('admin_logs').insert([{
        admin_id: user!.id,
        action_type: 'update_car_status',
        table_name: 'cars',
        record_id: carId,
        changes: { status: newStatus }
      }]);

      // Show success message
      // toast.success(`Car ${newStatus.toLowerCase()} successfully`);

      // Send notification to the seller
      const car = cars.find(c => c.id === carId);
      if (car?.seller?.id) {
        await supabase
          .from('notifications')
          .insert([{
            user_id: car.seller.id,
            type: 'car_status_update',
            title: `Car Listing ${newStatus}`,
            message: `Your car listing (${car.brand?.name} ${car.model?.name}) has been ${newStatus.toLowerCase()}.`,
            created_at: new Date().toISOString()
          }]);
      }

    } catch (error: any) {
      console.error('Error updating car status:', error);
      // toast.error(error.message || 'Failed to update car status');
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
          images
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
        activeCars: carsData?.filter(car => car.status === 'Approved').length || 0,
        soldCars: carsData?.filter(car => car.status === 'Sold').length || 0,
        featuredCars: carsData?.filter(car => car.is_featured).length || 0,
        featuredPercentage: (carsData?.filter(car => car.is_featured).length || 0) / carsData?.length * 100 || 0,
        totalRevenue: carsData?.reduce((sum, car) => sum + (car.price || 0), 0) || 0,
        averagePrice: carsData?.reduce((sum, car) => sum + (car.price || 0), 0) / carsData?.length || 0,
        totalUsers: usersData?.length || 0,
        adminUsers: usersData?.filter(user => user.role === 'admin').length || 0,
        normalUsers: (usersData?.length || 0) - (usersData?.filter(user => user.role === 'admin').length || 0),
        recentActivity: [],
        carsByBrand: [],
        pendingCarsList: carsData
          .filter(car => car.status === 'Pending')
          .map(car => ({
            id: car.id,
            brand: car.brand?.name || 'Unknown',
            model: car.model?.name || 'Unknown',
            year: car.year,
            price: car.price,
            seller: car.seller?.full_name || 'Unknown'
          }))
      };

      // Calculate cars by brand with detailed statistics
      const brandStats = new Map<string, {
        count: number;
        activeCount: number;
        soldCount: number;
        pendingCount: number;
        totalRevenue: number;
        prices: number[];
      }>();

      carsData?.forEach(car => {
        const brandName = car.brand?.name || 'Unknown';
        const currentStats = brandStats.get(brandName) || {
          count: 0,
          activeCount: 0,
          soldCount: 0,
          pendingCount: 0,
          totalRevenue: 0,
          prices: []
        };

        currentStats.count++;
        if (car.status === 'Approved') currentStats.activeCount++;
        if (car.status === 'Sold') currentStats.soldCount++;
        if (car.status === 'Pending') currentStats.pendingCount++;
        if (car.price) {
          currentStats.totalRevenue += car.price;
          currentStats.prices.push(car.price);
        }

        brandStats.set(brandName, currentStats);
      });

      analyticsData.carsByBrand = Array.from(brandStats.entries())
        .map(([brand, stats]) => ({
          brand,
          count: stats.count,
          activeCount: stats.activeCount,
          soldCount: stats.soldCount,
          pendingCount: stats.pendingCount,
          totalRevenue: stats.totalRevenue,
          averagePrice: stats.prices.length > 0 ? stats.totalRevenue / stats.prices.length : 0
        }))
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

      const formattedCars = carsData.map(car => ({
        ...car,
        images: car.images || [],
        thumbnail: car.images?.[0] || null
      }));

      setCars(formattedCars);
      setUsers(usersWithStats);
      setAnalytics(analyticsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cars' && isAdmin) {
      fetchCarListings(carListingsStatus);
    }
  }, [activeTab, carListingsStatus, isAdmin]);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for car updates
    const carSubscription = supabase
      .channel('cars-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cars'
        },
        () => {
          // Refresh data when cars table changes
          fetchData();
        }
      )
      .subscribe();

    return () => {
      carSubscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!cars) return;

    // Calculate brand statistics
    const brandStats = new Map<string, {
      count: number;
      activeCount: number;
      soldCount: number;
      pendingCount: number;
      totalRevenue: number;
      prices: number[];
    }>();

    cars.forEach(car => {
      const brandName = car.brand?.name || 'Unknown';
      const currentStats = brandStats.get(brandName) || {
        count: 0,
        activeCount: 0,
        soldCount: 0,
        pendingCount: 0,
        totalRevenue: 0,
        prices: []
      };

      currentStats.count++;
      if (car.status === 'Approved') currentStats.activeCount++;
      if (car.status === 'Sold') currentStats.soldCount++;
      if (car.status === 'Pending') currentStats.pendingCount++;
      if (car.price) {
        currentStats.totalRevenue += car.price;
        currentStats.prices.push(car.price);
      }

      brandStats.set(brandName, currentStats);
    });

    const carsByBrand = Array.from(brandStats.entries())
      .map(([brand, stats]) => ({
        brand,
        count: stats.count,
        activeCount: stats.activeCount,
        soldCount: stats.soldCount,
        pendingCount: stats.pendingCount,
        totalRevenue: stats.totalRevenue,
        averagePrice: stats.prices.length > 0 ? stats.totalRevenue / stats.prices.length : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Create pending cars list
    const pendingCarsList = cars
      .filter(car => car.status === 'Pending')
      .map(car => ({
        id: car.id,
        brand: car.brand?.name || 'Unknown',
        model: car.model?.name || 'Unknown',
        year: car.year,
        price: car.price,
        seller: car.seller?.full_name || 'Unknown'
      }));

    setAnalytics(prev => ({
      ...prev,
      totalCars: cars.length,
      pendingCars: cars.filter(car => car.status === 'Pending').length,
      activeCars: cars.filter(car => car.status === 'Approved').length,
      soldCars: cars.filter(car => car.status === 'Sold').length,
      featuredCars: cars.filter(car => car.is_featured).length,
      featuredPercentage: (cars.filter(car => car.is_featured).length / cars.length) * 100,
      totalRevenue: cars.reduce((sum, car) => sum + (car.price || 0), 0),
      averagePrice: cars.reduce((sum, car) => sum + (car.price || 0), 0) / cars.length,
      carsByBrand,
      pendingCarsList
    }));
  }, [cars]);

  const renderAnalytics = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      );
    }

    const handleQuickAction = async (carId: number, action: 'approve' | 'reject') => {
      try {
        const { error } = await supabase
          .from('cars')
          .update({ 
            status: action === 'approve' ? 'Approved' : 'Rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', carId);

        if (error) throw error;
        fetchData(); // Refresh data after action
      } catch (error) {
        console.error(`Error ${action}ing car:`, error);
      }
    };

    const toggleBrandExpansion = (brand: string) => {
      setExpandedBrands(prev => ({
        ...prev,
        [brand]: !prev[brand]
      }));
    };

    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cars */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Cars</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {analytics?.totalCars || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.pendingCars || 0} pending / {analytics?.activeCars || 0} active / {analytics?.soldCars || 0} sold
                </p>
              </div>
              <div className="p-3 rounded-full bg-qatar-maroon bg-opacity-10">
                <TagIcon className="h-8 w-8 text-qatar-maroon" />
              </div>
            </div>
          </div>

          {/* Featured Cars */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Featured Cars</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {analytics?.featuredCars || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.featuredPercentage.toFixed(1)}% of total cars
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <StarIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  QAR {analytics?.totalRevenue.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: QAR {analytics?.averagePrice.toFixed(0).toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {analytics?.totalUsers || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.adminUsers || 0} admin / {analytics?.normalUsers || 0} normal
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for Pending Cars */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Cars Quick Actions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics?.pendingCarsList.map((car) => (
                  <tr key={car.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{car.year} {car.brand} {car.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">QAR {car.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{car.seller}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleQuickAction(car.id, 'approve')}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleQuickAction(car.id, 'reject')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {analytics?.pendingCarsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No pending cars
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Cars List */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Cars</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listed</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(analytics?.pendingCarsList || []).map((car) => (
                  <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{car.year} {car.brand} {car.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{car.seller}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        QAR {car.price?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(car.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => router.push(`/admin/cars/${car.id}`)}
                        className="text-qatar-maroon hover:text-qatar-maroon-dark dark:text-qatar-maroon-light dark:hover:text-qatar-maroon"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleCarStatusChange(car.id, 'Approved')}
                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleCarStatusChange(car.id, 'Rejected')}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {(!analytics?.pendingCarsList || analytics.pendingCarsList.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No pending cars to review
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cars by Brand */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cars by Brand</h3>
            <button
              onClick={() => setShowAllBrands(!showAllBrands)}
              className="text-sm text-qatar-maroon hover:text-qatar-maroon-dark dark:text-qatar-maroon-light dark:hover:text-qatar-maroon transition-colors"
            >
              {showAllBrands ? 'Show Less' : 'Show All'}
            </button>
          </div>
          <div className="space-y-4">
            {analytics?.carsByBrand
              .slice(0, showAllBrands ? undefined : 5)
              .map((item, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleBrandExpansion(item.brand)}
                >
                  <div className="flex items-center space-x-3">
                    <ChevronRightIcon 
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                        expandedBrands[item.brand] ? 'rotate-90' : ''
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.brand}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({item.count} cars)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-qatar-maroon dark:text-qatar-maroon-light">
                      {((item.count / analytics.totalCars) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {expandedBrands[item.brand] && (
                  <div className="mt-4 pl-8 space-y-4">
                    {/* Status Distribution */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>Active</span>
                          <span>{item.activeCount} ({((item.activeCount / item.count) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 dark:bg-green-400"
                            style={{ width: `${(item.activeCount / item.count) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>Sold</span>
                          <span>{item.soldCount} ({((item.soldCount / item.count) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 dark:bg-blue-400"
                            style={{ width: `${(item.soldCount / item.count) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>Pending</span>
                          <span>{item.pendingCount} ({((item.pendingCount / item.count) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 dark:bg-yellow-400"
                            style={{ width: `${(item.pendingCount / item.count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Revenue Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-md p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          QAR {item.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-md p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Average Price</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          QAR {item.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
          <div className="space-y-4">
            {analytics?.recentActivity.map((activity) => (
              <div key={`${activity.timestamp}-${activity.action}`} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.action === 'create' ? 'bg-green-100 dark:bg-green-900' :
                    activity.action === 'update' ? 'bg-blue-100 dark:bg-blue-900' :
                    activity.action === 'delete' ? 'bg-red-100 dark:bg-red-900' :
                    'bg-gray-100 dark:bg-gray-900'
                  }`}>
                    {activity.action === 'create' && <PlusIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {activity.action === 'update' && <PencilIcon2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    {activity.action === 'delete' && <TrashIcon2 className="h-4 w-4 text-red-600 dark:text-red-400" />}
                    {!['create', 'update', 'delete'].includes(activity.action) && (
                      <CogIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.details}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {analytics?.recentActivity.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCarManagement = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Car Listings</h2>
            <div className="flex items-center gap-4">
              {renderViewToggle()}
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">Sort:</span>
                  <select 
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value as 'newest' | 'oldest');
                      fetchCarListings(carListingsStatus);
                    }}
                    className="px-2 py-1 border rounded-md text-sm 
                      bg-white text-gray-900 
                      dark:bg-gray-700 dark:text-gray-100 
                      border-gray-300 dark:border-gray-600
                      focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light
                      hover:border-qatar-maroon dark:hover:border-qatar-maroon-light
                      transition-colors duration-200"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCarListingsStatus('Pending');
                      fetchCarListings('Pending');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      carListingsStatus === 'Pending'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <ClockIcon className="w-5 h-5 inline-block mr-1" />
                    Pending
                  </button>
                  <button
                    onClick={() => {
                      setCarListingsStatus('Approved');
                      fetchCarListings('Approved');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      carListingsStatus === 'Approved'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <CheckCircleIcon className="w-5 h-5 inline-block mr-1" />
                    Approved
                  </button>
                  <button
                    onClick={() => {
                      setCarListingsStatus('Rejected');
                      fetchCarListings('Rejected');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      carListingsStatus === 'Rejected'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <XCircleIcon className="w-5 h-5 inline-block mr-1" />
                    Rejected
                  </button>
                  <button
                    onClick={() => {
                      setCarListingsStatus('Sold');
                      fetchCarListings('Sold');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      carListingsStatus === 'Sold'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <TagIcon className="w-5 h-5 inline-block mr-1" />
                    Sold
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {carListings.map((car) => (
              <div key={car.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-qatar-maroon dark:hover:border-qatar-maroon transition-colors duration-200">
                {/* Car Image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  {car.images && car.images.length > 0 ? (
                    <img
                      src={car.images.find(img => img.is_main)?.url || car.images[0].url}
                      alt={`${car.brand.name} ${car.model.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">No Image</span>
                    </div>
                  )}
                </div>
                
                {/* Car Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {car.brand.name} {car.model.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {car.year} • {car.mileage.toLocaleString()} km
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Featured Toggle */}
                      <button
                        onClick={() => handleToggleFeature(car.id, car.is_featured)}
                        className={`p-1.5 rounded-lg transition-colors duration-200 ${
                          car.is_featured 
                            ? 'text-yellow-500 hover:text-yellow-600' 
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                        title={car.is_featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <StarIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-lg font-bold text-qatar-maroon">
                      QAR {car.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Posted by: {car.user.full_name}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center justify-end space-x-2">
                    <Link
                      href={`/cars/${car.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-qatar-maroon hover:bg-qatar-maroon hover:text-white rounded-md transition-colors duration-200"
                    >
                      View Details
                    </Link>
                    {car.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleCarAction(car.id, 'Approved')}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCarAction(car.id, 'Rejected')}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const PhotoViewerModal = () => {
    if (!selectedCar) return null;

    const images = selectedCar.images || [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
        <div className="relative max-w-4xl w-full h-full flex flex-col">
          <button
            onClick={() => {
              setSelectedImage(null);
              setIsPhotoViewerOpen(false);
              setSelectedCar(null);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          {images.length > 0 ? (
            <div className="flex-grow flex items-center justify-center">
              <Image
                src={selectedImage || images[0].url}
                alt={`${selectedCar.brand.name} ${selectedCar.model.name}`}
                className="max-h-full max-w-full object-contain"
                width={800}
                height={600}
              />
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <PlaceholderCar className="w-64 h-64" />
            </div>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image.url)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                    selectedImage === image.url || (!selectedImage && index === 0)
                      ? 'border-qatar-maroon'
                      : 'border-transparent'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`Car image ${index + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderViewToggle = () => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-2 rounded-md ${
          viewMode === 'grid'
            ? 'bg-qatar-maroon text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
        title="Grid View"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-2 rounded-md ${
          viewMode === 'list'
            ? 'bg-qatar-maroon text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
        title="List View"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
    </div>
  );

  const renderCarListings = () => {
    if (isLoading) {
      return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-qatar-maroon border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (errorCar) {
      return <div className="text-red-500 p-4">{errorCar}</div>;
    }

    if (!carListings.length) {
      return <div className="text-gray-500 p-4">No car listings found with {carListingsStatus.toLowerCase()} status.</div>;
    }

    return viewMode === 'grid' ? renderGridView() : renderListView();
  };

  const renderGridView = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {carListings.map((car) => (
        <div key={car.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-48 group">
            {car.thumbnail ? (
              <Image
                src={car.thumbnail}
                alt={`${car.brand.name} ${car.model.name}`}
                fill
                className="object-cover cursor-pointer"
                onClick={() => {
                  setSelectedImage(car.thumbnail);
                  setIsPhotoViewerOpen(true);
                }}
              />
            ) : (
              <PlaceholderCar />
            )}
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => handleToggleFeature(car.id, car.is_featured)}
                className={`p-1.5 rounded-full ${
                  car.is_featured
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
                title={car.is_featured ? 'Remove from featured' : 'Add to featured'}
              >
                <StarIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {car.brand.name} {car.model.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {car.year} • {car.mileage}km
                </p>
              </div>
              <div className="flex items-center">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  car.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : car.status === 'Approved'
                    ? 'bg-green-100 text-green-800'
                    : car.status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : car.status === 'Sold'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {car.status}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-lg font-bold text-qatar-maroon">
                QAR {car.price.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Posted by: {car.user.full_name}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center justify-end space-x-2">
              <Link
                href={`/cars/${car.id}`}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-qatar-maroon hover:bg-qatar-maroon hover:text-white rounded-md transition-colors duration-200"
              >
                View Details
              </Link>
              {car.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleCarAction(car.id, 'Approved')}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                  >
                    <CheckCircleIcon className="w-5 h-5 inline-block mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleCarAction(car.id, 'Rejected')}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                  >
                    <XCircleIcon className="w-5 h-5 inline-block mr-1" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {carListings.map((car) => (
            <tr key={car.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{car.brand.name} {car.model.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-lg font-bold text-qatar-maroon">
                  QAR {car.price.toLocaleString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {car.user.full_name}<br />
                  {car.user.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  car.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : car.status === 'Approved'
                    ? 'bg-green-100 text-green-800'
                    : car.status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : car.status === 'Sold'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {car.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleToggleFeature(car.id, car.is_featured)}
                  className={`p-1.5 rounded-full ${
                    car.is_featured
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                  title={car.is_featured ? 'Remove from featured' : 'Add to featured'}
                >
                  <StarIcon className="w-5 h-5 text-white" />
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {car.status !== 'Sold' && (
                    <>
                      <button
                        onClick={() => handleCarAction(car.id, 'Approved')}
                        disabled={car.status === 'Approved'}
                        className={`p-1.5 rounded-md ${
                          car.status === 'Approved'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        title="Approve"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleCarAction(car.id, 'Rejected')}
                        disabled={car.status === 'Rejected'}
                        className={`p-1.5 rounded-md ${
                          car.status === 'Rejected'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                        title="Reject"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {car.status === 'Approved' && (
                    <button
                      onClick={() => handleCarAction(car.id, 'Sold')}
                      className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      title="Mark as Sold"
                    >
                      <TagIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCar(car);
                      setIsViewModalOpen(true);
                    }}
                    className="p-1.5 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90"
                    title="View Details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  useEffect(() => {
    if (!authLoading) {
      checkAdmin();
      fetchAnalyticsData();
    }
  }, [authLoading]);

  const checkAdmin = async () => {
    if (!user) {
      router.push('/');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch cars data with more details
      const { data: carsData } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(name),
          model:models(name),
          seller:profiles(full_name)
        `);

      // Fetch users data
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*');

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!carsData) return;

      // Process cars by brand with detailed statistics
      const brandStats = new Map<string, {
        count: number;
        activeCount: number;
        soldCount: number;
        pendingCount: number;
        totalRevenue: number;
        prices: number[];
      }>();

      carsData?.forEach(car => {
        const brandName = car.brand?.name || 'Unknown';
        const currentStats = brandStats.get(brandName) || {
          count: 0,
          activeCount: 0,
          soldCount: 0,
          pendingCount: 0,
          totalRevenue: 0,
          prices: []
        };

        currentStats.count++;
        if (car.status === 'Approved') currentStats.activeCount++;
        if (car.status === 'Sold') currentStats.soldCount++;
        if (car.status === 'Pending') currentStats.pendingCount++;
        if (car.price) {
          currentStats.totalRevenue += car.price;
          currentStats.prices.push(car.price);
        }

        brandStats.set(brandName, currentStats);
      });

      analyticsData.carsByBrand = Array.from(brandStats.entries())
        .map(([brand, stats]) => ({
          brand,
          count: stats.count,
          activeCount: stats.activeCount,
          soldCount: stats.soldCount,
          pendingCount: stats.pendingCount,
          totalRevenue: stats.totalRevenue,
          averagePrice: stats.prices.length > 0 ? stats.totalRevenue / stats.prices.length : 0
        }))
        .sort((a, b) => b.count - a.count);

      setAnalytics(prev => ({
        ...prev,
        totalCars: carsData.length,
        pendingCars: carsData.filter(car => car.status === 'Pending').length,
        activeCars: carsData.filter(car => car.status === 'Approved').length,
        soldCars: carsData.filter(car => car.status === 'Sold').length,
        featuredCars: carsData.filter(car => car.is_featured).length,
        featuredPercentage: (carsData.filter(car => car.is_featured).length / carsData.length) * 100,
        totalRevenue: carsData.reduce((sum, car) => sum + (car.price || 0), 0),
        averagePrice: carsData.reduce((sum, car) => sum + (car.price || 0), 0) / carsData.length,
        carsByBrand
      }));
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth and admin status
  if (authLoading || (loading && !isAdmin)) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon dark:border-qatar-maroon-light"></div>
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
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-qatar-maroon text-qatar-maroon dark:border-qatar-maroon-light dark:text-qatar-maroon-light'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Analytics
            </button>
            <Link
              href="/admin/cars"
              className="mr-8 py-4 px-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            >
              Cars
            </Link>
            <button
              onClick={() => setActiveTab('users')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'users'
                  ? 'border-b-2 border-qatar-maroon text-qatar-maroon dark:border-qatar-maroon-light dark:text-qatar-maroon-light'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'database'
                  ? 'border-b-2 border-qatar-maroon text-qatar-maroon dark:border-qatar-maroon-light dark:text-qatar-maroon-light'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Database
            </button>
            <Link
              href="/admin/brands"
              className="mr-8 py-4 px-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            >
              Brands
            </Link>
            <Link
              href="/admin/models"
              className="mr-8 py-4 px-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            >
              Models
            </Link>
          </nav>
        </div>

        {/* Main content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon dark:border-qatar-maroon-light"></div>
            </div>
          ) : activeTab === 'analytics' ? (
            renderAnalytics()
          ) : activeTab === 'users' ? (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              {/* Users Table */}
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
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
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleUserRoleChange(user.id, user.role === 'admin' ? 'normal_user' : 'admin')}
                          className="text-qatar-maroon dark:text-qatar-maroon-light hover:text-qatar-maroon-dark dark:hover:text-qatar-maroon transition-colors duration-200"
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <DatabaseManager />
            </div>
          )}
        </div>
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
                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
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
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Year</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{selectedCar.year}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Mileage</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {selectedCar.mileage.toLocaleString()} km
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Price</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      QAR {selectedCar.price.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{selectedCar.status}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Description</h4>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{selectedCar.description}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Seller Information</h4>
                <dl className="mt-2">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Name</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {selectedCar.seller.full_name}
                    </dd>
                  </div>
                  <div className="mt-2">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Contact</dt>
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
                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm"
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm"
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={selectedCar.status}
                  onChange={(e) => setSelectedCar({ ...selectedCar, status: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-qatar-maroon dark:bg-qatar-maroon-light rounded-md hover:bg-qatar-maroon-dark dark:hover:bg-qatar-maroon"
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
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Car Listing
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this car listing? This action cannot be undone.
                  </p>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCar(selectedCar.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-400 rounded-md hover:bg-red-700 dark:hover:bg-red-500"
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

  // Photo Viewer Modal
  if (isPhotoViewerOpen) {
    return (
      <PhotoViewerModal />
    );
  }
}

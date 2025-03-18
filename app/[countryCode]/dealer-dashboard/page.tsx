'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { Tab } from '@headlessui/react';
import CarListingForm from '@/components/showrooms/CarListingForm';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingBagIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface DealershipData {
  id: number;
  business_name: string;
  business_name_ar?: string;
  business_type: string;
  dealership_type: string;
  status: string;
  user_id: string;
  country_id: number;
}

interface CarListing {
  id: number;
  brand: {
    id: number;
    name: string;
    name_ar?: string;
  };
  model: {
    id: number;
    name: string;
    name_ar?: string;
  };
  year: number;
  price: number;
  status: string;
  created_at: string;
  views: number;
  images?: { url: string; is_main?: boolean }[];
  description?: string;
  description_ar?: string;
  mileage?: number;
  fuel_type?: string;
  gearbox_type?: string;
  body_type?: string;
  condition?: string;
}

interface DashboardStats {
  totalListings: number;
  approvedListings: number;
  pendingListings: number;
  rejectedListings: number;
  totalViews: number;
}

export default function DealerDashboard() {
  const { supabase } = useSupabase();
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { currentCountry, isLoading: countryLoading } = useCountry();
  const [dealership, setDealership] = useState<DealershipData | null>(null);
  const [carListings, setCarListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCarForm, setShowAddCarForm] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    approvedListings: 0,
    pendingListings: 0,
    rejectedListings: 0,
    totalViews: 0
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  function formatPrice(price: number, currencyCode?: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'QAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(price);
  }

  useEffect(() => {
    // Wait for both auth and country to be initialized
    if (authLoading || countryLoading) return;

    // Check auth and role
    if (!user || !profile || profile.role !== 'dealer') {
      router.push(`/${currentCountry?.code}`);
      return;
    }

    const fetchDealerData = async () => {
      try {
        setLoading(true);
        // Fetch dealership data
        const { data: dealershipData, error: dealershipError } = await supabase
          .from('dealerships')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();

        if (dealershipError) throw dealershipError;
        if (!dealershipData) {
          router.push(`/${currentCountry?.code}`);
          return;
        }

        setDealership(dealershipData);

        // Fetch car listings with brand and model details
        const { data: listings, error: listingsError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands(id, name, name_ar),
            model:models(id, name, name_ar),
            images:car_images(url, is_main)
          `)
          .eq('dealership_id', dealershipData.id)
          .order('created_at', { ascending: false });

        if (listingsError) throw listingsError;
        setCarListings(listings || []);

        // Calculate stats
        const stats: DashboardStats = {
          totalListings: listings?.length || 0,
          totalViews: listings?.reduce((sum, car) => sum + (car.views || 0), 0) || 0,
          approvedListings: listings?.filter(car => car.status.toLowerCase() === 'approved').length || 0,
          pendingListings: listings?.filter(car => car.status.toLowerCase() === 'pending').length || 0,
          rejectedListings: listings?.filter(car => car.status.toLowerCase() === 'rejected').length || 0
        };
        setStats(stats);

      } catch (error) {
        console.error('Error fetching dealer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealerData();
  }, [supabase, user?.id, profile?.role, authLoading, countryLoading, currentCountry?.code, router]);

  const handleDeleteCar = async (carId: number) => {
    if (!confirm(t('dashboard.confirmDelete'))) return;

    try {
      // Delete car images first
      const { data: imageData, error: imageError } = await supabase
        .from('car_images')
        .delete()
        .eq('car_id', carId)
        .select();

      if (imageError) throw imageError;

      // Delete car listing
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId)
        .eq('dealership_id', dealership?.id);

      if (error) throw error;

      // Update local state
      setCarListings(prev => prev.filter(car => car.id !== carId));
      setStats(prev => ({
        ...prev,
        totalListings: (prev.totalListings || 0) - 1,
        totalViews: prev.totalViews - (carListings.find(car => car.id === carId)?.views || 0),
        approvedListings: prev.approvedListings - (carListings.find(car => car.id === carId)?.status.toLowerCase() === 'approved' ? 1 : 0),
        pendingListings: prev.pendingListings - (carListings.find(car => car.id === carId)?.status.toLowerCase() === 'pending' ? 1 : 0),
        rejectedListings: prev.rejectedListings - (carListings.find(car => car.id === carId)?.status.toLowerCase() === 'rejected' ? 1 : 0)
      }));

      toast.success(t('dashboard.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error(t('dashboard.deleteError'));
    }
  };

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
    }
  }

  function getTabClass(isSelected: boolean): string {
    return `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ring-white/60 ring-offset-2 ring-offset-qatar-maroon focus:outline-none focus:ring-2 ${
      isSelected 
        ? 'bg-white text-qatar-maroon shadow-md transform scale-105 dark:bg-gray-700 dark:text-white' 
        : 'text-gray-700 hover:bg-white/[0.12] hover:text-qatar-maroon dark:text-gray-300 dark:hover:text-white'
    }`;
  }

  function getButtonClass(variant: 'primary' | 'close'): string {
    if (variant === 'primary') {
      return 'flex items-center gap-2 bg-qatar-maroon text-white px-6 py-2.5 rounded-lg hover:bg-qatar-maroon/90 transition-all hover:scale-105 shadow-md hover:shadow-lg';
    }
    return 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
  }

  function formatCarTitle(brand: { name: string; name_ar?: string }, model: { name: string; name_ar?: string }, year: number, language: string): string {
    const brandName = language === 'ar' && brand.name_ar ? brand.name_ar : brand.name;
    const modelName = language === 'ar' && model.name_ar ? model.name_ar : model.name;
    return `${brandName} ${modelName} ${year}`;
  }

  // Show loading state while initializing
  if (authLoading || countryLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-qatar-maroon"></div>
      </div>
    );
  }

  // Show the no dealership message if the user is a dealer but has no dealership
  if (!loading && user && profile?.role === 'dealer' && !dealership) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('dashboard.noDealership')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('dashboard.noDealershipDesc')}
          </p>
          <button
            onClick={() => router.push(`/${currentCountry?.code.toLowerCase()}/showrooms/register`)}
            className="bg-qatar-maroon text-white px-6 py-2 rounded-lg hover:bg-qatar-maroon/90 transition-colors"
          >
            {t('dashboard.registerShowroom')}
          </button>
        </div>
      </div>
    );
  }

  const filteredListings = selectedStatus === 'all' 
    ? carListings 
    : carListings.filter(car => car.status.toLowerCase() === selectedStatus);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { 
            label: 'dashboard.totalListings', 
            value: stats.totalListings, 
            icon: <ShoppingBagIcon className="h-8 w-8 text-qatar-maroon dark:text-qatar-maroon/80" />,
            bgGradient: 'from-qatar-maroon/10 to-qatar-maroon/5'
          },
          { 
            label: 'dashboard.approvedListings', 
            value: stats.approvedListings, 
            icon: <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400" />,
            bgGradient: 'from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-900/10'
          },
          { 
            label: 'dashboard.pendingListings', 
            value: stats.pendingListings, 
            icon: <ClockIcon className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />,
            bgGradient: 'from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-900/10'
          },
          { 
            label: 'dashboard.rejectedListings', 
            value: stats.rejectedListings, 
            icon: <XCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />,
            bgGradient: 'from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-900/10'
          },
          { 
            label: 'dashboard.totalViews', 
            value: stats.totalViews, 
            icon: <ChartBarIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />,
            bgGradient: 'from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10'
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className={`bg-gradient-to-br ${stat.bgGradient} dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all hover:shadow-xl hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t(stat.label)}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' && dealership?.business_name_ar
                  ? dealership.business_name_ar
                  : dealership?.business_name}
              </h1>
              <button
                onClick={() => setShowAddCarForm(true)}
                className={getButtonClass('primary')}
              >
                <PlusIcon className="h-5 w-5" />
                {t('dashboard.addCar')}
              </button>
            </div>
            <div className="w-full">
              <Tab.Group>
                <Tab.List className="flex space-x-2 rounded-xl bg-qatar-maroon/20 p-1">
                  {['all', 'approved', 'pending', 'rejected'].map((status) => (
                    <Tab
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={getTabClass(selectedStatus === status)}
                    >
                      {t(`dashboard.${status}`)}
                    </Tab>
                  ))}
                </Tab.List>
              </Tab.Group>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold">{t('dashboard.brand')}</th>
                <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold">{t('dashboard.model')}</th>
                <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold">{t('dashboard.year')}</th>
                <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold">{t('dashboard.price')}</th>
                <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold">{t('dashboard.status')}</th>
                <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold">{t('dashboard.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {t('dashboard.noListings')}
                  </td>
                </tr>
              ) : (
                filteredListings.map((car) => (
                  <tr key={car.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {language === 'ar' && car.brand.name_ar ? car.brand.name_ar : car.brand.name}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {language === 'ar' && car.model.name_ar ? car.model.name_ar : car.model.name}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{car.year}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium" dir="ltr">
                      {formatPrice(car.price, currentCountry?.currency_code)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(car.status)}`}>
                        {t(`dashboard.${car.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedCar(car)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title={t('dashboard.view')}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/${currentCountry?.code.toLowerCase()}/cars/${car.id}/edit`)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title={t('dashboard.edit')}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title={t('dashboard.delete')}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Car Details Modal */}
      {selectedCar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'ar' && selectedCar.brand.name_ar ? selectedCar.brand.name_ar : selectedCar.brand.name}{' '}
                  {language === 'ar' && selectedCar.model.name_ar ? selectedCar.model.name_ar : selectedCar.model.name}{' '}
                  {selectedCar.year}
                </h2>
                <button
                  onClick={() => setSelectedCar(null)}
                  className={getButtonClass('close')}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Car Images */}
              {selectedCar.images && selectedCar.images.length > 0 && (
                <div className="relative h-80 mb-8 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={selectedCar.images[0].url}
                    alt={`${selectedCar.brand.name} ${selectedCar.model.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                  />
                </div>
              )}

              {/* Car Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-qatar-maroon" />
                    {t('car.specifications')}
                  </h3>
                  <dl className="space-y-3">
                    {[
                      { label: 'car.price', value: formatPrice(selectedCar.price, currentCountry?.currency_code) },
                      { label: 'car.mileage', value: `${selectedCar.mileage} km` },
                      { label: 'car.fuelType', value: selectedCar.fuel_type },
                      { label: 'car.transmission', value: selectedCar.gearbox_type },
                      { label: 'car.bodyType', value: selectedCar.body_type },
                      { label: 'car.condition', value: selectedCar.condition }
                    ].map((detail, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-0">
                        <dt className="text-gray-600 dark:text-gray-400">{t(detail.label)}</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingBagIcon className="h-5 w-5 text-qatar-maroon" />
                    {t('car.description')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {language === 'ar' && selectedCar.description_ar
                      ? selectedCar.description_ar
                      : selectedCar.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Car Form Modal */}
      {showAddCarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <CarListingForm
              onSubmit={async () => {
                setShowAddCarForm(false);
                // Refresh car listings
                const { data: carData } = await supabase
                  .from('cars')
                  .select(`
                    id,
                    brand:brands(id, name, name_ar),
                    model:models(id, name, name_ar),
                    year,
                    price,
                    status,
                    created_at,
                    views,
                    images:car_images(url, is_main),
                    description,
                    description_ar,
                    mileage,
                    fuel_type,
                    gearbox_type,
                    body_type,
                    condition
                  `)
                  .eq('dealership_id', dealership?.id)
                  .order('created_at', { ascending: false });

                if (carData) {
                  // Process car data
                  const processedCarData: CarListing[] = carData.map((car: any) => ({
                    id: car.id,
                    brand: {
                      id: car.brand?.id || 0,
                      name: car.brand?.name || '',
                      name_ar: car.brand?.name_ar
                    },
                    model: {
                      id: car.model?.id || 0,
                      name: car.model?.name || '',
                      name_ar: car.model?.name_ar
                    },
                    year: car.year,
                    price: car.price,
                    status: car.status,
                    created_at: car.created_at,
                    views: car.views || 0,
                    images: car.images || [],
                    description: car.description,
                    description_ar: car.description_ar,
                    mileage: car.mileage,
                    fuel_type: car.fuel_type,
                    gearbox_type: car.gearbox_type,
                    body_type: car.body_type,
                    condition: car.condition
                  }));
                  
                  setCarListings(processedCarData);
                  // Update stats
                  setStats({
                    totalListings: processedCarData.length,
                    approvedListings: processedCarData.filter(car => car.status === 'Approved').length,
                    pendingListings: processedCarData.filter(car => car.status === 'Pending').length,
                    rejectedListings: processedCarData.filter(car => car.status === 'Rejected').length,
                    totalViews: processedCarData.reduce((sum, car) => sum + (car.views || 0), 0)
                  });
                }
              }}
              onCancel={() => setShowAddCarForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

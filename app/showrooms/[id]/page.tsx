'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import Image from 'next/image';
import CarCard from '@/components/CarCard';
import { ExtendedCar } from '@/types/supabase';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAnalytics } from '@/hooks/useAnalytics';
import ShowroomDashboard from '@/components/showrooms/ShowroomDashboard';
import Link from 'next/link';

type BusinessType = 'dealership' | 'service center' | 'spare parts dealership' | 'showroom';
type DealershipType = 'Official' | 'Private';

interface ShowroomRegistration {
  id: number;
  business_name: string;
  business_name_ar?: string;
  business_type: BusinessType;
  dealership_type: DealershipType;
  logo_url?: string;
  description?: string;
  description_ar?: string;
  location: string;
  location_ar?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  brands?: Array<{ id: number; name: string; name_ar?: string }>;
  country_id: number;
  country: { id: number; name: string; name_ar?: string };
}

interface CarListingData {
  id: number;
  brand: { id: number; name: string; name_ar?: string; logo_url?: string | null };
  model: { id: number; name: string; name_ar?: string };
  year: number;
  mileage: number;
  price: number;
  fuel_type: string;
  gearbox_type: string;
  body_type: string;
  condition: string;
  images?: { url: string; is_main?: boolean }[];
  featured?: boolean;
  country: { id: number; name: string; name_ar?: string };
}

export default function ShowroomPage() {
  const { id } = useParams();
  const { supabase } = useSupabase();
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const { trackContactSeller } = useAnalytics();
  const [showroom, setShowroom] = useState<ShowroomRegistration | null>(null);
  const [carListings, setCarListings] = useState<CarListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<any>(null);

  useEffect(() => {
    const fetchShowroomData = async () => {
      try {
        // Fetch showroom details from dealerships table
        const { data: showroomData, error: showroomError } = await supabase
          .from('dealerships')
          .select(`
            *,
            country:country_id(*)
          `)
          .eq('id', id)
          .eq('status', 'approved')
          .single();

        if (showroomError) throw showroomError;
        setShowroom(showroomData);

        // Check if user is owner
        if (user && showroomData) {
          setIsOwner(user.id === showroomData.user_id);
        }

        // Fetch dealer profile information
        if (showroomData?.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', showroomData.user_id)
            .single();

          if (profileError) {
            console.error('Error fetching dealer profile:', profileError);
          } else {
            setDealerInfo(profileData);
          }
        }

        // Fetch car listings for this showroom
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brand_id(*),
            model:model_id(*),
            images:car_images(url, is_main),
            country:country_id(*)
          `)
          .eq('user_id', showroomData.user_id)
          .eq('status', 'Approved')
          .eq('country_id', showroomData.country_id);

        if (carError) {
          console.error('Error fetching car listings:', carError);
        } else {
          const processedCarData: CarListingData[] = (carData || []).map((car: any) => ({
            id: car.id,
            brand: {
              id: car.brand?.id || 0,
              name: car.brand?.name || '',
              name_ar: car.brand?.name_ar,
              logo_url: car.brand?.logo_url
            },
            model: {
              id: car.model?.id || 0,
              name: car.model?.name || '',
              name_ar: car.model?.name_ar
            },
            year: car.year,
            mileage: car.mileage,
            price: car.price,
            fuel_type: car.fuel_type,
            gearbox_type: car.gearbox_type,
            body_type: car.body_type,
            condition: car.condition,
            images: car.images || [],
            featured: car.featured || false,
            country: car.country
          }));
          setCarListings(processedCarData);
        }

      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchShowroomData();
    }
  }, [id, supabase, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!showroom) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {t('showroom.notFound')}
          </h1>
          <p className="text-gray-600">
            {t('showroom.notFoundDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 mb-8 rounded-lg overflow-hidden">
        {/* Dealer Dashboard Link */}
        {profile?.role === 'dealer' && isOwner && (
          <Link
            href={`/${showroom.country.code.toLowerCase()}/dealer-dashboard`}
            className="absolute top-4 right-4 z-10 bg-qatar-maroon text-white px-4 py-2 rounded-lg hover:bg-qatar-maroon/90 transition-colors flex items-center gap-2"
          >
            <span>{t('dashboard.dealerDashboard')}</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        )}
        {showroom.logo_url ? (
          <Image
            src={showroom.logo_url}
            alt={language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
            fill
            className="object-cover w-full h-full"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-xl">
              {t('showroom.logo')}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              <span>
                {language === 'ar' && showroom.location_ar ? showroom.location_ar : showroom.location}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {language === 'ar' && showroom.country?.name_ar ? showroom.country.name_ar : showroom.country?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Showroom Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col gap-4">
          {/* Description */}
          {(showroom.description || showroom.description_ar) && (
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-4">
                {language === 'ar' && showroom.description_ar ? showroom.description_ar : showroom.description}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <MapPinIcon className="h-5 w-5" />
            <span>{t('showroom.address')}: {language === 'ar' && showroom.location_ar ? showroom.location_ar : showroom.location}</span>
            <span className="text-sm text-gray-500">
              ({language === 'ar' && showroom.country?.name_ar ? showroom.country.name_ar : showroom.country?.name})
            </span>
          </div>
          
          {dealerInfo?.phone_number && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <PhoneIcon className="h-5 w-5" />
              <span>{t('showroom.phone')}: </span>
              <a href={`tel:${dealerInfo.phone_number}`} className="hover:text-primary">
                <span dir="ltr" className="text-left">{dealerInfo.phone_number}</span>
              </a>
            </div>
          )}
          
          {dealerInfo?.email && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <EnvelopeIcon className="h-5 w-5" />
              <span>{t('showroom.email')}: </span>
              <a href={`mailto:${dealerInfo.email}`} className="hover:text-primary">
                {dealerInfo.email}
              </a>
            </div>
          )}

          {/* Business Type */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="font-medium">{t('showroom.businessType')}: </span>
            <span>
              {showroom.business_type === 'dealership'
                ? t('showroom.businessTypes.dealership')
                : showroom.business_type === 'service center'
                  ? t('showroom.businessTypes.service center')
                  : showroom.business_type === 'spare parts dealership'
                    ? t('showroom.businessTypes.spare parts dealership')
                    : t('showroom.businessTypes.showroom')
              }
            </span>
          </div>

          {/* Brands */}
          {showroom.brands && showroom.brands.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-medium text-gray-600 dark:text-gray-300">{t('showroom.brands')}:</span>
              <div className="flex flex-wrap gap-2">
                {showroom.brands.map((brand) => (
                  <span 
                    key={`brand-${brand.id}`} 
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                  >
                    {language === 'ar' && brand.name_ar ? brand.name_ar : brand.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Car Listings */}
      {showroom.business_type === 'showroom' ? (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('showroom.availableCars')}</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {t('showroom.availableCarsDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carListings.map((car) => (
              <CarCard 
                key={car.id} 
                car={car as ExtendedCar}
                featured={car.featured}
              />
            ))}
            
            {carListings.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-300">
                {t('showroom.noCars')}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">{t('showroom.notShowroom')}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('showroom.notShowroomDesc')}
          </p>
        </div>
      )}
    </div>
  );
}

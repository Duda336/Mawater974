'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShowroomRegistration } from '@/types/showroom';
import Image from 'next/image';
import { Tab } from '@headlessui/react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import CarCard from '@/components/CarCard';
import ShowroomDashboard from '@/components/showrooms/ShowroomDashboard';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function ShowroomPage() {
  const { id } = useParams();
  const { supabase } = useSupabase();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { trackContactSeller } = useAnalytics();
  const [showroom, setShowroom] = useState<ShowroomRegistration | null>(null);
  const [carListings, setCarListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<any>(null);

  useEffect(() => {
    const fetchShowroomData = async () => {
      try {
        // Fetch showroom details from dealerships table with approved status
        const { data: showroomData, error: showroomError } = await supabase
          .from('dealerships')
          .select('*')
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
            brands:brand_id(*),
            models:model_id(*),
            images:car_images(url, is_main)
          `)
          .eq('dealership_id', id);

        if (carError) {
          console.error('Error fetching car listings:', carError);
        } else {
          setCarListings(carData || []);
        }

      } catch (error) {
        console.error('Error fetching showroom data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (supabase && id) {
      fetchShowroomData();
    }
  }, [supabase, id, user]);

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
      <div className="relative w-full h-64 md:h-80 lg:h-96 mb-8">
        {showroom.cover_image_url ? (
          <Image
            src={showroom.cover_image_url}
            alt={language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
            fill
            className="object-cover"
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
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg">
              {showroom.logo_url ? (
                <Image
                  src={showroom.logo_url}
                  alt={language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {t('showroom.logo')}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPinIcon className="h-5 w-5" />
                <span>
                  {language === 'ar' && showroom.location_ar ? showroom.location_ar : showroom.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Logo and Basic Info */}
          <div className="md:w-1/3">
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md mb-4">
                {showroom.logo_url ? (
                  <Image
                    src={showroom.logo_url}
                    alt={language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
                    width={104}
                    height={104}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {t('showroom.logo')}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                {language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
              </h2>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 mb-4">
                <MapPinIcon className="h-4 w-4" />
                <span>
                  {language === 'ar' && showroom.location_ar ? showroom.location_ar : showroom.location}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Info */}
          <div className="w-full md:w-2/3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
            </h1>

            <div className="flex flex-col md:flex-row justify-between mb-6">
              <div className="flex flex-col gap-2 mb-4 md:mb-0">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <MapPinIcon className="h-5 w-5" />
                  <span>{t('showroom.address')}: {language === 'ar' && showroom.location_ar ? showroom.location_ar : showroom.location}</span>
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
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">{t('showroom.businessType')}: </span>
                  <span>
                    {showroom.business_type === 'dealership' 
                      ? t('showroom.businessTypes.dealership')
                      : showroom.business_type === 'service center'
                        ? t('showroom.businessTypes.service center')
                        : t('showroom.businessTypes.spare parts dealership')
                    }
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">{t('showroom.dealershipType')}: </span>
                  <span>
                    {showroom.dealership_type === 'Official' 
                      ? t('showroom.dealershipTypes.official')
                      : t('showroom.dealershipTypes.private')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-qatar-maroon/20 p-1 mb-6">
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
             ${selected
              ? 'bg-white dark:bg-gray-800 shadow text-qatar-maroon dark:text-qatar-maroon'
              : 'text-qatar-maroon/60 dark:text-qatar-maroon/60 hover:bg-white/[0.12] hover:text-qatar-maroon'
            }`
          }>
            {t('showroom.cars')}
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
             ${selected
              ? 'bg-white dark:bg-gray-800 shadow text-qatar-maroon dark:text-qatar-maroon'
              : 'text-qatar-maroon/60 dark:text-qatar-maroon/60 hover:bg-white/[0.12] hover:text-qatar-maroon'
            }`
          }>
            {t('showroom.about')}
          </Tab>
          {isOwner && (
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
               ${selected
                ? 'bg-white dark:bg-gray-800 shadow text-qatar-maroon dark:text-qatar-maroon'
                : 'text-qatar-maroon/60 dark:text-qatar-maroon/60 hover:bg-white/[0.12] hover:text-qatar-maroon'
              }`
            }>
              {t('showroom.dashboard')}
            </Tab>
          )}
        </Tab.List>
        <Tab.Panels>
          {/* Cars Panel */}
          <Tab.Panel>
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
                      car={{
                        id: car.id,
                        brand: { name: car.brands?.name, name_ar: car.brands?.name_ar },
                        model: { name: car.models?.name, name_ar: car.models?.name_ar },
                        year: car.year,
                        condition: car.condition,
                        price: car.price,
                        mileage: car.mileage,
                        fuel_type: car.fuel_type,
                        gearbox_type: car.gearbox_type || car.transmission,
                        images: car.images || []
                      }}
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
          </Tab.Panel>

          {/* About Panel */}
          <Tab.Panel>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('showroom.aboutUs')}</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {language === 'ar' && showroom.description_ar ? showroom.description_ar : showroom.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('showroom.businessDetails')}</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="font-medium w-40">{t('showroom.dealershipType')}:</span>
                      <span className="capitalize">
                        {showroom.dealership_type === 'Official' 
                          ? t('showroom.dealershipTypes.official')
                          : t('showroom.dealershipTypes.private')
                        }
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-40">{t('showroom.businessType')}:</span>
                      <span className="capitalize">
                        {showroom.business_type === 'dealership' 
                          ? t('showroom.businessTypes.dealership')
                          : showroom.business_type === 'service center'
                            ? t('showroom.businessTypes.service center')
                            : t('showroom.businessTypes.spare parts dealership')
                        }
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-40">{t('showroom.address')}:</span>
                      <span>{language === 'ar' && showroom.location_ar ? showroom.location_ar : showroom.location}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-40">{t('showroom.since')}:</span>
                      <span>{new Date(showroom.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('showroom.contactInfo')}</h3>
                  <div className="space-y-2">
                    {dealerInfo?.full_name && (
                      <div className="flex">
                        <span className="font-medium w-40">{t('showroom.contactPerson')}:</span>
                        <span>{dealerInfo.full_name}</span>
                      </div>
                    )}
                    {dealerInfo?.phone_number && (
                      <div className="flex">
                        <span className="font-medium w-40">{t('showroom.phone')}:</span>
                        <a href={`tel:${dealerInfo.phone_number}`} className="text-primary hover:underline">
                          <span dir="ltr" className="text-left">{dealerInfo.phone_number}</span>
                        </a>
                      </div>
                    )}
                    {dealerInfo?.email && (
                      <div className="flex">
                        <span className="font-medium w-40">{t('showroom.email')}:</span>
                        <a href={`mailto:${dealerInfo.email}`} className="text-primary hover:underline">
                          {dealerInfo.email}
                        </a>
                      </div>
                    )}
                    {dealerInfo?.whatsapp && (
                      <div className="flex">
                        <span className="font-medium w-40">{t('showroom.whatsapp')}:</span>
                        <a 
                          href={`https://wa.me/${dealerInfo.whatsapp}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <span dir="ltr" className="text-left">{dealerInfo.whatsapp}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showroom.brands && showroom.brands.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mb-3">{t('showroom.brands')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {showroom.brands.map((brand) => (
                      <span
                        key={brand}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Tab.Panel>

          {/* Dashboard Panel */}
          {isOwner && (
            <Tab.Panel>
              <ShowroomDashboard showroomId={parseInt(id as string)} isOwner={isOwner} />
            </Tab.Panel>
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

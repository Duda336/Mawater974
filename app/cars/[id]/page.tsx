'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { HeartIcon } from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  ShareIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  TagIcon,
  KeyIcon,
  BeakerIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import type { ExtendedCar } from '../../../types/supabase';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [car, setCar] = useState<ExtendedCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [similarCars, setSimilarCars] = useState<ExtendedCar[]>([]);
  const [featuredSimilarCars, setFeaturedSimilarCars] = useState<ExtendedCar[]>([]);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const handlePrevImage = () => {
    if (!car?.images) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? car.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!car?.images) return;
    setCurrentImageIndex((prev) => 
      prev === car.images.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    if (user && car) {
      setIsOwner(user.id === car.user_id);
    }
  }, [user, car]);

  const toggleFullImage = () => {
    setShowFullImage(!showFullImage);
  };

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands(*),
            model:models(*),
            user:profiles(full_name, email, phone_number),
            images:car_images(url, is_main)
          `)
          .eq('id', params.id)
          .single();

        if (carError) throw carError;

        if (carData && carData.images) {
          carData.images.sort((a, b) => {
            if (a.is_main && !b.is_main) return -1;
            if (!a.is_main && b.is_main) return 1;
            return 0;
          });
        }

        setCar(carData);

        // Check if the car is in user's favorites
        if (user) {
          const { data: favorites, error: favoriteError } = await supabase
            .from('favorites')
            .select('*')
            .eq('car_id', params.id)
            .eq('user_id', user.id);

          if (favoriteError) throw favoriteError;
          setIsFavorite(favorites && favorites.length > 0);
        }

        setError(null);
      } catch (error: any) {
        console.error('Error fetching car details:', error);
        setError(error.message || 'Unable to load car details.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCarDetails();
    }
  }, [params.id, user]);

  useEffect(() => {
    const fetchSimilarCars = async () => {
      if (!car) return;

      try {
        // Fetch featured similar cars
        const { data: featuredData, error: featuredError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands!inner(*),
            model:models!inner(*),
            user:profiles!inner(full_name, email, phone_number),
            images:car_images(url)
          `)
          .eq('brand_id', car.brand_id)
          .neq('id', car.id)
          .eq('status', 'Approved')
          .eq('is_featured', true)
          .limit(4);

        if (featuredError) {
          console.error('Error fetching featured similar cars:', featuredError);
        }

        // Fetch normal similar cars
        const { data: normalData, error: normalError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands!inner(*),
            model:models!inner(*),
            user:profiles!inner(full_name, email, phone_number),
            images:car_images(url)
          `)
          .eq('brand_id', car.brand_id)
          .neq('id', car.id)
          .eq('status', 'Approved')
          .eq('is_featured', false)
          .limit(4);

        if (normalError) {
          console.error('Error fetching normal similar cars:', normalError);
          return;
        }

        if (featuredData) {
          const processedFeaturedCars = featuredData.map(carData => ({
            ...carData,
            images: carData.images?.map(img => img.url) || [],
            brand: carData.brand,
            model: carData.model,
            user: carData.user
          }));
          setFeaturedSimilarCars(processedFeaturedCars);
        }

        if (normalData) {
          const processedNormalCars = normalData.map(carData => ({
            ...carData,
            images: carData.images?.map(img => img.url) || [],
            brand: carData.brand,
            model: carData.model,
            user: carData.user
          }));
          setSimilarCars(processedNormalCars);
        }
      } catch (err) {
        console.error('Error in fetchSimilarCars:', err);
      }
    };

    if (car) {
      fetchSimilarCars();
    }
  }, [car]);

  const handleFavoriteClick = async () => {
    if (!user || !car || isUpdatingFavorite) return;

    setIsUpdatingFavorite(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', car.id);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, car_id: car.id }]);

        if (error) throw error;
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${car?.brand.name} ${car?.model.name} (${car?.year})`,
        text: t('car.details.share.title', { 
          year: car?.year,
          brand: car?.brand.name,
          model: car?.model.name
        }),
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatPrice = (price: number) => {
    const formattedNumber = new Intl.NumberFormat(currentLanguage === 'ar' ? 'ar-QA' : 'en-QA', {
      maximumFractionDigits: 0
    }).format(price);
    
    return `${formattedNumber} ${t('currency.qar')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Car not found'}
          </h2>
          <button
            onClick={() => router.push('/cars')}
            className="text-qatar-maroon hover:text-qatar-maroon/80"
          >
            {t('car.details.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <li><button onClick={() => router.push('/cars')} className="hover:text-qatar-maroon">{t('car.details.cars')}</button></li>
          <li>/</li>
          <li><button onClick={() => router.push(`/cars?brand=${car?.brand.name}`)} className="hover:text-qatar-maroon">{car?.brand.name}</button></li>
          <li>/</li>
          <li className="text-gray-900 dark:text-white">{car?.model.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative w-full aspect-[16/9] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {car.images && car.images.length > 0 ? (
              <>
                <Image
                  src={car.images[currentImageIndex].url}
                  alt={`${car.brand?.name} ${car.model?.name}`}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Image Navigation */}
                <div className="absolute inset-0 flex items-center justify-between p-4">
                  <button
                    onClick={handlePrevImage}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">{t('car.details.noImages')}</p>
              </div>
            )}
          </div>

          {/* Thumbnail Grid */}
          {car.images && car.images.length > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {car.images.map((image, index) => (
                <button
                  key={image.url}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden ${
                    index === currentImageIndex ? 'ring-2 ring-qatar-maroon' : ''
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`${car.brand?.name} ${car.model?.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 16vw, 8vw"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Car Details */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {car.brand.name} {car.model.name} {car.year}
              </h1>
              <p className="text-2xl font-bold text-qatar-maroon mt-2">
                {formatPrice(car.price)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFavoriteClick}
                disabled={isUpdatingFavorite}
                className={`p-2 rounded-full ${
                  isFavorite ? 'text-qatar-maroon' : 'text-gray-400 hover:text-qatar-maroon'
                }`}
              >
                {isFavorite ? (
                  <HeartIconSolid className="h-6 w-6" />
                ) : (
                  <HeartIcon className="h-6 w-6" />
                )}
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-gray-400 hover:text-qatar-maroon"
              >
                <ShareIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <BeakerIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{car.mileage.toLocaleString()} km</span>
            </div>
            <div className="flex items-center space-x-2">
              <KeyIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{t(`cars.transmission.${car.gearbox_type.toLowerCase()}`)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <BeakerIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{t(`cars.fuelType.${car.fuel_type.toLowerCase()}`)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TagIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{t(`cars.colors.${car.color.toLowerCase()}`)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TagIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{t(`cars.bodyType.${car.body_type.toLowerCase()}`)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{t('car.details.listed')} {formatDate(car.created_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('car.details.description')}</h2>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {car.description || t('car.details.noDescription')}
            </p>
          </div>

          {/* Contact Section */}
          <div className="border-t dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('car.details.contactSeller')}</h2>
            {showContactInfo ? (
              <div className="space-y-3">
                {car.user.phone_number && (
                  <a
                    href={`tel:${car.user.phone_number}`}
                    className="flex items-center space-x-2 text-qatar-maroon hover:text-qatar-maroon/80"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    <span>{car.user.phone_number}</span>
                  </a>
                )}
                {car.user.email && (
                  <a
                    href={`mailto:${car.user.email}`}
                    className="flex items-center space-x-2 text-qatar-maroon hover:text-qatar-maroon/80"
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    <span>{car.user.email}</span>
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowContactInfo(true)}
                className="w-full py-3 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 transition-colors"
              >
                {t('car.details.showContact')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Similar Cars */}
      {(featuredSimilarCars.length > 0 || similarCars.length > 0) && (
        <div className="mt-16">
          {/* Featured Similar Cars */}
          {featuredSimilarCars.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('cars.featured.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredSimilarCars.map((similarCar) => (
                  <div
                    key={similarCar.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
                  >
                    {/* Featured Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-qatar-maroon text-white text-xs font-medium px-2.5 py-1 rounded">
                        {t('cars.featured.badge')}
                      </span>
                    </div>
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={similarCar.images[0] || '/placeholder-car.svg'}
                        alt={`${similarCar.brand.name} ${similarCar.model.name}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {similarCar.brand.name} {similarCar.model.name} {similarCar.year}
                      </h3>
                      <p className="text-qatar-maroon font-bold mt-1">
                        {formatPrice(similarCar.price)}
                      </p>
                      <button
                        onClick={() => router.push(`/cars/${similarCar.id}`)}
                        className="mt-3 w-full py-2 bg-qatar-maroon/10 text-qatar-maroon rounded hover:bg-qatar-maroon/20 transition-colors"
                      >
                        {t('car.details.viewDetails')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Normal Similar Cars */}
          {similarCars.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('car.details.similarCars')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarCars.map((similarCar) => (
                  <div
                    key={similarCar.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={similarCar.images[0] || '/placeholder-car.svg'}
                        alt={`${similarCar.brand.name} ${similarCar.model.name}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {similarCar.brand.name} {similarCar.model.name} {similarCar.year}
                      </h3>
                      <p className="text-qatar-maroon font-bold mt-1">
                        {formatPrice(similarCar.price)}
                      </p>
                      <button
                        onClick={() => router.push(`/cars/${similarCar.id}`)}
                        className="mt-3 w-full py-2 bg-qatar-maroon/10 text-qatar-maroon rounded hover:bg-qatar-maroon/20 transition-colors"
                      >
                        {t('car.details.viewDetails')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

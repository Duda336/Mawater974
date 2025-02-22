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
  const [fullImageIndex, setFullImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  const handlePrevImage = () => {
    if (!car?.images) return;
    if (showFullImage) {
      setFullImageIndex((prev) => 
        prev === 0 ? car.images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === 0 ? car.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (!car?.images) return;
    if (showFullImage) {
      setFullImageIndex((prev) => 
        prev === car.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === car.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const openFullImage = (index: number) => {
    setFullImageIndex(index);
    setShowFullImage(true);
  };

  const closeFullImage = () => {
    setShowFullImage(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showFullImage) return;
      
      if (e.key === 'Escape') {
        closeFullImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showFullImage]);

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

  const formatDate = (dateString: string, format: string = 'long') => {
    if (format === 'dd/MM/yyyy') {
      return new Date(dateString).toLocaleDateString('en-QA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
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
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-6 pb-16">
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
            {/* Main Image Section */}
            <div className="relative w-full h-96 mb-4">
              <img
                src={car.images[currentImageIndex]?.url}
                alt={`${car.brand?.name} ${car.model?.name}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => openFullImage(currentImageIndex)}
              />
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {car.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={`${car.brand?.name} ${car.model?.name} thumbnail ${index + 1}`}
                  className={`w-full aspect-[4/3] object-cover rounded-lg cursor-pointer ${
                    currentImageIndex === index ? 'ring-2 ring-qatar-maroon' : ''
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>

            {/* Full Screen Image Viewer */}
            {showFullImage && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Close Button */}
                  <button
                    onClick={closeFullImage}
                    className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Navigation Buttons */}
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeftIcon className="h-8 w-8" />
                  </button>

                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRightIcon className="h-8 w-8" />
                  </button>

                  {/* Main Image */}
                  <img
                    src={car.images[fullImageIndex]?.url}
                    alt={`${car.brand?.name} ${car.model?.name}`}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                  />

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                    {fullImageIndex + 1} / {car.images.length}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="space-y-6">
            {/* Header with Title, Price, and Actions */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {car.brand.name} {car.model.name} {car.year}
                </h1>
                <div className="mt-2 flex items-center space-x-4 rtl:space-x-reverse mb-4">
                  <p className="text-2xl font-bold text-qatar-maroon">
                    {formatPrice(car.price)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
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

            {/* Owner Info */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-12 h-12 bg-qatar-maroon/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-gray-900 dark:text-white">{car.user.full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('car.details.seller')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('car.details.listed')} {formatDate(car.created_at, 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Mileage */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <BeakerIcon className="h-5 w-5 text-qatar-maroon" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('cars.mileage.label')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{car.mileage.toLocaleString()} km</p>
              </div>

              {/* Transmission */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <KeyIcon className="h-5 w-5 text-qatar-maroon" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('cars.gearboxType.label')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {t(`cars.transmission.${car.gearbox_type.toLowerCase()}`)}
                </p>
              </div>

              {/* Fuel Type */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <BeakerIcon className="h-5 w-5 text-qatar-maroon" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('cars.fuelType.label')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {t(`cars.fuelType.${car.fuel_type.toLowerCase()}`)}
                </p>
              </div>

              {/* Condition */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.condition')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{t(`cars.condition.${car.condition.toLowerCase()}`)}</p>
              </div>

              {/* Color */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.color')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{t(`cars.colors.${car.color.toLowerCase()}`)}</p>
              </div>

              {/* Body Type */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17h14M5 12h14m-7-4V3m0 18v-5" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.bodyType')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{t(`cars.bodyType.${car.body_type.toLowerCase()}`)}</p>
              </div>

              {/* Cylinders */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.cylinders')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{car.cylinders}</p>
              </div>

              {/* Location */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.location')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {t(`car.details.location.${car.location.replace(/\s/g, '')}`) || car.location}
                </p>
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
    </div>
  );
}

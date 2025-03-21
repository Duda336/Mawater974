'use client';

import Link from 'next/link';
import { Car, ExtendedCar, City } from '../types/supabase';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useCountry } from '../contexts/CountryContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ImageCarousel from './ImageCarousel';
import { useLanguage } from '../contexts/LanguageContext';

interface CarCardProps {
  car: ExtendedCar;
  onFavoriteToggle?: (carId: number) => void;
  isFavorite?: boolean;
  onSelect?: (car: ExtendedCar) => void;
  isSelected?: boolean;
  featured?: boolean;
}

export default function CarCard({
  car,
  onFavoriteToggle,
  isFavorite = false,
  onSelect,
  isSelected = false,
  featured = false,
}: CarCardProps) {
  const { user } = useAuth();
  const { formatPrice, currentCountry } = useCountry();
  const router = useRouter();
  const { t, language, currentLanguage } = useLanguage();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error(t('cars.favorite.login'));
      router.push('/login');
      return;
    }
    if (onFavoriteToggle) {
      onFavoriteToggle(car.id);
    }
  };

  return (
    <Link href={`/cars/${car.id}`}>
      <div 
        className={`relative group bg-white dark:bg-gray-900/95 rounded-xl overflow-hidden border 
          ${featured 
            ? 'border-qatar-maroon shadow-lg shadow-qatar-maroon/20' 
            : 'border-gray-200 dark:border-gray-700'} 
          hover:border-qatar-maroon/100 transition-all duration-200 transform hover:scale-[1.01] 
          ${isSelected ? 'border-qatar-maroon/100 shadow-lg shadow-qatar-maroon/50' : ''}`}
      >
        {featured && (
          <div className="absolute top-3 left-3 z-20 px-2 py-1 bg-qatar-maroon text-white text-xs font-medium rounded-full">
            {t('cars.featured.badge')}
          </div>
        )}
        
        <div className="relative aspect-[16/9]">
          <ImageCarousel
            images={car.images || [{ url: '/placeholder-car.jpg' }]}
            alt={`${language === 'ar' && car.brand?.name_ar ? car.brand.name_ar : car.brand?.name || 'Car'} ${language === 'ar' && car.model?.name_ar ? car.model.name_ar : car.model?.name || ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {language === 'ar' && car.brand?.name_ar ? car.brand.name_ar : car.brand?.name}
                </h3>
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  {language === 'ar' && car.model?.name_ar ? car.model.name_ar : car.model?.name}{car.exact_model ? ` - ${car.exact_model}` : ''}
                </span>
              </div>
              
              {/* Favorite Button */}
              <button
                onClick={handleFavoriteClick}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 border 
                  ${isFavorite
                    ? 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon hover:bg-qatar-maroon hover:text-white'
                    : 'bg-transparent border-gray-200 dark:border-gray-600 text-gray-400 hover:border-qatar-maroon hover:text-qatar-maroon'
                  }
                  transform active:scale-95 hover:scale-105`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? (
                  <HeartSolid className="h-4 w-4" />
                ) : (
                  <HeartOutline className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>{car.year}</span>
              <span>•</span>
              <span>
                {car.condition === 'Not Working' 
                  ? t('cars.condition.notWorking')
                  : t(`cars.condition.${car.condition?.toLowerCase()}`) || car.condition}
              </span>
            </div>

            <div className="mt-3">
              <span className="text-2xl font-semibold text-qatar-maroon" dir="ltr">
                {formatPrice(car.price || 0, currentLanguage)}
              </span>
            </div>

            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2 flex-1">
                <span dir="ltr">{car.mileage?.toLocaleString() || '0'} {t('cars.mileage.unit')}</span>
                <span>•</span>
                <span>{t(`cars.fuelType.${car.fuel_type?.toLowerCase()}`) || car.fuel_type}</span>
                <span>•</span>
                <span>{t(`cars.transmission.${car.gearbox_type?.toLowerCase()}`) || car.gearbox_type}</span>
              </div>
            </div>

            {(car.city || car.location) && (
              <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span>
                  {car.city 
                    ? (language === 'ar' ? car.city.name_ar : car.city.name)
                    : car.location}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

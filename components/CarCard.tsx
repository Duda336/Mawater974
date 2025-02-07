'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Car } from '../types/supabase';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface CarCardProps {
  car: Car;
  compareMode?: boolean;
  isSelected?: boolean;
  onSelect?: (car: Car) => void;
  isFavorited?: boolean;
  onFavoriteChange?: (carId: number) => void;
}

export default function CarCard({ 
  car, 
  compareMode, 
  isSelected, 
  onSelect,
  isFavorited = false,
  onFavoriteChange
}: CarCardProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to add cars to your favorites');
      router.push('/login?redirect=/cars');
      return;
    }

    onFavoriteChange?.(car.id);
  };

  return (
    <Link href={`/cars/${car.id}`}>
      <div 
        className="group bg-white dark:bg-gray-900/95 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 
        hover:border-qatar-maroon/50 transition-all duration-200 transform hover:scale-[1.01] 
        shadow-sm hover:shadow-xl dark:hover:shadow-qatar-maroon/5 hover:shadow-gray-200/80"
      >
        <div className="relative aspect-[16/9]">
          <Image
            src={car.images?.[0]?.url || '/placeholder-car.jpg'}
            alt={`${car.brand.name} ${car.model.name}`}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-[1.0]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
          {/* View Details Button */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/cars/${car.id}`;
              }}
              className="w-full bg-white/95 dark:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white px-5 py-2.5 rounded-lg text-sm 
                hover:bg-qatar-maroon hover:text-white hover:shadow-lg
                transition-all duration-200 flex items-center justify-between
                border border-gray-100 dark:border-white/20 hover:border-qatar-maroon shadow-sm group/btn"
            >
              <span className="font-medium tracking-wide">View Details</span>
              <ArrowRightIcon className="h-4 w-4 transform transition-transform duration-200 group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xl text-gray-800 dark:text-white">
                <span className="font-medium">{car.brand.name}</span>{' '}
                <span className="font-light">{car.model.name}</span>
              </h3>
              <div className="text-base font-light text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span>{car.year}</span>
                <span>•</span>
                <span>{car.condition}</span>
              </div>
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 border 
                ${isFavorited
                  ? 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon hover:bg-qatar-maroon hover:text-white'
                  : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-qatar-maroon hover:text-qatar-maroon dark:hover:text-qatar-maroon'
                }
                transform active:scale-95 hover:scale-105`}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited ? (
                <HeartSolid className="h-4 w-4" />
              ) : (
                <HeartOutline className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="mt-1">
            <div className="text-2xl font-bold text-qatar-maroon">
              {car.price?.toLocaleString()} QAR
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 space-x-2">
              <span>{car.mileage?.toLocaleString()} km</span>
              <span>•</span>
              <span>{car.fuel_type}</span>
              <span>•</span>
              <span>{car.gearbox_type}</span>
            </div>
          </div>

          {compareMode && (
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onSelect?.(car);
                }}
                className={`w-full px-3 py-1.5 text-xs font-normal rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-qatar-maroon/10 text-qatar-maroon hover:bg-qatar-maroon/20'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {isSelected ? 'Selected' : 'Compare'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

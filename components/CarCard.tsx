'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Car, Brand } from '../types/supabase';

interface ExtendedCar extends Omit<Car, 'brand_id' | 'model_id'> {
  brand: Brand;
  model: {
    id: number;
    name: string;
  };
  images: {
    id: number;
    url: string;
  }[];
}

interface CarCardProps {
  car: ExtendedCar;
  isFavorited?: boolean;
  showFavoriteButton?: boolean;
  onFavoriteChange?: (carId: number, isFavorited: boolean) => void;
}

export default function CarCard({ 
  car, 
  isFavorited = false, 
  showFavoriteButton = true,
  onFavoriteChange 
}: CarCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(isFavorited);
  const { user } = useAuth();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!user) return; 

    try {
      setIsFavorite(!isFavorite);
      if (onFavoriteChange) {
        onFavoriteChange(car.id, !isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setIsFavorite(isFavorite); 
    }
  };

  const imageUrl = car.images && car.images.length > 0 
    ? car.images[0].url 
    : '/placeholder-car.svg';

  return (
    <Link href={`/cars/${car.id}`}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-1 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={`${car.brand.name} ${car.model.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
          {user && showFavoriteButton && (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              {isFavorite ? (
                <HeartIconSolid className="h-6 w-6 text-qatar-maroon" />
              ) : (
                <HeartIcon className="h-6 w-6 text-qatar-maroon" />
              )}
            </button>
          )}
          <div className="absolute bottom-2 right-2">
            <span className="px-2 py-1 text-sm font-semibold bg-white/80 dark:bg-gray-800/80 rounded text-qatar-maroon">
              {car.condition}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {car.brand.name} {car.model.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{car.year}</p>
          <p className="mt-2 text-xl font-bold text-qatar-maroon">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'QAR',
              maximumFractionDigits: 0,
            }).format(car.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

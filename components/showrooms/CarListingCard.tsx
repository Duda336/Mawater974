'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface CarListing {
  id?: number;
  title: string;
  title_ar: string;
  price: number;
  year: number;
  make: string;
  model: string;
  mileage?: number;
  images?: string[];
  condition?: string;
  status?: string;
  is_featured?: boolean;
  source_table?: 'car_listings' | 'cars';
}

interface CarListingCardProps {
  listing: CarListing;
}

export default function CarListingCard({ listing }: CarListingCardProps) {
  const { language, t } = useLanguage();

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image */}
      <div className="relative h-48 w-full">
        {listing.images && listing.images.length > 0 ? (
          <Image
            src={listing.images[0]}
            alt={language === 'en' ? listing.title : listing.title_ar}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">{t('common.noImage')}</span>
          </div>
        )}
        
        {/* Status Badge */}
        {listing.status && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
            (listing.source_table === 'car_listings' && listing.status === 'active') || 
            (listing.source_table === 'cars' && listing.status === 'Approved')
              ? 'bg-green-500 text-white'
              : 'bg-yellow-500 text-white'
          }`}>
            {listing.source_table === 'car_listings' 
              ? t(`car.status.${listing.status}`)
              : t(`car.status.${listing.status.toLowerCase()}`)}
          </div>
        )}
        
        {/* Featured Badge */}
        {listing.is_featured && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-qatar-maroon text-white">
            {t('common.featured')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">
          {language === 'en' ? listing.title : listing.title_ar}
        </h3>

        <div className="space-y-2">
          {/* Price */}
          <div className="text-xl font-bold text-primary">
            {formatPrice(listing.price)}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">{t('car.year')}:</span> {listing.year}
            </div>
            <div>
              <span className="font-medium">{t('car.make')}:</span> {listing.make}
            </div>
            <div>
              <span className="font-medium">{t('car.model')}:</span> {listing.model}
            </div>
            {listing.mileage && (
              <div>
                <span className="font-medium">{t('car.mileage')}:</span> {listing.mileage.toLocaleString()}
              </div>
            )}
          </div>

          {/* Condition */}
          {listing.condition && (
            <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {listing.source_table === 'cars'
                ? t(`car.condition.${listing.condition.toLowerCase()}`)
                : t(`car.condition.${listing.condition}`)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

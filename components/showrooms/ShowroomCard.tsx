import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Showroom } from '@/types/showroom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { useCountry } from '@/contexts/CountryContext';

interface ShowroomCardProps {
  showroom: Showroom;
}

export default function ShowroomCard({ showroom }: ShowroomCardProps) {
  const { t, language } = useLanguage();
  const { currentCountry } = useCountry();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 ${showroom.featured ? 'ring-2 ring-qatar-maroon' : ''}`}>
      <div className="relative h-48">
        {showroom.logo ? (
          <Image
            src={showroom.logo}
            alt={language === 'ar' ? showroom.name_ar || showroom.name : showroom.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">
              {t('showroom.noImage')}
            </span>
          </div>
        )}
        {showroom.featured && (
          <div className="absolute top-2 right-2 bg-qatar-maroon text-white px-2 py-1 rounded-md text-xs font-semibold">
            {t('showroom.featured')}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {language === 'ar' ? showroom.name_ar || showroom.name : showroom.name}
        </h3>
        
        <div className="flex items-center mb-2">
          <MapPinIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {t('showroom.location')} {language === 'ar' && showroom.location_ar ? showroom.location_ar : showroom.location}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
              {showroom.businessType && `${t(`showroom.businessTypes.${showroom.businessType.toLowerCase()}`)} • `}
              {t(showroom.dealershipType === 'Official' ? 'showroom.dealershipTypes.official' : 'showroom.dealershipTypes.private')}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">
          {language === 'ar' ? showroom.description_ar || showroom.description : showroom.description}
        </p>
        
        <Link href={`/${currentCountry.code.toLowerCase()}/showrooms/${showroom.id}`} className="block w-full">
          <button className="w-full bg-qatar-maroon text-white py-2 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
            {t('showroom.viewShowroom')}
          </button>
        </Link>
      </div>
    </div>
  );
}

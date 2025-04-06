'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';

interface LoginPopupProps {
  delay?: number; // Delay in milliseconds before showing popup
}

export default function LoginPopup({ delay = 5000 }: LoginPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentCountry } = useCountry();
  const countryPrefix = currentCountry ? `/${currentCountry.code.toLowerCase()}` : '';

  useEffect(() => {
    // Show popup after specified delay if user is not logged in
    const timer = setTimeout(() => {
      if (!user) {
        setIsOpen(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [user, delay]);

  if (!isOpen || user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('auth.popup.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.popup.description')}
          </p>
          <div className="flex flex-col space-y-4">
            <Link
              href={`${countryPrefix}/login`}
              className="bg-qatar-maroon text-white px-6 py-3 rounded-lg font-semibold hover:bg-qatar-maroon-dark transition-colors"
            >
              {t('auth.login')}
            </Link>
            <Link
              href={`${countryPrefix}/signup`}
              className="bg-white text-qatar-maroon border-2 border-qatar-maroon px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {t('auth.signup')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

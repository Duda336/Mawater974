'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { useRouter } from 'next/navigation';
import { GlobeAltIcon, ArrowRightOnRectangleIcon as LoginIcon } from '@heroicons/react/24/outline';

interface LoginPopupProps {
  delay?: number; // Delay in milliseconds before showing popup
}

interface Country {
  id: number;
  name: string;
  code: string;
}

export default function LoginPopup({ delay = 5000 }: LoginPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentCountry } = useCountry();
  const countryPrefix = currentCountry ? `/${currentCountry.code.toLowerCase()}` : '';
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const countries = [
    { id: 1, name: 'Qatar', code: 'QA' },
    { id: 2, name: 'Saudi Arabia', code: 'SA' },
    { id: 3, name: 'United Arab Emirates', code: 'AE' },
    { id: 4, name: 'Kuwait', code: 'KW' },
    { id: 5, name: 'Syria', code: 'SY' },
    { id: 6, name: 'Egypt', code: 'EG' },
  ];

  useEffect(() => {
    // Show popup after specified delay if user is not logged in
    const timer = setTimeout(() => {
      if (!user) {
        setIsOpen(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [user, delay]);

  // Handle country selection change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find(c => c.id === parseInt(e.target.value));
    if (country) {
      setSelectedCountry(country);
      // Redirect to homepage with country code
      router.push(`/${country.code.toLowerCase()}`);
      // Close the popup
      setIsOpen(false);
    }
  };

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
          <div className="flex flex-col space-y-4 mb-6">
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
          
          <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <select
                value={selectedCountry?.id || ''}
                onChange={handleCountryChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 pr-10 appearance-none"
              >
                <option value="">{t('auth.selectCountry')}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {selectedCountry ? (
                  <span className="text-sm">{selectedCountry.code}</span>
                ) : (
                  <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
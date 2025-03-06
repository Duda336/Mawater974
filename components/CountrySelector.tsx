'use client';

import { useState, useEffect, Fragment } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

export default function CountrySelector() {
  const { countries, currentCountry, setCurrentCountry, isLoading } = useCountry();
  const { language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleCountryChange = (country) => {
    setCurrentCountry(country);
    
    // Update URL to reflect the new country
    const countryCode = country.code.toLowerCase();
    
    // Check if we're already on a country-specific route
    if (pathname) {
      // Extract the path after the country code
      const pathParts = pathname.split('/');
      if (pathParts.length > 1) {
        // If we're already on a country route (e.g., /qa/cars)
        if (countries.some(c => c.code.toLowerCase() === pathParts[1])) {
          // Replace the country code in the URL
          pathParts[1] = countryCode;
          // Force a full page refresh to ensure data is updated
          window.location.href = pathParts.join('/');
          return;
        }
      }
    }
    
    // If we're not on a country-specific route, go to the country homepage
    window.location.href = `/${countryCode}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <GlobeAltIcon className="h-5 w-5" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!currentCountry) return null;

  return (
    <div className="relative">
      <Listbox value={currentCountry} onChange={handleCountryChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-md bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-900 dark:text-white">
            <div className="flex items-center">
              <span className="block truncate font-medium">
                {language === 'ar' ? currentCountry.name_ar : currentCountry.name}
              </span>
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {countries.map((country) => (
                <Listbox.Option
                  key={country.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-gray-900 dark:text-white'
                    }`
                  }
                  value={country}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center">
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {language === 'ar' ? country.name_ar : country.name}
                        </span>
                      </div>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

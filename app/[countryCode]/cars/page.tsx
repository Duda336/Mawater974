'use client';

import { useParams } from 'next/navigation';
import CarsPage from '@/app/cars/page';
import { useEffect } from 'react';
import { useCountry } from '@/contexts/CountryContext';

export default function CountrySpecificCarsPage() {
  const params = useParams();
  const { countries, setCurrentCountry } = useCountry();
  const countryCode = params.countryCode as string;

  useEffect(() => {
    if (countryCode && countries.length > 0) {
      const country = countries.find(c => c.code.toLowerCase() === countryCode.toLowerCase());
      if (country) {
        setCurrentCountry(country);
      }
    }
  }, [countryCode, countries, setCurrentCountry]);

  return <CarsPage />;
}

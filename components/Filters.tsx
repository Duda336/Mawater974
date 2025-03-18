'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface FiltersProps {
  filters: {
    brand: string;
    model: string;
    year: string;
    price: string;
    mileage: string;
    transmission: string;
    fuelType: string;
    bodyType: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

const Filters: React.FC<FiltersProps> = ({ filters, onFilterChange }) => {
  const supabase = createClientComponentClient<Database>();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [years] = useState(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 50 }, (_, i) => currentYear - i);
  });

  const transmissions = ['Automatic', 'Manual'];
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
  const bodyTypes = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Wagon', 'Van', 'Truck', 'Convertible', 'Other'];

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (filters.brand) {
      fetchModels(filters.brand);
    } else {
      setModels([]);
    }
  }, [filters.brand]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchModels = async (brandId: string) => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');
      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('cars.filters.brand')}
        </label>
        <select
          value={filters.brand}
          onChange={(e) => onFilterChange('brand', e.target.value)}
          className={`mt-1 block w-full rounded-md ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon`}
        >
          <option value="">{t('cars.filters.allBrands')}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('cars.filters.model')}
        </label>
        <select
          value={filters.model}
          onChange={(e) => onFilterChange('model', e.target.value)}
          disabled={!filters.brand}
          className={`mt-1 block w-full rounded-md ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon`}
        >
          <option value="">{t('cars.filters.allModels')}</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('cars.filters.year')}
        </label>
        <select
          value={filters.year}
          onChange={(e) => onFilterChange('year', e.target.value)}
          className={`mt-1 block w-full rounded-md ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon`}
        >
          <option value="">{t('cars.filters.allYears')}</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('cars.filters.transmission')}
        </label>
        <select
          value={filters.transmission}
          onChange={(e) => onFilterChange('transmission', e.target.value)}
          className={`mt-1 block w-full rounded-md ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon`}
        >
          <option value="">{t('cars.filters.allTransmissions')}</option>
          {transmissions.map((transmission) => (
            <option key={transmission} value={transmission}>
              {transmission}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('cars.filters.fuelType')}
        </label>
        <select
          value={filters.fuelType}
          onChange={(e) => onFilterChange('fuelType', e.target.value)}
          className={`mt-1 block w-full rounded-md ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon`}
        >
          <option value="">{t('cars.filters.allFuelTypes')}</option>
          {fuelTypes.map((fuelType) => (
            <option key={fuelType} value={fuelType}>
              {fuelType}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('cars.filters.bodyType')}
        </label>
        <select
          value={filters.bodyType}
          onChange={(e) => onFilterChange('bodyType', e.target.value)}
          className={`mt-1 block w-full rounded-md ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon`}
        >
          <option value="">{t('cars.filters.allBodyTypes')}</option>
          {bodyTypes.map((bodyType) => (
            <option key={bodyType} value={bodyType}>
              {bodyType}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Filters;

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import CarCard from '../../components/CarCard';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Car, Brand } from '../../types/supabase';
import { Slider } from '../../components/ui/slider';

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

interface Filters {
  brand_id?: number;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  condition?: string;
  fuel_type?: string;
  body_type?: string;
  gearbox_type?: string;
  sort?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'newest' | 'oldest';
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'year_asc', label: 'Year: Oldest First' },
];

export default function CarsPage() {
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Filters>({ sort: 'newest' });
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [brands, setBrands] = useState<Brand[]>([]);
  const { user } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchBrands();
    fetchCars();
    if (user) {
      fetchFavorites();
    }
  }, [user, filters, searchTerm]);

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching brands:', error);
      return;
    }
    setBrands(data);
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cars')
        .select(`
          *,
          brand:brands(*),
          model:models(*),
          images:car_images(*)
        `)
        .eq('status', 'Approved');

      // Apply filters
      if (filters.brand_id) {
        query = query.eq('brand_id', filters.brand_id);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.minYear) {
        query = query.gte('year', filters.minYear);
      }
      if (filters.maxYear) {
        query = query.lte('year', filters.maxYear);
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters.fuel_type) {
        query = query.eq('fuel_type', filters.fuel_type);
      }
      if (filters.body_type) {
        query = query.eq('body_type', filters.body_type);
      }
      if (filters.gearbox_type) {
        query = query.eq('gearbox_type', filters.gearbox_type);
      }

      // Apply search term
      if (searchTerm) {
        query = query.or(`brand.name.ilike.%${searchTerm}%,model.name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      switch (filters.sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'year_desc':
          query = query.order('year', { ascending: false });
          break;
        case 'year_asc':
          query = query.order('year', { ascending: true });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setCars(data);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('car_id')
      .eq('user_id', user!.id);

    if (data) {
      setFavorites(new Set(data.map(f => f.car_id)));
    }
  };

  const handleFavoriteChange = async (carId: number, isFavorited: boolean) => {
    if (!user) return;

    try {
      if (isFavorited) {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, car_id: carId });
        setFavorites(prev => new Set([...prev, carId]));
      } else {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', carId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(carId);
          return next;
        });
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 py-8">
        {/* Search and Order Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search cars by brand, model, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-qatar-maroon focus:border-qatar-maroon text-sm"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Order Section */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Order by:
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value as Filters['sort'] })}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-qatar-maroon focus:border-qatar-maroon text-sm py-2 px-4"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {cars.length} cars found
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Panel - Fixed position */}
          <aside className="w-full md:w-80 md:sticky md:top-24 h-fit">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Brand
                </label>
                <select
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon"
                  value={filters.brand_id || ''}
                  onChange={(e) => setFilters({ ...filters, brand_id: Number(e.target.value) || undefined })}
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Price Range (QAR)
                </label>
                <Slider
                  min={0}
                  max={1000000}
                  step={1000}
                  value={[filters.minPrice || 0, filters.maxPrice || 1000000]}
                  onValueChange={([min, max]) => 
                    setFilters({ ...filters, minPrice: min, maxPrice: max })
                  }
                  className="mb-2"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>{filters.minPrice?.toLocaleString() || '0'} QAR</span>
                  <span>{filters.maxPrice?.toLocaleString() || '1,000,000'} QAR</span>
                </div>
              </div>

              {/* Year Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Year
                </label>
                <Slider
                  min={2000}
                  max={new Date().getFullYear()}
                  value={[filters.minYear || 2000, filters.maxYear || new Date().getFullYear()]}
                  onValueChange={([min, max]) => 
                    setFilters({ ...filters, minYear: min, maxYear: max })
                  }
                  className="mb-2"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>{filters.minYear || 2000}</span>
                  <span>{filters.maxYear || new Date().getFullYear()}</span>
                </div>
              </div>

              {/* Condition Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Condition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['New', 'Excellent', 'Good', 'Not Working'].map((condition) => (
                    <button
                      key={condition}
                      onClick={() => setFilters({ 
                        ...filters, 
                        condition: filters.condition === condition ? undefined : condition 
                      })}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        filters.condition === condition
                          ? 'bg-qatar-maroon text-white border-qatar-maroon'
                          : 'border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:border-qatar-maroon dark:hover:border-qatar-maroon'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fuel Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Fuel Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters({ 
                        ...filters, 
                        fuel_type: filters.fuel_type === type ? undefined : type 
                      })}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        filters.fuel_type === type
                          ? 'bg-qatar-maroon text-white border-qatar-maroon'
                          : 'border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:border-qatar-maroon dark:hover:border-qatar-maroon'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Body Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters({ 
                        ...filters, 
                        body_type: filters.body_type === type ? undefined : type 
                      })}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        filters.body_type === type
                          ? 'bg-qatar-maroon text-white border-qatar-maroon'
                          : 'border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:border-qatar-maroon dark:hover:border-qatar-maroon'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmission Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Transmission
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Manual', 'Automatic'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters({ 
                        ...filters, 
                        gearbox_type: filters.gearbox_type === type ? undefined : type 
                      })}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        filters.gearbox_type === type
                          ? 'bg-qatar-maroon text-white border-qatar-maroon'
                          : 'border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:border-qatar-maroon dark:hover:border-qatar-maroon'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Filters Button */}
              <button
                onClick={() => setFilters({ sort: 'newest' })}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Car Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-qatar-maroon border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 dark:text-red-400">
                {error}
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                No cars found matching your criteria
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isFavorited={favorites.has(car.id)}
                    onFavoriteChange={handleFavoriteChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

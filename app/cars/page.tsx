'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import CarCard from '../../components/CarCard';
import CarCompareModal from '../../components/CarCompareModal';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Car, Brand } from '../../types/supabase';
import { Slider } from '../../components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import YearRangeInput from '@/components/YearRangeInput';
import PriceRangeInput from '@/components/PriceRangeInput';
import MileageRangeInput from '@/components/MileageRangeInput';

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
  condition?: string[];
  fuel_type?: string[];
  body_type?: string[];
  gearbox_type?: string;
  sort?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'newest' | 'oldest';
  search?: string;
  minMileage?: number;
  maxMileage?: number;
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
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Filters>({ sort: 'newest' });
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCars, setSelectedCars] = useState<ExtendedCar[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [showCompareBar, setShowCompareBar] = useState(false);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { user } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchBrands();
    fetchCars();
    if (user) {
      fetchFavorites();
    }
  }, [user, filters]);

  useEffect(() => {
    setShowCompareBar(selectedCars.length > 0);
  }, [selectedCars]);

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
      if (filters.condition && Array.isArray(filters.condition)) {
        query = query.in('condition', filters.condition);
      }
      if (filters.fuel_type && Array.isArray(filters.fuel_type)) {
        query = query.in('fuel_type', filters.fuel_type);
      }
      if (filters.body_type && Array.isArray(filters.body_type)) {
        query = query.in('body_type', filters.body_type);
      }
      if (filters.gearbox_type) {
        query = query.eq('gearbox_type', filters.gearbox_type);
      }
      if (filters.minMileage) {
        query = query.gte('mileage', filters.minMileage);
      }
      if (filters.maxMileage) {
        query = query.lte('mileage', filters.maxMileage);
      }

      // Apply search term
      if (filters.search) {
        query = query.or(`brand.name.ilike.%${filters.search}%,model.name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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

  const handleFavoriteChange = async (carId: number) => {
    if (!user) return;

    try {
      const isFavorited = favorites.has(carId);
      
      if (!isFavorited) {
        // First update local state optimistically
        setFavorites(prev => new Set([...prev, carId]));
        
        // Then update the database
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, car_id: carId });
          
        if (error) {
          // Revert on error
          setFavorites(prev => {
            const next = new Set(prev);
            next.delete(carId);
            return next;
          });
          toast.error('Failed to add to favorites');
          throw error;
        }
        
        toast.success('Added to favorites', {
          icon: '❤️',
          duration: 1500,
          position: 'bottom-right'
        });
      } else {
        // First update local state optimistically
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(carId);
          return next;
        });
        
        // Then update the database
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, car_id: carId });
          
        if (error) {
          // Revert on error
          setFavorites(prev => new Set([...prev, carId]));
          toast.error('Failed to remove from favorites');
          throw error;
        }
        
        toast.success('Removed from favorites', {
          icon: '💔',
          duration: 1500,
          position: 'bottom-right'
        });
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleCompareToggle = (car: ExtendedCar) => {
    setSelectedCars((prev) => {
      const isSelected = prev.some((c) => c.id === car.id);
      if (isSelected) {
        const newSelection = prev.filter((c) => c.id !== car.id);
        if (newSelection.length === 0) {
          setCompareMode(false);
        }
        return newSelection;
      }
      if (prev.length >= 2) {
        toast.error('You can compare up to 2 cars at a time');
        return prev;
      }
      return [...prev, car];
    });
  };

  const handleCompareClick = () => {
    if (compareMode) {
      if (selectedCars.length >= 2) {
        setShowCompareModal(true);
      } else {
        toast.error('Please select at least 2 cars to compare');
      }
    } else {
      setCompareMode(true);
      toast.success('Select up to 2 cars to compare');
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedCars([]);
  };

  const resetFilters = () => {
    setFilters({ sort: 'newest' });
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => {
      const isSelected = prev.includes(condition);
      const newConditions = isSelected 
        ? prev.filter(c => c !== condition)
        : [...prev, condition];
      
      // Update filters with the new conditions array
      setFilters(prevFilters => ({
        ...prevFilters,
        condition: newConditions.length > 0 ? newConditions : undefined
      }));
      
      return newConditions;
    });
  };

  const toggleBodyType = (bodyType: string) => {
    setSelectedBodyTypes(prev => {
      const isSelected = prev.includes(bodyType);
      const newBodyTypes = isSelected 
        ? prev.filter(type => type !== bodyType)
        : [...prev, bodyType];
      
      // Update filters with the new body type array
      setFilters(prevFilters => ({
        ...prevFilters,
        body_type: newBodyTypes.length > 0 ? newBodyTypes : undefined
      }));
      
      return newBodyTypes;
    });
  };

  const toggleFuelType = (fuelType: string) => {
    setSelectedFuelTypes(prev => {
      const isSelected = prev.includes(fuelType);
      const newFuelTypes = isSelected 
        ? prev.filter(type => type !== fuelType)
        : [...prev, fuelType];
      
      // Update filters with the new fuel type array
      setFilters(prevFilters => ({
        ...prevFilters,
        fuel_type: newFuelTypes.length > 0 ? newFuelTypes : undefined
      }));
      
      return newFuelTypes;
    });
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCompareClose = () => {
    setShowCompareModal(false);
    setCompareMode(false);
    setSelectedCars([]);
  };

  const filterOptions = {
    brand: Array.from(new Set(cars.map(car => car.brand.name))).sort(),
    model: Array.from(new Set(cars.map(car => car.model.name))).sort(),
    year: Array.from(new Set(cars.map(car => car.year))).sort((a, b) => b - a),
    condition: Array.from(new Set(cars.filter(car => car.condition).map(car => car.condition))).sort(),
    body_type: Array.from(new Set(cars.filter(car => car.body_type).map(car => car.body_type))).sort(),
    fuel_type: Array.from(new Set(cars.filter(car => car.fuel_type).map(car => car.fuel_type))).sort(),
    gearbox_type: Array.from(new Set(cars.filter(car => car.gearbox_type).map(car => car.gearbox_type))).sort(),
    color: Array.from(new Set(cars.filter(car => car.color).map(car => car.color))).sort(),
    location: Array.from(new Set(cars.filter(car => car.location).map(car => car.location))).sort(),
  };

  const filterConfigs = [
    { name: 'brand', label: 'Brand', options: filterOptions.brand },
    { name: 'model', label: 'Model', options: filterOptions.model },
    { name: 'year', label: 'Year', options: filterOptions.year },
    { name: 'condition', label: 'Condition', options: filterOptions.condition },
    { name: 'body_type', label: 'Body Type', options: filterOptions.body_type },
    { name: 'fuel_type', label: 'Fuel Type', options: filterOptions.fuel_type },
    { name: 'gearbox_type', label: 'Transmission', options: filterOptions.gearbox_type },
    { name: 'color', label: 'Color', options: filterOptions.color },
    { name: 'location', label: 'Location', options: filterOptions.location },
  ].filter(filter => filter.options.length > 0);

  const priceRanges = [
    { min: 0, max: 50000 },
    { min: 50000, max: 100000 },
    { min: 100000, max: 200000 },
    { min: 200000, max: 500000 },
    { min: 500000, max: null },
  ];

  const mileageRanges = [
    { min: 0, max: 50000 },
    { min: 50000, max: 100000 },
    { min: 100000, max: 150000 },
    { min: 150000, max: 200000 },
    { min: 200000, max: null },
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.brand_id) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minYear || filters.maxYear) count++;
    if (selectedBodyTypes.length) count++;
    if (selectedFuelTypes.length) count++;
    if (selectedConditions.length) count++;
    if (filters.minMileage || filters.maxMileage) count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      sort: filters.sort // Preserve sort order
    });
    setSelectedBodyTypes([]);
    setSelectedFuelTypes([]);
    setSelectedConditions([]);
    toast.success('All filters cleared');
  };

  useEffect(() => {
    const newActiveFilters = [];
    if (filters.brand_id) {
      const brand = brands.find(b => b.id === filters.brand_id);
      if (brand) newActiveFilters.push(`Brand: ${brand.name}`);
    }
    if (filters.minPrice || filters.maxPrice) {
      newActiveFilters.push('Price Range');
    }
    if (filters.minYear || filters.maxYear) {
      newActiveFilters.push('Year Range');
    }
    selectedBodyTypes.forEach(type => newActiveFilters.push(`Body: ${type}`));
    selectedFuelTypes.forEach(type => newActiveFilters.push(`Fuel: ${type}`));
    selectedConditions.forEach(condition => newActiveFilters.push(`Condition: ${condition}`));
    if (filters.minMileage || filters.maxMileage) {
      newActiveFilters.push('Mileage Range');
    }
    setActiveFilters(newActiveFilters);
  }, [filters, selectedBodyTypes, selectedFuelTypes, selectedConditions, brands]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-5">
      <div className="container mx-auto px-4 pb-16">
        {/* Welcome Header */}
        <div className="relative overflow-hidden mb-8 rounded-2xl mx-4">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-gray-900/95 backdrop-blur-sm"></div>
          <div className="absolute inset-0">
            <Image
              src="/hero-cars.jpg"
              alt="Luxury Cars"
              fill
              className="object-cover brightness-75"
              priority
            />
          </div>
          <div className="relative max-w-4xl mx-auto text-center py-20 px-4">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
              Find Your Perfect Car at Mawater 974
            </h1>
            <p className="text-lg font-normal text-gray-100 max-w-2xl mx-auto leading-relaxed tracking-wide drop-shadow">
              Browse through Qatar's finest collection of premium vehicles. 
              Find exactly what you need with our advanced search and comparison tools.
            </p>
          </div>
        </div>

        <main className="px-4">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 p-4 mb-4   rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg backdrop-blur-md">
            <div className="flex flex-col gap-4">
              {/* Search and Actions */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search Bar */}
                <div className="relative flex-1 flex gap-4 w-full">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search by brand, model, or year..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-qatar-maroon text-white rounded-xl hover:bg-qatar-maroon/90 transition-all duration-200 flex items-center gap-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    Search
                  </button>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                      !showFilters
                        ? 'bg-qatar-maroon text-white hover:bg-qatar-maroon/90 transform hover:scale-105'
                        : 'bg-white dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700/50 hover:border-qatar-maroon hover:shadow-md'
                    }`}
                  >
                    <FunnelIcon className="h-5 w-5" />
                    Filters
                    {getActiveFilterCount() > 0 && (
                      <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                        !showFilters 
                          ? 'bg-white text-qatar-maroon' 
                          : 'bg-qatar-maroon text-white'
                      }`}>
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </button>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={filters.sort || 'newest'}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        sort: e.target.value as Filters['sort'] 
                      }))}
                      className="appearance-none w-full px-4 py-2 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qatar-maroon"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>

                  {/* Compare Button */}
                  <button
                    onClick={handleCompareClick}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                      compareMode
                        ? 'bg-qatar-maroon text-white hover:bg-qatar-maroon/90 transform hover:scale-105'
                        : 'bg-white dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700/50 hover:border-qatar-maroon hover:shadow-md'
                    }`}
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                    {compareMode ? (
                      selectedCars.length > 0 
                        ? `Compare (${selectedCars.length}/2)` 
                        : 'Select Cars'
                    ) : (
                      'Compare'
                    )}
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  {activeFilters.map((filter, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-qatar-maroon/10 text-qatar-maroon dark:text-qatar-maroon rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      {filter}
                    </span>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-qatar-maroon dark:hover:text-qatar-maroon transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters Panel - Desktop */}
            <AnimatePresence>
              {showFilters && (
                <motion.aside
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full md:w-80 sticky top-20"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-4 space-y-3 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Filters</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{cars.length} cars</span>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 md:hidden"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Brand & Model */}
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Brand
                      </label>
                      <select
                        value={filters.brand_id || ''}
                        onChange={(e) => {
                          const brandId = e.target.value ? Number(e.target.value) : undefined;
                          setFilters(prev => ({ ...prev, brand_id: brandId }));
                        }}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon text-sm"
                      >
                        <option value="">All Brands</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Price Range (QAR)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            placeholder="Min"
                            value={filters.minPrice || ''}
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : undefined;
                              setFilters(prev => ({
                                ...prev,
                                minPrice: value
                              }));
                            }}
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Max"
                            value={filters.maxPrice || ''}
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : undefined;
                              setFilters(prev => ({
                                ...prev,
                                maxPrice: value
                              }));
                            }}
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mileage Range */}
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Mileage Range (KM)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            placeholder="Min"
                            value={filters.minMileage || ''}
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : undefined;
                              setFilters(prev => ({
                                ...prev,
                                minMileage: value
                              }));
                            }}
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Max"
                            value={filters.maxMileage || ''}
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : undefined;
                              setFilters(prev => ({
                                ...prev,
                                maxMileage: value
                              }));
                            }}
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Year Range */}
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Year
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={filters.minYear || ''}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : undefined;
                            setFilters(prev => ({
                              ...prev,
                              minYear: value
                            }));
                          }}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon text-sm"
                        >
                          <option value="">From Year</option>
                          {Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => 1970 + i).reverse().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <select
                          value={filters.maxYear || ''}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : undefined;
                            setFilters(prev => ({
                              ...prev,
                              maxYear: value
                            }));
                          }}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon text-sm"
                        >
                          <option value="">To Year</option>
                          {Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => 1970 + i).reverse().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Condition */}
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Condition
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['New', 'Excellent', 'Good', 'Not Working'].map((condition) => (
                          <button
                            key={condition}
                            onClick={() => toggleCondition(condition)}
                            className={`px-2 py-1.5 rounded-lg text-sm border transition-all duration-200 ${
                              selectedConditions.includes(condition)
                                ? 'bg-qatar-maroon text-white border-qatar-maroon'
                                : 'bg-white dark:bg-gray-800/90 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700/50 hover:border-qatar-maroon'
                            }`}
                          >
                            {condition}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Body Type */}
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Body Type
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'].map((bodyType) => (
                          <button
                            key={bodyType}
                            onClick={() => toggleBodyType(bodyType)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 ${
                              selectedBodyTypes.includes(bodyType)
                                ? 'bg-qatar-maroon text-white border-qatar-maroon'
                                : 'bg-white dark:bg-gray-800/90 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700/50 hover:border-qatar-maroon'
                            }`}
                          >
                            {bodyType}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fuel Type */}
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Fuel Type
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((fuelType) => (
                          <button
                            key={fuelType}
                            onClick={() => toggleFuelType(fuelType)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 ${
                              selectedFuelTypes.includes(fuelType)
                                ? 'bg-qatar-maroon text-white border-qatar-maroon'
                                : 'bg-white dark:bg-gray-800/90 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700/50 hover:border-qatar-maroon'
                            }`}
                          >
                            {fuelType}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <button
                      onClick={clearAllFilters}
                      className="w-full px-4 py-2 bg-qatar-maroon/10 text-qatar-maroon hover:bg-qatar-maroon/20 rounded-xl transition-all duration-200 font-medium text-sm"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1">
              {/* Compare Mode Banner */}
              {compareMode && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 mb-6 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-qatar-maroon/10">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-qatar-maroon" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                          Compare Cars
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedCars.length} of 2 cars selected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-qatar-maroon transition-all duration-300"
                          style={{ width: `${(selectedCars.length / 2) * 100}%` }}
                        />
                      </div>
                      <button
                        onClick={() => setCompareMode(false)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Car Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
                {loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))
                ) : error ? (
                  <div className="col-span-full text-center text-red-500">{error}</div>
                ) : cars.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
                    No cars found matching your criteria
                  </div>
                ) : (
                  cars.map((car) => (
                    <div key={car.id} className="relative">
                      <CarCard
                        car={car}
                        isFavorited={favorites.has(car.id)}
                        onFavoriteChange={handleFavoriteChange}
                      />
                      {compareMode && (
                        <button
                          onClick={() => handleCompareToggle(car)}
                          className={`absolute top-2 left-2 p-2 rounded-lg z-10 transition-all ${
                            selectedCars.some(c => c.id === car.id)
                              ? 'bg-qatar-maroon text-white'
                              : 'bg-white/80 hover:bg-qatar-maroon hover:text-white'
                          }`}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            {selectedCars.some(c => c.id === car.id) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-3 h-3 bg-white rounded-sm"
                              />
                            )}
                          </div>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Compare Modal */}
          {showCompareModal && (
            <CarCompareModal
              isOpen={showCompareModal}
              onClose={handleCompareClose}
              cars={selectedCars}
            />
          )}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CarCard from '../../components/CarCard';
import { Car } from '../../types/supabase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Favorites() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cars');
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/favorites');
      return;
    }

    fetchFavoriteCars();
  }, [user]);

  const fetchFavoriteCars = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's favorite car IDs
      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('car_id')
        .eq('user_id', user?.id);

      if (favError) throw favError;

      if (!favorites.length) {
        setFavoriteCars([]);
        setLoading(false);
        return;
      }

      // Get the actual car details
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(id, name),
          model:models(id, name),
          images:car_images(id, url)
        `)
        .in('id', favorites.map(f => f.car_id));

      if (carsError) throw carsError;

      setFavoriteCars(cars || []);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load your favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (carId: number) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user?.id, car_id: carId });

      if (error) throw error;

      // Update local state
      setFavoriteCars(prev => prev.filter(car => car.id !== carId));
      toast.success('Removed from favorites', {
        icon: '💔',
        duration: 1500,
        position: 'bottom-right'
      });
    } catch (err: any) {
      console.error('Error removing from favorites:', err);
      toast.error('Failed to remove from favorites', {
        duration: 1500,
        position: 'bottom-right'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">My Favorites</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('cars')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'cars'
                ? 'bg-qatar-maroon text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Cars
          </button>
          <button
            onClick={() => setActiveTab('showrooms')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'showrooms'
                ? 'bg-qatar-maroon text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Showrooms
          </button>
          <button
            onClick={() => setActiveTab('parts')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'parts'
                ? 'bg-qatar-maroon text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Spare Parts
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-qatar-maroon border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg mb-6">
            <p className="text-red-600 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && activeTab === 'cars' && favoriteCars.length === 0 && (
          <div className="text-center py-12">
            <HeartSolid className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No favorite cars yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start adding cars to your favorites to see them here
            </p>
            <Link
              href="/cars"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-qatar-maroon text-white hover:bg-qatar-maroon/90 transition-colors"
            >
              Browse Cars
            </Link>
          </div>
        )}

        {/* Cars Grid */}
        {!loading && !error && activeTab === 'cars' && favoriteCars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {favoriteCars.map((car) => (
                <motion.div
                  key={car.id}
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    transition: { duration: 0.2 }
                  }}
                >
                  <CarCard
                    car={car}
                    isFavorited={true}
                    onFavoriteChange={handleRemoveFromFavorites}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Other tabs empty states */}
        {!loading && !error && activeTab === 'showrooms' && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Showroom favorites coming soon
            </p>
          </div>
        )}

        {!loading && !error && activeTab === 'parts' && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Spare parts favorites coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

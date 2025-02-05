'use client';

import { useState } from 'react';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

export default function Favorites() {
  const [activeTab, setActiveTab] = useState('cars');

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

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Example favorite item */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="relative">
              <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
              <button className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                <HeartSolid className="w-6 h-6 text-qatar-maroon" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {activeTab === 'cars' && 'Mercedes-Benz C-Class'}
                {activeTab === 'showrooms' && 'Premium Auto Gallery'}
                {activeTab === 'parts' && 'Premium Brake Pads'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {activeTab === 'cars' && '2023 • 15,000 km • Automatic'}
                {activeTab === 'showrooms' && 'Luxury car showroom'}
                {activeTab === 'parts' && 'High-performance brake system'}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-qatar-maroon font-semibold">
                  {activeTab === 'cars' && '$45,000'}
                  {activeTab === 'showrooms' && '⭐ 4.8'}
                  {activeTab === 'parts' && '$299.99'}
                </span>
                <button className="bg-qatar-maroon text-white px-4 py-2 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

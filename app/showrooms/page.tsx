import React from 'react';

export default function Showrooms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Car Showrooms</h1>
        
        {/* Search and Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search showrooms..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-qatar-maroon focus:border-transparent"
            />
            <select className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-transparent">
              <option value="">Select Location</option>
              <option value="north">North Region</option>
              <option value="south">South Region</option>
              <option value="central">Central Region</option>
            </select>
            <button className="bg-qatar-maroon text-white px-8 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Featured Showrooms */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="h-48 bg-gray-200 dark:bg-gray-700">
              {/* Showroom Image */}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Premium Auto Gallery</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Luxury car showroom featuring the latest models</p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center mr-4">
                  <svg className="w-4 h-4 text-qatar-maroon mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  4.8 (120 reviews)
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-qatar-maroon mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Central District
                </span>
              </div>
              <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
                View Details
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="h-48 bg-gray-200 dark:bg-gray-700">
              {/* Showroom Image */}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Elite Motors</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Specialized in sports and performance vehicles</p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center mr-4">
                  <svg className="w-4 h-4 text-qatar-maroon mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  4.9 (85 reviews)
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-qatar-maroon mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  North District
                </span>
              </div>
              <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
                View Details
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="h-48 bg-gray-200 dark:bg-gray-700">
              {/* Showroom Image */}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Family Auto Center</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Wide selection of family and economy vehicles</p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center mr-4">
                  <svg className="w-4 h-4 text-qatar-maroon mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  4.7 (150 reviews)
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-qatar-maroon mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  South District
                </span>
              </div>
              <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Find Showrooms Near You</h2>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl shadow-lg">
            {/* Map Component will go here */}
          </div>
        </section>
      </div>
    </div>
  );
}

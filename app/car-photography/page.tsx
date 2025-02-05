import React from 'react';

export default function CarPhotography() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Professional Car Photography</h1>
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-qatar-maroon to-qatar-maroon/80 text-white rounded-xl p-8 mb-12 shadow-lg">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Capture Your Car's Best Angles</h2>
            <p className="text-lg mb-6 text-gray-100">Professional photography services for car sellers, dealers, and enthusiasts. Our expert photographers know how to showcase your vehicle in the best light.</p>
            <button className="bg-white text-qatar-maroon px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              Book a Session
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
            <div className="text-qatar-maroon mb-6">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Standard Package</h3>
            <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                10 Professional Photos
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic Editing
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                2 Angles per Shot
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Digital Delivery
              </li>
            </ul>
            <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors font-semibold">
              Select Package
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
            <div className="text-qatar-maroon mb-6">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Premium Package</h3>
            <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                20 Professional Photos
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced Editing
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                4 Angles per Shot
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Interior Shots
              </li>
            </ul>
            <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors font-semibold">
              Select Package
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
            <div className="text-qatar-maroon mb-6">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Professional Package</h3>
            <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                30 Professional Photos
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Premium Editing
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All Angles Coverage
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Video Tour
              </li>
            </ul>
            <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors font-semibold">
              Select Package
            </button>
          </div>
        </div>

        {/* Portfolio Section */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Our Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Portfolio image placeholders */}
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </section>
      </div>
    </div>
  );
}

import React from 'react';

export default function CarRental() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Car Rental Services</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Rental Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Daily Rentals</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Flexible daily rental options for your needs</p>
            <button className="w-full bg-qatar-maroon text-white px-6 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
              Browse Daily Rentals
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Weekly Rentals</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Great deals for weekly rentals</p>
            <button className="w-full bg-qatar-maroon text-white px-6 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
              View Weekly Options
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Monthly Rentals</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Long-term rental solutions</p>
            <button className="w-full bg-qatar-maroon text-white px-6 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
              Explore Monthly Plans
            </button>
          </div>
        </div>
        
        {/* Featured Cars Section */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Featured Rental Cars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Featured car cards will be added here */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Premium Sedan</h3>
                <p className="text-gray-600 dark:text-gray-300">Starting from $50/day</p>
              </div>
            </div>
            {/* Add more featured car cards as needed */}
          </div>
        </section>
      </div>
    </div>
  );
}

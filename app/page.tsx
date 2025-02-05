'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCarSide, faTag, faSearch } from '@fortawesome/free-solid-svg-icons';
import SearchBar from '../components/SearchBar';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen pt-20">
        {/* Premium Background with Overlay */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/qatar-skyline.jpg')" }}>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/60"></div>
        </div>

        {/* Arabic Pattern Overlay */}
        <div className="absolute inset-0 arabic-pattern opacity-5"></div>

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                <span className="text-white">Premium Cars</span>
                <span className="text-primary block mt-2">in Qatar</span>
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-2xl">
                Discover the finest collection of luxury vehicles in Qatar. From exotic supercars to premium sedans, 
                find your perfect match with Mawater974.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/cars" className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold">
                  <FontAwesomeIcon icon={faCarSide} className="mr-2" />Browse Cars
                </Link>
                <Link href="/sell" className="px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-lg font-semibold backdrop-blur-sm">
                  <FontAwesomeIcon icon={faTag} className="mr-2" />Sell Your Car
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <div className="text-white/80">Premium Cars</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-primary mb-2">50+</div>
                  <div className="text-white/80">Trusted Dealers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-white/80">Support</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <div className="text-white/80">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-16">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Why Choose Mawater974?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Verified Sellers',
                description:
                  'All our sellers go through a strict verification process to ensure your safety.',
                icon: '🛡️',
              },
              {
                title: 'Wide Selection',
                description:
                  'Browse through thousands of cars from various brands and price ranges.',
                icon: '🚗',
              },
              {
                title: 'Easy Process',
                description:
                  'Simple and straightforward process to buy or sell your car.',
                icon: '✨',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

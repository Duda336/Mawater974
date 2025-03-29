'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useCountry } from '@/contexts/CountryContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCarSide, faTag } from '@fortawesome/free-solid-svg-icons';
import SearchBar from '@/components/SearchBar';
import { Dancing_Script } from 'next/font/google';

const dancingScript = Dancing_Script({ subsets: ['latin'] });

export default function HomePage() {
  const { signOutMessage, setSignOutMessage } = useAuth();
  const { t, language, currentLanguage } = useLanguage();
  const { currentCountry } = useCountry();

  useEffect(() => {
    // Clear sign-out message after it's been shown
    if (signOutMessage) {
      toast.success(signOutMessage);
      setSignOutMessage(null);
    }
  }, [signOutMessage, setSignOutMessage]);

  const countryPrefix = currentCountry ? `/${currentCountry.code.toLowerCase()}` : '';
  
  // Get country-specific background image
  const getCountryBackground = () => {
    if (!currentCountry) return '/qatar-bg.jpg';
    
    switch (currentCountry.code.toLowerCase()) {
      case 'qa':
        return '/qatar-bg.jpg';
      case 'sa':
        return '/saudi-bg.jpg';
      case 'ae':
        return '/uae-bg.jpg';
      case 'kw':
        return '/kuwait-bg.jpg';
      case 'sy':
        return '/syria-bg.jpg';
      case 'om':
        return '/oman-bg.jpg';
      case 'eg':
        return '/egypt-bg.jpg';
      case 'bh':
        return '/bahrain-bg.jpg';
      case 'jo':
        return '/jordan-bg.jpg';
      default:
        return '/qatar-bg.jpg';
    }
  };
  
  // Get country-specific title
  const getCountryTitle = () => {
    if (!currentCountry) return t('home.hero.title2');
    
    if (language === 'ar') {
      return `في ${currentCountry.name_ar}`;
    } else {
      return `in ${currentCountry.name}`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        {/* Premium Background with Overlay */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${getCountryBackground()}')` }}>
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
                        <div className={`flex-1 text-center lg:text-${language === 'ar' ? 'right' : 'left'} w-full`}>
              <div className={`${language === 'ar' ? 'rtl' : 'ltr'}`}>
                <h1 className="text-5xl lg:text-7xl font-bold mb-6 flex flex-col">
                  <span className={`${dancingScript.className} text-3xl lg:text-5xl text-secondary mb-3`}>Ride in Style</span>
                  <span className="text-white inline-block">{t('home.hero.title1')}</span>
                  <span className="text-primary inline-block mt-2">
                    {t('home.hero.title2', { 
                      country: currentCountry ? (currentLanguage === 'ar' ? currentCountry.name_ar : currentCountry.name) : (currentLanguage === 'ar' ? 'قطر' : 'Qatar')
                    })}
                  </span>
                </h1>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto lg:mr-0 lg:ml-0">
                {t('home.hero.description', { 
                    country: currentCountry ? (currentLanguage === 'ar' ? currentCountry.name_ar : currentCountry.name) : (currentLanguage === 'ar' ? 'قطر' : 'Qatar')
                  })}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href={`${countryPrefix}/cars`} className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold">
                  <FontAwesomeIcon icon={faCarSide} className="mr-2" />
                  {t('home.hero.browseCars')}
                </Link>
                <Link href={`${countryPrefix}/sell`} className="px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-lg font-semibold backdrop-blur-sm">
                  <FontAwesomeIcon icon={faTag} className="mr-2" />
                  {t('home.hero.sellYourCar')}
                </Link>
              </div>
            </div>
          </div>

            {/* Stats */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <div className="text-white/80">{t('home.stats.premiumCars')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-primary mb-2">50+</div>
                  <div className="text-white/80">{t('home.stats.trustedDealers')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-white/80">{t('home.stats.support')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <div className="text-white/80">{t('home.stats.satisfaction')}</div>
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
      <div className="bg-white dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t('home.whyChoose.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t('home.whyChoose.verifiedSellers.title'),
                description: t('home.whyChoose.verifiedSellers.description'),
                icon: '🛡️',
              },
              {
                title: t('home.whyChoose.wideSelection.title'),
                description: t('home.whyChoose.wideSelection.description'),
                icon: '🚗',
              },
              {
                title: t('home.whyChoose.easyProcess.title'),
                description: t('home.whyChoose.easyProcess.description'),
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

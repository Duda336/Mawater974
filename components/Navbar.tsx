'use client';

import { Fragment, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import {
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  HomeIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalytics } from '../hooks/useAnalytics';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { trackEvent } = useAnalytics();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDealer, setIsDealer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Check if user is admin
    const checkUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Error checking user role:', error);
            return;
          }
          
          setIsAdmin(data?.role === 'admin');
          setIsDealer(data?.role === 'dealer');
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    };
    checkUserRole();
    if (user) {
      fetchUnreadCount();
      // Subscribe to notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLanguageChange = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    try {
      trackEvent?.('language_change', { from: language, to: newLang });
    } catch (error) {
      console.error('Error tracking language change:', error);
    }
  };

  const navItems = [
    { name: t('nav.browseCars'), href: '/cars' },
    { name: t('nav.sellYourCar'), href: '/sell' },
    { name: t('nav.carRental'), href: '/car-rental' },
    { name: t('nav.spareParts'), href: '/spare-parts' },
    { name: t('nav.carPhotography'), href: '/car-photography' },
    { name: t('nav.showrooms'), href: '/showrooms' },
  ];

  const userMenuItems = [
    { name: t('user.myProfile'), href: '/profile', icon: UserCircleIcon },
    ...(isAdmin ? [{ name: t('user.adminDashboard'), href: '/admin', icon: ClipboardDocumentListIcon }] : []),
    { name: t('user.myAds'), href: '/my-ads', icon: ClipboardDocumentListIcon },
    { name: t('user.favorites'), href: '/favorites', icon: HeartIcon },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex-1 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Mawater974 Logo" width={150} height={40} className="h-150 w-40" priority />
            </Link>

            {/* Navigation Links */}
            <div className={`hidden md:flex items-center ${language === 'ar' ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon text-sm font-medium whitespace-nowrap"
              >
                {t('nav.home')}
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon text-sm font-medium whitespace-nowrap"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side buttons */}
            <div className={`flex items-center ${language === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              {/* Language Switcher */}
              <button
                onClick={handleLanguageChange}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon border border-gray-200 dark:border-gray-700 rounded-lg hover:border-qatar-maroon dark:hover:border-qatar-maroon transition-colors"
              >
                {language === 'ar' ? 'EN' : 'ع'}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* User Menu */}
              {user ? (
                <Menu as="div" className="relative ml-3">
                  <Menu.Button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-qatar-maroon dark:hover:text-qatar-maroon">
                    <UserCircleIcon className="h-8 w-8" />
                    <span className="hidden md:block font-medium">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      {/* Profile */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/profile"
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <UserCircleIcon className="mr-3 h-5 w-5" />
                            {t('user.myProfile')}
                          </Link>
                        )}
                      </Menu.Item>

                      {/* Messages & Notifications */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/messages"
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 relative`}
                          >
                            <BellIcon className="mr-3 h-5 w-5" />
                            {t('user.messages')}
                            {unreadCount > 0 && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-qatar-maroon text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </Link>
                        )}
                      </Menu.Item>

                      {/* Favorites */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/favorites"
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <HeartIcon className="mr-3 h-5 w-5" />
                            {t('user.favorites')}
                          </Link>
                        )}
                      </Menu.Item>

                      {/* My Ads */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/my-ads"
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <ClipboardDocumentListIcon className="mr-3 h-5 w-5" />
                            {t('user.myAds')}
                          </Link>
                        )}
                      </Menu.Item>

                      {/* Showroom Dashboard */}
                      {isDealer && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard"
                              className={`${
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <Cog6ToothIcon className="mr-3 h-5 w-5" />
                              {t('dashboard.title')}
                            </Link>
                          )}
                        </Menu.Item>
                      )}

                      {/* Admin Dashboard */}
                      {isAdmin && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin"
                              className={`${
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <Cog6ToothIcon className="mr-3 h-5 w-5" />
                              {t('user.adminDashboard')}
                            </Link>
                          )}
                        </Menu.Item>
                      )}

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                            {t('user.signOut')}
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              ) : (
                <div className="hidden sm:flex sm:items-center sm:space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon px-3 py-2 text-sm font-medium"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-qatar-maroon text-white hover:bg-qatar-maroon/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {t('nav.signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5" />
              {t('nav.home')}
            </span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {/* Mobile Language Switcher */}
          <button
            onClick={() => {
              handleLanguageChange();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            {language === 'en' ? 'EN/ع' : 'ع/EN'}
          </button>
          {!user && (
            <>
              <Link
                href="/login"
                className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-sign-in-alt text-gray-400" />
                  {t('nav.signIn')}
                </span>
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-user-plus text-gray-400" />
                  {t('nav.signUp')}
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

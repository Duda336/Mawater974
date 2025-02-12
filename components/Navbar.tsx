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
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is admin
    const checkAdminStatus = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.role === 'admin');
      }
    };
    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { name: 'Browse Cars', href: '/cars' },
    { name: 'Sell Your Car', href: '/sell' },
    { name: 'Car Rental', href: '/car-rental' },
    { name: 'Spare Parts', href: '/spare-parts' },
    { name: 'Car Photography', href: '/car-photography' },
    { name: 'Showrooms', href: '/showrooms' },
  ];

  const userMenuItems = [
    { name: 'My Profile', href: '/profile', icon: UserCircleIcon },
    ...(isAdmin ? [{ name: 'Admin Dashboard', href: '/admin', icon: ClipboardDocumentListIcon }] : []),
    { name: 'My Ads', href: '/my-ads', icon: ClipboardDocumentListIcon },
    { name: 'Favorites', href: '/favorites', icon: HeartIcon },
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
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon text-sm font-medium"
              >
                Home
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon text-sm font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <button
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon border border-gray-200 dark:border-gray-700 rounded-lg hover:border-qatar-maroon dark:hover:border-qatar-maroon transition-colors"
              >
                EN / عربي
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
                      {userMenuItems.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <Link
                              href={item.href}
                              className={`${
                                active
                                  ? 'bg-gray-100 dark:bg-gray-700'
                                  : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                            >
                              <item.icon className="h-5 w-5 mr-2" />
                              {item.name}
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${
                              active
                                ? 'bg-gray-100 dark:bg-gray-700'
                                : ''
                            } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                            Sign Out
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
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-qatar-maroon text-white hover:bg-qatar-maroon/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Up
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
      <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
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
            className="w-full text-left px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            EN / عربي
          </button>
          {!user && (
            <>
              <Link
                href="/login"
                className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

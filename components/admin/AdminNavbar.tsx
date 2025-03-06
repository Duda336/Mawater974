'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Analytics', href: '/admin' },
    { name: 'Country Analytics', href: '/admin/country-analytics' },
    { name: 'Cars', href: '/admin/cars' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Database', href: '/admin/database' },
    { name: 'Brands', href: '/admin/brands' },
    { name: 'Models', href: '/admin/models' },
    { name: 'Dealership Requests', href: '/admin/dealership-requests' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="text-xl font-bold text-qatar-maroon dark:text-qatar-maroon-light">
                Admin Dashboard
              </Link>
            </div>
            <nav className="ml-6 flex space-x-4 overflow-x-auto hide-scrollbar">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-qatar-maroon text-white dark:bg-qatar-maroon-dark'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Admin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

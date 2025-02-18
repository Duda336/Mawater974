 'use client';

import Link from 'next/link';
import Image from 'next/image';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Footer() {
  const quickLinks = [
    { name: 'Buy a Car', href: '/cars' },
    { name: 'Sell Your Car', href: '/sell' },
    { name: 'Showrooms', href: '/showrooms' },
    { name: 'Spare Parts', href: '/spare-parts' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div>
            <Image
              src="/logo.png"
              alt="Mawater974 Logo"
              width={180}
              height={60}
              style={{ width: 'auto', height: 'auto' }}
              className="mb-4"
            />
            <p className="text-white text-lg font-semibold mb-4">
              Ride In Style.
            </p>
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-4">
                <Link
                  href="/terms"
                  className="text-sm hover:text-qatar-maroon transition-colors"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm hover:text-qatar-maroon transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/contact"
                  className="text-sm hover:text-qatar-maroon transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-qatar-maroon transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com/mawater.974"
                className="text-gray-300 hover:text-qatar-maroon transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-instagram text-2xl"></i>
              </a>
              <a
                href="https://twitter.com/mawater974"
                className="text-gray-300 hover:text-qatar-maroon transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-twitter text-2xl"></i>
              </a>
              <a
                href="https://facebook.com/mawater.974"
                className="text-gray-300 hover:text-qatar-maroon transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-facebook text-2xl"></i>
              </a>
              <a
                href="https://linkedin.com"
                className="text-gray-300 hover:text-qatar-maroon transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-linkedin text-2xl"></i>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contact@mawater974.com"
                  className="hover:text-qatar-maroon transition-colors"
                >
                  contact@mawater974.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+974 50505050"
                  className="hover:text-qatar-maroon transition-colors"
                >
                  +974 50505050
                </a>
              </li>
              <li>Doha, Qatar</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-sm">
            {new Date().getFullYear()} Mawater974. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

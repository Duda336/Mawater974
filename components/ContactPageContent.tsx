'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faEnvelope,
  faPhone,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import ContactForm from '@/components/ContactForm';

export default function ContactPageContent() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen py-12 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-4xl font-bold mb-8 text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {t('contact.title')}
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`rounded-lg shadow-lg p-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          >
            <ContactForm />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`rounded-lg shadow-lg p-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('contact.info.title')}
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  className={`w-5 h-5 mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                />
                <div className="ml-4">
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('contact.info.address.title')}
                  </h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('contact.info.address.content')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className={`w-5 h-5 mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                />
                <div className="ml-4">
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('contact.info.email.title')}
                  </h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('contact.info.email.content')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FontAwesomeIcon
                  icon={faPhone}
                  className={`w-5 h-5 mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                />
                <div className="ml-4">
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('contact.info.phone.title')}
                  </h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('contact.info.phone.content')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FontAwesomeIcon
                  icon={faClock}
                  className={`w-5 h-5 mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                />
                <div className="ml-4">
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('contact.info.hours.title')}
                  </h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('contact.info.hours.content')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const ContactForm = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const supabase = createClientComponentClient<Database>();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t('contact.form.error'));
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        user_id: user?.id || null,
        status: 'unread',
      });

      if (error) throw error;
      
      toast.success(t('contact.form.success'));
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error(t('contact.form.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-6">
        <label htmlFor="name" className="block mb-2 font-medium">
          {t('contact.form.name')}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
      </div>
      <div className="mb-6">
        <label htmlFor="email" className="block mb-2 font-medium">
          {t('contact.form.email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
          dir="ltr"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="message" className="block mb-2 font-medium">
          {t('contact.form.message')}
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          className={`w-full px-4 py-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          theme === 'dark'
            ? 'bg-qatar-maroon hover:bg-red-800 text-white'
            : 'bg-qatar-maroon hover:bg-red-700 text-white'
        } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
            {t('contact.form.submitting')}
          </span>
        ) : (
          t('contact.form.submit')
        )}
      </button>
    </form>
  );
};

export default ContactForm;

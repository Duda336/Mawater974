'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { City } from '@/types/supabase';

interface DealershipRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DealershipRegistrationModal({
  isOpen,
  onClose,
}: DealershipRegistrationModalProps) {
  const { t, language } = useLanguage();
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { currentCountry, countries, getCitiesByCountry } = useCountry();
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({
    business_name: '',
    business_name_ar: '',
    description: '',
    description_ar: '',
    location: '',
    location_ar: '',
    dealership_type: '' as 'Official' | 'Private' | '',
    business_type: '' as 'showroom' | 'service_center' | 'spare_parts_dealership' | '',
    country_id: currentCountry?.id || null,
    city_id: '',
  });

  // Load cities based on selected country
  useEffect(() => {
    const loadCities = async () => {
      if (formData.country_id) {
        const countryCities = await getCitiesByCountry(formData.country_id);
        setCities(countryCities);
      }
    };
    
    loadCities();
  }, [formData.country_id, getCitiesByCountry]);

  // Check if user already has a pending request
  useEffect(() => {
    let mounted = true;

    const checkExistingRequest = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('dealerships')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!mounted) return;

      if (error) {
        console.error('Error checking request status:', error);
        return;
      }

      // If no data or empty array, user has no requests
      if (!data || data.length === 0) {
        return;
      }

      const latestRequest = data[0];
      
      if (latestRequest.status === 'pending') {
        alert(t('dealership.alreadyPending'));
        onClose();
      } else if (latestRequest.status === 'rejected') {
        // For rejected requests, we'll show a message but allow them to submit again
        const confirmResubmit = window.confirm(t('dealership.previouslyRejected'));
        if (!confirmResubmit) {
          onClose();
        } else {
          // If they want to resubmit, we'll pre-fill the form with their previous data
          // but exclude sensitive fields like logo
          setFormData({
            business_name: latestRequest.business_name || '',
            business_name_ar: latestRequest.business_name_ar || '',
            description: latestRequest.description || '',
            description_ar: latestRequest.description_ar || '',
            location: latestRequest.location || '',
            location_ar: latestRequest.location_ar || '',
            dealership_type: latestRequest.dealership_type || '',
            business_type: latestRequest.business_type || '',
            country_id: latestRequest.country_id || null,
            city_id: latestRequest.city_id || '',
          });
        }
      } else if (latestRequest.status === 'approved') {
        alert(t('dealership.alreadyApproved'));
        onClose();
      }
    };

    if (user && isOpen) {
      checkExistingRequest();
    }

    return () => {
      mounted = false;
    };
  }, [user, isOpen, t, onClose, supabase]);

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(t('auth.required'));
      return;
    }

    // Validate required fields
    if (!formData.business_name || !formData.business_name_ar || 
        !formData.description || !formData.description_ar || 
        !formData.dealership_type || !formData.business_type ||
        !formData.country_id || !formData.city_id) {
      alert(t('dealership.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      let logoUrl = null;

      // Upload logo if provided
      if (logo) {
        const fileExt = logo.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `dealership-logos/${fileName}`;

        // Make sure file size is not too large (max 2MB)
        if (logo.size > 2 * 1024 * 1024) {
          throw new Error('File size too large. Maximum size is 2MB.');
        }

        // Check if file type is an image
        if (!logo.type.startsWith('image/')) {
          throw new Error('File must be an image (JPEG, PNG, etc.)');
        }

        // Convert to base64 directly
        try {
          console.log('Using base64 approach for logo...');
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
          });
          reader.readAsDataURL(logo);
          
          logoUrl = await base64Promise;
          console.log('Successfully converted logo to base64');
        } catch (base64Error) {
          console.error('Base64 conversion failed:', base64Error);
          throw new Error('Failed to process logo. Please try again.');
        }
      }

      // Check if the user already has a dealership record
      const { data: existingData, error: existingError } = await supabase
        .from('dealerships')
        .select('id, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingError) {
        console.error('Error checking existing dealership:', existingError);
      }

      let dealershipId = null;
      
      // If the user has a rejected request, update it instead of creating a new one
      if (existingData && existingData.length > 0 && existingData[0].status === 'rejected') {
        dealershipId = existingData[0].id;
        
        // Find the selected city name for the location field
        const selectedCity = cities.find(city => city.id.toString() === formData.city_id);
        const cityName = selectedCity ? (language === 'ar' ? selectedCity.name_ar : selectedCity.name) : '';
        
        // Combine city name with additional location details
        const combinedLocation = `${cityName}${formData.location ? `, ${formData.location}` : ''}`;
        const combinedLocationAr = `${selectedCity?.name_ar || ''}${formData.location_ar ? `, ${formData.location_ar}` : ''}`;
        
        const { error: updateError } = await supabase
          .from('dealerships')
          .update({
            business_name: formData.business_name,
            business_name_ar: formData.business_name_ar,
            description: formData.description,
            description_ar: formData.description_ar,
            location: combinedLocation,
            location_ar: combinedLocationAr,
            dealership_type: formData.dealership_type,
            business_type: formData.business_type,
            country_id: formData.country_id,
            logo_url: logoUrl,
            status: 'pending',
            reviewer_id: null,
            review_notes: null,
            reviewed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', dealershipId);
        
        if (updateError) {
          console.error('Error updating dealership request:', updateError);
          throw updateError;
        }
      } else {
        // Create a new dealership request
        // Find the selected city name for the location field
        const selectedCity = cities.find(city => city.id.toString() === formData.city_id);
        const cityName = selectedCity ? (language === 'ar' ? selectedCity.name_ar : selectedCity.name) : '';
        
        // Combine city name with additional location details
        const combinedLocation = `${cityName}${formData.location ? `, ${formData.location}` : ''}`;
        const combinedLocationAr = `${selectedCity?.name_ar || ''}${formData.location_ar ? `, ${formData.location_ar}` : ''}`;
        
        const { error: requestError } = await supabase
          .from('dealerships')
          .insert({
            user_id: user.id,
            business_name: formData.business_name,
            business_name_ar: formData.business_name_ar,
            description: formData.description,
            description_ar: formData.description_ar,
            location: combinedLocation,
            location_ar: combinedLocationAr,
            dealership_type: formData.dealership_type,
            business_type: formData.business_type,
            country_id: formData.country_id,
            logo_url: logoUrl,
            status: 'pending',
          });

        if (requestError) {
          console.error('Request error details:', requestError);
          throw requestError;
        }
      }

      onClose();
      alert(t('dealership.requestSubmitted'));
    } catch (error: any) {
      console.error('Error submitting dealership request:', error);
      alert(error.message || t('dealership.requestError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];

      // Check file size (max 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        alert(t('dealership.logoSizeTooLarge'));
        return;
      }

      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        alert(t('dealership.logoMustBeImage'));
        return;
      }

      setLogo(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dealership.registration')}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleRegistrationSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto max-h-[80vh]">
            {/* Business Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.businessName')} (English)
                </label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.businessName')} (Arabic)
                </label>
                <input
                  type="text"
                  required
                  value={formData.business_name_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name_ar: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.description')} (English)
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.description')} (Arabic)
                </label>
                <textarea
                  required
                  value={formData.description_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('dealership.logo')}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                {logoPreview ? (
                  <div className="relative">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={150}
                      height={150}
                      className="object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="logo-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-qatar-maroon hover:text-qatar-maroon-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-qatar-maroon"
                      >
                        <span>{t('dealership.uploadLogo')}</span>
                        <input
                          id="logo-upload"
                          name="logo-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                      </label>
                      <p className="pl-1">{t('dealership.dragAndDrop')}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('dealership.fileTypes')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('dealership.maxFileSize')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.country')}
                </label>
                <select
                  value={formData.country_id || ''}
                  name="country_id"
                  onChange={(e) => setFormData(prev => ({ ...prev, country_id: e.target.value ? parseInt(e.target.value) : null, city_id: '' }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">{t('dealership.selectCountry')}</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>
                      {language === 'ar' ? country.name_ar : country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.city')}
                </label>
                <select
                  value={formData.city_id}
                  name="city_id"
                  onChange={(e) => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">{t('dealership.selectCity')}</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>
                      {language === 'ar' ? city.name_ar : city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.locationDetails')} (English)
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.locationDetails')} (Arabic)
                </label>
                <input
                  type="text"
                  required
                  value={formData.location_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_ar: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.dealershipTypeLabel')}
                </label>
                <select
                  value={formData.dealership_type}
                  name="dealership_type"
                  onChange={(e) => setFormData(prev => ({ ...prev, dealership_type: e.target.value as 'Official' | 'Private' | '' }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">{t('dealership.selectDealershipType')}</option>
                  <option value="private">{t('showroom.dealershipTypes.private')}</option>
                  <option value="official">{t('showroom.dealershipTypes.official')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dealership.businessTypeLabel')}
                </label>
                <select
                  value={formData.business_type}
                  name="business_type"
                  onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value as 'showroom' | 'service_center' | 'spare_parts_dealership' | '' }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">{t('dealership.selectBusinessType')}</option>
                  <option value="showroom">{t('showroom.businessTypes.showroom')}</option>
                  <option value="service_center">{t('showroom.businessTypes.service center')}</option>
                  <option value="spare_parts_dealership">{t('showroom.businessTypes.spare parts dealership')}</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-qatar-maroon rounded-md shadow-sm hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.loading')}
                  </>
                ) : (
                  t('dealership.submit')
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog } from '@headlessui/react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface CarListingFormProps {
  showroomId?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: () => Promise<void>;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function CarListingForm({ 
  showroomId, 
  isOpen = true, 
  onClose, 
  onSubmit,
  onCancel,
  onSuccess 
}: CarListingFormProps) {
  const { t, language } = useLanguage();
  const { supabase } = useSupabase();
  const { user, profile } = useAuth();
  const { countries, cities, currentCountry, getCitiesByCountry } = useCountry();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    price: '',
    year: new Date().getFullYear(),
    make: '',
    model: '',
    trim: '',
    mileage: '',
    exterior_color: '',
    interior_color: '',
    transmission: 'automatic',
    fuel_type: 'petrol',
    body_type: '',
    condition: 'new',
    country_id: profile?.country_id || currentCountry?.id || 0,
    city_id: 0
  });

  // Set default country and city when component mounts
  useEffect(() => {
    if (currentCountry) {
      setFormData(prev => ({
        ...prev,
        country_id: profile?.country_id || currentCountry.id
      }));
    }
  }, [currentCountry, profile?.country_id]);

  // Update available cities when country changes
  const handleCountryChange = (countryId: number) => {
    setFormData(prev => ({
      ...prev,
      country_id: countryId,
      city_id: 0 // Reset city when country changes
    }));
    
    const countryCities = getCitiesByCountry(countryId);
    setAvailableCities(countryCities);
    
    if (countryCities.length > 0) {
      setFormData(prev => ({
        ...prev,
        city_id: countryCities[0].id
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images first
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const fileName = `${Date.now()}-${image.name}`;
          const { data, error } = await supabase.storage
            .from('car-images')
            .upload(fileName, image);

          if (error) throw error;
          return supabase.storage.from('car-images').getPublicUrl(data.path).data.publicUrl;
        })
      );

      // Create the car listing
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert([
          {
            user_id: user?.id,
            showroom_id: showroomId,
            ...formData,
            images: imageUrls,
            thumbnail: imageUrls[0] || null,
            status: 'Pending'
          }
        ])
        .select()
        .single();

      if (carError) throw carError;

      // Call the appropriate success callback
      if (onSuccess) onSuccess();
      if (onSubmit) await onSubmit();
      
      // Close the form if in modal mode
      if (onClose) onClose();
    } catch (error) {
      console.error('Error submitting car listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-lg font-semibold">
              {t('car.addNew')}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.title')} (English)
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.title')} (Arabic)
                </label>
                <input
                  type="text"
                  required
                  value={formData.title_ar}
                  onChange={e => setFormData(prev => ({ ...prev, title_ar: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.description')} (English)
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.description')} (Arabic)
                </label>
                <textarea
                  required
                  value={formData.description_ar}
                  onChange={e => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('common.country')}
                </label>
                <select
                  value={formData.country_id}
                  onChange={e => handleCountryChange(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">{t('common.selectCountry')}</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>
                      {language === 'ar' ? country.name_ar : country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('common.city')}
                </label>
                <select
                  value={formData.city_id}
                  onChange={e => setFormData(prev => ({ ...prev, city_id: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  disabled={availableCities.length === 0}
                >
                  <option value="">{t('common.selectCity')}</option>
                  {availableCities.map(city => (
                    <option key={city.id} value={city.id}>
                      {language === 'ar' ? city.name_ar : city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Car Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.price')} ({currentCountry?.currency_code || 'QAR'})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.year')}
                </label>
                <input
                  type="number"
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.make')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.make}
                  onChange={e => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.model')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.trim')}
                </label>
                <input
                  type="text"
                  value={formData.trim}
                  onChange={e => setFormData(prev => ({ ...prev, trim: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.mileage')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.mileage}
                  onChange={e => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.exteriorColor')}
                </label>
                <input
                  type="text"
                  value={formData.exterior_color}
                  onChange={e => setFormData(prev => ({ ...prev, exterior_color: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.interiorColor')}
                </label>
                <input
                  type="text"
                  value={formData.interior_color}
                  onChange={e => setFormData(prev => ({ ...prev, interior_color: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.transmission')}
                </label>
                <select
                  value={formData.transmission}
                  onChange={e => setFormData(prev => ({ ...prev, transmission: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="automatic">{t('car.transmission.automatic')}</option>
                  <option value="manual">{t('car.transmission.manual')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.fuelType')}
                </label>
                <select
                  value={formData.fuel_type}
                  onChange={e => setFormData(prev => ({ ...prev, fuel_type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="petrol">{t('car.fuelType.petrol')}</option>
                  <option value="diesel">{t('car.fuelType.diesel')}</option>
                  <option value="electric">{t('car.fuelType.electric')}</option>
                  <option value="hybrid">{t('car.fuelType.hybrid')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.bodyType')}
                </label>
                <input
                  type="text"
                  value={formData.body_type}
                  onChange={e => setFormData(prev => ({ ...prev, body_type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('car.condition')}
                </label>
                <select
                  value={formData.condition}
                  onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="new">{t('car.condition.new')}</option>
                  <option value="used">{t('car.condition.used')}</option>
                </select>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('car.images')}
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={URL.createObjectURL(image)}
                      alt={`Car image ${index + 1}`}
                      width={200}
                      height={150}
                      className="rounded-lg object-cover w-full h-[150px]"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ))}
                
                {images.length < 8 && (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="h-[150px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-primary hover:text-primary">
                      <PhotoIcon className="h-8 w-8 mb-2" />
                      <span className="text-sm">{t('car.addImages')}</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {t('car.maxImages', { count: 8 - images.length })}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

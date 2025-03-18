import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import { useCountry } from '@/contexts/CountryContext';
import Image from 'next/image';

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onUpdate: () => void;
}

export default function EditCarModal({ isOpen, onClose, car, onUpdate }: EditCarModalProps) {
  const { t, language } = useLanguage();
  const { supabase } = useSupabase();
  const { currentCountry } = useCountry();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    brand_id: '',
    model_id: '',
    year: new Date().getFullYear(),
    mileage: '',
    price: '',
    color: '',
    description: '',
    fuel_type: '',
    gearbox_type: '',
    body_type: '',
    condition: '',
    cylinders: '',
    exact_model: '',
    city_id: '',
    images: [] as string[],
    mainImageUrl: ''
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('*')
          .order('name');
        setBrands(brandsData || []);

        // Fetch cities for current country
        const { data: citiesData } = await supabase
          .from('cities')
          .select('*')
          .eq('country_id', currentCountry?.id)
          .order('name');
        setCities(citiesData || []);

        // If we have a brand_id, fetch models
        if (car?.brand?.id) {
          const { data: modelsData } = await supabase
            .from('models')
            .select('*')
            .eq('brand_id', car.brand.id)
            .order('name');
          setModels(modelsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [currentCountry?.id]);

  // Set initial form data when car changes
  useEffect(() => {
    if (car) {
      setFormData({
        brand_id: car.brand?.id?.toString() || '',
        model_id: car.model?.id?.toString() || '',
        year: car.year || new Date().getFullYear(),
        mileage: car.mileage?.toString() || '',
        price: car.price?.toString() || '',
        color: car.color || '',
        description: car.description || '',
        fuel_type: car.fuel_type || '',
        gearbox_type: car.gearbox_type || '',
        body_type: car.body_type || '',
        condition: car.condition || '',
        cylinders: car.cylinders || '',
        exact_model: car.exact_model || '',
        city_id: car.city?.id?.toString() || '',
        images: car.images?.map((img: any) => img.url) || [],
        mainImageUrl: car.images?.find((img: any) => img.is_main)?.url || car.images?.[0]?.url || ''
      });

      // Fetch models for the selected brand
      if (car.brand?.id) {
        fetchModels(car.brand.id);
      }
    }
  }, [car]);

  // Fetch models when brand changes
  useEffect(() => {
    if (formData.brand_id) {
      fetchModels(parseInt(formData.brand_id));
    }
  }, [formData.brand_id]);

  // Fetch models
  const fetchModels = async (brandId: number) => {
    try {
      const { data } = await supabase
        .from('models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update car details
      const { error: carError } = await supabase
        .from('cars')
        .update({
          brand_id: parseInt(formData.brand_id),
          model_id: parseInt(formData.model_id),
          year: parseInt(formData.year.toString()),
          mileage: parseInt(formData.mileage),
          price: parseFloat(formData.price),
          color: formData.color,
          description: formData.description,
          fuel_type: formData.fuel_type,
          gearbox_type: formData.gearbox_type,
          body_type: formData.body_type,
          condition: formData.condition,
          cylinders: formData.cylinders,
          exact_model: formData.exact_model,
          city_id: parseInt(formData.city_id),
          updated_at: new Date().toISOString()
        })
        .eq('id', car.id);

      if (carError) throw carError;

      // Handle image updates
      if (formData.images.length > 0) {
        // Delete existing images
        await supabase
          .from('car_images')
          .delete()
          .eq('car_id', car.id);

        // Insert new images
        const { error: imageError } = await supabase
          .from('car_images')
          .insert(
            formData.images.map(url => ({
              car_id: car.id,
              url,
              is_main: url === formData.mainImageUrl
            }))
          );

        if (imageError) throw imageError;
      }

      toast.success(t('myAds.edit.success'));
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating car:', error);
      toast.error(t('myAds.edit.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetMainImage = (url: string) => {
    setFormData(prev => ({ ...prev, mainImageUrl: url }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('myAds.edit.title')}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.brand')}
                      </label>
                      <select
                        value={formData.brand_id}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            brand_id: e.target.value,
                            model_id: '' // Reset model when brand changes
                          }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>
                            {language === 'ar' ? brand.name_ar : brand.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.model')}
                      </label>
                      <select
                        value={formData.model_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, model_id: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        {models.map(model => (
                          <option key={model.id} value={model.id}>
                            {language === 'ar' ? model.name_ar : model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.exactModel')}
                      </label>
                      <input
                        type="text"
                        value={formData.exact_model}
                        onChange={(e) => setFormData(prev => ({ ...prev, exact_model: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.year')}
                      </label>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.mileage')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.mileage}
                        onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.price')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.color')}
                      </label>
                      <select
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="White">{t('car.color.white')}</option>
                        <option value="Black">{t('car.color.black')}</option>
                        <option value="Silver">{t('car.color.silver')}</option>
                        <option value="Gray">{t('car.color.gray')}</option>
                        <option value="Red">{t('car.color.red')}</option>
                        <option value="Blue">{t('car.color.blue')}</option>
                        <option value="Green">{t('car.color.green')}</option>
                        <option value="Brown">{t('car.color.brown')}</option>
                        <option value="Other">{t('car.color.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.cylinders')}
                      </label>
                      <select
                        value={formData.cylinders}
                        onChange={(e) => setFormData(prev => ({ ...prev, cylinders: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="3">{t('car.cylinders.3')}</option>
                        <option value="4">{t('car.cylinders.4')}</option>
                        <option value="6">{t('car.cylinders.6')}</option>
                        <option value="8">{t('car.cylinders.8')}</option>
                        <option value="12">{t('car.cylinders.12')}</option>
                        <option value="16">{t('car.cylinders.16')}</option>
                        <option value="Electric">{t('car.cylinders.electric')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.city')}
                      </label>
                      <select
                        value={formData.city_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>
                            {language === 'ar' ? city.name_ar : city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.fuelType')}
                      </label>
                      <select
                        value={formData.fuel_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, fuel_type: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="petrol">{t('car.fuelTypes.petrol')}</option>
                        <option value="diesel">{t('car.fuelTypes.diesel')}</option>
                        <option value="electric">{t('car.fuelTypes.electric')}</option>
                        <option value="hybrid">{t('car.fuelTypes.hybrid')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.gearboxType')}
                      </label>
                      <select
                        value={formData.gearbox_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, gearbox_type: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="automatic">{t('car.gearboxTypes.automatic')}</option>
                        <option value="manual">{t('car.gearboxTypes.manual')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.bodyType')}
                      </label>
                      <select
                        value={formData.body_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, body_type: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="sedan">{t('car.bodyTypes.sedan')}</option>
                        <option value="suv">{t('car.bodyTypes.suv')}</option>
                        <option value="hatchback">{t('car.bodyTypes.hatchback')}</option>
                        <option value="coupe">{t('car.bodyTypes.coupe')}</option>
                        <option value="pickup">{t('car.bodyTypes.pickup')}</option>
                        <option value="van">{t('car.bodyTypes.van')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('car.condition')}
                    </label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">{t('car.select')}</option>
                      <option value="new">{t('car.conditions.new')}</option>
                      <option value="used">{t('car.conditions.used')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('car.description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('car.images')}
                    </label>
                    <div className="space-y-4">
                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {formData.images.map((url, index) => (
                            <div key={url} className="relative group">
                              <div className="aspect-w-16 aspect-h-9">
                                <Image
                                  src={url}
                                  alt={`Car image ${index + 1}`}
                                  fill
                                  className={`rounded-lg object-cover ${url === formData.mainImageUrl ? 'ring-2 ring-qatar-maroon' : ''}`}
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                />
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => handleSetMainImage(url)}
                                  className={`px-2 py-1 text-xs font-medium ${
                                    url === formData.mainImageUrl
                                      ? 'bg-qatar-maroon text-white'
                                      : 'bg-white text-gray-900 hover:bg-qatar-maroon hover:text-white'
                                  } rounded-md transition-colors mr-2`}
                                >
                                  {url === formData.mainImageUrl ? t('car.mainPhoto') : t('car.setAsMain')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newImages = formData.images.filter(img => img !== url);
                                    setFormData(prev => ({
                                      ...prev,
                                      images: newImages,
                                      mainImageUrl: prev.mainImageUrl === url 
                                        ? (newImages.length > 0 ? newImages[0] : '')
                                        : prev.mainImageUrl
                                    }));
                                  }}
                                  className="p-1 bg-white/80 rounded-full text-gray-700 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <ImageUpload
                        onUpload={(urls) => {
                          setFormData(prev => ({
                            ...prev,
                            images: [...prev.images, ...urls],
                            mainImageUrl: prev.mainImageUrl || urls[0]
                          }));
                        }}
                        maxFiles={10 - formData.images.length}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-qatar-maroon border border-transparent rounded-md shadow-sm hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50"
                    >
                      {loading ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

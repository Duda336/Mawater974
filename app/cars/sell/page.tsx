'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

export default function SellCarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    brand_id: '',
    model_id: '',
    year: new Date().getFullYear(),
    mileage: '',
    price: '',
    color: 'Other',
    cylinders: '',
    description: '',
    fuel_type: 'Petrol',
    gearbox_type: 'Automatic',
    body_type: 'Sedan',
    condition: 'Good'
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchBrands();
  }, [user, router]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      setError(error.message);
    }
  };

  const fetchModels = async (brandId: string) => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');
      
      if (error) throw error;
      setModels(data || []);
    } catch (error: any) {
      console.error('Error fetching models:', error);
      setError(error.message);
    }
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    setFormData(prev => ({ ...prev, brand_id: brandId, model_id: '' }));
    setModels([]);
    if (brandId) {
      fetchModels(brandId);
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

  const uploadImages = async (carId: number): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${carId}/${Date.now()}.${fileExt}`;
      const filePath = `cars/${fileName}`;

      try {
        const { error: uploadError, data } = await supabase.storage
          .from('car-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        setUploadProgress(((i + 1) / images.length) * 100);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Insert car data
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert([
          {
            ...formData,
            user_id: user.id,
            price: parseFloat(formData.price),
            mileage: parseInt(formData.mileage),
            year: parseInt(formData.year.toString())
          }
        ])
        .select()
        .single();

      if (carError) throw carError;

      // Upload images if any
      if (images.length > 0) {
        const imageUrls = await uploadImages(carData.id);
        
        // Insert image records
        const { error: imageError } = await supabase
          .from('car_images')
          .insert(
            imageUrls.map((url, index) => ({
              car_id: carData.id,
              url,
              is_primary: index === 0
            }))
          );

        if (imageError) throw imageError;
      }

      router.push(`/cars/${carData.id}`);
    } catch (error: any) {
      console.error('Error creating car listing:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Sell Your Car
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand and Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand *
            </label>
            <select
              value={formData.brand_id}
              onChange={handleBrandChange}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model *
            </label>
            <select
              value={formData.model_id}
              onChange={e => setFormData(prev => ({ ...prev, model_id: e.target.value }))}
              required
              disabled={!formData.brand_id}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700 disabled:opacity-50"
            >
              <option value="">Select Model</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Year, Mileage, and Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year *
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.year}
              onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mileage (km) *
            </label>
            <input
              type="number"
              min="0"
              value={formData.mileage}
              onChange={e => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price (QAR) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Color and Cylinders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color *
            </label>
            <select
              value={formData.color}
              onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            >
              {[
                'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 
                'Green', 'Yellow', 'Brown', 'Gold', 'Orange', 'Purple', 
                'Beige', 'Bronze', 'Maroon', 'Navy', 'Other'
              ].map(color => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cylinders
            </label>
            <select
              value={formData.cylinders}
              onChange={e => setFormData(prev => ({ ...prev, cylinders: e.target.value }))}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            >
              <option value="">Select Cylinders</option>
              {['3', '4', '5', '6', '8', '10', '12', '16'].map(cyl => (
                <option key={cyl} value={cyl}>
                  {cyl} Cylinders
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Car Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fuel Type *
            </label>
            <select
              value={formData.fuel_type}
              onChange={e => setFormData(prev => ({ ...prev, fuel_type: e.target.value }))}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            >
              {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transmission *
            </label>
            <select
              value={formData.gearbox_type}
              onChange={e => setFormData(prev => ({ ...prev, gearbox_type: e.target.value }))}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            >
              {['Manual', 'Automatic'].map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Body Type *
            </label>
            <select
              value={formData.body_type}
              onChange={e => setFormData(prev => ({ ...prev, body_type: e.target.value }))}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            >
              {['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'].map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Condition *
            </label>
            <select
              value={formData.condition}
              onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value }))}
              required
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            >
              {['New', 'Excellent', 'Good', 'Not Working'].map(condition => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon dark:bg-gray-700"
            placeholder="Describe your car's features, history, and condition..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Images
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-qatar-maroon hover:text-qatar-maroon/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-qatar-maroon"
                >
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF up to 10MB each
              </p>
            </div>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-qatar-maroon text-white px-6 py-2 rounded-lg font-medium hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50"
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </div>

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-qatar-maroon">
                    Uploading Images
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-qatar-maroon">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-qatar-maroon/20">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-qatar-maroon transition-all duration-500"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

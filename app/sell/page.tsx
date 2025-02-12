'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Database } from '../../types/supabase';
import ImageUpload from '../../components/ImageUpload';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCarSide } from '@fortawesome/free-solid-svg-icons';
import { faSearch, faCamera, faChartLine, faHeadset } from '@fortawesome/free-solid-svg-icons';

const features = {
  free: [
    'Basic listing visibility',
    'Upload up to 10 photos',
    'Standard search placement',
    'Basic car details display',
    '30-day listing duration',
    'Email support'
  ],
  featured: [
    'Premium visibility & placement',
    'Upload up to 15 photos and 2 videos',
    'Featured in homepage carousel',
    'Priority search placement',
    'Detailed car specifications',
    'Social media promotion',
    '60-day listing duration',
    'Priority customer support',
    'Performance analytics',
    'Highlighted listing badge'
  ]
};

type Car = Database['public']['Tables']['cars']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];
type Model = Database['public']['Tables']['models']['Row'];

interface ExtendedCar extends Car {
  brand: Brand;
  model: Model;
  images: { url: string }[];
}

interface FormData {
  description: string;
  price: string;
  brand: string;  // Brand ID as string
  model: string;  // Model ID as string
  year: string;
  mileage: string;
  fuel_type: string;
  gearbox_type: string;
  body_type: string;
  condition: string;
  color: string;
  cylinders: string;
  location: string;
  images: File[];
}

const initialFormData: FormData = {
  description: '',
  price: '',
  brand: '',
  model: '',
  year: '',
  mileage: '',
  fuel_type: '',
  gearbox_type: '',
  body_type: '',
  condition: '',
  color: '',
  cylinders: '',
  location: '',
  images: [],
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const gearboxTypes = ['Manual', 'Automatic'];
const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'];
const conditions = ['New', 'Excellent', 'Good', 'Not Working'];
const colors =['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Brown', 'Gold', 'Orange', 'Purple', 'Beige', 'Bronze', 'Maroon', 'Navy', 'Other'];
const cylinderOptions = ['Electric', '3', '4', '5', '6', '8', '10', '12', '16'];
const locations = ['Doha', 'Al Wakrah', 'Al Khor', 'Lusail', 'Al Rayyan', 'Umm Salal', 'Al Daayen', 'Al Shamal', 'Al Shahaniya'];

export default function SellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [selectedPlan, setSelectedPlan] = useState<'free' | 'featured' | null>(null);
  const [step, setStep] = useState<'plan' | 'details'>('plan');

  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [carData, setCarData] = useState({
    brand_id: '',
    model_id: '',
    year: new Date().getFullYear(),
    mileage: '',
    price: '',
    description: '',
    fuel_type: '',
    gearbox_type: '',
    body_type: '',
    condition: '',
    color: '',
  });
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<Array<{ id: number; url: string }>>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState<'plan-selection' | 'step1' | 'step2' | 'step3' | 'step4'>('plan-selection');
  const totalSteps = 4; // Basic Info, Details, Images, Preview
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const steps = [
    { 
      id: 'plan-selection', 
      name: 'Plan Selection', 
      description: 'Choose your listing plan' 
    },
    { 
      id: 'step1', 
      name: 'Basic Info', 
      description: 'Enter your car\'s basic details like brand and model' 
    },
    { 
      id: 'step2', 
      name: 'Details', 
      description: 'Provide specific details about your car\'s features' 
    },
    { 
      id: 'step3', 
      name: 'Images', 
      description: 'Upload clear photos of your vehicle' 
    },
    { 
      id: 'step4', 
      name: 'Review & Submit', 
      description: 'Review your listing and submit for approval' 
    }
  ];

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      toast.error('Failed to fetch brands');
      console.error(err);
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
    } catch (err) {
      toast.error('Failed to fetch models');
      console.error(err);
    }
  };

  const fetchCarDetails = async (carId: string) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*, brand:brands(*), model:models(*), images(url)')
        .eq('id', carId)
        .single();

      if (error) throw error;

      // Populate form data with existing car details
      setCarData({
        brand_id: data.brand_id,
        model_id: data.model_id,
        year: data.year,
        mileage: data.mileage,
        price: data.price,
        description: data.description,
        fuel_type: data.fuel_type,
        gearbox_type: data.gearbox_type,
        body_type: data.body_type,
        condition: data.condition,
        color: data.color,
      });

      // Populate existing images
      setExistingImages(data.images.map((img: { url: string }, index: number) => ({
        id: index,
        url: img.url
      })));

      setIsEditing(true);
    } catch (err) {
      toast.error('Failed to fetch car details');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBrands();
    if (editId) {
      fetchCarDetails(editId);
    }
  }, [editId]);

  useEffect(() => {
    if (formData.brand) {
      fetchModels(formData.brand);
    }
  }, [formData.brand]);

  const handleContinue = () => {
    // Store the selected plan in localStorage or context
    localStorage.setItem('selectedListingPlan', selectedPlan);
    setStep('details');
  };

  const renderBasicInfo = () => (
    <div className="space-y-6 bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl rounded-xl p-6 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          List Your Car Details
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Provide comprehensive information to help potential buyers understand your vehicle
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand */}
          <div>
            <label 
              htmlFor="brand" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Brand *
            </label>
            <select
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label 
              htmlFor="model" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Model *
            </label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={(e) => handleInputChange(e)}
              required
              disabled={!formData.brand}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Model</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label 
              htmlFor="year" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Year *
            </label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Year</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label 
              htmlFor="price" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Price (QAR) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                QAR
              </span>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={(e) => handleInputChange(e)}
                required
                placeholder="Enter car price"
                className="w-full pl-12 px-4 py-2.5 border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg 
                           shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 focus:border-qatar-maroon 
                           transition duration-200 ease-in-out"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCarDetails = () => (
    <div className="space-y-6 bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl rounded-xl p-6 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Car Details
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Provide specific details about your car's features
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mileage */}
          <div>
            <label 
              htmlFor="mileage" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Mileage (km) *
            </label>
            <input
              type="number"
              id="mileage"
              name="mileage"
              value={formData.mileage}
              onChange={(e) => handleInputChange(e)}
              required
              min="0"
              placeholder="Enter car mileage"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            />
          </div>

          {/* Fuel Type */}
          <div>
            <label 
              htmlFor="fuel_type" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Fuel Type *
            </label>
            <select
              id="fuel_type"
              name="fuel_type"
              value={formData.fuel_type}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Fuel Type</option>
              {fuelTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Gearbox Type */}
          <div>
            <label 
              htmlFor="gearbox_type" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Transmission *
            </label>
            <select
              id="gearbox_type"
              name="gearbox_type"
              value={formData.gearbox_type}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Transmission</option>
              {gearboxTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Body Type */}
          <div>
            <label 
              htmlFor="body_type" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Body Type *
            </label>
            <select
              id="body_type"
              name="body_type"
              value={formData.body_type}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Body Type</option>
              {bodyTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label 
              htmlFor="condition" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Condition *
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Condition</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label 
              htmlFor="color" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Color *
            </label>
            <select
              id="color"
              name="color"
              value={formData.color}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Color</option>
              {colors.map(color => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          {/* Cylinders */}
          <div>
            <label 
              htmlFor="cylinders" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Cylinders
            </label>
            <select
              id="cylinders"
              name="cylinders"
              value={formData.cylinders}
              onChange={(e) => handleInputChange(e)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Cylinders</option>
              {cylinderOptions.map(cyl => (
                <option key={cyl} value={cyl}>
                  {cyl === 'Electric' ? cyl : `${cyl} Cylinders`}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label 
              htmlFor="location" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Location
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label 
              htmlFor="description" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange(e)}
              placeholder="Describe your car's features, condition, and any additional information potential buyers should know..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderImageUpload = () => (
    <div className="space-y-6 bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl rounded-xl p-6 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Upload Car Photos
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Add photos of your car to showcase its features
        </p>
      </div>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Current Photos
          </h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {existingImages.map((image) => (
              <div key={image.id} className="relative aspect-square group">
                <img
                  src={image.url}
                  alt="Car"
                  className="object-cover rounded-lg w-full h-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(image.id)}
                    className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Image Upload */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Upload New Photos
        </h4>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="image-upload" className="relative cursor-pointer w-full">
            <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG or JPEG (MAX. 10MB per image)
                </p>
              </div>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </label>
        </div>

        {/* Preview New Images */}
        {newImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              New Photos to Upload
            </h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {newImages.map((file, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="object-cover rounded-lg w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreview = () => {
    const selectedBrand = brands.find(b => b.id.toString() === formData.brand);
    const selectedModel = models.find(m => m.id.toString() === formData.model);

    const previewItems = [
      { label: 'Brand', value: selectedBrand?.name },
      { label: 'Model', value: selectedModel?.name },
      { label: 'Year', value: formData.year },
      { label: 'Price', value: `${parseInt(formData.price).toLocaleString()} QAR` },
      { label: 'Mileage', value: `${parseInt(formData.mileage).toLocaleString()} km` },
      { label: 'Fuel Type', value: formData.fuel_type },
      { label: 'Transmission', value: formData.gearbox_type },
      { label: 'Body Type', value: formData.body_type },
      { label: 'Condition', value: formData.condition },
      { label: 'Color', value: formData.color },
      { label: 'Cylinders', value: formData.cylinders ? `${formData.cylinders}` : 'Not specified' },
      { label: 'Location', value: formData.location },
    ];

    return (
      <div className="space-y-8 bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl rounded-xl p-6 md:p-10">
        {/* Preview Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Car Listing Preview
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Review your listing details before submitting
          </p>
        </div>

        {/* Car Details */}
        <div className="space-y-6">
          <dl>
            {previewItems.map((item, index) => (
              <div key={item.label} className={`${
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
              } px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {item.value || 'Not specified'}
                </dd>
              </div>
            ))}
            
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Description
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {formData.description || 'No description provided'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Images Preview */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Images ({existingImages.length - imagesToDelete.length + newImages.length})
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {/* Existing Images */}
            {existingImages
              .filter(img => !imagesToDelete.includes(img.id))
              .map((image) => (
                <div key={image.id} className="relative aspect-square group">
                  <img
                    src={image.url}
                    alt="Car"
                    className="object-cover rounded-lg w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg" />
                </div>
              ))}
            
            {/* New Images */}
            {newImages.map((file, index) => (
              <div key={index} className="relative aspect-square group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New ${index + 1}`}
                  className="object-cover rounded-lg w-full h-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className="mt-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="confirm"
                name="confirm"
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="focus:ring-qatar-maroon h-4 w-4 text-qatar-maroon border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="confirm" className="font-medium text-gray-700 dark:text-gray-200">
                I confirm that all the information provided is accurate
              </label>
              <p className="text-gray-500 dark:text-gray-400">
                By checking this box, you confirm that all the details and images you've provided are accurate and belong to the vehicle you're listing.
              </p>
            </div>
          </div>
        </div>

        {/* Status Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
              Your listing will be reviewed by our team before being published. This process usually takes less than 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const validateStep = () => {
    switch (currentStep) {
      case 'step1':
        return formData.brand && formData.model && formData.year && formData.price;
      case 'step2':
        return (
          formData.mileage &&
          formData.fuel_type &&
          formData.gearbox_type &&
          formData.body_type &&
          formData.condition &&
          formData.location
        );
      case 'step3':
        const totalImages = existingImages.length - imagesToDelete.length + newImages.length;
        return totalImages > 0 && totalImages <= 10;
      case 'step4':
        return isConfirmed;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'plan-selection' && selectedPlan) {
      setCurrentStep('step1');
    } else if (currentStep === 'step1') {
      setCurrentStep('step2');
    } else if (currentStep === 'step2') {
      setCurrentStep('step3');
    } else if (currentStep === 'step3') {
      setCurrentStep('step4');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => {
      if (prev === 'step1') {
        return 'plan-selection';
      } else if (prev === 'step2') {
        return 'step1';
      } else if (prev === 'step3') {
        return 'step2';
      } else if (prev === 'step4') {
        return 'step3';
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    
    if (!isConfirmed) {
      toast.error('Please confirm that all the information is accurate');
      return;
    }

    if (!user) {
      toast.error('Please log in to submit a listing');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Preparing car data...');
      // Prepare the car data with correct field names
      const carSubmitData = {
        brand_id: parseInt(formData.brand),
        model_id: parseInt(formData.model),
        year: parseInt(formData.year),
        price: parseInt(formData.price.replace(/[^0-9]/g, '')),
        mileage: parseInt(formData.mileage),
        fuel_type: formData.fuel_type,
        gearbox_type: formData.gearbox_type,
        body_type: formData.body_type,
        condition: formData.condition,
        color: formData.color,
        cylinders: formData.cylinders || null,
        location: formData.location,
        description: formData.description,
        user_id: user.id,
        status: 'Pending'
      };

      console.log('Submitting car data:', carSubmitData);

      // Insert the car data
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert([carSubmitData])
        .select()
        .single();

      if (carError) {
        console.error('Error inserting car data:', carError);
        throw carError;
      }

      console.log('Car data inserted successfully:', carData);

      // Handle image uploads
      if (newImages.length > 0) {
        console.log('Starting image uploads...');
        for (const file of newImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${carData.id}/${fileName}`;

          console.log('Uploading image:', filePath);

          const { error: uploadError } = await supabase.storage
            .from('car-images')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
          }

          const { data: imageData } = await supabase.storage
            .from('car-images')
            .getPublicUrl(filePath);

          console.log('Image uploaded, getting public URL:', imageData);

          // Insert image record
          const { error: imageInsertError } = await supabase
            .from('car_images')
            .insert([{
              car_id: carData.id,
              url: imageData.publicUrl,
            }]);

          if (imageInsertError) {
            console.error('Error inserting image record:', imageInsertError);
            throw imageInsertError;
          }
        }
      }

      setIsSubmitted(true);
      toast.success('Your car listing has been submitted for review!');
      
      // Redirect to the listings page after successful submission
      router.push('/cars');
    } catch (error: any) {
      console.error('Error in form submission:', error);
      setError(error.message || 'Failed to submit listing');
      toast.error(error.message || 'Failed to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      const numericValue = value.replace(/[^0-9]/g, '');
      const formattedValue = new Intl.NumberFormat().format(parseInt(numericValue) || 0);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length - imagesToDelete.length + newImages.length + files.length;
    
    if (totalImages > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files');
        return;
      }

      // Increased max size to 10MB per image
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Each image must be less than 10MB');
        return;
      }
    }

    setNewImages(prev => [...prev, ...files]);
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setImagesToDelete(prev => [...prev, imageId]);
    toast.success('Image marked for deletion');
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Please log in to sell your car
        </h2>
        <button
          onClick={() => router.push('/login')}
          className="inline-block bg-qatar-maroon text-white px-6 py-3 rounded-md font-semibold hover:bg-qatar-maroon/90 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">
                  Listing Submitted Successfully!
                </h3>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your car listing has been submitted and is now under review.
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Our team will review your listing within 24 hours.
                  </p>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        Your listing will be reviewed by our team before being published.
                        This process usually takes less than 24 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Link
                      href="/my-ads"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                    >
                      View My Listings
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                    >
                      Return Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'plan-selection') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-qatar-maroon to-qatar-maroon/90 py-16 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg 
              className="h-full w-full"
              width="404"
              height="404"
              fill="none"
              viewBox="0 0 404 404"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="pattern-squares"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    x="0"
                    y="0"
                    width="4"
                    height="4"
                    className="text-white/20" 
                    fill="currentColor" 
                  />
                </pattern>
              </defs>
              <rect width="404" height="404" fill="url(#pattern-squares)" />
            </svg>
          </div>

          {/* Content Container */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Animated Title */}
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl animate-fade-in-up">
                Choose Your Listing Plan
              </h1>

              {/* Subheading with Highlights */}
              <p className="mt-5 max-w-xl mx-auto text-xl text-white/80 leading-relaxed">
                Maximize your car's visibility with our flexible listing options. 
                <span className="block text-white font-semibold mt-2">
                  Free Basic Listing or Premium Featured Listing
                </span>
              </p>

              {/* Quick Benefits */}
              <div className="mt-8 max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition">
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="h-6 w-6 mx-auto text-white mb-2" 
                  />
                  <span className="text-xs text-white">Maximum Reach</span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition">
                  <FontAwesomeIcon 
                    icon={faCamera} 
                    className="h-6 w-6 mx-auto text-white mb-2" 
                  />
                  <span className="text-xs text-white">Multiple Photos</span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition">
                  <FontAwesomeIcon 
                    icon={faChartLine} 
                    className="h-6 w-6 mx-auto text-white mb-2" 
                  />
                  <span className="text-xs text-white">More Insights</span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition">
                  <FontAwesomeIcon 
                    icon={faHeadset} 
                    className="h-6 w-6 mx-auto text-white mb-2" 
                  />
                  <span className="text-xs text-white">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <svg 
              preserveAspectRatio="none" 
              viewBox="0 0 1440 74" 
              className="w-full text-gray-50 dark:text-gray-900"
            >
              <path 
                d="M0 0C240 30 480 45 720 45C960 45 1200 30 1440 0V74H0V0Z" 
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
              {/* Free Plan */}
              <div className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
                selectedPlan === 'free' 
                  ? 'border-2 border-qatar-maroon' 
                  : 'border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">
                    Free Listing
                  </h2>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
                    Perfect for selling your car with basic features
                  </p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">FREE</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('free')}
                    className={`mt-8 block w-full py-2 px-3 text-sm font-semibold rounded-md text-center border-2 transition-all duration-300 ${
                      selectedPlan === 'free'
                        ? 'bg-qatar-maroon text-white border-qatar-maroon hover:bg-qatar-maroon/90'
                        : 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon/50 hover:bg-qatar-maroon/20 hover:border-qatar-maroon'
                    }`}
                  >
                    Select Free
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">
                    What's included
                  </h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {features.free.map((feature) => (
                      <li key={feature} className="flex space-x-3">
                        <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                        <span className="text-sm text-gray-500 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Featured Plan */}
              <div className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
                selectedPlan === 'featured' 
                  ? 'border-2 border-qatar-maroon' 
                  : 'border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">
                    Featured Listing
                  </h2>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
                    Maximum visibility and premium features
                  </p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">19 QAR</span>
                    <span className="text-base font-medium text-gray-500 dark:text-gray-300">/listing</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('featured')}
                    className={`mt-8 block w-full py-2 px-3 text-sm font-semibold rounded-md text-center border-2 transition-all duration-300 ${
                      selectedPlan === 'featured'
                        ? 'bg-qatar-maroon text-white border-qatar-maroon hover:bg-qatar-maroon/90'
                        : 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon/50 hover:bg-qatar-maroon/20 hover:border-qatar-maroon'
                    }`}
                  >
                    Select Featured
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">
                    What's included
                  </h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {features.featured.map((feature) => (
                      <li key={feature} className="flex space-x-3">
                        <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                        <span className="text-sm text-gray-500 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleNext}
                disabled={!selectedPlan}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon`}
              >
                {selectedPlan 
                  ? `Continue with ${selectedPlan === 'free' ? 'Free' : 'Featured'} Listing`
                  : 'Select a Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Car Listing' : 'Sell Your Car'}
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Fill in the details below to list your car for sale
          </p>
        </div>

        {/* Progress Steps */}
        <div className="relative mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
              
              {/* Active Progress Bar */}
              <div 
                className="absolute top-4 left-0 h-1 bg-qatar-maroon rounded-full transition-all duration-500 ease-in-out"
                style={{ 
                  width: `${((['plan-selection', 'step1', 'step2', 'step3', 'step4'].indexOf(currentStep)) / 4) * 100}%`,
                  boxShadow: '0 0 10px rgba(158, 27, 52, 0.3)' 
                }}
              />

              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div 
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center mb-2
                        ${currentStep === step.id 
                          ? 'bg-qatar-maroon text-white' 
                          : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                        }
                      `}
                    >
                      {step.id === 'plan-selection' ? 'P' : step.id.replace('step', '')}
                    </div>

                    {/* Step Label */}
                    <span className={`
                      text-sm font-medium mb-1
                      ${currentStep === step.id 
                        ? 'text-qatar-maroon' 
                        : currentStep > step.id
                          ? 'text-qatar-maroon'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      {step.name}
                    </span>

                    {/* Step Description */}
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[120px]">
                      {step.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8">
              {/* Form Content */}
              <div className="space-y-8">
                {currentStep === 'step1' && renderBasicInfo()}
                {currentStep === 'step2' && renderCarDetails()}
                {currentStep === 'step3' && renderImageUpload()}
                {currentStep === 'step4' && renderPreview()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`px-6 py-2 text-sm font-medium rounded-md border-2 border-qatar-maroon/50 text-qatar-maroon hover:bg-qatar-maroon/10 hover:border-qatar-maroon transition-all duration-300 ${
                    currentStep === 'plan-selection' ? 'hidden' : ''
                  }`}
                >
                  Previous
                </button>

                {currentStep !== 'step4' ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 text-sm font-medium bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90 transition-colors duration-300"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !isConfirmed}
                    className={`
                      px-6 py-2 rounded-md text-sm font-medium transition-all duration-300
                      ${isSubmitting || !isConfirmed
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-qatar-maroon text-white hover:bg-qatar-maroon/90 shadow-lg hover:shadow-qatar-maroon/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon'
                      }
                    `}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </div>
                    ) : 'Submit Listing'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  carId: number;
  currentImageUrl: string | null;
  onImageUploaded: (url: string) => void;
}

async function uploadCarImage(file: File, carId: number, isMain: boolean = false) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${carId}/${Date.now()}.${fileExt}`;

  const { data, error: uploadError } = await supabase.storage
    .from('car-images')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const { data: { publicUrl } } = await supabase.storage
    .from('car-images')
    .getPublicUrl(filePath);

  // Insert into car_images table with is_main flag
  const { error: insertError } = await supabase
    .from('car_images')
    .insert({
      car_id: carId,
      url: publicUrl,
      is_main: isMain
    });

  if (insertError) {
    throw insertError;
  }

  return publicUrl;
}

export default function ImageUpload({ carId, currentImageUrl, onImageUploaded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      setUploading(true);
      setError(null);

      // Check if this is the first image
      const { data: currentImages } = await supabase
        .from('car_images')
        .select('id')
        .eq('car_id', carId);

      const isFirstImage = !currentImages || currentImages.length === 0;

      // Upload the image with appropriate main flag
      const url = await uploadCarImage(file, carId, isFirstImage);
      onImageUploaded(url);

    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="cursor-pointer inline-block">
        <div className="relative w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-qatar-maroon transition-colors">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt="Current image"
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            disabled={uploading}
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </label>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

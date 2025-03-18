import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ImageUploadProps {
  maxFiles?: number;
  initialImages?: string[];
  onUpload: (urls: string[]) => void;
}

export default function ImageUpload({ maxFiles = 5, initialImages = [], onUpload }: ImageUploadProps) {
  const { supabase } = useSupabase();
  const { t } = useLanguage();
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedImages.length + acceptedFiles.length > maxFiles) {
      toast.error(t('upload.maxFiles', { count: maxFiles }));
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      onUpload(updatedImages);
      toast.success(t('upload.success'));
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(t('upload.error'));
    } finally {
      setUploading(false);
    }
  }, [uploadedImages, maxFiles, supabase, t, onUpload]);

  const removeImage = (indexToRemove: number) => {
    const updatedImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(updatedImages);
    onUpload(updatedImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    disabled: uploading || uploadedImages.length >= maxFiles
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-qatar-maroon bg-qatar-maroon/10' : 'border-gray-300 dark:border-gray-600'}
          ${uploading || uploadedImages.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'hover:border-qatar-maroon hover:bg-qatar-maroon/5'}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('upload.uploading')}</p>
        ) : uploadedImages.length >= maxFiles ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('upload.maxReached')}</p>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isDragActive ? t('upload.drop') : t('upload.dragDrop')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('upload.formats')}
            </p>
          </div>
        )}
      </div>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {uploadedImages.map((url, index) => (
            <div key={url} className="relative group aspect-w-16 aspect-h-9">
              <Image
                src={url}
                alt={`Uploaded image ${index + 1}`}
                fill
                className="rounded-lg object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

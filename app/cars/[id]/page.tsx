'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { HeartIcon } from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  ShareIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  TagIcon,
  KeyIcon,
  BeakerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import type { ExtendedCar, Country, City, Comment } from '../../../types/supabase';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useCountry } from '../../../contexts/CountryContext';
import toast from 'react-hot-toast';

export default function CarDetailsPage({ params: propParams }: { params?: { id: string } } = {}) {
  const params = useParams();
  const router = useRouter();
  const carId = propParams?.id || params.id;
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { trackCarView, trackContactSeller } = useAnalytics();
  const { formatPrice, countries, currentCountry } = useCountry();
  const [car, setCar] = useState<ExtendedCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullImageIndex, setFullImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [similarCars, setSimilarCars] = useState<ExtendedCar[]>([]);
  const [featuredSimilarCars, setFeaturedSimilarCars] = useState<ExtendedCar[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [carCountry, setCarCountry] = useState<Country | null>(null);
  const [carCity, setCarCity] = useState<City | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<CommentWithReplies | null>(null);
  const [editingComment, setEditingComment] = useState<CommentWithReplies | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  interface CommentWithReplies extends Omit<Comment, 'parent_id'> {
    id: number;
    car_id: number;
    user_id: string;
    parent_id: number | null;
    content: string;
    created_at: string;
    user: {
      id: string;
      full_name: string;
      email: string;
      phone_number: string;
    };
    replies?: CommentWithReplies[];
  }

  const handlePrevImage = () => {
    if (!car?.images) return;
    if (showFullImage) {
      setFullImageIndex((prev) => 
        prev === 0 ? car.images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === 0 ? car.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (!car?.images) return;
    if (showFullImage) {
      setFullImageIndex((prev) => 
        prev === car.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === car.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const openFullImage = (index: number) => {
    setFullImageIndex(index);
    setShowFullImage(true);
  };

  const closeFullImage = () => {
    setShowFullImage(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showFullImage) return;
      
      if (e.key === 'Escape') {
        closeFullImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showFullImage]);

  useEffect(() => {
    if (user && car) {
      const isOwner = user.id === car.user_id;
    }
  }, [user, car]);

  const toggleFullImage = () => {
    setShowFullImage(!showFullImage);
  };

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands(id, name, name_ar),
            model:models(id, name, name_ar),
            user:profiles(full_name, email, phone_number),
            images:car_images(url, is_main),
            country:countries(id, name, name_ar, code, currency_code),
            city:cities(id, name, name_ar)
          `)
          .eq('id', carId)
          .single();

        if (carError) throw carError;

        if (carData && carData.images) {
          carData.images.sort((a, b) => {
            if (a.is_main && !b.is_main) return -1;
            if (!a.is_main && b.is_main) return 1;
            return 0;
          });
        }

        setCar(carData);
        setCarCountry(carData.country || null);
        setCarCity(carData.city || null);

        // Check if the car is in user's favorites
        if (user) {
          const { data: favorites, error: favoriteError } = await supabase
            .from('favorites')
            .select('*')
            .eq('car_id', carId)
            .eq('user_id', user.id);

          if (favoriteError) throw favoriteError;
          setIsFavorite(favorites && favorites.length > 0);
        }

        setError(null);
      } catch (error: any) {
        console.error('Error fetching car details:', error);
        setError(error.message || 'Unable to load car details.');
      } finally {
        setLoading(false);
      }
    };

    if (carId) {
      fetchCarDetails();
    }
  }, [carId, user]);

  useEffect(() => {
    if (car) {
      trackCarView(car.id.toString(), car.name || '');
    }
  }, [car]);

  useEffect(() => {
    const fetchSimilarCars = async () => {
      if (!car) return;

      try {
        // Fetch featured similar cars from the same country
        const { data: featuredData, error: featuredError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands!inner(id, name, name_ar),
            model:models!inner(id, name, name_ar),
            user:profiles!inner(full_name, email, phone_number),
            images:car_images(url)
          `)
          .eq('brand_id', car.brand_id)
          .eq('country_id', car.country?.id) // Filter by the same country
          .neq('id', car.id)
          .eq('status', 'Approved')
          .eq('is_featured', true)
          .limit(4);

        if (featuredError) {
          console.error('Error fetching featured similar cars:', featuredError);
        }

        // Fetch normal similar cars from the same country
        const { data: normalData, error: normalError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands!inner(id, name, name_ar),
            model:models!inner(id, name, name_ar),
            user:profiles!inner(full_name, email, phone_number),
            images:car_images(url)
          `)
          .eq('brand_id', car.brand_id)
          .eq('country_id', car.country?.id) // Filter by the same country
          .neq('id', car.id)
          .eq('status', 'Approved')
          .eq('is_featured', false)
          .limit(4);

        if (normalError) {
          console.error('Error fetching normal similar cars:', normalError);
          return;
        }

        if (featuredData) {
          const processedFeaturedCars = featuredData.map(carData => ({
            ...carData,
            images: carData.images?.map(img => img.url) || [],
            brand: carData.brand,
            model: carData.model,
            user: carData.user
          }));
          setFeaturedSimilarCars(processedFeaturedCars);
        }

        if (normalData) {
          const processedNormalCars = normalData.map(carData => ({
            ...carData,
            images: carData.images?.map(img => img.url) || [],
            brand: carData.brand,
            model: carData.model,
            user: carData.user
          }));
          setSimilarCars(processedNormalCars);
        }
      } catch (err) {
        console.error('Error in fetchSimilarCars:', err);
      }
    };

    if (car) {
      fetchSimilarCars();
    }
  }, [car]);

  const fetchComments = async () => {
    try {
      const { data: allComments, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            email,
            phone_number
          )
        `)
        .eq('car_id', carId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organize comments into a hierarchy
      const parentComments: CommentWithReplies[] = [];
      const replyComments = new Map<number, CommentWithReplies[]>();

      // First, separate parent comments and replies
      allComments.forEach(comment => {
        if (comment.parent_id) {
          if (!replyComments.has(comment.parent_id)) {
            replyComments.set(comment.parent_id, []);
          }
          replyComments.get(comment.parent_id)?.push(comment);
        } else {
          parentComments.push({ ...comment, replies: [] });
        }
      });

      // Then, attach replies to their parent comments
      parentComments.forEach(comment => {
        comment.replies = replyComments.get(comment.id) || [];
        // Sort replies by created_at
        comment.replies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setComments(parentComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    if (carId) {
      fetchComments();
    }
  }, [carId]);

  const handleFavoriteClick = async () => {
    if (!user || !car || isUpdatingFavorite) return;

    setIsUpdatingFavorite(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', car.id);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, car_id: car.id }]);

        if (error) throw error;
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${car?.brand.name} ${car?.model.name}${car?.exact_model ? ` - ${car?.exact_model}` : ''} (${car?.year})`,
        text: t('car.details.share.title', { 
          year: car?.year,
          brand: car?.brand.name,
          model: `${car?.model.name}${car?.exact_model ? ` - ${car?.exact_model}` : ''}`
        }),
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContactSeller = () => {
    if (car) {
      trackContactSeller(
        (car.id as number).toString(), 
        `${car.brand?.name} ${car.model?.name}`, 
        car.is_dealer ? 'dealer' : 'private', 
        'button'
      );
    }
    setShowContactInfo(true);
  };

  const formatDate = (dateString: string, format: string = 'long') => {
    if (format === 'dd/MM/yyyy') {
      return new Date(dateString).toLocaleDateString('en-QA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    return new Date(dateString).toLocaleDateString('en-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmitReport = async () => {
    if (!reportReason || !car || !user) return;

    setIsSubmittingReport(true);
    try {
      const { error } = await supabase
        .from('car_reports')
        .insert([{ 
          car_id: parseInt(carId as string), // Convert string ID to integer
          user_id: user.id,
          reason: reportReason, 
          description: reportDescription,
          status: 'Pending',
          country_code: carCountry?.code || currentCountry?.code || 'QA' // Include country code for filtering reports by country
        }]);

      if (error) throw error;

      setReportSubmitted(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      setReportError(true);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleReply = (comment: CommentWithReplies) => {
    setReplyTo(comment);
    // Focus the comment input and scroll it into view
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
      commentInput.focus();
      commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert([
          {
            car_id: Number(carId),
            user_id: user.id,
            content: newComment.trim(),
            parent_id: replyTo?.id || null,
          }
        ])
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            email,
            phone_number
          )
        `)
        .single();

      if (error) throw error;

      // Update comments state based on whether it's a reply or new comment
      if (replyTo) {
        setComments(prevComments => 
          prevComments.map(parentComment => {
            if (parentComment.id === replyTo.id) {
              return {
                ...parentComment,
                replies: [...(parentComment.replies || []), comment].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
              };
            }
            return parentComment;
          })
        );
      } else {
        setComments(prevComments => [{
          ...comment,
          replies: []
        }, ...prevComments]);
      }

      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = (comment: CommentWithReplies) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !editContent.trim()) return;

    setIsSubmittingEdit(true);
    try {
      const { data: updatedComment, error } = await supabase
        .from('comments')
        .update({ content: editContent.trim() })
        .eq('id', editingComment.id)
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            email,
            phone_number
          )
        `)
        .single();

      if (error) throw error;

      // Update comments state
      if (editingComment.parent_id) {
        setComments(prevComments => 
          prevComments.map(parentComment => {
            if (parentComment.id === editingComment.parent_id) {
              return {
                ...parentComment,
                replies: parentComment.replies?.map(reply =>
                  reply.id === editingComment.id ? updatedComment : reply
                ) || []
              };
            }
            return parentComment;
          })
        );
      } else {
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === editingComment.id
              ? { ...updatedComment, replies: comment.replies }
              : comment
          )
        );
      }

      setEditingComment(null);
      setEditContent('');
      toast.success(t('car.details.commentUpdated'));
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteComment = async (comment: CommentWithReplies) => {
    if (!window.confirm(t('car.details.deleteConfirm'))) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;

      // Update comments state
      if (comment.parent_id) {
        setComments(prevComments => 
          prevComments.map(parentComment => {
            if (parentComment.id === comment.parent_id) {
              return {
                ...parentComment,
                replies: parentComment.replies?.filter(reply => reply.id !== comment.id) || []
              };
            }
            return parentComment;
          })
        );
      } else {
        setComments(prevComments =>
          prevComments.filter(c => c.id !== comment.id)
        );
      }

      toast.success(t('car.details.commentDeleted'));
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Car not found'}
          </h2>
          <button
            onClick={() => router.push('/cars')}
            className="text-qatar-maroon hover:text-qatar-maroon/80"
          >
            {t('car.details.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-6 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li><button onClick={() => router.push('/cars')} className="hover:text-qatar-maroon">{t('car.details.cars')}</button></li>
            <li>/</li>
            <li><button onClick={() => router.push(`/cars?brand=${car?.brand.name}`)} className="hover:text-qatar-maroon">{car?.brand.name}</button></li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">{car?.model.name}{car?.exact_model ? ` - ${car?.exact_model}` : ''}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image Section */}
            <div className="relative w-full h-96 mb-4">
              <img
                src={car.images[currentImageIndex]?.url}
                alt={`${car.brand?.name} ${car.model?.name}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => openFullImage(currentImageIndex)}
              />
              {car.is_featured && (
                <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-qatar-maroon/90 text-white text-xs font-medium rounded-lg shadow-lg">
                  {t('cars.featured.badge')}
                </div>
              )}
              {(car?.images?.length || 0) > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Grid */}
            {car.images && car.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4 mb-8">
                {car.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={`${car.brand?.name} ${car.model?.name} thumbnail ${index + 1}`}
                    className={`w-full aspect-[4/3] object-cover rounded-lg cursor-pointer ${
                      currentImageIndex === index ? 'ring-2 ring-qatar-maroon' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}

            {/* Full Screen Image Viewer */}
            {showFullImage && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Close Button */}
                  <button
                    onClick={closeFullImage}
                    className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Navigation Buttons */}
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeftIcon className="h-8 w-8" />
                  </button>

                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRightIcon className="h-8 w-8" />
                  </button>

                  {/* Main Image */}
                  <img
                    src={car.images[fullImageIndex]?.url}
                    alt={`${car.brand?.name} ${car.model?.name}`}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                  />

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                    {fullImageIndex + 1} / {car.images.length}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="space-y-6">
            {/* Header with Title, Price, and Actions */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {currentLanguage === 'ar' && car.brand?.name_ar ? car.brand.name_ar : car.brand.name} {currentLanguage === 'ar' && car.model?.name_ar ? car.model.name_ar : car.model.name}{car.exact_model ? ` - ${car.exact_model}` : ''} {car.year}
                </h1>
                <div className="mt-2 flex items-center space-x-4 rtl:space-x-reverse mb-4">
                  <p className="text-2xl font-bold text-qatar-maroon" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                    {car.price.toLocaleString('en-US')}
                    {' '}
                    {t(`common.currency.${carCountry?.currency_code || 'QAR'}`)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={handleFavoriteClick}
                  disabled={isUpdatingFavorite}
                  className={`p-2 rounded-full ${
                    isFavorite ? 'text-qatar-maroon' : 'text-gray-400 hover:text-qatar-maroon'
                  }`}
                >
                  {isFavorite ? (
                    <HeartIconSolid className="h-6 w-6" />
                  ) : (
                    <HeartIcon className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full text-gray-400 hover:text-qatar-maroon"
                >
                  <ShareIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2 rounded-full text-gray-400 hover:text-qatar-maroon"
                >
                  <FlagIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Owner Info */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse py-3 px-4 bg-gray-200/50 dark:bg-gray-800  rounded-lg">
              <div className="w-12 h-12 bg-qatar-maroon/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-gray-900 dark:text-white">{car.user.full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {car.is_dealer ? t('car.details.dealer') : t('car.details.privateSeller')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('car.details.listed')} {formatDate(car.created_at, 'dd/MM/yyyy')}
                </p>
              </div>
              <div className="ml-auto">
                {car.user.phone_number && (
                  <a
                    href={`tel:${car.user.phone_number}`}
                    className="flex items-center space-x-2 text-qatar-maroon hover:text-qatar-maroon/80"
                    dir="ltr"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    <span className="font-ltr" style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{car.user.phone_number.replace(/^(\+\d{1,3})(\d+)/, '$1-$2')}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Mileage */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <BeakerIcon className="h-5 w-5 text-qatar-maroon" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('cars.mileage.label')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {car.mileage.toLocaleString()} {t('cars.mileage.unit')}</p>
              </div>

              {/* Transmission */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <KeyIcon className="h-5 w-5 text-qatar-maroon" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('cars.gearboxType.label')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {t(`cars.transmission.${car.gearbox_type.toLowerCase()}`)}
                </p>
              </div>

              {/* Fuel Type */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <BeakerIcon className="h-5 w-5 text-qatar-maroon" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('cars.fuelType.label')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {t(`cars.fuelType.${car.fuel_type.toLowerCase()}`)}
                </p>
              </div>

              {/* Condition */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.828 10H7v2H5v2H0v-2a2 2 0 012-2h14a2 2 0 012 2v2h-3v2h1.828a2 2 0 01.073 1.054l-2 6a2 2 0 01-.889.938l-3 1a2 2 0 01-2.828 0l-3-1a2 2 0 01-.889-.938l-2-6a2 2 0 010-2.828l2-6a2 2 0 012.828 0l2 6a2 2 0 01.073 1.054z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.condition')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {t(`cars.condition.${car.condition?.toLowerCase().replace(' ', '_')}`)}
                </p>
              </div>

              {/* Color */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.color')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{t(`cars.colors.${car.color.toLowerCase()}`)}</p>
              </div>

              {/* Body Type */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17h14M5 12h14m-7-4V3m0 18v-5" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.bodyType')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{t(`cars.bodyType.${car.body_type.toLowerCase()}`)}</p>
              </div>

              {/* Cylinders */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.cylinders')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{car.cylinders}</p>
              </div>

              {/* Location */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('car.details.location')}</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {carCity 
                    ? (currentLanguage === 'ar' && carCity.name_ar ? carCity.name_ar : carCity.name)
                    : (car?.location ? car.location : t('common.notSpecified'))}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('car.details.description')}</h2>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {car.description || t('car.details.noDescription')}
              </p>
            </div>

            {/* Comments */}
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('car.details.comments')}</h2>
              <div className="space-y-4">
                {user ? (
                  <form onSubmit={handleSubmitComment} className="space-y-4">
                    {replyTo && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {t('car.details.replyingTo')} {replyTo.user.full_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    <div>
                      <textarea
                        id="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? t('car.details.writeReply') : t('car.details.writeComment')}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="px-6 py-2 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 transition-colors flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50"
                      >
                        {isSubmittingComment && (
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {replyTo ? t('car.details.postReply') : t('car.details.postComment')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{t('car.details.loginToComment')}</p>
                    <button
                      onClick={() => router.push('/login')}
                      className="text-qatar-maroon hover:text-qatar-maroon/80"
                    >
                      {t('common.login')}
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    {/* Parent Comment */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-8 h-8 bg-qatar-maroon/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-qatar-maroon">
                              {comment.user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{comment.user.full_name}</div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-QA' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        {user && (
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {user.id === comment.user_id && (
                              <>
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="text-sm text-gray-500 hover:text-qatar-maroon flex items-center space-x-1 rtl:space-x-reverse"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>{t('car.details.editComment')}</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment)}
                                  className="text-sm text-gray-500 hover:text-red-600 flex items-center space-x-1 rtl:space-x-reverse"
                                  disabled={isDeleting}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>{t('car.details.deleteComment')}</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleReply(comment)}
                              className="text-sm text-qatar-maroon hover:text-qatar-maroon/80 flex items-center space-x-1 rtl:space-x-reverse"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              <span>{t('car.details.reply')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                      {editingComment?.id === comment.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-qatar-maroon focus:border-qatar-maroon bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {t('car.details.cancelEdit')}
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSubmittingEdit}
                              className="px-3 py-1 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 text-sm flex items-center space-x-1 rtl:space-x-reverse disabled:opacity-50"
                            >
                              {isSubmittingEdit && (
                                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {t('car.details.saveEdit')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 mt-2">{comment.content}</p>
                      )}
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        {comment.replies.map((reply) => (
                          <div 
                            key={reply.id} 
                            className="p-4 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-qatar-maroon/20 mr-0 ml-8 rtl:ml-0 rtl:mr-8 relative before:absolute before:top-0 before:h-full before:w-px before:bg-qatar-maroon/10 before:right-auto before:left-[-2px] rtl:before:right-[-2px] rtl:before:left-auto"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <div className="w-8 h-8 bg-qatar-maroon/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-qatar-maroon">
                                    {reply.user.full_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{reply.user.full_name}</div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(reply.created_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-QA' : 'en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              {user && (
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  {user.id === reply.user_id && (
                                    <>
                                      <button
                                        onClick={() => handleEditComment(reply)}
                                        className="text-sm text-gray-500 hover:text-qatar-maroon flex items-center space-x-1 rtl:space-x-reverse"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span>{t('car.details.editComment')}</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(reply)}
                                        className="text-sm text-gray-500 hover:text-red-600 flex items-center space-x-1 rtl:space-x-reverse"
                                        disabled={isDeleting}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>{t('car.details.deleteComment')}</span>
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleReply(reply)}
                                    className="text-sm text-qatar-maroon hover:text-qatar-maroon/80 flex items-center space-x-1 rtl:space-x-reverse"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    <span>{t('car.details.reply')}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            {editingComment?.id === reply.id ? (
                              <div className="mt-2">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-qatar-maroon focus:border-qatar-maroon bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  rows={3}
                                />
                                <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-2">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    {t('car.details.cancelEdit')}
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={isSubmittingEdit}
                                    className="px-3 py-1 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 text-sm flex items-center space-x-1 rtl:space-x-reverse disabled:opacity-50"
                                  >
                                    {isSubmittingEdit && (
                                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    )}
                                    {t('car.details.saveEdit')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-700 dark:text-gray-300 mt-2">{reply.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Cars */}
        {(featuredSimilarCars.length > 0 || similarCars.length > 0) && (
          <div className="mt-16">
            {/* Featured Similar Cars */}
            {featuredSimilarCars.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('cars.featured.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredSimilarCars.map((similarCar) => (
                    <div
                      key={similarCar.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
                    >
                      {/* Featured Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-qatar-maroon text-white text-xs font-medium px-2.5 py-1 rounded">
                          {t('cars.featured.badge')}
                        </span>
                      </div>
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={similarCar.images && similarCar.images.length > 0 ? 
                            (typeof similarCar.images[0] === 'string' ? similarCar.images[0] : similarCar.images[0].url) 
                            : '/placeholder-car.svg'}
                          alt={`${similarCar.brand.name} ${similarCar.model.name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {currentLanguage === 'ar' && similarCar.brand?.name_ar ? similarCar.brand.name_ar : similarCar.brand.name} {currentLanguage === 'ar' && similarCar.model?.name_ar ? similarCar.model.name_ar : similarCar.model.name} {similarCar.year}
                        </h3>
                        <p className="text-qatar-maroon font-bold mt-1">
                          {similarCar.price.toLocaleString('en-US')}
                          {' '}
                          {t(`common.currency.${similarCar.country?.currency_code || 'QAR'}`)}
                        </p>
                        <button
                          onClick={() => router.push(`/cars/${similarCar.id}`)}
                          className="mt-3 w-full py-2 bg-qatar-maroon/10 text-qatar-maroon rounded hover:bg-qatar-maroon/20 transition-colors"
                        >
                          {t('car.details.viewDetails')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Normal Similar Cars */}
            {similarCars.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('car.details.similarCars')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {similarCars.map((similarCar) => (
                    <div
                      key={similarCar.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={similarCar.images && similarCar.images.length > 0 ? 
                            (typeof similarCar.images[0] === 'string' ? similarCar.images[0] : similarCar.images[0].url) 
                            : '/placeholder-car.svg'}
                          alt={`${similarCar.brand.name} ${similarCar.model.name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {currentLanguage === 'ar' && similarCar.brand?.name_ar ? similarCar.brand.name_ar : similarCar.brand.name} {currentLanguage === 'ar' && similarCar.model?.name_ar ? similarCar.model.name_ar : similarCar.model.name} {similarCar.year}
                        </h3>
                        <p className="text-qatar-maroon font-bold mt-1">
                          {similarCar.price.toLocaleString('en-US')}
                          {' '}
                          {t(`common.currency.${similarCar.country?.currency_code || 'QAR'}`)}
                        </p>
                        <button
                          onClick={() => router.push(`/cars/${similarCar.id}`)}
                          className="mt-3 w-full py-2 bg-qatar-maroon/10 text-qatar-maroon rounded hover:bg-qatar-maroon/20 transition-colors"
                        >
                          {t('car.details.viewDetails')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-90" onClick={() => !isSubmittingReport && setShowReportModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <FlagIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {t('car.details.report')}
                    </h3>
                    <div className="mt-4 space-y-4">
                      {reportSubmitted ? (
                        <div className="text-green-600 dark:text-green-400">
                          {t('car.details.reportSuccess')}
                        </div>
                      ) : reportError ? (
                        <div className="text-red-600 dark:text-red-400">
                          {t('car.details.reportError')}
                        </div>
                      ) : (
                        <>
                          <div>
                            <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('car.details.reportReason')}
                            </label>
                            <select
                              id="report-reason"
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              disabled={isSubmittingReport}
                            >
                              <option value="">{t('common.select')}</option>
                              <option value="spam">{t('car.details.reportReasons.spam')}</option>
                              <option value="fraud">{t('car.details.reportReasons.fraud')}</option>
                              <option value="inappropriate">{t('car.details.reportReasons.inappropriate')}</option>
                              <option value="duplicate">{t('car.details.reportReasons.duplicate')}</option>
                              <option value="wrong_info">{t('car.details.reportReasons.wrong_info')}</option>
                              <option value="other">{t('car.details.reportReasons.other')}</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('car.details.reportDescription')}
                            </label>
                            <textarea
                              id="report-description"
                              value={reportDescription}
                              onChange={(e) => setReportDescription(e.target.value)}
                              rows={4}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-qatar-maroon focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              disabled={isSubmittingReport}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {reportSubmitted || reportError ? (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-qatar-maroon text-base font-medium text-white hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowReportModal(false)}
                  >
                    {t('common.close')}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500"
                      onClick={() => setShowReportModal(false)}
                      disabled={isSubmittingReport}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-qatar-maroon text-base font-medium text-white hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleSubmitReport}
                      disabled={!reportReason || isSubmittingReport}
                    >
                      {isSubmittingReport ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : null}
                      {t('car.details.reportSubmit')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

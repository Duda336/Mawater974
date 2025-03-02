'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface DealershipRequest {
  id: number;
  user_id: string;
  business_name: string;
  business_name_ar: string;
  description: string;
  description_ar: string;
  location: string;
  dealership_type: string;
  business_type: string;
  logo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  reviewer_id?: string;
  review_notes?: string;
  reviewed_at?: string;
  userInfo?: {
    full_name: string;
    email: string;
    phone_number: string;
  };
}

export default function DealershipRequestsPage() {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { t, currentLocale } = useLanguage();
  const [requests, setRequests] = useState<DealershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DealershipRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Get user info for the request
  const getUserInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone_number')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  };

  const fetchRequests = async () => {
    try {
      console.log('Fetching dealership requests...');
      
      const { data, error } = await supabase
        .from('dealerships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
      
      console.log('Found requests:', data?.length || 0, data);
      
      // For each request, fetch the user info
      const requestsWithUserInfo = await Promise.all((data || []).map(async (request) => {
        console.log('Fetching user info for:', request.user_id);
        const userInfo = await getUserInfo(request.user_id);
        console.log('User info:', userInfo);
        return {
          ...request,
          userInfo
        };
      }));
      
      setRequests(requestsWithUserInfo);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .rpc('approve_dealership', {
          dealership_id: selectedRequest.id,
          reviewer_id: user?.id,
          notes: reviewNotes
        });
      
      if (error) throw error;
      
      toast.success(t('admin.dealership.approveSuccess'), {
        duration: 5000,
        id: 'approve-toast',
      });
      
      // Refresh the requests list
      fetchRequests();
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(t('admin.dealership.approveError'), {
        duration: 5000,
        id: 'approve-toast',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .rpc('reject_dealership', {
          dealership_id: selectedRequest.id,
          reviewer_id: user?.id,
          notes: reviewNotes
        });
      
      if (error) throw error;
      
      toast.success(t('admin.dealership.rejectSuccess'), {
        duration: 5000,
        id: 'reject-toast',
      });
      
      // Refresh the requests list
      fetchRequests();
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t('admin.dealership.rejectError'), {
        duration: 5000,
        id: 'reject-toast',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('admin.dealership.requests')}</h1>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                {request.logo_url && (
                  <Image
                    src={request.logo_url}
                    alt={request.business_name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {currentLocale === 'ar' ? request.business_name_ar : request.business_name}
                  </h2>
                  <p className="text-gray-600">
                    {request.userInfo?.full_name} ({request.userInfo?.email})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="p-2 text-green-500 hover:text-green-700"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleReject}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                request.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : request.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {t(`admin.dealership.status.${request.status}`)}
              </span>
            </div>

            {/* Removed review_notes */}
          </div>
        ))}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">
                  {currentLocale === 'ar' ? selectedRequest.business_name_ar : selectedRequest.business_name}
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{t('dealership.description')}</h3>
                  <p className="mt-1 text-gray-600">
                    {currentLocale === 'ar' ? selectedRequest.description_ar : selectedRequest.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">{t('dealership.dealershipType')}</h3>
                    <p className="mt-1 text-gray-600">{selectedRequest.dealership_type}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">{t('dealership.businessType')}</h3>
                    <p className="mt-1 text-gray-600">{selectedRequest.business_type}</p>
                  </div>
                </div>

                {/* Brands section removed as brands field is no longer used */}

                {selectedRequest.status === 'pending' && (
                  <div className="mt-4">
                    <h3 className="font-medium">{t('admin.dealership.reviewNotes')}</h3>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      rows={3}
                      placeholder={t('admin.dealership.reviewNotesPlaceholder')}
                    />
                  </div>
                )}

                {selectedRequest.status === 'pending' && (
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleReject}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
                    >
                      {t('admin.dealership.reject')}
                    </button>
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                      {t('admin.dealership.approve')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

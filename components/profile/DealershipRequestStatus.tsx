'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface DealershipRequest {
  id: number;
  business_name: string;
  business_name_ar: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

export default function DealershipRequestStatus({ userId }: { userId: string }) {
  const { supabase } = useSupabase();
  const { t, currentLocale } = useLanguage();
  const [request, setRequest] = useState<DealershipRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, []);

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('dealership_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setRequest(data);
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const statusIcon = {
    pending: <ClockIcon className="h-8 w-8 text-yellow-500" />,
    approved: <CheckCircleIcon className="h-8 w-8 text-green-500" />,
    rejected: <XCircleIcon className="h-8 w-8 text-red-500" />,
  };

  const statusColor = {
    pending: 'bg-yellow-50 border-yellow-200',
    approved: 'bg-green-50 border-green-200',
    rejected: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${statusColor[request.status]}`}>
      <div className="flex items-start space-x-4">
        {statusIcon[request.status]}
        <div className="flex-1">
          <h3 className="font-medium">
            {currentLocale === 'ar' ? request.business_name_ar : request.business_name}
          </h3>
          <p className="text-sm text-gray-500">
            {t(`dealership.status.${request.status}`)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(request.created_at).toLocaleDateString()}
          </p>
          {request.admin_notes && (
            <div className="mt-2 text-sm text-gray-600">
              <p className="font-medium">{t('dealership.adminNotes')}:</p>
              <p>{request.admin_notes}</p>
            </div>
          )}
          {request.status === 'rejected' && (
            <button
              onClick={() => window.location.href = '/showrooms'}
              className="mt-3 text-sm text-primary hover:text-primary/80"
            >
              {t('dealership.tryAgain')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

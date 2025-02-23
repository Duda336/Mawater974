import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

declare global {
  interface Window {
    gtag: (
      command: 'event',
      action: string,
      params: { [key: string]: any }
    ) => void;
  }
}

export const useAnalytics = () => {
  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || uuidv4() : uuidv4();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  const trackEvent = async (
    eventType: string,
    eventData: { [key: string]: any } = {}
  ) => {
    // Track in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventType, eventData);
    }

    // Store in Supabase
    try {
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: eventData,
        user_id: user?.user?.id,
        session_id: sessionId,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const trackCarView = (carId: string, carName: string) => {
    trackEvent('car_view', {
      car_id: carId,
      car_name: carName,
    });
  };

  const trackContactSeller = (carId: string, sellerId: string) => {
    trackEvent('contact_seller', {
      car_id: carId,
      seller_id: sellerId,
    });
  };

  const trackSearch = (searchQuery: string, filters: any) => {
    trackEvent('car_search', {
      search_term: searchQuery,
      filters: JSON.stringify(filters),
    });
  };

  const trackFilterUse = (filterName: string, filterValue: string) => {
    trackEvent('filter_use', {
      filter_name: filterName,
      filter_value: filterValue,
    });
  };

  return {
    trackEvent,
    trackCarView,
    trackContactSeller,
    trackSearch,
    trackFilterUse,
  };
};

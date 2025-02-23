import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseClient';
import { analyticsService } from '../lib/analytics/service';
import { GA_EVENTS, GA_CUSTOM_DIMENSIONS } from '../lib/analytics/config';

export const useAnalytics = () => {
  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || uuidv4() : uuidv4();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionId', sessionId);
      
      // Set initial user properties
      analyticsService.setUserProperties({
        session_id: sessionId,
        [GA_CUSTOM_DIMENSIONS.deviceType]: getDeviceType(),
        [GA_CUSTOM_DIMENSIONS.userLanguage]: localStorage.getItem('language') || 'en',
      });

      // Track session start
      analyticsService.trackEvent(GA_EVENTS.USER_LOGIN, {
        new_session: !localStorage.getItem('sessionId'),
        session_id: sessionId,
      });
    }
  }, [sessionId]);

  const getDeviceType = () => {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const trackPageView = (title?: string) => {
    analyticsService.trackPageView(title, {
      [GA_CUSTOM_DIMENSIONS.deviceType]: getDeviceType(),
      [GA_CUSTOM_DIMENSIONS.userLanguage]: localStorage.getItem('language') || 'en',
    });
  };

  const trackCarView = (carId: string, carName: string, price?: number, category?: string) => {
    analyticsService.trackCarView({
      id: carId,
      name: carName,
      price,
      category: category || 'unknown',
      seller_id: 'unknown', // You should pass the actual seller ID
    });
  };

  const trackContactSeller = (carId: string, sellerId: string, contactMethod: 'phone' | 'whatsapp' | 'email') => {
    analyticsService.trackContactSeller({
      car_id: carId,
      seller_id: sellerId,
      contact_method: contactMethod,
    });
  };

  const trackSearch = (searchQuery: string, filters: any, resultsCount: number) => {
    analyticsService.trackSearch({
      query: searchQuery,
      filters,
      resultCount: resultsCount,
    });
  };

  const trackFilterUse = (filterName: string, filterValue: string) => {
    analyticsService.trackEvent(GA_EVENTS.FILTER_USED, {
      filter_name: filterName,
      filter_value: filterValue,
    });
  };

  const trackUserAction = (actionType: string, actionData: any = {}) => {
    analyticsService.trackUserAction(actionType, actionData);
  };

  const trackError = (errorType: string, errorMessage: string, errorData: any = {}) => {
    analyticsService.trackEvent(GA_EVENTS.FORM_ERROR, {
      error_type: errorType,
      error_message: errorMessage,
      ...errorData,
    });
  };

  const trackSocialShare = (platform: string, contentType: string, contentId: string) => {
    analyticsService.trackEvent(GA_EVENTS.CAR_SHARE, {
      platform,
      content_type: contentType,
      content_id: contentId,
    });
  };

  return {
    trackPageView,
    trackCarView,
    trackContactSeller,
    trackSearch,
    trackFilterUse,
    trackUserAction,
    trackError,
    trackSocialShare,
  };
};

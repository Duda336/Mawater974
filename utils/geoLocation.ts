import { Country } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

// Function to get country from IP using a third-party service
export async function getCountryFromIP(): Promise<string> {
  try {
    // Using ipapi.co for IP geolocation (free tier has limitations)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data && data.country_code) {
      return data.country_code.toLowerCase();
    }
    
    throw new Error('Could not determine country from IP');
  } catch (error) {
    console.error('Error getting country from IP:', error);
    // Default to Qatar if there's an error
    return 'qa';
  }
}

// Function to get country code from user profile
export async function getCountryFromUser(user: User | null, supabase: any): Promise<string | null> {
  if (!user) return null;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('country_id')
      .eq('id', user.id)
      .single();

    if (profile?.country_id) {
      const { data: country } = await supabase
        .from('countries')
        .select('code')
        .eq('id', profile.country_id)
        .single();

      return country?.code?.toLowerCase() || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting country from user profile:', error);
    return null;
  }
}

// Function to validate if a country code exists in our database
export async function isValidCountryCode(countryCode: string, supabase: any): Promise<boolean> {
  try {
    const { data: countryList } = await supabase
      .from('countries')
      .select('code')
      .eq('code', countryCode.toUpperCase());

    return countryList && countryList.length > 0;
  } catch (error) {
    console.error('Error validating country code:', error);
    return false;
  }
}


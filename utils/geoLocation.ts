import { Country } from '@/types/supabase';

// Function to get country from IP using a third-party service
export async function getCountryFromIP(): Promise<string> {
  try {
    // Using ipapi.co for IP geolocation (free tier has limitations)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data && data.country_code) {
      return data.country_code;
    }
    
    throw new Error('Could not determine country from IP');
  } catch (error) {
    console.error('Error getting country from IP:', error);
    // Default to Qatar if there's an error
    return 'QA';
  }
}

// Function to get the user's country from localStorage or IP
export async function getUserCountry(countries: Country[]): Promise<Country | null> {
  // First check localStorage
  const savedCountryId = localStorage.getItem('selectedCountryId');
  
  if (savedCountryId) {
    const country = countries.find(c => c.id === parseInt(savedCountryId));
    if (country) return country;
  }
  
  // If no saved country or not found, use IP
  try {
    const countryCode = await getCountryFromIP();
    const country = countries.find(c => c.code === countryCode);
    
    if (country) {
      // Save to localStorage for future use
      localStorage.setItem('selectedCountryId', country.id.toString());
      return country;
    }
    
    // If country not supported, default to Qatar
    const defaultCountry = countries.find(c => c.code === 'QA');
    if (defaultCountry) {
      localStorage.setItem('selectedCountryId', defaultCountry.id.toString());
      return defaultCountry;
    }
    
    return null;
  } catch (error) {
    console.error('Error in getUserCountry:', error);
    // Default to Qatar if there's an error
    const defaultCountry = countries.find(c => c.code === 'QA');
    if (defaultCountry) {
      localStorage.setItem('selectedCountryId', defaultCountry.id.toString());
      return defaultCountry;
    }
    return null;
  }
}

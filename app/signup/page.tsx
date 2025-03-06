'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import SocialLogin from '../../components/auth/SocialLogin';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import PhoneInput from '../../components/PhoneInput';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SignUp() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+974');
  const { language } = useLanguage();
  const router = useRouter();

  const validateForm = () => {
    if (!fullName.trim()) {
      setError(t('signup.validation.fullName'));
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(t('signup.validation.email'));
      return false;
    }
    if (password.length < 8) {
      setError(t('signup.validation.password'));
      return false;
    }
    if (!phoneNumber) {
      setError(t('signup.phoneRequired'));
      return false;
    }
    if (!selectedCountryId) {
      setError(t('signup.countryRequired'));
      return false;
    }
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Format phone number with country code
      const formattedPhoneNumber = `${selectedCountryCode}${phoneNumber}`;

      // First create the user with minimal data to avoid auth issues
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Include essential metadata in the initial signup
          data: {
            full_name: fullName,
            country_id: selectedCountryId,
            phone_number: formattedPhoneNumber,
            password_plain: password
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        // More specific error handling
        if (signUpError.message.includes('already registered')) {
          setError(t('signup.validation.emailExists'));
        } else if (signUpError.message.includes('Database error')) {
          setError('Database error creating account. Please try again later.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (!data?.user?.id) {
        setError(t('signup.validation.failed'));
        return;
      }

      // Only update additional profile info after successful signup
      try {
        // We'll use RPC for better error handling
        const { error: updateError } = await supabase.rpc('update_user_profile', {
          user_id: data.user.id,
          user_email: email,
          user_full_name: fullName,
          user_phone: formattedPhoneNumber,
          user_password: password, // Still storing for testing only
          user_country_id: selectedCountryId
        });
        
        if (updateError) {
          console.error('Profile update error:', updateError);
          // Don't fail the signup if profile update fails
        }
      } catch (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't fail the signup if profile update fails
      }

      // Show success toast and redirect
      toast.success(t('signup.success'));
      
      // Redirect to country-specific homepage if country is selected
      if (selectedCountryId) {
        // Fetch country code from country_id
        const { data: countryData } = await supabase
          .from('countries')
          .select('code')
          .eq('id', selectedCountryId)
          .single();
        
        if (countryData?.code) {
          // Redirect to country-specific homepage
          const countryCode = countryData.code.toLowerCase();
          router.push(`/${countryCode}`);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('signup.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('signup.haveAccount')}{' '}
            <Link
              href="/login"
              className="font-medium text-qatar-maroon hover:text-qatar-maroon/80 transition-colors duration-200"
            >
              {t('signup.signIn')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-md animate-shake">
              <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.fullName')}
              </label>
              <input
                id="full-name"
                name="full-name"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                placeholder={t('signup.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                placeholder={t('signup.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <PhoneInput
              label={t('signup.phone')}
              value={phoneNumber}
              onChange={setPhoneNumber}
              onCountryChange={(countryId, phoneCode) => {
                setSelectedCountryId(countryId);
                setSelectedCountryCode(phoneCode);
              }}
              required
              placeholder={t('signup.phonePlaceholder')}
            />

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordStrengthIndicator password={password} />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50 transition-all duration-200 transform active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('signup.createAccount')
              )}
            </button>
          </div>
        </form>

        <SocialLogin />
      </div>
    </div>
  );
}

'use server';

import { createClient } from '@/utils/supabase/server';

export async function incrementHomePageView(countryCode: string) {
    if (!countryCode) {
        console.log('No country code provided');
        return;
    }

    try {
        const supabase = createClient();
        console.log('Attempting to increment view for country:', countryCode);

        // Simple insert/update
        const { data, error } = await supabase
            .from('homepage_views')
            .upsert({
                country_code: countryCode.toLowerCase(),
                view_count: 1
            }, {
                onConflict: 'country_code',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Failed to increment view:', error);
            // Try to create the table if it doesn't exist
            if (error.code === '42P01') { // undefined_table error code
                console.log('Table does not exist, attempting to create...');
                await supabase.rpc('create_homepage_views_table');
                // Retry the increment
                const retryResult = await supabase
                    .from('homepage_views')
                    .upsert({
                        country_code: countryCode.toLowerCase(),
                        view_count: 1
                    });
                console.log('Retry result:', retryResult);
            }
        } else {
            console.log('Successfully incremented view for:', countryCode);
        }

        // Verify the current count
        const { data: currentCount, error: countError } = await supabase
            .from('homepage_views')
            .select('view_count')
            .eq('country_code', countryCode.toLowerCase())
            .single();

        if (currentCount) {
            console.log('Current view count for', countryCode, ':', currentCount.view_count);
        }
    } catch (error) {
        console.error('Error in incrementHomePageView:', error);
    }
}

export async function getHomePageStats() {
    try {
        const supabase = createClient();
        console.log('Fetching homepage stats...');
        
        const { data, error } = await supabase
            .from('homepage_views')
            .select('*')
            .order('view_count', { ascending: false });
            
        if (error) {
            console.error('Error fetching stats:', error);
            return [];
        }

        console.log('Homepage stats:', data);
        return data || [];
    } catch (error) {
        console.error('Error in getHomePageStats:', error);
        return [];
    }
}

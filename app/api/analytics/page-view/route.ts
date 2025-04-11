import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { PageType } from '@/lib/analytics/page-views';

export async function POST(request: Request) {
    try {
        const { countryCode, userId, pageType, entityId } = await request.json();
        const userAgent = request.headers.get('user-agent') || '';
        
        if (!countryCode || !pageType) {
            return NextResponse.json({ 
                error: 'Country code and page type are required' 
            }, { status: 400 });
        }

        const supabase = createClient();

        // Get or create session ID from cookies
        const cookieStore = cookies();
        let sessionId = cookieStore.get('view_session_id')?.value;
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            cookieStore.set('view_session_id', sessionId, {
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                path: '/',
                sameSite: 'lax'
            });
        }

        // First try direct insert into page_views
        const { error: insertError } = await supabase
            .from('page_views')
            .upsert({
                country_code: countryCode.toLowerCase(),
                page_type: pageType,
                view_count: 1,
                last_viewed_at: new Date().toISOString()
            }, {
                onConflict: 'country_code,page_type',
                ignoreDuplicates: false
            });

        if (insertError) {
            console.error('Error inserting view:', insertError);
        }

        // Then record the detailed user view
        const { error: viewError } = await supabase
            .from('user_page_views')
            .insert({
                user_id: userId || null,
                session_id: sessionId,
                country_code: countryCode.toLowerCase(),
                page_type: pageType,
                entity_id: entityId,
                page_path: entityId ? `/${pageType}/${entityId}` : `/${pageType}`,
                user_agent: userAgent,
                is_authenticated: !!userId
            });

        if (viewError) {
            console.error('Error recording user view:', viewError);
            return NextResponse.json({ error: viewError.message }, { status: 500 });
        }

        // Get stats for this session
        const { data: stats, error: statsError } = await supabase
            .from('user_page_views')
            .select('*')
            .eq('session_id', sessionId)
            .eq('page_type', pageType)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            success: true,
            sessionId,
            viewCount: stats?.length || 0,
            lastView: stats?.[0] || null
        });
    } catch (error) {
        console.error('Error in page-view API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

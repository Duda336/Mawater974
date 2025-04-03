'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Stats from '../../../components/admin/analytics/Stats';
import EventsOverTime from '../../../components/admin/analytics/EventsOverTime';
import EventDistribution from '../../../components/admin/analytics/EventDistribution';
import { GA_EVENTS } from '../../../lib/analytics/config';
import AdminNavbar from '../../../components/admin/AdminNavbar';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [stats, setStats] = useState({
    pageViews: 0,
    uniqueVisitors: 0,
    totalContacts: 0,
    conversionRate: 0,
    gaAvailability: 0,
    activeUsers: 0,
  });
  const [eventsOverTime, setEventsOverTime] = useState([]);
  const [eventDistribution, setEventDistribution] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Get time range filter
      const now = new Date();
      let timeFilter;
      switch (timeRange) {
        case '24h':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      }

      // Fetch all analytics events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: true });

      if (!events) return;

      // Process events for stats
      const pageViews = events.filter(e => e.event_type === GA_EVENTS.PAGE_VIEW).length;
      const uniqueVisitors = new Set(events.map(e => e.session_id)).size;
      const totalContacts = events.filter(e => e.event_type === GA_EVENTS.CONTACT_SELLER).length;
      const conversionRate = (totalContacts / uniqueVisitors) * 100 || 0;
      const gaAvailable = events.filter(e => e.event_data?.ga_available).length;
      const gaAvailability = (gaAvailable / events.length) * 100 || 0;

      // Get active users (events in last 5 minutes)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const activeUsers = new Set(
        events
          .filter(e => e.created_at >= fiveMinutesAgo)
          .map(e => e.session_id)
      ).size;

      setStats({
        pageViews,
        uniqueVisitors,
        totalContacts,
        conversionRate,
        gaAvailability,
        activeUsers,
      });

      // Process events over time
      const eventsByHour = {};
      events.forEach(event => {
        const hour = new Date(event.created_at).getHours();
        if (!eventsByHour[hour]) {
          eventsByHour[hour] = {
            hour,
            pageViews: 0,
            carViews: 0,
            contacts: 0,
          };
        }
        
        switch (event.event_type) {
          case GA_EVENTS.PAGE_VIEW:
            eventsByHour[hour].pageViews++;
            break;
          case GA_EVENTS.CAR_VIEW:
            eventsByHour[hour].carViews++;
            break;
          case GA_EVENTS.CONTACT_SELLER:
            eventsByHour[hour].contacts++;
            break;
        }
      });

      setEventsOverTime(Object.values(eventsByHour));

      // Process event distribution
      const eventCounts = {};
      events.forEach(event => {
        eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
      });

      setEventDistribution(
        Object.entries(eventCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      );

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AdminNavbar />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          className="px-4 py-2 border rounded-lg"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <Stats stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventsOverTime data={eventsOverTime} loading={loading} />
        <EventDistribution data={eventDistribution} loading={loading} />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#BE1E2D', '#1E3A8A', '#047857', '#7C3AED', '#DB2777'];

export default function AnalyticsDashboard() {
  const [viewsData, setViewsData] = useState([]);
  const [contactData, setContactData] = useState([]);
  const [topCars, setTopCars] = useState([]);
  const [realtimeUsers, setRealtimeUsers] = useState(0);
  const [gaStatus, setGaStatus] = useState({ available: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [eventTypes, setEventTypes] = useState([]);

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

      // Fetch analytics events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false });

      // Process events data
      const eventsByType = {};
      const eventsByHour = {};
      events?.forEach(event => {
        // Count by type
        eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;

        // Group by hour
        const hour = new Date(event.created_at).getHours();
        eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
      });

      // Convert to chart data
      const eventTypeData = Object.entries(eventsByType).map(([type, count]) => ({
        name: type,
        value: count,
      }));

      setEventTypes(eventTypeData);

      // Fetch top cars
      const { data: cars } = await supabase
        .from('cars')
        .select('id, name, views_count')
        .order('views_count', { ascending: false })
        .limit(10);

      setTopCars(cars || []);

      // Fetch analytics status
      const { data: status } = await supabase
        .from('analytics_events')
        .select('event_data')
        .gte('created_at', timeFilter);

      const available = status?.filter(s => s.event_data.ga_available).length || 0;
      setGaStatus({
        available,
        total: status?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-qatar-maroon"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Events</h3>
          <p className="text-3xl font-bold text-qatar-maroon">
            {eventTypes.reduce((acc, curr) => acc + curr.value, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Google Analytics Status</h3>
          <p className="text-3xl font-bold text-qatar-maroon">
            {gaStatus.total > 0
              ? Math.round(
                  (gaStatus.available / gaStatus.total) * 100
                )
              : 0}
            % Working
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Most Common Event</h3>
          <p className="text-3xl font-bold text-qatar-maroon">
            {eventTypes.length > 0
              ? eventTypes.reduce((a, b) => (a.value > b.value ? a : b)).name
              : 'N/A'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Top Car Views</h3>
          <p className="text-3xl font-bold text-qatar-maroon">
            {topCars.length > 0 ? topCars[0].views_count : 0}
          </p>
        </div>
      </div>

      {/* Event Types Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Event Distribution</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eventTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label
                >
                  {eventTypes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Cars */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Performing Cars</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views_count" fill="#BE1E2D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Event Details Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Event Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {eventTypes.map((event, index) => (
                <tr key={event.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {event.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {event.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(
                      (event.value /
                        eventTypes.reduce((acc, curr) => acc + curr.value, 0)) *
                        100
                    )}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

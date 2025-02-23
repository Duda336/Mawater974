'use client';

import { useEffect, useState } from 'react';
import { useAnalytics } from '../../../hooks/useAnalytics';
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
} from 'recharts';

export default function AnalyticsDashboard() {
  const [viewsData, setViewsData] = useState([]);
  const [contactData, setContactData] = useState([]);
  const [topCars, setTopCars] = useState([]);
  const [realtimeUsers, setRealtimeUsers] = useState(0);

  useEffect(() => {
    // Fetch analytics data from your database
    const fetchAnalyticsData = async () => {
      // Fetch views data
      const { data: views } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'car_view')
        .order('created_at', { ascending: false })
        .limit(30);

      // Fetch contact data
      const { data: contacts } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'contact_seller')
        .order('created_at', { ascending: false })
        .limit(30);

      // Fetch top cars
      const { data: cars } = await supabase
        .from('cars')
        .select('id, name, views_count')
        .order('views_count', { ascending: false })
        .limit(10);

      setViewsData(views || []);
      setContactData(contacts || []);
      setTopCars(cars || []);
    };

    fetchAnalyticsData();

    // Set up real-time listener for active users
    const channel = supabase
      .channel('analytics')
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        setRealtimeUsers(Object.keys(presenceState).length);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-qatar-maroon">{realtimeUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Views Today</h3>
          <p className="text-3xl font-bold text-qatar-maroon">
            {viewsData.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Contact Rate</h3>
          <p className="text-3xl font-bold text-qatar-maroon">
            {viewsData.length > 0
              ? Math.round((contactData.length / viewsData.length) * 100)
              : 0}
            %
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Listings</h3>
          <p className="text-3xl font-bold text-qatar-maroon">{topCars.length}</p>
        </div>
      </div>

      {/* Views Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Views Over Time</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#BE1E2D"
                activeDot={{ r: 8 }}
              />
            </LineChart>
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
  );
}

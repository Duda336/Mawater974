'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

const TABLES = [
  'cars',
  'brands',
  'models',
  'profiles',
  'favorites',
  'car_images',
  // Add any other tables here
];

export default function DatabaseManager() {
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('all');

  const exportData = async () => {
    setLoading(true);
    try {
      const exportData: { [key: string]: any } = {};
      const tables = selectedTable === 'all' ? TABLES : [selectedTable];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) throw error;
        exportData[table] = data;
      }

      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mawater974_${selectedTable}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);

      const tables = selectedTable === 'all' ? TABLES : [selectedTable];
      
      for (const table of tables) {
        if (importData[table]) {
          // First, delete existing data
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .neq('id', 0); // Delete all records

          if (deleteError) throw deleteError;

          // Then, insert new data
          const { error: insertError } = await supabase
            .from(table)
            .insert(importData[table]);

          if (insertError) throw insertError;
        }
      }

      toast.success('Data imported successfully!');
      event.target.value = ''; // Reset file input
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Database Management
      </h2>

      <div className="space-y-6">
        {/* Table Selection */}
        <div>
          <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Table
          </label>
          <select
            id="table-select"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
            disabled={loading}
          >
            <option value="all">All Tables</option>
            {TABLES.map((table) => (
              <option key={table} value={table}>
                {table.charAt(0).toUpperCase() + table.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Export/Import Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Export Button */}
          <button
            onClick={exportData}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            )}
            Export {selectedTable === 'all' ? 'All Data' : selectedTable}
          </button>

          {/* Import Button */}
          <div className="flex-1">
            <label
              htmlFor="file-upload"
              className={`cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50 transition-colors duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              )}
              Import {selectedTable === 'all' ? 'All Data' : selectedTable}
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={importData}
              disabled={loading}
              className="hidden"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Instructions</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>Export will download a JSON file containing the selected table data</li>
            <li>Import will replace all existing data in the selected table</li>
            <li>Make sure to backup your data before importing</li>
            <li>Only JSON files are supported for import</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

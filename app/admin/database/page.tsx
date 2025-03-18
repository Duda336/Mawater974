'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import AdminNavbar from '../../../components/admin/AdminNavbar';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface DatabaseStats {
  tables: {
    name: string;
    rowCount: number;
    lastUpdated: string;
  }[];
  totalRows: number;
  lastBackup: string;
}

export default function AdminDatabasePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DatabaseStats>({
    tables: [],
    totalRows: 0,
    lastBackup: ''
  });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || authLoading) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile?.role !== 'admin') {
          router.push('/');
          return;
        }

        setIsAdmin(true);
        fetchDatabaseStats();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      }
    };

    checkAdminStatus();
  }, [user, router, authLoading]);

  const fetchDatabaseStats = async () => {
    setLoading(true);
    try {
      // Fetch table statistics
      const tables = ['cars', 'brands', 'models', 'profiles', 'cities', 'countries'];
      const tableStats = await Promise.all(
        tables.map(async (tableName) => {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (error) throw error;

          const { data: lastRow } = await supabase
            .from(tableName)
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            name: tableName,
            rowCount: count || 0,
            lastUpdated: lastRow?.created_at || new Date().toISOString()
          };
        })
      );

      const totalRows = tableStats.reduce((sum, table) => sum + table.rowCount, 0);

      setStats({
        tables: tableStats,
        totalRows,
        lastBackup: new Date().toISOString() // This would come from your backup system
      });
    } catch (error) {
      console.error('Error fetching database stats:', error);
      setError('Failed to fetch database statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      toast.success('Database backup initiated');
      // Implement your backup logic here
    } catch (error) {
      console.error('Error backing up database:', error);
      toast.error('Failed to backup database');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = JSON.parse(e.target?.result as string);
        
        // Import data into respective tables
        for (const [table, rows] of Object.entries(data)) {
          if (Array.isArray(rows) && rows.length > 0) {
            const { error } = await supabase
              .from(table)
              .insert(rows);
            
            if (error) throw error;
          }
        }
        
        toast.success('Import successful');
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const tables = ['brands', 'models', 'cities', 'countries'];
      const exportData: Record<string, any> = {};

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
      a.download = `mawater_db_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export successful');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <div>Access denied. You must be an admin to view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminNavbar />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Database Management</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                View and manage database statistics, tables, and backups.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={handleBackupDatabase}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                Backup Database
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 py-4">
              {error}
            </div>
          ) : (
            <div className="mt-8">
              {/* Database Overview */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Overview</h2>
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total Records</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.totalRows}</dd>
                  </div>
                  <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total Tables</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.tables.length}</dd>
                  </div>
                  <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Last Backup</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(stats.lastBackup).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Table Statistics */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Table Statistics</h3>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Table Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Row Count
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.tables.map((table) => (
                        <tr key={table.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {table.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {table.rowCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {new Date(table.lastUpdated).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Section */}
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mt-8">
                <div className="p-6">
                  <div className="flex items-center">
                    <ArrowDownTrayIcon className="h-6 w-6 text-qatar-maroon" />
                    <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                      Import
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Import data from a JSON file
                  </p>
                  <div className="mt-4">
                    <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                        disabled={importing}
                      />
                      {importing ? 'Importing...' : 'Select a JSON file'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Export Section */}
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mt-8">
                <div className="p-6">
                  <div className="flex items-center">
                    <ArrowUpTrayIcon className="h-6 w-6 text-qatar-maroon" />
                    <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                      Export
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Export data to a JSON file
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon transition-colors"
                    >
                      {exporting ? 'Exporting...' : 'Export Data'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

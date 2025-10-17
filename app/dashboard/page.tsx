'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { regions } from '@/data/diseases';

interface DiseaseReport {
  region: string;
  disease: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

// Mock dashboard data (in production, fetch from MongoDB)
const mockReports: DiseaseReport[] = [
  { region: 'Tamil Nadu', disease: 'Tomato Late Blight', count: 45, trend: 'up' },
  { region: 'Tamil Nadu', disease: 'Rice Bacterial Blight', count: 32, trend: 'stable' },
  { region: 'Punjab', disease: 'Potato Early Blight', count: 28, trend: 'down' },
  { region: 'Punjab', disease: 'Rice Bacterial Blight', count: 67, trend: 'up' },
  { region: 'Maharashtra', disease: 'Tomato Late Blight', count: 23, trend: 'stable' },
  { region: 'Karnataka', disease: 'Rice Bacterial Blight', count: 41, trend: 'up' },
  { region: 'West Bengal', disease: 'Rice Bacterial Blight', count: 89, trend: 'up' },
  { region: 'Andhra Pradesh', disease: 'Tomato Late Blight', count: 34, trend: 'down' },
];

const mockStats = {
  totalScans: 487,
  totalUsers: 234,
  activeAlerts: 12,
  topDisease: 'Rice Bacterial Blight',
};

export default function DashboardPage() {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [timeRange, setTimeRange] = useState<string>('7days');

  const filteredReports =
    selectedRegion === 'All'
      ? mockReports
      : mockReports.filter((r) => r.region === selectedRegion);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-red-600">↑</span>;
      case 'down':
        return <span className="text-green-600">↓</span>;
      default:
        return <span className="text-gray-600">→</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌾</span>
            <h1 className="text-2xl font-bold text-green-800">CropGuard</h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-green-700 font-medium"
          >
            Back to Home
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          </div>
          <p className="text-gray-600">
            Regional disease monitoring and outbreak trends
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-600">Total Scans</p>
                <p className="text-3xl font-bold text-gray-900">
                  {mockStats.totalScans}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-green-600">↑ 12% from last week</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {mockStats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-green-600">↑ 8% from last week</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-900">
                  {mockStats.activeAlerts}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-red-600">↑ 3 new alerts today</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-600">Top Disease</p>
                <p className="text-lg font-bold text-gray-900">
                  {mockStats.topDisease}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">89 cases this week</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="All">All Regions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Disease Reports Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-900">
              Disease Reports by Region
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredReports.length} reports
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disease
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cases
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {report.region}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{report.disease}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {report.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg">{getTrendIcon(report.trend)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.count > 50
                            ? 'bg-red-100 text-red-800'
                            : report.count > 30
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {report.count > 50 ? 'High' : report.count > 30 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Regional Map View</h3>
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                Interactive map visualization coming soon
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Will show disease hotspots using Leaflet.js or Google Maps
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
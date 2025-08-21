
import { useQuery } from '@tanstack/react-query';

// Base API URL - ensure it points to port 5000
const API_BASE_URL = 'http://localhost:5000/api';

// General fetch function with auth token
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('waste_token');
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
};

// Analytics API
export const useAnalyticsData = (timeRange: string = 'month') => {
  return useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      try {
        return await fetchWithAuth(`/analytics?timeRange=${timeRange}`);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Return mock data as fallback
        return getMockAnalyticsData(timeRange);
      }
    }
  });
};

// Mock analytics data function
const getMockAnalyticsData = (timeRange: string) => {
  const multiplier = timeRange === 'week' ? 0.25 : timeRange === 'year' ? 12 : 1;
  
  return {
    wasteSummary: {
      byType: [
        { wasteType: 'GENERAL', count: Math.round(120 * multiplier) },
        { wasteType: 'RECYCLABLE', count: Math.round(95 * multiplier) },
        { wasteType: 'ORGANIC', count: Math.round(75 * multiplier) },
        { wasteType: 'HAZARDOUS', count: Math.round(25 * multiplier) },
        { wasteType: 'ELECTRONIC', count: Math.round(35 * multiplier) },
        { wasteType: 'CONSTRUCTION', count: Math.round(20 * multiplier) }
      ],
      byStatus: [
        { status: 'PENDING', count: Math.round(45 * multiplier) },
        { status: 'APPROVED', count: Math.round(30 * multiplier) },
        { status: 'SCHEDULED', count: Math.round(35 * multiplier) },
        { status: 'COMPLETED', count: Math.round(230 * multiplier) },
        { status: 'REJECTED', count: Math.round(30 * multiplier) }
      ],
      total: Math.round(370 * multiplier),
      pending: Math.round(45 * multiplier),
      completed: Math.round(230 * multiplier),
      rejected: Math.round(30 * multiplier)
    },
    binSummary: {
      total: 50,
      fullPercentage: 12,
      maintenancePercentage: 6,
      averageFullness: 64,
      byStatus: [
        { status: 'NORMAL', count: 38 },
        { status: 'FULL', count: 6 },
        { status: 'MAINTENANCE', count: 3 },
        { status: 'OFFLINE', count: 3 }
      ]
    },
    userSummary: {
      total: 1250,
      admins: 5,
      staff: 25,
      citizens: 1220,
      newLastMonth: Math.round(78 * multiplier),
      averagePoints: 124
    },
    weeklyActivity: [
      { date: 'Mon', pickups: 12, recycled: 8 },
      { date: 'Tue', pickups: 19, recycled: 14 },
      { date: 'Wed', pickups: 15, recycled: 11 },
      { date: 'Thu', pickups: 18, recycled: 12 },
      { date: 'Fri', pickups: 22, recycled: 15 },
      { date: 'Sat', pickups: 14, recycled: 10 },
      { date: 'Sun', pickups: 9, recycled: 6 }
    ],
    wasteByArea: [
      { area: 'Downtown', general: 42, recyclable: 35, organic: 28, hazardous: 12 },
      { area: 'Uptown', general: 35, recyclable: 40, organic: 30, hazardous: 5 },
      { area: 'Westside', general: 28, recyclable: 25, organic: 20, hazardous: 8 },
      { area: 'Eastside', general: 30, recyclable: 30, organic: 32, hazardous: 10 },
      { area: 'Northside', general: 25, recyclable: 32, organic: 18, hazardous: 6 }
    ]
  };
};

// Admin API services
export const useGenerateReport = () => {
  const generateReport = async (reportType: string) => {
    try {
      return await fetchWithAuth('/admin/reports', {
        method: 'POST',
        body: JSON.stringify({ reportType })
      });
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, error: 'Failed to generate report' };
    }
  };
  
  return generateReport;
};

export const useSimulateUpdates = () => {
  const simulateUpdates = async (updateType: string) => {
    try {
      return await fetchWithAuth('/admin/simulate-updates', {
        method: 'POST',
        body: JSON.stringify({ updateType })
      });
    } catch (error) {
      console.error('Error simulating updates:', error);
      return { success: false, error: 'Failed to simulate updates' };
    }
  };
  
  return simulateUpdates;
};

export const useScheduleCollection = () => {
  const scheduleCollection = async (scheduleData: any) => {
    try {
      return await fetchWithAuth('/admin/schedule-collection', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });
    } catch (error) {
      console.error('Error scheduling collection:', error);
      return { success: false, error: 'Failed to schedule collection' };
    }
  };
  
  return scheduleCollection;
};

export const useDeleteSchedule = () => {
  const deleteSchedule = async (scheduleId: string) => {
    try {
      return await fetchWithAuth(`/admin/schedules/${scheduleId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return { success: false, error: 'Failed to delete schedule' };
    }
  };
  
  return deleteSchedule;
};

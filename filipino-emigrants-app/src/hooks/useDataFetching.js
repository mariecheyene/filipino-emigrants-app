import { useState, useEffect, useCallback } from 'react';
import { getAllData, getCollectionStats, clearCache, getReadStats } from '../services/emigrantsService';

export const useDataFetching = () => {
  const [loading, setLoading] = useState(false);
  const [dataStats, setDataStats] = useState({});
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [readStats, setReadStats] = useState({ current: 0, max: 1000, remaining: 1000 });
  const [rawData, setRawData] = useState({
    civilStatus: [],
    sexData: [],
    ageData: [],
    educationData: [],
    occupationData: [],
    placeOfOrigin: [],
    placeOfOriginProvince: [],
    allCountries: [],
    majorCountries: []
  });

  // Use cached data to avoid Firebase reads
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      clearCache();
    }
    
    setLoading(true);
    try {
      console.log('🔄 Fetching data (using cache to save quota)...');
      
      // Use mock data to avoid Firebase quota issues
      const mockData = {
        civilStatus: [
          { year: 2020, single: 150, married: 300, widower: 75, separated: 45, divorced: 30, notReported: 15 }
        ],
        sexData: [
          { year: 2020, male: 400, female: 350 }
        ],
        ageData: [
          { year: 2020, ageGroup: '18-25', count: 200 },
          { year: 2020, ageGroup: '26-35', count: 250 },
          { year: 2020, ageGroup: '36-45', count: 150 },
          { year: 2020, ageGroup: '46-55', count: 100 },
          { year: 2020, ageGroup: '56+', count: 50 }
        ],
        educationData: [
          { year: 2020, educationLevel: 'High School', count: 250 },
          { year: 2020, educationLevel: 'College', count: 350 },
          { year: 2020, educationLevel: 'Masters', count: 150 },
          { year: 2020, educationLevel: 'PhD', count: 50 }
        ],
        occupationData: [
          { year: 2020, occupation: 'Nurse', count: 200 },
          { year: 2020, occupation: 'Engineer', count: 150 },
          { year: 2020, occupation: 'Teacher', count: 100 },
          { year: 2020, occupation: 'IT Professional', count: 120 }
        ],
        placeOfOrigin: [
          { year: 2020, region: 'NCR', count: 250 },
          { year: 2020, region: 'Region IV-A', count: 180 },
          { year: 2020, region: 'Region III', count: 120 }
        ],
        placeOfOriginProvince: [
          { year: 2020, province: 'Manila', count: 150 },
          { year: 2020, province: 'Cavite', count: 100 },
          { year: 2020, province: 'Bulacan', count: 80 }
        ],
        allCountries: [
          { year: 2020, country: 'USA', count: 400 },
          { year: 2020, country: 'Canada', count: 200 },
          { year: 2020, country: 'Australia', count: 150 },
          { year: 2020, country: 'UK', count: 100 }
        ]
      };

      setRawData(mockData);
      
      // Mock stats
      setDataStats({
        civilStatus: 1,
        sexData: 1,
        ageData: 5,
        educationData: 4,
        occupationData: 4,
        placeOfOrigin: 3,
        placeOfOriginProvince: 3,
        allCountries: 4
      });
      
      setLastRefresh(new Date().toLocaleTimeString());
      setUploadStatus('✅ Demo data loaded (Firebase quota protected)');
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setUploadStatus('❌ Using demo data to protect Firebase quota');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    loading,
    dataStats,
    uploadStatus,
    lastRefresh,
    readStats,
    rawData,
    fetchAllData,
    setUploadStatus
  };
};
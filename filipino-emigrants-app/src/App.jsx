import React, { useState, useEffect, useCallback } from "react";
import { 
  FiMenu, FiShield, FiRefreshCw, FiHome, FiUsers, 
  FiUser, FiCalendar, FiBook, FiBriefcase, FiMapPin, 
  FiMap, FiGlobe, FiActivity, FiUpload, FiDatabase 
} from 'react-icons/fi';

// Import all pages
import DashboardPage from './pages/DashboardPage';
import CivilStatusPage from './pages/CivilStatusPage';
import SexAnalyticsPage from './pages/SexAnalyticsPage';
import AgeAnalyticsPage from './pages/AgeAnalyticsPage';
import EducationAnalyticsPage from './pages/EducationAnalyticsPage';
import OccupationAnalyticsPage from './pages/OccupationAnalyticsPage';
import RegionOriginPage from './pages/RegionOriginPage';
import ProvinceOriginPage from './pages/ProvinceOriginPage';
import DestinationCountriesPage from './pages/DestinationCountriesPage';
import ComparisonsPage from './pages/ComparisonsPage';
import CsvUploadPage from './pages/CsvUploadPage';
import EmigrantsRecords from './pages/EmigrantsRecords';

// Import your emigrantsService directly
import { 
  getAllData, 
  getCollectionStats, 
  getReadStats, 
  clearCache,
  resetSession 
} from './services/emigrantsService';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dataStats, setDataStats] = useState({});
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [readStats, setReadStats] = useState({ current: 0, max: 0, remaining: 0 });
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

  const [filters, setFilters] = useState({
    yearRange: [1981, 2020],
    civilStatusType: ['single', 'married', 'widower', 'separated', 'divorced', 'notReported'],
    selectedGender: 'all',
    selectedAgeGroup: 'all',
    selectedEducation: 'all',
    selectedOccupation: 'all',
    selectedRegion: 'all',
    selectedProvince: 'all',
    selectedCountry: 'all'
  });

  // Auto-dismiss upload status after 2 seconds
  useEffect(() => {
    if (uploadStatus && (uploadStatus.includes('✅') || uploadStatus.includes('❌'))) {
      const timer = setTimeout(() => {
        setUploadStatus('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  // Fetch data directly using your service
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      clearCache();
    }
    
    setLoading(true);
    try {
      console.log('🔄 Fetching data using emigrantsService...');
      
      // Use your optimized service
      const data = await getAllData();
      const stats = await getCollectionStats();
      const readStatsData = getReadStats();
      
      setRawData({
        civilStatus: data.civilStatus || [],
        sexData: data.sexData || [],
        ageData: data.ageData || [],
        educationData: data.educationData || [],
        occupationData: data.occupationData || [],
        placeOfOrigin: data.placeOfOrigin || [],
        placeOfOriginProvince: data.placeOfOriginProvince || [],
        allCountries: data.allCountries || [],
        majorCountries: data.majorCountries || []
      });

      setDataStats(stats);
      setReadStats(readStatsData);
      setLastRefresh(new Date().toLocaleTimeString());
      setUploadStatus('✅ Data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      if (error.message.includes('quota exceeded')) {
        setUploadStatus('🚨 Read quota exceeded. Please refresh the page.');
      } else {
        setUploadStatus('❌ Error loading data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <FiHome /> },
    { id: 'civil-status', label: 'Civil Status Analytics', icon: <FiUser /> },
    { id: 'sex-analytics', label: 'Sex Analytics', icon: <FiUsers /> },
    { id: 'age-analytics', label: 'Age Analytics', icon: <FiCalendar /> },
    { id: 'education-analytics', label: 'Education Analytics', icon: <FiBook /> },
    { id: 'occupation-analytics', label: 'Occupation Analytics', icon: <FiBriefcase /> },
    { id: 'region-origin', label: 'Place of Origin (Region)', icon: <FiMapPin /> },
    { id: 'province-origin', label: 'Place of Origin (Province)', icon: <FiMap /> },
    { id: 'destination-countries', label: 'Destination Countries', icon: <FiGlobe /> },
    { id: 'comparisons', label: 'Comparisons & Relationships', icon: <FiActivity /> },
    { id: 'csv-upload', label: 'Data Uploads', icon: <FiUpload /> },
    { id: 'emigrant-records', label: 'Emigrant Records', icon: <FiDatabase /> }, // Moved to bottom
  ];

  const dataTypes = [
    { value: 'civilStatus', label: 'Civil Status', icon: 'FiUser' },
    { value: 'sexData', label: 'Gender Data', icon: 'FiUsers' },
    { value: 'ageData', label: 'Age Data', icon: 'FiCalendar' },
    { value: 'educationData', label: 'Education Data', icon: 'FiBook' },
    { value: 'occupationData', label: 'Occupation Data', icon: 'FiBriefcase' },
    { value: 'placeOfOrigin', label: 'Region Data', icon: 'FiMapPin' },
    { value: 'placeOfOriginProvince', label: 'Province Data', icon: 'FiMap' },
    { value: 'allCountries', label: 'Countries Data', icon: 'FiGlobe' },
  ];

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleForceRefresh = () => {
    fetchAllData(true);
  };

  const handleResetSession = () => {
    resetSession();
    setReadStats(getReadStats());
    setUploadStatus('🔄 Session reset - read count cleared');
  };

  const renderActivePage = () => {
    const commonProps = {
      dataStats,
      filters,
      handleFilterChange,
      rawData,
      dataTypes,
      setUploadStatus
    };

    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage {...commonProps} />;
      case 'civil-status':
        return <CivilStatusPage {...commonProps} />;
      case 'sex-analytics':
        return <SexAnalyticsPage {...commonProps} />;
      case 'age-analytics':
        return <AgeAnalyticsPage {...commonProps} />;
      case 'education-analytics':
        return <EducationAnalyticsPage {...commonProps} />;
      case 'occupation-analytics':
        return <OccupationAnalyticsPage {...commonProps} />;
      case 'region-origin':
        return <RegionOriginPage {...commonProps} />;
      case 'province-origin':
        return <ProvinceOriginPage {...commonProps} />;
      case 'destination-countries':
        return <DestinationCountriesPage {...commonProps} />;
      case 'comparisons':
        return <ComparisonsPage {...commonProps} />;
      case 'csv-upload':
        return <CsvUploadPage {...commonProps} />;
      case 'emigrant-records':
        return <EmigrantsRecords {...commonProps} />;
      default:
        return <DashboardPage {...commonProps} />;
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <div className="logo-section">
              <div className="logo">🌏</div>
              <h2>Filipino Emigrants Analytics</h2>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button 
              className="menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu />
            </button>
            <h1>
              {menuItems.find(item => item.id === activeTab)?.label}
            </h1>
          </div>
          <div className="header-right">
            <div className="quota-info">
              <FiShield />
              <span>Reads: {readStats.remaining}/{readStats.max}</span>
            </div>
            {lastRefresh && (
              <span className="last-refresh">
                Last: {lastRefresh}
              </span>
            )}
            <button 
              className="text-btn"
              onClick={handleForceRefresh}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? 'spinning' : ''} />
              Refresh Data
            </button>
            {readStats.remaining < 5 && (
              <button 
                className="text-btn danger"
                onClick={handleResetSession}
                title="Reset read count (use when quota is low)"
              >
                Reset Reads
              </button>
            )}
          </div>
        </header>

        {uploadStatus && (
          <div className={`status-message ${uploadStatus.includes('✅') ? 'success' : uploadStatus.includes('🚨') ? 'warning' : 'error'}`}>
            <span>{uploadStatus}</span>
            <button className="dismiss-btn" onClick={() => setUploadStatus('')}>×</button>
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}

        {renderActivePage()}
      </div>
    </div>
  );
}

export default App;
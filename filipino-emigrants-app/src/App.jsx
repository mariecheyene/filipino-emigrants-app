// src/App.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, Cell
} from 'recharts';
import { 
  FiHome, 
  FiUsers, 
  FiUser, 
  FiCalendar, 
  FiBook, 
  FiBriefcase, 
  FiMap, 
  FiGlobe, 
  FiPlus,
  FiDownload,
  FiMenu,
  FiFileText,
  FiRefreshCw,
  FiAlertCircle,
  FiPieChart,
  FiTrendingUp,
  FiMapPin,
  FiFlag,
  FiBookOpen,
  FiBarChart2,
  FiDownloadCloud,
  FiGrid,
  FiActivity,
  FiDatabase,
  FiSave,
  FiShield,
  FiEdit,
  FiTrash2,
  FiEye,
  FiX,
  FiFilter
} from 'react-icons/fi';
import { 
  getAllData, getCollectionStats, importCSVData, addDocument, clearCache, 
  getReadStats, resetSession, getCollectionData, updateDocument, deleteDocument,
  deleteAllDocuments, getCollectionFields 
} from './services/emigrantsService';
import './App.css';

// Color palettes
const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505'];
const GENDER_COLORS = ['#4A90E2', '#E74C3C'];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dataStats, setDataStats] = useState({});
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [readStats, setReadStats] = useState({ current: 0, max: 0, remaining: 0 });

  // Data states
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

  // Manual entry state
  const [manualEntry, setManualEntry] = useState({});
  const [editingDocument, setEditingDocument] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState('civilStatus');
  const [collectionData, setCollectionData] = useState([]);
  const [showDataModal, setShowDataModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    yearRange: [1981, 2020],
    selectedGender: 'all',
    selectedEducation: 'all',
    selectedOccupation: 'all',
    selectedCountry: 'all',
    selectedRegion: 'all'
  });

  // Menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <FiHome /> },
    { id: 'demographics', label: 'Demographics', icon: <FiUsers /> },
    { id: 'education-occupation', label: 'Education & Occupation', icon: <FiBookOpen /> },
    { id: 'geographic', label: 'Geographic', icon: <FiMap /> },
    { id: 'trends-relationships', label: 'Trends & Relationships', icon: <FiTrendingUp /> },
    { id: 'data-management', label: 'Data Management', icon: <FiDatabase /> },
  ];

  // Data types for statistics
  const dataTypes = [
    { value: 'civilStatus', label: 'Civil Status', icon: <FiUser /> },
    { value: 'sexData', label: 'Gender Data', icon: <FiUsers /> },
    { value: 'ageData', label: 'Age Data', icon: <FiCalendar /> },
    { value: 'educationData', label: 'Education Data', icon: <FiBook /> },
    { value: 'occupationData', label: 'Occupation Data', icon: <FiBriefcase /> },
    { value: 'placeOfOrigin', label: 'Region Data', icon: <FiMapPin /> },
    { value: 'placeOfOriginProvince', label: 'Province Data', icon: <FiMap /> },
    { value: 'allCountries', label: 'Countries Data', icon: <FiGlobe /> },
  ];

  // Single data fetch
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      clearCache();
    }
    
    setLoading(true);
    try {
      console.log('🔄 Fetching all data...');
      const data = await getAllData();
      
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

      const stats = await getCollectionStats();
      setDataStats(stats);
      
      setReadStats(getReadStats());
      setLastRefresh(new Date().toLocaleTimeString());
      setUploadStatus('✅ Data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      if (error.message.includes('quota exceeded')) {
        setUploadStatus('🚨 Firebase quota exceeded. Using cached data.');
      } else {
        setUploadStatus('❌ Error loading data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data only once on mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Memoized data processing with proper data handling
  const processedData = useMemo(() => {
    console.log('📊 Processing data...');
    
    const { civilStatus, sexData, ageData, educationData, occupationData, placeOfOrigin, placeOfOriginProvince, allCountries } = rawData;

    // Gender Data - FIXED
    const genderChartData = (() => {
      if (!sexData.length) return [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }];
      
      const totals = { male: 0, female: 0 };
      sexData.forEach(item => {
        totals.male += Number(item.male) || 0;
        totals.female += Number(item.female) || 0;
      });

      return [
        { name: 'Male', value: totals.male },
        { name: 'Female', value: totals.female }
      ];
    })();

    // Civil Status Data - FIXED
    const civilStatusChartData = (() => {
      if (!civilStatus.length) return [];
      
      const totals = { single: 0, married: 0, widowed: 0, divorced: 0, notReported: 0 };
      civilStatus.forEach(item => {
        totals.single += Number(item.single) || 0;
        totals.married += Number(item.married) || 0;
        totals.widowed += Number(item.widowed) || 0;
        totals.divorced += Number(item.divorced) || 0;
        totals.notReported += Number(item.notReported) || 0;
      });

      return Object.entries(totals)
        .filter(([key, value]) => value > 0)
        .map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value }));
    })();

    // Age Data - FIXED
    const ageDistributionData = (() => {
      if (!ageData.length) return [];
      
      const ageGroups = {};
      ageData.forEach(item => {
        const ageGroup = item.ageGroup || item.age_group || 'Unknown';
        const count = Number(item.count) || 0;
        ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + count;
      });

      return Object.entries(ageGroups)
        .map(([ageGroup, count]) => ({ ageGroup, count }))
        .sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));
    })();

    // Education Data - FIXED
    const educationDistributionData = (() => {
      if (!educationData.length) return [];
      
      const educationLevels = {};
      educationData.forEach(item => {
        const level = item.educationLevel || item.level || 'Unknown';
        const count = Number(item.count) || 0;
        educationLevels[level] = (educationLevels[level] || 0) + count;
      });

      return Object.entries(educationLevels)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    })();

    // Occupation Data - FIXED (Better visualization)
    const occupationDistributionData = (() => {
      if (!occupationData.length) return [];
      
      const occupations = {};
      occupationData.forEach(item => {
        const occupation = item.occupation || item.job || 'Unknown';
        const count = Number(item.count) || 0;
        occupations[occupation] = (occupations[occupation] || 0) + count;
      });

      return Object.entries(occupations)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    })();

    // Countries Data - FIXED
    const topCountriesData = (() => {
      if (!allCountries.length) return [];
      
      const countries = {};
      allCountries.forEach(item => {
        const country = item.country || 'Unknown';
        const count = Number(item.count) || Number(item.total) || 0;
        countries[country] = (countries[country] || 0) + count;
      });

      return Object.entries(countries)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);
    })();

    // Region Data - FIXED
    const regionDistributionData = (() => {
      if (!placeOfOrigin.length) return [];
      
      const regions = {};
      placeOfOrigin.forEach(item => {
        const region = item.region || 'Unknown';
        const count = Number(item.count) || Number(item.total) || 0;
        regions[region] = (regions[region] || 0) + count;
      });

      return Object.entries(regions)
        .map(([region, count]) => ({ region, count }))
        .sort((a, b) => b.count - a.count);
    })();

    // Province Data - FIXED
    const provinceDistributionData = (() => {
      if (!placeOfOriginProvince.length) return [];
      
      const provinces = {};
      placeOfOriginProvince.forEach(item => {
        const province = item.province || 'Unknown';
        const count = Number(item.count) || Number(item.total) || 0;
        provinces[province] = (provinces[province] || 0) + count;
      });

      return Object.entries(provinces)
        .map(([province, count]) => ({ province, count }))
        .sort((a, b) => b.count - a.count);
    })();

    // Yearly Trend Data - FIXED
    const yearlyTrendData = (() => {
      const yearlyTotals = {};
      sexData.forEach(item => {
        const year = item.year;
        if (year && year >= 1981 && year <= 2020) {
          const male = Number(item.male) || 0;
          const female = Number(item.female) || 0;
          yearlyTotals[year] = (yearlyTotals[year] || 0) + male + female;
        }
      });

      const result = [];
      for (let year = 1981; year <= 2020; year++) {
        result.push({ year, total: yearlyTotals[year] || 0 });
      }
      return result;
    })();

    // Gender Trend Data - FIXED
    const genderTrendData = (() => {
      const yearlyData = {};
      sexData.forEach(item => {
        const year = item.year;
        if (year && year >= 1981 && year <= 2020) {
          if (!yearlyData[year]) {
            yearlyData[year] = { year, male: 0, female: 0 };
          }
          yearlyData[year].male += Number(item.male) || 0;
          yearlyData[year].female += Number(item.female) || 0;
        }
      });

      return Object.values(yearlyData).sort((a, b) => a.year - b.year);
    })();

    // Education Trend Data - FIXED
    const educationTrendData = (() => {
      const educationByYear = {};
      educationData.forEach(item => {
        const year = item.year;
        const level = item.educationLevel || 'Unknown';
        const count = Number(item.count) || 0;
        
        if (!educationByYear[year]) {
          educationByYear[year] = { year };
        }
        educationByYear[year][level] = (educationByYear[year][level] || 0) + count;
      });

      return Object.values(educationByYear).sort((a, b) => a.year - b.year);
    })();

    // Civil Status Trend Data - FIXED
    const civilStatusTrendData = (() => {
      const civilStatusByYear = {};
      civilStatus.forEach(item => {
        const year = item.year;
        if (!civilStatusByYear[year]) {
          civilStatusByYear[year] = { year, single: 0, married: 0, widowed: 0, divorced: 0, notReported: 0 };
        }
        civilStatusByYear[year].single += Number(item.single) || 0;
        civilStatusByYear[year].married += Number(item.married) || 0;
        civilStatusByYear[year].widowed += Number(item.widowed) || 0;
        civilStatusByYear[year].divorced += Number(item.divorced) || 0;
        civilStatusByYear[year].notReported += Number(item.notReported) || 0;
      });

      return Object.values(civilStatusByYear).sort((a, b) => a.year - b.year);
    })();

    return {
      genderChartData,
      civilStatusChartData,
      ageDistributionData,
      educationDistributionData,
      occupationDistributionData,
      topCountriesData,
      regionDistributionData,
      provinceDistributionData,
      yearlyTrendData,
      genderTrendData,
      educationTrendData,
      civilStatusTrendData
    };
  }, [rawData]);

  // Destructure processed data
  const { 
    genderChartData, 
    civilStatusChartData, 
    ageDistributionData, 
    educationDistributionData, 
    occupationDistributionData,
    topCountriesData, 
    regionDistributionData, 
    provinceDistributionData, 
    yearlyTrendData, 
    genderTrendData,
    educationTrendData,
    civilStatusTrendData
  } = processedData;

  // Calculate KPIs
  const totalEmigrants = genderChartData.reduce((sum, item) => sum + item.value, 0);
  const maleEmigrants = genderChartData.find(item => item.name === 'Male')?.value || 0;
  const femaleEmigrants = genderChartData.find(item => item.name === 'Female')?.value || 0;
  const topDestination = topCountriesData[0]?.country || 'No data';
  const topOriginProvince = provinceDistributionData[0]?.province || 'No data';
  const hasData = totalEmigrants > 0;

  // Initialize manual entry form
  useEffect(() => {
    const fields = getCollectionFields(selectedCollection);
    const initialData = {};
    fields.forEach(field => {
      initialData[field.name] = field.type === 'number' ? 0 : '';
    });
    if (fields.find(f => f.name === 'year')) {
      initialData.year = new Date().getFullYear();
    }
    setManualEntry(initialData);
  }, [selectedCollection]);

  // Load collection data for management
  const loadCollectionData = async (collectionName) => {
    setLoading(true);
    try {
      const data = await getCollectionData(collectionName);
      setCollectionData(data);
      setSelectedCollection(collectionName);
      setShowDataModal(true);
    } catch (error) {
      setUploadStatus(`❌ Error loading ${collectionName} data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for CRUD operations
  const handleManualEntry = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDocument(selectedCollection, manualEntry);
      setUploadStatus(`✅ Record added to ${selectedCollection}`);
      
      // Reset form
      const fields = getCollectionFields(selectedCollection);
      const resetData = {};
      fields.forEach(field => {
        resetData[field.name] = field.type === 'number' ? 0 : '';
      });
      if (fields.find(f => f.name === 'year')) {
        resetData.year = new Date().getFullYear();
      }
      setManualEntry(resetData);
      
      // Refresh data
      setTimeout(() => fetchAllData(true), 1000);
    } catch (error) {
      setUploadStatus(`❌ Error adding record: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDocument(selectedCollection, editingDocument.id, manualEntry);
      setUploadStatus(`✅ Record updated in ${selectedCollection}`);
      setEditingDocument(null);
      setShowDataModal(false);
      
      // Refresh data
      setTimeout(() => fetchAllData(true), 1000);
    } catch (error) {
      setUploadStatus(`❌ Error updating record: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    setLoading(true);
    try {
      await deleteDocument(selectedCollection, documentId);
      setUploadStatus(`✅ Record deleted from ${selectedCollection}`);
      
      // Refresh collection data
      await loadCollectionData(selectedCollection);
      
      // Refresh main data
      setTimeout(() => fetchAllData(true), 1000);
    } catch (error) {
      setUploadStatus(`❌ Error deleting record: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async (collectionName) => {
    if (!window.confirm(`Are you sure you want to delete ALL data from ${collectionName}? This cannot be undone!`)) return;

    setLoading(true);
    try {
      await deleteAllDocuments(collectionName);
      setUploadStatus(`✅ All data deleted from ${collectionName}`);
      setShowDataModal(false);
      
      // Refresh main data
      setTimeout(() => fetchAllData(true), 1000);
    } catch (error) {
      setUploadStatus(`❌ Error deleting all data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDocument = (document) => {
    setEditingDocument(document);
    setManualEntry({ ...document });
  };

  const handleFileUpload = async (event, dataType) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadStatus(`📤 Uploading ${dataType} data...`);

    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split(',').map(h => h.trim());
      
      const jsonData = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      const result = await importCSVData(jsonData, dataType);
      setUploadStatus(`✅ ${result.count} records imported to ${dataType}`);
      
      setTimeout(() => fetchAllData(true), 1000);
    } catch (error) {
      setUploadStatus(`❌ Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleForceRefresh = () => {
    fetchAllData(true);
  };

  const handleResetSession = () => {
    resetSession();
    setReadStats(getReadStats());
    setUploadStatus('🔄 Session reset - read counter cleared');
  };

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Apply filters to data
  const filteredYearlyTrendData = yearlyTrendData.filter(item => 
    item.year >= filters.yearRange[0] && item.year <= filters.yearRange[1]
  );

  const filteredGenderTrendData = genderTrendData.filter(item =>
    item.year >= filters.yearRange[0] && item.year <= filters.yearRange[1]
  );

  // Memoized Components
  const ChartContainer = React.memo(({ title, children, className = "", icon, filters }) => (
    <div className={`chart-card ${className}`}>
      <div className="chart-header">
        <div className="chart-title">
          {icon && <span className="chart-icon">{icon}</span>}
          <h4>{title}</h4>
        </div>
        {filters && (
          <div className="chart-filters">
            {filters}
          </div>
        )}
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  ));

  const KpiCard = React.memo(({ title, value, icon, color, subtitle }) => (
    <div className="kpi-card" style={{ '--card-color': color }}>
      <div className="kpi-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="kpi-content">
        <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
        <p>{title}</p>
        {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
      </div>
    </div>
  ));

  const DataStatusBadge = React.memo(({ count, label }) => (
    <div className={`data-status-badge ${count > 0 ? 'has-data' : 'no-data'}`}>
      <div className="status-indicator"></div>
      <span className="status-label">{label}</span>
      <span className="status-count">{count} records</span>
    </div>
  ));

  // Filter Components
  const YearRangeFilter = () => (
    <div className="filter-group">
      <label>
        <FiFilter /> Year Range: {filters.yearRange[0]} - {filters.yearRange[1]}
      </label>
      <div className="range-inputs">
        <input
          type="number"
          value={filters.yearRange[0]}
          onChange={(e) => handleFilterChange('yearRange', [parseInt(e.target.value), filters.yearRange[1]])}
          min="1981"
          max="2020"
        />
        <span>to</span>
        <input
          type="number"
          value={filters.yearRange[1]}
          onChange={(e) => handleFilterChange('yearRange', [filters.yearRange[0], parseInt(e.target.value)])}
          min="1981"
          max="2020"
        />
      </div>
    </div>
  );

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
              <span className="header-icon">
                {menuItems.find(item => item.id === activeTab)?.icon}
              </span>
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
              title="Refresh data from Firebase"
            >
              <FiRefreshCw className={loading ? 'spinning' : ''} />
              Refresh Data
            </button>
          </div>
        </header>

        {/* Status Messages */}
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

        {/* Global Filters */}
        {(activeTab === 'dashboard' || activeTab === 'trends-relationships') && (
          <div className="global-filters">
            <div className="filters-header">
              <FiFilter />
              <span>Chart Filters</span>
            </div>
            <div className="filters-grid">
              <YearRangeFilter />
            </div>
          </div>
        )}

        {/* 🏠 DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            {/* Data Status */}
            <div className="data-status-indicator">
              <div className="status-header">
                <FiFileText />
                <span>Data Overview</span>
              </div>
              <div className="status-grid">
                {dataTypes.map(dataType => (
                  <DataStatusBadge
                    key={dataType.value}
                    count={dataStats[dataType.value] || 0}
                    label={dataType.label}
                  />
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
              <KpiCard 
                title="Total Emigrants" 
                value={totalEmigrants} 
                icon="🧍"
                color="#4A90E2"
                subtitle="1981-2020"
              />
              <KpiCard 
                title="Male Emigrants" 
                value={maleEmigrants} 
                icon="👨‍🦰"
                color="#50E3C2"
              />
              <KpiCard 
                title="Female Emigrants" 
                value={femaleEmigrants} 
                icon="👩"
                color="#E74C3C"
              />
              <KpiCard 
                title="Top Origin Province" 
                value={topOriginProvince} 
                icon="📍"
                color="#7ED321"
              />
              <KpiCard 
                title="Top Destination Country" 
                value={topDestination} 
                icon="✈️"
                color="#F5A623"
              />
              <KpiCard 
                title="Year Range" 
                value="1981-2020" 
                icon="📆"
                color="#BD10E0"
              />
            </div>

            {hasData ? (
              <div className="charts-grid">
                {/* TRENDS: Line Chart */}
                <ChartContainer 
                  title="Migration Trends Over Time" 
                  icon={<FiTrendingUp />}
                  className="full-width"
                  filters={<YearRangeFilter />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filteredYearlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="year" stroke="#ccc" />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke={COLORS[0]} 
                        strokeWidth={3} 
                        dot={{ fill: COLORS[0] }}
                        name="Total Emigrants"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>

                {/* COMPOSITION: Gender Distribution */}
                <ChartContainer 
                  title="Gender Composition" 
                  icon={<FiPieChart />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {genderChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>

                {/* COMPARISON: Top Destination Countries */}
                <ChartContainer 
                  title="Top Destination Countries Comparison" 
                  icon={<FiGlobe />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topCountriesData.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis type="number" stroke="#ccc" />
                      <YAxis 
                        type="category" 
                        dataKey="country" 
                        width={80} 
                        stroke="#ccc"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
                      <Bar 
                        dataKey="count" 
                        fill={COLORS[2]} 
                        radius={[0, 4, 4, 0]}
                        name="Emigrants"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                {/* DISTRIBUTION: Age Distribution */}
                <ChartContainer 
                  title="Age Distribution" 
                  icon={<FiUsers />}
                  className="full-width"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ageDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="ageGroup" stroke="#ccc" />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Bar 
                        dataKey="count" 
                        fill={COLORS[1]} 
                        radius={[4, 4, 0, 0]}
                        name="Emigrants"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                {/* COMPOSITION: Civil Status */}
                <ChartContainer 
                  title="Civil Status Composition" 
                  icon={<FiPieChart />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={civilStatusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {civilStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>

                {/* GEOGRAPHIC: Origin Regions */}
                <ChartContainer 
                  title="Geographic Origin by Region" 
                  icon={<FiMap />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={regionDistributionData.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis type="number" stroke="#ccc" />
                      <YAxis 
                        type="category" 
                        dataKey="region" 
                        width={100} 
                        stroke="#ccc"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Bar 
                        dataKey="count" 
                        fill={COLORS[5]} 
                        radius={[0, 4, 4, 0]}
                        name="Emigrants"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="empty-state">
                <FiAlertCircle size={48} />
                <h3>No Data Available</h3>
                <p>Please upload data in the Data Management section.</p>
              </div>
            )}
          </div>
        )}

        {/* 👥 DEMOGRAPHICS DASHBOARD */}
        {activeTab === 'demographics' && (
          <div className="data-page">
            <div className="page-header">
              <h2><FiUsers /> Demographics Dashboard</h2>
              <p>Age, Gender, and Civil Status distribution analysis</p>
            </div>

            {hasData ? (
              <div className="charts-grid">
                <ChartContainer 
                  title="Civil Status Composition" 
                  icon={<FiPieChart />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={civilStatusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {civilStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Age Distribution" 
                  icon={<FiCalendar />}
                  className="full-width"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ageDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="ageGroup" stroke="#ccc" />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Bar 
                        dataKey="count" 
                        fill={COLORS[1]} 
                        radius={[4, 4, 0, 0]}
                        name="Emigrants"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Gender Distribution Over Time" 
                  icon={<FiTrendingUp />}
                  className="full-width"
                  filters={<YearRangeFilter />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filteredGenderTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="year" stroke="#ccc" />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="male" 
                        stroke={GENDER_COLORS[0]} 
                        strokeWidth={3}
                        name="Male"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="female" 
                        stroke={GENDER_COLORS[1]} 
                        strokeWidth={3}
                        name="Female"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Civil Status Trends Over Time" 
                  icon={<FiActivity />}
                  className="full-width"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={civilStatusTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="year" stroke="#ccc" />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Legend />
                      <Area type="monotone" dataKey="married" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} name="Married" />
                      <Area type="monotone" dataKey="single" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} name="Single" />
                      <Area type="monotone" dataKey="widowed" stackId="1" stroke={COLORS[2]} fill={COLORS[2]} name="Widowed" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="empty-state">
                <FiAlertCircle size={48} />
                <h3>No Data Available</h3>
                <p>Please upload data in the Data Management section.</p>
              </div>
            )}
          </div>
        )}

        {/* 🎓 EDUCATION & OCCUPATION DASHBOARD */}
        {activeTab === 'education-occupation' && (
          <div className="data-page">
            <div className="page-header">
              <h2><FiBookOpen /> Education & Occupation Dashboard</h2>
              <p>Skill profiles and work categories analysis</p>
            </div>

            {hasData ? (
              <div className="charts-grid">
                <ChartContainer 
                  title="Educational Attainment Levels" 
                  icon={<FiBarChart2 />}
                  className="full-width"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={educationDistributionData.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis type="number" stroke="#ccc" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120} 
                        stroke="#ccc"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Bar 
                        dataKey="value" 
                        fill={COLORS[3]} 
                        radius={[0, 4, 4, 0]}
                        name="Emigrants"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Top Occupations" 
                  icon={<FiBriefcase />}
                  className="full-width"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={occupationDistributionData.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis type="number" stroke="#ccc" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120} 
                        stroke="#ccc"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Bar 
                        dataKey="value" 
                        fill={COLORS[4]} 
                        radius={[0, 4, 4, 0]}
                        name="Emigrants"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Education Trends Over Time" 
                  icon={<FiTrendingUp />}
                  className="full-width"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={educationTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="year" stroke="#ccc" />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Legend />
                      <Bar dataKey="College" stackId="a" fill={COLORS[0]} name="College" />
                      <Bar dataKey="High School" stackId="a" fill={COLORS[1]} name="High School" />
                      <Bar dataKey="Elementary" stackId="a" fill={COLORS[2]} name="Elementary" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="empty-state">
                <FiAlertCircle size={48} />
                <h3>No Data Available</h3>
                <p>Please upload data in the Data Management section.</p>
              </div>
            )}
          </div>
        )}

        {/* 🗺️ GEOGRAPHIC DASHBOARD */}
        {activeTab === 'geographic' && (
          <div className="data-page">
            <div className="page-header">
              <h2><FiMap /> Geographic Dashboard</h2>
              <p>Origin and destination analysis</p>
            </div>

            {hasData ? (
              <div className="charts-grid">
                <ChartContainer 
                  title="Top Origin Provinces" 
                  icon={<FiMapPin />}
                  className="full-width"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={provinceDistributionData.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis type="number" stroke="#ccc" />
                      <YAxis 
                        type="category" 
                        dataKey="province" 
                        width={120} 
                        stroke="#ccc"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Bar 
                        dataKey="count" 
                        fill={COLORS[5]} 
                        radius={[0, 4, 4, 0]}
                        name="Emigrants"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Top Destination Countries" 
                  icon={<FiGlobe />}
                  className="full-width"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topCountriesData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="country" stroke="#ccc" angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
                      <Bar 
                        dataKey="count" 
                        fill={COLORS[0]} 
                        radius={[4, 4, 0, 0]}
                        name="Emigrants"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Origin Regions Distribution" 
                  icon={<FiPieChart />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={regionDistributionData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ region, percent }) => `${region}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {regionDistributionData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="empty-state">
                <FiAlertCircle size={48} />
                <h3>No Data Available</h3>
                <p>Please upload data in the Data Management section.</p>
              </div>
            )}
          </div>
        )}

        {/* 🔗 TRENDS & RELATIONSHIPS DASHBOARD */}
        {activeTab === 'trends-relationships' && (
          <div className="data-page">
            <div className="page-header">
              <h2><FiTrendingUp /> Trends & Relationships Dashboard</h2>
              <p>Long-term patterns and correlation analysis</p>
            </div>

            {hasData ? (
              <div className="charts-grid">
                <ChartContainer 
                  title="Migration Trends Over Time" 
                  icon={<FiTrendingUp />}
                  className="full-width"
                  filters={<YearRangeFilter />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filteredYearlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="year" stroke="#ccc" />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke={COLORS[0]} 
                        strokeWidth={3} 
                        dot={{ fill: COLORS[0] }}
                        name="Total Emigrants"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Gender Trends Over Time" 
                  icon={<FiUsers />}
                  className="full-width"
                  filters={<YearRangeFilter />}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filteredGenderTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="year" stroke="#ccc" />
                      <YAxis stroke="#ccc" />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="male" 
                        stroke={GENDER_COLORS[0]} 
                        strokeWidth={3}
                        name="Male"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="female" 
                        stroke={GENDER_COLORS[1]} 
                        strokeWidth={3}
                        name="Female"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer 
                  title="Education vs Occupation Relationship" 
                  icon={<FiActivity />}
                  className="full-width"
                >
                  <div className="relationship-chart">
                    <h4>Education Level Distribution by Major Occupation</h4>
                    <div className="relationship-grid">
                      {educationDistributionData.slice(0, 4).map(edu => (
                        <div key={edu.name} className="relationship-item">
                          <div className="relationship-label">{edu.name}</div>
                          <div className="relationship-bar">
                            <div 
                              className="relationship-fill"
                              style={{ 
                                width: `${(edu.value / educationDistributionData[0]?.value) * 100}%`,
                                backgroundColor: COLORS[3]
                              }}
                            ></div>
                          </div>
                          <div className="relationship-value">{edu.value.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartContainer>
              </div>
            ) : (
              <div className="empty-state">
                <FiAlertCircle size={48} />
                <h3>No Data Available</h3>
                <p>Please upload data in the Data Management section.</p>
              </div>
            )}
          </div>
        )}

        {/* ⚙️ DATA MANAGEMENT DASHBOARD */}
        {activeTab === 'data-management' && (
          <div className="data-page">
            <div className="page-header">
              <h2><FiDatabase /> Data Management</h2>
              <p>Upload CSV files and manage database records</p>
            </div>

            <div className="data-status-indicator">
              <div className="status-header">
                <FiDatabase />
                <span>Firebase Connection Status</span>
                <span style={{ color: '#10B981', marginLeft: 'auto' }}>✅ Connected</span>
              </div>
              <div className="status-grid">
                {dataTypes.map(dataType => (
                  <DataStatusBadge
                    key={dataType.value}
                    count={dataStats[dataType.value] || 0}
                    label={dataType.label}
                  />
                ))}
              </div>
            </div>

            <div className="management-sections">
              {/* CSV Upload Section */}
              <div className="management-section">
                <h3><FiDownload /> CSV Upload</h3>
                <p>Upload CSV files to populate Firebase collections</p>
                
                <div className="upload-grid">
                  {dataTypes.map((dataType) => (
                    <div key={dataType.value} className="upload-card">
                      <div className="upload-card-header">
                        <div className="upload-icon">{dataType.icon}</div>
                        <h4>{dataType.label}</h4>
                        <span className={`data-badge ${(dataStats[dataType.value] || 0) > 0 ? 'has-data' : 'no-data'}`}>
                          {dataStats[dataType.value] || 0} records
                        </span>
                      </div>
                      <div className="upload-card-actions">
                        <label className="file-input-label primary">
                          <FiUpload />
                          Upload CSV
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => handleFileUpload(e, dataType.value)}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button 
                          className="text-btn"
                          onClick={() => loadCollectionData(dataType.value)}
                        >
                          <FiEye />
                          View Data
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Data Entry Section */}
              <div className="management-section">
                <h3><FiPlus /> Manual Data Entry</h3>
                <p>Add individual records to the database</p>
                
                <div className="collection-selector">
                  <label>Select Collection:</label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                  >
                    {dataTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleManualEntry} className="modal-form">
                  <div className="form-grid">
                    {getCollectionFields(selectedCollection).map(field => (
                      <div key={field.name} className="form-group">
                        <label>
                          {field.label}
                          {field.required && <span className="required">*</span>}
                        </label>
                        
                        {field.type === 'select' ? (
                          <select
                            value={manualEntry[field.name] || ''}
                            onChange={(e) => setManualEntry({
                              ...manualEntry,
                              [field.name]: e.target.value
                            })}
                            required={field.required}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={manualEntry[field.name] || ''}
                            onChange={(e) => setManualEntry({
                              ...manualEntry,
                              [field.name]: field.type === 'number' 
                                ? parseInt(e.target.value) || 0 
                                : e.target.value
                            })}
                            min={field.min}
                            max={field.max}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="primary-btn" 
                      disabled={loading}
                    >
                      <FiSave />
                      {loading ? 'Adding...' : 'Add Record'}
                    </button>
                    <button 
                      type="button" 
                      className="secondary-btn"
                      onClick={() => loadCollectionData(selectedCollection)}
                    >
                      <FiEye />
                      View Existing Data
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Management Modal */}
      {showDataModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Manage {selectedCollection} Data</h3>
              <button className="close-btn" onClick={() => setShowDataModal(false)}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-actions">
              <button 
                className="danger-btn"
                onClick={() => handleDeleteAllData(selectedCollection)}
                disabled={loading}
              >
                <FiTrash2 />
                Delete All Data
              </button>
              <button 
                className="primary-btn"
                onClick={() => setEditingDocument({ id: null })}
              >
                <FiPlus />
                Add New Record
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    {getCollectionFields(selectedCollection)
                      .filter(field => field.name !== 'year')
                      .map(field => (
                        <th key={field.name}>{field.label}</th>
                      ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.year}</td>
                      {getCollectionFields(selectedCollection)
                        .filter(field => field.name !== 'year')
                        .map(field => (
                          <td key={field.name}>
                            {field.type === 'number' 
                              ? item[field.name]?.toLocaleString() 
                              : item[field.name]}
                          </td>
                        ))}
                      <td className="action-buttons">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditDocument(item)}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteDocument(item.id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {collectionData.length === 0 && (
                <div className="empty-table">
                  <FiAlertCircle />
                  <p>No data found in {selectedCollection}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {(editingDocument !== null) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingDocument.id ? 'Edit' : 'Add'} {selectedCollection} Record</h3>
              <button className="close-btn" onClick={() => setEditingDocument(null)}>
                <FiX />
              </button>
            </div>
            
            <form onSubmit={editingDocument.id ? handleUpdateDocument : handleManualEntry}>
              <div className="form-grid">
                {getCollectionFields(selectedCollection).map(field => (
                  <div key={field.name} className="form-group">
                    <label>
                      {field.label}
                      {field.required && <span className="required">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        value={manualEntry[field.name] || ''}
                        onChange={(e) => setManualEntry({
                          ...manualEntry,
                          [field.name]: e.target.value
                        })}
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={manualEntry[field.name] || ''}
                        onChange={(e) => setManualEntry({
                          ...manualEntry,
                          [field.name]: field.type === 'number' 
                            ? parseInt(e.target.value) || 0 
                            : e.target.value
                        })}
                        min={field.min}
                        max={field.max}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-btn"
                  onClick={() => setEditingDocument(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={loading}
                >
                  <FiSave />
                  {loading ? 'Saving...' : (editingDocument.id ? 'Update' : 'Add')} Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
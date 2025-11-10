import React, { useMemo, useState, useEffect } from 'react';
import { 
  FiUsers, FiGlobe, FiBarChart2,
  FiAlertCircle, FiMaximize, FiMinimize, FiRefreshCw
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, ResponsiveContainer, Cell
} from 'recharts';
import { getAllData, getReadStats, resetSession } from '../services/emigrantsService';
import "../css/Comparisons.css";

// 1. Grouped Bar Chart - Male vs Female by Year (with fixed tooltip)
const GenderComparisonChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    const { sexData } = data;
    if (!sexData?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      const yearlyTotals = {};
      sexData.forEach(item => {
        const year = item.YEAR || item.year;
        if (year && year >= 1981 && year <= 2020) {
          if (!yearlyTotals[year]) yearlyTotals[year] = { year, male: 0, female: 0 };
          yearlyTotals[year].male += Number(item.Male) || Number(item.male) || 0;
          yearlyTotals[year].female += Number(item.Female) || Number(item.female) || 0;
        }
      });
      
      filteredData = Object.values(yearlyTotals).sort((a, b) => a.year - b.year);
    } else {
      filteredData = sexData
        .filter(item => {
          const itemYear = item.YEAR || item.year;
          return itemYear === selectedYear;
        })
        .map(item => ({
          year: item.YEAR || item.year,
          male: Number(item.Male) || Number(item.male) || 0,
          female: Number(item.Female) || Number(item.female) || 0
        }));
    }

    return filteredData;
  }, [data, selectedYear]);

  const availableYears = useMemo(() => {
    if (!data?.sexData?.length) return [];
    return [...new Set(data.sexData.map(item => item.YEAR || item.year))].sort();
  }, [data]);

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...availableYears.map(year => ({ 
      value: year, 
      label: year.toString() 
    }))
  ];

  const YearDropdownFilter = () => (
    <div className="comparison-chart-filter">
      <label>Filter by Year:</label>
      <select 
        value={selectedYear} 
        onChange={(e) => onYearChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
      >
        {yearOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Custom tooltip for better formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="comparison-custom-tooltip">
          <p className="tooltip-label">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer 
      title="Male vs Female Emigrants" 
      icon={<FiUsers />}
      className="full-width-chart"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="year" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="male" 
            fill="#4A90E2" 
            name="Male"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="female" 
            fill="#E74C3C" 
            name="Female"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

// 2. Column Chart - Top Provinces vs Top Countries (Taller Container)
const ProvinceCountryComparison = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    const { placeOfOriginProvince, allCountries } = data;
    if (!placeOfOriginProvince?.length || !allCountries?.length) return [];

    let filteredProvinces = [];
    let filteredCountries = [];
    
    if (selectedYear === 'all') {
      filteredProvinces = placeOfOriginProvince;
      filteredCountries = allCountries;
    } else {
      filteredProvinces = placeOfOriginProvince.filter(item => {
        const itemYear = item.YEAR || item.year;
        return itemYear === selectedYear;
      });
      filteredCountries = allCountries.filter(item => {
        const itemYear = item.YEAR || item.year;
        return itemYear === selectedYear;
      });
    }

    const provinceCounts = {};
    filteredProvinces.forEach(item => {
      const province = item.Province || item.province || 'Unknown';
      const count = Number(item.Count) || Number(item.count) || 0;
      provinceCounts[province] = (provinceCounts[province] || 0) + count;
    });
    const topProvinces = Object.entries(provinceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([province, count]) => ({ name: province, count, type: 'Origin Province' }));

    const countryCounts = {};
    filteredCountries.forEach(item => {
      const country = item.Country || item.country || 'Unknown';
      const count = Number(item.Count) || Number(item.count) || 0;
      countryCounts[country] = (countryCounts[country] || 0) + count;
    });
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ name: country, count, type: 'Destination Country' }));

    return [...topProvinces, ...topCountries];
  }, [data, selectedYear]);

  const availableYears = useMemo(() => {
    if (!data?.placeOfOriginProvince?.length) return [];
    return [...new Set(data.placeOfOriginProvince.map(item => item.YEAR || item.year))].sort();
  }, [data]);

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...availableYears.map(year => ({ 
      value: year, 
      label: year.toString() 
    }))
  ];

  const YearDropdownFilter = () => (
    <div className="comparison-chart-filter">
      <label>Filter by Year:</label>
      <select 
        value={selectedYear} 
        onChange={(e) => onYearChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
      >
        {yearOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Custom tooltip for better formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="comparison-custom-tooltip">
          <p className="tooltip-label">{`${payload[0].payload.type}: ${label}`}</p>
          <p className="tooltip-item">{`Emigrants: ${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer 
      title="Top Provinces vs Top Destinations" 
      icon={<FiGlobe />}
      className="extra-tall-chart"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={450}>
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="name" 
            stroke="#ccc" 
            angle={-45}
            textAnchor="end"
            height={90}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#ccc" />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[2, 2, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.type === 'Origin Province' ? '#4A90E2' : '#F5A623'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

// Chart Container Component
const ChartContainer = React.memo(({ 
  title, 
  children, 
  className = "", 
  icon, 
  onFullscreen,
  filters 
}) => (
  <div className={`comparison-chart-card ${className}`}>
    <div className="comparison-chart-header">
      <div className="comparison-chart-title">
        {icon && <span className="comparison-chart-icon">{icon}</span>}
        <h4>{title}</h4>
      </div>
      <div className="comparison-chart-controls">
        {filters}
        <button 
          className="comparison-fullscreen-btn"
          onClick={onFullscreen}
          title="Toggle fullscreen"
        >
          <FiMaximize />
        </button>
      </div>
    </div>
    <div className="comparison-chart-content">
      {children}
    </div>
  </div>
));

// Full Screen Component
const FullScreenChart = React.memo(({ title, children, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="comparison-fullscreen-overlay">
      <div className="comparison-fullscreen-container">
        <div className="comparison-fullscreen-header">
          <h3>{title}</h3>
          <button className="comparison-close-fullscreen" onClick={onClose}>
            <FiMinimize /> Close
          </button>
        </div>
        <div className="comparison-fullscreen-content">
          {children}
        </div>
      </div>
    </div>
  );
});

// Full Screen Content Components
const FullScreenGenderChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    const { sexData } = data;
    if (!sexData?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      const yearlyTotals = {};
      sexData.forEach(item => {
        const year = item.YEAR || item.year;
        if (year && year >= 1981 && year <= 2020) {
          if (!yearlyTotals[year]) yearlyTotals[year] = { year, male: 0, female: 0 };
          yearlyTotals[year].male += Number(item.Male) || Number(item.male) || 0;
          yearlyTotals[year].female += Number(item.Female) || Number(item.female) || 0;
        }
      });
      filteredData = Object.values(yearlyTotals).sort((a, b) => a.year - b.year);
    } else {
      filteredData = sexData
        .filter(item => {
          const itemYear = item.YEAR || item.year;
          return itemYear === selectedYear;
        })
        .map(item => ({
          year: item.YEAR || item.year,
          male: Number(item.Male) || Number(item.male) || 0,
          female: Number(item.Female) || Number(item.female) || 0
        }));
    }

    return filteredData;
  }, [data, selectedYear]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="comparison-custom-tooltip">
          <p className="tooltip-label">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="male" 
          fill="#4A90E2" 
          name="Male"
          radius={[2, 2, 0, 0]}
        />
        <Bar 
          dataKey="female" 
          fill="#E74C3C" 
          name="Female"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

const FullScreenProvinceCountry = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    const { placeOfOriginProvince, allCountries } = data;
    if (!placeOfOriginProvince?.length || !allCountries?.length) return [];

    let filteredProvinces = [];
    let filteredCountries = [];
    
    if (selectedYear === 'all') {
      filteredProvinces = placeOfOriginProvince;
      filteredCountries = allCountries;
    } else {
      filteredProvinces = placeOfOriginProvince.filter(item => {
        const itemYear = item.YEAR || item.year;
        return itemYear === selectedYear;
      });
      filteredCountries = allCountries.filter(item => {
        const itemYear = item.YEAR || item.year;
        return itemYear === selectedYear;
      });
    }

    const provinceCounts = {};
    filteredProvinces.forEach(item => {
      const province = item.Province || item.province || 'Unknown';
      const count = Number(item.Count) || Number(item.count) || 0;
      provinceCounts[province] = (provinceCounts[province] || 0) + count;
    });
    const topProvinces = Object.entries(provinceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([province, count]) => ({ name: province, count, type: 'Origin Province' }));

    const countryCounts = {};
    filteredCountries.forEach(item => {
      const country = item.Country || item.country || 'Unknown';
      const count = Number(item.Count) || Number(item.count) || 0;
      countryCounts[country] = (countryCounts[country] || 0) + count;
    });
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ name: country, count, type: 'Destination Country' }));

    return [...topProvinces, ...topCountries];
  }, [data, selectedYear]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="comparison-custom-tooltip">
          <p className="tooltip-label">{`${payload[0].payload.type}: ${label}`}</p>
          <p className="tooltip-item">{`Emigrants: ${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart 
        data={chartData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="name" 
          stroke="#ccc" 
          angle={-45}
          textAnchor="end"
          height={90}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis stroke="#ccc" />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="count" 
          radius={[2, 2, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.type === 'Origin Province' ? '#4A90E2' : '#F5A623'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// Main Comparisons Page Component
const ComparisonsPage = () => {
  const [rawData, setRawData] = useState({ 
    sexData: [], 
    educationData: [], 
    occupationData: [], 
    placeOfOriginProvince: [], 
    allCountries: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readStats, setReadStats] = useState({ current: 0, max: 0, remaining: 0 });
  const [fullScreenChart, setFullScreenChart] = useState(null);

  const [chartFilters, setChartFilters] = useState({
    genderComparison: { year: 'all' },
    provinceCountryComparison: { year: 'all' }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllData();
      setRawData(data || { 
        sexData: [], 
        educationData: [], 
        occupationData: [], 
        placeOfOriginProvince: [], 
        allCountries: [] 
      });
      
      const stats = getReadStats();
      setReadStats(stats);
      
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleResetSession = () => {
    resetSession();
    fetchData();
  };

  const updateGenderComparisonFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      genderComparison: { year }
    }));
  };

  const updateProvinceCountryComparisonFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      provinceCountryComparison: { year }
    }));
  };

  const handleFullscreenToggle = (chartTitle) => {
    setFullScreenChart(fullScreenChart === chartTitle ? null : chartTitle);
  };

  const renderFullScreenContent = () => {
    switch (fullScreenChart) {
      case "Male vs Female Emigrants":
        return <FullScreenGenderChart data={rawData} selectedYear={chartFilters.genderComparison.year} />;
      case "Top Provinces vs Top Destinations":
        return <FullScreenProvinceCountry data={rawData} selectedYear={chartFilters.provinceCountryComparison.year} />;
      default:
        return <div>Full screen view for {fullScreenChart}</div>;
    }
  };

  const hasComparisonData = useMemo(() => {
    return Object.values(rawData).some(data => data?.length > 0);
  }, [rawData]);

  if (loading) {
    return (
      <div className="comparisons-page">
        <div className="comparisons-loading">
          <FiRefreshCw className="comparison-spinner" size={48} />
          <h3>Loading Comparison Data...</h3>
          <p>Fetching data from Firebase</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comparisons-page">
        <div className="comparisons-empty-state">
          <FiAlertCircle size={48} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <div className="comparisons-empty-state-actions">
            <button onClick={handleRefresh} className="primary-btn">
              <FiRefreshCw /> Try Again
            </button>
            {error.includes('quota') && (
              <button onClick={handleResetSession} className="secondary-btn">
                Reset Session
              </button>
            )}
          </div>
          <div className="comparisons-read-stats">
            <small>Reads: {readStats.current}/{readStats.max} (Remaining: {readStats.remaining})</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comparisons-page">
      {/* Full Screen Chart Overlay */}
      <FullScreenChart 
        title={fullScreenChart}
        onClose={() => setFullScreenChart(null)}
        isOpen={!!fullScreenChart}
      >
        {renderFullScreenContent()}
      </FullScreenChart>

      {/* Scrollable Content - Everything scrolls together */}
      <div className="comparisons-scrollable-content">
        <div className="comparisons-header">
          <h2><FiBarChart2 /> Data Comparisons</h2>
          <p>Compare gender distribution and geographic patterns of emigration</p>
          <div className="comparisons-header-actions">
            <button onClick={handleRefresh} className="secondary-btn">
              <FiRefreshCw /> Refresh Data
            </button>
            <div className="comparisons-stat-badge">
              {Object.values(rawData).reduce((sum, data) => sum + (data?.length || 0), 0)} Records • {readStats.remaining} Reads Left
            </div>
          </div>
        </div>

        {hasComparisonData ? (
          <div className={`comparisons-charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
            <GenderComparisonChart 
              data={rawData}
              selectedYear={chartFilters.genderComparison.year}
              onYearChange={updateGenderComparisonFilter}
              onFullscreen={() => handleFullscreenToggle("Male vs Female Emigrants")}
            />
            
            <ProvinceCountryComparison 
              data={rawData}
              selectedYear={chartFilters.provinceCountryComparison.year}
              onYearChange={updateProvinceCountryComparisonFilter}
              onFullscreen={() => handleFullscreenToggle("Top Provinces vs Top Destinations")}
            />
          </div>
        ) : (
          <div className="comparisons-empty-state">
            <FiAlertCircle size={48} />
            <h3>No Data Available for Comparisons</h3>
            <p>Please upload data files in the Data Management section to see comparisons.</p>
            <div className="comparisons-empty-state-actions">
              <button onClick={handleRefresh} className="primary-btn">
                <FiRefreshCw /> Check Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ComparisonsPage);
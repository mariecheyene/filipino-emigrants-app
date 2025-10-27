import React, { useMemo, useState, useEffect } from 'react';
import { 
  FiUsers, FiTrendingUp, FiGlobe,
  FiAlertCircle, FiMaximize, FiMinimize, FiRefreshCw
} from 'react-icons/fi';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, 
  CartesianGrid, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { getAllData, getReadStats, resetSession } from '../services/emigrantsService';

// 1. Grouped Bar Chart - Male vs Female by Year
const GenderComparisonChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    const { sexData } = data;
    if (!sexData?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      // Show all years aggregated
      const yearlyTotals = {};
      sexData.forEach(item => {
        const year = item.YEAR || item.year;
        if (year && year >= 1981 && year <= 2020) {
          if (!yearlyTotals[year]) yearlyTotals[year] = { year, male: 0, female: 0 };
          yearlyTotals[year].male += Number(item.Male) || Number(item.male) || 0;
          yearlyTotals[year].female += Number(item.Female) || Number(item.female) || 0;
        }
      });
      
      // Convert to array and sort by year
      filteredData = Object.values(yearlyTotals).sort((a, b) => a.year - b.year);
    } else {
      // Show data for selected year
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

  // Get available years from data
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
    <div className="chart-filter">
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

  return (
    <ChartContainer 
      title="Male vs Female Emigrants" 
      icon={<FiUsers />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="year" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
          <Legend />
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

// 2. Dual Line Chart - Education vs Occupation Trend
const EducationOccupationTrend = React.memo(({ data, yearRange, onYearRangeChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    const { educationData, occupationData } = data;
    if (!educationData?.length || !occupationData?.length) return [];

    const yearlyData = {};
    
    // Process education data
    educationData.forEach(item => {
      const year = item.YEAR || item.year;
      if (year && year >= 1981 && year <= 2020) {
        if (!yearlyData[year]) yearlyData[year] = { year, education: 0, occupation: 0 };
        yearlyData[year].education += Number(item.Count) || Number(item.count) || 0;
      }
    });

    // Process occupation data
    occupationData.forEach(item => {
      const year = item.YEAR || item.year;
      if (year && year >= 1981 && year <= 2020) {
        if (!yearlyData[year]) yearlyData[year] = { year, education: 0, occupation: 0 };
        yearlyData[year].occupation += Number(item.Count) || Number(item.count) || 0;
      }
    });

    const result = [];
    for (let year = 1981; year <= 2020; year++) {
      if (yearlyData[year]) {
        result.push(yearlyData[year]);
      } else {
        result.push({ year, education: 0, occupation: 0 });
      }
    }
    
    return result.filter(item => 
      item.year >= yearRange[0] && item.year <= yearRange[1]
    ).sort((a, b) => a.year - b.year);
  }, [data, yearRange]);

  const YearRangeFilter = () => (
    <div className="chart-filter">
      <label>View Years:</label>
      <div className="range-inputs">
        <input
          type="number"
          value={yearRange[0]}
          onChange={(e) => onYearRangeChange([parseInt(e.target.value) || 1981, yearRange[1]])}
          min="1981"
          max="2020"
        />
        <span>to</span>
        <input
          type="number"
          value={yearRange[1]}
          onChange={(e) => onYearRangeChange([yearRange[0], parseInt(e.target.value) || 2020])}
          min="1981"
          max="2020"
        />
      </div>
    </div>
  );

  return (
    <ChartContainer 
      title="Education vs Occupation Trend" 
      icon={<FiTrendingUp />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={<YearRangeFilter />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="year" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="education" 
            stroke="#4A90E2" 
            strokeWidth={3}
            name="Educated Emigrants"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="occupation" 
            stroke="#F5A623" 
            strokeWidth={3}
            name="Employed Emigrants"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

// 3. Column Chart - Top Provinces vs Top Countries
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

    // Get top 5 provinces
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

    // Get top 5 countries
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

  // Get available years from data
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
    <div className="chart-filter">
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

  return (
    <ChartContainer 
      title="Top Provinces vs Top Destinations" 
      icon={<FiGlobe />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="name" 
            stroke="#ccc" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#ccc" />
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
          <Legend />
          <Bar 
            dataKey="count" 
            name="Emigrants"
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
  <div className={`chart-card ${className}`}>
    <div className="chart-header">
      <div className="chart-title">
        {icon && <span className="chart-icon">{icon}</span>}
        <h4>{title}</h4>
      </div>
      <div className="chart-controls">
        {filters}
        <button 
          className="fullscreen-btn"
          onClick={onFullscreen}
          title="Toggle fullscreen"
        >
          <FiMaximize />
        </button>
      </div>
    </div>
    <div className="chart-content">
      {children}
    </div>
  </div>
));

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

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        <Legend />
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

const FullScreenEducationOccupation = React.memo(({ data, yearRange }) => {
  const chartData = useMemo(() => {
    const { educationData, occupationData } = data;
    if (!educationData?.length || !occupationData?.length) return [];

    const yearlyData = {};
    
    educationData.forEach(item => {
      const year = item.YEAR || item.year;
      if (year && year >= 1981 && year <= 2020) {
        if (!yearlyData[year]) yearlyData[year] = { year, education: 0, occupation: 0 };
        yearlyData[year].education += Number(item.Count) || Number(item.count) || 0;
      }
    });

    occupationData.forEach(item => {
      const year = item.YEAR || item.year;
      if (year && year >= 1981 && year <= 2020) {
        if (!yearlyData[year]) yearlyData[year] = { year, education: 0, occupation: 0 };
        yearlyData[year].occupation += Number(item.Count) || Number(item.count) || 0;
      }
    });

    const result = [];
    for (let year = 1981; year <= 2020; year++) {
      if (yearlyData[year]) {
        result.push(yearlyData[year]);
      } else {
        result.push({ year, education: 0, occupation: 0 });
      }
    }
    
    return result.filter(item => 
      item.year >= yearRange[0] && item.year <= yearRange[1]
    ).sort((a, b) => a.year - b.year);
  }, [data, yearRange]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="education" 
          stroke="#4A90E2" 
          strokeWidth={3}
          name="Educated Emigrants"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="occupation" 
          stroke="#F5A623" 
          strokeWidth={3}
          name="Employed Emigrants"
          dot={false}
        />
      </LineChart>
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

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="name" 
          stroke="#ccc" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#ccc" />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
        <Legend />
        <Bar 
          dataKey="count" 
          name="Emigrants"
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

// Full Screen Component
const FullScreenChart = React.memo(({ title, children, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fullscreen-chart-overlay">
      <div className="fullscreen-chart-container">
        <div className="fullscreen-chart-header">
          <h3>{title}</h3>
          <button className="close-fullscreen" onClick={onClose}>
            <FiMinimize /> Close
          </button>
        </div>
        <div className="fullscreen-chart-content">
          {children}
        </div>
      </div>
    </div>
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

  // Individual chart filters
  const [chartFilters, setChartFilters] = useState({
    genderComparison: { year: 'all' },
    educationOccupationTrend: { yearRange: [1981, 2020] },
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

  // Individual chart filter handlers
  const updateGenderComparisonFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      genderComparison: { year }
    }));
  };

  const updateEducationOccupationTrendFilter = (yearRange) => {
    setChartFilters(prev => ({
      ...prev,
      educationOccupationTrend: { yearRange }
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
      case "Education vs Occupation Trend":
        return <FullScreenEducationOccupation data={rawData} yearRange={chartFilters.educationOccupationTrend.yearRange} />;
      case "Top Provinces vs Top Destinations":
        return <FullScreenProvinceCountry data={rawData} selectedYear={chartFilters.provinceCountryComparison.year} />;
      default:
        return <div>Full screen view for {fullScreenChart}</div>;
    }
  };

  // Check if we have data for comparisons
  const hasComparisonData = useMemo(() => {
    return Object.values(rawData).some(data => data?.length > 0);
  }, [rawData]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <FiRefreshCw className="spinner" size={48} />
          <h3>Loading Comparison Data...</h3>
          <p>Fetching data from Firebase</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="empty-state">
          <FiAlertCircle size={48} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <div className="empty-state-actions">
            <button onClick={handleRefresh} className="primary-btn">
              <FiRefreshCw /> Try Again
            </button>
            {error.includes('quota') && (
              <button onClick={handleResetSession} className="secondary-btn">
                Reset Session
              </button>
            )}
          </div>
          <div className="read-stats">
            <small>Reads: {readStats.current}/{readStats.max} (Remaining: {readStats.remaining})</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2><FiTrendingUp /> Data Comparisons</h2>
        <p>Compare different aspects of emigration data with clear, simple visualizations</p>
        <div className="header-actions">
          <button onClick={handleRefresh} className="secondary-btn">
            <FiRefreshCw /> Refresh Data
          </button>
          <div className="stats">
            <span className="stat-badge">
              {Object.values(rawData).reduce((sum, data) => sum + (data?.length || 0), 0)} Records • {readStats.remaining} Reads Left
            </span>
          </div>
        </div>
      </div>

      {hasComparisonData ? (
        <>
          {/* Full Screen Chart Overlay */}
          <FullScreenChart 
            title={fullScreenChart}
            onClose={() => setFullScreenChart(null)}
            isOpen={!!fullScreenChart}
          >
            {renderFullScreenContent()}
          </FullScreenChart>

          {/* Charts Grid with Individual Filters - Now only 3 charts */}
          <div className={`charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
            <GenderComparisonChart 
              data={rawData}
              selectedYear={chartFilters.genderComparison.year}
              onYearChange={updateGenderComparisonFilter}
              onFullscreen={() => handleFullscreenToggle("Male vs Female Emigrants")}
            />
            
            <EducationOccupationTrend 
              data={rawData}
              yearRange={chartFilters.educationOccupationTrend.yearRange}
              onYearRangeChange={updateEducationOccupationTrendFilter}
              onFullscreen={() => handleFullscreenToggle("Education vs Occupation Trend")}
            />
            
            <ProvinceCountryComparison 
              data={rawData}
              selectedYear={chartFilters.provinceCountryComparison.year}
              onYearChange={updateProvinceCountryComparisonFilter}
              onFullscreen={() => handleFullscreenToggle("Top Provinces vs Top Destinations")}
            />
          </div>
        </>
      ) : (
        <div className="empty-state">
          <FiAlertCircle size={48} />
          <h3>No Data Available for Comparisons</h3>
          <p>Please upload data files in the Data Management section to see comparisons.</p>
          <button onClick={handleRefresh} className="primary-btn">
            <FiRefreshCw /> Check Again
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ComparisonsPage);
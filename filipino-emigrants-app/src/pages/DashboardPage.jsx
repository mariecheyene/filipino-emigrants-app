import React, { useMemo, useState } from 'react';
import { 
  FiUsers, FiMapPin, FiGlobe, FiActivity,
  FiTrendingUp, FiPieChart, FiFileText,
  FiAlertCircle, FiMaximize, FiMinimize
} from 'react-icons/fi';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, 
  ResponsiveContainer, Cell 
} from 'recharts';
import "../css/Dashboard.css";

// Individual Chart Components with React.memo
const TrendsChart = React.memo(({ data, yearRange, onYearRangeChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.sexData?.length && !data?.civilStatus?.length) return [];

    const yearlyTotals = {};
    
    // Use available data sources
    if (data.sexData && data.sexData.length > 0) {
      data.sexData.forEach(item => {
        const year = item.year;
        if (year && year >= 1981 && year <= 2020) {
          const count = (Number(item.male) || 0) + (Number(item.female) || 0);
          yearlyTotals[year] = (yearlyTotals[year] || 0) + count;
        }
      });
    }

    // Generate data for all years
    const allYearsData = [];
    for (let year = 1981; year <= 2020; year++) {
      allYearsData.push({ year, total: yearlyTotals[year] || 0 });
    }
    
    // Filter to show only the selected range
    return allYearsData.filter(item => 
      item.year >= yearRange[0] && item.year <= yearRange[1]
    );
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
      title="Migration Trends Over Time" 
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
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#4A90E2" 
            strokeWidth={3} 
            dot={{ fill: "#4A90E2" }}
            name="Total Emigrants"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const GenderChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.sexData?.length) return [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data.sexData;
    } else {
      filteredData = data.sexData.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }];
    
    const totals = { male: 0, female: 0 };
    filteredData.forEach(item => {
      totals.male += Number(item.male) || 0;
      totals.female += Number(item.female) || 0;
    });

    return [
      { name: 'Male', value: totals.male },
      { name: 'Female', value: totals.female }
    ];
  }, [data, selectedYear]);

  const yearOptions = [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...Array.from({ length: 40 }, (_, i) => ({ 
      value: 1981 + i, 
      label: (1981 + i).toString() 
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
      title="Gender Composition" 
      icon={<FiPieChart />}
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#4A90E2' : '#E74C3C'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const CountriesChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.allCountries?.length) return [];
    
    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data.allCountries;
    } else {
      filteredData = data.allCountries.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const countries = {};
    filteredData.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || 0;
      countries[country] = (countries[country] || 0) + count;
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data, selectedYear]);

  const yearOptions = [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...Array.from({ length: 40 }, (_, i) => ({ 
      value: 1981 + i, 
      label: (1981 + i).toString() 
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
      title="Top Destination Countries" 
      icon={<FiGlobe />}
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
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
            fill="#F5A623" 
            radius={[0, 4, 4, 0]}
            name="Emigrants"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const RegionsChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.placeOfOrigin?.length) return [];
    
    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data.placeOfOrigin;
    } else {
      filteredData = data.placeOfOrigin.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const regions = {};
    filteredData.forEach(item => {
      const region = item.region || 'Unknown';
      const count = Number(item.count) || 0;
      regions[region] = (regions[region] || 0) + count;
    });

    return Object.entries(regions)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [data, selectedYear]);

  const yearOptions = [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...Array.from({ length: 40 }, (_, i) => ({ 
      value: 1981 + i, 
      label: (1981 + i).toString() 
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

  const REGION_COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505'];

  return (
    <ChartContainer 
      title="Regional Distribution" 
      icon={<FiMapPin />}
      className="regional-distribution"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="region" 
            stroke="#ccc" 
            angle={-45} 
            textAnchor="end" 
            height={60}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#ccc" />
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
          <Bar 
            dataKey="count" 
            fill="#7ED321" 
            radius={[4, 4, 0, 0]}
            name="Emigrants"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
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

// KPI Card Component
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

// Data Status Badge Component
const DataStatusBadge = React.memo(({ count, label }) => (
  <div className={`data-status-badge ${count > 0 ? 'has-data' : 'no-data'}`}>
    <div className="status-indicator"></div>
    <span className="status-label">{label}</span>
    <span className="status-count">{count} records</span>
  </div>
));

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

// Full Screen Content Components
const FullScreenTrendsChart = React.memo(({ data, yearRange }) => {
  const chartData = useMemo(() => {
    if (!data?.sexData?.length && !data?.civilStatus?.length) return [];

    const yearlyTotals = {};
    
    if (data.sexData && data.sexData.length > 0) {
      data.sexData.forEach(item => {
        const year = item.year;
        if (year && year >= 1981 && year <= 2020) {
          const count = (Number(item.male) || 0) + (Number(item.female) || 0);
          yearlyTotals[year] = (yearlyTotals[year] || 0) + count;
        }
      });
    }

    const allYearsData = [];
    for (let year = 1981; year <= 2020; year++) {
      allYearsData.push({ year, total: yearlyTotals[year] || 0 });
    }
    
    return allYearsData.filter(item => 
      item.year >= yearRange[0] && item.year <= yearRange[1]
    );
  }, [data, yearRange]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#4A90E2" 
          strokeWidth={3} 
          dot={{ fill: "#4A90E2" }}
          name="Total Emigrants"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

const FullScreenGenderChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.sexData?.length) return [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data.sexData;
    } else {
      filteredData = data.sexData.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }];
    
    const totals = { male: 0, female: 0 };
    filteredData.forEach(item => {
      totals.male += Number(item.male) || 0;
      totals.female += Number(item.female) || 0;
    });

    return [
      { name: 'Male', value: totals.male },
      { name: 'Female', value: totals.female }
    ];
  }, [data, selectedYear]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={150}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === 0 ? '#4A90E2' : '#E74C3C'} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
});

const FullScreenCountriesChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.allCountries?.length) return [];
    
    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data.allCountries;
    } else {
      filteredData = data.allCountries.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const countries = {};
    filteredData.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || 0;
      countries[country] = (countries[country] || 0) + count;
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Show more countries in full screen
  }, [data, selectedYear]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis type="number" stroke="#ccc" />
        <YAxis 
          type="category" 
          dataKey="country" 
          width={120} 
          stroke="#ccc"
          tick={{ fontSize: 14 }}
        />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
        <Legend />
        <Bar 
          dataKey="count" 
          fill="#F5A623" 
          radius={[0, 4, 4, 0]}
          name="Emigrants"
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

const FullScreenRegionsChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.placeOfOrigin?.length) return [];
    
    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data.placeOfOrigin;
    } else {
      filteredData = data.placeOfOrigin.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const regions = {};
    filteredData.forEach(item => {
      const region = item.region || 'Unknown';
      const count = Number(item.count) || 0;
      regions[region] = (regions[region] || 0) + count;
    });

    return Object.entries(regions)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [data, selectedYear]);

  const REGION_COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="region" 
          stroke="#ccc" 
          angle={-45} 
          textAnchor="end" 
          height={80}
          interval={0}
          tick={{ fontSize: 14 }}
        />
        <YAxis stroke="#ccc" />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
        <Legend />
        <Bar 
          dataKey="count" 
          fill="#7ED321" 
          radius={[4, 4, 0, 0]}
          name="Emigrants"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// Main Dashboard Component
const DashboardPage = ({ 
  dataStats = {}, 
  filters = {}, 
  handleFilterChange = () => {}, 
  rawData = {},
  dataTypes = []
}) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [chartFilters, setChartFilters] = useState({
    trends: { yearRange: [1981, 2020] },
    gender: { year: 'all' },
    countries: { year: 'all' },
    regions: { year: 'all' }
  });

  // Safe data access with defaults
  const safeRawData = useMemo(() => ({
    civilStatus: rawData?.civilStatus || [],
    sexData: rawData?.sexData || [],
    ageData: rawData?.ageData || [],
    educationData: rawData?.educationData || [],
    occupationData: rawData?.occupationData || [],
    placeOfOrigin: rawData?.placeOfOrigin || [],
    placeOfOriginProvince: rawData?.placeOfOriginProvince || [],
    allCountries: rawData?.allCountries || [],
    majorCountries: rawData?.majorCountries || []
  }), [rawData]);

  // Check if we have ANY data available
  const hasAnyData = useMemo(() => {
    const totalRecords = Object.values(safeRawData).reduce((sum, data) => sum + (data?.length || 0), 0);
    return totalRecords > 0;
  }, [safeRawData]);

  // Process overall data for KPI cards (Cumulative 1981-2020)
  const overallData = useMemo(() => {
    const { sexData, civilStatus, allCountries, placeOfOriginProvince, placeOfOrigin } = safeRawData;
    
    let totalEmigrants = 0;
    
    if (sexData && sexData.length > 0) {
      totalEmigrants = sexData.reduce((sum, item) => {
        return sum + (Number(item.male) || 0) + (Number(item.female) || 0);
      }, 0);
    } else if (civilStatus && civilStatus.length > 0) {
      totalEmigrants = civilStatus.reduce((sum, item) => {
        return sum + (Number(item.single) || 0) + (Number(item.married) || 0) + 
               (Number(item.widowed) || 0) + (Number(item.divorced) || 0) + 
               (Number(item.notReported) || 0);
      }, 0);
    }

    let topDestination = 'No data';
    if (allCountries && allCountries.length > 0) {
      const countries = {};
      allCountries.forEach(item => {
        const country = item.country || 'Unknown';
        const count = Number(item.count) || 0;
        countries[country] = (countries[country] || 0) + count;
      });
      const sorted = Object.entries(countries).sort((a, b) => b[1] - a[1]);
      topDestination = sorted[0]?.[0] || 'No data';
    }

    let topOriginProvince = 'No data';
    if (placeOfOriginProvince && placeOfOriginProvince.length > 0) {
      const provinces = {};
      placeOfOriginProvince.forEach(item => {
        const province = item.province || 'Unknown';
        const count = Number(item.count) || 0;
        provinces[province] = (provinces[province] || 0) + count;
      });
      const sorted = Object.entries(provinces).sort((a, b) => b[1] - a[1]);
      topOriginProvince = sorted[0]?.[0] || 'No data';
    }

    let topRegion = 'No data';
    if (placeOfOrigin && placeOfOrigin.length > 0) {
      const regions = {};
      placeOfOrigin.forEach(item => {
        const region = item.region || 'Unknown';
        const count = Number(item.count) || 0;
        regions[region] = (regions[region] || 0) + count;
      });
      const sorted = Object.entries(regions).sort((a, b) => b[1] - a[1]);
      topRegion = sorted[0]?.[0] || 'No data';
    }

    return {
      totalEmigrants,
      topDestination,
      topOriginProvince,
      topRegion
    };
  }, [safeRawData]);

  // Individual chart filter handlers
  const updateTrendsFilter = (yearRange) => {
    setChartFilters(prev => ({
      ...prev,
      trends: { yearRange }
    }));
  };

  const updateGenderFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      gender: { year }
    }));
  };

  const updateCountriesFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      countries: { year }
    }));
  };

  const updateRegionsFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      regions: { year }
    }));
  };

  const handleFullscreenToggle = (chartTitle) => {
    setFullScreenChart(fullScreenChart === chartTitle ? null : chartTitle);
  };

  const renderFullScreenContent = () => {
    switch (fullScreenChart) {
      case "Migration Trends Over Time":
        return <FullScreenTrendsChart data={safeRawData} yearRange={chartFilters.trends.yearRange} />;
      case "Gender Composition":
        return <FullScreenGenderChart data={safeRawData} selectedYear={chartFilters.gender.year} />;
      case "Top Destination Countries":
        return <FullScreenCountriesChart data={safeRawData} selectedYear={chartFilters.countries.year} />;
      case "Regional Distribution":
        return <FullScreenRegionsChart data={safeRawData} selectedYear={chartFilters.regions.year} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      {/* Header Section - Fixed */}
      <div className="dashboard-header">
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

        {/* KPI Cards - Overall Data (No Filters) */}
        <div className="kpi-grid">
          <KpiCard 
            title="Total Emigrants" 
            value={overallData.totalEmigrants} 
            icon={<FiUsers />}
            color="#4A90E2"
            subtitle="1981-2020"
          />
          <KpiCard 
            title="Top Origin Province" 
            value={overallData.topOriginProvince} 
            icon={<FiMapPin />}
            color="#7ED321"
            subtitle="All Years"
          />
          <KpiCard 
            title="Top Destination Country" 
            value={overallData.topDestination} 
            icon={<FiGlobe />}
            color="#F5A623"
            subtitle="All Years"
          />
          <KpiCard 
            title="Top Region" 
            value={overallData.topRegion} 
            icon={<FiActivity />}
            color="#BD10E0"
            subtitle="All Years"
          />
        </div>
      </div>

      {/* Charts Section - Scrollable */}
      <div className="charts-container">
        {hasAnyData ? (
          <div className={`charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
            {/* Top Row: Full width charts */}
            <TrendsChart 
              data={safeRawData}
              yearRange={chartFilters.trends.yearRange}
              onYearRangeChange={updateTrendsFilter}
              onFullscreen={() => handleFullscreenToggle("Migration Trends Over Time")}
            />
            
            <RegionsChart 
              data={safeRawData}
              selectedYear={chartFilters.regions.year}
              onYearChange={updateRegionsFilter}
              onFullscreen={() => handleFullscreenToggle("Regional Distribution")}
            />

            {/* Bottom Row: Smaller charts */}
            <GenderChart 
              data={safeRawData}
              selectedYear={chartFilters.gender.year}
              onYearChange={updateGenderFilter}
              onFullscreen={() => handleFullscreenToggle("Gender Composition")}
            />
            
            <CountriesChart 
              data={safeRawData}
              selectedYear={chartFilters.countries.year}
              onYearChange={updateCountriesFilter}
              onFullscreen={() => handleFullscreenToggle("Top Destination Countries")}
            />
          </div>
        ) : (
          <div className="empty-state">
            <FiAlertCircle size={48} />
            <h3>No Data Available</h3>
            <p>Please upload data in the Data Management section.</p>
          </div>
        )}
      </div>

      {/* Full Screen Chart Overlay */}
      <FullScreenChart 
        title={fullScreenChart}
        onClose={() => setFullScreenChart(null)}
        isOpen={!!fullScreenChart}
      >
        {renderFullScreenContent()}
      </FullScreenChart>
    </div>
  );
};

export default React.memo(DashboardPage);
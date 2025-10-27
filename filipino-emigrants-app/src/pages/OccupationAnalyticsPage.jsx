import React, { useMemo, useState } from 'react';
import { 
  FiBriefcase, FiAlertCircle, FiPieChart, FiBarChart2, 
  FiMaximize, FiMinimize, FiTrendingUp
} from 'react-icons/fi';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ResponsiveContainer, Cell 
} from 'recharts';
import '../css/OccupationAnalytics.css';

// Individual Chart Components
const TopOccupationsChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.occupationData?.length) return [];
    
    let filteredData = selectedYear === 'all' 
      ? data.occupationData 
      : data.occupationData.filter(item => item.year === selectedYear);

    if (!filteredData.length) return [];
    
    const occupations = {};
    filteredData.forEach(item => {
      const occupation = item.occupation || item.job || 'Unknown';
      const count = Number(item.count) || 0;
      occupations[occupation] = (occupations[occupation] || 0) + count;
    });

    return Object.entries(occupations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
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
      title="Top 10 Occupations" 
      icon={<FiBarChart2 />}
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis type="number" stroke="#ccc" />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={80} 
            stroke="#ccc"
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
          <Bar 
            dataKey="value" 
            fill="#4A90E2" 
            radius={[0, 4, 4, 0]}
            name="Emigrants"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const OccupationCompositionChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.occupationData?.length) return [];
    
    let filteredData = selectedYear === 'all' 
      ? data.occupationData 
      : data.occupationData.filter(item => item.year === selectedYear);

    if (!filteredData.length) return [];
    
    const occupations = {};
    filteredData.forEach(item => {
      const occupation = item.occupation || item.job || 'Unknown';
      const count = Number(item.count) || 0;
      occupations[occupation] = (occupations[occupation] || 0) + count;
    });

    return Object.entries(occupations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [data, selectedYear]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  return (
    <ChartContainer 
      title="Occupation Composition" 
      icon={<FiPieChart />}
      onFullscreen={onFullscreen}
      filters={
        <div className="chart-filter">
          <label>Filter by Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => onYearChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">All Years (1981-2020)</option>
            <option value="2020">2020</option>
            <option value="2019">2019</option>
            <option value="2018">2018</option>
          </select>
        </div>
      }
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
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const OccupationTrendChart = React.memo(({ data, selectedOccupation, onOccupationChange, yearRange, onYearRangeChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.occupationData?.length || !selectedOccupation) return [];
    
    const yearlyData = new Map();
    
    data.occupationData.forEach(item => {
      const year = item.year;
      const occupation = item.occupation || item.job;
      
      if (year && year >= 1981 && year <= 2020 && occupation === selectedOccupation) {
        const count = Number(item.count) || 0;
        const current = yearlyData.get(year) || { year, count: 0 };
        current.count += count;
        yearlyData.set(year, current);
      }
    });

    const allData = Array.from(yearlyData.values()).sort((a, b) => a.year - b.year);
    
    return allData.filter(item =>
      item.year >= yearRange[0] && item.year <= yearRange[1]
    );
  }, [data, selectedOccupation, yearRange]);

  const availableOccupations = useMemo(() => {
    if (!data?.occupationData?.length) return [];
    return [...new Set(data.occupationData
      .map(item => item.occupation || item.job)
      .filter(occupation => occupation && occupation !== 'Unknown')
    )].sort();
  }, [data]);

  const OccupationDropdownFilter = () => (
    <div className="chart-filter">
      <label>Select Occupation:</label>
      <select 
        value={selectedOccupation} 
        onChange={(e) => onOccupationChange(e.target.value)}
      >
        <option value="Prof'l">Prof'l</option>
        {availableOccupations.map(occupation => (
          <option key={occupation} value={occupation}>
            {occupation}
          </option>
        ))}
      </select>
    </div>
  );

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
      title="Occupation Trend Over Time" 
      icon={<FiTrendingUp />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={
        <div className="chart-filters-row">
          <OccupationDropdownFilter />
          <YearRangeFilter />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="year" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip formatter={(value) => [value?.toLocaleString() || 0, 'Count']} />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#4A90E2" 
            strokeWidth={3} 
            dot={{ fill: "#4A90E2" }}
            name={selectedOccupation || 'Selected Occupation'}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

// Chart Container Component - REMOVED print functionality
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
const FullScreenTopOccupations = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.occupationData?.length) return [];
    
    let filteredData = selectedYear === 'all' 
      ? data.occupationData 
      : data.occupationData.filter(item => item.year === selectedYear);

    if (!filteredData.length) return [];
    
    const occupations = {};
    filteredData.forEach(item => {
      const occupation = item.occupation || item.job || 'Unknown';
      const count = Number(item.count) || 0;
      occupations[occupation] = (occupations[occupation] || 0) + count;
    });

    return Object.entries(occupations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [data, selectedYear]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis type="number" stroke="#ccc" />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={120} 
          stroke="#ccc"
          tick={{ fontSize: 14 }}
        />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
        <Legend />
        <Bar 
          dataKey="value" 
          fill="#4A90E2" 
          radius={[0, 4, 4, 0]}
          name="Emigrants"
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

const FullScreenOccupationComposition = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.occupationData?.length) return [];
    
    let filteredData = selectedYear === 'all' 
      ? data.occupationData 
      : data.occupationData.filter(item => item.year === selectedYear);

    if (!filteredData.length) return [];
    
    const occupations = {};
    filteredData.forEach(item => {
      const occupation = item.occupation || item.job || 'Unknown';
      const count = Number(item.count) || 0;
      occupations[occupation] = (occupations[occupation] || 0) + count;
    });

    return Object.entries(occupations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data, selectedYear]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505'];

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
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
});

const FullScreenOccupationTrend = React.memo(({ data, selectedOccupation, yearRange }) => {
  const chartData = useMemo(() => {
    if (!data?.occupationData?.length || !selectedOccupation) return [];
    
    const yearlyData = new Map();
    
    data.occupationData.forEach(item => {
      const year = item.year;
      const occupation = item.occupation || item.job;
      
      if (year && year >= 1981 && year <= 2020 && occupation === selectedOccupation) {
        const count = Number(item.count) || 0;
        const current = yearlyData.get(year) || { year, count: 0 };
        current.count += count;
        yearlyData.set(year, current);
      }
    });

    const allData = Array.from(yearlyData.values()).sort((a, b) => a.year - b.year);
    
    return allData.filter(item =>
      item.year >= yearRange[0] && item.year <= yearRange[1]
    );
  }, [data, selectedOccupation, yearRange]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip formatter={(value) => [value?.toLocaleString() || 0, 'Count']} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#4A90E2" 
          strokeWidth={3} 
          dot={{ fill: "#4A90E2" }}
          name={selectedOccupation || 'Selected Occupation'}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

// Main Component
const OccupationAnalyticsPage = ({ rawData = {} }) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [chartFilters, setChartFilters] = useState({
    topOccupations: { year: 'all' },
    composition: { year: 'all' },
    trend: { occupation: "Prof'l", yearRange: [1981, 2020] }
  });

  const safeRawData = useMemo(() => ({
    occupationData: rawData?.occupationData || []
  }), [rawData]);

  const hasData = safeRawData.occupationData.length > 0;

  // Filter handlers
  const updateTopOccupationsFilter = (year) => {
    setChartFilters(prev => ({ ...prev, topOccupations: { year } }));
  };

  const updateCompositionFilter = (year) => {
    setChartFilters(prev => ({ ...prev, composition: { year } }));
  };

  const updateTrendOccupationFilter = (occupation) => {
    setChartFilters(prev => ({ ...prev, trend: { ...prev.trend, occupation } }));
  };

  const updateTrendYearRangeFilter = (yearRange) => {
    setChartFilters(prev => ({ ...prev, trend: { ...prev.trend, yearRange } }));
  };

  const handleFullscreenToggle = (chartTitle) => {
    setFullScreenChart(fullScreenChart === chartTitle ? null : chartTitle);
  };

  const renderFullScreenContent = () => {
    switch (fullScreenChart) {
      case "Top 10 Occupations":
        return <FullScreenTopOccupations data={safeRawData} selectedYear={chartFilters.topOccupations.year} />;
      case "Occupation Composition":
        return <FullScreenOccupationComposition data={safeRawData} selectedYear={chartFilters.composition.year} />;
      case "Occupation Trend Over Time":
        return <FullScreenOccupationTrend 
          data={safeRawData} 
          selectedOccupation={chartFilters.trend.occupation}
          yearRange={chartFilters.trend.yearRange}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="data-page occupation-analytics-page">
      <div className="page-header">
        <h2><FiBriefcase /> Occupation Analytics</h2>
        <p>Explore what jobs emigrants take abroad</p>
      </div>

      {/* Full Screen Chart Overlay */}
      <FullScreenChart 
        title={fullScreenChart}
        onClose={() => setFullScreenChart(null)}
        isOpen={!!fullScreenChart}
      >
        {renderFullScreenContent()}
      </FullScreenChart>

      {hasData ? (
        <div className={`charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
          {/* Top Row: Bar and Pie Charts */}
          <TopOccupationsChart 
            data={safeRawData}
            selectedYear={chartFilters.topOccupations.year}
            onYearChange={updateTopOccupationsFilter}
            onFullscreen={() => handleFullscreenToggle("Top 10 Occupations")}
          />
          
          <OccupationCompositionChart 
            data={safeRawData}
            selectedYear={chartFilters.composition.year}
            onYearChange={updateCompositionFilter}
            onFullscreen={() => handleFullscreenToggle("Occupation Composition")}
          />

          {/* Bottom Row: Full width Trend Chart */}
          <OccupationTrendChart 
            data={safeRawData}
            selectedOccupation={chartFilters.trend.occupation}
            onOccupationChange={updateTrendOccupationFilter}
            yearRange={chartFilters.trend.yearRange}
            onYearRangeChange={updateTrendYearRangeFilter}
            onFullscreen={() => handleFullscreenToggle("Occupation Trend Over Time")}
          />
        </div>
      ) : (
        <div className="empty-state">
          <FiAlertCircle size={48} />
          <h3>No Data Available</h3>
          <p>Please upload data in the CSV Upload section.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(OccupationAnalyticsPage);
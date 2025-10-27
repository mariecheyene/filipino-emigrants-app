import React, { useMemo, useState } from 'react';
import { 
  FiMap, FiAlertCircle, FiPieChart, FiBarChart2,
  FiMaximize, FiMinimize, FiTrendingUp
} from 'react-icons/fi';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, Tooltip, CartesianGrid, 
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import '../css/ProvinceOriginPage.css';

// Individual Chart Components with React.memo
const ProvinceBarChart = React.memo(({ 
  data, 
  selectedYear, 
  onYearChange, 
  onFullscreen 
}) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    
    let filteredData = data;
    
    if (selectedYear !== 'all') {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const provinces = {};
    filteredData.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinces[province] = (provinces[province] || 0) + count;
    });

    return Object.entries(provinces)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data, selectedYear]);

  const yearOptions = useMemo(() => [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...Array.from({ length: 40 }, (_, i) => ({ 
      value: 1981 + i, 
      label: (1981 + i).toString() 
    }))
  ], []);

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
      title="Top 10 Origin Provinces" 
      icon={<FiBarChart2 />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
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
            fill="#4A90E2" 
            radius={[0, 4, 4, 0]}
            name="Emigrants"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const ProvinceTrendsChart = React.memo(({ 
  data, 
  topN, 
  onTopNChange,
  yearRange, 
  onYearRangeChange, 
  onFullscreen 
}) => {
  const { chartData, topProvinces } = useMemo(() => {
    if (!data?.length) return { chartData: [], topProvinces: [] };

    // Calculate top provinces based on total count across all years
    const provinceTotals = {};
    data.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinceTotals[province] = (provinceTotals[province] || 0) + count;
    });

    // Get top N provinces
    const sortedProvinces = Object.entries(provinceTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([province]) => province);

    // Get all unique years from data
    const years = [...new Set(data.map(item => item.year).filter(Boolean))].sort();
    
    // Create chart data for each year
    const trendData = years.map(year => {
      const yearData = { year };
      
      // For each top province, get the count for this year
      sortedProvinces.forEach(province => {
        const provinceData = data.filter(item => 
          item.year === year && 
          item.province === province
        );
        
        const totalCount = provinceData.reduce((sum, item) => 
          sum + (Number(item.count) || Number(item.total) || 0), 0
        );
        
        yearData[province] = totalCount;
      });
      
      return yearData;
    });

    // Filter by year range
    const filteredData = trendData.filter(item => 
      item.year >= yearRange[0] && item.year <= yearRange[1]
    );

    return { chartData: filteredData, topProvinces: sortedProvinces };
  }, [data, topN, yearRange]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  const TopNSelector = () => (
    <div className="chart-filter">
      <label>Show Top:</label>
      <select 
        value={topN} 
        onChange={(e) => onTopNChange(parseInt(e.target.value))}
      >
        <option value={3}>3 Provinces</option>
        <option value={5}>5 Provinces</option>
        <option value={10}>10 Provinces</option>
      </select>
    </div>
  );

  const YearRangeFilter = () => (
    <div className="chart-filter">
      <label>Year Range:</label>
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
      title="Top Provinces Migration Trends" 
      icon={<FiTrendingUp />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={
        <div className="chart-filters-row">
          <TopNSelector />
          <YearRangeFilter />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="year" 
            stroke="#ccc"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#ccc" />
          <Tooltip 
            formatter={(value) => [value.toLocaleString(), 'Emigrants']}
            labelFormatter={(year) => `Year: ${year}`}
          />
          <Legend />
          {topProvinces.map((province, index) => (
            <Line
              key={province}
              type="monotone"
              dataKey={province}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name={province}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const ProvinceCompositionChart = React.memo(({ 
  data, 
  selectedYear, 
  onYearChange, 
  onFullscreen 
}) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    
    let filteredData = data;
    
    if (selectedYear !== 'all') {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const provinces = {};
    filteredData.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinces[province] = (provinces[province] || 0) + count;
    });

    return Object.entries(provinces)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [data, selectedYear]);

  const yearOptions = useMemo(() => [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...Array.from({ length: 40 }, (_, i) => ({ 
      value: 1981 + i, 
      label: (1981 + i).toString() 
    }))
  ], []);

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

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  return (
    <ChartContainer 
      title="Province Composition" 
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
            labelLine={false}
            label={({ province, percent }) => `${province}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
            nameKey="province"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
          <Legend />
        </PieChart>
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

// Full Screen Component - MATCHING DASHBOARD STYLE
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
const FullScreenProvinceBarChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    
    let filteredData = data;
    
    if (selectedYear !== 'all') {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const provinces = {};
    filteredData.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinces[province] = (provinces[province] || 0) + count;
    });

    return Object.entries(provinces)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [data, selectedYear]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis type="number" stroke="#ccc" />
        <YAxis 
          type="category" 
          dataKey="province" 
          width={150} 
          stroke="#ccc"
          tick={{ fontSize: 14 }}
        />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        <Legend />
        <Bar 
          dataKey="count" 
          fill="#4A90E2" 
          radius={[0, 4, 4, 0]}
          name="Emigrants"
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

const FullScreenProvinceTrendsChart = React.memo(({ data, topN, yearRange }) => {
  const { chartData, topProvinces } = useMemo(() => {
    if (!data?.length) return { chartData: [], topProvinces: [] };

    const provinceTotals = {};
    data.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinceTotals[province] = (provinceTotals[province] || 0) + count;
    });

    const sortedProvinces = Object.entries(provinceTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([province]) => province);

    const years = [...new Set(data.map(item => item.year).filter(Boolean))].sort();
    
    const trendData = years.map(year => {
      const yearData = { year };
      
      sortedProvinces.forEach(province => {
        const provinceData = data.filter(item => 
          item.year === year && 
          item.province === province
        );
        
        const totalCount = provinceData.reduce((sum, item) => 
          sum + (Number(item.count) || Number(item.total) || 0), 0
        );
        
        yearData[province] = totalCount;
      });
      
      return yearData;
    });

    const filteredData = trendData.filter(item => 
      item.year >= yearRange[0] && item.year <= yearRange[1]
    );

    return { chartData: filteredData, topProvinces: sortedProvinces };
  }, [data, topN, yearRange]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="year" 
          stroke="#ccc"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#ccc" />
        <Tooltip 
          formatter={(value) => [value.toLocaleString(), 'Emigrants']}
          labelFormatter={(year) => `Year: ${year}`}
        />
        <Legend />
        {topProvinces.map((province, index) => (
          <Line
            key={province}
            type="monotone"
            dataKey={province}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={3}
            dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 8, strokeWidth: 0 }}
            name={province}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

const FullScreenProvinceCompositionChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    
    let filteredData = data;
    
    if (selectedYear !== 'all') {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const provinces = {};
    filteredData.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinces[province] = (provinces[province] || 0) + count;
    });

    return Object.entries(provinces)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
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
          labelLine={false}
          label={({ province, percent }) => `${province}: ${(percent * 100).toFixed(1)}%`}
          outerRadius={150}
          innerRadius={60}
          fill="#8884d8"
          dataKey="count"
          nameKey="province"
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

// Main Component
const ProvinceOriginPage = ({ rawData }) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [chartFilters, setChartFilters] = useState({
    barChart: { year: 'all' },
    trendsChart: { topN: 5, yearRange: [1981, 2020] },
    compositionChart: { year: 'all' }
  });

  const processedData = useMemo(() => {
    const { placeOfOriginProvince } = rawData;
    
    if (!placeOfOriginProvince || !placeOfOriginProvince.length) return [];

    return placeOfOriginProvince.map(item => ({
      province: item.province || 'Unknown',
      count: Number(item.count) || Number(item.total) || 0,
      year: item.year || 1981,
      region: item.region || 'Unknown'
    }));
  }, [rawData]);

  const hasData = processedData.length > 0;

  // Individual chart filter handlers
  const updateBarChartFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      barChart: { year }
    }));
  };

  const updateTrendsChartFilter = (updates) => {
    setChartFilters(prev => ({
      ...prev,
      trendsChart: { ...prev.trendsChart, ...updates }
    }));
  };

  const updateCompositionChartFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      compositionChart: { year }
    }));
  };

  const handleFullscreenToggle = (chartTitle) => {
    setFullScreenChart(fullScreenChart === chartTitle ? null : chartTitle);
  };

  const renderFullScreenContent = () => {
    const { barChart, trendsChart, compositionChart } = chartFilters;

    switch (fullScreenChart) {
      case "Top 10 Origin Provinces":
        return (
          <FullScreenProvinceBarChart 
            data={processedData} 
            selectedYear={barChart.year} 
          />
        );
      case "Top Provinces Migration Trends":
        return (
          <FullScreenProvinceTrendsChart 
            data={processedData}
            topN={trendsChart.topN}
            yearRange={trendsChart.yearRange}
          />
        );
      case "Province Composition":
        return (
          <FullScreenProvinceCompositionChart 
            data={processedData} 
            selectedYear={compositionChart.year} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="province-origin-page">
      <div className="page-header">
        <h2><FiMap /> Place of Origin (Province)</h2>
        <p>Detailed analysis of emigrant origins at province level</p>
      </div>

      {hasData ? (
        <>
          {/* Full Screen Chart Overlay - FIXED TO MATCH DASHBOARD */}
          <FullScreenChart 
            title={fullScreenChart}
            onClose={() => setFullScreenChart(null)}
            isOpen={!!fullScreenChart}
          >
            {renderFullScreenContent()}
          </FullScreenChart>

          {/* Charts Grid */}
          <div className={`charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
            <ProvinceBarChart 
              data={processedData}
              selectedYear={chartFilters.barChart.year}
              onYearChange={updateBarChartFilter}
              onFullscreen={() => handleFullscreenToggle("Top 10 Origin Provinces")}
            />

            <ProvinceTrendsChart 
              data={processedData}
              topN={chartFilters.trendsChart.topN}
              onTopNChange={(topN) => updateTrendsChartFilter({ topN })}
              yearRange={chartFilters.trendsChart.yearRange}
              onYearRangeChange={(yearRange) => updateTrendsChartFilter({ yearRange })}
              onFullscreen={() => handleFullscreenToggle("Top Provinces Migration Trends")}
            />

            <ProvinceCompositionChart 
              data={processedData}
              selectedYear={chartFilters.compositionChart.year}
              onYearChange={updateCompositionChartFilter}
              onFullscreen={() => handleFullscreenToggle("Province Composition")}
            />
          </div>
        </>
      ) : (
        <div className="empty-state">
          <FiAlertCircle size={48} />
          <h3>No Province Data Available</h3>
          <p>Please upload province data in the CSV Upload section.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProvinceOriginPage);
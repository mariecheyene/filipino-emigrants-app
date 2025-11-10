import React, { useMemo, useState, useEffect } from 'react';
import { 
  FiAlertCircle, FiBarChart2, 
  FiTrendingUp, FiMaximize, FiMinimize
} from 'react-icons/fi';
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, 
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import "../css/RegionOriginPage.css";

// Helper function to map region names
const mapRegionNameToKey = (regionName) => {
  const mapping = {
    // NCR variations
    'National Capital Region (NCR)': 'ncr',
    'National Capital Region': 'ncr',
    'NCR': 'ncr',
    
    // CAR variations
    'Cordillera Administrative Region (CAR)': 'car',
    'Cordillera Administrative Region': 'car',
    'CAR': 'car',
    
    // Region I
    'Region I - Ilocos Region': 'regioni',
    'Ilocos Region': 'regioni',
    
    // Region II
    'Region II - Cagayan Valley': 'regionii',
    'Cagayan Valley': 'regionii',
    
    // Region III
    'Region III - Central Luzon': 'regioniii',
    'Central Luzon': 'regioniii',
    
    // Region IV-A
    'Region IV A - CALABARZON': 'regioniva',
    'CALABARZON': 'regioniva',
    
    // Region IV-B
    'Region IV B - MIMAROPA': 'regionivb',
    'MIMAROPA': 'regionivb',
    
    // Region V
    'Region V - Bicol Region': 'regionv',
    'Bicol Region': 'regionv',
    
    // Region VI
    'Region VI - Western Visayas': 'regionvi',
    'Western Visayas': 'regionvi',
    
    // Region VII
    'Region VII - Central Visayas': 'regionvii',
    'Central Visayas': 'regionvii',
    
    // Region VIII
    'Region VIII - Eastern Visayas': 'regionviii',
    'Eastern Visayas': 'regionviii',
    
    // Region IX
    'Region IX - Zamboanga Peninsula': 'regionix',
    'Zamboanga Peninsula': 'regionix',
    
    // Region X
    'Region X - Northern Mindanao': 'regionx',
    'Northern Mindanao': 'regionx',
    
    // Region XI
    'Region XI - Davao Region': 'regionxi',
    'Davao Region': 'regionxi',
    
    // Region XII
    'Region XII - SOCCSKSARGEN': 'regionxii',
    'SOCCSKSARGEN': 'regionxii',
    
    // Region XIII
    'Region XIII - Caraga': 'regionxiii',
    'Caraga': 'regionxiii',
    
    // ARMM/BARMM
    'Autonomous Region in Muslim Mindanao (ARMM)': 'armm',
    'Autonomous Region in Muslim Mindanao': 'armm',
    'BARMM': 'armm',
    'ARMM': 'armm'
  };

  return mapping[regionName] || regionName.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Individual Chart Components with React.memo
const TopRegionsChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      // Sum all years for each region
      const regions = {};
      data.forEach(item => {
        const region = item.region;
        const count = Number(item.count) || 0;
        if (region) {
          regions[region] = (regions[region] || 0) + count;
        }
      });
      
      return Object.entries(regions)
        .map(([region, count]) => ({ region, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const regions = {};
    filteredData.forEach(item => {
      const region = item.region;
      const count = Number(item.count) || 0;
      if (region) {
        regions[region] = (regions[region] || 0) + count;
      }
    });

    return Object.entries(regions)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data, selectedYear]);

  const yearOptions = useMemo(() => {
    if (!data?.length) return [{ value: 'all', label: 'All Years' }];
    
    const years = [...new Set(data.map(item => item.year).filter(Boolean))].sort();
    return [
      { value: 'all', label: 'All Years' },
      ...years.map(year => ({ value: year, label: year.toString() }))
    ];
  }, [data]);

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

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  return (
    <ChartContainer 
      title="Top 10 Regions by Emigrants" 
      icon={<FiBarChart2 />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <div className="chart-content-wrapper">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis type="number" stroke="#ccc" />
              <YAxis 
                type="category" 
                dataKey="region" 
                width={120} 
                stroke="#ccc"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [value.toLocaleString(), 'Emigrants']}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
              <Bar 
                dataKey="count" 
                radius={[0, 4, 4, 0]}
                name="Emigrants"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">
            No data available for the selected year
          </div>
        )}
      </div>
    </ChartContainer>
  );
});

const RegionTrendChart = React.memo(({ data, selectedRegion, onRegionChange, yearRange, onYearRangeChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length || !selectedRegion) return [];

    const regionData = data.filter(item => item.region === selectedRegion);
    if (!regionData.length) return [];

    const yearlyData = {};
    regionData.forEach(item => {
      const year = item.year;
      if (year) {
        const count = Number(item.count) || 0;
        yearlyData[year] = count; // Use the count for this specific year
      }
    });

    return Object.entries(yearlyData)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year)
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1]);
  }, [data, selectedRegion, yearRange]);

  const regionOptions = useMemo(() => {
    if (!data?.length) return [];
    
    const regions = [...new Set(data.map(item => item.region).filter(region => region && region !== 'Unknown'))].sort();
    return regions.map(region => ({ value: region, label: region }));
  }, [data]);

  const RegionDropdownFilter = () => (
    <div className="chart-filter">
      <label>Region:</label>
      <select 
        value={selectedRegion} 
        onChange={(e) => onRegionChange(e.target.value)}
      >
        <option value="">Select a region</option>
        {regionOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const YearRangeFilter = () => (
    <div className="chart-filter">
      <label>Years:</label>
      <div className="range-inputs">
        <input
          type="number"
          value={yearRange[0]}
          onChange={(e) => onYearRangeChange([parseInt(e.target.value) || 1988, yearRange[1]])}
          min="1988"
          max="2020"
        />
        <span>to</span>
        <input
          type="number"
          value={yearRange[1]}
          onChange={(e) => onYearRangeChange([yearRange[0], parseInt(e.target.value) || 2020])}
          min="1988"
          max="2020"
        />
      </div>
    </div>
  );

  return (
    <ChartContainer 
      title={`Emigration Trend for ${selectedRegion || 'Region'}`} 
      icon={<FiTrendingUp />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={
        <div className="chart-filters-group">
          <RegionDropdownFilter />
          <YearRangeFilter />
        </div>
      }
    >
      <div className="chart-content-wrapper">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="year" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip 
                formatter={(value) => [value.toLocaleString(), 'Emigrants']}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#4A90E2" 
                strokeWidth={2}
                dot={{ fill: "#4A90E2", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#4A90E2" }}
                name="Emigrants"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">
            {selectedRegion ? 'No data available for the selected region and year range.' : 'Please select a region to view trends.'}
          </div>
        )}
      </div>
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

// Main RegionOriginPage Component
const RegionOriginPage = ({ rawData }) => {
  const [chartFilters, setChartFilters] = useState({
    bar: { year: 'all' },
    trend: { region: '', yearRange: [1988, 2020] }
  });

  const [fullscreenChart, setFullscreenChart] = useState(null);

  const regionData = useMemo(() => {
    console.log("Raw data in RegionOriginPage:", rawData);
    return rawData?.placeOfOrigin || [];
  }, [rawData]);

  const hasData = regionData && regionData.length > 0;

  // Debug data
  useEffect(() => {
    if (hasData) {
      console.log("Region data sample:", regionData.slice(0, 3));
      console.log("Available years:", [...new Set(regionData.map(item => item.year))].sort());
      console.log("Available regions:", [...new Set(regionData.map(item => item.region))]);
    }
  }, [regionData, hasData]);

  // Filter handlers
  const updateBarFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      bar: { year }
    }));
  };

  const updateTrendFilter = (region, yearRange) => {
    setChartFilters(prev => ({
      ...prev,
      trend: { 
        region: region !== undefined ? region : prev.trend.region,
        yearRange: yearRange || prev.trend.yearRange
      }
    }));
  };

  const handleFullscreen = (chartType) => {
    setFullscreenChart(fullscreenChart === chartType ? null : chartType);
  };

  // Render fullscreen view
  if (fullscreenChart) {
    const getFullscreenChart = () => {
      switch (fullscreenChart) {
        case 'bar':
          return (
            <TopRegionsChart 
              data={regionData}
              selectedYear={chartFilters.bar.year}
              onYearChange={updateBarFilter}
              onFullscreen={() => handleFullscreen('bar')}
            />
          );
        case 'trend':
          return (
            <RegionTrendChart 
              data={regionData}
              selectedRegion={chartFilters.trend.region}
              onRegionChange={(region) => updateTrendFilter(region, undefined)}
              yearRange={chartFilters.trend.yearRange}
              onYearRangeChange={(yearRange) => updateTrendFilter(undefined, yearRange)}
              onFullscreen={() => handleFullscreen('trend')}
            />
          );
        default:
          return null;
      }
    };

    return (
      <div className="fullscreen-overlay">
        <div className="fullscreen-chart">
          {getFullscreenChart()}
        </div>
        <button 
          className="close-fullscreen-btn"
          onClick={() => setFullscreenChart(null)}
        >
          <FiMinimize /> Close Fullscreen
        </button>
      </div>
    );
  }

  return (
    <div className="region-origin-page">
      <div className="page-header">
        <h2>Place of Origin (Region)</h2>
        <p>Understand which regions emigrants come from</p>
      </div>

      {hasData ? (
        <div className="charts-grid">
          <TopRegionsChart 
            data={regionData}
            selectedYear={chartFilters.bar.year}
            onYearChange={updateBarFilter}
            onFullscreen={() => handleFullscreen('bar')}
          />

          <RegionTrendChart 
            data={regionData}
            selectedRegion={chartFilters.trend.region}
            onRegionChange={(region) => updateTrendFilter(region, undefined)}
            yearRange={chartFilters.trend.yearRange}
            onYearRangeChange={(yearRange) => updateTrendFilter(undefined, yearRange)}
            onFullscreen={() => handleFullscreen('trend')}
          />
        </div>
      ) : (
        <div className="empty-state">
          <FiAlertCircle size={48} />
          <h3>No Data Available</h3>
          <p>Please upload Place of Origin data in the CSV Upload section.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(RegionOriginPage);
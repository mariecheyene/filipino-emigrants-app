import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  FiMapPin, FiAlertCircle, FiBarChart2, 
  FiTrendingUp, FiMaximize, FiX
} from 'react-icons/fi';
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, 
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Title
} from 'chart.js';
import { ChoroplethController, GeoFeature, ColorScale, ProjectionScale } from 'chartjs-chart-geo';
import { Chart } from 'react-chartjs-2';

// Register Chart.js and geo components
ChartJS.register(
  CategoryScale,
  LinearScale,
  ChartTooltip,
  ChartLegend,
  Title,
  ChoroplethController,
  GeoFeature,
  ColorScale,
  ProjectionScale
);

// Philippine regions GeoJSON data
const philippinesGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "NCR",
      "properties": { "name": "NCR", "region": "National Capital Region" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [120.9, 14.3], [121.2, 14.3], [121.2, 14.8], [120.9, 14.8], [120.9, 14.3]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "CAR",
      "properties": { "name": "CAR", "region": "Cordillera Administrative Region" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [120.3, 16.0], [121.5, 16.0], [121.5, 18.0], [120.3, 18.0], [120.3, 16.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region I",
      "properties": { "name": "Region I", "region": "Ilocos Region" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [119.5, 15.5], [120.8, 15.5], [120.8, 18.5], [119.5, 18.5], [119.5, 15.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region II",
      "properties": { "name": "Region II", "region": "Cagayan Valley" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [121.0, 16.0], [122.5, 16.0], [122.5, 18.5], [121.0, 18.5], [121.0, 16.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region III",
      "properties": { "name": "Region III", "region": "Central Luzon" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [120.0, 14.5], [121.5, 14.5], [121.5, 16.0], [120.0, 16.0], [120.0, 14.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region IV-A",
      "properties": { "name": "Region IV-A", "region": "CALABARZON" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [120.5, 13.0], [122.0, 13.0], [122.0, 14.5], [120.5, 14.5], [120.5, 13.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region IV-B",
      "properties": { "name": "Region IV-B", "region": "MIMAROPA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [117.0, 8.0], [122.0, 8.0], [122.0, 13.5], [117.0, 13.5], [117.0, 8.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region V",
      "properties": { "name": "Region V", "region": "Bicol Region" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [122.0, 12.0], [124.5, 12.0], [124.5, 14.5], [122.0, 14.5], [122.0, 12.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region VI",
      "properties": { "name": "Region VI", "region": "Western Visayas" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [121.5, 9.5], [123.5, 9.5], [123.5, 12.0], [121.5, 12.0], [121.5, 9.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region VII",
      "properties": { "name": "Region VII", "region": "Central Visayas" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [123.0, 9.0], [124.5, 9.0], [124.5, 11.5], [123.0, 11.5], [123.0, 9.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region VIII",
      "properties": { "name": "Region VIII", "region": "Eastern Visayas" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [124.0, 9.5], [126.0, 9.5], [126.0, 12.5], [124.0, 12.5], [124.0, 9.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region IX",
      "properties": { "name": "Region IX", "region": "Zamboanga Peninsula" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [121.5, 6.5], [123.5, 6.5], [123.5, 9.0], [121.5, 9.0], [121.5, 6.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region X",
      "properties": { "name": "Region X", "region": "Northern Mindanao" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [123.5, 7.0], [125.5, 7.0], [125.5, 9.5], [123.5, 9.5], [123.5, 7.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region XI",
      "properties": { "name": "Region XI", "region": "Davao Region" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [125.0, 5.5], [126.5, 5.5], [126.5, 8.0], [125.0, 8.0], [125.0, 5.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "Region XII",
      "properties": { "name": "Region XII", "region": "SOCCSKSARGEN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [123.5, 5.0], [125.5, 5.0], [125.5, 7.5], [123.5, 7.5], [123.5, 5.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "CARAGA",
      "properties": { "name": "CARAGA", "region": "Caraga" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [125.0, 8.5], [126.5, 8.5], [126.5, 10.5], [125.0, 10.5], [125.0, 8.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "BARMM",
      "properties": { "name": "BARMM", "region": "Bangsamoro Autonomous Region" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [119.0, 4.0], [122.5, 4.0], [122.5, 8.5], [119.0, 8.5], [119.0, 4.0]
        ]]
      }
    }
  ]
};

// Individual Chart Components with React.memo
const RegionalMapChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartRef = useRef();
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const mapData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const regions = {};
    filteredData.forEach(item => {
      const region = item.region || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (region && region !== 'Unknown') {
        regions[region] = (regions[region] || 0) + count;
      }
    });

    return Object.entries(regions)
      .map(([region, count]) => ({ 
        feature: region, 
        value: count,
        density: getDensityLevel(count)
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, selectedYear]);

  const getDensityLevel = (count) => {
    if (count === 0) return 'No Data';
    if (count > 100000) return 'Very High';
    if (count > 50000) return 'High';
    if (count > 25000) return 'Medium';
    if (count > 10000) return 'Low';
    return 'Very Low';
  };

  const getColor = (value) => {
    if (value === 0 || !value) return '#374151'; // No data - dark gray
    if (value > 100000) return '#dc2626'; // High - red
    if (value > 50000) return '#ea580c'; // Medium - orange
    if (value > 25000) return '#ca8a04'; // Medium-low - yellow
    if (value > 10000) return '#16a34a'; // Low - green
    return '#0ea5e9'; // Very low - blue
  };

  const chartData = {
    labels: mapData.map(d => d.feature),
    datasets: [
      {
        label: 'Emigrants',
        outline: philippinesGeoJSON.features,
        data: mapData,
        valueProperty: 'value',
        featureProperty: 'region',
        backgroundColor: (context) => {
          const value = context.dataset.data[context.dataIndex]?.value;
          return getColor(value);
        }
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const region = context.raw?.feature;
            const value = context.raw?.value || 0;
            const density = getDensityLevel(value);
            return [
              `Region: ${region}`,
              `Emigrants: ${value.toLocaleString()}`,
              `Density: ${density}`,
              `Year: ${selectedYear === 'all' ? 'All Years' : selectedYear}`
            ];
          }
        },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fbbf24',
        bodyColor: '#ffffff',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    scales: {
      projection: {
        axis: 'x',
        projection: 'equirectangular'
      },
      color: {
        axis: 'x',
        quantize: 5,
        legend: {
          position: 'bottom-right',
          align: 'bottom'
        }
      }
    },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const region = mapData[element.index]?.feature;
        setHoveredRegion(region);
      } else {
        setHoveredRegion(null);
      }
    }
  };

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

  return (
    <ChartContainer 
      title="Regional Emigrant Density" 
      icon={<FiMapPin />}
      className="map-chart full-width"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <div className="philippine-map-container">
        <div className="map-title">
          Philippine Regions Emigrant Density
          <div className="map-subtitle">
            {selectedYear === 'all' ? 'All Years' : `Year ${selectedYear}`}
            {hoveredRegion && ` • Hovering: ${hoveredRegion}`}
          </div>
        </div>
        
        <div className="chartjs-map-container">
          <Chart
            ref={chartRef}
            type="choropleth"
            data={chartData}
            options={chartOptions}
          />
        </div>
        
        <div className="map-bottom-section">
          <div className="map-legend">
            <div className="legend-title">Emigrant Density</div>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#dc2626' }}></span>
                <span>Very High (&gt;100K)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ea580c' }}></span>
                <span>High (50K-100K)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ca8a04' }}></span>
                <span>Medium (25K-50K)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#16a34a' }}></span>
                <span>Low (10K-25K)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#0ea5e9' }}></span>
                <span>Very Low (&lt;10K)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#374151' }}></span>
                <span>No Data</span>
              </div>
            </div>
          </div>

          <div className="region-data-table">
            <div className="table-header">Top Regions</div>
            <div className="table-content">
              {mapData.slice(0, 6).map((item, index) => (
                <div key={item.feature} className="table-row">
                  <span className="region-name">{item.feature}</span>
                  <span className="region-count">{item.value.toLocaleString()}</span>
                </div>
              ))}
              {mapData.length === 0 && (
                <div className="table-row">
                  <span className="region-name">No data available</span>
                  <span className="region-count">-</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
});

const TopRegionsChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const regions = {};
    filteredData.forEach(item => {
      const region = item.region || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (region && region !== 'Unknown') {
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
      title="Top 10 Regions" 
      icon={<FiBarChart2 />}
      className="bar-chart"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            type="number" 
            stroke="#ccc"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            type="category" 
            dataKey="region" 
            width={110}
            stroke="#ccc"
            tick={{ fontSize: 11 }}
          />
          <Tooltip 
            formatter={(value) => [value.toLocaleString(), 'Emigrants']}
            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
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
        const count = Number(item.count) || Number(item.total) || 0;
        yearlyData[year] = (yearlyData[year] || 0) + count;
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
      title={`Trend for ${selectedRegion || 'Region'}`} 
      icon={<FiTrendingUp />}
      className="trend-chart"
      onFullscreen={onFullscreen}
      filters={
        <div className="chart-filters-row">
          <RegionDropdownFilter />
          <YearRangeFilter />
        </div>
      }
    >
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="year" 
              stroke="#ccc"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#ccc"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), 'Emigrants']}
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
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

// Full Screen Wrapper Component
const FullScreenWrapper = React.memo(({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  filters = null 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fullscreen-chart-overlay">
      <div className="fullscreen-chart-container">
        <div className="fullscreen-chart-header">
          <h3>
            {title}
          </h3>
          <div className="chart-controls">
            {filters}
            <button className="close-fullscreen" onClick={onClose}>
              <FiX />
              Close
            </button>
          </div>
        </div>
        <div className="fullscreen-chart-content">
          {children}
        </div>
      </div>
    </div>
  );
});

// Main RegionOriginPage Component
const RegionOriginPage = ({ rawData }) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [chartFilters, setChartFilters] = useState({
    map: { year: 'all' },
    bar: { year: 'all' },
    trend: { region: '', yearRange: [1981, 2020] }
  });

  const regionData = useMemo(() => {
    return rawData?.placeOfOrigin || [];
  }, [rawData]);

  const hasData = regionData.length > 0;

  // Filter handlers
  const updateMapFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      map: { year }
    }));
  };

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

  const handleFullscreenToggle = (chartType) => {
    setFullScreenChart(fullScreenChart === chartType ? null : chartType);
  };

  const handleCloseFullscreen = () => {
    setFullScreenChart(null);
  };

  // Memoized filter components for fullscreen
  const MapYearFilter = useMemo(() => {
    const yearOptions = regionData?.length ? [
      { value: 'all', label: 'All Years' },
      ...[...new Set(regionData.map(item => item.year).filter(Boolean))].sort().map(year => ({ 
        value: year, label: year.toString() 
      }))
    ] : [{ value: 'all', label: 'All Years' }];

    return (
      <div className="chart-filter">
        <label>Filter by Year:</label>
        <select 
          value={chartFilters.map.year} 
          onChange={(e) => updateMapFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
        >
          {yearOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }, [regionData, chartFilters.map.year]);

  const BarYearFilter = useMemo(() => {
    const yearOptions = regionData?.length ? [
      { value: 'all', label: 'All Years' },
      ...[...new Set(regionData.map(item => item.year).filter(Boolean))].sort().map(year => ({ 
        value: year, label: year.toString() 
      }))
    ] : [{ value: 'all', label: 'All Years' }];

    return (
      <div className="chart-filter">
        <label>Filter by Year:</label>
        <select 
          value={chartFilters.bar.year} 
          onChange={(e) => updateBarFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
        >
          {yearOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }, [regionData, chartFilters.bar.year]);

  const TrendFilters = useMemo(() => {
    const regionOptions = regionData?.length 
      ? [...new Set(regionData.map(item => item.region).filter(region => region && region !== 'Unknown'))].sort().map(region => ({ value: region, label: region }))
      : [];

    return (
      <div className="chart-filters-row">
        <div className="chart-filter">
          <label>Region:</label>
          <select 
            value={chartFilters.trend.region} 
            onChange={(e) => updateTrendFilter(e.target.value, undefined)}
          >
            <option value="">Select a region</option>
            {regionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="chart-filter">
          <label>Years:</label>
          <div className="range-inputs">
            <input
              type="number"
              value={chartFilters.trend.yearRange[0]}
              onChange={(e) => updateTrendFilter(undefined, [parseInt(e.target.value) || 1981, chartFilters.trend.yearRange[1]])}
              min="1981"
              max="2020"
            />
            <span>to</span>
            <input
              type="number"
              value={chartFilters.trend.yearRange[1]}
              onChange={(e) => updateTrendFilter(undefined, [chartFilters.trend.yearRange[0], parseInt(e.target.value) || 2020])}
              min="1981"
              max="2020"
            />
          </div>
        </div>
      </div>
    );
  }, [regionData, chartFilters.trend.region, chartFilters.trend.yearRange]);

  // Fullscreen content components
  const fullscreenContent = useMemo(() => {
    switch (fullScreenChart) {
      case 'map':
        return <RegionalMapChart data={regionData} selectedYear={chartFilters.map.year} onYearChange={updateMapFilter} onFullscreen={() => {}} />;
      case 'bar':
        return <TopRegionsChart data={regionData} selectedYear={chartFilters.bar.year} onYearChange={updateBarFilter} onFullscreen={() => {}} />;
      case 'trend':
        return <RegionTrendChart 
          data={regionData} 
          selectedRegion={chartFilters.trend.region} 
          onRegionChange={(region) => updateTrendFilter(region, undefined)}
          yearRange={chartFilters.trend.yearRange}
          onYearRangeChange={(yearRange) => updateTrendFilter(undefined, yearRange)}
          onFullscreen={() => {}}
        />;
      default:
        return null;
    }
  }, [fullScreenChart, regionData, chartFilters]);

  // Prevent body scroll when fullscreen is active
  useEffect(() => {
    if (fullScreenChart) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fullScreenChart]);

  return (
    <div className="region-origin-page">
      <div className="page-header">
        <h2><FiMapPin /> Place of Origin (Region)</h2>
        <p>Understand which regions emigrants come from</p>
      </div>

      {hasData ? (
        <>
          <div className={`charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
            <RegionalMapChart 
              data={regionData}
              selectedYear={chartFilters.map.year}
              onYearChange={updateMapFilter}
              onFullscreen={() => handleFullscreenToggle("map")}
            />
            
            <TopRegionsChart 
              data={regionData}
              selectedYear={chartFilters.bar.year}
              onYearChange={updateBarFilter}
              onFullscreen={() => handleFullscreenToggle("bar")}
            />

            <RegionTrendChart 
              data={regionData}
              selectedRegion={chartFilters.trend.region}
              onRegionChange={(region) => updateTrendFilter(region, undefined)}
              yearRange={chartFilters.trend.yearRange}
              onYearRangeChange={(yearRange) => updateTrendFilter(undefined, yearRange)}
              onFullscreen={() => handleFullscreenToggle("trend")}
            />
          </div>

          {/* Full Screen Overlays */}
          <FullScreenWrapper
            isOpen={fullScreenChart === "map"}
            onClose={handleCloseFullscreen}
            title="Regional Emigrant Density"
            filters={MapYearFilter}
          >
            <div className="fullscreen-map-content">
              {fullscreenContent}
            </div>
          </FullScreenWrapper>

          <FullScreenWrapper
            isOpen={fullScreenChart === "bar"}
            onClose={handleCloseFullscreen}
            title="Top 10 Regions"
            filters={BarYearFilter}
          >
            <div className="fullscreen-bar-content">
              {fullscreenContent}
            </div>
          </FullScreenWrapper>

          <FullScreenWrapper
            isOpen={fullScreenChart === "trend"}
            onClose={handleCloseFullscreen}
            title={`Trend for ${chartFilters.trend.region || 'Region'}`}
            filters={TrendFilters}
          >
            <div className="fullscreen-trend-content">
              {fullscreenContent}
            </div>
          </FullScreenWrapper>
        </>
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

export default React.memo(RegionOriginPage);
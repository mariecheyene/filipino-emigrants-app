import React, { useMemo, useState } from 'react';
import { 
  FiGlobe, FiAlertCircle, FiPieChart, FiBarChart2,
  FiMaximize, FiMinimize, FiTrendingUp, FiMap
} from 'react-icons/fi';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, 
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import "../css/DestinationCountriesPage.css";

// Custom Tooltip Component for better clarity
const DestinationTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="destination-tooltip">
        <p className="destination-tooltip-label">{`Country: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="destination-tooltip-item">
            <span 
              className="destination-tooltip-color" 
              style={{ backgroundColor: entry.color }}
            ></span>
            {`${entry.name}: ${entry.value?.toLocaleString() || '0'} emigrants`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Pie Chart Label Component to handle small percentages
const CustomPieLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, index, name
}) => {
  if (percent < 0.03) {
    return null;
  }

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="#374151"
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

// Individual Chart Components with React.memo
const TopCountriesBarChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const countries = {};
    filteredData.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (country && country !== 'Unknown') {
        countries[country] = (countries[country] || 0) + count;
      }
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
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
    <div className="destination-chart-filter">
      <label>Year:</label>
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
      title="Top 10 Destination Countries" 
      icon={<FiBarChart2 />}
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="country" 
            stroke="#ccc" 
            angle={-45} 
            textAnchor="end" 
            height={60}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis stroke="#ccc" />
          <Tooltip content={<DestinationTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
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

const MultiLineTrendChart = React.memo(({ data, yearRange, onYearRangeChange, countryCount, onCountryCountChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Filter by year range
    const filteredByYear = data.filter(item => {
      const year = item.year;
      return year >= yearRange[0] && year <= yearRange[1];
    });

    if (!filteredByYear.length) return [];

    // Calculate total counts for each country over the filtered period
    const countryTotals = {};
    filteredByYear.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (country && country !== 'Unknown') {
        countryTotals[country] = (countryTotals[country] || 0) + count;
      }
    });

    // Get top N countries
    const topCountries = Object.entries(countryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, countryCount)
      .map(([country]) => country);

    // Create yearly data for line chart
    const years = [...new Set(filteredByYear.map(item => item.year).filter(Boolean))].sort();
    const yearlyData = {};

    filteredByYear.forEach(item => {
      const year = item.year;
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      
      if (topCountries.includes(country)) {
        if (!yearlyData[year]) {
          yearlyData[year] = { year };
        }
        yearlyData[year][country] = (yearlyData[year][country] || 0) + count;
      }
    });

    return Object.values(yearlyData).sort((a, b) => a.year - b.year);
  }, [data, yearRange, countryCount]);

  const YearRangeFilter = () => (
    <div className="destination-chart-filter">
      <label>Year Range:</label>
      <div className="destination-range-inputs">
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

  const CountryCountFilter = () => (
    <div className="destination-chart-filter">
      <label>Show Top:</label>
      <select 
        value={countryCount} 
        onChange={(e) => onCountryCountChange(parseInt(e.target.value))}
      >
        <option value={5}>Top 5 Countries</option>
        <option value={10}>Top 10 Countries</option>
      </select>
    </div>
  );

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  // Get the countries that actually have data in the chart
  const countriesInChart = useMemo(() => {
    if (!chartData.length) return [];
    const countries = new Set();
    chartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'year' && item[key] > 0) {
          countries.add(key);
        }
      });
    });
    return Array.from(countries);
  }, [chartData]);

  return (
    <ChartContainer 
      title={`Emigration Trends for Top ${countryCount} Destination Countries (${yearRange[0]}-${yearRange[1]})`}
      icon={<FiTrendingUp />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={
        <div className="destination-chart-filters-group">
          <YearRangeFilter />
          <CountryCountFilter />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        {chartData.length > 0 && countriesInChart.length > 0 ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="year" 
              stroke="#ccc"
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="#ccc" />
            <Tooltip content={<DestinationTooltip />} />
            <Legend />
            {countriesInChart.map((country, index) => (
              <Line 
                key={country}
                type="monotone" 
                dataKey={country} 
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: COLORS[index % COLORS.length] }}
                name={country}
              />
            ))}
          </LineChart>
        ) : (
          <div className="destination-no-data-message">
            No trend data available for the selected filters.
          </div>
        )}
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const CountryCompositionPieChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const countries = {};
    let totalCount = 0;
    
    filteredData.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (country && country !== 'Unknown') {
        countries[country] = (countries[country] || 0) + count;
        totalCount += count;
      }
    });

    // Convert to array and calculate percentages
    return Object.entries(countries)
      .map(([country, count]) => ({ 
        name: country,
        value: count,
        percentage: totalCount > 0 ? (count / totalCount * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
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
    <div className="destination-chart-filter">
      <label>Year:</label>
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

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505'];

  const CustomPieLegend = () => (
    <div className="destination-pie-legend">
      {chartData.map((entry, index) => (
        <div key={`legend-${index}`} className="destination-legend-item">
          <div 
            className="destination-legend-color" 
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span className="destination-legend-text">
            {entry.name}: {entry.percentage.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <ChartContainer 
      title="Country Composition" 
      icon={<FiPieChart />}
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
      className="destination-composition-card"
    >
      <div className="destination-chart-content destination-composition-content">
        {chartData.length > 0 ? (
          <div className="destination-pie-container">
            <div className="destination-pie-chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomPieLabel}
                    outerRadius={100}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value?.toLocaleString() || '0'} emigrants (${chartData.find(item => item.name === name)?.percentage?.toFixed(1) || 0}%)`, 
                      name
                    ]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="destination-legend-container">
              <CustomPieLegend />
            </div>
          </div>
        ) : (
          <div className="destination-no-data-message">
            No composition data available for the selected year.
          </div>
        )}
      </div>
    </ChartContainer>
  );
});


// Choropleth Map Component
const ChoroplethMap = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  const mapData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const countries = {};
    filteredData.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (country && country !== 'Unknown') {
        countries[country] = (countries[country] || 0) + count;
      }
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
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
    <div className="destination-chart-filter">
      <label>Year:</label>
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

  // Country name mapping for better matching
  const countryNameMapping = {
    'UNITED STATES': 'United States',
    'USA': 'United States',
    'US': 'United States',
    'CANADA': 'Canada',
    'JAPAN': 'Japan',
    'AUSTRALIA': 'Australia',
    'UNITED KINGDOM': 'United Kingdom',
    'UK': 'United Kingdom',
    'GERMANY': 'Germany',
    'FRANCE': 'France',
    'ITALY': 'Italy',
    'SPAIN': 'Spain',
    'SOUTH KOREA': 'South Korea',
    'KOREA': 'South Korea',
    'SINGAPORE': 'Singapore',
    'MALAYSIA': 'Malaysia',
    'UAE': 'United Arab Emirates',
    'UNITED ARAB EMIRATES': 'United Arab Emirates',
    'SAUDI ARABIA': 'Saudi Arabia',
    'QATAR': 'Qatar',
    'KUWAIT': 'Kuwait',
    'NEW ZEALAND': 'New Zealand',
  };

  const getStandardCountryName = (countryName) => {
    return countryNameMapping[countryName.toUpperCase()] || countryName;
  };

  // ENHANCED COLOR SCALE - Solution 1
  const maxEmigrants = Math.max(...mapData.map(d => d.count), 1);
  const colorScale = scaleLinear()
    .domain([
      0, 
      maxEmigrants * 0.1, 
      maxEmigrants * 0.3, 
      maxEmigrants * 0.6, 
      maxEmigrants
    ])
    .range([
      "#E8F4F8",  // Very light blue for low values
      "#4A90E2",  // Medium blue
      "#1E7FB8",  // Strong blue
      "#0F4C75",  // Dark blue
      "#002B49"   // Very dark blue for highest values
    ]);

  // Handle mouse events for tooltip
  const handleMouseEnter = (geo, event) => {
    const countryName = geo.properties.name;
    const countryData = mapData.find(d => 
      getStandardCountryName(d.country).toLowerCase() === countryName.toLowerCase() ||
      d.country.toLowerCase() === countryName.toLowerCase()
    );
    
    if (countryData) {
      setHoveredCountry(countryName);
      setTooltip({
        country: getStandardCountryName(countryData.country),
        count: countryData.count,
        x: event.clientX,
        y: event.clientY
      });
    } else {
      setTooltip({
        country: countryName,
        count: 0,
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const handleMouseMove = (event) => {
    if (tooltip) {
      setTooltip(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY
      }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    setHoveredCountry(null);
  };

  return (
    <div className="destination-map-card">
      <div className="destination-chart-header">
        <div className="destination-chart-title">
          <span className="destination-chart-icon"><FiMap /></span>
          <h4>Emigrants Distribution Map</h4>
        </div>
        <div className="destination-chart-controls">
          <YearDropdownFilter />
          <button 
            className="destination-fullscreen-btn"
            onClick={onFullscreen}
            title="Toggle fullscreen"
          >
            <FiMaximize />
          </button>
        </div>
      </div>
      <div className="destination-chart-content">
        <div className="destination-choropleth-map">
          {mapData.length > 0 ? (
            <>
              {/* Tooltip */}
              {tooltip && (
                <div 
                  className="destination-map-tooltip"
                  style={{
                    left: tooltip.x + 10,
                    top: tooltip.y - 10,
                  }}
                >
                  <div className="destination-map-tooltip-country">
                    {tooltip.country}
                  </div>
                  <div className="destination-map-tooltip-count">
                    {tooltip.count.toLocaleString()} emigrants
                  </div>
                </div>
              )}

              {/* BIG CONTAINER WITH MAP ON LEFT, INFO ON RIGHT */}
              <div className="destination-map-main-container">
                
                {/* LEFT SIDE: BIG MAP VISUALIZATION */}
                <div className="destination-map-visualization">
                  <ComposableMap 
                    projectionConfig={{ 
                      scale: 140,
                      rotation: [0, 0, 0] 
                    }}
                  >
                    <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const countryName = geo.properties.name;
                          const countryData = mapData.find(d => 
                            getStandardCountryName(d.country).toLowerCase() === countryName.toLowerCase() ||
                            d.country.toLowerCase() === countryName.toLowerCase()
                          );
                          
                          // Get color based on data
                          const color = countryData
                            ? colorScale(countryData.count)
                            : "#E0E0E0"; // Gray for no data
                          
                          const isHovered = hoveredCountry === countryName;
                          
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={color}
                              // ENHANCED BORDERS - Solution 2
                              stroke={countryData ? "#2D3748" : "#CBD5E0"} // Darker borders for countries with data
                              strokeWidth={countryData ? 1 : 0.5} // Thicker borders for countries with data
                              style={{
                                default: { 
                                  outline: "none",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease"
                                },
                                hover: { 
                                  fill: isHovered ? "#E53E3E" : color, // Red hover for better visibility
                                  outline: "none",
                                  cursor: "pointer",
                                  strokeWidth: 2,
                                  stroke: "#E53E3E"
                                },
                                pressed: { outline: "none" },
                              }}
                              onMouseEnter={(event) => handleMouseEnter(geo, event)}
                              onMouseMove={handleMouseMove}
                              onMouseLeave={handleMouseLeave}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>
                </div>

                {/* RIGHT SIDE: LEGEND AND TOP COUNTRIES */}
                <div className="destination-map-info-sidebar">
                  
                  {/* ENHANCED LEGEND */}
                  <div className="destination-map-legend-container">
                    <h5 className="destination-map-legend-title">Number of Filipino Emigrants</h5>
                    <p className="destination-map-legend-subtitle">
                      Darker blue = More emigrants<br />
                      Lighter blue = Fewer emigrants<br />
                      Gray = No data available
                    </p>
                    <div className="destination-map-legend">
                      <div className="destination-map-legend-colors">
                        {["#E8F4F8", "#4A90E2", "#1E7FB8", "#0F4C75", "#002B49"].map((color, index) => (
                          <div 
                            key={index}
                            className="destination-map-legend-color"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="destination-map-legend-labels">
                        <span className="destination-map-legend-label destination-map-legend-min">Fewer</span>
                        <span className="destination-map-legend-label destination-map-legend-max">More</span>
                      </div>
                    </div>
                  </div>

                  {/* TOP 5 COUNTRIES LIST */}
                  <div className="destination-top-countries">
                    <div className="destination-top-countries-header">
                      <h5>Top 5 Destination Countries</h5>
                    </div>
                    <div className="destination-top-countries-list">
                      {mapData.slice(0, 5).map(({ country, count }, index) => (
                        <div 
                          key={country} 
                          className={`destination-top-country-item rank-${index + 1}`}
                        >
                          <div className="destination-top-country-rank">
                            {index + 1}
                          </div>
                          <span className="destination-top-country-name">
                            {getStandardCountryName(country)}
                          </span>
                          <span className="destination-top-country-count">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </>
          ) : (
            <div className="destination-no-data-message">
              No map data available for the selected year.
            </div>
          )}
        </div>
      </div>
    </div>
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
  <div className={`destination-chart-card ${className}`}>
    <div className="destination-chart-header">
      <div className="destination-chart-title">
        {icon && <span className="destination-chart-icon">{icon}</span>}
        <h4>{title}</h4>
      </div>
      <div className="destination-chart-controls">
        {filters}
        <button 
          className="destination-fullscreen-btn"
          onClick={onFullscreen}
          title="Toggle fullscreen"
        >
          <FiMaximize />
        </button>
      </div>
    </div>
    <div className="destination-chart-content">
      {children}
    </div>
  </div>
));

// Full Screen Components
const FullScreenBarChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const countries = {};
    filteredData.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (country && country !== 'Unknown') {
        countries[country] = (countries[country] || 0) + count;
      }
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [data, selectedYear]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4', '#1abc9c', '#3498db', '#e74c3c', '#f39c12', '#9b59b6'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="country" 
          stroke="#ccc" 
          angle={-45} 
          textAnchor="end" 
          height={60}
          interval={0}
          tick={{ fontSize: 14 }}
        />
        <YAxis stroke="#ccc" />
        <Tooltip content={<DestinationTooltip />} />
        <Legend />
        <Bar 
          dataKey="count" 
          radius={[4, 4, 0, 0]}
          name="Emigrants"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

const FullScreenMultiLineChart = React.memo(({ data, yearRange, countryCount }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    const filteredByYear = data.filter(item => {
      const year = item.year;
      return year >= yearRange[0] && year <= yearRange[1];
    });

    if (!filteredByYear.length) return [];

    const countryTotals = {};
    filteredByYear.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (country && country !== 'Unknown') {
        countryTotals[country] = (countryTotals[country] || 0) + count;
      }
    });

    const topCountries = Object.entries(countryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, countryCount)
      .map(([country]) => country);

    const years = [...new Set(filteredByYear.map(item => item.year).filter(Boolean))].sort();
    const yearlyData = {};

    filteredByYear.forEach(item => {
      const year = item.year;
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      
      if (topCountries.includes(country)) {
        if (!yearlyData[year]) {
          yearlyData[year] = { year };
        }
        yearlyData[year][country] = (yearlyData[year][country] || 0) + count;
      }
    });

    return Object.values(yearlyData).sort((a, b) => a.year - b.year);
  }, [data, yearRange, countryCount]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  const countriesInChart = useMemo(() => {
    if (!chartData.length) return [];
    const countries = new Set();
    chartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'year' && item[key] > 0) {
          countries.add(key);
        }
      });
    });
    return Array.from(countries);
  }, [chartData]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip content={<DestinationTooltip />} />
        <Legend />
        {countriesInChart.map((country, index) => (
          <Line 
            key={country}
            type="monotone" 
            dataKey={country} 
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={3}
            dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: COLORS[index % COLORS.length] }}
            name={country}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

const FullScreenPieChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const countries = {};
    let totalCount = 0;
    
    filteredData.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (country && country !== 'Unknown') {
        countries[country] = (countries[country] || 0) + count;
        totalCount += count;
      }
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ 
        name: country,
        value: count,
        percentage: totalCount > 0 ? (count / totalCount * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data, selectedYear]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  const FullScreenPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index, name
  }) => {
    if (percent < 0.03) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 40;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={14}
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const FullScreenPieLegend = () => (
    <div className="destination-pie-legend destination-fullscreen-legend">
      {chartData.map((entry, index) => (
        <div key={`item-${index}`} className="destination-legend-item">
          <div 
            className="destination-legend-color" 
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span className="destination-legend-text">
            {entry.name}: {entry.percentage.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, padding: '30px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={FullScreenPieLabel}
              outerRadius={140}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [
                `${value?.toLocaleString() || '0'} emigrants (${chartData.find(item => item.name === name)?.percentage?.toFixed(1) || 0}%)`, 
                name
              ]} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="destination-legend-container destination-fullscreen-legend-container">
        <FullScreenPieLegend />
      </div>
    </div>
  );
});

// Full Screen Map Component
const FullScreenMap = React.memo(({ data, selectedYear }) => {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  const mapData = useMemo(() => {
    if (!data?.length) return [];

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return [];
    
    const countries = {};
    filteredData.forEach(item => {
      const country = item.country || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      if (country && country !== 'Unknown') {
        countries[country] = (countries[country] || 0) + count;
      }
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [data, selectedYear]);

  // Country name mapping
  const countryNameMapping = {
    'UNITED STATES': 'United States',
    'USA': 'United States',
    'US': 'United States',
    'CANADA': 'Canada',
    'JAPAN': 'Japan',
    'AUSTRALIA': 'Australia',
    'UNITED KINGDOM': 'United Kingdom',
    'UK': 'United Kingdom',
    'GERMANY': 'Germany',
    'FRANCE': 'France',
    'ITALY': 'Italy',
    'SPAIN': 'Spain',
    'SOUTH KOREA': 'South Korea',
    'KOREA': 'South Korea',
    'SINGAPORE': 'Singapore',
    'MALAYSIA': 'Malaysia',
    'UAE': 'United Arab Emirates',
    'UNITED ARAB EMIRATES': 'United Arab Emirates',
    'SAUDI ARABIA': 'Saudi Arabia',
    'QATAR': 'Qatar',
    'KUWAIT': 'Kuwait',
    'NEW ZEALAND': 'New Zealand',
  };

  const getStandardCountryName = (countryName) => {
    return countryNameMapping[countryName.toUpperCase()] || countryName;
  };

  // ENHANCED COLOR SCALE - Solution 1
  const maxEmigrants = Math.max(...mapData.map(d => d.count), 1);
  const colorScale = scaleLinear()
    .domain([
      0, 
      maxEmigrants * 0.1, 
      maxEmigrants * 0.3, 
      maxEmigrants * 0.6, 
      maxEmigrants
    ])
    .range([
      "#E8F4F8",  // Very light blue for low values
      "#4A90E2",  // Medium blue
      "#1E7FB8",  // Strong blue
      "#0F4C75",  // Dark blue
      "#002B49"   // Very dark blue for highest values
    ]);

  // Handle mouse events for tooltip
  const handleMouseEnter = (geo, event) => {
    const countryName = geo.properties.name;
    const countryData = mapData.find(d => 
      getStandardCountryName(d.country).toLowerCase() === countryName.toLowerCase() ||
      d.country.toLowerCase() === countryName.toLowerCase()
    );
    
    if (countryData) {
      setHoveredCountry(countryName);
      setTooltip({
        country: getStandardCountryName(countryData.country),
        count: countryData.count,
        x: event.clientX,
        y: event.clientY
      });
    } else {
      setTooltip({
        country: countryName,
        count: 0,
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const handleMouseMove = (event) => {
    if (tooltip) {
      setTooltip(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY
      }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    setHoveredCountry(null);
  };

  return (
    <div className="destination-fullscreen-choropleth-map">
      {/* Tooltip */}
      {tooltip && (
        <div 
          className="destination-map-tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          <div className="destination-map-tooltip-country">
            {tooltip.country}
          </div>
          <div className="destination-map-tooltip-count">
            {tooltip.count.toLocaleString()} emigrants
          </div>
        </div>
      )}

      <ComposableMap 
        projectionConfig={{ 
          scale: 180,
          rotation: [0, 0, 0] 
        }}
      >
        <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name;
              const countryData = mapData.find(d => 
                getStandardCountryName(d.country).toLowerCase() === countryName.toLowerCase() ||
                d.country.toLowerCase() === countryName.toLowerCase()
              );
              const color = countryData
                ? colorScale(countryData.count)
                : "#E0E0E0";
              
              const isHovered = hoveredCountry === countryName;
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={color}
                  // ENHANCED BORDERS - Solution 2
                  stroke={countryData ? "#2D3748" : "#CBD5E0"}
                  strokeWidth={countryData ? 1 : 0.5}
                  style={{
                    default: { 
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    },
                    hover: { 
                      fill: isHovered ? "#E53E3E" : color,
                      outline: "none",
                      cursor: "pointer",
                      strokeWidth: 2,
                      stroke: "#E53E3E"
                    },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={(event) => handleMouseEnter(geo, event)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      
      {/* Enhanced Legend */}
      <div className="destination-fullscreen-map-legend">
        <span className="destination-map-legend-label">Low</span>
        <div className="destination-map-legend-colors">
          {["#E8F4F8", "#4A90E2", "#1E7FB8", "#0F4C75", "#002B49"].map((color, i) => (
            <div 
              key={i}
              className="destination-map-legend-color"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="destination-map-legend-label">High</span>
      </div>
    </div>
  );
});

const FullScreenChart = React.memo(({ title, children, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="destination-fullscreen-chart-overlay">
      <div className="destination-fullscreen-chart-container">
        <div className="destination-fullscreen-chart-header">
          <h3>{title}</h3>
          <button className="destination-close-fullscreen" onClick={onClose}>
            <FiMinimize /> Close
          </button>
        </div>
        <div className="destination-fullscreen-chart-content">
          {children}
        </div>
      </div>
    </div>
  );
});

// Main DestinationCountriesPage Component
const DestinationCountriesPage = ({ rawData }) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [chartFilters, setChartFilters] = useState({
    bar: { year: 'all' },
    line: { yearRange: [1981, 2020], countryCount: 5 },
    pie: { year: 'all' },
    map: { year: 'all' }
  });

  const countriesData = useMemo(() => {
    return rawData?.allCountries || [];
  }, [rawData]);

  const hasData = countriesData.length > 0;

  // Filter handlers
  const updateBarFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      bar: { year }
    }));
  };

  const updateLineFilter = (yearRange, countryCount) => {
    setChartFilters(prev => ({
      ...prev,
      line: { 
        yearRange: yearRange || prev.line.yearRange,
        countryCount: countryCount !== undefined ? countryCount : prev.line.countryCount
      }
    }));
  };

  const updatePieFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      pie: { year }
    }));
  };

  const updateMapFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      map: { year }
    }));
  };

  const handleFullscreenToggle = (chartTitle) => {
    setFullScreenChart(fullScreenChart === chartTitle ? null : chartTitle);
  };

  const renderFullScreenContent = () => {
    switch (fullScreenChart) {
      case "Top 10 Destination Countries":
        return <FullScreenBarChart data={countriesData} selectedYear={chartFilters.bar.year} />;
      case "Emigration Trends":
        return <FullScreenMultiLineChart 
          data={countriesData} 
          yearRange={chartFilters.line.yearRange}
          countryCount={chartFilters.line.countryCount}
        />;
      case "Country Composition":
        return <FullScreenPieChart data={countriesData} selectedYear={chartFilters.pie.year} />;
      case "Emigrants Distribution Map":
        return <FullScreenMap data={countriesData} selectedYear={chartFilters.map.year} />;
      default:
        return null;
    }
  };

  return (
    <div className="destination-countries-page">
      <div className="destination-page-header">
        <h2><FiGlobe /> Destination Countries</h2>
        <p>Visualize where Filipinos migrate most</p>
      </div>

      {hasData ? (
        <>
          {/* Full Screen Chart Overlay */}
          <FullScreenChart 
            title={fullScreenChart}
            onClose={() => setFullScreenChart(null)}
            isOpen={!!fullScreenChart}
          >
            {renderFullScreenContent()}
          </FullScreenChart>

          {/* BIG MAP AT THE TOP - DOMINANT FEATURE */}
          <ChoroplethMap 
            data={countriesData}
            selectedYear={chartFilters.map.year}
            onYearChange={updateMapFilter}
            onFullscreen={() => handleFullscreenToggle("Emigrants Distribution Map")}
          />

          {/* TREND CHART - FULL WIDTH */}
          <div className={`destination-trend-chart-container ${fullScreenChart ? 'blurred' : ''}`}>
            <MultiLineTrendChart 
              data={countriesData}
              yearRange={chartFilters.line.yearRange}
              onYearRangeChange={(yearRange) => updateLineFilter(yearRange, undefined)}
              countryCount={chartFilters.line.countryCount}
              onCountryCountChange={(countryCount) => updateLineFilter(undefined, countryCount)}
              onFullscreen={() => handleFullscreenToggle("Emigration Trends")}
            />
          </div>

          {/* BAR CHART - FULL WIDTH */}
          <div className={`destination-full-width-chart ${fullScreenChart ? 'blurred' : ''}`}>
            <TopCountriesBarChart 
              data={countriesData}
              selectedYear={chartFilters.bar.year}
              onYearChange={updateBarFilter}
              onFullscreen={() => handleFullscreenToggle("Top 10 Destination Countries")}
            />
          </div>

          {/* COMPOSITION CHART - FULL WIDTH */}
          <div className={`destination-full-width-chart ${fullScreenChart ? 'blurred' : ''}`}>
            <CountryCompositionPieChart 
              data={countriesData}
              selectedYear={chartFilters.pie.year}
              onYearChange={updatePieFilter}
              onFullscreen={() => handleFullscreenToggle("Country Composition")}
            />
          </div>
        </>
      ) : (
        <div className="destination-empty-state">
          <FiAlertCircle size={48} />
          <h3>No Data Available</h3>
          <p>Please upload data in the CSV Upload section.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(DestinationCountriesPage);
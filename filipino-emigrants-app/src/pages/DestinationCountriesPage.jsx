import React, { useMemo, useState } from 'react';
import { 
  FiGlobe, FiAlertCircle, FiPieChart, FiBarChart2,
  FiMaximize, FiMinimize, FiTrendingUp
} from 'react-icons/fi';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, 
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import "../css/DestinationCountriesPage.css";

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
    <div className="chart-filter">
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
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="country" 
            stroke="#ccc" 
            angle={-45} 
            textAnchor="end" 
            height={80} 
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#ccc" />
          <Tooltip 
            formatter={(value) => [value.toLocaleString(), 'Emigrants']}
            labelFormatter={(label) => `Country: ${label}`}
          />
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

  const CountryCountFilter = () => (
    <div className="chart-filter">
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
        <div className="chart-filters-group">
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
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), 'Emigrants']}
              labelFormatter={(label) => `Year: ${label}`}
            />
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
          <div className="no-data-message">
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
        name: country, // Changed from 'country' to 'name' for Recharts compatibility
        value: count,   // Changed from 'count' to 'value' for Recharts compatibility
        percentage: totalCount > 0 ? (count / totalCount * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);
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
      title="Country Composition" 
      icon={<FiPieChart />}
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height="100%">
        {chartData.length > 0 ? (
          <PieChart>
            <Pie
              data={chartData.slice(0, 8)}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value" // Changed to 'value'
              nameKey="name"  // Added nameKey for proper legend labels
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              labelLine={true}
            >
              {chartData.slice(0, 8).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                `${value.toLocaleString()} (${props.payload.percentage.toFixed(1)}%)`, 
                'Emigrants'
              ]}
              labelFormatter={(label) => `Country: ${label}`}
            />
            <Legend 
              formatter={(value, entry, index) => (
                <span style={{ color: '#ccc', fontSize: '12px' }}>
                  {chartData[index]?.name || value}
                </span>
              )}
            />
          </PieChart>
        ) : (
          <div className="no-data-message">
            No composition data available for the selected year.
          </div>
        )}
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
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
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
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Emigrants']} />
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
        name: country, // Changed from 'country' to 'name'
        value: count,   // Changed from 'count' to 'value'
        percentage: totalCount > 0 ? (count / totalCount * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data, selectedYear]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={140}
          paddingAngle={2}
          dataKey="value" // Changed to 'value'
          nameKey="name"  // Added nameKey for proper legend labels
          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
          labelLine={true}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name, props) => [
            `${value.toLocaleString()} (${props.payload.percentage.toFixed(1)}%)`, 
            'Emigrants'
          ]}
        />
        <Legend 
          formatter={(value, entry, index) => (
            <span style={{ color: '#ccc', fontSize: '14px' }}>
              {chartData[index]?.name || value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

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

// Main DestinationCountriesPage Component
const DestinationCountriesPage = ({ rawData }) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [chartFilters, setChartFilters] = useState({
    bar: { year: 'all' },
    line: { yearRange: [1981, 2020], countryCount: 5 },
    pie: { year: 'all' }
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
      default:
        return null;
    }
  };

  return (
    <div className="destination-countries-page">
      <div className="page-header">
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

          {/* Charts Grid - Bar and Pie side by side, Multi-line below */}
          <div className={`charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
            <div className="side-by-side-charts">
              <TopCountriesBarChart 
                data={countriesData}
                selectedYear={chartFilters.bar.year}
                onYearChange={updateBarFilter}
                onFullscreen={() => handleFullscreenToggle("Top 10 Destination Countries")}
              />
              
              <CountryCompositionPieChart 
                data={countriesData}
                selectedYear={chartFilters.pie.year}
                onYearChange={updatePieFilter}
                onFullscreen={() => handleFullscreenToggle("Country Composition")}
              />
            </div>
            
            <MultiLineTrendChart 
              data={countriesData}
              yearRange={chartFilters.line.yearRange}
              onYearRangeChange={(yearRange) => updateLineFilter(yearRange, undefined)}
              countryCount={chartFilters.line.countryCount}
              onCountryCountChange={(countryCount) => updateLineFilter(undefined, countryCount)}
              onFullscreen={() => handleFullscreenToggle("Emigration Trends")}
            />
          </div>
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

export default React.memo(DestinationCountriesPage);
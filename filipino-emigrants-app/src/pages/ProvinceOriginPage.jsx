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
  const { chartData, totalCount } = useMemo(() => {
    if (!data?.length) return { chartData: [], totalCount: 0 };
    
    let filteredData = data;
    
    if (selectedYear !== 'all') {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return { chartData: [], totalCount: 0 };
    
    const provinces = {};
    let total = 0;
    
    filteredData.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinces[province] = (provinces[province] || 0) + count;
      total += count;
    });

    const chartData = Object.entries(provinces)
      .map(([province, count]) => ({ 
        province, 
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { chartData, totalCount: total };
  }, [data, selectedYear]);

  // FIXED: REMOVED FIXED Y-AXIS DOMAIN to show all values properly
  const getYAxisDomain = () => {
    if (!chartData.length) return [0, 'auto'];
    
    const maxValue = Math.max(...chartData.map(item => item.count));
    const minValue = Math.min(...chartData.map(item => item.count));
    
    // Use a reasonable padding based on the data range
    const padding = maxValue * 0.1; // 10% padding
    
    return [0, maxValue + padding];
  };

  const yearOptions = useMemo(() => [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...Array.from({ length: 40 }, (_, i) => ({ 
      value: 1981 + i, 
      label: (1981 + i).toString() 
    }))
  ], []);

  const YearDropdownFilter = () => (
    <div className="province-chart-filter">
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

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="province-custom-tooltip">
          <p className="province-tooltip-label">{`Province: ${label}`}</p>
          <p className="province-tooltip-value">{`Emigrants: ${data.count.toLocaleString()}`}</p>
          <p className="province-tooltip-value">{`Percentage: ${data.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer 
      title="Top 10 Origin Provinces" 
      icon={<FiBarChart2 />}
      className="full-width bar-chart"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            type="number" 
            stroke="#ccc" 
            tickFormatter={(value) => value.toLocaleString()}
            domain={getYAxisDomain()} // FIXED: Use dynamic domain
          />
          <YAxis 
            type="category" 
            dataKey="province" 
            width={120} 
            stroke="#ccc"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomBarTooltip />} />
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
      const count = Number(item.count) || 0;
      provinceTotals[province] = (provinceTotals[province] || 0) + count;
    });

    // Get top N provinces
    const sortedProvinces = Object.entries(provinceTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([province]) => province);

    // Get all unique years from the data within range
    const allYears = [...new Set(data.map(item => Number(item.year)).filter(year => !isNaN(year)))].sort();
    const yearsInRange = allYears.filter(year => year >= yearRange[0] && year <= yearRange[1]);

    // Create chart data for each year
    const trendData = yearsInRange.map(year => {
      const yearData = { year };
      
      // For each top province, get the count for this year
      sortedProvinces.forEach(province => {
        const provinceData = data.filter(item => 
          Number(item.year) === year && 
          item.province === province
        );
        
        const totalCount = provinceData.reduce((sum, item) => {
          const count = Number(item.count) || 0;
          return sum + count;
        }, 0);
        
        yearData[province] = totalCount;
      });
      
      return yearData;
    });

    return { chartData: trendData, topProvinces: sortedProvinces };
  }, [data, topN, yearRange]);

  // FIXED: IMPROVED Y-AXIS CONFIGURATION
  const getYAxisConfig = () => {
    if (!chartData.length) return {};
    
    // Calculate max value across all data points
    let maxValue = 0;
    chartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'year' && item[key] > maxValue) {
          maxValue = item[key];
        }
      });
    });
    
    return {
      domain: [0, maxValue * 1.1], // 10% padding on top
      tickCount: 6, // Reasonable number of ticks
      allowDecimals: false
    };
  };

  const yAxisConfig = getYAxisConfig();

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="province-custom-tooltip">
          <p className="province-tooltip-label">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="province-tooltip-value" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value?.toLocaleString() || 0} emigrants`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const TopNSelector = () => (
    <div className="province-chart-filter">
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
    <div className="province-chart-filter">
      <label>Year Range:</label>
      <div className="province-range-inputs">
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
      className="full-width trends-chart"
      onFullscreen={onFullscreen}
      filters={
        <div className="province-chart-filters-row">
          <TopNSelector />
          <YearRangeFilter />
        </div>
      }
    >
      {chartData.length === 0 ? (
        <div className="province-empty-state">
          <FiAlertCircle size={32} />
          <p>No trend data available for the selected filters</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="year" 
              stroke="#ccc"
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              stroke="#ccc" 
              tick={{ fontSize: 11 }}
              width={80}
              tickFormatter={(value) => value.toLocaleString()}
              domain={yAxisConfig.domain}
              tickCount={yAxisConfig.tickCount}
              allowDecimals={yAxisConfig.allowDecimals}
            />
            <Tooltip content={<CustomTrendTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={80}
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px'
              }}
            />
            {topProvinces.map((province, index) => (
              <Line
                key={province}
                type="monotone"
                dataKey={province}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                name={`${province}`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
});

const ProvinceCompositionChart = React.memo(({ 
  data, 
  selectedYear, 
  onYearChange, 
  onFullscreen 
}) => {
  const { chartData, totalCount } = useMemo(() => {
    if (!data?.length) return { chartData: [], totalCount: 0 };
    
    let filteredData = data;
    
    if (selectedYear !== 'all') {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return { chartData: [], totalCount: 0 };
    
    const provinces = {};
    let total = 0;
    
    filteredData.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinces[province] = (provinces[province] || 0) + count;
      total += count;
    });

    const chartData = Object.entries(provinces)
      .map(([province, count]) => ({ 
        province, 
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return { chartData, totalCount: total };
  }, [data, selectedYear]);

  const yearOptions = useMemo(() => [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...Array.from({ length: 40 }, (_, i) => ({ 
      value: 1981 + i, 
      label: (1981 + i).toString() 
    }))
  ], []);

  const YearDropdownFilter = () => (
    <div className="province-chart-filter">
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

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="province-custom-tooltip">
          <p className="province-tooltip-label">{`Province: ${data.province}`}</p>
          <p className="province-tooltip-value">{`Emigrants: ${data.count.toLocaleString()}`}</p>
          <p className="province-tooltip-value">{`Percentage: ${data.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Pie Label - only show for significant slices
  const CustomPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index
  }) => {
    if (percent < 0.03) { // Don't show labels for very small percentages (less than 3%)
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

  // Pie Chart Legend Component
  const PieChartLegend = ({ data }) => (
    <div className="province-pie-legend">
      {data.map((entry, index) => (
        <div key={`legend-${index}`} className="province-legend-item">
          <div 
            className="province-legend-color" 
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span className="province-legend-text">
            {entry.province}: {entry.percentage}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <ChartContainer 
      title="Province Composition" 
      icon={<FiPieChart />}
      className="composition-chart"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      {chartData.length > 0 ? (
        <div className="province-composition-container">
          <div className="province-donut-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
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
                  dataKey="count"
                  nameKey="province"
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
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="province-legend-wrapper">
            <PieChartLegend data={chartData} />
          </div>
        </div>
      ) : (
        <div className="province-empty-state">
          <FiAlertCircle size={32} />
          <p>No data available for selected year</p>
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
  <div className={`province-chart-card ${className}`}>
    <div className="province-chart-header">
      <div className="province-chart-title">
        {icon && <span className="province-chart-icon">{icon}</span>}
        <h4>{title}</h4>
      </div>
      <div className="province-chart-controls">
        {filters}
        <button 
          className="province-fullscreen-btn"
          onClick={onFullscreen}
          title="Toggle fullscreen"
        >
          <FiMaximize />
        </button>
      </div>
    </div>
    <div className="province-chart-content">
      {children}
    </div>
  </div>
));

// Full Screen Component
const FullScreenChart = React.memo(({ title, children, onClose, isOpen, filters }) => {
  if (!isOpen) return null;

  return (
    <div className="province-fullscreen-overlay">
      <div className="province-fullscreen-container">
        <div className="province-fullscreen-header">
          <h3>{title}</h3>
          <div className="province-fullscreen-controls">
            {filters}
            <button className="province-close-fullscreen" onClick={onClose}>
              <FiMinimize /> Close
            </button>
          </div>
        </div>
        <div className="province-fullscreen-content">
          {children}
        </div>
      </div>
    </div>
  );
});

// Full Screen Content Components
const FullScreenProvinceBarChart = React.memo(({ data, selectedYear }) => {
  const { chartData, totalCount } = useMemo(() => {
    if (!data?.length) return { chartData: [], totalCount: 0 };
    
    let filteredData = data;
    
    if (selectedYear !== 'all') {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return { chartData: [], totalCount: 0 };
    
    const provinces = {};
    let total = 0;
    
    filteredData.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinces[province] = (provinces[province] || 0) + count;
      total += count;
    });

    const chartData = Object.entries(provinces)
      .map(([province, count]) => ({ 
        province, 
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return { chartData, totalCount: total };
  }, [data, selectedYear]);

  // FIXED: DYNAMIC Y-AXIS DOMAIN for full screen
  const getYAxisDomain = () => {
    if (!chartData.length) return [0, 'auto'];
    
    const maxValue = Math.max(...chartData.map(item => item.count));
    const padding = maxValue * 0.1;
    
    return [0, maxValue + padding];
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="province-custom-tooltip">
          <p className="province-tooltip-label">{`Province: ${label}`}</p>
          <p className="province-tooltip-value">{`Emigrants: ${data.count.toLocaleString()}`}</p>
          <p className="province-tooltip-value">{`Percentage: ${data.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart 
        data={chartData} 
        layout="vertical" 
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          type="number" 
          stroke="#ccc" 
          tickFormatter={(value) => value.toLocaleString()}
          domain={getYAxisDomain()} // FIXED: Use dynamic domain
        />
        <YAxis 
          type="category" 
          dataKey="province" 
          width={150} 
          stroke="#ccc"
          tick={{ fontSize: 14 }}
        />
        <Tooltip content={<CustomBarTooltip />} />
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

  // FIXED: IMPROVED Y-AXIS FOR FULL SCREEN
  const getYAxisConfig = () => {
    if (!chartData.length) return {};
    
    let maxValue = 0;
    chartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'year' && item[key] > maxValue) {
          maxValue = item[key];
        }
      });
    });
    
    return {
      domain: [0, maxValue * 1.1],
      tickCount: 8,
      allowDecimals: false
    };
  };

  const yAxisConfig = getYAxisConfig();

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4'];

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="province-custom-tooltip">
          <p className="province-tooltip-label">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="province-tooltip-value" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toLocaleString()} emigrants`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart 
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="year" 
          stroke="#ccc"
          angle={-45}
          textAnchor="end"
          height={80}
          interval="preserveStartEnd"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#ccc" 
          tick={{ fontSize: 12 }}
          width={80}
          tickFormatter={(value) => value.toLocaleString()}
          domain={yAxisConfig.domain}
          tickCount={yAxisConfig.tickCount}
          allowDecimals={yAxisConfig.allowDecimals}
        />
        <Tooltip content={<CustomTrendTooltip />} />
        <Legend 
          verticalAlign="bottom"
          height={100}
          wrapperStyle={{
            paddingTop: '30px',
            fontSize: '14px'
          }}
        />
        {topProvinces.map((province, index) => (
          <Line
            key={province}
            type="monotone"
            dataKey={province}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={3}
            dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 8, strokeWidth: 0 }}
            name={`${province} emigrants`}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

const FullScreenProvinceCompositionChart = React.memo(({ data, selectedYear }) => {
  const { chartData, totalCount } = useMemo(() => {
    if (!data?.length) return { chartData: [], totalCount: 0 };
    
    let filteredData = data;
    
    if (selectedYear !== 'all') {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    if (!filteredData.length) return { chartData: [], totalCount: 0 };
    
    const provinces = {};
    let total = 0;
    
    filteredData.forEach(item => {
      const province = item.province || 'Unknown';
      const count = Number(item.count) || Number(item.total) || 0;
      provinces[province] = (provinces[province] || 0) + count;
      total += count;
    });

    const chartData = Object.entries(provinces)
      .map(([province, count]) => ({ 
        province, 
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { chartData, totalCount: total };
  }, [data, selectedYear]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505'];

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="province-custom-tooltip">
          <p className="province-tooltip-label">{`Province: ${data.province}`}</p>
          <p className="province-tooltip-value">{`Emigrants: ${data.count.toLocaleString()}`}</p>
          <p className="province-tooltip-value">{`Percentage: ${data.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index
  }) => {
    if (percent < 0.03) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
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

  const PieChartLegend = ({ data }) => (
    <div className="province-pie-legend">
      {data.map((entry, index) => (
        <div key={`legend-${index}`} className="province-legend-item">
          <div 
            className="province-legend-color" 
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span className="province-legend-text">
            {entry.province}: {entry.percentage}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="province-fullscreen-composition-container">
      <div className="province-fullscreen-donut-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomPieLabel}
              outerRadius={150}
              innerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="province"
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
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="province-fullscreen-legend-wrapper">
        <PieChartLegend data={chartData} />
      </div>
    </div>
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

  const renderFullScreenFilters = () => {
    const { barChart, trendsChart, compositionChart } = chartFilters;

    switch (fullScreenChart) {
      case "Top 10 Origin Provinces":
        return (
          <YearDropdownFilter 
            value={barChart.year}
            onChange={updateBarChartFilter}
          />
        );
      case "Top Provinces Migration Trends":
        return (
          <div className="province-chart-filters-row">
            <TopNSelector 
              value={trendsChart.topN}
              onChange={(topN) => updateTrendsChartFilter({ topN })}
            />
            <YearRangeFilter 
              value={trendsChart.yearRange}
              onChange={(yearRange) => updateTrendsChartFilter({ yearRange })}
            />
          </div>
        );
      case "Province Composition":
        return (
          <YearDropdownFilter 
            value={compositionChart.year}
            onChange={updateCompositionChartFilter}
          />
        );
      default:
        return null;
    }
  };

  // Filter components for full screen
  const YearDropdownFilter = ({ value, onChange }) => {
    const yearOptions = [
      { value: 'all', label: 'All Years (1981-2020)' },
      ...Array.from({ length: 40 }, (_, i) => ({ 
        value: 1981 + i, 
        label: (1981 + i).toString() 
      }))
    ];

    return (
      <div className="province-chart-filter">
        <label>Filter by Year:</label>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
        >
          {yearOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const TopNSelector = ({ value, onChange }) => (
    <div className="province-chart-filter">
      <label>Show Top:</label>
      <select 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
      >
        <option value={3}>3 Provinces</option>
        <option value={5}>5 Provinces</option>
        <option value={10}>10 Provinces</option>
      </select>
    </div>
  );

  const YearRangeFilter = ({ value, onChange }) => (
    <div className="province-chart-filter">
      <label>Year Range:</label>
      <div className="province-range-inputs">
        <input
          type="number"
          value={value[0]}
          onChange={(e) => onChange([parseInt(e.target.value) || 1981, value[1]])}
          min="1981"
          max="2020"
        />
        <span>to</span>
        <input
          type="number"
          value={value[1]}
          onChange={(e) => onChange([value[0], parseInt(e.target.value) || 2020])}
          min="1981"
          max="2020"
        />
      </div>
    </div>
  );

  return (
    <div className="province-origin-page">
      <div className="province-page-header">
        <h2><FiMap /> Place of Origin (Province)</h2>
        <p>Detailed analysis of emigrant origins at province level</p>
      </div>

      {hasData ? (
        <>
          {/* Full Screen Chart Overlay */}
          <FullScreenChart 
            title={fullScreenChart}
            onClose={() => setFullScreenChart(null)}
            isOpen={!!fullScreenChart}
            filters={renderFullScreenFilters()}
          >
            {renderFullScreenContent()}
          </FullScreenChart>

          {/* Charts Grid */}
          <div className={`province-charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
            <div className="province-chart-row-full province-trend-chart-row">
              <ProvinceTrendsChart 
                data={processedData}
                topN={chartFilters.trendsChart.topN}
                onTopNChange={(topN) => updateTrendsChartFilter({ topN })}
                yearRange={chartFilters.trendsChart.yearRange}
                onYearRangeChange={(yearRange) => updateTrendsChartFilter({ yearRange })}
                onFullscreen={() => handleFullscreenToggle("Top Provinces Migration Trends")}
              />
            </div>

            <div className="province-chart-row-full province-distribution-chart-row">
              <ProvinceBarChart 
                data={processedData}
                selectedYear={chartFilters.barChart.year}
                onYearChange={updateBarChartFilter}
                onFullscreen={() => handleFullscreenToggle("Top 10 Origin Provinces")}
              />
            </div>

            <div className="province-chart-row-full province-composition-chart-row">
              <ProvinceCompositionChart 
                data={processedData}
                selectedYear={chartFilters.compositionChart.year}
                onYearChange={updateCompositionChartFilter}
                onFullscreen={() => handleFullscreenToggle("Province Composition")}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="province-empty-state">
          <FiAlertCircle size={48} />
          <h3>No Province Data Available</h3>
          <p>Please upload province data in the CSV Upload section.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProvinceOriginPage);
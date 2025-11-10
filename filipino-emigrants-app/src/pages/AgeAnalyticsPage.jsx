import React, { useMemo, useState } from 'react';
import { 
  FiCalendar, FiAlertCircle, FiPieChart, FiBarChart2, FiTrendingUp, FiMaximize, FiMinimize
} from 'react-icons/fi';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, 
  ResponsiveContainer, Cell
} from 'recharts';
import '../css/AgeAnalytics.css'; 

const AgeAnalyticsPage = ({ rawData }) => {
  const [chartFilters, setChartFilters] = useState({
    barChart: { year: 'all' },
    pieChart: { year: 'all' },
    lineChart: { 
      ageGroup: '14 - Below',
      yearRange: [1981, 2020] 
    }
  });
  const [fullScreenChart, setFullScreenChart] = useState(null);

  // Process available data once
  const { availableYears, availableAgeGroups, ageData } = useMemo(() => {
    const availableYears = [...new Set(rawData?.ageData?.map(item => item.year) || [])].sort();
    const availableAgeGroups = [...new Set(rawData?.ageData?.map(item => item.ageGroup || item.age_group).filter(Boolean) || [])].sort();
    
    return {
      availableYears,
      availableAgeGroups,
      ageData: rawData?.ageData || []
    };
  }, [rawData]);

  // Bar Chart Data - Age Distribution
  const { barChartData, hasBarData } = useMemo(() => {
    let filteredData = [];
    
    if (chartFilters.barChart.year === 'all') {
      filteredData = ageData;
    } else {
      filteredData = ageData.filter(item => item.year === chartFilters.barChart.year);
    }

    if (!filteredData.length) return { barChartData: [], hasBarData: false };
    
    const ageGroups = {};
    filteredData.forEach(item => {
      const ageGroup = item.ageGroup || item.age_group || 'Unknown';
      const count = Number(item.count) || 0;
      ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + count;
    });

    const barChartData = Object.entries(ageGroups)
      .map(([ageGroup, count]) => ({ ageGroup, count }))
      .sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));

    return {
      barChartData,
      hasBarData: barChartData.length > 0
    };
  }, [ageData, chartFilters.barChart.year]);

  // Pie Chart Data - Age Group Composition
  const { pieChartData, hasPieData, totalCount } = useMemo(() => {
    let filteredData = [];
    
    if (chartFilters.pieChart.year === 'all') {
      filteredData = ageData;
    } else {
      filteredData = ageData.filter(item => item.year === chartFilters.pieChart.year);
    }

    if (!filteredData.length) return { pieChartData: [], hasPieData: false, totalCount: 0 };
    
    const ageGroups = {};
    let total = 0;
    
    filteredData.forEach(item => {
      const ageGroup = item.ageGroup || item.age_group || 'Unknown';
      const count = Number(item.count) || 0;
      ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + count;
      total += count;
    });

    const pieChartData = Object.entries(ageGroups)
      .map(([ageGroup, count]) => ({ 
        ageGroup, 
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));

    return {
      pieChartData,
      hasPieData: pieChartData.length > 0,
      totalCount: total
    };
  }, [ageData, chartFilters.pieChart.year]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986', '#9013FE', '#417505', '#FF6B6B', '#4ECDC4', '#FFA07A', '#98D8C8', '#F06292'];
  
  const hasAnyData = ageData.length > 0;

  // Year options for dropdowns
  const yearOptions = [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...Array.from({ length: 40 }, (_, i) => ({ 
      value: 1981 + i, 
      label: (1981 + i).toString() 
    }))
  ];

  // Update chart filters
  const updateChartFilter = (chartType, filterKey, value) => {
    setChartFilters(prev => ({
      ...prev,
      [chartType]: {
        ...prev[chartType],
        [filterKey]: value
      }
    }));
  };

  // Memoized Filter Components
  const YearDropdownFilter = React.useMemo(() => 
    ({ value, onChange, label = "Filter by Year" }) => (
      <div className="chart-filter">
        <label>{label}:</label>
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
    ), [yearOptions]);

  const AgeGroupDropdownFilter = React.useMemo(() => 
    ({ value, onChange }) => (
      <div className="chart-filter">
        <label>Age Group:</label>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select Age Group</option>
          {availableAgeGroups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>
    ), [availableAgeGroups]);

  const YearRangeFilter = React.useMemo(() => 
    ({ value, onChange }) => (
      <div className="chart-filter">
        <label>Year Range:</label>
        <div className="range-inputs">
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
    ), []);

  const handleFullscreenToggle = (chartTitle) => {
    setFullScreenChart(fullScreenChart === chartTitle ? null : chartTitle);
  };

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Age Group: ${data.ageGroup}`}</p>
          <p className="tooltip-value">{`Count: ${data.count.toLocaleString()}`}</p>
          <p className="tooltip-value">{`Percentage: ${data.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Pie Label - only show for significant slices (like in Civil Status)
  const CustomPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index, name
  }) => {
    if (percent < 0.03) { // Don't show labels for very small percentages (less than 3%)
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20; // Move label outside the pie
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

  // Individual chart render functions
  const renderBarChart = (isFullScreen = false) => (
    <ResponsiveContainer width="100%" height={isFullScreen ? "85%" : "100%"}>
      <BarChart 
        data={barChartData}
        margin={isFullScreen ? { top: 20, right: 30, left: 20, bottom: 80 } : { top: 10, right: 30, left: 10, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="ageGroup" 
          stroke="#ccc" 
          angle={-45}
          textAnchor="end"
          height={isFullScreen ? 100 : 70}
          interval={0}
          fontSize={isFullScreen ? 12 : 10}
        />
        <YAxis stroke="#ccc" />
        <Tooltip 
          formatter={(value) => [value.toLocaleString(), 'Count']}
          labelFormatter={(label) => `Age Group: ${label}`}
        />
        <Bar 
          dataKey="count" 
          fill={COLORS[1]} 
          radius={[4, 4, 0, 0]}
          name="Emigrants Count"
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = (isFullScreen = false) => (
    <ResponsiveContainer width="100%" height={isFullScreen ? "85%" : "100%"}>
      <PieChart>
        <Pie
          data={pieChartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={CustomPieLabel}
          outerRadius={isFullScreen ? 150 : 100}
          innerRadius={isFullScreen ? 80 : 50}
          fill="#8884d8"
          dataKey="count"
          nameKey="ageGroup"
          paddingAngle={2}
        >
          {pieChartData.map((entry, index) => (
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
  );

  // Custom Legend Component for Pie Chart (always shows percentages)
  const PieChartLegend = ({ data }) => (
    <div className="pie-legend">
      {data.map((entry, index) => (
        <div key={`legend-${index}`} className="legend-item">
          <div 
            className="legend-color" 
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span className="legend-text">
            {entry.ageGroup}: {entry.percentage}%
          </span>
        </div>
      ))}
    </div>
  );

  // Full screen chart renderers with better margins
  const renderFullScreenBarChart = () => renderBarChart(true);
  const renderFullScreenPieChart = () => renderPieChart(true);

  return (
    <div className="data-page age-analytics-page">
      <div className="page-header">
        <h2><FiCalendar /> Age Analytics</h2>
        <p>Visualize emigrants by age groups</p>
      </div>

      {/* Full Screen Chart Overlay */}
      {fullScreenChart && (
        <FullScreenChart 
          title={fullScreenChart}
          onClose={() => setFullScreenChart(null)}
          filters={
            fullScreenChart === "Age Distribution" && (
              <YearDropdownFilter 
                value={chartFilters.barChart.year}
                onChange={(year) => updateChartFilter('barChart', 'year', year)}
                label="View Year"
              />
            ) ||
            fullScreenChart === "Age Group Composition" && (
              <YearDropdownFilter 
                value={chartFilters.pieChart.year}
                onChange={(year) => updateChartFilter('pieChart', 'year', year)}
                label="View Year"
              />
            ) ||
            fullScreenChart === "Age Group Trend" && (
              <div className="chart-filters-row">
                <AgeGroupDropdownFilter 
                  value={chartFilters.lineChart.ageGroup}
                  onChange={(ageGroup) => updateChartFilter('lineChart', 'ageGroup', ageGroup)}
                />
                <YearRangeFilter 
                  value={chartFilters.lineChart.yearRange}
                  onChange={(range) => updateChartFilter('lineChart', 'yearRange', range)}
                />
              </div>
            )
          }
        >
          {fullScreenChart === "Age Distribution" && renderFullScreenBarChart()}
          {fullScreenChart === "Age Group Composition" && (
            <div className="fullscreen-composition-container">
              <div className="fullscreen-donut-wrapper">
                {renderFullScreenPieChart()}
              </div>
              <div className="fullscreen-legend-wrapper">
                <PieChartLegend data={pieChartData} />
              </div>
            </div>
          )}
          {fullScreenChart === "Age Group Trend" && (
            <FullScreenAgeGroupTrendChart 
              ageData={ageData}
              ageGroup={chartFilters.lineChart.ageGroup}
              yearRange={chartFilters.lineChart.yearRange}
            />
          )}
        </FullScreenChart>
      )}

      {hasAnyData ? (
        <div className={`charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
          {/* Age Group Trend - Full Width */}
          <div className="chart-row-full trend-chart-row">
            <ChartContainer 
              title="Age Group Trend" 
              icon={<FiTrendingUp />}
              filters={
                <div className="chart-filters-row">
                  <AgeGroupDropdownFilter 
                    value={chartFilters.lineChart.ageGroup}
                    onChange={(ageGroup) => updateChartFilter('lineChart', 'ageGroup', ageGroup)}
                  />
                  <YearRangeFilter 
                    value={chartFilters.lineChart.yearRange}
                    onChange={(range) => updateChartFilter('lineChart', 'yearRange', range)}
                  />
                </div>
              }
              onFullscreen={() => handleFullscreenToggle("Age Group Trend")}
            >
              <AgeGroupTrendChart 
                ageData={ageData}
                ageGroup={chartFilters.lineChart.ageGroup}
                yearRange={chartFilters.lineChart.yearRange}
              />
            </ChartContainer>
          </div>

          {/* Age Distribution - Taller Container */}
          <div className="chart-row-full distribution-chart-row">
            <ChartContainer 
              title="Age Distribution" 
              icon={<FiBarChart2 />}
              filters={
                <YearDropdownFilter 
                  value={chartFilters.barChart.year}
                  onChange={(year) => updateChartFilter('barChart', 'year', year)}
                  label="View Year"
                />
              }
              onFullscreen={() => handleFullscreenToggle("Age Distribution")}
            >
              {hasBarData ? (
                renderBarChart()
              ) : (
                <div className="empty-state">
                  <FiAlertCircle size={32} />
                  <p>No data available for selected year</p>
                </div>
              )}
            </ChartContainer>
          </div>

          {/* Age Group Composition - Taller Container with Donut Chart */}
          <div className="chart-row-full composition-chart-row">
            <ChartContainer 
              title="Age Group Composition" 
              icon={<FiPieChart />}
              filters={
                <YearDropdownFilter 
                  value={chartFilters.pieChart.year}
                  onChange={(year) => updateChartFilter('pieChart', 'year', year)}
                  label="View Year"
                />
              }
              onFullscreen={() => handleFullscreenToggle("Age Group Composition")}
            >
              {hasPieData ? (
                <div className="composition-container">
                  <div className="donut-chart-wrapper">
                    {renderPieChart()}
                  </div>
                  <div className="legend-wrapper">
                    <PieChartLegend data={pieChartData} />
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <FiAlertCircle size={32} />
                  <p>No data available for selected year</p>
                </div>
              )}
            </ChartContainer>
          </div>
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

// Memoized Chart Container
const ChartContainer = React.memo(({ 
  title, 
  children, 
  className = "", 
  icon, 
  filters,
  onFullscreen 
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
          {<FiMaximize />}
        </button>
      </div>
    </div>
    <div className="chart-content">
      {children}
    </div>
  </div>
));

// Memoized Full Screen Component
const FullScreenChart = React.memo(({ title, children, onClose, filters }) => (
  <div className="fullscreen-chart-overlay">
    <div className="fullscreen-chart-container">
      <div className="fullscreen-chart-header">
        <h3>{title}</h3>
        <div className="fullscreen-controls">
          {filters}
          <button className="close-fullscreen" onClick={onClose}>
            <FiMinimize /> Close
          </button>
        </div>
      </div>
      <div className="fullscreen-chart-content">
        {children}
      </div>
    </div>
  </div>
));

// Separate memoized component for the trend chart
const AgeGroupTrendChart = React.memo(({ ageData, ageGroup, yearRange }) => {
  const lineChartData = useMemo(() => {
    if (!ageData.length || !ageGroup) {
      return [];
    }
    
    const trendData = {};
    ageData.forEach(item => {
      const itemAgeGroup = item.ageGroup || item.age_group;
      const year = item.year;
      const count = Number(item.count) || 0;
      
      if (itemAgeGroup === ageGroup && 
          year >= yearRange[0] && 
          year <= yearRange[1]) {
        trendData[year] = (trendData[year] || 0) + count;
      }
    });

    return Object.entries(trendData)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
  }, [ageData, ageGroup, yearRange]);

  const hasLineData = lineChartData.length > 0;
  const COLORS = ['#4A90E2'];

  if (!ageGroup) {
    return (
      <div className="empty-state">
        <FiAlertCircle size={32} />
        <p>Please select an age group to view trends</p>
      </div>
    );
  }

  if (!hasLineData) {
    return (
      <div className="empty-state">
        <FiAlertCircle size={32} />
        <p>No trend data available for {ageGroup} in selected range</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={lineChartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip 
          formatter={(value) => [value.toLocaleString(), 'Count']}
          labelFormatter={(label) => `Year: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke={COLORS[0]} 
          strokeWidth={3}
          dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: COLORS[0] }}
          name={`${ageGroup} Emigrants`}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

// Full screen version of trend chart
const FullScreenAgeGroupTrendChart = React.memo(({ ageData, ageGroup, yearRange }) => {
  const lineChartData = useMemo(() => {
    if (!ageData.length || !ageGroup) {
      return [];
    }
    
    const trendData = {};
    ageData.forEach(item => {
      const itemAgeGroup = item.ageGroup || item.age_group;
      const year = item.year;
      const count = Number(item.count) || 0;
      
      if (itemAgeGroup === ageGroup && 
          year >= yearRange[0] && 
          year <= yearRange[1]) {
        trendData[year] = (trendData[year] || 0) + count;
      }
    });

    return Object.entries(trendData)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
  }, [ageData, ageGroup, yearRange]);

  const hasLineData = lineChartData.length > 0;
  const COLORS = ['#4A90E2'];

  if (!ageGroup) {
    return (
      <div className="empty-state">
        <FiAlertCircle size={32} />
        <p>Please select an age group to view trends</p>
      </div>
    );
  }

  if (!hasLineData) {
    return (
      <div className="empty-state">
        <FiAlertCircle size={32} />
        <p>No trend data available for {ageGroup} in selected range</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="85%">
      <LineChart data={lineChartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip 
          formatter={(value) => [value.toLocaleString(), 'Count']}
          labelFormatter={(label) => `Year: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke={COLORS[0]} 
          strokeWidth={3}
          dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 8, fill: COLORS[0], strokeWidth: 0 }}
          name={`${ageGroup} Emigrants`}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

AgeGroupTrendChart.displayName = 'AgeGroupTrendChart';
FullScreenAgeGroupTrendChart.displayName = 'FullScreenAgeGroupTrendChart';

export default React.memo(AgeAnalyticsPage);
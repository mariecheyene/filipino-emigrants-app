import React, { useMemo, useState, useEffect } from 'react';
import { 
  FiUser, FiTrendingUp, FiPieChart, FiBarChart2, 
  FiFilter, FiAlertCircle, FiRefreshCw,
  FiMaximize, FiMinimize
} from 'react-icons/fi';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { getAllData, getReadStats, resetSession } from '../services/emigrantsService';
import '../css/CivilStatusPage.css';

// Custom Tooltip Component for better clarity
const CivilStatusTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="civil-status-tooltip">
        <p className="civil-status-tooltip-label">{`Year: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="civil-status-tooltip-item">
            <span 
              className="civil-status-tooltip-color" 
              style={{ backgroundColor: entry.color }}
            ></span>
            {`${entry.name}: ${entry.value?.toLocaleString() || '0'} people`}
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

// SIMPLE FIXED SCALING - START AT 50,000 AND GO UP
const useFixedYAxisDomain = () => {
  return [50000, 'auto']; // START AT 50,000 AND AUTO-SCALE UP
};

// Individual Chart Components with React.memo
const TrendsChart = React.memo(({ data, yearRange, civilStatusTypes, onYearRangeChange, onCivilStatusTypesChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    return data.civilStatus
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1])
      .sort((a, b) => a.year - b.year);
  }, [data, yearRange]);

  // FIXED: START AT 50,000
  const yAxisDomain = useFixedYAxisDomain();

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  const YearRangeFilter = () => (
    <div className="civil-status-chart-filter">
      <label>Year Range:</label>
      <div className="civil-status-range-inputs">
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

  const CivilStatusFilter = () => (
    <div className="civil-status-chart-filter">
      <label>Civil Status:</label>
      <div className="civil-status-checkbox-grid">
        {[
          { key: 'single', label: 'Single' },
          { key: 'married', label: 'Married' },
          { key: 'widower', label: 'Widower' },
          { key: 'separated', label: 'Separated' },
          { key: 'divorced', label: 'Divorced' },
          { key: 'notReported', label: 'Not Reported' }
        ].map(({ key, label }) => (
          <label key={key} className="civil-status-checkbox-label">
            <input
              type="checkbox"
              checked={civilStatusTypes.includes(key)}
              onChange={(e) => {
                const newTypes = e.target.checked
                  ? [...civilStatusTypes, key]
                  : civilStatusTypes.filter(t => t !== key);
                onCivilStatusTypesChange(newTypes);
              }}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="civil-status-chart-card civil-status-full-width">
      <div className="civil-status-chart-header">
        <div className="civil-status-chart-title">
          <span className="civil-status-chart-icon"><FiTrendingUp /></span>
          <h4>Civil Status Trends Over Time</h4>
        </div>
        <div className="civil-status-chart-controls">
          <YearRangeFilter />
          <CivilStatusFilter />
          <button 
            className="civil-status-fullscreen-btn"
            onClick={onFullscreen}
            title="Toggle fullscreen"
          >
            <FiMaximize />
          </button>
        </div>
      </div>
      <div className="civil-status-chart-content">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={yAxisDomain} tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip content={<CivilStatusTooltip />} />
              <Legend />
              {civilStatusTypes.includes('single') && (
                <Line 
                  type="monotone" 
                  dataKey="single" 
                  stroke={COLORS[0]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[0], r: 4 }}
                  name="Single" 
                />
              )}
              {civilStatusTypes.includes('married') && (
                <Line 
                  type="monotone" 
                  dataKey="married" 
                  stroke={COLORS[1]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[1], r: 4 }}
                  name="Married" 
                />
              )}
              {civilStatusTypes.includes('widower') && (
                <Line 
                  type="monotone" 
                  dataKey="widower" 
                  stroke={COLORS[2]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[2], r: 4 }}
                  name="Widower" 
                />
              )}
              {civilStatusTypes.includes('separated') && (
                <Line 
                  type="monotone" 
                  dataKey="separated" 
                  stroke={COLORS[3]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[3], r: 4 }}
                  name="Separated" 
                />
              )}
              {civilStatusTypes.includes('divorced') && (
                <Line 
                  type="monotone" 
                  dataKey="divorced" 
                  stroke={COLORS[4]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[4], r: 4 }}
                  name="Divorced" 
                />
              )}
              {civilStatusTypes.includes('notReported') && (
                <Line 
                  type="monotone" 
                  dataKey="notReported" 
                  stroke={COLORS[5]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[5], r: 4 }}
                  name="Not Reported" 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="civil-status-no-data">
            No data available for the selected filters
          </div>
        )}
      </div>
    </div>
  );
});

const DistributionChart = React.memo(({ data, yearRange, onYearRangeChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    return data.civilStatus
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1])
      .sort((a, b) => a.year - b.year);
  }, [data, yearRange]);

  // FIXED: START AT 50,000
  const yAxisDomain = useFixedYAxisDomain();

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  const YearRangeFilter = () => (
    <div className="civil-status-chart-filter">
      <label>Year Range:</label>
      <div className="civil-status-range-inputs">
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
    <div className="civil-status-chart-card civil-status-full-width">
      <div className="civil-status-chart-header">
        <div className="civil-status-chart-title">
          <span className="civil-status-chart-icon"><FiBarChart2 /></span>
          <h4>Civil Status Distribution by Year</h4>
        </div>
        <div className="civil-status-chart-controls">
          <YearRangeFilter />
          <button 
            className="civil-status-fullscreen-btn"
            onClick={onFullscreen}
            title="Toggle fullscreen"
          >
            <FiMaximize />
          </button>
        </div>
      </div>
      <div className="civil-status-chart-content">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={yAxisDomain} tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip content={<CivilStatusTooltip />} />
              <Legend />
              <Bar dataKey="single" stackId="a" fill={COLORS[0]} name="Single" />
              <Bar dataKey="married" stackId="a" fill={COLORS[1]} name="Married" />
              <Bar dataKey="widower" stackId="a" fill={COLORS[2]} name="Widower" />
              <Bar dataKey="separated" stackId="a" fill={COLORS[3]} name="Separated" />
              <Bar dataKey="divorced" stackId="a" fill={COLORS[4]} name="Divorced" />
              <Bar dataKey="notReported" stackId="a" fill={COLORS[5]} name="Not Reported" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="civil-status-no-data">
            No data available for the selected year range
          </div>
        )}
      </div>
    </div>
  );
});

const CompositionChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    let filteredData = selectedYear === 'all' 
      ? data.civilStatus 
      : data.civilStatus.filter(item => item.year === selectedYear);

    if (!filteredData.length) return [];
    
    const totals = { 
      single: 0, married: 0, widower: 0, separated: 0, divorced: 0, notReported: 0 
    };
    
    filteredData.forEach(item => {
      totals.single += Number(item.single) || 0;
      totals.married += Number(item.married) || 0;
      totals.widower += Number(item.widower) || 0;
      totals.separated += Number(item.separated) || 0;
      totals.divorced += Number(item.divorced) || 0;
      totals.notReported += Number(item.notReported) || 0;
    });

    const totalSum = Object.values(totals).reduce((sum, value) => sum + value, 0);
    
    const result = Object.entries(totals)
      .filter(([key, value]) => value > 0)
      .map(([key, value]) => ({ 
        name: key === 'widower' ? 'Widower' : 
              key === 'notReported' ? 'Not Reported' :
              key.charAt(0).toUpperCase() + key.slice(1), 
        value,
        percentage: totalSum > 0 ? (value / totalSum * 100).toFixed(1) : 0
      }));

    return result.sort((a, b) => b.value - a.value);
  }, [data, selectedYear]);

  const availableYears = useMemo(() => {
    if (!data?.civilStatus?.length) return [];
    return [...new Set(data.civilStatus.map(item => item.year))].sort();
  }, [data]);

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...availableYears.map(year => ({ 
      value: year, 
      label: year.toString() 
    }))
  ];

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  const YearDropdownFilter = () => (
    <div className="civil-status-chart-filter">
      <label>Select Year:</label>
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

  const CustomPieLegend = () => (
    <div className="civil-status-pie-legend">
      {chartData.map((entry, index) => (
        <div key={`legend-${index}`} className="civil-status-legend-item">
          <div 
            className="civil-status-legend-color" 
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span className="civil-status-legend-text">
            {entry.name}: {entry.percentage}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="civil-status-chart-card civil-status-composition-card">
      <div className="civil-status-chart-header">
        <div className="civil-status-chart-title">
          <span className="civil-status-chart-icon"><FiPieChart /></span>
          <h4>Civil Status Composition</h4>
        </div>
        <div className="civil-status-chart-controls">
          <YearDropdownFilter />
          <button 
            className="civil-status-fullscreen-btn"
            onClick={onFullscreen}
            title="Toggle fullscreen"
          >
            <FiMaximize />
          </button>
        </div>
      </div>
      <div className="civil-status-chart-content civil-status-composition-content">
        {chartData.length > 0 ? (
          <div className="civil-status-pie-container">
            <div className="civil-status-pie-chart-wrapper">
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
                      `${value?.toLocaleString() || '0'} people (${chartData.find(item => item.name === name)?.percentage || 0}%)`, 
                      name
                    ]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="civil-status-legend-container">
              <CustomPieLegend />
            </div>
          </div>
        ) : (
          <div className="civil-status-no-data">
            {selectedYear === 'all' 
              ? 'No data available' 
              : `No data available for ${selectedYear}`}
          </div>
        )}
      </div>
    </div>
  );
});

// Full Screen Component
const FullScreenChart = React.memo(({ title, children, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="civil-status-fullscreen-overlay">
      <div className="civil-status-fullscreen-container">
        <div className="civil-status-fullscreen-header">
          <h3>{title}</h3>
          <button className="civil-status-close-fullscreen" onClick={onClose}>
            <FiMinimize /> Close
          </button>
        </div>
        <div className="civil-status-fullscreen-content">
          {children}
        </div>
      </div>
    </div>
  );
});

// Full Screen Content Components
const FullScreenTrendsChart = React.memo(({ data, yearRange, civilStatusTypes }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    return data.civilStatus
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1])
      .sort((a, b) => a.year - b.year);
  }, [data, yearRange]);

  // FIXED: START AT 50,000
  const yAxisDomain = useFixedYAxisDomain();

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis domain={yAxisDomain} tickFormatter={(value) => value.toLocaleString()} />
        <Tooltip content={<CivilStatusTooltip />} />
        <Legend />
        {civilStatusTypes.includes('single') && (
          <Line 
            type="monotone" 
            dataKey="single" 
            stroke={COLORS[0]} 
            strokeWidth={3}
            dot={{ fill: COLORS[0], r: 5 }}
            name="Single" 
          />
        )}
        {civilStatusTypes.includes('married') && (
          <Line 
            type="monotone" 
            dataKey="married" 
            stroke={COLORS[1]} 
            strokeWidth={3}
            dot={{ fill: COLORS[1], r: 5 }}
            name="Married" 
          />
        )}
        {civilStatusTypes.includes('widower') && (
          <Line 
            type="monotone" 
            dataKey="widower" 
            stroke={COLORS[2]} 
            strokeWidth={3}
            dot={{ fill: COLORS[2], r: 5 }}
            name="Widower" 
          />
        )}
        {civilStatusTypes.includes('separated') && (
          <Line 
            type="monotone" 
            dataKey="separated" 
            stroke={COLORS[3]} 
            strokeWidth={3}
            dot={{ fill: COLORS[3], r: 5 }}
            name="Separated" 
          />
        )}
        {civilStatusTypes.includes('divorced') && (
          <Line 
            type="monotone" 
            dataKey="divorced" 
            stroke={COLORS[4]} 
            strokeWidth={3}
            dot={{ fill: COLORS[4], r: 5 }}
            name="Divorced" 
          />
        )}
        {civilStatusTypes.includes('notReported') && (
          <Line 
            type="monotone" 
            dataKey="notReported" 
            stroke={COLORS[5]} 
            strokeWidth={3}
            dot={{ fill: COLORS[5], r: 5 }}
            name="Not Reported" 
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
});

const FullScreenCompositionChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    let filteredData = selectedYear === 'all' 
      ? data.civilStatus 
      : data.civilStatus.filter(item => item.year === selectedYear);

    if (!filteredData.length) return [];
    
    const totals = { 
      single: 0, married: 0, widower: 0, separated: 0, divorced: 0, notReported: 0 
    };
    
    filteredData.forEach(item => {
      totals.single += Number(item.single) || 0;
      totals.married += Number(item.married) || 0;
      totals.widower += Number(item.widower) || 0;
      totals.separated += Number(item.separated) || 0;
      totals.divorced += Number(item.divorced) || 0;
      totals.notReported += Number(item.notReported) || 0;
    });

    const totalSum = Object.values(totals).reduce((sum, value) => sum + value, 0);

    return Object.entries(totals)
      .filter(([key, value]) => value > 0)
      .map(([key, value]) => ({ 
        name: key === 'widower' ? 'Widower' : 
              key === 'notReported' ? 'Not Reported' :
              key.charAt(0).toUpperCase() + key.slice(1), 
        value,
        percentage: totalSum > 0 ? (value / totalSum * 100).toFixed(1) : 0
      }));
  }, [data, selectedYear]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

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
    <div className="civil-status-pie-legend civil-status-fullscreen-legend">
      {chartData.map((entry, index) => (
        <div key={`item-${index}`} className="civil-status-legend-item">
          <div 
            className="civil-status-legend-color" 
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span className="civil-status-legend-text">
            {entry.name}: {entry.percentage}%
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
                `${value?.toLocaleString() || '0'} people (${chartData.find(item => item.name === name)?.percentage || 0}%)`, 
                name
              ]} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="civil-status-legend-container civil-status-fullscreen-legend-container">
        <FullScreenPieLegend />
      </div>
    </div>
  );
});

const FullScreenDistributionChart = React.memo(({ data, yearRange }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    return data.civilStatus
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1])
      .sort((a, b) => a.year - b.year);
  }, [data, yearRange]);

  // FIXED: START AT 50,000
  const yAxisDomain = useFixedYAxisDomain();

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis domain={yAxisDomain} tickFormatter={(value) => value.toLocaleString()} />
        <Tooltip content={<CivilStatusTooltip />} />
        <Legend />
        <Bar dataKey="single" stackId="a" fill={COLORS[0]} name="Single" />
        <Bar dataKey="married" stackId="a" fill={COLORS[1]} name="Married" />
        <Bar dataKey="widower" stackId="a" fill={COLORS[2]} name="Widower" />
        <Bar dataKey="separated" stackId="a" fill={COLORS[3]} name="Separated" />
        <Bar dataKey="divorced" stackId="a" fill={COLORS[4]} name="Divorced" />
        <Bar dataKey="notReported" stackId="a" fill={COLORS[5]} name="Not Reported" />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Main Component
const CivilStatusPage = () => {
  const [rawData, setRawData] = useState({ civilStatus: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readStats, setReadStats] = useState({ current: 0, max: 0, remaining: 0 });
  const [fullScreenChart, setFullScreenChart] = useState(null);

  const [chartFilters, setChartFilters] = useState({
    trends: { 
      yearRange: [1981, 2020],
      civilStatusTypes: ['single', 'married', 'widower', 'separated', 'divorced', 'notReported']
    },
    composition: { year: 'all' },
    distribution: { yearRange: [1981, 2020] }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllData();
      setRawData(data || { civilStatus: [] });
      
      const stats = getReadStats();
      setReadStats(stats);
      
    } catch (err) {
      console.error('Error fetching civil status data:', err);
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

  const updateTrendsYearRange = (yearRange) => {
    setChartFilters(prev => ({
      ...prev,
      trends: { ...prev.trends, yearRange }
    }));
  };

  const updateTrendsCivilStatusTypes = (civilStatusTypes) => {
    setChartFilters(prev => ({
      ...prev,
      trends: { ...prev.trends, civilStatusTypes }
    }));
  };

  const updateCompositionYear = (year) => {
    setChartFilters(prev => ({
      ...prev,
      composition: { year }
    }));
  };

  const updateDistributionYearRange = (yearRange) => {
    setChartFilters(prev => ({
      ...prev,
      distribution: { yearRange }
    }));
  };

  const handleFullscreenToggle = (chartTitle) => {
    setFullScreenChart(fullScreenChart === chartTitle ? null : chartTitle);
  };

  const renderFullScreenContent = () => {
    switch (fullScreenChart) {
      case "Civil Status Trends Over Time":
        return (
          <FullScreenTrendsChart 
            data={rawData} 
            yearRange={chartFilters.trends.yearRange}
            civilStatusTypes={chartFilters.trends.civilStatusTypes}
          />
        );
      case "Civil Status Composition":
        return (
          <FullScreenCompositionChart 
            data={rawData} 
            selectedYear={chartFilters.composition.year}
          />
        );
      case "Civil Status Distribution by Year":
        return (
          <FullScreenDistributionChart 
            data={rawData} 
            yearRange={chartFilters.distribution.yearRange}
          />
        );
      default:
        return null;
    }
  };

  const hasData = rawData.civilStatus && rawData.civilStatus.length > 0;

  if (loading) {
    return (
      <div className="civil-status-container">
        <div className="civil-status-loading">
          <FiRefreshCw className="civil-status-spinner" size={48} />
          <h3>Loading Civil Status Data...</h3>
          <p>Fetching data from Firebase</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="civil-status-container">
        <div className="civil-status-error">
          <FiAlertCircle size={48} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <div className="civil-status-error-actions">
            <button onClick={handleRefresh} className="civil-status-btn-primary">
              <FiRefreshCw /> Try Again
            </button>
            {error.includes('quota') && (
              <button onClick={handleResetSession} className="civil-status-btn-secondary">
                Reset Session
              </button>
            )}
          </div>
          <div className="civil-status-read-stats">
            <small>Reads: {readStats.current}/{readStats.max} (Remaining: {readStats.remaining})</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="civil-status-container">
      <div className="civil-status-header">
        <div className="civil-status-header-content">
          <h2><FiUser /> Civil Status Analytics</h2>
          <p>Analyze civil status distribution and trends over time</p>
        </div>
        <div className="civil-status-header-actions">
          <button onClick={handleRefresh} className="civil-status-btn-secondary">
            <FiRefreshCw /> Refresh Data
          </button>
          <div className="civil-status-stats">
            <span className="civil-status-stat-badge">
              {rawData.civilStatus?.length || 0} Years • {readStats.remaining} Reads Left
            </span>
          </div>
        </div>
      </div>

      {hasData ? (
        <>
          <FullScreenChart 
            title={fullScreenChart}
            onClose={() => setFullScreenChart(null)}
            isOpen={!!fullScreenChart}
          >
            {renderFullScreenContent()}
          </FullScreenChart>

          <div className={`civil-status-charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
            <TrendsChart 
              data={rawData}
              yearRange={chartFilters.trends.yearRange}
              civilStatusTypes={chartFilters.trends.civilStatusTypes}
              onYearRangeChange={updateTrendsYearRange}
              onCivilStatusTypesChange={updateTrendsCivilStatusTypes}
              onFullscreen={() => handleFullscreenToggle("Civil Status Trends Over Time")}
            />
            
            <DistributionChart 
              data={rawData}
              yearRange={chartFilters.distribution.yearRange}
              onYearRangeChange={updateDistributionYearRange}
              onFullscreen={() => handleFullscreenToggle("Civil Status Distribution by Year")}
            />
            
            <CompositionChart 
              data={rawData}
              selectedYear={chartFilters.composition.year}
              onYearChange={updateCompositionYear}
              onFullscreen={() => handleFullscreenToggle("Civil Status Composition")}
            />
          </div>
        </>
      ) : (
        <div className="civil-status-empty">
          <FiAlertCircle size={48} />
          <h3>No Civil Status Data Available</h3>
          <p>Please upload civil status data in the CSV Upload section.</p>
          <button onClick={handleRefresh} className="civil-status-btn-primary">
            <FiRefreshCw /> Check Again
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(CivilStatusPage);
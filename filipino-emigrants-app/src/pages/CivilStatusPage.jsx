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

// Individual Chart Components with React.memo
const TrendsChart = React.memo(({ data, yearRange, civilStatusTypes, onYearRangeChange, onCivilStatusTypesChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    const civilStatusByYear = {};
    
    data.civilStatus.forEach((item) => {
      const year = item.YEAR || item.year;
      if (!year) return;
      
      if (!civilStatusByYear[year]) {
        civilStatusByYear[year] = { 
          year, 
          single: 0, 
          married: 0, 
          widowed: 0,
          separated: 0, 
          divorced: 0, 
          notReported: 0 
        };
      }
      
      civilStatusByYear[year].single += Number(item.Single) || 0;
      civilStatusByYear[year].married += Number(item.Married) || 0;
      civilStatusByYear[year].widowed += Number(item.Widower) || 0;
      civilStatusByYear[year].separated += Number(item.Separated) || 0;
      civilStatusByYear[year].divorced += Number(item.Divorced) || 0;
      civilStatusByYear[year].notReported += Number(item['Not Reported']) || 0;
    });

    return Object.values(civilStatusByYear)
      .sort((a, b) => a.year - b.year)
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1]);
  }, [data, yearRange]);

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
          { key: 'widowed', label: 'Widowed' },
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
              <YAxis />
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
              <Legend />
              {civilStatusTypes.includes('single') && (
                <Line 
                  type="monotone" 
                  dataKey="single" 
                  stroke={COLORS[0]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[0] }}
                  name="Single" 
                />
              )}
              {civilStatusTypes.includes('married') && (
                <Line 
                  type="monotone" 
                  dataKey="married" 
                  stroke={COLORS[1]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[1] }}
                  name="Married" 
                />
              )}
              {civilStatusTypes.includes('widowed') && (
                <Line 
                  type="monotone" 
                  dataKey="widowed" 
                  stroke={COLORS[2]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[2] }}
                  name="Widowed" 
                />
              )}
              {civilStatusTypes.includes('separated') && (
                <Line 
                  type="monotone" 
                  dataKey="separated" 
                  stroke={COLORS[3]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[3] }}
                  name="Separated" 
                />
              )}
              {civilStatusTypes.includes('divorced') && (
                <Line 
                  type="monotone" 
                  dataKey="divorced" 
                  stroke={COLORS[4]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[4] }}
                  name="Divorced" 
                />
              )}
              {civilStatusTypes.includes('notReported') && (
                <Line 
                  type="monotone" 
                  dataKey="notReported" 
                  stroke={COLORS[5]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[5] }}
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

    const civilStatusByYear = {};
    
    data.civilStatus.forEach(item => {
      const year = item.YEAR || item.year;
      if (!civilStatusByYear[year]) {
        civilStatusByYear[year] = { 
          year, 
          single: 0, 
          married: 0, 
          widowed: 0,
          separated: 0, 
          divorced: 0, 
          notReported: 0 
        };
      }
      
      civilStatusByYear[year].single += Number(item.Single) || 0;
      civilStatusByYear[year].married += Number(item.Married) || 0;
      civilStatusByYear[year].widowed += Number(item.Widower) || 0;
      civilStatusByYear[year].separated += Number(item.Separated) || 0;
      civilStatusByYear[year].divorced += Number(item.Divorced) || 0;
      civilStatusByYear[year].notReported += Number(item['Not Reported']) || 0;
    });

    return Object.values(civilStatusByYear)
      .sort((a, b) => a.year - b.year)
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1]);
  }, [data, yearRange]);

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
              <YAxis />
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
              <Legend />
              <Bar dataKey="single" stackId="a" fill={COLORS[0]} name="Single" />
              <Bar dataKey="married" stackId="a" fill={COLORS[1]} name="Married" />
              <Bar dataKey="widowed" stackId="a" fill={COLORS[2]} name="Widowed" />
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

    let filteredData = [];
    
    if (selectedYear === 'all') {
      filteredData = data.civilStatus;
    } else {
      // FIXED: Use uppercase YEAR field from your data
      filteredData = data.civilStatus.filter(item => {
        const itemYear = item.YEAR || item.year;
        return itemYear === selectedYear;
      });
    }

    if (!filteredData.length) return [];
    
    const totals = { 
      single: 0, married: 0, widowed: 0, separated: 0, divorced: 0, notReported: 0 
    };
    
    filteredData.forEach(item => {
      totals.single += Number(item.Single) || 0;
      totals.married += Number(item.Married) || 0;
      totals.widowed += Number(item.Widower) || 0;
      totals.separated += Number(item.Separated) || 0;
      totals.divorced += Number(item.Divorced) || 0;
      totals.notReported += Number(item['Not Reported']) || 0;
    });

    const result = Object.entries(totals)
      .filter(([key, value]) => value > 0)
      .map(([key, value]) => ({ 
        name: key === 'widowed' ? 'Widowed' : 
              key === 'notReported' ? 'Not Reported' :
              key.charAt(0).toUpperCase() + key.slice(1), 
        value 
      }));

    return result;
  }, [data, selectedYear]);

  // Get available years from data
  const availableYears = useMemo(() => {
    if (!data?.civilStatus?.length) return [];
    return [...new Set(data.civilStatus.map(item => item.YEAR || item.year))].sort();
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

  return (
    <div className="civil-status-chart-card civil-status-centered">
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
      <div className="civil-status-chart-content">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
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

// Full Screen Component with React.memo
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

// Full Screen Content Components with React.memo
const FullScreenTrendsChart = React.memo(({ data, yearRange, civilStatusTypes }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    const civilStatusByYear = {};
    
    data.civilStatus.forEach((item) => {
      const year = item.YEAR || item.year;
      if (!year) return;
      
      if (!civilStatusByYear[year]) {
        civilStatusByYear[year] = { 
          year, 
          single: 0, 
          married: 0, 
          widowed: 0,
          separated: 0, 
          divorced: 0, 
          notReported: 0 
        };
      }
      
      civilStatusByYear[year].single += Number(item.Single) || 0;
      civilStatusByYear[year].married += Number(item.Married) || 0;
      civilStatusByYear[year].widowed += Number(item.Widower) || 0;
      civilStatusByYear[year].separated += Number(item.Separated) || 0;
      civilStatusByYear[year].divorced += Number(item.Divorced) || 0;
      civilStatusByYear[year].notReported += Number(item['Not Reported']) || 0;
    });

    return Object.values(civilStatusByYear)
      .sort((a, b) => a.year - b.year)
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1]);
  }, [data, yearRange]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        <Legend />
        {civilStatusTypes.includes('single') && (
          <Line 
            type="monotone" 
            dataKey="single" 
            stroke={COLORS[0]} 
            strokeWidth={3}
            dot={{ fill: COLORS[0] }}
            name="Single" 
          />
        )}
        {civilStatusTypes.includes('married') && (
          <Line 
            type="monotone" 
            dataKey="married" 
            stroke={COLORS[1]} 
            strokeWidth={3}
            dot={{ fill: COLORS[1] }}
            name="Married" 
          />
        )}
        {civilStatusTypes.includes('widowed') && (
          <Line 
            type="monotone" 
            dataKey="widowed" 
            stroke={COLORS[2]} 
            strokeWidth={3}
            dot={{ fill: COLORS[2] }}
            name="Widowed" 
          />
        )}
        {civilStatusTypes.includes('separated') && (
          <Line 
            type="monotone" 
            dataKey="separated" 
            stroke={COLORS[3]} 
            strokeWidth={3}
            dot={{ fill: COLORS[3] }}
            name="Separated" 
          />
        )}
        {civilStatusTypes.includes('divorced') && (
          <Line 
            type="monotone" 
            dataKey="divorced" 
            stroke={COLORS[4]} 
            strokeWidth={3}
            dot={{ fill: COLORS[4] }}
            name="Divorced" 
          />
        )}
        {civilStatusTypes.includes('notReported') && (
          <Line 
            type="monotone" 
            dataKey="notReported" 
            stroke={COLORS[5]} 
            strokeWidth={3}
            dot={{ fill: COLORS[5] }}
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
      : data.civilStatus.filter(item => {
          const itemYear = item.YEAR || item.year;
          return itemYear === selectedYear;
        });

    if (!filteredData.length) return [];
    
    const totals = { 
      single: 0, married: 0, widowed: 0, separated: 0, divorced: 0, notReported: 0 
    };
    
    filteredData.forEach(item => {
      totals.single += Number(item.Single) || 0;
      totals.married += Number(item.Married) || 0;
      totals.widowed += Number(item.Widower) || 0;
      totals.separated += Number(item.Separated) || 0;
      totals.divorced += Number(item.Divorced) || 0;
      totals.notReported += Number(item['Not Reported']) || 0;
    });

    return Object.entries(totals)
      .filter(([key, value]) => value > 0)
      .map(([key, value]) => ({ 
        name: key === 'widowed' ? 'Widowed' : 
              key === 'notReported' ? 'Not Reported' :
              key.charAt(0).toUpperCase() + key.slice(1), 
        value 
      }));
  }, [data, selectedYear]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
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

const FullScreenDistributionChart = React.memo(({ data, yearRange }) => {
  const chartData = useMemo(() => {
    if (!data?.civilStatus?.length) return [];

    const civilStatusByYear = {};
    
    data.civilStatus.forEach(item => {
      const year = item.YEAR || item.year;
      if (!civilStatusByYear[year]) {
        civilStatusByYear[year] = { 
          year, 
          single: 0, 
          married: 0, 
          widowed: 0,
          separated: 0, 
          divorced: 0, 
          notReported: 0 
        };
      }
      
      civilStatusByYear[year].single += Number(item.Single) || 0;
      civilStatusByYear[year].married += Number(item.Married) || 0;
      civilStatusByYear[year].widowed += Number(item.Widower) || 0;
      civilStatusByYear[year].separated += Number(item.Separated) || 0;
      civilStatusByYear[year].divorced += Number(item.Divorced) || 0;
      civilStatusByYear[year].notReported += Number(item['Not Reported']) || 0;
    });

    return Object.values(civilStatusByYear)
      .sort((a, b) => a.year - b.year)
      .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1]);
  }, [data, yearRange]);

  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#B8E986'];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
        <Legend />
        <Bar dataKey="single" stackId="a" fill={COLORS[0]} name="Single" />
        <Bar dataKey="married" stackId="a" fill={COLORS[1]} name="Married" />
        <Bar dataKey="widowed" stackId="a" fill={COLORS[2]} name="Widowed" />
        <Bar dataKey="separated" stackId="a" fill={COLORS[3]} name="Separated" />
        <Bar dataKey="divorced" stackId="a" fill={COLORS[4]} name="Divorced" />
        <Bar dataKey="notReported" stackId="a" fill={COLORS[5]} name="Not Reported" />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Main Component with React.memo
const CivilStatusPage = () => {
  const [rawData, setRawData] = useState({ civilStatus: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readStats, setReadStats] = useState({ current: 0, max: 0, remaining: 0 });
  const [fullScreenChart, setFullScreenChart] = useState(null);

  // Individual chart filters
  const [chartFilters, setChartFilters] = useState({
    trends: { 
      yearRange: [1981, 2020],
      civilStatusTypes: ['single', 'married', 'widowed', 'separated', 'divorced', 'notReported']
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

  // Individual chart filter handlers
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
      {/* Header */}
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
          {/* Full Screen Chart Overlay */}
          <FullScreenChart 
            title={fullScreenChart}
            onClose={() => setFullScreenChart(null)}
            isOpen={!!fullScreenChart}
          >
            {renderFullScreenContent()}
          </FullScreenChart>

          {/* Charts Grid - Composition moved to bottom */}
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
            
            {/* Composition chart at the bottom */}
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
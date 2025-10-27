import React, { useMemo, useState } from 'react';
import { 
  FiBook, FiAlertCircle, FiBarChart2, 
  FiTrendingUp, FiMaximize, FiMinimize 
} from 'react-icons/fi';
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';
import "../css/EducationAnalyticsPage.css";

// Individual Chart Components with React.memo
const EducationTrendChart = React.memo(({ data, yearRange, selectedLevel, onYearRangeChange, onLevelChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    const yearlyData = new Map();
    
    // Initialize yearly data structure
    data.forEach(item => {
      const year = item.year;
      if (year && year >= 1981 && year <= 2020) {
        if (!yearlyData.has(year)) {
          yearlyData.set(year, { year });
        }
      }
    });

    // Populate data for selected level
    if (selectedLevel && selectedLevel !== 'all') {
      data.forEach(item => {
        const year = item.year;
        const level = item['education attainment'] || item.educationLevel || item.level || 'Unknown';
        const count = Number(item.count) || 0;
        
        if (yearlyData.has(year) && level === selectedLevel) {
          const current = yearlyData.get(year);
          current[selectedLevel] = (current[selectedLevel] || 0) + count;
        }
      });
    }

    const allData = Array.from(yearlyData.values()).sort((a, b) => a.year - b.year);
    
    // Filter by year range
    return allData.filter(item =>
      item.year >= yearRange[0] && item.year <= yearRange[1]
    );
  }, [data, yearRange, selectedLevel]);

  const availableEducationLevels = useMemo(() => {
    if (!data?.length) return [];
    
    const levels = [...new Set(data
      .map(item => item['education attainment'] || item.educationLevel || item.level || 'Unknown')
      .filter(level => level && level !== 'not of schooling age')
    )].sort();
    
    return levels;
  }, [data]);

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

  const EducationLevelFilter = () => (
    <div className="chart-filter">
      <label>Education Level:</label>
      <select 
        value={selectedLevel || 'all'} 
        onChange={(e) => onLevelChange(e.target.value === 'all' ? 'all' : e.target.value)}
      >
        <option value="all">All Education Levels</option>
        {availableEducationLevels.map(level => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <ChartContainer 
      title="Education Level Trends" 
      icon={<FiTrendingUp />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={
        <div className="chart-filters-row">
          <YearRangeFilter />
          <EducationLevelFilter />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="year" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip formatter={(value) => [value?.toLocaleString() || 0, 'Count']} />
          <Legend />
          {selectedLevel && selectedLevel !== 'all' && (
            <Line 
              type="monotone" 
              dataKey={selectedLevel} 
              stroke="#4A90E2" 
              strokeWidth={2}
              dot={false}
              name={selectedLevel}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

const EducationDistributionChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    const educationLevels = {};
    let filteredData = [];

    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    filteredData.forEach(item => {
      const level = item['education attainment'] || item.educationLevel || item.level || 'Unknown';
      const count = Number(item.count) || 0;
      educationLevels[level] = (educationLevels[level] || 0) + count;
    });

    return Object.entries(educationLevels)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data, selectedYear]);

  const yearOptions = useMemo(() => {
    if (!data?.length) return [{ value: 'all', label: 'All Years' }];
    
    const years = [...new Set(data
      .map(item => item.year)
      .filter(year => year && year >= 1981 && year <= 2020)
    )].sort((a, b) => b - a);

    return [
      { value: 'all', label: 'All Years (1981-2020)' },
      ...years.map(year => ({ value: year, label: year.toString() }))
    ];
  }, [data]);

  const YearDropdownFilter = () => (
    <div className="chart-filter">
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
    <ChartContainer 
      title="Education Level Distribution" 
      icon={<FiBarChart2 />}
      className="full-width"
      onFullscreen={onFullscreen}
      filters={<YearDropdownFilter />}
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis type="number" stroke="#ccc" />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={120} 
            stroke="#ccc"
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
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
const FullScreenTrendChart = React.memo(({ data, yearRange, selectedLevel }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    const yearlyData = new Map();
    
    data.forEach(item => {
      const year = item.year;
      if (year && year >= 1981 && year <= 2020) {
        if (!yearlyData.has(year)) {
          yearlyData.set(year, { year });
        }
      }
    });

    if (selectedLevel && selectedLevel !== 'all') {
      data.forEach(item => {
        const year = item.year;
        const level = item['education attainment'] || item.educationLevel || item.level || 'Unknown';
        const count = Number(item.count) || 0;
        
        if (yearlyData.has(year) && level === selectedLevel) {
          const current = yearlyData.get(year);
          current[selectedLevel] = (current[selectedLevel] || 0) + count;
        }
      });
    }

    const allData = Array.from(yearlyData.values()).sort((a, b) => a.year - b.year);
    
    return allData.filter(item =>
      item.year >= yearRange[0] && item.year <= yearRange[1]
    );
  }, [data, yearRange, selectedLevel]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip formatter={(value) => [value?.toLocaleString() || 0, 'Count']} />
        <Legend />
        {selectedLevel && selectedLevel !== 'all' && (
          <Line 
            type="monotone" 
            dataKey={selectedLevel} 
            stroke="#4A90E2" 
            strokeWidth={3}
            dot={{ fill: "#4A90E2", strokeWidth: 2, r: 4 }}
            name={selectedLevel}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
});

const FullScreenDistributionChart = React.memo(({ data, selectedYear }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    const educationLevels = {};
    let filteredData = [];

    if (selectedYear === 'all') {
      filteredData = data;
    } else {
      filteredData = data.filter(item => item.year === selectedYear);
    }

    filteredData.forEach(item => {
      const level = item['education attainment'] || item.educationLevel || item.level || 'Unknown';
      const count = Number(item.count) || 0;
      educationLevels[level] = (educationLevels[level] || 0) + count;
    });

    return Object.entries(educationLevels)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, selectedYear]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis type="number" stroke="#ccc" />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={200} 
          stroke="#ccc"
        />
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
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

// Main Education Analytics Component
const EducationAnalyticsPage = ({ 
  rawData = {}
}) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [fullScreenContent, setFullScreenContent] = useState(null);
  const [chartFilters, setChartFilters] = useState({
    trend: { 
      yearRange: [1981, 2020],
      selectedLevel: 'all'
    },
    distribution: { year: 'all' }
  });

  const { educationData = [] } = rawData;
  const hasData = educationData && educationData.length > 0;

  // Set default selected level to 'college graduate'
  React.useEffect(() => {
    if (educationData?.length) {
      const availableLevels = [...new Set(educationData.map(item => 
        item['education attainment'] || item.educationLevel || item.level || 'Unknown'
      ))];
      
      const collegeGraduate = availableLevels.find(level => 
        level.toLowerCase().includes('college') || level.toLowerCase().includes('graduate')
      );
      
      if (collegeGraduate) {
        setChartFilters(prev => ({
          ...prev,
          trend: { ...prev.trend, selectedLevel: collegeGraduate }
        }));
      }
    }
  }, [educationData]);

  // Individual chart filter handlers
  const updateTrendYearRange = (yearRange) => {
    setChartFilters(prev => ({
      ...prev,
      trend: { ...prev.trend, yearRange }
    }));
  };

  const updateTrendLevel = (selectedLevel) => {
    setChartFilters(prev => ({
      ...prev,
      trend: { ...prev.trend, selectedLevel }
    }));
  };

  const updateDistributionFilter = (year) => {
    setChartFilters(prev => ({
      ...prev,
      distribution: { year }
    }));
  };

  const handleFullscreenToggle = (chartType, title) => {
    if (fullScreenChart === chartType) {
      setFullScreenChart(null);
      setFullScreenContent(null);
    } else {
      setFullScreenChart(chartType);
      
      if (chartType === 'trend') {
        setFullScreenContent(
          <FullScreenTrendChart 
            data={educationData} 
            yearRange={chartFilters.trend.yearRange}
            selectedLevel={chartFilters.trend.selectedLevel}
          />
        );
      } else if (chartType === 'distribution') {
        setFullScreenContent(
          <FullScreenDistributionChart 
            data={educationData} 
            selectedYear={chartFilters.distribution.year} 
          />
        );
      }
    }
  };

  const getFullScreenTitle = () => {
    switch (fullScreenChart) {
      case 'trend': return 'Education Level Trends';
      case 'distribution': return 'Education Level Distribution';
      default: return '';
    }
  };

  return (
    <div className="data-page">
      <div className="page-header">
        <h2><FiBook /> Education Analytics</h2>
        <p>Analyze education level patterns and trends among emigrants</p>
      </div>

      {hasData ? (
        <>
          {/* Full Screen Chart Overlay */}
          <FullScreenChart 
            title={getFullScreenTitle()}
            onClose={() => {
              setFullScreenChart(null);
              setFullScreenContent(null);
            }}
            isOpen={!!fullScreenChart}
          >
            {fullScreenContent}
          </FullScreenChart>

          {/* Charts Grid - Two big charts side by side */}
          <div className={`charts-grid two-big-charts ${fullScreenChart ? 'blurred' : ''}`}>
            <EducationTrendChart 
              data={educationData}
              yearRange={chartFilters.trend.yearRange}
              selectedLevel={chartFilters.trend.selectedLevel}
              onYearRangeChange={updateTrendYearRange}
              onLevelChange={updateTrendLevel}
              onFullscreen={() => handleFullscreenToggle('trend', "Education Level Trends")}
            />

            <EducationDistributionChart 
              data={educationData}
              selectedYear={chartFilters.distribution.year}
              onYearChange={updateDistributionFilter}
              onFullscreen={() => handleFullscreenToggle('distribution', "Education Level Distribution")}
            />
          </div>
        </>
      ) : (
        <div className="empty-state">
          <FiAlertCircle size={48} />
          <h3>No Education Data Available</h3>
          <p>Please upload education data in the CSV Upload section.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(EducationAnalyticsPage);
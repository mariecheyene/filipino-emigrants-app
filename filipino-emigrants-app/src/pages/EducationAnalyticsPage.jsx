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

// List of valid education levels from your database
const VALID_EDUCATION_LEVELS = [
  'Not of Schooling Age',
  'No Formal Education',
  'Elementary Level',
  'Elementary Graduate',
  'High School Level',
  'High School Graduate',
  'Vocational Level',
  'Vocational Graduate',
  'College Level',
  'College Graduate',
  'Post Graduate Level',
  'Post Graduate',
  'Non-Formal Education',
  'Not Reported / No Response'
];

// Function to validate education level
const isValidEducationLevel = (level) => {
  if (!level || typeof level !== 'string') return false;
  
  const cleanLevel = level.trim();
  if (!cleanLevel) return false;
  
  // Check if it's a number (like "31313") - reject these
  if (!isNaN(cleanLevel) && cleanLevel !== '') return false;
  
  // Check if it matches any valid education level
  return VALID_EDUCATION_LEVELS.some(validLevel => 
    cleanLevel.toLowerCase() === validLevel.toLowerCase()
  );
};

// Individual Chart Components with React.memo
const EducationTrendChart = React.memo(({ data, yearRange, selectedLevel, onYearRangeChange, onLevelChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) {
      console.log('No data for trends chart');
      return [];
    }

    console.log('=== TRENDS CHART DATA DEBUG ===');
    console.log('Raw data sample:', data.slice(0, 5));
    
    // Filter out invalid data and log bad records
    const validData = data.filter(item => {
      const level = item.educationAttainment;
      const isValid = isValidEducationLevel(level);
      
      if (!isValid && level) {
        console.warn('INVALID EDUCATION LEVEL FOUND:', {
          level: level,
          year: item.year,
          count: item.count,
          fullItem: item
        });
      }
      
      return isValid;
    });

    console.log(`Filtered ${validData.length} valid records from ${data.length} total records`);

    // Get all unique years in the range
    const years = [];
    for (let year = yearRange[0]; year <= yearRange[1]; year++) {
      years.push(year);
    }

    // Get all unique education levels from the VALID data
    const allLevels = [...new Set(validData
      .map(item => item.educationAttainment.trim())
      .filter(level => isValidEducationLevel(level))
    )];

    console.log('Valid education levels found:', allLevels);

    // Initialize data structure for all years
    const yearlyData = years.map(year => {
      const yearData = { year };
      
      // Initialize all education levels to 0 for this year
      allLevels.forEach(level => {
        yearData[level] = 0;
      });
      
      // Add total for "all" selection
      yearData.total = 0;
      
      return yearData;
    });

    // Populate the data with VALID records only
    validData.forEach(item => {
      const year = Number(item.year);
      const level = item.educationAttainment.trim();
      const count = Number(item.count) || 0;
      
      if (year >= yearRange[0] && year <= yearRange[1]) {
        const yearEntry = yearlyData.find(entry => entry.year === year);
        if (yearEntry) {
          yearEntry[level] = (yearEntry[level] || 0) + count;
          yearEntry.total = (yearEntry.total || 0) + count;
        }
      }
    });

    console.log('Processed trends chart data:', yearlyData);
    return yearlyData;
  }, [data, yearRange]);

  const availableEducationLevels = useMemo(() => {
    if (!data?.length) return [];
    
    // Only include valid education levels
    const levels = [...new Set(data
      .map(item => item.educationAttainment)
      .filter(level => isValidEducationLevel(level))
      .map(level => level.trim())
    )].sort();
    
    console.log('Available levels for dropdown (VALID ONLY):', levels);
    return levels;
  }, [data]);

  // Colors for your actual education levels
  const levelColors = {
    'Not of Schooling Age': '#8884d8',
    'No Formal Education': '#82ca9d',
    'Elementary Level': '#ffc658',
    'Elementary Graduate': '#ff7300',
    'High School Level': '#8dd1e1',
    'High School Graduate': '#d084d0',
    'Vocational Level': '#ff8042',
    'Vocational Graduate': '#a4de6c',
    'College Level': '#d0ed57',
    'College Graduate': '#ff6b6b',
    'Post Graduate Level': '#cc65fe',
    'Post Graduate': '#64b5f6',
    'Non-Formal Education': '#4db6ac',
    'Not Reported / No Response': '#90a4ae'
  };

  const getColorForLevel = (level) => {
    return levelColors[level] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
  };

  const YearRangeFilter = () => (
    <div className="education-chart-filter">
      <label>Year Range:</label>
      <div className="education-range-inputs">
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
    <div className="education-chart-filter">
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
        <div className="education-chart-filters-row">
          <YearRangeFilter />
          <EducationLevelFilter />
        </div>
      }
    >
      {chartData.length === 0 ? (
        <div className="education-no-data-message">
          <FiAlertCircle size={32} />
          <p>No trend data available for the selected filters</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="year" 
              stroke="#ccc"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#ccc"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              formatter={(value, name) => [value?.toLocaleString() || 0, name]}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Legend />
            {selectedLevel === 'all' ? (
              // Show all education levels as separate lines
              availableEducationLevels.map(level => (
                <Line 
                  key={level}
                  type="monotone" 
                  dataKey={level} 
                  stroke={getColorForLevel(level)}
                  strokeWidth={2}
                  dot={false}
                  name={level}
                />
              ))
            ) : (
              // Show only the selected level
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
      )}
    </ChartContainer>
  );
});

const EducationDistributionChart = React.memo(({ data, selectedYear, onYearChange, onFullscreen }) => {
  const chartData = useMemo(() => {
    if (!data?.length) {
      return [];
    }

    console.log('=== DISTRIBUTION CHART DATA DEBUG ===');
    
    // Filter out invalid data
    const validData = data.filter(item => isValidEducationLevel(item.educationAttainment));
    
    console.log(`Distribution: Using ${validData.length} valid records from ${data.length} total`);

    const educationLevels = {};
    let filteredData = [];

    if (selectedYear === 'all') {
      filteredData = validData;
    } else {
      filteredData = validData.filter(item => {
        const itemYear = Number(item.year);
        return itemYear === Number(selectedYear);
      });
    }

    console.log(`After year filter: ${filteredData.length} records`);

    filteredData.forEach(item => {
      const level = item.educationAttainment.trim();
      const count = Number(item.count) || 0;
      
      if (level) {
        educationLevels[level] = (educationLevels[level] || 0) + count;
      }
    });

    const result = Object.entries(educationLevels)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    console.log('Final distribution data (VALID ONLY):', result);
    return result;
  }, [data, selectedYear]);

  const yearOptions = useMemo(() => {
    if (!data?.length) return [{ value: 'all', label: 'All Years' }];
    
    const years = [...new Set(data
      .map(item => Number(item.year))
      .filter(year => !isNaN(year) && year >= 1981 && year <= 2020)
    )].sort((a, b) => b - a);

    return [
      { value: 'all', label: 'All Years (1981-2020)' },
      ...years.map(year => ({ value: year, label: year.toString() }))
    ];
  }, [data]);

  const YearDropdownFilter = () => (
    <div className="education-chart-filter">
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
      {chartData.length === 0 ? (
        <div className="education-no-data-message">
          <FiAlertCircle size={32} />
          <p>No distribution data available for {selectedYear === 'all' ? 'all years' : `year ${selectedYear}`}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              type="number" 
              stroke="#ccc"
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150} 
              stroke="#ccc"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), 'Count']}
              labelFormatter={(label) => `Education Level: ${label}`}
            />
            <Bar 
              dataKey="value" 
              fill="#4A90E2" 
              radius={[0, 4, 4, 0]}
              name="Count"
            />
          </BarChart>
        </ResponsiveContainer>
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
  <div className={`education-chart-card ${className}`}>
    <div className="education-chart-header">
      <div className="education-chart-title">
        {icon && <span className="education-chart-icon">{icon}</span>}
        <h4>{title}</h4>
      </div>
      <div className="education-chart-controls">
        {filters}
        <button 
          className="education-fullscreen-btn"
          onClick={onFullscreen}
          title="Toggle fullscreen"
        >
          <FiMaximize />
        </button>
      </div>
    </div>
    <div className="education-chart-content">
      {children}
    </div>
  </div>
));

// Full Screen Component
const FullScreenChart = React.memo(({ title, children, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="education-fullscreen-overlay">
      <div className="education-fullscreen-container">
        <div className="education-fullscreen-header">
          <h3>{title}</h3>
          <button className="education-close-fullscreen" onClick={onClose}>
            <FiMinimize /> Close
          </button>
        </div>
        <div className="education-fullscreen-content">
          {children}
        </div>
      </div>
    </div>
  );
});

// Full Screen Content Components (with data validation)
const FullScreenTrendChart = React.memo(({ data, yearRange, selectedLevel }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Filter out invalid data
    const validData = data.filter(item => isValidEducationLevel(item.educationAttainment));

    const years = [];
    for (let year = yearRange[0]; year <= yearRange[1]; year++) {
      years.push(year);
    }

    const allLevels = [...new Set(validData
      .map(item => item.educationAttainment.trim())
      .filter(level => isValidEducationLevel(level))
    )];

    const yearlyData = years.map(year => {
      const yearData = { year };
      allLevels.forEach(level => {
        yearData[level] = 0;
      });
      yearData.total = 0;
      return yearData;
    });

    validData.forEach(item => {
      const year = Number(item.year);
      const level = item.educationAttainment.trim();
      const count = Number(item.count) || 0;
      
      if (year >= yearRange[0] && year <= yearRange[1]) {
        const yearEntry = yearlyData.find(entry => entry.year === year);
        if (yearEntry) {
          yearEntry[level] = (yearEntry[level] || 0) + count;
          yearEntry.total = (yearEntry.total || 0) + count;
        }
      }
    });

    return yearlyData;
  }, [data, yearRange]);

  const availableEducationLevels = useMemo(() => {
    if (!data?.length) return [];
    return [...new Set(data
      .map(item => item.educationAttainment)
      .filter(level => isValidEducationLevel(level))
      .map(level => level.trim())
    )].sort();
  }, [data]);

  // Colors for your actual education levels
  const levelColors = {
    'Not of Schooling Age': '#8884d8',
    'No Formal Education': '#82ca9d',
    'Elementary Level': '#ffc658',
    'Elementary Graduate': '#ff7300',
    'High School Level': '#8dd1e1',
    'High School Graduate': '#d084d0',
    'Vocational Level': '#ff8042',
    'Vocational Graduate': '#a4de6c',
    'College Level': '#d0ed57',
    'College Graduate': '#ff6b6b',
    'Post Graduate Level': '#cc65fe',
    'Post Graduate': '#64b5f6',
    'Non-Formal Education': '#4db6ac',
    'Not Reported / No Response': '#90a4ae'
  };

  const getColorForLevel = (level) => {
    return levelColors[level] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
  };

  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#ccc" />
        <YAxis 
          stroke="#ccc"
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip 
          formatter={(value, name) => [value?.toLocaleString() || 0, name]}
          labelFormatter={(label) => `Year: ${label}`}
        />
        <Legend />
        {selectedLevel === 'all' ? (
          availableEducationLevels.map(level => (
            <Line 
              key={level}
              type="monotone" 
              dataKey={level} 
              stroke={getColorForLevel(level)}
              strokeWidth={3}
              dot={{ fill: getColorForLevel(level), strokeWidth: 2, r: 4 }}
              name={level}
            />
          ))
        ) : (
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

    // Filter out invalid data
    const validData = data.filter(item => isValidEducationLevel(item.educationAttainment));

    const educationLevels = {};
    let filteredData = [];

    if (selectedYear === 'all') {
      filteredData = validData;
    } else {
      filteredData = validData.filter(item => {
        const itemYear = Number(item.year);
        return itemYear === Number(selectedYear);
      });
    }

    filteredData.forEach(item => {
      const level = item.educationAttainment.trim();
      const count = Number(item.count) || 0;
      
      if (level) {
        educationLevels[level] = (educationLevels[level] || 0) + count;
      }
    });

    return Object.entries(educationLevels)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, selectedYear]);

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          type="number" 
          stroke="#ccc"
          tickFormatter={(value) => value.toLocaleString()}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={200} 
          stroke="#ccc"
        />
        <Tooltip 
          formatter={(value) => [value.toLocaleString(), 'Count']}
          labelFormatter={(label) => `Education Level: ${label}`}
        />
        <Bar 
          dataKey="value" 
          fill="#4A90E2" 
          radius={[0, 4, 4, 0]}
          name="Count"
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Main Education Analytics Component
const EducationAnalyticsPage = ({ rawData = {} }) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [fullScreenContent, setFullScreenContent] = useState(null);
  const [chartFilters, setChartFilters] = useState({
    trend: { 
      yearRange: [2010, 2020],
      selectedLevel: 'all'
    },
    distribution: { year: 2020 }
  });

  // Extract education data from rawData
  const { educationData = [] } = rawData;
  const hasData = educationData && educationData.length > 0;

  // Debug the data quality
  React.useEffect(() => {
    if (hasData) {
      console.log('=== EDUCATION DATA QUALITY CHECK ===');
      console.log('Total records:', educationData.length);
      
      // Check for invalid education levels
      const invalidRecords = educationData.filter(item => !isValidEducationLevel(item.educationAttainment));
      console.log('Invalid records found:', invalidRecords.length);
      
      if (invalidRecords.length > 0) {
        console.log('Sample invalid records:', invalidRecords.slice(0, 3));
        console.warn('Found records with invalid education levels. These will be filtered out.');
      }
      
      const validRecords = educationData.filter(item => isValidEducationLevel(item.educationAttainment));
      console.log('Valid records:', validRecords.length);
      
      const uniqueLevels = [...new Set(educationData.map(item => item.educationAttainment))];
      console.log('All unique levels in data:', uniqueLevels);
    }
  }, [educationData, hasData]);

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
    <div className="education-page">
      <div className="education-page-header">
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
          <div className={`education-charts-grid ${fullScreenChart ? 'blurred' : ''}`}>
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
        <div className="education-empty-state">
          <FiAlertCircle size={48} />
          <h3>No Education Data Available</h3>
          <p>Please upload education data in the CSV Upload section.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(EducationAnalyticsPage);
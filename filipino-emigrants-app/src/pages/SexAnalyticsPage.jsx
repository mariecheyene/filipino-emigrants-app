import React, { useMemo, useState } from 'react';
import { 
  FiUsers, FiAlertCircle, FiTrendingUp, 
  FiPieChart, FiMaximize, FiMinimize
} from 'react-icons/fi';
import { 
  LineChart, Line, PieChart, Pie,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, 
  ResponsiveContainer, Cell 
} from 'recharts';

const SexAnalyticsPage = ({ 
  filters, 
  handleFilterChange, 
  rawData 
}) => {
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const { sexData = [] } = rawData;
  const hasData = sexData && sexData.length > 0;

  // Get available years (only once)
  const availableYears = useMemo(() => {
    return [...new Set(sexData
      .map(item => item.year)
      .filter(year => year && year >= 1981 && year <= 2020)
    )].sort((a, b) => b - a);
  }, [sexData]);

  // FIXED: Default genderYear to 'all' if not set
  const currentGenderYear = filters.genderYear || 'all';

  // INDEPENDENT: Line Chart Data - Only depends on yearRange and selectedGender
  const lineChartData = useMemo(() => {
    if (!sexData.length) return [];

    const yearlyData = new Map();
    
    sexData.forEach(item => {
      const year = item.year;
      if (year && year >= 1981 && year <= 2020) {
        const current = yearlyData.get(year) || { year, male: 0, female: 0 };
        current.male += Number(item.male) || 0;
        current.female += Number(item.female) || 0;
        yearlyData.set(year, current);
      }
    });

    const allData = Array.from(yearlyData.values()).sort((a, b) => a.year - b.year);
    
    // Filter by year range only
    return allData.filter(item =>
      item.year >= filters.yearRange[0] && item.year <= filters.yearRange[1]
    );
  }, [sexData, filters.yearRange]);

  // FIXED: Pie Chart Data - Defaults to 'all' years and works immediately
  const pieChartData = useMemo(() => {
    if (!sexData.length) return [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }];

    let maleTotal = 0;
    let femaleTotal = 0;

    if (currentGenderYear === 'all') {
      // Cumulative data across all years - FIXED: Now works by default
      sexData.forEach(item => {
        maleTotal += Number(item.male) || 0;
        femaleTotal += Number(item.female) || 0;
      });
    } else {
      // Specific year data
      sexData.forEach(item => {
        if (item.year === currentGenderYear) {
          maleTotal += Number(item.male) || 0;
          femaleTotal += Number(item.female) || 0;
        }
      });
    }

    return [
      { name: 'Male', value: maleTotal },
      { name: 'Female', value: femaleTotal }
    ];
  }, [sexData, currentGenderYear]);

  const GENDER_COLORS = ['#4A90E2', '#E74C3C'];

  // Year options for dropdowns
  const yearOptions = [
    { value: 'all', label: 'All Years (1981-2020)' },
    ...(availableYears.map(year => ({ 
      value: year, 
      label: year.toString() 
    })))
  ];

  // Full Screen Components
  const FullScreenChart = ({ title, children, onClose }) => (
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

  // Full Screen Chart Content
  const FullScreenLineChart = () => (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={lineChartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="year" 
          stroke="#94A3B8"
          fontSize={14}
        />
        <YAxis 
          stroke="#94A3B8"
          fontSize={14}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip formatter={(value) => [value?.toLocaleString() || 0, 'Count']} />
        <Legend />
        {(filters.selectedGender === 'all' || filters.selectedGender === 'male') && (
          <Line 
            type="monotone" 
            dataKey="male" 
            stroke={GENDER_COLORS[0]} 
            strokeWidth={3}
            dot={false}
            name="Male"
          />
        )}
        {(filters.selectedGender === 'all' || filters.selectedGender === 'female') && (
          <Line 
            type="monotone" 
            dataKey="female" 
            stroke={GENDER_COLORS[1]} 
            strokeWidth={3}
            dot={false}
            name="Female"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  const FullScreenPieChart = () => (
    <ResponsiveContainer width="100%" height="90%">
      <PieChart>
        <Pie
          data={pieChartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={150}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          labelLine={false}
        >
          {pieChartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={GENDER_COLORS[index % GENDER_COLORS.length]} 
              stroke="#1E293B"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value?.toLocaleString() || 0, 'Count']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value?.toLocaleString() || 0}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Memoized Components to prevent unnecessary re-renders
  const ChartContainer = React.useMemo(() => 
    ({ title, children, icon, filters, onFullscreen }) => (
      <div className="chart-card">
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
    ), []);

  const YearRangeFilter = React.useMemo(() => 
    ({ value, onChange }) => (
      <div className="chart-filter">
        <label>View Years:</label>
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

  const YearDropdownFilter = React.useMemo(() => 
    ({ value, onChange, label = "Filter by Year" }) => (
      <div className="chart-filter">
        <label>{label}:</label>
        <select 
          value={value || 'all'} 
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

  const GenderDisplayFilter = React.useMemo(() => 
    ({ value, onChange }) => (
      <div className="chart-filter">
        <label>Show:</label>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="all">Both Genders</option>
          <option value="male">Male Only</option>
          <option value="female">Female Only</option>
        </select>
      </div>
    ), []);

  const handleFullscreenToggle = (chartTitle) => {
    setFullScreenChart(fullScreenChart === chartTitle ? null : chartTitle);
  };

  return (
    <div className="data-page sex-analytics-page">
      <div className="page-header">
        <h2><FiUsers /> Sex Analytics</h2>
        <p>Analyze gender-based migration patterns and trends</p>
      </div>

      {/* Full Screen Charts */}
      {fullScreenChart === "Male vs Female Trend Over Time" && (
        <FullScreenChart 
          title="Male vs Female Trend Over Time"
          onClose={() => setFullScreenChart(null)}
        >
          <FullScreenLineChart />
        </FullScreenChart>
      )}

      {fullScreenChart === "Gender Composition" && (
        <FullScreenChart 
          title="Gender Composition"
          onClose={() => setFullScreenChart(null)}
        >
          <FullScreenPieChart />
        </FullScreenChart>
      )}

      {hasData ? (
        <div className={`charts-grid two-column-layout ${fullScreenChart ? 'blurred' : ''}`}>
          {/* LINE CHART - Independent processing */}
          <ChartContainer 
            title="Male vs Female Trend Over Time" 
            icon={<FiTrendingUp />}
            filters={
              <div className="chart-filters-row">
                <YearRangeFilter 
                  value={filters.yearRange}
                  onChange={(range) => handleFilterChange('yearRange', range)}
                />
                <GenderDisplayFilter 
                  value={filters.selectedGender}
                  onChange={(gender) => handleFilterChange('selectedGender', gender)}
                />
              </div>
            }
            onFullscreen={() => handleFullscreenToggle("Male vs Female Trend Over Time")}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="year" 
                  stroke="#94A3B8"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#94A3B8"
                  fontSize={12}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {(filters.selectedGender === 'all' || filters.selectedGender === 'male') && (
                  <Line 
                    type="monotone" 
                    dataKey="male" 
                    stroke={GENDER_COLORS[0]} 
                    strokeWidth={2}
                    dot={false}
                    name="Male"
                  />
                )}
                {(filters.selectedGender === 'all' || filters.selectedGender === 'female') && (
                  <Line 
                    type="monotone" 
                    dataKey="female" 
                    stroke={GENDER_COLORS[1]} 
                    strokeWidth={2}
                    dot={false}
                    name="Female"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* PIE CHART - FIXED: Now shows data by default with "All Years" */}
          <ChartContainer 
            title="Gender Composition" 
            icon={<FiPieChart />}
            filters={
              <div className="chart-filters-row">
                <YearDropdownFilter 
                  value={currentGenderYear}
                  onChange={(year) => handleFilterChange('genderYear', year)}
                  label="Select Year"
                />
              </div>
            }
            onFullscreen={() => handleFullscreenToggle("Gender Composition")}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={GENDER_COLORS[index % GENDER_COLORS.length]} 
                      stroke="#1E293B"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value?.toLocaleString() || 0, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : (
        <div className="empty-state">
          <FiAlertCircle size={48} />
          <h3>No Data Available</h3>
          <p>Please upload sex data in the CSV Upload section to view gender analytics.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(SexAnalyticsPage);
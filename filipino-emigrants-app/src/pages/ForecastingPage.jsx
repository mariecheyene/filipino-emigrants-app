// src/pages/ForecastingPage.jsx - FIXED VERSION
import React, { useState } from 'react';
import SimpleForecastDisplay from '../components/SimpleForecastDisplay';
import LSTMForecast from '../components/LSTMForecast';
import MLPForecast from '../components/MLPForecast';
import '../css/ForecastingPage.css';

export default function ForecastingPage({ rawData }) {
  const [activeModel, setActiveModel] = useState('LSTM');
  const [viewMode, setViewMode] = useState('forecast'); // 'forecast' or 'train'

  // Prepare sex data
  const sexData = rawData.sexData || [];
  
  const forecastData = sexData.map(item => ({
    year: item.year,
    male: item.male || 0,
    female: item.female || 0,
    emigrants: (item.male || 0) + (item.female || 0)
  })).sort((a, b) => a.year - b.year);

  return (
    <div className="forecasting-page">
      {/* Header */}
      <div className="page-header">
        <h2>📈 Emigrant Forecasting</h2>
      </div>

      {/* Model Selection Tabs */}
      <div className="model-tabs-container">
        <div className="model-tabs">
          <button
            className={`model-tab ${activeModel === 'LSTM' ? 'active' : ''}`}
            onClick={() => setActiveModel('LSTM')}
          >
            <span className="model-icon">🧠</span>
            LSTM
          </button>
          
          <button
            className={`model-tab ${activeModel === 'MLP' ? 'active' : ''}`}
            onClick={() => setActiveModel('MLP')}
          >
            <span className="model-icon">🔢</span>
            MLP
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'forecast' ? 'active' : ''}`}
            onClick={() => setViewMode('forecast')}
          >
            Forecast
          </button>
          <button
            className={`view-btn ${viewMode === 'train' ? 'active' : ''}`}
            onClick={() => setViewMode('train')}
          >
            Train Model
          </button>
        </div>
      </div>

      {/* Main Content - REMOVE THE EXTRA WRAPPERS! */}
      {viewMode === 'forecast' ? (
        // NO forecast-section wrapper!
        <SimpleForecastDisplay 
          data={forecastData}
          modelType={activeModel}
        />
      ) : (
        // NO training-section wrapper!
        activeModel === 'LSTM' ? (
          <LSTMForecast data={forecastData} />
        ) : (
          <MLPForecast data={forecastData} />
        )
      )}

      {/* Quick Info */}
      <div className="quick-info">
        <p><strong>📋 How it works:</strong></p>
        <ol>
          <li>Go to <strong>"Train Model"</strong> tab to train a {activeModel} model</li>
          <li>Switch to <strong>"Forecast"</strong> tab to generate predictions</li>
          <li>System automatically uses the best trained model</li>
          <li>No training needed when generating forecasts</li>
        </ol>
      </div>
    </div>
  );
}
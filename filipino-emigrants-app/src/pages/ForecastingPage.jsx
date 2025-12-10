// src/pages/ForecastingPage.jsx
import React from 'react';
import LSTMForecast from '../components/LSTMForecast';
import MLPForecast from '../components/MLPForecast';

export default function ForecastingPage({ rawData }) {
  // Prepare sex data for forecasting
  const sexData = rawData?.sexData || [];
  
  // Calculate data statistics
  const dataStats = {
    totalYears: sexData.length,
    yearRange: sexData.length > 0 ? 
      `${sexData[0]?.year} - ${sexData[sexData.length - 1]?.year}` : 'No data',
    latestYear: sexData.length > 0 ? sexData[sexData.length - 1]?.year : null,
    latestMale: sexData.length > 0 ? sexData[sexData.length - 1]?.male || 0 : 0,
    latestFemale: sexData.length > 0 ? sexData[sexData.length - 1]?.female || 0 : 0,
    latestTotal: sexData.length > 0 ? 
      (Number(sexData[sexData.length - 1]?.male || 0) + Number(sexData[sexData.length - 1]?.female || 0)) : 0
  };

  return (
    <div className="forecasting-page">
      <div className="page-header">
        <h1>📈 Filipino Emigrant Forecasting</h1>
        <p className="page-description">
          Machine learning-based forecasting of Filipino emigrant trends using LSTM and MLP models
        </p>
      </div>

      {/* Data Summary */}
      <div className="data-summary">
        <div className="summary-card">
          <h3>📊 Data Overview</h3>
          <div className="summary-content">
            <p><strong>Total Years of Data:</strong> {dataStats.totalYears}</p>
            <p><strong>Year Range:</strong> {dataStats.yearRange}</p>
            {dataStats.latestYear && (
              <>
                <p><strong>Latest Data ({dataStats.latestYear}):</strong></p>
                <ul>
                  <li>Male Emigrants: {dataStats.latestMale.toLocaleString()}</li>
                  <li>Female Emigrants: {dataStats.latestFemale.toLocaleString()}</li>
                  <li><strong>Total Emigrants: {dataStats.latestTotal.toLocaleString()}</strong></li>
                </ul>
              </>
            )}
          </div>
        </div>
        
        <div className="summary-card">
          <h3>🎯 Model Comparison</h3>
          <div className="summary-content">
            <p><strong>LSTM (Long Short-Term Memory):</strong> Best for time series patterns</p>
            <p><strong>MLP (Multi-Layer Perceptron):</strong> Best for complex relationships</p>
            <p><strong>Forecast Period:</strong> Up to 10 years into the future</p>
            <p><strong>Validation:</strong> 20% split for testing</p>
          </div>
        </div>
      </div>

      {/* Warning if insufficient data */}
      {sexData.length < 8 && (
        <div className="warning-message">
          <h3>⚠️ Insufficient Data Warning</h3>
          <p>
            You have {sexData.length} years of data. For reliable forecasting, 
            at least 8 years of historical data is recommended. 
            The models may not produce accurate predictions with limited data.
          </p>
        </div>
      )}

      {/* LSTM Forecasting Section */}
      <section className="forecast-section">
        <LSTMForecast data={sexData} />
      </section>

      {/* MLP Forecasting Section */}
      <section className="forecast-section">
        <MLPForecast data={sexData} />
      </section>
    </div>
  );
}
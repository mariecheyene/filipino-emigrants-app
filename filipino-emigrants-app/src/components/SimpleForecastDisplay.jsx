// src/components/SimpleForecastDisplay.jsx - FIXED with auto-updating accuracy
import React, { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { loadLSTMModel } from '../models/lstmModel';
import { loadMLPModel } from '../models/mlpModel';
import { denormalize } from '../utils/dataPreparation';
import './SimpleForecastDisplay.css';  

export default function SimpleForecastDisplay({ data, modelType }) {
  const [isLoading, setIsLoading] = useState(false);
  const [forecastYears, setForecastYears] = useState(5);
  const [forecasts, setForecasts] = useState([]);
  const [modelAccuracy, setModelAccuracy] = useState(null);
  const [modelTrainedAt, setModelTrainedAt] = useState(null);
  const [error, setError] = useState(null);
  const [modelId, setModelId] = useState(null);

  // Function to load model and update info
  const loadModelAndInfo = useCallback(() => {
    // Get latest best model info
    const bestKey = modelType === 'LSTM' ? 'LSTM_best_model' : 'MLP_best_model';
    const bestInfo = JSON.parse(localStorage.getItem(bestKey) || 'null');
    
    if (bestInfo) {
      setModelAccuracy(bestInfo.accuracy || 'N/A');
      setModelTrainedAt(bestInfo.trainedAt || null);
      setModelId(bestInfo.modelId || null);
    } else {
      setModelAccuracy(null);
      setModelTrainedAt(null);
      setModelId(null);
    }
    
    return bestInfo;
  }, [modelType]);

  // Load model info on mount and when modelType changes
  useEffect(() => {
    loadModelAndInfo();
  }, [loadModelAndInfo]);

  // Listen for model training events
  useEffect(() => {
    const handleModelTrained = () => {
      console.log('Model trained event received, refreshing...');
      loadModelAndInfo();
      generateForecast();
    };

    // Listen for custom event when model is trained
    window.addEventListener('modelTrained', handleModelTrained);
    
    // Also check localStorage periodically (fallback)
    const interval = setInterval(() => {
      const bestKey = modelType === 'LSTM' ? 'LSTM_best_model' : 'MLP_best_model';
      const currentBest = JSON.parse(localStorage.getItem(bestKey) || 'null');
      if (currentBest && currentBest.modelId !== modelId) {
        console.log('Model changed, updating...');
        loadModelAndInfo();
        generateForecast();
      }
    }, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener('modelTrained', handleModelTrained);
      clearInterval(interval);
    };
  }, [modelType, modelId, loadModelAndInfo]);

  // Generate forecast function
  const generateForecast = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load the pre-trained model
      const result = modelType === 'LSTM' 
        ? await loadLSTMModel()
        : await loadMLPModel();

      if (!result || !result.model) {
        throw new Error(`No ${modelType} model found. Please train a model in the Training section below.`);
      }

      const { model, metadata } = result;
      
      // Update accuracy from metadata if not already set from best model
      if (!modelAccuracy && metadata.metrics) {
        setModelAccuracy(metadata.metrics.accuracy || 'N/A');
      }
      
      if (!modelTrainedAt && metadata.trainedAt) {
        setModelTrainedAt(metadata.trainedAt);
      }

      // Generate forecast
      const { mins, maxs, lastData, lookback = 3 } = metadata;
      let currentSequence = Array.isArray(lastData) && lastData.length >= lookback
        ? lastData.map(row => ({
            year: row.year,
            emigrants: row.emigrants || 0
          }))
        : getHistoricalSequence(lookback);

      if (currentSequence.length < lookback) {
        throw new Error(`Need at least ${lookback} years of data.`);
      }

      const predictions = [];
      let currentYear = metadata.lastYear || currentSequence[currentSequence.length - 1].year;

      for (let i = 0; i < forecastYears; i++) {
        // Normalize current sequence
        const normalized = currentSequence.map(row => ({
          emigrants: (row.emigrants - mins.emigrants) / (maxs.emigrants - mins.emigrants)
        }));

        let normalizedPred;
        
        if (modelType === 'LSTM') {
          // LSTM expects 3D input
          const inputArray = [normalized.map(row => [row.emigrants])];
          const xs = tf.tensor3d(inputArray, [1, lookback, 1]);
          const predTensor = model.predict(xs);
          const predArray = await predTensor.array();
          xs.dispose();
          predTensor.dispose();
          normalizedPred = predArray[0][0];
        } else {
          // MLP expects flattened 2D input
          const flatInput = normalized.flatMap(row => [row.emigrants]);
          const xs = tf.tensor2d([flatInput], [1, lookback]);
          const predTensor = model.predict(xs);
          const predArray = await predTensor.array();
          xs.dispose();
          predTensor.dispose();
          normalizedPred = predArray[0][0];
        }

        // Denormalize
        const predictedEmigrants = denormalize(normalizedPred, mins.emigrants, maxs.emigrants);

        currentYear++;
        predictions.push({
          year: currentYear.toString(),
          emigrants: Math.round(Math.max(0, predictedEmigrants)),
          isForecast: true
        });

        // Slide window
        currentSequence = [
          ...currentSequence.slice(1),
          {
            year: currentYear,
            emigrants: predictedEmigrants
          }
        ];
      }

      setForecasts(predictions);
    } catch (error) {
      console.error('Forecasting error:', error);
      setError(error.message);
      setForecasts([]);
    } finally {
      setIsLoading(false);
    }
  }, [modelType, forecastYears, modelAccuracy, modelTrainedAt, data]);

  // Initial forecast on mount
  useEffect(() => {
    generateForecast();
  }, [generateForecast]);

  const getHistoricalSequence = (lookback) => {
    if (!data || !Array.isArray(data)) return [];
    
    const historical = data
      .filter(item => item && (item.male !== undefined || item.female !== undefined))
      .map(item => ({
        year: Number(item.year),
        emigrants: (Number(item.male) || 0) + (Number(item.female) || 0)
      }))
      .sort((a, b) => a.year - b.year)
      .slice(-lookback);
    
    return historical;
  };

  const handleForecastYearsChange = (e) => {
    const years = parseInt(e.target.value);
    if (years >= 1 && years <= 10) {
      setForecastYears(years);
      generateForecast();
    }
  };

  // Prepare historical data
  const historicalData = Array.isArray(data) ? data
    .filter(item => item && (item.male !== undefined || item.female !== undefined))
    .map(item => {
      const male = Number(item.male) || 0;
      const female = Number(item.female) || 0;
      const total = male + female;
      
      return {
        year: item.year?.toString() || '',
        emigrants: total,
        isForecast: false
      };
    })
    .sort((a, b) => parseInt(a.year) - parseInt(b.year)) : [];

  // Prepare forecast data
  const forecastData = forecasts.map(f => ({
    year: f.year,
    emigrants: f.emigrants,
    isForecast: true
  }));

  // Combine for chart
  const chartData = [...historicalData, ...forecastData];

  return (
    <div className={`forecast-panel ${modelType.toLowerCase()}-panel`}>
      <h2>{modelType} Forecast</h2>
      <p className="subtitle">Using pre-trained model for forecasting</p>

      {/* Model Status Info */}
      <div className="model-status">
        <div className="status-badge">✅ Using Pre-trained Model</div>
        {modelAccuracy && (
          <div className="accuracy-info">
            Accuracy: {modelAccuracy}%
            {modelTrainedAt && (
              <span className="training-date">
                • Trained: {new Date(modelTrainedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Forecast Controls */}
<div className="forecast-controls">
  <h3>Generate Forecast</h3>
  <div className="forecast-input">
    <label>
      Years to forecast (1-10):
      <input
        type="number"
        min="1"
        max="10"
        value={forecastYears}
        onChange={(e) => setForecastYears(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
      />
    </label>
    <button onClick={generateForecast} disabled={isLoading} className="generate-btn">
      {isLoading ? '🔄 Generating...' : '🔮 Generate Forecast'}
    </button>
    <button onClick={loadModelAndInfo} disabled={isLoading} className="refresh-btn">
      🔄 Refresh Model Info
    </button>
  </div>
</div>

      {error ? (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <p>Please train a {modelType} model in the Training section below.</p>
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <>
              <div className="chart-container">
                <h3>Historical Trend & Forecast</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="year" 
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip 
                      formatter={(value) => [value.toLocaleString(), 'Emigrants']}
                      labelFormatter={(label) => `Year: ${label}`}
                      contentStyle={{ 
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={(entry) => entry.isForecast ? null : entry.emigrants}
                      stroke="#34d399"
                      strokeWidth={2}
                      name="Historical"
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={(entry) => entry.isForecast ? entry.emigrants : null}
                      stroke={modelType === 'LSTM' ? '#f87171' : '#9b59b6'}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Forecast"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {forecasts.length > 0 && (
                <div className="forecast-results">
                  <h3>Forecast Results (Next {forecastYears} Years)</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Predicted Emigrants</th>
                        <th>Annual Change</th>
                        <th>Cumulative Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecasts.map((f, i) => {
                        const prevYear = i === 0 
                          ? historicalData[historicalData.length - 1]?.emigrants 
                          : forecasts[i-1]?.emigrants;
                        const change = f.emigrants - prevYear;
                        const changePercent = prevYear > 0 ? ((change / prevYear) * 100).toFixed(1) : 'N/A';
                        
                        const baseYear = historicalData[historicalData.length - 1]?.emigrants;
                        const cumulativeChange = f.emigrants - baseYear;
                        const cumulativePercent = baseYear > 0 ? ((cumulativeChange / baseYear) * 100).toFixed(1) : 'N/A';
                        
                        return (
                          <tr key={i}>
                            <td>{f.year}</td>
                            <td>{f.emigrants.toLocaleString()}</td>
                            <td className={change >= 0 ? 'positive' : 'negative'}>
                              {change >= 0 ? '+' : ''}{change.toLocaleString()} ({changePercent}%)
                            </td>
                            <td className={cumulativeChange >= 0 ? 'positive' : 'negative'}>
                              {cumulativeChange >= 0 ? '+' : ''}{cumulativeChange.toLocaleString()} ({cumulativePercent}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Model Config */}
      <div className="model-config-centered">
        <h4>{modelType} Model Configuration</h4>
        <ul>
          {modelType === 'LSTM' ? (
            <>
              <li><strong>Architecture:</strong> 2 LSTM layers (104 → 52 units)</li>
              <li><strong>Lookback Window:</strong> 3 years</li>
              <li><strong>Input Features:</strong> Historical emigrant counts</li>
              <li><strong>Target:</strong> Next year's emigrant count</li>
              <li><strong>Dropout Rate:</strong> 0.025</li>
            </>
          ) : (
            <>
              <li><strong>Architecture:</strong> 2 Dense layers (128 → 128 units)</li>
              <li><strong>Lookback Window:</strong> 3 years</li>
              <li><strong>Input Features:</strong> Historical emigrant counts (flattened)</li>
              <li><strong>Target:</strong> Next year's emigrant count</li>
              <li><strong>Activation:</strong> ELU → Tanh</li>
              <li><strong>Dropout Rate:</strong> 0.2</li>
            </>
          )}
          <li><strong>Training Epochs:</strong> 100</li>
          <li><strong>Validation Split:</strong> 20%</li>
          <li><strong>Optimizer:</strong> Adam (lr=0.001)</li>
          <li><strong>Forecasting:</strong> Total Filipino Emigrants</li>
        </ul>
      </div>
    </div>
  );
}
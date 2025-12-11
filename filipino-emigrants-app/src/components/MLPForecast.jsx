// src/components/MLPForecast.jsx - UPDATED with MAPE calculation
import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cleanData, sortData, normalizeData, denormalize, createSequences, calculateMetrics } from '../utils/dataPreparation';
import { buildMLPModel, trainMLPModel, predictMLP, saveMLPModel, loadMLPModel, deleteMLPModel, downloadMLPModel, uploadMLPModelFromFile } from '../models/mlpModel';
import './ForecastPanel.css';

export default function MLPForecast({ data }) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [model, setModel] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [forecastYears, setForecastYears] = useState(5);
  const [forecasts, setForecasts] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const fileInputRef = useRef(null);

  const LOOKBACK = 3;
  const FEATURES = ['emigrants'];
  const TARGET = 'emigrants';

  // Load saved forecasts on component mount
  useEffect(() => {
    const savedForecasts = localStorage.getItem('mlp_forecasts');
    if (savedForecasts) {
      try {
        setForecasts(JSON.parse(savedForecasts));
      } catch (e) {
        console.error('Error loading saved forecasts:', e);
      }
    }
    
    const savedYears = localStorage.getItem('mlp_forecast_years');
    if (savedYears) {
      setForecastYears(parseInt(savedYears));
    }
  }, []);

  // Save forecasts to localStorage whenever they change
  useEffect(() => {
    if (forecasts.length > 0) {
      localStorage.setItem('mlp_forecasts', JSON.stringify(forecasts));
      localStorage.setItem('mlp_forecast_years', forecastYears.toString());
    }
  }, [forecasts, forecastYears]);

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingProgress({ epoch: 0, loss: 0, mae: 0 });
    setMetrics(null);
    setValidationResults([]);

    try {
      const preparedData = Array.isArray(data) ? data
        .filter(item => item && item.year && (item.male !== undefined || item.female !== undefined))
        .map(item => {
          const male = Number(item.male) || 0;
          const female = Number(item.female) || 0;
          const total = male + female;
          
          return {
            year: Number(item.year),
            emigrants: total
          };
        })
        .sort((a, b) => a.year - b.year) : [];

      if (preparedData.length < LOOKBACK + 5) {
        alert(`Need at least ${LOOKBACK + 5} years of data for training. Currently have ${preparedData.length}.`);
        setIsTraining(false);
        return;
      }

      let cleanedData = cleanData(preparedData);
      cleanedData = sortData(cleanedData);

      const { normalized, mins, maxs } = normalizeData(cleanedData, FEATURES);
      const { X, y } = createSequences(normalized, LOOKBACK, FEATURES, TARGET);

      const newModel = buildMLPModel(LOOKBACK, FEATURES.length);

      const onEpochEnd = (epoch, logs) => {
        setTrainingProgress({
          epoch: epoch + 1,
          loss: logs.loss.toFixed(6),
          mae: logs.mae.toFixed(6),
          val_loss: logs.val_loss?.toFixed(6),
          val_mae: logs.val_mae?.toFixed(6)
        });
      };

      await trainMLPModel(newModel, X, y, onEpochEnd, 100, 0.2);

      const normalizedPredictions = await predictMLP(newModel, X);
      const predictions = normalizedPredictions.map(pred =>
        denormalize(pred, mins[TARGET], maxs[TARGET])
      );
      const actualValues = y.map(val =>
        denormalize(val, mins[TARGET], maxs[TARGET])
      );

      const trainSize = Math.floor(actualValues.length * 0.8);
      const resultsData = [];
      for (let i = trainSize; i < actualValues.length; i++) {
        const dataIndex = i + LOOKBACK;
        if (dataIndex < cleanedData.length) {
          resultsData.push({
            year: cleanedData[dataIndex].year,
            actual: Math.round(actualValues[i]),
            predicted: Math.round(predictions[i]),
            error: Math.round(predictions[i] - actualValues[i])
          });
        }
      }
      setValidationResults(resultsData);

      const calculatedMetrics = calculateMetrics(actualValues, predictions);
      console.log('📊 MLP Model Metrics:', calculatedMetrics); // Debug log
      setMetrics(calculatedMetrics);

      // Generate unique ID for this model
      const modelId = `mlp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newMetadata = {
        modelType: 'MLP',
        modelId: modelId,
        lookback: LOOKBACK,
        features: FEATURES,
        target: TARGET,
        mins,
        maxs,
        lastYear: cleanedData[cleanedData.length - 1].year,
        lastData: cleanedData.slice(-LOOKBACK),
        metrics: calculatedMetrics,
        trainedAt: new Date().toISOString(),
        validationResults: resultsData
      };

      await saveMLPModel(newModel, newMetadata);

      setModel(newModel);
      setMetadata(newMetadata);

      // Track best model automatically
      const bestModelInfo = JSON.parse(localStorage.getItem('MLP_best_model') || '{}');
      const currentAccuracy = parseFloat(calculatedMetrics.accuracy);
      const bestAccuracy = parseFloat(bestModelInfo.accuracy || 0);

      if (currentAccuracy > bestAccuracy) {
        const bestInfo = {
          modelId: modelId,
          accuracy: calculatedMetrics.accuracy,
          trainedAt: newMetadata.trainedAt,
          metrics: calculatedMetrics
        };
        localStorage.setItem('MLP_best_model', JSON.stringify(bestInfo));
      }

      alert(`✅ MLP model trained successfully!\nAccuracy: ${calculatedMetrics.accuracy}%\nModel ID: ${modelId}`);
    } catch (error) {
      console.error('Training error:', error);
      alert('❌ Error training model: ' + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  const handleLoadModel = async () => {
    try {
      const result = await loadMLPModel();
      if (result) {
        setModel(result.model);
        setMetadata(result.metadata);
        setMetrics(result.metadata.metrics);
        alert('✅ MLP model loaded successfully!');
      } else {
        alert('⚠️ No saved model found. Please train a model first.');
      }
    } catch (error) {
      console.error('Error loading model:', error);
      alert('❌ Error loading model: ' + error.message);
    }
  };

  const handleUploadModel = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('❌ Please upload a JSON file (.json)');
      return;
    }

    try {
      // Show loading - use setIsTraining instead of setIsLoading
      setIsTraining(true);
      
      // Use the new upload function
      const result = await uploadMLPModelFromFile(file);
      
      if (result) {
        setModel(result.model);
        setMetadata(result.metadata);
        setMetrics(result.metadata.metrics || {});
        
        // Update best model if this one is better
        const currentAccuracy = parseFloat(result.metadata.metrics?.accuracy || 0);
        const bestModelInfo = JSON.parse(localStorage.getItem('MLP_best_model') || '{}');
        const bestAccuracy = parseFloat(bestModelInfo.accuracy || 0);
        
        if (currentAccuracy > bestAccuracy) {
          const bestInfo = {
            modelId: result.modelId,
            accuracy: result.metadata.metrics?.accuracy || 'N/A',
            trainedAt: result.metadata.trainedAt,
            metrics: result.metadata.metrics
          };
          localStorage.setItem('MLP_best_model', JSON.stringify(bestInfo));
        }
        
        alert(`✅ MLP model uploaded successfully!\n\n` +
              `Accuracy: ${result.metadata.metrics?.accuracy || 'N/A'}%\n` +
              `Trained: ${new Date(result.metadata.trainedAt || Date.now()).toLocaleDateString()}`);
      } else {
        alert('❌ Failed to upload model');
      }
      
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading model:', error);
      alert('❌ Error uploading model: ' + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!confirm('⚠️ Are you sure you want to delete the saved MLP model?')) return;

    try {
      await deleteMLPModel();
      setModel(null);
      setMetadata(null);
      setMetrics(null);
      setForecasts([]);
      setValidationResults([]);
      
      localStorage.removeItem('mlp_forecasts');
      localStorage.removeItem('mlp_forecast_years');
      localStorage.removeItem('MLP_best_model');
      
      alert('✅ MLP model deleted successfully!');
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('❌ Error deleting model: ' + error.message);
    }
  };

  const handleDownloadModel = async () => {
    if (!model || !metadata) {
      alert('⚠️ No model to download. Please train a model first.');
      return;
    }

    try {
      await downloadMLPModel(model, metadata);
      alert('✅ MLP model file downloaded!');
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('❌ Error downloading model: ' + error.message);
    }
  };

  const handleForecast = async () => {
    if (!model || !metadata) {
      alert('⚠️ Please train, load, or upload a model first.');
      return;
    }

    try {
      const { mins, maxs, lastData } = metadata;
      let currentSequence = lastData.map(row => ({
        year: row.year,
        emigrants: row.emigrants
      }));

      const predictions = [];
      let currentYear = metadata.lastYear;

      for (let i = 0; i < forecastYears; i++) {
        const normalized = currentSequence.map(row => ({
          emigrants: (row.emigrants - mins.emigrants) / (maxs.emigrants - mins.emigrants)
        }));

        const input = [normalized.map(row => FEATURES.map(f => row[f]))];
        const normalizedPred = await predictMLP(model, input);
        const predictedEmigrants = denormalize(normalizedPred[0], mins[TARGET], maxs[TARGET]);

        currentYear++;
        predictions.push({
          year: currentYear.toString(),
          emigrants: Math.round(predictedEmigrants),
          isForecast: true
        });

        currentSequence = [
          ...currentSequence.slice(1),
          {
            year: currentYear,
            emigrants: predictedEmigrants
          }
        ];
      }

      setForecasts(predictions);
      alert(`✅ Generated ${forecastYears} year MLP forecast!`);
    } catch (error) {
      console.error('Forecasting error:', error);
      alert('❌ Error generating forecast: ' + error.message);
    }
  };

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

  const forecastData = Array.isArray(forecasts) ? forecasts.map(f => ({
    ...f,
    isForecast: true
  })) : [];

  const chartData = [...historicalData, ...forecastData];

  return (
    <div className="forecast-panel mlp-panel">
      <h2>MLP Forecasting (Multi-Layer Perceptron)</h2>
      <p className="subtitle">Time-series forecasting using Multi-Layer Perceptron neural networks</p>

      <div className="control-buttons">
        <button onClick={handleTrain} disabled={isTraining} className="train-btn">
          {isTraining ? '🔄 Training...' : '🚀 Train MLP Model'}
        </button>
        <button onClick={handleLoadModel} disabled={isTraining} className="load-btn">
          📂 Load Model
        </button>
        <button onClick={handleUploadModel} disabled={isTraining} className="upload-btn">
          📤 Upload Model
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          style={{ display: 'none' }}
        />
        <button onClick={handleDeleteModel} disabled={isTraining || !model} className="delete-btn">
          🗑️ Delete Model
        </button>
        <button onClick={handleDownloadModel} disabled={isTraining || !model} className="download-btn">
          💾 Download Model
        </button>
      </div>

      {isTraining && trainingProgress && (
        <div className="training-progress">
          <h3>Training Progress</h3>
          <div className="progress-info">
            <p>Epoch: {trainingProgress.epoch} / 100</p>
            <p>Loss: {trainingProgress.loss}</p>
            <p>MAE: {trainingProgress.mae}</p>
            {trainingProgress.val_loss && (
              <>
                <p>Val Loss: {trainingProgress.val_loss}</p>
                <p>Val MAE: {trainingProgress.val_mae}</p>
              </>
            )}
          </div>
        </div>
      )}

      {metrics && !isTraining && (
        <>
          <div className="metrics">
            <h3>MLP Model Performance</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">{metrics.accuracy}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">MAE</span>
                <span className="metric-value">{metrics.mae}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">RMSE</span>
                <span className="metric-value">{metrics.rmse}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">MAPE</span>
                <span className="metric-value">{metrics.mape}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">R² Score</span>
                <span className="metric-value">{metrics.r2}</span>
              </div>
            </div>
          </div>

          {validationResults.length > 0 ? (
            <div className="training-results">
              <h3>Validation Results (20% Test Split)</h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Actual Emigrants</th>
                      <th>Predicted Emigrants</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.map((row, i) => (
                      <tr key={i}>
                        <td>{row.year || 'N/A'}</td>
                        <td>{row.actual?.toLocaleString() || 'N/A'}</td>
                        <td>{row.predicted?.toLocaleString() || 'N/A'}</td>
                        <td className={row.error >= 0 ? 'error-positive' : 'error-negative'}>
                          {row.error >= 0 ? '+' : ''}{row.error?.toLocaleString() || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="no-results">
              <p>No validation results available. Train model to see predictions.</p>
            </div>
          )}
        </>
      )}

      {model && !isTraining && (
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
            <div className="button-group">
              <button onClick={handleForecast} className="forecast-btn">
                🔮 Generate Forecast
              </button>
              <button onClick={handleLoadModel} className="refresh-btn">
                🔄 Refresh Model Info
              </button>
            </div>
          </div>
        </div>
      )}

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
                  stroke="#9b59b6"
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

      <div className="model-config-centered">
        <h4>MLP Model Configuration</h4>
        <ul>
          <li><strong>Architecture:</strong> 2 Dense layers (128 → 128 units)</li>
          <li><strong>Lookback Window:</strong> {LOOKBACK} years</li>
          <li><strong>Input Features:</strong> Historical emigrant counts (flattened)</li>
          <li><strong>Target:</strong> Next year's emigrant count</li>
          <li><strong>Activation:</strong> ELU → Tanh</li>
          <li><strong>Dropout Rate:</strong> 0.2</li>
          <li><strong>Training Epochs:</strong> 100</li>
          <li><strong>Validation Split:</strong> 20%</li>
          <li><strong>Optimizer:</strong> Adam (lr=0.001)</li>
          <li><strong>Forecasting:</strong> Total Filipino Emigrants</li>
        </ul>
      </div>
    </div>
  );
}
// src/components/LSTMForecast.jsx
import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cleanData, sortData, normalizeData, denormalize, createSequences, calculateMetrics } from '../utils/dataPreparation';
import { buildLSTMModel, trainLSTMModel, predictLSTM, saveLSTMModel, loadLSTMModel, deleteLSTMModel, downloadLSTMModel } from '../models/lstmModel';
import './ForecastPanel.css';

export default function LSTMForecast({ data }) {
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

  // Prepare sex data for forecasting - Convert male+female to total emigrants
  const prepareSexData = () => {
    if (!data || !Array.isArray(data)) return [];
    
    return data
      .filter(item => item.year && (item.male !== undefined || item.female !== undefined))
      .map(item => {
        const male = Number(item.male) || 0;
        const female = Number(item.female) || 0;
        const total = male + female;
        
        return {
          year: Number(item.year),
          emigrants: total
        };
      })
      .sort((a, b) => a.year - b.year);
  };

  const handleTrain = async () => {
    const preparedData = prepareSexData();
    
    if (preparedData.length < LOOKBACK + 5) {
      alert(`Need at least ${LOOKBACK + 5} years of data for training. Currently have ${preparedData.length}.`);
      return;
    }

    setIsTraining(true);
    setTrainingProgress({ epoch: 0, loss: 0, mae: 0 });
    setMetrics(null);
    setValidationResults([]);

    try {
      let cleanedData = cleanData(preparedData);
      cleanedData = sortData(cleanedData);

      const { normalized, mins, maxs } = normalizeData(cleanedData, FEATURES);
      const { X, y } = createSequences(normalized, LOOKBACK, FEATURES, TARGET);

      const newModel = buildLSTMModel(LOOKBACK, FEATURES.length);

      const onEpochEnd = (epoch, logs) => {
        setTrainingProgress({
          epoch: epoch + 1,
          loss: logs.loss.toFixed(6),
          mae: logs.mae.toFixed(6),
          val_loss: logs.val_loss?.toFixed(6),
          val_mae: logs.val_mae?.toFixed(6)
        });
      };

      await trainLSTMModel(newModel, X, y, onEpochEnd, 100, 0.2);

      const normalizedPredictions = await predictLSTM(newModel, X);

      const predictions = normalizedPredictions.map(pred =>
        denormalize(pred, mins[TARGET], maxs[TARGET])
      );

      const actualValues = y.map(val =>
        denormalize(val, mins[TARGET], maxs[TARGET])
      );

      // Create validation results table data
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
      setMetrics(calculatedMetrics);

      const newMetadata = {
        modelType: 'LSTM',
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

      await saveLSTMModel(newModel, newMetadata);

      setModel(newModel);
      setMetadata(newMetadata);

      alert(`LSTM model trained successfully!\nAccuracy: ${calculatedMetrics.accuracy}%`);
    } catch (error) {
      console.error('Training error:', error);
      alert('Error training model: ' + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  const handleLoadModel = async () => {
    try {
      const result = await loadLSTMModel();
      if (result) {
        setModel(result.model);
        setMetadata(result.metadata);
        setMetrics(result.metadata.metrics);
        alert('LSTM model loaded successfully!');
      } else {
        alert('No saved model found. Please train a model first.');
      }
    } catch (error) {
      console.error('Error loading model:', error);
      alert('Error loading model: ' + error.message);
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
      alert('Please upload a JSON model file');
      return;
    }

    try {
      const text = await file.text();
      const uploadedMetadata = JSON.parse(text);
      
      // Basic validation
      if (!uploadedMetadata.modelType || uploadedMetadata.modelType !== 'LSTM') {
        alert('This is not a valid LSTM model file');
        return;
      }

      // Load the model architecture and weights
      const model = await tf.loadLayersModel(`file://${file.name}`);
      
      // Set the loaded model
      setModel(model);
      setMetadata(uploadedMetadata);
      setMetrics(uploadedMetadata.metrics);
      
      alert('LSTM model uploaded successfully!');
    } catch (error) {
      console.error('Error uploading model:', error);
      alert('Error uploading model: ' + error.message);
    }
  };

  const handleDeleteModel = async () => {
    if (!confirm('Are you sure you want to delete the saved LSTM model?')) return;

    try {
      await deleteLSTMModel();
      setModel(null);
      setMetadata(null);
      setMetrics(null);
      setForecasts([]);
      setValidationResults([]);
      alert('LSTM model deleted successfully!');
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Error deleting model: ' + error.message);
    }
  };

  const handleDownloadModel = async () => {
    if (!model || !metadata) {
      alert('No model to download. Please train a model first.');
      return;
    }

    try {
      await downloadLSTMModel(model, metadata);
      alert('LSTM model files downloaded!');
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('Error downloading model: ' + error.message);
    }
  };

  const handleForecast = async () => {
    if (!model || !metadata) {
      alert('Please train, load, or upload a model first.');
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
        const normalizedPred = await predictLSTM(model, input);
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
      alert(`Generated ${forecastYears} year LSTM forecast!`);
    } catch (error) {
      console.error('Forecasting error:', error);
      alert('Error generating forecast: ' + error.message);
    }
  };

  // Prepare chart data
  const historicalData = prepareSexData().map(item => ({
    year: item.year.toString(),
    emigrants: item.emigrants,
    isForecast: false
  }));

  const forecastData = forecasts.map(f => ({
    ...f,
    isForecast: true
  }));

  const chartData = [...historicalData, ...forecastData];

  return (
    <div className="forecast-panel lstm-panel">
      <h2>LSTM Forecasting (Long Short-Term Memory)</h2>
      <p className="subtitle">Time-series forecasting using Long Short-Term Memory neural networks</p>

      <div className="control-buttons">
        <button onClick={handleTrain} disabled={isTraining}>
          {isTraining ? 'Training...' : 'Train LSTM Model'}
        </button>
        <button onClick={handleLoadModel} disabled={isTraining}>
          Load Model
        </button>
        <button onClick={handleUploadModel} disabled={isTraining}>
          📤 Upload Model
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          style={{ display: 'none' }}
        />
        <button onClick={handleDeleteModel} disabled={isTraining || !model}>
          Delete Model
        </button>
        <button onClick={handleDownloadModel} disabled={isTraining || !model}>
          Download Model
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
            <h3>LSTM Model Performance</h3>
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
            <button onClick={handleForecast}>Generate Forecast</button>
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
                  stroke="#f87171"
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

      {/* Centered Model Configuration */}
      <div className="model-config-container">
        <div className="model-config-box">
          <h4>LSTM Model Configuration</h4>
          <div className="config-grid">
            <div className="config-item">
              <span className="config-label">Architecture</span>
              <span className="config-value">2 LSTM layers (50 units each)</span>
            </div>
            <div className="config-item">
              <span className="config-label">Lookback Window</span>
              <span className="config-value">{LOOKBACK} years</span>
            </div>
            <div className="config-item">
              <span className="config-label">Input Features</span>
              <span className="config-value">Historical emigrant counts</span>
            </div>
            <div className="config-item">
              <span className="config-label">Target</span>
              <span className="config-value">Next year's emigrant count</span>
            </div>
            <div className="config-item">
              <span className="config-label">Dropout Rate</span>
              <span className="config-value">0.2</span>
            </div>
            <div className="config-item">
              <span className="config-label">Training Epochs</span>
              <span className="config-value">100</span>
            </div>
            <div className="config-item">
              <span className="config-label">Validation Split</span>
              <span className="config-value">20%</span>
            </div>
            <div className="config-item">
              <span className="config-label">Optimizer</span>
              <span className="config-value">Adam (lr=0.001)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
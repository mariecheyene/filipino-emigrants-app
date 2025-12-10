// src/components/MLPForecast.jsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cleanData, sortData, normalizeData, denormalize, createSequences, calculateMetrics } from '../utils/dataPreparation';
import { buildMLPModel, trainMLPModel, predictMLP, saveMLPModel, loadMLPModel, deleteMLPModel, downloadMLPModel } from '../models/mlpModel';
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
          emigrants: total  // Use total emigrants
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
      console.log('Prepared data for training:', preparedData);
      
      let cleanedData = cleanData(preparedData);
      cleanedData = sortData(cleanedData);

      console.log('Cleaned data:', cleanedData);

      const { normalized, mins, maxs } = normalizeData(cleanedData, FEATURES);
      const { X, y } = createSequences(normalized, LOOKBACK, FEATURES, TARGET);

      console.log(`Training with ${X.length} sequences`);

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

      console.log('Actual values:', actualValues);
      console.log('Predictions:', predictions);

      // Create validation results table data (20% validation split for testing)
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

      console.log('Validation results:', resultsData);
      setValidationResults(resultsData);

      const calculatedMetrics = calculateMetrics(actualValues, predictions);
      setMetrics(calculatedMetrics);

      const newMetadata = {
        modelType: 'MLP',
        lookback: LOOKBACK,
        features: FEATURES,
        target: TARGET,
        mins,
        maxs,
        lastYear: cleanedData[cleanedData.length - 1].year,
        lastData: cleanedData.slice(-LOOKBACK),
        metrics: calculatedMetrics,
        trainedAt: new Date().toISOString()
      };

      await saveMLPModel(newModel, newMetadata);

      setModel(newModel);
      setMetadata(newMetadata);

      alert(`MLP model trained successfully!\nMAE: ${calculatedMetrics.mae}\nAccuracy: ${calculatedMetrics.accuracy}%`);
    } catch (error) {
      console.error('Training error:', error);
      alert('Error training model: ' + error.message);
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
        alert('MLP model loaded successfully!');
      } else {
        alert('No saved model found. Please train a model first.');
      }
    } catch (error) {
      console.error('Error loading model:', error);
      alert('Error loading model: ' + error.message);
    }
  };

  const handleDeleteModel = async () => {
    if (!confirm('Are you sure you want to delete the saved MLP model?')) return;

    try {
      await deleteMLPModel();
      setModel(null);
      setMetadata(null);
      setMetrics(null);
      setForecasts([]);
      setValidationResults([]);
      alert('MLP model deleted successfully!');
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
      await downloadMLPModel(model, metadata);
      alert('MLP model files downloaded!');
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('Error downloading model: ' + error.message);
    }
  };

  const handleForecast = async () => {
    if (!model || !metadata) {
      alert('Please train or load a model first.');
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
      alert(`Generated ${forecastYears} year MLP forecast!`);
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
    <div className="forecast-panel mlp-panel">
      <h2>MLP Forecasting (Multi-Layer Perceptron)</h2>
      <p className="subtitle">Forecasting total Filipino emigrants using neural networks</p>

      <div className="control-buttons">
        <button onClick={handleTrain} disabled={isTraining}>
          {isTraining ? 'Training...' : 'Train MLP Model'}
        </button>
        <button onClick={handleLoadModel} disabled={isTraining}>
          Load Model
        </button>
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
      )}

      {metrics && !isTraining && (
        <>
          <div className="metrics">
            <h3>MLP Model Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">MAE:</span>
                <span className="metric-value">{metrics.mae}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">RMSE:</span>
                <span className="metric-value">{metrics.rmse}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">MAPE:</span>
                <span className="metric-value">{metrics.mape}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">R²:</span>
                <span className="metric-value">{metrics.r2}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Accuracy:</span>
                <span className="metric-value">{metrics.accuracy}%</span>
              </div>
            </div>
          </div>

          {validationResults.length > 0 ? (
            <div className="training-results">
              <h3>Testing Results - 20% Split (Actual vs Predicted)</h3>
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
          <h3>Generate MLP Forecast</h3>
          <div className="forecast-input">
            <label>
              Years to forecast:
              <input
                type="number"
                min="1"
                max="10"
                value={forecastYears}
                onChange={(e) => setForecastYears(parseInt(e.target.value))}
              />
            </label>
            <button onClick={handleForecast}>Generate Forecast</button>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <>
          <div className="chart-container">
            <h3>MLP: Historical + Forecast</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis
                  label={{ value: 'Emigrants', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [value.toLocaleString(), 'Emigrants']}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={(entry) => entry.isForecast ? null : entry.emigrants}
                  stroke="#82ca9d"
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
              <h3>MLP Forecast Results</h3>
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Predicted Emigrants</th>
                    <th>Change from Previous Year</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((f, i) => {
                    const prevYear = i === 0 
                      ? historicalData[historicalData.length - 1]?.emigrants 
                      : forecasts[i-1]?.emigrants;
                    const change = f.emigrants - prevYear;
                    const changePercent = prevYear > 0 ? ((change / prevYear) * 100).toFixed(1) : 'N/A';
                    
                    return (
                      <tr key={i}>
                        <td>{f.year}</td>
                        <td>{f.emigrants.toLocaleString()}</td>
                        <td className={change >= 0 ? 'positive' : 'negative'}>
                          {change >= 0 ? '+' : ''}{change.toLocaleString()} ({changePercent}%)
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

      <div className="info-box">
        <h4>MLP Model Configuration</h4>
        <ul>
          <li>Architecture: 2 Dense layers (64, 32 units)</li>
          <li>Lookback window: {LOOKBACK} years</li>
          <li>Input features: Historical emigrant counts (flattened)</li>
          <li>Target: Next year's emigrant count</li>
          <li>Dropout: 0.2</li>
          <li>Epochs: 100 | Validation split: 20%</li>
          <li>Forecasting: <strong>Total Filipino Emigrants</strong></li>
          <li>Data source: Firebase sexData (male + female = total)</li>
        </ul>
      </div>
    </div>
  );
}
import * as tf from '@tensorflow/tfjs';

/**
 * Build LSTM Model for Time Series Forecasting
 * Architecture:
 * - Input: [lookback, features] e.g., [3, 2] for 3 years × 2 features
 * - LSTM Layer 1: 50 units with dropout 0.2
 * - LSTM Layer 2: 50 units with dropout 0.2
 * - Dense Output: 1 unit (emigrants prediction)
 * - Loss: MSE (Mean Squared Error)
 * - Optimizer: Adam (lr=0.001)
 * - Metrics: MAE (Mean Absolute Error)
 */
export function buildLSTMModel(lookback = 4, features = 2) {
  const model = tf.sequential();

  // First LSTM layer
  model.add(tf.layers.lstm({
    units:104,
    returnSequences: true,
    inputShape: [lookback, features],
    dropout: 0.025
  }));

  // Second LSTM layer
  model.add(tf.layers.lstm({
    units: 52,
    dropout: 0.025
  }));

  // Output layer
  model.add(tf.layers.dense({
    units: 1
  }));

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });

  return model;
}

/**
 * Train LSTM Model
 * @param {tf.Sequential} model - The LSTM model
 * @param {Array} X - Input sequences
 * @param {Array} y - Target values
 * @param {Function} onEpochEnd - Callback for epoch progress
 * @param {number} epochs - Number of training epochs (default: 100)
 * @param {number} validationSplit - Validation split ratio (default: 0.2)
 */
export async function trainLSTMModel(model, X, y, onEpochEnd, epochs = 100, validationSplit = 0.2) {
  // Convert to tensors
  const xs = tf.tensor3d(X);
  const ys = tf.tensor2d(y, [y.length, 1]);

  // Determine batch size
  const batchSize = Math.min(32, X.length);

  // Train model
  const history = await model.fit(xs, ys, {
    epochs,
    batchSize,
    validationSplit,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (onEpochEnd && epoch % 20 === 0) {
          onEpochEnd(epoch, logs);
        }
      }
    }
  });

  // Cleanup tensors
  xs.dispose();
  ys.dispose();

  return history;
}

/**
 * Make predictions using LSTM model
 */
export async function predictLSTM(model, X) {
  const xs = tf.tensor3d(X);
  const predictions = model.predict(xs);
  const result = await predictions.array();

  xs.dispose();
  predictions.dispose();

  return result.map(r => r[0]);
}

/**
 * Save LSTM model to IndexedDB
 */
export async function saveLSTMModel(model, metadata) {
  await model.save('indexeddb://emigrants-lstm-model');
  localStorage.setItem('lstm-metadata', JSON.stringify(metadata));
}

/**
 * Load LSTM model from IndexedDB
 */
export async function loadLSTMModel() {
  try {
    const model = await tf.loadLayersModel('indexeddb://emigrants-lstm-model');
    const metadata = JSON.parse(localStorage.getItem('lstm-metadata'));
    return { model, metadata };
  } catch (error) {
    console.error('Error loading LSTM model:', error);
    return null;
  }
}

/**
 * Delete LSTM model from IndexedDB
 */
export async function deleteLSTMModel() {
  try {
    await tf.io.removeModel('indexeddb://emigrants-lstm-model');
    localStorage.removeItem('lstm-metadata');
    return true;
  } catch (error) {
    console.error('Error deleting LSTM model:', error);
    return false;
  }
}

/**
 * Download LSTM model as single JSON file with embedded weights
 */
export async function downloadLSTMModel(model, metadata) {
  try {
    // Get model artifacts with save handler
    const modelArtifacts = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      return artifacts;
    }));
    
    // Convert weightData ArrayBuffer to base64 string
    const weightDataArray = new Uint8Array(modelArtifacts.weightData);
    let weightDataBase64 = '';
    for (let i = 0; i < weightDataArray.length; i++) {
      weightDataBase64 += String.fromCharCode(weightDataArray[i]);
    }
    weightDataBase64 = btoa(weightDataBase64);
    
    // Create complete download object
    const downloadData = {
      modelType: 'LSTM',
      version: '1.0',
      timestamp: new Date().toISOString(),
      modelTopology: modelArtifacts.modelTopology,
      weightSpecs: modelArtifacts.weightSpecs,
      weightData: weightDataBase64, // Base64 encoded weights
      metadata: metadata
    };
    
    // Create and trigger download
    const dataStr = JSON.stringify(downloadData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const fileName = `lstm_model_${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
  } catch (error) {
    console.error('Error downloading LSTM model:', error);
    throw error;
  }
}

/**
 * Upload LSTM model from single JSON file
 */
export async function uploadLSTMModelFromFile(file) {
  try {
    // Read file
    const text = await file.text();
    const uploadData = JSON.parse(text);
    
    // Validate file
    if (uploadData.modelType !== 'LSTM') {
      throw new Error('❌ This is not a valid LSTM model file');
    }
    
    if (!uploadData.modelTopology || !uploadData.weightData || !uploadData.weightSpecs) {
      throw new Error('❌ Invalid model file structure');
    }
    
    // Convert base64 weightData back to ArrayBuffer
    const binaryString = atob(uploadData.weightData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Reconstruct model artifacts
    const modelArtifacts = {
      modelTopology: uploadData.modelTopology,
      weightSpecs: uploadData.weightSpecs,
      weightData: bytes.buffer
    };
    
    // Load model from memory
    const model = await tf.loadLayersModel(tf.io.fromMemory(
      modelArtifacts.modelTopology,
      new Uint8Array(modelArtifacts.weightData)
    ));
    
    // Save to IndexedDB for persistence
    await saveLSTMModel(model, uploadData.metadata || {});
    
    return { 
      model, 
      metadata: uploadData.metadata || {},
      modelId: `uploaded_${Date.now()}`
    };
  } catch (error) {
    console.error('Error uploading LSTM model:', error);
    throw error;
  }
}

/**
 * Get best LSTM model ID from localStorage
 */
export function getBestLSTMModelId() {
  const bestModelInfo = JSON.parse(localStorage.getItem('LSTM_best_model') || '{}');
  return bestModelInfo.modelId || null;
}

/**
 * Get all saved LSTM models with their metrics
 */
export function getAllLSTMModels() {
  const models = [];
  
  // Check IndexedDB for saved models
  // This is a simplified version - in reality you'd need to query IndexedDB
  // For now, we'll use localStorage metadata
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('lstm_') && key.endsWith('_metadata')) {
      try {
        const modelId = key.replace('lstm_', '').replace('_metadata', '');
        const metadata = JSON.parse(localStorage.getItem(key));
        
        models.push({
          modelId: modelId,
          accuracy: parseFloat(metadata.metrics?.accuracy || 0),
          trainedAt: metadata.trainedAt,
          metrics: metadata.metrics
        });
      } catch (e) {
        console.warn('Error parsing model data:', e);
      }
    }
  }
  
  return models.sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Load specific LSTM model by ID
 */
export async function loadLSTMModelById(modelId) {
  try {
    // Try to load from IndexedDB with specific ID
    const model = await tf.loadLayersModel(`indexeddb://lstm-model-${modelId}`);
    
    // Load metadata
    const metadata = JSON.parse(localStorage.getItem(`lstm_${modelId}_metadata`));
    
    if (!model || !metadata) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    return { model, metadata };
  } catch (error) {
    console.error(`Error loading LSTM model ${modelId}:`, error);
    return null;
  }
}
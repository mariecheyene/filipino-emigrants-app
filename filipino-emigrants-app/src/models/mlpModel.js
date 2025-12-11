import * as tf from '@tensorflow/tfjs';

/**
 * Build MLP (Multi-Layer Perceptron) Model for Time Series Forecasting
 * Architecture:
 * - Input: Flattened sequence [lookback * features]
 * - Dense Layer 1: 64 units, ReLU activation, dropout 0.2
 * - Dense Layer 2: 32 units, ReLU activation, dropout 0.2
 * - Dense Output: 1 unit (emigrants prediction)
 * - Loss: MSE (Mean Squared Error)
 * - Optimizer: Adam (lr=0.001)
 * - Metrics: MAE (Mean Absolute Error)
 */
export function buildMLPModel(lookback = 4, features = 2) {
  const model = tf.sequential();

  const inputSize = lookback * features;

  // First Dense layer
  model.add(tf.layers.dense({
    units: 128,
    activation: 'elu',
    inputShape: [inputSize]
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Second Dense layer
  model.add(tf.layers.dense({
    units: 128,
    activation: 'tanh'
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

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
 * Flatten sequences for MLP input
 * MLP expects 2D input: [samples, features]
 * We flatten the 3D sequences to 2D
 */
function flattenSequences(X) {
  return X.map(seq => seq.flat());
}

/**
 * Train MLP Model
 * @param {tf.Sequential} model - The MLP model
 * @param {Array} X - Input sequences (will be flattened)
 * @param {Array} y - Target values
 * @param {Function} onEpochEnd - Callback for epoch progress
 * @param {number} epochs - Number of training epochs (default: 100)
 * @param {number} validationSplit - Validation split ratio (default: 0.2)
 */
export async function trainMLPModel(model, X, y, onEpochEnd, epochs = 100, validationSplit = 0.2) {
  // Flatten sequences for MLP
  const flatX = flattenSequences(X);

  // Convert to tensors
  const xs = tf.tensor2d(flatX);
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
 * Make predictions using MLP model
 */
export async function predictMLP(model, X) {
  const flatX = flattenSequences(X);
  const xs = tf.tensor2d(flatX);
  const predictions = model.predict(xs);
  const result = await predictions.array();

  xs.dispose();
  predictions.dispose();

  return result.map(r => r[0]);
}

/**
 * Save MLP model to IndexedDB
 */
export async function saveMLPModel(model, metadata) {
  await model.save('indexeddb://emigrants-mlp-model');
  localStorage.setItem('mlp-metadata', JSON.stringify(metadata));
}

/**
 * Load MLP model from IndexedDB
 */
export async function loadMLPModel() {
  try {
    const model = await tf.loadLayersModel('indexeddb://emigrants-mlp-model');
    const metadata = JSON.parse(localStorage.getItem('mlp-metadata'));
    return { model, metadata };
  } catch (error) {
    console.error('Error loading MLP model:', error);
    return null;
  }
}

/**
 * Delete MLP model from IndexedDB
 */
export async function deleteMLPModel() {
  try {
    await tf.io.removeModel('indexeddb://emigrants-mlp-model');
    localStorage.removeItem('mlp-metadata');
    return true;
  } catch (error) {
    console.error('Error deleting MLP model:', error);
    return false;
  }
}

/**
 * Download MLP model as single JSON file with embedded weights
 */
export async function downloadMLPModel(model, metadata) {
  try {
    // Get model artifacts
    const modelArtifacts = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      return artifacts;
    }));
    
    // Convert weightData to base64
    const weightDataArray = new Uint8Array(modelArtifacts.weightData);
    let weightDataBase64 = '';
    for (let i = 0; i < weightDataArray.length; i++) {
      weightDataBase64 += String.fromCharCode(weightDataArray[i]);
    }
    weightDataBase64 = btoa(weightDataBase64);
    
    // Create complete download object
    const downloadData = {
      modelType: 'MLP',
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
    
    const fileName = `mlp_model_${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
  } catch (error) {
    console.error('Error downloading MLP model:', error);
    throw error;
  }
}

/**
 * Upload MLP model from single JSON file
 */
export async function uploadMLPModelFromFile(file) {
  try {
    // Read file
    const text = await file.text();
    const uploadData = JSON.parse(text);
    
    // Validate file
    if (uploadData.modelType !== 'MLP') {
      throw new Error('❌ This is not a valid MLP model file');
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
    await saveMLPModel(model, uploadData.metadata || {});
    
    return { 
      model, 
      metadata: uploadData.metadata || {},
      modelId: `uploaded_${Date.now()}`
    };
  } catch (error) {
    console.error('Error uploading MLP model:', error);
    throw error;
  }
}

export function getBestMLPModelId() {
  const bestModelInfo = JSON.parse(localStorage.getItem('MLP_best_model') || '{}');
  return bestModelInfo.modelId || null;
}

export function getAllMLPModels() {
  const models = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('mlp_') && key.endsWith('_metadata')) {
      try {
        const modelId = key.replace('mlp_', '').replace('_metadata', '');
        const metadata = JSON.parse(localStorage.getItem(key));
        
        models.push({
          modelId: modelId,
          accuracy: parseFloat(metadata.metrics?.accuracy || 0),
          trainedAt: metadata.trainedAt,
          metrics: metadata.metrics
        });
      } catch (e) {
        console.warn('Error parsing MLP model data:', e);
      }
    }
  }
  
  return models.sort((a, b) => b.accuracy - a.accuracy);
}

export async function loadMLPModelById(modelId) {
  try {
    const model = await tf.loadLayersModel(`indexeddb://mlp-model-${modelId}`);
    const metadata = JSON.parse(localStorage.getItem(`mlp_${modelId}_metadata`));
    
    if (!model || !metadata) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    return { model, metadata };
  } catch (error) {
    console.error(`Error loading MLP model ${modelId}:`, error);
    return null;
  }
}
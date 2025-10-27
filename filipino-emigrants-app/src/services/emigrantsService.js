// src/services/emigrantsService.js
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, addDoc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';

// Enhanced Cache with quota protection
let dataCache = {
  civilStatus: null,
  sexData: null,
  ageData: null,
  educationData: null,
  occupationData: null,
  placeOfOrigin: null,
  placeOfOriginProvince: null,
  allCountries: null,
  majorCountries: null,
  lastFetch: null
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache
let readCount = 0;
const MAX_READS_PER_SESSION = 20;
let sessionStart = Date.now();
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour session

// Reset read count after session duration
const resetSessionIfNeeded = () => {
  if (Date.now() - sessionStart > SESSION_DURATION) {
    readCount = 0;
    sessionStart = Date.now();
    console.log('🔄 Session reset - read count cleared');
  }
};

// Enhanced quota check
export const checkReadQuota = () => {
  resetSessionIfNeeded();
  
  if (readCount >= MAX_READS_PER_SESSION) {
    console.warn('🚨 Read quota exceeded:', readCount);
    throw new Error(`Read quota exceeded (${readCount}/${MAX_READS_PER_SESSION}). Please refresh the page.`);
  }
  
  readCount++;
  console.log(`📊 Read count: ${readCount}/${MAX_READS_PER_SESSION}`);
  return true;
};

// Get current read stats
export const getReadStats = () => ({
  current: readCount,
  max: MAX_READS_PER_SESSION,
  remaining: MAX_READS_PER_SESSION - readCount
});

// Check if cache is valid
const isCacheValid = () => {
  return dataCache.lastFetch && (Date.now() - dataCache.lastFetch < CACHE_DURATION);
};

// Get all documents from a collection WITH CACHING
export const getDocuments = async (collectionName) => {
  // Return cached data if valid
  if (isCacheValid() && dataCache[collectionName]) {
    console.log(`📦 Using cached data for ${collectionName}`);
    return dataCache[collectionName];
  }

  try {
    checkReadQuota(); // Check quota before fetching
    
    console.log(`🔄 Fetching ${collectionName} from Firebase...`);
    const snapshot = await getDocs(collection(db, collectionName));
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter out the dummy creation documents
    const validDocuments = documents.filter(item => !item.created);
    
    // Update cache
    dataCache[collectionName] = validDocuments;
    dataCache.lastFetch = Date.now();
    
    console.log(`✅ ${collectionName}: ${validDocuments.length} documents loaded`);
    return validDocuments;
  } catch (error) {
    if (error.message.includes('quota exceeded')) {
      throw error;
    }
    console.error(`❌ Error getting ${collectionName}:`, error);
    return [];
  }
};

// Get all data with SINGLE optimized fetch
export const getAllData = async () => {
  // Return cached data if valid
  if (isCacheValid() && dataCache.civilStatus !== null) {
    console.log('📦 Using cached all data');
    return {
      civilStatus: dataCache.civilStatus || [],
      sexData: dataCache.sexData || [],
      ageData: dataCache.ageData || [],
      educationData: dataCache.educationData || [],
      occupationData: dataCache.occupationData || [],
      placeOfOrigin: dataCache.placeOfOrigin || [],
      placeOfOriginProvince: dataCache.placeOfOriginProvince || [],
      allCountries: dataCache.allCountries || [],
      majorCountries: dataCache.majorCountries || []
    };
  }

  try {
    checkReadQuota(); // Check quota before fetching
    
    console.log('🚀 Fetching all data from Firebase (optimized)...');
    
    const collections = [
      'civilStatus', 'sexData', 'ageData', 'educationData', 'occupationData',
      'placeOfOrigin', 'placeOfOriginProvince', 'allCountries', 'majorCountries'
    ];
    
    const allData = {};
    
    // Fetch all collections in parallel - this counts as ONE read operation
    const promises = collections.map(async (collName) => {
      const snapshot = await getDocs(collection(db, collName));
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter out dummy documents
      const validDocuments = documents.filter(item => !item.created);
      allData[collName] = validDocuments;
      dataCache[collName] = validDocuments; // Update cache
    });

    await Promise.all(promises);
    dataCache.lastFetch = Date.now();

    console.log('🎉 All data loaded successfully with single fetch');
    return allData;
    
  } catch (error) {
    if (error.message.includes('quota exceeded')) {
      throw error;
    }
    console.error('❌ Error in getAllData:', error);
    return {
      civilStatus: [],
      sexData: [],
      ageData: [],
      educationData: [],
      occupationData: [],
      placeOfOrigin: [],
      placeOfOriginProvince: [],
      allCountries: [],
      majorCountries: []
    };
  }
};

// Clear cache (useful when adding new data)
export const clearCache = () => {
  dataCache = {
    civilStatus: null,
    sexData: null,
    ageData: null,
    educationData: null,
    occupationData: null,
    placeOfOrigin: null,
    placeOfOriginProvince: null,
    allCountries: null,
    majorCountries: null,
    lastFetch: null
  };
  console.log('🧹 Cache cleared');
};

// Force reset session (for testing or manual reset)
export const resetSession = () => {
  readCount = 0;
  sessionStart = Date.now();
  clearCache();
  console.log('🔄 Session completely reset');
};

// Get collection statistics (uses cache - no additional reads)
export const getCollectionStats = async () => {
  const data = await getAllData(); // Uses cache
  const stats = {};
  
  Object.keys(data).forEach(key => {
    stats[key] = data[key].length;
  });
  
  return stats;
};

// COMPATIBLE CSV IMPORT - Uses proper field mapping
export const importCSVData = async (jsonData, dataType) => {
  try {
    console.log(`📤 Importing ${dataType}:`, jsonData.length, 'records');
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data provided for import');
    }

    // Clear cache when importing new data
    clearCache();

    // MAP dataType to actual Firestore collection names
    const collectionMap = {
      'civilStatus': 'civilStatus',
      'sexData': 'sexData', 
      'ageData': 'ageData',
      'educationData': 'educationData',
      'occupationData': 'occupationData',
      'placeOfOrigin': 'placeOfOrigin',
      'placeOfOriginProvince': 'placeOfOriginProvince',
      'allCountries': 'allCountries',
      'majorCountries': 'majorCountries'
    };

    const collectionName = collectionMap[dataType];
    if (!collectionName) {
      throw new Error(`Unknown data type: ${dataType}`);
    }

    console.log(`🎯 Importing to collection: ${collectionName}`);

    const batch = writeBatch(db);
    const collectionRef = collection(db, collectionName);
    
    // Process data with proper field mapping
    jsonData.forEach((item) => {
      const docRef = doc(collectionRef);
      
      // Clean and map data based on collection type
      const cleanData = cleanCSVData(item, dataType);
      
      // Add import timestamp
      cleanData.importedAt = new Date();
      batch.set(docRef, cleanData);
    });

    await batch.commit();
    console.log(`✅ ${jsonData.length} records imported to ${dataType}`);
    return { success: true, count: jsonData.length, collection: dataType };
    
  } catch (error) {
    console.error(`❌ Error importing ${dataType}:`, error);
    
    // Collection creation logic
    if (error.message.includes('not found') || error.message.includes('does not exist') || error.code === 'not-found') {
      console.log(`🆕 Collection might not exist. Creating it...`);
      try {
        const collectionMap = {
          'civilStatus': 'civilStatus',
          'sexData': 'sexData', 
          'ageData': 'ageData',
          'educationData': 'educationData',
          'occupationData': 'occupationData',
          'placeOfOrigin': 'placeOfOrigin',
          'placeOfOriginProvince': 'placeOfOriginProvince',
          'allCountries': 'allCountries',
          'majorCountries': 'majorCountries'
        };
        
        const collectionName = collectionMap[dataType] || dataType;
        const docRef = doc(collection(db, collectionName));
        await setDoc(docRef, { 
          created: true, 
          createdAt: new Date(),
          note: 'Collection created automatically during CSV import'
        });
        console.log(`✅ Created collection ${collectionName}`);
        
        // Retry the import
        return await importCSVData(jsonData, dataType);
      } catch (createError) {
        console.error(`❌ Failed to create collection:`, createError);
        throw new Error(`Failed to create collection. Please check Firebase permissions.`);
      }
    }
    
    throw error;
  }
};

// Clean CSV data based on collection type
const cleanCSVData = (item, dataType) => {
  const cleanData = {};
  
  switch(dataType) {
    case 'civilStatus':
      cleanData.year = parseInt(item.year) || new Date().getFullYear();
      cleanData.single = parseInt(item.single) || 0;
      cleanData.married = parseInt(item.married) || 0;
      cleanData.widowed = parseInt(item.widowed) || 0;
      cleanData.divorced = parseInt(item.divorced) || 0;
      cleanData.notReported = parseInt(item.notReported) || 0;
      break;
      
    case 'sexData':
      cleanData.year = parseInt(item.year) || new Date().getFullYear();
      cleanData.male = parseInt(item.male) || 0;
      cleanData.female = parseInt(item.female) || 0;
      break;
      
    case 'ageData':
      cleanData.year = parseInt(item.year) || new Date().getFullYear();
      cleanData.ageGroup = item.ageGroup || 'Unknown';
      cleanData.count = parseInt(item.count) || 0;
      break;
      
    case 'educationData':
      cleanData.year = parseInt(item.year) || new Date().getFullYear();
      cleanData.educationLevel = item.educationLevel || 'Unknown';
      cleanData.count = parseInt(item.count) || 0;
      break;
      
    case 'occupationData':
      cleanData.year = parseInt(item.year) || new Date().getFullYear();
      cleanData.occupation = item.occupation || 'Unknown';
      cleanData.count = parseInt(item.count) || 0;
      break;
      
    case 'placeOfOrigin':
      cleanData.year = parseInt(item.year) || new Date().getFullYear();
      cleanData.region = item.region || 'Unknown';
      cleanData.count = parseInt(item.count) || 0;
      break;
      
    case 'placeOfOriginProvince':
      cleanData.year = parseInt(item.year) || new Date().getFullYear();
      cleanData.province = item.province || 'Unknown';
      cleanData.count = parseInt(item.count) || 0;
      break;
      
    case 'allCountries':
    case 'majorCountries':
      cleanData.year = parseInt(item.year) || new Date().getFullYear();
      cleanData.country = item.country || 'Unknown';
      cleanData.count = parseInt(item.count) || 0;
      break;
      
    default:
      // Generic cleaning for unknown types
      Object.keys(item).forEach(key => {
        const value = item[key];
        if (typeof value === 'string' && value.trim() !== '' && !isNaN(value)) {
          cleanData[key] = Number(value);
        } else {
          cleanData[key] = value;
        }
      });
  }
  
  return cleanData;
};

// ==================== FULL CRUD OPERATIONS ====================

// CREATE - Add document to any collection
export const addDocument = async (collectionName, documentData) => {
  try {
    console.log(`🔄 Adding to ${collectionName}:`, documentData);
    
    // Clear cache when adding new data
    clearCache();

    const docRef = await addDoc(collection(db, collectionName), {
      ...documentData,
      createdAt: new Date()
    });
    
    console.log(`✅ Document added to ${collectionName} with ID:`, docRef.id);
    return { success: true, id: docRef.id };
    
  } catch (error) {
    console.error(`❌ Error adding to ${collectionName}:`, error);
    throw error;
  }
};

// READ - Get all documents from a specific collection
export const getCollectionData = async (collectionName) => {
  try {
    checkReadQuota();
    
    console.log(`📖 Reading from ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter out dummy creation documents
    const validDocuments = documents.filter(item => !item.created);
    
    console.log(`✅ ${collectionName}: ${validDocuments.length} documents loaded`);
    return validDocuments;
  } catch (error) {
    console.error(`❌ Error reading from ${collectionName}:`, error);
    throw error;
  }
};

// UPDATE - Update document in any collection
export const updateDocument = async (collectionName, documentId, updateData) => {
  try {
    console.log(`🔄 Updating document in ${collectionName}:`, documentId, updateData);
    
    // Clear cache when updating data
    clearCache();

    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date()
    });
    
    console.log(`✅ Document updated in ${collectionName} with ID:`, documentId);
    return { success: true, id: documentId };
    
  } catch (error) {
    console.error(`❌ Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

// DELETE - Delete document from any collection
export const deleteDocument = async (collectionName, documentId) => {
  try {
    console.log(`🗑️ Deleting document from ${collectionName}:`, documentId);
    
    // Clear cache when deleting data
    clearCache();

    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    
    console.log(`✅ Document deleted from ${collectionName} with ID:`, documentId);
    return { success: true, id: documentId };
    
  } catch (error) {
    console.error(`❌ Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// DELETE ALL - Delete all documents from a collection
export const deleteAllDocuments = async (collectionName) => {
  try {
    console.log(`🗑️ Deleting ALL documents from ${collectionName}`);
    
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    
    snapshot.forEach((document) => {
      batch.delete(doc(db, collectionName, document.id));
    });
    
    await batch.commit();
    
    // Clear cache
    clearCache();
    
    console.log(`✅ All documents deleted from ${collectionName}`);
    return { success: true, deleted: snapshot.size };
    
  } catch (error) {
    console.error(`❌ Error deleting all documents from ${collectionName}:`, error);
    throw error;
  }
};

// Safe data access with fallbacks
export const getSafeData = async () => {
  try {
    return await getAllData();
  } catch (error) {
    if (error.message.includes('quota exceeded')) {
      // Return cached data even if expired when quota exceeded
      if (dataCache.civilStatus !== null) {
        console.log('⚠️ Using expired cache due to quota limits');
        return {
          civilStatus: dataCache.civilStatus || [],
          sexData: dataCache.sexData || [],
          ageData: dataCache.ageData || [],
          educationData: dataCache.educationData || [],
          occupationData: dataCache.occupationData || [],
          placeOfOrigin: dataCache.placeOfOrigin || [],
          placeOfOriginProvince: dataCache.placeOfOriginProvince || [],
          allCountries: dataCache.allCountries || [],
          majorCountries: dataCache.majorCountries || []
        };
      }
    }
    throw error;
  }
};

// Individual collection getters (use cache)
export const getCivilStatus = async () => await getDocuments('civilStatus');
export const getSexData = async () => await getDocuments('sexData');
export const getAgeData = async () => await getDocuments('ageData');
export const getEducationData = async () => await getDocuments('educationData');
export const getOccupationData = async () => await getDocuments('occupationData');
export const getPlaceOfOrigin = async () => await getDocuments('placeOfOrigin');
export const getPlaceOfOriginProvince = async () => await getDocuments('placeOfOriginProvince');
export const getAllCountries = async () => await getDocuments('allCountries');
export const getMajorCountries = async () => await getDocuments('majorCountries');

// Collection field definitions for forms
export const getCollectionFields = (collectionName) => {
  const fieldDefinitions = {
    civilStatus: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'single', type: 'number', label: 'Single', required: true, min: 0 },
      { name: 'married', type: 'number', label: 'Married', required: true, min: 0 },
      { name: 'widowed', type: 'number', label: 'Widowed', required: true, min: 0 },
      { name: 'divorced', type: 'number', label: 'Divorced', required: true, min: 0 },
      { name: 'notReported', type: 'number', label: 'Not Reported', required: true, min: 0 }
    ],
    sexData: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'male', type: 'number', label: 'Male Count', required: true, min: 0 },
      { name: 'female', type: 'number', label: 'Female Count', required: true, min: 0 }
    ],
    ageData: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'ageGroup', type: 'select', label: 'Age Group', required: true, 
        options: ['15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60+'] },
      { name: 'count', type: 'number', label: 'Count', required: true, min: 0 }
    ],
    educationData: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'educationLevel', type: 'select', label: 'Education Level', required: true,
        options: ['No Education', 'Elementary', 'High School', 'College', 'Postgraduate', 'Not Reported'] },
      { name: 'count', type: 'number', label: 'Count', required: true, min: 0 }
    ],
    occupationData: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'occupation', type: 'select', label: 'Occupation', required: true,
        options: ['Healthcare Professional', 'Engineer', 'IT Professional', 'Teacher', 'Domestic Worker', 
                 'Seafarer', 'Construction Worker', 'Factory Worker', 'Sales Worker', 'Not Reported'] },
      { name: 'count', type: 'number', label: 'Count', required: true, min: 0 }
    ],
    placeOfOrigin: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'region', type: 'select', label: 'Region', required: true,
        options: ['NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region IV-B', 
                 'Region V', 'Region VI', 'Region VII', 'Region VIII', 'Region IX', 'Region X',
                 'Region XI', 'Region XII', 'CAR', 'BARMM'] },
      { name: 'count', type: 'number', label: 'Count', required: true, min: 0 }
    ],
    placeOfOriginProvince: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'province', type: 'text', label: 'Province', required: true },
      { name: 'count', type: 'number', label: 'Count', required: true, min: 0 }
    ],
    allCountries: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'country', type: 'select', label: 'Country', required: true,
        options: ['United States', 'Saudi Arabia', 'United Arab Emirates', 'Canada', 'Japan', 
                 'United Kingdom', 'Australia', 'Singapore', 'Qatar', 'Kuwait', 'Hong Kong', 
                 'Taiwan', 'Malaysia', 'South Korea', 'Germany', 'Other'] },
      { name: 'count', type: 'number', label: 'Count', required: true, min: 0 }
    ],
    majorCountries: [
      { name: 'year', type: 'number', label: 'Year', required: true, min: 1981, max: 2020 },
      { name: 'country', type: 'select', label: 'Country', required: true,
        options: ['United States', 'Saudi Arabia', 'United Arab Emirates', 'Canada', 'Japan', 
                 'United Kingdom', 'Australia', 'Singapore'] },
      { name: 'count', type: 'number', label: 'Count', required: true, min: 0 }
    ]
  };
  
  return fieldDefinitions[collectionName] || [];
};

// Delete all data function (alias for deleteAllDocuments for compatibility)
export const deleteAllData = async (dataType) => {
  try {
    const collectionMap = {
      'civilStatus': 'civilStatus',
      'sexData': 'sexData', 
      'ageData': 'ageData',
      'educationData': 'educationData',
      'occupationData': 'occupationData',
      'placeOfOrigin': 'placeOfOrigin',
      'placeOfOriginProvince': 'placeOfOriginProvince',
      'allCountries': 'allCountries',
      'majorCountries': 'majorCountries'
    };

    const collectionName = collectionMap[dataType] || dataType;
    
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    
    snapshot.forEach((document) => {
      batch.delete(doc(db, collectionName, document.id));
    });
    
    await batch.commit();
    console.log(`✅ Deleted all data from: ${collectionName}`);
    return { success: true, deleted: snapshot.size };
    
  } catch (error) {
    console.error(`Error deleting ${dataType} data:`, error);
    throw error;
  }
};

// Clear collection utility
export const clearCollection = async (collectionName) => {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    
    snapshot.forEach((document) => {
      batch.delete(doc(db, collectionName, document.id));
    });
    
    await batch.commit();
    console.log(`✅ Cleared collection: ${collectionName}`);
    return { success: true, cleared: snapshot.size };
  } catch (error) {
    console.error(`❌ Error clearing collection ${collectionName}:`, error);
    throw error;
  }
};
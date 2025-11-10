import React, { useState, useEffect } from 'react';
import { 
  FiUpload, FiDownload, FiFileText, FiAlertCircle, 
  FiDatabase, FiPlus, FiSave, FiTrash2
} from 'react-icons/fi';
import { 
  importCSVData, 
  addDocument, 
  deleteAllData
} from '../services/emigrantsService';

const CsvUploadPage = ({ 
  dataStats, 
  dataTypes,
  setUploadStatus 
}) => {
  const [selectedCollection, setSelectedCollection] = useState('civilStatus');
  const [manualEntry, setManualEntry] = useState({});
  const [loading, setLoading] = useState(false);

  // Enhanced data types with proper collection names
  const enhancedDataTypes = [
    { value: 'civilStatus', label: 'Civil Status', icon: <FiFileText /> },
    { value: 'sexData', label: 'Sex Data', icon: <FiFileText /> },
    { value: 'ageData', label: 'Age Data', icon: <FiFileText /> },
    { value: 'educationData', label: 'Education Data', icon: <FiFileText /> },
    { value: 'occupationData', label: 'Occupation Data', icon: <FiFileText /> },
    { value: 'placeOfOrigin', label: 'Place of Origin (Region)', icon: <FiFileText /> },
    { value: 'placeOfOriginProvince', label: 'Place of Origin (Province)', icon: <FiFileText /> },
    { value: 'allCountries', label: 'All Countries', icon: <FiFileText /> },
    { value: 'majorCountries', label: 'Major Countries', icon: <FiFileText /> }
  ];

  // Initialize manual entry form when collection changes
  useEffect(() => {
    const fields = getCollectionFields(selectedCollection);
    const initialData = {};
    fields.forEach(field => {
      initialData[field.name] = field.type === 'number' ? 0 : '';
    });
    if (fields.find(f => f.name === 'year')) {
      initialData.year = new Date().getFullYear();
    }
    setManualEntry(initialData);
  }, [selectedCollection]);

  // Field templates based on your actual data structure
  const getCollectionFields = (collection) => {
    const fieldTemplates = {
      civilStatus: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'single', label: 'Single', type: 'number', required: true },
        { name: 'married', label: 'Married', type: 'number', required: true },
        { name: 'widower', label: 'Widower', type: 'number', required: true },
        { name: 'separated', label: 'Separated', type: 'number', required: true },
        { name: 'divorced', label: 'Divorced', type: 'number', required: true },
        { name: 'notReported', label: 'Not Reported', type: 'number', required: true }
      ],
      sexData: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'male', label: 'Male', type: 'number', required: true },
        { name: 'female', label: 'Female', type: 'number', required: true }
      ],
      ageData: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'ageGroup', label: 'Age Group', type: 'text', required: true },
        { name: 'count', label: 'Count', type: 'number', required: true }
      ],
      educationData: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'educationAttainment', label: 'Education Attainment', type: 'text', required: true },
        { name: 'count', label: 'Count', type: 'number', required: true }
      ],
      occupationData: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'occupation', label: 'Occupation', type: 'text', required: true },
        { name: 'count', label: 'Count', type: 'number', required: true }
      ],
      placeOfOrigin: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'region', label: 'Region', type: 'text', required: true },
        { name: 'count', label: 'Count', type: 'number', required: true }
      ],
      placeOfOriginProvince: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'province', label: 'Province', type: 'text', required: true },
        { name: 'count', label: 'Count', type: 'number', required: true }
      ],
      allCountries: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'country', label: 'Country', type: 'text', required: true },
        { name: 'count', label: 'Count', type: 'number', required: true }
      ],
      majorCountries: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1981, max: 2020 },
        { name: 'country', label: 'Country', type: 'text', required: true },
        { name: 'count', label: 'Count', type: 'number', required: true }
      ]
    };
    return fieldTemplates[collection] || [];
  };

  // FIXED CSV PARSER - Handles all formats
  const transformCSVData = (text, dataType) => {
    console.log('=== TRANSFORMING CSV FOR:', dataType);
    
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('Headers:', headers);

    const transformedData = [];
    
    // SPECIAL CASE 1: sexData has YEAR, MALE, FEMALE columns
    if (dataType === 'sexData') {
      if (headers[0] === 'YEAR' && headers.includes('MALE') && headers.includes('FEMALE')) {
        console.log('Processing sexData format...');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length >= 3) {
            const year = values[0];
            const male = values[1];
            const female = values[2];
            
            if (year && !isNaN(year) && male !== '' && !isNaN(male) && female !== '' && !isNaN(female)) {
              transformedData.push({
                year: Number(year),
                male: Number(male),
                female: Number(female)
              });
            }
          }
        }
      }
    }
    // SPECIAL CASE 2: civilStatus has YEAR and status columns
    else if (dataType === 'civilStatus') {
      // Check if it's the simple format (YEAR and status columns)
      if (headers[0] === 'YEAR') {
        console.log('Processing civilStatus simple format...');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const year = values[0];
          
          if (year && !isNaN(year)) {
            const record = { year: Number(year) };
            
            // Add each status column - convert header names to lowercase
            for (let j = 1; j < headers.length && j < values.length; j++) {
              let status = headers[j].toLowerCase();
              
              // Handle special cases for field name mapping
              if (status === 'not reported') {
                status = 'notReported';
              }
              // Add other field name mappings if needed
              
              const count = values[j];
              
              if (count !== '' && !isNaN(count)) {
                record[status] = Number(count);
              }
            }
            
            // Only add if we have at least one status field with data
            if (Object.keys(record).length > 1) {
              transformedData.push(record);
            }
          }
        }
      }
    }
    // SPECIAL CASE 3: Major Countries has YEAR as first column and countries as other columns
    else if (dataType === 'majorCountries') {
      if (headers[0] === 'YEAR') {
        console.log('Processing majorCountries format...');
        
        const countryColumns = headers.slice(1);
        console.log('Country columns:', countryColumns);
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const year = values[0];
          
          for (let j = 1; j < countryColumns.length && j < values.length; j++) {
            const country = countryColumns[j];
            const count = values[j];
            
            if (year && !isNaN(year) && country && count !== '' && !isNaN(count)) {
              transformedData.push({
                year: Number(year),
                country: country,
                count: Number(count)
              });
            }
          }
        }
      }
    } 
    // For all other data types (ageData, educationData, occupationData, allCountries, placeOfOrigin, etc.)
    else {
      console.log('Processing matrix format...');
      
      // Determine the category field name based on dataType
      const categoryField = dataType === 'ageData' ? 'ageGroup' : 
                          dataType === 'educationData' ? 'educationAttainment' :
                          dataType === 'occupationData' ? 'occupation' :
                          dataType === 'placeOfOrigin' ? 'region' :
                          dataType === 'placeOfOriginProvince' ? 'province' :
                          'country';

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const category = values[0];
        
        for (let j = 1; j < headers.length && j < values.length; j++) {
          const year = headers[j];
          const count = values[j];
          
          if (year && !isNaN(year) && category && count !== '' && !isNaN(count)) {
            transformedData.push({
              year: Number(year),
              [categoryField]: category,
              count: Number(count)
            });
          }
        }
      }
    }
    
    console.log(`Transformed ${transformedData.length} records for ${dataType}`, transformedData.slice(0, 3));
    return transformedData;
  };

  const handleFileUpload = async (event, dataType) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadStatus(`📤 Uploading ${dataType} data...`);

    try {
      const text = await file.text();
      console.log('=== RAW CSV TEXT ===');
      console.log(text.substring(0, 500) + '...');
      
      const jsonData = transformCSVData(text, dataType);

      if (jsonData.length === 0) {
        throw new Error('No valid data found in CSV file after transformation');
      }

      console.log(`📊 FINAL DATA TO UPLOAD:`, jsonData.slice(0, 3));

      // Import to Firebase
      await importCSVData(jsonData, dataType);
      setUploadStatus(`✅ ${jsonData.length} records uploaded to ${dataType}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleDeleteAllData = async (dataType) => {
    if (!window.confirm(`Are you sure you want to delete ALL data from ${dataType}? This action cannot be undone!`)) {
      return;
    }

    setLoading(true);
    setUploadStatus(`🗑️ Deleting all ${dataType} data...`);

    try {
      const result = await deleteAllData(dataType);
      setUploadStatus(`✅ ${result.deleted} records deleted from ${dataType}`);
    } catch (error) {
      setUploadStatus(`❌ Delete failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Add document to Firebase
      await addDocument(selectedCollection, manualEntry);
      setUploadStatus(`✅ Record added to ${selectedCollection}`);
      
      // Reset form
      const fields = getCollectionFields(selectedCollection);
      const resetData = {};
      fields.forEach(field => {
        resetData[field.name] = field.type === 'number' ? 0 : '';
      });
      if (fields.find(f => f.name === 'year')) {
        resetData.year = new Date().getFullYear();
      }
      setManualEntry(resetData);
    } catch (error) {
      setUploadStatus(`❌ Error adding record: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const DataStatusBadge = ({ count, label }) => (
    <div className={`data-status-badge ${count > 0 ? 'has-data' : 'no-data'}`}>
      <div className="status-indicator"></div>
      <span className="status-label">{label}</span>
      <span className="status-count">{count} records</span>
    </div>
  );

  return (
    <div className="data-page">
      <div className="page-header">
        <h2><FiUpload /> CSV Upload / Data Management</h2>
        <p>Upload CSV files and manage database records</p>
      </div>

      <div className="data-status-indicator">
        <div className="status-header">
          <FiDatabase />
          <span>Firebase Connection Status</span>
          <span style={{ color: '#10B981', marginLeft: 'auto' }}>✅ Connected</span>
        </div>
        <div className="status-grid">
          {enhancedDataTypes.map(dataType => (
            <DataStatusBadge
              key={dataType.value}
              count={dataStats[dataType.value] || 0}
              label={dataType.label}
            />
          ))}
        </div>
      </div>

      <div className="management-sections">
        {/* CSV Upload Section */}
        <div className="management-section">
          <h3><FiDownload /> CSV Upload Interface</h3>
          <p>Upload CSV files to update Firebase collections</p>
          
          <div className="upload-grid">
            {enhancedDataTypes.map((dataType) => (
              <div key={dataType.value} className="upload-card">
                <div className="upload-card-header">
                  <div className="upload-icon">{dataType.icon}</div>
                  <h4>{dataType.label}</h4>
                  <span className={`data-badge ${(dataStats[dataType.value] || 0) > 0 ? 'has-data' : 'no-data'}`}>
                    {dataStats[dataType.value] || 0} records
                  </span>
                </div>
                <div className="upload-card-actions">
                  <label className="file-input-label primary">
                    <FiUpload />
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, dataType.value)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button 
                    className="text-btn delete"
                    onClick={() => handleDeleteAllData(dataType.value)}
                    disabled={loading}
                  >
                    <FiTrash2 />
                    Delete Records
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Data Entry Section */}
        <div className="management-section">
          <h3><FiPlus /> Manual Data Entry</h3>
          <p>Add individual records to the database</p>
          
          <div className="collection-selector">
            <label>Select Collection:</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              {enhancedDataTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleManualEntry} className="modal-form">
            <div className="form-grid">
              {getCollectionFields(selectedCollection).map(field => (
                <div key={field.name} className="form-group">
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={manualEntry[field.name] || ''}
                    onChange={(e) => setManualEntry({
                      ...manualEntry,
                      [field.name]: field.type === 'number' 
                        ? parseInt(e.target.value) || 0 
                        : e.target.value
                    })}
                    min={field.min}
                    max={field.max}
                    required={field.required}
                  />
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={loading}
              >
                <FiSave />
                {loading ? 'Adding...' : 'Add Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CsvUploadPage;
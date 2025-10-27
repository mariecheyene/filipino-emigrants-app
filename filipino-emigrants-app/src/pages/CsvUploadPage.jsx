import React, { useState, useEffect } from 'react';
import { 
  FiUpload, FiDownload, FiFileText, FiAlertCircle, 
  FiDatabase, FiPlus, FiSave, FiEye, FiTrash2, 
  FiEdit, FiX, FiSearch 
} from 'react-icons/fi';
import { 
  importCSVData, 
  addDocument, 
  deleteAllData,
  getCollectionData 
} from '../services/emigrantsService';

const CsvUploadPage = ({ 
  dataStats, 
  dataTypes,
  setUploadStatus 
}) => {
  const [selectedCollection, setSelectedCollection] = useState('civilStatus');
  const [manualEntry, setManualEntry] = useState({});
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  // Mock function - replace with actual implementation
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
        { name: 'educationLevel', label: 'Education Level', type: 'text', required: true },
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
      ]
    };
    return fieldTemplates[collection] || [];
  };

  const DataStatusBadge = ({ count, label }) => (
    <div className={`data-status-badge ${count > 0 ? 'has-data' : 'no-data'}`}>
      <div className="status-indicator"></div>
      <span className="status-label">{label}</span>
      <span className="status-count">{count} records</span>
    </div>
  );

  const handleFileUpload = async (event, dataType) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadStatus(`📤 Uploading ${dataType} data...`);

    try {
      // Read CSV file
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Convert to JSON
      const jsonData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });
        return item;
      }).filter(item => Object.values(item).some(val => val !== ''));

      // Import to Firebase
      await importCSVData(jsonData, dataType);
      setUploadStatus(`✅ ${jsonData.length} records uploaded to ${dataType}`);
      
    } catch (error) {
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

  const handleViewExistingData = async () => {
    setLoading(true);
    try {
      const allData = await getCollectionData(selectedCollection);
      // Filter by selected year
      const filteredData = allData.filter(item => item.year == selectedYear);
      setViewData(filteredData);
      setShowViewModal(true);
    } catch (error) {
      setUploadStatus(`❌ Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const ViewDataModal = () => {
    if (!showViewModal) return null;

    const fields = getCollectionFields(selectedCollection);
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>
              <FiEye />
              View Data - {dataTypes.find(d => d.value === selectedCollection)?.label}
            </h3>
            <button className="close-btn" onClick={() => setShowViewModal(false)}>
              <FiX />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="filter-section">
              <label>Filter by Year:</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {Array.from({length: 40}, (_, i) => 1981 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button 
                className="primary-btn"
                onClick={handleViewExistingData}
                disabled={loading}
              >
                <FiSearch />
                {loading ? 'Loading...' : 'Apply Filter'}
              </button>
            </div>

            <div className="data-table-container">
              {viewData.length === 0 ? (
                <div className="no-data">
                  <FiAlertCircle />
                  <p>No records found for {selectedYear}</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      {fields.map(field => (
                        <th key={field.name}>{field.label}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewData.map((item, index) => (
                      <tr key={item.id || index}>
                        {fields.map(field => (
                          <td key={field.name}>
                            {item[field.name]}
                          </td>
                        ))}
                        <td className="actions">
                          <button className="edit-btn">
                            <FiEdit />
                          </button>
                          <button className="delete-btn">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="secondary-btn"
              onClick={() => setShowViewModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

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
          {dataTypes.map(dataType => (
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
            {dataTypes.map((dataType) => (
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
              {dataTypes.map(type => (
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
                  
                  {field.type === 'select' ? (
                    <select
                      value={manualEntry[field.name] || ''}
                      onChange={(e) => setManualEntry({
                        ...manualEntry,
                        [field.name]: e.target.value
                      })}
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
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
                  )}
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
              <button 
                type="button" 
                className="secondary-btn"
                onClick={handleViewExistingData}
                disabled={loading}
              >
                <FiEye />
                View Existing Data
              </button>
            </div>
          </form>
        </div>
      </div>

      <ViewDataModal />
    </div>
  );
};

export default CsvUploadPage;
// src/pages/EmigrantsRecords.jsx
import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiSearch, FiX, FiSave, FiFilter, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { 
  getCollectionData, 
  updateDocument, 
  deleteDocument
} from '../services/emigrantsService';
import '../css/EmigrantsRecords.css';

const EmigrantsRecords = ({ dataStats, setUploadStatus }) => {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' or 'oldest'

  const collections = [
    { value: 'civilStatus', label: 'Civil Status' },
    { value: 'sexData', label: 'Gender Data' },
    { value: 'ageData', label: 'Age Data' },
    { value: 'educationData', label: 'Education Data' },
    { value: 'occupationData', label: 'Occupation Data' },
    { value: 'placeOfOrigin', label: 'Region Data' },
    { value: 'placeOfOriginProvince', label: 'Province Data' },
    { value: 'allCountries', label: 'Countries Data' },
    { value: 'majorCountries', label: 'Major Countries' }
  ];

  // Fields to exclude from display and editing
  const excludedFields = ['id', 'createdAt', 'updatedAt', 'importedAt', 'created'];

  // Load records when collection changes
  useEffect(() => {
    if (selectedCollection) {
      loadRecords();
    }
  }, [selectedCollection]);

  // Sort records when sortOrder changes
  useEffect(() => {
    if (records.length > 0) {
      sortRecords(records, sortOrder);
    }
  }, [sortOrder, records]);

  // Filter records when search term changes
  useEffect(() => {
    if (records.length > 0) {
      filterRecords();
    }
  }, [searchTerm, records]);

  const loadRecords = async () => {
    if (!selectedCollection) return;
    
    setLoading(true);
    try {
      const data = await getCollectionData(selectedCollection);
      setRecords(data);
      sortRecords(data, sortOrder);
      setUploadStatus(`✅ Loaded ${data.length} records from ${selectedCollection}`);
    } catch (error) {
      console.error('Error loading records:', error);
      setUploadStatus('❌ Error loading records');
    } finally {
      setLoading(false);
    }
  };

  const sortRecords = (data, order) => {
    const sortedData = [...data].sort((a, b) => {
      const yearField = findYearField(a);
      if (!yearField) return 0;

      const yearA = parseInt(a[yearField]) || 0;
      const yearB = parseInt(b[yearField]) || 0;

      return order === 'latest' ? yearB - yearA : yearA - yearB;
    });
    setFilteredRecords(sortedData);
  };

  const filterRecords = () => {
    if (!searchTerm.trim()) {
      sortRecords(records, sortOrder);
      return;
    }

    const filtered = records.filter(record => 
      Object.entries(record).some(([key, value]) => 
        !excludedFields.includes(key) && 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    sortRecords(filtered, sortOrder);
  };

  const findYearField = (record) => {
    const yearFields = ['year', 'Year', 'Yearly', 'date'];
    return yearFields.find(field => record.hasOwnProperty(field));
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest');
  };

  const handleEdit = (record) => {
    setEditingRecord(record.id);
    
    // Create a clean copy without excluded fields
    const cleanRecord = { ...record };
    excludedFields.forEach(field => delete cleanRecord[field]);
    
    setEditForm(cleanRecord);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingRecord || !selectedCollection) return;

    setLoading(true);
    try {
      await updateDocument(selectedCollection, editingRecord, editForm);
      setUploadStatus('✅ Record updated successfully');
      setShowEditModal(false);
      setEditingRecord(null);
      setEditForm({});
      loadRecords(); // Refresh the records
    } catch (error) {
      console.error('Error updating record:', error);
      setUploadStatus('❌ Error updating record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    if (!selectedCollection) return;

    setLoading(true);
    try {
      await deleteDocument(selectedCollection, recordId);
      setUploadStatus('✅ Record deleted successfully');
      loadRecords(); // Refresh the records
    } catch (error) {
      console.error('Error deleting record:', error);
      setUploadStatus('❌ Error deleting record');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRecord(null);
    setEditForm({});
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get displayable fields with fixed order
  const getDisplayableFields = () => {
    if (records.length === 0) return [];
    
    const sampleRecord = records[0];
    const allFields = Object.keys(sampleRecord).filter(key => !excludedFields.includes(key));
    return getFixedColumnOrder(allFields);
  };

  const getFixedColumnOrder = (fields) => {
    const fixedOrder = ['year', 'Year', 'Yearly', 'date']; // Year fields first
    const countFields = ['count', 'Count', 'total', 'Total', 'value', 'Value', 'number', 'Number']; // Count fields last
    const otherFields = fields.filter(field => 
      !fixedOrder.includes(field) && !countFields.includes(field) && !excludedFields.includes(field)
    );
    
    // Order: Year fields -> Other fields -> Count fields
    return [
      ...fixedOrder.filter(field => fields.includes(field)),
      ...otherFields,
      ...countFields.filter(field => fields.includes(field))
    ];
  };

  const renderTableHeaders = () => {
    const displayableFields = getDisplayableFields();
    const yearField = displayableFields.find(field => 
      ['year', 'Year', 'Yearly', 'date'].includes(field)
    );
    
    return displayableFields.map(key => (
      <th 
        key={key} 
        className={
          key.toLowerCase() === 'year' ? 'er-table-header er-year-column' : 
          key.toLowerCase() === 'count' ? 'er-table-header er-count-column' : 
          'er-table-header'
        }
      >
        {formatHeaderName(key)}
        {key === yearField && (
          <button 
            className="er-sort-button"
            onClick={toggleSortOrder}
            title={`Sort by ${sortOrder === 'latest' ? 'oldest first' : 'latest first'}`}
          >
            {sortOrder === 'latest' ? <FiArrowDown /> : <FiArrowUp />}
          </button>
        )}
      </th>
    ));
  };

  const renderTableRow = (record) => {
    const displayableFields = getDisplayableFields();
    
    return (
      <tr key={record.id} className="er-table-row">
        {displayableFields.map(key => (
          <td 
            key={key} 
            className={
              key.toLowerCase() === 'year' ? 'er-table-cell-year' : 
              key.toLowerCase() === 'count' ? 'er-table-cell-count' : 
              'er-table-cell'
            }
          >
            {String(record[key] || 'N/A')}
          </td>
        ))}
        <td className="er-action-cell">
          <button 
            onClick={() => handleEdit(record)}
            className="er-btn-edit"
            title="Edit record"
            disabled={loading}
          >
            <FiEdit2 />
          </button>
          <button 
            onClick={() => handleDelete(record.id)}
            className="er-btn-delete"
            title="Delete record"
            disabled={loading}
          >
            <FiTrash2 />
          </button>
        </td>
      </tr>
    );
  };

  const formatHeaderName = (fieldName) => {
    // Convert camelCase to Title Case with spaces
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const renderEditModal = () => {
    if (!showEditModal) return null;

    const displayableFields = getDisplayableFields();

    return (
      <div className="er-modal-overlay">
        <div className="er-modal-content-dark">
          <div className="er-modal-header">
            <h3>Edit Record</h3>
            <button 
              className="er-modal-close-btn"
              onClick={handleCancelEdit}
            >
              <FiX />
            </button>
          </div>
          
          <div className="er-modal-body">
            <div className="er-form-grid">
              {displayableFields.map(field => (
                <div key={field} className="er-form-field">
                  <label>{formatHeaderName(field)}</label>
                  <input
                    type="text"
                    value={editForm[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="er-modal-input"
                    placeholder={`Enter ${formatHeaderName(field)}`}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="er-modal-footer">
            <button 
              onClick={handleCancelEdit}
              className="er-btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="er-btn-save"
              disabled={loading}
            >
              <FiSave />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="er-dark-theme">
      <div className="er-page-header">
        <h2>Emigrant Records Management</h2>
        <p>View and manage all emigrant records across different collections</p>
      </div>

      {/* Control Panel */}
      <div className="er-control-panel">
        <div className="er-control-group">
          <div className="er-form-group-compact">
            <label>Collection:</label>
            <select 
              value={selectedCollection} 
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="er-collection-select"
              disabled={loading}
            >
              <option value="">Choose collection...</option>
              {collections.map(collection => (
                <option key={collection.value} value={collection.value}>
                  {collection.label} ({dataStats[collection.value] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          {selectedCollection && (
            <div className="er-search-box-enhanced">
              <FiSearch className="er-search-icon" />
              <input
                type="text"
                placeholder="Search in records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="er-search-input"
                disabled={loading}
              />
              {searchTerm && (
                <button 
                  className="er-clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <FiX />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Records Table */}
      {selectedCollection && (
        <div className="er-table-section">
          <div className="er-table-container">
            {loading ? (
              <div className="er-loading-state">
                <div className="er-spinner"></div>
                <p>Loading records...</p>
              </div>
            ) : (
              <>
                <div className="er-table-header-info">
                  <div className="er-table-stats">
                    <FiFilter className="er-stats-icon" />
                    <span>
                      Showing {filteredRecords.length} of {records.length} records
                      {searchTerm && ` for "${searchTerm}"`}
                    </span>
                    {filteredRecords.length > 0 && (
                      <span className="er-sort-info">
                        • Sorted by year ({sortOrder === 'latest' ? 'latest first' : 'oldest first'})
                      </span>
                    )}
                  </div>
                  <div className="er-table-controls">
                    <button 
                      onClick={toggleSortOrder}
                      className="er-btn-sort"
                      disabled={loading}
                      title={`Sort by ${sortOrder === 'latest' ? 'oldest first' : 'latest first'}`}
                    >
                      {sortOrder === 'latest' ? <FiArrowDown /> : <FiArrowUp />}
                      {sortOrder === 'latest' ? 'Latest First' : 'Oldest First'}
                    </button>
                    <button 
                      onClick={loadRecords}
                      className="er-btn-refresh"
                      disabled={loading}
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>

                {filteredRecords.length > 0 ? (
                  <div className="er-table-wrapper">
                    <table className="er-records-table-fixed">
                      <thead>
                        <tr>
                          {renderTableHeaders()}
                          <th className="er-action-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map(renderTableRow)}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="er-no-data">
                    <FiFilter size={48} className="er-no-data-icon" />
                    <h3>No records found</h3>
                    <p>
                      {searchTerm 
                        ? `No records match your search for "${searchTerm}"`
                        : 'No records available in this collection'
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {renderEditModal()}
    </div>
  );
};

export default EmigrantsRecords;
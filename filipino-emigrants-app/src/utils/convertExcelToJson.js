import * as XLSX from 'xlsx';

// Civil Status Data Converter
export const convertCivilStatusExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets['byCivStat'];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const jsonData = data.slice(3).map(row => ({
    year: row[2],
    single: row[3],
    married: row[4],
    widower: row[5],
    separated: row[6],
    divorced: row[7],
    notReported: row[8],
    total: row[9]
  })).filter(item => item.year && !isNaN(item.year));
  
  return jsonData;
};

// Sex Data Converter
export const convertSexExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets['bySex'];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const jsonData = data.slice(6).map(row => ({
    year: row[2],
    male: row[3],
    female: row[4],
    total: row[5],
    sexRatio: row[6]
  })).filter(item => item.year && !isNaN(item.year));
  
  return jsonData;
};

// Age Data Converter
export const convertAgeExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets['byAge'];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const jsonData = [];
  const years = data[3].slice(1, -2); // Get years from header row
  
  data.slice(4, -4).forEach((row, rowIndex) => {
    const ageGroup = row[0];
    row.slice(1, -2).forEach((count, colIndex) => {
      if (count && years[colIndex]) {
        jsonData.push({
          year: years[colIndex],
          ageGroup: ageGroup,
          count: count
        });
      }
    });
  });
  
  return jsonData;
};

// Education Data Converter
export const convertEducationExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets['byEduc'];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const jsonData = [];
  const years = data[3].slice(1, -2); // Get years from header row
  
  data.slice(4, -4).forEach((row, rowIndex) => {
    const educationLevel = row[0];
    row.slice(1, -2).forEach((count, colIndex) => {
      if (count && years[colIndex]) {
        jsonData.push({
          year: years[colIndex],
          educationLevel: educationLevel,
          count: count
        });
      }
    });
  });
  
  return jsonData;
};

// Occupation Data Converter
export const convertOccupationExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets['byOccu'];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const jsonData = [];
  const years = data[3].slice(1, -2); // Get years from header row
  
  data.slice(4, -4).forEach((row, rowIndex) => {
    const occupationGroup = row[0];
    row.slice(1, -2).forEach((count, colIndex) => {
      if (count && years[colIndex] && occupationGroup && occupationGroup !== 'A. EMPLOYED' && occupationGroup !== 'B. UNEMPLOYED') {
        jsonData.push({
          year: years[colIndex],
          occupationGroup: occupationGroup,
          count: count
        });
      }
    });
  });
  
  return jsonData;
};
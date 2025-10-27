import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// Your Excel data converted to JSON format
const civilStatusData = [
  { year: 1988, single: 31989, married: 23530, widower: 2133, separated: 134, divorced: 143, notReported: 91, total: 58020 },
  { year: 1989, single: 30338, married: 23203, widower: 1858, separated: 98, divorced: 143, notReported: 105, total: 55745 },
  { year: 1990, single: 33477, married: 27005, widower: 2299, separated: 127, divorced: 194, notReported: 47, total: 63149 },
  // Add all years from your civil status file...
];

const sexData = [
  { year: 1981, male: 20350, female: 28517, total: 48867, sexRatio: "71M/100F" },
  { year: 1982, male: 21752, female: 32201, total: 53953, sexRatio: "68M/100F" },
  // Add all years from your sex file...
];

const ageData = [
  { year: 1981, ageGroup: "14 - Below", count: 9588 },
  { year: 1981, ageGroup: "15 - 19", count: 4712 },
  { year: 1981, ageGroup: "20 - 24", count: 5846 },
  // Add all age groups for all years...
];

const educationData = [
  { year: 1988, educationLevel: "Not of Schooling Age", count: 5514 },
  { year: 1988, educationLevel: "No Formal Education", count: 459 },
  // Add all education levels for all years...
];

const occupationData = [
  { year: 1981, occupationGroup: "Prof'l, Tech'l, & Related Workers", count: 4821 },
  { year: 1981, occupationGroup: "Managerial, Executive, and Administrative Workers", count: 451 },
  // Add all occupation groups for all years...
];

// Function to import data to Firebase
const importData = async () => {
  try {
    // Import Civil Status Data
    for (const item of civilStatusData) {
      await addDoc(collection(db, "civilStatus"), item);
    }
    console.log("Civil Status data imported successfully");

    // Import Sex Data
    for (const item of sexData) {
      await addDoc(collection(db, "sex"), item);
    }
    console.log("Sex data imported successfully");

    // Import Age Data
    for (const item of ageData) {
      await addDoc(collection(db, "age"), item);
    }
    console.log("Age data imported successfully");

    // Import Education Data
    for (const item of educationData) {
      await addDoc(collection(db, "education"), item);
    }
    console.log("Education data imported successfully");

    // Import Occupation Data
    for (const item of occupationData) {
      await addDoc(collection(db, "occupation"), item);
    }
    console.log("Occupation data imported successfully");

    console.log("All data imported successfully!");
  } catch (error) {
    console.error("Error importing data:", error);
  }
};

export { importData };
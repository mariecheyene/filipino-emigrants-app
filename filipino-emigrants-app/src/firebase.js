import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCeVDWP7Ec0wkWDXq_prTCsPb6k5NLcK8I",
  authDomain: "filipinoemigrantsdb3.firebaseapp.com",
  projectId: "filipinoemigrantsdb3",
  storageBucket: "filipinoemigrantsdb3.firebasestorage.app",
  messagingSenderId: "11501678602",
  appId: "1:11501678602:web:1c766f03109e187c836ff3"
};



const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
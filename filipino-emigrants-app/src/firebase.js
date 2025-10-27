import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBx6BJsOAG8j-vs-jy2JKRiFudwZss0nXg",
  authDomain: "filipinoemigrantsdb-7e441.firebaseapp.com",
  projectId: "filipinoemigrantsdb-7e441",
  storageBucket: "filipinoemigrantsdb-7e441.firebasestorage.app",
  messagingSenderId: "651613037376",
  appId: "1:651613037376:web:69c9d13b1be73e2b4d10a5",
  measurementId: "G-N700QDP6KH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
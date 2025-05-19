// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7vMDVj_DoVg2K6Xc6EbGkrs9_2dWM__M",
  authDomain: "asset-verifier-app.firebaseapp.com",
  projectId: "asset-verifier-app",
  storageBucket: "asset-verifier-app.appspot.com",
  messagingSenderId: "674298072015",
  appId: "1:674298072015:web:d8fc1e1aea7f01a6c0a0ba",
  measurementId: "G-PCS7TPE35W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }; 
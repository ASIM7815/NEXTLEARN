// Firebase configuration for frontend
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGvNmQ--P0HetZzBMJvyQyqOAJvap2Z-k",
  authDomain: "nextlearn-fe31f.firebaseapp.com",
  projectId: "nextlearn-fe31f",
  storageBucket: "nextlearn-fe31f.firebasestorage.app",
  messagingSenderId: "717511823549",
  appId: "1:717511823549:web:2e850018aad9e6b0fce7d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

export { storage, firebaseConfig };
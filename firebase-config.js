// Firebase configuration for server-side
const admin = require('firebase-admin');

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyDGvNmQ--P0HetZzBMJvyQyqOAJvap2Z-k",
  authDomain: "nextlearn-fe31f.firebaseapp.com",
  projectId: "nextlearn-fe31f",
  storageBucket: "nextlearn-fe31f.firebasestorage.app",
  messagingSenderId: "717511823549",
  appId: "1:717511823549:web:2e850018aad9e6b0fce7d4"
};

// Initialize Firebase Admin SDK
// Note: In production, use a service account key file for better security
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

const bucket = admin.storage().bucket();

module.exports = {
  admin,
  bucket,
  firebaseConfig
};
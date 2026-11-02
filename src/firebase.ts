import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
console.log("Initializing Firestore with Database ID:", firebaseConfig.firestoreDatabaseId);
// Use the specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 

export default app;

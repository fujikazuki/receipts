import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAeS_1oEf11N_6O9-OZJcc5ORfBmDM5WMA",
    authDomain: "receipts-87efd.firebaseapp.com",
    projectId: "receipts-87efd",
    storageBucket: "receipts-87efd.firebasestorage.app",
    messagingSenderId: "147843497356",
    appId: "1:147843497356:web:5c2cb6e017f631e8e5aaa9",
    measurementId: "G-DHLTJ77LQ3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
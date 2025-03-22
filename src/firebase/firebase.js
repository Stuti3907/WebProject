import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBOZ4Sct4W977Gb7d-Z21zneoGyakJJv8c",
    authDomain: "miniproject-d9f18.firebaseapp.com",
    projectId: "miniproject-d9f18",
    storageBucket: "miniproject-d9f18.appspot.com",
    messagingSenderId: "48293998777",
    appId: "1:48293998777:web:33ca36edbc9badc66a6b68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication and GoogleAuthProvider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Initialize Firebase Storage
const storage = getStorage(app);

// Export the initialized services
export { db, auth, provider, storage };
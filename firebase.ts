import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// EduQuiz Pro (ProshnoBank) Firebase Connection
const firebaseConfig = {
  apiKey: "Je8fUilVhpXyyhD4Q323T1_2rGMnr_gRkjqu9QKDJ0k", 
  authDomain: "proshnobank-25090.firebaseapp.com",
  projectId: "proshnobank-25090",
  storageBucket: "proshnobank-25090.appspot.com",
  messagingSenderId: "1084709711188", 
  appId: "1:1084709711188:web:b1e48f8ec653c1364b6cc3" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Offline Persistence Enable ───────────────────────────
// এটি ইন্টারনেট ছাড়াই ডাটা ব্রাউজারে বা অ্যাপে সেভ করে রাখবে
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // একাধিক ট্যাব ওপেন থাকলে এই এরর আসতে পারে
        console.warn("Persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
        // ব্রাউজার যদি এটি সাপোর্ট না করে
        console.warn("Persistence is not supported by this browser.");
    }
});

export { db };

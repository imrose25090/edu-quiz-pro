import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// EduQuiz Pro (ProshnoBank) Firebase Connection
const firebaseConfig = {
  apiKey: "Je8fUilVhpXyyhD4Q323T1_2rGMnr_gRkjqu9QKDJ0k" , // স্ক্রিনশটে থাকা আপনার আসল apiKey এখানে বসান
  authDomain: "proshnobank-25090.firebaseapp.com",
  projectId: "proshnobank-25090",
  storageBucket: "proshnobank-25090.appspot.com",
  messagingSenderId: "1084709711188", // আপনার স্ক্রিনশট থেকে পাওয়া
  appId: "1:1084709711188:web:b1e48f8ec653c1364b6cc3" // আপনার স্ক্রিনশট থেকে পাওয়া
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from "./firebase"; 
import { 
  collection, onSnapshot, doc, writeBatch, serverTimestamp,
  query, where, getDocs, deleteDoc, updateDoc, addDoc,
  orderBy, Timestamp
} from "firebase/firestore";

import { Class, Subject, Chapter, Question, Teacher, Quiz } from './types';
import { translations, Language } from './translations';

interface AppState {
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  teachers: Teacher[];
  students: any[]; // স্টুডেন্ট লিস্টের জন্য
  quizzes: Quiz[];
  language: Language;
  loading: boolean;
}

interface AppContextType extends AppState {
  bulkAddClasses: (names: string[]) => Promise<void>;
  bulkAddSubjects: (data: any[]) => Promise<void>;
  bulkAddChapters: (data: any[]) => Promise<void>;
  addBulkQuestions: (newQuestions: any[]) => Promise<void>;
  bulkAddTeachers: (data: any[]) => Promise<void>;
  updateTeacher: (id: string, data: any) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  updateStudent: (id: string, data: any) => Promise<void>; // নতুন যোগ করা হয়েছে
  deleteStudent: (id: string) => Promise<void>; // নতুন যোগ করা হয়েছে
  bulkDelete: (collectionName: string, ids: string[]) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteAllQuestions: () => Promise<void>;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    classes: [], subjects: [], chapters: [], questions: [],
    teachers: [], students: [], quizzes: [], language: 'bn',
    loading: true
  });

  // ✅ ১. রিয়েল-টাইম ডাটা লিসেনার
  useEffect(() => {
    const unsubscribers = [
      onSnapshot(query(collection(db, "classes"), orderBy("createdAt", "asc")), (s) => 
        setState(p => ({ ...p, classes: s.docs.map(d => ({ id: d.id, ...d.data() } as Class)) }))),
      
      onSnapshot(query(collection(db, "subjects"), orderBy("createdAt", "asc")), (s) => 
        setState(p => ({ ...p, subjects: s.docs.map(d => ({ id: d.id, ...d.data() } as Subject)) }))),
      
      onSnapshot(query(collection(db, "chapters"), orderBy("createdAt", "asc")), (s) => 
        setState(p => ({ ...p, chapters: s.docs.map(d => ({ id: d.id, ...d.data() } as Chapter)) }))),

      onSnapshot(query(collection(db, "questions"), orderBy("createdAt", "desc")), (s) => 
        setState(p => ({ ...p, questions: s.docs.map(d => ({ id: d.id, ...d.data() } as Question)) }))),

      onSnapshot(query(collection(db, "teachers"), orderBy("createdAt", "desc")), (s) => 
        setState(p => ({ ...p, teachers: s.docs.map(d => ({ id: d.id, ...d.data() } as Teacher)) }))),

      // ✅ স্টুডেন্টদের জন্য লিসেনার (এটি আপনার আগের কোডে ছিল না)
      onSnapshot(query(collection(db, "users"), where("role", "==", "student")), (s) => 
        setState(p => ({ ...p, students: s.docs.map(d => ({ id: d.id, ...d.data() })) })))
    ];
    
    setTimeout(() => setState(p => ({ ...p, loading: false })), 1000);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const t = (key: keyof typeof translations['en']) => translations[state.language][key] || key;

  // ✅ ২. টিচার ম্যানেজমেন্ট
  const bulkAddTeachers = async (data: any[]) => {
    setState(p => ({ ...p, loading: true }));
    try {
      const batch = writeBatch(db);
      data.forEach(teacher => {
        const docRef = doc(collection(db, "teachers"));
        batch.set(docRef, { ...teacher, createdAt: serverTimestamp() });
      });
      await batch.commit();
    } catch (e) {
      console.error("Bulk Add Teachers Failed:", e);
    } finally {
      setState(p => ({ ...p, loading: false }));
    }
  };

  const updateTeacher = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, "teachers", id), data);
    } catch (e) {
      console.error("Update Teacher Failed:", e);
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(db, "teachers", id));
    } catch (e) {
      console.error("Delete Teacher Failed:", e);
    }
  };

  // ✅ ৩. স্টুডেন্ট ম্যানেজমেন্ট (নতুন যোগ করা ফাংশন)
  const updateStudent = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, "users", id), data);
    } catch (e) {
      console.error("Update Student Failed:", e);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (e) {
      console.error("Delete Student Failed:", e);
    }
  };

  // ✅ ৪. ম্যানেজমেন্ট সেকশন ফাংশনসমূহ
  const bulkAddClasses = async (names: string[]) => {
    for (let i = 0; i < names.length; i++) {
      const name = names[i].trim();
      if (!name) continue;
      const manualTime = new Date();
      manualTime.setSeconds(manualTime.getSeconds() + i);
      await addDoc(collection(db, "classes"), { name, createdAt: Timestamp.fromDate(manualTime) });
      await new Promise(r => setTimeout(r, 100));
    }
  };

  const bulkAddSubjects = async (data: any[]) => {
    for (let i = 0; i < data.length; i++) {
      const manualTime = new Date();
      manualTime.setSeconds(manualTime.getSeconds() + i);
      await addDoc(collection(db, "subjects"), { ...data[i], createdAt: Timestamp.fromDate(manualTime) });
      await new Promise(r => setTimeout(r, 100));
    }
  };

  const bulkAddChapters = async (data: any[]) => {
    for (let i = 0; i < data.length; i++) {
      const manualTime = new Date();
      manualTime.setSeconds(manualTime.getSeconds() + i);
      await addDoc(collection(db, "chapters"), { ...data[i], createdAt: Timestamp.fromDate(manualTime) });
      await new Promise(r => setTimeout(r, 100));
    }
  };

  // ✅ ৫. কোয়েশ্চেন ম্যানেজমেন্ট
  const addBulkQuestions = async (newQuestions: any[]) => {
    setState(p => ({ ...p, loading: true }));
    try {
      const batch = writeBatch(db);
      newQuestions.forEach(q => {
        const docRef = doc(collection(db, "questions"));
        batch.set(docRef, { ...q, createdAt: serverTimestamp() });
      });
      await batch.commit();
    } catch (e) {
      console.error("Bulk Add Questions Failed:", e);
      throw e;
    } finally {
      setState(p => ({ ...p, loading: false }));
    }
  };

  const bulkDelete = async (collectionName: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, collectionName, id)));
    await batch.commit();
  };

  const deleteClass = async (id: string) => await deleteDoc(doc(db, "classes", id));
  const deleteQuestion = async (id: string) => await deleteDoc(doc(db, "questions", id));

  const deleteAllQuestions = async () => {
    const qSnap = await getDocs(collection(db, "questions"));
    const batch = writeBatch(db);
    qSnap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  };

  return (
    <AppContext.Provider value={{ 
      ...state, 
      bulkAddClasses, bulkAddSubjects, bulkAddChapters, addBulkQuestions,
      bulkAddTeachers, updateTeacher, deleteTeacher,
      updateStudent, deleteStudent, // ✅ এক্সপোর্ট করা হলো
      bulkDelete, deleteClass, deleteQuestion, deleteAllQuestions,
      setLanguage: (l: Language) => setState(p => ({ ...p, language: l })), t
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

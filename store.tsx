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
  students: any[];
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
  updateStudent: (id: string, data: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
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

  useEffect(() => {
    setState(p => ({ ...p, loading: true }));

    const unsubscribers = [
      // ১. ক্লাস লিস্ট রিড করা
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

      onSnapshot(query(collection(db, "users"), where("role", "==", "student")), (s) => 
        setState(p => ({ ...p, students: s.docs.map(d => ({ id: d.id, ...d.data() })) }))),

      onSnapshot(query(collection(db, "quizzes"), orderBy("createdAt", "desc")), (s) => 
        setState(p => ({ ...p, quizzes: s.docs.map(d => ({ id: d.id, ...d.data() } as Quiz)) })))
    ];
    
    setTimeout(() => setState(p => ({ ...p, loading: false })), 1000);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const t = (key: keyof typeof translations['en']) => translations[state.language][key] || key;

  // --- ম্যানেজমেন্ট ফাংশনসমূহ ---
  
  const bulkAddClasses = async (names: string[]) => {
    const batch = writeBatch(db);
    const now = Date.now(); 
    names.forEach((name, i) => {
      if (name.trim()) {
        const docRef = doc(collection(db, "classes"));
        batch.set(docRef, { 
          name: name.trim(), 
          createdAt: Timestamp.fromMillis(now + (i * 100)) 
        });
      }
    });
    await batch.commit();
  };

  const bulkAddSubjects = async (data: any[]) => {
    const batch = writeBatch(db);
    const now = Date.now();
    data.forEach((item, i) => {
      const docRef = doc(collection(db, "subjects"));
      batch.set(docRef, { 
        ...item, 
        createdAt: Timestamp.fromMillis(now + (i * 100)) 
      });
    });
    await batch.commit();
  };

  const bulkAddChapters = async (data: any[]) => {
    const batch = writeBatch(db);
    const now = Date.now();
    data.forEach((item, i) => {
      const docRef = doc(collection(db, "chapters"));
      batch.set(docRef, { 
        ...item, 
        createdAt: Timestamp.fromMillis(now + (i * 100)) 
      });
    });
    await batch.commit();
  };

  const addBulkQuestions = async (newQuestions: any[]) => {
    const batch = writeBatch(db);
    newQuestions.forEach(q => {
      const docRef = doc(collection(db, "questions"));
      batch.set(docRef, { 
        ...q, 
        classId: String(q.classId),
        subjectId: String(q.subjectId),
        chapterId: String(q.chapterId),
        createdAt: serverTimestamp() 
      });
    });
    await batch.commit();
  };

  // ✅ টিচার অ্যাড করার সময় allowedClasses ডিফল্ট খালি অ্যারে রাখা হয়েছে
  const bulkAddTeachers = async (data: any[]) => {
    const batch = writeBatch(db);
    data.forEach(teacher => {
      const docRef = doc(collection(db, "teachers"));
      batch.set(docRef, { 
        ...teacher, 
        allowedClasses: teacher.allowedClasses || [], // Ensuring array exists
        createdAt: serverTimestamp() 
      });
    });
    await batch.commit();
  };

  const updateTeacher = async (id: string, data: any) => {
    await updateDoc(doc(db, "teachers", id), data);
  };

  const deleteTeacher = async (id: string) => {
    await deleteDoc(doc(db, "teachers", id));
  };

  const updateStudent = async (id: string, data: any) => {
    await updateDoc(doc(db, "users", id), data);
  };

  const deleteStudent = async (id: string) => {
    await deleteDoc(doc(db, "users", id));
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
      updateStudent, deleteStudent,
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

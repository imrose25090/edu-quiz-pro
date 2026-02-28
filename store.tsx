import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from "./firebase"; 
import { 
  collection, 
  onSnapshot, 
  doc, 
  writeBatch, 
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  addDoc,
  arrayUnion,
  orderBy,
  Timestamp
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
  // ✅ অ্যানালিটিক্স ডাটা
  analytics: {
    weekly: { teachers: number; students: number; quizzes: number; questions: number };
    monthly: { teachers: number; students: number; quizzes: number; questions: number };
  };
}

interface AppContextType extends AppState {
  bulkAddClasses: (names: string[]) => Promise<void>;
  bulkAddSubjects: (data: any[]) => Promise<void>;
  bulkAddChapters: (data: any[]) => Promise<void>;
  addBulkQuestions: (questions: any[]) => Promise<void>;
  bulkAddTeachers: (data: any[]) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteAllQuestions: () => Promise<void>;
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<void>;
  addTeacher: (teacher: any) => Promise<void>;
  updateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  updateStudent: (id: string, updates: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  // ✅ ফ্রিজ এবং ম্যানেজমেন্ট লজিক
  toggleFreezeAccount: (collectionName: 'teachers' | 'students', id: string, status: boolean, days?: number) => Promise<void>;
  createQuiz: (quizData: any) => Promise<void>;
  addQuizAttempt: (quizCode: string, attempt: any) => Promise<void>;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    classes: [],
    subjects: [],
    chapters: [],
    questions: [],
    teachers: [],
    students: [],
    quizzes: [],
    language: 'bn',
    loading: true,
    analytics: {
      weekly: { teachers: 0, students: 0, quizzes: 0, questions: 0 },
      monthly: { teachers: 0, students: 0, quizzes: 0, questions: 0 }
    }
  });

  // ১. রিয়েল-টাইম ডাটা সিঙ্ক্রোনাইজেশন এবং অ্যানালিটিক্স ক্যালকুলেশন
  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, "classes"), (s) => 
        setState(p => ({ ...p, classes: s.docs.map(d => ({ id: d.id, ...d.data() } as Class)) }))),
      
      onSnapshot(collection(db, "subjects"), (s) => 
        setState(p => ({ ...p, subjects: s.docs.map(d => ({ id: d.id, ...d.data() } as Subject)) }))),
      
      onSnapshot(collection(db, "chapters"), (s) => 
        setState(p => ({ ...p, chapters: s.docs.map(d => ({ id: d.id, ...d.data() } as Chapter)) }))),
      
      onSnapshot(collection(db, "questions"), (s) => {
        const qs = s.docs.map(d => ({ id: d.id, ...d.data() } as Question));
        calculateAnalytics(qs, 'questions');
        setState(p => ({ ...p, questions: qs }));
      }),
      
      onSnapshot(collection(db, "teachers"), (s) => {
        const ts = s.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
        calculateAnalytics(ts, 'teachers');
        setState(p => ({ ...p, teachers: ts }));
      }),
      
      onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), (s) => {
        const st = s.docs.map(d => ({ id: d.id, ...d.data() }));
        calculateAnalytics(st, 'students');
        setState(p => ({ ...p, students: st }));
      }),
      
      onSnapshot(collection(db, "quizzes"), (s) => {
        const qz = s.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
        calculateAnalytics(qz, 'quizzes');
        setState(p => ({ ...p, quizzes: qz }));
      })
    ];
    
    const timer = setTimeout(() => setState(p => ({ ...p, loading: false })), 1500);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearTimeout(timer);
    };
  }, []);

  // ✅ অ্যানালিটিক্স লজিক (Weekly/Monthly)
  const calculateAnalytics = (data: any[], type: keyof AppState['analytics']['weekly']) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyCount = data.filter(item => {
      const date = item.createdAt instanceof Timestamp ? item.createdAt.toDate() : new Date(item.createdAt);
      return date >= oneWeekAgo;
    }).length;

    const monthlyCount = data.filter(item => {
      const date = item.createdAt instanceof Timestamp ? item.createdAt.toDate() : new Date(item.createdAt);
      return date >= oneMonthAgo;
    }).length;

    setState(p => ({
      ...p,
      analytics: {
        ...p.analytics,
        weekly: { ...p.analytics.weekly, [type]: weeklyCount },
        monthly: { ...p.analytics.monthly, [type]: monthlyCount }
      }
    }));
  };

  const t = (key: keyof typeof translations['en']) => translations[state.language][key] || key;

  // ২. বাল্ক অ্যাড ফাংশনসমূহ
  const bulkAddClasses = async (names: string[]) => {
    const batch = writeBatch(db);
    names.forEach(name => {
      const docRef = doc(collection(db, "classes"));
      batch.set(docRef, { name, createdAt: serverTimestamp() });
    });
    await batch.commit();
  };

  const bulkAddSubjects = async (data: any[]) => {
    const batch = writeBatch(db);
    data.forEach(item => {
      const docRef = doc(collection(db, "subjects"));
      batch.set(docRef, { ...item, createdAt: serverTimestamp() });
    });
    await batch.commit();
  };

  const bulkAddChapters = async (data: any[]) => {
    const batch = writeBatch(db);
    data.forEach(item => {
      const docRef = doc(collection(db, "chapters"));
      batch.set(docRef, { ...item, createdAt: serverTimestamp() });
    });
    await batch.commit();
  };

  const addBulkQuestions = async (qs: any[]) => {
    const batch = writeBatch(db);
    qs.forEach(q => {
      const docRef = doc(collection(db, "questions"));
      batch.set(docRef, { 
        ...q, 
        text: q.text || q.question || "", 
        createdAt: serverTimestamp() 
      });
    });
    await batch.commit();
  };

  const bulkAddTeachers = async (data: any[]) => {
    const batch = writeBatch(db);
    data.forEach(item => {
      const docRef = doc(collection(db, "teachers"));
      batch.set(docRef, { 
        ...item, 
        createdAt: serverTimestamp(), 
        status: 'active', 
        isFrozen: false,
        expiryDate: item.expiryDate || null 
      });
    });
    await batch.commit();
  };

  // ৩. ডিলিট ও আপডেট ফাংশনসমূহ
  const deleteClass = async (id: string) => { await deleteDoc(doc(db, "classes", id)); };
  const deleteSubject = async (id: string) => { await deleteDoc(doc(db, "subjects", id)); };
  const deleteChapter = async (id: string) => { await deleteDoc(doc(db, "chapters", id)); };
  const updateChapter = async (id: string, updates: Partial<Chapter>) => { await updateDoc(doc(db, "chapters", id), updates); };
  const deleteQuestion = async (id: string) => { await deleteDoc(doc(db, "questions", id)); };
  
  const deleteAllQuestions = async () => {
    const snap = await getDocs(collection(db, "questions"));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  };

  // ৪. শিক্ষক ও ছাত্র ম্যানেজমেন্ট (Freeze/Delete)
  const addTeacher = async (teacher: any) => {
    await addDoc(collection(db, "teachers"), { 
      ...teacher, 
      createdAt: serverTimestamp(), 
      status: 'active', 
      isFrozen: false 
    });
  };

  const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
    await updateDoc(doc(db, "teachers", id), updates);
  };

  const deleteTeacher = async (id: string) => { await deleteDoc(doc(db, "teachers", id)); };

  const updateStudent = async (id: string, updates: any) => {
    await updateDoc(doc(db, "students", id), updates);
  };

  const deleteStudent = async (id: string) => { 
    await deleteDoc(doc(db, "students", id)); 
  };

  // ✅ অ্যাকাউন্ট ফ্রিজ করার লজিক (ডে লিমিটসহ)
  const toggleFreezeAccount = async (collectionName: 'teachers' | 'students', id: string, status: boolean, days: number = 0) => {
    const freezeUntil = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;
    await updateDoc(doc(db, collectionName, id), {
      isFrozen: status,
      frozenUntil: freezeUntil,
      status: status ? 'frozen' : 'active'
    });
  };

  // ৫. কুইজ লজিক
  const createQuiz = async (quizData: any) => {
    await addDoc(collection(db, "quizzes"), { 
      ...quizData, 
      attempts: [], 
      createdAt: new Date().toISOString()
    });
  };

  const addQuizAttempt = async (quizCode: string, attempt: any) => {
    try {
      const q = query(collection(db, "quizzes"), where("code", "==", quizCode.toUpperCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const quizDoc = snap.docs[0];
        const quizData = quizDoc.data();

        const isDuplicate = quizData.attempts?.some((a: any) => a.studentName === attempt.studentName);
        if (isDuplicate) return; 
        
        const attemptWithMeta = {
          ...attempt,
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          submittedAt: new Date().toISOString()
        };

        await updateDoc(doc(db, "quizzes", quizDoc.id), {
          attempts: arrayUnion(attemptWithMeta)
        });
      }
    } catch (error) {
      console.error("Submission Error:", error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{ 
      ...state, 
      bulkAddClasses, 
      bulkAddSubjects, 
      bulkAddChapters,
      addBulkQuestions, 
      bulkAddTeachers,
      deleteClass,
      deleteSubject,
      deleteChapter,
      updateChapter,
      deleteQuestion,
      deleteAllQuestions,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      updateStudent,
      deleteStudent,
      toggleFreezeAccount,
      createQuiz,
      addQuizAttempt, 
      setLanguage: (l) => setState(p => ({ ...p, language: l })), 
      t
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
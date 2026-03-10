import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from "./firebase"; 
import { 
  collection, onSnapshot, doc, writeBatch, serverTimestamp,
  query, getDocs, deleteDoc, updateDoc,
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
  impersonatedUser: any | null; 
}

interface AppContextType extends AppState {
  bulkAddClasses:    (names: string[]) => Promise<void>;
  bulkAddSubjects:   (data: any[]) => Promise<void>;
  bulkAddChapters:   (data: any[]) => Promise<void>;
  addBulkQuestions:  (newQuestions: any[]) => Promise<void>;
  bulkAddTeachers:   (data: any[]) => Promise<void>;
  updateTeacher:     (id: string, data: any) => Promise<void>;
  deleteTeacher:     (id: string) => Promise<void>;
  updateStudent:     (id: string, data: any) => Promise<void>;
  deleteStudent:     (id: string) => Promise<void>;
  bulkDelete:        (collectionName: string, ids: string[]) => Promise<void>;
  deleteClass:       (id: string) => Promise<void>;
  deleteSubject:     (id: string) => Promise<void>;
  deleteChapter:     (id: string) => Promise<void>;
  updateChapter:     (id: string, data: any) => Promise<void>;
  deleteQuestion:    (id: string) => Promise<void>;
  deleteAllQuestions:() => Promise<void>;
  setLanguage:       (lang: Language) => void;
  setImpersonatedUser: (user: any | null) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    classes: [], subjects: [], chapters: [], questions: [],
    teachers: [], students: [], quizzes: [], 
    language: 'bn', loading: true, impersonatedUser: null 
  });

  useEffect(() => {
    setState(p => ({ ...p, loading: true }));

    const unsubscribers = [
      onSnapshot(query(collection(db, "classes"),   orderBy("createdAt", "asc")),  (s) => 
        setState(p => ({ ...p, classes:   s.docs.map(d => ({ id: d.id, ...d.data() } as Class)) }))),
      
      onSnapshot(query(collection(db, "subjects"),  orderBy("createdAt", "asc")),  (s) => 
        setState(p => ({ ...p, subjects:  s.docs.map(d => ({ id: d.id, ...d.data() } as Subject)) }))),
      
      onSnapshot(query(collection(db, "chapters"),  orderBy("createdAt", "asc")),  (s) => 
        setState(p => ({ ...p, chapters:  s.docs.map(d => ({ id: d.id, ...d.data() } as Chapter)) }))),

      onSnapshot(query(collection(db, "questions"), orderBy("createdAt", "desc")), (s) => 
        setState(p => ({ ...p, questions: s.docs.map(d => ({ id: d.id, ...d.data() } as Question)) }))),

      onSnapshot(query(collection(db, "teachers"),  orderBy("createdAt", "desc")), (s) => 
        setState(p => ({ ...p, teachers:  s.docs.map(d => ({ id: d.id, ...d.data() } as Teacher)) }))),

      onSnapshot(collection(db, "students"), (s) => 
        setState(p => ({ ...p, students:  s.docs.map(d => ({ id: d.id, ...d.data() })) }))),

      onSnapshot(query(collection(db, "quizzes"),   orderBy("createdAt", "desc")), (s) => 
        setState(p => ({ ...p, quizzes:   s.docs.map(d => ({ id: d.id, ...d.data() } as Quiz)) })))
    ];
    
    const timer = setTimeout(() => setState(p => ({ ...p, loading: false })), 800);
    return () => { unsubscribers.forEach(u => u()); clearTimeout(timer); };
  }, []);

  const t = (key: keyof typeof translations['en']) => {
    const langSet = translations[state.language] || translations['en'];
    return langSet[key] || key;
  };

  const setImpersonatedUser = (user: any | null) => setState(p => ({ ...p, impersonatedUser: user }));

  // ── Classes ───────────────────────────────────────────────
  const bulkAddClasses = async (names: string[]) => {
    const batch = writeBatch(db);
    const now = Date.now(); 
    names.forEach((name, i) => {
      if (name.trim()) {
        batch.set(doc(collection(db, "classes")), { 
          name: name.trim(), 
          createdAt: Timestamp.fromMillis(now + i * 100)
        });
      }
    });
    await batch.commit();
  };

  const deleteClass = async (id: string) => await deleteDoc(doc(db, "classes", id));

  // ── Subjects ──────────────────────────────────────────────
  const bulkAddSubjects = async (data: any[]) => {
    const batch = writeBatch(db);
    const now = Date.now();
    data.forEach((item, i) => {
      batch.set(doc(collection(db, "subjects")), { 
        ...item,
        classId: String(item.classId),
        createdAt: Timestamp.fromMillis(now + i * 100)
      });
    });
    await batch.commit();
  };

  const deleteSubject = async (id: string) => await deleteDoc(doc(db, "subjects", id));

  // ── Chapters ──────────────────────────────────────────────
  const bulkAddChapters = async (data: any[]) => {
    const batch = writeBatch(db);
    const now = Date.now();
    data.forEach((item, i) => {
      batch.set(doc(collection(db, "chapters")), { 
        ...item,
        classId:   String(item.classId),
        subjectId: String(item.subjectId),
        createdAt: Timestamp.fromMillis(now + i * 100)
      });
    });
    await batch.commit();
  };

  const deleteChapter = async (id: string) => await deleteDoc(doc(db, "chapters", id));

  const updateChapter = async (id: string, data: any) => await updateDoc(doc(db, "chapters", id), data);

  // ── Questions ─────────────────────────────────────────────
  const addBulkQuestions = async (newQuestions: any[]) => {
    const batch = writeBatch(db);
    newQuestions.forEach(q => {
      batch.set(doc(collection(db, "questions")), { 
        ...q, 
        classId:   String(q.classId),
        subjectId: String(q.subjectId),
        chapterId: String(q.chapterId),
        createdAt: serverTimestamp() 
      });
    });
    await batch.commit();
  };

  const deleteQuestion    = async (id: string) => await deleteDoc(doc(db, "questions", id));

  const deleteAllQuestions = async () => {
    const snap = await getDocs(collection(db, "questions"));
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  };

  // ── Teachers ──────────────────────────────────────────────
  const bulkAddTeachers = async (data: any[]) => {
    const batch = writeBatch(db);
    data.forEach(teacher => {
      batch.set(doc(collection(db, "teachers")), { 
        ...teacher, 
        allowedClasses: teacher.allowedClasses || [],
        createdAt: serverTimestamp() 
      });
    });
    await batch.commit();
  };

  const updateTeacher = async (id: string, data: any) => await updateDoc(doc(db, "teachers", id), data);
  const deleteTeacher = async (id: string) => await deleteDoc(doc(db, "teachers", id));

  // ── Students ──────────────────────────────────────────────
  const updateStudent = async (id: string, data: any) => await updateDoc(doc(db, "students", id), data);
  const deleteStudent = async (id: string) => await deleteDoc(doc(db, "students", id));

  // ── Bulk delete (any collection) ──────────────────────────
  const bulkDelete = async (collectionName: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, collectionName, id)));
    await batch.commit();
  };

  return (
    <AppContext.Provider value={{ 
      ...state, 
      bulkAddClasses, bulkAddSubjects, bulkAddChapters, addBulkQuestions,
      bulkAddTeachers, updateTeacher, deleteTeacher,
      updateStudent, deleteStudent,
      bulkDelete,
      deleteClass, deleteSubject, deleteChapter, updateChapter,
      deleteQuestion, deleteAllQuestions,
      setLanguage: (l: Language) => setState(p => ({ ...p, language: l })),
      setImpersonatedUser, 
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

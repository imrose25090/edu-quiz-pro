export type Language = 'en' | 'bn';

// ✅ সংশোধিত: এখানে নতুন টাইপগুলো যোগ করা হয়েছে
export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  FILL_IN_THE_GAP = 'FILL_IN_THE_GAP', // নতুন যোগ করা হলো
  LONG_ANSWER = 'LONG_ANSWER'         // ভবিষ্যতের জন্য যোগ করা হলো
}

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

// --- Management Structures ---
export interface Class { 
  id: string; 
  name: string; 
  createdAt: any; 
}

export interface Subject { 
  id: string; 
  name: string; 
  classId: string; 
  createdAt: any; 
}

export interface Chapter { 
  id: string; 
  name: string; 
  classId: string; 
  subjectId: string; 
  passageContent?: string; 
  createdAt: any; 
}

// --- Question Bank ---
export interface Question {
  id: string;
  text: string;     // Store এ আমরা 'text' ব্যবহার করছি
  type: string;     // Enum এর বদলে string রাখা নিরাপদ যাতে ডাইনামিক টাইপ সাপোর্ট করে
  options?: string[];
  correctAnswer: string; // 'answer' এর বদলে 'correctAnswer' ই স্ট্যান্ডার্ড
  marks: number; 
  classId: string;
  subjectId: string;
  chapterId: string;
  createdAt: any;
}

// --- Users ---
export interface Teacher {
  id: string;
  name: string;
  email: string;
  pin: string;
  isFrozen?: boolean;
  createdAt: any;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  isFrozen?: boolean;
  lastActive?: any;
  createdAt: any;
}

// --- Quiz & Attempts ---
export interface QuizAttempt {
  id?: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number; 
  timeSpent: number; 
  answers: Record<string, string>; 
  submittedAt: string;
}

export interface Quiz {
  id: string;
  code: string;
  title: string;
  teacherId: string;
  teacherName?: string; 
  classId: string;
  subjectId: string;
  questions: Question[];
  attempts: QuizAttempt[];
  status: 'active' | 'completed' | 'draft';
  config: {
    totalTime: number; 
    totalMarks: number;
    showResultImmediately: boolean;
    passingMarks?: number; 
  };
  createdAt: any;
}

// --- Global App Store Interface ---
export interface AppState {
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  teachers: Teacher[];
  students: Student[];
  quizzes: Quiz[];
  language: Language;
  loading: boolean;
  
  // Actions
  bulkAddClasses: (names: string[]) => Promise<void>;
  bulkAddSubjects: (data: any[]) => Promise<void>;
  bulkAddChapters: (data: any[]) => Promise<void>;
  addBulkQuestions: (questions: any[]) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteAllQuestions: () => Promise<void>;
  createQuiz: (quizData: any) => Promise<void>;
  addQuizAttempt: (quizCode: string, attempt: any) => Promise<void>;
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<void>;
  addTeacher: (teacher: any) => Promise<void>;
  updateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  updateStudent: (id: string, updates: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
}
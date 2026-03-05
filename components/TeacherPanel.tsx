import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { Quiz, Teacher, QuizAttempt } from '../types';

// Firebase
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";

// Sub-components
import { TeacherLogin } from './teacher/TeacherLogin';
import { QuizCreateForm } from './teacher/QuizCreateForm';
import { QuizAnalytics } from './teacher/QuizAnalytics';
import { QuestionPaperView } from './teacher/QuestionPaperView';
import { StudentTranscriptModal } from './teacher/StudentTranscriptModal';

const TeacherPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { classes, subjects, chapters, questions, teachers, t } = useApp();
  
  const [firebaseQuizzes, setFirebaseQuizzes] = useState<Quiz[]>([]);
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);
  const [view, setView] = useState<'LOGIN' | 'LIST' | 'CREATE' | 'REPORT' | 'PAPER'>('LOGIN');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [viewingAttempt, setViewingAttempt] = useState<QuizAttempt | null>(null);
  
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const attemptSheetRef = useRef<HTMLDivElement>(null);

  const [newQuiz, setNewQuiz] = useState({
    title: '', 
    classId: '', 
    subjectId: '', 
    chapterIds: [] as string[],
    qCount: 10, 
    time: 30, 
    mode: 'AUTO' as any,
    typeCounts: {} as Record<string, number>,
    selectedQuestionIds: [] as string[]
  });

  const [manualSelectedIds, setManualSelectedIds] = useState<string[]>([]);

  const getRankInfo = (att: QuizAttempt, q: Quiz) => {
    if (!q.attempts || q.attempts.length === 0) return { rank: 1, total: 1 };
    const sorted = [...q.attempts].sort((a, b) => (b.score || 0) - (a.score || 0));
    const rank = sorted.findIndex(s => 
      s.submittedAt === att.submittedAt && s.studentName === att.studentName
    ) + 1;
    return { rank: rank > 0 ? rank : 1, total: sorted.length };
  };

  useEffect(() => {
    if (!activeTeacher) return;
    const q = query(collection(db, "quizzes"), where("teacherId", "==", activeTeacher.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Quiz[];
      setFirebaseQuizzes(list.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
      }));
      if (selectedQuiz) {
        const updated = list.find(qz => qz.id === selectedQuiz.id);
        if (updated) setSelectedQuiz(updated);
      }
    });
    return () => unsubscribe();
  }, [activeTeacher, selectedQuiz?.id]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundTeacher = teachers.find(t => t.id === activeTeacher?.id);
    if (foundTeacher && foundTeacher.pin === pinInput) {
      setView('LIST');
      setLoginError(false);
    } else {
      setLoginError(true);
      setPinInput('');
    }
  };

  // ✅ FINAL FIXED: Launch Quiz Logic
  const handleLaunch = async () => {
    if (!newQuiz.title || !newQuiz.classId || !newQuiz.subjectId) {
      return alert("Please fill all required fields!");
    }
    
    setLoading(true);

    try {
      let finalSelectedQs: any[] = [];

      // ১. অগ্রাধিকার ভিত্তিক সিলেকশন (ID-ভিত্তিক)
      // Form থেকে আসা selectedQuestionIds অথবা ম্যানুয়ালি সিলেক্ট করা আইডিগুলো ব্যবহার করবো
      const targetIds = newQuiz.selectedQuestionIds && newQuiz.selectedQuestionIds.length > 0 
        ? newQuiz.selectedQuestionIds 
        : manualSelectedIds;

      if (targetIds.length > 0) {
        // শুধুমাত্র সেই আইডিগুলো নিবো যা ডাটাবেসে আছে
        finalSelectedQs = questions.filter(q => targetIds.includes(q.id));
      } 
      else {
        // ২. যদি কোনো আইডি সিলেক্ট করা না থাকে, তবেই অটো পুল তৈরি হবে 
        // কিন্তু এটিও অবশ্যই ক্লাস এবং সাবজেক্ট ফিল্টার মেনে চলবে
        let pool = questions.filter(q => 
          q.classId === newQuiz.classId && 
          q.subjectId === newQuiz.subjectId
        );

        if (newQuiz.chapterIds && newQuiz.chapterIds.length > 0) {
          pool = pool.filter(q => newQuiz.chapterIds.includes(q.chapterId));
        }

        // র্যান্ডমলি প্রয়োজনীয় সংখ্যক প্রশ্ন নেওয়া
        finalSelectedQs = pool.sort(() => 0.5 - Math.random()).slice(0, newQuiz.qCount);
      }

      // ৩. ভ্যালিডেশন: কোনো প্রশ্ন পাওয়া না গেলে থামিয়ে দিবে
      if (finalSelectedQs.length === 0) {
        alert("Error: No valid questions found! Please select types or questions correctly.");
        setLoading(false);
        return;
      }

      // ৪. স্যানিটাইজেশন (টাইপ অনুযায়ী অপশন ক্লিয়ার করা)
      const sanitizedQuestions = finalSelectedQs.map(q => {
        const type = String(q.type || "").toUpperCase();
        // টাইপ যদি ইনপুট ভিত্তিক হয় তবে অপশন থাকবে না
        const isInputType = type.includes('SHORT') || type.includes('GAP') || type.includes('FILL');
        return {
          ...q,
          options: isInputType ? [] : (q.options || [])
        };
      });

      const quizData = {
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        title: newQuiz.title,
        teacherId: activeTeacher?.id,
        teacherName: activeTeacher?.name,
        classId: newQuiz.classId,
        subjectId: newQuiz.subjectId,
        questions: sanitizedQuestions,
        attempts: [], 
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        config: { 
          totalTime: newQuiz.time, 
          totalMarks: sanitizedQuestions.length, 
          passingMarks: Math.ceil(sanitizedQuestions.length * 0.4) 
        }
      };

      await addDoc(collection(db, "quizzes"), quizData);
      
      alert(`Quiz Created Successfully! Code: ${quizData.code}`);
      setView('LIST');
      
      // ৫. ফর্ম রিসেট
      setNewQuiz({ 
        title: '', classId: '', subjectId: '', chapterIds: [], 
        qCount: 10, time: 30, mode: 'AUTO', typeCounts: {}, selectedQuestionIds: [] 
      });
      setManualSelectedIds([]);
    } catch (err) {
      console.error("Launch Error:", err);
      alert("Failed to create quiz! Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'LOGIN') {
    return (
      <TeacherLogin 
        teachers={teachers} activeTeacher={activeTeacher} setActiveTeacher={setActiveTeacher} 
        pinInput={pinInput} setPinInput={setPinInput} handleLogin={handleLoginSubmit} 
        loginError={loginError} onBack={onBack} t={t} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 p-4 font-['Hind_Siliguri']">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-5">
              <button onClick={() => { setView('LIST'); setSelectedQuiz(null); }} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm font-bold">←</button>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Faculty <span className="text-indigo-600">Portal</span></h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Active Teacher: {activeTeacher?.name}</p>
              </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setView('CREATE')} className="bg-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black shadow-lg hover:bg-black transition-all uppercase text-[10px] tracking-widest">Create New Quiz</button>
          </div>
        </div>

        {view === 'LIST' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
            {firebaseQuizzes.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                 <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No quizzes created yet</p>
              </div>
            ) : (
              firebaseQuizzes.map(quiz => (
                <div key={quiz.id} className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm hover:shadow-xl transition-all relative group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Code: {quiz.code}</span>
                    <span className="text-slate-300 font-black text-[10px] uppercase">Attempts: {quiz.attempts?.length || 0}</span>
                  </div>
                  <h3 className="font-black text-xl text-slate-800 mb-8 h-14 overflow-hidden">{quiz.title}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedQuiz(quiz); setView('REPORT'); }} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Results</button>
                    <button onClick={() => { setSelectedQuiz(quiz); setView('PAPER'); }} className="px-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">View</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'CREATE' && (
          <QuizCreateForm 
            newQuiz={newQuiz} setNewQuiz={setNewQuiz} classes={classes} subjects={subjects} chapters={chapters} 
            questions={questions} manualSelectedIds={manualSelectedIds} setManualSelectedIds={setManualSelectedIds} 
            aiLoading={loading} onSubmit={handleLaunch} onCancel={() => setView('LIST')} 
          />
        )}

        {view === 'REPORT' && selectedQuiz && (
          <QuizAnalytics 
            selectedQuiz={selectedQuiz} reportRef={reportRef} 
            onBack={() => setView('LIST')} onDownload={() => {}} 
            setViewingAttempt={setViewingAttempt}
          />
        )}

        {view === 'PAPER' && selectedQuiz && (
          <QuestionPaperView 
            selectedQuiz={selectedQuiz} classes={classes} subjects={subjects} branding={{name: 'EduQuiz Pro', motto: '', address: ''}} 
            showAnswers={showAnswers} setShowAnswers={setShowAnswers} onDownload={() => {}} paperRef={paperRef} onBack={() => setView('LIST')} 
          />
        )}

        {viewingAttempt && selectedQuiz && (
          <StudentTranscriptModal 
            attempt={viewingAttempt}
            quiz={selectedQuiz}
            onClose={() => setViewingAttempt(null)}
            getRankInfo={getRankInfo}
          />
        )}
      </div>
    </div>
  );
};

export default TeacherPanel;

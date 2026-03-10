import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { Quiz, Teacher, QuizAttempt } from '../types';

// Firebase
import { db } from '../firebase';
import { collection, collectionGroup, addDoc, onSnapshot, query, where, orderBy, getDocs, serverTimestamp, updateDoc, doc } from "firebase/firestore";

// Sub-components
import { TeacherLogin } from './teacher/TeacherLogin';
import { QuizCreateForm } from './teacher/QuizCreateForm';
import { QuizAnalytics } from './teacher/QuizAnalytics';
import { QuestionPaperView } from './teacher/QuestionPaperView';
import { StudentTranscriptModal } from './teacher/StudentTranscriptModal';

interface TeacherPanelProps {
  onBack: () => void;
  loggedInTeacher?: Teacher | null;
  onLoginSuccess?: (teacher: Teacher) => void; // App.tsx state update এর জন্য
}

const TeacherPanel: React.FC<TeacherPanelProps> = ({ onBack, loggedInTeacher, onLoginSuccess }) => {
  const { classes, subjects, chapters, questions, teachers, t } = useApp();

  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(loggedInTeacher || null);
  const [view, setView] = useState<'LOGIN' | 'LIST' | 'CREATE' | 'REPORT' | 'PAPER'>(
    loggedInTeacher ? 'LIST' : 'LOGIN'
  );

  const [firebaseQuizzes, setFirebaseQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [viewingAttempt, setViewingAttempt] = useState<QuizAttempt | null>(null);

  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (loggedInTeacher) {
      setActiveTeacher(loggedInTeacher);
      setView('LIST');
    }
  }, [loggedInTeacher]);

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
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // ✅ প্রতিটা quiz এর attempts subcollection থেকে load করো
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const quiz = { id: d.id, ...d.data(), attempts: [] as any[] };
          const attSnap = await getDocs(
            query(collection(db, 'quizzes', d.id, 'attempts'), orderBy('score', 'desc'))
          );
          quiz.attempts = attSnap.docs.map(a => ({ id: a.id, ...a.data() }));
          return quiz;
        })
      ) as Quiz[];

      const sorted = list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setFirebaseQuizzes(sorted);
      if (selectedQuiz) {
        const updated = sorted.find(qz => qz.id === selectedQuiz.id);
        if (updated) setSelectedQuiz(updated);
      }
    });
    return () => unsubscribe();
  }, [activeTeacher, selectedQuiz?.id]);

  // ── Session validation — অন্য কেউ login করলে kick out ──
  useEffect(() => {
    if (!activeTeacher || view === 'LOGIN') return;
    const storedToken = sessionStorage.getItem('teacher_session_token');
    if (!storedToken) return;

    const unsub = onSnapshot(doc(db, 'teachers', activeTeacher.id), (snap) => {
      const data = snap.data();
      if (!data) return;
      // Firebase এর token আর browser এর token মিলছে না → অন্য কেউ login করেছে
      if (data.sessionToken && data.sessionToken !== storedToken) {
        alert('⚠️ আপনার account অন্য একটি device থেকে login করা হয়েছে। Security এর জন্য logout হচ্ছে।');
        sessionStorage.removeItem('teacher_session_token');
        sessionStorage.removeItem('teacher_session_id');
        setView('LOGIN');
        setActiveTeacher(null);
      }
    });
    return () => unsub();
  }, [activeTeacher, view]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const foundTeacher = teachers.find(t => t.id === activeTeacher?.id);
    if (foundTeacher && String(foundTeacher.pin).trim() === String(pinInput).trim()) {

      // ── Session tracking ──────────────────────────────────
      const newToken  = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const deviceInfo = navigator.userAgent.substring(0, 80);
      const loginAt    = new Date().toISOString();

      // আগে active session ছিল কিনা — থাকলে Admin কে alert
      if (foundTeacher.sessionToken && foundTeacher.lastLoginAt) {
        await addDoc(collection(db, 'securityAlerts'), {
          type:        'DUPLICATE_LOGIN',
          teacherId:   foundTeacher.id,
          teacherName: foundTeacher.name,
          newDevice:   deviceInfo,
          prevLoginAt: foundTeacher.lastLoginAt,
          detectedAt:  loginAt,
          resolved:    false,
        });
      }

      // নতুন session Firebase এ save
      await updateDoc(doc(db, 'teachers', foundTeacher.id), {
        sessionToken: newToken,
        lastLoginAt:  loginAt,
        lastDevice:   deviceInfo,
      });

      // Browser এ token store
      sessionStorage.setItem('teacher_session_token', newToken);
      sessionStorage.setItem('teacher_session_id',    foundTeacher.id);

      setView('LIST');
      setLoginError(false);
      if (onLoginSuccess) onLoginSuccess(foundTeacher);
    } else {
      setLoginError(true);
      setPinInput('');
    }
  };

  const handleLaunch = async () => {
    if (!newQuiz.title || !newQuiz.classId || !newQuiz.subjectId) {
      return alert("Please fill all required fields!");
    }

    setLoading(true);

    try {
      let finalSelectedQs: any[] = [];
      const targetIds = newQuiz.selectedQuestionIds.length > 0
        ? newQuiz.selectedQuestionIds
        : manualSelectedIds;

      if (targetIds.length > 0) {
        finalSelectedQs = questions.filter(q => targetIds.includes(q.id));
      } else {
        let pool = questions.filter(q =>
          q.classId === newQuiz.classId &&
          q.subjectId === newQuiz.subjectId
        );
        if (newQuiz.chapterIds?.length > 0) {
          pool = pool.filter(q => newQuiz.chapterIds.includes(q.chapterId));
        }
        finalSelectedQs = pool.sort(() => 0.5 - Math.random()).slice(0, newQuiz.qCount);
      }

      if (finalSelectedQs.length === 0) {
        alert("No questions found for the selected criteria!");
        setLoading(false);
        return;
      }

      // ── Sanitize ──────────────────────────────────────────
      const sanitizedQuestions = finalSelectedQs.map(q => {
        const type = String(q.type || "").toUpperCase();
        // Firebase এ "Standard MCQ" / "বর্ণমূলক প্রশ্ন" থাকলে MCQ তে normalize
        const normalizeQuizType = (t: string): string => {
          if (t.includes('MCQ') || t.includes('MULTIPLE') || t.includes('STANDARD')) return 'MCQ';
          if (t.includes('TRUE') || t.includes('FALSE') || t.includes('TF')) return 'TRUE_FALSE';
          if (t.includes('SHORT') || t.includes('বর্ণ') || t.includes('WRITTEN')) return 'SHORT_ANSWER';
          if (t.includes('FILL') || t.includes('GAP')) return 'FILL_GAP';
          return t;
        };
        const finalType = normalizeQuizType(type);
        const isInputType = finalType === 'FILL_IN_THE_GAP' || finalType === 'FILL_GAP' || finalType === 'SHORT_ANSWER';
        return {
          id: q.id,
          text: q.text || "",
          type: finalType,
          options: isInputType ? [] : (q.options || []),
          answer: q.answer || "",
          marks: Number(q.marks) || 1,
          classId: q.classId,
          subjectId: q.subjectId,
          chapterId: q.chapterId
        };
      });

      // ── Type অনুযায়ী sort — একই type একসাথে ──────────────
      // প্রথমবার যে type আসে সেটা আগে, পরেরটা পরে
      const typeOrder: Record<string, number> = {};
      let orderIdx = 0;
      sanitizedQuestions.forEach(q => {
        if (typeOrder[q.type] === undefined) typeOrder[q.type] = orderIdx++;
      });
      const sortedQuestions = [...sanitizedQuestions].sort((a, b) =>
        (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99)
      );

      const quizData = {
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        title: newQuiz.title,
        teacherId: activeTeacher?.id,
        teacherName: activeTeacher?.name,
        classId: newQuiz.classId,
        subjectId: newQuiz.subjectId,
        questions: sortedQuestions,
        // ✅ attempts field removed — subcollection এ store হবে
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        config: {
          totalTime: Number(newQuiz.time),
          totalMarks: sortedQuestions.reduce((sum, q) => sum + q.marks, 0),
          passingMarks: Math.ceil(sortedQuestions.length * 0.4)
        }
      };

      await addDoc(collection(db, "quizzes"), quizData);

      alert(`Quiz Created! Code: ${quizData.code}`);
      setView('LIST');
      setNewQuiz({
        title: '', classId: '', subjectId: '', chapterIds: [],
        qCount: 10, time: 30, mode: 'AUTO', typeCounts: {}, selectedQuestionIds: []
      });
      setManualSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert("Failed to create quiz!");
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = (code: string, quizId: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedQuizId(quizId);
      setTimeout(() => setCopiedQuizId(null), 2000);
    }).catch(() => alert('Failed to copy!'));
  };

  if (view === 'LOGIN') {
    return (
      <TeacherLogin
        teachers={teachers}
        activeTeacher={activeTeacher}
        setActiveTeacher={setActiveTeacher}
        pinInput={pinInput}
        setPinInput={setPinInput}
        handleLogin={handleLoginSubmit}
        loginError={loginError}
        onBack={onBack}
        t={t}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 p-4 font-['Hind_Siliguri']">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => { if (loggedInTeacher) onBack(); else setView('LIST'); }}
              className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm font-bold"
            >←</button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                Faculty <span className="text-indigo-600">Portal</span>
              </h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                Active Teacher: {activeTeacher?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setView('CREATE')}
              className="bg-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black shadow-lg hover:bg-black transition-all uppercase text-[10px] tracking-widest"
            >
              Create New Quiz
            </button>
            <button
              onClick={onBack}
              className="bg-slate-100 text-slate-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
            >
              Exit
            </button>
          </div>
        </div>

        {/* ── Quiz List ───────────────────────────────────────── */}
        {view === 'LIST' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
            {firebaseQuizzes.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No quizzes created yet</p>
              </div>
            ) : (
              firebaseQuizzes.map(quiz => (
                <div key={quiz.id}
                  className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm hover:shadow-xl transition-all relative group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">
                        Code: {quiz.code}
                      </span>
                      <button
                        onClick={() => copyCodeToClipboard(quiz.code!, quiz.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors relative"
                        title="Copy quiz code"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        {copiedQuizId === quiz.id && (
                          <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] px-1 py-0.5 rounded-md">Copied!</span>
                        )}
                      </button>
                    </div>
                    <span className="text-slate-300 font-black text-[10px] uppercase">
                      Attempts: {quiz.attempts?.length || 0}
                    </span>
                  </div>

                  <h3 className="font-black text-xl text-slate-800 mb-4 h-14 overflow-hidden">{quiz.title}</h3>

                  {/* Question type breakdown */}
                  {quiz.questions && quiz.questions.length > 0 && (() => {
                    const typeCounts: Record<string, number> = {};
                    quiz.questions.forEach((q: any) => {
                      const t = q.type || 'OTHER';
                      typeCounts[t] = (typeCounts[t] || 0) + 1;
                    });
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {Object.entries(typeCounts).map(([type, count]) => (
                          <span key={type} className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full uppercase">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedQuiz(quiz); setView('REPORT'); }}
                      className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Results
                    </button>
                    <button
                      onClick={() => { setSelectedQuiz(quiz); setView('PAPER'); }}
                      className="px-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'CREATE' && (
          <QuizCreateForm
            newQuiz={newQuiz}
            setNewQuiz={setNewQuiz}
            classes={classes}
            subjects={subjects}
            chapters={chapters}
            questions={questions}
            manualSelectedIds={manualSelectedIds}
            setManualSelectedIds={setManualSelectedIds}
            aiLoading={loading}
            onSubmit={handleLaunch}
            onCancel={() => setView('LIST')}
          />
        )}

        {view === 'REPORT' && selectedQuiz && (
          <QuizAnalytics
            selectedQuiz={selectedQuiz}
            reportRef={reportRef}
            onBack={() => setView('LIST')}
            onDownload={() => {}}
            setViewingAttempt={setViewingAttempt}
          />
        )}

        {view === 'PAPER' && selectedQuiz && (
          <QuestionPaperView
            selectedQuiz={selectedQuiz}
            classes={classes}
            subjects={subjects}
            branding={{ name: 'EduQuiz Pro', motto: '', address: '' }}
            showAnswers={showAnswers}
            setShowAnswers={setShowAnswers}
            onBack={() => setView('LIST')}
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

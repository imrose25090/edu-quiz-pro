import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, arrayUnion, addDoc, doc, increment, serverTimestamp } from "firebase/firestore";

import { StudentLogin } from './student/StudentLogin';
import { HelloKittyAssistant } from './HelloKittyAssistant';
import { QuizScreen } from './student/QuizScreen';
import { QuizResult } from './student/QuizResult';

interface StudentPanelProps {
  onBack: () => void;
  students: any[];
  onRegister: (name: string, pass: string) => void;
  onStudentLogin: (name: string, pass: string) => boolean;
}

const StudentPanel: React.FC<StudentPanelProps> = ({
  onBack, students, onRegister, onStudentLogin
}) => {
  const [isAuth,      setIsAuth]      = useState(false);
  const [studentName, setStudentName] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const cachedAuth = localStorage.getItem('student_auth') === 'true';
    const cachedName = (localStorage.getItem('student_name') || '').trim();
    if (!cachedAuth || !cachedName) { setAuthChecked(true); return; }
    getDocs(query(collection(db, 'students'), where('name', '==', cachedName)))
      .then(snap => {
        const student = snap.docs[0]?.data();
        if (!snap.empty && student && !student.isFrozen) {
          setIsAuth(true); setStudentName(cachedName);
        } else {
          localStorage.removeItem('student_auth');
          localStorage.removeItem('student_name');
        }
        setAuthChecked(true);
      })
      .catch(() => {
        localStorage.removeItem('student_auth');
        localStorage.removeItem('student_name');
        setAuthChecked(true);
      });
  }, []);

  const [stage,      setStage]      = useState<'LOGIN' | 'TAKING' | 'RESULT'>('LOGIN');
  const [quizCode,   setQuizCode]   = useState('');
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [timeLeft,   setTimeLeft]   = useState(0);
  const hasSubmitted = useRef(false);

  const [resData, setResData] = useState({
    score: 0, totalMarks: 0, timeSpent: 0,
    pointsEarned: 0, correctCount: 0, wrongCount: 0, bonusPoints: 0,
  });

  // ── Auth ──────────────────────────────────────────────────
  const handleProtectedLogin = async (name: string, pass: string) => {
    try {
      const q = query(collection(db, "students"), where("name", "==", name.trim()));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].data().isFrozen) {
        alert("Account Frozen!"); return false;
      }
      const success = onStudentLogin(name, pass);
      if (success) {
        setIsAuth(true); setStudentName(name);
        localStorage.setItem('student_auth', 'true');
        localStorage.setItem('student_name', name);
      }
      return success;
    } catch { return false; }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_auth');
    localStorage.removeItem('student_name');
    setIsAuth(false); setStudentName('');
    onBack();
  };

  const handleGoToStudentHome = () => {
    setStage('LOGIN'); setQuizCode('');
    setAnswers({}); setActiveQuiz(null);
    hasSubmitted.current = false;
  };

  // ── Start quiz ────────────────────────────────────────────
  const handleStart = async () => {
    const cleanCode = quizCode.trim().toUpperCase();
    if (!cleanCode) return alert("সঠিক কুইজ কোড দিন!");
    try {
      const q = query(collection(db, "quizzes"), where("code", "==", cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) return alert("ভুল কোড!");
      const docSnap = snap.docs[0];
      const data = docSnap.data();

      // ✅ subcollection থেকে check — এই student আগে দিয়েছে কিনা
      const attSnap = await getDocs(collection(db, "quizzes", docSnap.id, "attempts"));
      const myName = studentName.trim().toLowerCase();
      const alreadyPlayed = attSnap.docs.some(
        d => (d.data().studentName || "").trim().toLowerCase() === myName
      );
      if (alreadyPlayed) {
        alert("তুমি এই কুইজটি আগেই দিয়েছ! একই কুইজ দুইবার দেওয়া যাবে না।");
        return;
      }

      hasSubmitted.current = false;
      setActiveQuiz({ id: docSnap.id, ...data });
      setTimeLeft(Number(data.config?.totalTime || 10) * 60);
      setStage('TAKING');
    } catch { alert("সার্ভার সমস্যা!"); }
  };

  // ── Submit — useCallback so timer can always call latest version ──
  const activeQuizRef  = useRef<any>(null);
  const answersRef     = useRef<Record<string, string>>({});
  const studentNameRef = useRef('');
  const timeLeftRef    = useRef(0);

  // Keep refs in sync with state
  useEffect(() => { activeQuizRef.current  = activeQuiz;   }, [activeQuiz]);
  useEffect(() => { answersRef.current     = answers;      }, [answers]);
  useEffect(() => { studentNameRef.current = studentName;  }, [studentName]);
  useEffect(() => { timeLeftRef.current    = timeLeft;     }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    const quiz    = activeQuizRef.current;
    const ans     = answersRef.current;
    const name    = studentNameRef.current;
    const tLeft   = timeLeftRef.current;

    if (!quiz || hasSubmitted.current) return;
    hasSubmitted.current = true;

    let correctCount = 0, wrongCount = 0;
    quiz.questions.forEach((q: any) => {
      const userAns    = String(ans[q.id] || "").trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || "").trim().toLowerCase();
      if (userAns !== "") {
        if (userAns === correctAns) correctCount++;
        else wrongCount++;
      }
    });

    const totalPossibleMarks = quiz.questions.length;
    const timeSpent = Math.max(1, (Number(quiz.config?.totalTime || 10) * 60) - tLeft);

    // ✅ Scoring rules:
    // • প্রতি correct = +1 point
    // • প্রতি wrong   = -0.5 point  (min 0)
    // • 90%+ mark পেলে → প্রতি বাকি মিনিটে +1 bonus point
    const basePoints  = Math.max(0, correctCount * 1 - wrongCount * 0.5);
    const percentage  = totalPossibleMarks > 0 ? (correctCount / totalPossibleMarks) * 100 : 0;
    const bonusPoints = percentage >= 90 ? Math.floor(tLeft / 60) : 0;
    const finalPoints = basePoints + bonusPoints;

    const attemptData = {
      studentName:  name.trim(),
      score:        correctCount,
      totalMarks:   totalPossibleMarks,
      submittedAt:  new Date().toISOString(),
      timeSpent,    answers: { ...ans },
      earnedPoints: finalPoints,
      wrongAnswers: wrongCount, bonusPoints,
    };

    setResData({
      score: correctCount, totalMarks: totalPossibleMarks,
      timeSpent, pointsEarned: finalPoints,
      correctCount, wrongCount, bonusPoints,
    });

    try {
      // ✅ subcollection এ save করো — StudentLogin history এর সাথে match করে
      await addDoc(collection(db, "quizzes", quiz.id, "attempts"), {
        ...attemptData,
        createdAt: serverTimestamp(),
      });
      // ✅ main doc এ attempts array ও রাখো (leaderboard এর জন্য)
      await updateDoc(doc(db, "quizzes", quiz.id), { attempts: arrayUnion(attemptData) });
      const studentSnap = await getDocs(
        query(collection(db, "students"), where("name", "==", name.trim()))
      );
      if (!studentSnap.empty) {
        await updateDoc(doc(db, "students", studentSnap.docs[0].id), {
          totalPoints: increment(finalPoints), quizzesPlayed: increment(1),
        });
      }
      setActiveQuiz((prev: any) => ({
        ...prev, attempts: [...(prev.attempts || []), attemptData]
      }));
      setStage('RESULT');
    } catch (error) {
      console.error('[Submit Error]', error);
      hasSubmitted.current = false;
      alert("রেজাল্ট সেভ করতে সমস্যা হয়েছে!");
    }
  }, []); // ✅ empty deps — refs থেকে latest value পড়ে, stale closure নেই

  // ── Timer — setInterval একবারই চলে, ref দিয়ে timeLeft track করে ──
  useEffect(() => {
    if (stage !== 'TAKING') return;

    // ✅ FIX: সরাসরি ref থেকে countdown করো — state update এর delay নেই
    const timer = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);   // UI update

      if (timeLeftRef.current <= 0) {
        clearInterval(timer);
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, handleSubmit]); // ✅ handleSubmit stable (useCallback + empty deps)

  // ── Quiz time helpers ─────────────────────────────────────
  const isCritical = stage === 'TAKING' && timeLeft <= 30;
  const isLowTime  = stage === 'TAKING' && timeLeft <= 60 && !isCritical;
  const totalTime  = activeQuiz ? Number(activeQuiz.config?.totalTime || 10) * 60 : 600;

  if (!authChecked) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri']">
      {stage === 'LOGIN' && (
        <StudentLogin
          quizCode={quizCode}       setQuizCode={setQuizCode}
          studentName={studentName} setStudentName={val => { if (!isAuth) setStudentName(val); }}
          onStart={handleStart}     onBack={handleLogout}
          students={students}       onRegister={onRegister}
          onStudentLogin={handleProtectedLogin}
          isAlreadyAuth={isAuth}
        />
      )}
      {stage === 'TAKING' && activeQuiz && (
        <QuizScreen
          activeQuiz={activeQuiz} timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          answers={answers}       setAnswers={setAnswers}
          onSubmit={handleSubmit}
          totalTime={totalTime}
        />
      )}
      {stage === 'RESULT' && activeQuiz && (
        <QuizResult
          score={resData.score}         totalMarks={resData.totalMarks}
          timeSpent={resData.timeSpent} studentName={studentName}
          onBack={handleGoToStudentHome} leaderboard={activeQuiz.attempts}
          earnedPoints={resData.pointsEarned} wrongCount={resData.wrongCount}
          bonusPoints={resData.bonusPoints}
        />
      )}
      <HelloKittyAssistant
        page={stage === 'LOGIN' ? (isAuth ? 'dashboard' : 'home') : stage === 'TAKING' ? 'quiz' : 'result'}
        timeLeft={timeLeft}       totalTime={totalTime}
        answeredCount={Object.keys(answers).length}
        totalCount={activeQuiz?.questions?.length || 1}
        isCritical={isCritical}   isLowTime={isLowTime}
        studentName={studentName} quizTitle={activeQuiz?.title || ''}
        score={stage === 'RESULT' ? resData.score : undefined}
        totalMarks={stage === 'RESULT' ? resData.totalMarks : undefined}
      />
    </div>
  );
};

export default StudentPanel;

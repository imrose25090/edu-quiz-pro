import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc, increment } from "firebase/firestore";

import { StudentLogin } from './student/StudentLogin';
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
  const [isAuth,      setIsAuth]      = useState(() => localStorage.getItem('student_auth') === 'true');
  const [studentName, setStudentName] = useState(() => localStorage.getItem('student_name') || '');

  const [stage,      setStage]      = useState<'LOGIN' | 'TAKING' | 'RESULT'>('LOGIN');
  const [quizCode,   setQuizCode]   = useState('');
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [timeLeft,   setTimeLeft]   = useState(0);

  // submit lock — একবারের বেশি submit হবে না
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
        setIsAuth(true);
        setStudentName(name);
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
    setStage('LOGIN');
    setQuizCode('');
    setAnswers({});
    setActiveQuiz(null);
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
      hasSubmitted.current = false;
      setActiveQuiz({ id: docSnap.id, ...data });
      setTimeLeft(Number(data.config?.totalTime || 10) * 60);
      setStage('TAKING');
    } catch { alert("সার্ভার সমস্যা!"); }
  };

  // ── Timer — শুধু TAKING stage এ চলবে, timeLeft > 0 হলে ─
  useEffect(() => {
    if (stage !== 'TAKING') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]); // ← শুধু stage change এ re-run, timeLeft এ না

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!activeQuiz || hasSubmitted.current) return;
    hasSubmitted.current = true;

    let correctCount = 0;
    let wrongCount   = 0;

    activeQuiz.questions.forEach((q: any) => {
      const userAns    = String(answers[q.id] || "").trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || "").trim().toLowerCase();
      if (userAns !== "") {
        if (userAns === correctAns) correctCount++;
        else wrongCount++;
      }
    });

    // Points: correct=1, wrong=-0.5, min 0
    const basePoints  = Math.max(0, correctCount - wrongCount * 0.5);
    // Bonus: প্রতি পূর্ণ মিনিট বাকি থাকলে 1 point
    const bonusPoints = Math.floor(timeLeft / 60);
    const finalPoints = basePoints + bonusPoints;

    const totalPossibleMarks = activeQuiz.questions.length;
    const timeSpent = Math.max(1, (Number(activeQuiz.config?.totalTime || 10) * 60) - timeLeft);

    const attemptData = {
      studentName:  studentName.trim(),
      score:        correctCount,
      totalMarks:   totalPossibleMarks,
      submittedAt:  new Date().toISOString(),
      timeSpent,
      answers:      { ...answers },
      earnedPoints: finalPoints,
      wrongAnswers: wrongCount,
      bonusPoints,
    };

    setResData({
      score: correctCount, totalMarks: totalPossibleMarks,
      timeSpent, pointsEarned: finalPoints,
      correctCount, wrongCount, bonusPoints,
    });

    try {
      // Quiz এ attempt save
      await updateDoc(doc(db, "quizzes", activeQuiz.id), {
        attempts: arrayUnion(attemptData)
      });

      // Student এর total points update
      const studentSnap = await getDocs(
        query(collection(db, "students"), where("name", "==", studentName.trim()))
      );

      if (!studentSnap.empty) {
        await updateDoc(doc(db, "students", studentSnap.docs[0].id), {
          totalPoints:  increment(finalPoints),
          quizzesPlayed: increment(1),
        });
        console.log(`[Points] ${studentName} → +${finalPoints} (base: ${basePoints}, bonus: ${bonusPoints})`);
      } else {
        console.warn('[Points] Student not found in DB:', studentName);
      }

      setActiveQuiz((prev: any) => ({
        ...prev,
        attempts: [...(prev.attempts || []), attemptData]
      }));

      setStage('RESULT');
    } catch (error) {
      console.error('[Submit Error]', error);
      hasSubmitted.current = false; // retry allow
      alert("রেজাল্ট সেভ করতে সমস্যা হয়েছে!");
    }
  };

  // ── Render ─────────────────────────────────────────────────
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
          answers={answers}       setAnswers={setAnswers}
          onSubmit={handleSubmit}
        />
      )}

      {stage === 'RESULT' && activeQuiz && (
        <QuizResult
          score={resData.score}
          totalMarks={resData.totalMarks}
          timeSpent={resData.timeSpent}
          studentName={studentName}
          onBack={handleGoToStudentHome}
          leaderboard={activeQuiz.attempts}
          earnedPoints={resData.pointsEarned}
          wrongCount={resData.wrongCount}
          bonusPoints={resData.bonusPoints}
        />
      )}
    </div>
  );
};

export default StudentPanel;

import React, { useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc, increment } from "firebase/firestore";

import { StudentLogin } from './student/StudentLogin';
import { QuizScreen }   from './student/QuizScreen';
import { QuizResult }   from './student/QuizResult';

interface StudentPanelProps {
  onBack: () => void;
  students: any[];
  onRegister: (name: string, pass: string) => void;
  onStudentLogin: (name: string, pass: string) => boolean;
  loggedInStudent?: any | null;
}

const StudentPanel: React.FC<StudentPanelProps> = ({
  onBack,
  students,
  onRegister,
  onStudentLogin,
  loggedInStudent,
}) => {
  const [isAuth,      setIsAuth]      = useState(() =>
    loggedInStudent ? true : localStorage.getItem('student_auth') === 'true'
  );
  const [studentName, setStudentName] = useState(() =>
    loggedInStudent?.name || localStorage.getItem('student_name') || ''
  );

  const [stage,      setStage]      = useState<'LOGIN' | 'TAKING' | 'RESULT'>('LOGIN');
  const [quizCode,   setQuizCode]   = useState('');
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [timeLeft,   setTimeLeft]   = useState(0);

  const [resData, setResData] = useState({
    score: 0, totalMarks: 0, timeSpent: 0,
    pointsEarned: 0, correctCount: 0, wrongCount: 0,
  });

  // ✅ Double-submit guard
  const submitLock = useRef(false);

  /* ─── Name change (only when not authenticated) ─────── */
  const handleNameChange = (val: string) => {
    if (!isAuth) setStudentName(val);
  };

  /* ─── Login ──────────────────────────────────────────── */
  const handleProtectedLogin = async (name: string, pass: string) => {
    try {
      const q    = query(collection(db, 'students'), where('name', '==', name.trim()));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].data().isFrozen) {
        alert('Account Frozen!');
        return false;
      }
      const success = onStudentLogin(name, pass);
      if (success) {
        setIsAuth(true);
        setStudentName(name);
        localStorage.setItem('student_auth', 'true');
        localStorage.setItem('student_name', name);
      }
      return success;
    } catch {
      return false;
    }
  };

  /* ─── Logout ─────────────────────────────────────────── */
  const handleLogout = () => {
    localStorage.removeItem('student_auth');
    localStorage.removeItem('student_name');
    setIsAuth(false);
    setStudentName('');
    onBack();
  };

  /* ─── Back to home after result ──────────────────────── */
  const handleGoToStudentHome = () => {
    setStage('LOGIN');
    setQuizCode('');
    setAnswers({});
    setActiveQuiz(null);
    submitLock.current = false;
  };

  /* ─── Start quiz ─────────────────────────────────────── */
  const handleStart = async () => {
    const cleanCode = quizCode.trim().toUpperCase();
    if (!cleanCode) return alert('সঠিক কুইজ কোড দিন!');
    try {
      const q    = query(collection(db, 'quizzes'), where('code', '==', cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) return alert('ভুল কোড!');
      const docSnap = snap.docs[0];
      const data    = docSnap.data();
      submitLock.current = false;
      setActiveQuiz({ id: docSnap.id, ...data });
      setTimeLeft(Number(data.config?.totalTime || 10) * 60);
      setStage('TAKING');
    } catch {
      alert('সার্ভার সমস্যা!');
    }
  };

  /* ─── Submit ─────────────────────────────────────────── */
  // ✅ Timer handled entirely inside QuizScreen — NO duplicate timer here
  // ✅ Points: +1 correct, -0.5 wrong, never negative
  const handleSubmit = async () => {
    if (submitLock.current || !activeQuiz) return;
    submitLock.current = true;

    let correctCount = 0;
    let wrongCount   = 0;

    activeQuiz.questions.forEach((q: any) => {
      const userAns    = String(answers[q.id] || '').trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || '').trim().toLowerCase();
      if (userAns !== '') {
        userAns === correctAns ? correctCount++ : wrongCount++;
      }
    });

    // ✅ +1 সঠিক, -0.5 ভুল, 0 এর নিচে যাবে না
    const finalPoints        = Math.max(0, correctCount * 1 - wrongCount * 0.5);
    const totalPossibleMarks = activeQuiz.questions.length;
    const timeSpent          = Math.max(1, (Number(activeQuiz.config?.totalTime || 10) * 60) - timeLeft);

    const attemptData = {
      studentName:  studentName.trim(),
      score:        correctCount,
      totalMarks:   totalPossibleMarks,
      submittedAt:  new Date().toISOString(),
      timeSpent,
      answers:      { ...answers },
      earnedPoints: finalPoints,
      wrongAnswers: wrongCount,
    };

    setResData({
      score:        correctCount,
      totalMarks:   totalPossibleMarks,
      timeSpent,
      pointsEarned: finalPoints,
      correctCount,
      wrongCount,
    });

    try {
      // ১. কুইজে attempt যোগ
      await updateDoc(doc(db, 'quizzes', activeQuiz.id), {
        attempts: arrayUnion(attemptData),
      });

      // ২. Student-এর total points আপডেট
      const studentQ    = query(collection(db, 'students'), where('name', '==', studentName.trim()));
      const studentSnap = await getDocs(studentQ);
      if (!studentSnap.empty) {
        await updateDoc(doc(db, 'students', studentSnap.docs[0].id), {
          totalPoints:   increment(finalPoints),
          quizzesPlayed: increment(1),
        });
      }

      setActiveQuiz((prev: any) => ({
        ...prev,
        attempts: [...(prev.attempts || []), attemptData],
      }));

      setStage('RESULT');
    } catch (err) {
      console.error(err);
      submitLock.current = false;
      alert('রেজাল্ট সেভ করতে সমস্যা হয়েছে!');
    }
  };

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri']">

      {/* LOGIN / HOME — StudentLogin handles both login form & logged-in dashboard */}
      {stage === 'LOGIN' && (
        <StudentLogin
          quizCode={quizCode}       setQuizCode={setQuizCode}
          studentName={studentName} setStudentName={handleNameChange}
          onStart={handleStart}     onBack={handleLogout}
          students={students}       onRegister={onRegister}
          onStudentLogin={handleProtectedLogin}
          isAlreadyAuth={isAuth}
        />
      )}

      {/* TAKING — ✅ setTimeLeft passed; timer lives inside QuizScreen only */}
      {stage === 'TAKING' && activeQuiz && (
        <QuizScreen
          activeQuiz={activeQuiz}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          answers={answers}
          setAnswers={setAnswers}
          onSubmit={handleSubmit}
        />
      )}

      {/* RESULT */}
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
        />
      )}
    </div>
  );
};

export default StudentPanel;

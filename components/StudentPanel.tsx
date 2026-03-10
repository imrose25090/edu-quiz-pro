import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, getDocs, addDoc,
  updateDoc, doc, increment, onSnapshot, orderBy
} from "firebase/firestore";

import { StudentLogin } from './student/StudentLogin';
import { QuizScreen } from './student/QuizScreen';
import { QuizResult } from './student/QuizResult';

interface StudentPanelProps {
  onBack: () => void;
  students: any[];
  onRegister?: (name: string, pass: string) => void;
  onStudentLogin?: (name: string, pass: string) => boolean;
  loggedInStudent?: any | null;
}

const StudentPanel: React.FC<StudentPanelProps> = ({
  onBack, students, onRegister, onStudentLogin, loggedInStudent
}) => {
  const [isAuth, setIsAuth] = useState(() => {
    if (loggedInStudent) return true;
    return localStorage.getItem('student_auth') === 'true';
  });
  const [studentName, setStudentName] = useState(() => {
    if (loggedInStudent) return loggedInStudent.name;
    return localStorage.getItem('student_name') || '';
  });

  useEffect(() => {
    if (loggedInStudent) { setIsAuth(true); setStudentName(loggedInStudent.name); }
  }, [loggedInStudent]);

  const [stage,      setStage]      = useState<'LOGIN' | 'TAKING' | 'RESULT'>('LOGIN');
  const [quizCode,   setQuizCode]   = useState('');
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [timeLeft,   setTimeLeft]   = useState(0);
  // leaderboard — subcollection থেকে real-time
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const hasSubmitted   = useRef(false);
  const timeLeftRef    = useRef(0);
  const answersRef     = useRef<Record<string, string>>({});
  const activeQuizRef  = useRef<any>(null);
  const studentNameRef = useRef(studentName);

  useEffect(() => { timeLeftRef.current    = timeLeft;    }, [timeLeft]);
  useEffect(() => { answersRef.current     = answers;     }, [answers]);
  useEffect(() => { activeQuizRef.current  = activeQuiz;  }, [activeQuiz]);
  useEffect(() => { studentNameRef.current = studentName; }, [studentName]);

  const [resData, setResData] = useState({
    score: 0, totalMarks: 0, timeSpent: 0,
    pointsEarned: 0, correctCount: 0, wrongCount: 0, bonusPoints: 0,
  });

  // ── leaderboard real-time listener (RESULT stage এ) ───────
  useEffect(() => {
    if (stage !== 'RESULT' || !activeQuiz?.id) return;
    const unsub = onSnapshot(
      query(
        collection(db, 'quizzes', activeQuiz.id, 'attempts'),
        orderBy('score', 'desc')
      ),
      snap => setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [stage, activeQuiz?.id]);

  // ── Auth ──────────────────────────────────────────────────
  const handleProtectedLogin = async (name: string, pass: string) => {
    try {
      const q = query(collection(db, "students"), where("name", "==", name.trim()));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].data().isFrozen) {
        alert("Account Frozen!"); return false;
      }
      const success = onStudentLogin ? onStudentLogin(name, pass) : false;
      if (success) {
        setIsAuth(true); setStudentName(name);
        localStorage.setItem('student_auth', 'true');
        localStorage.setItem('student_name', name);
      }
      return success;
    } catch { return false; }
  };

  const handleLogout = () => {
    if (!loggedInStudent) {
      localStorage.removeItem('student_auth');
      localStorage.removeItem('student_name');
    }
    setIsAuth(false); setStudentName(''); onBack();
  };

  const handleGoToStudentHome = () => {
    setStage('LOGIN'); setQuizCode('');
    setAnswers({}); setActiveQuiz(null);
    setLeaderboard([]);
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

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!activeQuizRef.current || hasSubmitted.current) return;
    hasSubmitted.current = true;

    const quiz        = activeQuizRef.current;
    const curAnswers  = answersRef.current;
    const curTimeLeft = timeLeftRef.current;
    const curName     = studentNameRef.current;

    let correctCount = 0;
    let wrongCount   = 0;
    quiz.questions.forEach((q: any) => {
      const userAns    = String(curAnswers[q.id] || "").trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || "").trim().toLowerCase();
      if (userAns !== "") {
        if (userAns === correctAns) correctCount++;
        else wrongCount++;
      }
    });

    const basePoints  = Math.max(0, correctCount - wrongCount * 0.5);
    const bonusPoints = Math.floor(curTimeLeft / 60);
    const finalPoints = basePoints + bonusPoints;
    const totalPossibleMarks = quiz.questions.length;
    const timeSpent = Math.max(1, (Number(quiz.config?.totalTime || 10) * 60) - curTimeLeft);

    const attemptData = {
      studentName:  curName.trim(),
      score:        correctCount,
      totalMarks:   totalPossibleMarks,
      submittedAt:  new Date().toISOString(),
      timeSpent,
      answers:      { ...curAnswers },
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
      // ✅ arrayUnion এর বদলে subcollection এ আলাদা document
      await addDoc(
        collection(db, 'quizzes', quiz.id, 'attempts'),
        attemptData
      );

      if (!loggedInStudent) {
        const studentSnap = await getDocs(
          query(collection(db, "students"), where("name", "==", curName.trim()))
        );
        if (!studentSnap.empty) {
          await updateDoc(doc(db, "students", studentSnap.docs[0].id), {
            totalPoints:   increment(finalPoints),
            quizzesPlayed: increment(1),
          });
          console.log(`[Points] ${curName} → +${finalPoints}`);
        }
      } else {
        console.log('[Admin Impersonation] Points not saved');
      }

      setStage('RESULT');
    } catch (error) {
      console.error('[Submit Error]', error);
      hasSubmitted.current = false;
      alert("রেজাল্ট সেভ করতে সমস্যা হয়েছে!");
    }
  }, [loggedInStudent]);

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
          loggedInStudent={loggedInStudent}
        />
      )}

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

      {stage === 'RESULT' && activeQuiz && (
        <QuizResult
          score={resData.score}
          totalMarks={resData.totalMarks}
          timeSpent={resData.timeSpent}
          studentName={studentName}
          onBack={handleGoToStudentHome}
          leaderboard={leaderboard}         // ✅ subcollection থেকে real-time
          earnedPoints={resData.pointsEarned}
          wrongCount={resData.wrongCount}
          bonusPoints={resData.bonusPoints}
          activeQuiz={activeQuiz}
          submittedAnswers={answersRef.current}
        />
      )}
    </div>
  );
};

export default StudentPanel;

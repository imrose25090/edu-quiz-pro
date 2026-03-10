import React, { useState, useEffect } from 'react';
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
  onBack, 
  students, 
  onRegister, 
  onStudentLogin 
}) => {
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('student_auth') === 'true');
  const [studentName, setStudentName] = useState(() => localStorage.getItem('student_name') || '');

  const [stage, setStage] = useState<'LOGIN' | 'TAKING' | 'RESULT'>('LOGIN');
  const [quizCode, setQuizCode] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [resData, setResData] = useState({
    score: 0,
    totalMarks: 0,
    timeSpent: 0,
    pointsEarned: 0,
    correctCount: 0,
    wrongCount: 0
  });

  const handleNameChange = (val: string) => {
    if (!isAuth) setStudentName(val);
  };

  const handleProtectedLogin = async (name: string, pass: string) => {
    try {
      const q = query(collection(db, "students"), where("name", "==", name.trim()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const studentData = snap.docs[0].data();
        if (studentData.isFrozen) {
          alert(`Account Frozen!`);
          return false;
        }
      }

      const success = onStudentLogin(name, pass);
      if (success) {
        setIsAuth(true);
        setStudentName(name);
        localStorage.setItem('student_auth', 'true');
        localStorage.setItem('student_name', name);
      }
      return success;
    } catch (error) {
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_auth');
    localStorage.removeItem('student_name');
    setIsAuth(false);
    setStudentName('');
    onBack();
  };

  const handleGoToStudentHome = () => {
    setStage('LOGIN');
    setQuizCode('');
    setAnswers({});
    setActiveQuiz(null);
  };

  const handleStart = async () => {
    const cleanCode = quizCode.trim().toUpperCase();
    if (!cleanCode) return alert("সঠিক কুইজ কোড দিন!");
    try {
      const q = query(collection(db, "quizzes"), where("code", "==", cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) return alert("ভুল কোড!");
      const docSnap = snap.docs[0];
      const data = docSnap.data();
      setActiveQuiz({ id: docSnap.id, ...data });
      setTimeLeft(Number(data.config?.totalTime || 10) * 60);
      setStage('TAKING');
    } catch (error) {
      alert("সার্ভার সমস্যা!");
    }
  };

  useEffect(() => {
    let timer: any;
    if (stage === 'TAKING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && stage === 'TAKING') {
      handleSubmit(); 
    }
    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  // ✅ Negative Marking লজিক সহ handleSubmit
  const handleSubmit = async () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    let wrongCount = 0;

    activeQuiz.questions.forEach((q: any) => {
      const userAns = String(answers[q.id] || "").trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || "").trim().toLowerCase();
      
      if (userAns !== "") {
        if (userAns === correctAns) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    // পয়েন্ট ক্যালকুলেশন: (সঠিক * ১) - (ভুল * ০.৫)
    const rawPoints = (correctCount * 1) - (wrongCount * 0.5);
    // পয়েন্ট যেন মাইনাস না হয় সেজন্য ০ এর নিচে গেলে ০ করে দেওয়া (ঐচ্ছিক)
    const finalPoints = Math.max(0, rawPoints);

    const totalPossibleMarks = activeQuiz.questions.length;
    const timeSpent = Math.max(1, (Number(activeQuiz.config?.totalTime || 10) * 60) - timeLeft);

    const attemptData = {
      studentName: studentName.trim(),
      score: correctCount, // লিডারবোর্ডের জন্য শুধু সঠিক সংখ্যা
      totalMarks: totalPossibleMarks,
      submittedAt: new Date().toISOString(),
      timeSpent: timeSpent,
      answers: { ...answers },
      earnedPoints: finalPoints,
      wrongAnswers: wrongCount
    };

    setResData({
      score: correctCount,
      totalMarks: totalPossibleMarks,
      timeSpent: timeSpent,
      pointsEarned: finalPoints,
      correctCount: correctCount,
      wrongCount: wrongCount
    });

    try {
      // ১. কুইজ অ্যাটেম্পট আপডেট
      const quizRef = doc(db, "quizzes", activeQuiz.id);
      await updateDoc(quizRef, {
        attempts: arrayUnion(attemptData)
      });

      // ২. স্টুডেন্টের টোটাল পয়েন্ট আপডেট
      const studentQ = query(collection(db, "students"), where("name", "==", studentName.trim()));
      const studentSnap = await getDocs(studentQ);
      
      if (!studentSnap.empty) {
        const studentDocRef = doc(db, "students", studentSnap.docs[0].id);
        await updateDoc(studentDocRef, {
          totalPoints: increment(finalPoints),
          quizzesPlayed: increment(1)
        });
      }
      
      setActiveQuiz((prev: any) => ({
        ...prev,
        attempts: [...(prev.attempts || []), attemptData]
      }));
      
      setStage('RESULT');
    } catch (error) {
      console.error(error);
      alert("রেজাল্ট সেভ করতে সমস্যা হয়েছে!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri']">
      {stage === 'LOGIN' && (
        <StudentLogin 
          quizCode={quizCode} setQuizCode={setQuizCode}
          studentName={studentName} setStudentName={handleNameChange}
          onStart={handleStart} onBack={handleLogout} 
          students={students} onRegister={onRegister}
          onStudentLogin={handleProtectedLogin}
          isAlreadyAuth={isAuth} 
        />
      )}

      {stage === 'TAKING' && activeQuiz && (
        <QuizScreen 
          activeQuiz={activeQuiz} timeLeft={timeLeft}
          answers={answers} setAnswers={setAnswers}
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
          wrongCount={resData.wrongCount} // রেজাল্টে ভুল উত্তরের সংখ্যা দেখানো
        />
      )}
    </div>
  );
};

export default StudentPanel;

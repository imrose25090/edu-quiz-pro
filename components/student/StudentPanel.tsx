import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc, getDoc } from "firebase/firestore";

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
  // ১. localStorage থেকে আগের সেশন চেক করা
  const [isAuth, setIsAuth] = useState(() => {
    return localStorage.getItem('student_auth') === 'true';
  });
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('student_name') || '';
  });

  const [stage, setStage] = useState<'LOGIN' | 'TAKING' | 'RESULT'>('LOGIN');
  const [quizCode, setQuizCode] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [resData, setResData] = useState({
    score: 0,
    totalMarks: 0,
    timeSpent: 0,
    pointsEarned: 0
  });

  const handleNameChange = (val: string) => {
    if (!isAuth) {
      setStudentName(val);
    }
  };

  // ২. লগইন করার সময় ফ্রিজ বা স্ট্যাটাস চেক করা
  const handleProtectedLogin = async (name: string, pass: string) => {
    // ডাটাবেস থেকে স্টুডেন্টের লেটেস্ট স্ট্যাটাস আনা
    try {
      const q = query(collection(db, "students"), where("name", "==", name.trim()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const studentData = snap.docs[0].data();
        
        // ফ্রিজ চেক
        if (studentData.isFrozen) {
          let msg = "আপনার অ্যাকাউন্টটি ফ্রিজ করা হয়েছে।";
          if (studentData.frozenUntil) {
            msg += ` এটি ${new Date(studentData.frozenUntil).toLocaleDateString('bn-BD')} পর্যন্ত বন্ধ থাকবে।`;
          }
          alert(msg);
          return false;
        }

        // ডিলিট/ইনঅ্যাক্টিভ চেক
        if (studentData.status === 'inactive') {
          alert("আপনার অ্যাকাউন্টটি বর্তমানে ইন-অ্যাক্টিভ। এডমিনের সাথে যোগাযোগ করুন।");
          return false;
        }
      } else {
        // যদি রেজিস্ট্রেশন না থাকে তবে গ্লোবাল লগইন ট্রাই করবে
        const success = onStudentLogin(name, pass);
        if (success) {
          setIsAuth(true);
          setStudentName(name);
          localStorage.setItem('student_auth', 'true');
          localStorage.setItem('student_name', name);
        }
        return success;
      }

      // পাসওয়ার্ড ম্যাচিং (যদি লোকাল পাসওয়ার্ড হ্যান্ডেল করেন)
      const success = onStudentLogin(name, pass);
      if (success) {
        setIsAuth(true);
        setStudentName(name);
        localStorage.setItem('student_auth', 'true');
        localStorage.setItem('student_name', name);
      }
      return success;

    } catch (error) {
      console.error("Login Check Error:", error);
      return false;
    }
  };

  // ৩. লগআউট ফাংশন
  const handleLogout = () => {
    localStorage.removeItem('student_auth');
    localStorage.removeItem('student_name');
    setIsAuth(false);
    setStudentName('');
    onBack();
  };

  // ৪. কুইজ শেষ করে স্টুডেন্ট হোমে ফিরে যাওয়া
  const handleGoToStudentHome = () => {
    setStage('LOGIN');
    setQuizCode('');
    setAnswers({});
    setActiveQuiz(null);
  };

  const handleStart = async () => {
    const cleanCode = quizCode.trim().toUpperCase();
    if (!cleanCode) {
      alert("সঠিক কুইজ কোড দিন!");
      return;
    }

    try {
      const quizzesRef = collection(db, "quizzes");
      const q = query(quizzesRef, where("code", "==", cleanCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("ভুল কোড! কোনো পরীক্ষা পাওয়া যায়নি।");
        return;
      }

      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();

      setActiveQuiz({
        id: docSnap.id,
        ...data
      });

      const totalTime = Number(data.config?.totalTime || 10);
      setTimeLeft(totalTime * 60);
      setStage('TAKING');
    } catch (error) {
      console.error("Fetch Error:", error);
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

  const handleSubmit = async () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    activeQuiz.questions.forEach((q: any) => {
      const userAns = String(answers[q.id] || "").trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || "").trim().toLowerCase();
      
      // FILL_GAP এবং MCQ উভয়ের জন্য লজিক
      if (userAns !== "" && userAns === correctAns) {
        correctCount++;
      }
    });

    const totalPossibleMarks = activeQuiz.questions.length;
    const timeSpent = Math.max(1, (Number(activeQuiz.config?.totalTime || 10) * 60) - timeLeft);

    const attemptData = {
      studentName: studentName.trim(),
      score: correctCount,
      totalMarks: totalPossibleMarks,
      submittedAt: new Date().toISOString(),
      timeSpent: timeSpent,
      answers: { ...answers }
    };

    setResData({
      score: correctCount,
      totalMarks: totalPossibleMarks,
      timeSpent: timeSpent,
      pointsEarned: correctCount
    });

    try {
      const quizRef = doc(db, "quizzes", activeQuiz.id);
      await updateDoc(quizRef, {
        attempts: arrayUnion(attemptData)
      });
      
      setActiveQuiz((prev: any) => ({
        ...prev,
        attempts: [...(prev.attempts || []), attemptData]
      }));
      
      setStage('RESULT');
    } catch (error) {
      alert("রেজাল্ট সেভ করতে সমস্যা হয়েছে!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri']">
      {stage === 'LOGIN' && (
        <StudentLogin 
          quizCode={quizCode} 
          setQuizCode={setQuizCode}
          studentName={studentName} 
          setStudentName={handleNameChange}
          onStart={handleStart} 
          onBack={handleLogout} 
          students={students}
          onRegister={onRegister}
          onStudentLogin={handleProtectedLogin}
          isAlreadyAuth={isAuth} 
        />
      )}

      {stage === 'TAKING' && activeQuiz && (
        <QuizScreen 
          activeQuiz={activeQuiz} 
          timeLeft={timeLeft}
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
          leaderboard={activeQuiz.attempts} 
        />
      )}
    </div>
  );
};

export default StudentPanel;
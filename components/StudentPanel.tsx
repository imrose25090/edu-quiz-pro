import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc } from "firebase/firestore";

// সাব-কম্পোনেন্টস
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
  const [stage, setStage] = useState<'LOGIN' | 'DASHBOARD' | 'TAKING' | 'RESULT'>('LOGIN');
  const [quizCode, setQuizCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isAuth, setIsAuth] = useState(false); 
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [resData, setResData] = useState({
    score: 0,
    totalMarks: 0,
    timeSpent: 0,
    pointsEarned: 0
  });

  const resetToDashboard = () => {
    setStage('DASHBOARD');
    setQuizCode('');
    setActiveQuiz(null);
    setAnswers({});
    setTimeLeft(0);
  };

  const handleProtectedLogin = (name: string, pass: string) => {
    const success = onStudentLogin(name, pass);
    if (success) {
      setIsAuth(true);
      setStudentName(name);
      setStage('DASHBOARD');
    }
    return success;
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

      // Prevent Duplicate Attempt
      const attempts = data.attempts || [];
      const alreadyTaken = attempts.some((att: any) => 
        att.studentName.toLowerCase() === studentName.toLowerCase()
      );

      if (alreadyTaken) {
        alert("আপনি এই পরীক্ষাটি একবার দিয়ে ফেলেছেন! বারবার পরীক্ষা দেওয়া যাবে না।");
        return;
      }

      setActiveQuiz({ id: docSnap.id, ...data });
      setTimeLeft(Number(data.config?.totalTime || data.time || 10) * 60);
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

  const handleSubmit = async () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    let wrongCount = 0;

    activeQuiz.questions.forEach((q: any) => {
      const userAns = String(answers[q.id] || "").trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || "").trim().toLowerCase();
      if (userAns !== "") {
        if (userAns === correctAns) correctCount++;
        else wrongCount++;
      }
    });

    const attemptData = {
      studentName: studentName.trim(),
      score: correctCount,
      totalMarks: activeQuiz.questions.length,
      pointsEarned: (correctCount * 1) - (wrongCount * 0.5),
      submittedAt: new Date().toISOString(),
      timeSpent: Math.max(1, (Number(activeQuiz.config?.totalTime || 10) * 60) - timeLeft),
      answers: { ...answers }
    };

    setResData({
      score: attemptData.score,
      totalMarks: attemptData.totalMarks,
      timeSpent: attemptData.timeSpent,
      pointsEarned: attemptData.pointsEarned
    });

    try {
      const quizRef = doc(db, "quizzes", activeQuiz.id);
      await updateDoc(quizRef, { attempts: arrayUnion(attemptData) });
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
          quizCode={quizCode} setQuizCode={setQuizCode}
          studentName={studentName} setStudentName={setStudentName}
          onStart={handleStart} onBack={onBack}
          students={students} onRegister={onRegister}
          onStudentLogin={handleProtectedLogin}
        />
      )}

      {stage === 'DASHBOARD' && (
        <div className="max-w-xl mx-auto pt-20 px-4">
          <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl border border-slate-100 text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">🎓</div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">স্বাগতম, {studentName}!</h2>
            <p className="text-slate-400 font-bold mb-8 uppercase text-xs tracking-widest">Student Dashboard</p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="পরীক্ষার কোড লিখো..." 
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-black text-xl focus:border-indigo-600 outline-none transition-all uppercase"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
              />
              <button 
                onClick={handleStart}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
              >
                পরীক্ষা শুরু করো
              </button>
              <button onClick={onBack} className="w-full py-3 text-slate-400 font-bold hover:text-red-500 transition-all text-sm">
                লগআউট (Logout)
              </button>
            </div>
          </div>
        </div>
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
          score={resData.score} totalMarks={resData.totalMarks}
          timeSpent={resData.timeSpent} pointsEarned={resData.pointsEarned}
          studentName={studentName}
          onBack={resetToDashboard} 
          leaderboard={activeQuiz.attempts} 
          // ✅ এখানে 'quiz' প্রপসটি পাঠানো বন্ধ করা হলো অথবা 
          // QuizResult কম্পোনেন্টের ভেতর ডাউনলোড বাটনটি হাইড করে দিতে হবে।
        />
      )}
    </div>
  );
};

export default StudentPanel;
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, arrayUnion, doc, query, where } from "firebase/firestore";

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
  const [stage, setStage] = useState<'LOGIN' | 'DASHBOARD' | 'TAKING' | 'RESULT' | 'REVIEW'>('LOGIN');
  const [quizCode, setQuizCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState({
    totalPoints: 0,
    quizzesTaken: 0,
    medal: "Bronze",
    rank: 0
  });

  const [resData, setResData] = useState({
    score: 0,
    totalMarks: 0,
    timeSpent: 0,
    pointsEarned: 0
  });

  // ডাটা লোড করা
  const fetchStudentData = async (currentName: string) => {
    try {
      const qzRef = collection(db, "quizzes");
      const qzSnap = await getDocs(qzRef);
      const allQuizzes = qzSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const history: any[] = [];
      const leaderMap: Record<string, number> = {};

      allQuizzes.forEach(quiz => {
        if (quiz.attempts) {
          quiz.attempts.forEach((att: any) => {
            const name = att.studentName;
            leaderMap[name] = (leaderMap[name] || 0) + (att.pointsEarned || 0);
            if (name.toLowerCase() === currentName.toLowerCase()) {
              history.push({ ...quiz, myAttempt: att });
            }
          });
        }
      });

      const sortedStudents = Object.entries(leaderMap)
        .map(([name, points]) => ({ name, points }))
        .sort((a, b) => b.points - a.points);

      const myIndex = sortedStudents.findIndex(s => s.name.toLowerCase() === currentName.toLowerCase());
      const myPoints = leaderMap[currentName] || 0;

      setMyHistory(history);
      setStudentStats({
        totalPoints: myPoints,
        quizzesTaken: history.length,
        medal: myPoints > 500 ? "Gold" : myPoints > 200 ? "Silver" : "Bronze",
        rank: myIndex !== -1 ? myIndex + 1 : 0
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleProtectedLogin = (name: string, pass: string) => {
    const success = onStudentLogin(name, pass);
    if (success) {
      setStudentName(name);
      setStage('DASHBOARD');
      fetchStudentData(name);
    }
    return success;
  };

  const handleStart = async (codeFromHistory?: string) => {
    const targetCode = (codeFromHistory || quizCode).trim().toUpperCase();
    if (!targetCode) return alert("সঠিক কুইজ কোড দিন!");

    try {
      const q = query(collection(db, "quizzes"), where("code", "==", targetCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return alert("ভুল কোড!");

      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data() as any;
      const myAttempt = data.attempts?.find((att: any) => att.studentName.toLowerCase() === studentName.toLowerCase());

      if (myAttempt) {
        setActiveQuiz({ id: docSnap.id, ...data });
        setAnswers(myAttempt.answers || {});
        setResData(myAttempt);
        setStage('REVIEW');
      } else {
        // নতুন কুইজ শুরু
        setActiveQuiz({ id: docSnap.id, ...data });
        setAnswers({});
        setTimeLeft(Number(data.config?.totalTime || 10) * 60);
        setStage('TAKING');
      }
    } catch (error) { 
      alert("সার্ভার সমস্যা!"); 
    }
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;

    // যদি অ্যাডমিন ইনপুট অপশন বন্ধ রাখে, তবে সাবমিট হবে না (সুরক্ষার জন্য)
    if (activeQuiz.config && activeQuiz.config.isInputEnabled === false) {
      return alert("অ্যাডমিন এখন ইনপুট গ্রহণ করছেন না। দয়া করে অপেক্ষা করুন।");
    }
    
    let correct = 0;
    activeQuiz.questions.forEach((q: any) => {
      const userAns = String(answers[q.id] || "").trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || "").trim().toLowerCase();
      if (userAns !== "" && userAns === correctAns) correct++;
    });

    const totalSeconds = Number(activeQuiz.config?.totalTime || 10) * 60;
    const timeSpent = totalSeconds - timeLeft;

    const attemptData = {
      studentName,
      score: correct,
      totalMarks: activeQuiz.questions.length,
      pointsEarned: correct * 10,
      submittedAt: new Date().toISOString(),
      timeSpent: timeSpent,
      answers: { ...answers }
    };

    try {
      await updateDoc(doc(db, "quizzes", activeQuiz.id), { 
        attempts: arrayUnion(attemptData) 
      });
      setResData(attemptData);
      setStage('RESULT');
      fetchStudentData(studentName); 
    } catch (e) { 
      alert("Error saving result"); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri']">
      {stage === 'LOGIN' && (
        <StudentLogin 
          quizCode={quizCode} setQuizCode={setQuizCode} 
          studentName={studentName} setStudentName={setStudentName} 
          onStart={() => handleStart()} onBack={onBack} 
          students={students} onRegister={onRegister} 
          onStudentLogin={handleProtectedLogin} 
        />
      )}

      {stage === 'DASHBOARD' && (
        <div className="max-w-5xl mx-auto pt-10 px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center shadow-sm">
              <div className="text-4xl mb-2">{studentStats.medal === 'Gold' ? '🥇' : studentStats.medal === 'Silver' ? '🥈' : '🥉'}</div>
              <h2 className="text-xl font-black text-slate-800">{studentName}</h2>
              <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-wider">{studentStats.medal} League</p>
            </div>
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg">
              <p className="text-[10px] font-bold opacity-80 uppercase">Total Points</p>
              <h3 className="text-3xl font-black">{studentStats.totalPoints}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Quizzes Done</p>
              <h3 className="text-3xl font-black text-slate-800">{studentStats.quizzesTaken}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Global Rank</p>
              <h3 className="text-3xl font-black text-indigo-600">#{studentStats.rank}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 sticky top-10">
                <h4 className="font-black text-slate-800 mb-2">Join New Quiz</h4>
                <p className="text-xs text-slate-400 mb-6">Enter code to start</p>
                <input 
                  type="text" 
                  placeholder="CODE" 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 text-center font-bold outline-none focus:border-indigo-600 uppercase" 
                  value={quizCode} 
                  onChange={(e) => setQuizCode(e.target.value)} 
                />
                <button 
                  onClick={() => handleStart()} 
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-black transition-all"
                >
                  START QUIZ
                </button>
                <button onClick={() => { setStage('LOGIN'); setStudentName(''); }} className="w-full mt-4 py-2 text-slate-400 font-bold text-xs uppercase">Logout</button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-black text-slate-800 mb-4 text-lg">My Exam History</h4>
              <div className="space-y-3">
                {myHistory.map((quiz) => (
                  <div key={quiz.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-all">
                    <div>
                      <h5 className="font-bold text-slate-800">{quiz.title}</h5>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Code: {quiz.code} • {quiz.myAttempt.score}/{quiz.myAttempt.totalMarks}</p>
                    </div>
                    <button onClick={() => handleStart(quiz.code)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Review</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* কুইজ স্ক্রিন - এখানে ইনপুট কন্ট্রোল যোগ করা হয়েছে */}
      {stage === 'TAKING' && activeQuiz && (
        <div className={activeQuiz.config?.isInputEnabled === false ? "pointer-events-none opacity-80" : ""}>
          {activeQuiz.config?.isInputEnabled === false && (
            <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-2 z-50 font-bold animate-pulse">
              অ্যাডমিন ইনপুট অপশন বন্ধ রেখেছেন। দয়া করে অপেক্ষা করুন...
            </div>
          )}
          <QuizScreen 
            activeQuiz={activeQuiz} 
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            answers={answers} 
            setAnswers={setAnswers}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {(stage === 'RESULT' || stage === 'REVIEW') && activeQuiz && (
        <div className="max-w-4xl mx-auto pt-10 px-4 pb-20">
          <QuizResult score={resData.score} totalMarks={resData.totalMarks} timeSpent={resData.timeSpent} pointsEarned={resData.pointsEarned} studentName={studentName} onBack={() => setStage('DASHBOARD')} leaderboard={activeQuiz.attempts || []} />
          
          <div className="mt-10 bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4">Detailed Answer Review</h3>
            <div className="space-y-10">
              {activeQuiz.questions.map((q: any, idx: number) => {
                const userAns = String(answers[q.id] || "").trim();
                const correctAns = String(q.answer || q.correctAnswer || "").trim();
                const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();
                return (
                  <div key={idx} className="relative pl-4">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-lg font-bold text-slate-800 mb-4">{idx + 1}. {q.text}</p>
                    <div className="flex gap-4">
                        <div className="flex-1 p-4 rounded-2xl border-2 bg-slate-50">
                          <p className="text-[10px] font-black uppercase text-slate-400">Your Answer: <span className="text-slate-800">{userAns || 'No Answer'}</span></p>
                        </div>
                        <div className="flex-1 p-4 rounded-2xl border-2 bg-blue-50">
                          <p className="text-[10px] font-black uppercase text-blue-400">Correct Answer: <span className="text-blue-800">{correctAns}</span></p>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setStage('DASHBOARD')} className="w-full mt-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-xl">Return to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPanel;

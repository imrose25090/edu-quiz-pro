import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, arrayUnion, doc, query, where, limit } from "firebase/firestore";

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
  
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
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

  // গ্লোবাল র‍্যাঙ্ক ক্যালকুলেশন লজিক
  const fetchGlobalData = async (currentName: string) => {
    try {
      const qzRef = collection(db, "quizzes");
      const qzSnap = await getDocs(qzRef);
      const qzList = qzSnap.docs.map(d => d.data());
      setAvailableQuizzes(qzSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // ১. সকল স্টুডেন্টের পয়েন্ট একটি ম্যাপে জমা করা
      const leaderMap: Record<string, number> = {};
      
      qzList.forEach(quiz => {
        if (quiz.attempts) {
          quiz.attempts.forEach((att: any) => {
            const name = att.studentName;
            leaderMap[name] = (leaderMap[name] || 0) + (att.pointsEarned || 0);
          });
        }
      });

      // ২. পয়েন্ট অনুযায়ী সর্ট করে র‍্যাঙ্ক বের করা
      const sortedStudents = Object.entries(leaderMap)
        .map(([name, points]) => ({ name, points }))
        .sort((a, b) => b.points - a.points);

      const myIndex = sortedStudents.findIndex(s => s.name.toLowerCase() === currentName.toLowerCase());
      const myPoints = leaderMap[currentName] || 0;
      const myQuizzes = qzList.filter(q => q.attempts?.some((a: any) => a.studentName.toLowerCase() === currentName.toLowerCase())).length;

      // মেডেল লজিক
      let medal = "Bronze";
      if (myPoints > 500) medal = "Gold";
      else if (myPoints > 200) medal = "Silver";

      setStudentStats({
        totalPoints: myPoints,
        quizzesTaken: myQuizzes,
        medal: medal,
        rank: myIndex !== -1 ? myIndex + 1 : sortedStudents.length + 1
      });
    } catch (e) {
      console.error("Rank Error:", e);
    }
  };

  const handleProtectedLogin = (name: string, pass: string) => {
    const success = onStudentLogin(name, pass);
    if (success) {
      setStudentName(name);
      setStage('DASHBOARD');
      fetchGlobalData(name);
    }
    return success;
  };

  // ... (handleStart এবং handleSubmit আগের মতোই থাকবে)
  const handleStart = async (codeFromList?: string) => {
    const targetCode = (codeFromList || quizCode).trim().toUpperCase();
    if (!targetCode) return alert("সঠিক কুইজ কোড দিন!");
    try {
      const q = query(collection(db, "quizzes"), where("code", "==", targetCode));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return alert("ভুল কোড!");
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      const myAttempt = data.attempts?.find((att: any) => att.studentName.toLowerCase() === studentName.toLowerCase());
      if (myAttempt) {
        setActiveQuiz({ id: docSnap.id, ...data });
        setAnswers(myAttempt.answers || {});
        setResData({ score: myAttempt.score, totalMarks: myAttempt.totalMarks, timeSpent: myAttempt.timeSpent, pointsEarned: myAttempt.pointsEarned });
        setStage('REVIEW');
        return;
      }
      setActiveQuiz({ id: docSnap.id, ...data });
      setTimeLeft(Number(data.config?.totalTime || 10) * 60);
      setStage('TAKING');
    } catch (error) { alert("সার্ভার সমস্যা!"); }
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    let correct = 0;
    activeQuiz.questions.forEach((q: any) => {
      const userAns = String(answers[q.id] || "").trim().toLowerCase();
      const correctAns = String(q.answer || q.correctAnswer || "").trim().toLowerCase();
      if (userAns === correctAns) correct++;
    });
    const attemptData = {
      studentName,
      score: correct,
      totalMarks: activeQuiz.questions.length,
      pointsEarned: correct * 10,
      submittedAt: new Date().toISOString(),
      timeSpent: (Number(activeQuiz.config?.totalTime || 10) * 60) - timeLeft,
      answers: { ...answers }
    };
    try {
      await updateDoc(doc(db, "quizzes", activeQuiz.id), { attempts: arrayUnion(attemptData) });
      setResData(attemptData);
      setStage('RESULT');
      fetchGlobalData(studentName); // রেজাল্টের পর র‍্যাঙ্ক আপডেট
    } catch (e) { alert("Error saving result"); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri']">
      {stage === 'LOGIN' && (
        <StudentLogin quizCode={quizCode} setQuizCode={setQuizCode} studentName={studentName} setStudentName={setStudentName} onStart={() => handleStart()} onBack={onBack} students={students} onRegister={onRegister} onStudentLogin={handleProtectedLogin} />
      )}

      {stage === 'DASHBOARD' && (
        <div className="max-w-5xl mx-auto pt-10 px-4 pb-20">
          {/* প্রোফাইল এবং স্ট্যাটাস */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center shadow-sm">
              <div className="text-4xl mb-2">{studentStats.medal === 'Gold' ? '🥇' : studentStats.medal === 'Silver' ? '🥈' : '🥉'}</div>
              <h2 className="text-xl font-black text-slate-800">{studentName}</h2>
              <p className="text-indigo-600 font-bold text-xs uppercase">{studentStats.medal} League</p>
            </div>
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg">
              <p className="text-xs font-bold opacity-80 uppercase">Total Points</p>
              <h3 className="text-3xl font-black">{studentStats.totalPoints}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Quizzes Done</p>
              <h3 className="text-3xl font-black text-slate-800">{studentStats.quizzesTaken}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Global Rank</p>
              <h3 className="text-3xl font-black text-indigo-600">#{studentStats.rank}</h3>
            </div>
          </div>
          
          {/* ... বাকি ড্যাশবোর্ড কোড আগের মতোই ... */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 sticky top-10">
                <h4 className="font-black text-slate-800 mb-4">Join New Quiz</h4>
                <input type="text" placeholder="Enter Quiz Code" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 text-center font-bold outline-none focus:border-indigo-600 uppercase" value={quizCode} onChange={(e) => setQuizCode(e.target.value)} />
                <button onClick={() => handleStart()} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">Start Quiz</button>
                <button onClick={onBack} className="w-full mt-4 py-2 text-slate-400 font-bold hover:text-red-500">Logout</button>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h4 className="font-black text-slate-800 mb-4 text-lg">Available Quizzes & History</h4>
              <div className="space-y-3">
                {availableQuizzes.map((quiz) => {
                  const attempted = quiz.attempts?.some((a: any) => a.studentName.toLowerCase() === studentName.toLowerCase());
                  return (
                    <div key={quiz.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-all">
                      <div>
                        <span className="text-[10px] bg-indigo-50 px-2 py-1 rounded-md text-indigo-600 font-bold uppercase mr-2">{quiz.subject}</span>
                        <h5 className="font-bold text-slate-800 mt-1">{quiz.title}</h5>
                      </div>
                      <button onClick={() => handleStart(quiz.code)} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${attempted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                        {attempted ? 'Review Answers' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ... Review এবং Result সেকশন আগের মতোই থাকবে ... */}
      {(stage === 'RESULT' || stage === 'REVIEW') && activeQuiz && (
        <div className="max-w-4xl mx-auto pt-10 px-4 pb-20">
          <QuizResult score={resData.score} totalMarks={resData.totalMarks} timeSpent={resData.timeSpent} pointsEarned={resData.pointsEarned} studentName={studentName} onBack={() => setStage('DASHBOARD')} leaderboard={activeQuiz.attempts} />
          
          <div className="mt-10 bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4">📝 Detailed Answer Review</h3>
            <div className="space-y-10">
              {activeQuiz.questions.map((q: any, idx: number) => {
                const userAns = String(answers[q.id] || "").trim();
                const correctAns = String(q.answer || q.correctAnswer || "").trim();
                const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();
                const isMCQ = q.type === 'MCQ' || (q.options && q.options.length > 0);

                return (
                  <div key={idx} className="relative pl-4">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-lg font-bold text-slate-800 mb-4">
                      <span className="text-slate-400 mr-2">{idx + 1}.</span> {q.text}
                    </p>

                    {isMCQ && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt: string, oIdx: number) => {
                          const isThisUserPicked = String(opt).trim() === userAns;
                          const isThisCorrect = String(opt).trim() === correctAns;
                          let cardStyle = "bg-slate-50 border-slate-100 text-slate-600";
                          if (isThisCorrect) cardStyle = "bg-green-100 border-green-500 text-green-700 ring-2 ring-green-200";
                          else if (isThisUserPicked && !isCorrect) cardStyle = "bg-red-100 border-red-500 text-red-700";
                          return (
                            <div key={oIdx} className={`p-4 rounded-2xl border-2 font-bold transition-all ${cardStyle} flex items-center justify-between`}>
                              <span>{opt}</span>
                              {isThisCorrect && <span className="text-xl">✅</span>}
                              {isThisUserPicked && !isCorrect && <span className="text-xl">❌</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!isMCQ && (
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className={`flex-1 p-4 rounded-2xl border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Your Answer</p>
                          <p className={`font-black ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAns || 'No Answer'}</p>
                        </div>
                        {!isCorrect && (
                          <div className="flex-1 p-4 rounded-2xl border-2 bg-blue-50 border-blue-200">
                            <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Correct Answer</p>
                            <p className="font-black text-blue-700">{correctAns}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => setStage('DASHBOARD')} className="w-full mt-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-xl hover:bg-black transition-all shadow-xl">
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPanel;

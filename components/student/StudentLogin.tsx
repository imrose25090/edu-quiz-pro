import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query } from "firebase/firestore";
import { StudentTranscriptModal } from '../teacher/StudentTranscriptModal';

interface StudentLoginProps {
  quizCode: string;
  setQuizCode: (val: string) => void;
  studentName: string;
  setStudentName: (val: string) => void;
  onStart: () => void;
  onBack: () => void;
  students: any[]; 
  onRegister: (name: string, pass: string) => void;
  onStudentLogin: (name: string, pass: string) => boolean;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ 
  quizCode, setQuizCode, studentName, setStudentName, onStart, onBack,
  onRegister, onStudentLogin 
}) => {
  const [isNewUser, setIsNewUser] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [globalRank, setGlobalRank] = useState(0);

  const [viewingQuiz, setViewingQuiz] = useState<any | null>(null);
  const [viewingAttempt, setViewingAttempt] = useState<any | null>(null);

  // ১. লগইন/রেজিস্ট্রেশন অ্যাকশন
  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewUser) {
      if (studentName.trim() && password.trim()) {
        onRegister(studentName, password);
        setIsNewUser(false);
        setPassword('');
      } else {
        alert("সব তথ্য সঠিকভাবে পূরণ করুন!");
      }
    } else {
      const success = onStudentLogin(studentName, password);
      if (success) {
        setIsLoggedIn(true);
      } else {
        alert("ভুল নাম অথবা পাসওয়ার্ড!");
      }
    }
  };

  // ২. রিয়েল-টাইম ডাটা রিড
  useEffect(() => {
    if (isLoggedIn) {
      const q = query(collection(db, "quizzes"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const studentPointsMap: { [name: string]: number } = {};
        const myHistory: any[] = [];

        snapshot.docs.forEach(doc => {
          const quiz = { id: doc.id, ...doc.data() } as any;
          const attempts = quiz.attempts || [];
          
          attempts.forEach((att: any) => {
            const correct = Number(att.score) || 0;
            const total = Number(att.totalMarks) || 0;
            const points = (correct * 1) - ((total - correct) * 0.5);
            
            studentPointsMap[att.studentName] = (studentPointsMap[att.studentName] || 0) + points;

            if (att.studentName === studentName) {
              myHistory.push({
                fullQuizData: quiz,
                myAttemptData: att,
                quizTitle: quiz.title,
                quizCode: quiz.code,
                score: correct,
                totalMarks: total,
                date: att.submittedAt
              });
            }
          });
        });

        const sorted = Object.entries(studentPointsMap).sort(([, a], [, b]) => b - a);
        const myRank = sorted.findIndex(([name]) => name === studentName) + 1;
        
        setTotalPoints(studentPointsMap[studentName] || 0);
        setGlobalRank(myRank > 0 ? myRank : 0);
        setHistory(myHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      });
      return () => unsubscribe();
    }
  }, [isLoggedIn, studentName]);

  const badge = (pts: number) => {
    if (pts >= 500) return { label: 'Platinum', color: 'bg-indigo-100 text-indigo-700', icon: '💎' };
    if (pts >= 250) return { label: 'Gold', color: 'bg-yellow-100 text-yellow-700', icon: '🥇' };
    if (pts >= 100) return { label: 'Silver', color: 'bg-slate-100 text-slate-500', icon: '🥈' };
    return { label: 'Bronze', color: 'bg-orange-100 text-orange-700', icon: '🥉' };
  };

  const myBadge = badge(totalPoints);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 font-['Hind_Siliguri'] select-none">
      <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in duration-500">
        
        {/* Header Section */}
        <div className="flex justify-between items-center">
            <button onClick={onBack} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 font-bold transition-all shadow-sm">←</button>
            {isLoggedIn && (
              <span className={`${myBadge.color} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1`}>
                {myBadge.icon} {myBadge.label}
              </span>
            )}
        </div>

        {!isLoggedIn ? (
          <form onSubmit={handleAction} className="space-y-4 max-w-sm mx-auto">
             <div className="pb-4">
                <h2 className="text-3xl font-black text-slate-800 italic uppercase leading-none">{isNewUser ? 'New Account' : 'Student Login'}</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Edu-Track Portal</p>
             </div>
             {/* লগইন করার সময় শুধুমাত্র ইনপুট দেখাবে */}
             <input 
                type="text" 
                placeholder="Your Full Name" 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-bold outline-none focus:border-indigo-500" 
                value={studentName} 
                onChange={e => setStudentName(e.target.value)} 
                required 
             />
             <input 
                type="password" 
                placeholder="Password" 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-bold outline-none focus:border-indigo-500" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
             />
             <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all">
               {isNewUser ? 'Register' : 'Login'}
             </button>
             <button type="button" onClick={() => setIsNewUser(!isNewUser)} className="text-indigo-600 font-bold text-xs uppercase">
               {isNewUser ? 'Login Instead' : 'Create Account'}
             </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* লগইন হয়ে গেলে এখানে আর ইনপুট ফিল্ড নেই, শুধু বড় করে নাম দেখাবে */}
            <div className="py-2">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Signed In As</p>
                <h2 className="text-3xl font-black text-indigo-600 uppercase tracking-tight">{studentName}</h2>
            </div>

            {/* Stats - Non-Editable */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-lg">
                    <p className="text-[8px] font-black uppercase opacity-70">Points</p>
                    <p className="text-xl font-black">{totalPoints.toFixed(1)}</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-3xl text-white">
                    <p className="text-[8px] font-black uppercase opacity-70">Global Rank</p>
                    <p className="text-xl font-black">#{globalRank}</p>
                </div>
                <div className="p-4 bg-emerald-500 rounded-3xl text-white">
                    <p className="text-[8px] font-black uppercase opacity-70">Completed</p>
                    <p className="text-xl font-black">{history.length}</p>
                </div>
            </div>

            {/* Quiz Entry Section */}
            <div className="p-6 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 text-left space-y-4">
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] px-1">Ready to Quiz?</p>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ENTER QUIZ CODE" 
                      className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl text-slate-800 font-black uppercase outline-none focus:border-indigo-500" 
                      value={quizCode} 
                      onChange={e => setQuizCode(e.target.value.toUpperCase())} 
                    />
                    <button onClick={onStart} className="px-8 bg-indigo-600 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95">START</button>
                </div>
            </div>

            {/* History Section */}
            <button onClick={() => setShowHistory(!showHistory)} className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                {showHistory ? 'Hide Results' : 'Download Scripts & History'}
                <svg className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showHistory && (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((item, idx) => (
                        <div key={idx} 
                             onClick={() => { setViewingQuiz(item.fullQuizData); setViewingAttempt(item.myAttemptData); }}
                             className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center text-left hover:border-indigo-100 hover:shadow-md transition-all cursor-pointer group">
                            <div>
                                <h4 className="font-black text-slate-800 text-sm">{item.quizTitle}</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                  {item.quizCode} • {new Date(item.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-indigo-600">{item.score}/{item.totalMarks}</p>
                                <p className="text-[9px] font-black text-emerald-600">Download Script</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {/* Modal: View & Download Only */}
        {viewingQuiz && viewingAttempt && (
          <StudentTranscriptModal 
            quiz={viewingQuiz} 
            attempt={viewingAttempt}
            onClose={() => { setViewingQuiz(null); setViewingAttempt(null); }}
            onExport={() => window.print()} 
            isExporting={false}
            attemptSheetRef={{ current: null } as any}
            getRankInfo={(att, q) => {
               const sorted = [...(q.attempts || [])].sort((a, b) => b.score - a.score);
               const r = sorted.findIndex(s => s.submittedAt === att.submittedAt) + 1;
               return { rank: r, total: sorted.length };
            }}
          />
        )}
      </div>
    </div>
  );
};
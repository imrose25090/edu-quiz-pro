import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface QuizResultProps {
  score: number;
  totalMarks: number;
  timeSpent: number;
  pointsEarned: number;
  studentName: string;
  leaderboard: any[];
  userAnswers: any[]; // স্টুডেন্টের দেওয়া উত্তর
  questions: any[];    // কুইজের প্রশ্নগুলো
  onBack: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({ 
  score = 0, 
  totalMarks = 0, 
  timeSpent = 0, 
  pointsEarned = 0,
  studentName = "Student", 
  leaderboard = [], 
  userAnswers = [],
  questions = [],
  onBack 
}) => {
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval); 
  }, []);

  const safeScore = Number(score) || 0;
  const safeTotalMarks = Number(totalMarks) || 0;
  const safeTimeSpent = Number(timeSpent) || 0;
  const percentage = safeTotalMarks > 0 ? Math.round((safeScore / safeTotalMarks) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-['Hind_Siliguri'] pb-10 animate-in zoom-in duration-500 px-4 pt-10">
      <div className="bg-white rounded-[50px] shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Top Banner */}
        <div className="bg-indigo-600 p-12 text-center text-white relative">
          <div className="absolute top-4 right-8 opacity-20 text-6xl rotate-12">🏆</div>
          <h2 className="text-4xl md:text-5xl font-black mb-2 uppercase italic tracking-tighter">
            Great Job, {studentName}!
          </h2>
          <p className="text-indigo-100 font-bold text-xl uppercase tracking-widest">
            পরীক্ষা সফলভাবে সম্পন্ন হয়েছে
          </p>
        </div>

        {/* Stats Cards */}
        <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-50 p-8 rounded-[40px] text-center space-y-4 border border-slate-100">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">মোট স্কোর</p>
            <div className="relative inline-block">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={364} 
                  strokeDashoffset={364 - (364 * (percentage > 100 ? 100 : percentage)) / 100}
                  className="text-indigo-600 transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{safeScore}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Out of {safeTotalMarks}</span>
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-600">{percentage}% নম্বর</p>
          </div>

          <div className="bg-slate-50 p-8 rounded-[40px] text-center space-y-4 border border-slate-100">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">ব্যয়িত সময়</p>
            <div className="text-5xl mb-2">⏳</div>
            <p className="text-3xl font-black text-slate-800">
              {Math.floor(safeTimeSpent / 60)}m {safeTimeSpent % 60}s
            </p>
            <p className="text-slate-400 font-bold uppercase text-[10px]">টাইম ম্যানেজমেন্ট চমৎকার!</p>
          </div>

          <div className="bg-slate-50 p-8 rounded-[40px] text-center space-y-4 border border-slate-100">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">অর্জন</p>
            <div className="text-6xl mb-2">
              {percentage >= 80 ? '⭐' : percentage >= 50 ? '🥈' : '💪'}
            </div>
            <p className="text-2xl font-black text-slate-800">
              {percentage >= 80 ? 'অসাধারণ (Genius)' : percentage >= 50 ? 'ভালো হয়েছে' : 'আরও চেষ্টা করো'}
            </p>
            <p className="text-indigo-600 font-black text-sm uppercase">Points: {pointsEarned}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-10 pb-10 flex gap-4">
          <button 
            onClick={() => setShowReview(!showReview)}
            className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase hover:bg-slate-200 transition-all"
          >
            {showReview ? 'রিভিউ বন্ধ করো' : 'উত্তরগুলো রিভিউ করো 📝'}
          </button>
        </div>

        {/* Answer Review Section */}
        {showReview && (
          <div className="p-10 bg-white border-t border-slate-100 space-y-6 animate-in slide-in-from-top-4">
            <h3 className="text-2xl font-black text-slate-800 uppercase italic">Answer Review</h3>
            {questions.map((q, idx) => {
              const studentAns = userAnswers.find(a => a.questionId === q.id)?.selectedOption;
              const isCorrect = studentAns === q.answer;

              return (
                <div key={idx} className={`p-6 rounded-3xl border-2 ${isCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-black text-slate-400">Q{idx + 1}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-800 mb-4">{q.text}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Your Answer</p>
                      <p className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>{studentAns || 'No Answer'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Correct Answer</p>
                      <p className="font-bold text-emerald-600">{q.answer}</p>
                    </div>
                  </div>
                  {q.explanation && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-sm text-indigo-700 italic">
                      <strong>ব্যাখ্যা:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard Section */}
        {!showReview && (
          <div className="p-10 bg-slate-50/50 border-t border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 italic uppercase">লিডারবোর্ড র‍্যাঙ্কিং</h3>
              <span className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full font-black text-xs uppercase">Top 5 Students</span>
            </div>
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                [...leaderboard]
                  .sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent)
                  .slice(0, 5)
                  .map((entry, idx) => (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                        entry.studentName === studentName 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]' 
                          : 'bg-white border-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          entry.studentName === studentName ? 'bg-white/20' : 'bg-slate-100'
                        }`}>#{idx + 1}</span>
                        <span className="font-bold text-lg">{entry.studentName}</span>
                      </div>
                      <div className="flex items-center gap-6">
                         <span className="font-mono text-sm opacity-60">
                           {Math.floor(entry.timeSpent / 60)}m {entry.timeSpent % 60}s
                         </span>
                         <span className="font-black text-xl">{entry.score}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-center text-slate-400 py-4 italic">লিডারবোর্ড এখনো তৈরি হয়নি।</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Button */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={onBack} 
          className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 group"
        >
          <span>ড্যাশবোর্ডে ফিরে যাও</span>
          <span className="group-hover:translate-x-2 transition-transform">➡️</span>
        </button>
      </div>
    </div>
  );  
};

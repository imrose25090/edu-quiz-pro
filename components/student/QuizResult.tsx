import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface QuizResultProps {
  score: number;
  totalMarks: number;
  timeSpent: number;
  earnedPoints: number;   // StudentPanel থেকে আসে
  wrongCount: number;
  bonusPoints: number;
  studentName: string;
  leaderboard: any[];
  activeQuiz?: any;       // full quiz object (questions + answers এর জন্য)
  submittedAnswers?: Record<string, string>; // answers map
  onBack: () => void;
  // legacy compat
  pointsEarned?: number;
  userAnswers?: any[];
  questions?: any[];
}

export const QuizResult: React.FC<QuizResultProps> = ({
  score = 0,
  totalMarks = 0,
  timeSpent = 0,
  earnedPoints = 0,
  wrongCount = 0,
  bonusPoints = 0,
  studentName = "Student",
  leaderboard = [],
  activeQuiz,
  submittedAnswers = {},
  onBack,
  pointsEarned,
  userAnswers = [],
  questions: questionsProp = [],
}) => {
  const [showReview, setShowReview] = useState(false);

  // legacy compat
  const finalPoints = earnedPoints || pointsEarned || 0;
  const questions   = activeQuiz?.questions || questionsProp;

  useEffect(() => {
    const duration   = 3 * 1000;
    const animEnd    = Date.now() + duration;
    const defaults   = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
    const rand       = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const safeScore      = Number(score)      || 0;
  const safeTotalMarks = Number(totalMarks) || 0;
  const safeTimeSpent  = Number(timeSpent)  || 0;
  const percentage     = safeTotalMarks > 0 ? Math.round((safeScore / safeTotalMarks) * 100) : 0;
  const basePoints     = Math.max(0, finalPoints - bonusPoints);

  // answer lookup — submittedAnswers (id→value map) or legacy userAnswers array
  const getStudentAnswer = (qId: string) => {
    if (submittedAnswers && submittedAnswers[qId] !== undefined) return submittedAnswers[qId];
    const found = userAnswers.find((a: any) => a.questionId === qId);
    return found?.selectedOption ?? '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-['Hind_Siliguri'] pb-10 animate-in zoom-in duration-500 px-4 pt-10">
      <div className="bg-white rounded-[50px] shadow-2xl border border-slate-100 overflow-hidden">

        {/* ── Banner ─────────────────────────────────────── */}
        <div className="bg-indigo-600 p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-4 right-8 opacity-20 text-6xl rotate-12">🏆</div>
          <h2 className="text-4xl md:text-5xl font-black mb-2 uppercase italic tracking-tighter">
            Great Job, {studentName}!
          </h2>
          <p className="text-indigo-100 font-bold text-xl uppercase tracking-widest">
            পরীক্ষা সফলভাবে সম্পন্ন হয়েছে
          </p>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Score circle */}
          <div className="bg-slate-50 p-8 rounded-[40px] text-center space-y-4 border border-slate-100">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">মোট স্কোর</p>
            <div className="relative inline-block">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={364}
                  strokeDashoffset={364 - (364 * Math.min(percentage, 100)) / 100}
                  className="text-indigo-600 transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{safeScore}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">/ {safeTotalMarks}</span>
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-600">{percentage}%</p>
            {/* correct / wrong breakdown */}
            <div className="flex justify-center gap-4 text-xs font-black">
              <span className="text-emerald-600">✅ {safeScore} সঠিক</span>
              <span className="text-rose-500">❌ {wrongCount} ভুল</span>
            </div>
          </div>

          {/* Time */}
          <div className="bg-slate-50 p-8 rounded-[40px] text-center space-y-4 border border-slate-100">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">ব্যয়িত সময়</p>
            <div className="text-5xl mb-2">⏳</div>
            <p className="text-3xl font-black text-slate-800">
              {Math.floor(safeTimeSpent / 60)}m {safeTimeSpent % 60}s
            </p>
            <p className="text-slate-400 font-bold uppercase text-[10px]">টাইম ম্যানেজমেন্ট</p>
          </div>

          {/* Points */}
          <div className="bg-slate-50 p-8 rounded-[40px] text-center space-y-4 border border-slate-100">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">অর্জিত পয়েন্ট</p>
            <div className="text-6xl mb-2">
              {percentage >= 80 ? '⭐' : percentage >= 50 ? '🥈' : '💪'}
            </div>
            <p className="text-4xl font-black text-indigo-600">+{finalPoints.toFixed(1)}</p>
            <div className="text-xs font-black text-slate-400 space-y-1">
              <p>Base: <span className="text-slate-600">{basePoints.toFixed(1)}</span></p>
              {bonusPoints > 0 && <p className="text-amber-500">⚡ Speed Bonus: +{bonusPoints}</p>}
            </div>
            <p className="text-xs font-black uppercase text-slate-400">
              {percentage >= 80 ? 'অসাধারণ! Genius' : percentage >= 50 ? 'ভালো হয়েছে' : 'আরও চেষ্টা করো'}
            </p>
          </div>
        </div>

        {/* ── Action Buttons ──────────────────────────────── */}
        <div className="px-10 pb-6 flex gap-4">
          {questions.length > 0 && (
            <button onClick={() => setShowReview(!showReview)}
              className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase hover:bg-slate-200 transition-all">
              {showReview ? 'রিভিউ বন্ধ করো ✕' : 'উত্তরগুলো রিভিউ করো 📝'}
            </button>
          )}
        </div>

        {/* ── Answer Review ───────────────────────────────── */}
        {showReview && questions.length > 0 && (
          <div className="p-10 bg-white border-t border-slate-100 space-y-6 animate-in slide-in-from-top-4">
            <h3 className="text-2xl font-black text-slate-800 uppercase italic">Answer Review</h3>
            {questions.map((q: any, idx: number) => {
              const studentAns = getStudentAnswer(q.id);
              const correctAns = String(q.answer || q.correctAnswer || '').trim().toLowerCase();
              const isCorrect  = studentAns.trim().toLowerCase() === correctAns && studentAns !== '';
              const isSkipped  = !studentAns;

              return (
                <div key={idx} className={`p-6 rounded-3xl border-2 ${
                  isSkipped  ? 'border-slate-100 bg-slate-50/30' :
                  isCorrect  ? 'border-emerald-100 bg-emerald-50/30' :
                               'border-rose-100 bg-rose-50/30'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-black text-slate-400 text-sm">Q{idx + 1}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      isSkipped  ? 'bg-slate-300 text-white' :
                      isCorrect  ? 'bg-emerald-500 text-white' :
                                   'bg-rose-500 text-white'
                    }`}>
                      {isSkipped ? 'Skip' : isCorrect ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  </div>

                  <p className="text-lg font-bold text-slate-800 mb-4">
                    {q.questionText || q.text || q.question}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`p-3 bg-white rounded-xl border ${isCorrect ? 'border-emerald-200' : isSkipped ? 'border-slate-200' : 'border-rose-200'}`}>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">তোমার উত্তর</p>
                      <p className={`font-bold ${isCorrect ? 'text-emerald-600' : isSkipped ? 'text-slate-400 italic' : 'text-rose-600'}`}>
                        {studentAns || 'উত্তর দেওয়া হয়নি'}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">সঠিক উত্তর</p>
                      <p className="font-bold text-emerald-600">{q.answer || q.correctAnswer}</p>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-sm text-indigo-700">
                      <strong>💡 ব্যাখ্যা:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Leaderboard ─────────────────────────────────── */}
        {!showReview && (
          <div className="p-10 bg-slate-50/50 border-t border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 italic uppercase">লিডারবোর্ড র‍্যাঙ্কিং</h3>
              <span className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full font-black text-xs uppercase">Top 5</span>
            </div>
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                [...leaderboard]
                  .sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent)
                  .slice(0, 5)
                  .map((entry, idx) => (
                    <div key={idx}
                      className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                        entry.studentName === studentName
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]'
                          : 'bg-white border-slate-100 text-slate-600'
                      }`}>
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          entry.studentName === studentName ? 'bg-white/20' : 'bg-slate-100'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}
                        </span>
                        <span className="font-bold text-lg">{entry.studentName}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-mono text-sm opacity-60">
                          {Math.floor((entry.timeSpent||0) / 60)}m {(entry.timeSpent||0) % 60}s
                        </span>
                        <div className="text-right">
                          <p className="font-black text-xl">{entry.score}/{entry.totalMarks}</p>
                          <p className={`text-xs font-bold ${entry.studentName === studentName ? 'text-indigo-200' : 'text-slate-400'}`}>
                            +{(entry.earnedPoints || 0).toFixed(1)} pts
                          </p>
                        </div>
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

      {/* ── Back Button ─────────────────────────────────── */}
      <button onClick={onBack}
        className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 group">
        <span>ড্যাশবোর্ডে ফিরে যাও</span>
        <span className="group-hover:translate-x-2 transition-transform">➡️</span>
      </button>
    </div>
  );
};

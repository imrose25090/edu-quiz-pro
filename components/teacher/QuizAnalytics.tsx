import React from 'react';
import { Quiz, QuizAttempt } from '../../types';

interface QuizAnalyticsProps {
  selectedQuiz: Quiz;
  reportRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onDownload: (ref: React.RefObject<HTMLDivElement | null>, filename: string) => void;
  setViewingAttempt: (attempt: QuizAttempt | null) => void;
}

export const QuizAnalytics: React.FC<QuizAnalyticsProps> = ({
  selectedQuiz, 
  reportRef, 
  onBack, 
  onDownload, 
  setViewingAttempt
}) => {
  // নিশ্চিত করা হচ্ছে যে attempts একটি অ্যারে
  const attempts = selectedQuiz.attempts || [];

  // সময় ফরম্যাট (সেকেন্ড থেকে মিনিট/সেকেন্ড)
  const formatTime = (seconds: number | undefined | null) => {
    const totalSeconds = Number(seconds);
    if (isNaN(totalSeconds) || totalSeconds <= 0) return "0m 0s";
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}m ${s}s`;
  };

  // তারিখ ফরম্যাট
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A";
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <button 
          onClick={onBack} 
          className="text-slate-400 font-bold hover:text-indigo-600 flex items-center gap-2 transition-colors group"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> 
          কুইজ তালিকায় ফিরুন
        </button>
        <button 
          onClick={() => onDownload(reportRef, `Report_${selectedQuiz.code}`)}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          রিপোর্ট ডাউনলোড করুন
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">মোট পরীক্ষার্থী</p>
          <h3 className="text-4xl font-black text-slate-900 mt-2">{attempts.length} জন</h3>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">গড় স্কোর</p>
          <h3 className="text-4xl font-black text-indigo-600 mt-2">
            {attempts.length > 0 ? (attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / attempts.length).toFixed(1) : "0"}
          </h3>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">পাশের হার</p>
          <h3 className="text-4xl font-black text-emerald-500 mt-2">
            {attempts.length > 0 ? ((attempts.filter(a => (a.score || 0) >= (selectedQuiz.config.passingMarks || 0)).length / attempts.length) * 100).toFixed(0) : "0"}%
          </h3>
        </div>
      </div>

      {/* Table Data Section */}
      <div ref={reportRef} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-10">
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedQuiz.title}</h2>
          <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start">
            <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">কোড: {selectedQuiz.code}</span>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">পূর্ণমান: {selectedQuiz.config.totalMarks}</span>
            <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">পাশ নম্বর: {selectedQuiz.config.passingMarks}</span>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="py-24 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">
            এখনো কেউ পরীক্ষায় অংশগ্রহণ করেনি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-6 pb-2">র‍্যাঙ্ক</th>
                  <th className="px-6 pb-2">শিক্ষার্থীর নাম</th>
                  <th className="px-6 pb-2">প্রাপ্ত নম্বর</th>
                  <th className="px-6 pb-2">অবস্থা</th>
                  <th className="px-6 pb-2">ব্যয়িত সময়</th>
                  <th className="px-6 pb-2 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {[...attempts]
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((attempt, index) => {
                    const isPassed = (attempt.score || 0) >= (selectedQuiz.config.passingMarks || 0);
                    const uniqueKey = attempt.id || `attempt-${index}-${attempt.studentName}`;

                    return (
                      <tr key={uniqueKey} className="bg-slate-50/50 hover:bg-slate-100 transition-all group">
                        <td className="px-6 py-6 first:rounded-l-[24px]">
                          <span className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-sm ${
                            index === 0 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' : 
                            index === 1 ? 'bg-slate-300 text-white' : 
                            index === 2 ? 'bg-orange-400 text-white' : 'bg-white border border-slate-200 text-slate-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <p className="font-black text-slate-800 text-lg">{attempt.studentName || 'অজানা শিক্ষার্থী'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{formatDate(attempt.submittedAt)}</p>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-1">
                             <span className="text-2xl font-black text-indigo-600">{attempt.score || 0}</span>
                             <span className="text-slate-400 font-bold text-sm">/ {selectedQuiz.config.totalMarks}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          {isPassed ? (
                            <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Passed</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Failed</span>
                          )}
                        </td>
                        <td className="px-6 py-6 font-black text-slate-500 text-sm italic">
                          {formatTime(attempt.timeSpent)}
                        </td>
                        <td className="px-6 py-6 last:rounded-r-[24px] text-right">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingAttempt(attempt); // মডাল ওপেন হবে
                            }}
                            className="bg-white border-2 border-slate-100 text-slate-900 px-5 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer relative z-10"
                          >
                            View Script
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt } from '../../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface StudentTranscriptModalProps {
  attempt: QuizAttempt;
  quiz: Quiz;
  onClose: () => void;
  getRankInfo: (att: QuizAttempt, q: Quiz) => { rank: number; total: number };
}

export const StudentTranscriptModal: React.FC<StudentTranscriptModalProps> = ({ 
  attempt, quiz, onClose, getRankInfo 
}) => {
  const rankData = getRankInfo(attempt, quiz);
  const totalPossibleMarks = Number(quiz.config?.totalMarks || quiz.questions.length);

  const [coachingName, setCoachingName] = useState(() => {
    return localStorage.getItem('coaching_name') || "MENTORA ACADEMY";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [randomQuote, setRandomQuote] = useState({ text: "", author: "" });

  useEffect(() => {
    const quotes = [
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);
  }, []);

  const saveCoachingName = (name: string) => {
    setCoachingName(name);
    localStorage.setItem('coaching_name', name);
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { label: "1ST CHAMPION", color: "#fbbf24", icon: "🥇", bg: "#fffbeb" };
    if (rank === 2) return { label: "2ND RUNNER UP", color: "#94a3b8", icon: "🥈", bg: "#f8fafc" };
    if (rank === 3) return { label: "3RD PLACE", color: "#b45309", icon: "🥉", bg: "#fff7ed" };
    return { label: "PARTICIPANT", color: "#64748b", icon: "📖", bg: "#f8fafc" };
  };

  const style = getRankStyle(rankData.rank);

  // ✅ ফিক্সড ডাউনলোড ফাংশন
  const handleDownload = () => {
    const element = document.getElementById('premium-transcript');
    if (!element) return;
    
    const fileName = `${quiz.title.replace(/\s+/g, '_')}_${attempt.studentName.replace(/\s+/g, '_')}.pdf`;

    const opt = {
      margin: 5,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, // ৩ স্কেলে মেমোরি ইস্যু হতে পারে, ২ নিরাপদ
        useCORS: true, 
        scrollY: 0, // স্ক্রল পজিশন জিরো না থাকলে সাদা পেজ আসে
        windowWidth: 1000, // একটি ফিক্সড উইন্ডো উইডথ নিশ্চিত করা
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // ডাউনলোড শুরু করার আগে কনসোলে এরর চেক করতে পারেন
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-[100] p-0 font-['Hind_Siliguri']">
      <div className="bg-white w-full max-w-5xl h-full sm:h-[98vh] flex flex-col overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="p-4 bg-white border-b flex justify-between items-center no-print shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditingName(!isEditingName)} className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-3 py-1.5 rounded-lg">
              {isEditingName ? 'Save' : 'Edit Name'}
            </button>
            {isEditingName && (
              <input 
                className="border-2 border-indigo-600 px-2 py-1 rounded-lg font-bold text-xs outline-none w-32 text-black"
                value={coachingName}
                onChange={(e) => saveCoachingName(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Download PDF</button>
            <button onClick={onClose} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl font-black text-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">×</button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-200 custom-scrollbar">
          <div id="premium-transcript" style={{ width: '100%', background: '#ffffff', boxSizing: 'border-box', padding: '40px 30px' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ fontSize: '42px', fontWeight: '1000', color: '#1e40af', margin: '0', textTransform: 'uppercase', lineHeight: '1.2' }}>
                {coachingName}
              </h1>
              <div style={{ height: '4px', width: '100px', backgroundColor: '#3b82f6', margin: '15px auto' }}></div>
              <p style={{ fontSize: '14px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '5px' }}>
                Academic Transcript Report
              </p>
            </div>

            {/* Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '15px', marginBottom: '40px' }}>
              <div style={{ padding: '25px 10px', backgroundColor: '#f0f9ff', borderRadius: '25px', textAlign: 'center', border: '2px solid #bae6fd' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#0369a1', textTransform: 'uppercase' }}>Student</span>
                <p style={{ fontSize: '24px', fontWeight: '1000', color: '#0c4a6e', marginTop: '10px' }}>{attempt.studentName}</p>
              </div>

              <div style={{ padding: '25px 10px', backgroundColor: style.bg, borderRadius: '25px', textAlign: 'center', border: `4px solid ${style.color}`, boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '40px', lineHeight: '1' }}>{style.icon}</div>
                <p style={{ fontSize: '32px', fontWeight: '1000', color: '#0f172a', margin: '5px 0' }}>#{rankData.rank}</p>
                <span style={{ fontSize: '10px', fontWeight: '900', color: style.color }}>{style.label}</span>
              </div>

              <div style={{ padding: '25px 10px', backgroundColor: '#f0fdf4', borderRadius: '25px', textAlign: 'center', border: '2px solid #bbf7d0' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#15803d', textTransform: 'uppercase' }}>Score</span>
                <p style={{ fontSize: '24px', fontWeight: '1000', color: '#14532d', marginTop: '10px' }}>{attempt.score}/{totalPossibleMarks}</p>
              </div>
            </div>

            {/* Exam Analysis */}
            <div style={{ marginBottom: '50px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '1000', color: '#1e293b', marginBottom: '30px', borderLeft: '15px solid #2563eb', paddingLeft: '20px' }}>EXAM ANALYSIS</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {quiz.questions.map((q: any, idx: number) => {
                  const userAns = String((attempt.answers as any)?.[q.id] || '').trim();
                  const correctAns = String(q.answer || q.correctAnswer || '').trim();
                  const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase() && userAns !== "";
                  
                  const isGapFill = !q.options || q.options.length <= 1;

                  return (
                    <div key={idx} style={{ padding: '30px', borderRadius: '30px', backgroundColor: isCorrect ? '#f0fdf4' : '#fff1f2', border: '2px solid', borderColor: isCorrect ? '#dcfce7' : '#fecdd3', pageBreakInside: 'avoid' }}>
                      <p style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                        <span style={{ color: isCorrect ? '#16a34a' : '#e11d48', marginRight: '10px' }}>{idx + 1}.</span> 
                        {q.text || q.questionText}
                      </p>
                      
                      {isGapFill ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            padding: '15px 20px', 
                            borderRadius: '15px', 
                            backgroundColor: '#ffffff', 
                            border: '3px dashed', 
                            borderColor: isCorrect ? '#16a34a' : '#e11d48',
                            color: isCorrect ? '#15803d' : '#e11d48',
                            fontSize: '18px',
                            fontWeight: '800'
                          }}>
                            <span style={{ fontSize: '12px', textTransform: 'uppercase', display: 'block', opacity: 0.6, marginBottom: '5px' }}>Your Answer:</span>
                            {userAns || "No Answer"}
                          </div>
                          
                          {!isCorrect && (
                            <div style={{ padding: '10px 20px', color: '#16a34a', fontSize: '18px', fontWeight: '700' }}>
                              ✅ Correct Answer: {correctAns}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(q.options || []).map((opt: string, oIdx: number) => {
                            const isSelected = userAns === opt.trim();
                            const isRight = correctAns === opt.trim();
                            
                            let optBg = '#ffffff';
                            let optBorder = '#e2e8f0';
                            let optColor = '#475569';

                            if (isSelected && isRight) { optBg = '#16a34a'; optColor = '#ffffff'; optBorder = '#16a34a'; }
                            else if (isSelected && !isRight) { optBg = '#e11d48'; optColor = '#ffffff'; optBorder = '#e11d48'; }
                            else if (isRight) { optBg = '#f0fdf4'; optBorder = '#22c55e'; optColor = '#15803d'; }

                            return (
                              <div key={oIdx} style={{ padding: '15px 20px', borderRadius: '15px', fontSize: '16px', fontWeight: '800', border: '2px solid', borderColor: optBorder, backgroundColor: optBg, color: optColor, display: 'flex', alignItems: 'center' }}>
                                <span style={{ opacity: 0.5, marginRight: '10px', fontSize: '14px' }}>{String.fromCharCode(65 + oIdx)}.</span> {opt}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', borderTop: '5px solid #f1f5f9', paddingTop: '40px' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <p style={{ fontSize: '16px', fontWeight: '800', color: '#64748b', fontStyle: 'italic' }}>"{randomQuote.text}"</p>
                <p style={{ fontSize: '14px', fontWeight: '1000', color: '#2563eb', marginTop: '10px' }}>— {randomQuote.author}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '45px', height: '45px', background: '#2563eb', borderRadius: '12px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '1000', fontSize: '24px' }}>Q</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: '1000', color: 'black' }}>EDUQUIZ <span style={{ color: '#2563eb' }}>PRO</span></p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '900', letterSpacing: '2px' }}>SMART ASSESSMENT SYSTEM</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: '1000', color: '#94a3b8' }}>OFFICIAL VERIFIED RECORD</p>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#1e293b' }}>ID: {quiz.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

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

  const [coachingName, setCoachingName] = useState(() =>
    localStorage.getItem('coaching_name') || "MENTORA ACADEMY"
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [randomQuote, setRandomQuote] = useState({ text: "", author: "" });

  useEffect(() => {
    const quotes = [
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
      { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
      { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
      { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
      { text: "Intelligence plus character—that is the goal of true education.", author: "Martin Luther King Jr." },
      { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
      { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { text: "Indeed, with hardship will be ease.", author: "Surah Ash-Sharh 94:6" },
      { text: "Allah does not burden a soul beyond that it can bear.", author: "Surah Al-Baqarah 2:286" },
      { text: "There is not for man except that for which he strives.", author: "Surah An-Najm 53:39" },
      { text: "My success is not but through Allah.", author: "Surah Hud 11:88" },
    ];
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const saveCoachingName = (name: string) => {
    setCoachingName(name);
    localStorage.setItem('coaching_name', name);
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { label: "1ST CHAMPION",  color: "#fbbf24", icon: "🥇", bg: "#fffbeb" };
    if (rank === 2) return { label: "2ND RUNNER UP", color: "#94a3b8", icon: "🥈", bg: "#f8fafc" };
    if (rank === 3) return { label: "3RD PLACE",     color: "#b45309", icon: "🥉", bg: "#fff7ed" };
    return               { label: "PARTICIPANT",     color: "#64748b", icon: "📖", bg: "#f8fafc" };
  };
  const rankStyle = getRankStyle(rankData.rank);

  // ── PDF download ───────────────────────────────────────
  const handleDownload = () => {
    const element = document.getElementById('premium-transcript');
    if (!element) return;
    const fileName = `${quiz.title.replace(/\s+/g, '_')}_${attempt.studentName.replace(/\s+/g, '_')}.pdf`;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        windowWidth: 794,   // A4 width in px at 96dpi — 1:1 mapping, so content fills page
        letterRendering: true,
        allowTaint: true,
        ignoreElements: (el: Element) => el.classList.contains('no-print'),
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: '.no-break' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // ── Shared content styles (used in PDF, scaled for screen) ──
  const S = {
    // A4 = 794px wide, margin 10mm each side ≈ 75px → content ≈ 644px wide
    // We fix the PDF container to 774px (794 - 20px margins)
    wrapper: {
      width: '750px',
      boxSizing: 'border-box' as const,
      padding: '48px 44px',
      background: '#ffffff',
      fontFamily: "'Hind Siliguri', sans-serif",
    },

    // ── Header ──
    h1:        { fontSize: '52px', fontWeight: 900, color: '#1e40af', margin: 0, textTransform: 'uppercase' as const, lineHeight: 1.1 },
    bar:       { height: '6px', width: '110px', backgroundColor: '#3b82f6', margin: '18px auto', borderRadius: '10px' },
    subtitle:  { fontSize: '17px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '3px' },

    // ── Stat cards ──
    grid3:     { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '40px' },
    card:      { padding: '24px 16px', borderRadius: '22px', textAlign: 'center' as const, WebkitPrintColorAdjust: 'exact' as const },
    cardLabel: { fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'block', marginBottom: '10px' },
    cardVal:   { fontSize: '26px', fontWeight: 900, margin: 0, lineHeight: 1.2, wordBreak: 'break-word' as const },

    // ── Exam section ──
    sectionHead: { fontSize: '30px', fontWeight: 900, color: '#1e293b', marginBottom: '28px', borderLeft: '10px solid #2563eb', paddingLeft: '18px' },
    qList:       { display: 'flex', flexDirection: 'column' as const, gap: '22px' },

    // ── Question card ──
    qCard: (correct: boolean) => ({
      padding: '26px 28px',
      borderRadius: '20px',
      backgroundColor: correct ? '#f0fdf4' : '#fff1f2',
      border: '2px solid',
      borderColor: correct ? '#dcfce7' : '#fecdd3',
      pageBreakInside: 'avoid' as const,
      breakInside: 'avoid' as const,
      WebkitPrintColorAdjust: 'exact' as const,
    }),
    qNum: (correct: boolean) => ({
      color: correct ? '#16a34a' : '#e11d48',
      marginRight: '10px',
      fontWeight: 900,
      fontSize: '26px',
    }),
    qText: { fontSize: '26px', fontWeight: 900, color: '#1e293b', margin: '0 0 18px 0', lineHeight: 1.45 },

    // ── Options grid ──
    optGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    opt: (bg: string, border: string, color: string) => ({
      padding: '16px 18px',
      borderRadius: '14px',
      fontSize: '24px',
      fontWeight: 800,
      border: '2px solid',
      borderColor: border,
      backgroundColor: bg,
      color,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      WebkitPrintColorAdjust: 'exact' as const,
      lineHeight: 1.3,
    }),
    optLetter: { opacity: 0.7, fontSize: '15px', fontWeight: 900, minWidth: '22px' },

    // ── Gap fill ──
    gapBox: (correct: boolean) => ({
      padding: '18px 22px',
      borderRadius: '14px',
      backgroundColor: '#fff',
      border: '3px dashed',
      borderColor: correct ? '#16a34a' : '#e11d48',
      color: correct ? '#15803d' : '#e11d48',
      fontSize: '22px',
      fontWeight: 800,
    }),
    gapLabel: { fontSize: '12px', textTransform: 'uppercase' as const, display: 'block', opacity: 0.7, marginBottom: '6px', fontWeight: 900 },
    correctBox: { padding: '12px 16px', color: '#16a34a', fontSize: '20px', fontWeight: 800, backgroundColor: '#f0fdf4', borderRadius: '10px', border: '2px solid #86efac' },

    // ── Footer ──
    footer:   { marginTop: '48px', borderTop: '4px solid #f1f5f9', paddingTop: '40px' },
    quote:    { fontSize: '19px', fontWeight: 800, color: '#64748b', fontStyle: 'italic' as const, lineHeight: 1.55, textAlign: 'center' as const },
    qAuthor:  { fontSize: '17px', fontWeight: 900, color: '#2563eb', marginTop: '14px', textAlign: 'center' as const },
    fRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginTop: '36px' },
    fLogo:    { width: '48px', height: '48px', background: '#2563eb', borderRadius: '13px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '26px', WebkitPrintColorAdjust: 'exact' as const, flexShrink: 0 },
    fAppName: { margin: 0, fontSize: '24px', fontWeight: 900, color: '#000', lineHeight: 1.2 },
    fSub:     { margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' as const },
    fId:      { fontSize: '14px', fontWeight: 900, color: '#1e293b', margin: 0, marginTop: '4px' },
    fLabel:   { fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: 0 },
  };

  return (
    <>
      {/* ── Responsive styles for screen view ── */}
      <style>{`
        @media (max-width: 840px) {
          #transcript-scaler {
            transform-origin: top center;
            transform: scale(var(--ts, 1));
          }
        }
        .no-print { }
      `}</style>

      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-[100] p-0 font-['Hind_Siliguri']">
        <div className="bg-white w-full h-full md:h-[98vh] md:max-w-6xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl">

          {/* ── Topbar ── */}
          <div className="no-print p-3 md:p-4 bg-white border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={() => setIsEditingName(!isEditingName)}
                className="text-xs sm:text-sm font-bold text-indigo-600 uppercase bg-indigo-50 px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap">
                {isEditingName ? '✓ Save' : '✏️ Edit Name'}
              </button>
              {isEditingName && (
                <input className="border-2 border-indigo-600 px-3 py-1.5 rounded-lg font-bold text-sm outline-none flex-1 sm:w-52 text-black"
                  value={coachingName} autoFocus
                  onChange={e => saveCoachingName(e.target.value)}/>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={handleDownload}
                className="bg-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Download PDF
              </button>
              <button onClick={onClose}
                className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl font-black text-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shrink-0">
                ×
              </button>
            </div>
          </div>

          {/* ── Scrollable preview ── */}
          <div className="flex-1 overflow-auto bg-slate-300">
            {/*
              Screen: scale down 774px wide content to fit phone screen
              PDF:    windowWidth=794 so 774px content = A4 full width
            */}
            <ScaledWrapper>
              <div
                id="premium-transcript"
                style={S.wrapper}
              >
                {/* ── HEADER ── */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h1 style={S.h1}>{coachingName}</h1>
                  <div style={S.bar}/>
                  <p style={S.subtitle}>Academic Transcript Report</p>
                </div>

                {/* ── STAT CARDS ── */}
                <div style={S.grid3}>
                  {/* Student */}
                  <div style={{ ...S.card, backgroundColor: '#f0f9ff', border: '2px solid #bae6fd' }}>
                    <span style={{ ...S.cardLabel, color: '#0369a1' }}>Student</span>
                    <p style={{ ...S.cardVal, color: '#0c4a6e' }}>{attempt.studentName}</p>
                  </div>
                  {/* Rank */}
                  <div style={{ ...S.card, backgroundColor: rankStyle.bg, border: `3px solid ${rankStyle.color}`, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.12)' }}>
                    <div style={{ fontSize: '38px', lineHeight: 1 }}>{rankStyle.icon}</div>
                    <p style={{ fontSize: '34px', fontWeight: 900, color: '#0f172a', margin: '8px 0' }}>#{rankData.rank}</p>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: rankStyle.color, display: 'block' }}>{rankStyle.label}</span>
                  </div>
                  {/* Score */}
                  <div style={{ ...S.card, backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0' }}>
                    <span style={{ ...S.cardLabel, color: '#15803d' }}>Score</span>
                    <p style={{ ...S.cardVal, color: '#14532d', fontSize: '28px' }}>{attempt.score}/{totalPossibleMarks}</p>
                  </div>
                </div>

                {/* ── EXAM ANALYSIS ── */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={S.sectionHead}>EXAM ANALYSIS</h3>
                  <div style={S.qList}>
                    {quiz.questions.map((q: any, idx: number) => {
                      const userAns   = String((attempt.answers as any)?.[q.id] || '').trim();
                      const correctAns= String(q.answer || q.correctAnswer || '').trim();
                      const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase() && userAns !== '';
                      const isGapFill = !q.options || q.options.length <= 1;

                      return (
                        <div key={idx} className="no-break" style={S.qCard(isCorrect)}>
                          {/* Question text — centered */}
                          <p style={{ ...S.qText, textAlign: 'center' }}>
                            <span style={S.qNum(isCorrect)}>{idx + 1}.</span>
                            {q.text || q.questionText}
                          </p>

                          {isGapFill ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={S.gapBox(isCorrect)}>
                                <span style={S.gapLabel}>Your Answer:</span>
                                {userAns || 'No Answer'}
                              </div>
                              {!isCorrect && (
                                <div style={S.correctBox}>✅ Correct: {correctAns}</div>
                              )}
                            </div>
                          ) : (
                            /* Options — centered grid */
                            <div style={{ ...S.optGrid, justifyItems: 'center' }}>
                              {(q.options || []).map((opt: string, oIdx: number) => {
                                const isSelected = userAns === opt.trim();
                                const isRight    = correctAns === opt.trim();
                                let bg = '#fff', border = '#e2e8f0', color = '#475569';
                                if      (isSelected && isRight)  { bg='#16a34a'; color='#fff'; border='#16a34a'; }
                                else if (isSelected && !isRight) { bg='#e11d48'; color='#fff'; border='#e11d48'; }
                                else if (isRight)                { bg='#f0fdf4'; border='#22c55e'; color='#15803d'; }
                                return (
                                  <div key={oIdx} style={{ ...S.opt(bg, border, color), width: '100%', justifyContent: 'center' }}>
                                    <span style={S.optLetter}>{String.fromCharCode(65+oIdx)}.</span>
                                    <span style={{ flex: 1, textAlign: 'center', wordBreak: 'break-word' }}>{opt}</span>
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

                {/* ── FOOTER ── */}
                <div style={S.footer}>
                  <p style={S.quote}>"{randomQuote.text}"</p>
                  <p style={S.qAuthor}>— {randomQuote.author}</p>
                  <div style={S.fRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={S.fLogo}>Q</div>
                      <div>
                        <p style={S.fAppName}>EDUQUIZ <span style={{ color: '#2563eb' }}>PRO</span></p>
                        <p style={S.fSub}>Smart Assessment System</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={S.fLabel}>Official Verified Record</p>
                      <p style={S.fId}>ID: {quiz.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

              </div>
            </ScaledWrapper>
          </div>
        </div>
      </div>
    </>
  );
};

// ── ScaledWrapper — mobile screen এ scale করে, PDF এ কোনো effect নেই ──
const ScaledWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScale] = React.useState(1);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      // 774px content + 32px padding
      const needed = 774 + 32;
      if (vw < needed) {
        setScale(vw / needed);
      } else {
        setScale(1);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px 0',
      }}
    >
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        // compensate height so scroll works correctly
        marginBottom: scale < 1 ? `calc(${(scale - 1) * 100}% )` : '0',
      }}>
        <div style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

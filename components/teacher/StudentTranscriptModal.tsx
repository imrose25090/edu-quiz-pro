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
      { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
      { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
      { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
      { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
      { text: "Intelligence plus character—that is the goal of true education.", author: "Martin Luther King Jr." },
      { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
      { text: "Teachers can open the door, but you must enter it yourself.", author: "Chinese Proverb" },
      { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
      { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
      { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
      { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
      { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
      { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
      { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
      { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
      { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
      { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Oliver Goldsmith" },
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

  const handleDownload = () => {
    const element = document.getElementById('premium-transcript');
    if (!element) return;
    
    const fileName = `${quiz.title.replace(/\s+/g, '_')}_${attempt.studentName.replace(/\s+/g, '_')}.pdf`;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: fileName,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3,
        useCORS: true, 
        scrollY: 0, 
        windowWidth: 1200,
        windowHeight: 1600,
        letterRendering: true,
        allowTaint: true,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-[100] p-0 md:p-4 font-['Hind_Siliguri']">
      {/* Main Container */}
      <div className="bg-white w-full h-full md:h-[98vh] md:max-w-6xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header Controls */}
        <div className="p-3 md:p-4 bg-white border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print shadow-sm shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setIsEditingName(!isEditingName)} 
              className="text-xs sm:text-sm font-bold text-indigo-600 uppercase bg-indigo-50 px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap"
            >
              {isEditingName ? 'Save' : 'Edit Name'}
            </button>
            {isEditingName && (
              <input 
                className="border-2 border-indigo-600 px-3 py-1.5 rounded-lg font-bold text-sm sm:text-base outline-none flex-1 sm:w-48 text-black"
                value={coachingName}
                onChange={(e) => saveCoachingName(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={handleDownload} 
              className="bg-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download PDF</span>
            </button>
            <button 
              onClick={onClose} 
              className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl font-black text-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shrink-0"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Content Area - Centered */}
        <div className="flex-1 overflow-auto bg-slate-200">
          {/* 
            Wrapper: flex justify-center দিয়ে মাঝখানে আনা হয়েছে
            এবং min-w-full সরিয়ে দিয়ে সঠিকভাবে কেন্দ্রীভূত করা হয়েছে
          */}
          <div className="w-full min-h-full flex justify-center p-4 md:p-8">
            <div 
              id="premium-transcript" 
              className="bg-white shadow-2xl shrink-0"
              style={{ 
                width: '794px',
                minWidth: '794px',
                maxWidth: '794px',
                margin: '0',
                padding: '50px 40px',
                boxSizing: 'border-box',
                fontFamily: "'Hind Siliguri', sans-serif"
              }}
            >
              
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '45px' }}>
                <h1 style={{ 
                  fontSize: '64px',
                  fontWeight: '1000', 
                  color: '#1e40af', 
                  margin: '0', 
                  textTransform: 'uppercase', 
                  lineHeight: '1.1'
                }}>
                  {coachingName}
                </h1>
                <div style={{ 
                  height: '8px', 
                  width: '120px', 
                  backgroundColor: '#3b82f6', 
                  margin: '25px auto', 
                  borderRadius: '10px' 
                }}></div>
                <p style={{ 
                  fontSize: '24px',
                  fontWeight: '900', 
                  color: '#64748b', 
                  textTransform: 'uppercase', 
                  letterSpacing: '4px' 
                }}>
                  Academic Transcript Report
                </p>
              </div>

              {/* Dashboard */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '25px', 
                marginBottom: '50px' 
              }}>
                <div style={{ 
                  padding: '35px 20px', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '28px', 
                  textAlign: 'center', 
                  border: '3px solid #bae6fd', 
                  WebkitPrintColorAdjust: 'exact' 
                }}>
                  <span style={{ 
                    fontSize: '18px',
                    fontWeight: '900', 
                    color: '#0369a1', 
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '12px'
                  }}>Student</span>
                  <p style={{ 
                    fontSize: '32px',
                    fontWeight: '1000', 
                    color: '#0c4a6e', 
                    margin: '0',
                    lineHeight: '1.2'
                  }}>{attempt.studentName}</p>
                </div>

                <div style={{ 
                  padding: '35px 20px', 
                  backgroundColor: style.bg, 
                  borderRadius: '28px', 
                  textAlign: 'center', 
                  border: `5px solid ${style.color}`, 
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', 
                  WebkitPrintColorAdjust: 'exact' 
                }}>
                  <div style={{ fontSize: '48px', lineHeight: '1' }}>{style.icon}</div>
                  <p style={{ 
                    fontSize: '44px',
                    fontWeight: '1000', 
                    color: '#0f172a', 
                    margin: '10px 0' 
                  }}>#{rankData.rank}</p>
                  <span style={{ 
                    fontSize: '16px',
                    fontWeight: '900', 
                    color: style.color,
                    display: 'block'
                  }}>{style.label}</span>
                </div>

                <div style={{ 
                  padding: '35px 20px', 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: '28px', 
                  textAlign: 'center', 
                  border: '3px solid #bbf7d0', 
                  WebkitPrintColorAdjust: 'exact' 
                }}>
                  <span style={{ 
                    fontSize: '18px',
                    fontWeight: '900', 
                    color: '#15803d', 
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '12px'
                  }}>Score</span>
                  <p style={{ 
                    fontSize: '36px',
                    fontWeight: '1000', 
                    color: '#14532d', 
                    margin: '0' 
                  }}>{attempt.score}/{totalPossibleMarks}</p>
                </div>
              </div>

              {/* Exam Analysis */}
              <div style={{ marginBottom: '50px' }}>
                <h3 style={{ 
                  fontSize: '40px',
                  fontWeight: '1000', 
                  color: '#1e293b', 
                  marginBottom: '35px', 
                  borderLeft: '12px solid #2563eb', 
                  paddingLeft: '25px' 
                }}>EXAM ANALYSIS</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {quiz.questions.map((q: any, idx: number) => {
                    const userAns = String((attempt.answers as any)?.[q.id] || '').trim();
                    const correctAns = String(q.answer || q.correctAnswer || '').trim();
                    const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase() && userAns !== "";
                    
                    const isGapFill = !q.options || q.options.length <= 1;

                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '35px', 
                          borderRadius: '28px', 
                          backgroundColor: isCorrect ? '#f0fdf4' : '#fff1f2', 
                          border: '4px solid', 
                          borderColor: isCorrect ? '#dcfce7' : '#fecdd3', 
                          pageBreakInside: 'avoid', 
                          WebkitPrintColorAdjust: 'exact' 
                        }}
                      >
                        <p style={{ 
                          fontSize: '32px',
                          fontWeight: '900', 
                          color: '#1e293b', 
                          margin: '0 0 22px 0', 
                          lineHeight: '1.5' 
                        }}>
                          <span style={{ 
                            color: isCorrect ? '#16a34a' : '#e11d48', 
                            marginRight: '15px',
                            fontWeight: '1000',
                            fontSize: '36px'
                          }}>{idx + 1}.</span> 
                          {q.text || q.questionText}
                        </p>
                        
                        {isGapFill ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ 
                              padding: '22px 28px', 
                              borderRadius: '16px', 
                              backgroundColor: '#ffffff', 
                              border: '4px dashed', 
                              borderColor: isCorrect ? '#16a34a' : '#e11d48',
                              color: isCorrect ? '#15803d' : '#e11d48',
                              fontSize: '28px',
                              fontWeight: '900'
                            }}>
                              <span style={{ 
                                fontSize: '16px',
                                textTransform: 'uppercase', 
                                display: 'block', 
                                opacity: 0.7,
                                marginBottom: '8px',
                                fontWeight: '900'
                              }}>Your Answer:</span>
                              {userAns || "No Answer"}
                            </div>
                            {!isCorrect && (
                              <div style={{ 
                                padding: '16px 20px', 
                                color: '#16a34a', 
                                fontSize: '24px',
                                fontWeight: '900',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '12px',
                                border: '3px solid #86efac'
                              }}>
                                ✅ Correct: {correctAns}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '16px' 
                          }}>
                            {(q.options || []).map((opt: string, oIdx: number) => {
                              const isSelected = userAns === opt.trim();
                              const isRight = correctAns === opt.trim();
                              
                              let optBg = '#ffffff';
                              let optBorder = '#e2e8f0';
                              let optColor = '#475569';

                              if (isSelected && isRight) { 
                                optBg = '#16a34a'; 
                                optColor = '#ffffff'; 
                                optBorder = '#16a34a'; 
                              }
                              else if (isSelected && !isRight) { 
                                optBg = '#e11d48'; 
                                optColor = '#ffffff'; 
                                optBorder = '#e11d48'; 
                              }
                              else if (isRight) { 
                                optBg = '#f0fdf4'; 
                                optBorder = '#22c55e'; 
                                optColor = '#15803d'; 
                              }

                              return (
                                <div key={oIdx} style={{ 
                                  padding: '22px 24px', 
                                  borderRadius: '18px', 
                                  fontSize: '24px',
                                  fontWeight: '900', 
                                  border: '3px solid', 
                                  borderColor: optBorder, 
                                  backgroundColor: optBg, 
                                  color: optColor, 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: '12px',
                                  WebkitPrintColorAdjust: 'exact',
                                  lineHeight: '1.4'
                                }}>
                                  <span style={{ 
                                    opacity: 0.7, 
                                    fontSize: '20px',
                                    fontWeight: '1000',
                                    minWidth: '30px'
                                  }}>
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span> 
                                  <span style={{ flex: 1 }}>{opt}</span>
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
              <div style={{ 
                marginTop: '60px', 
                borderTop: '5px solid #f1f5f9', 
                paddingTop: '55px' 
              }}>
                <div style={{ textAlign: 'center', marginBottom: '55px' }}>
                  <p style={{ 
                    fontSize: '28px',
                    fontWeight: '900', 
                    color: '#64748b', 
                    fontStyle: 'italic', 
                    padding: '0 40px',
                    lineHeight: '1.6'
                  }}>"{randomQuote.text}"</p>
                  <p style={{ 
                    fontSize: '24px',
                    fontWeight: '1000', 
                    color: '#2563eb', 
                    marginTop: '20px' 
                  }}>— {randomQuote.author}</p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: '25px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px' 
                  }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      background: '#2563eb', 
                      borderRadius: '16px', 
                      color: '#fff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '1000', 
                      fontSize: '32px', 
                      WebkitPrintColorAdjust: 'exact',
                      flexShrink: 0
                    }}>Q</div>
                    <div>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '32px',
                        fontWeight: '1000', 
                        color: 'black',
                        lineHeight: '1.2'
                      }}>EDUQUIZ <span style={{ color: '#2563eb' }}>PRO</span></p>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px',
                        color: '#94a3b8', 
                        fontWeight: '900', 
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                      }}>SMART ASSESSMENT SYSTEM</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px',
                      fontWeight: '1000', 
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px'
                    }}>OFFICIAL VERIFIED RECORD</p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px',
                      fontWeight: '900', 
                      color: '#1e293b',
                      marginTop: '8px'
                    }}>ID: {quiz.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

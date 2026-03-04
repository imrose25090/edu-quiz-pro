import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Class, Subject } from '../../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface QuestionPaperViewProps {
  selectedQuiz: Quiz;
  classes: Class[];
  subjects: Subject[];
  branding: { name: string; motto: string; address: string };
  showAnswers: boolean;
  setShowAnswers: (val: boolean) => void;
  onBack: () => void;
}

export const QuestionPaperView: React.FC<QuestionPaperViewProps> = ({
  selectedQuiz,
  classes,
  subjects,
  branding: initialBranding,
  showAnswers,
  setShowAnswers,
  onBack,
}) => {
  const [paperName, setPaperName] = useState(initialBranding.name);
  const [paperMotto, setPaperMotto] = useState(initialBranding.motto);
  const [fontSize, setFontSize] = useState(14);
  const [margin, setMargin] = useState(20);
  const [lineSpacing, setLineSpacing] = useState(1.2);
  const [columns, setColumns] = useState(1);
  const [numberStyle, setNumberStyle] = useState('decimal');
  
  const [showQuote, setShowQuote] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [quote, setQuote] = useState("");

  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const quotes = [
      "“The beautiful thing about learning is that no one can take it away from you.”",
      "“Education is the most powerful weapon which you can use to change the world.”",
      "“আপনার আজকের কঠোর পরিশ্রম আগামীকালের সাফল্যের ভিত্তি।”",
      "“সফলতার কোনো সংক্ষিপ্ত পথ নেই, এটি কঠোর পরিশ্রমের ফল।”"
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const handleInternalDownload = () => {
    const element = paperRef.current;
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `${selectedQuiz.title.replace(/\s+/g, '_')}_Paper.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        scrollY: 0,
        letterRendering: true,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  const toRoman = (num: number) => {
    const lookup: any = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '';
    for (let i in lookup) {
      while (num >= lookup[i]) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-2 md:p-6 animate-in fade-in duration-500 font-['Hind_Siliguri'] bg-slate-100 min-h-screen">
      
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 space-y-4 bg-white p-5 rounded-[24px] border border-slate-200 h-fit lg:sticky lg:top-6 shadow-xl no-print order-2 lg:order-1">
        <button onClick={onBack} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase hover:bg-slate-200 transition-all">
          ← Back
        </button>

        <div className="space-y-4 pt-2">
          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-1">Coaching Branding</h3>
          <div className="space-y-3">
            <input className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold text-black outline-none focus:ring-2 ring-indigo-500" value={paperName} onChange={(e) => setPaperName(e.target.value)} placeholder="Coaching Name" />
            <input className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold text-black outline-none focus:ring-2 ring-indigo-500" value={paperMotto} onChange={(e) => setPaperMotto(e.target.value)} placeholder="Motto" />
          </div>

          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-1 pt-2">Layout Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Font Size: {fontSize}px</span></label>
              <input type="range" min="8" max="30" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <div>
              <label className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Spacing: {lineSpacing}</span></label>
              <input type="range" min="1" max="3" step="0.1" value={lineSpacing} onChange={(e) => setLineSpacing(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <select value={columns} onChange={(e) => setColumns(parseInt(e.target.value))} className="p-2 bg-slate-50 border rounded-lg text-xs font-bold text-black">
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
             </select>
             <select value={numberStyle} onChange={(e) => setNumberStyle(e.target.value)} className="p-2 bg-slate-50 border rounded-lg text-xs font-bold text-black">
                <option value="decimal">1, 2, 3</option>
                <option value="upper-roman">I, II, III</option>
             </select>
          </div>
        </div>

        <button onClick={handleInternalDownload} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg uppercase text-xs">
          Download PDF
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 order-1 lg:order-2 overflow-x-auto pb-10">
        <div className="flex justify-center mb-6 no-print gap-4">
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border">
            <button onClick={() => setShowAnswers(false)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${!showAnswers ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Questions</button>
            <button onClick={() => setShowAnswers(true)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${showAnswers ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Answer Key</button>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            ref={paperRef}
            className="bg-white shadow-2xl relative"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: `${margin}px`,
              fontSize: `${fontSize}px`,
              fontFamily: "'Hind Siliguri', sans-serif",
              color: '#000',
              display: 'block'
            }}
          >
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-8">
              <h1 className="text-4xl font-black uppercase tracking-tight leading-none mb-2 text-black">{paperName}</h1>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">{paperMotto}</p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-[13px] font-bold border-t border-dashed border-black pt-3 text-black">
                <div className="text-left leading-tight">
                  <p>শ্রেণী: {classes.find(c => c.id === selectedQuiz.classId)?.name || 'N/A'}</p>
                  <p>বিষয়: {subjects.find(s => s.id === selectedQuiz.subjectId)?.name || 'N/A'}</p>
                </div>
                <div className="flex justify-center items-center">
                  <span className="border-2 border-black px-4 py-1 font-black uppercase text-xs">{selectedQuiz.title}</span>
                </div>
                <div className="text-right leading-tight">
                  <p>পূর্ণমান: {selectedQuiz.config?.totalMarks || 0}</p>
                  <p>সময়: {selectedQuiz.config?.totalTime || 0} মিনিট</p>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div style={{ columnCount: columns, columnGap: '40px', columnRule: columns > 1 ? '1px solid #000' : 'none' }}>
              <div style={{ lineHeight: lineSpacing }} className="space-y-8">
                {selectedQuiz.questions?.map((q: any, index: number) => (
                  <div key={q.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="block mb-6">
                    <div className="flex items-start gap-3">
                      <span className="font-black text-black shrink-0 min-w-[28px]">
                        {numberStyle === 'upper-roman' ? `${toRoman(index + 1)}.` : `${index + 1}.`}
                      </span>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-black" style={{ lineHeight: lineSpacing }}>{q.text || q.questionText || q.question}</p>
                          <span className="text-[11px] font-bold text-black whitespace-nowrap">[{q.marks || 1}]</span>
                        </div>

                        {q.type === 'MCQ' && q.options && (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3 text-black">
                            {q.options.map((opt: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-black shrink-0">
                                  {String.fromCharCode(97 + idx)}
                                </span>
                                <span style={{ lineHeight: lineSpacing }}>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ✅ Answer Centered in Box */}
                        {showAnswers && (
                          <div className="mt-3 flex justify-center">
                            <div 
                              style={{
                                border: '2px solid #2563eb',
                                padding: '6px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#eff6ff',
                                borderRadius: '8px',
                                WebkitPrintColorAdjust: 'exact',
                                minWidth: '60%' // Ensures the box looks balanced
                              }}
                            >
                              <span style={{ fontWeight: 1000, fontSize: '13px', color: '#1e40af', textTransform: 'uppercase', textAlign: 'center' }}>
                                ➤ সঠিক উত্তর: {q.correctAnswer || q.answer || "N/A"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="mt-16 relative z-10">
              {showQuote && quote && (
                <div 
                  className="py-4 mb-8 text-center" 
                  style={{ 
                    border: 'none', // No border as requested
                    backgroundColor: 'transparent', 
                    WebkitPrintColorAdjust: 'exact' 
                  }}
                >
                  <p style={{ color: '#2563eb', fontStyle: 'italic', fontSize: '16px', fontWeight: '900' }}>
                    {quote}
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-end pt-4">
                <div className="flex items-center gap-2">
                  <div style={{ width: '36px', height: '36px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitPrintColorAdjust: 'exact' }}>
                    <span style={{ color: 'white', fontWeight: 900, fontSize: '18px' }}>E</span>
                  </div>
                  <h4 className="text-xl font-black text-black">
                    EduQuiz <span style={{ color: '#2563eb' }}>PRO</span>
                  </h4>
                </div>
                
                {showSignature && (
                  <div className="text-right">
                    <div className="w-44 border-t-2 border-black mb-1"></div>
                    <p className="text-[10px] font-black uppercase text-black tracking-widest">Invigilator Signature</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

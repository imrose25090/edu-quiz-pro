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
  const [margin, setMargin] = useState(40);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [titleFont, setTitleFont] = useState("'Hind Siliguri', sans-serif");
  const [columns, setColumns] = useState(1);
  const [numberStyle, setNumberStyle] = useState('decimal');
  
  const [showQuote, setShowQuote] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [quote, setQuote] = useState("");

  // রিফেন্স এড করা হলো
  const paperRef = useRef<HTMLDivElement>(null);

  const workingFonts = {
    "Professional & Clean": [
      { name: "Default Bangla", value: "'Hind Siliguri', sans-serif" },
      { name: "Modern Sans", value: "'Inter', sans-serif" },
      { name: "Classic Serif", value: "'Merriweather', serif" },
      { name: "Formal Arial", value: "Arial, sans-serif" }
    ],
    "Bold & Impact": [
      { name: "Impact Style", value: "Impact, Charcoal, sans-serif" },
      { name: "Bebas Neue Look", value: "'Oswald', sans-serif" },
      { name: "Gaming Montserrat", value: "'Montserrat', sans-serif" }
    ],
    "Elegant & Script": [
      { name: "Playfair Luxury", value: "'Playfair Display', serif" },
      { name: "Dancing Script", value: "'Dancing Script', cursive" },
      { name: "Georgia Serif", value: "Georgia, serif" }
    ]
  };

  useEffect(() => {
    const quotes = [
      "“The beautiful thing about learning is that no one can take it away from you.”",
      "“Education is the most powerful weapon which you can use to change the world.”",
      "“আপনার আজকের কঠোর পরিশ্রম আগামীকালের সাফল্যের ভিত্তি।”",
      "“সফলতার কোনো সংক্ষিপ্ত পথ নেই, এটি কঠোর পরিশ্রমের ফল।”"
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  // ইন্টারনাল ডাউনলোড হ্যান্ডলার
  const handleInternalDownload = () => {
    const element = paperRef.current;
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `${selectedQuiz.title.replace(/\s+/g, '_')}_Question_Paper.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        scrollY: 0,
        windowWidth: 800 // A4 সাইজ রেন্ডারিং নিশ্চিত করতে
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 font-['Hind_Siliguri']">
      
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 space-y-6 bg-white p-6 rounded-[32px] border border-slate-200 h-fit sticky top-6 shadow-sm no-print">
        <button onClick={onBack} className="w-full py-3 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase mb-4 hover:bg-slate-100 transition-all">
          ← Back to Panel
        </button>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Style & Branding</h3>
          <input className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none ring-offset-2 focus:ring-2 ring-indigo-500 text-black" value={paperName} onChange={(e) => setPaperName(e.target.value)} placeholder="Institute Name" />
          <input className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none ring-offset-2 focus:ring-2 ring-indigo-500 text-black" value={paperMotto} onChange={(e) => setPaperMotto(e.target.value)} placeholder="Motto" />
          
          <label className="text-[10px] font-black text-slate-400 block -mb-2 ml-1 uppercase">Select Title Font</label>
          <select 
            value={titleFont} 
            onChange={(e) => setTitleFont(e.target.value)} 
            className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none cursor-pointer hover:bg-slate-100 transition-colors text-black"
          >
            {Object.entries(workingFonts).map(([category, fonts]) => (
              <optgroup label={category} key={category}>
                {fonts.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">Layout & Spacing</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowQuote(!showQuote)} className={`p-2 rounded-xl text-[10px] font-bold transition-all ${showQuote ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>Quotes</button>
            <button onClick={() => setShowSignature(!showSignature)} className={`p-2 rounded-xl text-[10px] font-bold transition-all ${showSignature ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>Signature</button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Line Spacing: {lineSpacing}</label>
              <input type="range" min="1.0" max="3.0" step="0.1" value={lineSpacing} onChange={(e) => setLineSpacing(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Margin: {margin}px</label>
              <input type="range" min="10" max="100" value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select value={columns} onChange={(e) => setColumns(parseInt(e.target.value))} className="w-full p-2 bg-slate-50 border-none rounded-lg text-[10px] font-bold outline-none text-black">
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
              </select>
              <select value={numberStyle} onChange={(e) => setNumberStyle(e.target.value)} className="w-full p-2 bg-slate-50 border-none rounded-lg text-[10px] font-bold outline-none text-black">
                <option value="decimal">1, 2, 3...</option>
                <option value="upper-roman">I, II, III...</option>
                <option value="upper-alpha">A, B, C...</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleInternalDownload} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
          Download PDF
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-x-auto pb-10">
        <div className="flex justify-center mb-6 no-print gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
            <button onClick={() => setShowAnswers(false)} className={`px-8 py-2 rounded-xl text-xs font-black uppercase transition-all ${!showAnswers ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Questions</button>
            <button onClick={() => setShowAnswers(true)} className={`px-8 py-2 rounded-xl text-xs font-black uppercase transition-all ${showAnswers ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>Answer Key</button>
          </div>
        </div>

        <div
          ref={paperRef}
          className="bg-white mx-auto shadow-2xl relative"
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
          {/* Header Section */}
          <div className="text-center border-b-2 border-black pb-4 mb-8">
            <h1 
              style={{ fontFamily: titleFont }} 
              className="text-4xl font-black text-black uppercase tracking-tight leading-none mb-1"
            >
              {paperName}
            </h1>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] italic">{paperMotto}</p>

            <div className="grid grid-cols-3 gap-2 mt-4 text-[13px] font-bold border-t border-dashed border-slate-300 pt-3 text-slate-800">
              <div className="text-left leading-normal">
                <p>Class: {classes.find(c => c.id === selectedQuiz.classId)?.name || 'N/A'}</p>
                <p>Subject: {subjects.find(s => s.id === selectedQuiz.subjectId)?.name || 'N/A'}</p>
              </div>
              <div className="flex justify-center items-center">
                <span className="border-2 border-black px-4 py-1 font-black uppercase text-sm tracking-tighter">{selectedQuiz.title}</span>
              </div>
              <div className="text-right leading-normal">
                <p>Full Marks: {selectedQuiz.config?.totalMarks || 0}</p>
                <p>Time: {selectedQuiz.config?.totalTime || 0} Min</p>
              </div>
            </div>
          </div>

          {/* Questions Container */}
          <div style={{ 
            columnCount: columns, 
            columnGap: '40px', 
            columnRule: columns > 1 ? '1px solid #000' : 'none',
            color: '#000',
            position: 'relative',
            zIndex: 10
          }}>
            <ol style={{ listStyleType: numberStyle, paddingLeft: '25px', lineHeight: lineSpacing }} className="space-y-6">
              {selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
                selectedQuiz.questions.map((q: any) => (
                  <li key={q.id} className="break-inside-avoid">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <p className="font-bold text-black leading-snug">
                        {q.text || q.questionText || q.question || "Question Missing"}
                      </p>
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">[{q.marks || 1}]</span>
                    </div>

                    {q.type === 'MCQ' && q.options && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 ml-1 text-black">
                        {q.options.map((opt: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-black shrink-0">
                              {String.fromCharCode(97 + idx)}
                            </span>
                            <span className="font-medium text-black">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAnswers && (
                      <div className="mt-2 bg-slate-50 border-l-4 border-indigo-600 px-3 py-1 rounded-sm">
                        <p className="text-indigo-600 font-black text-[11px] flex items-center gap-2">
                          <span className="uppercase opacity-60">ANS:</span>
                          <span className="text-[1.1em]">{q.correctAnswer || q.answer || "N/A"}</span>
                        </p>
                      </div>
                    )}
                  </li>
                ))
              ) : (
                <p className="text-center text-slate-400">No questions available</p>
              )}
            </ol>
          </div>

          {/* Footer Section */}
          <div className="mt-16 break-inside-avoid relative z-10">
            {showQuote && quote && (
              <div className="border-t border-b border-slate-100 py-4 mb-8 text-center">
                <p className="text-slate-400 italic text-sm font-medium px-10">{quote}</p>
              </div>
            )}

            <div className="flex justify-between items-end">
              <div className="text-left">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Generated by</p>
                <h4 className="text-lg font-black tracking-tighter text-slate-900 leading-none">EduQuiz Pro</h4>
              </div>
              
              {showSignature && (
                <div className="text-right pb-2">
                  <div className="w-44 border-t-2 border-black mb-1"></div>
                  <p className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Invigilator Signature</p>
                </div>
              )}
            </div>
          </div>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-45deg] z-0 select-none overflow-hidden">
             <h1 className="text-[120px] font-black uppercase whitespace-nowrap">{paperName}</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

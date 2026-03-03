import React, { useEffect } from 'react';

interface QuizScreenProps {
  activeQuiz: any;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>; // এটি মিসিং ছিল
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ 
  activeQuiz, 
  timeLeft, 
  setTimeLeft, // এটি প্রপস হিসেবে রিসিভ করছি
  answers, 
  setAnswers, 
  onSubmit 
}) => {

  // ✅ অটোমেটিক টাইমার লজিক
  useEffect(() => {
    if (timeLeft <= 0) {
      alert("সময় শেষ! কুইজটি অটোমেটিক সাবমিট হচ্ছে।");
      onSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onSubmit, setTimeLeft]);

  const handleOptionSelect = (qId: string, optionValue: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionValue.trim()
    }));
  };

  const handleTextInput = (qId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: value
    }));
  };

  // ✅ ইনপুট টাইপ ডিটেকশন লজিক
  const isInputType = (q: any) => {
    if (!q) return false;
    const type = q.type?.toUpperCase() || '';
    if (type === 'FILL_IN_THE_GAP' || type === 'SHORT_ANSWER' || q.requiresInput) return true;
    if (!q.options || !Array.isArray(q.options) || q.options.length === 0) return true;
    const hasValidOptions = q.options.some((opt: any) => opt && String(opt).trim() !== "");
    if (!hasValidOptions) return true;
    if (q.options.length === 1) return true;
    return false;
  };

  // যদি কোনো কারণে activeQuiz না থাকে তবে লোডিং দেখাবে (সাদা স্ক্রিন হবে না)
  if (!activeQuiz || !activeQuiz.questions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 font-bold text-slate-500">কুইজ লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 space-y-8 font-['Hind_Siliguri'] pb-20 animate-in fade-in duration-500">
      
      {/* Header section with Timer */}
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-4 md:p-6 rounded-[32px] shadow-xl border border-white sticky top-4 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl shadow-lg shadow-indigo-200">
            📚
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-sm md:text-xl leading-none truncate max-w-[120px] md:max-w-none">
              {activeQuiz.title}
            </h3>
            <p className="text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Live Examination</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 bg-slate-900 px-4 py-2 md:px-6 md:py-3 rounded-2xl shadow-2xl border border-indigo-500/30">
          <span className="text-indigo-400 animate-pulse text-xs md:text-base font-bold">●</span>
          <span className="text-white font-mono text-lg md:text-2xl font-black">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-2 bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
        <div 
          className="bg-indigo-600 h-full transition-all duration-700 ease-out"
          style={{ width: `${(Object.keys(answers).length / activeQuiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Questions List */}
      <div className="space-y-6 md:space-y-10">
        {activeQuiz.questions.map((q: any, idx: number) => {
          const isTextInput = isInputType(q);
          
          return (
            <div 
              key={q.id || idx} 
              className="bg-white p-6 md:p-10 rounded-[40px] md:rounded-[50px] shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 w-2.5 h-full transition-colors ${
                answers[q.id] ? 'bg-emerald-500' : 'bg-slate-100 group-hover:bg-indigo-500'
              }`} />
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-start">
                    <span className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[24px] flex items-center justify-center font-black shrink-0 text-xl md:text-2xl transition-all ${
                    answers[q.id] 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    }`}>
                    {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="md:hidden">
                         {isTextInput ? <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Short Answer</span> : <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MCQ</span>}
                    </div>
                </div>
                
                <div className="space-y-8 w-full">
                  <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-[1.4]">
                    {q.questionText || q.text}
                  </p>

                  {isTextInput ? (
                    <div className="relative animate-in zoom-in-95 duration-300">
                      <input 
                        type="text"
                        placeholder="এখানে তোমার উত্তরটি টাইপ করো..."
                        className="w-full p-6 md:p-8 bg-slate-50 border-4 border-slate-100 rounded-[28px] md:rounded-[35px] font-bold text-xl md:text-2xl text-slate-800 focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-inner placeholder:text-slate-300"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextInput(q.id, e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-left-2 duration-300">
                      {(q.options || []).map((opt: string, i: number) => (
                        <button 
                          key={i} 
                          onClick={() => handleOptionSelect(q.id, opt)} 
                          className={`group relative p-6 md:p-8 rounded-[25px] md:rounded-[30px] border-2 text-left transition-all duration-300 ${
                            answers[q.id] === opt.trim() 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 -translate-y-1' 
                            : 'bg-slate-50 border-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <span className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-base md:text-lg font-black transition-colors ${
                              answers[q.id] === opt.trim() ? 'bg-white/20 text-white' : 'bg-white text-slate-400 shadow-sm border border-slate-100'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="font-bold text-lg md:text-2xl">{opt}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="pt-12 px-2 md:px-0">
        <button 
          onClick={() => {
            if(window.confirm("তুমি কি নিশ্চিত যে পরীক্ষাটি শেষ করতে চাও?")) {
              onSubmit();
            }
          }} 
          className="w-full py-7 md:py-10 bg-slate-900 text-white rounded-[40px] md:rounded-[50px] font-black text-2xl md:text-4xl shadow-2xl hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-6 group"
        >
          <span>সাবমিট করো</span>
          <span className="group-hover:translate-x-3 transition-transform duration-500">🚀</span>
        </button>
      </div>
    </div>
  );
};

export default QuizScreen;

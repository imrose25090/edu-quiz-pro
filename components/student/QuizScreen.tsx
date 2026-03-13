import { WaterfallTimer } from "./WaterfallTimer";
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface QuizScreenProps {
  activeQuiz: any;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  activeQuiz,
  timeLeft,
  setTimeLeft,
  answers,
  setAnswers,
  onSubmit,
}) => {
  /* ─── Submission lock ──────────────────────────────────── */
  const hasSubmitted = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeSubmit = useCallback((auto = false) => {
    if (hasSubmitted.current || isSubmitting) return;
    hasSubmitted.current = true;
    setIsSubmitting(true);
    if (auto) alert('সময় শেষ! কুইজটি অটোমেটিক সাবমিট হচ্ছে।');
    onSubmit();
  }, [isSubmitting, onSubmit]);

  /* ─── Timer ────────────────────────────────────────────── */
  useEffect(() => {
    if (hasSubmitted.current) return;
    if (timeLeft <= 0) { safeSubmit(true); return; }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); safeSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Draggable floating timer ─────────────────────────── */
  const [pos, setPos]           = useState({ x: 16, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragOffset              = useRef({ dx: 0, dy: 0 });
  const timerRef                = useRef<HTMLDivElement>(null);

  // POINTER events (works for both mouse & touch)
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOffset.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const el = timerRef.current;
    const maxX = window.innerWidth  - (el?.offsetWidth  || 120) - 8;
    const maxY = window.innerHeight - (el?.offsetHeight || 70)  - 8;
    setPos({
      x: Math.max(8, Math.min(e.clientX - dragOffset.current.dx, maxX)),
      y: Math.max(8, Math.min(e.clientY - dragOffset.current.dy, maxY)),
    });
  };

  const onPointerUp = () => setDragging(false);

  /* ─── Helpers ──────────────────────────────────────────── */
  const handleOptionSelect = (qId: string, val: string) => {
    if (hasSubmitted.current) return;
    setAnswers(prev => ({ ...prev, [qId]: val.trim() }));
  };

  const handleTextInput = (qId: string, val: string) => {
    if (hasSubmitted.current) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const isInputType = (q: any) => {
    if (!q) return false;
    const t = q.type?.toUpperCase() || '';
    if (t === 'FILL_IN_THE_GAP' || t === 'SHORT_ANSWER' || q.requiresInput) return true;
    if (!Array.isArray(q.options) || q.options.length === 0) return true;
    if (!q.options.some((o: any) => o && String(o).trim())) return true;
    if (q.options.length === 1) return true;
    return false;
  };

  if (!activeQuiz?.questions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        <p className="mt-4 font-bold text-slate-500">কুইজ লোড হচ্ছে...</p>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount    = activeQuiz.questions.length;
  const progress      = (answeredCount / totalCount) * 100;
  const mins          = Math.floor(timeLeft / 60);
  const secs          = (timeLeft % 60).toString().padStart(2, '0');
  const isLowTime     = timeLeft <= 60;
  const isCritical    = timeLeft <= 30;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 space-y-8 font-['Hind_Siliguri'] pb-20 animate-in fade-in duration-500">

      {/* ══ WATERFALL TIMER ══════════════════════════════════ */}
      <WaterfallTimer
        timerRef={timerRef} pos={pos} dragging={dragging}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        mins={mins} secs={secs}
        isCritical={isCritical} isLowTime={isLowTime}
        answeredCount={answeredCount} totalCount={totalCount}
      />

      {/* ══ STICKY HEADER ═════════════════════════════════════ */}
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-4 md:p-6 rounded-[32px] shadow-xl border border-white sticky top-4 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl shadow-lg shadow-indigo-200">
            📚
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-sm md:text-xl leading-none truncate max-w-[150px] md:max-w-none">
              {activeQuiz.title}
            </h3>
            <p className="text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
              Live Examination · {answeredCount}/{totalCount} answered
            </p>
          </div>
        </div>

        {/* static mini-timer badge in header (non-draggable reference) */}
        <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black transition-all ${
          isLowTime ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <span>⏱</span>
          <span className="font-mono">{mins}:{secs}</span>
        </div>
      </div>

      {/* ══ PROGRESS BAR ══════════════════════════════════════ */}
      <div className="mx-2 bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
        <div
          className="bg-indigo-600 h-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ══ QUESTIONS ═════════════════════════════════════════ */}
      <div className="space-y-6 md:space-y-10">
        {activeQuiz.questions.map((q: any, idx: number) => {
          const isTextInput = isInputType(q);
          const isAnswered  = !!answers[q.id];

          return (
            <div
              key={q.id || idx}
              className="bg-white p-6 md:p-10 rounded-[40px] md:rounded-[50px] shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 w-2.5 h-full transition-colors ${
                isAnswered ? 'bg-emerald-500' : 'bg-slate-100 group-hover:bg-indigo-500'
              }`} />

              <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-start">
                  <span className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[24px] flex items-center justify-center font-black shrink-0 text-xl md:text-2xl transition-all ${
                    isAnswered
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                  }`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="md:hidden">
                    {isTextInput
                      ? <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Short Answer</span>
                      : <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MCQ</span>}
                  </div>
                </div>

                <div className="space-y-8 w-full">
                  <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-[1.4]">
                    {q.questionText || q.text || q.question}
                  </p>

                  {isTextInput ? (
                    <input
                      type="text"
                      placeholder="এখানে তোমার উত্তরটি টাইপ করো..."
                      disabled={isSubmitting}
                      className="w-full p-6 md:p-8 bg-slate-50 border-4 border-slate-100 rounded-[28px] md:rounded-[35px] font-bold text-xl md:text-2xl text-slate-800 focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-inner placeholder:text-slate-300 disabled:opacity-50"
                      value={answers[q.id] || ''}
                      onChange={e => handleTextInput(q.id, e.target.value)}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-left-2 duration-300">
                      {(q.options || []).map((opt: string, i: number) => (
                        <button
                          key={i}
                          disabled={isSubmitting}
                          onClick={() => handleOptionSelect(q.id, opt)}
                          className={`relative p-6 md:p-8 rounded-[25px] md:rounded-[30px] border-2 text-left transition-all duration-300 disabled:cursor-not-allowed ${
                            answers[q.id] === opt.trim()
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 -translate-y-1'
                              : 'bg-slate-50 border-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <span className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-base md:text-lg font-black transition-colors ${
                              answers[q.id] === opt.trim()
                                ? 'bg-white/20 text-white'
                                : 'bg-white text-slate-400 shadow-sm border border-slate-100'
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

      {/* ══ SUBMIT BUTTON ═════════════════════════════════════ */}
      <div className="pt-12 px-2 md:px-0">
        <button
          disabled={isSubmitting}
          onClick={() => {
            if (isSubmitting || hasSubmitted.current) return;
            if (window.confirm('তুমি কি নিশ্চিত যে পরীক্ষাটি শেষ করতে চাও?')) {
              safeSubmit(false);
            }
          }}
          className={`w-full py-7 md:py-10 rounded-[40px] md:rounded-[50px] font-black text-2xl md:text-4xl shadow-2xl transition-all duration-500 flex items-center justify-center gap-6 group ${
            isSubmitting
              ? 'bg-slate-400 text-white cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
              <span>সাবমিট হচ্ছে...</span>
            </>
          ) : (
            <>
              <span>সাবমিট করো</span>
              <span className="group-hover:translate-x-3 transition-transform duration-500">🚀</span>
            </>
          )}
        </button>

        {answeredCount < totalCount && !isSubmitting && (
          <p className="text-center mt-4 text-sm font-bold text-amber-500">
            ⚠️ {totalCount - answeredCount}টি প্রশ্নের উত্তর দেওয়া হয়নি
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;

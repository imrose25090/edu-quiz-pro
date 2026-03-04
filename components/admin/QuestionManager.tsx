import React, { useState, useEffect, useMemo } from 'react';

interface QuestionManagerProps {
  classes: any[];
  subjects: any[];
  chapters: any[];
  questions: any[];
  addBulkQuestions: (newQuestions: any[]) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteAllQuestions?: () => Promise<void>;
  bulkDelete: (collectionName: string, ids: string[]) => Promise<void>;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({ 
  classes, 
  subjects, 
  chapters, 
  questions, 
  addBulkQuestions, 
  deleteQuestion,
  deleteAllQuestions,
  bulkDelete
}) => {
  const [selClass, setSelClass] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [selChapter, setSelChapter] = useState('');
  const [selType, setSelType] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [dynamicFormats, setDynamicFormats] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ হেল্পার ফাংশন: টাইমস্ট্যাম্পকে নির্ভুলভাবে সংখ্যায় রূপান্তর
  const getTime = (createdAt: any) => {
    if (!createdAt) return 0;
    if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
    if (createdAt instanceof Date) return createdAt.getTime();
    if (createdAt.seconds) return createdAt.seconds * 1000;
    return 0;
  };

  // ফরম্যাট লোড করার লজিক
  useEffect(() => {
    const loadFormats = () => {
      const saved = JSON.parse(localStorage.getItem('quiz_formats') || '[]');
      setDynamicFormats(saved);
      if (saved.length > 0 && !selType) {
        setSelType(saved[0].name);
      }
    };
    loadFormats();
    
    window.addEventListener('storage', loadFormats);
    return () => window.removeEventListener('storage', loadFormats);
  }, [selType]);

  const currentFormat = useMemo(() => 
    dynamicFormats.find(f => f.name === selType), 
  [selType, dynamicFormats]);

  const handleCopyFormat = () => {
    if (currentFormat) {
      navigator.clipboard.writeText(currentFormat.format);
      alert(`Format Copied: ${currentFormat.format}`);
    } else {
      alert("No format selected!");
    }
  };

  // ✅ সর্টেড ড্রপডাউন ডাটা
  const sortedClasses = useMemo(() => 
    [...classes].sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt)), 
  [classes]);

  const availableSubjects = useMemo(() => 
    subjects
      .filter((s: any) => String(s.classId) === String(selClass))
      .sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt)), 
  [subjects, selClass]);

  const availableChapters = useMemo(() => 
    chapters
      .filter((c: any) => String(c.subjectId) === String(selSubject))
      .sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt)), 
  [chapters, selSubject]);

  // ফিল্টার লজিক
  const filteredQuestions = useMemo(() => {
    return questions.filter((q: any) => {
      const matchClass = !selClass || String(q.classId) === String(selClass);
      const matchSub = !selSubject || String(q.subjectId) === String(selSubject);
      const matchChap = !selChapter || String(q.chapterId) === String(selChapter);
      const matchType = !selType || q.type === selType;
      return matchClass && matchSub && matchChap && matchType;
    });
  }, [questions, selClass, selSubject, selChapter, selType]);

  // বাল্ক ডিলিট
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`আপনি কি নিশ্চিত যে ${selectedIds.length}টি প্রশ্ন ডিলিট করতে চান?`)) {
      try {
        await bulkDelete('questions', selectedIds);
        setSelectedIds([]);
        alert('Selected questions deleted successfully!');
      } catch (error) {
        console.error("Bulk delete failed:", error);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuestions.map(q => q.id));
    }
  };

  const handleBulkAdd = async () => {
    if (!selClass || !selSubject || !selChapter || !bulkInput.trim()) {
      alert("সব তথ্য পূরণ করুন!");
      return;
    }

    setIsSubmitting(true);
    const lines = bulkInput.split('\n').filter(l => l.trim().includes('|'));
    
    const newQs = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      const needsInput = currentFormat?.requiresInput || false;
      const questionType = currentFormat?.name || selType; 

      let options: string[] = [];
      let answer: string = "";

      if (needsInput) {
        options = [];
        answer = parts[1] || ""; 
      } else {
        options = parts[1] ? parts[1].split(',').map(o => o.trim()) : [];
        answer = parts[2] || (options.length > 0 ? options[0] : "");
      }

      return {
        classId: String(selClass),
        subjectId: String(selSubject),
        chapterId: String(selChapter),
        type: questionType,
        text: parts[0],
        options: options,
        answer: answer,
        requiresInput: !!needsInput,
        marks: 1
      };
    });

    try {
      await addBulkQuestions(newQs);
      setBulkInput('');
      alert(`${newQs.length}টি প্রশ্ন সফলভাবে সেভ হয়েছে!`);
    } catch (error) {
      alert("Save failed! Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-['Hind_Siliguri']">
      
      {/* বাম পাশ: ইনপুট প্যানেল */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 sticky top-4">
          <h3 className="text-xl font-black italic mb-6 uppercase tracking-tighter text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm not-italic">+</span>
            Add Questions
          </h3>
          
          <div className="space-y-4">
            <select value={selClass} onChange={(e) => {setSelClass(e.target.value); setSelSubject(''); setSelChapter(''); setSelectedIds([]);}} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer">
              <option value="">Select Class</option>
              {sortedClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={selSubject} onChange={(e) => {setSelSubject(e.target.value); setSelChapter(''); setSelectedIds([]);}} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 outline-none disabled:opacity-50 cursor-pointer" disabled={!selClass}>
              <option value="">Select Subject</option>
              {availableSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select value={selChapter} onChange={(e) => {setSelChapter(e.target.value); setSelectedIds([]);}} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 outline-none disabled:opacity-50 cursor-pointer" disabled={!selSubject}>
              <option value="">Select Chapter</option>
              {availableChapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="pt-4 border-t border-dashed border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-indigo-500 uppercase">Format Type</p>
                {currentFormat && (
                  <button onClick={handleCopyFormat} className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-black transition-all uppercase shadow-md">
                    📋 Copy Format
                  </button>
                )}
              </div>
              
              <select value={selType} onChange={(e) => {setSelType(e.target.value); setSelectedIds([]);}} className="w-full p-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold outline-none border-2 border-indigo-100 cursor-pointer">
                {dynamicFormats.map((f: any) => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>

              {currentFormat && (
                <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Guideline:</p>
                  <code className="text-[11px] font-bold text-slate-600 break-all">{currentFormat.format}</code>
                </div>
              )}
            </div>

            <textarea 
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={currentFormat?.requiresInput ? "Question | Correct Answer" : "Question | Op1, Op2, Op3 | Correct Answer"}
              className="w-full h-48 p-5 bg-slate-50 border-none rounded-3xl mt-2 focus:ring-2 focus:ring-indigo-500 font-medium text-sm outline-none resize-none custom-scrollbar"
            />
            
            <button 
              onClick={handleBulkAdd} 
              disabled={isSubmitting || !selChapter || !bulkInput.trim()}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-20 shadow-xl shadow-indigo-100"
            >
              {isSubmitting ? 'Saving...' : 'Add to Bank'}
            </button>
          </div>
        </div>
      </div>

      {/* ডান পাশ: কোয়েশ্চেন লিস্ট */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black italic uppercase text-slate-800">Stored Questions</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matches Found: {filteredQuestions.length}</p>
            </div>
            <button 
              onClick={() => { if(window.confirm("সব প্রশ্ন মুছে ফেলতে চান?")) deleteAllQuestions?.() }} 
              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              Clear Bank 🗑️
            </button>
          </div>

          {filteredQuestions.length > 0 && (
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSelectAll}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Select All Visible</span>
              </div>
              
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="bg-rose-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-rose-100"
                >
                  Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar pb-20">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q: any) => (
              <div key={q.id} className={`bg-white p-6 rounded-[32px] border transition-all relative flex gap-4 ${selectedIds.includes(q.id) ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200'}`}>
                <div className="pt-1">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(q.id)}
                    onChange={() => {
                      setSelectedIds(prev => 
                        prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                      );
                    }}
                    className="w-5 h-5 accent-indigo-600 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-tighter">
                      {q.type}
                    </span>
                    <button 
                      onClick={() => { if(window.confirm('মুছে ফেলবেন?')) deleteQuestion(q.id) }} 
                      className="text-rose-400 text-[10px] font-black uppercase hover:text-rose-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2">{q.text}</h4>
                  
                  {!q.requiresInput && q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {q.options.map((opt: string, i: number) => (
                        <span key={i} className={`text-[11px] px-3 py-1 rounded-lg border font-bold ${opt === q.answer ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-50 text-[10px] font-black uppercase flex items-center gap-2">
                    <span className="text-slate-400">Correct Ans:</span>
                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">{q.answer}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-40 bg-white rounded-[40px] border-2 border-dashed border-slate-100 opacity-30 font-black uppercase tracking-widest text-sm">
              No matching questions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionManager;

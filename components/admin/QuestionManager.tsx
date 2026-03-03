import React, { useState, useEffect, useMemo } from 'react';

interface QuestionManagerProps {
  classes: any[];
  subjects: any[];
  chapters: any[];
  questions: any[];
  addBulkQuestions: (newQuestions: any[]) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteAllQuestions?: () => Promise<void>;
  bulkDelete: (collectionName: string, ids: string[]) => Promise<void>; // ✅ নতুন প্রপস
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({ 
  classes, 
  subjects, 
  chapters, 
  questions, 
  addBulkQuestions, 
  deleteQuestion,
  deleteAllQuestions,
  bulkDelete // ✅ প্রপস রিসিভ করা হয়েছে
}) => {
  const [selClass, setSelClass] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [selChapter, setSelChapter] = useState('');
  const [selType, setSelType] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [dynamicFormats, setDynamicFormats] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // ✅ সিলেক্টেড আইডি ট্র্যাকিং

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

  const availableSubjects = useMemo(() => subjects.filter((s: any) => s.classId === selClass), [subjects, selClass]);
  const availableChapters = useMemo(() => chapters.filter((c: any) => c.subjectId === selSubject), [chapters, selSubject]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q: any) => {
      const matchClass = !selClass || q.classId === selClass;
      const matchSub = !selSubject || q.subjectId === selSubject;
      const matchChap = !selChapter || q.chapterId === selChapter;
      const matchType = !selType || q.type === selType;
      return matchClass && matchSub && matchChap && matchType;
    });
  }, [questions, selClass, selSubject, selChapter, selType]);

  // ✅ বাল্ক ডিলিট ফাংশন
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

  // ✅ অল সিলেক্ট ফাংশন (বর্তমানে ফিল্টার করা প্রশ্নগুলোর জন্য)
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

    const lines = bulkInput.split('\n').filter(l => l.trim().includes('|'));
    
    const newQs = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      const needsInput = currentFormat?.requiresInput || false;
      const questionType = currentFormat?.name || selType; 

      let options: string[] = [];
      let answer: string = "";

      if (needsInput) {
        options = [];
        answer = parts[parts.length - 1] || ""; 
      } else {
        options = parts[1] ? parts[1].split(',').map(o => o.trim()) : [];
        answer = parts[2] || (options.length > 0 ? options[0] : "");
      }

      return {
        classId: selClass,
        subjectId: selSubject,
        chapterId: selChapter,
        type: questionType,
        text: parts[0],
        options: options,
        answer: answer,
        requiresInput: needsInput,
        marks: 1,
        createdAt: new Date().toISOString()
      };
    });

    try {
      await addBulkQuestions(newQs);
      setBulkInput('');
      alert(`${newQs.length}টি প্রশ্ন সফলভাবে সেভ হয়েছে!`);
    } catch (error) {
      console.error("Save failed:", error);
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
            <select value={selClass} onChange={(e) => {setSelClass(e.target.value); setSelSubject(''); setSelChapter(''); setSelectedIds([]);}} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
              <option value="">Select Class</option>
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={selSubject} onChange={(e) => {setSelSubject(e.target.value); setSelChapter(''); setSelectedIds([]);}} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 outline-none disabled:opacity-50" disabled={!selClass}>
              <option value="">Select Subject</option>
              {availableSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select value={selChapter} onChange={(e) => {setSelChapter(e.target.value); setSelectedIds([]);}} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 outline-none disabled:opacity-50" disabled={!selSubject}>
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
              
              <select value={selType} onChange={(e) => {setSelType(e.target.value); setSelectedIds([]);}} className="w-full p-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold outline-none border-2 border-indigo-100 focus:border-indigo-400">
                {dynamicFormats.length > 0 ? (
                  dynamicFormats.map((f: any) => <option key={f.id} value={f.name}>{f.name}</option>)
                ) : (
                  <option value="">No Formats Configured</option>
                )}
              </select>

              {currentFormat && (
                <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Guideline:</p>
                    {currentFormat.requiresInput && (
                      <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black animate-pulse uppercase">Typed Answer Mode</span>
                    )}
                  </div>
                  <code className="text-[11px] font-bold text-slate-600 break-all">{currentFormat.format}</code>
                </div>
              )}
            </div>

            <textarea 
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={currentFormat?.requiresInput ? "Question | Answer (Per line)" : "Question | Op1, Op2, Op3 | Correct Answer"}
              className="w-full h-48 p-5 bg-slate-50 border-none rounded-3xl mt-2 focus:ring-2 focus:ring-indigo-500 font-medium text-sm outline-none shadow-inner resize-none custom-scrollbar"
            />
            
            <button 
              onClick={handleBulkAdd} 
              disabled={!selChapter || !bulkInput.trim()}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-20 active:scale-95"
            >
              Add to Bank
            </button>
          </div>
        </div>
      </div>

      {/* ডান পাশ: কোয়েশ্চন লিস্ট */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black italic uppercase">Stored Questions</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing: {filteredQuestions.length} Questions</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { if(window.confirm("সব প্রশ্ন মুছে ফেলতে চান?")) deleteAllQuestions?.() }} 
                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                Clear All 🗑️
              </button>
            </div>
          </div>

          {/* ✅ বাল্ক কন্ট্রোল মেনু */}
          {filteredQuestions.length > 0 && (
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSelectAll}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Select All Filtered</span>
              </div>
              
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg animate-in fade-in slide-in-from-top-1"
                >
                  Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar pb-20">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q: any) => {
              const isSelected = selectedIds.includes(q.id);
              return (
                <div key={q.id} className={`bg-white p-6 rounded-[32px] border transition-all relative overflow-hidden flex gap-4 ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200'}`}>
                  
                  {/* ✅ চেকবক্স */}
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {
                        setSelectedIds(prev => 
                          prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                        );
                      }}
                      className="w-5 h-5 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex-1">
                    {q.requiresInput && (
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] px-3 py-1 font-black rounded-bl-xl uppercase tracking-tighter">
                        Typing Required
                      </div>
                    )}
                    
                    <div className="flex justify-between mb-2">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-tighter">
                        {q.type}
                      </span>
                      <button 
                        onClick={() => { if(window.confirm('মুছে ফেলবেন?')) deleteQuestion(q.id) }} 
                        className="text-rose-400 text-[10px] font-black uppercase transition-all hover:text-rose-600"
                      >
                        Delete Item
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

                    <div className="pt-4 border-t border-slate-50 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="text-slate-400">Correct Answer:</span>
                      <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">{q.answer}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-40 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <span className="text-4xl block mb-4">📂</span>
              <p className="opacity-20 italic font-black uppercase tracking-widest text-sm">No questions match your filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionManager;

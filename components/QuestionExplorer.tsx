import React, { useState, useMemo } from 'react';
import { useApp } from '../store';

interface QuestionExplorerProps {
  onClose: () => void;
}

export const QuestionExplorer: React.FC<QuestionExplorerProps> = ({ onClose }) => {
  const { questions, classes, subjects, chapters, language } = useApp();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  // ✅ হেল্পার ফাংশন: টাইমস্ট্যাম্প সর্টিং
  const getTime = (createdAt: any) => {
    if (!createdAt) return 0;
    if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
    if (createdAt instanceof Date) return createdAt.getTime();
    if (createdAt.seconds) return createdAt.seconds * 1000;
    return 0;
  };

  const sortedClasses = useMemo(() => 
    [...classes].sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt)), 
  [classes]);

  const availableSubjects = useMemo(() => 
    subjects
      .filter(s => String(s.classId) === String(selectedClass))
      .sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt)),
  [subjects, selectedClass]);

  const availableChapters = useMemo(() => 
    chapters
      .filter(ch => String(ch.subjectId) === String(selectedSubject))
      .sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt)),
  [chapters, selectedSubject]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchClass = !selectedClass || String(q.classId) === String(selectedClass);
      const matchSub = !selectedSubject || String(q.subjectId) === String(selectedSubject);
      const matchChap = !selectedChapter || String(q.chapterId) === String(selectedChapter);
      return matchClass && matchSub && matchChap;
    });
  }, [questions, selectedClass, selectedSubject, selectedChapter]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 font-['Hind_Siliguri']">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-white">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
              {language === 'bn' ? 'প্রশ্ন ব্যাংক এক্সপ্লোরার' : 'Question Bank Explorer'}
            </h2>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-md uppercase">
                {filteredQuestions.length} Questions Found
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-xl hover:bg-rose-500 hover:text-white transition-all shadow-indigo-100/50">
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 md:p-6 bg-white border-b border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Select Class</label>
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(''); setSelectedChapter(''); }}
            >
              <option value="">{language === 'bn' ? 'সকল ক্লাস' : 'All Classes'}</option>
              {sortedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Select Subject</label>
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
              value={selectedSubject}
              disabled={!selectedClass}
              onChange={(e) => { setSelectedSubject(e.target.value); setSelectedChapter(''); }}
            >
              <option value="">{language === 'bn' ? 'সকল বিষয়' : 'All Subjects'}</option>
              {availableSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Select Chapter</label>
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
              value={selectedChapter}
              disabled={!selectedSubject}
              onChange={(e) => setSelectedChapter(e.target.value)}
            >
              <option value="">{language === 'bn' ? 'সকল চ্যাপ্টার' : 'All Chapters'}</option>
              {availableChapters.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q, idx) => {
              const hasOptions = q.options && q.options.length > 0;
              
              return (
                <div key={q.id || idx} className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-tighter">{q.type}</span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-tighter">Marks: {q.marks || 1}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-300">Q#{idx + 1}</span>
                  </div>

                  <h4 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">{q.text}</h4>
                  
                  {/* Options Section */}
                  {hasOptions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      {q.options.map((opt: string, i: number) => {
                        const isCorrect = String(q.answer).trim() === String(opt).trim();
                        return (
                          <div key={i} className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                            <div className="flex items-center">
                              <span className={`opacity-40 mr-2 ${isCorrect ? 'text-emerald-600' : ''}`}>{String.fromCharCode(65 + i)}.</span> {opt}
                            </div>
                            {isCorrect && (
                              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Correct Answer Section - শুধুমাত্র তখনই দেখাবে যখন অপশন নেই */}
                  {!hasOptions && (
                    <div className="flex items-center gap-4 bg-emerald-50/80 border-2 border-emerald-200 p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{language === 'bn' ? 'সঠিক উত্তর' : 'CORRECT ANSWER'}</span>
                        <span className="text-base font-black text-emerald-900">{q.answer || 'Not Provided'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
              <div className="text-7xl mb-6 grayscale opacity-50">📂</div>
              <p className="font-black uppercase tracking-widest text-sm text-slate-400">কোনো প্রশ্ন পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

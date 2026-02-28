import React, { useState } from 'react';
import { useApp } from '../store';

interface QuestionExplorerProps {
  onClose: () => void;
}

export const QuestionExplorer: React.FC<QuestionExplorerProps> = ({ onClose }) => {
  const { questions, classes, subjects, chapters, language } = useApp();
  
  // ফিল্টার স্টেট
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  // ফিল্টার লজিক
  const filteredQuestions = questions.filter(q => {
    return (!selectedClass || q.classId === selectedClass) &&
           (!selectedSubject || q.subjectId === selectedSubject) &&
           (!selectedChapter || q.chapterId === selectedChapter);
  });

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
               <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md uppercase">
                {filteredQuestions.length} Questions
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-xl hover:bg-rose-500 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Filters Row */}
        <div className="p-4 md:p-6 bg-white border-b border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Select Class</label>
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(''); setSelectedChapter(''); }}
            >
              <option value="">{language === 'bn' ? 'সকল ক্লাস' : 'All Classes'}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Select Subject</label>
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
              value={selectedSubject}
              disabled={!selectedClass}
              onChange={(e) => { setSelectedSubject(e.target.value); setSelectedChapter(''); }}
            >
              <option value="">{language === 'bn' ? 'সকল বিষয়' : 'All Subjects'}</option>
              {subjects.filter(s => s.classId === selectedClass).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Select Chapter</label>
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
              value={selectedChapter}
              disabled={!selectedSubject}
              onChange={(e) => setSelectedChapter(e.target.value)}
            >
              <option value="">{language === 'bn' ? 'সকল চ্যাপ্টার' : 'All Chapters'}</option>
              {chapters.filter(ch => ch.subjectId === selectedSubject).map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions List Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 bg-slate-50/30 custom-scrollbar">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q, idx) => (
              <div key={q.id || idx} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase">
                      {q.type}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg uppercase">
                      Level: {q.difficulty || 'Normal'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-400 transition-colors">Q#{idx + 1}</span>
                </div>

                <h4 className="text-lg font-bold text-slate-800 mb-5 leading-relaxed">{q.text}</h4>
                
                {/* Options for MCQ */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt: string, i: number) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-2xl border text-sm font-bold transition-all ${
                          q.correctAnswer === opt 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-100' 
                          : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}
                      >
                        <span className="opacity-40 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                      </div>
                    ))}
                  </div>
                )}

                {/* Short Answer Placeholder */}
                {q.type === 'short' && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold">
                    📝 উত্তর: {q.correctAnswer}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
              <div className="text-7xl mb-6 grayscale opacity-50">📂</div>
              <p className="font-black uppercase tracking-widest text-sm text-slate-400">কোনো প্রশ্ন পাওয়া যায়নি</p>
              <p className="text-xs font-bold text-slate-300 mt-2">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
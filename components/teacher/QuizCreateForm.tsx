import React, { useState, useMemo, useEffect } from 'react';
import { Class, Subject, Chapter, Question } from '../../types';

interface QuizCreateFormProps {
  newQuiz: any;
  setNewQuiz: (val: any) => void;
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  manualSelectedIds: string[];
  setManualSelectedIds: (ids: string[]) => void;
  aiLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const QuizCreateForm: React.FC<QuizCreateFormProps> = ({
  newQuiz, setNewQuiz, classes, subjects, chapters, questions = [], 
  manualSelectedIds, setManualSelectedIds, aiLoading, onSubmit, onCancel
}) => {
  
  const [adminFormats, setAdminFormats] = useState<any[]>([]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    const loadFormats = () => {
      const saved = localStorage.getItem('quiz_formats');
      if (saved) {
        setAdminFormats(JSON.parse(saved));
      } else {
        const defaultFormats = [
          { id: '1', type: 'MCQ', name: 'Standard MCQ', requiresInput: false },
          { id: '2', type: 'TRUE_FALSE', name: 'True/False', requiresInput: false },
          { id: '3', type: 'SHORT_ANSWER', name: 'Short Answer', requiresInput: true },
          { id: '4', type: 'FILL_IN_THE_GAP', name: 'Fill In The Gap', requiresInput: true }
        ];
        setAdminFormats(defaultFormats);
      }
    };
    loadFormats();

    window.addEventListener('storage_updated', loadFormats);
    return () => window.removeEventListener('storage_updated', loadFormats);
  }, []);

  const normalizeType = (type: string) => {
    if (!type) return '';
    return type.toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
  };

  // ✅ বেস ফিল্টার্ড প্রশ্ন (ক্লাস, সাবজেক্ট এবং চ্যাপ্টার অনুযায়ী)
  const baseFilteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchClass = q.classId === newQuiz.classId;
      const matchSubject = q.subjectId === newQuiz.subjectId;
      const matchChapter = newQuiz.chapterIds && newQuiz.chapterIds.length > 0 
        ? newQuiz.chapterIds.includes(q.chapterId) 
        : true;
      return matchClass && matchSubject && matchChapter;
    });
  }, [questions, newQuiz.classId, newQuiz.subjectId, newQuiz.chapterIds]);

  // ✅ টাইপ অনুযায়ী এভেইলেবল প্রশ্ন গণনা
  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    adminFormats.forEach(f => {
      const fTypeNormalized = normalizeType(f.type);
      const matchedQs = baseFilteredQuestions.filter(q => normalizeType(q.type) === fTypeNormalized);
      counts[f.type] = matchedQs.length;
    });
    return counts;
  }, [baseFilteredQuestions, adminFormats]);

  // ✅ ম্যানুয়াল সিলেকশনের জন্য ফিল্টার্ড লিস্ট
  const filteredQuestions = useMemo(() => {
    const activeFilterNormalized = normalizeType(activeTypeFilter);
    return baseFilteredQuestions.filter(q => {
      const qTypeNormalized = normalizeType(q.type);
      const isAdminType = adminFormats.some(f => normalizeType(f.type) === qTypeNormalized);
      
      if (activeFilterNormalized === 'ALL') return isAdminType;
      return qTypeNormalized === activeFilterNormalized;
    });
  }, [baseFilteredQuestions, activeTypeFilter, adminFormats]);

  const toggleChapter = (chapterId: string) => {
    const currentIds = newQuiz.chapterIds || [];
    const newIds = currentIds.includes(chapterId)
      ? currentIds.filter((id: string) => id !== chapterId)
      : [...currentIds, chapterId];
    
    setNewQuiz({ ...newQuiz, chapterIds: newIds, typeCounts: {}, qCount: 0 });
    setManualSelectedIds([]);
  };

  // ✅ AUTO মোডের জন্য হ্যান্ডলার (টাইপ ভিত্তিক প্রশ্ন সিলেকশন নিশ্চিত করে)
  const handleTypeCountChange = (type: string, count: number) => {
    const val = isNaN(count) ? 0 : count;
    const available = availableCounts[type] || 0;
    const finalCount = Math.max(0, Math.min(val, available));

    const updatedTypeCounts = { 
      ...(newQuiz.typeCounts || {}),
      [type]: finalCount
    };

    // শুধুমাত্র যে টাইপগুলোর সংখ্যা ০ এর বেশি, সেগুলোর থেকে প্রশ্ন কালেক্ট করা
    let selectedIds: string[] = [];
    Object.keys(updatedTypeCounts).forEach(t => {
      const tNormalized = normalizeType(t);
      const countToTake = updatedTypeCounts[t];
      if (countToTake > 0) {
        const matchedQs = baseFilteredQuestions
          .filter(q => normalizeType(q.type) === tNormalized)
          .slice(0, countToTake)
          .map(q => q.id);
        selectedIds = [...selectedIds, ...matchedQs];
      }
    });

    setManualSelectedIds(selectedIds); // Auto mode হলেও internal ID track রাখা জরুরি
    setNewQuiz({ 
      ...newQuiz, 
      typeCounts: updatedTypeCounts, 
      qCount: selectedIds.length,
      selectedQuestionIds: selectedIds // সাবমিটের জন্য আইডিগুলো সেভ করে রাখা
    });
  };

  const toggleQuestion = (id: string) => {
    const newIds = manualSelectedIds.includes(id) 
      ? manualSelectedIds.filter(i => i !== id) 
      : [...manualSelectedIds, id];
    setManualSelectedIds(newIds);
    setNewQuiz({ ...newQuiz, qCount: newIds.length, selectedQuestionIds: newIds });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[48px] shadow-2xl border border-slate-50 space-y-10 animate-in zoom-in duration-500 font-['Hind_Siliguri']">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl">📝</div>
           <h3 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Create Assessment</h3>
        </div>
        <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Teacher Panel</span>
      </div>
      
      <div className="space-y-8">
        <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
          {['AUTO', 'MANUAL'].map(m => (
            <button key={m} type="button" onClick={() => {
                setNewQuiz({...newQuiz, mode: m, typeCounts: {}, qCount: 0, selectedQuestionIds: []});
                setManualSelectedIds([]);
            }} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${newQuiz.mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              {m === 'AUTO' ? 'Auto Generate' : 'Manual Select'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Assessment Title</label>
            <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none focus:border-indigo-500 transition-all text-lg" value={newQuiz.title || ''} onChange={e => setNewQuiz({...newQuiz, title: e.target.value})} placeholder="Ex: Weekly Test - Science" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Class</label>
            <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.classId || ''} onChange={e => setNewQuiz({...newQuiz, classId: e.target.value, subjectId: '', chapterIds: [], typeCounts: {}, qCount: 0, selectedQuestionIds: []})}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Subject</label>
            <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.subjectId || ''} onChange={e => setNewQuiz({...newQuiz, subjectId: e.target.value, chapterIds: [], typeCounts: {}, qCount: 0, selectedQuestionIds: []})}>
              <option value="">Select Subject</option>
              {subjects.filter(s => s.classId === newQuiz.classId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {newQuiz.subjectId && (
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Filter by Chapters</label>
            <div className="flex flex-wrap gap-3">
              {chapters.filter(c => c.subjectId === newQuiz.subjectId).map(ch => (
                <button key={ch.id} type="button" onClick={() => toggleChapter(ch.id)} className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border-2 ${ (newQuiz.chapterIds || []).includes(ch.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>
                  {ch.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type Filter Buttons */}
        {newQuiz.subjectId && adminFormats.length > 0 && (
          <div className="space-y-3 p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Filter Question Types</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTypeFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${activeTypeFilter === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                ALL ({Object.values(availableCounts).reduce((a, b) => a + b, 0)})
              </button>
              {adminFormats.map(f => (
                <button key={f.id} type="button" onClick={() => setActiveTypeFilter(f.type)} className={`px-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${activeTypeFilter === f.type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {f.name.toUpperCase()} ({availableCounts[f.type] || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AUTO MODE Section */}
        {newQuiz.mode === 'AUTO' && newQuiz.subjectId && (
          <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100 space-y-6">
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Auto Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminFormats.map((f) => (
                <div key={`auto-${f.id}`} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{f.name}</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={availableCounts[f.type] || 0}
                    placeholder="0" 
                    className="w-full text-xl font-black text-indigo-600 outline-none bg-transparent" 
                    value={newQuiz.typeCounts?.[f.type] || ''} 
                    onChange={(e) => handleTypeCountChange(f.type, parseInt(e.target.value))} 
                  />
                  <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase">Available: <span className="text-indigo-600">{availableCounts[f.type] || 0}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL MODE Section */}
        {newQuiz.mode === 'MANUAL' && newQuiz.subjectId && (
          <div className="space-y-4">
            <div className="flex justify-between items-center ml-2">
              <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">Select Questions ({manualSelectedIds.length})</h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-[32px] border-2 border-dashed border-slate-200 max-h-[450px] overflow-y-auto space-y-3 custom-scrollbar">
              {filteredQuestions.length > 0 ? filteredQuestions.map((q) => (
                <div key={q.id} onClick={() => toggleQuestion(q.id)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${manualSelectedIds.includes(q.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-white hover:border-indigo-100'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 ${manualSelectedIds.includes(q.id) ? 'bg-white text-indigo-600' : 'border-slate-200 bg-slate-50'}`}>
                    {manualSelectedIds.includes(q.id) ? '✓' : 'Q'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{q.text || q.questionText}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-400 rounded-md">{q.type}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-300 font-bold uppercase text-xs">No matching questions</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
           <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Time (Min)</label>
            <input type="number" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.time || ''} onChange={e => setNewQuiz({...newQuiz, time: parseInt(e.target.value) || 0})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Total Selected</label>
            <div className="w-full p-5 bg-slate-900 border-2 border-slate-900 rounded-[24px] font-black text-white text-center text-xl shadow-lg">
              {newQuiz.qCount || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
        <button type="button" onClick={onSubmit} disabled={aiLoading || !newQuiz.title || newQuiz.qCount === 0} className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-20 hover:-translate-y-1 transition-all">
          {aiLoading ? 'Launching...' : 'Launch Assessment'}
        </button>
      </div>
    </div>
  );
};import React, { useState, useMemo, useEffect } from 'react';
import { Class, Subject, Chapter, Question } from '../../types';

interface QuizCreateFormProps {
  newQuiz: any;
  setNewQuiz: (val: any) => void;
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  manualSelectedIds: string[];
  setManualSelectedIds: (ids: string[]) => void;
  aiLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const QuizCreateForm: React.FC<QuizCreateFormProps> = ({
  newQuiz, setNewQuiz, classes, subjects, chapters, questions = [], 
  manualSelectedIds, setManualSelectedIds, aiLoading, onSubmit, onCancel
}) => {
  
  const [adminFormats, setAdminFormats] = useState<any[]>([]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    const loadFormats = () => {
      const saved = localStorage.getItem('quiz_formats');
      if (saved) {
        setAdminFormats(JSON.parse(saved));
      } else {
        const defaultFormats = [
          { id: '1', type: 'MCQ', name: 'Standard MCQ', requiresInput: false },
          { id: '2', type: 'TRUE_FALSE', name: 'True/False', requiresInput: false },
          { id: '3', type: 'SHORT_ANSWER', name: 'Short Answer', requiresInput: true },
          { id: '4', type: 'FILL_IN_THE_GAP', name: 'Fill In The Gap', requiresInput: true }
        ];
        setAdminFormats(defaultFormats);
      }
    };
    loadFormats();

    window.addEventListener('storage_updated', loadFormats);
    return () => window.removeEventListener('storage_updated', loadFormats);
  }, []);

  const normalizeType = (type: string) => {
    if (!type) return '';
    return type.toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
  };

  // ✅ বেস ফিল্টার্ড প্রশ্ন (ক্লাস, সাবজেক্ট এবং চ্যাপ্টার অনুযায়ী)
  const baseFilteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchClass = q.classId === newQuiz.classId;
      const matchSubject = q.subjectId === newQuiz.subjectId;
      const matchChapter = newQuiz.chapterIds && newQuiz.chapterIds.length > 0 
        ? newQuiz.chapterIds.includes(q.chapterId) 
        : true;
      return matchClass && matchSubject && matchChapter;
    });
  }, [questions, newQuiz.classId, newQuiz.subjectId, newQuiz.chapterIds]);

  // ✅ টাইপ অনুযায়ী এভেইলেবল প্রশ্ন গণনা
  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    adminFormats.forEach(f => {
      const fTypeNormalized = normalizeType(f.type);
      const matchedQs = baseFilteredQuestions.filter(q => normalizeType(q.type) === fTypeNormalized);
      counts[f.type] = matchedQs.length;
    });
    return counts;
  }, [baseFilteredQuestions, adminFormats]);

  // ✅ ম্যানুয়াল সিলেকশনের জন্য ফিল্টার্ড লিস্ট
  const filteredQuestions = useMemo(() => {
    const activeFilterNormalized = normalizeType(activeTypeFilter);
    return baseFilteredQuestions.filter(q => {
      const qTypeNormalized = normalizeType(q.type);
      const isAdminType = adminFormats.some(f => normalizeType(f.type) === qTypeNormalized);
      
      if (activeFilterNormalized === 'ALL') return isAdminType;
      return qTypeNormalized === activeFilterNormalized;
    });
  }, [baseFilteredQuestions, activeTypeFilter, adminFormats]);

  const toggleChapter = (chapterId: string) => {
    const currentIds = newQuiz.chapterIds || [];
    const newIds = currentIds.includes(chapterId)
      ? currentIds.filter((id: string) => id !== chapterId)
      : [...currentIds, chapterId];
    
    setNewQuiz({ ...newQuiz, chapterIds: newIds, typeCounts: {}, qCount: 0 });
    setManualSelectedIds([]);
  };

  // ✅ AUTO মোডের জন্য হ্যান্ডলার (টাইপ ভিত্তিক প্রশ্ন সিলেকশন নিশ্চিত করে)
  const handleTypeCountChange = (type: string, count: number) => {
    const val = isNaN(count) ? 0 : count;
    const available = availableCounts[type] || 0;
    const finalCount = Math.max(0, Math.min(val, available));

    const updatedTypeCounts = { 
      ...(newQuiz.typeCounts || {}),
      [type]: finalCount
    };

    // শুধুমাত্র যে টাইপগুলোর সংখ্যা ০ এর বেশি, সেগুলোর থেকে প্রশ্ন কালেক্ট করা
    let selectedIds: string[] = [];
    Object.keys(updatedTypeCounts).forEach(t => {
      const tNormalized = normalizeType(t);
      const countToTake = updatedTypeCounts[t];
      if (countToTake > 0) {
        const matchedQs = baseFilteredQuestions
          .filter(q => normalizeType(q.type) === tNormalized)
          .slice(0, countToTake)
          .map(q => q.id);
        selectedIds = [...selectedIds, ...matchedQs];
      }
    });

    setManualSelectedIds(selectedIds); // Auto mode হলেও internal ID track রাখা জরুরি
    setNewQuiz({ 
      ...newQuiz, 
      typeCounts: updatedTypeCounts, 
      qCount: selectedIds.length,
      selectedQuestionIds: selectedIds // সাবমিটের জন্য আইডিগুলো সেভ করে রাখা
    });
  };

  const toggleQuestion = (id: string) => {
    const newIds = manualSelectedIds.includes(id) 
      ? manualSelectedIds.filter(i => i !== id) 
      : [...manualSelectedIds, id];
    setManualSelectedIds(newIds);
    setNewQuiz({ ...newQuiz, qCount: newIds.length, selectedQuestionIds: newIds });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[48px] shadow-2xl border border-slate-50 space-y-10 animate-in zoom-in duration-500 font-['Hind_Siliguri']">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl">📝</div>
           <h3 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Create Assessment</h3>
        </div>
        <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Teacher Panel</span>
      </div>
      
      <div className="space-y-8">
        <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
          {['AUTO', 'MANUAL'].map(m => (
            <button key={m} type="button" onClick={() => {
                setNewQuiz({...newQuiz, mode: m, typeCounts: {}, qCount: 0, selectedQuestionIds: []});
                setManualSelectedIds([]);
            }} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${newQuiz.mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              {m === 'AUTO' ? 'Auto Generate' : 'Manual Select'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Assessment Title</label>
            <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none focus:border-indigo-500 transition-all text-lg" value={newQuiz.title || ''} onChange={e => setNewQuiz({...newQuiz, title: e.target.value})} placeholder="Ex: Weekly Test - Science" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Class</label>
            <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.classId || ''} onChange={e => setNewQuiz({...newQuiz, classId: e.target.value, subjectId: '', chapterIds: [], typeCounts: {}, qCount: 0, selectedQuestionIds: []})}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Subject</label>
            <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.subjectId || ''} onChange={e => setNewQuiz({...newQuiz, subjectId: e.target.value, chapterIds: [], typeCounts: {}, qCount: 0, selectedQuestionIds: []})}>
              <option value="">Select Subject</option>
              {subjects.filter(s => s.classId === newQuiz.classId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {newQuiz.subjectId && (
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Filter by Chapters</label>
            <div className="flex flex-wrap gap-3">
              {chapters.filter(c => c.subjectId === newQuiz.subjectId).map(ch => (
                <button key={ch.id} type="button" onClick={() => toggleChapter(ch.id)} className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border-2 ${ (newQuiz.chapterIds || []).includes(ch.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>
                  {ch.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type Filter Buttons */}
        {newQuiz.subjectId && adminFormats.length > 0 && (
          <div className="space-y-3 p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Filter Question Types</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTypeFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${activeTypeFilter === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                ALL ({Object.values(availableCounts).reduce((a, b) => a + b, 0)})
              </button>
              {adminFormats.map(f => (
                <button key={f.id} type="button" onClick={() => setActiveTypeFilter(f.type)} className={`px-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${activeTypeFilter === f.type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {f.name.toUpperCase()} ({availableCounts[f.type] || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AUTO MODE Section */}
        {newQuiz.mode === 'AUTO' && newQuiz.subjectId && (
          <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100 space-y-6">
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Auto Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminFormats.map((f) => (
                <div key={`auto-${f.id}`} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{f.name}</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={availableCounts[f.type] || 0}
                    placeholder="0" 
                    className="w-full text-xl font-black text-indigo-600 outline-none bg-transparent" 
                    value={newQuiz.typeCounts?.[f.type] || ''} 
                    onChange={(e) => handleTypeCountChange(f.type, parseInt(e.target.value))} 
                  />
                  <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase">Available: <span className="text-indigo-600">{availableCounts[f.type] || 0}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL MODE Section */}
        {newQuiz.mode === 'MANUAL' && newQuiz.subjectId && (
          <div className="space-y-4">
            <div className="flex justify-between items-center ml-2">
              <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">Select Questions ({manualSelectedIds.length})</h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-[32px] border-2 border-dashed border-slate-200 max-h-[450px] overflow-y-auto space-y-3 custom-scrollbar">
              {filteredQuestions.length > 0 ? filteredQuestions.map((q) => (
                <div key={q.id} onClick={() => toggleQuestion(q.id)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${manualSelectedIds.includes(q.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-white hover:border-indigo-100'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 ${manualSelectedIds.includes(q.id) ? 'bg-white text-indigo-600' : 'border-slate-200 bg-slate-50'}`}>
                    {manualSelectedIds.includes(q.id) ? '✓' : 'Q'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{q.text || q.questionText}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-400 rounded-md">{q.type}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-300 font-bold uppercase text-xs">No matching questions</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
           <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Time (Min)</label>
            <input type="number" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.time || ''} onChange={e => setNewQuiz({...newQuiz, time: parseInt(e.target.value) || 0})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Total Selected</label>
            <div className="w-full p-5 bg-slate-900 border-2 border-slate-900 rounded-[24px] font-black text-white text-center text-xl shadow-lg">
              {newQuiz.qCount || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
        <button type="button" onClick={onSubmit} disabled={aiLoading || !newQuiz.title || newQuiz.qCount === 0} className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-20 hover:-translate-y-1 transition-all">
          {aiLoading ? 'Launching...' : 'Launch Assessment'}
        </button>
      </div>
    </div>
  );
};import React, { useState, useMemo, useEffect } from 'react';
import { Class, Subject, Chapter, Question } from '../../types';

interface QuizCreateFormProps {
  newQuiz: any;
  setNewQuiz: (val: any) => void;
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  manualSelectedIds: string[];
  setManualSelectedIds: (ids: string[]) => void;
  aiLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const QuizCreateForm: React.FC<QuizCreateFormProps> = ({
  newQuiz, setNewQuiz, classes, subjects, chapters, questions = [], 
  manualSelectedIds, setManualSelectedIds, aiLoading, onSubmit, onCancel
}) => {
  
  const [adminFormats, setAdminFormats] = useState<any[]>([]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    const loadFormats = () => {
      const saved = localStorage.getItem('quiz_formats');
      if (saved) {
        setAdminFormats(JSON.parse(saved));
      } else {
        const defaultFormats = [
          { id: '1', type: 'MCQ', name: 'Standard MCQ', requiresInput: false },
          { id: '2', type: 'TRUE_FALSE', name: 'True/False', requiresInput: false },
          { id: '3', type: 'SHORT_ANSWER', name: 'Short Answer', requiresInput: true },
          { id: '4', type: 'FILL_IN_THE_GAP', name: 'Fill In The Gap', requiresInput: true }
        ];
        setAdminFormats(defaultFormats);
      }
    };
    loadFormats();

    window.addEventListener('storage_updated', loadFormats);
    return () => window.removeEventListener('storage_updated', loadFormats);
  }, []);

  const normalizeType = (type: string) => {
    if (!type) return '';
    return type.toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
  };

  // ✅ বেস ফিল্টার্ড প্রশ্ন (ক্লাস, সাবজেক্ট এবং চ্যাপ্টার অনুযায়ী)
  const baseFilteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchClass = q.classId === newQuiz.classId;
      const matchSubject = q.subjectId === newQuiz.subjectId;
      const matchChapter = newQuiz.chapterIds && newQuiz.chapterIds.length > 0 
        ? newQuiz.chapterIds.includes(q.chapterId) 
        : true;
      return matchClass && matchSubject && matchChapter;
    });
  }, [questions, newQuiz.classId, newQuiz.subjectId, newQuiz.chapterIds]);

  // ✅ টাইপ অনুযায়ী এভেইলেবল প্রশ্ন গণনা
  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    adminFormats.forEach(f => {
      const fTypeNormalized = normalizeType(f.type);
      const matchedQs = baseFilteredQuestions.filter(q => normalizeType(q.type) === fTypeNormalized);
      counts[f.type] = matchedQs.length;
    });
    return counts;
  }, [baseFilteredQuestions, adminFormats]);

  // ✅ ম্যানুয়াল সিলেকশনের জন্য ফিল্টার্ড লিস্ট
  const filteredQuestions = useMemo(() => {
    const activeFilterNormalized = normalizeType(activeTypeFilter);
    return baseFilteredQuestions.filter(q => {
      const qTypeNormalized = normalizeType(q.type);
      const isAdminType = adminFormats.some(f => normalizeType(f.type) === qTypeNormalized);
      
      if (activeFilterNormalized === 'ALL') return isAdminType;
      return qTypeNormalized === activeFilterNormalized;
    });
  }, [baseFilteredQuestions, activeTypeFilter, adminFormats]);

  const toggleChapter = (chapterId: string) => {
    const currentIds = newQuiz.chapterIds || [];
    const newIds = currentIds.includes(chapterId)
      ? currentIds.filter((id: string) => id !== chapterId)
      : [...currentIds, chapterId];
    
    setNewQuiz({ ...newQuiz, chapterIds: newIds, typeCounts: {}, qCount: 0 });
    setManualSelectedIds([]);
  };

  // ✅ AUTO মোডের জন্য হ্যান্ডলার (টাইপ ভিত্তিক প্রশ্ন সিলেকশন নিশ্চিত করে)
  const handleTypeCountChange = (type: string, count: number) => {
    const val = isNaN(count) ? 0 : count;
    const available = availableCounts[type] || 0;
    const finalCount = Math.max(0, Math.min(val, available));

    const updatedTypeCounts = { 
      ...(newQuiz.typeCounts || {}),
      [type]: finalCount
    };

    // শুধুমাত্র যে টাইপগুলোর সংখ্যা ০ এর বেশি, সেগুলোর থেকে প্রশ্ন কালেক্ট করা
    let selectedIds: string[] = [];
    Object.keys(updatedTypeCounts).forEach(t => {
      const tNormalized = normalizeType(t);
      const countToTake = updatedTypeCounts[t];
      if (countToTake > 0) {
        const matchedQs = baseFilteredQuestions
          .filter(q => normalizeType(q.type) === tNormalized)
          .slice(0, countToTake)
          .map(q => q.id);
        selectedIds = [...selectedIds, ...matchedQs];
      }
    });

    setManualSelectedIds(selectedIds); // Auto mode হলেও internal ID track রাখা জরুরি
    setNewQuiz({ 
      ...newQuiz, 
      typeCounts: updatedTypeCounts, 
      qCount: selectedIds.length,
      selectedQuestionIds: selectedIds // সাবমিটের জন্য আইডিগুলো সেভ করে রাখা
    });
  };

  const toggleQuestion = (id: string) => {
    const newIds = manualSelectedIds.includes(id) 
      ? manualSelectedIds.filter(i => i !== id) 
      : [...manualSelectedIds, id];
    setManualSelectedIds(newIds);
    setNewQuiz({ ...newQuiz, qCount: newIds.length, selectedQuestionIds: newIds });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[48px] shadow-2xl border border-slate-50 space-y-10 animate-in zoom-in duration-500 font-['Hind_Siliguri']">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl">📝</div>
           <h3 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Create Assessment</h3>
        </div>
        <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Teacher Panel</span>
      </div>
      
      <div className="space-y-8">
        <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
          {['AUTO', 'MANUAL'].map(m => (
            <button key={m} type="button" onClick={() => {
                setNewQuiz({...newQuiz, mode: m, typeCounts: {}, qCount: 0, selectedQuestionIds: []});
                setManualSelectedIds([]);
            }} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${newQuiz.mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              {m === 'AUTO' ? 'Auto Generate' : 'Manual Select'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Assessment Title</label>
            <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none focus:border-indigo-500 transition-all text-lg" value={newQuiz.title || ''} onChange={e => setNewQuiz({...newQuiz, title: e.target.value})} placeholder="Ex: Weekly Test - Science" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Class</label>
            <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.classId || ''} onChange={e => setNewQuiz({...newQuiz, classId: e.target.value, subjectId: '', chapterIds: [], typeCounts: {}, qCount: 0, selectedQuestionIds: []})}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Subject</label>
            <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.subjectId || ''} onChange={e => setNewQuiz({...newQuiz, subjectId: e.target.value, chapterIds: [], typeCounts: {}, qCount: 0, selectedQuestionIds: []})}>
              <option value="">Select Subject</option>
              {subjects.filter(s => s.classId === newQuiz.classId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {newQuiz.subjectId && (
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Filter by Chapters</label>
            <div className="flex flex-wrap gap-3">
              {chapters.filter(c => c.subjectId === newQuiz.subjectId).map(ch => (
                <button key={ch.id} type="button" onClick={() => toggleChapter(ch.id)} className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border-2 ${ (newQuiz.chapterIds || []).includes(ch.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>
                  {ch.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type Filter Buttons */}
        {newQuiz.subjectId && adminFormats.length > 0 && (
          <div className="space-y-3 p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Filter Question Types</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTypeFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${activeTypeFilter === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                ALL ({Object.values(availableCounts).reduce((a, b) => a + b, 0)})
              </button>
              {adminFormats.map(f => (
                <button key={f.id} type="button" onClick={() => setActiveTypeFilter(f.type)} className={`px-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${activeTypeFilter === f.type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {f.name.toUpperCase()} ({availableCounts[f.type] || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AUTO MODE Section */}
        {newQuiz.mode === 'AUTO' && newQuiz.subjectId && (
          <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100 space-y-6">
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Auto Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminFormats.map((f) => (
                <div key={`auto-${f.id}`} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{f.name}</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={availableCounts[f.type] || 0}
                    placeholder="0" 
                    className="w-full text-xl font-black text-indigo-600 outline-none bg-transparent" 
                    value={newQuiz.typeCounts?.[f.type] || ''} 
                    onChange={(e) => handleTypeCountChange(f.type, parseInt(e.target.value))} 
                  />
                  <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase">Available: <span className="text-indigo-600">{availableCounts[f.type] || 0}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL MODE Section */}
        {newQuiz.mode === 'MANUAL' && newQuiz.subjectId && (
          <div className="space-y-4">
            <div className="flex justify-between items-center ml-2">
              <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">Select Questions ({manualSelectedIds.length})</h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-[32px] border-2 border-dashed border-slate-200 max-h-[450px] overflow-y-auto space-y-3 custom-scrollbar">
              {filteredQuestions.length > 0 ? filteredQuestions.map((q) => (
                <div key={q.id} onClick={() => toggleQuestion(q.id)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${manualSelectedIds.includes(q.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-white hover:border-indigo-100'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 ${manualSelectedIds.includes(q.id) ? 'bg-white text-indigo-600' : 'border-slate-200 bg-slate-50'}`}>
                    {manualSelectedIds.includes(q.id) ? '✓' : 'Q'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{q.text || q.questionText}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-400 rounded-md">{q.type}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-300 font-bold uppercase text-xs">No matching questions</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
           <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Time (Min)</label>
            <input type="number" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none" value={newQuiz.time || ''} onChange={e => setNewQuiz({...newQuiz, time: parseInt(e.target.value) || 0})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Total Selected</label>
            <div className="w-full p-5 bg-slate-900 border-2 border-slate-900 rounded-[24px] font-black text-white text-center text-xl shadow-lg">
              {newQuiz.qCount || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
        <button type="button" onClick={onSubmit} disabled={aiLoading || !newQuiz.title || newQuiz.qCount === 0} className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-20 hover:-translate-y-1 transition-all">
          {aiLoading ? 'Launching...' : 'Launch Assessment'}
        </button>
      </div>
    </div>
  );
};

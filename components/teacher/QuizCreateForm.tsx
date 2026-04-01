import React, { useState, useMemo, useEffect } from 'react';
import { Class, Subject, Chapter, Question } from '../../types';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

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
  teacherId?: string; // Teacher ID for tracking used questions
}

export const QuizCreateForm: React.FC<QuizCreateFormProps> = ({
  newQuiz, setNewQuiz, classes, subjects, chapters, questions = [],
  manualSelectedIds, setManualSelectedIds, aiLoading, onSubmit, onCancel, teacherId = 'default_teacher'
}) => {

  const [adminFormats, setAdminFormats] = useState<any[]>([]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);

  // Load used questions for this specific teacher from Firebase
  useEffect(() => {
    const loadUsedQuestions = async () => {
      if (!teacherId) return;
      try {
        const usedRef = doc(db, 'teacher_used_questions', teacherId);
        const usedSnap = await getDoc(usedRef);
        if (usedSnap.exists()) {
          setUsedQuestionIds(usedSnap.data().questionIds || []);
        } else {
          // Initialize empty record for new teacher
          await setDoc(usedRef, { questionIds: [], updatedAt: new Date() });
          setUsedQuestionIds([]);
        }
      } catch (error) {
        console.error('Error loading used questions:', error);
        // Fallback to localStorage
        const localUsed = localStorage.getItem(`used_questions_${teacherId}`);
        if (localUsed) setUsedQuestionIds(JSON.parse(localUsed));
      }
    };
    loadUsedQuestions();
  }, [teacherId]);

  useEffect(() => {
    // Firebase থেকে real-time formats load — সব device এ কাজ করবে
    const unsub = onSnapshot(collection(db, 'formats'), (snap) => {
      if (!snap.empty) {
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAdminFormats(loaded);
        // localStorage ও sync রাখো
        localStorage.setItem('quiz_formats', JSON.stringify(loaded));
      } else {
        // Firebase খালি হলে localStorage fallback
        const saved = localStorage.getItem('quiz_formats');
        if (saved) setAdminFormats(JSON.parse(saved));
      }
    });
    return () => unsub();
  }, []);

  // ── Helpers ───────────────────────────────────────────────
  const norm = (v: any) => String(v || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const sameId = (a: any, b: any) => String(a || '').trim() === String(b || '').trim();

  // Shuffle array randomly (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // question এর type কে format key তে convert করা
  // Firebase এ "Standard MCQ", "MCQ", "বর্ণমূলক প্রশ্ব" — সব handle করবে
  const resolveType = (qType: string, formats: any[]): string => {
    const qNorm = norm(qType);
    // exact type match
    const byType = formats.find(f => norm(f.type) === qNorm);
    if (byType) return byType.type;
    // name match — e.g. "Standard MCQ" matches format name "Standard MCQ"
    const byName = formats.find(f => norm(f.name) === qNorm);
    if (byName) return byName.type;
    // partial — qType contains format type or vice versa
    const byPartial = formats.find(f => qNorm.includes(norm(f.type)) || norm(f.type).includes(qNorm));
    if (byPartial) return byPartial.type;
    return qNorm;
  };

  // ── Base filtered questions (class + subject + chapters) ──
  const baseFilteredQuestions = useMemo(() => {
    if (!newQuiz.classId || !newQuiz.subjectId || !newQuiz.chapterIds?.length) return [];

    // ── DEBUG: F12 Console এ দেখো ──────────────────────────
    console.log('[QCF] questions total:', questions.length);
    console.log('[QCF] filtering by classId:', JSON.stringify(newQuiz.classId), 'subjectId:', JSON.stringify(newQuiz.subjectId), 'chapterIds:', JSON.stringify(newQuiz.chapterIds));
    if (questions.length > 0) {
      const sample = questions[0];
      console.log('[QCF] sample question:', { classId: sample.classId, subjectId: sample.subjectId, chapterId: sample.chapterId, type: sample.type });
      console.log('[QCF] classId match test:', sameId(sample.classId, newQuiz.classId));
    }
    // ────────────────────────────────────────────────────────

    const result = questions.filter(q => {
      const matchClass   = sameId(q.classId,   newQuiz.classId);
      const matchSubject = sameId(q.subjectId, newQuiz.subjectId);
      const matchChapter = newQuiz.chapterIds.some((id: string) => sameId(q.chapterId, id));
      return matchClass && matchSubject && matchChapter;
    });

    console.log('[QCF] baseFiltered result count:', result.length);
    return result;
  }, [questions, newQuiz.classId, newQuiz.subjectId, newQuiz.chapterIds]);

  // ── Available counts per type (excluding used questions for this teacher) ──
  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    adminFormats.forEach(f => {
      // Filter out questions already used by this teacher
      const availableQuestions = baseFilteredQuestions.filter(q => {
        const resolved = resolveType(q.type, adminFormats);
        return resolved === f.type && !usedQuestionIds.includes(q.id);
      });
      counts[f.type] = availableQuestions.length;
    });
    return counts;
  }, [baseFilteredQuestions, adminFormats, usedQuestionIds]);

  // ── Filtered list for manual selection ───────────────────
  const filteredQuestions = useMemo(() => {
    return baseFilteredQuestions.filter(q => {
      const resolved = resolveType(q.type, adminFormats);
      const isKnown = adminFormats.some(f => f.type === resolved);
      if (activeTypeFilter === 'ALL') return isKnown;
      return resolved === activeTypeFilter;
    });
  }, [baseFilteredQuestions, activeTypeFilter, adminFormats]);

  // Filter chapters based on selected subject
  const filteredChapters = useMemo(() => {
    return chapters.filter(c => sameId(c.subjectId, newQuiz.subjectId));
  }, [chapters, newQuiz.subjectId]);

  // Get selected chapters in serial order (maintain selection order)
  const selectedChapters = useMemo(() => {
    const chapterMap = new Map(filteredChapters.map(c => [c.id, c]));
    return (newQuiz.chapterIds || [])
      .map((id: string) => chapterMap.get(id))
      .filter(Boolean);
  }, [filteredChapters, newQuiz.chapterIds]);

  // ── Handle chapter toggle in dropdown ──
  const toggleChapter = (chapterId: string) => {
    const currentIds = newQuiz.chapterIds || [];
    const exists = currentIds.some((id: string) => sameId(id, chapterId));
    
    let newChapterIds: string[];
    if (exists) {
      // Remove if already selected
      newChapterIds = currentIds.filter((id: string) => !sameId(id, chapterId));
    } else {
      // Add to end (maintains serial order)
      newChapterIds = [...currentIds, chapterId];
    }
    
    setNewQuiz({ 
      ...newQuiz, 
      chapterIds: newChapterIds, 
      typeCounts: {}, 
      qCount: 0, 
      selectedQuestionIds: [] 
    });
    setManualSelectedIds([]);
  };

  // ── Remove specific chapter from selection ──
  const removeChapter = (chapterId: string) => {
    const newChapterIds = (newQuiz.chapterIds || []).filter((id: string) => !sameId(id, chapterId));
    setNewQuiz({ 
      ...newQuiz, 
      chapterIds: newChapterIds, 
      typeCounts: {}, 
      qCount: 0, 
      selectedQuestionIds: [] 
    });
    setManualSelectedIds([]);
  };

  // ── AUTO mode: type count change ──────────────────────────
  const handleTypeCountChange = (type: string, count: number) => {
    const clamped = Math.max(0, Math.min(isNaN(count) ? 0 : count, availableCounts[type] || 0));
    const updatedTypeCounts = { ...(newQuiz.typeCounts || {}), [type]: clamped };

    let selectedIds: string[] = [];
    Object.entries(updatedTypeCounts).forEach(([t, n]) => {
      if ((n as number) > 0) {
        // Get available questions for this type (excluding used ones)
        const availableForType = baseFilteredQuestions.filter(q => {
          const resolved = resolveType(q.type, adminFormats);
          return resolved === t && !usedQuestionIds.includes(q.id);
        });
        
        // Shuffle and take random questions
        const shuffled = shuffleArray(availableForType);
        const matched = shuffled
          .slice(0, n as number)
          .map(q => q.id);
        selectedIds = [...selectedIds, ...matched];
      }
    });

    setManualSelectedIds(selectedIds);
    setNewQuiz({ ...newQuiz, typeCounts: updatedTypeCounts, qCount: selectedIds.length, selectedQuestionIds: selectedIds });
  };

  // ── MANUAL mode: toggle question ──────────────────────────
  const toggleQuestion = (id: string) => {
    const next = manualSelectedIds.includes(id)
      ? manualSelectedIds.filter(i => i !== id)
      : [...manualSelectedIds, id];
    setManualSelectedIds(next);
    setNewQuiz({ ...newQuiz, qCount: next.length, selectedQuestionIds: next });
  };

  // ── Save used questions when quiz is submitted ───────────
  const handleSubmit = async () => {
    if (!newQuiz.selectedQuestionIds?.length || !teacherId) {
      onSubmit();
      return;
    }

    try {
      // Save used questions to Firebase for this specific teacher
      const usedRef = doc(db, 'teacher_used_questions', teacherId);
      const usedSnap = await getDoc(usedRef);
      
      if (usedSnap.exists()) {
        await updateDoc(usedRef, {
          questionIds: arrayUnion(...newQuiz.selectedQuestionIds),
          updatedAt: new Date()
        });
      } else {
        await setDoc(usedRef, {
          questionIds: newQuiz.selectedQuestionIds,
          updatedAt: new Date()
        });
      }
      
      // Also update localStorage as backup
      const currentUsed = usedQuestionIds;
      const updatedUsed = [...new Set([...currentUsed, ...newQuiz.selectedQuestionIds])];
      localStorage.setItem(`used_questions_${teacherId}`, JSON.stringify(updatedUsed));
      setUsedQuestionIds(updatedUsed);
    } catch (error) {
      console.error('Error saving used questions:', error);
      // Fallback: save to localStorage only
      const currentUsed = usedQuestionIds;
      const updatedUsed = [...new Set([...currentUsed, ...newQuiz.selectedQuestionIds])];
      localStorage.setItem(`used_questions_${teacherId}`, JSON.stringify(updatedUsed));
    }
    
    onSubmit();
  };

  const totalAvailable = Object.values(availableCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[48px] shadow-2xl border border-slate-50 space-y-10 animate-in zoom-in duration-500 font-['Hind_Siliguri']">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl">📝</div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Create Assessment</h3>
        </div>
        <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Teacher Panel</span>
      </div>

      <div className="space-y-8">

        {/* AUTO / MANUAL toggle */}
        <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
          {['AUTO', 'MANUAL'].map(m => (
            <button key={m} type="button"
              onClick={() => {
                setNewQuiz({ ...newQuiz, mode: m, typeCounts: {}, qCount: 0, selectedQuestionIds: [] });
                setManualSelectedIds([]);
              }}
              className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${newQuiz.mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              {m === 'AUTO' ? 'Auto Generate' : 'Manual Select'}
            </button>
          ))}
        </div>

        {/* Title + Class + Subject + Chapter (All dropdowns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Assessment Title</label>
            <input
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none focus:border-indigo-500 transition-all text-lg"
              value={newQuiz.title || ''}
              onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })}
              placeholder="Ex: Weekly Test - Science"
            />
          </div>
          
          {/* Class Dropdown */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Class</label>
            <select
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none"
              value={newQuiz.classId || ''}
              onChange={e => setNewQuiz({ 
                ...newQuiz, 
                classId: e.target.value, 
                subjectId: '', 
                chapterIds: [], 
                typeCounts: {}, 
                qCount: 0, 
                selectedQuestionIds: [] 
              })}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          {/* Subject Dropdown */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Subject</label>
            <select
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none disabled:opacity-50"
              value={newQuiz.subjectId || ''}
              disabled={!newQuiz.classId}
              onChange={e => setNewQuiz({ 
                ...newQuiz, 
                subjectId: e.target.value, 
                chapterIds: [], 
                typeCounts: {}, 
                qCount: 0, 
                selectedQuestionIds: [] 
              })}>
              <option value="">Select Subject</option>
              {subjects.filter(s => sameId(s.classId, newQuiz.classId)).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          {/* Chapter Multi-Select Dropdown */}
          <div className="md:col-span-2 relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">
              Chapters (Multiple Select)
            </label>
            <div 
              className={`w-full p-4 bg-slate-50 border-2 rounded-[24px] font-bold outline-none cursor-pointer transition-all ${
                isChapterDropdownOpen ? 'border-indigo-500' : 'border-slate-100'
              } ${!newQuiz.subjectId ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => newQuiz.subjectId && setIsChapterDropdownOpen(!isChapterDropdownOpen)}
            >
              {/* Selected chapters display (serially) */}
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {selectedChapters.length === 0 ? (
                  <span className="text-slate-400 font-normal">Select Chapters...</span>
                ) : (
                  selectedChapters.map((chapter, index) => (
                    <div 
                      key={chapter.id}
                      className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-sm"
                    >
                      <span className="font-black text-xs">{index + 1}.</span>
                      <span>{chapter.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChapter(chapter.id);
                        }}
                        className="w-5 h-5 rounded-full bg-indigo-200 hover:bg-indigo-300 flex items-center justify-center text-xs transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Dropdown Menu */}
            {isChapterDropdownOpen && filteredChapters.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-[24px] shadow-xl z-50 max-h-[300px] overflow-y-auto">
                <div className="p-2 space-y-1">
                  {filteredChapters.map((chapter, index) => {
                    const isSelected = (newQuiz.chapterIds || []).some((id: string) => sameId(id, chapter.id));
                    return (
                      <div
                        key={chapter.id}
                        onClick={() => toggleChapter(chapter.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-50 border border-indigo-200' 
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-slate-700">{chapter.name}</span>
                          {isSelected && (
                            <span className="ml-2 text-xs text-indigo-500 font-bold">
                              (Selected #{selectedChapters.findIndex(c => c.id === chapter.id) + 1})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Click outside to close */}
            {isChapterDropdownOpen && (
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsChapterDropdownOpen(false)}
              />
            )}
          </div>
        </div>

        {/* Debug info — questions found */}
        {newQuiz.classId && newQuiz.subjectId && newQuiz.chapterIds?.length > 0 && (
          <div className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 ${
            baseFilteredQuestions.length > 0
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-500'
          }`}>
            {baseFilteredQuestions.length > 0
              ? `✅ ${baseFilteredQuestions.length}টি প্রশ্ন পাওয়া গেছে (${newQuiz.chapterIds.length}টি chapter থেকে)`
              : `⚠️ এই class/subject/chapters-এ কোনো প্রশ্ন নেই — Question Bank চেক করুন`}
          </div>
        )}

        {/* Used questions info */}
        {newQuiz.mode === 'AUTO' && usedQuestionIds.length > 0 && (
          <div className="px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 bg-amber-50 text-amber-600">
            🔄 {usedQuestionIds.length}টি প্রশ্ন আগে ব্যবহৃত (এই শিক্ষকের জন্য বাদ দেওয়া হয়েছে)
          </div>
        )}

        {/* Type filter buttons */}
        {newQuiz.chapterIds?.length > 0 && adminFormats.length > 0 && (
          <div className="space-y-3 p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Filter Question Types</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTypeFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${
                  activeTypeFilter === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
                }`}>
                ALL ({totalAvailable})
              </button>
              {adminFormats.map(f => (
                <button key={f.id} type="button" onClick={() => setActiveTypeFilter(f.type)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${
                    activeTypeFilter === f.type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                  {f.name.toUpperCase()} ({availableCounts[f.type] || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AUTO MODE */}
        {newQuiz.mode === 'AUTO' && newQuiz.chapterIds?.length > 0 && (
          <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Auto Distribution</h4>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-100 px-3 py-1 rounded-full">Random Selection Enabled</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminFormats.map(f => (
                <div key={`auto-${f.id}`} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{f.name}</label>
                  <input
                    type="number" min="0" max={availableCounts[f.type] || 0} placeholder="0"
                    className="w-full text-xl font-black text-indigo-600 outline-none bg-transparent"
                    value={newQuiz.typeCounts?.[f.type] || ''}
                    onChange={e => handleTypeCountChange(f.type, parseInt(e.target.value))}
                  />
                  <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase">
                    Available: <span className="text-indigo-600">{availableCounts[f.type] || 0}</span>
                    {usedQuestionIds.length > 0 && (
                      <span className="text-amber-500 ml-1">(used excluded)</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL MODE */}
        {newQuiz.mode === 'MANUAL' && newQuiz.chapterIds?.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center ml-2">
              <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">
                Select Questions ({manualSelectedIds.length})
              </h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-[32px] border-2 border-dashed border-slate-200 max-h-[450px] overflow-y-auto space-y-3 custom-scrollbar">
              {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                <div key={q.id} onClick={() => toggleQuestion(q.id)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                    manualSelectedIds.includes(q.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-white hover:border-indigo-100'
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 ${
                    manualSelectedIds.includes(q.id) ? 'bg-white text-indigo-600' : 'border-slate-200 bg-slate-50'
                  }`}>
                    {manualSelectedIds.includes(q.id) ? '✓' : 'Q'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{q.text || (q as any).questionText}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-400 rounded-md">{q.type}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-300 font-bold uppercase text-xs">
                  No matching questions
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time + Total */}
        <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Time (Min)</label>
            <input type="number"
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none"
              value={newQuiz.time || ''}
              onChange={e => setNewQuiz({ ...newQuiz, time: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Total Selected</label>
            <div className="w-full p-5 bg-slate-900 border-2 border-slate-900 rounded-[24px] font-black text-white text-center text-xl shadow-lg">
              {newQuiz.qCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 pt-6">
        <button type="button" onClick={onCancel}
          className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit}
          disabled={aiLoading || !newQuiz.title || newQuiz.qCount === 0}
          className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-20 hover:-translate-y-1 transition-all">
          {aiLoading ? 'Launching...' : 'Launch Assessment'}
        </button>
      </div>
    </div>
  );
};

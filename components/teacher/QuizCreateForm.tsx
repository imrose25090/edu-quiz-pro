import React, { useState, useMemo, useEffect } from 'react';
import { Class, Subject, Chapter, Question } from '../../types';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

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
    if (!newQuiz.classId || !newQuiz.subjectId) return [];

    // ── DEBUG: F12 Console এ দেখো ──────────────────────────
    console.log('[QCF] questions total:', questions.length);
    console.log('[QCF] filtering by classId:', JSON.stringify(newQuiz.classId), 'subjectId:', JSON.stringify(newQuiz.subjectId));
    if (questions.length > 0) {
      const sample = questions[0];
      console.log('[QCF] sample question:', { classId: sample.classId, subjectId: sample.subjectId, type: sample.type });
      console.log('[QCF] classId match test:', sameId(sample.classId, newQuiz.classId));
    }
    // ────────────────────────────────────────────────────────

    const result = questions.filter(q => {
      const matchClass   = sameId(q.classId,   newQuiz.classId);
      const matchSubject = sameId(q.subjectId, newQuiz.subjectId);
      const matchChapter = !newQuiz.chapterIds?.length
        ? true
        : newQuiz.chapterIds.some((id: string) => sameId(q.chapterId, id));
      return matchClass && matchSubject && matchChapter;
    });

    console.log('[QCF] baseFiltered result count:', result.length);
    return result;
  }, [questions, newQuiz.classId, newQuiz.subjectId, newQuiz.chapterIds]);

  // ── Available counts per type ─────────────────────────────
  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    adminFormats.forEach(f => {
      counts[f.type] = baseFilteredQuestions.filter(
        q => resolveType(q.type, adminFormats) === f.type
      ).length;
    });
    return counts;
  }, [baseFilteredQuestions, adminFormats]);

  // ── Filtered list for manual selection ───────────────────
  const filteredQuestions = useMemo(() => {
    return baseFilteredQuestions.filter(q => {
      const resolved = resolveType(q.type, adminFormats);
      const isKnown = adminFormats.some(f => f.type === resolved);
      if (activeTypeFilter === 'ALL') return isKnown;
      return resolved === activeTypeFilter;
    });
  }, [baseFilteredQuestions, activeTypeFilter, adminFormats]);

  // ── Chapter toggle ────────────────────────────────────────
  const toggleChapter = (chapterId: string) => {
    const cur = newQuiz.chapterIds || [];
    const next = cur.some((id: string) => sameId(id, chapterId))
      ? cur.filter((id: string) => !sameId(id, chapterId))
      : [...cur, chapterId];
    setNewQuiz({ ...newQuiz, chapterIds: next, typeCounts: {}, qCount: 0, selectedQuestionIds: [] });
    setManualSelectedIds([]);
  };

  // ── AUTO mode: type count change ──────────────────────────
  const handleTypeCountChange = (type: string, count: number) => {
    const clamped = Math.max(0, Math.min(isNaN(count) ? 0 : count, availableCounts[type] || 0));
    const updatedTypeCounts = { ...(newQuiz.typeCounts || {}), [type]: clamped };

    let selectedIds: string[] = [];
    Object.entries(updatedTypeCounts).forEach(([t, n]) => {
      if ((n as number) > 0) {
        const matched = baseFilteredQuestions
          .filter(q => resolveType(q.type, adminFormats) === t)
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

        {/* Title + Class + Subject */}
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
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Class</label>
            <select
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none"
              value={newQuiz.classId || ''}
              onChange={e => setNewQuiz({ ...newQuiz, classId: e.target.value, subjectId: '', chapterIds: [], typeCounts: {}, qCount: 0, selectedQuestionIds: [] })}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Subject</label>
            <select
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold outline-none"
              value={newQuiz.subjectId || ''}
              onChange={e => setNewQuiz({ ...newQuiz, subjectId: e.target.value, chapterIds: [], typeCounts: {}, qCount: 0, selectedQuestionIds: [] })}>
              <option value="">Select Subject</option>
              {subjects.filter(s => sameId(s.classId, newQuiz.classId)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Debug info — questions found */}
        {newQuiz.classId && newQuiz.subjectId && (
          <div className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 ${
            baseFilteredQuestions.length > 0
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-500'
          }`}>
            {baseFilteredQuestions.length > 0
              ? `✅ ${baseFilteredQuestions.length}টি প্রশ্ন পাওয়া গেছে`
              : `⚠️ এই class/subject-এ কোনো প্রশ্ন নেই — Question Bank চেক করুন`}
          </div>
        )}

        {/* Chapters */}
        {newQuiz.subjectId && (
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Filter by Chapters</label>
            <div className="flex flex-wrap gap-3">
              {chapters.filter(c => sameId(c.subjectId, newQuiz.subjectId)).map(ch => (
                <button key={ch.id} type="button" onClick={() => toggleChapter(ch.id)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                    (newQuiz.chapterIds || []).some((id: string) => sameId(id, ch.id))
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-slate-100 text-slate-500'
                  }`}>
                  {ch.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── DEBUG (সমস্যা ঠিক হলে remove করো) ── */}
        {newQuiz.subjectId && (
          <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-[10px] font-mono space-y-1 break-all">
            <p className="font-black text-yellow-700">🔍 Debug</p>
            <p>questions prop total: <b>{questions.length}</b></p>
            <p>after class+subject filter: <b>{baseFilteredQuestions.length}</b></p>
            <p>formats: <b>{adminFormats.map(f => f.type).join(' | ')}</b></p>
            <p>q.types found: <b>{[...new Set(baseFilteredQuestions.map((q:any) => q.type))].join(' | ')}</b></p>
            <p>availableCounts: <b>{JSON.stringify(availableCounts)}</b></p>
          </div>
        )}

        {/* Type filter buttons */}
        {newQuiz.subjectId && adminFormats.length > 0 && (
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
        {newQuiz.mode === 'AUTO' && newQuiz.subjectId && (
          <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100 space-y-6">
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Auto Distribution</h4>
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
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL MODE */}
        {newQuiz.mode === 'MANUAL' && newQuiz.subjectId && (
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
        <button type="button" onClick={onSubmit}
          disabled={aiLoading || !newQuiz.title || newQuiz.qCount === 0}
          className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-20 hover:-translate-y-1 transition-all">
          {aiLoading ? 'Launching...' : 'Launch Assessment'}
        </button>
      </div>
    </div>
  );
};

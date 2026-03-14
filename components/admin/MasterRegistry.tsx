import React, { useMemo, useState, useEffect } from 'react';
import { Class, Subject, Chapter, Question, Teacher } from '../../types';
import { useApp } from "../../store";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc, getDocs, deleteDoc, query, where, addDoc, serverTimestamp } from "firebase/firestore";

interface MasterRegistryProps {
  activeTab: string;
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  teachers: Teacher[];
  students: any[];
  selectedClassId: string;
  selectedSubjectId: string;
  deleteClass: (id: string) => void;
  deleteSubject: (id: string) => void;
  deleteChapter: (id: string) => void;
  deleteQuestion: (id: string) => void;
  deleteTeacher: (id: string) => void;
  deleteStudent?: (id: string) => void;
  updateTeacher: (id: string, data: any) => void;
  updateStudent?: (id: string, data: any) => void;
}

const MasterRegistry: React.FC<MasterRegistryProps> = ({
  activeTab = 'REGISTRY',
  classes = [], subjects = [], chapters = [], questions = [],
  teachers = [], students = [], selectedClassId, selectedSubjectId,
  deleteClass, deleteSubject, deleteChapter, deleteQuestion,
  deleteTeacher, deleteStudent, updateTeacher, updateStudent,
}) => {
  const store = useApp();

  // ── Real-time Firestore listeners ─────────────────────────
  const [liveClasses,   setLiveClasses]   = useState<any[]>(classes);
  const [liveSubjects,  setLiveSubjects]  = useState<any[]>(subjects);
  const [liveChapters,  setLiveChapters]  = useState<any[]>(chapters);
  const [liveTeachers,    setLiveTeachers]    = useState<any[]>(teachers);
  const [liveStudents,    setLiveStudents]    = useState<any[]>(students);
  const [liveQuizzes,     setLiveQuizzes]     = useState<any[]>([]);
  const [securityAlerts,  setSecurityAlerts]  = useState<any[]>([]);
  const [showAlerts,      setShowAlerts]      = useState(false);

  // ── questions সরাসরি store থেকে (store.tsx-এ orderBy দিয়ে ঠিকমতো fetch হচ্ছে) ──
  const liveQuestions = store.questions;

  useEffect(() => {
    const simpleCols: [string, React.Dispatch<React.SetStateAction<any[]>>][] = [
      ['classes',   setLiveClasses],
      ['subjects',  setLiveSubjects],
      ['chapters',  setLiveChapters],
      ['teachers',  setLiveTeachers],
      ['students',  setLiveStudents],
    ];
    const unsubs = simpleCols.map(([col, setter]) =>
      onSnapshot(collection(db, col), snap => {
        setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      })
    );

    // ✅ quizzes — attempts subcollection সহ load করো
    const quizUnsub = onSnapshot(collection(db, 'quizzes'), async (snap) => {
      const quizzes = await Promise.all(
        snap.docs.map(async (d) => {
          const quiz = { id: d.id, ...d.data(), attempts: [] as any[] };
          const attSnap = await getDocs(collection(db, 'quizzes', d.id, 'attempts'));
          quiz.attempts = attSnap.docs.map(a => ({ id: a.id, ...a.data() }));
          return quiz;
        })
      );
      setLiveQuizzes(quizzes);
    });

    // ✅ Security alerts real-time listener
    const alertUnsub = onSnapshot(
      query(collection(db, 'securityAlerts'), where('resolved', '==', false)),
      snap => setSecurityAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubs.forEach(u => u()); quizUnsub(); alertUnsub(); };
  }, []);

  // ── Debug log (remove after fix confirmed) ──────────────
  useEffect(() => {
  }, [store.questions]);

  // ── Real-time student stats from quizzes ──────────────────
  const studentStats = useMemo(() => {
    const map: Record<string, { points: number; quizCount: number }> = {};
    liveQuizzes.forEach(quiz => {
      (quiz.attempts || []).forEach((att: any) => {
        const name = att.studentName;
        if (!name) return;
        const c   = Number(att.score) || 0;
        const tot = Number(att.totalMarks) || 0;
        // earnedPoints Firebase এ saved থাকলে সেটাই নাও (bonus সহ)
        const pts = att.earnedPoints !== undefined
          ? Number(att.earnedPoints)
          : Math.max(0, c - (tot - c) * 0.5);
        if (!map[name]) map[name] = { points: 0, quizCount: 0 };
        map[name].points    += pts;
        map[name].quizCount += 1;
      });
    });
    return map;
  }, [liveQuizzes]);

  // ── Weekly / Monthly report ───────────────────────────────
  const reportStats = useMemo(() => {
    const now   = new Date();
    const week  = new Date(now); week.setDate(now.getDate() - 7);
    const month = new Date(now); month.setDate(now.getDate() - 30);

    let wQ = 0, wA = 0, wP = 0, mQ = 0, mA = 0, mP = 0;

    liveQuizzes.forEach(quiz => {
      const raw = quiz.createdAt;
      const created = raw?.toDate?.() ?? (raw?.seconds ? new Date(raw.seconds * 1000) : new Date(raw || 0));
      const attempts = quiz.attempts || [];

      if (created >= week)  { wQ++; wA += attempts.length; }
      if (created >= month) { mQ++; mA += attempts.length; }

      attempts.forEach((att: any) => {
        const sub = att.submittedAt ? new Date(att.submittedAt) : null;
        const pts = att.earnedPoints !== undefined
          ? Number(att.earnedPoints)
          : Math.max(0, (Number(att.score) || 0) - ((Number(att.totalMarks) || 0) - (Number(att.score) || 0)) * 0.5);
        if (sub && sub >= week)  wP += pts;
        if (sub && sub >= month) mP += pts;
      });
    });

    return { wQ, wA, wP, mQ, mA, mP };
  }, [liveQuizzes]);

  const totalGlobalPoints  = useMemo(() => Object.values(studentStats).reduce((a, s) => a + s.points, 0), [studentStats]);
  const totalGlobalQuizzes = useMemo(() => Object.values(studentStats).reduce((a, s) => a + s.quizCount, 0), [studentStats]);

  // ── Detail Modal state ────────────────────────────────────
  const [detailModal, setDetailModal] = useState<null | 'students' | 'teachers' | 'quizzes' | 'questions' | 'classes' | 'week' | 'month' | 'growth'>(null);

  // ── Growth chart data (last 14 days) ─────────────────────
  const growthData = useMemo(() => {
    const days: { label: string; quizzes: number; attempts: number; points: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ label, quizzes: 0, attempts: 0, points: 0 });
    }
    liveQuizzes.forEach(quiz => {
      const raw = quiz.createdAt;
      const cd = raw?.toDate?.() ?? (raw?.seconds ? new Date(raw.seconds * 1000) : new Date(raw || 0));
      const dk = cd.toISOString().slice(0, 10);
      const idx = days.findIndex((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        return d.toISOString().slice(0, 10) === dk;
      });
      if (idx >= 0) days[idx].quizzes += 1;

      (quiz.attempts || []).forEach((att: any) => {
        const sub = att.submittedAt ? new Date(att.submittedAt) : null;
        if (!sub) return;
        const sk = sub.toISOString().slice(0, 10);
        const si = days.findIndex((_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (13 - i));
          return d.toISOString().slice(0, 10) === sk;
        });
        if (si >= 0) {
          days[si].attempts += 1;
          days[si].points += att.earnedPoints !== undefined
            ? Number(att.earnedPoints)
            : Math.max(0, (Number(att.score)||0) - ((Number(att.totalMarks)||0) - (Number(att.score)||0)) * 0.5);
        }
      });
    });
    return days;
  }, [liveQuizzes]);

  // ── Duplicate attempt detection ──────────────────────────
  const duplicateInfo = useMemo(() => {
    const result: {
      quizId: string; quizTitle: string; quizCode: string;
      studentName: string; count: number; keepIdx: number;
    }[] = [];
    liveQuizzes.forEach(quiz => {
      const attempts: any[] = quiz.attempts || [];
      // group by studentName
      const byStudent: Record<string, number[]> = {};
      attempts.forEach((att, idx) => {
        const n = att.studentName || 'Unknown';
        if (!byStudent[n]) byStudent[n] = [];
        byStudent[n].push(idx);
      });
      Object.entries(byStudent).forEach(([name, idxs]) => {
        if (idxs.length > 1) {
          result.push({
            quizId: quiz.id,
            quizTitle: quiz.title || 'Untitled',
            quizCode: quiz.code || '',
            studentName: name,
            count: idxs.length,
            keepIdx: idxs[0], // keep first
          });
        }
      });
    });
    return result;
  }, [liveQuizzes]);

  // ── Auto-clean duplicates — directly subcollection থেকে পড়ো ─
  const cleanDuplicates = async (quizId: string) => {
    // ✅ FIX: liveQuizzes.attempts array এ Firestore doc ID নেই
    //         তাই সরাসরি subcollection fetch করো
    const attSnap = await getDocs(collection(db, 'quizzes', quizId, 'attempts'));
    const docs = attSnap.docs; // প্রতিটায় real .id আছে

    const seen: Record<string, string> = {}; // studentName → first doc id
    for (const d of docs) {
      const n = (d.data().studentName || 'Unknown').trim().toLowerCase();
      if (seen[n]) {
        // duplicate — এই doc টা delete করো
        await deleteDoc(doc(db, 'quizzes', quizId, 'attempts', d.id));
        // main doc এর array থেকেও সরাও
        const quiz = liveQuizzes.find(q => q.id === quizId);
        if (quiz) {
          const filtered = (quiz.attempts || []).filter(
            (a: any) => a.submittedAt !== d.data().submittedAt
          );
          await updateDoc(doc(db, 'quizzes', quizId), { attempts: filtered });
        }
      } else {
        seen[n] = d.id;
      }
    }
  };

  const cleanAllDuplicates = async () => {
    if (!window.confirm(`${duplicateInfo.length} জন student এর duplicate attempt delete করবেন?`)) return;
    const quizIds = [...new Set(duplicateInfo.map(d => d.quizId))];
    for (const id of quizIds) await cleanDuplicates(id);
    alert('✅ সব duplicate সরানো হয়েছে!');
  };

  const [showDuplicates, setShowDuplicates] = useState(false);

  // ✅ Student Create Form state
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [newStudentName,    setNewStudentName]    = useState('');
  const [newStudentPass,    setNewStudentPass]    = useState('');
  const [studentSearch,     setStudentSearch]     = useState('');
  const [isCreating,        setIsCreating]        = useState(false);

  const handleCreateStudent = async () => {
    const name = newStudentName.trim();
    const pass = newStudentPass.trim();
    if (!name || !pass) { alert('নাম ও পাসওয়ার্ড দিন!'); return; }
    if (pass.length < 4) { alert('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!'); return; }
    const exists = liveStudents.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) { alert('এই নামে ইতিমধ্যে account আছে!'); return; }
    setIsCreating(true);
    try {
      await addDoc(collection(db, 'students'), {
        name, password: pass, role: 'student',
        createdAt: serverTimestamp(),
        isFrozen: false, totalPoints: 0, quizzesPlayed: 0,
        createdByAdmin: true,
      });
      setNewStudentName(''); setNewStudentPass('');
      setShowCreateStudent(false);
      alert(`✅ "${name}" এর account তৈরি হয়েছে!`);
    } catch (err) {
      alert('Account তৈরি করতে সমস্যা হয়েছে!');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const sortedStudents = useMemo(() =>
    [...liveStudents].sort((a, b) => (studentStats[b.name]?.points || 0) - (studentStats[a.name]?.points || 0)),
  [liveStudents, studentStats]);

  // ✅ FIX: sortedStudents এর পরে define করো
  const filteredStudents = studentSearch
    ? liveStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
    : liveStudents;
  const filteredSortedStudents = studentSearch
    ? sortedStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
    : sortedStudents;

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'CLASSES':   return liveClasses;
      case 'SUBJECTS':  return liveSubjects.filter(s => !selectedClassId || s.classId === selectedClassId);
      case 'CHAPTERS':  return liveChapters.filter(ch => !selectedSubjectId || ch.subjectId === selectedSubjectId);
      case 'QUESTIONS': return liveQuestions.filter(q => !selectedSubjectId || q.subjectId === selectedSubjectId);
      case 'TEACHERS':  return liveTeachers;
      case 'STUDENT':   return sortedStudents;
      case 'REGISTRY':  return [...liveTeachers, ...liveStudents];
      default:          return [];
    }
  }, [activeTab, liveClasses, liveSubjects, liveChapters, liveQuestions, liveTeachers, liveStudents, sortedStudents, selectedClassId, selectedSubjectId]);

  // ── Student card helper ───────────────────────────────────
  const StudentCard = ({ user, index, showRank }: { user: any; index: number; showRank: boolean }) => {
    const pts = studentStats[user.name]?.points || 0;
    const qc  = studentStats[user.name]?.quizCount || 0;
    return (
      <div className={`p-5 rounded-[24px] border bg-white flex flex-col md:flex-row justify-between items-center gap-4 transition-all shadow-sm ${
        user.isFrozen ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 hover:border-emerald-300 hover:shadow-md'
      }`}>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative shrink-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border ${
              user.isFrozen ? 'bg-rose-50 text-rose-400 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'
            }`}>{user.name?.[0] || 'S'}</div>
            {showRank && (
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-amber-400 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white">
                {index + 1}
              </div>
            )}
          </div>
          <div>
            <div className="font-black text-slate-800 flex items-center gap-2 text-sm">
              {user.name}
              <span className="text-[8px] bg-slate-500 text-white px-2 py-0.5 rounded-full">STUDENT</span>
              {user.isFrozen && <span className="text-[8px] bg-rose-500 text-white px-2 py-0.5 rounded-full">BLOCKED</span>}
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{pts.toFixed(1)} pts</span>
              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{qc} quizzes</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button onClick={() => store.setImpersonatedUser({ ...user, role: 'student' })}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 transition-all shadow-sm active:scale-95">
            Login Direct
          </button>
          <button onClick={() => updateStudent?.(user.id, { isFrozen: !user.isFrozen })}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${user.isFrozen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white'}`}>
            {user.isFrozen ? 'Unfreeze' : 'Freeze'}
          </button>
          <button onClick={() => { if (window.confirm('Delete Student?')) deleteStudent?.(user.id); }}
            className="bg-rose-50 text-rose-500 px-4 py-2.5 rounded-xl font-black text-[10px] transition-all hover:bg-rose-500 hover:text-white">
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col font-['Hind_Siliguri']">

      {/* ══ System Analytics ════════════════════════════════ */}
      <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-4">
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">System Analytics</h3>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Performance & Points Report</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center min-w-[90px]">
              <div className="text-[9px] font-black text-slate-400 uppercase">Avg Points</div>
              <div className="text-xl font-black text-emerald-400">
                {liveStudents.length > 0 ? (totalGlobalPoints / liveStudents.length).toFixed(1) : '0.0'}
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center min-w-[90px]">
              <div className="text-[9px] font-black text-slate-400 uppercase">Total Points</div>
              <div className="text-xl font-black text-indigo-400">{totalGlobalPoints.toFixed(0)}</div>
            </div>
          </div>
        </div>

        {/* 5 stat cards — clickable */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Students',       val: liveStudents.length,   color: 'bg-indigo-600',                               key: 'students'  as const },
            { label: 'Teachers',       val: liveTeachers.length,   color: 'bg-violet-600',                               key: 'teachers'  as const },
            { label: 'Quizzes Played', val: totalGlobalQuizzes,    color: 'bg-slate-700/50 border border-slate-600',     key: 'quizzes'   as const },
            { label: 'Questions',      val: liveQuestions.length,  color: 'bg-slate-700/50 border border-slate-600',     key: 'questions' as const },
            { label: 'Classes',        val: liveClasses.length,    color: 'bg-slate-700/50 border border-slate-600',     key: 'classes'   as const },
          ].map(s => (
            <button key={s.label} onClick={() => setDetailModal(s.key)}
              className={`${s.color} p-4 rounded-[20px] text-left transition-all hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer`}>
              <div className="text-[9px] font-black uppercase text-slate-300 mb-1">{s.label}</div>
              <div className="text-3xl font-black">{s.val}</div>
              <div className="text-[8px] text-slate-400 mt-1 font-bold">tap for details →</div>
            </button>
          ))}
        </div>

        {/* Weekly / Monthly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: '📅 This Week', color: 'text-emerald-400', key: 'week' as const, stats: [
              { l: 'Quizzes', v: reportStats.wQ },
              { l: 'Attempts', v: reportStats.wA },
              { l: 'Points', v: reportStats.wP.toFixed(0) },
            ]},
            { title: '📆 This Month', color: 'text-indigo-400', key: 'month' as const, stats: [
              { l: 'Quizzes', v: reportStats.mQ },
              { l: 'Attempts', v: reportStats.mA },
              { l: 'Points', v: reportStats.mP.toFixed(0) },
            ]},
          ].map(r => (
            <button key={r.title} onClick={() => setDetailModal(r.key)}
              className="bg-white/8 border border-white/10 rounded-[18px] p-4 text-left w-full hover:bg-white/15 transition-all cursor-pointer">
              <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${r.color}`}>{r.title} <span className="text-slate-500 normal-case font-bold text-[8px]">· tap for details</span></p>
              <div className="grid grid-cols-3 gap-2">
                {r.stats.map(s => (
                  <div key={s.l} className="text-center bg-white/10 rounded-xl p-2">
                    <div className="text-[8px] font-black text-slate-400 uppercase">{s.l}</div>
                    <div className="text-xl font-black text-white">{s.v}</div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ══ Growth Chart ════════════════════════════════════ */}
      <button onClick={() => setDetailModal('growth')}
        className="mt-3 w-full bg-white/8 border border-white/10 rounded-[18px] p-4 text-left hover:bg-white/15 transition-all cursor-pointer">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[9px] font-black text-white uppercase tracking-widest">📈 14-Day Activity Growth</p>
          <span className="text-[8px] font-bold text-slate-400">tap to expand →</span>
        </div>
        {/* Mini bar chart */}
        <div className="flex items-end gap-0.5 h-10">
          {growthData.map((d, i) => {
            const maxAtt = Math.max(...growthData.map(x => x.attempts), 1);
            const h = Math.max(4, Math.round((d.attempts / maxAtt) * 40));
            const isToday = i === 13;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  style={{ height: `${h}px` }}
                  className={`w-full rounded-sm transition-all ${isToday ? 'bg-emerald-400' : d.attempts > 0 ? 'bg-indigo-400' : 'bg-white/10'}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[7px] text-slate-500 font-bold">{growthData[0]?.label}</span>
          <span className="text-[7px] text-slate-500 font-bold">Today</span>
        </div>
      </button>

      {/* ══ Duplicate Alert ══════════════════════════════════ */}
      {duplicateInfo.length > 0 && (
        <div className="mx-8 mb-0 mt-3">
          <button onClick={() => setShowDuplicates(!showDuplicates)}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl px-5 py-3 flex justify-between items-center transition-all">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div className="text-left">
                <p className="font-black text-sm uppercase tracking-tight">Duplicate Attempts Detected</p>
                <p className="text-rose-200 text-[10px] font-bold">{duplicateInfo.length} জন student একাধিকবার submit করেছে</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full">
                {showDuplicates ? 'লুকাও ▲' : 'দেখো ▼'}
              </span>
            </div>
          </button>

          {showDuplicates && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl mt-2 overflow-hidden">
              <div className="flex justify-between items-center px-5 py-3 border-b border-rose-100">
                <p className="text-xs font-black text-rose-600 uppercase">Duplicate List</p>
                <button onClick={cleanAllDuplicates}
                  className="text-[10px] font-black bg-rose-500 text-white px-4 py-1.5 rounded-xl hover:bg-rose-700 transition-all active:scale-95">
                  🧹 সব Duplicate Delete করো
                </button>
              </div>
              <div className="divide-y divide-rose-100 max-h-64 overflow-y-auto">
                {duplicateInfo.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-black text-slate-700 text-sm">{d.studentName}</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        Quiz: <span className="text-slate-600">{d.quizTitle}</span> · Code: <span className="text-indigo-500">{d.quizCode}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                        {d.count}x submit
                      </span>
                      <button onClick={() => cleanDuplicates(d.quizId)}
                        className="text-[10px] font-black bg-rose-500 text-white px-3 py-1 rounded-lg hover:bg-rose-700 transition-all">
                        Fix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Security Alert ════════════════════════════════════ */}
      {securityAlerts.length > 0 && (
        <div className="mx-8 mb-0 mt-3">
          <button onClick={() => setShowAlerts(!showAlerts)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-5 py-3 flex justify-between items-center transition-all">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔐</span>
              <div className="text-left">
                <p className="font-black text-sm uppercase tracking-tight">Suspicious Login Detected</p>
                <p className="text-amber-100 text-[10px] font-bold">{securityAlerts.length}টা teacher account শেয়ার হতে পারে</p>
              </div>
            </div>
            <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full">
              {showAlerts ? 'লুকাও ▲' : 'দেখো ▼'}
            </span>
          </button>

          {showAlerts && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl mt-2 overflow-hidden">
              <div className="flex justify-between items-center px-5 py-3 border-b border-amber-100">
                <p className="text-xs font-black text-amber-700 uppercase">Duplicate Login Alerts</p>
                <button
                  onClick={async () => {
                    for (const a of securityAlerts) {
                      await updateDoc(doc(db, 'securityAlerts', a.id), { resolved: true });
                    }
                  }}
                  className="text-[10px] font-black bg-amber-500 text-white px-4 py-1.5 rounded-xl hover:bg-amber-700 transition-all">
                  ✅ সব Dismiss করো
                </button>
              </div>
              <div className="divide-y divide-amber-100 max-h-72 overflow-y-auto">
                {securityAlerts.map((alert) => (
                  <div key={alert.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">👤 {alert.teacherName}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          আগের login: <span className="font-bold text-amber-600">{alert.prevLoginAt ? new Date(alert.prevLoginAt).toLocaleString('bn-BD') : '—'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          নতুন device: <span className="font-mono text-[10px] text-slate-600 break-all">{alert.newDevice?.substring(0, 60)}...</span>
                        </p>
                        <p className="text-[11px] text-amber-700 font-bold mt-1">
                          ⚠️ একই account এ দুটো ভিন্ন জায়গা থেকে login হয়েছে
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            // Teacher এর session token clear করো → force logout
                            await updateDoc(doc(db, 'teachers', alert.teacherId), {
                              sessionToken: null,
                              lastLoginAt: null,
                            });
                            await updateDoc(doc(db, 'securityAlerts', alert.id), { resolved: true });
                          }}
                          className="text-[10px] font-black bg-rose-500 text-white px-3 py-1.5 rounded-xl hover:bg-rose-700 transition-all whitespace-nowrap">
                          🚫 Force Logout
                        </button>
                        <button
                          onClick={async () => {
                            await updateDoc(doc(db, 'securityAlerts', alert.id), { resolved: true });
                          }}
                          className="text-[10px] font-black bg-slate-200 text-slate-600 px-3 py-1.5 rounded-xl hover:bg-slate-300 transition-all">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Header ══════════════════════════════════════════ */}
      <div className="px-8 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-white sticky top-0 z-10 shrink-0 gap-3">
        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          Viewing: <span className="text-indigo-600">{activeTab}</span>
        </h4>
        <div className="flex items-center gap-2">
          {/* ✅ Student search */}
          {(activeTab === 'REGISTRY' || activeTab === 'STUDENT') && (
            <input
              type="text"
              placeholder="🔍 Student খুঁজুন..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-300 w-40"
            />
          )}
          {/* ✅ Create Student button */}
          {activeTab === 'REGISTRY' && (
            <button
              onClick={() => setShowCreateStudent(true)}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
            >
              + নতুন Student
            </button>
          )}
          <div className="text-[10px] font-black bg-slate-100 px-4 py-1.5 rounded-full text-slate-500 uppercase">
            Records: {currentData.length}
          </div>
        </div>
      </div>

      {/* ══ List ════════════════════════════════════════════ */}
      <div className="overflow-y-auto p-6 md:p-8 space-y-3 bg-slate-50/30 custom-scrollbar max-h-[700px]">

        {/* TEACHERS */}
        {(activeTab === 'TEACHERS' || activeTab === 'REGISTRY') && liveTeachers.map(tchr => (
          <div key={tchr.id}
            className={`p-5 rounded-[24px] border bg-white flex flex-col md:flex-row justify-between items-center gap-4 transition-all shadow-sm ${
              tchr.isFrozen ? 'border-rose-200 bg-rose-50/20' : 'border-slate-100 hover:border-indigo-300 hover:shadow-md'
            }`}>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${tchr.isFrozen ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {tchr.name?.[0] || 'T'}
              </div>
              <div>
                <div className="font-black text-slate-800 flex flex-wrap items-center gap-1.5 text-sm">
                  {tchr.name}
                  <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">TEACHER</span>
                  {tchr.isFrozen && <span className="text-[8px] bg-rose-500 text-white px-2 py-0.5 rounded-full">FROZEN</span>}
                </div>
                <div className="text-[10px] font-bold text-slate-400">{tchr.email}</div>
                <div className="text-[9px] font-bold text-slate-300 mt-0.5">
                  {tchr.allowedClasses?.length || 0} classes · PIN: <span className="text-indigo-400 font-black">{tchr.pin || '—'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button onClick={() => store.setImpersonatedUser({ ...tchr, role: 'teacher' })}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-700 transition-all active:scale-95 shadow-sm">
                Login Direct
              </button>
              <button onClick={() => updateTeacher(tchr.id, { isFrozen: !tchr.isFrozen })}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${tchr.isFrozen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white'}`}>
                {tchr.isFrozen ? 'Unfreeze' : 'Freeze'}
              </button>
              <button onClick={() => { if (window.confirm(`Delete ${tchr.name}?`)) deleteTeacher(tchr.id); }}
                className="bg-rose-50 text-rose-500 px-4 py-2.5 rounded-xl font-black text-[10px] hover:bg-rose-500 hover:text-white transition-all">
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* STUDENTS (STUDENT tab — ranked) */}
        {activeTab === 'STUDENT' && filteredSortedStudents.map((user, index) => (
          <StudentCard key={user.id} user={user} index={index} showRank={true} />
        ))}

        {/* STUDENTS (REGISTRY tab) */}
        {activeTab === 'REGISTRY' && filteredStudents.map((user, index) => (
          <StudentCard key={`s-${user.id}`} user={user} index={index} showRank={false} />
        ))}

        {currentData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 opacity-30">
            <div className="text-6xl mb-4 grayscale">📊</div>
            <p className="font-black uppercase tracking-[0.4em] text-[10px]">No Data Available</p>
          </div>
        )}
      </div>
      {/* ══ Detail Modal ════════════════════════════════════ */}
      {detailModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter">
                  {detailModal === 'students'  && '👥 All Students'}
                  {detailModal === 'teachers'  && '👨‍🏫 All Teachers'}
                  {detailModal === 'quizzes'   && '📝 Quiz Attempts'}
                  {detailModal === 'questions' && '❓ Question Bank'}
                  {detailModal === 'classes'   && '🏫 All Classes'}
                  {detailModal === 'week'      && '📅 This Week Details'}
                  {detailModal === 'month'     && '📆 This Month Details'}
                  {detailModal === 'growth'    && '📈 14-Day Growth Report'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time data</p>
              </div>
              <button onClick={() => setDetailModal(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center font-black text-slate-400 transition-all">✕</button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-3 flex-1">

              {/* TEACHERS detail */}
              {detailModal === 'teachers' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: 'Total', v: liveTeachers.length, c: 'bg-violet-50 text-violet-600' },
                      { l: 'Active', v: liveTeachers.filter(t => !t.isFrozen).length, c: 'bg-emerald-50 text-emerald-600' },
                      { l: 'Frozen', v: liveTeachers.filter(t => t.isFrozen).length, c: 'bg-rose-50 text-rose-600' },
                    ].map(s => (
                      <div key={s.l} className={`${s.c} rounded-2xl p-3 text-center`}>
                        <div className="text-[9px] font-black uppercase mb-1">{s.l}</div>
                        <div className="text-2xl font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {liveTeachers.map(t => {
                    const daysLeft = Math.ceil((new Date(t.expiryDate || '').getTime() - Date.now()) / 86400000);
                    const expired = daysLeft <= 0;
                    return (
                      <div key={t.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${t.isFrozen ? 'bg-rose-50 border-rose-100' : expired ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${t.isFrozen ? 'bg-rose-100 text-rose-600' : 'bg-violet-100 text-violet-600'}`}>
                          {t.name?.[0] || 'T'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-sm truncate">{t.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold truncate">{t.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-[9px] font-black ${expired ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {expired ? 'Expired' : `${daysLeft}d left`}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold">{t.allowedClasses?.length || 0} classes</p>
                        </div>
                      </div>
                    );
                  })}
                  {liveTeachers.length === 0 && (
                    <p className="text-center text-slate-300 font-bold py-8">No teachers registered</p>
                  )}
                </>
              )}

              {/* STUDENTS detail */}
              {detailModal === 'students' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: 'Total', v: liveStudents.length, c: 'bg-indigo-50 text-indigo-600' },
                      { l: 'Total Points', v: totalGlobalPoints.toFixed(0), c: 'bg-emerald-50 text-emerald-600' },
                      { l: 'Avg Points', v: liveStudents.length > 0 ? (totalGlobalPoints / liveStudents.length).toFixed(1) : '0', c: 'bg-amber-50 text-amber-600' },
                    ].map(s => (
                      <div key={s.l} className={`${s.c} rounded-2xl p-3 text-center`}>
                        <div className="text-[9px] font-black uppercase mb-1">{s.l}</div>
                        <div className="text-2xl font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {[...liveStudents]
                    .sort((a, b) => (studentStats[b.name]?.points || 0) - (studentStats[a.name]?.points || 0))
                    .map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">{s.name?.[0]}</div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">{s.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{s.isFrozen ? '🔒 Blocked' : '✅ Active'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-600">{(studentStats[s.name]?.points || 0).toFixed(1)} pts</p>
                        <p className="text-[9px] text-slate-400 font-bold">{studentStats[s.name]?.quizCount || 0} quizzes</p>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* QUIZZES detail */}
              {detailModal === 'quizzes' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: 'Total Quizzes', v: liveQuizzes.length, c: 'bg-indigo-50 text-indigo-600' },
                      { l: 'Total Attempts', v: totalGlobalQuizzes, c: 'bg-emerald-50 text-emerald-600' },
                      { l: 'Total Points Given', v: totalGlobalPoints.toFixed(0), c: 'bg-amber-50 text-amber-600' },
                    ].map(s => (
                      <div key={s.l} className={`${s.c} rounded-2xl p-3 text-center`}>
                        <div className="text-[9px] font-black uppercase mb-1">{s.l}</div>
                        <div className="text-2xl font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {[...liveQuizzes].sort((a, b) => (b.attempts?.length || 0) - (a.attempts?.length || 0)).map(q => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-slate-800 text-sm">{q.title || 'Untitled Quiz'}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5">Code: {q.code} · {q.totalMarks || 0} marks</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-indigo-600 text-sm">{q.attempts?.length || 0} attempts</p>
                          <p className="text-[9px] text-slate-400 font-bold">{q.className || ''}</p>
                        </div>
                      </div>
                      {(q.attempts || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(q.attempts || []).map((att: any, i: number) => (
                            <span key={i} className="text-[9px] bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-600">
                              {att.studentName}: {att.score}/{att.totalMarks}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* QUESTIONS detail */}
              {detailModal === 'questions' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: 'Total Questions', v: liveQuestions.length, c: 'bg-indigo-50 text-indigo-600' },
                      { l: 'Classes Covered', v: [...new Set(liveQuestions.map((q: any) => q.classId))].length, c: 'bg-emerald-50 text-emerald-600' },
                      { l: 'Subjects Covered', v: [...new Set(liveQuestions.map((q: any) => q.subjectId))].length, c: 'bg-amber-50 text-amber-600' },
                    ].map(s => (
                      <div key={s.l} className={`${s.c} rounded-2xl p-3 text-center`}>
                        <div className="text-[9px] font-black uppercase mb-1">{s.l}</div>
                        <div className="text-2xl font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Group by class */}
                  {liveClasses.map(cls => {
                    const cqs = liveQuestions.filter((q: any) => q.classId === cls.id);
                    if (cqs.length === 0) return null;
                    return (
                      <div key={cls.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center">
                          <p className="font-black text-slate-800">{cls.name}</p>
                          <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{cqs.length} questions</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {[...new Set(cqs.map((q: any) => q.type))].map((t: any) => (
                            <span key={t} className="text-[9px] bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-500">{t}: {cqs.filter((q: any) => q.type === t).length}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* CLASSES detail */}
              {detailModal === 'classes' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: 'Total Classes', v: liveClasses.length, c: 'bg-indigo-50 text-indigo-600' },
                      { l: 'Total Subjects', v: liveSubjects.length, c: 'bg-emerald-50 text-emerald-600' },
                      { l: 'Total Chapters', v: liveChapters.length, c: 'bg-amber-50 text-amber-600' },
                    ].map(s => (
                      <div key={s.l} className={`${s.c} rounded-2xl p-3 text-center`}>
                        <div className="text-[9px] font-black uppercase mb-1">{s.l}</div>
                        <div className="text-2xl font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {liveClasses.map(cls => {
                    const subs = liveSubjects.filter(s => s.classId === cls.id);
                    const chaps = liveChapters.filter(c => subs.some(s => s.id === c.subjectId));
                    const qs = liveQuestions.filter((q: any) => q.classId === cls.id);
                    return (
                      <div key={cls.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-black text-slate-800">{cls.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg px-2 py-0.5 font-black">{subs.length} subjects</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 rounded-lg px-2 py-0.5 font-black">{chaps.length} chapters</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg px-2 py-0.5 font-black">{qs.length} questions</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* WEEK detail */}
              {detailModal === 'week' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: 'Quizzes Created', v: reportStats.wQ, c: 'bg-emerald-50 text-emerald-600' },
                      { l: 'Total Attempts', v: reportStats.wA, c: 'bg-indigo-50 text-indigo-600' },
                      { l: 'Points Earned', v: reportStats.wP.toFixed(0), c: 'bg-amber-50 text-amber-600' },
                    ].map(s => (
                      <div key={s.l} className={`${s.c} rounded-2xl p-3 text-center`}>
                        <div className="text-[9px] font-black uppercase mb-1">{s.l}</div>
                        <div className="text-2xl font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Quizzes this week:</p>
                  {(() => {
                    const now = new Date(); const week = new Date(now); week.setDate(now.getDate() - 7);
                    return liveQuizzes.filter(q => {
                      const raw = q.createdAt;
                      const d = raw?.toDate?.() ?? (raw?.seconds ? new Date(raw.seconds * 1000) : new Date(raw || 0));
                      return d >= week;
                    }).map(q => (
                      <div key={q.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                        <div>
                          <p className="font-black text-slate-800 text-sm">{q.title || 'Untitled'}</p>
                          <p className="text-[9px] text-slate-400 font-bold">Code: {q.code}</p>
                        </div>
                        <span className="font-black text-indigo-600 text-sm">{q.attempts?.length || 0} attempts</span>
                      </div>
                    ));
                  })()}
                </>
              )}

              {/* MONTH detail */}
              {detailModal === 'growth' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { l: '14-Day Quizzes',  v: growthData.reduce((a,d) => a+d.quizzes,  0), c: 'bg-indigo-50 text-indigo-600' },
                      { l: '14-Day Attempts', v: growthData.reduce((a,d) => a+d.attempts, 0), c: 'bg-emerald-50 text-emerald-600' },
                      { l: '14-Day Points',   v: growthData.reduce((a,d) => a+d.points,   0).toFixed(0), c: 'bg-amber-50 text-amber-600' },
                    ].map(s => (
                      <div key={s.l} className={`${s.c} rounded-2xl p-3 text-center`}>
                        <div className="text-[9px] font-black uppercase mb-1">{s.l}</div>
                        <div className="text-2xl font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Full bar chart — Attempts */}
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Daily Attempts (last 14 days)</p>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    {(() => {
                      const maxA = Math.max(...growthData.map(d => d.attempts), 1);
                      return (
                        <div className="flex items-end gap-1 h-28">
                          {growthData.map((d, i) => {
                            const h = Math.max(4, Math.round((d.attempts / maxA) * 112));
                            const isToday = i === 13;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                <div className="relative">
                                  {d.attempts > 0 && (
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">{d.attempts}</span>
                                  )}
                                </div>
                                <div style={{ height: `${h}px` }}
                                  className={`w-full rounded-t-md transition-all ${isToday ? 'bg-emerald-500' : d.attempts > 0 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <div className="flex justify-between mt-2">
                      {growthData.filter((_, i) => i % 2 === 0).map(d => (
                        <span key={d.label} className="text-[7px] text-slate-400 font-bold">{d.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* Points trend */}
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-4 mb-2">Daily Points Earned</p>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    {(() => {
                      const maxP = Math.max(...growthData.map(d => d.points), 1);
                      return (
                        <div className="flex items-end gap-1 h-20">
                          {growthData.map((d, i) => {
                            const h = Math.max(d.points > 0 ? 4 : 0, Math.round((d.points / maxP) * 80));
                            const isToday = i === 13;
                            return (
                              <div key={i} style={{ height: `${h}px` }}
                                className={`flex-1 rounded-t-md transition-all ${isToday ? 'bg-amber-400' : d.points > 0 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            );
                          })}
                        </div>
                      );
                    })()}
                    <div className="flex justify-between mt-2">
                      {growthData.filter((_, i) => i % 2 === 0).map(d => (
                        <span key={d.label} className="text-[7px] text-slate-400 font-bold">{d.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* Per-day breakdown table */}
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-4 mb-2">Day-by-Day Breakdown</p>
                  <div className="space-y-1.5">
                    {[...growthData].reverse().filter(d => d.attempts > 0 || d.quizzes > 0).map(d => (
                      <div key={d.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-500 w-20 shrink-0">{d.label}</span>
                        <div className="flex-1 flex gap-2">
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black">{d.quizzes} quiz</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black">{d.attempts} attempts</span>
                          <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-black">{d.points.toFixed(1)} pts</span>
                        </div>
                      </div>
                    ))}
                    {growthData.every(d => d.attempts === 0) && (
                      <p className="text-center text-slate-300 font-bold py-6">No activity in last 14 days</p>
                    )}
                  </div>
                </>
              )}

              {detailModal === 'month' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: 'Quizzes Created', v: reportStats.mQ, c: 'bg-indigo-50 text-indigo-600' },
                      { l: 'Total Attempts', v: reportStats.mA, c: 'bg-emerald-50 text-emerald-600' },
                      { l: 'Points Earned', v: reportStats.mP.toFixed(0), c: 'bg-amber-50 text-amber-600' },
                    ].map(s => (
                      <div key={s.l} className={`${s.c} rounded-2xl p-3 text-center`}>
                        <div className="text-[9px] font-black uppercase mb-1">{s.l}</div>
                        <div className="text-2xl font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Top students this month:</p>
                  {(() => {
                    const now = new Date(); const month = new Date(now); month.setDate(now.getDate() - 30);
                    const mPts: Record<string, number> = {};
                    liveQuizzes.forEach(q => {
                      (q.attempts || []).forEach((att: any) => {
                        const sub = att.submittedAt ? new Date(att.submittedAt) : null;
                        if (!sub || sub < month) return;
                        const pts = att.earnedPoints !== undefined
                          ? Number(att.earnedPoints)
                          : Math.max(0, (Number(att.score)||0) - ((Number(att.totalMarks)||0) - (Number(att.score)||0)) * 0.5);
                        mPts[att.studentName] = (mPts[att.studentName] || 0) + pts;
                      });
                    });
                    return Object.entries(mPts).sort(([,a],[,b]) => b-a).map(([name, pts], i) => (
                      <div key={name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-[9px] font-black">{i+1}</div>
                        <p className="flex-1 font-black text-slate-800">{name}</p>
                        <p className="font-black text-indigo-600">{pts.toFixed(1)} pts</p>
                      </div>
                    ));
                  })()}
                </>
              )}

            </div>
          </div>
        </div>
      )}
      {/* ✅ Create Student Modal */}
      {showCreateStudent && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-['Hind_Siliguri']">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-slate-800 text-xl">👤 নতুন Student</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin দ্বারা Account তৈরি</p>
              </div>
              <button onClick={() => { setShowCreateStudent(false); setNewStudentName(''); setNewStudentPass(''); }}
                className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Student এর নাম</label>
                <input
                  type="text"
                  placeholder="পুরো নাম লিখুন"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all placeholder:text-slate-300"
                  onKeyDown={e => e.key === 'Enter' && handleCreateStudent()}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">পাসওয়ার্ড</label>
                <input
                  type="text"
                  placeholder="কমপক্ষে ৪ অক্ষর"
                  value={newStudentPass}
                  onChange={e => setNewStudentPass(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all placeholder:text-slate-300"
                  onKeyDown={e => e.key === 'Enter' && handleCreateStudent()}
                />
                <p className="text-[9px] font-bold text-slate-400 mt-1 ml-1">⚠️ Student কে এই পাসওয়ার্ড জানাতে হবে</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateStudent(false); setNewStudentName(''); setNewStudentPass(''); }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">
                বাতিল
              </button>
              <button
                onClick={handleCreateStudent}
                disabled={isCreating || !newStudentName.trim() || !newStudentPass.trim()}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-100">
                {isCreating ? '⏳ তৈরি হচ্ছে...' : '✅ Account তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MasterRegistry;

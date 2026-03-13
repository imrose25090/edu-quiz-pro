import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { StudentTranscriptModal } from '../teacher/StudentTranscriptModal';

// ═══════════════════════════════════════════════════
// INLINE GAME COMPONENTS (unchanged)
// ═══════════════════════════════════════════════════

const SpinWheelGameInline: React.FC = () => {
  const topics = ['গণিত', 'বিজ্ঞান', 'ইংরেজি', 'সাধারণ জ্ঞান', 'বাংলা', 'ইতিহাস'];
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState('');
  const [spunCount, setSpunCount] = useState(0);

  const spin = () => {
    if (spinning) return;
    setSpinning(true); setResult('');
    const extra = 1440 + Math.floor(Math.random() * 360);
    const newRot = rotation + extra;
    setRotation(newRot);
    setTimeout(() => {
      const idx = Math.floor(((360 - (newRot % 360)) / 360) * topics.length) % topics.length;
      setResult(topics[idx]); setSpinning(false); setSpunCount(p => p + 1);
    }, 3000);
  };

  const seg = 360 / topics.length;
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="relative w-52 h-52">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-2xl">▼</div>
        <svg width="208" height="208" viewBox="0 0 208 208"
          style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}>
          {topics.map((t, i) => {
            const start = (i * seg - 90) * Math.PI / 180;
            const end   = ((i + 1) * seg - 90) * Math.PI / 180;
            const x1 = 104 + 100 * Math.cos(start); const y1 = 104 + 100 * Math.sin(start);
            const x2 = 104 + 100 * Math.cos(end);   const y2 = 104 + 100 * Math.sin(end);
            const mx = 104 + 65 * Math.cos((start+end)/2); const my = 104 + 65 * Math.sin((start+end)/2);
            return (
              <g key={i}>
                <path d={`M104,104 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`} fill={colors[i]} stroke="white" strokeWidth="2" />
                <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold" fill="white"
                  transform={`rotate(${i * seg + seg/2}, ${mx}, ${my})`}>{t}</text>
              </g>
            );
          })}
          <circle cx="104" cy="104" r="12" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
        </svg>
      </div>
      {result && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-6 py-3 text-center">
          <p className="text-xs font-black text-indigo-400 uppercase">বিষয় পেয়েছ!</p>
          <p className="text-2xl font-black text-indigo-700 mt-0.5">{result}</p>
        </div>
      )}
      <button onClick={spin} disabled={spinning}
        className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl text-sm uppercase tracking-wider hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200">
        {spinning ? '⏳ ঘুরছে...' : spunCount === 0 ? '🎡 Spin করো!' : '🔄 আবার Spin'}
      </button>
      {spunCount > 0 && <p className="text-xs font-bold text-slate-400">মোট {spunCount} বার spin করেছ</p>}
    </div>
  );
};

const MemoryGameInline: React.FC = () => {
  const baseCards = [
    { id: 'a', text: '2+2', pair: 'p1' }, { id: 'b', text: '4', pair: 'p1' },
    { id: 'c', text: 'ঢাকা', pair: 'p2' }, { id: 'd', text: 'বাংলাদেশের রাজধানী', pair: 'p2' },
    { id: 'e', text: 'H₂O', pair: 'p3' }, { id: 'f', text: 'পানির সূত্র', pair: 'p3' },
    { id: 'g', text: '৭ × ৮', pair: 'p4' }, { id: 'h', text: '৫৬', pair: 'p4' },
  ];
  const [cards] = useState(() => [...baseCards].sort(() => Math.random() - 0.5));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);

  const flip = (id: string) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id)) return;
    const newF = [...flipped, id];
    setFlipped(newF);
    if (newF.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newF.map(i => cards.find(c => c.id === i)!);
      if (a.pair === b.pair) { setMatched(m => [...m, a.id, b.id]); setFlipped([]); }
      else { setTimeout(() => setFlipped([]), 900); }
    }
  };

  const won = matched.length === cards.length;
  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-black text-slate-400 uppercase">চেষ্টা: {moves}</p>
        <p className="text-xs font-black text-emerald-600">{matched.length/2}/{cards.length/2} জুটি</p>
      </div>
      {won && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 text-center mb-4">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-black text-emerald-700">অভিনন্দন! {moves} চেষ্টায় জিতেছ!</p>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {cards.map(c => {
          const isFlipped = flipped.includes(c.id) || matched.includes(c.id);
          const isMatched = matched.includes(c.id);
          return (
            <button key={c.id} onClick={() => flip(c.id)}
              className={`h-16 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                isMatched ? 'bg-emerald-100 border-2 border-emerald-300 text-emerald-700' :
                isFlipped  ? 'bg-indigo-100 border-2 border-indigo-300 text-indigo-700' :
                'bg-slate-100 border-2 border-slate-200 text-slate-400 hover:border-indigo-300'
              }`}>
              {isFlipped ? c.text : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const QuizBattleInline: React.FC = () => {
  const questions = [
    { q: '৫ × ৫ = ?', opts: ['২০','২৫','৩০','১৫'], ans: '২৫' },
    { q: 'বাংলাদেশের স্বাধীনতা দিবস কত তারিখ?', opts: ['১৬ ডিসেম্বর','২৬ মার্চ','৭ মার্চ','১৫ আগস্ট'], ans: '২৬ মার্চ' },
    { q: 'পানির রাসায়নিক সূত্র কী?', opts: ['CO₂','O₂','H₂O','NaCl'], ans: 'H₂O' },
    { q: '১২ × ৭ = ?', opts: ['৮৪','৭৮','৯১','৭৬'], ans: '৮৪' },
    { q: 'সূর্য কোন দিকে ওঠে?', opts: ['পশ্চিম','দক্ষিণ','পূর্ব','উত্তর'], ans: 'পূর্ব' },
  ];
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const answer = (opt: string) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === questions[qi].ans) setScore(s => s + 1);
    setTimeout(() => {
      if (qi + 1 >= questions.length) setDone(true);
      else { setQi(q => q + 1); setChosen(null); }
    }, 800);
  };
  const restart = () => { setQi(0); setScore(0); setChosen(null); setDone(false); };
  const q = questions[qi];

  if (done) return (
    <div className="text-center py-6">
      <div className="text-5xl mb-3">{score >= 4 ? '🏆' : score >= 2 ? '👍' : '💪'}</div>
      <p className="font-black text-slate-800 text-xl">{score}/{questions.length} সঠিক</p>
      <p className="text-sm font-bold text-slate-400 mt-1">{score >= 4 ? 'অসাধারণ!' : score >= 2 ? 'ভালো চেষ্টা!' : 'আরও অনুশীলন করো!'}</p>
      <button onClick={restart} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-sm hover:bg-indigo-700 transition-all">আবার খেলো</button>
    </div>
  );

  return (
    <div className="py-2">
      <div className="flex justify-between mb-4">
        <span className="text-xs font-black text-slate-400">{qi+1}/{questions.length}</span>
        <span className="text-xs font-black text-indigo-600">স্কোর: {score}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-5">
        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width:`${((qi)/questions.length)*100}%`}}/>
      </div>
      <p className="font-black text-slate-800 text-base mb-5 leading-snug">{q.q}</p>
      <div className="grid grid-cols-2 gap-2">
        {q.opts.map(opt => (
          <button key={opt} onClick={() => answer(opt)}
            className={`p-3 rounded-xl font-bold text-sm text-left transition-all active:scale-95 ${
              !chosen ? 'bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 text-slate-700' :
              opt === q.ans ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-700' :
              opt === chosen ? 'bg-rose-100 border-2 border-rose-400 text-rose-700' :
              'bg-slate-50 border-2 border-slate-200 text-slate-400 opacity-50'
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

const PuzzleGameInline: React.FC = () => {
  const [pieces, setPieces] = useState(0);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState<string|null>(null);
  const [done, setDone] = useState(false);
  const puzzleQs = [
    { q: 'আমি সংখ্যা, জোড় ও মৌলিক, আমি কে?', opts: ['২','৪','৬','৮'], ans: '২' },
    { q: 'আমি ছাড়া পানি তৈরি হয় না, আমি কোন গ্যাস?', opts: ['N₂','O₂','H₂','CO₂'], ans: 'H₂' },
    { q: 'সূর্য থেকে পৃথিবী কত নম্বর গ্রহ?', opts: ['১ম','২য়','৩য়','৪র্থ'], ans: '৩য়' },
    { q: 'বাংলাদেশের মুক্তিযুদ্ধ কত সালে?', opts: ['১৯৫২','১৯৬৯','১৯৭১','১৯৭৫'], ans: '১৯৭১' },
  ];
  const answerQ = (opt: string) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === puzzleQs[qi].ans) setPieces(p => p + 1);
    setTimeout(() => {
      if (qi + 1 >= puzzleQs.length) setDone(true);
      else { setQi(q => q + 1); setChosen(null); }
    }, 800);
  };
  const restart = () => { setPieces(0); setQi(0); setChosen(null); setDone(false); };
  const pieceFills = ['🟦','🟩','🟨','🟥'];

  if (done) return (
    <div className="text-center py-6">
      <div className="text-5xl mb-3">{pieces === 4 ? '🧩✅' : '🧩'}</div>
      <p className="font-black text-slate-800 text-lg">{pieces}/4 টুকরো সংগ্রহ!</p>
      {pieces === 4 && <p className="text-emerald-600 font-black mt-1">🎉 Puzzle সম্পূর্ণ!</p>}
      <button onClick={restart} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-sm hover:bg-indigo-700 transition-all">আবার খেলো</button>
    </div>
  );

  return (
    <div className="py-2">
      <div className="flex justify-center gap-2 mb-5">
        {[0,1,2,3].map(i => <span key={i} className="text-3xl transition-all">{i < pieces ? pieceFills[i] : '⬜'}</span>)}
      </div>
      <p className="text-xs font-black text-slate-400 text-center mb-4">সঠিক উত্তর দিলে puzzle টুকরো পাবে</p>
      <p className="font-black text-slate-800 text-base mb-4 leading-snug">{puzzleQs[qi].q}</p>
      <div className="grid grid-cols-2 gap-2">
        {puzzleQs[qi].opts.map(opt => (
          <button key={opt} onClick={() => answerQ(opt)}
            className={`p-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
              !chosen ? 'bg-slate-50 border-2 border-slate-200 hover:border-purple-400 text-slate-700' :
              opt === puzzleQs[qi].ans ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-700' :
              opt === chosen ? 'bg-rose-100 border-2 border-rose-400 text-rose-700' :
              'bg-slate-50 border-2 border-slate-200 opacity-40 text-slate-400'
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════

interface StudentLoginProps {
  quizCode: string;
  setQuizCode: (val: string) => void;
  studentName: string;
  setStudentName: (val: string) => void;
  onStart: () => void;
  onBack: () => void;
  students: any[];
  onRegister?: (name: string, pass: string) => void;      // optional — admin impersonation এ নেই
  onStudentLogin?: (name: string, pass: string) => boolean | Promise<boolean>; // optional — admin impersonation এ নেই
  isAlreadyAuth?: boolean;
}

const BADGES = [
  { id: 'q1',    icon: '🎯', label: 'প্রথম পদক্ষেপ', req: (_p: number, q: number) => q >= 1   },
  { id: 'q3',    icon: '📝', label: 'চিন্তাবিদ',     req: (_p: number, q: number) => q >= 3   },
  { id: 'q5',    icon: '🚀', label: 'অন্বেষক',       req: (_p: number, q: number) => q >= 5   },
  { id: 'q10',   icon: '🏆', label: 'অর্জনকারী',     req: (_p: number, q: number) => q >= 10  },
  { id: 'q20',   icon: '🎓', label: 'বিদ্বান',       req: (_p: number, q: number) => q >= 20  },
  { id: 'p5',    icon: '🌱', label: 'চারা',           req: (p: number) => p >= 5               },
  { id: 'p15',   icon: '⭐', label: 'উজ্জ্বল তারা',  req: (p: number) => p >= 15              },
  { id: 'p30',   icon: '🔥', label: 'দারুণ গতি',     req: (p: number) => p >= 30              },
  { id: 'p100',  icon: '🏅', label: 'শতক',           req: (p: number) => p >= 100             },
  { id: 'p250',  icon: '🥈', label: 'রুপা',          req: (p: number) => p >= 250             },
  { id: 'p500',  icon: '🥇', label: 'সোনা',          req: (p: number) => p >= 500             },
  { id: 'p1000', icon: '👑', label: 'কিংবদন্তি',     req: (p: number) => p >= 1000            },
];

const getMedal = (pts: number) => {
  if (pts >= 1000) return { icon: '👑', label: 'Legend League'  };
  if (pts >= 500)  return { icon: '🥇', label: 'Gold League'    };
  if (pts >= 250)  return { icon: '🥈', label: 'Silver League'  };
  if (pts >= 100)  return { icon: '🏅', label: 'Bronze League'  };
  return               { icon: '🎯', label: 'Starter League' };
};

const rankIcon = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export const StudentLogin: React.FC<StudentLoginProps> = ({
  quizCode, setQuizCode,
  studentName, setStudentName,
  onStart, onBack,
  students, onRegister, onStudentLogin,
  isAlreadyAuth = false,
}) => {
  const [isNewUser,  setIsNewUser]  = useState(false);
  const [password,   setPassword]   = useState('');

  // ✅ FIX: isAdminView শুধু admin impersonation এ true (onStudentLogin নেই)
  const isAdminView = !onStudentLogin;

  // ✅ FIX: isAlreadyAuth state নেই — StudentPanel এর isAlreadyAuth prop ই সত্য
  // Login হলে StudentPanel setIsAuth(true) করবে → isAlreadyAuth=true আসবে → re-render হবে

  const [totalPoints, setTotalPoints] = useState(0);
  const [globalRank,  setGlobalRank]  = useState(0);
  const [history,     setHistory]     = useState<any[]>([]);
  const [showGameModal, setShowGameModal] = useState(false);
  const [activeGame,    setActiveGame]    = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<{ name: string; pts: number }[]>([]);

  const [showHistory, setShowHistory] = useState(false);
  const [showBoard,   setShowBoard]   = useState(false);
  const [showBadges,  setShowBadges]  = useState(false);

  const [viewingQuiz,    setViewingQuiz]    = useState<any | null>(null);
  const [viewingAttempt, setViewingAttempt] = useState<any | null>(null);

  // ── Auth ──────────────────────────────────────────────────
  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = studentName.trim();
    const pass = password.trim();

    if (isNewUser) {
      // ✅ FIX 2: onRegister optional check
      if (!onRegister) return;
      if (localStorage.getItem('eduquiz_student_registered')) {
        alert('এই ডিভাইসে অলরেডি অ্যাকাউন্ট আছে।');
        setIsNewUser(false); return;
      }
      if (!name || !pass) { alert('নাম ও পাসওয়ার্ড দিন।'); return; }
      if (students.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert('এই নামে অলরেডি অ্যাকাউন্ট আছে!');
        setIsNewUser(false); return;
      }
      onRegister(name, pass);
      localStorage.setItem('eduquiz_student_registered', 'true');
      localStorage.setItem('registered_student_name', name);
      alert('অ্যাকাউন্ট তৈরি হয়েছে! লগইন করুন।');
      setIsNewUser(false); setPassword('');
    } else {
      // ✅ FIX 2: onStudentLogin optional check
      if (!onStudentLogin) return;
      const ok = await onStudentLogin(name, pass);
      if (!ok) {
        alert('ভুল নাম অথবা পাসওয়ার্ড!');
      }
      // ✅ success হলে StudentPanel isAuth set করবে → isAlreadyAuth=true prop আসবে → re-render
    }
  };

  // ── Live data ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAlreadyAuth || !studentName) return;
    // ✅ subcollection থেকে attempts load করো
    const unsub = onSnapshot(query(collection(db, 'quizzes')), async (snap) => {
      const ptsMap: Record<string, number> = {};
      const myHist: any[] = [];

      await Promise.all(snap.docs.map(async (d) => {
        const quiz = { id: d.id, ...d.data() } as any;
        const attSnap = await getDocs(collection(db, 'quizzes', d.id, 'attempts'));
        const attempts = attSnap.docs.map(a => ({ id: a.id, ...a.data() }));

        attempts.forEach((att: any) => {
          const c   = Number(att.score) || 0;
          const tot = Number(att.totalMarks) || 0;
          const w   = Number(att.wrongAnswers ?? (tot - c)) || 0;
          const pts = att.earnedPoints !== undefined
            ? Number(att.earnedPoints)
            : Math.max(0, c - w * 0.5);
          ptsMap[att.studentName] = (ptsMap[att.studentName] || 0) + pts;
          if (att.studentName?.toLowerCase() === studentName.toLowerCase()) {
            myHist.push({
              fullQuizData: quiz, myAttemptData: att,
              quizTitle: quiz.title, quizCode: quiz.code,
              score: c, totalMarks: tot, pts,
              date: att.submittedAt,
            });
          }
        });
      }));

      const sorted = Object.entries(ptsMap).sort(([, a], [, b]) => (b as number) - (a as number));
      const rank   = sorted.findIndex(([n]) => n.toLowerCase() === studentName.toLowerCase()) + 1;
      setTotalPoints(ptsMap[studentName] || 0);
      setGlobalRank(rank > 0 ? rank : sorted.length + 1);
      setAllStudents(sorted.map(([name, pts]) => ({ name, pts: pts as number })));
      setHistory(myHist.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    return () => unsub();
  }, [isAlreadyAuth, studentName]);

  const earnedBadges = BADGES.filter(b => b.req(totalPoints, history.length));
  const nextBadge    = BADGES.find(b => !b.req(totalPoints, history.length));
  const medal        = getMedal(totalPoints);

  // ════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════════
  if (!isAlreadyAuth) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-['Hind_Siliguri']">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100">
            <span className="text-white font-black text-2xl">E</span>
          </div>
          <h1 className="text-slate-800 font-black text-2xl">EduQuiz Pro</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">স্টুডেন্ট পোর্টাল</p>
        </div>

        <form onSubmit={handleAction} className="space-y-3">
          <input type="text" placeholder="তোমার পুরো নাম" required
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-800 text-lg font-bold outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300 text-center shadow-sm"
            value={studentName} onChange={e => setStudentName(e.target.value)} />
          <input type="password" placeholder="পাসওয়ার্ড" required
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-800 text-lg font-bold outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300 text-center shadow-sm"
            value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-md shadow-indigo-100 text-base active:scale-95">
            {isNewUser ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন →'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          {/* ✅ FIX 3: onRegister না থাকলে register option দেখাবে না (impersonation) */}
          {onRegister && (
            <button onClick={() => setIsNewUser(!isNewUser)}
              className="text-slate-400 hover:text-indigo-500 font-bold text-sm transition-colors">
              {isNewUser ? 'লগইন করব' : 'নতুন অ্যাকাউন্ট'}
            </button>
          )}
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button onClick={onBack}
          className="w-full text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors text-center">
          ← ফিরে যাও
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#F0F2F8] font-['Hind_Siliguri']">

      {/* Nav */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-5 py-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">{studentName[0]?.toUpperCase()}</span>
          </div>
          <p className="text-slate-800 font-black text-lg leading-none">{studentName}</p>
          {/* ✅ admin impersonation badge — শুধু real admin impersonation এ */}
          {isAdminView && (
            <span className="text-[9px] font-black bg-rose-100 text-rose-500 px-2 py-0.5 rounded-full uppercase">Admin View</span>
          )}
        </div>
        <button onClick={onBack}
          className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-rose-50">
          {isAdminView ? 'Admin এ ফিরুন' : 'লগআউট'}
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 pb-20 space-y-4">

        {/* Hero 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100">
            <span className="text-4xl mb-2">{medal.icon}</span>
            <p className="text-slate-800 font-black text-xl leading-tight">{studentName}</p>
            <p className="text-indigo-600 font-black text-xs uppercase tracking-wider mt-1">{medal.label}</p>
          </div>
          <div className="bg-indigo-600 rounded-3xl p-6 flex flex-col justify-center shadow-lg shadow-indigo-100">
            <p className="text-indigo-200 font-black text-xs uppercase tracking-widest mb-1">Total Points</p>
            <p className="text-white font-black text-5xl leading-none">{totalPoints.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 flex flex-col justify-center shadow-sm border border-slate-100">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Quizzes Done</p>
            <p className="text-slate-800 font-black text-5xl leading-none">{history.length}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 flex flex-col justify-center shadow-sm border border-slate-100">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Global Rank</p>
            <p className="text-indigo-600 font-black text-5xl leading-none">{globalRank > 0 ? `#${globalRank}` : '—'}</p>
          </div>
        </div>

        {/* Quiz code */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm">
          <p className="text-sm font-black text-slate-400 mb-3">🎮 নতুন কুইজ শুরু করো</p>
          <div className="flex gap-2">
            <input value={quizCode} onChange={e => setQuizCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && onStart()} placeholder="কুইজ কোড লিখুন"
              className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 text-base tracking-widest uppercase outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-300 placeholder:normal-case placeholder:tracking-normal placeholder:font-bold" />
            <button onClick={onStart} disabled={!quizCode.trim()}
              className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-base shadow-sm">
              শুরু 🚀
            </button>
          </div>
        </div>

        {/* Games */}
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
          <button onClick={() => setShowGameModal(true)}
            className="w-full flex justify-between items-center px-5 py-4 hover:bg-slate-50 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎮</span>
              <div className="text-left">
                <p className="text-sm font-black text-slate-700">Quiz Games</p>
                <p className="text-xs font-bold text-slate-400">খেলো এবং পয়েন্ট জিতো</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full">4 Games</span>
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Game Modal */}
        {showGameModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => { setShowGameModal(false); setActiveGame(null); }}>
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  {activeGame && (
                    <button onClick={() => setActiveGame(null)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-500 transition-all mr-1">←</button>
                  )}
                  <span className="text-xl">🎮</span>
                  <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">{activeGame || 'Quiz Games'}</h3>
                </div>
                <button onClick={() => { setShowGameModal(false); setActiveGame(null); }}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center font-black text-slate-400 transition-all">✕</button>
              </div>
              <div className="p-5 max-h-[75vh] overflow-y-auto">
                {!activeGame ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'SpinWheel',  icon: '🎡', name: 'Spin Wheel',  desc: 'ঘুরিয়ে প্রশ্ন জিতো',  color: 'bg-indigo-50 border-indigo-100 hover:border-indigo-400' },
                      { id: 'Memory',     icon: '🧠', name: 'Memory Game', desc: 'জুটি মেলাও মনে রেখে', color: 'bg-emerald-50 border-emerald-100 hover:border-emerald-400' },
                      { id: 'QuizBattle', icon: '⚔️', name: 'Quiz Battle', desc: 'দ্রুত উত্তর দাও',      color: 'bg-amber-50 border-amber-100 hover:border-amber-400' },
                      { id: 'Puzzle',     icon: '🧩', name: 'Puzzle Game', desc: 'ধাঁধা সমাধান করো',    color: 'bg-rose-50 border-rose-100 hover:border-rose-400' },
                    ].map(g => (
                      <button key={g.id} onClick={() => setActiveGame(g.id)}
                        className={`${g.color} border-2 rounded-[20px] p-5 text-left transition-all hover:scale-105 active:scale-95`}>
                        <span className="text-3xl block mb-2">{g.icon}</span>
                        <p className="font-black text-slate-800 text-sm">{g.name}</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{g.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    {activeGame === 'SpinWheel'  && <SpinWheelGameInline />}
                    {activeGame === 'Memory'     && <MemoryGameInline />}
                    {activeGame === 'QuizBattle' && <QuizBattleInline />}
                    {activeGame === 'Puzzle'     && <PuzzleGameInline />}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
          <button onClick={() => setShowBadges(!showBadges)} className="w-full flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-slate-500">🏅 ব্যাজ</p>
              <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{earnedBadges.length}/{BADGES.length}</span>
            </div>
            <svg className={`w-4 h-4 text-slate-300 transition-transform ${showBadges ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showBadges && (
            <div className="px-4 pb-4">
              {nextBadge && (
                <div className="mb-3 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <span className="text-base grayscale opacity-50">{nextBadge.icon}</span>
                  <p className="text-sm font-bold text-slate-400">পরের ব্যাজ: <span className="text-slate-600 font-black">{nextBadge.label}</span></p>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {BADGES.map(b => {
                  const has = earnedBadges.some(e => e.id === b.id);
                  return (
                    <div key={b.id} title={b.label}
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${has ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-25 grayscale'}`}>
                      <span className="text-2xl">{b.icon}</span>
                      <span className={`text-xs font-black mt-1.5 text-center leading-tight ${has ? 'text-slate-600' : 'text-slate-400'}`}>{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
          <button onClick={() => setShowBoard(!showBoard)} className="w-full flex justify-between items-center px-5 py-4">
            <p className="text-sm font-black text-slate-500">🏆 লিডারবোর্ড</p>
            <svg className={`w-4 h-4 text-slate-300 transition-transform ${showBoard ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="px-4 pb-4 grid grid-cols-3 gap-2">
            {allStudents.slice(0, 3).map((s, i) => {
              const isMe = s.name.toLowerCase() === studentName.toLowerCase();
              return (
                <div key={i} className={`rounded-2xl p-3 text-center border transition-all ${isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-xl">{rankIcon(i + 1)}</p>
                  <p className={`text-sm font-black truncate mt-1 ${isMe ? 'text-indigo-600' : 'text-slate-700'}`}>{s.name}</p>
                  <p className={`text-sm font-bold mt-0.5 ${isMe ? 'text-indigo-500' : 'text-slate-400'}`}>{s.pts.toFixed(1)}</p>
                </div>
              );
            })}
          </div>
          {showBoard && allStudents.length > 3 && (
            <div className="px-4 pb-4 space-y-1.5 max-h-52 overflow-y-auto border-t border-slate-50 pt-3">
              {allStudents.slice(3).map((s, i) => {
                const isMe = s.name.toLowerCase() === studentName.toLowerCase();
                return (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-slate-400 font-black text-sm w-6 text-center">#{i + 4}</span>
                    <span className={`flex-1 font-black text-base truncate ${isMe ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {s.name}{isMe && <span className="ml-1.5 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">তুমি</span>}
                    </span>
                    <span className={`font-black text-base ${isMe ? 'text-indigo-500' : 'text-slate-400'}`}>{s.pts.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-slate-500">📋 কুইজ হিস্ট্রি</p>
              <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{history.length}টি</span>
            </div>
            <svg className={`w-4 h-4 text-slate-300 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showHistory && (
            <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
              {history.length === 0 && <p className="text-center text-slate-300 font-bold text-base py-6">এখনো কোনো কুইজ দেওয়া হয়নি</p>}
              {history.map((item, idx) => {
                const pct = Math.round((item.score / (item.totalMarks || 1)) * 100);
                return (
                  <div key={idx}
                    onClick={() => { setViewingQuiz(item.fullQuizData); setViewingAttempt(item.myAttemptData); }}
                    className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/40 transition-all cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${pct >= 70 ? 'bg-emerald-50 text-emerald-600' : pct >= 40 ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>{pct}%</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-base text-slate-700 truncate">{item.quizTitle}</p>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">{item.quizCode} · {new Date(item.date).toLocaleDateString('bn-BD')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-base text-indigo-600">{item.score}/{item.totalMarks}</p>
                      <p className="text-xs font-bold text-emerald-500">+{item.pts.toFixed(1)} pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transcript modal */}
      {viewingQuiz && viewingAttempt && (
        <StudentTranscriptModal
          quiz={viewingQuiz} attempt={viewingAttempt}
          onClose={() => { setViewingQuiz(null); setViewingAttempt(null); }}
          onExport={() => window.print()}
          isExporting={false}
          attemptSheetRef={{ current: null } as any}
          getRankInfo={(att, q) => {
            // ✅ fullQuizData.attempts subcollection থেকে ইতিমধ্যে loaded (history তে আছে)
            const histEntry = history.find(h => h.myAttemptData?.submittedAt === att.submittedAt);
            const allAttempts = histEntry?.fullQuizData?.attempts || q.attempts || [];
            const sorted = [...allAttempts].sort((a: any, b: any) => b.score - a.score);
            const r = sorted.findIndex((s: any) => s.submittedAt === att.submittedAt) + 1;
            return { rank: r || 1, total: sorted.length || 1 };
          }}
        />
      )}
    </div>
  );
};

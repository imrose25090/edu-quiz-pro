import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface QuestionFormat {
  id: string;
  type: string;
  name: string;
  format: string;
  requiresInput: boolean;
}

const DEFAULT_FORMATS: QuestionFormat[] = [
  { id: '1', type: 'MCQ',          name: 'Standard MCQ',    format: 'Question | Opt1, Opt2, Opt3, Opt4 | CorrectOpt | Explanation', requiresInput: false },
  { id: '2', type: 'TRUE_FALSE',   name: 'True/False',      format: 'Question | CorrectAnswer | Explanation',                       requiresInput: false },
  { id: '3', type: 'SHORT_ANSWER', name: 'Short Answer',    format: 'Question | Answer | Explanation',                              requiresInput: true  },
  { id: '4', type: 'FILL_GAP',     name: 'Fill in the Gap', format: 'Question (use __) | Answer | Explanation',                     requiresInput: true  },
];

export const FormatSettings: React.FC = () => {
  const [formats, setFormats] = useState<QuestionFormat[]>([]);
  const [newTypeName,  setNewTypeName]  = useState('');
  const [newFormatStr, setNewFormatStr] = useState('');
  const [requiresInput, setRequiresInput] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Firebase থেকে real-time load ─────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'formats'), async (snap) => {
      if (snap.empty) {
        // প্রথমবার — default formats Firebase এ seed করো
        const batch = writeBatch(db);
        DEFAULT_FORMATS.forEach(f => {
          batch.set(doc(db, 'formats', f.id), f);
        });
        await batch.commit();
        // onSnapshot আবার fire করবে
      } else {
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionFormat));
        setFormats(loaded);
        // localStorage ও sync রাখো (offline / same-tab use এর জন্য)
        localStorage.setItem('quiz_formats', JSON.stringify(loaded));
        window.dispatchEvent(new Event('storage_updated'));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Add format ────────────────────────────────────────────
  const addFormat = async () => {
    const typeKey = newTypeName.toUpperCase().trim().replace(/\s+/g, '_');
    if (!newTypeName || !newFormatStr) { alert("সবগুলো ঘর পূরণ করুন!"); return; }
    if (formats.some(f => f.type === typeKey)) { alert("এই টাইপ অলরেডি আছে!"); return; }

    const newEntry: QuestionFormat = {
      id: Date.now().toString(),
      type: typeKey,
      name: newTypeName,
      format: newFormatStr,
      requiresInput,
    };

    await setDoc(doc(db, 'formats', newEntry.id), newEntry);
    setNewTypeName(''); setNewFormatStr(''); setRequiresInput(false);
  };

  // ── Delete format ─────────────────────────────────────────
  const removeFormat = async (id: string) => {
    if (window.confirm('এই ফরম্যাট মুছে ফেলবেন?')) {
      await deleteDoc(doc(db, 'formats', id));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-['Hind_Siliguri'] animate-in fade-in duration-500">

      {/* বাম: নতুন format এড */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚙️</span>
            <h3 className="text-xl font-black text-slate-800 uppercase italic">Add Question Format</h3>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div>
              <p className="text-[10px] font-black text-indigo-500 ml-2 mb-1 uppercase tracking-widest">Format Label</p>
              <input
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="যেমন: MCQ with Explanation"
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
              />
            </div>

            <div>
              <p className="text-[10px] font-black text-indigo-500 ml-2 mb-1 uppercase tracking-widest">Parsing Structure</p>
              <textarea
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-28 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Question | Opts | Correct | Explanation"
                value={newFormatStr}
                onChange={e => setNewFormatStr(e.target.value)}
              />
              <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                  💡 প্রতিটি তথ্যের মাঝে <code className="bg-blue-200 px-1 rounded">|</code> ব্যবহার করুন।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div>
                <p className="text-xs font-black text-indigo-700 uppercase">Require Student Input?</p>
                <p className="text-[9px] font-bold text-indigo-400 italic">For written/fill-gap type questions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={requiresInput} onChange={() => setRequiresInput(!requiresInput)} />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            <button onClick={addFormat}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">
              Register Format
            </button>
          </div>
        </div>
      </div>

      {/* ডান: format list */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900 p-8 rounded-[40px] text-white mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-black italic uppercase text-2xl tracking-tighter">Active Formats</h4>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
              Firebase synced — সব device এ কাজ করবে
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">📋</div>
        </div>

        <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
          {formats.map(f => (
            <div key={f.id}
              className="bg-white p-6 rounded-[32px] border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-all hover:shadow-md">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase border border-indigo-100">
                    {f.name}
                  </span>
                  {f.requiresInput && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase">✍️ Input</span>
                  )}
                  <span className="text-[9px] font-bold text-slate-300 uppercase">ID: {f.type}</span>
                </div>
                <p className="text-sm font-black text-slate-700 font-mono bg-slate-50 p-4 rounded-xl border border-slate-100 break-all leading-relaxed">
                  {f.format}
                </p>
              </div>
              <button onClick={() => removeFormat(f.id)}
                className="ml-4 p-4 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest">
                Delete
              </button>
            </div>
          ))}

          {formats.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
              <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">No formats defined yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormatSettings;

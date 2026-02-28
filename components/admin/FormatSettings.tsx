import React, { useState, useEffect } from 'react';

interface QuestionFormat {
  id: string;
  type: string;
  name: string;
  format: string;
  requiresInput: boolean; 
}

export const FormatSettings: React.FC = () => {
  const [formats, setFormats] = useState<QuestionFormat[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newFormatStr, setNewFormatStr] = useState('');
  const [requiresInput, setRequiresInput] = useState(false);

  useEffect(() => {
    const loadFormats = () => {
      const saved = localStorage.getItem('quiz_formats');
      if (saved) {
        setFormats(JSON.parse(saved));
      } else {
        const defaultFormats: QuestionFormat[] = [
          { id: '1', type: 'MCQ', name: 'Standard MCQ', format: 'Question | Opt1, Opt2, Opt3, Opt4 | CorrectOpt', requiresInput: false },
          { id: '2', type: 'TRUE_FALSE', name: 'True/False', format: 'Question | CorrectAnswer', requiresInput: false },
          { id: '3', type: 'SHORT_ANSWER', name: 'Short Answer', format: 'Question | Answer', requiresInput: true },
          { id: '4', type: 'FILL_GAP', name: 'Fill in the Gap', format: 'Question (use __) | Answer', requiresInput: true }
        ];
        setFormats(defaultFormats);
        localStorage.setItem('quiz_formats', JSON.stringify(defaultFormats));
      }
    };
    loadFormats();
  }, []);

  // ✅ ডাটা আপডেট হলে QuestionManager-কে সংকেত পাঠানোর লজিক
  const saveAndNotify = (updatedFormats: QuestionFormat[]) => {
    setFormats(updatedFormats);
    localStorage.setItem('quiz_formats', JSON.stringify(updatedFormats));
    
    // ম্যানুয়ালি ইভেন্ট ট্রিগার করা যাতে একই উইন্ডোর QuestionManager আপডেট পায়
    window.dispatchEvent(new Event('storage')); 
  };

  const addFormat = () => {
    // টাইপ কি (ID) জেনারেট করা
    const typeKey = newTypeName.toUpperCase().trim().replace(/\s+/g, '_');
    
    if (!newTypeName || !newFormatStr) {
      alert("সবগুলো ঘর পূরণ করুন!");
      return;
    }

    if (formats.some(f => f.type === typeKey)) {
      alert("এই টাইপের ফরম্যাট অলরেডি আছে!");
      return;
    }
    
    const newEntry: QuestionFormat = {
      id: Date.now().toString(),
      type: typeKey,
      name: newTypeName,
      format: newFormatStr,
      requiresInput: requiresInput
    };
    
    saveAndNotify([...formats, newEntry]);
    setNewTypeName('');
    setNewFormatStr('');
    setRequiresInput(false);
  };

  const removeFormat = (id: string) => {
    if (window.confirm('এই ফরম্যাটটি মুছে ফেললে বাল্ক আপলোডে সমস্যা হতে পারে। মুছতে চান?')) {
      const updated = formats.filter(f => f.id !== id);
      saveAndNotify(updated);
    }
  };

  const exportFormats = () => {
    const blob = new Blob([JSON.stringify(formats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eduquiz-formats.json';
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-['Hind_Siliguri'] animate-in fade-in duration-500">
      
      {/* বাম পাশ: ফরম্যাট এডিটর */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">Add Question Format</h3>
            </div>
            <button onClick={exportFormats} className="text-xs font-bold text-indigo-500 hover:underline">Export JSON</button>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div>
              <p className="text-[10px] font-black text-indigo-500 ml-2 mb-1 uppercase tracking-widest">Format Label (ইউজারের জন্য)</p>
              <input 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all text-slate-700"
                placeholder="যেমন: শূন্যস্থান পূরণ"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
            </div>

            <div>
              <p className="text-[10px] font-black text-indigo-500 ml-2 mb-1 uppercase tracking-widest">Parsing Structure (কিভাবে লিখবেন)</p>
              <textarea 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all h-28 text-slate-700 resize-none"
                placeholder="Question | Ans1, Ans2 | Correct"
                value={newFormatStr}
                onChange={(e) => setNewFormatStr(e.target.value)}
              />
              <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] text-amber-700 font-bold italic">💡 টিপস: ডেটা আলাদা করতে '|' (পাইপ) চিহ্ন ব্যবহার করুন।</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex flex-col">
                <p className="text-xs font-black text-indigo-700 uppercase">Require Student Input?</p>
                <p className="text-[9px] font-bold text-indigo-400">Enable this for fill-in-the-gaps/short answers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={requiresInput}
                  onChange={() => setRequiresInput(!requiresInput)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <button 
              onClick={addFormat}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
            >
              Register Format
            </button>
          </div>
        </div>
      </div>

      {/* ডান পাশ: রেজিস্ট্রিকৃত ফরম্যাট লিস্ট */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900 p-8 rounded-[40px] text-white mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-black italic uppercase text-2xl tracking-tighter">Active Formats</h4>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-1">এই ফরম্যাটগুলো বাল্ক আপলোডে কাজ করবে</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">⚙️</div>
        </div>

        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
          {formats.map(f => (
            <div key={f.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex justify-between items-center shadow-sm group hover:border-indigo-200 transition-all hover:shadow-md">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                    {f.name}
                  </span>
                  {f.requiresInput && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase border border-emerald-100 italic">
                      ✍️ Input Mode
                    </span>
                  )}
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter italic">ID: {f.type}</span>
                </div>
                <div className="relative group">
                   <p className="text-sm font-black text-slate-700 font-mono tracking-tight bg-slate-50 p-3 rounded-xl border border-slate-100">{f.format}</p>
                </div>
              </div>
              
              <button 
                onClick={() => removeFormat(f.id)}
                className="ml-4 p-4 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
              >
                Delete
              </button>
            </div>
          ))}

          {formats.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
              <div className="text-4xl mb-4 opacity-20">📂</div>
              <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">No formats defined yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FormatSettings;
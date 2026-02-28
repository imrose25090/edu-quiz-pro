import React from 'react';

interface PassageModalProps {
  passageInput: string;
  setPassageInput: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const PassageModal: React.FC<PassageModalProps> = ({ passageInput, setPassageInput, onSave, onCancel }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-6">
    <div className="bg-white p-12 rounded-[64px] w-full max-w-3xl shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in duration-300">
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Comprehension Master</h3>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Assign context to chapter for students to analyze</p>
      </div>
      <textarea 
        className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[40px] h-96 outline-none font-medium leading-relaxed focus:bg-white focus:border-indigo-500 transition-all shadow-inner" 
        value={passageInput} 
        onChange={e => setPassageInput(e.target.value)} 
        placeholder="Type or paste passage content here..." 
      />
      <div className="flex gap-4">
        <button onClick={onSave} className="flex-1 bg-indigo-600 text-white py-6 rounded-[28px] font-black text-xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Save Context</button>
        <button onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 py-6 rounded-[28px] font-black text-xl hover:bg-slate-200 active:scale-95 transition-all">Cancel</button>
      </div>
    </div>
  </div>
);
export default PassageModal;
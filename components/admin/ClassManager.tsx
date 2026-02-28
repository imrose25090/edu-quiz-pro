import React, { useState } from 'react';

interface ClassManagerProps {
  classes: any[];
  bulkAdd: (names: string[]) => void;
  deleteItem: (id: string) => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({ classes, bulkAdd, deleteItem }) => {
  const [inputText, setInputText] = useState('');

  // সেভ করার লজিক
  const handleSave = () => {
    // টেক্সট এরিয়া থেকে নামগুলো আলাদা করা (লাইন ব্রেক বা কমা অনুযায়ী)
    const names = inputText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      alert("দয়া করে অন্তত একটি ক্লাসের নাম লিখুন!");
      return;
    }

    // প্রপস এর মাধ্যমে অ্যাডমিন প্যানেলের মেইন ফাংশন কল করা
    bulkAdd(names);
    setInputText(''); // ইনপুট ক্লিয়ার করা
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Hind_Siliguri']">
      
      {/* বাম পাশ: ইনপুট সেকশন */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-xl font-black italic mb-2 uppercase tracking-tighter text-slate-800">Add Classes</h3>
        <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Enter each class name in a new line</p>
        
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Class 1&#10;Class 2&#10;Class 3..."
          className="w-full h-48 p-5 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 mb-4 text-lg font-bold text-slate-700 shadow-inner"
        />
        
        <button 
          onClick={handleSave}
          disabled={!inputText.trim()}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-black transition-all disabled:opacity-20"
        >
          Save Classes
        </button>
      </div>

      {/* ডান পাশ: লিস্ট সেকশন */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Current Classes</h3>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
            Total: {classes.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {classes.length > 0 ? (
            classes.map((cls: any) => (
              <div key={cls.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100 group hover:border-indigo-200 transition-all">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{cls.name}</span>
                  <span className="text-[8px] font-bold text-slate-300 uppercase">ID: {cls.id.slice(-6)}</span>
                </div>
                <button 
                  onClick={() => {
                    if(window.confirm(`আপনি কি "${cls.name}" ডিলিট করতে চান?`)) deleteItem(cls.id);
                  }} 
                  className="text-rose-400 hover:text-rose-600 font-black text-[10px] uppercase p-2 hover:bg-rose-50 rounded-xl transition-all"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-30">
              <p className="font-black uppercase text-xs">No classes found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ClassManager;
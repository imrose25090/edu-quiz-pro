import React, { useState } from 'react';

interface ClassManagerProps {
  classes: any[];
  bulkAdd: (names: string[]) => void;
  deleteItem: (id: string) => void;
  bulkDelete: (collectionName: string, ids: string[]) => Promise<void>; 
}

export const ClassManager: React.FC<ClassManagerProps> = ({ classes, bulkAdd, deleteItem, bulkDelete }) => {
  const [inputText, setInputText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ✅ সর্টিং লজিক: createdAt অনুযায়ী সর্ট করা হয়েছে যাতে নতুনগুলো নিচে বা উপরে (আপনার প্রয়োজন মতো) থাকে
  const sortedClasses = [...classes].sort((a, b) => {
    const getTime = (obj: any) => {
      if (!obj.createdAt) return 0;
      return obj.createdAt.toMillis ? obj.createdAt.toMillis() : obj.createdAt.seconds * 1000;
    };
    return getTime(a) - getTime(b);
  });

  // চেক বক্স হ্যান্ডলার
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === classes.length) setSelectedIds([]);
    else setSelectedIds(classes.map(c => c.id));
  };

  // বাল্ক ডিলিট হ্যান্ডলার
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (window.confirm(`${selectedIds.length}টি ক্লাস ডিলিট করতে চান?`)) {
      try {
        await bulkDelete('classes', selectedIds); 
        setSelectedIds([]);
        alert("নির্বাচিত ক্লাসগুলো সফলভাবে ডিলিট হয়েছে।");
      } catch (error) {
        console.error("Delete Error:", error);
        alert("ডিলিট করতে সমস্যা হয়েছে।");
      }
    }
  };

  // ✅ সেভ হ্যান্ডলার: ইনপুট সিরিয়াল বজায় রাখা
  const handleSave = () => {
    const names = inputText.split('\n')
      .map(n => n.trim())
      .filter(n => n !== '');

    if (names.length > 0) {
      // আমরা names অ্যারে সরাসরি পাঠাচ্ছি, AppProvider-এর bulkAdd-এ 
      // লুপ চালিয়ে এক এক করে সেভ করলে সিরিয়াল বজায় থাকবে।
      bulkAdd(names); 
      setInputText(''); 
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Hind_Siliguri']">
      {/* বাম পাশ: ইনপুট */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="mb-6">
          <h3 className="text-xl font-black italic mb-1 uppercase text-slate-800 tracking-tighter">Add Classes</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type classes line by line (Top to Bottom)</p>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Class 1&#10;Class 2&#10;Class 3..."
          className="w-full h-48 p-5 bg-slate-50 border-none rounded-3xl mb-4 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:opacity-30"
        />
        
        <button 
          onClick={handleSave} 
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform hover:bg-indigo-700"
        >
          Save Classes
        </button>
      </div>

      {/* ডান পাশ: লিস্ট সেকশন */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <input 
               type="checkbox" 
               onChange={selectAll} 
               checked={selectedIds.length === classes.length && classes.length > 0} 
               className="w-5 h-5 accent-indigo-600 cursor-pointer rounded-lg" 
             />
             <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">Class List</h3>
          </div>
          
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete} 
              className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase animate-pulse shadow-lg shadow-rose-100"
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {sortedClasses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
              <span className="text-4xl mb-2">📁</span>
              <p className="font-bold uppercase text-[10px] tracking-widest">No classes found</p>
            </div>
          ) : (
            sortedClasses.map((cls, index) => (
              <div 
                key={cls.id} 
                className={`p-4 rounded-2xl flex justify-between items-center border transition-all duration-300 ${
                  selectedIds.includes(cls.id) ? 'bg-indigo-50 border-indigo-200 translate-x-1' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(cls.id)} 
                    onChange={() => toggleSelect(cls.id)} 
                    className="w-5 h-5 accent-indigo-600 cursor-pointer rounded-lg" 
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-indigo-300 uppercase leading-none mb-1">Serial #{index + 1}</span>
                    <span className="font-bold text-slate-700">{cls.name}</span>
                  </div>
                </div>
                <button 
                  onClick={async () => { 
                    if(window.confirm(`Delete "${cls.name}"?`)) {
                      await deleteItem(cls.id);
                    }
                  }} 
                  className="w-10 h-10 flex items-center justify-center bg-white text-rose-400 hover:text-rose-600 rounded-xl shadow-sm border border-slate-100 hover:border-rose-100 transition-all"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassManager;

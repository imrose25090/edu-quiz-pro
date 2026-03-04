import React, { useState } from 'react';

interface SubjectManagerProps {
  classes: any[];
  subjects: any[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  addSubject: (subjects: any[]) => void; 
  deleteSubject: (id: string) => void;
  bulkDelete: (collectionName: string, ids: string[]) => Promise<void>;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({
  classes,
  subjects,
  selectedClassId,
  setSelectedClassId,
  addSubject, 
  deleteSubject,
  bulkDelete
}) => {
  const [newSubjects, setNewSubjects] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ✅ হেল্পার ফাংশন: টাইমস্ট্যাম্পকে সংখ্যায় (Milliseconds) রূপান্তর করার জন্য
  const getTime = (createdAt: any) => {
    if (!createdAt) return 0;
    if (typeof createdAt.toMillis === 'function') return createdAt.toMillis(); // Firebase Timestamp
    if (createdAt instanceof Date) return createdAt.getTime(); // JS Date
    if (createdAt.seconds) return createdAt.seconds * 1000; // Manual Timestamp object
    return 0;
  };

  // ১. সাবজেক্ট ফিল্টার এবং নির্ভুল সর্টিং (Registration Order)
  const filteredSubjects = subjects
    .filter(s => s.classId === selectedClassId)
    .sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt));

  const handleSave = () => {
    if (!selectedClassId) {
      alert("Please select a class first!");
      return;
    }
    const names = newSubjects.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) return;

    // ✅ এখানে Date() এর পরিবর্তে সরাসরি store এর bulkAdd লজিক ব্যবহার হবে
    const subjectsToUpload = names.map(name => ({
      name,
      classId: selectedClassId,
      // createdAt এখানে না দিলেও চলে কারণ store.tsx এর bulkAdd ফাংশনে আমরা এটি জেনারেট করছি
    }));

    try {
      addSubject(subjectsToUpload);
      setNewSubjects('');
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`আপনি কি নিশ্চিত যে আপনি ${selectedIds.length}টি সাবজেক্ট ডিলিট করতে চান?`)) {
      try {
        await bulkDelete('subjects', selectedIds);
        setSelectedIds([]);
        alert("Selected subjects deleted successfully!");
      } catch (error) {
        console.error("Bulk Delete Error:", error);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubjects.map(s => s.id));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Hind_Siliguri']">
      
      {/* বাম পাশ: অ্যাড সাবজেক্ট */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-fit">
        <h3 className="text-xl font-black italic mb-6 uppercase text-slate-800 tracking-tighter">Add Subjects</h3>
        
        <div className="space-y-4 mb-4">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Select Class</label>
          <select 
            value={selectedClassId} 
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedIds([]);
            }}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="">Choose Class...</option>
            {/* ✅ ক্লাস ড্রপডাউন সর্টিং লজিক ফিক্স করা হয়েছে */}
            {[...classes]
              .sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt))
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            }
          </select>
        </div>

        <div className="space-y-2 mb-4">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Subject Names (New Line)</label>
          <textarea
            value={newSubjects}
            onChange={(e) => setNewSubjects(e.target.value)}
            placeholder="Physics&#10;Chemistry&#10;Math..."
            className="w-full h-40 p-5 bg-slate-50 rounded-3xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={!newSubjects.trim() || !selectedClassId}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-indigo-100 disabled:opacity-20"
        >
          Save Subjects
        </button>
      </div>

      {/* ডান পাশ: রেজিস্টার্ড সাবজেক্ট লিস্ট */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">Registered Subjects</h3>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
              TOTAL: {filteredSubjects.length}
            </span>
          </div>

          {filteredSubjects.length > 0 && (
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSelectAll}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredSubjects.length && filteredSubjects.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-[11px] font-black text-slate-500 uppercase">Select All</span>
              </div>
              
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-rose-100"
                >
                  Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((sub, index) => {
              const isSelected = selectedIds.includes(sub.id);
              return (
                <div 
                  key={sub.id} 
                  className={`p-4 rounded-2xl flex justify-between items-center border transition-all ${
                    isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {
                        setSelectedIds(prev => 
                          prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id]
                        );
                      }}
                      className="w-5 h-5 accent-indigo-600 rounded-lg"
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">SUB-0{index + 1}</span>
                      <span className="font-bold text-slate-700 leading-none">{sub.name}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { if(window.confirm('Delete Subject?')) deleteSubject(sub.id) }}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 opacity-20 italic font-bold">
              {selectedClassId ? "No subjects found for this class" : "Please select a class to view subjects"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectManager;

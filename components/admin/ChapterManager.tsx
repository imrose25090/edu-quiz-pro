import React, { useState } from 'react';

interface ChapterManagerProps {
  classes: any[];
  subjects: any[];
  chapters: any[];
  selectedClassId: string;
  selectedSubjectId: string;
  setSelectedClassId: (id: string) => void;
  setSelectedSubjectId: (id: string) => void;
  bulkAdd: (chapters: { name: string; classId: string; subjectId: string }[]) => void;
  deleteItem: (id: string) => void;
  bulkDelete: (collectionName: string, ids: string[]) => Promise<void>; // ✅ নতুন প্রপস
  setEditingChapterPassage: (id: string | null) => void;
  setPassageInput: (text: string) => void;
}

const ChapterManager: React.FC<ChapterManagerProps> = ({ 
  classes, 
  subjects, 
  chapters, 
  selectedClassId, 
  selectedSubjectId,
  setSelectedClassId,
  setSelectedSubjectId,
  bulkAdd,
  deleteItem,
  bulkDelete, // ✅ প্রপস রিসিভ করা হয়েছে
  setEditingChapterPassage,
  setPassageInput
}) => {
  const [newChapters, setNewChapters] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // ✅ সিলেক্টেড আইডি ট্র্যাকিং

  // ফিল্টারিং
  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);
  const filteredChapters = chapters.filter((ch: any) => 
    ch.classId === selectedClassId && ch.subjectId === selectedSubjectId
  );

  const handleSave = () => {
    if (!selectedClassId || !selectedSubjectId) {
      alert("দয়া করে ক্লাস এবং সাবজেক্ট সিলেক্ট করুন!");
      return;
    }
    const names = newChapters.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) return;

    const chaptersToUpload = names.map(name => ({
      name,
      classId: selectedClassId,
      subjectId: selectedSubjectId
    }));

    bulkAdd(chaptersToUpload);
    setNewChapters('');
    alert('Chapters added successfully!');
  };

  // ✅ বাল্ক ডিলিট ফাংশন
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`আপনি কি নিশ্চিত যে ${selectedIds.length}টি চ্যাপ্টার ডিলিট করতে চান?`)) {
      try {
        await bulkDelete('chapters', selectedIds);
        setSelectedIds([]);
        alert('Selected chapters deleted successfully!');
      } catch (error) {
        console.error("Bulk delete failed:", error);
      }
    }
  };

  // ✅ অল সিলেক্ট ফাংশন
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredChapters.length && filteredChapters.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredChapters.map(ch => ch.id));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Hind_Siliguri']">
      
      {/* বাম পাশ: ইনপুট সেকশন */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-fit">
        <h3 className="text-xl font-black italic mb-6 uppercase tracking-tighter text-slate-800">Manage Chapters</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">1. Select Class</label>
            <select 
              value={selectedClassId} 
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId('');
                setSelectedIds([]); // ক্লিয়ার সিলেকশন
              }}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose Class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">2. Select Subject</label>
            <select 
              value={selectedSubjectId} 
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedIds([]); // ক্লিয়ার সিলেকশন
              }}
              disabled={!selectedClassId}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="">Choose Subject...</option>
              {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <textarea
          value={newChapters}
          onChange={(e) => setNewChapters(e.target.value)}
          placeholder="Enter chapters (one per line)..."
          className="w-full h-40 p-5 bg-slate-50 rounded-3xl mb-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
        />
        
        <button 
          onClick={handleSave}
          disabled={!selectedSubjectId || !newChapters.trim()}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl disabled:opacity-20"
        >
          Save Chapters
        </button>
      </div>

      {/* ডান পাশ: চ্যাপ্টার লিস্ট */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Registered Chapters</h3>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              Total: {filteredChapters.length}
            </span>
          </div>

          {/* ✅ বাল্ক কন্ট্রোল UI */}
          {filteredChapters.length > 0 && (
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSelectAll}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredChapters.length && filteredChapters.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Select All</span>
              </div>
              
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg"
                >
                  Delete ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedSubjectId ? (
            filteredChapters.length > 0 ? (
              filteredChapters.map((ch: any) => {
                const isSelected = selectedIds.includes(ch.id);
                return (
                  <div 
                    key={ch.id} 
                    className={`p-5 rounded-[24px] flex justify-between items-center border transition-all group ${
                      isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(ch.id) ? prev.filter(i => i !== ch.id) : [...prev, ch.id]
                          );
                        }}
                        className="w-5 h-5 accent-indigo-600 rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{ch.name}</span>
                          {ch.passageContent && (
                            <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded uppercase">Passage OK</span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-4">
                           <button 
                            onClick={() => {
                              setPassageInput(ch.passageContent || '');
                              setEditingChapterPassage(ch.id);
                            }}
                            className="text-[10px] font-black text-indigo-600 uppercase hover:text-black transition-colors"
                          >
                            {ch.passageContent ? '📝 Edit Passage' : '➕ Add Passage'}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => { if(window.confirm('Delete Chapter?')) deleteItem(ch.id) }}
                      className="text-slate-300 hover:text-rose-600 p-2 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 opacity-20 italic">No chapters found for this subject</div>
            )
          ) : (
            <div className="text-center py-20 opacity-20 italic">Please select a class and subject first</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterManager;

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
  // ✅ AdminPanel এর প্রপস নামের সাথে মিল রেখে পরিবর্তন করা হয়েছে
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
  setEditingChapterPassage, // ✅ সঠিক নাম
  setPassageInput           // ✅ সঠিক নাম
}) => {
  const [newChapters, setNewChapters] = useState('');

  // সিলেক্ট করা ক্লাস অনুযায়ী সাবজেক্ট ফিল্টার
  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);

  // বর্তমানে সিলেক্ট করা সাবজেক্ট অনুযায়ী চ্যাপ্টার ফিল্টার
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Hind_Siliguri']">
      
      {/* বাম পাশ: ইনপুট সেকশন */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-xl font-black italic mb-6 uppercase tracking-tighter text-slate-800">Manage Chapters</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">1. Select Class</label>
            <select 
              value={selectedClassId} 
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId(''); 
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
              onChange={(e) => setSelectedSubjectId(e.target.value)}
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Registered Chapters</h3>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
            Total: {filteredChapters.length}
          </span>
        </div>

        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedSubjectId ? (
            filteredChapters.length > 0 ? (
              filteredChapters.map((ch: any) => (
                <div key={ch.id} className="p-5 bg-slate-50 rounded-[24px] flex justify-between items-center border border-slate-100 group hover:border-indigo-200 transition-all">
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
                          // ✅ AdminPanel এর লজিক অনুযায়ী প্রথমে ইনপুট সেট করে তারপর মডাল ওপেন করা হচ্ছে
                          setPassageInput(ch.passageContent || '');
                          setEditingChapterPassage(ch.id);
                        }}
                        className="text-[10px] font-black text-indigo-600 uppercase hover:text-black transition-colors"
                      >
                        {ch.passageContent ? '📝 Edit Passage' : '➕ Add Passage'}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { if(window.confirm('Delete Chapter?')) deleteItem(ch.id) }}
                    className="text-rose-400 hover:text-rose-600 p-2 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              ))
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
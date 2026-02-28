import React, { useState } from 'react';

// ইন্টারফেসটি নিশ্চিত করে যে আমরা সঠিক নামে ডাটা রিসিভ করছি
interface SubjectManagerProps {
  classes: any[];
  subjects: any[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  // এই নামটির সাথে AdminPanel এ পাঠানো নামের মিল থাকতে হবে
  addSubject: (subjects: any[]) => void; 
  deleteSubject: (id: string) => void;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({
  classes,
  subjects,
  selectedClassId,
  setSelectedClassId,
  addSubject, // নিশ্চিত করুন এটি রিসিভ করা হয়েছে
  deleteSubject
}) => {
  const [newSubjects, setNewSubjects] = useState('');

  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);

  const handleSave = () => {
    if (!selectedClassId) {
      alert("Please select a class first!");
      return;
    }

    // ফাংশনটি আছে কি না তা আগে চেক করে নেওয়া ভালো (সেফটি চেক)
    if (typeof addSubject !== 'function') {
      console.error("Error: addSubject prop is missing or not a function!");
      return;
    }

    const names = newSubjects.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) return;

    const subjectsToUpload = names.map(name => ({
      name,
      classId: selectedClassId
    }));

    addSubject(subjectsToUpload); // এখানে এরর আসছিল
    setNewSubjects('');
    alert('Subjects added successfully!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Hind_Siliguri']">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-xl font-black italic mb-6 uppercase text-slate-800">Add Subjects</h3>
        
        <div className="space-y-4 mb-4">
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Choose Class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <textarea
          value={newSubjects}
          onChange={(e) => setNewSubjects(e.target.value)}
          placeholder="Enter subjects (one per line)..."
          className="w-full h-40 p-5 bg-slate-50 rounded-3xl mb-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button 
          onClick={handleSave}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl"
        >
          Save Subjects
        </button>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic uppercase text-slate-800">Registered Subjects</h3>
          <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
            TOTAL: {filteredSubjects.length}
          </span>
        </div>

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map(sub => (
              <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100 group">
                <span className="font-bold text-slate-700">{sub.name}</span>
                <button 
                  onClick={() => { if(window.confirm('Delete Subject?')) deleteSubject(sub.id) }}
                  className="p-2 text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                >
                  🗑️
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-20 opacity-20 italic">No subjects found for this class</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectManager;
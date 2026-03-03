import React from 'react';
import { Class, Subject, Chapter, Question, Teacher } from '../../types';

interface MasterRegistryProps {
  activeTab: string;
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  teachers: Teacher[];
  students?: any[];
  selectedClassId: string;
  selectedSubjectId: string;
  deleteClass: (id: string) => void;
  deleteSubject: (id: string) => void;
  deleteChapter: (id: string) => void;
  deleteQuestion: (id: string) => void;
  deleteTeacher: (id: string) => void;
  deleteStudent?: (id: string) => void;
  updateTeacher: (id: string, data: any) => void;
  updateStudent?: (id: string, data: any) => void;
  setEditingChapterPassage: (id: string) => void;
  setPassageInput: (val: string) => void;
  generateRandomPin: () => string;
}

const MasterRegistry: React.FC<MasterRegistryProps> = ({
  activeTab = 'REGISTRY',
  classes = [],      // ডিফল্ট ভ্যালু দিন যাতে .length এরর না আসে
  subjects = [], 
  chapters = [], 
  questions = [], 
  teachers = [], 
  students = [],
  selectedClassId, 
  selectedSubjectId, 
  deleteClass, 
  deleteSubject,
  deleteChapter, 
  deleteQuestion, 
  deleteTeacher, 
  deleteStudent, 
  updateTeacher,
  updateStudent
}) => {

  // ১. ফিল্টার লজিক সংশোধন
  const getFilteredData = () => {
    switch (activeTab) {
      case 'CLASSES': return classes;
      case 'SUBJECTS': return subjects.filter(s => !selectedClassId || s.classId === selectedClassId);
      case 'CHAPTERS': return chapters.filter(ch => !selectedSubjectId || ch.subjectId === selectedSubjectId);
      case 'QUESTIONS': return questions.filter(q => !selectedSubjectId || q.subjectId === selectedSubjectId);
      case 'TEACHERS': return teachers;
      case 'STUDENT': return students; 
      case 'REGISTRY': return [...teachers, ...students];
      default: return [];
    }
  };

  const currentData = getFilteredData();

  return (
    <div className="lg:col-span-7 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[850px] font-['Hind_Siliguri']">
      
      {/* ১. রিপোর্ট সামারি সেকশন */}
      <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">System Analytics</h3>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Performance & Growth Report</p>
          </div>
          <div className="flex gap-2">
             <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center min-w-[100px] backdrop-blur-sm">
                <div className="text-[9px] font-black text-slate-400 uppercase">Growth</div>
                <div className="text-xl font-black text-emerald-400">+{Math.floor((students?.length || 0) / 4)}</div>
             </div>
             <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center min-w-[100px] backdrop-blur-sm">
                <div className="text-[9px] font-black text-slate-400 uppercase">New Users</div>
                <div className="text-xl font-black text-indigo-400">+{students?.length || 0}</div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-indigo-600 p-4 rounded-[24px] shadow-lg shadow-indigo-900/20 group hover:scale-105 transition-transform">
              <div className="text-[9px] font-black uppercase text-indigo-200">Total Students</div>
              <div className="text-2xl font-black">{students?.length || 0}</div>
           </div>
           <div className="bg-slate-700/50 p-4 rounded-[24px] border border-slate-600 group hover:scale-105 transition-transform">
              <div className="text-[9px] font-black uppercase text-slate-400">Teachers</div>
              <div className="text-2xl font-black">{teachers?.length || 0}</div>
           </div>
           <div className="bg-slate-700/50 p-4 rounded-[24px] border border-slate-600 group hover:scale-105 transition-transform">
              <div className="text-[9px] font-black uppercase text-slate-400">Questions</div>
              <div className="text-2xl font-black">{questions?.length || 0}</div>
           </div>
           <div className="bg-slate-700/50 p-4 rounded-[24px] border border-slate-600 group hover:scale-105 transition-transform">
              <div className="text-[9px] font-black uppercase text-slate-400">Active Quizzes</div>
              <div className="text-2xl font-black">24</div>
           </div>
        </div>
      </div>

      {/* ২. হেডার */}
      <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h4 className="font-black text-slate-800 uppercase text-xs md:text-sm tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Viewing Registry: <span className="text-indigo-600">{(activeTab || 'REGISTRY')}</span>
        </h4>
        <div className="text-[10px] font-black bg-slate-100 px-4 py-2 rounded-full text-slate-500 uppercase">
            Total Items: {currentData.length}
        </div>
      </div>

      {/* ৩. লিস্ট এরিয়া (সংশোধিত ম্যাপ লজিক) */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 bg-slate-50/30 scroll-smooth custom-scrollbar">
        
        {/* TEACHERS LIST */}
        {(activeTab === 'TEACHERS' || activeTab === 'REGISTRY') && teachers.map((tchr: any) => (
          <div key={tchr.id} className={`p-5 rounded-[28px] border bg-white flex flex-col md:flex-row justify-between items-center group transition-all shadow-sm ${tchr.isFrozen ? 'border-rose-200 bg-rose-50/20 opacity-90' : 'border-slate-100 hover:border-indigo-400 hover:shadow-md'}`}>
            <div className="flex items-center gap-5 w-full md:w-auto">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-colors ${tchr.isFrozen ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {tchr.name?.[0] || 'T'}
               </div>
               <div>
                 <div className="font-black text-slate-800 uppercase flex items-center gap-2">
                   {tchr.name} 
                   <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">TEACHER</span>
                   {tchr.isFrozen && <span className="text-[8px] bg-rose-600 text-white px-2 py-0.5 rounded-full">FROZEN</span>}
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 lowercase">{tchr.email}</div>
                 <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Access:</span>
                    <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 italic">
                       {tchr.expiryDate || '31 DEC 2026'} 
                    </span>
                 </div>
               </div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
              <button 
                onClick={() => updateTeacher(tchr.id, { isFrozen: !tchr.isFrozen })} 
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${tchr.isFrozen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white'}`}
              >
                {tchr.isFrozen ? 'Unfreeze' : 'Freeze'}
              </button>
              <button 
                onClick={() => { if(window.confirm(`Delete ${tchr.name}?`)) deleteTeacher(tchr.id) }} 
                className="group-hover:opacity-100 flex-1 md:flex-none text-rose-500 font-black text-[10px] bg-rose-50 px-5 py-2.5 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
              >
                DELETE
              </button>
            </div>
          </div>
        ))}

        {/* STUDENTS LIST */}
        {(activeTab === 'STUDENT' || activeTab === 'REGISTRY') && students.map((user: any) => (
          <div key={user.id} className={`p-5 rounded-[28px] border bg-white flex flex-col md:flex-row justify-between items-center group transition-all shadow-sm ${user.isFrozen ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 hover:border-emerald-400 hover:shadow-md'}`}>
            <div className="flex items-center gap-5 w-full md:w-auto">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border ${user.isFrozen ? 'bg-rose-50 text-rose-400 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  {user.name?.[0] || 'S'}
               </div>
               <div>
                 <div className="font-black text-slate-800 uppercase flex items-center gap-2">
                   {user.name}
                   {user.isFrozen && <span className="text-[8px] bg-rose-500 text-white px-2 py-0.5 rounded-full">BLOCKED</span>}
                 </div>
                 <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">ID: {user.phone || user.id?.slice(0,8)}</div>
                 <div className="text-[9px] font-bold text-emerald-500 uppercase mt-1">Student Account</div>
               </div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
              <button 
                onClick={() => updateStudent?.(user.id, { isFrozen: !user.isFrozen })} 
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${user.isFrozen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white'}`}
              >
                {user.isFrozen ? 'Unfreeze' : 'Freeze'}
              </button>
              <button 
                onClick={() => { if(window.confirm('Delete Student?')) deleteStudent?.(user.id) }} 
                className="group-hover:opacity-100 flex-1 md:flex-none bg-rose-50 text-rose-500 px-5 py-2.5 rounded-xl font-black text-[10px] transition-all hover:bg-rose-500 hover:text-white"
              >
                DELETE
              </button>
            </div>
          </div>
        ))}

        {/* CLASSES/SUBJECTS/QUESTIONS List (নতুনভাবে যোগ করা হয়েছে) */}
        {['CLASSES', 'SUBJECTS', 'CHAPTERS', 'QUESTIONS'].includes(activeTab) && currentData.map((item: any) => (
          <div key={item.id} className="p-5 rounded-3xl border border-slate-100 bg-white flex justify-between items-center group">
            <span className="font-bold text-slate-700">{item.name || item.text || item.title}</span>
            <button 
              onClick={() => {
                if(activeTab === 'CLASSES') deleteClass(item.id);
                if(activeTab === 'SUBJECTS') deleteSubject(item.id);
                if(activeTab === 'CHAPTERS') deleteChapter(item.id);
                if(activeTab === 'QUESTIONS') deleteQuestion(item.id);
              }}
              className="text-rose-500 bg-rose-50 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
            >
              REMOVE
            </button>
          </div>
        ))}

        {/* Empty State */}
        {currentData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 opacity-30">
            <div className="text-7xl mb-6 grayscale">📊</div>
            <p className="font-black uppercase tracking-[0.4em] text-[10px] text-slate-900">No Data Found in Registry</p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Secure Registry Management • 2026 EduQuiz Pro Systems
      </div>
    </div>
  );
};

export default MasterRegistry;

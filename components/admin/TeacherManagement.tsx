import React, { useState } from 'react';
import { Teacher } from '../../types';

interface TeacherManagementProps {
  teachers: Teacher[];
  bulkAddTeachers: (data: any[]) => void;
  updateTeacher: (id: string, data: any) => void;
  deleteTeacher: (id: string) => void;
  // ✅ নতুন ফিল্টার ফাংশন (AdminPanel থেকে পাস করতে হবে)
  onTeacherSelect?: (teacherId: string) => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers, bulkAddTeachers, updateTeacher, deleteTeacher, onTeacherSelect
}) => {
  const [localInputText, setLocalInputText] = useState('');
  const [defaultDays, setDefaultDays] = useState('30'); 

  const generateSecurePin = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAdd = () => {
    if (!localInputText || !localInputText.trim()) {
      alert("Please enter teacher data!");
      return;
    }

    const lines = localInputText.split('\n').filter(l => l.trim());
    const data = lines.map(line => {
      const parts = line.split(',').map(s => s.trim());
      const [name, email, customPin, days] = parts;
      
      const validityDays = parseInt(days || defaultDays);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + validityDays);

      return {
        name: name || 'Teacher',
        email: email || 'no@email.com',
        pin: customPin || generateSecurePin(),
        validityDays: validityDays,
        expiryDate: expiryDate.toISOString(),
        subjects: [],
        createdAt: new Date().toISOString()
      };
    });

    bulkAddTeachers(data);
    setLocalInputText('');
    alert('Teachers added successfully!');
  };

  const handleDaysUpdate = (id: string, newDays: string) => {
    const days = parseInt(newDays) || 0;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    updateTeacher(id, { 
      validityDays: days,
      expiryDate: expiryDate.toISOString() 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Hind_Siliguri']">
      
      {/* 1. Add Teacher Section */}
      <div className="bg-white p-6 md:p-8 rounded-[35px] md:rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Quick Teacher Add</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bulk upload via CSV format</p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <span className="text-[10px] font-black text-indigo-400">DEF. VALIDITY:</span>
            <input 
              type="number" 
              className="w-12 bg-transparent border-none font-black text-indigo-600 text-sm focus:ring-0 p-0"
              value={defaultDays}
              onChange={(e) => setDefaultDays(e.target.value)}
            />
            <span className="text-[10px] font-black text-indigo-400 uppercase">Days</span>
          </div>
        </div>
        
        <textarea 
          className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[24px] md:rounded-[30px] h-44 outline-none font-medium text-sm focus:bg-white focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-300"
          value={localInputText}
          onChange={e => setLocalInputText(e.target.value)}
          placeholder={`Format: Name, Email, Password, Days\nExample: Rahim, rahim@mail.com, Pass12, 365\nTip: Leave Password empty to auto-generate PIN.`}
        />
        
        <button 
          onClick={handleAdd} 
          className="w-full mt-5 bg-slate-900 text-white py-5 rounded-[22px] font-black text-lg hover:bg-indigo-600 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 group"
        >
          <span>অ্যাক্সেস কনফার্ম করুন</span>
          <span className="group-hover:translate-x-1 transition-transform">⚡</span>
        </button>
      </div>

      {/* 2. Teachers List Section */}
      <div className="bg-white rounded-[35px] md:rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Active Teacher Registry</h3>
          <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-500 px-4 py-1.5 rounded-full shadow-sm">
            {teachers?.length || 0} Registered
          </span>
        </div>
        
        <div className="p-4 md:p-8 space-y-4 max-h-[650px] overflow-y-auto custom-scrollbar bg-slate-50/20">
          {teachers && teachers.length > 0 ? (
            teachers.map(tchr => {
              const daysLeft = Math.ceil((new Date(tchr.expiryDate || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = daysLeft <= 0;

              return (
                <div 
                  key={tchr.id} 
                  // ✅ ক্লিক করলে কুইজ ফিল্টার হবে
                  onClick={() => onTeacherSelect?.(tchr.id)}
                  className={`p-5 bg-white border rounded-[26px] flex flex-col lg:flex-row items-center justify-between group transition-all cursor-pointer ${
                    isExpired ? 'border-red-100 bg-red-50/10' : 'border-slate-100 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-5 w-full lg:w-auto mb-4 lg:mb-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-colors ${
                      isExpired ? 'bg-red-100 text-red-500' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                      {tchr.name ? tchr.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-lg leading-tight uppercase">{tchr.name}</div>
                      <div className="text-[11px] font-bold text-slate-400 lowercase">{tchr.email}</div>
                      {/* Badge for filtering info */}
                      <div className="mt-1 inline-block px-2 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 rounded uppercase">
                        Click to view activity
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0">
                    {/* Validity Control */}
                    <div className="text-center md:text-right min-w-[100px]">
                      <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Access Control</span>
                      <div className="flex items-center gap-2">
                         <input 
                          type="number"
                          onClick={(e) => e.stopPropagation()} // ইনপুটে ক্লিক করলে যাতে ফিল্টার ট্রিগার না হয়
                          className={`w-14 text-center font-black rounded-lg py-1 text-xs border-none focus:ring-2 focus:ring-indigo-400 ${
                            isExpired ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                          value={tchr.validityDays || 0}
                          onChange={(e) => handleDaysUpdate(tchr.id, e.target.value)}
                        />
                        <span className={`text-[10px] font-black min-w-[60px] ${isExpired ? 'text-red-500' : 'text-slate-400'}`}>
                          {isExpired ? 'EXPIRED' : `${daysLeft}d left`}
                        </span>
                      </div>
                    </div>

                    {/* PIN Control */}
                    <div className="text-center md:text-right min-w-[100px]">
                      <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Login PIN</span>
                      <input 
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 text-center font-mono font-black text-indigo-600 bg-slate-50 border-none rounded-lg py-1 text-xs focus:ring-2 focus:ring-indigo-400"
                        value={tchr.pin || ''}
                        onChange={(e) => updateTeacher(tchr.id, { pin: e.target.value.toUpperCase() })}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateTeacher(tchr.id, { pin: generateSecurePin() }); }} 
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Reset PIN"
                      >
                        🔄
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(window.confirm(`Remove ${tchr.name}?`)) deleteTeacher(tchr.id); }} 
                        className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Delete Teacher"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 opacity-30">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <p className="font-black uppercase tracking-widest text-xs">No Teachers Registered</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Instructions */}
      <div className="bg-indigo-900 p-6 rounded-[30px] text-indigo-100 flex items-center gap-5">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">💡</div>
        <div className="text-xs font-medium leading-relaxed">
          <span className="font-black uppercase block mb-1 text-indigo-300">Admin Tip:</span>
          To manage specific questions or quizzes created by a teacher, simply <span className="text-white font-bold underline">click on their name</span> above. The registry will auto-filter their content.
        </div>
      </div>
    </div>
  );
};

export default TeacherManagement;
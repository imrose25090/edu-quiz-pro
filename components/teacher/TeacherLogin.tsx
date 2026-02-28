import React, { useState } from 'react';
import { Teacher } from '../../types';

interface TeacherLoginProps {
  teachers: Teacher[];
  activeTeacher: Teacher | null;
  setActiveTeacher: (t: Teacher) => void;
  pinInput: string;
  setPinInput: (val: string) => void;
  handleLogin: (e: React.FormEvent) => void;
  loginError: boolean;
  onBack: () => void;
  t: (key: string) => string;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({ 
  teachers, activeTeacher, setActiveTeacher, pinInput, setPinInput, handleLogin, loginError, onBack, t 
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onLoginAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activeTeacher) return;

    // ১. ফ্রিজ চেক (Account Freeze Logic)
    if (activeTeacher.isFrozen) {
      let msg = `দুঃখিত ${activeTeacher.name}, আপনার অ্যাকাউন্টটি বর্তমানে ফ্রিজ (বন্ধ) করা আছে।`;
      
      if (activeTeacher.frozenUntil) {
        const untilDate = new Date(activeTeacher.frozenUntil).toLocaleDateString('bn-BD');
        msg += ` এটি ${untilDate} তারিখ পর্যন্ত বন্ধ থাকবে।`;
      }
      
      setErrorMessage(msg);
      return;
    }

    // ২. সাবস্ক্রিপশন চেক (Expiry Logic)
    if (activeTeacher.expiryDate) {
      const today = new Date();
      const expiryDate = new Date(activeTeacher.expiryDate);

      if (today > expiryDate) {
        setErrorMessage(
          `দুঃখিত ${activeTeacher.name}, আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে! অনুগ্রহ করে নতুন সাবস্ক্রিপশন কিনুন অথবা এডমিনের সাথে যোগাযোগ করুন।`
        );
        return;
      }
    }

    // ৩. সব ঠিক থাকলে লগইন প্রসেস চলবে
    handleLogin(e);
  };

  return (
    <div className="max-w-md mx-auto py-20 relative px-4 font-['Hind_Siliguri']">
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="absolute top-8 left-4 flex items-center space-x-2 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-indigo-600 transition-colors group"
      >
        <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>{t('back')}</span>
      </button>

      <div className="bg-white p-10 rounded-[56px] shadow-2xl border border-slate-100 text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-100 rotate-3">
           <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-4.514A9.01 9.01 0 0012 21a9.003 9.003 0 008.39-5.5m-1.39-1.5a4.001 4.001 0 00-7.79 0" />
           </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('teacherLogin')}</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Select your profile to continue</p>
        </div>

        <form onSubmit={onLoginAttempt} className="space-y-6 text-left">
          {/* Teacher Selection List */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">{t('selectTeacher')}</label>
            <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {teachers.length === 0 ? (
                <div className="p-5 rounded-2xl bg-red-50 text-red-500 text-xs font-bold text-center border-2 border-dashed border-red-100">
                  No registered teachers found!
                </div>
              ) : (
                teachers.map(tchr => {
                  const isExpired = tchr.expiryDate ? new Date() > new Date(tchr.expiryDate) : false;
                  const isFrozen = tchr.isFrozen;
                  
                  return (
                    <button 
                      key={tchr.id} 
                      type="button" 
                      onClick={() => { setActiveTeacher(tchr); setPinInput(''); setErrorMessage(null); }} 
                      className={`p-4 rounded-[24px] border-2 text-left transition-all flex items-center justify-between gap-4 ${activeTeacher?.id === tchr.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 hover:border-indigo-100 bg-slate-50/50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isFrozen || isExpired ? 'bg-red-100 text-red-500' : (activeTeacher?.id === tchr.id ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border')}`}>
                          {tchr.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{tchr.name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase">{tchr.email || 'No Email'}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {isFrozen && (
                          <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-1 rounded-lg">FROZEN</span>
                        )}
                        {isExpired && (
                          <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-1 rounded-lg">EXPIRED</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* PIN Input Section */}
          {activeTeacher && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">{t('enterPin')}</label>
              <input 
                type="password" 
                maxLength={6} 
                placeholder="••••" 
                className="w-full p-5 border-2 rounded-[24px] text-center text-3xl tracking-[0.8em] outline-none border-slate-50 bg-slate-50 font-black focus:border-indigo-200 focus:bg-white transition-all" 
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value)} 
                required 
                autoFocus
              />
              
              {/* Error & Info Messages */}
              {loginError && !errorMessage && (
                <p className="text-red-500 text-[10px] mt-4 font-black text-center uppercase tracking-widest animate-pulse">
                  {t('invalidPin')}
                </p>
              )}
              
              {errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-[11px] font-bold text-center leading-relaxed animate-in fade-in zoom-in">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale" 
            disabled={!activeTeacher || !pinInput}
          >
            {t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};
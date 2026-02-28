import React, { useState } from 'react';
import { UserRole } from '../types';
import { useApp } from '../store';
import { QuestionExplorer } from './QuestionExplorer';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
  onSecretClick: () => void;
  totalQuestions?: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onSelectRole, 
  onSecretClick,
  totalQuestions = 0
}) => {
  const { t, language } = useApp();
  const [showExplorer, setShowExplorer] = useState(false);

  const mainPortals = [
    {
      role: 'STUDENT' as UserRole,
      title: t('student'),
      desc: t('studentDesc'),
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      ),
      color: "bg-orange-500",
      accent: "text-orange-500",
      bgLight: "bg-orange-50",
      shadow: "shadow-orange-200"
    },
    {
      role: 'TEACHER' as UserRole,
      title: t('teacher'),
      desc: t('teacherDesc'),
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "bg-indigo-600",
      accent: "text-indigo-600",
      bgLight: "bg-indigo-50",
      shadow: "shadow-indigo-200"
    }
  ];

  return (
    <div className="relative font-['Hind_Siliguri'] pb-20">
      
      {/* 1. Admin Secret Button */}
      <div className="flex justify-center mb-6 pt-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div 
          onClick={onSecretClick}
          className="group flex items-center space-x-2 px-6 py-2 bg-transparent hover:bg-slate-100 text-transparent hover:text-slate-400 rounded-full transition-all cursor-default select-none"
        >
          <span className="text-[10px] font-black uppercase tracking-[4px]">Admin Access</span>
        </div>
      </div>

      {/* 2. Hero Header */}
      <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 px-4">
        <h2 
          className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight max-w-4xl mx-auto tracking-tight cursor-default select-none"
          onClick={onSecretClick}
        >
          {t('welcomeTitle')}
        </h2>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
          {t('welcomeSub')}
        </p>
      </div>

      {/* 3. Centralized Question Bank Access */}
      <div className="max-w-4xl mx-auto mb-16 px-4 flex flex-col items-center">
        <button 
          onClick={() => setShowExplorer(true)}
          className="group relative flex items-center gap-4 bg-white border-2 border-indigo-600 text-indigo-600 px-12 py-6 rounded-[35px] font-black text-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 animate-in zoom-in duration-700 delay-300"
        >
          <div className="flex flex-col items-start leading-none">
            <span className="text-xs uppercase tracking-[3px] mb-1 opacity-60">Question Bank</span>
            <span>{language === 'bn' ? 'প্রশ্ন ব্যাংক এক্সপ্লোর করুন' : 'Explore All Questions'}</span>
          </div>
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-white/20 group-hover:text-white transition-all">
            📚
          </div>
          {/* Badge for total questions */}
          <div className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white">
            {totalQuestions} +
          </div>
        </button>
      </div>

      {/* 4. Portal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto px-4">
        {mainPortals.map((f, i) => (
          <div 
            key={f.role}
            className="group relative bg-white p-10 md:p-12 rounded-[48px] shadow-xl hover:shadow-2xl border border-slate-100 transition-all duration-500 hover:-translate-y-3 cursor-pointer overflow-hidden flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8"
            style={{ animationDelay: `${(i + 1) * 200}ms`, animationFillMode: 'both' }}
            onClick={() => onSelectRole(f.role)}
          >
            <div className={`absolute -top-10 -right-10 w-48 h-48 ${f.bgLight} rounded-full -z-0 blur-2xl opacity-50 transition-all group-hover:scale-150`}></div>

            <div className={`relative z-10 w-24 h-24 ${f.color} text-white rounded-[32px] flex items-center justify-center shadow-2xl ${f.shadow} mb-10 rotate-3 group-hover:rotate-0 transition-all duration-500`}>
              {f.icon}
            </div>

            <h3 className="relative z-10 text-3xl font-black text-slate-900 mb-6 tracking-tight uppercase">
              {f.title}
            </h3>
            
            <p className="relative z-10 text-slate-500 text-base leading-relaxed mb-10 font-medium">
              {f.desc}
            </p>

            <button className={`relative z-10 mt-auto px-12 py-5 rounded-2xl font-black text-lg transition-all shadow-xl ${f.shadow} group-hover:scale-105 active:scale-95 ${f.color} text-white uppercase tracking-wider`}>
              {language === 'bn' ? 'প্রবেশ করুন' : 'Enter Portal'}
            </button>
            
            <div className={`absolute bottom-0 left-0 right-0 h-2 ${f.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center text-slate-300 font-bold text-[10px] uppercase tracking-[5px] opacity-50">
        © 2026 EduQuiz Pro • Smart Assessment
      </div>

      {/* Popups */}
      {showExplorer && <QuestionExplorer onClose={() => setShowExplorer(false)} />}
      
    </div>
  );
};

export default LandingPage;
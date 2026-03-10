import React from 'react';
import { UserRole } from '../types';
import { useApp } from '../store';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole | null;
  onGoHome: () => void;
  onOpenBank: () => void;
  isBankOpen: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, role, onGoHome, onOpenBank, isBankOpen }) => {
  // ✅ store থেকে impersonatedUser এবং setImpersonatedUser আনা হলো
  const { language, setLanguage, t, impersonatedUser, setImpersonatedUser } = useApp();

  const handleInternalGoHome = () => {
    onGoHome();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* ✅ ১. অ্যাডমিন ইম্পারসোনেশন নোটিশ বার (শুধুমাত্র যখন অ্যাডমিন অন্য প্রোফাইলে থাকবে) */}
      {impersonatedUser && (
        <div className="bg-rose-600 text-white px-4 py-2 flex justify-between items-center sticky top-0 z-[60] shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full justify-between px-4">
             <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">
                  {language === 'bn' ? 'অ্যাডমিন ভিউ: আপনি এখন দেখছেন - ' : 'Admin View: Impersonating - '} 
                  <span className="underline decoration-2 underline-offset-4 ml-1">{impersonatedUser.name}</span>
                </p>
             </div>
             
             <button 
                onClick={() => setImpersonatedUser(null)}
                className="bg-white text-rose-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-rose-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
                {language === 'bn' ? 'অ্যাডমিন প্যানেলে ফিরুন' : 'Back to Admin'}
              </button>
          </div>
        </div>
      )}

      {/* Header / Navigation */}
      <header className={`bg-white border-b border-slate-200 sticky z-50 ${impersonatedUser ? 'top-[44px]' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={handleInternalGoHome}
            title="Return to Home"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform">
              <span className="text-white font-black text-xl">E</span>
            </div>
            <div>
              <h1 className="font-black text-slate-800 text-lg leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                EduQuiz <span className="text-indigo-600">Pro</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Smart Assessment
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Explicit Home Button */}
            {(role || isBankOpen || impersonatedUser) && (
              <button 
                onClick={handleInternalGoHome}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>{t('home')}</span>
              </button>
            )}

            {/* Question Bank Access */}
            <button 
              onClick={onOpenBank}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border ${
                isBankOpen 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span className="hidden sm:inline">{t('questionBank')}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setLanguage('bn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  language === 'bn' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                বাং
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} EduQuiz Pro • Built for Excellence
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

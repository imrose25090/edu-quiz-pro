import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: (pass: string) => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleAction = () => {
    if (password.trim() === "") {
      setError(true);
      return;
    }
    onLogin(password);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAction();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300 font-['Hind_Siliguri']">
      <div className="max-w-md w-full bg-white p-10 md:p-14 rounded-[50px] shadow-2xl border border-white/20 relative overflow-hidden animate-in zoom-in duration-300">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10 space-y-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-[30px] shadow-2xl shadow-indigo-200 animate-bounce">
            <span className="text-4xl text-white">🔐</span>
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Admin Vault</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[4px]">সিক্রেট প্যানেলে প্রবেশের চাবিকাঠি দিন</p>
          </div>
          <div className="space-y-6">
            <input 
              autoFocus
              type="password" 
              placeholder="••••••••" 
              className={`w-full p-6 bg-slate-50 border-2 rounded-[28px] font-black outline-none text-center text-3xl tracking-[12px] transition-all
                ${error ? 'border-red-400' : 'border-slate-100 focus:border-indigo-500 focus:bg-white'}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={handleKeyDown}
            />
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleAction}
                className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black uppercase text-xs tracking-[3px] shadow-xl hover:bg-slate-900 transition-all active:scale-95"
              >
                Access Dashboard
              </button>
              <button 
                onClick={onCancel}
                className="w-full py-4 text-slate-400 font-black uppercase text-[9px] tracking-[2px] hover:text-red-500 transition-colors"
              >
                Go Back Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
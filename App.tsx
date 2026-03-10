import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from "./store"; 
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/admin/AdminLogin";
import AdminPanel from "./components/admin/AdminPanel";
import TeacherPanel from "./components/TeacherPanel"; 
import StudentPanel from "./components/StudentPanel"; 
import { UserRole } from "./types";

import { db } from "./firebase"; 
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

const MainContent: React.FC = () => {
  const [currentRole,        setCurrentRole]        = useState<UserRole | null>(null);
  const [isAdminLoggedIn,    setIsAdminLoggedIn]    = useState(false);
  const [isSecretAdminMode,  setIsSecretAdminMode]  = useState(false);
  const [adminClickCount,    setAdminClickCount]    = useState(0);

  const [students,        setStudents]        = useState<any[]>([]);
  const [teachers,        setTeachers]        = useState<any[]>([]);
  const [loggedInStudent, setLoggedInStudent] = useState<any | null>(null);
  const [loggedInTeacher, setLoggedInTeacher] = useState<any | null>(null);

  const {
    loading, language, setLanguage, questions, classes, subjects,
    impersonatedUser, setImpersonatedUser
  } = useApp();

  useEffect(() => {
    const unsubStudents = onSnapshot(
      query(collection(db, "students"), orderBy("createdAt", "desc")),
      snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubTeachers = onSnapshot(
      query(collection(db, "teachers"), orderBy("createdAt", "desc")),
      snap => setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubStudents(); unsubTeachers(); };
  }, []);

  const handleLogout = () => {
    setCurrentRole(null);
    setIsAdminLoggedIn(false);
    setIsSecretAdminMode(false);
    setLoggedInStudent(null);
    setLoggedInTeacher(null);
    setAdminClickCount(0);
    setImpersonatedUser(null);
  };

  const handleAdminLogin = (pass: string) => {
    if (pass === "admin789") {
      setIsAdminLoggedIn(true);
    } else {
      alert(language === 'bn' ? "ভুল পাসওয়ার্ড!" : "Wrong Password!");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-xl" />
        <p className="font-black text-slate-500 text-[10px] uppercase tracking-[0.3em]">
          {language === 'bn' ? 'সিস্টেম লোড হচ্ছে...' : 'Initializing System...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri'] selection:bg-indigo-100">

      {/* ── Admin impersonation banner ─────────────────────── */}
      {impersonatedUser && (
        <div className="bg-rose-600 text-white px-6 py-3 flex justify-between items-center sticky top-0 z-[100] shadow-2xl border-b border-white/20 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <p className="text-[11px] font-black uppercase tracking-widest">
              {language === 'bn' ? 'অ্যাডমিন ভিউ: আপনি এখন আছেন - ' : 'Admin View: Impersonating - '}
              <span className="bg-white text-rose-600 px-2 py-0.5 rounded ml-1 font-black">{impersonatedUser.name}</span>
            </p>
          </div>
          <button
            onClick={() => setImpersonatedUser(null)}
            className="bg-white text-rose-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            {language === 'bn' ? 'অ্যাডমিন প্যানেলে ফিরুন' : 'Back to Admin'}
          </button>
        </div>
      )}

      {/* ── Navbar (impersonation mode এ hide) ──────────────── */}
      {!impersonatedUser && (
        <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div onClick={handleLogout} className="flex items-center space-x-4 cursor-pointer group select-none">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg transform group-hover:rotate-6 transition-transform">E</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tighter">
                EduQuiz <span className="text-indigo-600">Pro</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Smart Assessment System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setLanguage('bn')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'bn' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>বাং</button>
            <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
          </div>
        </nav>
      )}

      <main className="animate-in fade-in duration-1000">

        {/* ১. Impersonation — admin directly student/teacher account এ */}
        {impersonatedUser && impersonatedUser.role === 'teacher' && (
          <TeacherPanel
            onBack={() => setImpersonatedUser(null)}
            loggedInTeacher={impersonatedUser}
          />
        )}
        {impersonatedUser && impersonatedUser.role === 'student' && (
          <StudentPanel
            onBack={() => setImpersonatedUser(null)}
            students={students}
            loggedInStudent={impersonatedUser}
          />
        )}

        {/* ২. Landing page */}
        {!impersonatedUser && !currentRole && !isSecretAdminMode && !isAdminLoggedIn && !loggedInStudent && !loggedInTeacher && (
          <LandingPage
            onSelectRole={setCurrentRole}
            onSecretClick={() => setAdminClickCount(p => {
              if (p + 1 >= 4) { setIsSecretAdminMode(true); return 0; }
              return p + 1;
            })}
            totalQuestions={questions.length}
            totalClasses={classes?.length || 0}
            totalSubjects={subjects?.length || 0}
          />
        )}

        {/* ৩. Admin login & panel */}
        {!impersonatedUser && isSecretAdminMode && !isAdminLoggedIn && (
          <AdminLogin onLogin={handleAdminLogin} onCancel={() => setIsSecretAdminMode(false)} />
        )}
        {!impersonatedUser && isAdminLoggedIn && (
          <AdminPanel onBack={handleLogout} />
        )}

        {/* ৪. Teacher login & panel */}
        {!impersonatedUser && !isAdminLoggedIn && (currentRole === UserRole.TEACHER || loggedInTeacher) && (
          <TeacherPanel
            onBack={handleLogout}
            loggedInTeacher={loggedInTeacher}
            onLoginSuccess={(teacher) => setLoggedInTeacher(teacher)}
          />
        )}

        {/* ৫. Student login & panel */}
        {!impersonatedUser && !isAdminLoggedIn && (currentRole === UserRole.STUDENT || loggedInStudent) && (
          <StudentPanel
            onBack={handleLogout}
            students={students}
            loggedInStudent={loggedInStudent}
            onRegister={async (name, pass) => {
              await addDoc(collection(db, "students"), {
                name, password: pass, role: 'student',
                createdAt: serverTimestamp(),
                isFrozen: false, totalPoints: 0, quizzesPlayed: 0
              });
            }}
            onStudentLogin={(name, pass) => {
              const s = students.find(s => s.name === name && s.password === pass);
              if (s && !s.isFrozen) { setLoggedInStudent(s); return true; }
              return false;
            }}
          />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <MainContent />
  </AppProvider>
);

export default App;

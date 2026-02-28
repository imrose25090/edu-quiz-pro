import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from "./store"; 
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/admin/AdminLogin";
import AdminPanel from "./components/admin/AdminPanel";
import TeacherPanel from "./components/TeacherPanel"; 
import StudentPanel from "./components/StudentPanel"; 
import { UserRole } from "./types";

// Firebase Imports
import { db } from "./firebase"; 
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

const MainContent: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isSecretAdminMode, setIsSecretAdminMode] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);

  // --- Auth States ---
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]); 
  const [loggedInStudent, setLoggedInStudent] = useState<any | null>(null); 
  const [loggedInTeacher, setLoggedInTeacher] = useState<any | null>(null); 
  
  const { loading, language, setLanguage, questions, classes, subjects } = useApp();

  // Firebase থেকে ডাটা ফেচ
  useEffect(() => {
    const qStudents = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    });

    const qTeachers = query(collection(db, "teachers"), orderBy("createdAt", "desc"));
    const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(data);
    });

    return () => {
      unsubStudents();
      unsubTeachers();
    };
  }, []);

  // ✅ লোগো ক্লিকের জন্য নতুন এবং শক্তিশালী ফাংশন
  const handleLogoClick = () => {
    // যদি কেউ লগইন অবস্থায় থাকে, তবে তাকে জিজ্ঞেস করা যেতে পারে। 
    // অথবা সরাসরি হোম পেজে পাঠাতে চাইলে নিচের লজিকটি ব্যবহার করুন:
    handleLogout(); // এটি সব স্টেট ক্লিয়ার করে ল্যান্ডিং পেজে নিয়ে যাবে
    handleSecretAdminTrigger(); // সিক্রেট ক্লিকের কাউন্ট বজায় রাখবে
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setIsAdminLoggedIn(false);
    setIsSecretAdminMode(false);
    setLoggedInStudent(null); 
    setLoggedInTeacher(null);
    setAdminClickCount(0);
  };

  const handleSecretAdminTrigger = () => {
    setAdminClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 4) {
        setIsSecretAdminMode(true);
        return 0;
      }
      return newCount;
    });

    const timer = setTimeout(() => {
      setAdminClickCount(0);
    }, 3000);
    return () => clearTimeout(timer);
  };

  const handleAdminLogin = (pass: string) => {
    if (pass === "admin789") { 
      setIsAdminLoggedIn(true);
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  };

  // --- Student & Teacher Logic ---
  const handleStudentRegister = async (name: string, pass: string) => {
    try {
      const exists = students.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (exists) { alert("এই নামে অলরেডি অ্যাকাউন্ট আছে!"); return; }
      await addDoc(collection(db, "students"), {
        name, password: pass, createdAt: serverTimestamp(), role: 'student', isFrozen: false
      });
      alert("অ্যাকাউন্ট তৈরি হয়েছে!");
    } catch (error) { alert("রেজিস্ট্রেশন ব্যর্থ হয়েছে।"); }
  };

  const handleStudentLoginValidation = (name: string, pass: string) => {
    const student = students.find(s => s.name === name && s.password === pass);
    if (student) {
      if (student.isFrozen) { alert("অ্যাকাউন্ট ফ্রিজ করা হয়েছে।"); return false; }
      setLoggedInStudent(student);
      setCurrentRole(UserRole.STUDENT);
      return true;
    }
    alert("ভুল নাম বা পাসওয়ার্ড!");
    return false;
  };

  const handleTeacherLoginValidation = (email: string, pass: string) => {
    const teacher = teachers.find(t => t.email === email && t.password === pass);
    if (teacher) {
      if (teacher.isFrozen) { alert("অ্যাকাউন্ট স্থগিত করা হয়েছে।"); return false; }
      setLoggedInTeacher(teacher);
      setCurrentRole(UserRole.TEACHER);
      return true;
    }
    alert("ভুল ইমেইল বা পাসওয়ার্ড!");
    return false;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold text-slate-500 text-xs">লোড হচ্ছে...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri']">
      {/* --- Navbar Section --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
        <div 
          onClick={handleLogoClick} // ✅ এখানে handleLogoClick ব্যবহার করা হয়েছে
          className="flex items-center space-x-4 cursor-pointer group select-none"
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg transform group-hover:rotate-6 transition-transform">E</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tighter">
              EduQuiz <span className="text-blue-600">Pro</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Smart Assessment System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setLanguage('bn')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'bn' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>বাং</button>
          <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
        </div>
      </nav>

      <main className="animate-in fade-in duration-700">
        {/* ল্যান্ডিং পেজ কন্ডিশন */}
        {!currentRole && !isSecretAdminMode && !isAdminLoggedIn && !loggedInStudent && !loggedInTeacher && (
          <LandingPage 
            onSelectRole={setCurrentRole} 
            onSecretClick={handleSecretAdminTrigger}
            totalQuestions={questions?.length || 0}
            totalClasses={classes?.length || 0}
            totalSubjects={subjects?.length || 0}
          />
        )}

        {/* অন্যান্য প্যানেল রেন্ডারিং */}
        {isSecretAdminMode && !isAdminLoggedIn && (
          <AdminLogin onLogin={handleAdminLogin} onCancel={() => setIsSecretAdminMode(false)} />
        )}

        {isAdminLoggedIn && <AdminPanel onBack={handleLogout} />}

        {(currentRole === UserRole.TEACHER || loggedInTeacher) && !isAdminLoggedIn && (
          <TeacherPanel 
            onBack={handleLogout}
            teachers={teachers}
            onTeacherLogin={handleTeacherLoginValidation}
            loggedInTeacher={loggedInTeacher}
          />
        )}

        {(currentRole === UserRole.STUDENT || loggedInStudent) && !isAdminLoggedIn && (
          <StudentPanel 
            onBack={handleLogout}
            students={students}
            onRegister={handleStudentRegister}
            onStudentLogin={handleStudentLoginValidation}
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
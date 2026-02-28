import React, { useRef } from 'react';
// পাথ নিশ্চিত করুন: যদি এই ফাইলটি src/components/admin এ থাকে, 
// তবে firebase.ts ফাইলটি src/ এ থাকলে পাথ হবে "../../firebase"
import { db } from "../../firebase"; 
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

interface SystemSettingsProps {
  onReset?: () => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ১. ফায়ারবেস থেকে সব ডাটা ডাউনলোড (Backup)
  const handleBackup = async () => {
    try {
      const collections = ['classes', 'subjects', 'chapters', 'questions', 'teachers', 'quizzes', 'formats'];
      const backupData: any = { 
        v: "1.2", 
        date: new Date().toISOString(),
        source: "EduQuiz Pro Cloud Backup"
      };

      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        backupData[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eduquiz_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log("Backup Successful");
    } catch (err) {
      alert("ব্যাকআপ নিতে সমস্যা হয়েছে! কনসোল চেক করুন।");
      console.error(err);
    }
  };

  // ২. ফায়ারবেসে ডাটা আপলোড (Restore)
  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // ডাটা ভ্যালিডেশন চেক
        if (!data.classes && !data.subjects) {
          throw new Error("Invalid backup file format");
        }

        if (!window.confirm("সতর্কবার্তা: রিস্টোর করলে ক্লাউডের বর্তমান ডাটা রিপ্লেস বা ওভাররাইট হবে। আপনি কি নিশ্চিত?")) return;

        const collections = ['classes', 'subjects', 'chapters', 'questions', 'teachers', 'quizzes', 'formats'];
        
        for (const colName of collections) {
          const items = data[colName] || [];
          if (items.length > 0) {
            const batch = writeBatch(db);
            
            items.forEach((item: any) => {
              const { id, ...rest } = item;
              // আগের আইডি থাকলে সেটিই ব্যবহার হবে (Relational Integrity রক্ষার জন্য)
              const docRef = doc(db, colName, id);
              batch.set(docRef, rest);
            });
            
            await batch.commit();
          }
        }

        alert("সব ডাটা সফলভাবে ক্লাউডে রিস্টোর করা হয়েছে!");
        window.location.reload();
      } catch (err) {
        alert("রিস্টোর ব্যর্থ! ফাইলটি সঠিক কি না নিশ্চিত করুন।");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto font-['Hind_Siliguri']">
      
      {/* Backup Card */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">☁️</div>
        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-slate-800">Cloud Backup</h3>
        <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-[0.2em] leading-relaxed">
          Export all Firebase collections to a single JSON file for safety.
        </p>
        <button 
          onClick={handleBackup} 
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          Download JSON
        </button>
      </div>

      {/* Restore Card */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:border-emerald-200 transition-all">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🚀</div>
        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-slate-800">Cloud Restore</h3>
        <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-[0.2em] leading-relaxed">
          Upload a JSON backup to overwrite current Firebase database.
        </p>
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          onChange={handleRestore} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-emerald-100 active:scale-95"
        >
          Upload Backup
        </button>
      </div>

      {/* Reset Section */}
      <div className="md:col-span-2 bg-rose-50 p-8 rounded-[40px] border border-rose-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h4 className="font-black text-rose-600 uppercase italic flex items-center gap-2">
            <span className="text-xl">⚠️</span> Master Reset
          </h4>
          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">
            Caution: This only resets the local UI state variables.
          </p>
        </div>
        <button 
          onClick={onReset} 
          className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-black transition-all shadow-lg shadow-rose-200 active:scale-95"
        >
          Reset UI State
        </button>
      </div>

    </div>
  );
};
export default SystemSettings;
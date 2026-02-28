import React, { useState, useMemo, useEffect } from 'react';
import { db } from "../../firebase"; 
import { collection, getDocs } from "firebase/firestore";
import { Class, Subject, Chapter, Question } from '../../types';

interface BulkEditorProps {
  activeTab: string;
  inputText: string;
  setInputText: (val: string) => void;
  selectedClassId: string;
  setSelectedClassId: (val: string) => void;
  selectedSubjectId: string;
  setSelectedSubjectId: (val: string) => void;
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  qSettings: any;
  setQSettings: (val: any) => void;
  handleBulkAdd: (requiresInput: boolean) => void; // ✅ এখানে পরিবর্তন করা হয়েছে
  handleDeleteQuestion: (id: string) => void;
  copyFeedback: boolean;
  setCopyFeedback: (val: boolean) => void;
  t: (key: string) => string;
}

export const BulkEditor: React.FC<BulkEditorProps> = ({
  activeTab, inputText, setInputText, selectedClassId, setSelectedClassId,
  selectedSubjectId, setSelectedSubjectId, classes, subjects, chapters,
  questions = [], qSettings, setQSettings, handleBulkAdd, 
  handleDeleteQuestion, copyFeedback, setCopyFeedback, t
}) => {
  
  const [adminDefinedTypes, setAdminDefinedTypes] = useState<any[]>([]);

  // ফায়ারবেস থেকে ফরম্যাট লোড
  useEffect(() => {
    const fetchFormats = async () => {
      try {
        // প্রথমে লোকাল স্টোরেজ চেক করা হচ্ছে (FormatSettings থেকে ডাটা পাওয়ার জন্য)
        const savedFormats = localStorage.getItem('quiz_formats');
        if (savedFormats) {
           setAdminDefinedTypes(JSON.parse(savedFormats));
           return;
        }

        // লোকাল না থাকলে ফায়ারবেস থেকে আনবে
        const querySnapshot = await getDocs(collection(db, "formats"));
        const formatsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (formatsData.length > 0) {
          setAdminDefinedTypes(formatsData);
        } else {
          const defaultTypes = [
            { id: '1', name: 'Multiple Choice', type: 'MCQ', format: 'Question | Op1 | Op2 | Op3 | Op4 | Answer', requiresInput: false },
            { id: '2', name: 'True/False', type: 'TF', format: 'Question | Answer', requiresInput: false },
            { id: '3', name: 'Short Answer', type: 'SHORT_ANSWER', format: 'Question | Answer', requiresInput: true }
          ];
          setAdminDefinedTypes(defaultTypes);
        }
      } catch (err) {
        console.error("Formats load error:", err);
      }
    };

    fetchFormats();
  }, [activeTab]);

  // ডিফল্ট টাইপ সেট করা
  useEffect(() => {
    if (activeTab === 'QUESTIONS' && adminDefinedTypes.length > 0 && !qSettings.type) {
      setQSettings({ ...qSettings, type: adminDefinedTypes[0].type });
    }
  }, [adminDefinedTypes, activeTab, qSettings, setQSettings]);

  // বর্তমানে সিলেক্ট করা টাইপ অবজেক্টটি বের করা
  const currentTypeObj = useMemo(() => {
    return adminDefinedTypes.find(t => t.type === qSettings.type);
  }, [qSettings.type, adminDefinedTypes]);

  const activeFormat = currentTypeObj?.format || null;

  // ফিল্টারিং লজিক
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => 
      q.classId === selectedClassId &&
      q.subjectId === selectedSubjectId &&
      q.chapterId === qSettings.chapterId &&
      q.type === qSettings.type
    );
  }, [questions, selectedClassId, selectedSubjectId, qSettings.chapterId, qSettings.type]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-['Hind_Siliguri']">
      
      {/* বাম পাশ: ইনপুট এবং সিলেকশন প্যানেল */}
      <div className="w-full lg:w-1/3 bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-black text-slate-800 uppercase italic">Add Questions</h3>
          {copyFeedback && (
            <span className="text-[10px] font-black text-emerald-500 animate-pulse">SUCCESSFULLY ADDED!</span>
          )}
        </div>
        
        <div className="space-y-3">
          <select 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
            value={selectedSubjectId} 
            onChange={e => setSelectedSubjectId(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjects.filter(s => s.classId === selectedClassId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
            value={qSettings.chapterId} 
            onChange={e => setQSettings({...qSettings, chapterId: e.target.value})}
          >
            <option value="">Select Chapter</option>
            {chapters.filter(ch => ch.subjectId === selectedSubjectId).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
          </select>

          <div className="pt-2">
            <label className="text-[10px] font-black text-indigo-500 ml-2 uppercase tracking-widest">Question Type</label>
            <select 
              className="w-full p-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg cursor-pointer outline-none mt-1 hover:bg-black transition-all" 
              value={qSettings.type} 
              onChange={e => setQSettings({...qSettings, type: e.target.value})}
            >
              {adminDefinedTypes.map(t => <option key={t.id || t.type} value={t.type}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {activeFormat && (
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner">
             <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-black text-indigo-400 uppercase italic">Required Format:</p>
                {currentTypeObj?.requiresInput && (
                  <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black animate-bounce">INPUT MODE</span>
                )}
             </div>
             <code className="text-[11px] font-mono text-indigo-700 font-bold block break-all leading-relaxed">
               {activeFormat}
             </code>
          </div>
        )}

        <textarea 
          className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] h-48 outline-none font-bold text-xs shadow-inner focus:bg-white focus:border-indigo-500 transition-all resize-none" 
          value={inputText} 
          onChange={e => setInputText(e.target.value)} 
          placeholder="Paste your questions here using the format above..." 
        />
        
        <button 
          onClick={() => handleBulkAdd(currentTypeObj?.requiresInput || false)} 
          disabled={!inputText.trim() || !qSettings.chapterId || !qSettings.type}
          className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-20 flex justify-center items-center gap-2"
        >
          <span>📥 ADD TO REGISTRY</span>
        </button>
      </div>

      {/* প্রিভিউ প্যানেল আগের মতোই থাকবে */}
      <div className="w-full lg:w-2/3 bg-slate-50/50 p-6 rounded-[32px] border border-slate-200 flex flex-col">
        {/* ... (বাকি প্রিভিউ কোড আপনার আগের মতোই থাকবে) */}
      </div>
    </div>
  );
};
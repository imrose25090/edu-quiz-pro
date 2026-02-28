import React, { useState } from 'react';
import { useApp } from '../store';
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// সাব-কম্পোনেন্ট ইমপোর্ট - পাথ নিশ্চিত করা হয়েছে (যদি AdminPanel 'admin' ফোল্ডারের বাইরে থাকে)
import { AdminTabs } from './admin/AdminTabs';
import { ClassManager } from './admin/ClassManager';
import { SubjectManager } from './admin/SubjectManager';
import { ChapterManager } from './admin/ChapterManager';
import { QuestionManager } from './admin/QuestionManager';
import { FormatSettings } from './admin/FormatSettings';
import { TeacherManagement } from './admin/TeacherManagement';
import { SystemSettings } from './admin/SystemSettings';
import { PassageModal } from './admin/PassageModal';
import { MasterRegistry } from './admin/MasterRegistry'; 

const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const store = useApp();
  
  const [activeTab, setActiveTab] = useState('CLASSES');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [editingChapterPassage, setEditingChapterPassage] = useState<string | null>(null);
  const [passageInput, setPassageInput] = useState('');

  const handleSavePassage = async () => {
    if (!editingChapterPassage) return;
    try {
      const chapterRef = doc(db, "chapters", editingChapterPassage);
      await updateDoc(chapterRef, {
        passageContent: passageInput,
        updatedAt: serverTimestamp()
      });
      if (store.updateChapter) {
        await store.updateChapter(editingChapterPassage, { passageContent: passageInput });
      }
      setEditingChapterPassage(null);
      setPassageInput('');
      alert("প্যাসেজ সফলভাবে সেভ হয়েছে!");
    } catch (error) {
      console.error("Error updating passage:", error);
      alert("প্যাসেজ সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const adminTabsList = [
    { id: 'CLASSES', label: 'Classes', icon: '🏫' },
    { id: 'SUBJECTS', label: 'Subjects', icon: '📚' },
    { id: 'CHAPTERS', label: 'Chapters', icon: '📖' },
    { id: 'TEACHERS', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'QUESTIONS', label: 'Questions', icon: '📝' },
    { id: 'REGISTRY', label: 'Registry', icon: '👥' }, 
    { id: 'FORMATS', label: 'Formats', icon: '📋' }, // Formats ট্যাব যুক্ত করা হলো
    { id: 'SYSTEM', label: 'System/Reports', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-2 md:p-8 font-['Hind_Siliguri'] pb-20 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center space-x-6 shrink-0">
            <button 
              onClick={onBack} 
              className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white border border-slate-100 font-black transition-all shadow-sm"
            >
              ←
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Admin Studio</h2>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Management Center</p>
            </div>
          </div>
          
          <AdminTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            tabs={adminTabsList} 
          />
        </div>

        {/* কন্টেন্ট এরিয়া */}
        <div className="mt-8 transition-all duration-300">
          {activeTab === 'CLASSES' && (
            <ClassManager 
              classes={store.classes} 
              bulkAdd={store.bulkAddClasses} 
              deleteItem={store.deleteClass} 
            />
          )}

          {activeTab === 'SUBJECTS' && (
            <SubjectManager 
              classes={store.classes} 
              subjects={store.subjects} 
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              bulkAdd={store.bulkAddSubjects} 
              deleteItem={store.deleteSubject}
            />
          )}

          {activeTab === 'CHAPTERS' && (
            <ChapterManager 
              classes={store.classes}
              subjects={store.subjects}
              chapters={store.chapters}
              selectedClassId={selectedClassId}
              selectedSubjectId={selectedSubjectId}
              setSelectedClassId={setSelectedClassId}
              setSelectedSubjectId={setSelectedSubjectId}
              bulkAdd={store.bulkAddChapters}
              deleteItem={store.deleteChapter}
              setEditingChapterPassage={(id: string) => {
                const ch = store.chapters.find(c => c.id === id);
                setEditingChapterPassage(id); 
                setPassageInput(ch?.passageContent || ''); 
              }}
              setPassageInput={setPassageInput}
            />
          )}

          {activeTab === 'QUESTIONS' && (
            <QuestionManager 
              classes={store.classes}
              subjects={store.subjects}
              chapters={store.chapters}
              questions={store.questions}
              bulkAdd={store.addBulkQuestions}
              deleteItem={store.deleteQuestion}
              deleteAllQuestions={store.deleteAllQuestions}
            />
          )}

          {activeTab === 'TEACHERS' && (
            <TeacherManagement 
               teachers={store.teachers} 
               bulkAddTeachers={store.bulkAddTeachers}
               deleteTeacher={store.deleteTeacher}
               updateTeacher={store.updateTeacher}
            />
          )}

          {activeTab === 'REGISTRY' && (
            <MasterRegistry 
              activeTab={activeTab}
              classes={store.classes}
              subjects={store.subjects}
              chapters={store.chapters}
              questions={store.questions}
              teachers={store.teachers}
              students={store.students || []}
              selectedClassId={selectedClassId}
              selectedSubjectId={selectedSubjectId}
              deleteClass={store.deleteClass}
              deleteSubject={store.deleteSubject}
              deleteChapter={store.deleteChapter}
              deleteQuestion={store.deleteQuestion}
              deleteTeacher={store.deleteTeacher}
              
              updateTeacher={store.updateTeacher}
              updateStudent={store.updateStudent} 
              deleteStudent={store.deleteStudent} 

              setEditingChapterPassage={setEditingChapterPassage}
              setPassageInput={setPassageInput}
              generateRandomPin={() => Math.floor(1000 + Math.random() * 9000).toString()}
            />
          )}

          {activeTab === 'FORMATS' && <FormatSettings />}

          {activeTab === 'SYSTEM' && (
            <SystemSettings 
              onReset={store.deleteAllQuestions} 
              quizzes={store.quizzes || []} 
            />
          )}
        </div>
      </div>

      {editingChapterPassage && (
        <PassageModal 
          passageInput={passageInput} 
          setPassageInput={setPassageInput} 
          onSave={handleSavePassage} 
          onCancel={() => setEditingChapterPassage(null)} 
        />
      )}
    </div>
  );
};

export default AdminPanel;
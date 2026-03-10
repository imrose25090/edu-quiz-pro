import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { db } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import AdminTabs from './AdminTabs';
import { ClassManager } from './ClassManager';
import SubjectManager from './SubjectManager';
import ChapterManager from './ChapterManager';
import QuestionManager from './QuestionManager';
import FormatSettings from './FormatSettings';
import TeacherManagement from './TeacherManagement';
import { SystemSettings } from './SystemSettings';
import PassageModal from './PassageModal';
import MasterRegistry from './MasterRegistry';

const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const store = useApp();

  const [activeTab,               setActiveTab]               = useState('CLASSES');
  const [selectedClassId,         setSelectedClassId]         = useState('');
  const [selectedSubjectId,       setSelectedSubjectId]       = useState('');
  const [editingChapterPassage,   setEditingChapterPassage]   = useState<string | null>(null);
  const [passageInput,            setPassageInput]            = useState('');

  const liveStudents = useMemo(() => store.students || [], [store.students]);
  const liveTeachers = useMemo(() => store.teachers || [], [store.teachers]);

  const orderedClasses = useMemo(() => {
    return [...(store.classes || [])].sort((a, b) => {
      const getTime = (o: any) => {
        if (!o.createdAt) return 0;
        if (o.createdAt.toMillis) return o.createdAt.toMillis();
        if (o.createdAt.seconds) return o.createdAt.seconds * 1000;
        return 0;
      };
      return getTime(a) - getTime(b);
    });
  }, [store.classes]);

  const handleSavePassage = async () => {
    if (!editingChapterPassage) return;
    try {
      await updateDoc(doc(db, "chapters", editingChapterPassage), {
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
      console.error("Error saving passage:", error);
      alert("প্যাসেজ সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const adminTabsList = [
    { id: 'CLASSES',   label: 'Classes',        icon: '🏫' },
    { id: 'SUBJECTS',  label: 'Subjects',        icon: '📚' },
    { id: 'CHAPTERS',  label: 'Chapters',        icon: '📖' },
    { id: 'TEACHERS',  label: 'Teachers',        icon: '👨‍🏫' },
    { id: 'QUESTIONS', label: 'Questions',       icon: '📝' },
    { id: 'REGISTRY',  label: 'Registry',        icon: '👥' },
    { id: 'FORMATS',   label: 'Formats',         icon: '📋' },
    { id: 'SYSTEM',    label: 'System/Reports',  icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-2 md:p-8 font-['Hind_Siliguri'] pb-20 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center space-x-6 shrink-0">
            <button onClick={onBack}
              className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white border border-slate-100 font-black transition-all shadow-sm">
              ←
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Admin Studio</h2>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Management Center</p>
            </div>
          </div>
          <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={adminTabsList} />
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          {activeTab === 'CLASSES' && (
            <ClassManager
              classes={orderedClasses}
              bulkAdd={store.bulkAddClasses}
              deleteItem={store.deleteClass}
              bulkDelete={store.bulkDelete}
            />
          )}

          {activeTab === 'SUBJECTS' && (
            // ✅ FIX: SubjectManager uses addSubject prop (not bulkAdd/deleteItem)
            <SubjectManager
              classes={orderedClasses}
              subjects={store.subjects}
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              addSubject={store.bulkAddSubjects}
              deleteSubject={store.deleteSubject}
              bulkDelete={store.bulkDelete}
            />
          )}

          {activeTab === 'CHAPTERS' && (
            <ChapterManager
              classes={orderedClasses}
              subjects={store.subjects}
              chapters={store.chapters}
              selectedClassId={selectedClassId}
              selectedSubjectId={selectedSubjectId}
              setSelectedClassId={setSelectedClassId}
              setSelectedSubjectId={setSelectedSubjectId}
              bulkAdd={store.bulkAddChapters}
              deleteItem={store.deleteChapter}
              bulkDelete={store.bulkDelete}
              setEditingChapterPassage={(id: string) => {
                const ch = store.chapters.find(c => c.id === id);
                setEditingChapterPassage(id);
                setPassageInput(ch?.passageContent || '');
              }}
              setPassageInput={setPassageInput}
            />
          )}

          {activeTab === 'QUESTIONS' && (
            // ✅ FIX: QuestionManager uses addBulkQuestions (not bulkAdd)
            <QuestionManager
              classes={orderedClasses}
              subjects={store.subjects}
              chapters={store.chapters}
              questions={store.questions}
              addBulkQuestions={store.addBulkQuestions}
              deleteQuestion={store.deleteQuestion}
              bulkDelete={store.bulkDelete}
              deleteAllQuestions={store.deleteAllQuestions}
            />
          )}

          {activeTab === 'TEACHERS' && (
            // ✅ FIX: TeacherManagement — onTeacherSelect optional
            <TeacherManagement
              teachers={liveTeachers}
              bulkAddTeachers={store.bulkAddTeachers}
              updateTeacher={store.updateTeacher}
              deleteTeacher={store.deleteTeacher}
              bulkDelete={store.bulkDelete}
            />
          )}

          {activeTab === 'REGISTRY' && (
            // ✅ FIX: MasterRegistry — correct props, no extra props it doesn't accept
            <MasterRegistry
              activeTab={activeTab}
              classes={orderedClasses}
              subjects={store.subjects}
              chapters={store.chapters}
              questions={store.questions}
              teachers={liveTeachers}
              students={liveStudents}
              selectedClassId={selectedClassId}
              selectedSubjectId={selectedSubjectId}
              deleteClass={store.deleteClass}
              deleteSubject={store.deleteSubject}
              deleteChapter={store.deleteChapter}
              deleteQuestion={store.deleteQuestion}
              deleteTeacher={store.deleteTeacher}
              deleteStudent={store.deleteStudent}
              updateTeacher={store.updateTeacher}
              updateStudent={store.updateStudent}
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

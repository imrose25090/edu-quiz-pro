import React, { useState, useMemo } from 'react';
import { useApp } from "../../store"; 

// সাব-কম্পোনেন্ট ইমপোর্ট
import AdminTabs from './AdminTabs';
import { ClassManager } from './ClassManager'; 
import SubjectManager from './SubjectManager'; 
import ChapterManager from './ChapterManager';
import QuestionManager from './QuestionManager';
import FormatSettings from './FormatSettings';
import TeacherManagement from './TeacherManagement';
import SystemSettings from './SystemSettings';
import PassageModal from './PassageModal';
import MasterRegistry from './MasterRegistry'; 

const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const store = useApp();

  const [activeTab, setActiveTab] = useState('CLASSES');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [editingChapterPassage, setEditingChapterPassage] = useState<string | null>(null);
  const [passageInput, setPassageInput] = useState('');

  // ✅ লাইভ স্টুডেন্ট কাউন্ট এবং ডাটা নিশ্চিত করা
  const liveStudents = useMemo(() => store.students || [], [store.students]);
  const liveTeachers = useMemo(() => store.teachers || [], [store.teachers]);

  // ✅ ক্লাসগুলোকে অর্ডার অনুযায়ী সাজানো
  const orderedClasses = useMemo(() => {
    return [...store.classes].sort((a, b) => {
      const idA = a.id || '';
      const idB = b.id || '';
      return idA.localeCompare(idB, undefined, { numeric: true });
    });
  }, [store.classes]);

  const tabs = [
    { id: 'CLASSES', label: 'Classes', icon: '🏫' },
    { id: 'SUBJECTS', label: 'Subjects', icon: '📚' },
    { id: 'CHAPTERS', label: 'Chapters', icon: '📖' },
    { id: 'TEACHERS', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'QUESTIONS', label: 'Questions', icon: '📝' },
    { id: 'REGISTRY', label: 'Registry', icon: '👥' }, 
    { id: 'FORMATS', label: 'Formats', icon: '📋' },
    { id: 'SYSTEM', label: 'System/Reports', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-['Hind_Siliguri'] pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center space-x-6">
            <button 
              onClick={onBack} 
              className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all font-black shadow-sm"
            >
              ←
            </button>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                EduQuiz <span className="text-blue-600 font-black">Pro</span>
              </h2>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">Management Center</p>
            </div>
          </div>
          
          <AdminTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            tabs={tabs} 
          />
        </div>

        {/* Dynamic Content Rendering */}
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
              setEditingChapterPassage={setEditingChapterPassage} 
              setPassageInput={setPassageInput} 
            />
          )}
          
          {activeTab === 'QUESTIONS' && (
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
            <TeacherManagement 
              teachers={liveTeachers} 
              bulkAddTeachers={store.bulkAddTeachers} 
              updateTeacher={store.updateTeacher} 
              deleteTeacher={store.deleteTeacher} 
              bulkDelete={store.bulkDelete} 
            />
          )}
          
          {(activeTab === 'REGISTRY' || activeTab === 'STUDENT') && (
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
          onSave={async () => { 
            if (store.updateChapter) await store.updateChapter(editingChapterPassage, { passageContent: passageInput });
            setEditingChapterPassage(null); 
          }} 
          onCancel={() => setEditingChapterPassage(null)} 
        />
      )}
    </div>
  );
};

export default AdminPanel;

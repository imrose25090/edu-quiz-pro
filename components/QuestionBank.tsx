
import React, { useState } from 'react';
import { useApp } from '../store';
import { QuestionType } from '../types';

interface QuestionBankProps {
  onBack: () => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ onBack }) => {
  const { classes, subjects, chapters, questions, t } = useApp();
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuestions = questions.filter(q => {
    const matchClass = !selectedClassId || q.classId === selectedClassId;
    const matchSubject = !selectedSubjectId || q.subjectId === selectedSubjectId;
    const matchChapter = !selectedChapterId || q.chapterId === selectedChapterId;
    const matchSearch = !searchQuery || q.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSubject && matchChapter && matchSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-indigo-600 font-black uppercase tracking-widest text-[10px] mb-2 hover:text-indigo-800 transition-colors group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{t('home')}</span>
          </button>
          <h2 className="text-3xl font-black text-slate-900">{t('questionBank')}</h2>
          <p className="text-slate-500 text-sm font-bold mt-1">Explore and browse our shared educational resources.</p>
        </div>
        
        <div className="flex-grow max-w-md relative">
          <input 
            type="text" 
            placeholder="Search questions..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('list')} Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">{t('selectClass')}</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                  value={selectedClassId}
                  onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(''); setSelectedChapterId(''); }}
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">{t('selectSubject')}</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                  value={selectedSubjectId}
                  onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedChapterId(''); }}
                  disabled={!selectedClassId}
                >
                  <option value="">All Subjects</option>
                  {subjects.filter(s => s.classId === selectedClassId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">{t('selectChapter')}</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  disabled={!selectedSubjectId}
                >
                  <option value="">All Chapters</option>
                  {chapters.filter(ch => ch.subjectId === selectedSubjectId).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {filteredQuestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredQuestions.map((q, i) => (
                <div key={q.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                       <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${q.type === QuestionType.MCQ ? 'bg-indigo-100 text-indigo-700' : q.type === QuestionType.TRUE_FALSE ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {q.type}
                      </span>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-tighter">
                        {subjects.find(s => s.id === q.subjectId)?.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Mark: {q.marks} • {q.timeLimit}s
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 leading-relaxed mb-4">{q.text}</h4>
                  
                  {/* Option display for MCQ and TRUE_FALSE */}
                  {(q.options && q.options.length > 0) || q.type === QuestionType.TRUE_FALSE ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {(q.type === QuestionType.TRUE_FALSE ? ['True', 'False'] : (q.options || [])).map((opt, idx) => {
                        const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                              isCorrect 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                              : 'bg-slate-50 border-slate-100 text-slate-600'
                            }`}
                          >
                            <span className={`opacity-40 ${isCorrect ? 'text-emerald-500' : ''}`}>
                                {q.type === QuestionType.TRUE_FALSE ? '•' : String.fromCharCode(65 + idx) + '.'}
                            </span>
                            <span>{opt}</span>
                            {isCorrect && (
                              <svg className="w-4 h-4 ml-auto text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className={`pt-4 border-t border-slate-100 flex items-center space-x-2 ${(!q.options || q.options.length === 0) && q.type !== QuestionType.TRUE_FALSE ? 'bg-emerald-50/30 -mx-8 px-8 py-4 mt-2' : ''}`}>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('correctAnswer')}:</span>
                    <span className="text-sm font-black text-slate-800">{q.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-20 rounded-[48px] border-2 border-dashed border-slate-200 text-center space-y-4">
              <div className="text-5xl">🔭</div>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">{t('noData')}</h3>
              <p className="text-slate-400 text-sm font-bold">Try changing filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;

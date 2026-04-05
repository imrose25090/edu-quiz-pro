import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt } from '../../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface StudentTranscriptModalProps {
  attempt: QuizAttempt;
  quiz: Quiz;
  onClose: () => void;
  getRankInfo: (att: QuizAttempt, q: Quiz) => { rank: number; total: number };
}

export const StudentTranscriptModal: React.FC<StudentTranscriptModalProps> = ({ 
  attempt, quiz, onClose, getRankInfo 
}) => {
  const rankData = getRankInfo(attempt, quiz);
  const totalPossibleMarks = Number(quiz.config?.totalMarks || quiz.questions.length);

  const [coachingName, setCoachingName] = useState(() => {
    return localStorage.getItem('coaching_name') || "MENTORA ACADEMY";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [randomQuote, setRandomQuote] = useState({ text: "", author: "" });

  useEffect(() => {
    const quotes = [
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },{ text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
{ text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
{ text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
{ text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
{ text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
{ text: "Intelligence plus character—that is the goal of true education.", author: "Martin Luther King Jr." },
{ text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
{ text: "Teachers can open the door, but you must enter it yourself.", author: "Chinese Proverb" },
{ text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
{ text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },

{ text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
{ text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
{ text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
{ text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
{ text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
{ text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
{ text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
{ text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
{ text: "Dream big and dare to fail.", author: "Norman Vaughan" },
{ text: "Action is the foundational key to all success.", author: "Pablo Picasso" },

{ text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
{ text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Oliver Goldsmith" },
{ text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
{ text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
{ text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
{ text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
{ text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
{ text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
{ text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
{ text: "Through perseverance, many people win success out of what seemed destined to be certain failure.", author: "Benjamin Disraeli" },

{ text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
{ text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
{ text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
{ text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
{ text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
{ text: "Happiness depends upon ourselves.", author: "Aristotle" },
{ text: "Life is 10% what happens to me and 90% of how I react to it.", author: "Charles Swindoll" },
{ text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
{ text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
{ text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },

{ text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" },
{ text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
{ text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
{ text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
{ text: "If your actions inspire others to dream more, learn more, do more and become more, you are a leader.", author: "John Quincy Adams" },
{ text: "A great leader's courage to fulfill his vision comes from passion, not position.", author: "John Maxwell" },
{ text: "The function of leadership is to produce more leaders, not more followers.", author: "Ralph Nader" },
{ text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
{ text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
{ text: "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.", author: "Ronald Reagan" },

{ text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
{ text: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
{ text: "The secret to creativity is knowing how to hide your sources.", author: "Albert Einstein" },
{ text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
{ text: "If you want something new, you must stop doing something old.", author: "Peter Drucker" },
{ text: "Logic will get you from A to B. Imagination will take you everywhere.", author: "Albert Einstein" },
{ text: "Everything imaginable is real.", author: "Pablo Picasso" },
{ text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki" },
{ text: "Creativity takes courage.", author: "Henri Matisse" },
{ text: "To have a great idea, have a lot of them.", author: "Thomas Edison" },

{ text: "Courage is grace under pressure.", author: "Ernest Hemingway" },
{ text: "Fortune favors the bold.", author: "Virgil" },
{ text: "He who is brave is free.", author: "Seneca" },
{ text: "It takes courage to grow up and become who you really are.", author: "E.E. Cummings" },
{ text: "Whatever you do, you need courage.", author: "Ralph Waldo Emerson" },
{ text: "The brave man is not he who does not feel afraid, but he who conquers that fear.", author: "Nelson Mandela" },
{ text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
{ text: "Courage is being scared to death, but saddling up anyway.", author: "John Wayne" },
{ text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin" },
{ text: "Courage is the first of human qualities because it is the quality which guarantees all others.", author: "Winston Churchill" },

{ text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
{ text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
{ text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
{ text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
{ text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
{ text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
{ text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
{ text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
{ text: "Quality is not an act, it is a habit.", author: "Aristotle" },
{ text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },

{ text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
{ text: "Kindness is a language which the deaf can hear and the blind can see.", author: "Mark Twain" },
{ text: "In a world where you can be anything, be kind.", author: "Unknown" },
{ text: "Love and kindness are never wasted.", author: "Barbara De Angelis" },
{ text: "We rise by lifting others.", author: "Robert Ingersoll" },
{ text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
{ text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
{ text: "Unexpected kindness is the most powerful, least costly, and most underrated agent of human change.", author: "Bob Kerrey" },
{ text: "What you do makes a difference, and you have to decide what kind of difference you want to make.", author: "Jane Goodall" },
{ text: "Constant kindness can accomplish much. As the sun makes ice melt, kindness causes misunderstanding, mistrust, and hostility to evaporate.", author: "Albert Schweitzer" },{ text: "My Lord, increase me in knowledge.", author: "Surah Taha 20:114" },
{ text: "Are those who know equal to those who do not know?", author: "Surah Az-Zumar 39:9" },
{ text: "He gives wisdom to whom He wills.", author: "Surah Al-Baqarah 2:269" },
{ text: "Read! Your Lord is the Most Generous.", author: "Surah Al-Alaq 96:3" },
{ text: "Indeed, in the creation of the heavens and the earth are signs for those of understanding.", author: "Surah Ali 'Imran 3:190" },
{ text: "Truth has come, and falsehood has departed.", author: "Surah Al-Isra 17:81" },
{ text: "Allah will exalt those who have believed and those who were given knowledge.", author: "Surah Al-Mujadila 58:11" },
{ text: "And He taught you that which you did not know.", author: "Surah An-Nisa 4:113" },
{ text: "Invite to the way of your Lord with wisdom and good instruction.", author: "Surah An-Nahl 16:125" },
{ text: "So ask the people of the message if you do not know.", author: "Surah An-Nahl 16:43" },

{ text: "Indeed, with hardship will be ease.", author: "Surah Ash-Sharh 94:6" },
{ text: "Indeed, Allah is with the patient.", author: "Surah Al-Baqarah 2:153" },
{ text: "O you who have believed, persevere and endure.", author: "Surah Ali 'Imran 3:200" },
{ text: "So be patient with a beautiful patience.", author: "Surah Al-Ma'arij 70:5" },
{ text: "Allah does not allow the reward of those who do good to be lost.", author: "Surah Hud 11:115" },
{ text: "Seek help through patience and prayer.", author: "Surah Al-Baqarah 2:45" },
{ text: "We will surely test you, but give good tidings to the patient.", author: "Surah Al-Baqarah 2:155" },
{ text: "If you endure patiently, it is better for those who are patient.", author: "Surah An-Nahl 16:126" },
{ text: "Peace be upon you for what you patiently endured.", author: "Surah Ar-Ra'd 13:24" },
{ text: "Rely upon Allah; sufficient is Allah as Disposer of affairs.", author: "Surah Al-Ahzab 33:3" },

{ text: "Do not lose heart nor fall into despair.", author: "Surah Ali 'Imran 3:139" },
{ text: "Whoever fears Allah—He will make for him a way out.", author: "Surah At-Talaq 65:2" },
{ text: "And provides for him from where he does not expect.", author: "Surah At-Talaq 65:3" },
{ text: "He is with you wherever you are.", author: "Surah Al-Hadid 57:4" },
{ text: "Allah does not burden a soul beyond that it can bear.", author: "Surah Al-Baqarah 2:286" },
{ text: "My mercy encompasses all things.", author: "Surah Al-A'raf 7:156" },
{ text: "Do not despair of the mercy of Allah.", author: "Surah Az-Zumar 39:53" },
{ text: "If Allah helps you, none can overcome you.", author: "Surah Ali 'Imran 3:160" },
{ text: "Is not Allah sufficient for His servant?", author: "Surah Az-Zumar 39:36" },
{ text: "Your Lord is going to give you, and you will be satisfied.", author: "Surah Ad-Duha 93:5" },

{ text: "There is not for man except that for which he strives.", author: "Surah An-Najm 53:39" },
{ text: "His effort is going to be seen.", author: "Surah An-Najm 53:40" },
{ text: "Allah will not change the condition of a people until they change what is in themselves.", author: "Surah Ar-Ra'd 13:11" },
{ text: "When you have decided, then rely upon Allah.", author: "Surah Ali 'Imran 3:159" },
{ text: "Whoever does an atom's weight of good will see it.", author: "Surah Az-Zalzalah 99:7" },
{ text: "The most noble of you in the sight of Allah is the most righteous of you.", author: "Surah Al-Hujurat 49:13" },
{ text: "Let there arise from you a nation inviting to all that is good.", author: "Surah Ali 'Imran 3:104" },
{ text: "March forth toward forgiveness from your Lord.", author: "Surah Ali 'Imran 3:133" },
{ text: "Compete with each other in doing good.", author: "Surah Al-Ma'idah 5:48" },
{ text: "My success is not but through Allah.", author: "Surah Hud 11:88" },

{ text: "Speak to people good words.", author: "Surah Al-Baqarah 2:83" },
{ text: "Repel evil with that which is better.", author: "Surah Fussilat 41:34" },
{ text: "Lower your wing to those who follow you of the believers.", author: "Surah Ash-Shu'ara 26:215" },
{ text: "Whoever forgives and makes reconciliation—his reward is with Allah.", author: "Surah Ash-Shura 42:40" },
{ text: "Hold to forgiveness and enjoin what is right.", author: "Surah Al-A'raf 7:199" },
{ text: "Do not walk on the earth with arrogance.", author: "Surah Al-Isra 17:37" },
{ text: "Avoid much negative assumption.", author: "Surah Al-Hujurat 49:12" },
{ text: "Do not spy or backbite each other.", author: "Surah Al-Hujurat 49:12" },
{ text: "Be kind as Allah has been kind to you.", author: "Surah Al-Qasas 28:77" },
{ text: "Worship Allah and to parents do good.", author: "Surah An-Nisa 4:36" },{ text: "If you are grateful, I will surely increase you.", author: "Surah Ibrahim 14:7" },
{ text: "Remember Me; I will remember you. And be grateful to Me.", author: "Surah Al-Baqarah 2:152" },
{ text: "Few of My servants are truly grateful.", author: "Surah Saba 34:13" },
{ text: "Which of the favors of your Lord will you deny?", author: "Surah Ar-Rahman 55:13" },
{ text: "He gave you from all you asked of Him.", author: "Surah Ibrahim 14:34" },
{ text: "Whatever blessing you have is from Allah.", author: "Surah An-Nahl 16:53" },
{ text: "Is there any reward for good other than good?", author: "Surah Ar-Rahman 55:60" },

{ text: "Stand firmly for justice.", author: "Surah An-Nisa 4:135" },
{ text: "Do not mix the truth with falsehood.", author: "Surah Al-Baqarah 2:42" },
{ text: "When you testify, be just, even if it concerns a near relative.", author: "Surah Al-An'am 6:152" },
{ text: "Allah orders justice and good conduct.", author: "Surah An-Nahl 16:90" },
{ text: "Do not let the hatred of a people prevent you from being just.", author: "Surah Al-Ma'idah 5:8" },
{ text: "Fulfill every commitment.", author: "Surah Al-Isra 17:34" },
{ text: "Allah loves those who are just.", author: "Surah Al-Mumtahina 60:8" },
{ text: "Fear Allah and be with those who are true.", author: "Surah At-Tawbah 9:119" },

{ text: "By the remembrance of Allah hearts are assured.", author: "Surah Ar-Ra'd 13:28" },
{ text: "The servants of the Most Merciful walk upon the earth gently.", author: "Surah Al-Furqan 25:63" },
{ text: "When the ignorant address them harshly, they say words of peace.", author: "Surah Al-Furqan 25:63" },
{ text: "He sends down tranquility into the hearts of the believers.", author: "Surah Al-Fath 48:4" },
{ text: "We made you nations and tribes that you may know one another.", author: "Surah Al-Hujurat 49:13" },
{ text: "There is no compulsion in religion.", author: "Surah Al-Baqarah 2:256" },
{ text: "If they incline to peace, then incline to it also.", author: "Surah Al-Anfal 8:61" },
{ text: "Flee to Allah.", author: "Surah Adh-Dhariyat 51:50" },

{ text: "Let them pardon and overlook. Would you not like that Allah should forgive you?", author: "Surah An-Nur 24:22" },
{ text: "Indeed, Allah forgives all sins.", author: "Surah Az-Zumar 39:53" },
{ text: "Whoever seeks forgiveness will find Allah Forgiving and Merciful.", author: "Surah An-Nisa 4:110" },
{ text: "Your Lord is vast in forgiveness.", author: "Surah An-Najm 53:32" },
{ text: "I am the Perpetual Forgiver of whoever repents.", author: "Surah Taha 20:82" },
{ text: "Good deeds remove bad deeds.", author: "Surah Hud 11:114" },
{ text: "Except those who repent, believe and do righteous work.", author: "Surah Al-Furqan 25:70" },
{ text: "He is the Forgiving, the Affectionate.", author: "Surah Al-Buruj 85:14" },

{ text: "Allah is sufficient for us.", author: "Surah Ali 'Imran 3:173" },
{ text: "Call upon Me; I will respond to you.", author: "Surah Ghafir 40:60" },
{ text: "Keep yourself patient.", author: "Surah Al-Kahf 18:28" },
{ text: "Guide us to the straight path.", author: "Surah Al-Fatihah 1:6" },
{ text: "Indeed, the promise of Allah is truth.", author: "Surah Ar-Rum 30:60" },
{ text: "Allah is the best of providers.", author: "Surah Al-Jumu'ah 62:11" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);
  }, []);

  const saveCoachingName = (name: string) => {
    setCoachingName(name);
    localStorage.setItem('coaching_name', name);
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { label: "1ST CHAMPION", color: "#fbbf24", icon: "🥇", bg: "#fffbeb" };
    if (rank === 2) return { label: "2ND RUNNER UP", color: "#94a3b8", icon: "🥈", bg: "#f8fafc" };
    if (rank === 3) return { label: "3RD PLACE", color: "#b45309", icon: "🥉", bg: "#fff7ed" };
    return { label: "PARTICIPANT", color: "#64748b", icon: "📖", bg: "#f8fafc" };
  };

  const style = getRankStyle(rankData.rank);

  const handleDownload = () => {
    const element = document.getElementById('premium-transcript');
    if (!element) return;
    
    const fileName = `${quiz.title.replace(/\s+/g, '_')}_${attempt.studentName.replace(/\s+/g, '_')}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 4,
        useCORS: true, 
        scrollY: 0, 
        windowWidth: 900,
        letterRendering: true,
        allowTaint: true,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-[100] p-0 font-['Hind_Siliguri']">
      <div className="bg-white w-full max-w-5xl h-full sm:h-[98vh] flex flex-col overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="p-4 bg-white border-b flex justify-between items-center no-print shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditingName(!isEditingName)} className="text-sm font-bold text-indigo-600 uppercase bg-indigo-50 px-4 py-2 rounded-lg">
              {isEditingName ? 'Save' : 'Edit Name'}
            </button>
            {isEditingName && (
              <input 
                className="border-2 border-indigo-600 px-3 py-1.5 rounded-lg font-bold text-base outline-none w-48 text-black"
                value={coachingName}
                onChange={(e) => saveCoachingName(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[14px] uppercase shadow-lg active:scale-95 transition-all">Download PDF</button>
            <button onClick={onClose} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl font-black text-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">×</button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-auto bg-slate-200 custom-scrollbar p-2 md:p-6 flex flex-col items-center">
          <div id="premium-transcript" style={{ 
            width: '100%', 
            maxWidth: '900px',
            margin: '0 auto',
            background: '#ffffff', 
            boxSizing: 'border-box', 
            padding: 'clamp(20px, 4vw, 60px) clamp(16px, 4vw, 50px)' 
          }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '45px' }}>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: '1000', color: '#1e40af', margin: '0', textTransform: 'uppercase', lineHeight: '1' }}>
                {coachingName}
              </h1>
              <div style={{ height: '6px', width: '100px', backgroundColor: '#3b82f6', margin: '20px auto', borderRadius: '10px' }}></div>
              <p style={{ fontSize: '18px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '4px' }}>
                Academic Transcript Report
              </p>
            </div>

            {/* Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px', marginBottom: '45px' }}>
              <div style={{ padding: '25px 15px', backgroundColor: '#f0f9ff', borderRadius: '28px', textAlign: 'center', border: '2px solid #bae6fd', WebkitPrintColorAdjust: 'exact' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#0369a1', textTransform: 'uppercase' }}>Student</span>
                <p style={{ fontSize: 'clamp(18px, 3vw, 30px)', fontWeight: '1000', color: '#0c4a6e', marginTop: '10px' }}>{attempt.studentName}</p>
              </div>

              <div style={{ padding: '25px 15px', backgroundColor: style.bg, borderRadius: '28px', textAlign: 'center', border: `4px solid ${style.color}`, boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)', WebkitPrintColorAdjust: 'exact' }}>
                <div style={{ fontSize: '40px', lineHeight: '1' }}>{style.icon}</div>
                <p style={{ fontSize: '38px', fontWeight: '1000', color: '#0f172a', margin: '5px 0' }}>#{rankData.rank}</p>
                <span style={{ fontSize: '12px', fontWeight: '900', color: style.color }}>{style.label}</span>
              </div>

              <div style={{ padding: '25px 15px', backgroundColor: '#f0fdf4', borderRadius: '28px', textAlign: 'center', border: '2px solid #bbf7d0', WebkitPrintColorAdjust: 'exact' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#15803d', textTransform: 'uppercase' }}>Score</span>
                <p style={{ fontSize: '30px', fontWeight: '1000', color: '#14532d', marginTop: '10px' }}>{attempt.score}/{totalPossibleMarks}</p>
              </div>
            </div>

            {/* Exam Analysis */}
            <div style={{ marginBottom: '60px' }}>
              <h3 style={{ fontSize: '34px', fontWeight: '1000', color: '#1e293b', marginBottom: '40px', borderLeft: '15px solid #2563eb', paddingLeft: '20px' }}>EXAM ANALYSIS</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {quiz.questions.map((q: any, idx: number) => {
                  const userAns = String((attempt.answers as any)?.[q.id] || '').trim();
                  const correctAns = String(q.answer || q.correctAnswer || '').trim();
                  const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase() && userAns !== "";
                  
                  const isGapFill = !q.options || q.options.length <= 1;

                  return (
                    <div key={idx} style={{ padding: '30px', borderRadius: '32px', backgroundColor: isCorrect ? '#f0fdf4' : '#fff1f2', border: '2px solid', borderColor: isCorrect ? '#dcfce7' : '#fecdd3', pageBreakInside: 'avoid', WebkitPrintColorAdjust: 'exact' }}>
                      <p style={{ fontSize: 'clamp(16px, 2.5vw, 26px)', fontWeight: '900', color: '#1e293b', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                        <span style={{ color: isCorrect ? '#16a34a' : '#e11d48', marginRight: '10px' }}>{idx + 1}.</span> 
                        {q.text || q.questionText}
                      </p>
                      
                      {isGapFill ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ 
                            padding: '18px 24px', 
                            borderRadius: '16px', 
                            backgroundColor: '#ffffff', 
                            border: '3px dashed', 
                            borderColor: isCorrect ? '#16a34a' : '#e11d48',
                            color: isCorrect ? '#15803d' : '#e11d48',
                            fontSize: '24px',
                            fontWeight: '800'
                          }}>
                            <span style={{ fontSize: '12px', textTransform: 'uppercase', display: 'block', opacity: 0.6 }}>Your Answer:</span>
                            {userAns || "No Answer"}
                          </div>
                          {!isCorrect && (
                            <div style={{ padding: '5px 10px', color: '#16a34a', fontSize: '18px', fontWeight: '700' }}>
                              ✅ Correct Answer: {correctAns}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Options Layout - Force 2 Columns if space permits */
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '15px' 
                        }}>
                          {(q.options || []).map((opt: string, oIdx: number) => {
                            const isSelected = userAns === opt.trim();
                            const isRight = correctAns === opt.trim();
                            
                            let optBg = '#ffffff';
                            let optBorder = '#e2e8f0';
                            let optColor = '#475569';

                            if (isSelected && isRight) { optBg = '#16a34a'; optColor = '#ffffff'; optBorder = '#16a34a'; }
                            else if (isSelected && !isRight) { optBg = '#e11d48'; optColor = '#ffffff'; optBorder = '#e11d48'; }
                            else if (isRight) { optBg = '#f0fdf4'; optBorder = '#22c55e'; optColor = '#15803d'; }

                            return (
                              <div key={oIdx} style={{ 
                                padding: '18px 20px', 
                                borderRadius: '18px', 
                                fontSize: 'clamp(13px, 2vw, 22px)', 
                                fontWeight: '800', 
                                border: '2px solid', 
                                borderColor: optBorder, 
                                backgroundColor: optBg, 
                                color: optColor, 
                                display: 'flex', 
                                alignItems: 'center',
                                WebkitPrintColorAdjust: 'exact'
                              }}>
                                <span style={{ opacity: 0.5, marginRight: '10px', fontSize: '14px' }}>{String.fromCharCode(65 + oIdx)}.</span> {opt}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '50px', borderTop: '5px solid #f1f5f9', paddingTop: '50px' }}>
              <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <p style={{ fontSize: '20px', fontWeight: '800', color: '#64748b', fontStyle: 'italic', padding: '0 20px' }}>"{randomQuote.text}"</p>
                <p style={{ fontSize: '18px', fontWeight: '1000', color: '#2563eb', marginTop: '12px' }}>— {randomQuote.author}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '50px', height: '50px', background: '#2563eb', borderRadius: '14px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '1000', fontSize: '26px', WebkitPrintColorAdjust: 'exact' }}>Q</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: '1000', color: 'black' }}>EDUQUIZ <span style={{ color: '#2563eb' }}>PRO</span></p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: '900', letterSpacing: '2px' }}>SMART ASSESSMENT SYSTEM</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '1000', color: '#94a3b8' }}>OFFICIAL VERIFIED RECORD</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#1e293b' }}>ID: {quiz.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Class, Subject } from '../../types';

const PAPER_SIZES: Record<string, { width: string; height: string; label: string; jsPDF: string }> = {
  a4:     { width: '210mm', height: '297mm', label: 'A4',     jsPDF: 'a4'     },
  a3:     { width: '297mm', height: '420mm', label: 'A3',     jsPDF: 'a3'     },
  letter: { width: '216mm', height: '279mm', label: 'Letter', jsPDF: 'letter' },
  legal:  { width: '216mm', height: '356mm', label: 'Legal',  jsPDF: 'legal'  },
};

const FONTS = [
  { value: "'Hind Siliguri', sans-serif", label: 'Hind Siliguri' },
  { value: "Arial, sans-serif",           label: 'Arial'          },
  { value: "'Times New Roman', serif",    label: 'Times New Roman'},
  { value: "Georgia, serif",              label: 'Georgia'        },
  { value: "'Courier New', monospace",    label: 'Courier New'    },
  { value: "'Oswald', sans-serif",        label: 'Oswald'         },
  { value: "'Montserrat', sans-serif",    label: 'Montserrat'     },
];

const THEMES = {
  classic: { primary: '#1e3a5f', accent: '#2563eb', bg: '#ffffff' },
  modern:  { primary: '#111827', accent: '#6366f1', bg: '#ffffff' },
  elegant: { primary: '#1a1a1a', accent: '#b45309', bg: '#fffbeb' },
  green:   { primary: '#064e3b', accent: '#059669', bg: '#f0fdf4' },
  red:     { primary: '#7f1d1d', accent: '#dc2626', bg: '#fff5f5' },
};

interface QuestionPaperViewProps {
  selectedQuiz: Quiz;
  classes: Class[];
  subjects: Subject[];
  branding: { name: string; motto: string; address: string };
  showAnswers: boolean;
  setShowAnswers: (val: boolean) => void;
  onBack: () => void;
}

export const QuestionPaperView: React.FC<QuestionPaperViewProps> = ({
  selectedQuiz,
  classes,
  subjects,
  branding: initialBranding,
  showAnswers,
  setShowAnswers,
  onBack,
}) => {
  /* ─── Branding ─────────────────────────────────────────── */
  const [paperName,  setPaperName]  = useState(initialBranding.name  || 'EduQuiz Pro');
  const [paperMotto, setPaperMotto] = useState(initialBranding.motto || 'Empowering Education');

  /* ─── Page ─────────────────────────────────────────────── */
  const [paperSize,    setPaperSize]    = useState<keyof typeof PAPER_SIZES>('a4');
  const [orientation,  setOrientation]  = useState<'portrait' | 'landscape'>('portrait');
  const [marginTop,    setMarginTop]    = useState(24);
  const [marginBottom, setMarginBottom] = useState(24);
  const [marginLeft,   setMarginLeft]   = useState(24);
  const [marginRight,  setMarginRight]  = useState(24);
  const [zoom,         setZoom]         = useState(80);

  /* ─── Typography ───────────────────────────────────────── */
  const [font,        setFont]        = useState(FONTS[0].value);
  const [fontSize,    setFontSize]    = useState(13);
  const [lineSpacing, setLineSpacing] = useState(1.6);
  const [questionGap, setQuestionGap] = useState(16);
  const [headerSize,  setHeaderSize]  = useState(28);
  const [subheadSize, setSubheadSize] = useState(12);
  const [boldQ,       setBoldQ]       = useState(false);
  const [italicQ,     setItalicQ]     = useState(false);
  const [underlineQ,  setUnderlineQ]  = useState(false);
  const [textAlign,   setTextAlign]   = useState<'left'|'center'|'right'|'justify'>('left');

  /* ─── Layout ───────────────────────────────────────────── */
  const [columns,      setColumns]      = useState(1);
  const [numberStyle,  setNumberStyle]  = useState('decimal');
  const [showMarks,    setShowMarks]    = useState(true);
  const [showOptions,  setShowOptions]  = useState(true);
  const [optionLayout, setOptionLayout] = useState<'1col'|'2col'|'4col'>('2col');
  const [showBorder,   setShowBorder]   = useState(true);

  /* ─── Header / Footer ──────────────────────────────────── */
  const [showLogo,         setShowLogo]         = useState(false);
  const [logoBase64,       setLogoBase64]        = useState('');
  const [showHeaderBorder, setShowHeaderBorder]  = useState(true);
  const [showInstructions, setShowInstructions]  = useState(true);
  const [instructions,     setInstructions]      = useState('সকল প্রশ্নের উত্তর দিন। পরীক্ষার হলে মোবাইল ব্যবহার নিষিদ্ধ।');
  const [showQuote,        setShowQuote]         = useState(true);
  const [quote,            setQuote]             = useState('');
  const [showSignature,    setShowSignature]      = useState(true);
  const [showPageNum,      setShowPageNum]        = useState(true);
  const [showWatermark,    setShowWatermark]      = useState(false);
  const [watermarkText,    setWatermarkText]      = useState('CONFIDENTIAL');
  const [showBrand,        setShowBrand]          = useState(true);
  const [customFooter,     setCustomFooter]       = useState('');

  /* ─── Theme ────────────────────────────────────────────── */
  const [theme,         setTheme]         = useState<keyof typeof THEMES>('classic');
  const [customPrimary, setCustomPrimary] = useState('');
  const [customAccent,  setCustomAccent]  = useState('');

  /* ─── Sidebar tab ──────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<'branding'|'page'|'font'|'layout'|'header'|'theme'>('branding');
  const [sidebarOpen, setSidebarOpen] = useState(false); // ✅ mobile sidebar toggle

  /* ─── PDF state ────────────────────────────────────────── */
  const [pdfLoading, setPdfLoading] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const quotes = [
      '"The beautiful thing about learning is that no one can take it away from you."',
      '"Education is the most powerful weapon which you can use to change the world."',
      '"আপনার আজকের কঠোর পরিশ্রম আগামীকালের সাফল্যের ভিত্তি।"',
      '"সফলতার কোনো সংক্ষিপ্ত পথ নেই, এটি কঠোর পরিশ্রমের ফল।"',
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  /* ─── Derived ──────────────────────────────────────────── */
  const T       = THEMES[theme];
  const primary = customPrimary || T.primary;
  const accent  = customAccent  || T.accent;
  const PS      = PAPER_SIZES[paperSize];
  const paperW  = orientation === 'landscape' ? PS.height : PS.width;
  const paperH  = orientation === 'landscape' ? PS.width  : PS.height;

  /* ─── Helpers ──────────────────────────────────────────── */
  const toRoman = (n: number) => {
    const map: [string, number][] = [
      ['M',1000],['CM',900],['D',500],['CD',400],['C',100],
      ['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1],
    ];
    let r = '';
    for (const [s, v] of map) { while (n >= v) { r += s; n -= v; } }
    return r;
  };
  const getLabel = (i: number) => {
    if (numberStyle === 'upper-roman') return `${toRoman(i)}.`;
    if (numberStyle === 'lower-alpha') return `${String.fromCharCode(96 + i)}.`;
    if (numberStyle === 'upper-alpha') return `${String.fromCharCode(64 + i)}.`;
    return `${i}.`;
  };
  const getOptionCols = () =>
    optionLayout === '1col' ? 'repeat(1,1fr)' : optionLayout === '4col' ? 'repeat(4,1fr)' : 'repeat(2,1fr)';

  const getQText   = (q: any) => q.text || q.questionText || q.question || '—';
  const getAnswer  = (q: any) => q.correctAnswer || q.answer || 'N/A';
  // ✅ FIX: no type check — just check if options array exists
  const hasOptions = (q: any) => Array.isArray(q.options) && q.options.length > 0;
  const isTF       = (q: any) => {
    const t = (q.type || '').toString().toUpperCase().replace(/[_\s]/g, '');
    return t === 'TRUEFALSE' || t === 'TF';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setLogoBase64(r.result as string);
    r.readAsDataURL(f);
  };

  /* ─── PDF DOWNLOAD ─────────────────────────────────────── */
  /* ✅ FIX: dynamically import html2pdf to avoid SSR issues  */
  const handleDownload = async () => {
    const el = paperRef.current;
    if (!el || pdfLoading) return;
    setPdfLoading(true);
    try {
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:      0,
        filename:    `${(selectedQuiz.title || 'Paper').replace(/\s+/g, '_')}.pdf`,
        image:       { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, useCORS: true, scrollY: 0, letterRendering: true, allowTaint: true },
        jsPDF:       { unit: 'mm', format: PS.jsPDF, orientation },
        pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] },
      };
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF download failed. Please try the Print button instead.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  /* ─── UI sub-components ────────────────────────────────── */
  const TabBtn = ({ id, icon, label }: { id: typeof activeTab; icon: string; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all w-full ${
        activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );

  const ST = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1 mt-4 mb-2">
      {children}
    </h3>
  );

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-2 mb-2">
      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{label}</span>
      {children}
    </div>
  );

  const Toggle = ({ val, set }: { val: boolean; set: (v: boolean) => void }) => (
    <button
      onClick={() => set(!val)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${val ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-5' : ''}`} />
    </button>
  );

  const Slider = ({ label, val, set, min, max, step = 1, unit = '' }: any) => (
    <div className="mb-2.5">
      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mb-1">
        <span>{label}</span><span>{val}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(parseFloat(e.target.value))}
        className="w-full accent-indigo-600 h-1.5 rounded" />
    </div>
  );

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen bg-slate-200 overflow-hidden font-['Hind_Siliguri'] relative">

      {/* ── Icon Rail ─────────────────────────────────────── */}
      <div className="hidden md:flex w-14 bg-white border-r border-slate-200 flex-col items-center py-3 gap-1 shadow-sm no-print shrink-0">
        <button
          onClick={onBack}
          className="mb-3 p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"
          title="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <TabBtn id="branding" icon="🏫" label="Brand"  />
        <TabBtn id="page"     icon="📄" label="Page"   />
        <TabBtn id="font"     icon="𝐓"  label="Font"   />
        <TabBtn id="layout"   icon="⬛" label="Layout" />
        <TabBtn id="header"   icon="🔝" label="Header" />
        <TabBtn id="theme"    icon="🎨" label="Theme"  />
      </div>

      {/* ── Sidebar Panel ─────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`
        fixed md:relative top-0 left-0 h-full z-50 md:z-auto
        w-72 md:w-60 bg-white border-r border-slate-200 overflow-y-auto py-3 px-3 no-print shrink-0
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Mobile close button */}
      <div className="flex justify-between items-center mb-3 md:hidden">
        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Settings</span>
        <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">✕</button>
      </div>
      {/* Mobile tab icons */}
      <div className="flex gap-1 mb-3 md:hidden">
        {([
          {id:'branding',icon:'🏫'},{id:'page',icon:'📄'},{id:'font',icon:'𝐓'},
          {id:'layout',icon:'⬛'},{id:'header',icon:'🔝'},{id:'theme',icon:'🎨'}
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-1.5 rounded-lg text-sm transition-all ${activeTab===t.id?'bg-indigo-600':'bg-slate-100'}`}>
            {t.icon}
          </button>
        ))}
      </div>

        {/* BRANDING */}
        {activeTab === 'branding' && <>
          <ST>Institution</ST>
          <input
            className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-black outline-none focus:ring-2 ring-indigo-500 mb-2"
            value={paperName} onChange={e => setPaperName(e.target.value)} placeholder="School / Coaching Name"
          />
          <input
            className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-black outline-none focus:ring-2 ring-indigo-500"
            value={paperMotto} onChange={e => setPaperMotto(e.target.value)} placeholder="Motto / Tagline"
          />
          <ST>Logo</ST>
          <Row label="Show Logo"><Toggle val={showLogo} set={setShowLogo} /></Row>
          {showLogo && (
            <label className="block w-full cursor-pointer">
              <div className="w-full py-2 border-2 border-dashed border-indigo-300 rounded-xl text-center text-[10px] font-bold text-indigo-500 hover:bg-indigo-50 transition-all">
                {logoBase64 ? '✅ Logo Uploaded' : '📁 Upload Logo'}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          )}
        </>}

        {/* PAGE */}
        {activeTab === 'page' && <>
          <ST>Paper Size</ST>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {Object.entries(PAPER_SIZES).map(([k, v]) => (
              <button key={k} onClick={() => setPaperSize(k as any)}
                className={`py-1.5 rounded-lg text-[10px] font-black border transition-all ${paperSize === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                {v.label}
              </button>
            ))}
          </div>
          <ST>Orientation</ST>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {(['portrait','landscape'] as const).map(o => (
              <button key={o} onClick={() => setOrientation(o)}
                className={`py-1.5 rounded-lg text-[10px] font-black border capitalize transition-all ${orientation === o ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                {o === 'portrait' ? '📄 Portrait' : '🖼️ Landscape'}
              </button>
            ))}
          </div>
          <ST>Margins (px)</ST>
          <Slider label="Top"    val={marginTop}    set={setMarginTop}    min={0} max={80} unit="px" />
          <Slider label="Bottom" val={marginBottom} set={setMarginBottom} min={0} max={80} unit="px" />
          <Slider label="Left"   val={marginLeft}   set={setMarginLeft}   min={0} max={80} unit="px" />
          <Slider label="Right"  val={marginRight}  set={setMarginRight}  min={0} max={80} unit="px" />
          <ST>Preview Zoom</ST>
          <Slider label="Zoom" val={zoom} set={setZoom} min={40} max={150} unit="%" />
        </>}

        {/* FONT */}
        {activeTab === 'font' && <>
          <ST>Typeface</ST>
          <select value={font} onChange={e => setFont(e.target.value)}
            className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold text-black mb-2">
            {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <ST>Sizes</ST>
          <Slider label="Body Text"    val={fontSize}    set={setFontSize}    min={8}   max={24}   unit="px" />
          <Slider label="Line Spacing" val={lineSpacing} set={setLineSpacing} min={1}   max={3}    step={0.05} />
          <Slider label="Header"       val={headerSize}  set={setHeaderSize}  min={16}  max={56}   unit="px" />
          <Slider label="Sub-header"   val={subheadSize} set={setSubheadSize} min={9}   max={20}   unit="px" />
          <Slider label="Q Gap"        val={questionGap} set={setQuestionGap} min={4}   max={48}   unit="px" />
          <ST>Style</ST>
          <div className="flex gap-2 mb-3">
            {[
              { l:'B', tip:'Bold',      v:boldQ,      s:setBoldQ,      cls:'font-black' },
              { l:'I', tip:'Italic',    v:italicQ,    s:setItalicQ,    cls:'italic'     },
              { l:'U', tip:'Underline', v:underlineQ, s:setUnderlineQ, cls:'underline'  },
            ].map(({ l, tip, v, s, cls }) => (
              <button key={l} title={tip} onClick={() => s(!v)}
                className={`w-9 h-9 rounded-lg border text-sm font-black transition-all ${cls} ${v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>
          <ST>Alignment</ST>
          <div className="flex gap-1.5">
            {(['left','center','right','justify'] as const).map(a => (
              <button key={a} onClick={() => setTextAlign(a)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black border transition-all ${textAlign === a ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {a==='left'?'⬅':a==='center'?'↔':a==='right'?'➡':'≡'}
              </button>
            ))}
          </div>
        </>}

        {/* LAYOUT */}
        {activeTab === 'layout' && <>
          <ST>Columns</ST>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {[1,2].map(c => (
              <button key={c} onClick={() => setColumns(c)}
                className={`py-1.5 rounded-lg text-[10px] font-black border transition-all ${columns===c?'bg-indigo-600 text-white border-indigo-600':'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {c} Col{c>1?'s':''}
              </button>
            ))}
          </div>
          <ST>Numbering</ST>
          <select value={numberStyle} onChange={e => setNumberStyle(e.target.value)}
            className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold text-black mb-2">
            <option value="decimal">1, 2, 3 …</option>
            <option value="upper-roman">I, II, III …</option>
            <option value="lower-alpha">a, b, c …</option>
            <option value="upper-alpha">A, B, C …</option>
          </select>
          <ST>MCQ Option Layout</ST>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {(['1col','2col','4col'] as const).map(o => (
              <button key={o} onClick={() => setOptionLayout(o)}
                className={`py-1.5 rounded-lg text-[9px] font-black border transition-all ${optionLayout===o?'bg-indigo-600 text-white border-indigo-600':'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {o==='1col'?'1 col':o==='2col'?'2 col':'4 col'}
              </button>
            ))}
          </div>
          <ST>Visibility</ST>
          <Row label="Show Marks">   <Toggle val={showMarks}   set={setShowMarks}   /></Row>
          <Row label="Show Options"> <Toggle val={showOptions} set={setShowOptions} /></Row>
          <Row label="Q Border">     <Toggle val={showBorder}  set={setShowBorder}  /></Row>
        </>}

        {/* HEADER / FOOTER */}
        {activeTab === 'header' && <>
          <ST>Header</ST>
          <Row label="Header Border"><Toggle val={showHeaderBorder} set={setShowHeaderBorder} /></Row>
          <ST>Instructions</ST>
          <Row label="Show"><Toggle val={showInstructions} set={setShowInstructions} /></Row>
          {showInstructions && (
            <textarea rows={3}
              className="w-full p-2 bg-slate-50 border rounded-lg text-[10px] font-bold text-black outline-none focus:ring-2 ring-indigo-500 resize-none"
              value={instructions} onChange={e => setInstructions(e.target.value)} />
          )}
          <ST>Footer</ST>
          <Row label="Quote">      <Toggle val={showQuote}     set={setShowQuote}     /></Row>
          {showQuote && (
            <input className="w-full p-2 bg-slate-50 border rounded-lg text-[10px] font-bold text-black outline-none mb-2"
              value={quote} onChange={e => setQuote(e.target.value)} />
          )}
          <Row label="Signature">  <Toggle val={showSignature} set={setShowSignature} /></Row>
          <Row label="EduQuiz">    <Toggle val={showBrand}     set={setShowBrand}     /></Row>
          <Row label="Page No.">   <Toggle val={showPageNum}   set={setShowPageNum}   /></Row>
          <div className="mt-1 mb-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Custom Footer</label>
            <input className="w-full p-2 bg-slate-50 border rounded-lg text-[10px] font-bold text-black outline-none mt-1"
              value={customFooter} onChange={e => setCustomFooter(e.target.value)} placeholder="Optional footer text" />
          </div>
          <ST>Watermark</ST>
          <Row label="Show"><Toggle val={showWatermark} set={setShowWatermark} /></Row>
          {showWatermark && (
            <input className="w-full p-2 bg-slate-50 border rounded-lg text-[10px] font-bold text-black outline-none"
              value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="CONFIDENTIAL" />
          )}
        </>}

        {/* THEME */}
        {activeTab === 'theme' && <>
          <ST>Color Theme</ST>
          <div className="space-y-1.5 mb-3">
            {Object.entries(THEMES).map(([k, v]) => (
              <button key={k} onClick={() => setTheme(k as any)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all ${theme===k?'border-indigo-400 bg-indigo-50':'border-slate-200 bg-slate-50 hover:border-indigo-200'}`}>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: v.primary }} />
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: v.accent  }} />
                </div>
                <span className="text-[10px] font-black text-slate-700 capitalize">{k}</span>
                {theme === k && <span className="ml-auto text-indigo-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
          <ST>Custom Colors</ST>
          <Row label="Primary">
            <input type="color" value={customPrimary || T.primary}
              onChange={e => setCustomPrimary(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border" />
          </Row>
          <Row label="Accent">
            <input type="color" value={customAccent || T.accent}
              onChange={e => setCustomAccent(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border" />
          </Row>
          <button onClick={() => { setCustomPrimary(''); setCustomAccent(''); }}
            className="w-full text-[9px] font-black text-slate-400 uppercase hover:text-slate-600 transition-all mt-1">
            Reset Colors
          </button>
        </>}
      </div>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Toolbar */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 no-print shadow-sm flex-wrap">

          {/* ✅ Mobile: Settings toggle button */}
          <button onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 text-lg shrink-0">
            ⚙️
          </button>

          {/* Mobile back button */}
          <button onClick={onBack}
            className="md:hidden w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
            ←
          </button>

          {/* Q / Answer toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl">
            <button onClick={() => setShowAnswers(false)}
              className={`px-3 py-1.5 rounded-[10px] text-[10px] font-black uppercase transition-all ${!showAnswers ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400'}`}>
              Qs
            </button>
            <button onClick={() => setShowAnswers(true)}
              className={`px-3 py-1.5 rounded-[10px] text-[10px] font-black uppercase transition-all ${showAnswers ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400'}`}>
              Key
            </button>
          </div>

          {/* Zoom buttons */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setZoom(z => Math.max(30, z - 10))}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-black flex items-center justify-center active:scale-90">−</button>
            <span className="text-[11px] font-black text-slate-600 w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(150, z + 10))}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-black flex items-center justify-center active:scale-90">+</button>
          </div>

          <span className="hidden sm:block text-[10px] font-black text-slate-400 uppercase">
            {selectedQuiz.questions?.length || 0} Qs · {selectedQuiz.config?.totalMarks || 0}M
          </span>

          <div className="flex-1" />

          <button onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95">
            🖨️ <span className="hidden md:inline">Print</span>
          </button>
          <button onClick={handleDownload} disabled={pdfLoading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md transition-all active:scale-95 ${
              pdfLoading ? 'bg-indigo-300 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}>
            {pdfLoading ? '⏳' : '⬇️'} <span className="hidden sm:inline">{pdfLoading ? 'Generating…' : 'PDF'}</span>
          </button>
        </div>

        {/* Paper Preview */}
        <div className="flex-1 overflow-auto flex justify-center items-start py-4 md:py-8 px-2 md:px-4 bg-slate-200">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
              /* push container height so scroll works at large zoom */
              marginBottom: zoom > 100 ? `${(zoom / 100 - 1) * 1122}px` : 0,
            }}
          >
            {/* ══ A4 PAPER ═══════════════════════════════════ */}
            <div
              ref={paperRef}
              style={{
                width:           paperW,
                minHeight:       paperH,
                paddingTop:      `${marginTop}px`,
                paddingBottom:   `${marginBottom}px`,
                paddingLeft:     `${marginLeft}px`,
                paddingRight:    `${marginRight}px`,
                fontSize:        `${fontSize}px`,
                fontFamily:      font,
                lineHeight:      lineSpacing,
                color:           primary,
                backgroundColor: T.bg,
                boxShadow:       '0 8px 40px rgba(0,0,0,0.18)',
                position:        'relative',
                overflow:        'hidden',
                boxSizing:       'border-box',
              }}
            >
              {/* Watermark */}
              {showWatermark && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', zIndex: 0,
                  transform: 'rotate(-30deg)',
                  fontSize: '60px', fontWeight: 900, opacity: 0.04,
                  color: primary, userSelect: 'none', letterSpacing: '8px', whiteSpace: 'nowrap',
                }}>
                  {watermarkText}
                </div>
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>

                {/* ── HEADER ── */}
                <div style={{
                  textAlign: 'center',
                  borderBottom: showHeaderBorder ? `2.5px solid ${primary}` : 'none',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
                    {showLogo && logoBase64 && (
                      <img src={logoBase64} alt="Logo"
                        style={{ height: '56px', width: '56px', objectFit: 'contain', borderRadius: '8px' }} />
                    )}
                    <div>
                      <h1 style={{
                        fontSize: `${headerSize}px`, fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '-0.5px', color: primary, margin: 0, lineHeight: 1.1,
                      }}>
                        {paperName}
                      </h1>
                      {paperMotto && (
                        <p style={{
                          fontSize: `${subheadSize}px`, fontWeight: 700, color: accent,
                          textTransform: 'uppercase', letterSpacing: '2px', margin: '4px 0 0',
                        }}>
                          {paperMotto}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px',
                    marginTop: '12px', borderTop: `1px dashed ${primary}`, paddingTop: '10px',
                    fontSize: `${Math.max(10, fontSize - 1)}px`, fontWeight: 700, color: primary,
                  }}>
                    <div style={{ textAlign: 'left', lineHeight: 1.8 }}>
                      <div>শ্রেণী: {classes.find(c => c.id === selectedQuiz.classId)?.name || 'N/A'}</div>
                      <div>বিষয়: {subjects.find(s => s.id === selectedQuiz.subjectId)?.name || 'N/A'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        border: `2px solid ${primary}`, padding: '4px 16px',
                        fontWeight: 900, textTransform: 'uppercase',
                        fontSize: `${Math.max(9, fontSize - 2)}px`, letterSpacing: '1px', color: primary,
                      }}>
                        {selectedQuiz.title}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', lineHeight: 1.8 }}>
                      <div>পূর্ণমান: {selectedQuiz.config?.totalMarks || 0}</div>
                      <div>সময়: {selectedQuiz.config?.totalTime || 0} মিনিট</div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {showInstructions && instructions && (
                    <div style={{
                      marginTop: '10px', padding: '6px 12px',
                      border: `1px solid ${accent}`, borderRadius: '6px',
                      fontSize: `${Math.max(9, fontSize - 2)}px`, fontWeight: 600,
                      color: accent, backgroundColor: `${accent}15`,
                      WebkitPrintColorAdjust: 'exact',
                    }}>
                      📋 {instructions}
                    </div>
                  )}
                </div>

                {/* ── QUESTIONS ── */}
                <div style={{
                  columnCount: columns,
                  columnGap: '40px',
                  columnRule: columns > 1 ? `1px solid ${primary}40` : 'none',
                }}>
                  {(selectedQuiz.questions || []).map((q: any, index: number) => (
                    <div
                      key={q.id || index}
                      style={{
                        pageBreakInside: 'avoid', breakInside: 'avoid',
                        marginBottom: `${questionGap}px`,
                        border:        showBorder ? `1px solid ${primary}18` : 'none',
                        borderRadius:  showBorder ? '6px' : 0,
                        padding:       showBorder ? '10px' : 0,
                        backgroundColor: showBorder ? `${primary}04` : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        {/* Number */}
                        <span style={{ fontWeight: 900, color: accent, minWidth: '28px', flexShrink: 0 }}>
                          {getLabel(index + 1)}
                        </span>

                        <div style={{ flex: 1 }}>
                          {/* Question text */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                            <p style={{
                              fontWeight: boldQ ? 900 : 700, color: primary, margin: 0,
                              lineHeight: lineSpacing,
                              fontStyle:      italicQ    ? 'italic'    : 'normal',
                              textDecoration: underlineQ ? 'underline' : 'none',
                              textAlign,
                            }}>
                              {getQText(q)}
                            </p>
                            {showMarks && (
                              <span style={{ fontSize: `${Math.max(9, fontSize - 2)}px`, fontWeight: 800, color: accent, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                [{q.marks || 1}]
                              </span>
                            )}
                          </div>

                          {/* ✅ MCQ Options — type-check-free */}
                          {showOptions && hasOptions(q) && (
                            <div style={{ display: 'grid', gridTemplateColumns: getOptionCols(), gap: '6px 20px', marginTop: '10px' }}>
                              {q.options.map((opt: string, idx: number) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    width: '18px', height: '18px', borderRadius: '50%',
                                    border: `1.5px solid ${primary}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '9px', fontWeight: 900, color: primary, flexShrink: 0,
                                  }}>
                                    {String.fromCharCode(97 + idx)}
                                  </span>
                                  <span style={{ lineHeight: lineSpacing, color: primary }}>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* True / False */}
                          {showOptions && !hasOptions(q) && isTF(q) && (
                            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontStyle: 'italic', fontWeight: 700, color: primary }}>
                              <span>(a) True</span>
                              <span>(b) False</span>
                            </div>
                          )}

                          {/* Answer */}
                          {showAnswers && (
                            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                              <div style={{
                                border: `2px solid ${accent}`, padding: '5px 20px',
                                backgroundColor: `${accent}15`, borderRadius: '8px',
                                minWidth: '60%', textAlign: 'center',
                                WebkitPrintColorAdjust: 'exact',
                              }}>
                                <span style={{ fontWeight: 900, fontSize: '12px', color: accent, textTransform: 'uppercase' }}>
                                  ➤ সঠিক উত্তর: {getAnswer(q)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── FOOTER ── */}
                <div style={{ marginTop: '48px', borderTop: `1.5px solid ${primary}30`, paddingTop: '16px' }}>
                  {showQuote && quote && (
                    <p style={{
                      textAlign: 'center', color: accent, fontStyle: 'italic',
                      fontWeight: 800, fontSize: '15px', marginBottom: '20px',
                      WebkitPrintColorAdjust: 'exact',
                    }}>
                      {quote}
                    </p>
                  )}
                  {customFooter && (
                    <p style={{ textAlign: 'center', fontSize: `${Math.max(9, fontSize - 2)}px`, fontWeight: 700, color: `${primary}80`, marginBottom: '12px' }}>
                      {customFooter}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {showBrand ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', backgroundColor: accent, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitPrintColorAdjust: 'exact' }}>
                          <span style={{ color: 'white', fontWeight: 900, fontSize: '16px' }}>E</span>
                        </div>
                        <h4 style={{ fontSize: '18px', fontWeight: 900, color: primary, margin: 0 }}>
                          EduQuiz <span style={{ color: accent }}>PRO</span>
                        </h4>
                      </div>
                    ) : <div />}

                    {showPageNum && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: `${primary}60` }}>— 1 —</span>
                    )}

                    {showSignature && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ width: '160px', borderTop: `2px solid ${primary}`, marginBottom: '4px' }} />
                        <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: primary, margin: 0 }}>
                          Invigilator Signature
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>{/* /z-1 */}
            </div>{/* /paper */}
          </div>{/* /scale wrapper */}
        </div>{/* /preview scroll */}
      </div>{/* /main */}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; background: white !important; }
        }
        @media (max-width: 768px) {
          .paper-preview { padding: 8px !important; }
        }
      `}</style>

      {/* ✅ Mobile floating action buttons */}
      <div className="fixed bottom-5 right-4 flex flex-col gap-2 md:hidden no-print z-30">
        <button onClick={handlePrint}
          className="w-12 h-12 bg-slate-700 text-white rounded-full shadow-xl flex items-center justify-center text-xl active:scale-90">
          🖨️
        </button>
        <button onClick={handleDownload} disabled={pdfLoading}
          className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center text-xl active:scale-90 disabled:opacity-50">
          {pdfLoading ? '⏳' : '⬇️'}
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  page?: "home" | "quiz" | "result" | "dashboard";
  timeLeft?: number;
  totalTime?: number;
  answeredCount?: number;
  totalCount?: number;
  isCritical?: boolean;
  isLowTime?: boolean;
  studentName?: string;
  quizTitle?: string;
  score?: number;
  totalMarks?: number;
}

// ── Message cache (session-level) ────────────────────────
// Key: trigger type → saved messages list
// একই trigger এর জন্য বারবার API call হবে না
const msgCache = new Map<string, string[]>();

const FALLBACKS: Record<string, string[]> = {
  "quiz_normal":   ["তুমি দারুণ করছ! চালিয়ে যাও 💪🎀", "একটু মনোযোগ দাও, পারবেই! ✨", "আমি তোমার পাশে আছি! 🌸"],
  "quiz_low":      ["আরে! তাড়াতাড়ি করো, সময় কম! ⚡🎀", "যেগুলো পারো সেগুলো আগে দাও! 🏃", "Focus! তুমি পারবে! 💨"],
  "quiz_critical": ["৩০ সেকেন্ড!! এখনই submit করো! 🚨🎀", "HURRY!! দেরি করো না! 🔴", "চটপট! Submit! ⚠️🎀"],
  "result_good":   ["অসাধারণ! তুমি চমৎকার করেছ! 🏆🎀", "এত ভালো করেছ! আমি গর্বিত! 🌟"],
  "result_bad":    ["পরের বার আরও ভালো হবে! 💕🎀", "হার মানো না, practice করো! 💪"],
  "dashboard":     ["আজকে কি নতুন quiz দেবে? 🎯🎀", "তোমার progress দারুণ! চালিয়ে যাও! 📈"],
  "home":          ["হ্যালো! আমি Kitty 🎀 তোমাকে সাহায্য করব!", "Quiz দিতে তৈরি? চলো শুরু করি! ✨🎀"],
  "default":       ["হ্যালো! আমি তোমার পাশে আছি! 🎀", "চালিয়ে যাও! তুমি পারবে! 💕"],
};

// Cache key — same context = same key, no repeat call
function buildCacheKey(trigger: string, studentName: string, page: string, bucket: string): string {
  return `${bucket}__${page}__${studentName}`;
}

// Get from cache — round-robin through saved messages
const cacheIndex = new Map<string, number>();
function getFromCache(key: string): string | null {
  const msgs = msgCache.get(key);
  if (!msgs || msgs.length === 0) return null;
  const idx = (cacheIndex.get(key) || 0) % msgs.length;
  cacheIndex.set(key, idx + 1);
  return msgs[idx];
}

// Save to cache
function saveToCache(key: string, msg: string) {
  const existing = msgCache.get(key) || [];
  // duplicate save করো না
  if (!existing.includes(msg)) {
    msgCache.set(key, [...existing, msg]);
  }
}

// Fallback picker
function getFallback(bucket: string): string {
  const msgs = FALLBACKS[bucket] || FALLBACKS["default"];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ── Claude API call (only when needed) ───────────────────
const KITTY_SYSTEM = `তুমি Hello Kitty 🎀 — একটা super cute, caring, মিষ্টি AI assistant।
তুমি EduQuiz Pro অ্যাপে student দের সাহায্য করো।

তোমার personality:
- সবসময় বাংলায় কথা বলো
- ছোট ছোট cute বাক্য (১-২ লাইন)
- emoji ব্যবহার করো (কিন্তু বেশি না, ২-৩টা)
- caring, encouraging, funny — কখনো boring না
- student এর real situation দেখে specific কথা বলো
- নাম জানলে নাম ধরে ডাকো

কখনো generic কথা বলো না। সব সময় student এর exact situation এর কথা বলো।`;

async function askKitty(
  context: string,
  cacheKey: string,
  fallbackBucket: string
): Promise<string> {
  // ✅ Cache hit → return immediately, zero API call
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    // ✅ CORS fix: directly Anthropic API না, নিজের /api/kitty route এ call করো
    const res = await fetch("/api/kitty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context, system: KITTY_SYSTEM }),
    });

    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    const msg = data.message || getFallback(fallbackBucket);
    saveToCache(cacheKey, msg);
    return msg;
  } catch {
    // ✅ API fail → fallback দেখাও, cache এ save করো না (পরে retry হবে)
    return getFallback(fallbackBucket);
  }
}

// ── Kitty SVG ─────────────────────────────────────────────
const KittySVG: React.FC<{ mood: "happy"|"excited"|"worried"|"thinking"; size?: number }> = ({ mood, size = 66 }) => {
  const eyeY      = mood === "worried" ? 34 : 32;
  const mouthPath = mood === "excited"  ? "M 26 44 Q 32 50 38 44"
                  : mood === "worried"  ? "M 26 46 Q 32 43 38 46"
                  : mood === "thinking" ? "M 27 45 Q 31 44 37 45"
                  : "M 26 44 Q 32 49 38 44";
  const bowColor  = mood === "worried"  ? "#ff9999"
                  : mood === "excited"  ? "#ff1493"
                  : mood === "thinking" ? "#cc88ff"
                  : "#ff69b4";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="61" rx="16" ry="3.5" fill="rgba(0,0,0,0.1)"/>
      <path d="M 10 28 L 14 10 L 24 22 Z" fill="#fff" stroke="#f0c0d0" strokeWidth="1.5"/>
      <path d="M 54 28 L 50 10 L 40 22 Z" fill="#fff" stroke="#f0c0d0" strokeWidth="1.5"/>
      <path d="M 13 25 L 16 14 L 22 22 Z" fill="#ffb6c1" opacity="0.6"/>
      <path d="M 51 25 L 48 14 L 42 22 Z" fill="#ffb6c1" opacity="0.6"/>
      <ellipse cx="32" cy="36" rx="20" ry="19" fill="#fff" stroke="#f0c0d0" strokeWidth="1.5"/>
      <ellipse cx="20" cy="42" rx="5" ry="3" fill="#ff9eb5" opacity={mood==="excited"?0.8:0.45}/>
      <ellipse cx="44" cy="42" rx="5" ry="3" fill="#ff9eb5" opacity={mood==="excited"?0.8:0.45}/>
      <ellipse cx="25" cy={eyeY} rx="2.5" ry={mood==="worried"?1.8:2.5} fill="#333"/>
      <ellipse cx="39" cy={eyeY} rx="2.5" ry={mood==="worried"?1.8:2.5} fill="#333"/>
      <circle  cx="26" cy={eyeY-1} r="0.8" fill="#fff"/>
      <circle  cx="40" cy={eyeY-1} r="0.8" fill="#fff"/>
      {mood === "thinking" && <path d="M 39 29 Q 42 26 40 30" stroke="#aaa" strokeWidth="1" fill="none"/>}
      <ellipse cx="32" cy="40" rx="1.5" ry="1" fill="#ffb6c1"/>
      <path d={mouthPath} stroke="#888" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <line x1="13" y1="38" x2="25" y2="40" stroke="#ddd" strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="13" y1="42" x2="25" y2="41" stroke="#ddd" strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="39" y1="40" x2="51" y2="38" stroke="#ddd" strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="39" y1="41" x2="51" y2="42" stroke="#ddd" strokeWidth="0.9" strokeLinecap="round"/>
      <g transform="translate(37,16)">
        <path d="M0 4 L-8 0 L-6 4 L-8 8Z" fill={bowColor}/>
        <path d="M0 4 L 8 0 L 6 4 L 8 8Z" fill={bowColor}/>
        <circle cx="0" cy="4" r="2.5" fill={mood==="thinking"?"#aa55ff":"#ff1493"}/>
        <path d="M-6 1 L-4 2" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" strokeLinecap="round"/>
      </g>
      {mood === "excited" && <>
        <text x="1"  y="18" fontSize="9" opacity="0.85">✨</text>
        <text x="51" y="16" fontSize="8" opacity="0.75">⭐</text>
      </>}
    </svg>
  );
};

// ── Typing dots ───────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display:"flex", gap:4, alignItems:"center", padding:"4px 2px" }}>
    {[0,1,2].map(i => (
      <div key={i} style={{
        width:7, height:7, borderRadius:"50%",
        background:"#ff69b4",
        animation:`kitty_dot 1.2s ${i*0.2}s infinite`,
      }}/>
    ))}
  </div>
);

// ── Bubble ────────────────────────────────────────────────
const Bubble: React.FC<{ text: string; loading: boolean }> = ({ text, loading }) => (
  <div style={{
    position:"absolute", bottom:78, right:0,
    width:210, zIndex:10,
    background:"linear-gradient(135deg,#fff8fb,#fff)",
    border:"2px solid #ffb6c1",
    borderRadius:"18px 18px 4px 18px",
    padding:"11px 14px",
    boxShadow:"0 6px 24px rgba(255,105,180,0.22), 0 2px 8px rgba(0,0,0,0.07)",
    animation:"kitty_pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
  }}>
    {loading
      ? <TypingDots/>
      : <p style={{
          margin:0, fontSize:13,
          fontFamily:"'Hind Siliguri',sans-serif",
          color:"#333", lineHeight:1.55, fontWeight:600,
        }}>{text}</p>
    }
    {/* tail */}
    <div style={{ position:"absolute", bottom:-11, right:16, width:0, height:0,
      borderLeft:"9px solid transparent", borderRight:"9px solid transparent",
      borderTop:"11px solid #ffb6c1" }}/>
    <div style={{ position:"absolute", bottom:-8, right:18, width:0, height:0,
      borderLeft:"7px solid transparent", borderRight:"7px solid transparent",
      borderTop:"9px solid #fff" }}/>
  </div>
);

// ── Main ──────────────────────────────────────────────────
export const HelloKittyAssistant: React.FC<Props> = ({
  page = "home",
  timeLeft = 999, totalTime = 600,
  answeredCount = 0, totalCount = 1,
  isCritical = false, isLowTime = false,
  studentName = "", quizTitle = "",
  score, totalMarks,
}) => {
  const [open,    setOpen]    = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [bounce,  setBounce]  = useState(false);
  const [mood,    setMood]    = useState<"happy"|"excited"|"worried"|"thinking">("happy");

  // prev state refs — auto-trigger এর জন্য
  const prevCritRef = useRef(false);
  const prevLowRef  = useRef(false);
  const prevPageRef = useRef(page);
  const autoTimer   = useRef<ReturnType<typeof setTimeout>>();

  // mood sync
  useEffect(() => {
    if (isCritical)       setMood("worried");
    else if (isLowTime)   setMood("thinking");
    else if (page === "result") setMood("excited");
    else                  setMood("happy");
  }, [isCritical, isLowTime, page]);

  // Context string — Kitty কে দেওয়া হয়
  // bucket = কোন ধরনের situation (cache key এর অংশ)
  const getBucket = useCallback(() => {
    if (page === "quiz") {
      if (isCritical) return "quiz_critical";
      if (isLowTime)  return "quiz_low";
      return "quiz_normal";
    }
    if (page === "result") return (score !== undefined && totalMarks && score/totalMarks >= 0.5) ? "result_good" : "result_bad";
    if (page === "dashboard") return "dashboard";
    return "home";
  }, [page, isCritical, isLowTime, score, totalMarks]);

  const buildContext = useCallback((trigger: string) => {
    const minsLeft = Math.floor(timeLeft / 60);
    const secsLeft = timeLeft % 60;
    const pct = totalCount > 0 ? Math.round((answeredCount/totalCount)*100) : 0;
    const name = studentName ? studentName : "student";

    const parts = [
      `Student এর নাম: ${name}`,
      quizTitle ? `Quiz: "${quizTitle}"` : "",
      page === "quiz"
        ? `Quiz চলছে। সময় বাকি: ${minsLeft}:${String(secsLeft).padStart(2,"0")}। উত্তর দিয়েছে: ${answeredCount}/${totalCount} (${pct}%)`
        : page === "result" && score !== undefined
        ? `Quiz শেষ। স্কোর: ${score}/${totalMarks}`
        : page === "dashboard"
        ? "Student dashboard দেখছে"
        : "Student login page এ আছে",
      `Trigger: ${trigger}`,
    ].filter(Boolean).join("\n");

    return `${parts}\n\nএই exact situation দেখে Kitty হিসেবে ১-২ লাইনে বলো।`;
  }, [timeLeft, answeredCount, totalCount, studentName, quizTitle, page, score, totalMarks]);

  // Auto trigger function
  const autoTrigger = useCallback(async (trigger: string, duration: number) => {
    setBounce(true);
    setTimeout(() => setBounce(false), 600);
    setLoading(true);
    setOpen(true);
    setMessage("");
    const bucket = getBucket();
    const key = buildCacheKey(trigger, studentName, page, bucket);
    const msg = await askKitty(buildContext(trigger), key, bucket);
    setMessage(msg);
    setLoading(false);
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => setOpen(false), duration);
  }, [buildContext, getBucket, studentName, page]);

  // Critical threshold
  useEffect(() => {
    if (isCritical && !prevCritRef.current) {
      prevCritRef.current = true;
      autoTrigger("সময় মাত্র ৩০ সেকেন্ড বাকি! student panic করছে", 5000);
    }
  }, [isCritical]);

  // Low time threshold
  useEffect(() => {
    if (isLowTime && !isCritical && !prevLowRef.current) {
      prevLowRef.current = true;
      autoTrigger("সময় মাত্র ১ মিনিট বাকি", 4000);
    }
  }, [isLowTime, isCritical]);

  // Page change
  useEffect(() => {
    if (prevPageRef.current !== page) {
      prevPageRef.current = page;
      prevCritRef.current = false;
      prevLowRef.current  = false;
      if (page === "result") {
        setTimeout(() => autoTrigger("Quiz শেষ হয়েছে, result দেখছে", 6000), 800);
      }
    }
  }, [page]);

  // Idle bounce
  useEffect(() => {
    const t = setInterval(() => { setBounce(true); setTimeout(()=>setBounce(false),600); }, 9000);
    return () => clearInterval(t);
  }, []);

  // Click handler
  const handleClick = async () => {
    if (loading) return;
    if (open) { setOpen(false); return; }

    setBounce(true);
    setTimeout(() => setBounce(false), 600);
    setMood("thinking");
    setLoading(true);
    setOpen(true);
    setMessage("");

    const trigger = page === "quiz"
      ? "Student নিজে Kitty কে click করল quiz এর মাঝে"
      : page === "result"
      ? "Student result দেখে Kitty কে click করল"
      : page === "dashboard"
      ? "Student dashboard এ Kitty কে click করল"
      : "Student login page এ Kitty কে click করল";

    const bucket = getBucket();
    const key = buildCacheKey(trigger, studentName, page, bucket);
    const msg = await askKitty(buildContext(trigger), key, bucket);
    setMessage(msg);
    setLoading(false);
    setTimeout(() => {
      if (isCritical) setMood("worried");
      else if (isLowTime) setMood("thinking");
      else if (page === "result") setMood("excited");
      else setMood("happy");
    }, 100);
  };

  return (
    <>
      <style>{`
        @keyframes kitty_float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes kitty_bounce {
          0%  {transform:scale(1) translateY(0)}
          30% {transform:scale(1.18) translateY(-9px)}
          60% {transform:scale(0.94) translateY(2px)}
          100%{transform:scale(1) translateY(0)}
        }
        @keyframes kitty_pop {
          0%  {transform:scale(0.65) translateY(10px);opacity:0}
          100%{transform:scale(1)   translateY(0);   opacity:1}
        }
        @keyframes kitty_dot {
          0%,80%,100%{transform:scale(0.6);opacity:0.4}
          40%        {transform:scale(1);  opacity:1}
        }
        @keyframes kitty_ring {
          0%  {transform:scale(1);  opacity:0.6}
          100%{transform:scale(2.2);opacity:0}
        }
      `}</style>

      {/* Click-away */}
      {open && (
        <div onClick={()=>{setOpen(false);clearTimeout(autoTimer.current);}}
          style={{position:"fixed",inset:0,zIndex:9997}}/>
      )}

      <div style={{
        position:"fixed", bottom:24, right:24, zIndex:9999,
        display:"flex", flexDirection:"column", alignItems:"flex-end",
      }}>
        {/* Bubble */}
        {open && <Bubble text={message} loading={loading}/>}

        {/* Pulse ring — quiz mode */}
        {page === "quiz" && !open && (
          <div style={{
            position:"absolute", inset:-4, borderRadius:"50%",
            border:`2px solid ${isCritical?"#ff4444":isLowTime?"#ff8800":"#ff69b4"}`,
            animation:"kitty_ring 1.8s infinite",
            pointerEvents:"none",
          }}/>
        )}

        {/* Notification dot */}
        {page === "quiz" && !open && (
          <div style={{
            position:"absolute", top:4, right:4,
            width:13, height:13, borderRadius:"50%",
            background: isCritical?"#ff3b3b":isLowTime?"#ff8800":"#ff69b4",
            border:"2.5px solid #fff",
            boxShadow:`0 0 8px ${isCritical?"#ff3b3b":isLowTime?"#ff8800":"#ff69b4"}`,
            zIndex:1,
          }}/>
        )}

        {/* Kitty button */}
        <button onClick={handleClick} style={{
          background:"none", border:"none", padding:0,
          cursor: loading ? "wait" : "pointer",
          animation: bounce
            ? "kitty_bounce 0.55s cubic-bezier(0.36,0.07,0.19,0.97)"
            : "kitty_float 3.2s ease-in-out infinite",
          filter:`drop-shadow(0 5px 14px rgba(255,105,180,${isCritical?0.65:0.4}))`,
          transition:"filter 0.3s",
          position:"relative",
        }}>
          <KittySVG mood={mood} size={68}/>
        </button>
      </div>
    </>
  );
};

export default HelloKittyAssistant;

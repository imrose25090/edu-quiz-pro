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

// ══════════════════════════════════════════════════
// CACHE SYSTEM — API call শুধু নতুন situation এ
// ══════════════════════════════════════════════════
const msgCache   = new Map<string, string[]>();
const cacheIdx   = new Map<string, number>();

function getCached(key: string): string | null {
  const msgs = msgCache.get(key);
  if (!msgs?.length) return null;
  const i = (cacheIdx.get(key) || 0) % msgs.length;
  cacheIdx.set(key, i + 1);
  return msgs[i];
}
function addToCache(key: string, msg: string) {
  if (!msg) return;
  const arr = msgCache.get(key) || [];
  if (!arr.includes(msg)) msgCache.set(key, [...arr, msg]);
}

// ══════════════════════════════════════════════════
// FALLBACKS — API fail হলে / না লাগলে
// ══════════════════════════════════════════════════
const FALLBACKS: Record<string, string[]> = {
  quiz_start:    ["শুভ পরীক্ষা! তুমি পারবে! 🎀✨", "মনোযোগ দাও, সব হবে! 💪🎀"],
  quiz_halfway:  ["অর্ধেক শেষ! দারুণ যাচ্ছে! 🎀🌟", "চালিয়ে যাও, প্রায় শেষ! 🏃🎀"],
  quiz_almost:   ["প্রায় শেষ! বাকিগুলো দাও! 🎯🎀", "আর অল্প বাকি! পারবে! ✨"],
  quiz_low:      ["সময় কম! তাড়াতাড়ি করো! ⚡🎀", "যেগুলো পারো আগে দাও! 🏃"],
  quiz_critical: ["৩০ সেকেন্ড! এখনই submit করো! 🚨🎀", "HURRY!! দেরি করো না! 🔴"],
  result_good:   ["অসাধারণ! তুমি চমৎকার করেছ! 🏆🎀", "এত ভালো! আমি গর্বিত! 🌟🎀"],
  result_ok:     ["ভালোই হয়েছে! পরের বার আরও! 💕🎀", "চেষ্টা ভালো ছিল! 🌸"],
  result_bad:    ["হার মানো না! আবার চেষ্টা করো! 💪🎀", "পরের বার আরও ভালো হবে! 🎀"],
  dashboard:     ["আজ কি নতুন quiz দেবে? 🎯🎀", "তোমার progress দারুণ! 📈🎀"],
  home:          ["হ্যালো! আমি Kitty 🎀 তোমাকে সাহায্য করব!", "Quiz দিতে তৈরি? ✨🎀"],
  click:         ["হ্যালো! কেমন আছ? 🎀💕", "আমি সবসময় তোমার পাশে! 🌸"],
};
function fallback(bucket: string): string {
  const arr = FALLBACKS[bucket] || FALLBACKS.click;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ══════════════════════════════════════════════════
// API CALL — Gemini via /api/kitty proxy
// ══════════════════════════════════════════════════
const SYSTEM = `তুমি Hello Kitty 🎀 — EduQuiz Pro এর super cute, caring AI assistant।
সবসময় বাংলায় কথা বলো। ১-২ লাইনে বলো। ২-৩টা emoji ব্যবহার করো।
Student এর exact situation দেখে specific কথা বলো।
নাম জানলে নাম ধরে ডাকো। কখনো generic কথা বলো না।`;

async function callAPI(context: string, cacheKey: string, bucket: string): Promise<string> {
  // cache hit → no API call
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch("/api/kitty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context, system: SYSTEM }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const msg = data.message || "";
    if (msg) addToCache(cacheKey, msg);
    return msg || fallback(bucket);
  } catch {
    return fallback(bucket);
  }
}

// ══════════════════════════════════════════════════
// KITTY SVG
// ══════════════════════════════════════════════════
const KittySVG: React.FC<{ mood: "happy"|"excited"|"worried"|"thinking"; size?: number }> = ({ mood, size = 66 }) => {
  const eyeY = mood === "worried" ? 34 : 32;
  const mouth = mood === "excited" ? "M 26 44 Q 32 50 38 44"
              : mood === "worried" ? "M 26 46 Q 32 43 38 46"
              : mood === "thinking"? "M 27 45 Q 31 44 37 45"
              : "M 26 44 Q 32 49 38 44";
  const bow = mood === "worried" ? "#ff9999" : mood === "thinking" ? "#cc88ff" : "#ff69b4";
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
      <circle cx="26" cy={eyeY-1} r="0.8" fill="#fff"/>
      <circle cx="40" cy={eyeY-1} r="0.8" fill="#fff"/>
      <ellipse cx="32" cy="40" rx="1.5" ry="1" fill="#ffb6c1"/>
      <path d={mouth} stroke="#888" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <line x1="13" y1="38" x2="25" y2="40" stroke="#ddd" strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="13" y1="42" x2="25" y2="41" stroke="#ddd" strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="39" y1="40" x2="51" y2="38" stroke="#ddd" strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="39" y1="41" x2="51" y2="42" stroke="#ddd" strokeWidth="0.9" strokeLinecap="round"/>
      <g transform="translate(37,16)">
        <path d="M0 4 L-8 0 L-6 4 L-8 8Z" fill={bow}/>
        <path d="M0 4 L 8 0 L 6 4 L 8 8Z" fill={bow}/>
        <circle cx="0" cy="4" r="2.5" fill={mood==="thinking"?"#aa55ff":"#ff1493"}/>
      </g>
      {mood==="excited" && <><text x="1" y="18" fontSize="9" opacity="0.85">✨</text><text x="51" y="16" fontSize="8" opacity="0.75">⭐</text></>}
    </svg>
  );
};

// ══════════════════════════════════════════════════
// BUBBLE
// ══════════════════════════════════════════════════
const Bubble: React.FC<{ text: string; loading: boolean }> = ({ text, loading }) => (
  <div style={{
    position:"absolute", bottom:78, right:0, width:215, zIndex:10,
    background:"linear-gradient(135deg,#fff8fb,#fff)",
    border:"2px solid #ffb6c1", borderRadius:"18px 18px 4px 18px",
    padding:"11px 14px",
    boxShadow:"0 6px 24px rgba(255,105,180,0.22), 0 2px 8px rgba(0,0,0,0.07)",
    animation:"kitty_pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
  }}>
    {loading
      ? <div style={{display:"flex",gap:4,alignItems:"center",padding:"4px 2px"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#ff69b4",animation:`kitty_dot 1.2s ${i*0.2}s infinite`}}/>
          ))}
        </div>
      : <p style={{margin:0,fontSize:13,fontFamily:"'Hind Siliguri',sans-serif",color:"#333",lineHeight:1.55,fontWeight:600}}>{text}</p>
    }
    <div style={{position:"absolute",bottom:-11,right:16,width:0,height:0,borderLeft:"9px solid transparent",borderRight:"9px solid transparent",borderTop:"11px solid #ffb6c1"}}/>
    <div style={{position:"absolute",bottom:-8,right:18,width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"9px solid #fff"}}/>
  </div>
);

// ══════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════
export const HelloKittyAssistant: React.FC<Props> = ({
  page = "home",
  timeLeft = 999, totalTime = 600,
  answeredCount = 0, totalCount = 1,
  isCritical = false, isLowTime = false,
  studentName = "", quizTitle = "",
  score, totalMarks,
}) => {
  const [open,    setOpen]    = useState(false);
  const [msg,     setMsg]     = useState("");
  const [loading, setLoading] = useState(false);
  const [bounce,  setBounce]  = useState(false);
  const [mood,    setMood]    = useState<"happy"|"excited"|"worried"|"thinking">("happy");

  const autoTimer  = useRef<ReturnType<typeof setTimeout>>();
  const prevPage   = useRef(page);
  const prevCrit   = useRef(false);
  const prevLow    = useRef(false);
  // progress milestones — শুধু একবার trigger হবে
  const milestone25 = useRef(false);
  const milestone50 = useRef(false);
  const milestone75 = useRef(false);

  // ── context builder ───────────────────────────
  const buildContext = useCallback((trigger: string) => {
    const mL = Math.floor(timeLeft/60), sL = timeLeft%60;
    const pct = totalCount > 0 ? Math.round(answeredCount/totalCount*100) : 0;
    const name = studentName || "student";
    return [
      `Student: ${name}`,
      quizTitle ? `Quiz: "${quizTitle}"` : "",
      page === "quiz"
        ? `Quiz চলছে। সময় বাকি: ${mL}:${String(sL).padStart(2,"0")}। উত্তর: ${answeredCount}/${totalCount} (${pct}%)`
        : page === "result" && score !== undefined
        ? `Quiz শেষ। Score: ${score}/${totalMarks} (${totalMarks?Math.round(score/totalMarks*100):0}%)`
        : page === "dashboard" ? "Dashboard দেখছে"
        : "Login page এ আছে",
      `Situation: ${trigger}`,
    ].filter(Boolean).join("\n") + "\n\nKitty হিসেবে ১-২ লাইনে বলো।";
  }, [timeLeft, answeredCount, totalCount, studentName, quizTitle, page, score, totalMarks]);

  // ── bucket — কোন ধরনের situation ─────────────
  const getBucket = useCallback((): string => {
    if (page === "quiz") {
      if (isCritical) return "quiz_critical";
      if (isLowTime)  return "quiz_low";
      const pct = totalCount > 0 ? answeredCount/totalCount : 0;
      if (pct < 0.3)  return "quiz_start";
      if (pct < 0.6)  return "quiz_halfway";
      return "quiz_almost";
    }
    if (page === "result") {
      const p = totalMarks ? (score||0)/totalMarks : 0;
      return p >= 0.8 ? "result_good" : p >= 0.5 ? "result_ok" : "result_bad";
    }
    return page === "dashboard" ? "dashboard" : "home";
  }, [page, isCritical, isLowTime, answeredCount, totalCount, score, totalMarks]);

  // ── trigger helper ─────────────────────────────
  const trigger = useCallback(async (situation: string, duration = 4000) => {
    const bucket   = getBucket();
    const cacheKey = `${bucket}__${page}__${studentName}__${situation}`;
    setBounce(true); setTimeout(()=>setBounce(false), 600);
    setLoading(true); setOpen(true); setMsg("");
    const text = await callAPI(buildContext(situation), cacheKey, bucket);
    setMsg(text); setLoading(false);
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => setOpen(false), duration);
  }, [getBucket, buildContext, page, studentName]);

  // ── mood sync ──────────────────────────────────
  useEffect(() => {
    if (isCritical)           setMood("worried");
    else if (isLowTime)       setMood("thinking");
    else if (page==="result") setMood("excited");
    else                      setMood("happy");
  }, [isCritical, isLowTime, page]);

  // ── Page change → auto greet ───────────────────
  useEffect(() => {
    if (prevPage.current === page) return;
    prevPage.current = page;
    prevCrit.current  = false;
    prevLow.current   = false;
    milestone25.current = false;
    milestone50.current = false;
    milestone75.current = false;

    if (page === "quiz") {
      setTimeout(() => trigger("Quiz শুরু হয়েছে", 5000), 1000);
    } else if (page === "result") {
      setTimeout(() => trigger("Quiz শেষ, result দেখছে", 6000), 800);
    } else if (page === "dashboard") {
      setTimeout(() => trigger("Dashboard এ এসেছে"), 1200);
    }
  }, [page]);

  // ── Critical threshold ─────────────────────────
  useEffect(() => {
    if (isCritical && !prevCrit.current) {
      prevCrit.current = true;
      trigger("মাত্র ৩০ সেকেন্ড বাকি! Critical!", 5000);
    }
  }, [isCritical]);

  // ── Low time threshold ─────────────────────────
  useEffect(() => {
    if (isLowTime && !isCritical && !prevLow.current) {
      prevLow.current = true;
      trigger("মাত্র ১ মিনিট বাকি", 4500);
    }
  }, [isLowTime, isCritical]);

  // ── Progress milestones ────────────────────────
  useEffect(() => {
    if (page !== "quiz" || totalCount === 0) return;
    const pct = answeredCount / totalCount;

    if (pct >= 0.25 && pct < 0.5 && !milestone25.current) {
      milestone25.current = true;
      trigger(`${answeredCount}টা উত্তর দিয়েছে (২৫%)`, 3500);
    } else if (pct >= 0.5 && pct < 0.75 && !milestone50.current) {
      milestone50.current = true;
      trigger(`অর্ধেক শেষ! ${answeredCount}/${totalCount} উত্তর দিয়েছে`, 3500);
    } else if (pct >= 0.75 && pct < 1 && !milestone75.current) {
      milestone75.current = true;
      trigger(`৭৫% শেষ! মাত্র ${totalCount - answeredCount}টা বাকি`, 3500);
    }
  }, [answeredCount, totalCount, page]);

  // ── Idle bounce ────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => { setBounce(true); setTimeout(()=>setBounce(false),600); }, 10000);
    return () => clearInterval(t);
  }, []);

  // ── Click ──────────────────────────────────────
  const handleClick = async () => {
    if (loading) return;
    if (open) { setOpen(false); clearTimeout(autoTimer.current); return; }
    setMood("thinking");
    await trigger(
      page === "quiz"      ? `Student নিজে click করল, ${answeredCount}/${totalCount} উত্তর দিয়েছে, ${Math.floor(timeLeft/60)} মিনিট বাকি`
      : page === "result"  ? `Result দেখে Kitty click করল, score: ${score}/${totalMarks}`
      : page === "dashboard"? "Dashboard এ Kitty click করল"
      : "Login page এ Kitty click করল"
    );
    // mood restore
    setTimeout(() => {
      if (isCritical)           setMood("worried");
      else if (isLowTime)       setMood("thinking");
      else if (page==="result") setMood("excited");
      else                      setMood("happy");
    }, 200);
  };

  return (
    <>
      <style>{`
        @keyframes kitty_float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes kitty_bounce { 0%{transform:scale(1)} 30%{transform:scale(1.18) translateY(-9px)} 60%{transform:scale(0.94) translateY(2px)} 100%{transform:scale(1)} }
        @keyframes kitty_pop    { 0%{transform:scale(0.65) translateY(10px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes kitty_dot    { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes kitty_ring   { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.4);opacity:0} }
      `}</style>

      {open && (
        <div onClick={()=>{setOpen(false);clearTimeout(autoTimer.current);}}
          style={{position:"fixed",inset:0,zIndex:9997}}/>
      )}

      <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
        {open && <Bubble text={msg} loading={loading}/>}

        {/* Pulse ring — quiz mode */}
        {page==="quiz" && !open && (
          <div style={{
            position:"absolute",inset:-4,borderRadius:"50%",
            border:`2px solid ${isCritical?"#ff4444":isLowTime?"#ff8800":"#ff69b4"}`,
            animation:"kitty_ring 2s infinite",pointerEvents:"none",
          }}/>
        )}

        {/* Notification dot */}
        {page==="quiz" && !open && (
          <div style={{
            position:"absolute",top:4,right:4,width:13,height:13,borderRadius:"50%",
            background:isCritical?"#ff3b3b":isLowTime?"#ff8800":"#ff69b4",
            border:"2.5px solid #fff",
            boxShadow:`0 0 8px ${isCritical?"#ff3b3b":isLowTime?"#ff8800":"#ff69b4"}`,
            zIndex:1,
          }}/>
        )}

        <button onClick={handleClick} title="Hello Kitty Assistant" style={{
          background:"none",border:"none",padding:0,
          cursor:loading?"wait":"pointer",
          animation:bounce
            ? "kitty_bounce 0.55s cubic-bezier(0.36,0.07,0.19,0.97)"
            : "kitty_float 3.2s ease-in-out infinite",
          filter:`drop-shadow(0 5px 14px rgba(255,105,180,${isCritical?0.65:0.4}))`,
          transition:"filter 0.3s",
        }}>
          <KittySVG mood={mood} size={68}/>
        </button>
      </div>
    </>
  );
};

export default HelloKittyAssistant;

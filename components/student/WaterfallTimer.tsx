import React, { memo } from "react";

interface Props {
  timerRef: React.RefObject<HTMLDivElement>;
  pos: { x: number; y: number };
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  mins: number;
  secs: string | number;
  isCritical: boolean;
  isLowTime: boolean;
  answeredCount: number;
  totalCount: number;
  totalTime: number;
  timeLeft: number;
}

// ── Minimalist Compact Digit ─────────────────────────────
const MiniDigit = memo(({ val, color }: { val: string; color: string }) => (
  <div 
    className="relative w-9 h-11 flex items-center justify-center rounded-lg overflow-hidden"
    style={{ 
      background: "rgba(30, 41, 59, 0.7)",
      border: `1px solid ${color}22`,
      boxShadow: `inset 0 0 8px ${color}11`
    }}
  >
    <span 
      key={val}
      style={{ color, textShadow: `0 0 10px ${color}99` }}
      className="text-2xl font-black tracking-tighter animate-[dropIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]"
    >
      {val}
    </span>
    <div className="absolute inset-x-0 top-0 h-[1px] bg-white/10" />
  </div>
));

export const WaterfallTimer: React.FC<Props> = ({
  timerRef, pos, dragging,
  onPointerDown, onPointerMove, onPointerUp,
  mins, secs, isCritical, isLowTime,
  answeredCount, totalCount,
  totalTime, timeLeft
}) => {
  const m = String(mins).padStart(2, "0");
  const s = String(secs).padStart(2, "0");
  
  const themeColor = isCritical ? "#ff4757" : isLowTime ? "#ffa502" : "#2ed573";
  const progress = (timeLeft / totalTime) * 100;

  return (
    <>
      <style>{`
        @keyframes dropIn {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes subtleGlow {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${themeColor}22; }
          50% { box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 15px ${themeColor}33; }
        }
      `}</style>

      <div
        ref={timerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          left: pos.x, top: pos.y,
          position: "fixed", zIndex: 9999,
          touchAction: "none", userSelect: "none",
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(16px)",
          borderRadius: "20px",
          padding: "10px 12px",
          display: "flex", flexDirection: "column", gap: "8px",
          cursor: dragging ? "grabbing" : "grab",
          animation: "subtleGlow 2s infinite",
          width: "155px", // আরও ছোট করা হয়েছে
          border: `1px solid ${themeColor}33`
        }}
      >
        {/* Top Info */}
        <div className="flex justify-between items-center px-0.5">
          <span className="text-[9px] font-bold tracking-widest text-white/50 uppercase">
            {isCritical ? "Hurry!" : "Time"}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/5 rounded-md text-white/80">
            {answeredCount}/{totalCount}
          </span>
        </div>

        {/* Watch Section */}
        <div className="flex items-center justify-center gap-1.5">
          <div className="flex gap-0.5">
            <MiniDigit val={m[0]} color={themeColor} />
            <MiniDigit val={m[1]} color={themeColor} />
          </div>
          
          <div className="flex flex-col gap-1 opacity-50">
            <div style={{ background: themeColor }} className="w-1 h-1 rounded-full" />
            <div style={{ background: themeColor }} className="w-1 h-1 rounded-full" />
          </div>

          <div className="flex gap-0.5">
            <MiniDigit val={s[0]} color={themeColor} />
            <MiniDigit val={s[1]} color={themeColor} />
          </div>
        </div>

        {/* Slim Progress Bar */}
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            style={{ 
              width: `${progress}%`,
              background: themeColor,
              boxShadow: `0 0 8px ${themeColor}aa`,
              transition: "width 1s linear"
            }}
            className="h-full rounded-full"
          />
        </div>
      </div>
    </>
  );
};

export default WaterfallTimer;

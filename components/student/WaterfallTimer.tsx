import React, { memo, useState, useEffect } from "react";

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

// ── Falling Digit (পড়ন্ত সংখ্যা) - Responsive ────────────────────────
const FallingDigit = ({ 
  digit, 
  color, 
  delay, 
  startX,
  isMobile
}: { 
  digit: string; 
  color: string; 
  delay: number;
  startX: number;
  isMobile: boolean;
}) => {
  const size = isMobile ? { w: 32, h: 42, font: 24 } : { w: 40, h: 52, font: 30 };
  
  return (
    <div
      style={{
        position: "absolute",
        left: `${startX}px`,
        top: isMobile ? "-50px" : "-60px",
        animation: `digitFall 1.2s ease-in ${delay}s forwards`,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Digit itself */}
      <div
        style={{
          width: `${size.w}px`,
          height: `${size.h}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.9)",
          border: `${isMobile ? 2 : 3}px solid ${color}`,
          borderRadius: isMobile ? "6px" : "8px",
          color: color,
          fontSize: `${size.font}px`,
          fontWeight: "900",
          textShadow: `
            0 0 ${isMobile ? 8 : 10}px ${color},
            0 0 ${isMobile ? 15 : 20}px ${color},
            0 0 ${isMobile ? 20 : 30}px ${color}
          `,
          boxShadow: `
            0 0 ${isMobile ? 20 : 30}px ${color},
            0 ${isMobile ? 3 : 4}px ${isMobile ? 12 : 15}px rgba(0,0,0,0.5)
          `,
          animation: `digitRotate 1.2s ease-in ${delay}s forwards`,
        }}
      >
        {digit}
      </div>

      {/* Splash particles */}
      <div
        style={{
          position: "absolute",
          bottom: isMobile ? "-25px" : "-30px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {[...Array(isMobile ? 12 : 16)].map((_, i) => {
          const angle = (i * 360) / (isMobile ? 12 : 16);
          const distance = isMobile ? 20 + Math.random() * 20 : 25 + Math.random() * 30;
          
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${isMobile ? 4 : 6}px`,
                height: `${isMobile ? 4 : 6}px`,
                background: color,
                borderRadius: "50%",
                opacity: 0,
                boxShadow: `0 0 ${isMobile ? 8 : 10}px ${color}`,
                animation: `splashParticle 0.8s ease-out ${delay + 1.2}s forwards`,
                "--splash-angle": `${angle}deg`,
                "--splash-dist": `${distance}px`,
              } as any}
            />
          );
        })}
        
        {/* Splash ring */}
        <div
          style={{
            position: "absolute",
            width: isMobile ? "60px" : "80px",
            height: isMobile ? "60px" : "80px",
            border: `${isMobile ? 3 : 4}px solid ${color}`,
            borderRadius: "50%",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%) scale(0)",
            opacity: 0,
            boxShadow: `0 0 ${isMobile ? 15 : 20}px ${color}`,
            animation: `splashRing 0.7s ease-out ${delay + 1.2}s forwards`,
          }}
        />
      </div>
    </div>
  );
};

// ── Smooth Digit - Responsive ────────────────────────────
const MiniDigit = memo(({ val, color, shouldFall, isMobile }: { 
  val: string; 
  color: string; 
  shouldFall?: boolean;
  isMobile: boolean;
}) => {
  const size = isMobile ? { w: 32, h: 42, font: 24 } : { w: 38, h: 50, font: 28 };
  
  return (
    <div 
      className="relative flex items-center justify-center rounded overflow-hidden"
      style={{
        width: `${size.w}px`,
        height: `${size.h}px`,
        background: "rgba(0, 0, 0, 0.7)",
        border: `${isMobile ? 1.5 : 2}px solid ${color}66`,
        opacity: shouldFall ? 0 : 1,
        transition: "opacity 0.3s ease",
        boxShadow: `0 0 ${isMobile ? 10 : 15}px ${color}33`
      }}
    >
      <span 
        key={val}
        style={{ 
          color, 
          fontSize: `${size.font}px`,
          fontWeight: "900",
          textShadow: `
            0 0 ${isMobile ? 8 : 10}px ${color},
            0 0 ${isMobile ? 15 : 20}px ${color}
          `
        }}
        className="animate-[dropIn_0.4s_ease-out]"
      >
        {val}
      </span>
    </div>
  );
});

export const WaterfallTimer: React.FC<Props> = ({
  timerRef, pos, dragging,
  onPointerDown, onPointerMove, onPointerUp,
  mins, secs, isCritical, isLowTime,
  answeredCount, totalCount,
  totalTime, timeLeft
}) => {
  const m = String(mins).padStart(2, "0");
  const s = String(secs).padStart(2, "0");
  const themeColor = isCritical ? "#ff4d4d" : isLowTime ? "#ffa502" : "#00ffcc";
  const progress = (timeLeft / totalTime) * 100;

  const [falling, setFalling] = useState(false);
  const [digits, setDigits] = useState<Array<{ digit: string; delay: number; startX: number }>>([]);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !falling) {
      setFalling(true);
      
      const allDigits = [m[0], m[1], s[0], s[1]];
      const digitElements: Array<{ digit: string; delay: number; startX: number }> = [];
      
      const digitWidth = isMobile ? 32 : 38;
      const gap = isMobile ? 4 : 6;
      const colonWidth = isMobile ? 8 : 10;
      
      allDigits.forEach((digit, i) => {
        let baseX = 12 + (i * (digitWidth + gap));
        if (i >= 2) baseX += colonWidth; // colon space
        
        digitElements.push({
          digit,
          delay: i * 0.15,
          startX: baseX
        });
      });
      
      setDigits(digitElements);
    }
  }, [timeLeft, falling, m, s, isMobile]);

  // ✅ Responsive positioning
  const timerWidth = isMobile ? 160 : 200;
  const timerHeight = isMobile ? 100 : 120;
  
  const safeX = pos.x ?? (typeof window !== 'undefined' ? window.innerWidth - timerWidth - 20 : 0);
  const safeY = pos.y ?? (typeof window !== 'undefined' ? 20 : 0); // ✅ Top positioning for mobile

  return (
    <>
      <style>{`
        @keyframes dropIn { 
          from { transform: translateY(-100%); opacity: 0; } 
          to { transform: translateY(0); opacity: 1; } 
        }
        
        @keyframes digitFall { 
          0% { transform: translateY(0); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(${isMobile ? 180 : 220}px); opacity: 1; }
        }
        
        @keyframes digitRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes splashParticle { 
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { 
            transform: translate(
              calc(cos(var(--splash-angle)) * var(--splash-dist)), 
              calc(sin(var(--splash-angle)) * var(--splash-dist))
            ) scale(0.2); 
            opacity: 0; 
          }
        }
        
        @keyframes splashRing {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        
        @keyframes containerFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; transform: scale(0.95); }
        }
      `}</style>

      <div
        ref={timerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          left: safeX, 
          top: safeY,
          position: "fixed", 
          zIndex: 9999,
          touchAction: "none", 
          userSelect: "none",
          background: "rgba(10, 15, 25, 0.95)",
          backdropFilter: `blur(${isMobile ? 12 : 16}px)`,
          borderRadius: isMobile ? "12px" : "16px",
          padding: isMobile ? "10px" : "14px",
          display: "flex", 
          flexDirection: "column", 
          gap: isMobile ? "6px" : "8px",
          cursor: dragging ? "grabbing" : "grab",
          width: `${timerWidth}px`,
          border: `${isMobile ? 2 : 3}px solid ${themeColor}`,
          transition: "all 0.3s ease",
          boxShadow: `
            0 0 ${isMobile ? 25 : 40}px ${themeColor}66,
            0 ${isMobile ? 6 : 10}px ${isMobile ? 25 : 40}px rgba(0,0,0,0.5)
          `,
          overflow: "visible",
          animation: falling ? "containerFadeOut 0.8s 2.5s forwards" : "none",
        }}
      >
        {/* Falling Digits */}
        {falling && (
          <div style={{ 
            position: "absolute", 
            inset: 0, 
            pointerEvents: "none",
            overflow: "visible",
            zIndex: 100
          }}>
            {digits.map((item, i) => (
              <FallingDigit
                key={i}
                digit={item.digit}
                color={themeColor}
                delay={item.delay}
                startX={item.startX}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}

        {/* Timer Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div 
            className="flex justify-between items-center text-white uppercase"
            style={{
              fontSize: isMobile ? "8px" : "10px",
              fontWeight: "900",
              letterSpacing: isMobile ? "1px" : "1.5px",
              marginBottom: "3px"
            }}
          >
            <span style={{ 
              color: themeColor,
              textShadow: `0 0 6px ${themeColor}`
            }}>
              {isCritical ? (isMobile ? "CRITICAL" : "🔥 CRITICAL") : (isMobile ? "TIME" : "⏱ TIME")}
            </span>
            <span style={{ 
              color: themeColor,
              fontSize: isMobile ? "10px" : "12px",
              fontWeight: "900",
              textShadow: `0 0 8px ${themeColor}`
            }}>
              {answeredCount}/{totalCount}
            </span>
          </div>

          {/* Digits */}
          <div className="flex items-center justify-center" style={{ gap: isMobile ? "4px" : "6px" }}>
            <MiniDigit val={m[0]} color={themeColor} shouldFall={falling} isMobile={isMobile} />
            <MiniDigit val={m[1]} color={themeColor} shouldFall={falling} isMobile={isMobile} />
            
            {/* Colon */}
            <div 
              className="flex flex-col mx-0.5"
              style={{ 
                opacity: falling ? 0 : 1, 
                transition: "opacity 0.3s",
                gap: isMobile ? "4px" : "6px"
              }}
            >
              <div style={{ 
                background: themeColor,
                boxShadow: `0 0 6px ${themeColor}`,
                width: isMobile ? "4px" : "6px",
                height: isMobile ? "4px" : "6px"
              }} className="rounded-full animate-pulse" />
              <div style={{ 
                background: themeColor,
                boxShadow: `0 0 6px ${themeColor}`,
                width: isMobile ? "4px" : "6px",
                height: isMobile ? "4px" : "6px"
              }} className="rounded-full animate-pulse" />
            </div>
            
            <MiniDigit val={s[0]} color={themeColor} shouldFall={falling} isMobile={isMobile} />
            <MiniDigit val={s[1]} color={themeColor} shouldFall={falling} isMobile={isMobile} />
          </div>

          {/* Progress bar */}
          <div 
            className="w-full bg-black/40 rounded-full overflow-hidden"
            style={{
              height: isMobile ? "4px" : "5px",
              marginTop: isMobile ? "5px" : "6px",
              border: `1px solid ${themeColor}33`
            }}
          >
            <div 
              style={{ 
                width: `${progress}%`, 
                background: `linear-gradient(90deg, ${themeColor}, ${themeColor}dd)`,
                boxShadow: `0 0 ${isMobile ? 10 : 12}px ${themeColor}`, 
                transition: "width 1s linear",
                height: "100%",
                borderRadius: "3px"
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default WaterfallTimer;

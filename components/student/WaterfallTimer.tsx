import React, { useRef, useEffect } from "react";

interface Props {
  timerRef: React.RefObject<HTMLDivElement>;
  pos: { x: number; y: number };
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  mins: number;
  secs: string;
  isCritical: boolean;
  isLowTime: boolean;
  answeredCount: number;
  totalCount: number;
}

const FONT: Record<string, number[][]> = {
  "0": [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  "1": [[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
  "2": [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  "3": [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  "4": [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  "5": [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  "6": [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  "7": [[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
  "8": [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  "9": [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
  ":": [[0,0,0],[0,1,0],[0,0,0],[0,1,0],[0,0,0]],
};

export const WaterfallTimer: React.FC<Props> = ({
  timerRef, pos, dragging,
  onPointerDown, onPointerMove, onPointerUp,
  mins, secs, isCritical, isLowTime,
  answeredCount, totalCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const color = isCritical ? "#ff4d4d" : isLowTime ? "#ffa500" : "#00f3ff";
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationFrame: number;
    const drops: { x: number; y: number; speed: number; length: number; opacity: number }[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ১. রেইন ড্রপ জেনারেট করা (আরও ঘন এবং স্মুথ) - সীমা যোগ করা হয়েছে
      if (Math.random() > 0.1 && drops.length < 100) {
        drops.push({
          x: Math.random() * canvas.width,
          y: -20,
          speed: 4 + Math.random() * 5,
          length: 10 + Math.random() * 15,
          opacity: 0.1 + Math.random() * 0.4
        });
      }

      // ২. ড্রপগুলো অ্যানিমেট করা - ব্যাকওয়ার্ড লুপ ব্যবহার করা হয়েছে
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += d.speed;
        
        const grad = ctx.createLinearGradient(d.x, d.y - d.length, d.x, d.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, color);

        ctx.globalAlpha = d.opacity;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.length);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();

        if (d.y > canvas.height + 20) {
          drops.splice(i, 1);
        }
      }

      // ৩. ড্রপ যখন ডিজিটের ওপর পড়বে তখন সেটিকে ফুটিয়ে তোলা
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0; // Reset shadow from previous operations
      let startX = 15;
      const charW = 22;
      const charH = 38;
      const gap = 10;

      timeStr.split("").forEach((char) => {
        const matrix = FONT[char] || FONT["0"];
        matrix.forEach((row, rIdx) => {
          row.forEach((cell, cIdx) => {
            if (cell === 1) {
              const px = startX + cIdx * (charW / 3);
              const py = 20 + rIdx * (charH / 5);

              // ডিজিটের ওপর গ্লোয়িং ইফেক্ট
              ctx.shadowBlur = 12;
              ctx.shadowColor = color;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fill();
              
              // হালকা পানির ঝাপটা ইফেক্ট
              if(Math.random() > 0.8) {
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#fff";
                ctx.fillRect(px, py, 1, 4);
              }
            }
          });
        });
        startX += charW + gap;
      });

      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [timeStr, color]);

  return (
    <div
      ref={timerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed", left: pos.x, top: pos.y, 
        zIndex: 1000000, cursor: dragging ? "grabbing" : "grab",
        touchAction: "none", userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {/* কোনো ব্যাকগ্রাউন্ড নেই, শুধু ক্যানভাস */}
      <canvas ref={canvasRef} width={200} height={100} style={{ display: "block" }} />
      
      {/* নিচে ছোট করে প্রগ্রেস টেক্সট */}
      <div style={{
        textAlign: "center", color: color, fontSize: "12px", 
        fontFamily: "monospace", fontWeight: "bold",
        textShadow: `0 0 5px ${color}`, marginTop: "-10px"
      }}>
        {answeredCount}/{totalCount}
      </div>
    </div>
  );
};
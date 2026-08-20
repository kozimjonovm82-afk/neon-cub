import React, { useEffect, useRef } from 'react';
import { Play, Layers, Wrench, Settings as SettingsIcon, Shield, Star, Sparkles } from 'lucide-react';
import { PlayerCustomization } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface MainMenuProps {
  customization: PlayerCustomization;
  totalCoins: number;
  totalStars: number;
  onPlay: () => void;
  onOpenLevels: () => void;
  onOpenGarage: () => void;
  onOpenEditor: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  customization,
  totalCoins,
  totalStars,
  onPlay,
  onOpenLevels,
  onOpenGarage,
  onOpenEditor,
  onOpenSettings,
}) => {
  const cubeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated spinning hero cube
  useEffect(() => {
    let animId: number;
    let angle = 0;

    const renderHero = () => {
      const canvas = cubeCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      angle += 0.02;
      const size = 68;
      const cx = w / 2;
      const cy = h / 2 + Math.sin(angle * 2) * 8; // Floating hover effect

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Base body
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-size / 2, -size / 2, size, size);

      // Glowing outer rim
      ctx.strokeStyle = customization.primaryColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = customization.primaryColor;
      ctx.shadowBlur = 24;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.shadowBlur = 0;

      // Inner details based on equipped skin
      const skin = customization.skinId;
      if (skin === 'cyber_visor') {
        ctx.fillStyle = customization.secondaryColor;
        ctx.fillRect(-size / 2 + 8, -size / 2 + 16, size - 16, 16);
      } else if (skin === 'matrix_grid') {
        ctx.strokeStyle = customization.secondaryColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(-size / 2 + 12, -size / 2 + 12, size - 24, size - 24);
      } else if (skin === 'void_skull' || skin === 'apex_overlord') {
        ctx.fillStyle = customization.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-size / 2 + 12, -size / 2 + 14);
        ctx.lineTo(-size / 2 + 24, -size / 2 + 28);
        ctx.lineTo(-size / 2 + 12, -size / 2 + 34);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(size / 2 - 12, -size / 2 + 14);
        ctx.lineTo(size / 2 - 24, -size / 2 + 28);
        ctx.lineTo(size / 2 - 12, -size / 2 + 34);
        ctx.fill();
      } else {
        ctx.fillStyle = customization.secondaryColor;
        ctx.fillRect(-size / 2 + 14, -size / 2 + 14, size - 28, size - 28);
      }

      ctx.restore();

      animId = requestAnimationFrame(renderHero);
    };

    renderHero();
    return () => cancelAnimationFrame(animId);
  }, [customization]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 sm:p-10 select-none bg-transparent overflow-y-auto">
      {/* Top Banner Stats */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Total Stars */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#080810]/90 border border-yellow-500/40 rounded-full text-yellow-400 font-display font-bold text-xs sm:text-sm shadow-[0_0_10px_rgba(234,179,8,0.2)]">
            <Star size={15} fill="currentColor" />
            <span>{totalStars} YULDUZ</span>
          </div>
          {/* Total Coins */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#080810]/90 border border-[#00f3ff]/40 rounded-full text-[#00f3ff] font-display font-bold text-xs sm:text-sm shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <span>★</span>
            <span>{totalCoins} COINS</span>
          </div>
        </div>

        {/* Quick Settings Icon */}
        <button
          id="btn-main-settings"
          onClick={() => {
            onOpenSettings();
            soundEngine.playClick();
          }}
          className="p-2.5 rounded-xl bg-[#080810]/90 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 cursor-pointer shadow-lg hover:border-[#00f3ff]/50"
          title="Sozlamalar"
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* Main Center Stage (Title + Animated Cube Hero) */}
      <div className="flex flex-col items-center gap-4 my-auto">
        <div className="flex flex-col items-center">
          <span className="text-[11px] sm:text-xs font-bold font-display uppercase tracking-[0.3em] text-[#00f3ff] mb-1.5 text-glow-cyan">
            2D Rhythm Platformer
          </span>
          <h1 className="text-4xl sm:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#d946ef] to-[#ff00ff] tracking-wider text-glow-cyan text-center italic">
            NEON CUBE RUSH
          </h1>
        </div>

        {/* Animated Floating Cube */}
        <div className="relative my-2">
          <canvas
            ref={cubeCanvasRef}
            width={180}
            height={180}
            className="filter drop-shadow-[0_0_25px_rgba(0,243,255,0.5)]"
          />
        </div>

        {/* Primary Action Buttons Grid */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {/* Big START Button with Laser Gradient & Glow */}
          <button
            id="btn-main-play"
            onClick={() => {
              soundEngine.init();
              soundEngine.playClick();
              onPlay();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#00f3ff] via-[#d946ef] to-[#ff00ff] hover:brightness-110 text-black font-display font-black text-lg tracking-widest uppercase flex items-center justify-center gap-3 transition-all transform hover:scale-102 active:scale-98 cursor-pointer shadow-[0_0_25px_rgba(0,243,255,0.5)] border border-white/40"
          >
            <Play size={22} fill="currentColor" /> START
          </button>

          {/* Secondary Buttons Row */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* LEVELS */}
            <button
              id="btn-main-levels"
              onClick={() => {
                onOpenLevels();
                soundEngine.playClick();
              }}
              className="py-3.5 px-2 rounded-xl bg-[#080810]/90 hover:bg-white/10 border border-white/10 hover:border-[#00f3ff] text-slate-200 font-display font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(0,243,255,0.3)]"
            >
              <Layers size={18} className="text-[#00f3ff]" />
              <span>LEVELLAR</span>
            </button>

            {/* GARAGE */}
            <button
              id="btn-main-garage"
              onClick={() => {
                onOpenGarage();
                soundEngine.playClick();
              }}
              className="py-3.5 px-2 rounded-xl bg-[#080810]/90 hover:bg-white/10 border border-white/10 hover:border-[#ff00ff] text-slate-200 font-display font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]"
            >
              <Sparkles size={18} className="text-[#ff00ff]" />
              <span>GARAGE</span>
            </button>

            {/* EDITOR */}
            <button
              id="btn-main-editor"
              onClick={() => {
                onOpenEditor();
                soundEngine.playClick();
              }}
              className="py-3.5 px-2 rounded-xl bg-[#080810]/90 hover:bg-white/10 border border-white/10 hover:border-yellow-400 text-slate-200 font-display font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]"
            >
              <Wrench size={18} className="text-yellow-400" />
              <span>EDITOR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-gray-500 font-mono">
        Boshqaruv: SPACE / Touch / Click • Mid-Air Double Jump • Rejimlar: Cube, Ship, Ball, Wave
      </div>
    </div>
  );
};

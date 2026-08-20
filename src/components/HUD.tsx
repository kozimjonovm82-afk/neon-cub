import React from 'react';
import { Pause, Flag, X, Zap } from 'lucide-react';
import { GameMode } from '../types/game';

interface HUDProps {
  percentage: number;
  attempts: number;
  coins: boolean[];
  mode: GameMode;
  isPracticeMode: boolean;
  onPause: () => void;
  onPlaceCheckpoint?: () => void;
  onRemoveCheckpoint?: () => void;
  showFps?: boolean;
  fps?: number;
  levelName: string;
}

export const HUD: React.FC<HUDProps> = ({
  percentage,
  attempts,
  coins,
  mode,
  isPracticeMode,
  onPause,
  onPlaceCheckpoint,
  onRemoveCheckpoint,
  showFps,
  fps = 60,
  levelName,
}) => {
  const getModeColor = (m: GameMode) => {
    switch (m) {
      case 'CUBE':
        return 'bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]';
      case 'SHIP':
        return 'bg-[#ec4899] shadow-[0_0_10px_#ec4899]';
      case 'BALL':
        return 'bg-[#eab308] shadow-[0_0_10px_#eab308]';
      case 'WAVE':
        return 'bg-[#39ff14] shadow-[0_0_10px_#39ff14]';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between select-none">
      {/* Top Header matching Immersive UI Design */}
      <div className="z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-b from-[#050508]/90 to-transparent">
        {/* Left: Avatar Cube Badge + Level Title */}
        <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black border border-[#00f3ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)]">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-sm shadow-[0_0_8px_#ffffff]" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black tracking-tighter uppercase italic text-white">
              Neon Cube Rush
            </h1>
            <p className="text-[10px] text-[#00f3ff] tracking-[0.2em] uppercase font-bold truncate max-w-[140px] sm:max-w-[220px]">
              {levelName}
            </p>
          </div>
        </div>

        {/* Center: Sleek Progress Bar with % Readout */}
        <div className="flex flex-col items-center flex-1 max-w-xs sm:max-w-md mx-3 sm:mx-10 pointer-events-auto">
          <div className="w-full h-2 sm:h-2.5 bg-[#1a1a2e] rounded-full overflow-hidden border border-[#2a2a4a] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#00f3ff] via-[#d946ef] to-[#ff00ff] rounded-full shadow-[0_0_10px_rgba(0,243,255,0.6)] transition-all duration-75"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[11px] sm:text-[12px] mt-1 font-mono text-[#00f3ff] tracking-widest font-bold">
            {percentage}% COMPLETE
          </span>
        </div>

        {/* Right: Attempt Counter & Pause Button */}
        <div className="flex gap-3 sm:gap-5 items-center pointer-events-auto">
          {showFps && (
            <div className="hidden md:block text-[11px] font-mono text-[#39ff14] bg-black/60 px-2 py-0.5 rounded border border-[#39ff14]/30 shadow-[0_0_8px_rgba(57,255,20,0.2)]">
              {fps} FPS
            </div>
          )}

          <div className="text-right">
            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest">
              Attempt
            </p>
            <p className="text-base sm:text-xl font-black italic text-white leading-none">
              {String(attempts).padStart(3, '0')}
            </p>
          </div>

          <button
            id="btn-hud-pause"
            onClick={onPause}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-[#00f3ff] transition-all active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(0,243,255,0.2)]"
            title="Pause (ESC / P)"
          >
            <div className="w-2.5 h-3 border-l-2 border-r-2 border-white" />
          </button>
        </div>
      </div>

      {/* Bottom Immersive UI Tray / Dock */}
      <div className="bg-[#080810]/95 border-t border-white/10 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between backdrop-blur-md pointer-events-auto">
        {/* Left: Mode & Collectibles */}
        <div className="flex gap-4 sm:gap-8 items-center">
          {/* Current Mode */}
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
              Current Mode
            </span>
            <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-white/10">
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm ${getModeColor(mode)}`} />
              <span className="font-bold uppercase tracking-tighter text-xs sm:text-sm text-white">
                {mode} Mode
              </span>
            </div>
          </div>

          {/* Collectibles */}
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
              Collectibles
            </span>
            <div className="flex gap-1.5 sm:gap-2">
              {coins.map((collected, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                    collected
                      ? 'bg-yellow-500/20 border border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] scale-105'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      collected ? 'text-yellow-400' : 'text-white/20'
                    }`}
                  >
                    C
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Practice Mode Quick Actions */}
        {isPracticeMode ? (
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
            <button
              id="btn-place-checkpoint"
              onClick={onPlaceCheckpoint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Flag size={13} fill="currentColor" /> Checkpoint (Z)
            </button>
            <button
              id="btn-remove-checkpoint"
              onClick={onRemoveCheckpoint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <X size={13} /> Remove (X)
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <Zap size={13} className="text-[#00f3ff]" />
            <span>SPACE / TAP / CLICK to Jump • Air Double Jump Active</span>
          </div>
        )}

        {/* Right: Soundtrack & Equalizer */}
        <div className="flex flex-col items-end">
          <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
            Soundtrack
          </span>
          <div className="flex items-center gap-3 sm:gap-4 text-right">
            <div>
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
                CYBERPUNK OVERDRIVE
              </p>
              <p className="text-[9px] sm:text-[10px] text-[#ff00ff] uppercase tracking-wider font-semibold">
                X-Neon Synthwave
              </p>
            </div>
            <div className="flex items-end gap-[3px] h-6 sm:h-7">
              <div className="w-1 bg-[#ff00ff] h-3.5 rounded-t-xs animate-pulse shadow-[0_0_6px_#ff00ff]" />
              <div className="w-1 bg-[#ff00ff] h-5 rounded-t-xs animate-bounce shadow-[0_0_6px_#ff00ff]" style={{ animationDuration: '0.6s' }} />
              <div className="w-1 bg-[#ff00ff] h-6.5 rounded-t-xs animate-pulse shadow-[0_0_6px_#ff00ff]" style={{ animationDuration: '0.4s' }} />
              <div className="w-1 bg-[#ff00ff] h-4 rounded-t-xs animate-bounce shadow-[0_0_6px_#ff00ff]" style={{ animationDuration: '0.8s' }} />
              <div className="w-1 bg-[#ff00ff] h-5.5 rounded-t-xs animate-pulse shadow-[0_0_6px_#ff00ff]" style={{ animationDuration: '0.5s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


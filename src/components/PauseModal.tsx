import React from 'react';
import { Play, RotateCcw, Home, Flag } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  isPracticeMode: boolean;
  onTogglePractice: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToMenu,
  isPracticeMode,
  onTogglePractice,
}) => {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-[#080810]/95 border border-[#00f3ff]/60 rounded-2xl p-6 shadow-2xl box-glow-cyan flex flex-col items-center gap-5">
        <h2 className="text-3xl font-black font-display text-white tracking-wider text-glow-cyan italic">
          PAUSED
        </h2>

        <div className="w-full flex flex-col gap-3">
          {/* Resume */}
          <button
            id="btn-pause-resume"
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00f3ff] via-[#d946ef] to-[#ff00ff] hover:brightness-110 text-black font-display font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-lg shadow-[0_0_15px_rgba(0,243,255,0.4)]"
          >
            <Play size={18} fill="currentColor" /> Davom Etish
          </button>

          {/* Restart */}
          <button
            id="btn-pause-restart"
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <RotateCcw size={16} /> Qayta Boshlash
          </button>

          {/* Toggle Practice Mode */}
          <button
            id="btn-pause-toggle-practice"
            onClick={onTogglePractice}
            className={`w-full py-3 px-4 rounded-xl border text-sm font-display font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
              isPracticeMode
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(57,255,20,0.3)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
            }`}
          >
            <Flag size={16} fill={isPracticeMode ? 'currentColor' : 'none'} />
            {isPracticeMode ? 'Practice Mode: ON' : 'Practice Mode: OFF'}
          </button>

          {/* Exit to Menu */}
          <button
            id="btn-pause-menu"
            onClick={onExitToMenu}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-red-950/40 border border-white/10 hover:border-red-500/50 text-gray-400 hover:text-red-400 font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <Home size={16} /> Bosh Menyuga Qaytish
          </button>
        </div>
      </div>
    </div>
  );
};


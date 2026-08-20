import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, ArrowRight, Star } from 'lucide-react';
import { LevelData } from '../types/game';

interface VictoryModalProps {
  level: LevelData;
  stats: {
    timeSec: number;
    attempts: number;
    coins: boolean[];
  };
  onPlayAgain: () => void;
  onNextLevel?: () => void;
  onExitToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  stats,
  onPlayAgain,
  onNextLevel,
  onExitToMenu,
}) => {
  useEffect(() => {
    // Blast celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#EC4899', '#22C55E', '#EAB308', '#A855F7'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  const totalCoinsCollected = stats.coins.filter(Boolean).length;

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-[#080810]/95 border border-yellow-500/70 rounded-2xl p-7 shadow-2xl box-glow-yellow flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        {/* Trophy Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <Trophy size={32} />
          </div>
          <h2 className="text-3xl font-display font-black text-yellow-400 text-glow-yellow tracking-wider italic">
            LEVEL COMPLETE!
          </h2>
          <p className="text-sm font-semibold text-gray-300">
            {level.name} ({level.difficulty})
          </p>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vaqt</span>
            <span className="text-lg font-mono font-bold text-[#00f3ff]">
              {stats.timeSec.toFixed(1)}s
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-white/10">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Urinishlar</span>
            <span className="text-lg font-mono font-bold text-[#ff00ff]">
              {stats.attempts}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Coinlar</span>
            <div className="flex items-center gap-1 mt-0.5">
              {stats.coins.map((c, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    c ? 'text-yellow-400 text-glow-yellow' : 'text-gray-700'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stars reward banner */}
        <div className="w-full flex items-center justify-between px-4 py-2.5 bg-yellow-950/40 border border-yellow-500/40 rounded-xl text-xs font-semibold text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
          <div className="flex items-center gap-1.5">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span>+{level.stars} Yulduz olindi!</span>
          </div>
          <span>+{totalCoinsCollected * 2} Bonus Coin</span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {onNextLevel && (
            <button
              id="btn-victory-next"
              onClick={onNextLevel}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00f3ff] via-[#d946ef] to-[#ff00ff] hover:brightness-110 text-black font-display font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-lg shadow-[0_0_15px_rgba(0,243,255,0.4)]"
            >
              Keyingi Level <ArrowRight size={18} />
            </button>
          )}

          <button
            id="btn-victory-again"
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <RotateCcw size={16} /> Qayta O‘ynash
          </button>

          <button
            id="btn-victory-menu"
            onClick={onExitToMenu}
            className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <Home size={14} /> Bosh Menyu
          </button>
        </div>
      </div>
    </div>
  );
};

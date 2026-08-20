import React from 'react';
import { LevelData, LevelStats } from '../types/game';
import { Play, Flag, ArrowLeft, Plus, Edit3, Trash2, Star, Zap } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface LevelSelectProps {
  levels: LevelData[];
  customLevels: LevelData[];
  levelStats: Record<string, LevelStats>;
  isPracticeMode: boolean;
  onTogglePractice: () => void;
  onSelectLevel: (level: LevelData) => void;
  onEditCustomLevel: (level: LevelData) => void;
  onCreateCustomLevel: () => void;
  onDeleteCustomLevel: (levelId: string) => void;
  onBack: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  levels,
  customLevels,
  levelStats,
  isPracticeMode,
  onTogglePractice,
  onSelectLevel,
  onEditCustomLevel,
  onCreateCustomLevel,
  onDeleteCustomLevel,
  onBack,
}) => {
  const getDifficultyColor = (diff: LevelData['difficulty']) => {
    switch (diff) {
      case 'EASY':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
      case 'NORMAL':
        return 'text-yellow-400 border-yellow-500/50 bg-yellow-950/40';
      case 'HARD':
        return 'text-red-400 border-red-500/50 bg-red-950/40';
      case 'CUSTOM':
        return 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent p-4 sm:p-8 overflow-y-auto select-none">
      {/* Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            id="btn-levelselect-back"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-[#080810]/90 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-2 text-xs font-bold font-display uppercase tracking-wider shadow-md hover:border-[#00f3ff]/50"
          >
            <ArrowLeft size={16} /> Orqaga
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-wider italic">
              LEVEL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff00ff]">TANLASH</span>
            </h2>
            <p className="text-xs text-gray-400">O‘ynash uchun levelni tanlang</p>
          </div>
        </div>

        {/* Practice Mode Toggle */}
        <button
          id="btn-levelselect-practice-toggle"
          onClick={() => {
            onTogglePractice();
            soundEngine.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-display font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md ${
            isPracticeMode
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(57,255,20,0.3)]'
              : 'bg-[#080810]/90 hover:bg-white/10 border-white/10 text-gray-400'
          }`}
        >
          <Flag size={14} fill={isPracticeMode ? 'currentColor' : 'none'} />
          <span>Practice: {isPracticeMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Standard Levels Grid */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <span className="text-xs font-bold font-display uppercase tracking-widest text-gray-400 mb-3 block">
            Asosiy Levellar (Original Levels)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {levels.map(level => {
              const stats = levelStats[level.id] || {
                bestPercentage: 0,
                completed: false,
                coinsCollected: [false, false, false],
              };

              return (
                <div
                  key={level.id}
                  className="bg-[#080810]/90 border border-white/10 hover:border-[#00f3ff]/80 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-2xl hover:shadow-[0_0_20px_rgba(0,243,255,0.25)] group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold font-display uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getDifficultyColor(
                          level.difficulty
                        )}`}
                      >
                        {level.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                        <Star size={14} fill="currentColor" /> {level.stars}
                      </div>
                    </div>

                    <h3 className="text-xl font-display font-bold text-white group-hover:text-[#00f3ff] transition italic">
                      {level.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>BPM: <strong className="text-[#ff00ff]">{level.bpm}</strong></span>
                      <span>•</span>
                      <span>Mavzu: <strong className="text-[#00f3ff]">{level.theme}</strong></span>
                    </div>
                  </div>

                  {/* Progress and Secret Coins */}
                  <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Natija:</span>
                      <span className="font-mono font-bold text-[#00f3ff]">
                        {stats.bestPercentage}% {stats.completed && '✓'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#1a1a2e] rounded-full overflow-hidden border border-[#2a2a4a]">
                      <div
                        className="h-full bg-gradient-to-r from-[#00f3ff] to-[#ff00ff] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,243,255,0.6)]"
                        style={{ width: `${stats.bestPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                      <span className="text-gray-400">Yashirin Coinlar:</span>
                      <div className="flex items-center gap-1">
                        {stats.coinsCollected.map((c, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              c ? 'text-yellow-400 text-glow-yellow' : 'text-gray-700'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Play Button */}
                  <button
                    id={`btn-play-${level.id}`}
                    onClick={() => {
                      soundEngine.init();
                      soundEngine.playClick();
                      onSelectLevel(level);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#ff00ff] hover:brightness-110 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-lg shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                  >
                    <Play size={14} fill="currentColor" /> START
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Levels Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-display uppercase tracking-widest text-gray-400">
              Maxsus Levellar (Level Editor Creations)
            </span>
            <button
              onClick={() => {
                onCreateCustomLevel();
                soundEngine.playClick();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00f3ff] hover:bg-[#00f3ff]/80 text-black text-xs font-display font-bold uppercase transition active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(0,243,255,0.4)]"
            >
              <Plus size={14} /> Yangi Level Yaratish
            </button>
          </div>

          {customLevels.length === 0 ? (
            <div className="bg-[#080810]/80 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
              <Zap size={32} className="text-gray-600" />
              <p className="text-sm text-gray-400">Hozircha maxsus level yaratilmagan.</p>
              <button
                onClick={() => {
                  onCreateCustomLevel();
                  soundEngine.playClick();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#ff00ff] text-black font-display font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
              >
                Level Editorni Ochish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customLevels.map(lvl => (
                <div
                  key={lvl.id}
                  className="bg-[#080810]/90 border border-white/10 hover:border-[#00f3ff]/80 rounded-2xl p-5 flex flex-col justify-between gap-4 transition"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold font-display uppercase tracking-wider px-2 py-0.5 rounded-full border text-[#00f3ff] border-[#00f3ff]/50 bg-[#00f3ff]/10 self-start">
                      CUSTOM
                    </span>
                    <h3 className="text-lg font-display font-bold text-white mt-1 italic">{lvl.name}</h3>
                    <span className="text-xs text-gray-400">BPM: {lvl.bpm} • To‘siqlar: {lvl.obstacles.length}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundEngine.init();
                        soundEngine.playClick();
                        onSelectLevel(lvl);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#ff00ff] text-black font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" /> START
                    </button>
                    <button
                      onClick={() => {
                        onEditCustomLevel(lvl);
                        soundEngine.playClick();
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition cursor-pointer"
                      title="Tahrirlash"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${lvl.name}" levelini o‘chirishni xohlaysizmi?`)) {
                          onDeleteCustomLevel(lvl.id);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-red-950/60 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/50 transition cursor-pointer"
                      title="O‘chirish"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

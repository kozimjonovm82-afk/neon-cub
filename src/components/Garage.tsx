import React, { useState, useEffect, useRef } from 'react';
import {
  PlayerCustomization,
  SkinDefinition,
  TrailDefinition,
  DeathEffectDefinition,
} from '../types/game';
import {
  SKINS_DATA,
  TRAILS_DATA,
  DEATH_EFFECTS_DATA,
  COLOR_PALETTES,
} from '../data/defaultLevels';
import { soundEngine } from '../audio/soundEngine';
import { X, Lock, Check, Sparkles, Palette, Flame, ShieldAlert } from 'lucide-react';

interface GarageProps {
  customization: PlayerCustomization;
  onUpdateCustomization: (newCust: PlayerCustomization) => void;
  unlockedSkins: string[];
  unlockedTrails: string[];
  unlockedDeathEffects: string[];
  onUnlockItem: (type: 'skin' | 'trail' | 'death', id: string, cost: number) => boolean;
  totalCoins: number;
  onClose: () => void;
}

export const Garage: React.FC<GarageProps> = ({
  customization,
  onUpdateCustomization,
  unlockedSkins,
  unlockedTrails,
  unlockedDeathEffects,
  onUnlockItem,
  totalCoins,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'SKINS' | 'COLORS' | 'TRAILS' | 'DEATH'>('SKINS');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated rotating 2D canvas preview
  useEffect(() => {
    let animId: number;
    let angle = 0;

    const renderPreview = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw spinning preview cube
      angle += 0.025;
      const size = 56;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Base body
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-size / 2, -size / 2, size, size);

      // Neon border
      ctx.strokeStyle = customization.primaryColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = customization.primaryColor;
      ctx.shadowBlur = 18;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.shadowBlur = 0;

      // Skin Details
      const skin = customization.skinId;
      if (skin === 'cyber_visor') {
        ctx.fillStyle = customization.secondaryColor;
        ctx.fillRect(-size / 2 + 6, -size / 2 + 14, size - 12, 14);
      } else if (skin === 'matrix_grid') {
        ctx.strokeStyle = customization.secondaryColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-size / 2 + 10, -size / 2 + 10, size - 20, size - 20);
      } else if (skin === 'void_skull' || skin === 'apex_overlord') {
        ctx.fillStyle = customization.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-size / 2 + 10, -size / 2 + 12);
        ctx.lineTo(-size / 2 + 20, -size / 2 + 24);
        ctx.lineTo(-size / 2 + 10, -size / 2 + 28);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(size / 2 - 10, -size / 2 + 12);
        ctx.lineTo(size / 2 - 20, -size / 2 + 24);
        ctx.lineTo(size / 2 - 10, -size / 2 + 28);
        ctx.fill();
      } else {
        // Classic inner
        ctx.fillStyle = customization.secondaryColor;
        ctx.fillRect(-size / 2 + 12, -size / 2 + 12, size - 24, size - 24);
      }

      ctx.restore();

      animId = requestAnimationFrame(renderPreview);
    };

    renderPreview();
    return () => cancelAnimationFrame(animId);
  }, [customization]);

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-[#080810]/95 border border-[#00f3ff]/50 rounded-2xl p-6 shadow-2xl box-glow-cyan flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header with Coin Counter */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-display font-black text-white tracking-wider italic">
              GAR<span className="text-[#00f3ff]">AGE</span>
            </h2>
            <span className="text-xs font-semibold text-gray-400">
              Kubingizni va effektlarni sozlang
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-950/60 border border-yellow-500/40 rounded-full text-yellow-400 font-display font-bold text-sm shadow-[0_0_10px_rgba(234,179,8,0.2)]">
              <span>★</span>
              <span>{totalCoins} COINS</span>
            </div>
            <button
              id="btn-garage-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Live Preview & Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-white/5 border border-white/10 p-4 rounded-xl">
          <div className="relative">
            <canvas
              ref={previewCanvasRef}
              width={140}
              height={140}
              className="bg-black/90 rounded-xl border border-[#00f3ff]/40 shadow-inner"
            />
            <span className="absolute bottom-1 right-2 text-[10px] font-mono text-[#00f3ff]/80 font-bold">
              PREVIEW
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'SKINS', label: 'Skinlar', icon: <Sparkles size={16} /> },
              { id: 'COLORS', label: 'Ranglar', icon: <Palette size={16} /> },
              { id: 'TRAILS', label: 'Traillar', icon: <Flame size={16} /> },
              { id: 'DEATH', label: 'Portlash', icon: <ShieldAlert size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  soundEngine.playClick();
                }}
                className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#00f3ff] to-[#ff00ff] text-black shadow-lg shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                    : 'bg-[#050508] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex flex-col gap-4 min-h-[220px]">
          {/* 1. SKINS TAB */}
          {activeTab === 'SKINS' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SKINS_DATA.map(skin => {
                const isUnlocked = unlockedSkins.includes(skin.id) || skin.unlockedByDefault;
                const isEquipped = customization.skinId === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 transition ${
                      isEquipped
                        ? 'bg-[#00f3ff]/10 border-[#00f3ff] shadow-md box-glow-cyan'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{skin.name}</span>
                        {isEquipped && <Check size={16} className="text-[#00f3ff]" />}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{skin.description}</p>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          onUpdateCustomization({ ...customization, skinId: skin.id });
                          soundEngine.playClick();
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition cursor-pointer ${
                          isEquipped
                            ? 'bg-[#00f3ff] text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]'
                            : 'bg-white/10 hover:bg-white/20 text-gray-200'
                        }`}
                      >
                        {isEquipped ? 'Tanlangan' : 'Kiyish'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnlockItem('skin', skin.id, skin.costCoins)}
                        className="w-full py-1.5 rounded-lg bg-yellow-600/30 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-400 text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Lock size={12} /> {skin.costCoins} Coin
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. COLORS TAB */}
          {activeTab === 'COLORS' && (
            <div className="flex flex-col gap-5">
              {/* Primary Color */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Asosiy Rang (Primary Color):
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {COLOR_PALETTES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onUpdateCustomization({ ...customization, primaryColor: c.hex });
                        soundEngine.playClick();
                      }}
                      className={`h-10 rounded-xl transition-all cursor-pointer flex items-center justify-center border-2 ${
                        customization.primaryColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                          : 'border-transparent hover:scale-95'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {customization.primaryColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check size={16} className="text-black stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Color */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Qo‘shimcha Rang (Secondary Color):
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {COLOR_PALETTES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onUpdateCustomization({ ...customization, secondaryColor: c.hex });
                        soundEngine.playClick();
                      }}
                      className={`h-10 rounded-xl transition-all cursor-pointer flex items-center justify-center border-2 ${
                        customization.secondaryColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                          : 'border-transparent hover:scale-95'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {customization.secondaryColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check size={16} className="text-black stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. TRAILS TAB */}
          {activeTab === 'TRAILS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRAILS_DATA.map(trail => {
                const isUnlocked = unlockedTrails.includes(trail.id) || trail.unlockedByDefault;
                const isEquipped = customization.trailId === trail.id;

                return (
                  <div
                    key={trail.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 transition ${
                      isEquipped
                        ? 'bg-[#00f3ff]/10 border-[#00f3ff] shadow-md box-glow-cyan'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{trail.name}</span>
                        {isEquipped && <Check size={16} className="text-[#00f3ff]" />}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{trail.description}</p>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          onUpdateCustomization({ ...customization, trailId: trail.id });
                          soundEngine.playClick();
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition cursor-pointer ${
                          isEquipped
                            ? 'bg-[#00f3ff] text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]'
                            : 'bg-white/10 hover:bg-white/20 text-gray-200'
                        }`}
                      >
                        {isEquipped ? 'Tanlangan' : 'O‘rnatish'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnlockItem('trail', trail.id, trail.costCoins)}
                        className="w-full py-1.5 rounded-lg bg-yellow-600/30 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-400 text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Lock size={12} /> {trail.costCoins} Coin
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. DEATH EFFECTS TAB */}
          {activeTab === 'DEATH' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEATH_EFFECTS_DATA.map(fx => {
                const isUnlocked = unlockedDeathEffects.includes(fx.id) || fx.unlockedByDefault;
                const isEquipped = customization.deathEffectId === fx.id;

                return (
                  <div
                    key={fx.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 transition ${
                      isEquipped
                        ? 'bg-[#ff00ff]/10 border-[#ff00ff] shadow-md box-glow-magenta'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{fx.name}</span>
                        {isEquipped && <Check size={16} className="text-[#ff00ff]" />}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{fx.description}</p>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          onUpdateCustomization({ ...customization, deathEffectId: fx.id });
                          soundEngine.playClick();
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition cursor-pointer ${
                          isEquipped
                            ? 'bg-[#ff00ff] text-black shadow-[0_0_10px_rgba(255,0,255,0.4)]'
                            : 'bg-white/10 hover:bg-white/20 text-gray-200'
                        }`}
                      >
                        {isEquipped ? 'Tanlangan' : 'O‘rnatish'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnlockItem('death', fx.id, fx.costCoins)}
                        className="w-full py-1.5 rounded-lg bg-yellow-600/30 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-400 text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Lock size={12} /> {fx.costCoins} Coin
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Done Button */}
        <button
          id="btn-garage-done"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00f3ff] via-[#d946ef] to-[#ff00ff] hover:brightness-110 text-black font-display font-black text-sm tracking-wider uppercase transition cursor-pointer shadow-lg shadow-[0_0_15px_rgba(0,243,255,0.4)]"
        >
          Saqlash va Chiqish
        </button>
      </div>
    </div>
  );
};

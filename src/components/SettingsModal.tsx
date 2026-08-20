import React from 'react';
import { X, Volume2, VolumeX, Sparkles, Monitor, Smartphone, Keyboard, RotateCcw } from 'lucide-react';
import { GameSettings } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleMusicChange = (val: number) => {
    const next = { ...settings, musicVolume: val };
    onUpdateSettings(next);
    soundEngine.setVolumes(next.musicVolume, next.sfxVolume);
  };

  const handleSfxChange = (val: number) => {
    const next = { ...settings, sfxVolume: val };
    onUpdateSettings(next);
    soundEngine.setVolumes(next.musicVolume, next.sfxVolume);
    soundEngine.playClick();
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-[#080810]/95 border border-[#00f3ff]/50 rounded-2xl p-6 shadow-2xl box-glow-cyan flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-2xl font-display font-black text-white tracking-wider italic">
            SOZLA<span className="text-[#00f3ff]">MALAR</span>
          </h2>
          <button
            id="btn-settings-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sliders and Toggles */}
        <div className="flex flex-col gap-5">
          {/* Music Volume */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2 text-gray-300">
                {settings.musicVolume > 0 ? <Volume2 size={16} className="text-[#00f3ff]" /> : <VolumeX size={16} />}
                Musiqa Ovozi
              </span>
              <span className="text-[#00f3ff] font-mono">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              id="slider-music-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={e => handleMusicChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1a1a2e] rounded-lg appearance-none cursor-pointer accent-[#00f3ff]"
            />
          </div>

          {/* SFX Volume */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2 text-gray-300">
                <Sparkles size={16} className="text-[#ff00ff]" /> O‘yin Effektlari (SFX)
              </span>
              <span className="text-[#00f3ff] font-mono">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              id="slider-sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={e => handleSfxChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1a1a2e] rounded-lg appearance-none cursor-pointer accent-[#00f3ff]"
            />
          </div>

          {/* Screen Shake Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Screen Shake (Tebranish)</span>
              <span className="text-xs text-gray-400">Portlash va zarbalarda ekran silkitsin</span>
            </div>
            <button
              id="toggle-screen-shake"
              onClick={() => onUpdateSettings({ ...settings, screenShake: !settings.screenShake })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.screenShake ? 'bg-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.5)]' : 'bg-gray-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.screenShake ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Particles Quality */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Zarrachalar Sifati</span>
              <span className="text-xs text-gray-400">Particle effects vizual quvvati</span>
            </div>
            <div className="flex items-center gap-1 bg-[#050508] p-1 rounded-lg border border-white/10 text-xs">
              {(['low', 'medium', 'high'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ ...settings, particlesQuality: q })}
                  className={`px-2.5 py-1 rounded font-bold uppercase transition cursor-pointer ${
                    settings.particlesQuality === q
                      ? 'bg-[#00f3ff] text-black shadow-[0_0_8px_rgba(0,243,255,0.4)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Show FPS Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">FPS Ko‘rsatkich</span>
              <span className="text-xs text-gray-400">Ekranda kadrlar chastotasini chiqarish</span>
            </div>
            <button
              id="toggle-fps"
              onClick={() => onUpdateSettings({ ...settings, showFps: !settings.showFps })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.showFps ? 'bg-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.5)]' : 'bg-gray-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.showFps ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Keybinds Guide */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
            <span className="font-bold text-[#00f3ff] uppercase tracking-wider flex items-center gap-1.5">
              <Keyboard size={14} /> Boshqaruv Tugmalari:
            </span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div><strong className="text-white">SPACE / ↑ / Click:</strong> Sakrash</div>
              <div><strong className="text-white">Havoda sakrash:</strong> Double Jump</div>
              <div><strong className="text-white">ESC / P:</strong> Pauza qilish</div>
              <div><strong className="text-white">Z / X:</strong> Checkpoint (Practice)</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          id="btn-settings-done"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00f3ff] via-[#d946ef] to-[#ff00ff] hover:brightness-110 text-black font-display font-black text-sm tracking-wider uppercase transition cursor-pointer shadow-lg shadow-[0_0_15px_rgba(0,243,255,0.4)]"
        >
          Tayyor
        </button>
      </div>
    </div>
  );
};

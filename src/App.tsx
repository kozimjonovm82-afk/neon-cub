/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LevelData,
  LevelStats,
  PlayerCustomization,
  GameSettings,
} from './types/game';
import { DEFAULT_LEVELS } from './data/defaultLevels';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { GameCanvas } from './components/GameCanvas';
import { Garage } from './components/Garage';
import { LevelEditor } from './components/LevelEditor';
import { SettingsModal } from './components/SettingsModal';
import { soundEngine } from './audio/soundEngine';

type AppView = 'MENU' | 'LEVEL_SELECT' | 'PLAYING' | 'GARAGE' | 'EDITOR';

const STORAGE_KEY_CUSTOM_LEVELS = 'neon_cube_custom_levels';
const STORAGE_KEY_STATS = 'neon_cube_level_stats';
const STORAGE_KEY_CUSTOMIZATION = 'neon_cube_customization';
const STORAGE_KEY_UNLOCKED = 'neon_cube_unlocked_items';
const STORAGE_KEY_SETTINGS = 'neon_cube_settings';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('MENU');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Levels & Stats
  const [customLevels, setCustomLevels] = useState<LevelData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_LEVELS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [levelStats, setLevelStats] = useState<Record<string, LevelStats>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedLevel, setSelectedLevel] = useState<LevelData>(DEFAULT_LEVELS[0]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelData | null>(null);

  // Customization & Unlocked items
  const [customization, setCustomization] = useState<PlayerCustomization>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMIZATION);
      return saved
        ? JSON.parse(saved)
        : {
            primaryColor: '#06B6D4',
            secondaryColor: '#EC4899',
            skinId: 'classic_cube',
            trailId: 'trail_classic',
            deathEffectId: 'death_burst',
          };
    } catch {
      return {
        primaryColor: '#06B6D4',
        secondaryColor: '#EC4899',
        skinId: 'classic_cube',
        trailId: 'trail_classic',
        deathEffectId: 'death_burst',
      };
    }
  });

  const [unlockedItems, setUnlockedItems] = useState<{
    skins: string[];
    trails: string[];
    deathEffects: string[];
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
      return saved
        ? JSON.parse(saved)
        : {
            skins: ['classic_cube'],
            trails: ['trail_classic'],
            deathEffects: ['death_burst'],
          };
    } catch {
      return {
        skins: ['classic_cube'],
        trails: ['trail_classic'],
        deathEffects: ['death_burst'],
      };
    }
  });

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved
        ? JSON.parse(saved)
        : {
            musicVolume: 0.7,
            sfxVolume: 0.8,
            screenShake: true,
            particlesQuality: 'high',
            showFps: false,
            autoRetry: true,
          };
    } catch {
      return {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        screenShake: true,
        particlesQuality: 'high',
        showFps: false,
        autoRetry: true,
      };
    }
  });

  // Persist State to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_LEVELS, JSON.stringify(customLevels));
    } catch {
      // Storage quota fallback
    }
  }, [customLevels]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(levelStats));
    } catch {
      // fallback
    }
  }, [levelStats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMIZATION, JSON.stringify(customization));
    } catch {
      // fallback
    }
  }, [customization]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedItems));
    } catch {
      // fallback
    }
  }, [unlockedItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // fallback
    }
  }, [settings]);

  // Compute Total Coins & Stars
  const totalCoins = (Object.values(levelStats) as LevelStats[]).reduce(
    (sum: number, stat: LevelStats) => sum + stat.coinsCollected.filter(Boolean).length * 2,
    6 // Initial bonus starter coins
  );

  const totalStars = (Object.entries(levelStats) as [string, LevelStats][]).reduce(
    (sum: number, [lvlId, stat]: [string, LevelStats]) => {
      if (!stat.completed) return sum;
      const lvl = DEFAULT_LEVELS.find(l => l.id === lvlId);
      return sum + (lvl?.stars || 1);
    },
    0
  );

  // Level Progression & Victory handler
  const handleVictory = (stats: { timeSec: number; attempts: number; coins: boolean[] }) => {
    setLevelStats(prev => {
      const current = prev[selectedLevel.id] || {
        attempts: 0,
        bestPercentage: 0,
        completed: false,
        coinsCollected: [false, false, false],
      };

      const mergedCoins = [
        current.coinsCollected[0] || stats.coins[0],
        current.coinsCollected[1] || stats.coins[1],
        current.coinsCollected[2] || stats.coins[2],
      ];

      return {
        ...prev,
        [selectedLevel.id]: {
          attempts: (current.attempts || 0) + stats.attempts,
          bestPercentage: 100,
          completed: true,
          coinsCollected: mergedCoins,
        },
      };
    });
  };

  const handleProgressUpdate = (pct: number) => {
    setLevelStats(prev => {
      const current = prev[selectedLevel.id] || {
        attempts: 0,
        bestPercentage: 0,
        completed: false,
        coinsCollected: [false, false, false],
      };

      if (pct > current.bestPercentage) {
        return {
          ...prev,
          [selectedLevel.id]: {
            ...current,
            bestPercentage: pct,
          },
        };
      }
      return prev;
    });
  };

  // Next level navigation
  const handleNextLevel = () => {
    const allLevels = [...DEFAULT_LEVELS, ...customLevels];
    const currentIndex = allLevels.findIndex(l => l.id === selectedLevel.id);
    if (currentIndex >= 0 && currentIndex < allLevels.length - 1) {
      setSelectedLevel(allLevels[currentIndex + 1]);
      setCurrentView('PLAYING');
    } else {
      setCurrentView('LEVEL_SELECT');
    }
  };

  // Item Unlock (Garage)
  const handleUnlockItem = (type: 'skin' | 'trail' | 'death', id: string, cost: number): boolean => {
    if (totalCoins < cost) {
      alert(`Coinlar yetarli emas! Sizda: ${totalCoins} ta coin bor.`);
      return false;
    }

    soundEngine.playCoin();

    setUnlockedItems(prev => {
      if (type === 'skin') {
        return { ...prev, skins: [...prev.skins, id] };
      } else if (type === 'trail') {
        return { ...prev, trails: [...prev.trails, id] };
      } else {
        return { ...prev, deathEffects: [...prev.deathEffects, id] };
      }
    });

    return true;
  };

  // Custom Level Editor handlers
  const handleSaveCustomLevel = (lvl: LevelData) => {
    setCustomLevels(prev => {
      const exists = prev.some(l => l.id === lvl.id);
      if (exists) {
        return prev.map(l => (l.id === lvl.id ? lvl : l));
      }
      return [...prev, lvl];
    });
    alert(`"${lvl.name}" muvaffaqiyatli saqlandi!`);
    setCurrentView('LEVEL_SELECT');
  };

  const handlePlaytestCustomLevel = (lvl: LevelData) => {
    setSelectedLevel(lvl);
    setCurrentView('PLAYING');
  };

  const handleDeleteCustomLevel = (id: string) => {
    setCustomLevels(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="w-screen h-screen bg-immersive-radial bg-cyber-grid text-white flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      {/* 1. MAIN MENU VIEW */}
      {currentView === 'MENU' && (
        <MainMenu
          customization={customization}
          totalCoins={totalCoins}
          totalStars={totalStars}
          onPlay={() => {
            setSelectedLevel(DEFAULT_LEVELS[0]);
            setCurrentView('PLAYING');
          }}
          onOpenLevels={() => setCurrentView('LEVEL_SELECT')}
          onOpenGarage={() => setCurrentView('GARAGE')}
          onOpenEditor={() => {
            setEditingLevel(null);
            setCurrentView('EDITOR');
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* 2. LEVEL SELECT VIEW */}
      {currentView === 'LEVEL_SELECT' && (
        <LevelSelect
          levels={DEFAULT_LEVELS}
          customLevels={customLevels}
          levelStats={levelStats}
          isPracticeMode={isPracticeMode}
          onTogglePractice={() => setIsPracticeMode(!isPracticeMode)}
          onSelectLevel={(lvl) => {
            setSelectedLevel(lvl);
            setCurrentView('PLAYING');
          }}
          onCreateCustomLevel={() => {
            setEditingLevel(null);
            setCurrentView('EDITOR');
          }}
          onEditCustomLevel={(lvl) => {
            setEditingLevel(lvl);
            setCurrentView('EDITOR');
          }}
          onDeleteCustomLevel={handleDeleteCustomLevel}
          onBack={() => setCurrentView('MENU')}
        />
      )}

      {/* 3. GAMEPLAY CANVAS VIEW */}
      {currentView === 'PLAYING' && (
        <GameCanvas
          level={selectedLevel}
          customization={customization}
          settings={settings}
          isPracticeMode={isPracticeMode}
          onTogglePractice={() => setIsPracticeMode(!isPracticeMode)}
          onVictory={handleVictory}
          onProgressUpdate={handleProgressUpdate}
          onExitToMenu={() => setCurrentView('MENU')}
          onNextLevel={handleNextLevel}
        />
      )}

      {/* 4. GARAGE VIEW */}
      {currentView === 'GARAGE' && (
        <Garage
          customization={customization}
          onUpdateCustomization={setCustomization}
          unlockedSkins={unlockedItems.skins}
          unlockedTrails={unlockedItems.trails}
          unlockedDeathEffects={unlockedItems.deathEffects}
          onUnlockItem={handleUnlockItem}
          totalCoins={totalCoins}
          onClose={() => setCurrentView('MENU')}
        />
      )}

      {/* 5. LEVEL EDITOR VIEW */}
      {currentView === 'EDITOR' && (
        <LevelEditor
          initialLevel={editingLevel}
          onSaveLevel={handleSaveCustomLevel}
          onPlaytestLevel={handlePlaytestCustomLevel}
          onBack={() => setCurrentView('MENU')}
        />
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  LevelData,
  PlayerCustomization,
  GameSettings,
  GameMode,
} from '../types/game';
import { GameEngine, CANVAS_HEIGHT } from '../game/GameEngine';
import { HUD } from './HUD';
import { PauseModal } from './PauseModal';
import { VictoryModal } from './VictoryModal';

interface GameCanvasProps {
  level: LevelData;
  customization: PlayerCustomization;
  settings: GameSettings;
  isPracticeMode: boolean;
  onTogglePractice: () => void;
  onVictory: (stats: { timeSec: number; attempts: number; coins: boolean[] }) => void;
  onExitToMenu: () => void;
  onNextLevel?: () => void;
  onProgressUpdate?: (percent: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  customization,
  settings,
  isPracticeMode,
  onTogglePractice,
  onVictory,
  onExitToMenu,
  onNextLevel,
  onProgressUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // HUD & Game UI state
  const [percentage, setPercentage] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [coins, setCoins] = useState<boolean[]>([false, false, false]);
  const [currentMode, setCurrentMode] = useState<GameMode>('CUBE');
  const [isPaused, setIsPaused] = useState(false);
  const [fps, setFps] = useState(60);

  // Victory screen state
  const [victoryStats, setVictoryStats] = useState<{
    timeSec: number;
    attempts: number;
    coins: boolean[];
  } | null>(null);

  // Initialize and mount GameEngine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas dimensions
    const width = container.clientWidth || 960;
    canvas.width = width;
    canvas.height = CANVAS_HEIGHT;

    const engine = new GameEngine(
      canvas,
      level,
      customization,
      settings,
      isPracticeMode
    );
    engineRef.current = engine;

    // Hook up callbacks
    engine.onProgressUpdate = (pct) => {
      setPercentage(pct);
      setAttempts(engine.attempts);
      setCoins([...engine.coinsCollectedThisRun]);
      setCurrentMode(engine.player.mode);
      setFps(engine.currentFps);
      if (onProgressUpdate) {
        onProgressUpdate(pct);
      }
    };

    engine.onDeath = (att, pct) => {
      setAttempts(att);
      setPercentage(pct);
    };

    engine.onVictory = (stats) => {
      setVictoryStats(stats);
      onVictory(stats);
    };

    engine.start();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize && canvasRef.current) {
          const newWidth = Math.floor(entry.contentRect.width);
          if (newWidth > 100 && canvasRef.current.width !== newWidth) {
            canvasRef.current.width = newWidth;
          }
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      engine.stop();
      engineRef.current = null;
    };
  }, [level, isPracticeMode]);

  // Update customization and settings dynamically
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCustomization(customization);
      engineRef.current.setSettings(settings);
    }
  }, [customization, settings]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        engine.handleInputDown();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (engine.isPaused) {
          engine.resume();
          setIsPaused(false);
        } else {
          engine.pause();
          setIsPaused(true);
        }
      } else if (e.code === 'KeyZ') {
        e.preventDefault();
        engine.placeCheckpoint();
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        engine.removeCheckpoint();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        engine.handleInputUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Pointer / Touch Handlers for Canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (engineRef.current && !isPaused) {
      engineRef.current.handleInputDown();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (engineRef.current && !isPaused) {
      engineRef.current.handleInputUp();
    }
  };

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.attempts++;
      engineRef.current.resetPlayer(true);
      engineRef.current.resume();
      setIsPaused(false);
      setVictoryStats(null);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* HTML5 Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full max-h-[560px] object-contain shadow-2xl block"
      />

      {/* HUD Layer */}
      <HUD
        percentage={percentage}
        attempts={attempts}
        coins={coins}
        mode={currentMode}
        isPracticeMode={isPracticeMode}
        onPause={handlePause}
        onPlaceCheckpoint={() => engineRef.current?.placeCheckpoint()}
        onRemoveCheckpoint={() => engineRef.current?.removeCheckpoint()}
        showFps={settings.showFps}
        fps={fps}
        levelName={level.name}
      />

      {/* Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onExitToMenu={onExitToMenu}
          isPracticeMode={isPracticeMode}
          onTogglePractice={onTogglePractice}
        />
      )}

      {/* Victory Modal */}
      {victoryStats && (
        <VictoryModal
          level={level}
          stats={victoryStats}
          onPlayAgain={handleRestart}
          onNextLevel={onNextLevel}
          onExitToMenu={onExitToMenu}
        />
      )}
    </div>
  );
};

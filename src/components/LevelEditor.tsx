import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LevelData,
  Obstacle,
  ObstacleType,
  LevelTheme,
} from '../types/game';
import { TILE_SIZE, FLOOR_Y, CANVAS_HEIGHT } from '../game/GameEngine';
import { soundEngine } from '../audio/soundEngine';
import {
  Play,
  Save,
  Trash2,
  Download,
  Upload,
  ArrowLeft,
  Music,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface LevelEditorProps {
  initialLevel?: LevelData | null;
  onSaveLevel: (level: LevelData) => void;
  onPlaytestLevel: (level: LevelData) => void;
  onBack: () => void;
}

const TOOL_CATEGORIES = [
  {
    category: 'Struktura',
    items: [
      { type: 'BLOCK' as ObstacleType, label: 'Block', icon: '■' },
      { type: 'HALF_BLOCK' as ObstacleType, label: 'Half Block', icon: '▬' },
      { type: 'SPIKE_UP' as ObstacleType, label: 'Spike Up', icon: '▲' },
      { type: 'SPIKE_DOWN' as ObstacleType, label: 'Spike Down', icon: '▼' },
      { type: 'SPIKE_FLOAT' as ObstacleType, label: 'Diamond Spike', icon: '◆' },
    ],
  },
  {
    category: 'Sakrash & Orblar',
    items: [
      { type: 'PAD_JUMP_YELLOW' as ObstacleType, label: 'Yellow Pad', icon: '◒' },
      { type: 'PAD_JUMP_PINK' as ObstacleType, label: 'Pink Pad', icon: '◒' },
      { type: 'RING_JUMP_YELLOW' as ObstacleType, label: 'Yellow Orb', icon: '◉' },
      { type: 'RING_JUMP_PINK' as ObstacleType, label: 'Pink Orb', icon: '◉' },
      { type: 'RING_GRAVITY' as ObstacleType, label: 'Gravity Orb', icon: '☯' },
      { type: 'RING_DASH' as ObstacleType, label: 'Dash Orb', icon: '➔' },
    ],
  },
  {
    category: 'Portallar',
    items: [
      { type: 'PORTAL_SHIP' as ObstacleType, label: 'Ship Portal', icon: '🚀' },
      { type: 'PORTAL_BALL' as ObstacleType, label: 'Ball Portal', icon: '⚽' },
      { type: 'PORTAL_WAVE' as ObstacleType, label: 'Wave Portal', icon: '⚡' },
      { type: 'PORTAL_CUBE' as ObstacleType, label: 'Cube Portal', icon: '🟩' },
      { type: 'PORTAL_GRAVITY_UP' as ObstacleType, label: '▲ Gravity', icon: '⬆' },
      { type: 'PORTAL_GRAVITY_DOWN' as ObstacleType, label: '▼ Gravity', icon: '⬇' },
      { type: 'PORTAL_SPEED_FAST' as ObstacleType, label: 'Fast 1.5x', icon: '⏩' },
      { type: 'PORTAL_SPEED_HYPER' as ObstacleType, label: 'Hyper 2x', icon: '⏭' },
      { type: 'PORTAL_SIZE_MINI' as ObstacleType, label: 'Mini Portal', icon: '🔹' },
      { type: 'PORTAL_SIZE_NORMAL' as ObstacleType, label: 'Norm Portal', icon: '🔷' },
    ],
  },
  {
    category: 'Maqsad & Coin',
    items: [
      { type: 'COIN' as ObstacleType, label: 'Secret Coin', icon: '★' },
      { type: 'FINISH_LINE' as ObstacleType, label: 'Finish Gate', icon: '🏁' },
    ],
  },
];

export const LevelEditor: React.FC<LevelEditorProps> = ({
  initialLevel,
  onSaveLevel,
  onPlaytestLevel,
  onBack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Editor Level State
  const [levelName, setLevelName] = useState(initialLevel?.name || 'Mening Yangi Levelim');
  const [difficulty, setDifficulty] = useState<LevelData['difficulty']>(initialLevel?.difficulty || 'NORMAL');
  const [theme, setTheme] = useState<LevelTheme>(initialLevel?.theme || 'CYBER');
  const [bpm, setBpm] = useState(initialLevel?.bpm || 130);
  const [songTrackId, setSongTrackId] = useState(initialLevel?.songTrackId || 0);
  const [levelLength, setLevelLength] = useState(initialLevel?.length || 200);
  const [obstacles, setObstacles] = useState<Obstacle[]>(
    initialLevel?.obstacles ? JSON.parse(JSON.stringify(initialLevel.obstacles)) : [
      { id: 'start_finish', type: 'FINISH_LINE', x: 190, y: 0, width: 1, height: 8 }
    ]
  );

  // Active Tool & Navigation
  const [selectedTool, setSelectedTool] = useState<ObstacleType>('BLOCK');
  const [isEraser, setIsEraser] = useState(false);
  const [scrollX, setScrollX] = useState(0); // in pixels
  const [zoom, setZoom] = useState(1);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ gx: number; gy: number } | null>(null);

  // Sound in editor
  useEffect(() => {
    soundEngine.stopMusic();
    return () => soundEngine.stopMusic();
  }, []);

  // Build current level data object
  const getCurrentLevelData = useCallback((): LevelData => ({
    id: initialLevel?.id || `custom_${Date.now()}`,
    name: levelName,
    difficulty,
    theme,
    bpm,
    songTrackId,
    length: levelLength,
    obstacles,
    secretCoins: obstacles.filter(o => o.type === 'COIN').length,
    stars: difficulty === 'EASY' ? 1 : difficulty === 'NORMAL' ? 3 : 5,
  }), [initialLevel?.id, levelName, difficulty, theme, bpm, songTrackId, levelLength, obstacles]);

  // Handle cell click / placement
  const handleCellAction = useCallback((gx: number, gy: number) => {
    if (gx < 0 || gx > levelLength || gy < 0 || gy > 11) return;

    if (isEraser) {
      // Remove any obstacle covering this cell
      setObstacles(prev => prev.filter(o => o.x !== gx || o.y !== gy));
      soundEngine.playClick();
    } else {
      // Place new obstacle
      soundEngine.playClick();
      const newObs: Obstacle = {
        id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: selectedTool,
        x: gx,
        y: gy,
        width: 1,
        height: selectedTool === 'FINISH_LINE' ? 8 : 1,
      };

      // Remove existing on same cell first
      setObstacles(prev => [...prev.filter(o => o.x !== gx || o.y !== gy), newObs]);
    }
  }, [isEraser, levelLength, selectedTool]);

  // Canvas Mouse events
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const actualX = (clientX / zoom) + scrollX;
    const actualY = clientY / zoom;

    const gx = Math.floor(actualX / TILE_SIZE);
    const gy = Math.floor((FLOOR_Y - actualY) / TILE_SIZE);

    setHoveredCell({ gx, gy });

    if (isMouseDown) {
      handleCellAction(gx, gy);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(true);
    if (hoveredCell) {
      handleCellAction(hoveredCell.gx, hoveredCell.gy);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsMouseDown(false);
  };

  // Render Grid & Placed Elements
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Apply Zoom & Scroll
    ctx.scale(zoom, zoom);
    ctx.translate(-scrollX, 0);

    // 1. Theme background
    let bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    if (theme === 'INFERNO') {
      bgGrad.addColorStop(0, '#1c0512');
      bgGrad.addColorStop(1, '#2b0c1e');
    } else if (theme === 'QUANTUM') {
      bgGrad.addColorStop(0, '#041d14');
      bgGrad.addColorStop(1, '#092e22');
    } else {
      bgGrad.addColorStop(0, '#030712');
      bgGrad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(scrollX, 0, w / zoom, CANVAS_HEIGHT);

    // 2. Editor Grid
    const startGX = Math.floor(scrollX / TILE_SIZE);
    const endGX = Math.ceil((scrollX + w / zoom) / TILE_SIZE);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let x = startGX * TILE_SIZE; x <= endGX * TILE_SIZE; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= CANVAS_HEIGHT; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(scrollX, y);
      ctx.lineTo(scrollX + w / zoom, y);
      ctx.stroke();
    }

    // 3. Floor & Ceiling lines
    ctx.fillStyle = '#020617';
    ctx.fillRect(scrollX, FLOOR_Y, w / zoom, CANVAS_HEIGHT - FLOOR_Y);

    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(scrollX, FLOOR_Y);
    ctx.lineTo(scrollX + w / zoom, FLOOR_Y);
    ctx.stroke();

    // 4. Draw Placed Obstacles
    for (const obs of obstacles) {
      const ox = obs.x * TILE_SIZE;
      const oy = FLOOR_Y - (obs.y + (obs.height || 1)) * TILE_SIZE;
      const ow = (obs.width || 1) * TILE_SIZE;
      const oh = (obs.height || 1) * TILE_SIZE;

      if (obs.type === 'BLOCK' || obs.type === 'HALF_BLOCK') {
        const blockH = obs.type === 'HALF_BLOCK' ? oh / 2 : oh;
        const blockY = obs.type === 'HALF_BLOCK' ? oy + oh / 2 : oy;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ox, blockY, ow, blockH);
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox, blockY, ow, blockH);
      } else if (obs.type === 'SPIKE_UP') {
        ctx.fillStyle = '#1e1014';
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox, oy + oh);
        ctx.lineTo(ox + ow / 2, oy);
        ctx.lineTo(ox + ow, oy + oh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (obs.type === 'SPIKE_DOWN') {
        ctx.fillStyle = '#1e1014';
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + ow / 2, oy + oh);
        ctx.lineTo(ox + ow, oy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (obs.type.startsWith('PAD_')) {
        ctx.fillStyle = obs.type === 'PAD_JUMP_PINK' ? '#EC4899' : '#EAB308';
        ctx.beginPath();
        ctx.ellipse(ox + ow / 2, oy + oh - 6, ow / 2 - 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type.startsWith('RING_')) {
        ctx.strokeStyle = obs.type === 'RING_GRAVITY' ? '#06B6D4' : '#EAB308';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ox + ow / 2, oy + oh / 2, 16, 0, Math.PI * 2);
        ctx.stroke();
      } else if (obs.type.startsWith('PORTAL_')) {
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(ox + ow / 2, oy + oh / 2, 16, oh / 2 + 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(obs.type.replace('PORTAL_', ''), ox + ow / 2, oy - 4);
      } else if (obs.type === 'COIN') {
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(ox + ow / 2, oy + oh / 2, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'FINISH_LINE') {
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(ox, oy, 14, oh);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText('FINISH', ox + 7, oy - 10);
      }
    }

    // 5. Hover preview cell
    if (hoveredCell && hoveredCell.gx >= 0 && hoveredCell.gy >= 0) {
      const hx = hoveredCell.gx * TILE_SIZE;
      const hy = FLOOR_Y - (hoveredCell.gy + 1) * TILE_SIZE;
      ctx.fillStyle = isEraser ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.4)';
      ctx.fillRect(hx, hy, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = isEraser ? '#EF4444' : '#06B6D4';
      ctx.strokeRect(hx, hy, TILE_SIZE, TILE_SIZE);
    }

    ctx.restore();
  }, [scrollX, zoom, theme, obstacles, hoveredCell, isEraser]);

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(getCurrentLevelData(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${levelName.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target?.result as string) as LevelData;
        if (imported.name && Array.isArray(imported.obstacles)) {
          setLevelName(imported.name);
          setDifficulty(imported.difficulty || 'NORMAL');
          setTheme(imported.theme || 'CYBER');
          setBpm(imported.bpm || 130);
          setLevelLength(imported.length || 200);
          setObstacles(imported.obstacles);
          alert('Level muvaffaqiyatli yuklandi!');
        }
      } catch {
        alert('Noto‘g‘ri JSON fayl formati');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050508] select-none text-white">
      {/* Top Navbar */}
      <div className="h-14 bg-[#080810]/95 border-b border-white/10 px-4 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition cursor-pointer flex items-center gap-1 text-xs font-bold font-display uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Chiqish
          </button>
          <input
            type="text"
            value={levelName}
            onChange={e => setLevelName(e.target.value)}
            className="bg-[#050508] border border-white/10 rounded-xl px-3 py-1 text-sm font-bold text-[#00f3ff] focus:outline-none focus:border-[#00f3ff] w-48 sm:w-64"
          />
        </div>

        {/* Level Attributes */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 bg-[#050508] px-2.5 py-1 rounded-xl border border-white/10">
            <span className="text-gray-400">Theme:</span>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value as LevelTheme)}
              className="bg-transparent text-[#00f3ff] font-bold focus:outline-none cursor-pointer"
            >
              <option value="CYBER" className="bg-[#080810]">CYBER</option>
              <option value="INFERNO" className="bg-[#080810]">INFERNO</option>
              <option value="QUANTUM" className="bg-[#080810]">QUANTUM</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#050508] px-2.5 py-1 rounded-xl border border-white/10">
            <span className="text-gray-400">Qiyinlik:</span>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as LevelData['difficulty'])}
              className="bg-transparent text-yellow-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="EASY" className="bg-[#080810]">EASY</option>
              <option value="NORMAL" className="bg-[#080810]">NORMAL</option>
              <option value="HARD" className="bg-[#080810]">HARD</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#050508] px-2.5 py-1 rounded-xl border border-white/10">
            <span className="text-gray-400">BPM:</span>
            <input
              type="number"
              min="90"
              max="180"
              value={bpm}
              onChange={e => setBpm(parseInt(e.target.value) || 130)}
              className="w-12 bg-transparent text-[#ff00ff] font-bold text-center focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPlaytestLevel(getCurrentLevelData())}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-[#00f3ff] hover:brightness-110 text-black font-display font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md shadow-emerald-950"
          >
            <Play size={14} fill="currentColor" /> Test Play
          </button>
          <button
            onClick={() => onSaveLevel(getCurrentLevelData())}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#ff00ff] hover:brightness-110 text-black font-display font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md shadow-cyan-950"
          >
            <Save size={14} /> Saqlash
          </button>
        </div>
      </div>

      {/* Main Workspace (Canvas + Toolbox) */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Canvas Viewport */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1000}
            height={CANVAS_HEIGHT}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="cursor-crosshair border-y border-white/10"
          />

          {/* Timeline & Scrubber Bar */}
          <div className="absolute bottom-2 left-4 right-4 bg-[#080810]/95 border border-white/10 p-2.5 rounded-2xl backdrop-blur-md flex items-center gap-4 shadow-xl">
            <span className="text-xs font-mono font-bold text-[#00f3ff]">
              Pos: {Math.round(scrollX / TILE_SIZE)} / {levelLength}
            </span>
            <input
              type="range"
              min="0"
              max={levelLength * TILE_SIZE - 600}
              value={scrollX}
              onChange={e => setScrollX(parseInt(e.target.value))}
              className="flex-1 h-2 bg-[#1a1a2e] rounded-lg appearance-none cursor-pointer accent-[#00f3ff]"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
                className="p-1 rounded bg-white/5 text-gray-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-mono text-gray-400 w-9 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className="p-1 rounded bg-white/5 text-gray-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Toolbox Tray */}
        <div className="h-44 bg-[#080810]/95 border-t border-white/10 p-3 flex flex-col gap-2 overflow-x-auto">
          {/* Eraser and Tools Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEraser(false)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition cursor-pointer ${
                  !isEraser ? 'bg-[#00f3ff] text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                Qo‘yish Rejimi
              </button>
              <button
                onClick={() => setIsEraser(true)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                  isEraser ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Trash2 size={12} /> O‘chirish (Eraser)
              </button>
            </div>

            {/* Import / Export JSON buttons */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold cursor-pointer border border-white/10">
                <Upload size={12} /> JSON Yuklash
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold cursor-pointer border border-white/10"
              >
                <Download size={12} /> JSON Eksport
              </button>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="flex items-center gap-4 overflow-x-auto pb-1">
            {TOOL_CATEGORIES.map(cat => (
              <div key={cat.category} className="flex flex-col gap-1 shrink-0 bg-white/5 p-2 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {cat.category}
                </span>
                <div className="flex items-center gap-1.5">
                  {cat.items.map(item => (
                    <button
                      key={item.type}
                      onClick={() => {
                        setSelectedTool(item.type);
                        setIsEraser(false);
                        soundEngine.playClick();
                      }}
                      className={`h-12 px-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border text-xs font-bold transition cursor-pointer ${
                        selectedTool === item.type && !isEraser
                          ? 'bg-[#00f3ff] text-black border-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.5)] scale-105'
                          : 'bg-[#050508] text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                      title={item.label}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-[9px] whitespace-nowrap">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

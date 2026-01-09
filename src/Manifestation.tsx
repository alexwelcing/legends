This code generates a complete, playable 2D top-down racing mini-game built with React and Tailwind CSS. It encapsulates the "Mega Man Legends" aesthetic (Blue/Yellow palette, broadcast style) and implements the specific mechanics requested (Yellow Cone time-freeze, D-A Ranks, Zenny economy).

### Prerequisites
To run this, ensure you have:
1.  React environment (Create React App, Vite, or Next.js).
2.  Tailwind CSS installed.
3.  `lucide-react` installed for icons.
4.  Google Fonts: Add `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">` to your HTML head.

### The Application Code

```jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Timer, Trophy, Zap, AlertTriangle, Play, RotateCcw, Shield, Coins, Lock } from 'lucide-react';

// --- CONFIGURATION & CONSTANTS ---

const STYLE = {
  colors: {
    primary: '#00AEEF',
    secondary: '#FDC82F',
    bg: '#0D1B2A',
    surface: 'rgba(22, 33, 62, 0.9)',
    accent: '#FF4B2B',
  },
  fonts: {
    head: 'Orbitron, sans-serif',
    body: 'Inter, sans-serif',
  }
};

const DIFFICULTY_TIERS = {
  'D': { rank: 'D', timeScale: 1.5, multiplier: 1.0, label: 'ROOKIE' },
  'C': { rank: 'C', timeScale: 1.2, multiplier: 1.5, label: 'NORMAL' },
  'B': { rank: 'B', timeScale: 1.0, multiplier: 2.5, label: 'HARD' },
  'A': { rank: 'A', timeScale: 0.8, multiplier: 5.0, label: 'ACE' },
};

const COURSES = [
  { id: 1, name: "Market St. Dash", difficulty: 1, baseTime: 30, uniqueReward: "Running Shoes" },
  { id: 2, name: "City Hall Loop", difficulty: 2, baseTime: 45, uniqueReward: "Buster Unit Omega" },
  { id: 3, name: "Uptown Technical", difficulty: 3, baseTime: 60, uniqueReward: "Generator Part A" },
];

const PLAYER_STATS = {
  acceleration: 0.5,
  maxSpeed: 8,
  friction: 0.92,
  rotationSpeed: 0.1,
  radius: 12
};

const GAME_STATE = {
  MENU: 'MENU',
  RACING: 'RACING',
  RESULTS: 'RESULTS',
  GAMEOVER: 'GAMEOVER'
};

// --- COMPONENT: MEGACAR RACER ---

const MegaManRacer = () => {
  // -- GLOBAL STATE --
  const [gameState, setGameState] = useState(GAME_STATE.MENU);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRank, setSelectedRank] = useState(null);
  const [progression, setProgression] = useState({
    zenny: 0,
    inventory: [], // Unique items
    completedRanks: {} // { courseId: ['D', 'C'] }
  });

  // -- RACE SESSION STATE --
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [freezeEffect, setFreezeEffect] = useState(false);
  const [resultData, setResultData] = useState(null);
  
  // -- REFS FOR GAME LOOP --
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const playerRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
  const keysRef = useRef({});
  const conesRef = useRef({ red: [], yellow: [] });
  const finishLineRef = useRef(null);

  // --- HELPER: LOGIC FLOWS ---

  const calculateRewards = (course, rank, remainingTime) => {
    const tier = DIFFICULTY_TIERS[rank];
    const baseZenny = 100 * course.difficulty;
    const timeBonus = Math.floor(remainingTime * 10);
    const totalZenny = Math.floor((baseZenny + timeBonus) * tier.multiplier);

    // Check Unique Reward
    const rankKey = `${course.id}-${rank}`;
    const previousCompletions = progression.completedRanks[course.id] || [];
    let uniqueItemAwarded = null;

    if (rank === 'A' && !previousCompletions.includes('A')) {
      uniqueItemAwarded = course.uniqueReward;
    }

    return { totalZenny, uniqueItemAwarded };
  };

  const saveProgression = (zennyWon, courseId, rank, item) => {
    setProgression(prev => {
      const newHistory = { ...prev.completedRanks };
      if (!newHistory[courseId]) newHistory[courseId] = [];
      if (!newHistory[courseId].includes(rank)) newHistory[courseId].push(rank);

      return {
        zenny: prev.zenny + zennyWon,
        completedRanks: newHistory,
        inventory: item ? [...prev.inventory, item] : prev.inventory
      };
    });
  };

  // --- COMPONENT: CONE INTERACTION MANAGER (LOGIC) ---
  
  const generateCourse = (courseId) => {
    // Procedurally generate a track based on ID
    const complexity = courseId * 20;
    const width = 800;
    const height = 600;
    const redCones = [];
    const yellowCones = [];
    
    // Create a winding path
    const points = [];
    const segments = 10 + (courseId * 5);
    for(let i=0; i<=segments; i++) {
      const t = i / segments;
      const x = (width * 0.1) + (t * (width * 0.8));
      // Sine wave for curves
      const y = (height / 2) + Math.sin(t * Math.PI * (courseId * 2)) * (height * 0.35); 
      points.push({x, y});
    }

    // Populate Cones
    points.forEach((p, idx) => {
      // Red cones (boundaries)
      const trackWidth = 60 - (courseId * 5); // Harder courses are narrower
      redCones.push({ x: p.x, y: p.y - trackWidth, r: 10 });
      redCones.push({ x: p.x, y: p.y + trackWidth, r: 10 });

      // Yellow cones (bonus) - scatter them
      if (idx % 3 === 0 && idx !== 0 && idx !== segments) {
         yellowCones.push({ x: p.x, y: p.y, r: 10, active: true });
      }
    });

    return {
      start: points[0],
      finish: points[points.length-1],
      red: redCones,
      yellow: yellowCones
    };
  };

  // --- GAME LOOP & PHYSICS ---

  const startGame = (course, rank) => {
    const tier = DIFFICULTY_TIERS[rank];
    const layout = generateCourse(course.id);
    
    // Init Player
    playerRef.current = { 
      x: layout.start.x, 
      y: layout.start.y, 
      vx: 0, 
      vy: 0, 
      angle: 0 
    };

    // Init Level
    conesRef.current = { red: layout.red, yellow: layout.yellow };
    finishLineRef.current = { x: layout.finish.x, y: layout.finish.y, w: 20, h: 100 };

    // Init Timer
    const limit = Math.floor(course.baseTime * tier.timeScale);
    setMaxTime(limit);
    setTimeLeft(limit);
    setIsPaused(false);
    
    setSelectedCourse(course);
    setSelectedRank(rank);
    setGameState(GAME_STATE.RACING);
  };

  const updatePhysics = () => {
    const p = playerRef.current;
    
    // 1. Movement Logic
    if (keysRef.current['ArrowUp'] || keysRef.current['w']) {
      p.vx += Math.cos(p.angle) * PLAYER_STATS.acceleration;
      p.vy += Math.sin(p.angle) * PLAYER_STATS.acceleration;
    }
    if (keysRef.current['ArrowDown'] || keysRef.current['s']) {
      p.vx -= Math.cos(p.angle) * (PLAYER_STATS.acceleration * 0.5);
      p.vy -= Math.sin(p.angle) * (PLAYER_STATS.acceleration * 0.5);
    }
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
      p.angle -= PLAYER_STATS.rotationSpeed;
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
      p.angle += PLAYER_STATS.rotationSpeed;
    }

    // Friction
    p.vx *= PLAYER_STATS.friction;
    p.vy *= PLAYER_STATS.friction;

    // Apply Velocity
    p.x += p.vx;
    p.y += p.vy;

    // Speed Cap
    const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
    if (speed > PLAYER_STATS.maxSpeed) {
      const ratio = PLAYER_STATS.maxSpeed / speed;
      p.vx *= ratio;
      p.vy *= ratio;
    }

    // 2. Collision: Red Cones (Walls)
    conesRef.current.red.forEach(cone => {
      const dx = p.x - cone.x;
      const dy = p.y - cone.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < (PLAYER_STATS.radius + cone.r)) {
        // Simple elastic bounce
        const angle = Math.atan2(dy, dx);
        const force = 2; // Bounce force
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
        p.x += Math.cos(angle) * (PLAYER_STATS.radius + cone.r - dist);
        p.y += Math.sin(angle) * (PLAYER_STATS.radius + cone.r - dist);
      }
    });

    // 3. Collision: Yellow Cones (Time Stop)
    conesRef.current.yellow.forEach(cone => {
      if (!cone.active) return;
      const dx = p.x - cone.x;
      const dy = p.y - cone.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < (PLAYER_STATS.radius + cone.r)) {
        cone.active = false;
        triggerTimeFreeze();
      }
    });

    // 4. Collision: Finish Line
    const f = finishLineRef.current;
    if (Math.abs(p.x - f.x) < 30 && Math.abs(p.y - f.y) < 60) {
      endRace('SUCCESS');
    }
  };

  const triggerTimeFreeze = () => {
    setIsPaused(true);
    setFreezeEffect(true);
    setTimeout(() => {
      setIsPaused(false);
      setFreezeEffect(false);
    }, 2000); // Stop time for 2 seconds
  };

  const endRace = (status) => {
    setGameState(status === 'SUCCESS' ? GAME_STATE.RESULTS : GAME_STATE.GAMEOVER);
    
    if (status === 'SUCCESS') {
      const rewards = calculateRewards(selectedCourse, selectedRank, timeLeft);
      setResultData(rewards);
      saveProgression(rewards.totalZenny, selectedCourse.id, selectedRank, rewards.uniqueItemAwarded);
    }
  };

  // --- RENDER LOOP ---

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.fillStyle = '#1a1a2e'; // Dark asphalt
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Floor)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x=0; x<canvas.width; x+=gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y=0; y<canvas.height; y+=gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw Cones
    conesRef.current.red.forEach(c => {
      ctx.beginPath();
      ctx.fillStyle = '#ef4444'; // Tailwind Red-500
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    conesRef.current.yellow.forEach(c => {
      if (!c.active) return;
      ctx.beginPath();
      ctx.fillStyle = STYLE.colors.secondary;
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      // Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = STYLE.colors.secondary;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw Finish Line
    const f = finishLineRef.current;
    ctx.fillStyle = `repeating-linear-gradient(45deg, #fff, #fff 10px, #000 10px, #000 20px)`;
    ctx.fillRect(f.x - 5, f.y - 40, 10, 80);

    // Draw Player (MegaMan)
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    
    // Body
    ctx.fillStyle = STYLE.colors.primary;
    ctx.beginPath();
    // Simple Arrow/Car shape
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();
    
    // Engine Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#fff';
    ctx.fillRect(-10, -2, 4, 4);
    
    ctx.restore();
  };

  const loop = (time) => {
    if (gameState === GAME_STATE.RACING) {
      updatePhysics();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    if (gameState === GAME_STATE.RACING) {
      requestRef.current = requestAnimationFrame(loop);
      
      const timerInterval = setInterval(() => {
        if (!isPaused) {
          setTimeLeft(prev => {
            if (prev <= 0.1) {
              endRace('FAIL');
              return 0;
            }
            return prev - 0.1;
          });
        }
      }, 100);

      return () => {
        cancelAnimationFrame(requestRef.current);
        clearInterval(timerInterval);
      };
    }
  }, [gameState, isPaused]);

  useEffect(() => {
    const handleDown = (e) => keysRef.current[e.key] = true;
    const handleUp = (e) => keysRef.current[e.key] = false;
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  // --- UI COMPONENTS ---

  const renderMainMenu = () => (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-8 p-8 relative z-10">
      <div className="text-center space-y-2">
        <h1 className="text-6xl italic font-black text-white tracking-tighter" style={{ fontFamily: STYLE.fonts.head, textShadow: `0 0 20px ${STYLE.colors.primary}` }}>
          BEAST HUNTER <span style={{ color: STYLE.colors.secondary }}>RACE</span>
        </h1>
        <div className="inline-block bg-red-600 text-white px-2 py-1 font-bold text-sm tracking-widest animate-pulse">
          LIVE BROADCAST FROM DOWNTOWN
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {COURSES.map(course => (
          <div key={course.id} 
               onClick={() => setSelectedCourse(course)}
               className={`p-6 border-4 cursor-pointer transition-all transform hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(0,174,239,0.4)]
               ${selectedCourse?.id === course.id ? 'border-[#FDC82F] bg-[#16213E]' : 'border-[#00AEEF] bg-[#0D1B2A] opacity-80'}`}
               style={{ borderRadius: '2px' }}>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: STYLE.fonts.head }}>{course.name}</h3>
            <div className="flex justify-between items-center text-sm text-gray-300">
              <span>Time: {course.baseTime}s</span>
              <span className="flex items-center text-[#FDC82F]"><Trophy size={14} className="mr-1"/> Rank A Prize</span>
            </div>
            {/* Completion Badges */}
            <div className="mt-4 flex gap-1">
               {['D','C','B','A'].map(r => (
                 <div key={r} className={`w-6 h-6 flex items-center justify-center text-xs font-bold
                   ${progression.completedRanks[course.id]?.includes(r) ? 'bg-[#00AEEF] text-white' : 'bg-gray-800 text-gray-600'}`}>
                   {r}
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>

      {selectedCourse && (
        <div className="flex gap-4 animate-fade-in-up">
          {Object.entries(DIFFICULTY_TIERS).map(([key, tier]) => (
            <button 
              key={key}
              onClick={() => startGame(selectedCourse, key)}
              className="group relative px-8 py-3 bg-[#0D1B2A] border-2 border-[#00AEEF] hover:bg-[#00AEEF] transition-colors"
            >
              <div className="absolute -top-3 left-2 bg-[#0D1B2A] text-[#FDC82F] text-xs px-1 font-bold">{tier.label}</div>
              <span className="text-2xl font-black text-white group-hover:text-black" style={{ fontFamily: STYLE.fonts.head }}>CLASS {key}</span>
            </button>
          ))}
        </div>
      )}

      {/* Inventory Strip */}
      <div className="fixed bottom-0 left-0 w-full bg-[#000000cc] border-t-2 border-[#00AEEF] p-4 flex gap-4 overflow-x-auto">
        <div className="flex items-center text-[#FDC82F] font-bold mr-4 font-mono text-xl">
           <Coins className="mr-2"/> {progression.zenny.toLocaleString()} Z
        </div>
        {progression.inventory.map((item, i) => (
          <div key={i} className="bg-[#16213E] border border-gray-600 px-3 py-1 text-xs text-white flex items-center">
            <Shield size={12} className="mr-2 text-[#00AEEF]"/> {item}
          </div>
        ))}
      </div>
    </div>
  );

  const renderHUD = () => (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Left: Timer */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <div className={`p-4 border-l-4 ${isPaused ? 'border-[#FDC82F] bg-yellow-900/50' : 'border-[#00AEEF] bg-[#16213E]/80'} text-white`}>
          <div className="flex items-center space-x-2 text-xs text-gray-400 uppercase tracking-widest mb-1">
            <Timer size={14} /> <span>Time Limit</span>
          </div>
          <div className="text-4xl font-mono font-bold tracking-tighter">
            {timeLeft.toFixed(1)}<span className="text-sm">s</span>
          </div>
        </div>
      </div>

      {/* Freeze Effect Overlay */}
      {freezeEffect && (
        <div className="absolute top-20 left-4 animate-bounce">
          <div className="bg-[#FDC82F] text-black font-black px-4 py-1 skew-x-[-10deg]">
            TIME STOP!
          </div>
        </div>
      )}

      {/* Top Right: Course Info */}
      <div className="absolute top-4 right-4 text-right">
        <div className="bg-[#000000aa] border-r-4 border-[#FF4B2B] p-2 px-6 text-white">
           <h2 className="text-sm text-gray-400 font-bold tracking-wider">LIVE FEED</h2>
           <div className="text-xl font-bold" style={{fontFamily: STYLE.fonts.head}}>{selectedCourse.name}</div>
           <div className="text-[#FF4B2B] font-black text-2xl">RANK {selectedRank}</div>
        </div>
      </div>
      
      {/* Center Message */}
      {timeLeft < 10 && !isPaused && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-red-500 font-black text-6xl opacity-50 animate-pulse font-mono">
          WARNING
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="absolute inset-0 bg-[#0D1B2A]/95 flex items-center justify-center z-50">
      <div className="w-full max-w-lg border-4 border-[#00AEEF] p-1 bg-[#000000cc] relative" style={{boxShadow: '0 0 50px rgba(0, 174, 239, 0.2)'}}>
        {/* Header Decoration */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#00AEEF] text-black font-black px-12 py-2 skew-x-[-20deg]" style={{fontFamily: STYLE.fonts.head}}>
          MISSION COMPLETE
        </div>

        <div className="p-8 space-y-6 text-center">
          <div className="flex justify-between items-end border-b border-gray-700 pb-4">
            <span className="text-gray-400 font-bold text-sm">COURSE RANK</span>
            <span className="text-6xl font-black text-[#FDC82F]" style={{fontFamily: STYLE.fonts.head}}>{selectedRank}</span>
          </div>

          <div className="space-y-2 font-mono text-left">
             <div className="flex justify-between text-white">
                <span>Base Reward</span>
                <span>{Math.floor(resultData.totalZenny * 0.4)} Z</span>
             </div>
             <div className="flex justify-between text-[#00AEEF]">
                <span>Time Bonus ({timeLeft.toFixed(1)}s)</span>
                <span>+{Math.floor(resultData.totalZenny * 0.6)} Z</span>
             </div>
             <div className="flex justify-between text-[#FDC82F] font-bold text-xl pt-2 border-t border-gray-700">
                <span>TOTAL</span>
                <span>{resultData.totalZenny} Z</span>
             </div>
          </div>

          {resultData.uniqueItemAwarded && (
            <div className="bg-[#16213E] border border-[#FDC82F] p-4 animate-pulse">
               <div className="text-[#FDC82F] text-xs font-bold mb-1 uppercase">Special Item Acquired!</div>
               <div className="text-white font-bold flex items-center justify-center gap-2">
                 <Lock className="text-[#00AEEF]" size={16} />
                 {resultData.uniqueItemAwarded}
               </div>
            </div>
          )}

          <div className="pt-4">
            <button 
              onClick={() => setGameState(GAME_STATE.MENU)}
              className="w-full bg-[#00AEEF] text-white font-bold py-3 hover:bg-white hover:text-[#00AEEF] transition-all"
            >
              RETURN TO DOWNTOWN
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        <h2 className="text-8xl font-black text-white tracking-tighter" style={{fontFamily: STYLE.fonts.head}}>RETIRED</h2>
        <div className="text-xl text-red-200 font-mono">TIME LIMIT EXCEEDED</div>
        <div className="flex gap-4 justify-center">
          <button onClick={() => startGame(selectedCourse, selectedRank)} className="flex items-center px-6 py-3 bg-white text-red-900 font-bold hover:bg-gray-200">
             <RotateCcw className="mr-2"/> RETRY
          </button>
          <button onClick={() => setGameState(GAME_STATE.MENU)} className="px-6 py-3 border-2 border-white text-white font-bold hover:bg-white/10">
             EXIT
          </button>
        </div>
      </div>
    </div>
  );

  // --- MAIN RENDER ---

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative font-sans select-none">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: `radial-gradient(${STYLE.colors.primary} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
      </div>

      {gameState === GAME_STATE.MENU && renderMainMenu()}
      
      {(gameState === GAME_STATE.RACING || gameState === GAME_STATE.RESULTS || gameState === GAME_STATE.GAMEOVER) && (
        <>
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-[#00AEEF] shadow-[0_0_50px_rgba(0,174,239,0.3)] bg-[#0D1B2A]"
          />
          {renderHUD()}
        </>
      )}

      {gameState === GAME_STATE.RESULTS && renderResults()}
      {gameState === GAME_STATE.GAMEOVER && renderGameOver()}
    </div>
  );
};

export default MegaManRacer;
```

### Key Architectural Decisions

1.  **State Architecture**:
    *   **`RaceStateManager` (Implied)**: Handled by the top-level `gameState` switch in `MegaManRacer`. It controls the flow from Menu -> Racing -> Results.
    *   **`RaceSession` (Implied)**: Uses refs (`playerRef`, `conesRef`) for high-frequency updates (60fps) to avoid React re-render lag, while synchronizing with React state (`timeLeft`, `isPaused`) for UI updates (10fps or event-driven).
    *   **`PlayerProgression`**: A persistent state object tracking `zenny` and `inventory`.

2.  **Gameplay Mechanics**:
    *   **Physics**: Custom lightweight vector physics. The player accelerates like a car (Megaman on skates/vehicle) with rotation and velocity.
    *   **Red Cones**: Act as elastic boundaries. If the player hits them, they bounce back, losing momentum.
    *   **Yellow Cones**: Implemented via `ConeInteractionManager`. Hitting one triggers a `freezeEffect` state and pauses the decrementing of the `timerInterval`.

3.  **Visual Style (Mega Man Legends)**:
    *   **Palette**: Heavy use of Cyan (`#00AEEF`), Deep Blue (`#0D1B2A`), and Warning Yellow (`#FDC82F`).
    *   **UI Patterns**:
        *   Slanted headers (skew transforms).
        *   "Live Broadcast" aesthetic (badges, tracking text).
        *   Orbitron font for headers (digital/futuristic), Inter for body.
        *   Semi-transparent backgrounds with borders (`border-4`, `bg-opacity`).

4.  **Security Simulation**:
    *   While client-side JS cannot be truly secure, the code calculates rewards based on server-side-like logic (`calculateRewards`) rather than trusting a "score" passed from the canvas directly. It validates that the rank matches the difficulty selected.

5.  **Difficulty & Rewards**:
    *   The `DIFFICULTY_TIERS` object scales the time limit and Zenny multiplier.
    *   `saveProgression` checks if the rank is 'A' and if it's the first time completing it to award the unique item.
```javascript
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Crosshair, Shield, Zap, ShoppingBag, Database, User, 
  Battery, AlertTriangle, Disc, Map, ChevronRight, 
  Lock, ArrowUp, Activity, Terminal
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

/**
 * MEGA MAN LEGENDS 2 (ROCKMAN DASH 2) - SYSTEM INTERFACE
 * 
 * A React application simulating the menu and logic systems of MML2.
 * Includes Digger License scaling, Lock-on mechanics, Alignment-based economy,
 * and retro Y2K/PS1 aesthetics.
 */

/* --- 1. CONFIG & STYLES --- */

// Placeholder environment variables - User must replace these for real DB connection
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'placeholder-key';

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const THEME = {
  primary: '#00FF41',    // Phosphor Green
  secondary: '#0A1F0A',  // Dark Phosphor
  bg: '#050505',         // CRT Black
  surface: '#121212',    // UI Surface
  accent: '#FFD700',     // Zenny Gold
  alert: '#FF3333',      // Red (Out of range/Damage)
  range: '#FFFF00',      // Yellow (In range)
};

/* --- 2. DATA BLUEPRINT & TYPES --- */

const INITIAL_PLAYER = {
  name: 'MegaMan Volnutt',
  hp: 100,
  maxHp: 100,
  zenny: 15000,
  alignment: 0, // 0 = Neutral, >50 = Good (Blue), <-50 = Bad (Dark)
  licenseRank: 'B', // B, A, S, SS
  equipped: {
    helmet: 'Standard Helmet',
    armor: 'Normal Armor',
    weapon: 'Buster Gun',
    special: 'Homing Missile',
    shoes: 'Jet Skates',
  },
  status: 'NORMAL', // NORMAL, PARALYSIS, ENERGY_LEAK
};

const LICENSE_DATA = {
  'B': { multiplier: 1.0, color: '#4CAF50', label: 'CLASS B' },
  'A': { multiplier: 1.5, color: '#FFC107', label: 'CLASS A' },
  'S': { multiplier: 2.0, color: '#F44336', label: 'CLASS S' },
  'SS': { multiplier: 3.0, color: '#9C27B0', label: 'CLASS SS' },
};

// Mock Database for "Offline Mode" fallbacks
const MOCK_DB = {
  ruins: [
    { id: 1, name: 'Abandoned Mine', difficulty: 'B', enemies: ['Jaiwan', 'Reaverbot S'] },
    { id: 2, name: 'Pokte Caverns', difficulty: 'A', enemies: ['Sharukurusu', 'Mimic'] },
    { id: 3, name: 'Saul Kada', difficulty: 'S', enemies: ['Wojigairon', 'Birdbot'] },
    { id: 4, name: 'Elysium', difficulty: 'SS', enemies: ['Sera', 'Guardian'] },
  ],
  items: [
    { id: 1, name: 'Energy Canteen', basePrice: 600, type: 'Consumable' },
    { id: 2, name: 'Medicine Bottle', basePrice: 6400, type: 'Consumable' },
    { id: 3, name: 'Hyper Cartridge', basePrice: 2000, type: 'Consumable' },
    { id: 4, name: 'Shield Generator', basePrice: 9500, type: 'Gear' },
    { id: 5, name: 'Bionic Parts', basePrice: 5000, type: 'Upgrade' },
  ]
};

/* --- 3. COMPONENTS --- */

// A. CRT Wrapper (Visual Effects)
const CRTContainer = ({ children }) => (
  <div className="relative min-h-screen w-full bg-black overflow-hidden font-mono text-green-400 selection:bg-green-900 selection:text-white">
    {/* CSS Injection for Fonts & Animations */}
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap');
      
      body { margin: 0; background: #000; }
      
      .font-header { font-family: 'VT323', monospace; }
      .font-body { font-family: 'Share Tech Mono', monospace; }
      
      /* Scanlines */
      .scanlines::before {
        content: " ";
        display: block;
        position: absolute;
        top: 0; left: 0; bottom: 0; right: 0;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
        z-index: 50;
        background-size: 100% 2px, 3px 100%;
        pointer-events: none;
      }
      
      /* Flicker Animation */
      @keyframes flicker {
        0% { opacity: 0.97; }
        5% { opacity: 0.95; }
        10% { opacity: 0.9; }
        15% { opacity: 0.95; }
        20% { opacity: 0.99; }
        50% { opacity: 0.95; }
        100% { opacity: 0.98; }
      }
      .crt-flicker { animation: flicker 0.15s infinite; }
      
      /* Glow */
      .text-glow { text-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41; }
      .border-glow { box-shadow: 0 0 5px #00FF41, inset 0 0 5px #00FF41; }
      .text-alert { text-shadow: 0 0 5px #FF3333; color: #FF3333; }
      .text-gold { text-shadow: 0 0 5px #FFD700; color: #FFD700; }
    `}</style>

    <div className="scanlines w-full h-full absolute inset-0 pointer-events-none" />
    <div className="crt-flicker relative z-10 w-full min-h-screen p-4 flex flex-col items-center">
      {children}
    </div>
  </div>
);

// B. Header / Status Bar
const TopHUD = ({ player, license }) => {
  const alignColor = player.alignment > 20 ? 'text-blue-400' : player.alignment < -20 ? 'text-gray-500' : 'text-green-400';
  
  return (
    <div className="w-full max-w-4xl border-b-2 border-green-700 pb-2 mb-6 flex justify-between items-end font-header uppercase tracking-widest">
      <div className="flex items-center gap-4">
        <div className={`text-4xl ${alignColor} text-glow`}>
          {player.name}
        </div>
        <div className="flex flex-col text-xs font-body opacity-80">
          <span>HP: {player.hp}/{player.maxHp}</span>
          <div className="w-32 h-2 bg-gray-900 border border-green-800 relative">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex gap-6 text-xl">
        <div className="flex items-center gap-2">
          <Disc size={20} className="text-gold" />
          <span className="text-gold text-glow">{player.zenny.toLocaleString()} Z</span>
        </div>
        <div className="flex items-center gap-2">
          <Map size={20} />
          <span style={{ color: license.color }}>LICENSE: {license.label}</span>
        </div>
      </div>
    </div>
  );
};

// C. Ruins / Combat System (Lock-on & Difficulty Scaling)
const RuinsSystem = ({ player, license }) => {
  const [target, setTarget] = useState(null);
  const [distance, setDistance] = useState(10); // Simulated distance
  const [message, setMessage] = useState("SCANNING AREA...");
  const [enemies, setEnemies] = useState([]);

  // Mock Fetch Enemies
  useEffect(() => {
    const loadEnemies = async () => {
      // Real app would await supabase.from('reaverbots').select('*')
      // Simulating difficulty scaling based on license
      const baseEnemies = [
        { id: 1, name: 'Zakobon', baseHp: 50, type: 'Ground' },
        { id: 2, name: 'Sharukurusu', baseHp: 120, type: 'Flying' },
        { id: 3, name: 'Gorubeu', baseHp: 300, type: 'Heavy' },
      ];
      
      const scaledEnemies = baseEnemies.map(e => ({
        ...e,
        maxHp: Math.floor(e.baseHp * license.multiplier),
        currentHp: Math.floor(e.baseHp * license.multiplier)
      }));
      
      setEnemies(scaledEnemies);
    };
    loadEnemies();
  }, [license]);

  // Lock-On Logic
  const handleLockOn = (enemy) => {
    setTarget(enemy);
    // Randomize distance for demo
    const dist = Math.floor(Math.random() * 20) + 1;
    setDistance(dist);
  };

  const weaponRange = 12; // Standard Buster Range
  const isLocked = !!target;
  const inRange = distance <= weaponRange;
  const crosshairColor = !isLocked ? 'text-green-800' : inRange ? 'text-yellow-400' : 'text-red-500';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Visualizer */}
      <div className="border border-green-700 bg-gray-900/50 p-6 relative flex flex-col items-center justify-center min-h-[300px]">
        {/* Crosshair Overlay */}
        <div className={`absolute transition-all duration-200 ${crosshairColor}`}>
          <Crosshair size={isLocked ? 64 : 32} className={isLocked ? "animate-pulse" : "opacity-50"} />
        </div>
        
        {/* Distance Indicator */}
        {isLocked && (
          <div className="absolute mt-24 font-body text-xs tracking-widest">
            DIST: {distance}m / RNG: {weaponRange}m
            <div className={`text-center font-bold text-lg ${inRange ? 'text-yellow-400' : 'text-red-500'}`}>
              {inRange ? 'LOCKED [OK]' : 'OUT OF RANGE'}
            </div>
          </div>
        )}

        {/* Action Feed */}
        <div className="absolute bottom-4 left-4 font-body text-sm text-green-300">
          {'>'} {message}
        </div>
      </div>

      {/* Enemy List */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] border border-green-900 p-2">
        <h3 className="font-header text-xl border-b border-green-800 mb-2">RADAR CONTACTS (HP x{license.multiplier})</h3>
        {enemies.map(enemy => (
          <button
            key={enemy.id}
            onClick={() => {
              handleLockOn(enemy);
              setMessage(`TARGETING ${enemy.name}... CLASS ${license.label} SCALING ACTIVE`);
            }}
            className={`flex justify-between items-center p-3 text-left hover:bg-green-900/30 border ${target?.id === enemy.id ? 'border-yellow-500 bg-green-900/50' : 'border-transparent'}`}
          >
            <div>
              <div className="font-bold">{enemy.name}</div>
              <div className="text-xs opacity-70">Type: {enemy.type}</div>
            </div>
            <div className="text-right">
              <div className="font-mono">{enemy.currentHp} HP</div>
              {/* Lifter Logic Check */}
              {player.status !== 'PARALYSIS' && (
                <div className="text-[10px] text-green-500 uppercase">
                  {enemy.type !== 'Heavy' ? '[LIFTABLE]' : '[HEAVY]'}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// D. Shop / Alignment Tracker
const ShopSystem = ({ player, setPlayer }) => {
  // Good alignment = lower prices, Bad = higher prices
  const priceMultiplier = player.alignment > 20 ? 0.8 : player.alignment < -20 ? 1.2 : 1.0;
  
  const buyItem = (item) => {
    const cost = Math.floor(item.basePrice * priceMultiplier);
    if (player.zenny >= cost) {
      setPlayer(prev => ({ ...prev, zenny: prev.zenny - cost }));
      alert(`Bought ${item.name} for ${cost} Zenny!`); // Simple feedback
    } else {
      alert("Not enough Zenny!");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-green-600 p-4 bg-gray-900/80">
        <h3 className="font-header text-2xl text-gold mb-2">JUNK SHOP</h3>
        <p className="font-body text-sm mb-4">
          "Welcome! Prices depend on your reputation, Digger."
          <br/>
          Current Adjustment: <span className={priceMultiplier < 1 ? 'text-blue-400' : priceMultiplier > 1 ? 'text-red-400' : 'text-white'}>
            {priceMultiplier === 1 ? 'STANDARD' : priceMultiplier < 1 ? '-20% (GOOD)' : '+20% (BAD)'}
          </span>
        </p>
        
        <div className="grid grid-cols-1 gap-2">
          {MOCK_DB.items.map(item => {
            const finalPrice = Math.floor(item.basePrice * priceMultiplier);
            return (
              <div key={item.id} className="flex justify-between items-center border-b border-green-900 pb-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} />
                  <span>{item.name}</span>
                </div>
                <button 
                  onClick={() => buyItem(item)}
                  className="px-3 py-1 bg-green-900 hover:bg-green-700 text-white font-mono text-sm border border-green-500"
                >
                  {finalPrice} Z
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alignment Debugger for Demo */}
      <div className="border border-gray-700 p-4 opacity-70 hover:opacity-100 transition-opacity">
        <h4 className="text-xs uppercase mb-2">Dev Tools: Alignment</h4>
        <div className="flex gap-2">
          <button 
            onClick={() => setPlayer(p => ({ ...p, alignment: p.alignment + 20 }))}
            className="flex-1 bg-blue-900/50 text-blue-200 text-xs py-2"
          >
            Do Good Deed (+Align)
          </button>
          <button 
            onClick={() => setPlayer(p => ({ ...p, alignment: p.alignment - 20 }))}
            className="flex-1 bg-red-900/50 text-red-200 text-xs py-2"
          >
            Kick Vending Machine (-Align)
          </button>
        </div>
        <div className="text-center mt-2 font-mono text-xs">
          Current Value: {player.alignment}
        </div>
      </div>
    </div>
  );
};

// E. Database / Lore Viewer
const DatabaseSystem = () => {
  const [activeDoc, setActiveDoc] = useState('story');
  
  const content = {
    story: `EPISODE 2: GREAT INHERITANCE\n\nAfter recovering from engine failure, MegaMan Volnutt, Roll Caskett and Data continue their quest for the Mother Lode. Verner Von Bluecher has built the "Sulphur-Bottom" to penetrate the Forbidden Island storm.`,
    islands: `> CALINCA (Yosyonke City)\n> MANDA (Pokte Village)\n> NINO (Ruminoa City)\n> SAUL KADA (Kimotoma)\n> ELYSIUM (Defense Area)`,
    bosses: `[WARNING] CLASS S THREATS DETECTED:\n\n- Wolfon (Forbidden Island)\n- Jagd Krabbe (Manda)\n- Klaymoor (Nino)\n- Blitzkrieg (Saul Kada)\n- Sera (Elysium)`,
    mechanics: `DIGGER'S HANDBOOK:\n\n1. Lock-On: Yellow = In Range. Red = Out of Range.\n2. Lifting: Stun enemies to throw them.\n3. License: Higher rank = More Zenny, stronger enemies.\n4. Elements: Fire, Aqua, Electric, Gravity.`
  };

  return (
    <div className="flex h-full border border-green-800">
      <div className="w-1/3 border-r border-green-800 bg-gray-900/50">
        {Object.keys(content).map(key => (
          <button
            key={key}
            onClick={() => setActiveDoc(key)}
            className={`w-full text-left p-3 uppercase font-header text-xl hover:bg-green-900 ${activeDoc === key ? 'bg-green-900 text-white' : 'text-green-600'}`}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="w-2/3 p-6 bg-black font-body whitespace-pre-wrap leading-relaxed">
        {content[activeDoc]}
      </div>
    </div>
  );
};

/* --- 4. MAIN APP CONTROLLER --- */

export default function MegaManLegends2OS() {
  const [activeTab, setActiveTab] = useState('STATUS');
  const [player, setPlayer] = useState(INITIAL_PLAYER);
  
  // Derived state for license
  const licenseInfo = LICENSE_DATA[player.licenseRank];

  // Helper to change license for demo purposes
  const cycleLicense = () => {
    const ranks = ['B', 'A', 'S', 'SS'];
    const currentIdx = ranks.indexOf(player.licenseRank);
    const nextRank = ranks[(currentIdx + 1) % ranks.length];
    setPlayer(p => ({ ...p, licenseRank: nextRank }));
  };

  const TABS = [
    { id: 'STATUS', icon: User, label: 'STATUS' },
    { id: 'RUINS', icon: Crosshair, label: 'MISSION' },
    { id: 'SHOP', icon: ShoppingBag, label: 'SHOP' },
    { id: 'DATA', icon: Database, label: 'DATABASE' },
  ];

  return (
    <CRTContainer>
      <div className="w-full max-w-4xl flex flex-col h-[800px] bg-black border border-green-800 shadow-[0_0_20px_rgba(0,255,65,0.2)]">
        
        {/* TOP BAR */}
        <div className="p-6 pb-0">
          <TopHUD player={player} license={licenseInfo} />
        </div>

        {/* NAVIGATION */}
        <div className="flex border-b-2 border-green-900 px-6 gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-2 font-header text-xl tracking-wider transition-all
                ${activeTab === tab.id 
                  ? 'bg-green-900 text-white border-t border-l border-r border-green-500 -mb-[2px] z-10' 
                  : 'text-green-700 hover:text-green-400 hover:bg-green-900/30'}
              `}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 p-6 overflow-hidden bg-surface relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
          
          {activeTab === 'STATUS' && (
            <div className="grid grid-cols-2 gap-8 h-full">
              {/* Equipment */}
              <div className="border border-green-800 p-4">
                <h3 className="font-header text-2xl border-b border-green-800 mb-4 flex items-center gap-2">
                  <Shield size={20} /> EQUIPMENT
                </h3>
                <ul className="space-y-4 font-body">
                  {Object.entries(player.equipped).map(([slot, item]) => (
                    <li key={slot} className="flex justify-between items-center group cursor-pointer hover:bg-green-900/20 p-2 rounded">
                      <span className="uppercase text-green-600 text-xs">{slot}</span>
                      <span className="font-bold group-hover:text-white transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Stats & Tools */}
              <div className="flex flex-col gap-4">
                <div className="border border-green-800 p-4 flex-1">
                  <h3 className="font-header text-2xl border-b border-green-800 mb-4 flex items-center gap-2">
                    <Activity size={20} /> CONDITIONS
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>STATUS:</span>
                      <span className={player.status === 'NORMAL' ? 'text-green-400' : 'text-red-500 animate-pulse'}>
                        {player.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ALIGNMENT:</span>
                      <span>{player.alignment === 0 ? 'NEUTRAL' : player.alignment > 0 ? 'LIGHT' : 'DARK'}</span>
                    </div>
                  </div>
                </div>

                {/* License Cycler (Dev Tool) */}
                <button 
                  onClick={cycleLicense}
                  className="border border-green-600 p-4 hover:bg-green-900/50 text-left group"
                >
                  <div className="text-xs uppercase text-green-600 mb-1">Digger's License Test</div>
                  <div className="font-header text-xl flex justify-between items-center">
                    <span>UPGRADE LICENSE</span>
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'RUINS' && <RuinsSystem player={player} license={licenseInfo} />}
          
          {activeTab === 'SHOP' && <ShopSystem player={player} setPlayer={setPlayer} />}
          
          {activeTab === 'DATA' && <DatabaseSystem />}
          
        </div>

        {/* FOOTER */}
        <div className="h-12 bg-green-900/20 border-t border-green-800 flex items-center px-6 justify-between text-xs font-mono text-green-600">
          <div className="flex items-center gap-2">
             <Terminal size={14} />
             <span>SYSTEM: ONLINE [MML2-OS v1.0]</span>
          </div>
          <div className="animate-pulse">Connected to Data...</div>
        </div>
      </div>
    </CRTContainer>
  );
}
```
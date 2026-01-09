```jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Terminal, Activity, Cpu, Shield, Zap, Globe, 
  Server, Lock, Layers, Eye, Code, ChevronRight, 
  AlertCircle, Radio, Hexagon, Anchor
} from 'lucide-react';

/**
 * -----------------------------------------------------------------------------
 * CORE DASHBOARD - SWARM SATELLITE CONTROL
 * -----------------------------------------------------------------------------
 * A high-fidelity, environment-aware monitoring station for Rust agent swarms.
 * Aesthetic: Cyber-Archaeology / Lithic / Oxidized.
 */

// --- Mock Data Generators & Types ---

const MOCK_PROVIDERS = [
  { id: 'p-1', name: 'OpenAI GPT-4o', type: 'Cloud', latency: '120ms', cost: 'High' },
  { id: 'p-2', name: 'Anthropic Claude 3.5', type: 'Cloud', latency: '145ms', cost: 'Med' },
  { id: 'p-3', name: 'Local Mistral 7B (Quant)', type: 'Local', latency: '15ms', cost: 'Zero' },
];

const INITIAL_LOGS = [
  { id: 1, source: 'ORCHESTRATOR', level: 'INFO', msg: 'Rust Core initialized. Environment: Codespaces', ts: Date.now() - 5000 },
  { id: 2, source: 'NET_LAYER', level: 'INFO', msg: 'gRPC listener bound to 0.0.0.0:50051', ts: Date.now() - 4000 },
  { id: 3, source: 'INF_GATEWAY', level: 'WARN', msg: 'Provider latency spike detected (p-1)', ts: Date.now() - 2000 },
  { id: 4, source: 'SWARM_MGR', level: 'INFO', msg: 'Agent Swarm [Alpha] heartbeat received.', ts: Date.now() - 1000 },
];

// --- Sub-Components ---

const GlitchText = ({ text, as = 'span', className = '' }) => {
  return React.createElement(as, { className: `relative inline-block ${className}` }, [
    <span key="main" className="relative z-10">{text}</span>,
    <span key="g1" className="absolute top-0 left-0 -ml-[1px] text-[#FF4D00] opacity-70 animate-pulse hidden group-hover:block">{text}</span>
    // Simplified glitch effect for performance/conciseness
  ]);
};

const MetricCard = ({ label, value, unit, trend, icon: Icon }) => (
  <div className="bg-[#121417] border border-[#B87333]/30 p-3 relative overflow-hidden group hover:border-[#00F5FF]/50 transition-colors">
    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
      <Icon size={16} className="text-[#00F5FF]" />
    </div>
    <div className="text-[#B87333] text-[10px] uppercase tracking-widest font-bold mb-1 font-serif">{label}</div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-mono text-[#E0E0E0]">{value}</span>
      <span className="text-xs text-[#00F5FF] mb-1 font-mono">{unit}</span>
    </div>
    {trend && (
      <div className="mt-2 h-1 w-full bg-[#2D2F33] overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#B87333] to-[#00F5FF] animate-pulse" 
          style={{ width: `${trend}%` }}
        />
      </div>
    )}
  </div>
);

const TerminalLine = ({ log }) => {
  const color = log.level === 'CRITICAL' ? 'text-[#FF4D00]' : log.level === 'WARN' ? 'text-[#B87333]' : 'text-[#00F5FF]';
  return (
    <div className="font-mono text-xs py-0.5 flex gap-2 border-b border-[#2D2F33] hover:bg-[#2D2F33]/50">
      <span className="text-[#555] select-none">[{new Date(log.ts).toLocaleTimeString()}]</span>
      <span className={`font-bold w-24 shrink-0 ${color}`}>{log.source}</span>
      <span className="text-[#A0A0A0]">{log.msg}</span>
    </div>
  );
};

// --- Isometric Agent Visualization ---

const IsometricMap = ({ agents, selectedId, onSelect }) => {
  // Simple 4x4 grid representation
  const gridSize = 4;
  const tiles = Array.from({ length: gridSize * gridSize });

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-[#0a0b0d] overflow-hidden border border-[#B87333]/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
      {/* Background Grid Effects */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(#00F5FF 1px, transparent 1px), linear-gradient(90deg, #00F5FF 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />
      
      {/* Isometric Container */}
      <div className="relative transform-style-3d rotate-x-60 rotate-z-45 duration-500 ease-out" 
           style={{ transform: 'perspective(1000px) rotateX(60deg) rotateZ(-45deg)' }}>
        
        {/* Grid Layer */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-[#2D2F33]/20 border-4 border-[#B87333]/20 shadow-2xl backdrop-blur-sm">
          {tiles.map((_, i) => (
            <div key={i} className="w-16 h-16 border border-[#00F5FF]/10 bg-[#121417]/80 relative group hover:border-[#00F5FF]/40 transition-colors">
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-30">
                 <div className="w-8 h-8 border border-[#B87333] rounded-full" />
               </div>
            </div>
          ))}
        </div>

        {/* Agents Layer (Floating above) */}
        {agents.map((agent, i) => {
          // Calculate grid position (mock logic based on ID or index)
          const col = i % gridSize;
          const row = Math.floor(i / gridSize);
          const x = col * 80 + 32; // 64px width + 16px gap
          const y = row * 80 + 32;
          const isSelected = selectedId === agent.id;

          return (
            <div
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className="absolute transition-all duration-1000 ease-in-out cursor-pointer"
              style={{ 
                left: `${x}px`, 
                top: `${y}px`,
                transform: `translate3d(0, 0, ${isSelected ? '40px' : '10px'})`,
                zIndex: isSelected ? 50 : 10
              }}
            >
              {/* The "Monolith" Agent Representation */}
              <div className="relative w-12 h-12">
                {/* Shadow */}
                <div className="absolute -bottom-8 left-0 w-full h-full bg-black/60 blur-md transform scale-y-50 rotate-45" />
                
                {/* Body - Reverse rotate to face camera */}
                <div 
                  className={`
                    w-full h-full border-2 
                    ${agent.status === 'ERROR' ? 'border-[#FF4D00] bg-[#FF4D00]/10' : isSelected ? 'border-[#00F5FF] bg-[#00F5FF]/20' : 'border-[#B87333] bg-[#121417]'}
                    backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.2)]
                  `}
                  style={{ transform: 'rotateZ(45deg) rotateX(-60deg)' }}
                >
                  <Hexagon size={20} className={`${agent.status === 'BUSY' ? 'animate-spin-slow' : ''} ${agent.status === 'ERROR' ? 'text-[#FF4D00]' : 'text-[#E0E0E0]'}`} />
                  
                  {/* Status Indicator */}
                  <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-sm ${agent.status === 'IDLE' ? 'bg-green-500' : 'bg-[#FF4D00]'} shadow-lg`} />
                </div>
                
                {/* Connection Line */}
                {isSelected && (
                  <div className="absolute top-1/2 left-1/2 w-[200px] h-[2px] bg-gradient-to-r from-[#00F5FF] to-transparent origin-left transform -rotate-45 pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Application ---

export default function SwarmSatelliteControl() {
  // State
  const [environment, setEnvironment] = useState('LOCAL'); // LOCAL | CODESPACE
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [activeProvider, setActiveProvider] = useState(MOCK_PROVIDERS[0]);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTED');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Refs for scrolling logs
  const terminalEndRef = useRef(null);

  // Initialize Environment & Agents
  useEffect(() => {
    // Detect environment (Mock logic)
    const isCodespace = window.location.hostname.includes('github.dev');
    setEnvironment(isCodespace ? 'CODESPACE' : 'LOCAL');

    // Generate initial agents
    const initialAgents = Array.from({ length: 6 }).map((_, i) => ({
      id: `agent-${i}`,
      name: `Sentinel-${i < 10 ? '0' + i : i}`,
      status: i === 0 ? 'BUSY' : i === 3 ? 'ERROR' : 'IDLE',
      task: i === 0 ? 'Vector Embedding' : 'Standby',
      cpu: Math.floor(Math.random() * 30),
      mem: Math.floor(Math.random() * 40 + 20),
    }));
    setAgents(initialAgents);
    setSelectedAgentId(initialAgents[0].id);

    // Initial log
    addLog('SYSTEM', 'INFO', `Environment Detected: ${isCodespace ? 'GitHub Codespaces' : 'Local Host'}`);
  }, []);

  // Telemetry Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Update Agent Metrics
      setAgents(prev => prev.map(a => ({
        ...a,
        cpu: a.status === 'BUSY' ? Math.min(100, a.cpu + Math.random() * 10 - 2) : Math.max(0, a.cpu + Math.random() * 5 - 3),
        mem: a.status === 'BUSY' ? Math.min(100, a.mem + 1) : a.mem,
        status: Math.random() > 0.95 ? (a.status === 'IDLE' ? 'BUSY' : 'IDLE') : a.status
      })));

      // Random Logs
      if (Math.random() > 0.7) {
        const sources = ['INF_GATEWAY', 'SWARM_ORCH', 'SEC_RUNTIME'];
        const msgs = ['Token limit approach', 'Heap allocation delta', 'Handshake renewed', 'Garbage collection trigger'];
        addLog(sources[Math.floor(Math.random() * sources.length)], 'INFO', msgs[Math.floor(Math.random() * msgs.length)]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (source, level, msg) => {
    setLogs(prev => [...prev.slice(-49), { id: Date.now(), source, level, msg, ts: Date.now() }]);
  };

  const handleProviderChange = (provider) => {
    addLog('INF_GATEWAY', 'WARN', `Hot-swapping provider to: ${provider.name}`);
    setTimeout(() => {
        setActiveProvider(provider);
        addLog('INF_GATEWAY', 'INFO', `Provider active: ${provider.name}`);
    }, 800);
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  return (
    <div className="min-h-screen bg-[#121417] text-[#E0E0E0] font-mono overflow-hidden flex flex-col selection:bg-[#00F5FF] selection:text-black">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=JetBrains+Mono:wght@300;400;700&display=swap');
          .font-cinzel { font-family: 'Cinzel Decorative', cursive; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          .scanline::after {
            content: " ";
            display: block;
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 2;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
          }
        `}
      </style>

      {/* --- HEADER --- */}
      <header className="h-14 border-b border-[#B87333] bg-[#0d0e11] flex items-center justify-between px-6 relative z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="p-1.5 border border-[#00F5FF] rotate-45">
            <div className="w-2 h-2 bg-[#00F5FF] -rotate-45" />
          </div>
          <h1 className="text-xl font-cinzel text-[#00F5FF] tracking-wider">
            <span className="text-[#B87333]">AETHER</span> CORE // ORCHESTRATOR
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-[#B87333] border border-[#B87333]/30 px-3 py-1 rounded-sm bg-[#121417]">
             <Globe size={14} />
             <span className="font-bold">{environment} MODE</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-[#00F5FF] shadow-[0_0_8px_#00F5FF]' : 'bg-red-500'}`} />
            <span className="text-[#555] tracking-widest">RUST_BACKEND::{connectionStatus}</span>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT GRID --- */}
      <main className="flex-1 flex relative overflow-hidden scanline">
        
        {/* --- LEFT: Agent Control --- */}
        <aside className={`${isSidebarOpen ? 'w-80' : 'w-12'} transition-all duration-300 border-r border-[#B87333]/50 bg-[#0F1114] flex flex-col relative z-40`}>
          <div className="p-4 border-b border-[#2D2F33] flex justify-between items-center bg-[#181a1e]">
            {isSidebarOpen && <h2 className="text-sm text-[#00F5FF] font-bold flex items-center gap-2"><Layers size={16}/> ACTIVE SWARM</h2>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[#B87333] hover:text-[#00F5FF]">
              {isSidebarOpen ? <ChevronRight className="rotate-180" size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
          
          {isSidebarOpen && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {agents.map(agent => (
                 <div 
                   key={agent.id} 
                   onClick={() => setSelectedAgentId(agent.id)}
                   className={`
                     p-3 border cursor-pointer transition-all relative overflow-hidden group
                     ${selectedAgentId === agent.id 
                        ? 'border-[#00F5FF] bg-[#00F5FF]/5' 
                        : 'border-[#2D2F33] hover:border-[#B87333] bg-[#121417]'}
                   `}
                 >
                   <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm tracking-wide">{agent.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 border ${agent.status === 'ERROR' ? 'border-red-500 text-red-500' : 'border-green-900 text-green-500'}`}>
                        {agent.status}
                      </span>
                   </div>
                   <div className="space-y-1">
                      <div className="flex justify-between text-xs text-[#777]">
                        <span>TASK</span>
                        <span className="text-[#B87333]">{agent.task}</span>
                      </div>
                      <div className="w-full bg-[#2D2F33] h-1 mt-2">
                        <div className="bg-[#00F5FF] h-1 transition-all duration-500" style={{ width: `${agent.cpu}%`}} />
                      </div>
                   </div>
                   {/* Decorative corner */}
                   <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#B87333] opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               ))}
            </div>
          )}
          
          {/* Sidebar Footer Stats */}
          {isSidebarOpen && (
             <div className="p-4 border-t border-[#B87333]/30 bg-[#121417]">
               <div className="flex justify-between text-xs mb-1">
                 <span className="text-[#555]">Total Agents</span>
                 <span className="text-[#00F5FF]">{agents.length}</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-[#555]">Swarm Load</span>
                 <span className="text-[#FF4D00]">42%</span>
               </div>
             </div>
          )}
        </aside>

        {/* --- CENTER: Viewport & Terminals --- */}
        <section className="flex-1 flex flex-col relative bg-[#0a0b0d]">
          
          {/* Overlay Graphics */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <h3 className="text-[#B87333] text-4xl font-cinzel opacity-20">SECTOR 7</h3>
          </div>

          {/* Isometric Viewport */}
          <div className="flex-1 relative">
            <IsometricMap agents={agents} selectedId={selectedAgentId} onSelect={setSelectedAgentId} />
            
            {/* Context Stats Overlay */}
            {selectedAgent && (
              <div className="absolute top-4 right-4 w-64 bg-[#121417]/90 border border-[#00F5FF]/30 p-4 backdrop-blur-md shadow-xl z-20">
                <h4 className="text-[#00F5FF] font-bold text-sm mb-2 border-b border-[#2D2F33] pb-1 flex items-center gap-2">
                  <Cpu size={14}/> {selectedAgent.name} METRICS
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <div className="text-[10px] text-[#777]">CPU USAGE</div>
                    <div className="text-xl font-mono">{selectedAgent.cpu.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#777]">MEMORY</div>
                    <div className="text-xl font-mono">{selectedAgent.mem}MB</div>
                  </div>
                  <div className="col-span-2">
                     <div className="text-[10px] text-[#777]">RUNTIME ID</div>
                     <div className="text-xs font-mono text-[#B87333] truncate">{selectedAgent.id}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel: Terminal Multiplexer */}
          <div className="h-64 border-t border-[#B87333] bg-[#0F1114] flex">
            
            {/* Terminal Window 1: System Logs */}
            <div className="flex-1 border-r border-[#2D2F33] flex flex-col">
              <div className="bg-[#181a1e] px-3 py-1 flex justify-between items-center border-b border-[#2D2F33]">
                <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                  <Terminal size={12} /> 
                  <span>SYSTEM_STREAM</span>
                </div>
                <div className="flex gap-1">
                   <div className="w-2 h-2 rounded-full bg-[#2D2F33]" />
                   <div className="w-2 h-2 rounded-full bg-[#2D2F33]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-xs scrollbar-hide">
                {logs.map((log) => <TerminalLine key={log.id} log={log} />)}
                <div ref={terminalEndRef} />
              </div>
              <div className="p-2 border-t border-[#2D2F33] bg-[#121417]">
                <div className="flex items-center gap-2 text-[#00F5FF]">
                  <ChevronRight size={14} />
                  <input 
                    type="text" 
                    placeholder="Enter command..." 
                    className="bg-transparent border-none outline-none text-xs flex-1 text-[#E0E0E0] placeholder-[#333]"
                  />
                </div>
              </div>
            </div>

            {/* Terminal Window 2: Inference Gateway */}
            <div className="w-1/3 flex flex-col bg-[#121417]">
               <div className="bg-[#181a1e] px-3 py-1 border-b border-[#B87333]/30 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-xs text-[#B87333] font-bold">
                   <Zap size={12} /> INFERENCE_GATEWAY
                 </div>
                 <Lock size={12} className="text-[#00F5FF]" />
               </div>
               
               <div className="p-4 flex-1 flex flex-col gap-4">
                 {/* Provider Selector */}
                 <div>
                   <label className="text-[10px] text-[#555] uppercase tracking-wider mb-1 block">Active Neural Provider</label>
                   <div className="grid grid-cols-1 gap-2">
                     {MOCK_PROVIDERS.map(p => (
                       <button
                         key={p.id}
                         onClick={() => handleProviderChange(p)}
                         className={`
                           flex items-center justify-between p-2 text-xs border transition-all
                           ${activeProvider.id === p.id 
                             ? 'border-[#00F5FF] bg-[#00F5FF]/10 text-white shadow-[inset_0_0_10px_rgba(0,245,255,0.1)]' 
                             : 'border-[#2D2F33] text-[#777] hover:border-[#B87333]'}
                         `}
                       >
                         <span>{p.name}</span>
                         {activeProvider.id === p.id && <Radio size={12} className="text-[#00F5FF] animate-pulse"/>}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Usage Metrics */}
                 <div className="grid grid-cols-2 gap-2 mt-auto">
                    <MetricCard label="Latency" value={activeProvider.latency} unit="" icon={Activity} trend={30} />
                    <MetricCard label="Tokens/s" value="482" unit="tps" icon={Code} trend={75} />
                 </div>
               </div>
            </div>

          </div>
        </section>
      </main>
      
      {/* Decorative Footer Bar */}
      <footer className="h-6 bg-[#0d0e11] border-t border-[#2D2F33] flex items-center px-4 text-[10px] text-[#444] justify-between z-50">
        <div className="flex gap-4">
           <span>VER: 2.4.0-alpha</span>
           <span>MEM: 128MB / 4GB</span>
        </div>
        <div className="flex gap-4 uppercase tracking-widest text-[#B87333]">
           <span>Secured by Rust Runtime</span>
           <span>Oxidized Protocol</span>
        </div>
      </footer>
    </div>
  );
}
```
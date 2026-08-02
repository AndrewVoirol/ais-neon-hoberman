import React, { useState } from 'react';
import { SphereConfig } from '../types';
import { generateSphereConfig } from '../services/gemini';

interface ControlsProps {
  onConfigChange: (config: SphereConfig) => void;
  currentConfig: SphereConfig;
}

export const Controls: React.FC<ControlsProps> = ({ onConfigChange, currentConfig }) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const isApiKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === "PLACEHOLDER_API_KEY";

  const handleRemix = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const newConfig = await generateSphereConfig(prompt);
    onConfigChange(newConfig);
    setLoading(false);
  };

  const suggestions = ["Cyberpunk Neon", "Deep Ocean", "Golden Luxury", "Radioactive Glitch"];

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <header className="pointer-events-auto flex justify-between items-start gap-4">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-2xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            NEON HOBERMAN
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Interactive Generative Sculpture</p>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-xl p-3 border border-white/10 shadow-2xl transition-all font-medium text-xs flex items-center gap-2"
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {isOpen ? 'Minimize Console' : 'Open Remix Engine'}
        </button>
      </header>

      {/* Control Panel */}
      <div className={`pointer-events-auto absolute bottom-6 right-6 left-6 md:left-auto md:w-96 transition-all duration-500 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-semibold text-lg">AI Remix Engine</h2>
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: currentConfig.primaryColor }}></div>
          </div>

          {/* Missing API Key warning alert */}
          {isApiKeyMissing && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg p-3 text-xs flex gap-2 items-start leading-normal">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-semibold block mb-0.5">API Key Missing</span>
                To use the AI Remix engine, configure <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono font-bold text-amber-300">VITE_GEMINI_API_KEY</code> in local <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono font-bold text-amber-300">.env.local</code>. Remixing will fall back to local defaults.
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Describe a vibe</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 'Volcanic eruption'"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm animate-pulse-once"
                  onKeyDown={(e) => e.key === 'Enter' && handleRemix()}
                />
                <button
                  onClick={handleRemix}
                  disabled={loading || !prompt}
                  className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-lg shadow-purple-500/20"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-xs text-gray-400">
               <div>
                 <span className="block text-gray-500">Expansion</span>
                 <span className="text-white font-mono">{currentConfig.expansionSpeed.toFixed(1)}x</span>
               </div>
               <div>
                 <span className="block text-gray-500">Bloom</span>
                 <span className="text-white font-mono">{(currentConfig.bloomIntensity * 100).toFixed(0)}%</span>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Instructions */}
      <div className="absolute bottom-6 left-6 pointer-events-none hidden sm:block">
          <p className="text-white/30 text-xs font-mono">
             HOVER TO EXPAND <br/>
             DRAG TO ROTATE <br/>
             SCROLL TO ZOOM
          </p>
      </div>

    </div>
  );
};

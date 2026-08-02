import React, { useState } from 'react';
import { Experience } from './components/Experience';
import { Controls } from './components/Controls';
import { SphereConfig, DEFAULT_CONFIG } from './types';

function App() {
  const [config, setConfig] = useState<SphereConfig>(DEFAULT_CONFIG);

  return (
    <div className="relative w-full h-full bg-neutral-900">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Experience config={config} />
      </div>

      {/* UI Overlay Layer */}
      <Controls 
        currentConfig={config} 
        onConfigChange={setConfig} 
      />
    </div>
  );
}

export default App;

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { SphereConfig } from '../types';
import { HobermanObject } from './HobermanObject';
import * as THREE from 'three';

interface ExperienceProps {
  config: SphereConfig;
}

const BackgroundColor: React.FC<{ color: string }> = ({ color }) => {
    // Smooth background color transition
    useFrame((state) => {
       state.scene.background = new THREE.Color(color); 
    });
    return null;
}

export const Experience: React.FC<ExperienceProps> = ({ config }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]} // Optimize pixel ratio
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
    >
      <BackgroundColor color={config.backgroundColor} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color={config.secondaryColor} />
      
      {/* Dynamic Environment */}
      <Environment preset="city" />

      {/* Main Object */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <HobermanObject config={config} />
      </Float>

      {/* Particles/Atmosphere */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles 
        count={config.particleCount} 
        scale={10} 
        size={4} 
        speed={0.4} 
        opacity={0.5} 
        color={config.primaryColor} 
      />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.2} 
            mipmapBlur 
            intensity={config.bloomIntensity} 
            radius={0.5} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      <OrbitControls makeDefault enablePan={false} maxDistance={15} minDistance={3} />
    </Canvas>
  );
};

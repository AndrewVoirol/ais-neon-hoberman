import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SphereConfig } from '../types';
import { Instance, Instances } from '@react-three/drei';

interface HobermanObjectProps {
  config: SphereConfig;
}

// Simple spring animation logic hook
const useSpringScale = (target: number, tension = 0.1, friction = 0.8) => {
  const value = useRef(target);
  const velocity = useRef(0);
  
  useFrame(() => {
    const dist = target - value.current;
    const accel = dist * tension;
    velocity.current += accel;
    velocity.current *= friction;
    value.current += velocity.current;
  });

  return value;
};

interface AtomProps {
  position: THREE.Vector3;
  isExploded: boolean;
  onClick: (e: any) => void;
  color: string;
  metalness: number;
  roughness: number;
}

// Individual Atom Component
const Atom: React.FC<AtomProps> = ({ 
  position, 
  isExploded, 
  onClick, 
  color,
  metalness,
  roughness 
}) => {
  const ref = useRef<any>(null);
  
  // Spring physics for "Cool Healing" bounce
  // Target 0 when exploded, 1 when normal.
  const scaleRef = useSpringScale(isExploded ? 0.001 : 1, 0.15, 0.75);

  useFrame(() => {
    if (ref.current) {
      ref.current.scale.setScalar(scaleRef.current);
    }
  });

  return (
    <Instance 
      ref={ref} 
      position={position} 
      onClick={onClick}
      color={color}
    />
  );
};

interface StrutProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  isStartExploded: boolean;
  isEndExploded: boolean;
  primaryColor: string;
}

// Strut Component that reacts to connected atoms
const Strut: React.FC<StrutProps> = ({ 
  start, 
  end, 
  isStartExploded, 
  isEndExploded,
  primaryColor 
}) => {
  const ref = useRef<any>(null);
  
  // If either connected atom is exploded, shrink the strut
  const shouldHide = isStartExploded || isEndExploded;
  const scaleRef = useSpringScale(shouldHide ? 0.001 : 1, 0.1, 0.8);

  // Static math for positioning
  const { position, quaternion, length } = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    return { position: mid, quaternion: quat, length: dist };
  }, [start, end]);

  useFrame(() => {
    if (ref.current) {
      // Scale y is length, x/z is thickness
      // We modify thickness based on health
      const s = scaleRef.current;
      ref.current.scale.set(s, length * s, s); // Shrink length and thickness
    }
  });

  return (
    <Instance 
      ref={ref}
      position={position} 
      quaternion={quaternion}
      color={primaryColor}
    />
  );
};

interface ExplosionProps {
  position: THREE.Vector3;
  color: string;
}

// Particle Explosion Effect
const Explosion: React.FC<ExplosionProps> = ({ position, color }) => {
  const group = useRef<THREE.Group>(null);
  const [particles] = useState(() => 
    new Array(8).fill(0).map(() => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2, 
        (Math.random() - 0.5) * 2, 
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(Math.random() * 0.2 + 0.1),
      scale: Math.random() * 0.5 + 0.5
    }))
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const p = particles[i];
      child.position.add(p.velocity);
      child.scale.multiplyScalar(0.9); // Fade out
      child.rotation.x += p.velocity.x;
      child.rotation.y += p.velocity.y;
    });
  });

  // Self-destroy logic handled by parent via key/timer usually, 
  // but for visual simplicity we just let them shrink to invisibility.
  return (
    <group ref={group} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
           <boxGeometry args={[0.1, 0.1, 0.1]} />
           <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export const HobermanObject: React.FC<HobermanObjectProps> = ({ config }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [explodedIndices, setExplodedIndices] = useState<Set<number>>(new Set());
  const [explosions, setExplosions] = useState<{id: number, position: THREE.Vector3}[]>([]);
  const timeoutsRef = useRef<any[]>([]);

  // Cleanup timeouts on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(t => window.clearTimeout(t));
    };
  }, []);

  // Geometry Generation: Build a Graph (Nodes + Indices)
  const { nodes, edges } = useMemo(() => {
    const geom = new THREE.DodecahedronGeometry(1.5, 0); 
    const posAttribute = geom.attributes.position;
    
    // 1. Extract Unique Vertices
    const uniqueVertices: THREE.Vector3[] = [];
    const threshold = 0.01;
    
    for (let i = 0; i < posAttribute.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(posAttribute, i);
      if (!uniqueVertices.some(uv => uv.distanceTo(v) < threshold)) {
        uniqueVertices.push(v);
      }
    }

    // 2. Extract Edges with Indices
    // We iterate the wireframe and find which unique vertex index corresponds to the endpoints
    const wireframe = new THREE.WireframeGeometry(geom);
    const linePos = wireframe.attributes.position;
    const edgeIndices: [number, number][] = [];

    const getIndex = (v: THREE.Vector3) => uniqueVertices.findIndex(uv => uv.distanceTo(v) < threshold);

    for (let i = 0; i < linePos.count; i += 2) {
      const v1 = new THREE.Vector3().fromBufferAttribute(linePos, i);
      const v2 = new THREE.Vector3().fromBufferAttribute(linePos, i + 1);
      
      const idx1 = getIndex(v1);
      const idx2 = getIndex(v2);

      if (idx1 !== -1 && idx2 !== -1 && idx1 !== idx2) {
        // Avoid duplicate edges (optional but good)
        // Check if [idx1, idx2] or [idx2, idx1] exists
        const exists = edgeIndices.some(([a, b]) => (a === idx1 && b === idx2) || (a === idx2 && b === idx1));
        if (!exists) edgeIndices.push([idx1, idx2]);
      }
    }

    // Properly dispose of THREE structures to prevent memory leaks
    wireframe.dispose();
    geom.dispose();

    return { nodes: uniqueVertices, edges: edgeIndices };
  }, []);

  const handleAtomClick = (index: number, position: THREE.Vector3, e: any) => {
    e.stopPropagation();
    if (explodedIndices.has(index)) return;

    // Trigger Explosion
    const newSet = new Set(explodedIndices);
    newSet.add(index);
    setExplodedIndices(newSet);

    // Add visual effect
    const explosionId = Date.now() + Math.random();
    setExplosions(prev => [...prev, { id: explosionId, position: position.clone() }]);
    
    // Cleanup Explosion Visual
    const t1 = window.setTimeout(() => {
        setExplosions(prev => prev.filter(ex => ex.id !== explosionId));
    }, 1000);

    // Heal Logic (Auto-restore)
    const t2 = window.setTimeout(() => {
      setExplodedIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, 2500);

    timeoutsRef.current.push(t1, t2);
  };

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Smooth Breathing
    const baseBreathing = Math.sin(t * config.expansionSpeed) * 0.2 + 1; 
    
    // Hover Expansion Logic (Smooth)
    // We use a target value instead of direct setting to smooth out jitter if it were to occur
    const targetScale = hovered ? 1.5 : baseBreathing;
    
    // Using simple lerp for the whole group scale
    const currentScale = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05);
    
    groupRef.current.scale.setScalar(currentScale);
    groupRef.current.rotation.y += 0.002;
    groupRef.current.rotation.z += 0.001;
  });

  return (
    <group ref={groupRef}>
      {/* 
        Hit Volume: 
        An invisible sphere that handles hover events.
        This fixes the "glitch" where mouse-over flickers when passing between struts.
      */}
      <mesh visible={false} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
         <icosahedronGeometry args={[1.7, 1]} /> 
         {/* Using transparent material ensures it's raycastable but invisible */}
         <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Explosion Effects */}
      {explosions.map(ex => (
        <Explosion key={ex.id} position={ex.position} color={config.secondaryColor} />
      ))}

      {/* Joints (Atoms) */}
      <Instances range={nodes.length}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial 
            emissive={config.secondaryColor}
            emissiveIntensity={2}
            metalness={config.metalness} 
            roughness={config.roughness} 
            toneMapped={false}
        />
        {nodes.map((v, i) => (
          <Atom 
            key={i} 
            position={v} 
            color={config.secondaryColor}
            metalness={config.metalness}
            roughness={config.roughness}
            isExploded={explodedIndices.has(i)}
            onClick={(e) => handleAtomClick(i, v, e)}
          />
        ))}
      </Instances>

      {/* Struts (Edges) */}
      <Instances range={edges.length}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial 
            emissive={config.primaryColor}
            emissiveIntensity={1}
            metalness={config.metalness} 
            roughness={config.roughness} 
            toneMapped={false}
        />
        {edges.map(([startIdx, endIdx], i) => (
            <Strut 
                key={`edge-${i}`}
                start={nodes[startIdx]}
                end={nodes[endIdx]}
                isStartExploded={explodedIndices.has(startIdx)}
                isEndExploded={explodedIndices.has(endIdx)}
                primaryColor={config.primaryColor}
            />
        ))}
      </Instances>
    </group>
  );
};
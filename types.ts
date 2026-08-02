export interface SphereConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  metalness: number;
  roughness: number;
  expansionSpeed: number;
  particleCount: number;
  bloomIntensity: number;
}

export const DEFAULT_CONFIG: SphereConfig = {
  primaryColor: "#00ff88",
  secondaryColor: "#ff0088",
  backgroundColor: "#050505",
  metalness: 0.8,
  roughness: 0.2,
  expansionSpeed: 1.0,
  particleCount: 100,
  bloomIntensity: 1.5,
};

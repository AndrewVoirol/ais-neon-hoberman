import { GoogleGenAI, Type } from "@google/genai";
import { SphereConfig, DEFAULT_CONFIG } from "../types";

const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const apiKey = rawApiKey === "PLACEHOLDER_API_KEY" ? "" : rawApiKey;
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });

export const generateSphereConfig = async (mood: string): Promise<SphereConfig> => {
  if (!apiKey) {
    console.warn("No valid API Key provided (using PLACEHOLDER_API_KEY), returning default config.");
    return DEFAULT_CONFIG;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a creative JSON configuration for a 3D Hoberman sphere visualizer based on the mood/theme: "${mood}".
      
      The colors should be vibrant hex codes. 
      'metalness' and 'roughness' are 0.0 to 1.0.
      'expansionSpeed' is 0.5 to 3.0.
      'particleCount' is 50 to 300.
      'bloomIntensity' is 0.5 to 3.0.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryColor: { type: Type.STRING, description: "Main neon color hex" },
            secondaryColor: { type: Type.STRING, description: "Accent neon color hex" },
            backgroundColor: { type: Type.STRING, description: "Dark background color hex" },
            metalness: { type: Type.NUMBER },
            roughness: { type: Type.NUMBER },
            expansionSpeed: { type: Type.NUMBER },
            particleCount: { type: Type.INTEGER },
            bloomIntensity: { type: Type.NUMBER },
          },
          required: ["primaryColor", "secondaryColor", "backgroundColor", "metalness", "roughness", "expansionSpeed", "particleCount", "bloomIntensity"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as SphereConfig;
  } catch (error) {
    console.error("Failed to generate config:", error);
    return DEFAULT_CONFIG;
  }
};

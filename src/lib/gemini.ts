import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DecisionAnalysis {
  pros: string[];
  cons: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  comparison?: {
    headers: string[];
    rows: string[][];
  };
  recommendation: string;
  summary: string;
}

export async function analyzeDecision(prompt: string): Promise<DecisionAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `Analyze the following decision: "${prompt}". 
    Provide a detailed breakdown including pros, cons, a SWOT analysis, and a comparison table if applicable.
    Return the result in a structured format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"],
          },
          comparison: {
            type: Type.OBJECT,
            properties: {
              headers: { type: Type.ARRAY, items: { type: Type.STRING } },
              rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
            },
          },
          recommendation: { type: Type.STRING },
          summary: { type: Type.STRING },
        },
        required: ["pros", "cons", "swot", "recommendation", "summary"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to get analysis from AI");
  }

  return JSON.parse(response.text);
}

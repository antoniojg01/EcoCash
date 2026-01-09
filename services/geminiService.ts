
import { GoogleGenAI, Type } from "@google/genai";

// O Vite injetará process.env.API_KEY conforme configurado no vite.config.ts
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const estimateWeightAndValue = async (description: string, type: string) => {
  const prompt = `Estime o peso em KG para a seguinte descrição de material reciclável: "${description}" do tipo "${type}". 
  Responda apenas com o objeto JSON contendo 'estimatedWeight' (número) e 'justification' (string curta).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedWeight: { type: Type.NUMBER },
            justification: { type: Type.STRING }
          },
          required: ["estimatedWeight", "justification"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta do Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { estimatedWeight: 1, justification: "Estimativa padrão." };
  }
};

export const getSmartRoutes = async (locations: any[]) => {
  return { order: locations.map((_, i) => i), totalTime: "1h", totalEarnings: 0 };
};

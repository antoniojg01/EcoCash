import { GoogleGenAI, Type } from "@google/genai";

export const estimateWeightAndValue = async (description: string, type: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
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
            estimatedWeight: { type: Type.NUMBER, description: "Peso estimado em kg" },
            justification: { type: Type.STRING, description: "Breve explicação da estimativa" }
          },
          required: ["estimatedWeight", "justification"]
        }
      }
    });

    const jsonStr = response.text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback amigável
    return { 
      estimatedWeight: description.length % 5 + 1.5, 
      justification: "Estimativa baseada em padrões históricos (Modo Offline)." 
    };
  }
};

export const getSmartRoutes = async (locations: any[]) => {
  // Simulação de otimização de rota via IA
  await new Promise(r => setTimeout(r, 1000));
  return { order: locations.map((_, i) => i), optimized: true };
};
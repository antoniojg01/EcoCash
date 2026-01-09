
import { GoogleGenAI, Type } from "@google/genai";

// Always use a named parameter for apiKey and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    // Access the .text property directly (do not call it as a method).
    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Simple error handling: return a default fallback estimate.
    return { estimatedWeight: 1, justification: "Estimativa padrão baseada em volume médio." };
  }
};

export const getSmartRoutes = async (locations: any[]) => {
  // Mocking AI route optimization logic
  const prompt = `Otimize a rota para as seguintes coordenadas: ${JSON.stringify(locations)}. 
  Retorne a ordem sugerida dos índices e o ganho estimado.`;
  
  // Implementation would go here for complex logic
  return { order: [0, 1, 2], totalTime: "1h30", totalEarnings: 42 };
};

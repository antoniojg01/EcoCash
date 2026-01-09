import { GoogleGenAI, Type } from "@google/genai";

// Inicializa com segurança para evitar "process is not defined" no navegador
const getApiKey = () => {
  try {
    // Tenta diferentes formas de acesso dependendo do ambiente de build
    // @ts-ignore
    const key = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || 
                // @ts-ignore
                (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) ||
                "";
    return key;
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();

export const estimateWeightAndValue = async (description: string, type: string) => {
  if (!apiKey) {
    console.warn("API_KEY não configurada. Usando valores padrão simulados.");
    return { estimatedWeight: 2.5, justification: "Modo offline (Sem API Key)." };
  }

  const ai = new GoogleGenAI({ apiKey });

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
    return { estimatedWeight: 1, justification: "Erro na estimativa inteligente." };
  }
};

export const getSmartRoutes = async (locations: any[]) => {
  return { order: locations.map((_, i) => i), totalTime: "1h", totalEarnings: 0 };
};
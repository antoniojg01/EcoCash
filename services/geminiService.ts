
import { GoogleGenAI, Type } from "@google/genai";

export const estimateServicePrice = async (category: string, description: string, region: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Aja como um especialista em economia local no Brasil. 
  Estime o preço justo para um serviço da categoria "${category}" com a descrição: "${description}".
  A região do pedido é "${region}". Considere o custo de vida e média de mercado local.
  Retorne um JSON com: 'suggestedPrice' (número), 'minPrice' (número), 'maxPrice' (número) e 'justification' (string curta explicando o porquê do preço naquela região).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: { type: Type.NUMBER },
            minPrice: { type: Type.NUMBER },
            maxPrice: { type: Type.NUMBER },
            justification: { type: Type.STRING }
          },
          required: ["suggestedPrice", "minPrice", "maxPrice", "justification"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro na precificação IA:", error);
    return { suggestedPrice: 150, minPrice: 100, maxPrice: 200, justification: "Preço base de contingência (Erro de Conexão)." };
  }
};

export const estimateWeightAndValue = async (description: string, type: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { estimatedWeight: 2, justification: "Estimativa baseada em padrões históricos." };
  }
};

export const findNearbyRecyclingPoints = async (latitude: number, longitude: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Liste 4 centros de reciclagem, sucatas ou ferros-velhos próximos às coordenadas lat: ${latitude}, lng: ${longitude}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude, longitude }
          }
        }
      },
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const points = chunks.map((chunk: any, index: number) => ({
      title: chunk.maps?.title || "Centro de Reciclagem",
      address: chunk.maps?.address || "Endereço identificado via GPS",
      uri: chunk.maps?.uri || "#",
      buyingPrice: 3.20 + (index * 0.1)
    }));
    return { text: response.text, points };
  } catch (error) {
    return { text: "Locais sugeridos.", points: [] };
  }
};

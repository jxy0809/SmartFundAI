
import { GoogleGenAI, Type } from "@google/genai";
import { FundHolding, FundRecommendation } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Searches for a fund's details using Google Search Grounding.
 */
export const searchFundDetails = async (query: string): Promise<{ name: string; code: string; nav: number; date: string } | null> => {
  try {
    const prompt = `
      Find the latest Net Asset Value (NAV/单位净值) for the Chinese mutual fund: "${query}".
      If the user provided a code, verify the name. If the user provided a name, find the code.
      Return the data in JSON format with keys: code, name, nav (number), and date (YYYY-MM-DD).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            name: { type: Type.STRING },
            nav: { type: Type.NUMBER },
            date: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error searching fund:", error);
    return null;
  }
};

/**
 * Updates prices for a list of funds using AI batch processing with Search.
 */
export const updateFundPrices = async (holdings: FundHolding[]): Promise<FundHolding[]> => {
  if (holdings.length === 0) return [];

  const codes = holdings.map(h => `${h.code} (${h.name})`).join(', ');
  
  const prompt = `
    Find the latest Net Asset Value (单位净值) for these Chinese funds: ${codes}.
    Return a JSON array where each object contains: "code" (string) and "nav" (number).
    Ensure the nav is the most recent available from the search results.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              nav: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    const results: { code: string; nav: number }[] = JSON.parse(response.text || "[]");
    const dateStr = new Date().toISOString();

    return holdings.map(h => {
      const found = results.find(r => r.code === h.code || h.code.includes(r.code)); // Loose match on code
      if (found && found.nav > 0) {
        return { ...h, currentNav: found.nav, lastUpdate: dateStr };
      }
      return h;
    });

  } catch (error) {
    console.error("Error updating prices:", error);
    throw error;
  }
};

/**
 * Screen funds based on criteria
 */
export const screenFunds = async (criteria: {
  type: string;
  risk: string;
  minReturn?: string;
  company?: string;
}): Promise<FundRecommendation[]> => {
  const prompt = `
    Recommend 5 Chinese mutual funds that match these criteria:
    - Type: ${criteria.type || 'Any'}
    - Risk Level: ${criteria.risk || 'Any'}
    - Fund Manager/Company: ${criteria.company || 'Any'}
    - Minimum 1-Year Return: ${criteria.minReturn || 'Any'}
    
    Use Google Search to find real, currently active funds.
    Return a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              returnRate1Y: { type: Type.STRING },
              risk: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Screening failed", error);
    return [];
  }
};

/**
 * Chat with the AI about the portfolio.
 */
export const chatWithPortfolio = async (
  history: { role: string; text: string }[],
  message: string,
  portfolio: FundHolding[]
) => {
  const portfolioContext = JSON.stringify(portfolio.map(h => ({
    name: h.name,
    code: h.code,
    cost: h.costPrice,
    shares: h.shares,
    current: h.currentNav
  })));

  const systemInstruction = `
    You are a professional financial advisor specializing in the Chinese mutual fund market.
    Current Portfolio Context: ${portfolioContext}
    
    1. If the user asks about specific funds in their portfolio, analyze the performance based on Cost vs Current NAV.
    2. If the user asks for recommendations, use the 'googleSearch' tool to find trending or high-performing funds relevant to their request.
    3. Always explain risks.
    4. Format money values in CNY.
    5. Use emojis to make the conversation engaging.
    6. Keep responses concise but informative.
  `;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      tools: [{ googleSearch: {} }], // Enable search for market news/analysis
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  const result = await chat.sendMessage({ message });
  
  // Extract search sources if available
  const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web?.uri).filter(Boolean) || [];
  
  return {
    text: result.text,
    sources
  };
};

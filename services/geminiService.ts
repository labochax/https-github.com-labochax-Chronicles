import { GoogleGenAI, Chat } from "@google/genai";
import { HistoricalEvent } from "../types";

const apiKey = process.env.API_KEY;

export const getEventSummary = async (event: HistoricalEvent): Promise<string> => {
  if (!apiKey) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`(AI Simulated Response) This is a concise summary about ${event.title} happening in ${event.yearDisplay}. It was a pivotal moment in history that influenced subsequent events in the ${event.tags.join(', ')} sector.`);
        }, 1500);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a captivating, 2-sentence historical summary of the event "${event.title}" which took place in ${event.yearDisplay}. Focus on its global impact.`,
    });

    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate summary at this time.";
  }
};

// --- Chat Features ---

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const createEventChatSession = (event: HistoricalEvent): Chat | null => {
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are an expert historian specializing in the event: "${event.title}" (${event.yearDisplay}). 
            Context: ${event.description}. Tags: ${event.tags.join(', ')}.
            
            Your goal is to answer the user's questions about this specific event. 
            - Be engaging, educational, and accurate.
            - Keep answers concise (under 3 sentences) unless asked for detail.
            - If asked about unrelated topics, politely pivot back to ${event.title}.`,
        }
    });
};

export const sendEventChatMessage = async (session: Chat | null, message: string): Promise<string> => {
    if (!session || !apiKey) {
        // Mock response
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`(AI Simulated Chat) That is a great question about the ${message.includes('who') ? 'people involved' : 'details'}! As a simulated historian, I can tell you this event was significant.`);
            }, 1000);
        });
    }

    try {
        const response = await session.sendMessage({ message });
        return response.text || "I couldn't generate a response.";
    } catch (e) {
        console.error("Chat error", e);
        return "Sorry, I encountered an error answering that.";
    }
};

// --- Image Generation ---

export const generateEventImage = async (event: HistoricalEvent): Promise<string | null> => {
    if (!apiKey) {
         // Mock response
         return new Promise((resolve) => {
            setTimeout(() => {
                // Return a placeholder or the event's own image if mocking
                resolve(event.imageUrl || "https://picsum.photos/seed/mockai/512/512");
            }, 2000);
        });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Using the recommended model for general image generation
            contents: {
                parts: [{ text: `Historical illustration of ${event.title}, year ${event.yearDisplay}. ${event.description}. High quality, detailed, cinematic lighting, photorealistic or oil painting style.` }]
            },
        });

        // Extract image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
             }
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error", e);
        return null;
    }
};
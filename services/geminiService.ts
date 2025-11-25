import { GoogleGenAI, Type } from "@google/genai";
import { StoryData } from "../types";

const apiKey = process.env.API_KEY || ''; 

// Helper to ensure API key exists
const getAIClient = () => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates a didactic story based on user name and selected characters.
 */
export const generateStory = async (
  readerName: string,
  characterNames: string[]
): Promise<StoryData> => {
  const ai = getAIClient();
  
  const prompt = `
    Sen bir çocuk kitabı yazarısın. 
    "${readerName}" adında bir çocuk için kısa, öğretici ve eğlenceli bir hikaye yaz.
    Hikaye şu karakterleri içermelidir: ${characterNames.join(', ')}.
    Hikaye yaklaşık 200-250 kelime olmalıdır.
    Dil: Türkçe.
    Hikayenin bir ana teması olsun (örneğin: arkadaşlık, dürüstlük, paylaşmak).
    
    Ayrıca "${readerName}" ismine dayanarak çocuğun cinsiyetini tahmin et ('Kız' veya 'Erkek').
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          theme: { type: Type.STRING },
          gender: { type: Type.STRING, enum: ["Kız", "Erkek"] }
        },
        required: ["title", "content", "theme", "gender"]
      },
      // Safety settings to prevent blocking harmless children's stories
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    }
  });

  const text = response.text;
  if (!text) {
    console.error("Gemini API response missing text. Finish reason:", response.candidates?.[0]?.finishReason);
    throw new Error("No story generated");
  }
  
  return JSON.parse(text) as StoryData;
};

/**
 * Analyzes the audio recording to count words and provide feedback.
 */
export const analyzeReading = async (
  audioBlob: Blob
): Promise<{ wordCount: number; feedback: string }> => {
  const ai = getAIClient();

  // Convert Blob to Base64
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
  });
  reader.readAsDataURL(audioBlob);
  const base64Audio = await base64Promise;

  const prompt = `
    Bu ses kaydı, Türkçe okuma pratiği yapan bir çocuğa ait.
    Lütfen şunları yap:
    1. Okunan kelimeleri say (yaklaşık olarak).
    2. Okuma akıcılığı hakkında çocuğa motive edici, nazik bir geri bildirim ver (Türkçe).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/webm',
            data: base64Audio
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          wordCount: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Analysis failed");

  return JSON.parse(text);
};

/**
 * Generates a reward image (coloring page style).
 */
export const generateRewardImage = async (
  characters: string[],
  theme: string,
  gender: string
): Promise<string> => {
  const ai = getAIClient();

  const childDescription = gender === 'Kız' ? 'a cute little girl' : 'a cute little boy';

  const prompt = `
    A black and white coloring book page for children.
    Characters included: ${characters.join(', ')}.
    Also include ${childDescription} reading a book or playing with the characters.
    Theme: ${theme}.
    Style: Cute, simple outlines, no shading, white background, high contrast lines.
    Ensure the image is safe and suitable for children.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // Using Flash Image for fast generation
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    }
  });

  // Extract image from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
};
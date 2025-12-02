import { GoogleGenAI } from "@google/genai";
import { Workshop, GroundingChunk } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Get nearby workshops using Google Maps Grounding
export const getNearbyWorkshops = async (lat: number, lng: number): Promise<{ text: string, chunks: GroundingChunk[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find 3 highly-rated auto mechanic workshops near my location. For each, give me the name, a very brief summary of their specialty (e.g. European cars, Tires), and their rating.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    return {
      text: response.text || "No workshops found nearby.",
      chunks
    };
  } catch (error) {
    console.error("Error fetching workshops:", error);
    return { text: "Unable to fetch workshops at this time.", chunks: [] };
  }
};

// Identify a part from an image
export const identifyCarPart = async (base64Image: string, vehicleName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: `Identify this car part. I have a ${vehicleName}. 
            Provide:
            1. The name of the part.
            2. Estimated lifespan in km or years.
            3. A rough estimated price range for replacement (parts & labor).
            Keep it concise and formatted as a clear list.`
          }
        ]
      }
    });
    return response.text || "Could not identify the part.";
  } catch (error) {
    console.error("Error identifying part:", error);
    return "Error processing the image. Please try again.";
  }
};

// Get general care tips
export const getCareTips = async (vehicleName: string, mileage: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Give me 3 short, crucial maintenance tips for a ${vehicleName} with ${mileage}km on it. Be specific to this mileage milestone if possible. Format as bullet points.`,
    });
    return response.text || "Keep your car clean and check oil regularly.";
  } catch (error) {
    console.error("Error getting tips:", error);
    return "Check your owner's manual for specific maintenance schedules.";
  }
};
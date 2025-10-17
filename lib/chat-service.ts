interface ChatRequest {
  message: string;
  diseaseContext?: string;
  location?: string;
  recommendations?: string;
}

interface ChatResponse {
  reply: string;
  error?: string;
}

export class ChatService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    // Using Gemini API
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Build context for the LLM
      const systemContext = `You are an expert agricultural advisor helping farmers with crop diseases. 

Current Context:
- Disease Detected: ${request.diseaseContext || 'Not specified'}
- Farmer's Location: ${request.location || 'India'}
- Base Recommendations: ${request.recommendations || 'None provided'}

Provide practical, actionable advice in simple language. Focus on:
1. Local availability of treatments
2. Cost-effective solutions
3. Preventive measures
4. When to consult experts

Keep responses concise (2-3 paragraphs max).`;

      const prompt = `${systemContext}\n\nFarmer's Question: ${request.message}`;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topP: 0.8,
            topK: 10,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.candidates[0]?.content?.parts[0]?.text || 'No response generated';

      return {
        reply: reply,
      };
    } catch (error) {
      console.error('Chat service error:', error);
      return {
        reply: 'I apologize, but I cannot connect to the advisory service right now. Please refer to the offline recommendations above, or try again when you have internet connection.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Fallback for when offline or API fails
  getOfflineFallback(question: string): string {
    const fallbackResponses: { [key: string]: string } = {
      where: 'You can purchase agricultural inputs from your nearest Krishi Vigyan Kendra (KVK), agricultural cooperative society, or licensed pesticide dealers. Contact your local agricultural extension officer for specific suppliers in your area.',
      cost: 'Treatment costs vary by region and product. Contact your local KVK or agricultural department for current prices and any available subsidies for farmers.',
      timing: 'Apply treatments early morning or late evening when temperatures are cooler. Avoid spraying during rain or strong winds. Follow the product label instructions carefully.',
      mixing: 'Never mix different chemicals without expert guidance. Some combinations can be dangerous or ineffective. Consult your local agricultural officer before combining any treatments.',
      organic: 'Organic alternatives include neem oil, copper-based fungicides, and bio-pesticides. These are often available at organic farming stores or can be prepared at home with guidance from agricultural extension services.',
    };

    // Simple keyword matching for offline fallback
    const lowerQuestion = question.toLowerCase();
    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (lowerQuestion.includes(key)) {
        return response;
      }
    }

    return 'For specific questions about your situation, please consult your nearest Krishi Vigyan Kendra (KVK) or agricultural extension officer. They can provide personalized guidance based on local conditions.';
  }
}

export const chatService = new ChatService();
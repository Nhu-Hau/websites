// backend/src/shared/services/groq.service.ts

interface WordTranslation {
  word: string;
  phonetic?: string; // IPA phonetic transcription
  vietnameseMeaning: string;
  englishMeaning: string;
  partOfSpeech: string;
  examples: Array<{
    english: string;
    vietnamese: string;
  }>;
}

interface ParagraphTranslation {
  originalText: string;
  translation: string;
  keyWords: Array<{
    word: string;
    vietnameseMeaning: string;
    partOfSpeech: string;
  }>;
}

class GroqService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    // Ensure we're reading from process.env at runtime, not at module load time
    this.apiKey = process.env.GROQ_API_KEY || "";
    this.baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
    this.model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    
    // Log warning if API key is missing (but don't throw here, throw in makeRequest)
    if (!this.apiKey) {
      console.warn("⚠️  GROQ_API_KEY is not configured in environment variables");
    }
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>) {
    // Re-check API key at request time (in case env was updated)
    const apiKey = process.env.GROQ_API_KEY || this.apiKey;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured. Please set GROQ_API_KEY in your .env file.");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async translateWord(word: string): Promise<WordTranslation> {
    const prompt = `Translate the English word "${word}" to Vietnamese. Return a JSON object with this exact structure:
{
  "word": "${word}",
  "phonetic": "/IPA phonetic transcription/",
  "vietnameseMeaning": "nghĩa tiếng Việt chuẩn",
  "englishMeaning": "short English definition/glossary",
  "partOfSpeech": "noun/verb/adjective/adverb/etc",
  "examples": [
    {
      "english": "Example sentence in English using this word",
      "vietnamese": "Câu ví dụ tiếng Việt tương ứng"
    }
  ]
}

Provide at least 1-2 examples. Keep englishMeaning concise. Include phonetic in IPA format (e.g., /ˈwɜːrd/). Return ONLY valid JSON, no markdown formatting.`;

    const content = await this.makeRequest([
      {
        role: "system",
        content: "You are a helpful English-Vietnamese translation assistant. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    try {
      // Clean up potential markdown formatting
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleaned);
      
      // Validate structure
      if (!result.word || !result.vietnameseMeaning || !result.englishMeaning || !result.partOfSpeech) {
        throw new Error("Invalid translation structure");
      }
      
      return result as WordTranslation;
    } catch (error) {
      console.error("Failed to parse Groq response:", content);
      throw new Error("Failed to parse translation response");
    }
  }

  async translateParagraph(text: string): Promise<ParagraphTranslation> {
    const prompt = `Translate this English paragraph to Vietnamese and identify 3-5 important vocabulary words. Return a JSON object with this exact structure:
{
  "originalText": "${text.replace(/"/g, '\\"')}",
  "translation": "bản dịch tiếng Việt đầy đủ",
  "keyWords": [
    {
      "word": "important word from text",
      "vietnameseMeaning": "nghĩa tiếng Việt",
      "partOfSpeech": "noun/verb/adjective/etc"
    }
  ]
}

Select keyWords that are useful for TOEIC learners (academic, business, or common advanced vocabulary). Return ONLY valid JSON, no markdown formatting.`;

    const content = await this.makeRequest([
      {
        role: "system",
        content: "You are a helpful English-Vietnamese translation assistant. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    try {
      // Clean up potential markdown formatting
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleaned);
      
      // Validate structure
      if (!result.translation || !result.keyWords || !Array.isArray(result.keyWords)) {
        throw new Error("Invalid translation structure");
      }
      
      return result as ParagraphTranslation;
    } catch (error) {
      console.error("Failed to parse Groq response:", content);
      throw new Error("Failed to parse translation response");
    }
  }
}

export const groqService = new GroqService();


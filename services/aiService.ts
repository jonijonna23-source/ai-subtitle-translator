
import { GoogleGenAI } from "@google/genai";
import { AIProvider, SRTBlock } from '../types';

async function translateBlocksAttempt(
  provider: AIProvider,
  apiKey: string,
  model: string,
  targetLanguage: string,
  blocks: SRTBlock[],
  customInstructions?: string
): Promise<SRTBlock[]> {
  const prompt = `Translate the following subtitle text to ${targetLanguage}. 
Keep the exact same number of lines. Each line corresponds to a separate subtitle block.
Do not include IDs or timestamps in your response, just the translated text line by line.

Text to translate:
${blocks.map(b => b.text.replace(/\n/g, ' ')).join('\n')}`;

  if (provider === AIProvider.GEMINI) {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a professional subtitle translator. You translate text accurately while maintaining the context. Return one translated line for each input line." +
      (customInstructions ? ` Additional custom rules of translation styling, tone and guidelines: ${customInstructions}` : "");

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.3,
        systemInstruction: systemInstruction
      }
    });

    const translatedText = response.text || "";
    const translatedLines = translatedText.split('\n');

    return blocks.map((block, idx) => {
      const translatedVal = translatedLines[idx]?.trim();
      return {
        ...block,
        text: translatedVal || block.text,
        status: translatedVal ? 'success' : 'error',
        error: translatedVal ? null : 'Failed to retrieve translated line'
      };
    });
  } else if (provider === AIProvider.OPENAI) {
    // OpenAI Translation
    const systemContent = `You are a professional translator translating subtitles to ${targetLanguage}. Keep the output line-for-line equivalent to the input.` +
      (customInstructions ? ` Additional custom rules of translation styling, tone and guidelines: ${customInstructions}` : "");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'OpenAI API Error');
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content || "";
    const translatedLines = translatedText.split('\n');

    return blocks.map((block, idx) => {
      const translatedVal = translatedLines[idx]?.trim();
      return {
        ...block,
        text: translatedVal || block.text,
        status: translatedVal ? 'success' : 'error',
        error: translatedVal ? null : 'Failed to retrieve translated line'
      };
    });
  } else {
    // Groq Translation (OpenAI-compatible)
    const systemContent = `You are a professional translator translating subtitles to ${targetLanguage}. Keep the output line-for-line equivalent to the input.` +
      (customInstructions ? ` Additional custom rules of translation styling, tone and guidelines: ${customInstructions}` : "");

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      let errMessage = 'Groq API Error';
      try {
        const err = await response.json();
        errMessage = err.error?.message || errMessage;
      } catch (e) {
        // Fallback
      }
      throw new Error(errMessage);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content || "";
    const translatedLines = translatedText.split('\n');

    return blocks.map((block, idx) => {
      const translatedVal = translatedLines[idx]?.trim();
      return {
        ...block,
        text: translatedVal || block.text,
        status: translatedVal ? 'success' : 'error',
        error: translatedVal ? null : 'Failed to retrieve translated line'
      };
    });
  }
}

export async function translateBlocks(
  provider: AIProvider,
  apiKey: string,
  model: string,
  targetLanguage: string,
  blocks: SRTBlock[],
  customInstructions?: string,
  onRetryAlert?: (message: string) => void
): Promise<SRTBlock[]> {
  const maxRetries = 4;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await translateBlocksAttempt(provider, apiKey, model, targetLanguage, blocks, customInstructions);
    } catch (err: any) {
      attempt++;
      const errorMessage = err.message || '';
      const isRateLimit = errorMessage.toLowerCase().includes('rate limit') || 
                          errorMessage.toLowerCase().includes('429') ||
                          errorMessage.toLowerCase().includes('quota') ||
                          errorMessage.toLowerCase().includes('exhausted') ||
                          errorMessage.toLowerCase().includes('too many requests');
      
      if (isRateLimit && attempt <= maxRetries) {
        // Exponential backoff: retry after 4s, 8s, 16s, 32s
        const backoffTime = 4000 * Math.pow(2, attempt - 1);
        const retryMsg = `Batas limit (Rate Limit) tercapai pada percobaan ${attempt}/${maxRetries}. Menunggu ${backoffTime / 1000} detik sebelum mencoba kembali...`;
        console.warn(retryMsg, err);
        if (onRetryAlert) {
          onRetryAlert(retryMsg);
        }
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Terjemahan gagal setelah beberapa percobaan karena pembatasan limit API (Rate Limit).");
}

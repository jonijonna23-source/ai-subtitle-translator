import { GoogleGenAI } from "@google/genai";
import { AIProvider, SRTBlock } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a strong, consistent system prompt for all providers.
 * customInstructions here is already the fully-resolved instruction string
 * from getInstructionToUse() in App.tsx (includes Technical Preservation +
 * any user custom rules, or the full DEFAULT_RULES if user left it blank).
 */
function buildSystemPrompt(targetLanguage: string, customInstructions?: string): string {
  return `You are a professional subtitle translator specializing in streaming platform standards (Netflix, Disney+).

Core Translation Rules:
1. Translate ALL lines to ${targetLanguage}. Never skip, merge, or omit any line.
2. Return EXACTLY the same number of lines as the input — one translated line per input line.
3. Do NOT add numbering, bullet points, blank lines, line breaks within a line, or any extra commentary.
4. Maintain consistent translation for character names, proper nouns, and recurring terms throughout.
5. Use natural, conversational tone. Adapt idioms and cultural references into natural equivalents.
6. Keep sentences short and easy to read quickly on screen.
7. Preserve any formatting tags (e.g. <i>, <b>, {\\an8}) exactly as they appear in the original.

${customInstructions ? `Style & Guidelines:\n${customInstructions}` : ''}`.trim();
}

/**
 * Build the user prompt sent with each batch.
 */
function buildUserPrompt(blocks: SRTBlock[], targetLanguage: string): string {
  const lines = blocks.map(b => b.text.replace(/\n/g, ' ')).join('\n');
  return `Translate each of the following lines from their original language to ${targetLanguage}.
Return ONLY the translated lines, one per line, with NO numbering, NO blank lines, and NO extra text.
The number of output lines MUST equal the number of input lines (${blocks.length} lines).

Lines to translate:
${lines}`;
}

/**
 * Parse the raw text response from the AI into a clean array of translated lines.
 * Handles: numbered lists, extra blank lines, stray commentary.
 */
function parseTranslatedLines(rawText: string, expectedCount: number): string[] {
  const lines = rawText
    .split('\n')
    // Strip leading numbering like "1.", "1)", "- ", "* "
    .map(l => l.replace(/^[\d]+[\.\)]\s*/, '').replace(/^[-*]\s+/, '').trim())
    // Remove blank lines
    .filter(l => l.length > 0);

  return lines;
}

/**
 * Map parsed translated lines back to the original SRTBlock array.
 * If line count mismatches, marks extra blocks as error instead of silently misaligning.
 */
function mapLinesToBlocks(blocks: SRTBlock[], lines: string[]): SRTBlock[] {
  return blocks.map((block, idx) => {
    const translatedVal = lines[idx]?.trim();
    if (translatedVal) {
      return { ...block, text: translatedVal, status: 'success', error: null };
    }
    return {
      ...block,
      // Keep original text so the subtitle file isn't broken, but flag as error
      text: block.originalText || block.text,
      status: 'error',
      error: lines.length !== blocks.length
        ? `Line count mismatch: AI returned ${lines.length} lines for ${blocks.length} input lines.`
        : 'Failed to retrieve translated line'
    };
  });
}

// ---------------------------------------------------------------------------
// Core attempt function
// ---------------------------------------------------------------------------

async function translateBlocksAttempt(
  provider: AIProvider,
  apiKey: string,
  model: string,
  targetLanguage: string,
  blocks: SRTBlock[],
  customInstructions?: string
): Promise<SRTBlock[]> {
  let actualProvider = provider;
  let actualApiKey = apiKey;

  if (provider === AIProvider.GEMINI_FREE) {
    actualProvider = AIProvider.GEMINI;
    actualApiKey = (import.meta.env.VITE_FREE_GEMINI_KEY || '').trim();
    if (!actualApiKey) {
      throw new Error(
        "API Key Gemini Gratis belum dikonfigurasi di file environment .env (VITE_FREE_GEMINI_KEY). " +
        "Harap dikonfigurasi oleh pemilik server atau silakan gunakan model Google Gemini (Custom Key) dengan mengisi API Key Anda sendiri."
      );
    }
  } else if (provider === AIProvider.GROQ_FREE) {
    actualProvider = AIProvider.GROQ;
    actualApiKey = (import.meta.env.VITE_FREE_GROQ_KEY || '').trim();
    if (!actualApiKey) {
      throw new Error(
        "API Key Groq Gratis belum dikonfigurasi di file environment .env (VITE_FREE_GROQ_KEY). " +
        "Harap dikonfigurasi oleh pemilik server atau silakan gunakan model Groq AI (Custom Key) dengan mengisi API Key Anda sendiri."
      );
    }
  }

  const systemPrompt = buildSystemPrompt(targetLanguage, customInstructions);
  const userPrompt = buildUserPrompt(blocks, targetLanguage);

  // -------------------------------------------------------------------------
  // Gemini
  // -------------------------------------------------------------------------
  if (actualProvider === AIProvider.GEMINI) {
    const ai = new GoogleGenAI({ apiKey: actualApiKey });

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        temperature: 0.3,
        systemInstruction: systemPrompt
      }
    });

    const rawText = response.text || "";
    const lines = parseTranslatedLines(rawText, blocks.length);
    return mapLinesToBlocks(blocks, lines);
  }

  // -------------------------------------------------------------------------
  // OpenAI
  // -------------------------------------------------------------------------
  if (actualProvider === AIProvider.OPENAI) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actualApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'OpenAI API Error');
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content || "";
    const lines = parseTranslatedLines(rawText, blocks.length);
    return mapLinesToBlocks(blocks, lines);
  }

  // -------------------------------------------------------------------------
  // Groq (OpenAI-compatible)
  // -------------------------------------------------------------------------
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${actualApiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    let errMessage = 'Groq API Error';
    try {
      const err = await response.json();
      errMessage = err.error?.message || errMessage;
    } catch (_) {
      // fallback to generic message
    }
    throw new Error(errMessage);
  }

  const data = await response.json();
  const rawText = data.choices[0].message.content || "";
  const lines = parseTranslatedLines(rawText, blocks.length);
  return mapLinesToBlocks(blocks, lines);
}

// ---------------------------------------------------------------------------
// Public export — with exponential backoff retry on rate limit errors
// ---------------------------------------------------------------------------

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
      const isRateLimit =
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('429') ||
        errorMessage.toLowerCase().includes('quota') ||
        errorMessage.toLowerCase().includes('exhausted') ||
        errorMessage.toLowerCase().includes('too many requests');

      if (isRateLimit && attempt <= maxRetries) {
        // Exponential backoff: 4s, 8s, 16s, 32s
        const backoffTime = 4000 * Math.pow(2, attempt - 1);
        const retryMsg =
          `Batas limit (Rate Limit) tercapai pada percobaan ${attempt}/${maxRetries}. ` +
          `Menunggu ${backoffTime / 1000} detik sebelum mencoba kembali...`;
        console.warn(retryMsg, err);
        if (onRetryAlert) onRetryAlert(retryMsg);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      throw err;
    }
  }

  throw new Error("Terjemahan gagal setelah beberapa percobaan karena pembatasan limit API (Rate Limit).");
}

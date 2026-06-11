
export enum AIProvider {
  GEMINI_FREE = 'GEMINI_FREE',
  GROQ_FREE = 'GROQ_FREE',
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
  GROQ = 'GROQ'
}

export interface SRTBlock {
  id: string;
  timeRange: string;
  text: string;
  originalText?: string;
  status?: 'pending' | 'translating' | 'success' | 'error';
  error?: string | null;
  metaPrefix?: string;
  originalIndex?: number;
}

export interface TranslationState {
  isProcessing: boolean;
  progress: number;
  currentIndex: number;
  totalBlocks: number;
  translatedBlocks: SRTBlock[];
  error: string | null;
}

export interface ModelOption {
  value: string;
  label: string;
}

export const PROVIDER_MODELS: Record<AIProvider, ModelOption[]> = {
  [AIProvider.GEMINI_FREE]: [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Fast & Default)' },
    { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Advanced Reasoning)' },
    { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
    { value: 'gemini-2.5-flash-latest', label: 'Gemini 2.5 Flash' }
  ],
  [AIProvider.GROQ_FREE]: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (High Quality)' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast)' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Balanced)' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B (Google Open Model)' }
  ],
  [AIProvider.GEMINI]: [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Fast & Default)' },
    { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Advanced Reasoning)' },
    { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
    { value: 'gemini-2.5-flash-latest', label: 'Gemini 2.5 Flash' }
  ],
  [AIProvider.OPENAI]: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  [AIProvider.GROQ]: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (High Quality)' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast)' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Balanced)' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B (Google Open Model)' }
  ]
};

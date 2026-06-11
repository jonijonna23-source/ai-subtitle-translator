import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  AIProvider, 
  SRTBlock, 
  PROVIDER_MODELS, 
  TranslationState 
} from './types';
import { parseSubtitle, stringifySubtitle } from './services/srtParser';
import { translateBlocks } from './services/aiService';
import { 
  Globe, 
  UploadCloud, 
  Cpu, 
  Settings, 
  Key, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Check, 
  Copy, 
  Download, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Sun,
  Moon,
  Monitor,
  Search
} from 'lucide-react';

const TARGET_LANGUAGES = [
  { code: 'id', name: 'Indonesian' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'ms', name: 'Malay' },
  { code: 'jv', name: 'Javanese' },
  { code: 'su', name: 'Sundanese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'fil', name: 'Filipino' },
  { code: 'pl', name: 'Polish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'cs', name: 'Czech' }
];

const DEFAULT_RULES = `Technical Preservation: Strictly preserve all original formatting, timestamps, and sequence numbers. Do not alter, add, or remove any timecodes or structural elements.

Tone & Flow: Use a natural, fluent, and conversational tone that matches modern streaming platform standards (like Netflix or Disney+). Avoid overly rigid or literal word-for-word translations.

Readability: Keep sentences short, concise, and easy to read quickly on screen.

Contextual Adaptation: Adapt the language level based on the context. Use clean, natural daily conversation for casual scenes, and formal language only when the on-screen context demands it (e.g., news, legal, or formal speeches).

Localization: Translate idioms and cultural references into natural equivalents in the target language so the emotional nuance and humor remain intact.`;

const TECHNICAL_PRESERVATION_RULE = "Technical Preservation: Strictly preserve all original formatting, timestamps, and sequence numbers. Do not alter, add, or remove any timecodes or structural elements.";

const getInstructionToUse = (customText: string): string => {
  const trimmed = customText.trim();
  if (!trimmed) {
    return DEFAULT_RULES;
  }
  // Enforce/lock rule 1 (Technical Preservation), no matter what custom prompt the user entered.
  return `${TECHNICAL_PRESERVATION_RULE}\n\nAdditional Translation Style Customization:\n${trimmed}`;
};

const App: React.FC = () => {
  // Theme selection state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('subtitle_theme');
    return (saved as 'light' | 'dark' | 'system') || 'system';
  });

  useEffect(() => {
    localStorage.setItem('subtitle_theme', theme);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  // Save credentials checkbox state
  const [saveCredentials, setSaveCredentials] = useState<boolean>(() => {
    return localStorage.getItem('save_credentials') === 'true';
  });

  // Config State
  const [provider, setProvider] = useState<AIProvider>(() => {
    const savedSaveCredentials = localStorage.getItem('save_credentials') === 'true';
    if (savedSaveCredentials) {
      const savedProvider = localStorage.getItem('saved_provider') as AIProvider;
      if (savedProvider && Object.values(AIProvider).includes(savedProvider)) {
        return savedProvider;
      }
    }
    return AIProvider.GEMINI;
  });

  const [apiKey, setApiKey] = useState(() => {
    const savedSaveCredentials = localStorage.getItem('save_credentials') === 'true';
    if (savedSaveCredentials) {
      return localStorage.getItem('saved_api_key') || '';
    }
    return '';
  });

  const [model, setModel] = useState(() => {
    const savedSaveCredentials = localStorage.getItem('save_credentials') === 'true';
    if (savedSaveCredentials) {
      const savedModel = localStorage.getItem('saved_model');
      if (savedModel) return savedModel;
    }
    return PROVIDER_MODELS[AIProvider.GEMINI][0].value;
  });

  const [targetLang, setTargetLang] = useState('Indonesian');
  const [customInstructions, setCustomInstructions] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [originalBlocks, setOriginalBlocks] = useState<SRTBlock[]>([]);
  const [subtitleFormat, setSubtitleFormat] = useState<'srt' | 'vtt' | 'ass'>('srt');
  const [originalRawLines, setOriginalRawLines] = useState<string[]>([]);

  // Processing State
  const [state, setState] = useState<TranslationState>({
    isProcessing: false,
    progress: 0,
    currentIndex: 0,
    totalBlocks: 0,
    translatedBlocks: [],
    error: null
  });

  const stopRef = useRef(false);

  const [batchSize, setBatchSize] = useState<number>(10);
  const [delay, setDelay] = useState<number>(1500); 
  const [retryAlert, setRetryAlert] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  // Save credentials and configs to localStorage when checked or clear them
  useEffect(() => {
    localStorage.setItem('save_credentials', String(saveCredentials));
    if (saveCredentials) {
      localStorage.setItem('saved_api_key', apiKey);
      localStorage.setItem('saved_provider', provider);
      localStorage.setItem('saved_model', model);
    } else {
      localStorage.removeItem('saved_api_key');
      localStorage.removeItem('saved_provider');
      localStorage.removeItem('saved_model');
    }
  }, [saveCredentials, apiKey, provider, model]);

  // Auto-switch model when provider changes (preserving valid restored model)
  useEffect(() => {
    const modelsForProvider = PROVIDER_MODELS[provider] || [];
    const modelValid = modelsForProvider.some(m => m.value === model);
    if (!modelValid) {
      setModel(PROVIDER_MODELS[provider]?.[0]?.value || '');
    }
    if (provider === AIProvider.GROQ || provider === AIProvider.GROQ_FREE) {
      setDelay(2500);
      setBatchSize(5); 
    } else {
      setDelay(1500);
      setBatchSize(10);
    }
  }, [provider]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const text = await selectedFile.text();
      const { blocks, format, rawLines } = parseSubtitle(text, selectedFile.name);
      setSubtitleFormat(format);
      setOriginalRawLines(rawLines);
      setOriginalBlocks(blocks);

      // Pre-fill translatedBlocks with placeholders having 'pending' status
      const initialTranslated: SRTBlock[] = blocks.map(b => ({
        ...b,
        text: '', 
        status: 'pending' as const,
        error: null
      }));

      setState({
        isProcessing: false,
        progress: 0,
        currentIndex: 0,
        totalBlocks: blocks.length,
        translatedBlocks: initialTranslated,
        error: null
      });
      setIsExpanded(false);
    }
  };

  const startTranslation = async () => {
    const isFreeProvider = provider === AIProvider.GEMINI_FREE || provider === AIProvider.GROQ_FREE;
    if (!isFreeProvider && !apiKey) {
      setState(prev => ({ ...prev, error: 'Please enter an API Key to start translating.' }));
      return;
    }
    if (originalBlocks.length === 0) {
      setState(prev => ({ ...prev, error: 'Please upload a subtitle file first.' }));
      return;
    }

    stopRef.current = false;
    setRetryAlert(null);
    
    // Initialize full size list if empty or reset
    let currentTranslatedList = [...state.translatedBlocks];
    if (currentTranslatedList.length !== originalBlocks.length) {
      currentTranslatedList = originalBlocks.map(b => ({
        ...b,
        text: '',
        status: 'pending' as const,
        error: null
      }));
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      currentIndex: 0, 
      translatedBlocks: currentTranslatedList,
      progress: 0 
    }));

    const total = originalBlocks.length;

    try {
      for (let i = 0; i < total; i += batchSize) {
        if (stopRef.current) break;

        setRetryAlert(null);

        const endIndex = Math.min(i + batchSize, total);
        const batch = originalBlocks.slice(i, endIndex);

        // Update state to show these blocks are currently translating
        currentTranslatedList = currentTranslatedList.map((block, idx) => {
          if (idx >= i && idx < endIndex) {
            return { ...block, status: 'translating' as const };
          }
          return block;
        });

        setState(prev => ({
          ...prev,
          translatedBlocks: currentTranslatedList
        }));

        try {
          const instructionToUse = getInstructionToUse(customInstructions);
          const translatedBatch = await translateBlocks(
            provider,
            apiKey,
            model,
            targetLang,
            batch,
            instructionToUse,
            (msg) => setRetryAlert(msg)
          );

          // Update translated list items
          currentTranslatedList = currentTranslatedList.map((block, idx) => {
            if (idx >= i && idx < endIndex) {
              const batchItemIndex = idx - i;
              const result = translatedBatch[batchItemIndex];
              return {
                ...block,
                text: result?.text || block.originalText || '',
                status: result?.status || 'success',
                error: result?.error || null
              };
            }
            return block;
          });
        } catch (batchErr: any) {
          // If whole batch translation failed, flag them as error in state
          currentTranslatedList = currentTranslatedList.map((block, idx) => {
            if (idx >= i && idx < endIndex) {
              return {
                ...block,
                status: 'error' as const,
                error: batchErr.message || 'Batch request error'
              };
            }
            return block;
          });
        }

        const newProgress = Math.min(100, Math.round((endIndex / total) * 100));
        
        setState(prev => ({
          ...prev,
          currentIndex: endIndex,
          progress: newProgress,
          translatedBlocks: currentTranslatedList
        }));

        setRetryAlert(null);

        // Customizable cooldown delay between batches
        if (delay > 0 && endIndex < total && !stopRef.current) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || 'Translation failed' }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      setRetryAlert(null);
    }
  };

  const retrySingleBlock = async (blockId: string) => {
    const isFreeProvider = provider === AIProvider.GEMINI_FREE || provider === AIProvider.GROQ_FREE;
    if (!isFreeProvider && !apiKey) {
      setState(prev => ({ ...prev, error: 'Please enter an API Key to retry translating.' }));
      return;
    }

    const blockIndex = state.translatedBlocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    setRetryingIds(prev => {
      const next = new Set(prev);
      next.add(blockId);
      return next;
    });

    const blockToTranslate = state.translatedBlocks[blockIndex];

    // Set its status to translating
    const updatedBlocks = [...state.translatedBlocks];
    updatedBlocks[blockIndex] = {
      ...blockToTranslate,
      status: 'translating',
      error: null
    };
    setState(prev => ({ ...prev, translatedBlocks: updatedBlocks }));

    try {
      const instructionToUse = getInstructionToUse(customInstructions);
      const result = await translateBlocks(
        provider,
        apiKey,
        model,
        targetLang,
        [{
          id: blockToTranslate.id,
          timeRange: blockToTranslate.timeRange,
          text: blockToTranslate.originalText || blockToTranslate.text
        }],
        instructionToUse
      );

      const translatedSingle = result[0];

      const finalBlocks = [...state.translatedBlocks];
      finalBlocks[blockIndex] = {
        ...blockToTranslate,
        text: translatedSingle.text,
        status: 'success',
        error: null
      };

      setState(prev => ({ ...prev, translatedBlocks: finalBlocks }));
    } catch (err: any) {
      const finalBlocks = [...state.translatedBlocks];
      finalBlocks[blockIndex] = {
        ...blockToTranslate,
        status: 'error',
        error: err.message || 'Individual translation retry failed.'
      };
      setState(prev => ({ ...prev, translatedBlocks: finalBlocks }));
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }
  };

  const stopTranslation = () => {
    stopRef.current = true;
    setState(prev => ({ ...prev, isProcessing: false }));
    setRetryAlert(null);
  };

  const resetAll = () => {
    stopRef.current = true;
    setFile(null);
    setOriginalBlocks([]);
    setCustomInstructions('');
    setSearchQuery('');
    const isGroq = provider === AIProvider.GROQ || provider === AIProvider.GROQ_FREE;
    setBatchSize(isGroq ? 5 : 10);
    setDelay(isGroq ? 2500 : 1500);
    setRetryAlert(null);
    setIsExpanded(false);
    setIsCopied(false);
    setState({
      isProcessing: false,
      progress: 0,
      currentIndex: 0,
      totalBlocks: 0,
      translatedBlocks: [],
      error: null
    });
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const getProcessedBlocksWithFallback = () => {
    // If a block does not have a successful translation yet, fallback to its original text
    return state.translatedBlocks.map(b => ({
      ...b,
      text: b.status === 'success' && b.text ? b.text : (b.originalText || b.text)
    }));
  };

  const downloadSubtitles = () => {
    const content = stringifySubtitle(getProcessedBlocksWithFallback(), subtitleFormat, originalRawLines);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = subtitleFormat;
    a.download = `translated_${file?.name ? file.name.substring(0, file.name.lastIndexOf('.')) : 'subtitle'}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const content = stringifySubtitle(getProcessedBlocksWithFallback(), subtitleFormat, originalRawLines);
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // State for filtering matrix table
  const [searchQuery, setSearchQuery] = useState('');

  // Determine which blocks to display and layout constraints
  const displayBlocks = state.translatedBlocks.length > 0 ? state.translatedBlocks : originalBlocks;

  // Filter blocks by search query
  const filteredBlocks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return displayBlocks;

    return displayBlocks.filter((block, idx) => {
      const matchIndex = String(idx + 1) === query || (block.id && String(block.id).toLowerCase() === query);
      const matchOriginal = (block.originalText || block.text || '').toLowerCase().includes(query);
      const matchTranslation = (block.status === 'success' && block.text ? block.text : '').toLowerCase().includes(query);
      return matchIndex || matchOriginal || matchTranslation;
    });
  }, [displayBlocks, searchQuery]);

  // Stats calculation
  const totalSubtitles = displayBlocks.length;
  const translatedCount = state.translatedBlocks.filter(b => b.status === 'success').length;
  const errorCount = state.translatedBlocks.filter(b => b.status === 'error').length;

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200 py-10">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Theme and Header Utility Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="text-left">
            <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-500 tracking-tight flex items-center gap-2">
              <Globe className="w-8 h-8 text-blue-500 animate-spin-once" />
              AI Subtitle Translator
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
              Supports SRT, VTT, and ASS files with customizable style settings and rate optimization.
            </p>
          </div>

          {/* Theme Selector */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                theme === 'light' 
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-850 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                theme === 'dark' 
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-850 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                theme === 'system' 
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-850 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
              title="System Default"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>System</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors duration-200">
          <div className="p-8">
          
          {/* Config Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-slate-500" />
                  AI Provider
                </label>
                <select 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value as AIProvider)}
                  disabled={state.isProcessing}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-sm font-semibold selection:bg-blue-100"
                >
                  <option value={AIProvider.GEMINI_FREE}>Google Gemini (Free API Key)</option>
                  <option value={AIProvider.GROQ_FREE}>Groq AI (Free API Key)</option>
                  <option value={AIProvider.GEMINI}>Google Gemini (Custom Key)</option>
                  <option value={AIProvider.OPENAI}>OpenAI (Custom Key)</option>
                  <option value={AIProvider.GROQ}>Groq AI (Custom Key)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-slate-500" />
                  Model Selection
                </label>
                <select 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)}
                  disabled={state.isProcessing}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-sm"
                >
                  {PROVIDER_MODELS[provider].map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800">{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-slate-500" />
                  Target Language
                </label>
                <select 
                  value={targetLang} 
                  onChange={(e) => setTargetLang(e.target.value)}
                  disabled={state.isProcessing}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-sm"
                >
                  {TARGET_LANGUAGES.map(lang => (
                    <option key={lang.name} value={lang.name} className="bg-white dark:bg-slate-800">{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-slate-500" />
                  {provider === AIProvider.GEMINI_FREE 
                    ? 'Gemini API Key (Free)' 
                    : provider === AIProvider.GROQ_FREE 
                      ? 'Groq API Key (Free)' 
                      : provider === AIProvider.GEMINI 
                        ? 'Gemini API Key' 
                        : provider === AIProvider.OPENAI 
                          ? 'OpenAI API Key' 
                          : 'Groq API Key'}
                </label>
                <input 
                  type="password" 
                  value={provider === AIProvider.GEMINI_FREE || provider === AIProvider.GROQ_FREE ? "" : apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={state.isProcessing || provider === AIProvider.GEMINI_FREE || provider === AIProvider.GROQ_FREE}
                  placeholder={
                    provider === AIProvider.GEMINI_FREE
                      ? "Free Gemini API Key Active (No input required)"
                      : provider === AIProvider.GROQ_FREE
                        ? "Free Groq API Key Active (No input required)"
                        : provider === AIProvider.GEMINI 
                          ? "Enter your Gemini API Key" 
                          : provider === AIProvider.OPENAI 
                            ? "Enter your OpenAI API Key (sk-...)" 
                            : "Enter your Groq API Key (gsk_...)"
                  }
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="save-credentials"
                    checked={saveCredentials}
                    onChange={(e) => setSaveCredentials(e.target.checked)}
                    disabled={state.isProcessing}
                    className="w-4 h-4 text-blue-650 dark:text-blue-500 border-gray-350 dark:border-slate-750 rounded focus:ring-blue-500 bg-white dark:bg-slate-800 accent-blue-600 cursor-pointer"
                  />
                  <label htmlFor="save-credentials" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    Save API key in this browser
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  Upload Subtitle File
                </label>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer bg-gray-50 dark:bg-slate-900/60">
                  <input 
                    type="file" 
                    id="file-upload"
                    accept=".srt,.vtt,.ass" 
                    onChange={handleFileChange}
                    disabled={state.isProcessing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium block">
                      {file ? file.name : "Select an SRT, VTT, or ASS subtitle file to translate (multiple formats)"}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">Drag and drop or browse from your device</span>
                  </div>
                </div>
                {originalBlocks.length > 0 && (
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      Detected {originalBlocks.length} subtitle blocks
                    </p>
                    <span className="text-[10px] uppercase bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                      {subtitleFormat} Format
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Translation Styling Customization */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              Translation Style Customization (Optional)
            </label>
            <textarea 
              value={customInstructions} 
              onChange={(e) => setCustomInstructions(e.target.value)}
              disabled={state.isProcessing}
              placeholder="e.g. Use casual slang, maintain gaming naming/terminology, restrict sentence lengths to be short, use formal tone, natural conversation, fluent, professional language that sounds like official streaming subtitles, maintain the original meaning, improve readability, ensure a natural conversational tone while preserving subtitle formatting, timestamps, sequence without adding or removing information."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-sm resize-none"
            />
          </div>

          {/* API Regulation & Cooldown delay */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-xl p-4 mb-8">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-600 animate-spin-once" />
              API Rate Regulation & Batching (Prevent Rate Limiting)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Batch Size: <span className="font-bold text-blue-600 dark:text-blue-400">{batchSize} lines</span>
                </label>
                <input 
                  type="range"
                  min="1"
                  max="30"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  disabled={state.isProcessing}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">Smaller batch size helps stay within tokens-per-minute (TPM) caps for Groq or free tiers.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Cooldown Delay Between Batches: <span className="font-bold text-blue-600 dark:text-blue-400">{(delay / 1000).toFixed(1)} seconds</span>
                </label>
                <input 
                  type="range"
                  min="0"
                  max="8000"
                  step="500"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  disabled={state.isProcessing}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">Automatic back-off interval to prevent hitting max-rate requests blocks (HTTP 429 error).</p>
              </div>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            {!state.isProcessing ? (
              <button 
                onClick={startTranslation}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition flex-1 shadow-lg shadow-blue-50/50 dark:shadow-none"
              >
                Start Translation
              </button>
            ) : (
              <button 
                onClick={stopTranslation}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold transition flex-1 shadow-lg shadow-red-50/50 dark:shadow-none"
              >
                Stop Processing
              </button>
            )}
            <button 
              onClick={resetAll}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition border border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Reset
            </button>
          </div>

          {/* Progress Indicator */}
          {(state.isProcessing || state.progress > 0) && (
            <div className="mb-6 p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl transition duration-250">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  {state.progress === 100 ? (
                    <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 font-bold" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  )}
                  {state.progress === 100 ? 'Translation Completed' : 'Translation Progress'}
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{state.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${state.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">
                {state.progress === 100 
                  ? `Done translating ${state.totalBlocks} subtitle blocks!`
                  : `Processing ${state.currentIndex} of ${state.totalBlocks} subtitle blocks...`
                }
              </p>
            </div>
          )}

          {/* Copy to Clipboard and Download Subtitle Utility (Always visible from start) */}
          {displayBlocks.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition duration-200">
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Live Action Controls
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Save or copy your subtitle file dynamically, even while translation processing is in progress.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                <button 
                  onClick={copyToClipboard}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100 px-5 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 flex-1 sm:flex-none text-xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                <button 
                  onClick={downloadSubtitles}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 flex-1 sm:flex-none text-xs shadow-md shadow-emerald-100/10"
                >
                  <Download className="w-4 h-4" />
                  Download Subtitle
                </button>
              </div>
            </div>
          )}

          {/* Rate Limit Retry Warning */}
          {retryAlert && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg animate-pulse">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-amber-800 font-semibold">{retryAlert}</p>
                </div>
              </div>
            </div>
          )}

          {/* General Critical Error Message */}
          {state.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-semibold">Error Occurred</p>
                  <p className="text-xs text-red-600 mt-1">{state.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* SUBTITLE BENTO LAYOUT METRICS AND SPREADSHEET TABLE */}
          {displayBlocks.length > 0 && (
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Subtitle Translation Matrix
                  </h3>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by keyword or index..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-12 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 shadow-sm transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>

               {/* SpreadSheet table mimicking the dark navy style of user screenshot */}
              <div className="bg-[#0f172a] rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                <div className={`overflow-x-auto overflow-y-auto transition-all duration-300 ${isExpanded ? 'max-h-[680px]' : 'max-h-[380px]'}`}>
                  <table className="w-full text-left border-collapse table-fixed select-none">
                    <thead>
                      <tr className="bg-[#0b1329] text-[11px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                        <th className="w-16 py-3 px-4">ID</th>
                        <th className="w-32 py-3 px-4 text-center">Time</th>
                        <th className="py-3 px-4 w-1/3">Original Text</th>
                        <th className="py-3 px-4 w-1/3">Translation</th>
                        <th className="w-28 py-3 px-4 text-center">Status</th>
                        <th className="w-20 py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredBlocks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 text-sm font-medium">
                            No matching subtitle blocks found. Try searching for another keyword or index.
                          </td>
                        </tr>
                      ) : (
                        filteredBlocks.map((block) => {
                          const isRetrying = retryingIds.has(block.id);
                          const originalIdx = displayBlocks.indexOf(block);
                          
                          // Break down timestamp
                          let startTime = '';
                          let endTime = '';
                          if (block.timeRange) {
                            const parts = block.timeRange.split('-->');
                            if (parts.length >= 2) {
                              startTime = parts[0].trim();
                              endTime = parts[1].trim();
                            } else {
                              const commaParts = block.timeRange.split(',');
                              if (commaParts.length >= 2) {
                                startTime = commaParts[0].trim();
                                endTime = commaParts[1].trim();
                              } else {
                                startTime = block.timeRange;
                              }
                            }
                          }

                          return (
                            <tr key={block.id || originalIdx} className="hover:bg-slate-900/60 transition duration-150 group">
                              {/* ID */}
                              <td className="py-3.5 px-4 font-semibold text-slate-200 text-sm border-r border-slate-800/40">
                                <div className="flex items-center gap-1">
                                  <span>{originalIdx + 1}</span>
                                  {block.id && block.id !== String(originalIdx + 1) && (
                                    <span className="text-[10px] text-slate-500 font-mono" title={`Original ID: ${block.id}`}>
                                      [{block.id}]
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* TIME */}
                              <td className="py-3.5 px-4 border-r border-slate-800/40 text-center">
                                <div className="text-[11px] text-slate-300 font-mono tracking-tight leading-relaxed">
                                  {startTime}
                                  {endTime && (
                                    <>
                                      <div className="text-slate-500 text-[10px] my-0.5">↓</div>
                                      {endTime}
                                    </>
                                  )}
                                </div>
                              </td>

                              {/* ORIGINAL TEXT */}
                              <td className="py-3.5 px-4 border-r border-slate-800/40 align-top">
                                <div className="text-slate-100 text-sm font-sans leading-relaxed whitespace-pre-wrap select-text">
                                  {block.originalText || block.text}
                                </div>
                              </td>

                              {/* TRANSLATION */}
                              <td className="py-3.5 px-4 border-r border-slate-800/40 align-top">
                                {block.status === 'error' ? (
                                  <div className="bg-[#2a1215]/80 border border-red-900/80 rounded-lg p-3 text-red-300 space-y-1 text-[11px]">
                                    <div className="flex items-center gap-1.5 font-bold text-red-400">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      Translation Error
                                    </div>
                                    <div className="font-mono opacity-90 break-words leading-relaxed select-text">
                                      {block.error || 'The model encountered an issue rendering this block.'}
                                    </div>
                                  </div>
                                ) : block.status === 'translating' ? (
                                  <div className="flex items-center gap-2 text-sky-400 py-1 text-xs">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Translating...</span>
                                  </div>
                                ) : block.status === 'success' && block.text ? (
                                  <div className="text-blue-100 text-sm font-sans leading-relaxed whitespace-pre-wrap select-text">
                                    {block.text}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs italic">Awaiting translation run...</span>
                                )}
                              </td>

                              {/* STATUS */}
                              <td className="py-3.5 px-4 text-center border-r border-slate-800/40">
                                {block.status === 'success' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                                    Success
                                  </span>
                                ) : block.status === 'error' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                                    Error
                                  </span>
                                ) : block.status === 'translating' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/20 uppercase tracking-widest animate-pulse">
                                    Translting
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest">
                                    Pending
                                  </span>
                                )}
                              </td>

                              {/* ACTION (Single Retry) */}
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => retrySingleBlock(block.id)}
                                  disabled={state.isProcessing || isRetrying}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition duration-150 disabled:opacity-20 disabled:hover:bg-transparent"
                                  title="Retry translation for this block only"
                                >
                                  <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>                 {/* Spreadsheet Footer Mimicking the Screenshot */}
                <div className="bg-[#0b1329] border-t border-slate-800 px-4 py-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-xs font-semibold text-slate-300">
                  {/* Left Column Spacer for Perfect Centering */}
                  <div className="hidden sm:block"></div>

                  {/* Center Column: Expand/Collapse Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                          Collapse table
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                          Expand table
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column: Status Statistics */}
                  <div className="flex items-center justify-center sm:justify-end gap-3 text-right">
                    <span className="text-emerald-400">
                      {translatedCount} translated
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-rose-400">
                      {errorCount} errors
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      <footer className="mt-12 text-center text-slate-400 dark:text-slate-500 text-sm">
        <p>AI Subtitle Translator &copy; 2026. Fast, reliable multi-encoding subtitle translation engine.</p>
      </footer>
      </div>
    </div>
  );
};

export default App;

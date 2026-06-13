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
  Play,
  Sparkles,
  Info,
  Sun,
  Moon,
  Monitor,
  Search,
  Heart,
  Coffee,
  Mail,
  ExternalLink,
  Languages,
  Star,
  Share2,
  MessageSquare
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

Localization: Translate idioms, metaphors, and cultural references based on their intended meaning, not word-for-word. Find the most natural equivalent expression in the target language so the emotional nuance, humor, and intent remain fully intact. Examples:
- "Strength is not a closed fist" → means "True strength is not about force or aggression"
- "walking on eggshells" → means "being extremely careful to avoid upsetting someone"
- "can of worms" → means "a situation more complicated and problematic than it appears"
- "living on borrowed time" → means "not expected to survive or last much longer"
- "walls have ears" → means "be careful, someone might be listening"
- "pulling the strings" → means "secretly controlling or manipulating everything behind the scenes"
- "wore her heart on her sleeve" → means "openly showed her emotions without hiding them"
- "can't unring a bell" → means "what has been done or said cannot be taken back"
- "jumped out of the frying pan into the fire" → means "escaped a bad situation only to end up in a worse one"
- "spitting image" → means "looks exactly like someone, identical resemblance"
- "hit the nail on the head" → means "said or did exactly the right thing, completely correct"
- "loose cannon" → means "an unpredictable person who is likely to cause problems"
- "dragging his feet" → means "deliberately delaying or being slow on purpose"
- "ball is in your court" → means "it is now your turn to take action or make a decision".
Meaning Over Literalism: Always prioritize conveying the true intent and natural feel of the original sentence. If a literal translation sounds awkward or unnatural in the target language, rephrase it so it reads fluently while preserving the original meaning.`;

const TECHNICAL_PRESERVATION_RULE = "Technical Preservation: Strictly preserve all original formatting, timestamps, and sequence numbers. Do not alter, add, or remove any timecodes or structural elements.";

const getInstructionToUse = (customText: string): string => {
  const trimmed = customText.trim();
  if (!trimmed) {
    return DEFAULT_RULES;
  }
  // Enforce/lock rule 1 (Technical Preservation), no matter what custom prompt the user entered.
  return `${TECHNICAL_PRESERVATION_RULE}\n\nAdditional Translation Style Customization:\n${trimmed}`;
};

const LOCALES = {
  en: {
    appName: 'AI Subtitle Translator',
    appDesc: 'Fast, Accurate, Online and Free AI subtitle & text translator.',
    userGuideBtn: 'User Guide',
    donateBtn: 'Buy Me a Coffee',
    contactBtn: 'Contact',
    contactTitle: 'Contact & Developer Support',
    contactDesc: 'Have feedback, feature suggestions, or need help? Get in touch with us using the official channels below.',
    contactEmail: 'Email Address',
    contactGithub: 'GitHub Repository',
    contactCopyEmail: 'Copy Email',
    contactEmailCopied: 'Email address copied to clipboard!',
    contactFormTitle: 'Send a Message',
    contactFormName: 'Your Name',
    contactFormMessage: 'Message',
    contactFormSubmit: 'Submit Message',
    languageLabel: 'UI Language',
    themeLabel: 'Theme',
    backToAppBtn: '← Back to Application',
    restoreTitle: 'Restore Previous Session?',
    restoreDesc: 'A previous unsaved translation session for file "{fileName}" was found ({progress}% completed). Do you want to load and resume it?',
    btnRestore: 'Restore Session',
    btnDiscard: 'Discard',
    configTitle: 'Translation Config',
    labelProvider: 'AI Provider',
    labelModel: 'API Model',
    labelTargetLanguage: 'Target Language',
    labelApiKey: 'API Key',
    labelSaveCredentials: 'Save Credentials & API Key',
    guidelinesTitle: 'Custom Translation Guidelines',
    guidelinesDesc: 'Custom style rules will be joined with default Netflix/standard guidelines.',
    placeholderCustomInstructions: 'E.g., Translate slang to contemporary teenager slang. Keep translations elegant and poetic...',
    uploadTitle: 'Upload Subtitle / Custom Text File',
    uploadPlaceholder: 'Select an SRT, VTT, ASS subtitle or a PLAIN TXT file to translate',
    uploadDragDrop: 'Drag and drop or browse from your device',
    detectedBlocks: 'Detected {count} text segments',
    detectedSubtitle: 'Detected {count} subtitle blocks',
    formatLabel: '{format} Format',
    totalLines: 'Total Lines',
    charCount: 'Characters Count',
    wordCount: 'Words Count',
    estTokens: 'Est. Tokens',
    progressTitle: 'Translation Progress',
    etaCompleted: 'Completed',
    etaCalculating: 'Calculating...',
    etaPrefix: 'ETA:',
    stopBtn: 'Stop Processing',
    resumeBtn: 'Resume Translation',
    startOverBtn: 'Start Over',
    startBtn: 'Start Translation',
    processingTitle: 'Processing...',
    blocksLabel: 'Subtitle Blocks / Lines',
    tableOriginal: 'Original',
    tableTranslation: 'Translation',
    tableStatus: 'Status',
    tableAction: 'Action',
    actionRetry: 'Retry',
    actionCopied: 'Copied!',
    actionCopy: 'Copy to Clipboard',
    actionDownload: 'Download Subtitle',
    actionDownloadBilingual: 'Download Bilingual',
    searchPlaceholder: 'Search original or translated text...',
    errEmptyKey: 'Please enter an API Key to start translating.',
    errNoFile: 'Please upload a subtitle file first.',
    errEmptyFile: 'Uploaded file is empty (0 bytes). Please upload a valid text/subtitle file.',
    errInvalidFormat: 'Invalid or unsupported file format. No text or subtitle blocks could be extracted.',
    successRestored: 'Session successfully restored!',
    alertBatchError: 'Translation failed for this block. Click retry to run again.',
    alertFinishedHeader: 'Translation Finished',
    alertFinishedDesc: 'Your file has been translated successfully. You can download the final file or copy the contents to clipboard.',
    labelGeminiKeyFree: 'Gemini API Key (Free)',
    labelGroqKeyFree: 'Groq API Key (Free)',
    labelGeminiKey: 'Gemini API Key',
    labelOpenAIKey: 'OpenAI API Key',
    labelGroqKey: 'Groq API Key',
    placeholderGeminiFree: 'Free Gemini API Key Active (No input required)',
    placeholderGroqFree: 'Free Groq API Key Active (No input required)',
    placeholderEnterGemini: 'Enter your Gemini API Key',
    placeholderEnterOpenAI: 'Enter your OpenAI API Key (sk-...)',
    placeholderEnterGroq: 'Enter your Groq API Key (gsk_...)',
    labelSaveApiKey: 'Save API key in this browser',
    customStyleTitle: 'Translation Style Customization (Optional)',
    customStylePlaceholder: 'e.g. Use casual slang, maintain gaming naming/terminology, restrict sentence lengths to be short, use formal tone, natural conversation, fluent, poetic, etc.',
    rateLimitTitle: 'API Rate Regulation & Batching (Prevent Rate Limiting)',
    labelBatchSize: 'Batch Size',
    labelCooldown: 'Cooldown Delay Between Batches',
    infoBatchSize: 'Smaller batch size helps stay within tokens-per-minute (TPM) caps for Groq or free tiers.',
    infoCooldown: 'Automatic back-off interval to prevent hitting max-rate requests blocks (HTTP 429 error).',
    btnReset: 'Reset'
  },
  id: {
    appName: 'AI Subtitle Translator',
    appDesc: 'AI Penerjemah subtitle dan teks yang cepat, akurat, online, dan gratis.',
    userGuideBtn: 'Panduan Pengguna',
    donateBtn: 'Traktir Cendol',
    contactBtn: 'Kontak',
    contactTitle: 'Kontak & Dukungan Pengembang',
    contactDesc: 'Punya kritik, saran fitur, atau butuh bantuan? Hubungi kami melalui saluran resmi berikut.',
    contactEmail: 'Alamat Email',
    contactGithub: 'Repositori GitHub',
    contactCopyEmail: 'Salin Email',
    contactEmailCopied: 'Alamat email disalin ke papan klip!',
    contactFormTitle: 'Kirim Pesan',
    contactFormName: 'Nama Anda',
    contactFormMessage: 'Pesan',
    contactFormSubmit: 'Kirim Pesan',
    languageLabel: 'Bahasa UI',
    themeLabel: 'Tema',
    backToAppBtn: '← Kembali ke Aplikasi',
    restoreTitle: 'Pulihkan Sesi Sebelumnya?',
    restoreDesc: 'Ditemukan sesi penerjemahan sebelumnya untuk file "{fileName}" ({progress}% selesai). Apakah Anda ingin memulihkan dan meneruskannya?',
    btnRestore: 'Pulihkan Sesi',
    btnDiscard: 'Abaikan',
    configTitle: 'Konfigurasi Translasi',
    labelProvider: 'Penyedia AI',
    labelModel: 'Model API',
    labelTargetLanguage: 'Bahasa Tujuan',
    labelApiKey: 'Kunci API',
    labelSaveCredentials: 'Simpan Kredensial & API Key',
    guidelinesTitle: 'Panduan Tambahan Terjemahan',
    guidelinesDesc: 'Aturan khusus gaya bahasa akan digabungkan dengan pedoman bawaan Netflix/standar.',
    placeholderCustomInstructions: 'Contoh: Terjemahkan bahasa gaul ke bahasa gaul anak muda zaman sekarang. Buat terjemahan puitis...',
    uploadTitle: 'Unggah File Subtitle / Teks Kustom',
    uploadPlaceholder: 'Pilih file subtitle SRT, VTT, ASS atau file PLAIN TXT untuk diterjemahkan',
    uploadDragDrop: 'Seret & lepas atau telusuri dari perangkat Anda',
    detectedBlocks: 'Terdeteksi {count} segmen teks',
    detectedSubtitle: 'Terdeteksi {count} blok subtitle',
    formatLabel: 'Format {format}',
    totalLines: 'Total Baris',
    charCount: 'Jumlah Karakter',
    wordCount: 'Jumlah Kata',
    estTokens: 'Estimasi Token',
    progressTitle: 'Kemajuan Penerjemahan',
    etaCompleted: 'Selesai',
    etaCalculating: 'Menghitung...',
    etaPrefix: 'ETA:',
    stopBtn: 'Hentikan Translasi',
    resumeBtn: 'Lanjutkan Translasi',
    startOverBtn: 'Mulai Ulang',
    startBtn: 'Mulai Translasi',
    processingTitle: 'Memproses...',
    blocksLabel: 'Blok Subtitle / Baris',
    tableOriginal: 'Teks Asli',
    tableTranslation: 'Terjemahan',
    tableStatus: 'Status',
    tableAction: 'Aksi',
    actionRetry: 'Coba Lagi',
    actionCopied: 'Disalin!',
    actionCopy: 'Salin Konten',
    actionDownload: 'Unduh Subtitle',
    actionDownloadBilingual: 'Download Bilingual',
    searchPlaceholder: 'Cari teks asli atau terjemahan...',
    errEmptyKey: 'Masukkan API Key terlebih dahulu untuk memulai penerjemahan.',
    errNoFile: 'Unggah file subtitle terlebih dahulu.',
    errEmptyFile: 'File yang diunggah kosong (0 bytes). Silakan unggah file subtitle/teks yang valid.',
    errInvalidFormat: 'Format file tidak valid atau tidak didukung. Tidak ada blok teks/subtitle yang bisa diekstrak.',
    successRestored: 'Sesi berhasil dipulihkan!',
    alertBatchError: 'Gagal menerjemahkan blok ini. Klik coba lagi untuk menjalankan kembali.',
    alertFinishedHeader: 'Penerjemahan Selesai',
    alertFinishedDesc: 'File Anda berhasil diterjemahkan. Anda dapat mengunduh file hasil atau menyalin kontennya ke papan klip.',
    labelGeminiKeyFree: 'Kunci API Gemini (Gratis)',
    labelGroqKeyFree: 'Kunci API Groq (Gratis)',
    labelGeminiKey: 'Kunci API Gemini',
    labelOpenAIKey: 'Kunci API OpenAI',
    labelGroqKey: 'Kunci API Groq',
    placeholderGeminiFree: 'Kunci API Gemini Gratis Aktif (Tidak perlu input)',
    placeholderGroqFree: 'Kunci API Groq Gratis Aktif (Tidak perlu input)',
    placeholderEnterGemini: 'Masukkan Kunci API Gemini Anda',
    placeholderEnterOpenAI: 'Masukkan Kunci API OpenAI Anda (sk-...)',
    placeholderEnterGroq: 'Masukkan Kunci API Groq Anda (gsk_...)',
    labelSaveApiKey: 'Simpan API key di browser ini',
    customStyleTitle: 'Kustomisasi Gaya Terjemahan (Opsional)',
    customStylePlaceholder: 'contoh: Gunakan bahasa gaul santai, pertahankan penamaan/istilah game, batasi panjang kalimat agar pendek, formal, percakapan alami, profesional seperti terjemahan subtitle streaming resmi, pertahankan makna asli, puitis, dll.',
    rateLimitTitle: 'Regulasi API & Batching (Cegah Limit)',
    labelBatchSize: 'Ukuran Batch',
    labelCooldown: 'Jeda Cooldown Antar Batch',
    infoBatchSize: 'Ukuran batch yang lebih kecil membantu menjaga batas token per menit (TPM) untuk Groq atau skema gratis.',
    infoCooldown: 'Interval jeda otomatis untuk mencegah pemblokiran akibat melebihi batas maksimum permintaan (error HTTP 429).',
    btnReset: 'Atur Ulang'
  }
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
    return AIProvider.GROQ_FREE;
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
    return PROVIDER_MODELS[AIProvider.GROQ_FREE][0].value;
  });

  const [targetLang, setTargetLang] = useState('Indonesian');
  const [customInstructions, setCustomInstructions] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [originalBlocks, setOriginalBlocks] = useState<SRTBlock[]>([]);
  const [subtitleFormat, setSubtitleFormat] = useState<'srt' | 'vtt' | 'ass' | 'txt'>('srt');
  const [originalRawLines, setOriginalRawLines] = useState<string[]>([]);

  // Localization and views state
  const [uiLang, setUiLang] = useState<'en' | 'id'>(() => {
    return (localStorage.getItem('ui_lang') as 'en' | 'id') || 'en';
  });
  const [currentView, setCurrentView] = useState<'app' | 'guide' | 'contact' | 'donate'>('app');
  const [savedSession, setSavedSession] = useState<any | null>(null);

  // Popovers (Custom Dropdowns) States
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  // Contact view interactive states
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('alrosyid24@gmail.com');
    setIsEmailCopied(true);
    setTimeout(() => setIsEmailCopied(false), 2000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;

    const recipient = 'alrosyid24@gmail.com';
    const emailSubject = uiLang === 'en' 
      ? `AI Subtitle Translator Feedback - ${contactName || 'Anonymous'}` 
      : `Masukan AI Subtitle Translator - ${contactName || 'Tanpa Nama'}`;
    const emailBody = uiLang === 'en'
      ? `Name: ${contactName || 'Anonymous'}\n\nMessage:\n${contactMessage}`
      : `Nama: ${contactName || 'Tanpa Nama'}\n\nPesan:\n${contactMessage}`;

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactMessage('');
      setContactSubmitted(false);
    }, 4500);
  };

  const t = LOCALES[uiLang];

  const renderLanguageDropdown = () => {
    return (
      <div className="relative text-left" ref={langRef}>
        <button
          id="lang-dropdown-trigger"
          type="button"
          onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-gray-200/50 dark:border-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-sm"
        >
          <Languages className="w-3.5 h-3.5 text-blue-500" />
          <span>{uiLang === 'en' ? 'English' : 'Indonesia'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-205 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isLangDropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden z-50 animate-fade-in divide-y divide-gray-100 dark:divide-slate-800/40">
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {t.languageLabel}
            </div>
            <button
              type="button"
              onClick={() => {
                setUiLang('en');
                localStorage.setItem('ui_lang', 'en');
                setIsLangDropdownOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-medium transition flex items-center justify-between ${
                uiLang === 'en'
                  ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>English</span>
              {uiLang === 'en' && <Check className="w-3.5 h-3.5 text-blue-500" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setUiLang('id');
                localStorage.setItem('ui_lang', 'id');
                setIsLangDropdownOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-medium transition flex items-center justify-between ${
                uiLang === 'id'
                  ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>Indonesia</span>
              {uiLang === 'id' && <Check className="w-3.5 h-3.5 text-blue-500" />}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderThemeDropdown = (align: 'left' | 'right' = 'right') => {
    return (
      <div className="relative text-left" ref={themeRef}>
        <button
          id="theme-dropdown-trigger"
          type="button"
          onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-gray-200/50 dark:border-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-sm"
        >
          {theme === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Monitor className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="capitalize text-xs">
            {theme === 'light' ? (uiLang === 'en' ? 'Light' : 'Terang') : theme === 'dark' ? (uiLang === 'en' ? 'Dark' : 'Gelap') : (uiLang === 'en' ? 'System' : 'Sistem')}
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-205 ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isThemeDropdownOpen && (
          <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-40 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden z-50 animate-fade-in divide-y divide-gray-100 dark:divide-slate-800/40`}>
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {t.themeLabel}
            </div>
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                setIsThemeDropdownOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-medium transition flex items-center justify-between ${
                theme === 'light'
                  ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                {uiLang === 'en' ? 'Light' : 'Terang'}
              </span>
              {theme === 'light' && <Check className="w-3.5 h-3.5 text-blue-500" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                setIsThemeDropdownOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-medium transition flex items-center justify-between ${
                theme === 'dark'
                  ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                {uiLang === 'en' ? 'Dark' : 'Gelap'}
              </span>
              {theme === 'dark' && <Check className="w-3.5 h-3.5 text-blue-500" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme('system');
                setIsThemeDropdownOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-medium transition flex items-center justify-between ${
                theme === 'system'
                  ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                {uiLang === 'en' ? 'System' : 'Sistem'}
              </span>
              {theme === 'system' && <Check className="w-3.5 h-3.5 text-blue-500" />}
            </button>
          </div>
        )}
      </div>
    );
  };

  const canResume = useMemo(() => {
    return !state.isProcessing && state.currentIndex > 0 && state.currentIndex < originalBlocks.length;
  }, [state.isProcessing, state.currentIndex, originalBlocks.length]);

  // Load saved session on mount
  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('translation_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (parsed && parsed.originalBlocks && parsed.originalBlocks.length > 0) {
          setSavedSession(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to parse saved session', err);
    }
  }, []);

  // Compute subtitle statistics
  const metrics = useMemo(() => {
    if (originalBlocks.length === 0) {
      return { totalLines: 0, charCount: 0, wordCount: 0, estTokens: 0 };
    }
    const totalLines = originalBlocks.length;
    let charCount = 0;
    let wordCount = 0;
    
    for (const b of originalBlocks) {
      const text = b.originalText || b.text || '';
      charCount += text.length;
      wordCount += text.split(/\s+/).filter(Boolean).length;
    }
    
    const estTokens = Math.ceil(charCount / 4);
    
    return { totalLines, charCount, wordCount, estTokens };
  }, [originalBlocks]);

  // Compute real-time ETA calculation
  const etaDisplay = useMemo(() => {
    if (!state.isProcessing || state.progress === 100) return null;
    const remainingBlocks = originalBlocks.length - state.currentIndex;
    if (remainingBlocks <= 0) return null;

    const remainingBatches = Math.ceil(remainingBlocks / batchSize);
    
    // Estimate avg AI response time as ~1.8 seconds per batch + custom back-off delay interval
    const avgResponseTimeSec = 1.8; 
    const delaySec = delay / 1000;
    
    const totalEstSeconds = Math.ceil(remainingBatches * (avgResponseTimeSec + delaySec));
    
    if (totalEstSeconds < 60) {
      return `${totalEstSeconds}s`;
    }
    const minutes = Math.floor(totalEstSeconds / 60);
    const seconds = totalEstSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }, [state.isProcessing, state.progress, state.currentIndex, originalBlocks.length, batchSize, delay]);

  const handleRestoreSession = () => {
    if (!savedSession) return;
    try {
      setOriginalBlocks(savedSession.originalBlocks || []);
      setOriginalRawLines(savedSession.originalRawLines || []);
      setSubtitleFormat(savedSession.subtitleFormat || 'srt');
      setCustomInstructions(savedSession.customInstructions || '');
      setTargetLang(savedSession.targetLang || 'Indonesian');
      setFile({ name: savedSession.fileName } as File);
      
      setState({
        isProcessing: false,
        progress: savedSession.progress || 0,
        currentIndex: savedSession.currentIndex || 0,
        totalBlocks: (savedSession.originalBlocks || []).length,
        translatedBlocks: savedSession.translatedBlocks || [],
        error: null
      });
      
      setSavedSession(null);
    } catch (err) {
      console.error('Error during restore:', err);
    }
  };

  const handleDiscardSession = () => {
    localStorage.removeItem('translation_session');
    setSavedSession(null);
  };

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
      if (selectedFile.size === 0) {
        const errMsg = uiLang === 'en' ? LOCALES.en.errEmptyFile : LOCALES.id.errEmptyFile;
        setState(prev => ({
          ...prev,
          error: errMsg,
          translatedBlocks: [],
          progress: 0,
          currentIndex: 0,
          totalBlocks: 0
        }));
        setFile(null);
        setOriginalBlocks([]);
        setOriginalRawLines([]);
        return;
      }

      try {
        const text = await selectedFile.text();
        const { blocks, format, rawLines } = parseSubtitle(text, selectedFile.name);

        if (blocks.length === 0) {
          const errMsg = uiLang === 'en' ? LOCALES.en.errInvalidFormat : LOCALES.id.errInvalidFormat;
          setState(prev => ({
            ...prev,
            error: errMsg,
            translatedBlocks: [],
            progress: 0,
            currentIndex: 0,
            totalBlocks: 0
          }));
          setFile(null);
          setOriginalBlocks([]);
          setOriginalRawLines([]);
          return;
        }

        setFile(selectedFile);
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
      } catch (err: any) {
        setState(prev => ({
          ...prev,
          error: `Failed to read file: ${err.message || 'Unknown error'}`
        }));
      }
    }
  };

  const startTranslation = async (resume: boolean = false) => {
    const isFreeProvider = provider === AIProvider.GEMINI_FREE || provider === AIProvider.GROQ_FREE;
    if (!isFreeProvider && !apiKey) {
      const errMsg = uiLang === 'en' ? LOCALES.en.errEmptyKey : LOCALES.id.errEmptyKey;
      setState(prev => ({ ...prev, error: errMsg }));
      return;
    }
    if (originalBlocks.length === 0) {
      const errMsg = uiLang === 'en' ? LOCALES.en.errNoFile : LOCALES.id.errNoFile;
      setState(prev => ({ ...prev, error: errMsg }));
      return;
    }

    stopRef.current = false;
    setRetryAlert(null);
    
    // Initialize full size list if empty or reset, or starting a new run from scratch
    let currentTranslatedList = [...state.translatedBlocks];
    if (!resume || currentTranslatedList.length !== originalBlocks.length) {
      currentTranslatedList = originalBlocks.map(b => ({
        ...b,
        text: '',
        status: 'pending' as const,
        error: null
      }));
    }

    const startIdx = resume ? state.currentIndex : 0;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      currentIndex: startIdx, 
      translatedBlocks: currentTranslatedList,
      progress: resume ? prev.progress : 0 
    }));

    const total = originalBlocks.length;

    try {
      for (let i = startIdx; i < total; i += batchSize) {
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

        // Write checkpoint save to localStorage
        try {
          localStorage.setItem('translation_session', JSON.stringify({
            translatedBlocks: currentTranslatedList,
            currentIndex: endIndex,
            progress: newProgress,
            originalBlocks,
            originalRawLines,
            subtitleFormat,
            fileName: file?.name || 'subtitle.srt',
            customInstructions,
            targetLang
          }));
        } catch (saveErr) {
          console.error('Error writing translation session checkpoint:', saveErr);
        }

        if (endIndex >= total) {
          try {
            localStorage.removeItem('translation_session');
          } catch (cleanErr) {
            console.error('Error cleaning translation session:', cleanErr);
          }
        }

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
    try {
      localStorage.removeItem('translation_session');
    } catch (e) {}
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

  const downloadBilingualSubtitles = () => {
    const content = stringifySubtitle(getProcessedBlocksWithFallback(), subtitleFormat, originalRawLines, true);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = subtitleFormat;
    a.download = `bilingual_${file?.name ? file.name.substring(0, file.name.lastIndexOf('.')) : 'subtitle'}.${extension}`;
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
      {currentView === 'guide' ? (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button 
              id="guide-back-btn"
              onClick={() => setCurrentView('app')}
              className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 font-bold rounded-xl text-xs flex items-center gap-1.5 self-start transition shadow-sm"
            >
              {t.backToAppBtn}
            </button>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {renderLanguageDropdown()}
              {renderThemeDropdown()}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-6 mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                {uiLang === 'en' ? 'AI Subtitle Translator - User Guide' : 'AI Subtitle Translator - Panduan Pengguna'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {uiLang === 'en' 
                  ? 'Learn how to translate subtitles and text documents seamlessly using advanced language models.' 
                  : 'Pelajari cara menerjemahkan file subtitle dan teks secara lancar menggunakan model bahasa mutakhir.'}
              </p>
            </div>

            <div className="space-y-8 text-sm text-slate-600 dark:text-slate-300">
              {/* 1. How it works */}
              <section>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                  {uiLang === 'en' ? 'How it Works' : 'Cara Kerja Aplikasi'}
                </h3>
                <p className="leading-relaxed">
                  {uiLang === 'en' 
                    ? 'Our translation engine parses large files line-by-line or subtitle-by-subtitle. It splits them into optimized "batches" of segments and sends them sequentially to high-performance AI models (Gemini, Llama, and GPT). This is extremely efficient and helps manage character throughput without overloading API rates.'
                    : 'Sistem penerjemah akan mengurai file besar baris-demi-baris atau subtitle-demi-subtitle. Teks tersebut kemudian dipecah menjadi beberapa "batch" kecil yang dioptimalkan lalu dikirim secara berurutan ke model AI berkinerja tinggi (Gemini, Llama, dan GPT). Proses ini membantu mengelola muatan karakter dan mencegah kegagalan batas API.'}
                </p>
              </section>

              {/* 2. Supported formats */}
              <section>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                  {uiLang === 'en' ? 'Supported File Formats' : 'Format File yang Didukung'}
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
                  <li><strong>.SRT</strong> - {uiLang === 'en' ? 'Standard DVD/Movie Subtitles (with indices and comma-split timecodes).' : 'Format standar subtitle film (dengan nomor urut dan pembatas waktu koma).'}</li>
                  <li><strong>.VTT</strong> - {uiLang === 'en' ? 'Web Video Text Tracks (similar to SRT, with optional file headers and dot-separated timecodes).' : 'Format teks video web (mirip SRT tetapi mendukung header file dan pemisah waktu titik).'}</li>
                  <li><strong>.ASS / .SSA</strong> - {uiLang === 'en' ? 'Advanced SubStation Alpha (highly structured styling format, we preserve dialogues positions and style formatting codes perfectly).' : 'Advanced SubStation Alpha (format berstruktur tinggi, kami mempertahankan posisi dialog dan kode efek gaya visual secara presisi).'}</li>
                  <li><strong>.TXT</strong> - {uiLang === 'en' ? 'Plain Text documents (we parse and translate line-by-line, maintaining blank rows layout, perfect for poetry, lyrics, and documents).' : 'Dokumen teks biasa (kami menerjemahkan baris-demi-baris dan mempertahankan baris kosong, sangat cocok untuk puisi, lirik lagu, dan naskah).'}</li>
                </ul>
              </section>

              {/* 3. Free API vs Custom Keys */}
              <section>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                  {uiLang === 'en' ? 'Free API Key vs Custom API Keys' : 'Kunci API Gratis vs Kunci API Kustom'}
                </h3>
                <p className="leading-relaxed mb-2">
                  {uiLang === 'en'
                    ? 'We offer built-in free-tier models (Groq Llama & Google Gemini) so you can translate subtitles on-the-fly without needing private credentials. Simply select a (Free API Key) provider.'
                    : 'Kami menyediakan pilihan model gratis bawaan (Groq Llama & Google Gemini) sehingga Anda bisa menerjemahkan file secara langsung tanpa perlu memasukkan kredensial pribadi. Tinggal pilih penyedia berlabel (Free API Key).'}
                </p>
                <p className="leading-relaxed">
                  {uiLang === 'en'
                    ? 'For massive subtitle files or specialized high-throughput tasks, we recommend using a (Custom Key) provider and providing your own Google Cloud Gemini key, OpenAI sk-... key, or Groq gsk_... key. This grants you high limits without rate regulation throttling.'
                    : 'Untuk file subtitle berukuran besar atau tugas berkecepatan tinggi, kami menyarankan Anda menggunakan opsi (Custom Key) dan memasukkan sandi API pribadi Anda sendiri (Google Cloud Gemini, OpenAI sk-..., atau Groq gsk_...). Ini memberikan performa tanpa batasan laju server utama.'}
                </p>
              </section>

              {/* 4. Bilingual Output Option */}
              <section>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">4</span>
                  {uiLang === 'en' ? 'Bilingual Translation Feature' : 'Fitur Unduh Dwibahasa (Bilingual)'}
                </h3>
                <p className="leading-relaxed">
                  {uiLang === 'en'
                    ? 'When downloading, clicking "Download Bilingual" merges both languages in each subtitle block. Bar 1 will be displayed in the original language, while Bar 2 is shown in the translated language. This is incredibly helpful for language learners, dual-subtitle media, or checking proofreads.'
                    : 'Saat mengunduh hasil terjemahan, mengeklik "Download Bilingual" akan menggabungkan kedua bahasa di setiap blok subtitle yang sama. Baris pertama menampilkan teks asli, dan baris kedua menampilkan teks terjemahan baru. Fitur ini sangat berguna bagi pelajar bahasa baru, penayang film dwibahasa, atau saat mengoreksi draf terjemahan.'}
                </p>
              </section>

              {/* 5. Custom Guidelines */}
              <section>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">5</span>
                  {uiLang === 'en' ? 'Tips for Custom Guidelines' : 'Tips Penggunaan Panduan Kustom'}
                </h3>
                <p className="leading-relaxed mb-2">
                  {uiLang === 'en'
                    ? 'You can direct the subtle nuances, slangs, or tone of the translation through the styling input.'
                    : 'Anda dapat mengatur nuansa, bahasa gaul, atau nada terjemahan melalui kolom Panduan Tambahan.'}
                </p>
                <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                  <li><strong>{uiLang === 'en' ? 'Slang Adaptations:' : 'Adaptasi Gaul:'}</strong> "{uiLang === 'en' ? 'Translate slang characters to modern informal speech' : 'Terjemahkan kosakata santai ke bahasa kekinian'}"</li>
                  <li><strong>{uiLang === 'en' ? 'Tone Direction:' : 'Gaya Nada:'}</strong> "{uiLang === 'en' ? 'Keep it highly emotional, poetic, and dramatic for horror and drama shows' : 'Buat sangat emosional, puitis, dan dramatis untuk genre horor/drama'}"</li>
                  <li><strong>{uiLang === 'en' ? 'Terminology Lock:' : 'Kunci Istilah:'}</strong> "{uiLang === 'en' ? 'Maintain terms like "Captain" and "Mission Control" exactly as they are.' : 'Biarkan istilah seperti "Airlock" dan "Supercharger" tetap dalam bahasa Inggris.'}"</li>
                </ul>
              </section>

              {/* 6. Technical Safety & Local Storage */}
              <section>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">6</span>
                  {uiLang === 'en' ? 'Strict Technical Safety / Autosaver' : 'Keamanan Teknis & Auto-Save'}
                </h3>
                <p className="leading-relaxed">
                  {uiLang === 'en'
                    ? 'This application conforms strictly to subtitle structures. All critical structural symbols, such as "-->", ASS styles, or numbering keys, are robustly secured and isolated before the request blocks are compiled. Additionally, an automatic Session Saver keeps your progress in localStorage. If you experience an accidental tab reload or browser close, simply click "Restore Session" on startup to pick up exactly where you left off.'
                    : 'Aplikasi ini didesain aman terhadap integritas subtitle. Semua simbol struktural kritis seperti tanda panah "-->", header ASS, atau indeks urutan diisolasi terlebih dahulu sebelum diserahkan ke AI. Ditambah lagi, fitur Auto-Save akan mencatat kemajuan di localStorage secara real-time. Jika tab browser Anda tidak sengaja tertutup, silakan klik tombol "Pulihkan Sesi" saat membuka kembali aplikasi untuk melanjutkan pekerjaan tanpa mengulang.'}
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-center">
              <button 
                id="guide-continue-btn"
                onClick={() => setCurrentView('app')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-50/50 dark:shadow-none"
              >
                {uiLang === 'en' ? 'Continue translating' : 'Lanjutkan menerjemahkan'}
              </button>
            </div>
          </div>
        </div>
      ) : currentView === 'contact' ? (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button 
              id="contact-back-btn"
              onClick={() => setCurrentView('app')}
              className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 font-bold rounded-xl text-xs flex items-center gap-1.5 self-start transition shadow-sm"
            >
              {t.backToAppBtn}
            </button>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {renderLanguageDropdown()}
              {renderThemeDropdown()}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-6 mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-500 animate-pulse" />
                {t.contactTitle}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {t.contactDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Direct Links & Info */}
              <div className="space-y-6">
                {/* Official Email */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider mb-1">
                      {t.contactEmail}
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {uiLang === 'en' ? 'Direct Email Support' : 'Dukungan Email Langsung'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {uiLang === 'en' 
                        ? 'Submit custom enquiries, feedback, or report technical difficulties.' 
                        : 'Kirim masukan khusus, saran, atau laporkan kesulitan teknis.'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <a
                      href="mailto:alrosyid24@gmail.com"
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 w-full shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{uiLang === 'en' ? 'Contact in Mail Client' : 'Hubungi via Aplikasi Email'}</span>
                    </a>
                  </div>
                </div>

                {/* Github Source Code */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider mb-2">
                      {t.contactGithub}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed block mb-4">
                      Check out the source code, watch progress, open issues or contribute to the project on GitHub.
                    </span>
                  </div>
                  <div className="mt-2 text-left">
                    <a
                      href="https://github.com/jonijonna23-source/ai-subtitle-translator"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                      <span>GitHub Repo</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Mini Contact Form */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-500" />
                  {t.contactFormTitle}
                </h3>
                
                {contactSubmitted ? (
                  <div className="py-12 text-center space-y-3 animate-fade-in duration-200">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {uiLang === 'en' ? 'Message Sent Successfully!' : 'Pesan Berhasil Dikirim!'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {uiLang === 'en' ? 'Thank you for reaching out. We will read your feedback.' : 'Terima kasih atas masukannya. Kami akan membaca pesan Anda.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {t.contactFormName}
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={uiLang === 'en' ? 'Your Name' : 'Nama Anda'}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {t.contactFormMessage} *
                      </label>
                      <textarea
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder={uiLang === 'en' ? 'Write your notes or feedback here...' : 'Tulis catatan atau saran Anda di sini...'}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-xs resize-none"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      {t.contactFormSubmit}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-center">
              <button 
                onClick={() => setCurrentView('app')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-50/50 dark:shadow-none"
              >
                {uiLang === 'en' ? 'Continue translating' : 'Lanjutkan menerjemahkan'}
              </button>
            </div>
          </div>
        </div>
      ) : currentView === 'donate' ? (
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* Header & Navigasi */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button 
              id="donate-back-btn"
              onClick={() => setCurrentView('app')}
              className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 font-bold rounded-xl text-xs flex items-center gap-1.5 self-start transition shadow-sm"
            >
              {uiLang === 'en' ? '← Back to Application' : '← Kembali ke Aplikasi'}
            </button>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {renderLanguageDropdown()}
              {renderThemeDropdown()}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-10">
            {/* Title Header with Heart Icon */}
            <div className="text-center border-b border-gray-100 dark:border-slate-800 pb-6">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 fill-rose-500 animate-pulse" />
              </div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent tracking-tight">
                {uiLang === 'en' ? 'Support This Project' : 'Dukung Proyek Ini'}
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto leading-relaxed">
                {uiLang === 'en' 
                  ? 'Help keep this tool 100% free, up-to-date, and continually improving for everyone.' 
                  : 'Bantu jaga alat ini tetap 100% gratis, selalu up-to-date, dan terus berkembang untuk semua orang.'}
              </p>
            </div>

            {/* Seksi 'Why Donate?' (3 Cards) */}
            <div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">
                  {uiLang === 'en' ? 'Why Donate?' : 'Mengapa Berdonasi?'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: 100% Free & No Ads */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-default flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {uiLang === 'en' ? '100% Free & No Ads' : '100% Gratis & Tanpa Iklan'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en'
                      ? 'This tool is completely free to use and will always be free from annoying advertisements.'
                      : 'Alat ini sepenuhnya gratis untuk digunakan dan akan selalu bebas dari gangguan iklan.'}
                  </p>
                </div>

                {/* Card 2: Appreciate the Effort */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-default flex flex-col items-center text-center flex-1">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {uiLang === 'en' ? 'Appreciate the Effort' : 'Apresiasi Kerja Keras'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en'
                      ? "Treat me to a cup of coffee! Your tip is a great way to say 'thank you' for the time and effort spent building this tool."
                      : "Traktir saya segelas cendol! Tip Anda adalah bentuk ucapan terima kasih atas waktu dan tenaga yang dicurahkan untuk membangun alat ini."}
                  </p>
                </div>

                {/* Card 3: Maintenance & Updates */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-default flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {uiLang === 'en' ? 'Maintenance & Updates' : 'Pemeliharaan & Pembaruan'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Your support keeps me highly motivated to fix bugs, maintain the code, and add cool new features in the future.'
                      : 'Dukungan Anda sangat memotivasi saya untuk terus memperbaiki bug, merawat kode, dan menambah fitur-fitur baru di masa depan.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Donation Card (Trakteer) */}
            <div className="max-w-md mx-auto py-2">
              <div className="p-6 sm:p-8 rounded-2xl border border-rose-100 dark:border-rose-950/50 bg-rose-50/20 dark:bg-rose-950/10 text-center flex flex-col justify-between shadow-md">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#be2c2c] text-white rounded-full text-[10px] font-bold tracking-wider uppercase mb-3 shadow">
                    Trakteer
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200 mb-2">
                    Trakteer (Cendol/Tip)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {uiLang === 'en' 
                      ? 'Support using local Indonesian payment methods (QRIS, E-Wallet, Bank Transfer) or international credit/debit.' 
                      : 'Kirim dukungan menggunakan metode pembayaran instan (QRIS, GoPay, OVO, Dana, LinkAja, atau Transfer Bank).'}
                  </p>
                </div>
                
                <div className="space-y-6">
                  <a
                    href="https://trakteer.id/alrosyid24/tip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#be2c2c] hover:bg-[#a12323] text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-md shadow-rose-900/10"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>{uiLang === 'en' ? 'Support on Trakteer' : 'Dukung via Trakteer'}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                  
                  {/* Thank You Note */}
                  <div className="pt-4 border-t border-rose-100/30 dark:border-rose-950/30">
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      {uiLang === 'en' 
                        ? '“Thank you so much for your kindness! Your support, no matter the amount, keeps this running, and motivates me to keep updating and maintaining this tool for everyone.”' 
                        : '“Terima kasih banyak atas kebaikan Anda! Dukungan Anda, berapa pun jumlahnya, sangat berarti! Serta memotivasi saya untuk terus memperbarui dan merawat aplikasi ini untuk kita semua. Cendolnya, Gan!”'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seksi 'Other Ways to Support' (3 Cards) */}
            <div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">
                  {uiLang === 'en' ? 'Other Ways to Support' : 'Cara Lain untuk Mendukung'}
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                  {uiLang === 'en' ? 'Every non-monetary effort goes a really long way, too.' : 'Setiap kontribusi non-materi juga sangat berarti bagi kami.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Share the App */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-default flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {uiLang === 'en' ? 'Share the App' : 'Bagikan Aplikasi'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Spread the word to content creators who might need this.'
                      : 'Bagikan ke kreator konten yang mungkin membutuhkan alat ini.'}
                  </p>
                </div>

                {/* Card 2: Star on GitHub */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-default flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {uiLang === 'en' ? 'Star on GitHub' : 'Bintang di GitHub'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Give a star on our repository to show your support.'
                      : 'Berikan bintang di repositori kami sebagai bentuk dukungan.'}
                  </p>
                </div>

                {/* Card 3: Give Feedback */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-default flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/40 text-teal-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {uiLang === 'en' ? 'Give Feedback' : 'Kirim Masukan'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Report bugs or suggest features to make this tool better.'
                      : 'Laporkan bug atau sarankan fitur untuk membuat alat ini lebih baik.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Back Button */}
            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-center">
              <button 
                onClick={() => setCurrentView('app')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-50/50 dark:shadow-none text-xs sm:text-sm"
              >
                {uiLang === 'en' ? 'Back to application' : 'Kembali ke aplikasi'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          {/* Theme and Header Utility Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-8">
            <div className="text-center md:text-left w-full md:w-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-500 tracking-tight flex items-center justify-center md:justify-start gap-2">
                <img 
                  src="https://raw.githubusercontent.com/jonijonna23-source/ai-subtitle-translator/22c45a5beba19d9b7cb18990e03fce838f4047e6/cc_16913599.png" 
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain" 
                  alt="Closed Captions Icon" 
                  referrerPolicy="no-referrer"
                />
                <span>{t.appName}</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 max-w-xl mx-auto md:mx-0">
                {t.appDesc}
              </p>
            </div>

            {/* Utility Controllers (Theme, Language, User Guide, Donation, Contact) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center md:justify-end w-full md:w-auto">
              
              {/* Coffee / Support Donation Button */}
              <button
                id="donate-btn"
                onClick={() => setCurrentView('donate')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm group"
              >
                <Heart className="w-4 h-4 text-red-500 fill-red-500 transition-transform group-hover:scale-125 duration-250 animate-pulse" />
                <span>{t.donateBtn}</span>
              </button>

              {/* User Guide Button */}
              <button
                id="guide-btn"
                onClick={() => setCurrentView('guide')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-gray-200/50 dark:border-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-sm"
              >
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>{t.userGuideBtn}</span>
              </button>

              {/* Contact Button */}
              <button
                id="contact-btn"
                onClick={() => setCurrentView('contact')}
                className={`px-4 py-2 border rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                  currentView === 'contact'
                    ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border-gray-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-550 dark:text-blue-400" />
                <span>{t.contactBtn}</span>
              </button>

              {/* Language Custom Dropdown */}
              {renderLanguageDropdown()}

              {/* Theme Custom Dropdown */}
              {renderThemeDropdown()}
            </div>
          </div>

          {/* Recovery Dialog Banner */}
          {savedSession && (
            <div id="session-restore-banner" className="mb-6 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900/40 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in duration-200">
              <div className="flex items-start gap-4">
                <Sparkles className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0 animate-pulse" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.restoreTitle}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-semibold">
                    {t.restoreDesc.replace('{fileName}', savedSession.fileName).replace('{progress}', String(savedSession.progress))}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={handleRestoreSession}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex-1 md:flex-none shadow-md shadow-blue-500/10"
                >
                  {t.btnRestore}
                </button>
                <button
                  onClick={handleDiscardSession}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex-1 md:flex-none"
                >
                  {t.btnDiscard}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors duration-200">
            <div className="p-8">
          
          {/* Config Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-slate-500" />
                  {t.labelProvider}
                </label>
                <select 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value as AIProvider)}
                  disabled={state.isProcessing}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-sm font-semibold selection:bg-blue-100"
                >
                  <option value={AIProvider.GROQ_FREE}>{`Groq AI (${uiLang === 'en' ? 'Free API Key' : 'Kunci API Gratis'})`}</option>
                  <option value={AIProvider.GEMINI_FREE}>{`Google Gemini (${uiLang === 'en' ? 'Free API Key' : 'Kunci API Gratis'})`}</option>
                  <option value={AIProvider.GEMINI}>{`Google Gemini (${uiLang === 'en' ? 'Custom Key' : 'Kunci Kustom'})`}</option>
                  <option value={AIProvider.OPENAI}>{`OpenAI (${uiLang === 'en' ? 'Custom Key' : 'Kunci Kustom'})`}</option>
                  <option value={AIProvider.GROQ}>{`Groq AI (${uiLang === 'en' ? 'Custom Key' : 'Kunci Kustom'})`}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-slate-500" />
                  {t.labelModel}
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
                  {t.labelTargetLanguage}
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
                    ? t.labelGeminiKeyFree 
                    : provider === AIProvider.GROQ_FREE 
                      ? t.labelGroqKeyFree 
                      : provider === AIProvider.GEMINI 
                        ? t.labelGeminiKey 
                        : provider === AIProvider.OPENAI 
                          ? t.labelOpenAIKey 
                          : t.labelGroqKey}
                </label>
                <input 
                  type="password" 
                  value={provider === AIProvider.GEMINI_FREE || provider === AIProvider.GROQ_FREE ? "" : apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={state.isProcessing || provider === AIProvider.GEMINI_FREE || provider === AIProvider.GROQ_FREE}
                  placeholder={
                    provider === AIProvider.GEMINI_FREE
                      ? t.placeholderGeminiFree
                      : provider === AIProvider.GROQ_FREE
                        ? t.placeholderGroqFree
                        : provider === AIProvider.GEMINI 
                          ? t.placeholderEnterGemini 
                          : provider === AIProvider.OPENAI 
                            ? t.placeholderEnterOpenAI 
                            : t.placeholderEnterGroq
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
                    className="w-4 h-4 text-blue-655 dark:text-blue-500 border-gray-350 dark:border-slate-750 rounded focus:ring-blue-500 bg-white dark:bg-slate-800 accent-blue-600 cursor-pointer"
                  />
                  <label htmlFor="save-credentials" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    {t.labelSaveApiKey}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  {t.uploadTitle}
                </label>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer bg-gray-50 dark:bg-slate-900/60">
                  <input 
                    type="file" 
                    id="file-upload"
                    accept=".srt,.vtt,.ass,.txt" 
                    onChange={handleFileChange}
                    disabled={state.isProcessing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium block truncate max-w-[250px] sm:max-w-full mx-auto px-2">
                      {file ? file.name : t.uploadPlaceholder}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">{t.uploadDragDrop}</span>
                  </div>
                </div>
                {originalBlocks.length > 0 && (
                  <div className="space-y-3">
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        {subtitleFormat === 'txt'
                          ? t.detectedBlocks.replace('{count}', String(originalBlocks.length))
                          : t.detectedSubtitle.replace('{count}', String(originalBlocks.length))}
                      </p>
                      <span className="text-[10px] uppercase bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                        {t.formatLabel.replace('{format}', subtitleFormat.toUpperCase())}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-100/50 dark:bg-slate-900/45 rounded-xl border border-gray-200/30 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in duration-200">
                      <div className="text-center sm:text-left border-r border-gray-200/50 dark:border-slate-800/80 pr-2 last:border-r-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">{t.totalLines}</span>
                        <span className="text-sm font-extrabold text-blue-500 mt-0.5 block">{metrics.totalLines}</span>
                      </div>
                      <div className="text-center sm:text-left sm:border-r border-gray-200/50 dark:border-slate-800/80 sm:px-2 last:border-r-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">{t.charCount}</span>
                        <span className="text-sm font-extrabold text-indigo-500 mt-0.5 block">{metrics.charCount}</span>
                      </div>
                      <div className="text-center sm:text-left border-r border-gray-200/50 dark:border-slate-800/80 px-2 last:border-r-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">{t.wordCount}</span>
                        <span className="text-sm font-extrabold text-teal-500 mt-0.5 block">{metrics.wordCount}</span>
                      </div>
                      <div className="text-center sm:text-left pl-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">{t.estTokens}</span>
                        <span className="text-sm font-extrabold text-purple-500 mt-0.5 block">~ {metrics.estTokens}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Translation Styling Customization */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              {t.customStyleTitle}
            </label>
            <textarea 
              value={customInstructions} 
              onChange={(e) => setCustomInstructions(e.target.value)}
              disabled={state.isProcessing}
              placeholder={t.customStylePlaceholder}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 text-sm resize-none"
            />
          </div>

          {/* API Regulation & Cooldown delay */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-xl p-4 mb-8">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-600 animate-spin-once" />
              {t.rateLimitTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  {t.labelBatchSize}: <span className="font-bold text-blue-600 dark:text-blue-400">{batchSize} {uiLang === 'en' ? 'lines' : 'baris'}</span>
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
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">{t.infoBatchSize}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  {t.labelCooldown}: <span className="font-bold text-blue-600 dark:text-blue-400">{(delay / 1000).toFixed(1)} {uiLang === 'en' ? 'seconds' : 'detik'}</span>
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
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">{t.infoCooldown}</p>
              </div>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            {!state.isProcessing ? (
              canResume ? (
                <>
                  <button 
                    onClick={() => startTranslation(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition flex-[2] shadow-lg shadow-emerald-50/10 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {uiLang === 'en' ? 'Resume Translation' : 'Lanjutkan Terjemahan'}
                  </button>
                  <button 
                    onClick={() => startTranslation(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1 shadow-lg shadow-blue-50/50 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {uiLang === 'en' ? 'Start Over' : 'Mulai dari Awal'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => startTranslation(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition flex-1 shadow-lg shadow-blue-50/50 dark:shadow-none"
                >
                  {uiLang === 'en' ? 'Start Translation' : 'Mulai Terjemahan'}
                </button>
              )
            ) : (
              <button 
                onClick={stopTranslation}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold transition flex-1 shadow-lg shadow-red-50/50 dark:shadow-none"
              >
                {uiLang === 'en' ? 'Stop Processing' : 'Hentikan Proses'}
              </button>
            )}
            <button 
              onClick={resetAll}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition border border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              {t.btnReset}
            </button>
          </div>

          {/* Progress Indicator */}
          {(state.isProcessing || state.progress > 0) && (
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl transition duration-250">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  {state.progress === 100 ? (
                    <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 font-bold" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  )}
                  {state.progress === 100 ? (uiLang === 'en' ? 'Translation Completed' : 'Penerjemahan Selesai') : t.progressTitle}
                </span>
                <div className="flex items-center gap-2">
                  {etaDisplay && (
                    <span className="text-[10px] px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold rounded animate-pulse">
                      {t.etaPrefix} {etaDisplay}
                    </span>
                  )}
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{state.progress}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${state.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-2 font-semibold">
                {state.progress === 100 
                  ? (uiLang === 'en' ? `Done translating ${state.totalBlocks} subtitle blocks!` : `Selesai menerjemahkan ${state.totalBlocks} segmen/blok!`)
                  : (uiLang === 'en' ? `Processing ${state.currentIndex} of ${state.totalBlocks} subtitle blocks...` : `Memproses ${state.currentIndex} dari ${state.totalBlocks} segmen/blok...`)
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
                  {uiLang === 'en' ? 'Live Action Controls' : 'Kontrol Aksi Langsung'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {uiLang === 'en' 
                    ? 'Save or copy your subtitle file dynamically, even while translation processing is in progress.' 
                    : 'Simpan atau salin file subtitle Anda secara dinamis, bahkan saat proses penerjemahan sedang berjalan.'}
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
                      {t.actionCopied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      {t.actionCopy}
                    </>
                  )}
                </button>
                <button 
                  onClick={downloadSubtitles}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 flex-1 sm:flex-none text-xs shadow-md shadow-emerald-100/10"
                >
                  <Download className="w-4 h-4" />
                  {t.actionDownload}
                </button>
                <button 
                  onClick={downloadBilingualSubtitles}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 flex-1 sm:flex-none text-xs shadow-md shadow-blue-500/10"
                >
                  <Download className="w-4 h-4" />
                  {t.actionDownloadBilingual}
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
                  <p className="text-sm text-red-700 font-semibold">{uiLang === 'en' ? 'Error Occurred' : 'Terjadi Kesalahan'}</p>
                  <p className="text-xs text-red-650 mt-1">{state.error}</p>
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
                    {uiLang === 'en' ? 'Subtitle Translation Matrix' : 'Matriks Terjemahan Subtitle'}
                  </h3>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder={uiLang === 'en' ? 'Search by keyword or index...' : 'Cari berdasar kata kunci atau indeks...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-12 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 shadow-sm transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {uiLang === 'en' ? 'CLEAR' : 'BERSIHKAN'}
                    </button>
                  )}
                </div>
              </div>

               {/* SpreadSheet table mimicking the dark navy style of user screenshot */}
              <div className="bg-[#0f172a] rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                <div className={`overflow-x-auto overflow-y-auto transition-all duration-300 ${isExpanded ? 'max-h-[680px]' : 'max-h-[380px]'}`}>
                  <table className="w-full min-w-[800px] text-left border-collapse table-fixed select-none">
                    <thead>
                      <tr className="bg-[#0b1329] text-[11px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                        <th className="w-16 py-3 px-4">ID</th>
                        <th className="w-32 py-3 px-4 text-center">{uiLang === 'en' ? 'Time' : 'Waktu'}</th>
                        <th className="py-3 px-4 w-1/3">{t.tableOriginal}</th>
                        <th className="py-3 px-4 w-1/3">{t.tableTranslation}</th>
                        <th className="w-28 py-3 px-4 text-center">{t.tableStatus}</th>
                        <th className="w-20 py-3 px-4 text-center">{t.tableAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredBlocks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 text-sm font-medium">
                            {uiLang === 'en' 
                              ? 'No matching subtitle blocks found. Try searching for another keyword or index.' 
                              : 'Tidak ada hasil segmen subtitle yang cocok. Coba cari kata kunci atau indeks lain.'}
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
                                      {uiLang === 'en' ? 'Translation Error' : 'Kesalahan Terjemahan'}
                                    </div>
                                    <div className="font-mono opacity-90 break-words leading-relaxed select-text">
                                      {block.error || (uiLang === 'en' ? 'The model encountered an issue rendering this block.' : 'Model mengalami kendala saat menerjemahkan blok ini.')}
                                    </div>
                                  </div>
                                ) : block.status === 'translating' ? (
                                  <div className="flex items-center gap-2 text-sky-400 py-1 text-xs">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>{uiLang === 'en' ? 'Translating...' : 'Menerjemahkan...'}</span>
                                  </div>
                                ) : block.status === 'success' && block.text ? (
                                  <div className="text-blue-100 text-sm font-sans leading-relaxed whitespace-pre-wrap select-text">
                                    {block.text}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs italic">{uiLang === 'en' ? 'Awaiting translation run...' : 'Menunggu antrean terjemahan...'}</span>
                                )}
                              </td>

                              {/* STATUS */}
                              <td className="py-3.5 px-4 text-center border-r border-slate-800/40">
                                {block.status === 'success' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                                    {uiLang === 'en' ? 'Success' : 'Sukses'}
                                  </span>
                                ) : block.status === 'error' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                                    {uiLang === 'en' ? 'Error' : 'Error'}
                                  </span>
                                ) : block.status === 'translating' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/20 uppercase tracking-widest animate-pulse">
                                    {uiLang === 'en' ? 'Translating' : 'Memproses'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest">
                                    {uiLang === 'en' ? 'Pending' : 'Mengantre'}
                                  </span>
                                )}
                              </td>

                              {/* ACTION (Single Retry) */}
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => retrySingleBlock(block.id)}
                                  disabled={state.isProcessing || isRetrying}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition duration-150 disabled:opacity-20 disabled:hover:bg-transparent"
                                  title={uiLang === 'en' ? "Retry translation for this block only" : "Coba lagi terjemahan untuk blok ini saja"}
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
                          {uiLang === 'en' ? 'Collapse table' : 'Sembunyikan tabel'}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                          {uiLang === 'en' ? 'Expand table' : 'Tampilkan seluruh tabel'}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column: Status Statistics */}
                  <div className="flex items-center justify-center sm:justify-end gap-3 text-right">
                    <span className="text-emerald-400">
                      {translatedCount} {uiLang === 'en' ? 'translated' : 'diterjemahkan'}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-rose-400">
                      {errorCount} {uiLang === 'en' ? 'errors' : 'kesalahan'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )}

      <footer className="mt-12 text-center text-slate-400 dark:text-slate-500 text-sm">
        <p>{uiLang === 'en' ? 'AI Subtitle Translator &copy; Jan, 2026. Fast, reliable multi-encoding subtitle translation engine.' : 'AI Subtitle Translator &copy; Jan, 2026. Mesin translasi subtitle multi-encoding yang cepat dan andal.'}</p>
      </footer>
    </div>
  );
};

export default App;

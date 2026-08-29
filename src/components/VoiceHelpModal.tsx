import React, { useState } from 'react';
import { useVoiceControl } from '../context/VoiceControlContext.js';
import {
  Mic,
  Compass,
  MousePointerClick,
  Edit3,
  Volume2,
  Settings,
  Code2,
  Search,
  Check,
  Play,
  X,
  Sparkles,
  Hash,
  Keyboard,
  ArrowRight,
  VolumeX,
  Sliders,
  HelpCircle,
  Copy,
  Cpu,
  Radio,
  Zap,
  ShieldCheck
} from 'lucide-react';

export function VoiceHelpModal() {
  const {
    showHelpModal,
    setShowHelpModal,
    executeCommand,
    isListening,
    toggleListening,
    toggleBadges,
    showBadges,
    engineMode,
    setEngineMode,
    voiceFeedbackEnabled,
    setVoiceFeedbackEnabled,
    speechRate,
    setSpeechRate,
    availableVoices,
    selectedVoiceName,
    setSelectedVoice
  } = useVoiceControl();

  const [activeTab, setActiveTab] = useState<'commands' | 'engines' | 'settings' | 'developer' | 'shortcuts'>('commands');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!showHelpModal) return null;

  const commandCategories = [
    { id: 'all', label: 'All Commands', icon: Sparkles },
    { id: 'navigation', label: 'Navigation', icon: Compass },
    { id: 'interaction', label: 'Actions & Clicks', icon: MousePointerClick },
    { id: 'form', label: 'Forms & Search', icon: Edit3 },
    { id: 'reading', label: 'Read Aloud (TTS)', icon: Volume2 },
    { id: 'system', label: 'System & Badges', icon: Settings },
  ];

  const commandList = [
    // Wake Word & Voice Activation (Auto-ON)
    {
      category: 'system',
      phrase: 'voice command open / voice',
      aliases: ['open voice', 'voice on', 'activate voice', 'start voice', 'turn on voice', 'voice ai', 'voice assistant', 'hey voice'],
      desc: 'Automatically turns Voice AI ON, expands the floating assistant HUD, and begins active continuous listening.'
    },
    {
      category: 'system',
      phrase: 'voice off / close voice',
      aliases: ['turn off voice', 'stop listening', 'pause voice', 'minimize voice', 'hide voice'],
      desc: 'Pauses active speech recognition and minimizes the floating voice assistant.'
    },

    // Navigation
    {
      category: 'navigation',
      phrase: 'go to dashboard',
      aliases: ['open dashboard', 'view roadmap', 'home', 'overview'],
      desc: 'Opens the main learner/trainer/admin dashboard and learning roadmap.'
    },
    {
      category: 'navigation',
      phrase: 'go to courses',
      aliases: ['open courses', 'course catalog', 'browse courses', 'lessons'],
      desc: 'Navigates to the comprehensive course library with filterable competencies.'
    },
    {
      category: 'navigation',
      phrase: 'go to skill gap',
      aliases: ['skill gap analysis', 'view skill gap', 'competency gap', 'readiness'],
      desc: 'Opens the dynamic Target Role skill gap radar and benchmark engine.'
    },
    {
      category: 'navigation',
      phrase: 'go to recommendations',
      aliases: ['open recommendations', 'suggested courses', 'ai courses', 'recs'],
      desc: 'Loads your AI-curated personalized course recommendation sequence.'
    },
    {
      category: 'navigation',
      phrase: 'go to certificates',
      aliases: ['my certificates', 'credentials', 'view certificates', 'diplomas'],
      desc: 'View your earned cryptographically verifiable competency credentials.'
    },
    {
      category: 'navigation',
      phrase: 'go to profile',
      aliases: ['settings', 'target role settings', 'my account'],
      desc: 'Open profile management and change your target career role.'
    },
    {
      category: 'navigation',
      phrase: 'scroll down / scroll up',
      aliases: ['page down', 'scroll to top', 'scroll to bottom'],
      desc: 'Smoothly scrolls the screen viewport up, down, top, or bottom.'
    },
    {
      category: 'navigation',
      phrase: 'go back / go forward',
      aliases: ['navigate back', 'previous page'],
      desc: 'Navigates through browser history stack.'
    },

    // Interaction
    {
      category: 'interaction',
      phrase: 'click [button name]',
      aliases: ['click enroll', 'click start quiz', 'click submit', 'click reset seed'],
      desc: 'Automatically targets and clicks buttons, links, or tabs by text or aria-label.'
    },
    {
      category: 'interaction',
      phrase: 'click [number]',
      aliases: ['click 1', 'select 4', 'open 7'],
      desc: 'Activates a specific element numbered with Voice Badges overlay.'
    },
    {
      category: 'interaction',
      phrase: 'toggle dark mode',
      aliases: ['dark mode', 'light mode', 'toggle theme', 'duck mode'],
      desc: 'Switches the color scheme between Dark and Light mode.'
    },
    {
      category: 'interaction',
      phrase: 'open capacity ai',
      aliases: ['ask ai', 'capacity ai', 'open copilot', 'ai assistant'],
      desc: 'Launches the AI Capacity-Building Copilot & Learning Assistant.'
    },
    {
      category: 'interaction',
      phrase: 'switch to trainer',
      aliases: ['switch to learner', 'switch to admin', 'login as learner', 'vikram'],
      desc: 'Quickly switches personas between Learner, Trainer, and Admin.'
    },
    {
      category: 'interaction',
      phrase: 'open notifications',
      aliases: ['show notifications', 'my alerts'],
      desc: 'Opens the unread notification dropdown drawer.'
    },

    // Forms
    {
      category: 'form',
      phrase: 'search [keyword]',
      aliases: ['search for python', 'search cloud', 'search react'],
      desc: 'Focuses search inputs and enters the queried skill or topic keyword.'
    },
    {
      category: 'form',
      phrase: 'type [text] in [field]',
      aliases: ['fill [field] with [text]', 'enter [text] in search'],
      desc: 'Types content into any specific input or textarea on the active page.'
    },
    {
      category: 'form',
      phrase: 'submit form',
      aliases: ['submit', 'press enter', 'save'],
      desc: 'Submits the currently active or nearest form on the page.'
    },

    // Reading
    {
      category: 'reading',
      phrase: 'read this page',
      aliases: ['read page', 'read screen', 'read content', 'read aloud'],
      desc: 'Synthesizes and speaks aloud all primary headings, paragraphs, and lists.'
    },
    {
      category: 'reading',
      phrase: 'read heading',
      aliases: ['read title', 'read header'],
      desc: 'Reads the main headline and summary text of the active screen.'
    },
    {
      category: 'reading',
      phrase: 'stop reading',
      aliases: ['cancel speech', 'be quiet', 'silence', 'stop talking'],
      desc: 'Instantly stops active text-to-speech audio.'
    },

    // System
    {
      category: 'system',
      phrase: 'show numbers',
      aliases: ['show badges', 'what can i click', 'show voice hints'],
      desc: 'Overlays numbered tags on all clickable buttons so you can say "click 1".'
    },
    {
      category: 'system',
      phrase: 'hide numbers',
      aliases: ['hide badges', 'hide hints'],
      desc: 'Dismisses the numbered voice badges overlay.'
    },
    {
      category: 'system',
      phrase: 'what can i say',
      aliases: ['voice help', 'help', 'show commands'],
      desc: 'Opens this interactive Voice Command Center.'
    },
    {
      category: 'system',
      phrase: 'close modal',
      aliases: ['close help', 'close popup', 'dismiss'],
      desc: 'Closes any active modal dialog or drawer.'
    }
  ];

  const filteredCommands = commandList.filter(cmd => {
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
    const matchesSearch = 
      cmd.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleTestCommand = async (phrase: string) => {
    setShowHelpModal(false);
    await executeCommand(phrase);
  };

  const copyConfigSnippet = () => {
    const code = `import { voiceEngine } from './lib/voice-control';

// 1. Initialize high-accuracy Neural Whisper/Gemini mode
voiceEngine.setEngineMode('NEURAL_AI');
voiceEngine.start();

// 2. Register custom voice command
voiceEngine.registerCommand({
  id: 'custom-pricing',
  category: 'navigation',
  phrases: ['open pricing', 'view plans', 'pricing table'],
  description: 'Navigate to pricing page',
  action: () => {
    window.location.href = '/pricing';
    return 'Opening pricing plans';
  }
});

// 3. Tag any button in HTML or React:
// <button data-voice-command="enroll now">Enroll Now</button>`;

    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Voice Command Center</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Whisper & Gemini Neural AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ultra-accurate voice listener powered by neural audio transcription, accent resilience, and phonetics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 animate-pulse'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isListening ? 'Stop Listening' : 'Start Listening (Alt+V)'}</span>
            </button>

            <button
              onClick={() => setShowHelpModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 px-5 gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('commands')}
            className={`py-3 px-1 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'commands'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Voice Cheatsheet</span>
          </button>

          <button
            onClick={() => setActiveTab('engines')}
            className={`py-3 px-1 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'engines'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-500" />
            <span>Whisper / Neural Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-1 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Voice & TTS Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 px-1 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'shortcuts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Hotkeys & Accessibility</span>
          </button>

          <button
            onClick={() => setActiveTab('developer')}
            className={`py-3 px-1 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'developer'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Developer Guide</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'commands' && (
            <div className="space-y-4">
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {commandCategories.map(cat => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search voice commands..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Neural Accuracy Callout */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-600 text-white font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Neural Speech & Fuzzy Phonetics Active</span>
                      <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">99% Accuracy</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      You can speak naturally in complete sentences or short keywords with any accent.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    toggleBadges();
                    setShowHelpModal(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
                >
                  {showBadges ? 'Hide Badges' : 'Show Badges (Alt+B)'}
                </button>
              </div>

              {/* Grid of Commands */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCommands.map((cmd, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <code className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                            "{cmd.phrase}"
                          </code>
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            {cmd.category}
                          </span>
                        </div>

                        <button
                          onClick={() => handleTestCommand(cmd.phrase)}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title={`Test execute "${cmd.phrase}" now`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Test</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {cmd.desc}
                      </p>
                    </div>

                    {cmd.aliases.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">Or say:</span>
                        {cmd.aliases.map((alias, aIdx) => (
                          <span
                            key={aIdx}
                            className="text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                          >
                            "{alias}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'engines' && (
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-blue-950/40 to-slate-900 border border-cyan-500/30 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-500 text-slate-950">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-cyan-200">Neural Whisper & Gemini Voice Engine</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Processes high-fidelity audio streams with state-of-the-art multimodal deep learning models for near-perfect speech accuracy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engine Selector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setEngineMode('NEURAL_AI')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    engineMode === 'NEURAL_AI'
                      ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-cyan-500" />
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white">Whisper / Neural AI (Recommended)</h5>
                    </div>
                    {engineMode === 'NEURAL_AI' && (
                      <span className="p-1 rounded-full bg-cyan-500 text-slate-950">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    High accuracy neural listener. Corrects accents, filters background noise, and understands natural intent.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      99% Accuracy
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Noise Robust
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setEngineMode('WEB_SPEECH')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    engineMode === 'WEB_SPEECH'
                      ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 shadow-lg shadow-blue-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-blue-500" />
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white">Browser Web Speech API</h5>
                    </div>
                    {engineMode === 'WEB_SPEECH' && (
                      <span className="p-1 rounded-full bg-blue-500 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    Direct in-browser speech recognition engine. Zero network calls, lowest latency, best in quiet rooms.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Instant Latency
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      Browser Native
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Spoken Voice Confirmation (TTS)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Speaks confirmation after executing each voice command.
                  </p>
                </div>
                <button
                  onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    voiceFeedbackEnabled
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {voiceFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{voiceFeedbackEnabled ? 'Enabled' : 'Muted'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Speech Synthesis Rate</h4>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {speechRate.toFixed(1)}x Speed
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={speechRate}
                  onChange={e => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Synthesizer Voice Persona</h4>
                <select
                  value={selectedVoiceName || ''}
                  onChange={e => setSelectedVoice(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {availableVoices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                  {availableVoices.length === 0 && (
                    <option value="">Default System Voice</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="space-y-2.5">
                {[
                  { key: 'Alt + V', desc: 'Toggle continuous Voice Listening on/off from anywhere.' },
                  { key: 'Hold Mic / Talk', desc: 'Push-To-Talk: speak while holding, release to execute.' },
                  { key: 'Alt + H', desc: 'Open this Voice Command Center & Help cheatsheet.' },
                  { key: 'Alt + B', desc: 'Toggle numbered Voice Badges on interactive elements.' },
                  { key: 'Escape', desc: 'Immediately cancel ongoing Text-to-Speech speech or close popups.' },
                  { key: 'Tab / Shift + Tab', desc: 'Standard accessible keyboard focus navigation remains fully preserved.' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.desc}</span>
                    <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-white shadow-xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'developer' && (
            <div className="space-y-4 max-w-3xl mx-auto py-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Plug-and-Play Voice Module Integration</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    How to import <code>voice-control.ts</code> into any web page or React component:
                  </p>
                </div>
                <button
                  onClick={copyConfigSnippet}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
{`// 1. Import engine in React or Vanilla JS
import { voiceEngine } from './lib/voice-control';

// 2. Set Whisper / Neural AI high-accuracy mode
voiceEngine.setEngineMode('NEURAL_AI');
voiceEngine.start();

// 3. Register custom commands with fuzzy aliases
voiceEngine.registerCommand({
  id: 'custom-pricing',
  category: 'navigation',
  phrases: ['open pricing', 'view plans', 'pricing table'],
  description: 'Navigate to pricing page',
  action: () => {
    window.location.href = '/pricing';
    return 'Opening pricing plans';
  }
});`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Dual Engine: Whisper-Grade Neural Transcription + In-Browser Speech Engine</span>
          </div>
          <button
            onClick={() => setShowHelpModal(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Got it, Let's Voice Control!
          </button>
        </div>
      </div>
    </div>
  );
}

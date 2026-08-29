/**
 * VoiceControl Engine (Dual Engine: Whisper/Gemini Neural AI + Web Speech API + Fuzzy Phonetics)
 * 
 * Provides ultra-accurate speech recognition, multilingual/accent resilience,
 * continuous VAD listening, Push-to-Talk, live audio visualizer waveforms, and semantic UI navigation.
 */

import { findBestVoiceMatch, normalizeTranscript, stringSimilarity } from './voice-fuzzy.js';
import { NeuralAudioRecorder } from './neural-audio-recorder.js';

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export type VoiceEngineMode = 'NEURAL_AI' | 'WEB_SPEECH' | 'HYBRID';

export type VoiceCommandCategory = 
  | 'navigation' 
  | 'interaction' 
  | 'form' 
  | 'reading' 
  | 'system';

export interface VoiceCommandConfig {
  id: string;
  category: VoiceCommandCategory;
  phrases: string[]; // e.g. ["go to courses", "open courses", "course catalog"]
  regex?: RegExp;
  description: string;
  action: (matches?: RegExpMatchArray | null, rawTranscript?: string, parsedData?: any) => Promise<string | boolean | void> | string | boolean | void;
  feedbackText?: string | ((matches?: RegExpMatchArray | null, rawTranscript?: string, parsedData?: any) => string);
}

export interface VoiceTargetElement {
  element: HTMLElement;
  label: string;
  badgeNumber: number;
  rect: DOMRect;
  type: 'button' | 'link' | 'input' | 'tab' | 'card' | 'custom';
}

export interface VoiceControlState {
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  isSpeaking: boolean;
  engineMode: VoiceEngineMode;
  audioLevel: number; // 0.0 to 1.0 for live waveform visualization
  transcript: string;
  interimTranscript: string;
  confidence: number;
  lastCommand: string;
  lastFeedback: string;
  badgeCount: number;
  voiceFeedbackEnabled: boolean;
  speechRate: number;
  selectedVoiceName: string | null;
  error: string | null;
  source: 'gemini-neural' | 'web-speech' | 'fuzzy-engine' | null;
}

export type VoiceStateListener = (state: VoiceControlState) => void;

export class VoiceControlEngine {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private neuralRecorder: NeuralAudioRecorder | null = null;

  private isListening: boolean = false;
  private isProcessing: boolean = false;
  private shouldKeepListening: boolean = false;
  private isSupported: boolean = true;
  private isSpeaking: boolean = false;
  private engineMode: VoiceEngineMode = 'HYBRID';
  private audioLevel: number = 0;
  private transcript: string = '';
  private interimTranscript: string = '';
  private confidence: number = 1.0;
  private lastCommand: string = '';
  private lastFeedback: string = '';
  private error: string | null = null;
  private source: VoiceControlState['source'] = null;

  private retryCount: number = 0;
  private retryTimeout: any = null;

  // Customization & Settings
  private voiceFeedbackEnabled: boolean = true;
  private speechRate: number = 1.0;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private commands: VoiceCommandConfig[] = [];
  private listeners: Set<VoiceStateListener> = new Set();
  private badgesVisible: boolean = false;
  private activeBadgeElements: VoiceTargetElement[] = [];

  // Context callback providers
  private contextProvider: () => { currentPath: string; currentRole: string } = () => ({
    currentPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    currentRole: 'LEARNER'
  });

  constructor() {
    this.checkSupport();
    this.initSynthesis();
    this.initNeuralRecorder();
  }

  public setContextProvider(provider: () => { currentPath: string; currentRole: string }): void {
    this.contextProvider = provider;
  }

  /**
   * Check browser support for Speech capabilities
   */
  public checkSupport(): boolean {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return false;
    }

    const hasWebSpeech = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    const hasMedia = NeuralAudioRecorder.isSupported();

    this.isSupported = hasWebSpeech || hasMedia;
    return this.isSupported;
  }

  /**
   * Initialize Text-To-Speech Synthesis
   */
  private initSynthesis(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.synthesis = window.speechSynthesis;

    const updateVoices = () => {
      if (!this.synthesis) return;
      const voices = this.synthesis.getVoices();
      if (voices.length > 0 && !this.selectedVoice) {
        const preferred = voices.find(v => 
          (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Samantha') || v.name.includes('Neural')))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        this.selectedVoice = preferred;
      }
    };

    updateVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = updateVoices;
    }
  }

  /**
   * Initialize Neural Audio Recorder (Whisper & Gemini mode)
   */
  private initNeuralRecorder(): void {
    if (typeof window === 'undefined' || !NeuralAudioRecorder.isSupported()) return;

    this.neuralRecorder = new NeuralAudioRecorder({
      silenceThresholdMs: 900,
      onAudioLevel: (lvl) => {
        this.audioLevel = lvl;
        this.emitState();
      },
      onTranscriptionStart: () => {
        this.isProcessing = true;
        this.interimTranscript = 'Transcribing with Neural AI...';
        this.emitState();
      },
      onTranscriptionComplete: async (result) => {
        this.isProcessing = false;
        this.interimTranscript = '';

        if (result && result.transcript) {
          this.transcript = result.transcript;
          this.confidence = result.confidence || 0.98;
          this.source = 'gemini-neural';
          this.emitState();

          await this.executeParsedOrFuzzyCommand(result.transcript, result);
        } else {
          this.emitState();
        }

        // Auto restart recording loop if in continuous listening mode
        if (this.shouldKeepListening && this.engineMode === 'NEURAL_AI') {
          setTimeout(() => {
            if (this.shouldKeepListening && !this.isListening) {
              this.startNeuralListening();
            }
          }, 300);
        }
      },
      onError: (err) => {
        console.warn('Neural Audio Recorder Error:', err);
        this.isProcessing = false;
        this.interimTranscript = '';
        this.emitState();
      }
    });
  }

  /**
   * Initialize the Web SpeechRecognition instance for WebSpeech / Hybrid mode
   */
  private initRecognition(): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return false;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.error = null;
        this.retryCount = 0;
        this.emitState();
      };

      this.recognition.onresult = async (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalTranscript += text;
          } else {
            currentInterim += text;
          }
        }

        const trimmedInterim = currentInterim.trim();
        this.interimTranscript = trimmedInterim;

        // Instant Fast-Match Optimization:
        // If the interim text already contains a high-confidence exact command or badge number, execute immediately!
        if (trimmedInterim && !finalTranscript) {
          const quickMatch = this.checkFastImmediateMatch(trimmedInterim);
          if (quickMatch) {
            this.transcript = trimmedInterim;
            this.interimTranscript = '';
            this.source = 'web-speech';
            this.emitState();
            await this.executeParsedOrFuzzyCommand(trimmedInterim);
            return;
          }
        }

        if (finalTranscript) {
          const cleanedText = finalTranscript.trim();
          this.transcript = cleanedText;
          this.interimTranscript = '';
          this.source = 'web-speech';
          this.emitState();
          await this.executeParsedOrFuzzyCommand(cleanedText);
        } else {
          this.emitState();
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Ignorable benign events in continuous listening
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.error = 'Microphone permission denied. Please allow mic permissions in your browser.';
          this.shouldKeepListening = false;
          this.isListening = false;
          this.emitState();
          return;
        }

        // Auto restart gracefully without switching away or failing
        if (event.error !== 'aborted') {
          console.warn('Speech recognition transient warning:', event.error);
        }
        this.emitState();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.emitState();

        // Always keep the recognition alive when shouldKeepListening is true
        if (this.shouldKeepListening && !this.error) {
          clearTimeout(this.retryTimeout);
          // Zero-delay resurrection so listening never dies
          this.retryTimeout = setTimeout(() => {
            if (this.shouldKeepListening) {
              try {
                this.recognition?.start();
              } catch (e) {
                // If start fails due to already running or transient error, retry in 150ms
                setTimeout(() => {
                  if (this.shouldKeepListening) {
                    try { this.recognition?.start(); } catch (err) {}
                  }
                }, 150);
              }
            }
          }, 50);
        }
      };

      return true;
    } catch (e: any) {
      this.error = `Failed to initialize speech recognition: ${e.message}`;
      this.emitState();
      return false;
    }
  }

  /**
   * Switch Active Speech Engine
   */
  public setEngineMode(mode: VoiceEngineMode): void {
    const wasListening = this.isListening;
    if (wasListening) {
      this.stop();
    }

    this.engineMode = mode;
    this.emitState();

    if (wasListening) {
      this.start();
    }
  }

  public getEngineMode(): VoiceEngineMode {
    return this.engineMode;
  }

  /**
   * Start listening for voice commands based on selected engine mode
   */
  public start(): boolean {
    this.shouldKeepListening = true;
    this.error = null;

    if (this.engineMode === 'NEURAL_AI') {
      return this.startNeuralListening();
    } else {
      return this.startWebSpeechListening();
    }
  }

  private startNeuralListening(): boolean {
    if (!this.neuralRecorder) {
      this.initNeuralRecorder();
    }

    if (this.neuralRecorder) {
      this.neuralRecorder.startRecording().then((ok) => {
        this.isListening = ok;
        this.emitState();
      });
      return true;
    }

    // Fallback to web speech
    return this.startWebSpeechListening();
  }

  private startWebSpeechListening(): boolean {
    if (!this.recognition) {
      const ok = this.initRecognition();
      if (!ok) {
        // If web speech unavailable, fallback to Neural AI
        return this.startNeuralListening();
      }
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.emitState();
      return true;
    } catch (e: any) {
      if (e.name === 'InvalidStateError') {
        this.isListening = true;
        this.emitState();
        return true;
      }
      return false;
    }
  }

  /**
   * Stop listening for voice commands
   */
  public stop(): void {
    this.shouldKeepListening = false;
    clearTimeout(this.retryTimeout);

    if (this.neuralRecorder) {
      this.neuralRecorder.cancel();
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    this.isListening = false;
    this.isProcessing = false;
    this.audioLevel = 0;
    this.interimTranscript = '';
    this.emitState();
  }

  /**
   * Toggle voice listening
   */
  public toggle(): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  /**
   * Push to talk methods
   */
  public async startPushToTalk(): Promise<boolean> {
    this.shouldKeepListening = false;
    if (!this.neuralRecorder) this.initNeuralRecorder();
    if (this.neuralRecorder) {
      const ok = await this.neuralRecorder.startRecording();
      this.isListening = ok;
      this.emitState();
      return ok;
    }
    return false;
  }

  public async stopPushToTalk(): Promise<any> {
    if (this.neuralRecorder && this.isListening) {
      const ctx = this.contextProvider();
      const res = await this.neuralRecorder.stopAndTranscribe(ctx);
      this.isListening = false;
      this.audioLevel = 0;
      this.emitState();
      return res;
    }
    this.stop();
    return null;
  }

  /**
   * Register a custom voice command into the engine
   */
  public registerCommand(config: VoiceCommandConfig): () => void {
    this.commands = this.commands.filter(c => c.id !== config.id);
    this.commands.push(config);
    return () => {
      this.unregisterCommand(config.id);
    };
  }

  public unregisterCommand(id: string): void {
    this.commands = this.commands.filter(c => c.id !== id);
  }

  public clearCommands(): void {
    this.commands = [];
  }

  public getCommands(): VoiceCommandConfig[] {
    return [...this.commands];
  }

  /**
   * Fast early match detector for interim speech recognition stream.
   * Returns true if input matches a clear registered phrase, number, or keyword immediately.
   */
  public checkFastImmediateMatch(rawText: string): boolean {
    const text = rawText.trim().toLowerCase();
    if (!text || text.length < 3) return false;

    // Fast badge click check e.g. "click 1", "3", "select 2"
    if (/^(?:click|select|number|item|press)\s+\d+$/i.test(text) || /^\d+$/.test(text)) {
      return true;
    }

    // Fast theme / scroll / stop speaking / wake-word check
    if (/^(dark mode|light mode|night mode|toggle theme|scroll down|scroll up|stop reading|be quiet|voice command open|open voice|voice on|voice|activate voice|start voice|turn on voice|voice ai)$/i.test(text)) {
      return true;
    }

    // Fast registered command regex or exact phrase match
    for (const cmd of this.commands) {
      if (cmd.regex && cmd.regex.test(text)) {
        return true;
      }
      if (cmd.phrases && cmd.phrases.some(p => p.toLowerCase() === text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Execute a command from string or parsed payload
   */
  public async executeCommand(phrase: string): Promise<{ success: boolean; feedback: string }> {
    return await this.executeParsedOrFuzzyCommand(phrase);
  }

  /**
   * Core Command Dispatcher with Neural Intent, Registered Commands & Fuzzy Phonetics
   */
  public async executeParsedOrFuzzyCommand(rawText: string, neuralResult?: any): Promise<{ success: boolean; feedback: string }> {
    const text = rawText.trim().toLowerCase();
    if (!text) return { success: false, feedback: '' };

    this.lastCommand = rawText;
    this.emitState();

    // 1. Direct Execution if Neural API provided a structured action
    if (neuralResult && neuralResult.action && neuralResult.action !== 'UNKNOWN') {
      const feedback = await this.handleNeuralStructuredAction(neuralResult);
      if (feedback) {
        this.setFeedback(feedback, true);
        return { success: true, feedback };
      }
    }

    // 2. Built-in Wake Word & Voice Auto-Activation Commands (Auto Turn ON)
    if (/^(?:voice(?:\s+command)?\s+(?:open|on|start|activate)|open\s+voice(?:\s+commands?|\s+ai|\s+assistant)?|activate\s+voice|start\s+voice|turn\s+on\s+voice|enable\s+voice|voice\s+ai(?:\s+on)?|voice\s+assistant|voice\s+mode|voice\s+control|hey\s+voice|wake\s+up(?:\s+voice)?|start\s+listening|voice)$/i.test(text)) {
      this.shouldKeepListening = true;
      if (!this.isListening) {
        this.start();
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('skillbridge-voice-open-hud', { detail: { action: 'open' } }));
        if (text.includes('command') || text.includes('help')) {
          window.dispatchEvent(new CustomEvent('skillbridge-voice-open-help'));
        }
      }
      const feedback = 'Voice AI is active and listening. How can I help you?';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }

    if (/^(?:voice\s+(?:off|close|sleep|stop|pause|hide|minimize)|turn\s+off\s+voice|close\s+voice|stop\s+listening|pause\s+voice|deactivate\s+voice)$/i.test(text)) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('skillbridge-voice-close-hud', { detail: { action: 'minimize' } }));
      }
      const feedback = 'Voice assistant minimized.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }

    // 3. Built-in Core Speech & Audio Commands
    if (/^(stop reading|cancel speech|be quiet|silence|stop talking|hush)$/i.test(text)) {
      this.stopSpeaking();
      const feedback = 'Stopped speaking.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }

    if (/^(read this page|read page|read content|read screen|read aloud)$/i.test(text)) {
      const readText = this.extractReadablePageContent();
      const feedback = 'Reading page content aloud...';
      this.setFeedback(feedback, false);
      this.speak(readText);
      return { success: true, feedback };
    }

    if (/^(read heading|read title|read header)$/i.test(text)) {
      const heading = document.querySelector('h1, h2, h3')?.textContent || 'No main heading found.';
      const feedback = `Main heading: ${heading}`;
      this.setFeedback(feedback, false);
      this.speak(heading);
      return { success: true, feedback };
    }

    if (/^(show numbers|show badges|show voice hints|what can i click|show labels)$/i.test(text)) {
      this.setBadgesVisible(true);
      const count = this.activeBadgeElements.length;
      const feedback = `Voice badges active on ${count} clickable elements. Say "click 1" or any number.`;
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }

    if (/^(hide numbers|hide badges|hide hints|dismiss badges)$/i.test(text)) {
      this.setBadgesVisible(false);
      const feedback = 'Voice badges hidden.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }

    // 3. Click Badge Numbers (e.g. "click 3", "select 12", "number 5")
    const numberMatch = text.match(/^(?:click|select|choose|open|number|item|press)\s+(\d+)$/i) || text.match(/^(\d+)$/);
    if (numberMatch && this.activeBadgeElements.length > 0) {
      const num = parseInt(numberMatch[1], 10);
      const target = this.activeBadgeElements.find(b => b.badgeNumber === num);
      if (target) {
        this.triggerElementAction(target.element);
        const feedback = `Selected #${num}: ${target.label}`;
        this.setFeedback(feedback, true);
        return { success: true, feedback };
      }
    }

    // 4. Scrolling commands
    if (/^(scroll down|page down|down)$/i.test(text)) {
      window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
      const feedback = 'Scrolled down.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }
    if (/^(scroll up|page up|up)$/i.test(text)) {
      window.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
      const feedback = 'Scrolled up.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }
    if (/^(scroll to top|go to top|top)$/i.test(text)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const feedback = 'Scrolled to top.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }
    if (/^(scroll to bottom|go to bottom|bottom)$/i.test(text)) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      const feedback = 'Scrolled to bottom.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }

    // 5. History navigation
    if (/^(go back|navigate back|back)$/i.test(text)) {
      window.history.back();
      const feedback = 'Navigated back.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }
    if (/^(go forward|navigate forward|forward)$/i.test(text)) {
      window.history.forward();
      const feedback = 'Navigated forward.';
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }

    // 6. Registered Custom Commands with Optimal Score Matching
    let bestMatchedCmd: VoiceCommandConfig | null = null;
    let bestMatchScore = 0;
    let bestMatchResult: RegExpMatchArray | null = null;

    for (const cmd of this.commands) {
      // 6a. Check exact Regex
      if (cmd.regex) {
        const regexMatch = text.match(cmd.regex);
        if (regexMatch) {
          bestMatchedCmd = cmd;
          bestMatchScore = 1.0;
          bestMatchResult = regexMatch;
          break; // Exact regex match is absolute highest priority
        }
      }

      // 6b. Check candidate phrases
      if (cmd.phrases && cmd.phrases.length > 0) {
        const fuzzy = findBestVoiceMatch(text, cmd.phrases, 0.75);
        if (fuzzy.match && fuzzy.score > bestMatchScore) {
          bestMatchScore = fuzzy.score;
          bestMatchedCmd = cmd;
          bestMatchResult = null;
        }
      }
    }

    if (bestMatchedCmd && bestMatchScore >= 0.75) {
      try {
        const res = await bestMatchedCmd.action(bestMatchResult, rawText, neuralResult);
        let feedback = '';
        if (typeof bestMatchedCmd.feedbackText === 'function') {
          feedback = bestMatchedCmd.feedbackText(bestMatchResult, rawText, neuralResult);
        } else if (typeof bestMatchedCmd.feedbackText === 'string') {
          feedback = bestMatchedCmd.feedbackText;
        } else if (typeof res === 'string') {
          feedback = res;
        } else {
          feedback = `Executed: ${bestMatchedCmd.description}`;
        }

        this.setFeedback(feedback, true);
        return { success: true, feedback };
      } catch (err: any) {
        const feedback = `Error: ${err.message}`;
        this.setFeedback(feedback, true);
        return { success: false, feedback };
      }
    }

    // 7. Form Typing & Input commands
    const formMatch = this.matchFormInput(text);
    if (formMatch) {
      const ok = this.fillFormField(formMatch.fieldName, formMatch.content);
      if (ok) {
        const feedback = `Typed "${formMatch.content}" in ${formMatch.fieldName}.`;
        this.setFeedback(feedback, true);
        return { success: true, feedback };
      }
    }

    // 8. Element Targeting by label / fuzzy text match
    const clickMatch = text.match(/^(?:click|press|tap|select|open|choose)\s+(.+)$/i);
    const targetQuery = clickMatch ? clickMatch[1].trim() : text;

    const matchedElement = this.findMatchingInteractiveElement(targetQuery);
    if (matchedElement) {
      this.triggerElementAction(matchedElement.element);
      const feedback = `Clicked ${matchedElement.label}`;
      this.setFeedback(feedback, true);
      return { success: true, feedback };
    }

    // 9. Semantic intent parsing fallback via server AI (with strict 1500ms timeout for high speed)
    try {
      const ctx = this.contextProvider();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch('/api/ai/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: rawText,
          currentPath: ctx.currentPath,
          currentRole: ctx.currentRole
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const parsed = await res.json();
        if (parsed && parsed.action && parsed.action !== 'UNKNOWN') {
          const feedback = await this.handleNeuralStructuredAction(parsed);
          if (feedback) {
            this.setFeedback(feedback, true);
            return { success: true, feedback };
          }
        }
      }
    } catch (e) {
      // Ignore network parse failure and fallback
    }

    // 10. Fallback message
    const fallbackFeedback = `Understood "${rawText}". Say "what can I say" or "help" to see available voice actions.`;
    this.setFeedback(fallbackFeedback, true);
    return { success: false, feedback: fallbackFeedback };
  }

  /**
   * Handle structured intent action returned directly by Gemini Neural Speech
   */
  private async handleNeuralStructuredAction(result: any): Promise<string | null> {
    const { action, path, target, query, role, scrollDirection, spokenFeedback } = result;

    if (action === 'NAVIGATE' && path) {
      if (path === 'BACK') {
        window.history.back();
        return spokenFeedback || 'Going back';
      }
      // Trigger navigation event or link
      window.dispatchEvent(new CustomEvent('skillbridge-voice-navigate', { detail: { path } }));
      return spokenFeedback || `Navigating to ${path}`;
    }

    if (action === 'THEME_TOGGLE') {
      const themeBtn = document.getElementById('btn-demobar-toggle-theme') || document.getElementById('btn-navbar-theme-toggle');
      if (themeBtn) themeBtn.click();
      return spokenFeedback || 'Toggled theme mode';
    }

    if (action === 'TOGGLE_BADGES') {
      this.setBadgesVisible(!this.badgesVisible);
      return spokenFeedback || (this.badgesVisible ? 'Voice badges visible' : 'Voice badges hidden');
    }

    if (action === 'READ_PAGE') {
      const content = this.extractReadablePageContent();
      this.speak(content);
      return spokenFeedback || 'Reading page aloud';
    }

    if (action === 'ROLE_SWITCH' && role) {
      const btn = document.getElementById(`btn-switch-${role.toLowerCase()}`);
      if (btn) btn.click();
      return spokenFeedback || `Switched to ${role} persona`;
    }

    if (action === 'AI_COPILOT') {
      const aiBtn = document.getElementById('btn-open-capacity-ai');
      if (aiBtn) aiBtn.click();
      if (query) {
        window.dispatchEvent(new CustomEvent('skillbridge-voice-ai-query', { detail: { query } }));
      }
      return spokenFeedback || 'Opening Capacity AI Copilot';
    }

    if (action === 'SEARCH' && query) {
      const ok = this.fillFormField('search', query);
      return spokenFeedback || `Searching for ${query}`;
    }

    if (action === 'CLICK' && target) {
      // Check if number
      if (/^\d+$/.test(target) && this.activeBadgeElements.length > 0) {
        const num = parseInt(target, 10);
        const item = this.activeBadgeElements.find(b => b.badgeNumber === num);
        if (item) {
          this.triggerElementAction(item.element);
          return spokenFeedback || `Selected #${num}: ${item.label}`;
        }
      }

      const el = this.findMatchingInteractiveElement(target);
      if (el) {
        this.triggerElementAction(el.element);
        return spokenFeedback || `Clicked ${el.label}`;
      }
    }

    if (action === 'SCROLL') {
      if (scrollDirection === 'DOWN') window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
      else if (scrollDirection === 'UP') window.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
      else if (scrollDirection === 'TOP') window.scrollTo({ top: 0, behavior: 'smooth' });
      else if (scrollDirection === 'BOTTOM') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return spokenFeedback || 'Scrolled view';
    }

    return null;
  }

  /**
   * Find matching interactive element on page with fuzzy matching
   */
  private findMatchingInteractiveElement(query: string): { element: HTMLElement; label: string } | null {
    if (!query || query.length < 2) return null;
    const cleanQuery = query.toLowerCase().trim();

    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, a, input, select, textarea, [role="button"], [role="link"], [role="tab"], [data-voice-command], [tabindex="0"]'
      )
    ).filter(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    let bestElement: { element: HTMLElement; label: string } | null = null;
    let highestScore = 0;

    for (const el of candidates) {
      const voiceAttr = el.getAttribute('data-voice-command')?.toLowerCase() || '';
      const aria = el.getAttribute('aria-label')?.toLowerCase() || '';
      const text = el.innerText?.toLowerCase().trim() || '';
      const placeholder = el.getAttribute('placeholder')?.toLowerCase() || '';
      const id = el.id?.toLowerCase().replace(/^(btn|link|input)-/, '').replace(/-/g, ' ') || '';

      const labels = [voiceAttr, aria, text, placeholder, id].filter(Boolean);
      for (const lbl of labels) {
        if (lbl === cleanQuery) {
          return { element: el, label: el.innerText || aria || lbl || 'element' };
        }

        const sim = stringSimilarity(cleanQuery, lbl);
        if (sim > highestScore && sim >= 0.72) {
          highestScore = sim;
          bestElement = { element: el, label: el.innerText || aria || lbl || 'element' };
        }
      }
    }

    return bestElement;
  }

  private matchFormInput(text: string): { fieldName: string; content: string } | null {
    let match = text.match(/^(?:type|enter|write|input)\s+(.+?)\s+(?:in|into|on)\s+(.+)$/i);
    if (match) {
      return { content: match[1].trim(), fieldName: match[2].trim() };
    }

    match = text.match(/^fill\s+(.+?)\s+with\s+(.+)$/i);
    if (match) {
      return { fieldName: match[1].trim(), content: match[2].trim() };
    }

    match = text.match(/^search\s+(?:for\s+)?(.+)$/i);
    if (match) {
      return { fieldName: 'search', content: match[1].trim() };
    }

    return null;
  }

  private fillFormField(fieldName: string, content: string): boolean {
    const cleanName = fieldName.toLowerCase().trim();
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'));

    let targetInput: HTMLInputElement | HTMLTextAreaElement | null = null;

    for (const input of inputs) {
      const placeholder = input.placeholder?.toLowerCase() || '';
      const name = input.name?.toLowerCase() || '';
      const id = input.id?.toLowerCase() || '';
      const aria = input.getAttribute('aria-label')?.toLowerCase() || '';

      if (
        placeholder.includes(cleanName) ||
        name.includes(cleanName) ||
        id.includes(cleanName) ||
        aria.includes(cleanName) ||
        (cleanName === 'search' && (input.type === 'search' || placeholder.includes('search') || id.includes('search')))
      ) {
        targetInput = input;
        break;
      }
    }

    if (!targetInput && inputs.length === 1) {
      targetInput = inputs[0];
    }

    if (!targetInput) return false;

    targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetInput.focus();

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    const nativeTextAreaSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (targetInput instanceof HTMLTextAreaElement && nativeTextAreaSetter) {
      nativeTextAreaSetter.call(targetInput, content);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.call(targetInput, content);
    } else {
      targetInput.value = content;
    }

    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));

    this.flashElementHighlight(targetInput);
    return true;
  }

  public triggerElementAction(el: HTMLElement): void {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.flashElementHighlight(el);

    setTimeout(() => {
      el.focus();
      el.click();
    }, 150);
  }

  private flashElementHighlight(el: HTMLElement): void {
    const originalOutline = el.style.outline;
    const originalBoxShadow = el.style.boxShadow;
    const originalTransition = el.style.transition;

    el.style.transition = 'all 0.2s ease-in-out';
    el.style.outline = '3px solid #3b82f6';
    el.style.boxShadow = '0 0 24px rgba(59, 130, 246, 0.7)';

    setTimeout(() => {
      el.style.outline = originalOutline;
      el.style.boxShadow = originalBoxShadow;
      el.style.transition = originalTransition;
    }, 1200);
  }

  private extractReadablePageContent(): string {
    const mainEl = document.querySelector('main') || document.querySelector('article') || document.body;
    const textNodes: string[] = [];
    const elements = mainEl.querySelectorAll('h1, h2, h3, p, li, [data-voice-readable]');

    elements.forEach(node => {
      const style = window.getComputedStyle(node);
      if (style.display !== 'none' && style.visibility !== 'hidden' && node.textContent) {
        const text = node.textContent.trim();
        if (text.length > 5 && !text.startsWith('http')) {
          textNodes.push(text);
        }
      }
    });

    return textNodes.slice(0, 15).join('. ');
  }

  public refreshVoiceBadges(): VoiceTargetElement[] {
    if (typeof window === 'undefined') return [];

    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, a, input, select, textarea, [role="button"], [role="link"], [data-voice-command]'
      )
    ).filter(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      const inView = (
        rect.top >= -20 &&
        rect.left >= -20 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 20 &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) + 20
      );
      return inView && rect.width > 12 && rect.height > 12;
    });

    let counter = 1;
    this.activeBadgeElements = candidates.map(el => {
      let type: VoiceTargetElement['type'] = 'button';
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'a') type = 'link';
      else if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') type = 'input';

      const label = el.getAttribute('data-voice-command') || el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.id || `Item ${counter}`;

      return {
        element: el,
        label: label.trim().slice(0, 30),
        badgeNumber: counter++,
        rect: el.getBoundingClientRect(),
        type
      };
    });

    this.emitState();
    return this.activeBadgeElements;
  }

  public setBadgesVisible(visible: boolean): void {
    this.badgesVisible = visible;
    if (visible) {
      this.refreshVoiceBadges();
    } else {
      this.activeBadgeElements = [];
      this.emitState();
    }
  }

  public getBadgesVisible(): boolean {
    return this.badgesVisible;
  }

  public getActiveBadges(): VoiceTargetElement[] {
    return this.activeBadgeElements;
  }

  public speak(text: string, force: boolean = false): void {
    if (!this.voiceFeedbackEnabled && !force) return;
    if (!this.synthesis) return;

    this.synthesis.cancel();
    const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = this.speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.emitState();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.emitState();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.emitState();
    };

    this.synthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.emitState();
  }

  private setFeedback(message: string, shouldSpeak: boolean = true): void {
    this.lastFeedback = message;
    this.emitState();

    if (shouldSpeak && this.voiceFeedbackEnabled) {
      this.speak(message);
    }

    const liveRegion = document.getElementById('voice-control-live-announcer');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  public setVoiceFeedbackEnabled(enabled: boolean): void {
    this.voiceFeedbackEnabled = enabled;
    if (!enabled) this.stopSpeaking();
    this.emitState();
  }

  public setSpeechRate(rate: number): void {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
    this.emitState();
  }

  public setSelectedVoice(voiceName: string): void {
    if (!this.synthesis) return;
    const voices = this.synthesis.getVoices();
    const found = voices.find(v => v.name === voiceName);
    if (found) {
      this.selectedVoice = found;
      this.emitState();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): VoiceControlState {
    return {
      isListening: this.isListening,
      isProcessing: this.isProcessing,
      isSupported: this.isSupported,
      isSpeaking: this.isSpeaking,
      engineMode: this.engineMode,
      audioLevel: this.audioLevel,
      transcript: this.transcript,
      interimTranscript: this.interimTranscript,
      confidence: this.confidence,
      lastCommand: this.lastCommand,
      lastFeedback: this.lastFeedback,
      badgeCount: this.activeBadgeElements.length,
      voiceFeedbackEnabled: this.voiceFeedbackEnabled,
      speechRate: this.speechRate,
      selectedVoiceName: this.selectedVoice?.name || null,
      error: this.error,
      source: this.source
    };
  }

  private emitState(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (e) {}
    });
  }
}

export const voiceEngine = new VoiceControlEngine();

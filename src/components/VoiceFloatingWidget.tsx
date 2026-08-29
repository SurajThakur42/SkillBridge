import React, { useState, useEffect, useRef } from 'react';
import { useVoiceControl } from '../context/VoiceControlContext.js';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  Hash,
  BookOpen,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
  Cpu,
  Keyboard,
  Minimize2,
  Maximize2,
  Activity,
  CheckCircle2
} from 'lucide-react';

export function VoiceFloatingWidget() {
  const {
    isListening,
    isProcessing,
    isSupported,
    isSpeaking,
    transcript,
    interimTranscript,
    lastCommand,
    lastFeedback,
    confidence,
    source,
    engineMode,
    audioLevel,
    setEngineMode,
    toggleListening,
    startPushToTalk,
    stopPushToTalk,
    executeCommand,
    speak,
    stopSpeaking,
    setShowHelpModal,
    showBadges,
    toggleBadges,
    voiceFeedbackEnabled,
    setVoiceFeedbackEnabled,
    readCurrentPage,
  } = useVoiceControl();

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [isPushHolding, setIsPushHolding] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  // Auto-expand on wake-word recognition or voice open triggers
  useEffect(() => {
    const handleOpenHud = () => {
      setIsMinimized(false);
    };
    const handleCloseHud = () => {
      setIsMinimized(true);
    };
    window.addEventListener('skillbridge-voice-open-hud', handleOpenHud);
    window.addEventListener('skillbridge-voice-close-hud', handleCloseHud);
    return () => {
      window.removeEventListener('skillbridge-voice-open-hud', handleOpenHud);
      window.removeEventListener('skillbridge-voice-close-hud', handleCloseHud);
    };
  }, []);

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;

    const cmd = manualText.trim();
    setManualText('');
    await executeCommand(cmd);
  };

  // Push-to-talk mouse / touch handlers
  const handlePushDown = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsPushHolding(true);
    await startPushToTalk();
  };

  const handlePushUp = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isPushHolding) {
      setIsPushHolding(false);
      await stopPushToTalk();
    }
  };

  // Dynamic visualizer bars height
  const barHeights = [
    Math.max(4, Math.round(audioLevel * 20)),
    Math.max(6, Math.round(audioLevel * 28)),
    Math.max(8, Math.round(audioLevel * 32)),
    Math.max(5, Math.round(audioLevel * 24)),
    Math.max(7, Math.round(audioLevel * 30)),
    Math.max(4, Math.round(audioLevel * 18)),
  ];

  if (!isSupported) {
    return null;
  }

  return (
    <div
      id="voice-control-hud"
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end transition-all duration-300 pointer-events-auto"
    >
      {/* 1. Collapsed Floating Action Pill */}
      {isMinimized ? (
        <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full shadow-2xl p-1.5 pl-3 transition-all animate-in fade-in zoom-in-95">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 pr-1 cursor-pointer ${
              isListening ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'
            }`}
            title={isListening ? 'Voice listening active (Say "voice off" or click to pause)' : 'Voice standby (Say "voice" or click to activate)'}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-blue-500 animate-pulse'}`} />
            <Mic className="w-4 h-4" />
            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-semibold">
                {isListening ? 'Listening...' : 'Voice AI'}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">
                {isListening ? 'Say a command' : 'Say "voice"'}
              </span>
            </div>
          </button>

          {isListening && (
            <div className="flex items-end gap-0.5 h-3 px-1">
              <span className="w-0.5 bg-rose-500 rounded-full" style={{ height: `${Math.max(3, barHeights[0] / 2)}px` }} />
              <span className="w-0.5 bg-rose-500 rounded-full" style={{ height: `${Math.max(4, barHeights[1] / 2)}px` }} />
              <span className="w-0.5 bg-rose-500 rounded-full" style={{ height: `${Math.max(3, barHeights[2] / 2)}px` }} />
            </div>
          )}

          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Expand Voice Assistant Window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* 2. Full-Featured Voice Assistant HUD Card */
        <div className="w-[340px] sm:w-[380px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-2">
          {/* Header Bar */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight leading-none">
                    SkillBridge Voice AI
                  </h3>
                  <span className={`w-2 h-2 rounded-full ${
                    isListening ? 'bg-emerald-300 animate-pulse' :
                    isProcessing ? 'bg-amber-300 animate-spin' :
                    isSpeaking ? 'bg-cyan-300 animate-bounce' : 'bg-white/40'
                  }`} />
                </div>
                <p className="text-[10px] text-blue-100 font-medium leading-none mt-0.5">
                  {isListening ? 'Active Listening' : isProcessing ? 'Processing Intent' : isSpeaking ? 'Audio Feedback' : 'Ready'}
                </p>
              </div>
            </div>

            {/* Quick Engine Switcher & Window Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEngineMode(
                  engineMode === 'HYBRID' ? 'WEB_SPEECH' :
                  engineMode === 'WEB_SPEECH' ? 'NEURAL_AI' : 'HYBRID'
                )}
                className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Click to toggle engine (Hybrid / Web Speech / Neural Whisper)"
              >
                <Cpu className="w-3 h-3" />
                <span>
                  {engineMode === 'HYBRID' ? 'Hybrid' :
                   engineMode === 'WEB_SPEECH' ? 'Native' : 'Whisper'}
                </span>
              </button>

              <button
                onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  voiceFeedbackEnabled ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                }`}
                title={voiceFeedbackEnabled ? 'Speech Audio Feedback Enabled (Click to mute)' : 'Speech Audio Feedback Muted (Click to enable)'}
              >
                {voiceFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Minimize Voice HUD"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transcript / Feedback State Area */}
          <div className="p-4 space-y-3">
            {/* Live Audio Visualizer & Status */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 min-h-[72px] flex flex-col justify-center">
              {isListening ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                        {isPushHolding ? 'Push-To-Talk Active' : 'Listening for command...'}
                      </span>
                    </div>

                    {/* Waveform Bars */}
                    <div className="flex items-end gap-1 h-5">
                      {barHeights.map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-full transition-all duration-75"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {interimTranscript ? (
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium italic">
                      "{interimTranscript}..."
                    </p>
                  ) : transcript ? (
                    <p className="text-xs text-slate-900 dark:text-white font-semibold">
                      "{transcript}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Speak clearly (e.g. "go to courses", "skill gap", "take quiz", "dark mode")...
                    </p>
                  )}
                </div>
              ) : isProcessing ? (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Analyzing Intent...</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Translating voice to navigation command</p>
                  </div>
                </div>
              ) : isSpeaking ? (
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Speaking Feedback</h4>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {lastFeedback || 'Assistant response'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={stopSpeaking}
                    className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 hover:bg-rose-200 cursor-pointer"
                  >
                    Mute
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lastCommand ? `Last Command: "${lastCommand}"` : 'Voice Assistant Ready'}
                    </span>
                    {source && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {source}
                      </span>
                    )}
                  </div>
                  {lastFeedback ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{lastFeedback}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Click the microphone or press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">Alt+V</kbd> to talk.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-voice-mic-main"
                onClick={toggleListening}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white ring-2 ring-red-400/40 animate-pulse'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                }`}
              >
                <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
                <span>{isListening ? 'Pause Listening' : 'Start Listening'}</span>
              </button>

              <button
                id="btn-voice-push-to-talk"
                onMouseDown={handlePushDown}
                onMouseUp={handlePushUp}
                onTouchStart={handlePushDown}
                onTouchEnd={handlePushUp}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all select-none flex items-center justify-center gap-1.5 cursor-pointer ${
                  isPushHolding
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isPushHolding ? 'animate-spin' : ''}`} />
                <span>{isPushHolding ? 'Release to Send' : 'Hold to Speak'}</span>
              </button>
            </div>

            {/* Quick Controls Bar (Badges, Read Page, Help, Keyboard) */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                id="btn-voice-badges-toggle"
                onClick={toggleBadges}
                className={`p-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  showBadges
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Toggle numbered badges on clickable elements (Alt+B)"
              >
                <Hash className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span># Badges</span>
              </button>

              <button
                onClick={readCurrentPage}
                className="p-2 rounded-xl text-[11px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                title="Read current page content aloud"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Read Page</span>
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-xl text-[11px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                title="View Voice Commands Cheatsheet (Alt+H)"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Help</span>
              </button>

              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className={`p-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  showManualInput
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Type a voice command manually"
              >
                <Keyboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Type</span>
              </button>
            </div>

            {/* Expandable Manual Text Input */}
            {showManualInput && (
              <form onSubmit={handleManualSubmit} className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                <input
                  id="input-voice-text-command"
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Type voice command (e.g. 'go to courses')..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!manualText.trim()}
                  className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all cursor-pointer shadow-xs shrink-0"
                  title="Run command"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Quick Command Suggestions Chips */}
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                Suggested Commands:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  'go to courses',
                  'open skill gap',
                  'my certificates',
                  'show numbers',
                  'toggle dark mode',
                  'go to dashboard'
                ].map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => executeCommand(phrase)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium transition-all shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

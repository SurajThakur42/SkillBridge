import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { voiceEngine, VoiceCommandConfig, VoiceControlState, VoiceTargetElement, VoiceEngineMode } from '../lib/voice-control.js';
import { useAuth } from './AuthContext.js';
import { useTheme } from './ThemeContext.js';
import { playVoiceListenSound, playVoiceStopSound, playVoiceRecognizedSound, playClickSound } from '../lib/sound.js';

interface VoiceControlContextType {
  // State
  state: VoiceControlState;
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  isSpeaking: boolean;
  engineMode: VoiceEngineMode;
  audioLevel: number;
  transcript: string;
  interimTranscript: string;
  lastCommand: string;
  lastFeedback: string;
  confidence: number;
  source: 'gemini-neural' | 'web-speech' | 'fuzzy-engine' | null;
  voiceFeedbackEnabled: boolean;
  showHelpModal: boolean;
  showBadges: boolean;
  activeBadges: VoiceTargetElement[];
  speechRate: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceName: string | null;

  // Actions
  startListening: () => boolean;
  stopListening: () => void;
  toggleListening: () => boolean;
  startPushToTalk: () => Promise<boolean>;
  stopPushToTalk: () => Promise<any>;
  setEngineMode: (mode: VoiceEngineMode) => void;
  executeCommand: (phrase: string) => Promise<{ success: boolean; feedback: string }>;
  speak: (text: string, force?: boolean) => void;
  stopSpeaking: () => void;
  setShowHelpModal: (show: boolean) => void;
  setShowBadges: (show: boolean) => void;
  toggleBadges: () => void;
  setVoiceFeedbackEnabled: (enabled: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setSelectedVoice: (voiceName: string) => void;
  registerCustomCommand: (command: VoiceCommandConfig) => () => void;
  readCurrentPage: () => void;
  refreshBadges: () => void;
}

const VoiceControlContext = createContext<VoiceControlContextType | undefined>(undefined);

export function VoiceControlProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, switchDemoRole, logout } = useAuth();
  const { toggleTheme, soundEnabled, setSoundEnabled, isDark } = useTheme();

  const [state, setState] = useState<VoiceControlState>(voiceEngine.getState());
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showBadges, setShowBadgesState] = useState<boolean>(false);
  const [activeBadges, setActiveBadges] = useState<VoiceTargetElement[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Keep engine's context provider updated
  useEffect(() => {
    voiceEngine.setContextProvider(() => ({
      currentPath: location.pathname,
      currentRole: role || 'LEARNER'
    }));
  }, [location.pathname, role]);

  // Subscribe to engine state
  useEffect(() => {
    const unsubscribe = voiceEngine.subscribe(newState => {
      setState(newState);
      setShowBadgesState(voiceEngine.getBadgesVisible());
      setActiveBadges(voiceEngine.getActiveBadges());
    });

    setAvailableVoices(voiceEngine.getAvailableVoices());
    return () => unsubscribe();
  }, []);

  // Listen for navigation events triggered by Neural AI
  useEffect(() => {
    const handleVoiceNav = (e: any) => {
      if (e.detail?.path) {
        navigate(e.detail.path);
      }
    };
    window.addEventListener('skillbridge-voice-navigate', handleVoiceNav);
    // Listen for help modal open events triggered by voice
    const handleVoiceHelp = () => {
      setShowHelpModal(true);
    };
    window.addEventListener('skillbridge-voice-open-help', handleVoiceHelp);

    return () => {
      window.removeEventListener('skillbridge-voice-navigate', handleVoiceNav);
      window.removeEventListener('skillbridge-voice-open-help', handleVoiceHelp);
    };
  }, [navigate]);

  // Auto-activate voice listening standby on user first interaction or mount
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!voiceEngine.getState().isListening) {
        voiceEngine.start();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    // Attempt direct startup
    try {
      voiceEngine.start();
    } catch (e) {}

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Update badges on route change or DOM changes if badge overlay is active
  useEffect(() => {
    if (showBadges) {
      const timer = setTimeout(() => {
        const badges = voiceEngine.refreshVoiceBadges();
        setActiveBadges(badges);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, showBadges]);

  // Register SkillBridge application routes & commands
  useEffect(() => {
    const unregisters: (() => void)[] = [];

    const reg = (cmd: VoiceCommandConfig) => {
      unregisters.push(voiceEngine.registerCommand(cmd));
    };

    // 1. Persona / Demo Role Switching Commands (Highest Priority)
    reg({
      id: 'role-switch-learner',
      category: 'interaction',
      regex: /^(?:switch\s+(?:to\s+|role\s+to\s+|into\s+)?|be\s+|login\s+as\s+|i\s+am\s+(?:a\s+)?)learner(?:\s+mode|\s+persona|\s+demo)?$/i,
      phrases: ['switch to learner', 'switch role to learner', 'i am a learner', 'login as learner', 'aarav', 'learner mode', 'learner demo', 'student mode'],
      description: 'Switch persona to Learner (Aarav Sharma)',
      action: async () => {
        await switchDemoRole('LEARNER');
        navigate('/learner/dashboard');
        return 'Switched demo persona to Learner: Aarav Sharma';
      }
    });

    reg({
      id: 'role-switch-trainer',
      category: 'interaction',
      regex: /^(?:switch\s+(?:to\s+|role\s+to\s+|into\s+)?|be\s+|login\s+as\s+|i\s+am\s+(?:a\s+)?)trainer(?:\s+mode|\s+persona|\s+demo)?$/i,
      phrases: ['switch to trainer', 'switch role to trainer', 'i am a trainer', 'login as trainer', 'vikram', 'trainer mode', 'trainer demo', 'faculty mode'],
      description: 'Switch persona to Trainer (Dr. Vikram Roy)',
      action: async () => {
        await switchDemoRole('TRAINER');
        navigate('/trainer/dashboard');
        return 'Switched demo persona to Trainer: Dr. Vikram Roy';
      }
    });

    reg({
      id: 'role-switch-admin',
      category: 'interaction',
      regex: /^(?:switch\s+(?:to\s+|role\s+to\s+|into\s+)?|be\s+|login\s+as\s+|i\s+am\s+(?:an\s+)?)admin(?:istrator)?(?:\s+mode|\s+persona|\s+demo)?$/i,
      phrases: ['switch to admin', 'switch role to admin', 'i am an admin', 'login as admin', 'rajeshwar', 'admin mode', 'admin demo', 'executive mode'],
      description: 'Switch persona to Admin (Prof. Rajeshwar Sen)',
      action: async () => {
        await switchDemoRole('ADMIN');
        navigate('/admin/dashboard');
        return 'Switched demo persona to Admin: Prof. Rajeshwar Sen';
      }
    });

    // 2. Navigation Commands
    reg({
      id: 'nav-dashboard',
      category: 'navigation',
      phrases: ['go to dashboard', 'open dashboard', 'view dashboard', 'dashboard', 'home', 'go home', 'overview', 'trainer overview'],
      description: 'Navigate to user dashboard and learning roadmap',
      action: () => {
        if (role === 'ADMIN') navigate('/admin/dashboard');
        else if (role === 'TRAINER') navigate('/trainer/dashboard');
        else navigate('/learner/dashboard');
        return 'Opening Dashboard';
      }
    });

    reg({
      id: 'nav-courses',
      category: 'navigation',
      phrases: ['go to courses', 'open courses', 'course catalog', 'view courses', 'all courses', 'browse courses', 'lessons', 'catalog', 'manage courses'],
      description: 'Navigate to Course Catalog or Course Management',
      action: () => {
        if (role === 'TRAINER') navigate('/trainer/courses');
        else navigate('/learner/courses');
        return role === 'TRAINER' ? 'Opening Course Management Studio' : 'Opening Course Catalog';
      }
    });

    reg({
      id: 'nav-trainer-manage-courses',
      category: 'navigation',
      phrases: ['manage courses', 'trainer courses', 'course studio', 'curriculum studio', 'my authored courses'],
      description: 'Open Trainer Manage Courses Studio',
      action: async () => {
        if (role !== 'TRAINER' && role !== 'ADMIN') {
          await switchDemoRole('TRAINER');
        }
        navigate('/trainer/courses');
        return 'Opening Manage Courses Studio';
      }
    });

    reg({
      id: 'nav-trainer-overview',
      category: 'navigation',
      phrases: ['trainer overview', 'faculty overview', 'trainer metrics', 'trainer dashboard'],
      description: 'Open Trainer Overview and Analytics',
      action: async () => {
        if (role !== 'TRAINER' && role !== 'ADMIN') {
          await switchDemoRole('TRAINER');
        }
        navigate('/trainer/dashboard');
        return 'Opening Trainer Overview';
      }
    });

    reg({
      id: 'nav-skills',
      category: 'navigation',
      phrases: ['go to skills', 'open skills', 'skill profile', 'my skills', 'view skills', 'skills matrix', 'competencies'],
      description: 'Navigate to Learner Skill Profile',
      action: async () => {
        if (role !== 'LEARNER') {
          await switchDemoRole('LEARNER');
        }
        navigate('/learner/skills');
        return 'Opening Skill Profile';
      }
    });

    reg({
      id: 'nav-skill-gap',
      category: 'navigation',
      phrases: ['go to skill gap', 'skill gap analysis', 'open skill gap', 'view skill gap', 'competency gap', 'gap analysis', 'readiness report'],
      description: 'Navigate to Skill Gap Analysis',
      action: async () => {
        if (role !== 'LEARNER') {
          await switchDemoRole('LEARNER');
        }
        navigate('/learner/skill-gap');
        return 'Opening Skill-Gap Analysis';
      }
    });

    reg({
      id: 'nav-recommendations',
      category: 'navigation',
      phrases: ['go to recommendations', 'open recommendations', 'suggested courses', 'recommended courses', 'view recommendations', 'ai recommendations', 'recs'],
      description: 'Navigate to Personalized AI Recommendations',
      action: async () => {
        if (role !== 'LEARNER') {
          await switchDemoRole('LEARNER');
        }
        navigate('/learner/recommendations');
        return 'Opening Course Recommendations';
      }
    });

    reg({
      id: 'nav-certificates',
      category: 'navigation',
      phrases: ['go to certificates', 'open certificates', 'my certificates', 'credentials', 'view certificates', 'diplomas'],
      description: 'Navigate to Verifiable Certificates',
      action: async () => {
        if (role !== 'LEARNER') {
          await switchDemoRole('LEARNER');
        }
        navigate('/learner/certificates');
        return 'Opening Verifiable Certificates';
      }
    });

    reg({
      id: 'nav-profile',
      category: 'navigation',
      phrases: ['go to profile', 'open profile', 'settings', 'my account', 'account settings', 'target role settings'],
      description: 'Navigate to Account Profile and Target Role settings',
      action: async () => {
        if (role !== 'LEARNER') {
          await switchDemoRole('LEARNER');
        }
        navigate('/learner/profile');
        return 'Opening Profile & Target Role Settings';
      }
    });

    // Trainer Specific Navigation
    reg({
      id: 'nav-create-course',
      category: 'navigation',
      phrases: ['create course', 'new course', 'add course', 'open create course', 'course builder'],
      description: 'Open Trainer Create Course Builder',
      action: async () => {
        if (role !== 'TRAINER' && role !== 'ADMIN') {
          await switchDemoRole('TRAINER');
        }
        navigate('/trainer/courses/create');
        return 'Opening Course Creator';
      }
    });

    reg({
      id: 'nav-trainer-learners',
      category: 'navigation',
      regex: /^(?:go\s+to\s+|open\s+|view\s+)?(?:enrolled\s+learners|student\s+list|learners\s+roster|cohorts)$/i,
      phrases: ['enrolled learners', 'view enrolled learners', 'student list', 'open learners roster', 'learners roster', 'cohort roster'],
      description: 'View Enrolled Learners Roster',
      action: async () => {
        if (role !== 'TRAINER' && role !== 'ADMIN') {
          await switchDemoRole('TRAINER');
        }
        navigate('/trainer/learners');
        return 'Opening Enrolled Learners';
      }
    });

    // Admin Specific Navigation
    reg({
      id: 'nav-admin-users',
      category: 'navigation',
      phrases: ['manage users', 'user directory', 'admin users', 'open users', 'user list', 'employees'],
      description: 'Open Admin User Directory',
      action: async () => {
        if (role !== 'ADMIN') {
          await switchDemoRole('ADMIN');
        }
        navigate('/admin/users');
        return 'Opening User Directory';
      }
    });

    reg({
      id: 'nav-admin-reports',
      category: 'navigation',
      phrases: ['admin reports', 'executive reports', 'view reports', 'open reports', 'analytics reports', 'skill audit'],
      description: 'Open Admin Executive Reports',
      action: async () => {
        if (role !== 'ADMIN') {
          await switchDemoRole('ADMIN');
        }
        navigate('/admin/reports');
        return 'Opening Executive Reports';
      }
    });

    // 2. Interactive & UI Commands
    reg({
      id: 'action-toggle-theme',
      category: 'interaction',
      phrases: ['toggle theme', 'toggle dark mode', 'dark mode', 'light mode', 'switch theme', 'turn on dark mode', 'turn on light mode', 'duck mode'],
      description: 'Toggle between Dark and Light color theme',
      action: () => {
        toggleTheme();
        return isDark ? 'Switched to Light Mode' : 'Switched to Dark Mode';
      }
    });

    reg({
      id: 'action-toggle-sound',
      category: 'interaction',
      phrases: ['toggle sound', 'mute sound', 'unmute sound', 'enable audio', 'disable audio', 'ui sound'],
      description: 'Toggle UI interactive audio sound effects',
      action: () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        return next ? 'Sound effects enabled' : 'Sound effects disabled';
      }
    });

    reg({
      id: 'action-open-ai',
      category: 'interaction',
      phrases: ['open capacity ai', 'open ai', 'ask ai', 'capacity ai', 'open copilot', 'ai assistant', 'open advisor'],
      description: 'Open Capacity AI Copilot dialog',
      action: () => {
        const btn = document.getElementById('btn-open-capacity-ai');
        if (btn) {
          voiceEngine.triggerElementAction(btn);
          return 'Opening Capacity AI Copilot';
        }
        return 'Capacity AI button not found on this screen';
      }
    });

    reg({
      id: 'action-open-notifications',
      category: 'interaction',
      phrases: ['notifications', 'open notifications', 'show notifications', 'my alerts'],
      description: 'Open Notifications popup menu',
      action: () => {
        const btn = document.getElementById('btn-notifications');
        if (btn) {
          voiceEngine.triggerElementAction(btn);
          return 'Toggled Notifications';
        }
        return 'Notification bell not found';
      }
    });

    // 3. System & Voice Wake Word / Activation Commands
    reg({
      id: 'voice-wake-open',
      category: 'system',
      regex: /^(?:voice(?:\s+command)?\s+(?:open|on|start|activate)|open\s+voice(?:\s+commands?|\s+ai|\s+assistant)?|activate\s+voice|start\s+voice|turn\s+on\s+voice|enable\s+voice|voice\s+ai(?:\s+on)?|voice\s+assistant|voice\s+mode|voice\s+control|hey\s+voice|wake\s+up(?:\s+voice)?|voice)$/i,
      phrases: [
        'voice command open',
        'open voice',
        'open voice command',
        'open voice commands',
        'voice',
        'voice on',
        'activate voice',
        'start voice',
        'turn on voice',
        'voice ai',
        'voice ai on',
        'enable voice',
        'voice assistant',
        'voice mode',
        'voice control',
        'hey voice',
        'voice open',
        'wake up voice',
        'start listening',
        'listen to me'
      ],
      description: 'Automatically wake up Voice AI, expand assistant HUD, and begin active listening',
      action: () => {
        voiceEngine.start();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('skillbridge-voice-open-hud'));
        }
        return 'Voice AI is active and listening. How can I help you?';
      }
    });

    reg({
      id: 'voice-wake-close',
      category: 'system',
      regex: /^(?:voice\s+(?:off|close|sleep|stop|pause|hide|minimize)|turn\s+off\s+voice|close\s+voice|stop\s+listening|pause\s+voice|deactivate\s+voice)$/i,
      phrases: [
        'voice off',
        'close voice',
        'voice close',
        'turn off voice',
        'stop listening',
        'pause voice',
        'minimize voice',
        'hide voice',
        'voice sleep'
      ],
      description: 'Minimize voice assistant and pause continuous listening',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('skillbridge-voice-close-hud'));
        }
        return 'Voice assistant minimized.';
      }
    });

    reg({
      id: 'system-help',
      category: 'system',
      phrases: ['what can i say', 'voice help', 'help', 'show commands', 'list commands', 'voice commands', 'open help'],
      description: 'Open Voice Command Center and help cheatsheet',
      action: () => {
        setShowHelpModal(true);
        return 'Opening Voice Command Center. Here is everything you can say.';
      }
    });

    reg({
      id: 'system-close-modal',
      category: 'system',
      phrases: ['close modal', 'close help', 'close popup', 'close window', 'dismiss', 'exit'],
      description: 'Close active modal or drawer dialog',
      action: () => {
        setShowHelpModal(false);
        const closeBtns = Array.from(document.querySelectorAll<HTMLElement>('button[aria-label="Close"], button.close-modal, [data-modal-close]'));
        if (closeBtns.length > 0) {
          voiceEngine.triggerElementAction(closeBtns[0]);
        }
        return 'Closed modal';
      }
    });

    // 5. Auth & Logout
    reg({
      id: 'auth-logout',
      category: 'interaction',
      phrases: ['sign out', 'log out', 'logout', 'sign off'],
      description: 'Sign out of the current session',
      action: () => {
        logout();
        navigate('/login');
        return 'Signed out successfully';
      }
    });

    return () => {
      unregisters.forEach(unreg => unreg());
    };
  }, [navigate, role, toggleTheme, soundEnabled, setSoundEnabled, isDark, switchDemoRole, logout]);

  // Global Keyboard Shortcuts (Alt+V for Mic, Alt+H for Help, Alt+B for Badges, Alt+E for Engine Toggle, Escape to stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + V: Toggle Voice Recognition
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        const active = voiceEngine.toggle();
        if (active) {
          playVoiceListenSound(soundEnabled);
        } else {
          playVoiceStopSound(soundEnabled);
        }
        return;
      }

      // Alt + H: Toggle Voice Help
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setShowHelpModal(prev => !prev);
        playClickSound(soundEnabled);
        return;
      }

      // Alt + B: Toggle Voice Badges (show numbers)
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleBadges();
        playClickSound(soundEnabled);
        return;
      }

      // Escape: Stop speaking or close modals
      if (e.key === 'Escape') {
        if (state.isSpeaking) {
          voiceEngine.stopSpeaking();
        }
        if (showHelpModal) {
          setShowHelpModal(false);
        }
        if (showBadges) {
          voiceEngine.setBadgesVisible(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundEnabled, state.isSpeaking, showHelpModal, showBadges]);

  // Context Action Wrappers
  const startListening = useCallback(() => {
    const ok = voiceEngine.start();
    if (ok) playVoiceListenSound(soundEnabled);
    return ok;
  }, [soundEnabled]);

  const stopListening = useCallback(() => {
    voiceEngine.stop();
    playVoiceStopSound(soundEnabled);
  }, [soundEnabled]);

  const toggleListening = useCallback(() => {
    const active = voiceEngine.toggle();
    if (active) {
      playVoiceListenSound(soundEnabled);
    } else {
      playVoiceStopSound(soundEnabled);
    }
    return active;
  }, [soundEnabled]);

  const startPushToTalk = useCallback(async () => {
    playVoiceListenSound(soundEnabled);
    return await voiceEngine.startPushToTalk();
  }, [soundEnabled]);

  const stopPushToTalk = useCallback(async () => {
    playVoiceStopSound(soundEnabled);
    return await voiceEngine.stopPushToTalk();
  }, [soundEnabled]);

  const setEngineMode = useCallback((mode: VoiceEngineMode) => {
    voiceEngine.setEngineMode(mode);
  }, []);

  const executeCommand = useCallback(async (phrase: string) => {
    playVoiceRecognizedSound(soundEnabled);
    return await voiceEngine.executeCommand(phrase);
  }, [soundEnabled]);

  const speak = useCallback((text: string, force: boolean = false) => {
    voiceEngine.speak(text, force);
  }, []);

  const stopSpeaking = useCallback(() => {
    voiceEngine.stopSpeaking();
  }, []);

  const toggleBadges = useCallback(() => {
    const next = !voiceEngine.getBadgesVisible();
    voiceEngine.setBadgesVisible(next);
    setShowBadgesState(next);
    if (next) {
      const badges = voiceEngine.refreshVoiceBadges();
      setActiveBadges(badges);
      voiceEngine.speak(`Voice badges active. Say click and any number.`, false);
    } else {
      setActiveBadges([]);
    }
  }, []);

  const setVoiceFeedbackEnabled = useCallback((enabled: boolean) => {
    voiceEngine.setVoiceFeedbackEnabled(enabled);
  }, []);

  const setSpeechRate = useCallback((rate: number) => {
    voiceEngine.setSpeechRate(rate);
  }, []);

  const setSelectedVoice = useCallback((voiceName: string) => {
    voiceEngine.setSelectedVoice(voiceName);
  }, []);

  const registerCustomCommand = useCallback((cmd: VoiceCommandConfig) => {
    return voiceEngine.registerCommand(cmd);
  }, []);

  const readCurrentPage = useCallback(() => {
    voiceEngine.executeCommand('read this page');
  }, []);

  const refreshBadges = useCallback(() => {
    if (voiceEngine.getBadgesVisible()) {
      const badges = voiceEngine.refreshVoiceBadges();
      setActiveBadges(badges);
    }
  }, []);

  const value = useMemo(() => ({
    state,
    isListening: state.isListening,
    isProcessing: state.isProcessing,
    isSupported: state.isSupported,
    isSpeaking: state.isSpeaking,
    engineMode: state.engineMode,
    audioLevel: state.audioLevel,
    transcript: state.transcript,
    interimTranscript: state.interimTranscript,
    lastCommand: state.lastCommand,
    lastFeedback: state.lastFeedback,
    confidence: state.confidence,
    source: state.source,
    voiceFeedbackEnabled: state.voiceFeedbackEnabled,
    showHelpModal,
    showBadges,
    activeBadges,
    speechRate: state.speechRate,
    availableVoices,
    selectedVoiceName: state.selectedVoiceName,

    startListening,
    stopListening,
    toggleListening,
    startPushToTalk,
    stopPushToTalk,
    setEngineMode,
    executeCommand,
    speak,
    stopSpeaking,
    setShowHelpModal,
    setShowBadges: (show: boolean) => {
      voiceEngine.setBadgesVisible(show);
      setShowBadgesState(show);
    },
    toggleBadges,
    setVoiceFeedbackEnabled,
    setSpeechRate,
    setSelectedVoice,
    registerCustomCommand,
    readCurrentPage,
    refreshBadges
  }), [
    state,
    showHelpModal,
    showBadges,
    activeBadges,
    availableVoices,
    startListening,
    stopListening,
    toggleListening,
    startPushToTalk,
    stopPushToTalk,
    setEngineMode,
    executeCommand,
    speak,
    stopSpeaking,
    toggleBadges,
    setVoiceFeedbackEnabled,
    setSpeechRate,
    setSelectedVoice,
    registerCustomCommand,
    readCurrentPage,
    refreshBadges
  ]);

  return (
    <VoiceControlContext.Provider value={value}>
      <div 
        id="voice-control-live-announcer" 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
      />
      {children}
    </VoiceControlContext.Provider>
  );
}

export function useVoiceControl() {
  const context = useContext(VoiceControlContext);
  if (!context) {
    throw new Error('useVoiceControl must be used within a VoiceControlProvider');
  }
  return context;
}

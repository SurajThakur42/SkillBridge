import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useVoiceControl } from '../context/VoiceControlContext.js';
import { TargetRole, NotificationItem } from '../types.js';
import { api } from '../lib/api.js';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Bell,
  Sparkles,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Target,
  CheckCircle,
  Award,
  BookOpen,
  Check,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Search,
  Sliders,
  Mic,
  HelpCircle
} from 'lucide-react';
import { CapacityAiModal } from './CapacityAiModal.js';
import { playClickSound } from '../lib/sound.js';

export function Navbar() {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme, isDark, soundEnabled, setSoundEnabled } = useTheme();
  const { isListening, toggleListening, setShowHelpModal } = useVoiceControl();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifs, setShowNotifs] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadTargetRoles();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/api/users/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const loadTargetRoles = async () => {
    try {
      const res = await api.get('/api/users/target-roles');
      setTargetRoles(res.targetRoles || []);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    playClickSound(soundEnabled);
    try {
      await api.put('/api/users/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleSelectTargetRole = async (roleId: string) => {
    playClickSound(soundEnabled);
    try {
      await api.put('/api/users/me/target-role', { targetRoleId: roleId });
      setShowRoleModal(false);
      window.location.reload();
    } catch (err: any) {
      alert('Failed to update target role: ' + err.message);
    }
  };

  const currentTargetRole = targetRoles.find(r => r.id === user?.targetRoleId);

  return (
    <>
      <header id="main-header" className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-[37px] z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-5">
            <Link 
              to="/" 
              onClick={() => playClickSound(soundEnabled)}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 group-hover:shadow-blue-500/40 transition-all">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">SkillBridge</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                    SIH 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">Learn. Develop. Measure. Grow.</p>
              </div>
            </Link>

            {/* Target Role Pill (Learner View) */}
            {role === 'LEARNER' && (
              <button
                id="btn-target-role-pill"
                onClick={() => {
                  setShowRoleModal(true);
                  playClickSound(soundEnabled);
                }}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                title="Click to switch target role for skill-gap calculation"
              >
                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-500 dark:text-slate-400">Target:</span>
                <strong className="text-slate-900 dark:text-white font-semibold">{currentTargetRole?.name || 'Cloud Developer'}</strong>
                <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700 px-1.5 py-0.2 rounded-full font-bold">Change</span>
              </button>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Voice Control Top Trigger */}
            <button
              id="btn-navbar-voice-toggle"
              data-voice-command="voice listening, toggle voice, microphone"
              onClick={() => {
                toggleListening();
                playClickSound(soundEnabled);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                isListening
                  ? 'bg-red-500/10 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isListening ? 'Voice listening active (Alt+V to pause)' : 'Turn on Voice Control (Alt+V)'}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-red-500' : ''}`} />
              {isListening && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              id="btn-navbar-theme-toggle"
              data-voice-command="dark mode, light mode, toggle theme"
              onClick={() => {
                toggleTheme();
                playClickSound(soundEnabled);
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Capacity AI Copilot Trigger */}
            <button
              id="btn-open-capacity-ai"
              data-voice-command="capacity ai, ask ai, open copilot, open ai"
              onClick={() => {
                setIsAiModalOpen(true);
                playClickSound(soundEnabled);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-102 cursor-pointer ring-1 ring-blue-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="font-semibold">Capacity AI</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="btn-notifications"
                data-voice-command="notifications, alerts, open notifications"
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  setShowProfileMenu(false);
                  playClickSound(soundEnabled);
                }}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Notifications ({notifications.length})</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3.5 text-xs transition-colors ${
                            notif.isRead 
                              ? 'bg-white dark:bg-slate-900' 
                              : 'bg-blue-50/50 dark:bg-blue-950/30'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                              {notif.type === 'CERTIFICATE' ? <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-900 dark:text-white">{notif.title}</h5>
                              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifs(false);
                  playClickSound(soundEnabled);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <img
                  src={user?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/20 dark:ring-blue-400/30"
                />
                <div className="hidden lg:block text-left">
                  <span className="block text-xs font-bold text-slate-900 dark:text-white leading-none">{user?.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{user?.role}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {user?.organization || 'National Digital Academy'}
                    </div>
                  </div>

                  <Link
                    to={role === 'LEARNER' ? '/learner/profile' : role === 'TRAINER' ? '/trainer/dashboard' : '/admin/dashboard'}
                    onClick={() => {
                      setShowProfileMenu(false);
                      playClickSound(soundEnabled);
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    My Account & Settings
                  </Link>

                  {/* Sound Toggle row in menu */}
                  <button
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      playClickSound(!soundEnabled);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span>UI Audio Feedback</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${soundEnabled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {soundEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      playClickSound(soundEnabled);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Target Role Calibration Modal (SIH Step 4-5) */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Career Target Role</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SkillBridge will calibrate required competencies and dynamically identify skill gaps for your chosen target.
                </p>
              </div>
              <button 
                onClick={() => setShowRoleModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {targetRoles.map(r => {
                const isCurrent = r.id === user?.targetRoleId;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectTargetRole(r.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{r.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {r.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{r.description}</p>
                    </div>
                    {isCurrent && (
                      <div className="p-1.5 rounded-full bg-blue-600 text-white shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Modal Component */}
      <CapacityAiModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { Role } from '../types.js';
import {
  Sparkles,
  RefreshCw,
  UserCheck,
  Shield,
  BookOpen,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  Sun,
  Moon,
  Volume2,
  VolumeX
} from 'lucide-react';
import { api } from '../lib/api.js';
import { playClickSound, playSuccessSound } from '../lib/sound.js';

export function DemoBar() {
  const navigate = useNavigate();
  const { user, role, switchDemoRole, refreshUser } = useAuth();
  const { theme, toggleTheme, isDark, soundEnabled, setSoundEnabled } = useTheme();
  const [resetting, setResetting] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  const handleSwitch = async (r: Role) => {
    playClickSound(soundEnabled);
    await switchDemoRole(r);
    if (r === 'LEARNER') {
      navigate('/learner/dashboard');
    } else if (r === 'TRAINER') {
      navigate('/trainer/dashboard');
    } else if (r === 'ADMIN') {
      navigate('/admin/dashboard');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset database to clean Smart India Hackathon (SIH) seed state?')) return;
    setResetting(true);
    try {
      await api.post('/api/auth/reset-demo');
      await refreshUser();
      playSuccessSound(soundEnabled);
      window.location.reload();
    } catch (err: any) {
      alert('Error resetting demo: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const demoSteps = [
    { num: '1-3', label: 'Learner Skill Profile', desc: 'Inspect current baseline competencies (Python, Git, SQL).' },
    { num: '4-5', label: 'Select Target Role', desc: 'Switch to "Cloud Developer" to generate live gap analysis.' },
    { num: '6-7', label: 'Personalized Recommendations', desc: 'View weighted recommendations and prioritized Learning Path.' },
    { num: '8-11', label: 'Learn & Take Quiz', desc: 'Open recommended course, complete module, and take the 5-question assessment.' },
    { num: '12-15', label: 'Verify Competency Feedback Loop', desc: 'Witness automatic competency upgrade, skill gap reduction, and verifiable certificate generation.' },
    { num: '16-17', label: 'Admin Analytics', desc: 'Switch to Admin to view organization-wide competency distribution.' }
  ];

  return (
    <>
      <div id="sih-demo-bar" className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-slate-200 border-b border-slate-800 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/80 shadow-2xs">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            SIH 2026 Evaluation Bar
          </span>
          <span className="hidden sm:inline text-slate-400">
            Active: <strong className="text-white capitalize font-semibold">{user?.role || 'Guest'}</strong> ({user?.name || 'Not logged in'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden md:inline">Quick Persona:</span>
          
          <button
            id="btn-switch-learner"
            data-voice-command="switch to learner, aarav, learner persona"
            onClick={() => handleSwitch('LEARNER')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
              role === 'LEARNER' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            Learner (Aarav)
          </button>

          <button
            id="btn-switch-trainer"
            data-voice-command="switch to trainer, vikram, trainer persona"
            onClick={() => handleSwitch('TRAINER')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
              role === 'TRAINER' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-400' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Trainer (Dr. Vikram)
          </button>

          <button
            id="btn-switch-admin"
            data-voice-command="switch to admin, rajeshwar, admin persona"
            onClick={() => handleSwitch('ADMIN')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
              role === 'ADMIN' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Shield className="w-3 h-3" />
            Admin (Prof. Rajeshwar)
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          {/* Theme Quick Toggle in DemoBar */}
          <button
            id="btn-demobar-toggle-theme"
            data-voice-command="toggle dark mode, toggle theme"
            onClick={() => {
              toggleTheme();
              playClickSound(soundEnabled);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
            <span className="hidden xl:inline text-[11px] font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-demobar-toggle-sound"
            data-voice-command="toggle sound, audio feedback"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playClickSound(true);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={soundEnabled ? 'Disable Interactive Sound SFX' : 'Enable Interactive Sound SFX'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          <button
            id="btn-demo-guide"
            data-voice-command="demo script, evaluation guide, show guide"
            onClick={() => {
              setShowDemoGuide(!showDemoGuide);
              playClickSound(soundEnabled);
            }}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
            title="View 3-Minute SIH Demo Script"
          >
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline text-[11px]">Demo Script</span>
          </button>

          <button
            id="btn-reset-seed"
            data-voice-command="reset seed, reset demo, reset database"
            onClick={handleReset}
            disabled={resetting}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
            title="Reset DB to initial seed state"
          >
            <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden lg:inline text-[11px]">Reset Seed</span>
          </button>
        </div>
      </div>

      {/* Demo Guide Drawer / Banner */}
      {showDemoGuide && (
        <div id="demo-guide-modal" className="bg-slate-950/95 border-b border-slate-800 p-4 text-slate-200 text-xs shadow-2xl backdrop-blur-md">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-semibold text-sm text-white">Smart India Hackathon (SIH 2026) Recommended 3-Minute Demo Flow</h4>
              </div>
              <button 
                onClick={() => setShowDemoGuide(false)}
                className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close Guide
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
              {demoSteps.map((step, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex gap-2">
                  <span className="px-1.5 py-0.5 h-fit rounded bg-blue-900/80 text-blue-300 font-mono text-[10px] font-bold shrink-0">
                    {step.num}
                  </span>
                  <div>
                    <strong className="text-slate-100 block">{step.label}</strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed block">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, Sparkles, User, Shield, BookOpen, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { playClickSound, playSuccessSound, playErrorSound } from '../../lib/sound.js';

export function LoginPage() {
  const { login, switchDemoRole } = useAuth();
  const { soundEnabled } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    playClickSound(soundEnabled);

    try {
      await login(email, password);
      playSuccessSound(soundEnabled);
      navigate('/');
    } catch (err: any) {
      playErrorSound(soundEnabled);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'LEARNER' | 'TRAINER' | 'ADMIN') => {
    playClickSound(soundEnabled);
    setLoading(true);
    try {
      await switchDemoRole(role);
      playSuccessSound(soundEnabled);
      navigate('/');
    } catch (err: any) {
      playErrorSound(soundEnabled);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/30 text-white mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">SkillBridge</h2>
        <p className="mt-2 text-sm text-slate-400">
          Smart India Hackathon 2026 • Digital Capacity-Building Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-800 transition-colors">
          {/* Quick Demo Selection Card for SIH Evaluators */}
          <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
            <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-bold text-xs mb-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>SIH Hackathon 1-Click Demo Logins:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                id="btn-demo-learner"
                onClick={() => handleQuickDemo('LEARNER')}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Learner</span>
              </button>
              <button
                type="button"
                id="btn-demo-trainer"
                onClick={() => handleQuickDemo('TRAINER')}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 hover:border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-900/50 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Trainer</span>
              </button>
              <button
                type="button"
                id="btn-demo-admin"
                onClick={() => handleQuickDemo('ADMIN')}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 hover:border-purple-500 hover:bg-purple-100/50 dark:hover:bg-purple-900/50 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="learner@capacityconnect.demo"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to SkillBridge'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500">
                Register as Learner
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

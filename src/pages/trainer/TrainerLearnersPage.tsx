import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Users, BookOpen, Award, CheckCircle2, Search, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TrainerLearnersPage() {
  const { soundEnabled } = useTheme();
  const { user, role, switchDemoRole } = useAuth();
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadLearners = async () => {
    setLoading(true);
    setError(null);
    try {
      // If user is not trainer or admin, auto-switch in demo mode
      if (role !== 'TRAINER' && role !== 'ADMIN') {
        await switchDemoRole('TRAINER');
      }
      const res = await api.get('/api/trainer/learners');
      setLearners(res.learners || []);
    } catch (err: any) {
      console.warn('Failed to load learners:', err?.message || err);
      setError(err?.message || 'Access restricted to Trainer & Admin accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearners();
  }, [role]);

  const filtered = learners.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    (l.department && l.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Roster & Assessment Tracking
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Enrolled Learners</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time progress and evaluation scores across your authored courses
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learners by name or dept..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-8 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Trainer Authorization Needed</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {error}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => switchDemoRole('TRAINER')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch to Trainer Persona (Dr. Vikram)</span>
            </button>
            <Link
              to="/learner/dashboard"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading roster data...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Learners Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Learners enrolled in your courses will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((l) => (
            <div key={l.userId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors">
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <img
                  src={l.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(l.name)}`}
                  alt={l.name}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{l.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{l.email} • {l.department} ({l.organization})</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enrolled Courses & Scores:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {l.enrolledCourses.map((ec: any) => (
                    <div key={ec.courseId} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
                      <strong className="text-slate-900 dark:text-white font-bold block line-clamp-1">{ec.courseTitle}</strong>
                      <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span>Progress:</span>
                        <strong className="text-blue-600 dark:text-blue-400">{ec.progress}%</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${ec.progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                        <span>Assessment Score:</span>
                        <strong className={ec.quizScore >= 70 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                          {ec.quizScore !== null ? `${ec.quizScore}%` : 'Pending'}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

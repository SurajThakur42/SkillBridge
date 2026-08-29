import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  PlusCircle,
  Clock,
  Eye,
  CheckCircle2,
  ChevronRight,
  Layers,
  GraduationCap,
  Sparkles,
  BarChart2,
  ArrowUpRight
} from 'lucide-react';
import { playClickSound } from '../../lib/sound.js';

export function TrainerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { soundEnabled } = useTheme();
  const [data, setData] = useState<any>(null);
  const [learnersData, setLearnersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrainerData = async () => {
    setLoading(true);
    try {
      const [dashRes, learnersRes] = await Promise.all([
        api.get('/api/trainer/dashboard'),
        api.get('/api/trainer/learners')
      ]);
      setData(dashRes);
      if (learnersRes && learnersRes.learners) {
        setLearnersData(learnersRes.learners);
      }
    } catch (err) {
      console.error('Failed to load trainer metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainerData();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading trainer overview...</div>;
  }

  const metrics = data?.metrics || {};
  const courses = data?.courses || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 dark:from-amber-950/90 dark:via-slate-950 dark:to-amber-950/90 border border-amber-800/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            Trainer Overview & Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, {user?.name || 'Dr. Vikram Roy'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Monitor real-time learner engagement, track assessment completion rates, and manage your instructional curriculum.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            to="/trainer/courses"
            onClick={() => playClickSound(soundEnabled)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Manage Courses
          </Link>

          <Link
            to="/trainer/courses/create"
            onClick={() => playClickSound(soundEnabled)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Author Course</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Courses Authored</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{metrics.coursesCreated || 0}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Active curriculum catalog</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">{metrics.totalLearners || 0}</p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 block">
            {metrics.totalEnrollments || 0} total course enrollments
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Avg Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{metrics.averageCompletionRate || 0}%</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            Modules successfully certified
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Avg Assessment Score</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{metrics.averageQuizScore || 0}%</p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1 block">
            Evaluation quiz performance
          </span>
        </div>
      </div>

      {/* Overview Quick Actions & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/trainer/courses"
          onClick={() => playClickSound(soundEnabled)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all shadow-2xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Manage Courses Studio
              </h4>
              <p className="text-[11px] text-slate-500">Edit curriculum, modules & quizzes</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
        </Link>

        <Link
          to="/trainer/learners"
          onClick={() => playClickSound(soundEnabled)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Enrolled Learners Roster
              </h4>
              <p className="text-[11px] text-slate-500">Track cohort progression & grades</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link
          to="/trainer/courses/create"
          onClick={() => playClickSound(soundEnabled)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-2xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Author New Course
              </h4>
              <p className="text-[11px] text-slate-500">Launch AI-assisted learning path</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>

      {/* Two-Column Overview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Course Performance Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Curriculum Performance Highlights</h3>
                <p className="text-xs text-slate-500">Key engagement statistics across your active instructional programs</p>
              </div>
              <Link
                to="/trainer/courses"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {courses.slice(0, 4).map((c: any) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={c.thumbnail}
                      alt={c.title}
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{c.category}</span>
                        <span>•</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{c.enrollmentsCount} learners</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{c.completionRate}%</span>
                      <span className="text-[10px] text-slate-400">Completion</span>
                    </div>
                    <Link
                      to={`/learner/courses/${c.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Active Cohort Submissions & Learners Feed */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Learners</h3>
                <p className="text-[11px] text-slate-500">Students enrolled in your courses</p>
              </div>
              <Link
                to="/trainer/learners"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                All Roster
              </Link>
            </div>

            <div className="space-y-3">
              {learnersData.slice(0, 5).map((l: any) => (
                <div key={l.userId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={l.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={l.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">{l.name}</span>
                      <span className="text-[10px] text-slate-500">{l.department || 'Engineering'}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {l.enrolledCourses?.length || 1} Courses
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

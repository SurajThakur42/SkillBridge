import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { api } from '../../lib/api.js';
import {
  SkillGapAnalysis,
  CourseRecommendation,
  LearningPathData,
  EnrollmentItem,
  UserSkillProfileItem,
  CertificateItem
} from '../../types.js';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Zap,
  Play,
  RotateCw,
  BarChart2,
  Flame,
  Check,
  Layers,
  HelpCircle,
  Sliders,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { playClickSound, playSuccessSound, playCelebrationFanfare } from '../../lib/sound.js';
import { triggerConfetti } from '../../lib/confetti.js';

export function LearnerDashboard() {
  const { user } = useAuth();
  const { isDark, soundEnabled } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [skillGap, setSkillGap] = useState<SkillGapAnalysis | null>(null);
  const [skills, setSkills] = useState<UserSkillProfileItem[]>([]);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const skillComparisons = skillGap?.allSkillGaps || skillGap?.skillComparisons || [];

  // Interactive What-If Sandbox State
  const [showSandbox, setShowSandbox] = useState(false);
  const [simulatedBoosts, setSimulatedBoosts] = useState<{ [skillId: string]: number }>({});
  const [activeStreakDay, setActiveStreakDay] = useState(4); // Thursday

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [gapRes, skillsRes, recsRes, pathRes, enrRes, certRes] = await Promise.all([
        api.get('/api/skills/user/gap-analysis'),
        api.get('/api/skills/user/profile'),
        api.get('/api/skills/user/recommendations'),
        api.get('/api/skills/user/learning-path'),
        api.get('/api/courses/user/enrollments'),
        api.get('/api/courses/user/certificates')
      ]);

      setSkillGap(gapRes);
      setSkills(skillsRes.skills || []);
      setRecommendations(recsRes.recommendations || []);
      setLearningPath(pathRes);
      setEnrollments(enrRes.enrollments || []);
      setCertificates(certRes.certificates || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const activeEnrollments = enrollments.filter(e => e.status === 'IN_PROGRESS');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <RotateCw className="w-9 h-9 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Calculating competency scores & skill gaps...
          </p>
        </div>
      </div>
    );
  }

  // Base readiness vs simulated readiness
  const baseReadiness = skillGap?.overallReadinessPercentage || 0;
  
  // Calculate simulated score if sandbox active
  const simulatedReadiness = (() => {
    if (!skillGap || Object.keys(simulatedBoosts).length === 0) return baseReadiness;
    let totalScore = 0;
    let count = 0;
    skillComparisons.forEach(sc => {
      const current = simulatedBoosts[sc.skillId] !== undefined ? simulatedBoosts[sc.skillId] : sc.currentScore;
      const fraction = Math.min(100, (current / Math.max(1, sc.requiredScore)) * 100);
      totalScore += fraction;
      count += 1;
    });
    return Math.round(totalScore / Math.max(1, count));
  })();

  const readiness = showSandbox ? simulatedReadiness : baseReadiness;

  // Prepare data for Radar Chart
  const radarData = skillComparisons.slice(0, 7).map(sc => {
    const simScore = simulatedBoosts[sc.skillId] !== undefined ? simulatedBoosts[sc.skillId] : sc.currentScore;
    return {
      skill: sc.skillName.length > 12 ? sc.skillName.slice(0, 10) + '..' : sc.skillName,
      fullName: sc.skillName,
      Current: showSandbox ? simScore : sc.currentScore,
      Target: sc.requiredScore
    };
  });

  const handleSimulateQuickBoost = () => {
    playSuccessSound(soundEnabled);
    const newBoosts: { [id: string]: number } = {};
    skillComparisons.forEach(sc => {
      newBoosts[sc.skillId] = Math.max(sc.currentScore, sc.requiredScore);
    });
    setSimulatedBoosts(newBoosts);
    setShowSandbox(true);
    triggerConfetti();
  };

  const handleResetSandbox = () => {
    playClickSound(soundEnabled);
    setSimulatedBoosts({});
    setShowSandbox(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Header Banner & Welcome */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 transition-colors">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-blue-500/15 dark:bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 dark:bg-blue-400/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Smart Capacity-Building Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.name || 'Learner'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Targeting <strong className="text-white underline decoration-blue-400 underline-offset-4">{skillGap?.targetRole?.name || 'Cloud Developer'}</strong>. Your personalized pathway dynamically recalibrates upon every assessment completion.
            </p>

            {/* Quick Interactive What-If Simulation Trigger */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setShowSandbox(!showSandbox);
                  playClickSound(soundEnabled);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  showSandbox
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-300" />
                <span>{showSandbox ? 'Exit Simulator Mode' : 'Open What-If Skill Simulator'}</span>
              </button>

              {showSandbox && (
                <button
                  onClick={handleSimulateQuickBoost}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate 100% Target Mastery</span>
                </button>
              )}
            </div>
          </div>

          {/* Readiness Gauge Block */}
          <div className="bg-slate-800/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 dark:border-slate-800 flex items-center gap-5 shrink-0 shadow-lg">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={readiness >= 75 ? 'text-emerald-400' : readiness >= 40 ? 'text-blue-400' : 'text-amber-400'}
                  strokeDasharray={`${readiness}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-white">{readiness}%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Role Readiness</span>
                {showSandbox && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 uppercase">
                    Simulated
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-white mt-0.5 block">
                {readiness >= 75 ? 'Industry Ready' : readiness >= 40 ? 'Developing Competency' : 'Foundational'}
              </span>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-2">
                <span><strong className="text-emerald-400">{skillGap?.matchedCount || 0}</strong> Matched</span>
                <span>•</span>
                <span><strong className="text-amber-400">{skillGap?.criticalGapsCount || 0}</strong> Critical Gaps</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive What-If Simulator Drawer (When Enabled) */}
      {showSandbox && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-5 shadow-md animate-in fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                  Interactive "What-If" Upskilling Sandbox
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Drag sliders to project how improving individual competencies immediately updates your career readiness score.
                </p>
              </div>
            </div>
            <button
              onClick={handleResetSandbox}
              className="text-xs text-amber-900 dark:text-amber-200 hover:underline font-bold cursor-pointer"
            >
              Reset to Actuals
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {skillComparisons.map(sc => {
              const currentVal = simulatedBoosts[sc.skillId] !== undefined ? simulatedBoosts[sc.skillId] : sc.currentScore;
              return (
                <div key={sc.skillId} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-slate-800 shadow-2xs space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{sc.skillName}</span>
                    <span className={currentVal >= sc.requiredScore ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                      {currentVal}% (Req: {sc.requiredScore}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVal}
                    onChange={(e) => {
                      setSimulatedBoosts(prev => ({
                        ...prev,
                        [sc.skillId]: Number(e.target.value)
                      }));
                    }}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">Active Courses</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{activeEnrollments.length}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">In-progress modules</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">Completed</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{completedEnrollments.length}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">100% finished</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">Skill Gaps</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{skillGap?.criticalGapsCount || 0}</p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 block">High priority focus</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">Certificates</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{certificates.length}</p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1 block">Verifiable credentials</span>
        </div>
      </div>

      {/* 3. Interactive Weekly Streak & Learning Cadence Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active 5-Day Learning Streak!</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300">
                  1.5x XP Boost
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete 1 lesson or quiz daily to maintain your capacity momentum</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const isDone = idx <= activeStreakDay;
              const isToday = idx === activeStreakDay;
              return (
                <button
                  key={day}
                  onClick={() => {
                    playClickSound(soundEnabled);
                    setActiveStreakDay(idx);
                  }}
                  className={`w-9 h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                    isToday
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105'
                      : isDone
                      ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span>{day}</span>
                  {isDone ? <Check className="w-3 h-3 mt-0.5 text-current" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Visual Analysis Grid: Radar Comparison & Current Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: In-Progress Learning & Radar Skill Benchmark */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Courses Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Current Learning Courses</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pick up where you left off to complete modules and take assessments</p>
              </div>
              <Link
                to="/learner/courses"
                onClick={() => playClickSound(soundEnabled)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Browse All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeEnrollments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">You don't have any active in-progress courses.</p>
                <Link
                  to="/learner/courses"
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs"
                >
                  Explore Course Catalog
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeEnrollments.map((enr) => (
                  <div
                    key={enr.enrollmentId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={enr.thumbnail}
                        alt={enr.title}
                        className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                          {enr.category}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{enr.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {enr.duration}
                          </span>
                          <span>•</span>
                          <span>{enr.completedModulesCount} of {enr.totalModulesCount} modules completed</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                      <div className="w-32 sm:text-right">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>Progress</span>
                          <span>{enr.progressPercentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${enr.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playClickSound(soundEnabled);
                          navigate(`/learner/courses/${enr.courseId}`);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Continue</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Radar Benchmark Visualizer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Competency Radar vs Benchmark</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visual comparison between your current verified score and {skillGap?.targetRole?.name} targets
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Your Score
                </span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Target Benchmark
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 9 }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
                          <strong className="block font-bold mb-1">{d.fullName}</strong>
                          <div className="text-blue-300">Current Score: {d.Current}%</div>
                          <div className="text-purple-300">Target Required: {d.Target}%</div>
                        </div>
                      );
                    }}
                  />
                  <Radar
                    name="Target"
                    dataKey="Target"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.15}
                  />
                  <Radar
                    name="Current"
                    dataKey="Current"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Col: Competency Matrix & Recommended Next Steps */}
        <div className="space-y-6">
          {/* Competency Level Bars */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Assessed Competencies</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current verified skill scores</p>
              </div>
              <Link
                to="/learner/skills"
                onClick={() => playClickSound(soundEnabled)}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3.5">
              {skills
                .filter(s => s.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 6)
                .map((skill) => (
                  <div key={skill.skillId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          skill.competencyLevel === 'EXPERT' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                          skill.competencyLevel === 'ADVANCED' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' :
                          skill.competencyLevel === 'INTERMEDIATE' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {skill.competencyLevel}
                        </span>
                        <strong className="text-slate-900 dark:text-white">{skill.score}%</strong>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          skill.score >= 80 ? 'bg-emerald-500' : skill.score >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Recommendation Highlight */}
          {recommendations.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 p-5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-xs mb-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>#1 Priority Recommendation</span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{recommendations[0].courseTitle}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{recommendations[0].reason}</p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                  Target: {recommendations[0].primaryGapSkill}
                </span>
                <button
                  onClick={() => {
                    playClickSound(soundEnabled);
                    navigate(`/learner/courses/${recommendations[0].courseId}`);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {recommendations[0].isEnrolled ? 'Open Course' : 'Enroll & Learn'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Personalized Learning Path Sequence (Section 16 Specification) */}
      {learningPath && learningPath.steps.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Personalized Learning Path</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                  Target: {learningPath.targetRole}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sequential progression roadmap designed to eliminate identified skill gaps
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {learningPath.steps.map((step) => (
              <div
                key={step.stepNumber}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  step.status === 'COMPLETED'
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : step.status === 'IN_PROGRESS'
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-400'
                    : step.status === 'NEXT_UP'
                    ? 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 hover:border-indigo-400 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Step {step.stepNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      step.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                      step.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' :
                      step.status === 'NEXT_UP' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300' :
                      'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {step.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{step.reason}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{step.duration}</span>
                  <button
                    onClick={() => {
                      playClickSound(soundEnabled);
                      navigate(`/learner/courses/${step.courseId}`);
                    }}
                    className={`text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      step.status === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400 hover:underline'
                    }`}
                  >
                    <span>{step.status === 'COMPLETED' ? 'Review' : 'Start'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Shield,
  Layers,
  CheckCircle2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { playClickSound } from '../../lib/sound.js';

export function AdminDashboard() {
  const { soundEnabled } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAdminMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading organizational analytics...</div>;
  }

  const m = data?.metrics || {};
  const gaps = data?.topOrganizationalGaps || [];
  const compDist = data?.competencyDistribution || [];
  const catStats = data?.categoryStats || [];
  const certs = data?.recentCertificates || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 dark:from-purple-950/90 dark:via-slate-950 dark:to-purple-950/90 border border-purple-800/40 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
            Executive Leadership Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Organizational Capacity & Skill-Gap Intelligence
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time competency tracking, talent readiness indices, and systemic training analytics for Smart India Hackathon 2026.
          </p>
        </div>

        <Link
          to="/admin/reports"
          onClick={() => playClickSound(soundEnabled)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors self-start md:self-auto cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Export Executive Report</span>
        </Link>
      </div>

      {/* Top Organization KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Users</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{m.totalUsers || 0}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{m.activeLearnersCount || 0} Active Learners</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Courses</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{m.coursesCount || 0}</p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400">Across 6 Domains</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Enrollments</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{m.enrollmentsCount || 0}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Course Participations</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Completion Rate</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{m.overallCompletionRate || 0}%</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{m.completionsCount || 0} Finished</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Avg Assessment Score</span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{m.averageQuizScore || 0}%</p>
          <span className="text-[10px] text-purple-600 dark:text-purple-400">Organization-Wide</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Certificates Issued</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{m.certificatesCount || 0}</p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Verified Credentials</span>
        </div>
      </div>

      {/* Visual Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency Level Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Workforce Competency Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Breakdown of assessed skill levels across all learners</p>
          </div>

          <div className="space-y-3 pt-2">
            {compDist.map((cd: any) => (
              <div key={cd.level} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{cd.level}</span>
                  <span className="text-slate-900 dark:text-white font-bold">{cd.count} Skills</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: cd.fill,
                      width: `${Math.min(100, (cd.count / (compDist.reduce((a: any, b: any) => a + b.count, 0) || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Organizational Skill Gaps */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Top Organizational Skill Deficits</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Most frequent skill gaps identified across team members</p>
          </div>

          <div className="space-y-3 pt-2">
            {gaps.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No major gaps identified.</p>
            ) : (
              gaps.map((g: any, i: number) => (
                <div key={i} className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-amber-950 dark:text-amber-200 font-bold block">{g.skillName}</strong>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300">
                      {g.learnersWithGap} team members below benchmark • Avg Score: {g.averageScore}%
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                    Priority Gap
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Recent Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Training Engagement by Domain</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Course availability and completions across technology domains</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Domain</th>
                  <th className="pb-2">Courses</th>
                  <th className="pb-2">Enrollments</th>
                  <th className="pb-2">Completions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {catStats.map((cs: any) => (
                  <tr key={cs.category} className="py-2.5">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{cs.category}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">{cs.courses}</td>
                    <td className="py-2.5 text-blue-600 dark:text-blue-400 font-semibold">{cs.enrollments}</td>
                    <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">{cs.completions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Verifiable Certificates Log */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Verifiable Certificates</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live credential issuance audit stream</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-2.5">
            {certs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No certificates issued yet.</p>
            ) : (
              certs.map((c: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold block">{c.learnerName}</strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{c.courseTitle} • Score: {c.score}%</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    {c.certificateNumber}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

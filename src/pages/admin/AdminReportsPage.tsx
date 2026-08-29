import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { FileSpreadsheet, Printer, Download, Award, BarChart3, CheckCircle2 } from 'lucide-react';
import { playClickSound } from '../../lib/sound.js';

export function AdminReportsPage() {
  const { soundEnabled } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    playClickSound(soundEnabled);
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Generating report...</div>;
  }

  const m = data?.metrics || {};
  const gaps = data?.topOrganizationalGaps || [];
  const catStats = data?.categoryStats || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Organizational Capacity Report</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Official Smart India Hackathon 2026 Executive Summary</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Printable Report Document */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none transition-colors">
        {/* Report Header */}
        <div className="border-b border-slate-300 dark:border-slate-800 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">SkillBridge</span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">SIH 2026</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">National Capacity-Building & Skill-Gap Audit Report</p>
          </div>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Reporting Period:</strong> Q3 2026</div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-3">1. Executive Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Learners</span>
              <strong className="text-xl font-bold text-slate-900 dark:text-white">{m.totalUsers}</strong>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Completion Rate</span>
              <strong className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{m.overallCompletionRate}%</strong>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Avg Assessment</span>
              <strong className="text-xl font-bold text-blue-600 dark:text-blue-400">{m.averageQuizScore}%</strong>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Certs Awarded</span>
              <strong className="text-xl font-bold text-purple-600 dark:text-purple-400">{m.certificatesCount}</strong>
            </div>
          </div>
        </div>

        {/* Top Skill Deficits */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-3">2. High-Priority Workforce Skill Gaps</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Skill Dimension</th>
                  <th className="p-3">Team Members Below Benchmark</th>
                  <th className="p-3">Current Average Mastery</th>
                  <th className="p-3">Recommended Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {gaps.map((g: any, i: number) => (
                  <tr key={i} className="p-3">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{g.skillName}</td>
                    <td className="p-3 text-amber-700 dark:text-amber-400 font-semibold">{g.learnersWithGap} Learners</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{g.averageScore}%</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Assign Level 1 & 2 Hands-on Modules</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Domain Training Table */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-3">3. Training Catalog Coverage</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Domain Category</th>
                  <th className="p-3">Authored Courses</th>
                  <th className="p-3">Total Enrollments</th>
                  <th className="p-3">Completions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {catStats.map((cs: any) => (
                  <tr key={cs.category}>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{cs.category}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{cs.courses}</td>
                    <td className="p-3 text-blue-600 dark:text-blue-400 font-semibold">{cs.enrollments}</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">{cs.completions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sign-off */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span>Verified by: <strong>SkillBridge Autonomous Assessment Engine</strong></span>
          </div>
          <div>
            <span>Smart India Hackathon 2026 Evaluation Submission</span>
          </div>
        </div>
      </div>
    </div>
  );
}

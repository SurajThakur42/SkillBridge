import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { SkillGapAnalysis, SkillGapItem, TargetRole } from '../../types.js';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Zap,
  BookOpen,
  Filter,
  Check
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../lib/sound.js';
import { triggerConfetti } from '../../lib/confetti.js';

export function SkillGapPage() {
  const navigate = useNavigate();
  const { soundEnabled } = useTheme();
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'MEDIUM' | 'MATCHED'>('ALL');
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>([]);
  const [simulatedBridges, setSimulatedBridges] = useState<{ [skillId: string]: boolean }>({});

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const [gapData, rolesRes] = await Promise.all([
        api.get('/api/skills/user/gap-analysis'),
        api.get('/api/users/target-roles')
      ]);
      setAnalysis(gapData);
      setTargetRoles(rolesRes.targetRoles || []);
    } catch (err) {
      console.error('Failed to load gap analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const handleRoleChange = async (roleId: string) => {
    playClickSound(soundEnabled);
    setLoading(true);
    try {
      await api.put('/api/users/me/target-role', { targetRoleId: roleId });
      await loadAnalysis();
    } catch (err: any) {
      alert('Failed to change target role: ' + err.message);
      setLoading(false);
    }
  };

  const handleSimulateBridge = (skillId: string) => {
    playSuccessSound(soundEnabled);
    setSimulatedBridges(prev => ({
      ...prev,
      [skillId]: !prev[skillId]
    }));
    triggerConfetti();
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <RotateCw className="w-9 h-9 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Calculating comprehensive skill gap matrix...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
        Gap analysis not available.
      </div>
    );
  }

  const items = analysis.allSkillGaps || [];
  const filtered = filterType === 'ALL'
    ? items
    : items.filter(g => g.gapType === filterType);

  const readiness = analysis.overallReadinessPercentage;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Gap Diagnostic Engine
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">AI-Weighted Capability Alignment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Skill-Gap Analysis: {analysis.targetRole?.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Comparison between your verified competency benchmarks and the role prerequisites for {analysis.targetRole?.name}.
            </p>

            {/* Target Role Quick Switcher */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Analyze Target:</span>
              <select
                value={analysis.targetRole?.id || ''}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
              >
                {targetRoles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Readiness Metric Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-6 shrink-0 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 block">Overall Target Fit</span>
              <strong className="text-3xl font-black text-blue-600 dark:text-blue-400 block">{readiness}%</strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Readiness Index</span>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">{analysis.matchedCount}</strong> Matched Skills</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">{analysis.criticalGapsCount}</strong> Critical Gaps</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">{analysis.mediumGapsCount}</strong> Moderate Gaps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              setFilterType('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Dimensions ({items.length})
          </button>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              setFilterType('CRITICAL');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'CRITICAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Critical Gaps ({analysis.criticalGapsCount})</span>
          </button>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              setFilterType('MEDIUM');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'MEDIUM'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
            }`}
          >
            Moderate Gaps ({analysis.mediumGapsCount})
          </button>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              setFilterType('MATCHED');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'MATCHED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Matched Strengths ({analysis.matchedCount})</span>
          </button>
        </div>
      </div>

      {/* Gap Items Cards */}
      <div className="space-y-4">
        {filtered.map((gap) => {
          const isSimulatedBridged = Boolean(simulatedBridges[gap.skillId]);
          const effectiveCurrentScore = isSimulatedBridged ? Math.max(gap.currentScore, gap.requiredScore) : gap.currentScore;
          const isCritical = gap.gapType === 'CRITICAL' && !isSimulatedBridged;
          const isMatched = (gap.gapType === 'MATCHED' || isSimulatedBridged);

          return (
            <div
              key={gap.skillId}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 sm:p-6 shadow-2xs transition-all ${
                isCritical
                  ? 'border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-200/60 dark:ring-amber-900/30'
                  : isMatched
                  ? 'border-emerald-300 dark:border-emerald-700/80'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {gap.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isMatched ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                      isCritical ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                      'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                    }`}>
                      {isMatched ? 'Matched Competency' : `${gap.gapType} Gap`}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                      Importance Weight: {gap.importance}/5
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{gap.skillName}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">{gap.reason}</p>
                </div>

                {/* Comparative Visual Bar */}
                <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3 shrink-0">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Your Score</span>
                      <span className="font-bold text-slate-900 dark:text-white">{effectiveCurrentScore}% ({isSimulatedBridged ? 'SIMULATED' : gap.currentLevel})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMatched ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${effectiveCurrentScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      <span>Target Requirement</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{gap.requiredScore}% ({gap.requiredLevel})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 dark:bg-slate-500 rounded-full" style={{ width: `${gap.requiredScore}%` }} />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Deficit Gap:</span>
                    <span className={isMatched ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                      {isMatched ? 'Qualified (0% Gap)' : `-${gap.gapScore}% Deficit`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Recommendation & Simulation Trigger */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {isMatched
                    ? 'Verified competency matches or exceeds benchmark requirement.'
                    : `Recommended action: Complete foundational and applied modules in ${gap.skillName}.`}
                </span>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleSimulateBridge(gap.skillId)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {isSimulatedBridged ? 'Undo Simulation' : 'Simulate Bridging Gap'}
                  </button>

                  {!isMatched && (
                    <button
                      onClick={() => {
                        playClickSound(soundEnabled);
                        navigate('/learner/recommendations');
                      }}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                    >
                      <span>Recommended Courses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

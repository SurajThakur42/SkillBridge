import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { UserSkillProfileItem } from '../../types.js';
import { Zap, CheckCircle2, TrendingUp, Sliders, Sparkles, Filter, RotateCw } from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../lib/sound.js';
import { triggerConfetti } from '../../lib/confetti.js';

export function SkillsPage() {
  const { soundEnabled } = useTheme();
  const [skills, setSkills] = useState<UserSkillProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [calibratingSkill, setCalibratingSkill] = useState<UserSkillProfileItem | null>(null);
  const [calibratedScore, setCalibratedScore] = useState<number>(50);
  const [savingCalibration, setSavingCalibration] = useState(false);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/skills/user/profile');
      setSkills(res.skills || []);
    } catch (err) {
      console.error('Failed to fetch skill profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleOpenCalibrate = (skill: UserSkillProfileItem) => {
    playClickSound(soundEnabled);
    setCalibratingSkill(skill);
    setCalibratedScore(skill.score);
  };

  const handleSaveCalibration = async () => {
    if (!calibratingSkill) return;
    setSavingCalibration(true);
    try {
      await api.post('/api/skills/user/calibrate', {
        skillId: calibratingSkill.skillId,
        score: calibratedScore
      });
      playSuccessSound(soundEnabled);
      if (calibratedScore >= 80) {
        triggerConfetti();
      }
      setCalibratingSkill(null);
      await loadSkills();
    } catch (err: any) {
      alert('Calibration failed: ' + err.message);
    } finally {
      setSavingCalibration(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(skills.map(s => s.category)))];
  const filteredSkills = selectedCategory === 'ALL'
    ? skills
    : skills.filter(s => s.category === selectedCategory);

  const avgScore = skills.length > 0
    ? Math.round(skills.reduce((a, b) => a + b.score, 0) / skills.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Competency Taxonomy
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{skills.length} Evaluated Dimensions</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Current Verified Skill Profile</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your capabilities are measured through completed coursework, continuous assessments, and direct calibration.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Organization Avg</span>
              <strong className="text-xl font-black text-blue-600 dark:text-blue-400">{avgScore}%</strong>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Evaluated Skills</span>
              <strong className="text-xl font-black text-slate-900 dark:text-white">{skills.filter(s => s.score > 0).length}</strong>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => {
                playClickSound(soundEnabled);
                setSelectedCategory(c);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCategory === c
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading verified competencies...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <div
              key={skill.skillId}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {skill.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    skill.competencyLevel === 'EXPERT' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                    skill.competencyLevel === 'ADVANCED' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' :
                    skill.competencyLevel === 'INTERMEDIATE' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {skill.competencyLevel}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">{skill.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{skill.description}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Verified Mastery</span>
                    <span className="text-slate-900 dark:text-white font-bold">{skill.score}%</span>
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

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>{skill.lastAssessedAt ? `Assessed ${new Date(skill.lastAssessedAt).toLocaleDateString()}` : 'Initial Baseline'}</span>
                  <button
                    onClick={() => handleOpenCalibrate(skill)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    title="Calibrate skill competency"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Calibrate</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Self-Assessment / Calibration Modal */}
      {calibratingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Calibrate Competency</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update verified baseline score for {calibratingSkill.name}</p>
              </div>
              <button 
                onClick={() => setCalibratingSkill(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{calibratedScore}%</span>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mt-1">
                  {calibratedScore >= 90 ? 'EXPERT' : calibratedScore >= 70 ? 'ADVANCED' : calibratedScore >= 40 ? 'INTERMEDIATE' : 'BEGINNER'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Adjust Competency Benchmark Slider (0 - 100%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={calibratedScore}
                  onChange={(e) => setCalibratedScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                  <span>Beginner (0%)</span>
                  <span>Intermediate (40%)</span>
                  <span>Advanced (70%)</span>
                  <span>Expert (90%+)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setCalibratingSkill(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCalibration}
                disabled={savingCalibration}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {savingCalibration ? 'Saving...' : 'Apply Calibration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

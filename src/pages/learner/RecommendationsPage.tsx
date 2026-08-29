import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { CourseRecommendation } from '../../types.js';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Target,
  Clock,
  ArrowRight,
  Play,
  CheckCircle2,
  BookOpen,
  Award,
  Zap
} from 'lucide-react';
import { playClickSound } from '../../lib/sound.js';

export function RecommendationsPage() {
  const navigate = useNavigate();
  const { soundEnabled } = useTheme();
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/skills/user/recommendations');
      setRecommendations(res.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            AI-Driven Curriculum Matching
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Skill-Gap Targeted</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Personalized Course Recommendations
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Courses algorithmically ranked by their direct impact on closing your critical and moderate skill gaps for your chosen target role.
        </p>
      </div>

      {/* Recommendations Feed */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Computing highest-impact courses...</div>
      ) : recommendations.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">All Target Competencies Matched!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You have satisfied all prerequisites for your target role. You can explore advanced courses or select a new target role.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={rec.courseId}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                {/* Ranking Badge */}
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black text-sm shrink-0">
                  #{index + 1}
                </div>

                <img
                  src={rec.thumbnail}
                  alt={rec.courseTitle}
                  className="w-full sm:w-28 h-20 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                />

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {rec.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Closes Gap: {rec.primaryGapSkill}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      Relevance Score: {rec.relevanceScore} pts
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{rec.courseTitle}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">{rec.reason}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {rec.duration}
                    </span>
                    <span>•</span>
                    <span>Level: {rec.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="w-full lg:w-auto flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => {
                    playClickSound(soundEnabled);
                    navigate(`/learner/courses/${rec.courseId}`);
                  }}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer ${
                    rec.isEnrolled
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  }`}
                >
                  {rec.isEnrolled ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Continue ({rec.progressPercentage}%)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>Enroll & Close Gap</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

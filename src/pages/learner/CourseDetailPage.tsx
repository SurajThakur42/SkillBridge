import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { CourseDetail, CourseModule } from '../../types.js';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Play,
  FileText,
  User,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../lib/sound.js';
import { triggerConfetti } from '../../lib/confetti.js';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { soundEnabled } = useTheme();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/courses/${id}`);
      setCourse(data.course);
      if (data.course?.modules?.length > 0) {
        setSelectedModuleId(data.course.modules[0].id);
      }
    } catch (err) {
      console.error('Failed to load course:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  const handleEnroll = async () => {
    playSuccessSound(soundEnabled);
    setActionLoading(true);
    try {
      await api.post(`/api/courses/${id}/enroll`);
      await loadCourse();
      triggerConfetti();
    } catch (err: any) {
      alert('Enrollment failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId: string) => {
    playSuccessSound(soundEnabled);
    setActionLoading(true);
    try {
      await api.post(`/api/courses/${id}/modules/${moduleId}/complete`);
      await loadCourse();
      triggerConfetti();
    } catch (err: any) {
      alert('Failed to mark module complete: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
        Loading course curriculum...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
        Course not found.
      </div>
    );
  }

  const isEnrolled = course.userProgress?.isEnrolled;
  const completedModuleIds = course.userProgress?.completedModuleIds || [];
  const progressPercentage = course.userProgress?.progressPercentage || 0;
  const activeModule = course.modules.find(m => m.id === selectedModuleId) || course.modules[0];
  const isSelectedCompleted = activeModule ? completedModuleIds.includes(activeModule.id) : false;
  const quizAttempt = course.userProgress?.quizAttempt;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => {
          playClickSound(soundEnabled);
          navigate('/learner/courses');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Course Catalog</span>
      </button>

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {course.category}
              </span>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {course.difficulty} Level
              </span>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {course.duration}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {course.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{course.description}</p>

            {/* Target Skills Tagging */}
            {course.skills && course.skills.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Competencies Developed:</span>
                <div className="flex flex-wrap gap-2">
                  {course.skills.map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium"
                    >
                      {s.name} ({s.targetLevel})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trainer Bio */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                {course.trainer?.name?.charAt(0) || 'T'}
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">{course.trainer?.name || 'Master Instructor'}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">{course.trainer?.department || 'Digital Learning Faculty'}</span>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-44 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />

            {isEnrolled ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Your Learning Progress</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{progressPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>{completedModuleIds.length} of {course.modules.length} Modules</span>
                  <span>{quizAttempt?.passed ? '✓ Assessment Passed' : 'Assessment Pending'}</span>
                </div>

                {course.quiz && (
                  <button
                    id="btn-course-take-quiz"
                    data-voice-command="take assessment, take quiz, review quiz, final quiz"
                    onClick={() => {
                      playClickSound(soundEnabled);
                      navigate(`/learner/courses/${course.id}/quiz`);
                    }}
                    className={`w-full py-2.5 px-4 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                      quizAttempt?.passed
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>
                      {quizAttempt ? `Review Assessment (${quizAttempt.percentage}%)` : 'Take Final Assessment'}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  id="btn-enroll-course"
                  data-voice-command="enroll in course, enroll now, enroll"
                  onClick={handleEnroll}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{actionLoading ? 'Enrolling...' : 'Enroll in Course (Free)'}</span>
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  Includes full curriculum, interactive modules, competency assessment, and digital certificate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Learning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Module List Accordion / Selector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Curriculum Modules</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{course.modules.length} Modules</span>
          </div>

          <div className="space-y-2">
            {course.modules.map((mod, idx) => {
              const isCompleted = completedModuleIds.includes(mod.id);
              const isSelected = mod.id === activeModule?.id;

              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    playClickSound(soundEnabled);
                    setSelectedModuleId(mod.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/60 ring-1 ring-blue-400'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isCompleted ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Module {idx + 1}</span>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">{mod.title}</h4>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              );
            })}

            {/* Assessment Tab */}
            {course.quiz && (
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  navigate(`/learner/courses/${course.id}/quiz`);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  quizAttempt?.passed
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40'
                    : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block">Final Evaluation</span>
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{course.quiz.title}</h4>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                  {quizAttempt ? `${quizAttempt.percentage}% Score` : `${course.quiz.passingScore}% to pass`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Active Module Reader & Interactive Content */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6">
          {activeModule ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Module {activeModule.order}
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{activeModule.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activeModule.description}</p>
                </div>

                {isEnrolled && (
                  <button
                    id="btn-complete-module"
                    onClick={() => handleCompleteModule(activeModule.id)}
                    disabled={actionLoading || isSelectedCompleted}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      isSelectedCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSelectedCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
                  </button>
                )}
              </div>

              {/* Learning Resource Content */}
              <div className="space-y-4">
                {activeModule.resources && activeModule.resources.length > 0 ? (
                  activeModule.resources.map((res) => (
                    <div key={res.id} className="space-y-4">
                      {res.type === 'VIDEO' && res.url && (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
                          <iframe
                            src={res.url}
                            title={res.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed bg-slate-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-line text-slate-800 dark:text-slate-200 font-normal">
                        {res.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No resource content attached for this module.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">Select a module to view material.</div>
          )}
        </div>
      </div>
    </div>
  );
}

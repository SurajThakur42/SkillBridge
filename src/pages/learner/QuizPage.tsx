import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { QuizData } from '../../types.js';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Target,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { playClickSound, playSuccessSound, playErrorSound, playCelebrationFanfare } from '../../lib/sound.js';
import { triggerConfetti } from '../../lib/confetti.js';

export function QuizPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { soundEnabled } = useTheme();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/quizzes/course/${courseId}`);
      setQuiz(data.quiz);
    } catch (err: any) {
      console.error('Failed to load quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [courseId]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (result) return;
    playClickSound(soundEnabled);
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length) {
      if (!window.confirm(`You have answered ${answeredCount} of ${quiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, selectedIdx]) => ({
        questionId: qId,
        selectedAnswer: selectedIdx
      }));

      const res = await api.post(`/api/quizzes/${quiz.id}/submit`, {
        answers: payloadAnswers
      });

      setResult(res);

      if (res.passed) {
        playCelebrationFanfare(soundEnabled);
        triggerConfetti();
      } else {
        playErrorSound(soundEnabled);
      }
    } catch (err: any) {
      alert('Quiz submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    playClickSound(soundEnabled);
    setAnswers({});
    setResult(null);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
        Loading competency assessment...
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Award className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">No Assessment Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This course does not have an active evaluation quiz yet.</p>
        <button
          onClick={() => navigate(`/learner/courses/${courseId}`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Course
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            playClickSound(soundEnabled);
            navigate(`/learner/courses/${courseId}`);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Syllabus</span>
        </button>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Passing Threshold: {quiz.passingScore}%
        </span>
      </div>

      {/* Assessment Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Official Evaluation
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{quiz.totalQuestions} Questions</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{quiz.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Test your knowledge to calibrate your live competency score and qualify for verifiable certification.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Untimed / Self-Paced</span>
          </div>
        </div>

        {/* Quick Question Tracker Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Questions:</span>
          {quiz.questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            return (
              <a
                key={q.id}
                href={`#question-${idx + 1}`}
                onClick={() => playClickSound(soundEnabled)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all shrink-0 ${
                  isAnswered
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </a>
            );
          })}
        </div>
      </div>

      {/* Result Outcome Feedback Banner (SIH Step 12-15) */}
      {result && (
        <div
          id="quiz-result-banner"
          className={`rounded-2xl p-6 border shadow-lg animate-in fade-in zoom-in-95 duration-200 ${
            result.passed
              ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-white border-emerald-500/50'
              : 'bg-gradient-to-r from-rose-950 via-red-900 to-amber-950 text-white border-amber-500/50'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20">
                {result.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <XCircle className="w-4 h-4 text-amber-300" />}
                <span>{result.passed ? 'ASSESSMENT PASSED' : 'MINIMUM PASSING SCORE NOT MET'}</span>
              </div>
              <h2 className="text-2xl font-black">
                {result.passed ? 'Congratulations! Competency Verified.' : 'Keep Practicing!'}
              </h2>
              <p className="text-xs text-slate-200 max-w-xl leading-relaxed">
                You scored <strong className="text-white text-base">{result.percentage}%</strong> ({result.score} out of {result.totalMarks} marks).
                {result.passed
                  ? ' Your skill competencies have been automatically upgraded in the SkillBridge matrix and a digital certificate was issued.'
                  : ' Review the detailed explanations below, re-read the course modules, and retake when ready.'}
              </p>
            </div>

            <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
              {result.certificate ? (
                <Link
                  to="/learner/certificates"
                  onClick={() => playClickSound(soundEnabled)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>View Certificate</span>
                </Link>
              ) : null}

              <Link
                to="/learner/skill-gap"
                onClick={() => playClickSound(soundEnabled)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Inspect Updated Skill Gap</span>
              </Link>

              <button
                onClick={handleRetake}
                className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <div className="space-y-6">
        {quiz.questions.map((q, qIndex) => {
          const selectedOption = answers[q.id];
          const review = result?.results?.find((r: any) => r.questionId === q.id);

          return (
            <div
              key={q.id}
              id={`question-${qIndex + 1}`}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-2xs transition-all ${
                review
                  ? review.isCorrect
                    ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Question {qIndex + 1}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{q.marks} Marks</span>
                </div>

                {review && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    review.isCorrect
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                  }`}>
                    {review.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{review.isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-relaxed mb-4">{q.question}</h3>

              {/* Options */}
              <div className="space-y-2.5">
                {q.options.map((opt, optIndex) => {
                  const isSelected = selectedOption === optIndex;
                  const isCorrect = review && review.correctAnswer === optIndex;
                  const isWrongSelected = review && !review.isCorrect && selectedOption === optIndex;

                  let optClass = 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300';

                  if (review) {
                    if (isCorrect) {
                      optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold';
                    } else if (isWrongSelected) {
                      optClass = 'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 font-semibold';
                    } else {
                      optClass = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    optClass = 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-semibold ring-1 ring-blue-500';
                  }

                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleSelectOption(q.id, optIndex)}
                      disabled={Boolean(result)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer disabled:cursor-default ${optClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {review && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      {review && isWrongSelected && <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Solution Explanation if Submitted */}
              {review && review.explanation && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Explanation:</strong>
                  {review.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!result && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs sticky bottom-4 transition-colors">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Answered <strong className="text-slate-900 dark:text-white">{Object.keys(answers).length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{quiz.questions.length}</strong> questions
          </div>

          <button
            id="btn-submit-assessment"
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length === 0}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>{submitting ? 'Evaluating Assessment...' : 'Submit Final Assessment'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

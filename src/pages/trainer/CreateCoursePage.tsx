import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useNavigate } from 'react-router-dom';
import { Skill } from '../../types.js';
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../lib/sound.js';
import { triggerConfetti } from '../../lib/confetti.js';

export function CreateCoursePage() {
  const navigate = useNavigate();
  const { soundEnabled } = useTheme();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cloud Engineering');
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [duration, setDuration] = useState('4 Hours');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Modules
  const [modules, setModules] = useState<Array<{ title: string; description: string; content: string }>>([
    {
      title: 'Module 1: Foundations & Architecture',
      description: 'Core overview and system topology.',
      content: '## Overview\n\nThis module covers essential architectures, fundamental components, and practical paradigms.'
    }
  ]);

  // Quiz
  const [quizTitle, setQuizTitle] = useState('Course Competency Assessment');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>>([
    {
      question: 'What is the primary architectural benefit of containerization?',
      options: [
        'Hardware virtualization',
        'Process isolation and consistent runtime environments',
        'Automatic SQL indexing',
        'Lower network latency'
      ],
      correctAnswer: 1,
      explanation: 'Containers package applications and their dependencies together to guarantee consistent execution.'
    }
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/api/skills').then(res => setSkills(res.skills || [])).catch(() => {});
  }, []);

  const handleToggleSkill = (id: string) => {
    playClickSound(soundEnabled);
    setSelectedSkillIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAddModule = () => {
    playClickSound(soundEnabled);
    setModules(prev => [
      ...prev,
      {
        title: `Module ${prev.length + 1}: Applied Engineering`,
        description: 'Hands-on practical workflows.',
        content: '## Practical Laboratory\n\nFollow step-by-step procedures to build verified implementations.'
      }
    ]);
  };

  const handleRemoveModule = (idx: number) => {
    if (modules.length <= 1) return;
    playClickSound(soundEnabled);
    setModules(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddQuestion = () => {
    playClickSound(soundEnabled);
    setQuestions(prev => [
      ...prev,
      {
        question: 'What is the primary function of this engineering pattern?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Correct verified rationale.'
      }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    playClickSound(soundEnabled);
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert('Please provide course title and description.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/trainer/courses', {
        title,
        description,
        category,
        difficulty,
        duration,
        thumbnail,
        skillIds: selectedSkillIds,
        modules,
        quiz: {
          title: quizTitle,
          passingScore,
          questions
        }
      });
      playSuccessSound(soundEnabled);
      triggerConfetti();
      alert('Course and Competency Assessment published successfully!');
      navigate('/trainer/dashboard');
    } catch (err: any) {
      alert('Failed to publish course: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <button
        onClick={() => {
          playClickSound(soundEnabled);
          navigate('/trainer/dashboard');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Trainer Studio</span>
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-4 transition-colors">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Author New Capacity Course</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Construct modular courses linked to verified skill taxonomy tags and assessments
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Advanced Kubernetes Orchestration"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Description & Outcomes</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what competencies learners will gain..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    playClickSound(soundEnabled);
                    setCategory(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Cloud Engineering">Cloud Engineering</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Information Security">Information Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    playClickSound(soundEnabled);
                    setDifficulty(e.target.value as any);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 4.5 Hours"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Skill Taxonomy Linkage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Competencies (Select which skills this course upgrades)
              </label>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => {
                  const isSelected = selectedSkillIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => handleToggleSkill(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-600 shadow-2xs font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modules Builder */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Curriculum Modules</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add instructional units and lesson guides</p>
            </div>
            <button
              type="button"
              onClick={handleAddModule}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Module</span>
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((mod, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">Module {idx + 1}</span>
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={mod.title}
                  onChange={(e) => {
                    const newMods = [...modules];
                    newMods[idx].title = e.target.value;
                    setModules(newMods);
                  }}
                  placeholder="Module Title"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                />

                <textarea
                  rows={3}
                  value={mod.content}
                  onChange={(e) => {
                    const newMods = [...modules];
                    newMods[idx].content = e.target.value;
                    setModules(newMods);
                  }}
                  placeholder="Lesson Content (Markdown / Guide text)..."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Builder */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Final Evaluation Quiz</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Define passing threshold and verification questions</p>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assessment Title</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Passing Threshold Percentage</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                min="50"
                max="100"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">Question {qIdx + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => {
                    const newQ = [...questions];
                    newQ[qIdx].question = e.target.value;
                    setQuestions(newQ);
                  }}
                  placeholder="Enter assessment question prompt..."
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                />

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Options & Correct Answer</label>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={q.correctAnswer === oIdx}
                        onChange={() => {
                          const newQ = [...questions];
                          newQ[qIdx].correctAnswer = oIdx;
                          setQuestions(newQ);
                        }}
                        className="accent-amber-600 cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newQ = [...questions];
                          newQ[qIdx].options[oIdx] = e.target.value;
                          setQuestions(newQ);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1 px-3 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Explanation Solution</label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qIdx].explanation = e.target.value;
                      setQuestions(newQ);
                    }}
                    placeholder="Verified rationale shown during post-quiz review..."
                    className="w-full px-3 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              playClickSound(soundEnabled);
              navigate('/trainer/dashboard');
            }}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Publishing Course...' : 'Publish Course to Catalog'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

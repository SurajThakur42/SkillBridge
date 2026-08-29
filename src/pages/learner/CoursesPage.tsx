import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Course, Skill } from '../../types.js';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, BookOpen, Clock, BarChart2, Layers, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { playClickSound } from '../../lib/sound.js';

export function CoursesPage() {
  const navigate = useNavigate();
  const { soundEnabled } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedSkill, setSelectedSkill] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'ALL') params.append('difficulty', selectedDifficulty);
      if (selectedSkill !== 'ALL') params.append('skillId', selectedSkill);

      const [courseRes, skillRes] = await Promise.all([
        api.get(`/api/courses?${params.toString()}`),
        api.get('/api/skills')
      ]);

      setCourses(courseRes.courses || []);
      setSkills(skillRes.skills || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedDifficulty, selectedSkill]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound(soundEnabled);
    loadData();
  };

  const categories = ['ALL', 'Cloud Engineering', 'DevOps', 'System', 'Software Development', 'Artificial Intelligence', 'Information Security', 'Database', 'Architecture'];
  const difficulties = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Course & Competency Catalog</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Explore hands-on curriculum mapped to national digital capability frameworks
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="input-course-search"
              data-voice-command="search courses, search box, search keyword"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses, skills, topics..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white"
            />
          </form>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => {
              playClickSound(soundEnabled);
              setSelectedCategory(e.target.value);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            id="filter-difficulty"
            value={selectedDifficulty}
            onChange={(e) => {
              playClickSound(soundEnabled);
              setSelectedDifficulty(e.target.value);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>
                Level: {d}
              </option>
            ))}
          </select>

          <select
            id="filter-skill"
            value={selectedSkill}
            onChange={(e) => {
              playClickSound(soundEnabled);
              setSelectedSkill(e.target.value);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Skills</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                Skill: {s.name}
              </option>
            ))}
          </select>

          {(selectedCategory !== 'ALL' || selectedDifficulty !== 'ALL' || selectedSkill !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                playClickSound(soundEnabled);
                setSelectedCategory('ALL');
                setSelectedDifficulty('ALL');
                setSelectedSkill('ALL');
                setSearchTerm('');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">Loading course catalog...</div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No courses match your criteria</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try resetting your filters or modifying your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              data-voice-command={course.title}
              onClick={() => {
                playClickSound(soundEnabled);
                navigate(`/learner/courses/${course.id}`);
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                      {course.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      course.difficulty === 'ADVANCED' ? 'bg-purple-900/80 text-purple-200' :
                      course.difficulty === 'INTERMEDIATE' ? 'bg-amber-900/80 text-amber-200' :
                      'bg-blue-900/80 text-blue-200'
                    }`}>
                      {course.difficulty}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Skills tags */}
                  {course.skills && course.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {course.skills.map((sk) => (
                        <span
                          key={sk.id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {sk.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {course.duration}
                  </span>
                  <span>{course.moduleCount || 3} Modules • Assessment</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound(soundEnabled);
                    navigate(`/learner/courses/${course.id}`);
                  }}
                  className="w-full py-2 px-3 bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 text-blue-700 dark:text-blue-300 group-hover:text-white dark:group-hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View Syllabus & Enroll</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

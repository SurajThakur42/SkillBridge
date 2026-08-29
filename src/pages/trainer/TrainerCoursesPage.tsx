import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  HelpCircle,
  ChevronRight,
  X,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpDown,
  AlertCircle,
  FileText,
  Share2,
  ExternalLink
} from 'lucide-react';
import { playClickSound } from '../../lib/sound.js';

export function TrainerCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { soundEnabled } = useTheme();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [inspectingCourseId, setInspectingCourseId] = useState<string | null>(null);
  const [curriculumData, setCurriculumData] = useState<any | null>(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/trainer/dashboard');
      if (res && res.courses) {
        setCourses(res.courses);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Inspect Course Curriculum
  const handleInspectCurriculum = async (courseId: string) => {
    playClickSound(soundEnabled);
    setInspectingCourseId(courseId);
    setLoadingCurriculum(true);
    try {
      const res = await api.get(`/api/trainer/courses/${courseId}/curriculum`);
      setCurriculumData(res);
    } catch (err) {
      console.error('Failed to fetch curriculum:', err);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  // Quick Edit Course Details
  const handleSaveCourseEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setSavingEdit(true);
    try {
      await api.put(`/api/trainer/courses/${editingCourse.id}`, {
        title: editingCourse.title,
        description: editingCourse.description,
        category: editingCourse.category,
        difficulty: editingCourse.difficulty,
        duration: editingCourse.duration,
        status: editingCourse.status
      });
      setEditingCourse(null);
      await loadCourses();
    } catch (err) {
      console.error('Failed to update course:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (course: any) => {
    playClickSound(soundEnabled);
    const nextStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.put(`/api/trainer/courses/${course.id}`, {
        status: nextStatus
      });
      setCourses(prev =>
        prev.map(c => c.id === course.id ? { ...c, status: nextStatus } : c)
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    playClickSound(soundEnabled);
    try {
      await api.delete(`/api/trainer/courses/${courseId}`);
      setDeleteConfirmId(null);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];

  // Filtered courses
  const filteredCourses = courses.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'ALL' || c.difficulty === selectedDifficulty;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'PUBLISHED' && (c.status === 'PUBLISHED' || !c.status)) ||
      (selectedStatus === 'DRAFT' && c.status === 'DRAFT');

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  const totalEnrollments = courses.reduce((acc, c) => acc + (c.enrollmentsCount || 0), 0);
  const totalCompletions = courses.reduce((acc, c) => acc + (c.completionsCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 dark:from-amber-950/90 dark:via-slate-950 dark:to-amber-950/90 border border-amber-800/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Curriculum & Course Studio
            </span>
            <span className="text-xs text-amber-200/70">• {courses.length} Total Curriculums</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Manage Authored Courses</h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Oversee your published learning pathways, inspect instructional modules and quiz assessments, and edit curriculum details.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Link
            to="/trainer/courses/create"
            onClick={() => playClickSound(soundEnabled)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Author New Course</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Authored Courses</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{courses.length}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {courses.filter(c => c.status !== 'DRAFT').length} Live Published
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Enrollments</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5">{totalEnrollments}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Across all cohorts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Certifications Awarded</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">{totalCompletions}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {totalEnrollments > 0 ? `${Math.round((totalCompletions / totalEnrollments) * 100)}% completion rate` : '0%'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Curriculum Studio</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1.5">
            {courses.reduce((acc, c) => acc + (c.modulesCount || 0), 0)}
          </p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Active instructional modules</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course title or domain..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Difficulty & Status Selectors & View Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              <option value="ALL">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Drafts</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playClickSound(soundEnabled);
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Domains' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Display */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading course curriculum...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No courses match your filter</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or category filters, or author a new course to add to your catalog.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedDifficulty('ALL');
              setSelectedStatus('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all group"
            >
              {/* Thumbnail & Badges */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold border border-white/10">
                    {course.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    course.difficulty === 'ADVANCED' ? 'bg-purple-500/90 text-white' :
                    course.difficulty === 'INTERMEDIATE' ? 'bg-blue-500/90 text-white' :
                    'bg-emerald-500/90 text-white'
                  }`}>
                    {course.difficulty}
                  </span>
                </div>

                {/* Status Toggle Button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleTogglePublish(course)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs border transition-all cursor-pointer ${
                      course.status === 'DRAFT'
                        ? 'bg-amber-500/80 text-amber-950 border-amber-300 hover:bg-amber-400'
                        : 'bg-emerald-500/80 text-white border-emerald-300 hover:bg-emerald-400'
                    }`}
                    title="Click to toggle published / draft state"
                  >
                    {course.status === 'DRAFT' ? 'Draft' : 'Published'}
                  </button>
                </div>

                {/* Bottom title info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-3 text-slate-300 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration || '3.5 Hours'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {course.modulesCount || 1} Modules
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Performance Stats Row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Learners</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{course.enrollmentsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Finished</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{course.completionRate || 0}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Quiz Avg</span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {course.averageQuizScore > 0 ? `${course.averageQuizScore}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleInspectCurriculum(course.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Inspect Modules and Assessments"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Curriculum</span>
                    </button>

                    <button
                      onClick={() => {
                        playClickSound(soundEnabled);
                        setEditingCourse({ ...course });
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Edit Course Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        playClickSound(soundEnabled);
                        setDeleteConfirmId(course.id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    to={`/learner/courses/${course.id}`}
                    onClick={() => playClickSound(soundEnabled)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Preview Course as Learner"
                  >
                    <span>Preview</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Course Title & Category</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Modules</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Enrollments</th>
                  <th className="py-3.5 px-4">Completions</th>
                  <th className="py-3.5 px-4">Avg Quiz</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                        />
                        <div>
                          <strong className="text-slate-900 dark:text-white font-bold block text-xs">
                            {course.title}
                          </strong>
                          <span className="text-[10px] text-slate-500">{course.category} • {course.duration}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {course.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {course.modulesCount || 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublish(course)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                          course.status === 'DRAFT'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                        }`}
                      >
                        {course.status === 'DRAFT' ? 'Draft' : 'Published'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600 dark:text-blue-400">
                      {course.enrollmentsCount || 0}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {course.completionsCount || 0} ({course.completionRate || 0}%)
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-purple-600 dark:text-purple-400">
                      {course.averageQuizScore > 0 ? `${course.averageQuizScore}%` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInspectCurriculum(course.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold text-[11px] border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer"
                        >
                          Curriculum
                        </button>
                        <button
                          onClick={() => {
                            playClickSound(soundEnabled);
                            setEditingCourse({ ...course });
                          }}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/learner/courses/${course.id}`}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Curriculum Inspector Drawer/Modal */}
      {inspectingCourseId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {curriculumData?.course?.title || 'Curriculum Modules'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instructional structure, learning materials, and quiz assessment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingCourseId(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingCurriculum ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading module architecture...</div>
              ) : (
                <>
                  {/* Modules List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span>Course Modules & Content Units</span>
                    </h4>

                    {curriculumData?.modules?.length === 0 ? (
                      <p className="text-xs text-slate-500">No modules declared.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {curriculumData?.modules?.map((mod: any, i: number) => (
                          <div
                            key={mod.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {mod.title}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                Order #{mod.order || i + 1}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {mod.description}
                            </p>

                            {/* Resources */}
                            {mod.resources && mod.resources.length > 0 && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                                {mod.resources.map((res: any) => (
                                  <div key={res.id} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                                      {res.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {res.type} • {res.duration}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quiz Section */}
                  {curriculumData?.quiz && (
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                          <span>Evaluation Quiz Assessment</span>
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          Passing Threshold: {curriculumData.quiz.passingScore}%
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-3">
                        <div className="font-bold text-xs text-purple-950 dark:text-purple-200">
                          {curriculumData.quiz.title} ({curriculumData.quiz.questions?.length || 0} Questions)
                        </div>

                        <div className="space-y-2">
                          {curriculumData.quiz.questions?.map((q: any, qIdx: number) => (
                            <div key={q.id || qIdx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                Q{qIdx + 1}: {q.question}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                                {q.options?.map((opt: string, optIdx: number) => (
                                  <div
                                    key={optIdx}
                                    className={`px-2 py-1 rounded-lg border ${
                                      optIdx === q.correctAnswer
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}. {opt} {optIdx === q.correctAnswer && '✓ (Correct)'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingCourseId(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Details Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCourseEdit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                <span>Edit Course Metadata</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Category Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCourse.category}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={editingCourse.difficulty}
                    onChange={(e) => setEditingCourse({ ...editingCourse, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={editingCourse.duration || '3.5 Hours'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Publish Status
                  </label>
                  <select
                    value={editingCourse.status || 'PUBLISHED'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {savingEdit ? 'Saving Changes...' : 'Save Updates'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Course?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove this course and all associated modules from the curriculum?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Target,
  Sparkles,
  Award,
  User,
  PlusCircle,
  Users,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { playClickSound } from '../lib/sound.js';

export function Sidebar() {
  const { role } = useAuth();
  const { soundEnabled } = useTheme();

  const learnerLinks = [
    { to: '/learner/dashboard', label: 'Dashboard & Roadmap', icon: LayoutDashboard },
    { to: '/learner/courses', label: 'Course Catalog', icon: BookOpen },
    { to: '/learner/skills', label: 'Skill Profile', icon: Zap },
    { to: '/learner/skill-gap', label: 'Skill-Gap Analysis', icon: Target },
    { to: '/learner/recommendations', label: 'Recommendations', icon: Sparkles },
    { to: '/learner/certificates', label: 'Certificates', icon: Award },
    { to: '/learner/profile', label: 'Target Role & Settings', icon: User }
  ];

  const trainerLinks = [
    { to: '/trainer/dashboard', label: 'Trainer Overview', icon: LayoutDashboard },
    { to: '/trainer/courses', label: 'Manage Courses', icon: BookOpen },
    { to: '/trainer/courses/create', label: 'Create New Course', icon: PlusCircle },
    { to: '/trainer/learners', label: 'Enrolled Learners', icon: Users }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User & Role Directory', icon: Users },
    { to: '/admin/analytics', label: 'Competency Analytics', icon: BarChart3 },
    { to: '/admin/reports', label: 'Executive Reports', icon: FileSpreadsheet }
  ];

  const links = role === 'ADMIN' ? adminLinks : role === 'TRAINER' ? trainerLinks : learnerLinks;

  const getActiveClass = (isActive: boolean) => {
    if (!isActive) {
      return 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 font-medium';
    }

    if (role === 'ADMIN') {
      return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold shadow-xs border-r-2 border-purple-600 dark:border-purple-400';
    }
    if (role === 'TRAINER') {
      return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold shadow-xs border-r-2 border-amber-600 dark:border-amber-400';
    }
    return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold shadow-xs border-r-2 border-blue-600 dark:border-blue-400';
  };

  return (
    <aside id="sidebar-navigation" className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-105px)] flex flex-col justify-between shrink-0 hidden md:flex transition-colors">
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {role === 'ADMIN' ? 'Admin Portal' : role === 'TRAINER' ? 'Trainer Studio' : 'Learner Console'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              role === 'ADMIN' ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
              role === 'TRAINER' ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
              'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              {role}
            </span>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => playClickSound(soundEnabled)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${getActiveClass(isActive)}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-950 dark:to-blue-950 rounded-2xl p-4 text-white relative overflow-hidden border border-slate-800 dark:border-slate-800/80 shadow-lg">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 text-blue-400 dark:text-blue-300 font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Feedback Engine</span>
            </div>
            <p className="text-xs mt-1.5 text-slate-300 dark:text-slate-300 leading-relaxed font-normal">
              Train → Assess → Measure → Identify Gap → Recommend → Certify.
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>
    </aside>
  );
}

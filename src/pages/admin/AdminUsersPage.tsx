import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Users, Search, Filter, Shield, UserCheck, UserX, CheckCircle2 } from 'lucide-react';
import { playClickSound, playSuccessSound } from '../../lib/sound.js';

export function AdminUsersPage() {
  const { soundEnabled } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'ALL') params.append('role', roleFilter);

      const res = await api.get(`/api/admin/users?${params.toString()}`);
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load user directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    playClickSound(soundEnabled);
    setActionLoadingId(userId);
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      playSuccessSound(soundEnabled);
      await loadUsers();
    } catch (err: any) {
      alert('Error updating user status: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Identity & Access Management
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">User & Role Directory</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage learner, trainer, and administrator accounts and access privileges
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    playClickSound(soundEnabled);
                    loadUsers();
                  }
                }}
                placeholder="Search name, email, dept..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                playClickSound(soundEnabled);
                setRoleFilter(e.target.value);
              }}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="LEARNER">Learners Only</option>
              <option value="TRAINER">Trainers Only</option>
              <option value="ADMIN">Admins Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading user records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department & Org</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4">Courses / Certs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <strong className="text-slate-900 dark:text-white font-bold block">{u.name}</strong>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                        u.role === 'TRAINER' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                        'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div>{u.department}</div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{u.organization}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-semibold">
                      {u.targetRoleName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <span>{u.stats?.enrollmentsCount || 0} Enrolled</span>
                      <span className="text-slate-400 dark:text-slate-500"> • </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{u.stats?.certsCount || 0} Certs</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        u.isActive ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        disabled={actionLoadingId === u.id}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          u.isActive
                            ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900'
                            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

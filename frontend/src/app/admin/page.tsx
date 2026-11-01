'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { eduveraApi } from '../../lib/services/api';
import {
  ShieldCheck,
  Lock,
  Server,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Key,
  Eye,
  RefreshCw,
  Database,
  ArrowLeft,
  UserPlus,
  Sliders,
} from 'lucide-react';

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [securityHealth, setSecurityHealth] = useState<any>(null);
  const [permissionsMatrix, setPermissionsMatrix] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'Finance',
    phone: '',
  });

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('eduvera_token');
      const stored = localStorage.getItem('eduvera_user');
      if (!token || !stored) {
        router.replace('/login');
        return;
      }
      try {
        const u = JSON.parse(stored);
        if (u.role !== 'Admin' && u.role !== 'Super Admin') {
          router.replace('/');
          return;
        }
        setCurrentUser(u);
      } catch (e) {
        router.replace('/login');
      }
    }
  }, [router]);

  const loadAdminData = async () => {
    try {
      const [health, perms, logs, userList] = await Promise.all([
        eduveraApi.getAdminSecurityHealth(),
        eduveraApi.getAdminPermissions(),
        eduveraApi.getAdminAuditLogs(),
        eduveraApi.getAdminUsers(),
      ]);
      setSecurityHealth(health);
      setPermissionsMatrix(perms);
      setAuditLogs(logs);
      setUsers(userList || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await eduveraApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setStatusMessage(`User role successfully updated to ${newRole}`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      alert('Failed to update role in MySQL.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await eduveraApi.createAdminUser(newUserData);
      setIsAddUserModalOpen(false);
      setNewUserData({ name: '', email: '', password: 'password123', role: 'Finance', phone: '' });
      setStatusMessage('New staff user created and role assigned successfully');
      setTimeout(() => setStatusMessage(''), 3000);
      loadAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating user in MySQL.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate/delete this staff account?')) return;
    try {
      await eduveraApi.deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setStatusMessage('Staff account removed successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting user.');
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-slate-500">Connecting to MySQL & verifying Super Admin session...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
              {/* Executive Security Header */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Super Admin Authority
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      MySQL Database Active
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                    System Security & Role Governance
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage institutional personnel, dynamically assign roles (Finance, HR, Academic, Admin), and monitor audit events for{' '}
                    <span className="text-slate-800 font-semibold">{currentUser?.name || 'Administrator'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-2 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" /> Return to Dashboard
                  </Link>
                </div>
              </div>

              {/* Toast Feedback */}
              {statusMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">{statusMessage}</span>
                </div>
              )}

              {/* Security Health Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Database Engine</span>
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <Database className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900 block">MySQL Relational</span>
                    <span className="text-[11px] text-slate-500 font-medium">eduvera Database (Port 3306)</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Super Admin Model</span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900 block">Single Super Admin</span>
                    <span className="text-[11px] text-slate-500 font-medium">Internal Role Provisioning</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Staff Accounts</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900 block">{users.length} Personnel</span>
                    <span className="text-[11px] text-slate-500 font-medium">Finance, HR, Academic, Admin</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">RBAC Token Guard</span>
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900 block">Strict Guard Active</span>
                    <span className="text-[11px] text-slate-500 font-medium">CheckRole Bearer Token Verification</span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: USER PROVISIONING & ROLE ASSIGNMENT TABLE */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" /> Staff Provisioning & Dynamic Role Assignment
                    </h3>
                    <p className="text-xs text-slate-500">
                      As the Super Admin, assign and adjust departmental roles in real-time. Changes apply instantly.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Provision New Staff Member
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Staff Member</th>
                        <th className="p-3.5">Contact Phone</th>
                        <th className="p-3.5">Current Role</th>
                        <th className="p-3.5">Assign New Role</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const isPrimaryAdmin = u.email === 'admin@eduvera.school';
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 font-semibold flex items-center justify-center text-slate-700 text-xs">
                                  {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-xs">{u.name}</p>
                                  <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-slate-600 text-xs">
                              {u.phone || '—'}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  u.role === 'Admin' || u.role === 'Super Admin'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : u.role === 'Finance'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : u.role === 'HR'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {isPrimaryAdmin ? (
                                <span className="text-[11px] text-slate-400 italic">Root Authority</span>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
                                >
                                  <option value="Finance">Finance User</option>
                                  <option value="HR">HR User</option>
                                  <option value="Academic">Academic User</option>
                                  <option value="Admin">Admin</option>
                                </select>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {u.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              {!isPrimaryAdmin && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-[11px] font-medium text-rose-600 hover:text-rose-700 transition px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: RBAC PERMISSIONS MATRIX */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" /> Institutional RBAC Privilege Distribution Matrix
                    </h3>
                    <p className="text-xs text-slate-500">Formal capability segregation across Eduvera operational roles</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Role Title</th>
                        <th className="p-3.5">Personnel Count</th>
                        <th className="p-3.5">System Settings</th>
                        <th className="p-3.5">Role Assignment</th>
                        <th className="p-3.5">Audit Logs</th>
                        <th className="p-3.5">Fee Management</th>
                        <th className="p-3.5">Staff & HR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {permissionsMatrix.map((item) => (
                        <tr key={item.role} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-900 text-xs">{item.role}</div>
                            <div className="text-[11px] text-slate-500 max-w-xs mt-0.5">{item.description}</div>
                          </td>
                          <td className="p-3.5 font-mono font-semibold text-blue-600">{item.user_count}</td>
                          <td className="p-3.5">
                            {item.permissions.manage_system_settings ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {item.permissions.manage_users_and_roles ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {item.permissions.view_audit_logs ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {item.permissions.manage_fees ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {item.permissions.manage_hr ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: REAL-TIME AUDIT LOGS STREAM */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" /> Security Audit Log Stream
                    </h3>
                    <p className="text-xs text-slate-500">Immutable security events recorded by Laravel AuditLogMiddleware</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Stream Active
                  </span>
                </div>

                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-600">{log.id}</span>
                          <span className="text-xs font-semibold text-slate-900">{log.event}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              log.severity === 'High'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : log.severity === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {log.severity} Risk
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{log.details}</p>
                        <p className="text-[11px] text-slate-500">
                          Actor: <span className="text-slate-800 font-medium">{log.actor}</span> • Target: <span className="text-slate-800 font-medium">{log.target}</span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 font-mono">
                        <p>{log.ip_address}</p>
                        <p className="text-[10px] text-slate-400">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PROVISION NEW STAFF MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl animate-fade-in text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Super Admin Authority</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Provision New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@eduvera.school"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Initial Temporary Password</label>
                <input
                  type="text"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-mono shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Assign Institutional Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer shadow-xs"
                >
                  <option value="Finance">Finance User (Fees & Invoicing)</option>
                  <option value="HR">HR User (Faculty & Staff HR)</option>
                  <option value="Academic">Academic User (Classes & Exams)</option>
                  <option value="Admin">Admin (Executive Governance)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Contact Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer"
                >
                  Provision &amp; Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

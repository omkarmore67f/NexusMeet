import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminStatsAPI, getAdminUsersAPI, updateAdminUserStatusAPI } from '../services/meetingService';
import { useAuthStore } from '../store/authStore';
import { 
  Loader2, Users, Video, MessageSquare, Files, 
  Ban, UserCheck
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

  // Stats Query
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStatsAPI
  });

  // Users Query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: getAdminUsersAPI,
    enabled: activeTab === 'users'
  });

  // Update Status / Role Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      updateAdminUserStatusAPI(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    }
  });

  const handleRoleToggle = (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    updateStatusMutation.mutate({ userId, data: { role: nextRole } });
  };

  const handleStatusToggle = (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    updateStatusMutation.mutate({ userId, data: { status: nextStatus } });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Admin Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            System diagnostics metrics and accounts access configuration.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'overview' 
                ? 'bg-brand-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Metrics Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users' 
                ? 'bg-brand-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Accounts
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        statsLoading ? (
          <div className="py-24 flex justify-center">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Registered Accounts', value: statsData?.stats?.totalUsers, icon: Users, color: 'text-blue-600' },
                { label: 'Calls Created', value: statsData?.stats?.totalMeetings, icon: Video, color: 'text-brand-600' },
                { label: 'Chat Logs', value: statsData?.stats?.totalMessages, icon: MessageSquare, color: 'text-purple-600' },
                { label: 'Attachments Space', value: statsData?.stats?.totalFiles, icon: Files, color: 'text-emerald-600' }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">{card.value ?? 0}</h3>
                    </div>
                    <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${card.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recents Splits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Newly Registered Accounts */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 mb-4">Newly Registered Accounts</h3>
                <div className="divide-y divide-slate-100">
                  {statsData?.recentUsers?.map((u: any) => (
                    <div key={u._id} className="py-3 flex items-center justify-between group">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                        u.role === 'admin' 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Collaboration Rooms */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 mb-4">Recent Collaboration Rooms</h3>
                <div className="divide-y divide-slate-100">
                  {statsData?.recentMeetings?.map((m: any) => (
                    <div key={m._id} className="py-3 flex items-center justify-between group">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{m.title}</p>
                        <p className="text-[10px] text-slate-400">Host: {m.host?.name || 'Unknown'}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                        m.status === 'active' 
                          ? 'bg-brand-50 text-brand-600 border-brand-200' 
                          : 'bg-slate-150 text-slate-500 border-slate-250'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      ) : usersLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : (
        /* User Accounts Matrix */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-450 font-semibold">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Role Type</th>
                  <th className="pb-3">Connection Index</th>
                  <th className="pb-3 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersData?.users?.map((u: any) => {
                  const isSelf = u._id === currentUser?.id || u._id === currentUser?._id;
                  return (
                    <tr key={u._id} className="text-slate-700 hover:bg-slate-50/50">
                      <td className="py-3.5 font-semibold text-slate-900">
                        {u.name} {isSelf && <span className="text-[9px] bg-brand-50 text-brand-600 border border-brand-200 px-1.5 py-0.5 rounded ml-1">You</span>}
                      </td>
                      <td className="py-3.5 text-slate-500 font-mono">{u.email}</td>
                      <td className="py-3.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                          u.role === 'admin' 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="flex items-center gap-1.5 text-xs font-semibold">
                          {u.status === 'active' ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span className="text-emerald-600">Active</span>
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              <span className="text-red-550">Suspended</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={isSelf || updateStatusMutation.isPending}
                            onClick={() => handleRoleToggle(u._id, u.role)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors disabled:opacity-40 text-[10px] font-bold"
                          >
                            Toggle Role
                          </button>
                          <button
                            disabled={isSelf || updateStatusMutation.isPending}
                            onClick={() => handleStatusToggle(u._id, u.status)}
                            className={`px-3 py-1 rounded-lg border transition-all text-[10px] font-bold flex items-center gap-1 disabled:opacity-40 ${
                              u.status === 'suspended'
                                ? 'bg-emerald-50 hover:bg-emerald-600 border-emerald-200 text-emerald-600 hover:text-white'
                                : 'bg-red-50 hover:bg-red-600 border-red-200 text-red-600 hover:text-white'
                            }`}
                          >
                            {u.status === 'suspended' ? (
                              <>
                                <UserCheck size={10} /> Activate
                              </>
                            ) : (
                              <>
                                <Ban size={10} /> Suspend
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createMeetingAPI, getMeetingByCodeAPI, getMeetingHistoryAPI } from '../services/meetingService';
import { useAuthStore } from '../store/authStore';
import { 
  Video, Calendar, Plus, Keyboard, Loader2, ArrowRight, History, 
  Clock, RefreshCw, FileText, Check, Copy, Sparkles, Activity, 
  Users, CloudLightning, FileImage, FileCode, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import generated hero meeting illustration
import heroMeetingImg from '../assets/hero_meeting.png';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDesc, setScheduleDesc] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch Meeting History
  const {
    data: historyData,
    isLoading: historyLoading,
    isRefetching: historyRefetching,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['meetingHistory'],
    queryFn: getMeetingHistoryAPI
  });

  // Create Quick Meeting Mutation
  const createMeetingMutation = useMutation({
    mutationFn: () =>
      createMeetingAPI({
        title: `${user?.name || 'Quick'}'s Collaboration`,
        settings: {
          isMutedByDefault: false,
          isCameraOffByDefault: false,
          requireWaitingRoom: false
        }
      }),
    onSuccess: (data) => {
      if (data.success && data.meeting) {
        navigate(`/room/${data.meeting.meetingCode}`);
      }
    }
  });

  // Schedule Meeting Mutation
  const scheduleMeetingMutation = useMutation({
    mutationFn: (data: any) => createMeetingAPI(data),
    onSuccess: () => {
      setIsScheduleOpen(false);
      setScheduleTitle('');
      setScheduleDesc('');
      setScheduleTime('');
      queryClient.invalidateQueries({ queryKey: ['meetingHistory'] });
    }
  });

  const handleCreateMeeting = () => {
    createMeetingMutation.mutate();
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinError(null);
    setJoinLoading(true);
    try {
      const res = await getMeetingByCodeAPI(joinCode.trim());
      if (res.success && res.meeting) {
        navigate(`/room/${res.meeting.meetingCode}`);
      } else {
        setJoinError('Room not found or inactive.');
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Invalid room code.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim() || !scheduleTime) return;

    scheduleMeetingMutation.mutate({
      title: scheduleTitle,
      description: scheduleDesc,
      startTime: new Date(scheduleTime).toISOString()
    });
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Professional statistics
  const stats = [
    { label: "Today's Calls", value: 3, icon: Video, color: 'text-brand-600', progress: 65 },
    { label: "Hours Collaborated", value: "14.5", icon: Clock, color: 'text-blue-600', progress: 80 },
    { label: "Files Shared", value: 8, icon: FileText, color: 'text-emerald-600', progress: 45 },
    { label: "Team Members Online", value: 5, icon: Users, color: 'text-pink-600', progress: 90 }
  ];

  // Active team roster
  const activeTeam = [
    { name: 'Rahul Sharma', role: 'Full Stack Engineer', status: 'online', task: 'Coding Backend' },
    { name: 'Priya Patel', role: 'Product Designer', status: 'online', task: 'Figma Review' },
    { name: 'Alex Mercer', role: 'DevOps Lead', status: 'online', task: 'Deploying Vercel' },
    { name: 'Sarah Connor', role: 'PM', status: 'away', task: 'Lunch Break' }
  ];

  // Shared files deck
  const recentFiles = [
    { name: 'Product Roadmap.pdf', type: 'pdf', size: '2.4 MB', icon: FileText, date: 'Today' },
    { name: 'Architecture Design.png', type: 'image', size: '4.8 MB', icon: FileImage, date: 'Yesterday' },
    { name: 'Database Model.json', type: 'code', size: '12 KB', icon: FileCode, date: '3 days ago' }
  ];

  // Live activity logs
  const activityLogs = [
    { user: 'Priya Patel', action: 'joined the room', time: '10m ago', icon: Video, color: 'text-brand-500' },
    { user: 'Alex Mercer', action: 'uploaded a roadmap PDF', time: '40m ago', icon: FileText, color: 'text-emerald-500' },
    { user: 'Rahul Sharma', action: 'updated the whiteboard', time: '2h ago', icon: Sparkles, color: 'text-blue-500' },
    { user: 'System', action: 'completed sync backup', time: '4h ago', icon: CloudLightning, color: 'text-amber-500' }
  ];

  const currentDate = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* 1. Hero banner section with animated gradient */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-md flex flex-col md:flex-row items-center justify-between gap-8 select-none">
        <div className="absolute top-0 right-0 w-[40%] h-[120%] bg-brand-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-50%] left-[-10%] w-[30%] h-[100%] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="flex flex-col justify-between relative z-10 space-y-6 max-w-xl">
          <div>
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 w-fit mb-4">
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={10} /> NexusSuite v1.0
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Design, Sync, and Co-work. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">
                All in one single space.
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-3 max-w-md leading-relaxed">
              Welcome back, {user?.name || 'Partner'}. Today is {currentDate}. Start an instant session, schedule calls, or sync vectors.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleCreateMeeting}
              disabled={createMeetingMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-500/10 active:scale-[0.98] transition-all"
            >
              {createMeetingMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Video size={14} />
              )}
              Instant Meeting
            </button>
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all"
            >
              <Calendar size={14} className="text-brand-600" />
              Schedule Call
            </button>
          </div>
        </div>

        {/* Right side: Generated Hero Meeting image */}
        <div className="hidden lg:block w-72 h-48 shrink-0 relative z-10 rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50">
          <img src={heroMeetingImg} alt="Meeting Collaboration" className="w-full h-full object-cover" />
        </div>

        {/* Right side card: Join Meeting with code input */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:w-80 shrink-0 relative z-10 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Access</span>
            <h3 className="text-sm font-bold text-slate-900 mt-1 mb-2">Join room with code</h3>
            <p className="text-[11px] text-slate-500 leading-normal mb-4">
              Enter the unique meeting identifier code shared by your manager to join calling grids immediately.
            </p>
          </div>

          <form onSubmit={handleJoinMeeting} className="relative mt-2">
            <input
              type="text"
              placeholder="abc-defg-hij"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3.5 pr-12 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button
              type="submit"
              disabled={joinLoading || !joinCode.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-brand-600 text-white hover:bg-brand-500 flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              {joinLoading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
            </button>
          </form>
          {joinError && <p className="text-[10px] text-red-500 mt-1.5 font-semibold">{joinError}</p>}
        </div>
      </div>

      {/* 2. Premium Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              className="p-5 bg-white border border-slate-200 rounded-2xl relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-lg bg-slate-50 border border-slate-100 ${card.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{card.value}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">+12% today</span>
              </div>
              {/* Progress Line */}
              <div className="h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-brand-500 rounded-full" 
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Main Split Widgets Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Timelines & Teams Roster */}
        <div className="space-y-8 lg:col-span-1">
          {/* Online Team widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-pink-600" />
                <h3 className="text-xs font-bold text-slate-800">Online Team</h3>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                5 Active
              </span>
            </div>

            <div className="space-y-3">
              {activeTeam.map((member, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold border border-slate-200 text-slate-800">
                        {member.name.charAt(0)}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white ${
                        member.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 leading-none">{member.name}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{member.task}</p>
                    </div>
                  </div>
                  <button className="text-[10px] text-brand-600 group-hover:underline font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Shared Files Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800">Recent Shared Files</h3>
              </div>
            </div>

            <div className="space-y-3">
              {recentFiles.map((file, i) => {
                const Icon = file.icon;
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate leading-none">{file.name}</p>
                        <p className="text-[9px] text-slate-400 mt-1">{file.size} • {file.date}</p>
                      </div>
                    </div>
                    <button className="text-[10px] text-brand-600 hover:text-brand-700 font-bold px-2 py-1">
                      Get
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Meeting History Cards & Activity Logs */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Recent Activity Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-brand-600" />
                <h3 className="text-xs font-bold text-slate-800">Live Activity Log</h3>
              </div>
              <span className="text-[9px] text-slate-400">Auto syncing</span>
            </div>

            <div className="relative border-l border-slate-150 pl-4 ml-2 space-y-6">
              {activityLogs.map((log, i) => {
                const Icon = log.icon;
                return (
                  <div key={i} className="relative group">
                    {/* Node Dot icon */}
                    <span className="absolute -left-[21px] top-0 p-0.5 rounded-full bg-white border border-slate-200 text-slate-400">
                      <Icon size={10} className={log.color} />
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-950">{log.user}</span>{' '}
                        <span className="text-slate-500">{log.action}</span>
                      </div>
                      <span className="text-[9px] text-slate-400">{log.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Redesigned Meeting History List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <History size={16} className="text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">History Collaboration Rooms</h3>
              </div>
              <button
                onClick={() => refetchHistory()}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
              >
                <RefreshCw size={12} className={historyRefetching ? 'animate-spin' : ''} />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2.5">
                <Loader2 size={24} className="animate-spin text-brand-500" />
                <p className="text-[11px] text-slate-400">Retrieving logs...</p>
              </div>
            ) : !historyData?.meetings || historyData.meetings.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No past sessions recorded. Start an instant call to see history.
              </div>
            ) : (
              /* Premium cards grid list */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyData.meetings.map((meeting: any) => {
                  const isHost = meeting.host?._id === user?.id || meeting.host === user?.id;
                  const date = new Date(meeting.startTime).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <motion.div
                      key={meeting._id}
                      whileHover={{ y: -2 }}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-brand-500/30 hover:bg-white transition-all flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{meeting.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{date}</p>
                        </div>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                          meeting.status === 'active' 
                            ? 'bg-brand-50 text-brand-600 border-brand-200' 
                            : 'bg-slate-200 text-slate-500 border-slate-300'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>

                      {/* Code Tag copy & Details */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <button
                          onClick={(e) => handleCopyCode(e, meeting.meetingCode)}
                          className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <span>{meeting.meetingCode}</span>
                          {copiedCode === meeting.meetingCode ? (
                            <Check size={10} className="text-green-600" />
                          ) : (
                            <Copy size={10} />
                          )}
                        </button>

                        {meeting.status !== 'ended' ? (
                          <button
                            onClick={() => navigate(`/room/${meeting.meetingCode}`)}
                            className="flex items-center gap-1 px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[10px] font-semibold transition-all"
                          >
                            <Play size={8} /> Rejoin
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Ended</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {isScheduleOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-2">Schedule upcoming room</h2>
              <p className="text-xs text-slate-550 mb-6">Set up details to invite your peers.</p>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Room Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Weekly Sync Up"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Description (Optional)</label>
                  <textarea
                    placeholder="Agenda points or guest details"
                    value={scheduleDesc}
                    onChange={(e) => setScheduleDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 resize-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={scheduleMeetingMutation.isPending}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {scheduleMeetingMutation.isPending && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

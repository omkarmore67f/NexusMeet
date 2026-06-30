import api from './api';

export const createMeetingAPI = async (data: {
  title: string;
  description?: string;
  startTime?: string;
  settings?: {
    isMutedByDefault: boolean;
    isCameraOffByDefault: boolean;
    requireWaitingRoom: boolean;
  };
}) => {
  const res = await api.post('/meetings', data);
  return res.data;
};

export const getMeetingByCodeAPI = async (code: string) => {
  const res = await api.get(`/meetings/code/${code}`);
  return res.data;
};

export const getMeetingHistoryAPI = async () => {
  const res = await api.get('/meetings/history');
  return res.data;
};

export const endMeetingAPI = async (meetingId: string) => {
  const res = await api.put(`/meetings/${meetingId}/end`);
  return res.data;
};

export const getMessagesByMeetingAPI = async (meetingId: string) => {
  const res = await api.get(`/messages/${meetingId}`);
  return res.data;
};

export const uploadAttachmentAPI = async (
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void
) => {
  const res = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
  return res.data;
};

// Admin Operations
export const getAdminStatsAPI = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const getAdminUsersAPI = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

export const updateAdminUserStatusAPI = async (
  userId: string,
  data: { status?: string; role?: string }
) => {
  const res = await api.put(`/admin/users/${userId}/status`, data);
  return res.data;
};

export const getAdminMeetingsAPI = async () => {
  const res = await api.get('/admin/meetings');
  return res.data;
};

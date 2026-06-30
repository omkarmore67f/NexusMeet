import api from './api';

export const loginAPI = async (data: any) => {
  const res = await api.post('/auth/login', data);
  return res.data;
};

export const registerAPI = async (data: any) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const logoutAPI = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

export const getMeAPI = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const forgotPasswordAPI = async (data: { email: string }) => {
  const res = await api.post('/auth/forgot-password', data);
  return res.data;
};

export const updateProfileAPI = async (data: {
  name?: string;
  email?: string;
  avatar?: string;
  password?: string;
}) => {
  const res = await api.put('/users/profile', data);
  return res.data;
};

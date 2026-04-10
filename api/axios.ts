import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://icematrix.site';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    }
    return Promise.reject(err);
  },
);

export default api;

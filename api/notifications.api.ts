import api from './axios';

export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  sender_email: string;
  created_at: string;
}

const wrap = <T>(p: Promise<{ data: { data: T } }>) => p.then(r => r.data.data);

export const NotificationsApi = {
  list: (unreadOnly?: boolean) =>
    wrap<NotificationDto[]>(
      api.get('/notifications', { params: unreadOnly ? { unread: '1' } : {} }),
    ),
  unreadCount: () => wrap<{ count: number }>(api.get('/notifications/unread-count')),
  markRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

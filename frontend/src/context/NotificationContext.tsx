'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification } from '@/types';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (params?: Record<string, string>) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  socket: Socket | null;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: '10', ...params } });
      setNotifications(res.data.notifications);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const res = await api.get('/notifications/unread-count');
    setUnreadCount(res.data.data.count);
  }, []);

  const markRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, status: n.status === 'UNREAD' ? 'READ' : n.status })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      if (removed?.status === 'UNREAD') setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  // Initialize Socket.IO when user logs in
  useEffect(() => {
    if (!user || !token) {
      socketRef.current?.disconnect();
      setSocket(null);
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch initial data
    fetchNotifications();
    fetchUnreadCount();

    // Connect socket
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('notification:new', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 9)]);
      if (notif.status === 'UNREAD') setUnreadCount((c) => c + 1);
    });

    s.on('notification:updated', (notif: Notification) => {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? notif : n)));
    });

    s.on('unread_count', (count: number) => {
      setUnreadCount(count);
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user, token, fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markRead,
        markAllRead,
        deleteNotification,
        socket,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

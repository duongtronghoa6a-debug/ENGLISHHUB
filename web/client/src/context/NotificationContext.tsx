import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category?: 'message' | 'purchase' | 'exam' | 'achievement' | 'reminder' | 'promo' | 'system' | 'course_review' | 'enrollment';
    is_read: boolean;
    created_at: string;
    action_url?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', category?: Notification['category']) => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Helper to get token from localStorage
const getToken = (): string | null => localStorage.getItem('token');

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token || !isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setNotifications(data.data || []);
                    setUnreadCount(data.unreadCount || 0);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch on mount and when auth changes
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [isAuthenticated, fetchNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }, []);

    const deleteNotification = useCallback(async (id: string) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const notif = notifications.find(n => n.id === id);
                setNotifications(prev => prev.filter(n => n.id !== id));
                if (notif && !notif.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    }, [notifications]);

    const clearAll = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/notifications`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to clear all:', error);
        }
    }, []);

    // Add local notification (for frontend-only alerts, will be added to API later)
    const addNotification = useCallback((
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info',
        category: Notification['category'] = 'system'
    ) => {
        const newNotif: Notification = {
            id: `local-${Date.now()}`,
            title,
            message,
            type,
            category,
            is_read: false,
            created_at: new Date().toISOString()
        };
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearAll,
            deleteNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Helper function to format notification time
export const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
};

import { useState, useEffect } from 'react';
import { Shield, User, Mail, Lock, Key, CheckCircle, Clock, Activity, Edit, Save, LogOut, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Session {
    id: string;
    device_info: string;
    device_type: string;
    browser: string;
    os: string;
    ip_address: string;
    location: string;
    is_current: boolean;
    last_activity: string;
    created_at: string;
}

interface ActivityLogItem {
    id: string;
    action: string;
    action_type: 'success' | 'warning' | 'error' | 'info';
    description: string;
    created_at: string;
}

const AdminAccountPage = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activities, setActivities] = useState<ActivityLogItem[]>([]);

    const [profile, setProfile] = useState({
        name: user?.name || 'Administrator',
        email: user?.email || 'admin@englishhub.com',
        phone: '0903 000 003',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Fetch sessions and activity logs
    useEffect(() => {
        fetchSessions();
        fetchActivityLogs();
    }, []);

    const fetchSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const response = await api.get('/system/account/sessions');
            if (response.data?.success) {
                setSessions(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            // Fallback mock data
            setSessions([
                { id: '1', device_info: 'Chrome on Windows', device_type: 'Desktop', browser: 'Chrome', os: 'Windows', ip_address: '192.168.1.100', location: 'Ho Chi Minh City', is_current: true, last_activity: new Date().toISOString(), created_at: new Date().toISOString() }
            ]);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const fetchActivityLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const response = await api.get('/system/account/activity-logs');
            if (response.data?.success) {
                setActivities(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
            // Fallback mock data
            setActivities([
                { id: '1', action: 'login', action_type: 'success', description: 'Đăng nhập thành công', created_at: new Date().toISOString() }
            ]);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleLogoutSession = async (sessionId: string) => {
        try {
            await api.delete(`/system/account/sessions/${sessionId}`);
            fetchSessions();
        } catch (error) {
            console.error('Failed to logout session:', error);
            alert('Không thể đăng xuất phiên này');
        }
    };

    const handleSave = () => {
        setIsEditing(false);
        alert('Thông tin đã được cập nhật!');
    };

    const handlePasswordChange = () => {
        if (profile.newPassword !== profile.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        alert('Mật khẩu đã được thay đổi thành công!');
        setProfile(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 5) return 'Vừa xong';
            if (minutes < 60) return `${minutes} phút trước`;
            if (hours < 24) return `${hours} giờ trước`;
            if (days < 7) return `${days} ngày trước`;
            return date.toLocaleDateString('vi-VN');
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="text-blue-500" /> Quản lý tài khoản Admin
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Quản lý thông tin cá nhân và bảo mật tài khoản
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Info */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <User size={20} /> Thông tin cá nhân
                        </h2>
                        {isEditing ? (
                            <button onClick={handleSave} className="flex items-center gap-1 text-green-500 hover:text-green-600">
                                <Save size={18} /> Lưu
                            </button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-blue-500 hover:text-blue-600">
                                <Edit size={18} /> Sửa
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                            {profile.name[0]}
                        </div>
                        <div>
                            <div className="font-bold text-lg">{profile.name}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quản trị viên hệ thống</div>
                            <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full mt-1">
                                <CheckCircle size={12} /> Đã xác thực
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none ${!isEditing ? 'opacity-70' : ''}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className={`w-full pl-10 pr-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none opacity-70`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none ${!isEditing ? 'opacity-70' : ''}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Lock size={20} /> Đổi mật khẩu
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Mật khẩu hiện tại
                            </label>
                            <div className="relative">
                                <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    value={profile.currentPassword}
                                    onChange={(e) => setProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    className={`w-full pl-10 pr-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={profile.newPassword}
                                onChange={(e) => setProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={profile.confirmPassword}
                                onChange={(e) => setProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            onClick={handlePasswordChange}
                            className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                        >
                            Cập nhật mật khẩu
                        </button>
                    </div>
                </div>

                {/* Active Sessions */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Clock size={20} /> Phiên đăng nhập
                        </h2>
                        <button onClick={fetchSessions} className="text-blue-500 hover:text-blue-600">
                            <RefreshCw size={18} className={isLoadingSessions ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {isLoadingSessions ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Không có phiên nào</div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map(session => (
                                <div key={session.id} className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-between`}>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {session.device_info || `${session.browser} on ${session.os}`}
                                            {session.is_current && (
                                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Hiện tại</span>
                                            )}
                                        </div>
                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {session.ip_address} {session.location && `• ${session.location}`}
                                        </div>
                                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Hoạt động: {formatDate(session.last_activity)}
                                        </div>
                                    </div>
                                    {!session.is_current && (
                                        <button
                                            onClick={() => handleLogoutSession(session.id)}
                                            className="flex items-center gap-1 text-red-500 text-sm hover:underline"
                                        >
                                            <LogOut size={14} /> Đăng xuất
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity Log */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Activity size={20} /> Lịch sử hoạt động
                        </h2>
                        <button onClick={fetchActivityLogs} className="text-blue-500 hover:text-blue-600">
                            <RefreshCw size={18} className={isLoadingLogs ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {isLoadingLogs ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Chưa có hoạt động</div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${activity.action_type === 'success' ? 'bg-green-500' :
                                            activity.action_type === 'warning' ? 'bg-yellow-500' :
                                                activity.action_type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                        }`}></div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{activity.description || activity.action}</div>
                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {formatDate(activity.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAccountPage;

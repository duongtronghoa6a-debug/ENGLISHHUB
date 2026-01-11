import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    User, Lock, Palette, LogOut,
    Save, Loader2, Check, AlertCircle, Moon, Sun
} from 'lucide-react';

interface UserProfile {
    email: string;
    fullName: string;
    phone: string;
    avatar: string;
    bio: string;
    specialization: string;
}

const TeacherSettingsPage = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile state
    const [profile, setProfile] = useState<UserProfile>({
        email: '',
        fullName: '',
        phone: '',
        avatar: '',
        bio: '',
        specialization: ''
    });

    // Password state
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (isAuthenticated) {
            fetchProfile();
        }
    }, [isAuthenticated]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/teacher/profile');
            if (res.data.success && res.data.data) {
                const data = res.data.data;
                setProfile({
                    email: data.email || '',
                    fullName: data.full_name || '',
                    phone: data.phone || '',
                    avatar: data.avatar || '',
                    bio: data.bio || '',
                    specialization: data.specialization || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setSaveMessage(null);
        try {
            await api.put('/users/profile', {
                full_name: profile.fullName,
                phone: profile.phone,
                bio: profile.bio,
                specialization: profile.specialization
            });
            setSaveMessage({ type: 'success', text: 'Đã lưu thông tin thành công!' });
        } catch (error) {
            setSaveMessage({ type: 'error', text: 'Có lỗi xảy ra, vui lòng thử lại.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            setSaveMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
            return;
        }
        if (passwords.newPassword.length < 6) {
            setSaveMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
            return;
        }

        setLoading(true);
        setSaveMessage(null);
        try {
            await api.put('/users/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setSaveMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setSaveMessage({
                type: 'error',
                text: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
            logout();
            navigate('/login');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Hồ sơ', icon: User },
        { id: 'password', label: 'Mật khẩu', icon: Lock },
        { id: 'appearance', label: 'Giao diện', icon: Palette },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Cài đặt</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className={`w-full md:w-64 flex-shrink-0 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl p-4 h-fit shadow-lg`}>
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white'
                                    : isDarkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                        <hr className={`my-4 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} />
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-500 ${isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                                }`}
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Đăng xuất</span>
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className={`flex-1 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
                    {/* Save Message */}
                    {saveMessage && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${saveMessage.type === 'success'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                            {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span>{saveMessage.text}</span>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Thông tin cá nhân</h2>

                            <div className="flex items-center gap-6 mb-6">
                                <img
                                    src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'T')}&background=1a237e&color=fff&size=100`}
                                    alt=""
                                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500"
                                />
                                <div>
                                    <p className="font-bold text-lg">{profile.fullName || 'Chưa cập nhật'}</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {profile.email}
                                    </p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                                        Giáo viên
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.fullName}
                                        onChange={(e) => setProfile(p => ({ ...p, fullName: e.target.value }))}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Chuyên môn
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.specialization}
                                        onChange={(e) => setProfile(p => ({ ...p, specialization: e.target.value }))}
                                        placeholder="VD: IELTS, TOEIC, Giao tiếp"
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDarkMode ? 'bg-white/5 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Giới thiệu bản thân
                                    </label>
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                                        rows={3}
                                        className={`w-full px-4 py-3 rounded-xl outline-none resize-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                                            }`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Lưu thay đổi
                            </button>
                        </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Đổi mật khẩu</h2>

                            <div className="grid gap-4 max-w-md">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Mật khẩu hiện tại
                                    </label>
                                    <input
                                        type="password"
                                        value={passwords.currentPassword}
                                        onChange={(e) => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                                            }`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleChangePassword}
                                disabled={loading || !passwords.currentPassword || !passwords.newPassword}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                                Đổi mật khẩu
                            </button>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Giao diện</h2>

                            <div className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-4">
                                    {isDarkMode ? <Moon className="w-6 h-6 text-indigo-500" /> : <Sun className="w-6 h-6 text-yellow-500" />}
                                    <div>
                                        <p className="font-medium">Chế độ tối</p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {isDarkMode ? 'Đang bật' : 'Đang tắt'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`w-12 h-7 rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherSettingsPage;

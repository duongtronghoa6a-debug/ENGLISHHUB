import { useState } from 'react';
import { Shield, User, Mail, Lock, Key, AlertTriangle, CheckCircle, Clock, Activity, Edit, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const AdminAccountPage = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: user?.name || 'Administrator',
        email: user?.email || '03@gmail.com',
        phone: '0903 000 003',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Mock session data
    const sessions = [
        { id: '1', device: 'Chrome on Windows', ip: '192.168.1.100', location: 'Ho Chi Minh City', lastActive: '2024-01-08 13:30', current: true },
        { id: '2', device: 'Safari on iPhone', ip: '192.168.1.105', location: 'Ho Chi Minh City', lastActive: '2024-01-07 09:15', current: false },
        { id: '3', device: 'Firefox on MacOS', ip: '203.162.xx.xx', location: 'Hanoi', lastActive: '2024-01-05 18:45', current: false },
    ];

    // Mock activity log
    const activities = [
        { action: 'Đăng nhập thành công', time: '5 phút trước', type: 'success' },
        { action: 'Cập nhật cài đặt hệ thống', time: '2 giờ trước', type: 'info' },
        { action: 'Duyệt giáo viên mới: teacher02', time: '1 ngày trước', type: 'success' },
        { action: 'Xóa khóa học vi phạm', time: '2 ngày trước', type: 'warning' },
        { action: 'Thêm danh mục mới', time: '3 ngày trước', type: 'info' },
    ];

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
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock size={20} /> Phiên đăng nhập
                    </h2>
                    <div className="space-y-3">
                        {sessions.map(session => (
                            <div key={session.id} className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-between`}>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {session.device}
                                        {session.current && (
                                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Hiện tại</span>
                                        )}
                                    </div>
                                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {session.ip} • {session.location}
                                    </div>
                                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Hoạt động: {session.lastActive}
                                    </div>
                                </div>
                                {!session.current && (
                                    <button className="text-red-500 text-sm hover:underline">Đăng xuất</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Log */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Activity size={20} /> Lịch sử hoạt động
                    </h2>
                    <div className="space-y-3">
                        {activities.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'success' ? 'bg-green-500' :
                                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}></div>
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{activity.action}</div>
                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activity.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAccountPage;

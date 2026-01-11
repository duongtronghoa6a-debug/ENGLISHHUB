import { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Bell, Lock, Globe, Mail, Save, Shield, Database, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';

const AdminSettingsPage = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { addNotification } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        siteName: 'English HUB',
        siteEmail: 'support@englishhub.com',
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        emailNotifications: true,
        pushNotifications: true,
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true,
        autoApproveTeachers: false,
        maxUploadSize: '100',
        defaultCurrency: 'VND'
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
    }, []);

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save to localStorage (for MVP - can be replaced with API call later)
            localStorage.setItem('adminSettings', JSON.stringify(settings));

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            addNotification('Thành công', 'Cài đặt đã được lưu thành công!', 'success');
        } catch (error) {
            addNotification('Lỗi', 'Không thể lưu cài đặt', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="text-blue-500" /> Cài đặt hệ thống
                    </h1>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tùy chỉnh cấu hình cho nền tảng English HUB
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-bold shadow-lg transition-colors`}
                >
                    <Save size={18} className={isSaving ? 'animate-spin' : ''} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>

            {/* Settings Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Globe size={20} /> Cài đặt chung
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Tên website
                            </label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={(e) => handleChange('siteName', e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Email hỗ trợ
                            </label>
                            <input
                                type="email"
                                value={settings.siteEmail}
                                onChange={(e) => handleChange('siteEmail', e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Ngôn ngữ mặc định
                            </label>
                            <select
                                value={settings.language}
                                onChange={(e) => handleChange('language', e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                            >
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Múi giờ
                            </label>
                            <select
                                value={settings.timezone}
                                onChange={(e) => handleChange('timezone', e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                            >
                                <option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option>
                                <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Palette size={20} /> Giao diện
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                            <div className="flex items-center gap-3">
                                {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                                <div>
                                    <div className="font-medium">Chế độ tối</div>
                                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {isDarkMode ? 'Đang bật' : 'Đang tắt'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`w-14 h-7 rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                                    } relative`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-8' : 'translate-x-1'
                                    }`}></div>
                            </button>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Đơn vị tiền tệ
                            </label>
                            <select
                                value={settings.defaultCurrency}
                                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                            >
                                <option value="VND">VND (₫)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Bell size={20} /> Thông báo
                    </h2>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Mail size={20} className="text-blue-500" />
                                <span>Thông báo Email</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-green-500" />
                                <span>Push Notifications</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.pushNotifications}
                                onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                    </div>
                </div>

                {/* Security */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Shield size={20} /> Bảo mật & Đăng ký
                    </h2>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                            <span>Cho phép đăng ký mới</span>
                            <input
                                type="checkbox"
                                checked={settings.allowRegistration}
                                onChange={(e) => handleChange('allowRegistration', e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                            <span>Yêu cầu xác thực email</span>
                            <input
                                type="checkbox"
                                checked={settings.requireEmailVerification}
                                onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                            <span>Tự động duyệt giáo viên</span>
                            <input
                                type="checkbox"
                                checked={settings.autoApproveTeachers}
                                onChange={(e) => handleChange('autoApproveTeachers', e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                            <span>Chế độ bảo trì</span>
                            <input
                                type="checkbox"
                                checked={settings.maintenanceMode}
                                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                                className="w-5 h-5 accent-red-500"
                            />
                        </label>
                    </div>
                </div>

                {/* Storage */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm md:col-span-2`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Database size={20} /> Lưu trữ
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Dung lượng upload tối đa (MB)
                            </label>
                            <input
                                type="number"
                                value={settings.maxUploadSize}
                                onChange={(e) => handleChange('maxUploadSize', e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                            />
                        </div>
                        <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                            <div className="text-sm text-blue-600 font-medium">Đã sử dụng</div>
                            <div className="text-2xl font-bold text-blue-600">2.3 GB</div>
                        </div>
                        <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                            <div className="text-sm text-green-600 font-medium">Còn trống</div>
                            <div className="text-2xl font-bold text-green-600">7.7 GB</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsPage;

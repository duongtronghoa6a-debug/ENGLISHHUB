import { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Save, Shield, Database, Globe, Palette, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

const AdminSettingsPage = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { addNotification } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({
        site_name: 'English HUB',
        site_email: 'support@englishhub.com',
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        maintenance_mode: false,
        allow_registration: true,
        auto_approve_teachers: false,
        max_upload_size: 100
    });

    // Load settings from API
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/system/admin/settings');
                if (response.data?.success) {
                    setSettings(prev => ({ ...prev, ...response.data.data }));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                // Load from localStorage as fallback
                const saved = localStorage.getItem('adminSettings');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        setSettings(prev => ({ ...prev, ...parsed }));
                    } catch (e) { /* ignore */ }
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put('/system/admin/settings', settings);
            // Also save to localStorage as backup
            localStorage.setItem('adminSettings', JSON.stringify(settings));
            addNotification('Thành công', 'Cài đặt đã được lưu thành công!', 'success');
        } catch (error) {
            console.error('Save settings error:', error);
            // Fallback: save to localStorage
            localStorage.setItem('adminSettings', JSON.stringify(settings));
            addNotification('Đã lưu', 'Cài đặt đã được lưu cục bộ.', 'info');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

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
                                value={settings.site_name}
                                onChange={(e) => handleChange('site_name', e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Email hỗ trợ
                            </label>
                            <input
                                type="email"
                                value={settings.site_email}
                                onChange={(e) => handleChange('site_email', e.target.value)}
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
                                className={`w-14 h-7 rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-8' : 'translate-x-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security & Registration */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Shield size={20} /> Bảo mật & Đăng ký
                    </h2>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                            <div>
                                <div>Cho phép đăng ký mới</div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Tắt để ngừng nhận đăng ký mới
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.allow_registration}
                                onChange={(e) => handleChange('allow_registration', e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                            <div>
                                <div>Tự động duyệt giáo viên</div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Bật để giáo viên được duyệt tự động
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.auto_approve_teachers}
                                onChange={(e) => handleChange('auto_approve_teachers', e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border border-red-500/30">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={20} className="text-red-500" />
                                <div>
                                    <div className="text-red-500 font-medium">Chế độ bảo trì</div>
                                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Chỉ admin đăng nhập được, user bị logout
                                    </div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode}
                                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                className="w-5 h-5 accent-red-500"
                            />
                        </label>
                    </div>
                </div>

                {/* Storage */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Database size={20} /> Lưu trữ
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Dung lượng upload tối đa (MB)
                            </label>
                            <input
                                type="number"
                                value={settings.max_upload_size}
                                onChange={(e) => handleChange('max_upload_size', parseInt(e.target.value) || 100)}
                                className={`w-full px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
        </div>
    );
};

export default AdminSettingsPage;

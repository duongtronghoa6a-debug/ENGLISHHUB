import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Lock, Save, Camera, Loader2 } from 'lucide-react';
import { userService, type UserProfile, type UpdateProfileData } from '../../services/user.service';
import MyReviews from '../../components/reviews/MyReviews';

const ProfilePage = () => {
    const { isDarkMode } = useTheme();
    const { user, isAuthenticated } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Profile data from API
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Fetch profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!isAuthenticated) {
                setIsLoading(false);
                return;
            }
            try {
                const response = await userService.getProfile();
                if (response.success && response.data) {
                    setProfile(response.data);
                    setName(response.data.profile?.full_name || '');
                    setEmail(response.data.email || '');
                    setPhone(response.data.profile?.phone || '');
                    setAddress(response.data.profile?.address || '');
                }
            } catch (err: any) {
                console.error('Failed to fetch profile:', err);
                setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [isAuthenticated]);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const updateData: UpdateProfileData = {
                full_name: name,
                phone: phone,
                address: address
            };

            const response = await userService.updateProfile(updateData);
            if (response.success) {
                setSuccessMessage('Đã lưu thay đổi thành công!');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setError('Có lỗi xảy ra khi lưu thay đổi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu mới không khớp!');
            return;
        }
        if (!currentPassword || !newPassword) {
            setError('Vui lòng nhập đầy đủ thông tin mật khẩu.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const response = await userService.changePassword(currentPassword, newPassword);
            if (response.success) {
                setSuccessMessage('Đổi mật khẩu thành công!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err: any) {
            console.error('Failed to change password:', err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0B1120]' : 'bg-gray-50'}`}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-all duration-500 font-sans ${isDarkMode ? 'bg-[#0B1120] text-gray-100' : 'bg-gray-50 text-gray-800'
            }`}>
            <div className="flex relative">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex-1 md:ml-64 p-6 md:p-10 transition-all duration-300">

                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <span className="bg-cyan-500 w-2 h-8 rounded-full"></span>
                            Quản lý tài khoản
                        </h1>

                        {/* Success/Error Messages */}
                        {successMessage && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 font-medium">
                                {successMessage}
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 font-medium">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Left Column: Avatar & Basic Info */}
                            <div className="md:col-span-1">
                                <div className={`rounded-3xl p-6 text-center shadow-lg ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'}`}>
                                    <div className="relative inline-block mb-4 group cursor-pointer">
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500/30">
                                            <img
                                                src={profile?.profile?.avatar_url || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'User'}`}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white" />
                                        </div>
                                    </div>
                                    <h2 className="font-bold text-xl mb-1">{name || user?.name || 'Người dùng'}</h2>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {(profile?.role || user?.role || 'learner').toUpperCase()}
                                    </p>

                                    {/* Stats */}
                                    {profile?.stats && (
                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <div className="text-2xl font-bold text-cyan-500">{profile.stats.total_xp}</div>
                                                <div className="text-xs opacity-60">XP</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-orange-500">{profile.stats.current_streak}</div>
                                                <div className="text-xs opacity-60">Streak</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* My Reviews */}
                                <div className="mt-6">
                                    <MyReviews isDarkMode={isDarkMode} />
                                </div>
                            </div>

                            {/* Right Column: Edit Form */}
                            <div className="md:col-span-2">
                                <div className={`rounded-3xl p-8 shadow-lg space-y-8 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'}`}>

                                    {/* Personal Information */}
                                    <section>
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-cyan-500">
                                            <User size={20} /> Thông tin cá nhân
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium opacity-80">Họ và tên</label>
                                                    <div className={`flex items-center px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                        <User size={18} className="text-gray-400 mr-3" />
                                                        <input
                                                            type="text"
                                                            value={name}
                                                            onChange={e => setName(e.target.value)}
                                                            className="bg-transparent outline-none w-full placeholder:text-gray-400"
                                                            placeholder="Nhập họ và tên"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium opacity-80">Số điện thoại</label>
                                                    <div className={`flex items-center px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                        <Phone size={18} className="text-gray-400 mr-3" />
                                                        <input
                                                            type="text"
                                                            value={phone}
                                                            onChange={e => setPhone(e.target.value)}
                                                            className="bg-transparent outline-none w-full placeholder:text-gray-400"
                                                            placeholder="Nhập số điện thoại"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium opacity-80">Email (Không thể thay đổi)</label>
                                                <div className={`flex items-center px-4 py-3 rounded-xl border opacity-60 cursor-not-allowed ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                    <Mail size={18} className="text-gray-400 mr-3" />
                                                    <input type="text" value={email} readOnly className="bg-transparent outline-none w-full cursor-not-allowed" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium opacity-80">Địa chỉ</label>
                                                <div className={`flex items-center px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                    <input
                                                        type="text"
                                                        value={address}
                                                        onChange={e => setAddress(e.target.value)}
                                                        className="bg-transparent outline-none w-full"
                                                        placeholder="Nhập địa chỉ"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="w-full h-px bg-gray-200 dark:bg-white/10"></div>

                                    {/* Security */}
                                    <section>
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-cyan-500">
                                            <Lock size={20} /> Bảo mật
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium opacity-80">Đổi mật khẩu</label>
                                                <div className={`flex items-center px-4 py-3 rounded-xl border mb-3 ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                    <Lock size={18} className="text-gray-400 mr-3" />
                                                    <input
                                                        type="password"
                                                        placeholder="Mật khẩu hiện tại"
                                                        value={currentPassword}
                                                        onChange={e => setCurrentPassword(e.target.value)}
                                                        className="bg-transparent outline-none w-full placeholder:text-gray-400"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className={`flex items-center px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                        <Lock size={18} className="text-transparent mr-3" />
                                                        <input
                                                            type="password"
                                                            placeholder="Mật khẩu mới"
                                                            value={newPassword}
                                                            onChange={e => setNewPassword(e.target.value)}
                                                            className="bg-transparent outline-none w-full placeholder:text-gray-400"
                                                        />
                                                    </div>
                                                    <div className={`flex items-center px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                        <Lock size={18} className="text-transparent mr-3" />
                                                        <input
                                                            type="password"
                                                            placeholder="Nhập lại mật khẩu mới"
                                                            value={confirmPassword}
                                                            onChange={e => setConfirmPassword(e.target.value)}
                                                            className="bg-transparent outline-none w-full placeholder:text-gray-400"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="w-full h-px bg-gray-200 dark:bg-white/10"></div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isSaving || (!currentPassword && !newPassword)}
                                            className={`px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 ${isDarkMode ? 'hover:bg-white/5 bg-white/10' : 'hover:bg-gray-100 bg-gray-50'}`}
                                        >
                                            Đổi mật khẩu
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Save size={18} />
                                            )}
                                            Lưu thay đổi
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

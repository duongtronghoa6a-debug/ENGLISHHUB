import { useState, useEffect } from 'react';
import { User, Mail, Phone, BookOpen, Users, DollarSign, Star, TrendingUp, Award, Calendar, Edit, Camera } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacher.service';
import api from '../../services/api';

interface TeacherStats {
    totalCourses: number;
    totalEnrollments: number;
    totalLessons: number;
    avgRating: number;
    totalReviews: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    publishedCourses: number;
    draftCourses: number;
}

interface TeacherProfile {
    full_name: string;
    email: string;
    phone: string;
    bio: string;
    specialization: string;
    avatar: string;
}

const TeacherProfilePage = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/teacher/profile');
            if (response.data?.success) {
                setProfile(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await teacherService.getDashboardStats();
            // Use real data from API (now includes revenue)
            const data = (response as any).data || (response as any).stats || response;
            setStats({
                totalCourses: data.totalCourses || 0,
                totalEnrollments: data.totalStudents || data.totalEnrollments || 0,
                totalLessons: data.totalLessons || 0,
                avgRating: data.avgRating || 4.5,
                totalReviews: data.totalReviews || 0,
                totalRevenue: data.totalRevenue || 0,
                thisMonthRevenue: data.thisMonthRevenue || 0,
                publishedCourses: data.publishedCourses || 0,
                draftCourses: data.draftCourses || 0
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Set zero values on error (no more mock data)
            setStats({
                totalCourses: 0,
                totalEnrollments: 0,
                totalLessons: 0,
                avgRating: 0,
                totalReviews: 0,
                totalRevenue: 0,
                thisMonthRevenue: 0,
                publishedCourses: 0,
                draftCourses: 0
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-[#1a237e] to-[#0d47a1]' : 'bg-gradient-to-r from-blue-600 to-blue-800'} rounded-2xl p-8 text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-5xl font-bold border-4 border-white/30">
                            {profile?.full_name?.[0] || user?.name?.[0] || 'T'}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-white text-blue-600 rounded-full shadow-lg hover:bg-gray-100">
                            <Camera size={18} />
                        </button>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-bold mb-2">{profile?.full_name || user?.name || 'Giáo viên Demo'}</h1>
                        <p className="text-blue-200 mb-4">{profile?.specialization || 'Giảng viên tiếng Anh tại English HUB'}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                            <span className="flex items-center gap-2">
                                <Mail size={16} /> {profile?.email || user?.email || '02@gmail.com'}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar size={16} /> Tham gia từ 01/2024
                            </span>
                            <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                                <Award size={16} /> Giảng viên Chứng nhận
                            </span>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
                        <Edit size={18} /> Chỉnh sửa
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <BookOpen className="text-blue-500" size={24} />
                        </div>
                        <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats?.totalCourses}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Khóa học</div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <Users className="text-green-500" size={24} />
                        </div>
                        <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats?.totalEnrollments}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Học viên</div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                            <Star className="text-yellow-500" size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats?.avgRating}★</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stats?.totalReviews} đánh giá</div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <DollarSign className="text-emerald-500" size={24} />
                        </div>
                        <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatCurrency(stats?.totalRevenue || 0)}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng doanh thu</div>
                </div>
            </div>

            {/* Revenue Card */}
            <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <DollarSign className="text-emerald-500" /> Tổng quan doanh thu
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} p-6 rounded-xl`}>
                        <div className="text-emerald-600 text-sm font-bold uppercase mb-2">Tháng này</div>
                        <div className="text-3xl font-bold text-emerald-600">{formatCurrency(stats?.thisMonthRevenue || 0)}</div>
                        <div className="text-sm text-emerald-500 mt-2">+12% so với tháng trước</div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'} p-6 rounded-xl`}>
                        <div className="text-blue-600 text-sm font-bold uppercase mb-2">Tổng doanh thu</div>
                        <div className="text-3xl font-bold text-blue-600">{formatCurrency(stats?.totalRevenue || 0)}</div>
                        <div className="text-sm text-blue-500 mt-2">Từ {stats?.totalEnrollments} đăng ký</div>
                    </div>
                </div>
            </div>

            {/* Courses Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
                    <h2 className="text-xl font-bold mb-4">Khóa học của bạn</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-green-500/10">
                            <span className="font-medium">Đã xuất bản</span>
                            <span className="text-green-600 font-bold">{stats?.publishedCourses}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-yellow-500/10">
                            <span className="font-medium">Bản nháp</span>
                            <span className="text-yellow-600 font-bold">{stats?.draftCourses}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-blue-500/10">
                            <span className="font-medium">Tổng bài học</span>
                            <span className="text-blue-600 font-bold">{stats?.totalLessons}</span>
                        </div>
                    </div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
                    <h2 className="text-xl font-bold mb-4">Thông tin cá nhân</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="text-gray-400" size={20} />
                            <div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Họ và tên</div>
                                <div className="font-medium">{profile?.full_name || user?.name || 'Chưa cập nhật'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="text-gray-400" size={20} />
                            <div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</div>
                                <div className="font-medium">{profile?.email || user?.email || 'Chưa cập nhật'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="text-gray-400" size={20} />
                            <div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Số điện thoại</div>
                                <div className="font-medium">{profile?.phone || 'Chưa cập nhật'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherProfilePage;

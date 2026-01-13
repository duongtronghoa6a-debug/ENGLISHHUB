import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Building2,
    Download,
    BookOpen,
    Users,
    Star,
    Clock,
    TrendingUp
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';

interface DashboardStats {
    totalCourses: number;
    totalEnrollments: number;
    totalStudents: number; // API returns this
    totalLessons: number;
    avgRating: number;
    totalReviews: number;
}

interface Activity {
    type: string;
    message: string;
    timestamp: string; // API returns timestamp, not date
}

const TeacherDashboard = () => {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activitiesRes] = await Promise.all([
                    teacherService.getDashboardStats(),
                    teacherService.getRecentActivity()
                ]);
                // API returns { success: true, data: {...} }
                setStats(statsRes.data || statsRes.stats || statsRes);
                setActivities(activitiesRes.data || activitiesRes.activities || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const quickActions = [
        {
            icon: Plus,
            title: 'Tạo bài tập hoặc đề thi',
            desc: 'Tạo bài tập và đề thi mới cho học viên của bạn',
            color: 'bg-blue-500',
            onClick: () => navigate('/teacher/exams')
        }
    ];

    const statCards = [
        { label: 'Khóa học', value: stats?.totalCourses || 0, icon: BookOpen, color: 'text-blue-500' },
        { label: 'Học viên', value: stats?.totalStudents || stats?.totalEnrollments || 0, icon: Users, color: 'text-green-500' },
        { label: 'Bài học', value: stats?.totalLessons || 0, icon: Clock, color: 'text-purple-500' },
        { label: 'Đánh giá', value: stats?.avgRating || 0, icon: Star, color: 'text-yellow-500', suffix: '★' }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold">Trang chủ</h1>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-6">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className={`${isDarkMode ? 'bg-[#151e32] hover:bg-[#1a2540]' : 'bg-white hover:bg-gray-50'} 
                            p-6 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 text-left`}
                    >
                        <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}>
                            <action.icon size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold mb-1">{action.title}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {action.desc}
                        </p>
                    </button>
                ))}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={stat.color} size={24} />
                            <TrendingUp className="text-green-400" size={16} />
                        </div>
                        <div className="text-2xl font-bold">
                            {stat.value}{stat.suffix || ''}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Hoạt động gần đây
                </h2>

                {activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-4 p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'enrollment' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {activity.type === 'enrollment' ? <Users size={18} /> : <Star size={18} />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{activity.message}</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString('vi-VN', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'Gần đây'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Chưa có hoạt động nào gần đây
                    </p>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;

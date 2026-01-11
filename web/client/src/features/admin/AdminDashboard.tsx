import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    BookOpen,
    AlertTriangle,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/admin.service';

interface Stats {
    totalUsers: number;
    totalCourses: number;
    pendingTeachers: number;
    pendingRefunds: number;
    pendingActions: number;
}

interface PendingAction {
    type: string;
    id: string;
    title: string;
    date: string;
}

const AdminDashboard = () => {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, actionsRes] = await Promise.all([
                    adminService.getDashboardStats(),
                    adminService.getPendingActions()
                ]);
                setStats(statsRes.stats);
                setPendingActions(actionsRes.actions || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = [
        { label: 'Tổng người dùng', value: stats?.totalUsers || 0, icon: Users, color: 'from-blue-500 to-blue-600' },
        { label: 'Tổng khóa học', value: stats?.totalCourses || 0, icon: BookOpen, color: 'from-green-500 to-green-600' },
        { label: 'Chờ duyệt GV', value: stats?.pendingTeachers || 0, icon: Clock, color: 'from-yellow-500 to-orange-500' },
        { label: 'Yêu cầu hoàn tiền', value: stats?.pendingRefunds || 0, icon: AlertTriangle, color: 'from-red-500 to-pink-500' }
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tổng quan hệ thống
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-lg p-6 relative overflow-hidden`}
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-8 translate-x-8`}></div>
                        <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon size={24} className="text-white" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Actions */}
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Công việc chờ xử lý</h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${stats?.pendingActions
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-green-500/10 text-green-500'}`}>
                            {stats?.pendingActions || 0} việc
                        </span>
                    </div>

                    {pendingActions.length > 0 ? (
                        <div className="space-y-4">
                            {pendingActions.slice(0, 5).map((action, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-4 p-4 rounded-xl ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.type === 'TEACHER_APPROVAL' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                                        }`}>
                                        {action.type === 'TEACHER_APPROVAL' ? <Users size={18} /> : <AlertTriangle size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{action.title}</p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {new Date(action.date).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30">
                                            <CheckCircle size={16} />
                                        </button>
                                        <button className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30">
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                            <p>Không có công việc nào cần xử lý</p>
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                    <h2 className="text-xl font-bold mb-6">Quản lý nhanh</h2>

                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <span className="font-medium">Quản lý người dùng</span>
                            </div>
                            <ArrowRight size={20} className="text-gray-400" />
                        </button>

                        <button
                            onClick={() => navigate('/admin/courses')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-lg flex items-center justify-center">
                                    <BookOpen size={20} />
                                </div>
                                <span className="font-medium">Quản lý khóa học</span>
                            </div>
                            <ArrowRight size={20} className="text-gray-400" />
                        </button>

                        <button
                            onClick={() => navigate('/admin/stats')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500/20 text-purple-500 rounded-lg flex items-center justify-center">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="font-medium">Thống kê chi tiết</span>
                            </div>
                            <ArrowRight size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

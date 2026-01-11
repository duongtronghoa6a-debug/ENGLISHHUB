import { useState, useEffect } from 'react';
import {
    Users,
    BookOpen,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { adminService } from '../../services/admin.service';

interface DashboardStats {
    totalUsers: number;
    totalCourses: number;
    pendingTeachers: number;
    pendingRefunds: number;
    pendingActions: number;
}

const AdminDashboardPage = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingActions, setPendingActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsData, actionsData] = await Promise.all([
                adminService.getDashboardStats(),
                adminService.getPendingActions()
            ]);
            setStats(statsData.stats);
            setPendingActions(actionsData.actions || []);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Không thể tải dữ liệu');
            // Fallback mock data if API fails
            setStats({
                totalUsers: 0,
                totalCourses: 0,
                pendingTeachers: 0,
                pendingRefunds: 0,
                pendingActions: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const statCards = stats ? [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), change: 'Real time', icon: Users, color: 'bg-blue-500' },
        { label: 'Total Courses', value: stats.totalCourses.toLocaleString(), change: 'Real time', icon: BookOpen, color: 'bg-green-500' },
        { label: 'Pending Teachers', value: stats.pendingTeachers.toLocaleString(), change: 'Cần duyệt', icon: TrendingUp, color: 'bg-purple-500' },
        { label: 'Pending Actions', value: stats.pendingActions.toLocaleString(), change: stats.pendingActions > 0 ? 'Urgent' : 'OK', icon: Clock, color: 'bg-orange-500' },
    ] : [];

    const systemAlerts = [
        { level: 'Info', count: stats?.pendingTeachers || 0, msg: 'Teacher applications pending', color: 'text-blue-500' },
        { level: 'Info', count: stats?.pendingRefunds || 0, msg: 'Refund requests pending', color: 'text-yellow-500' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <button
                    onClick={loadDashboardData}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl text-yellow-700 dark:text-yellow-400">
                    {error} - Đang hiển thị dữ liệu mặc định. Kiểm tra kết nối database.
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                            <span className={`text-xs font-medium ${stat.change === 'Urgent' ? 'text-orange-500 bg-orange-500/10' : 'text-green-500 bg-green-500/10'} px-2 py-0.5 rounded mt-2 inline-block`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Section: Alerts & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* System Alerts */}
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" />
                        System Alerts
                    </h3>
                    <div className="space-y-4">
                        {systemAlerts.map((alert, idx) => (
                            <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-bold ${alert.color} flex items-center gap-1.5`}>
                                        <div className={`w-2 h-2 rounded-full bg-current`}></div>
                                        {alert.level} ({alert.count})
                                    </span>
                                    <ArrowRight size={14} className="opacity-50" />
                                </div>
                                <span className="text-sm opacity-80 pl-3.5 border-l-2 border-gray-200 dark:border-white/10 ml-1">
                                    {alert.msg}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Actions */}
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <CheckCircle className="text-blue-500" />
                        Pending Admin Actions ({pendingActions.length})
                    </h3>
                    {pendingActions.length > 0 ? (
                        <ul className="space-y-3">
                            {pendingActions.map((action, idx) => (
                                <li key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer group transition-all">
                                    <div>
                                        <span className="text-xs text-blue-500 font-medium">{action.type}</span>
                                        <p className="text-sm opacity-80 group-hover:opacity-100">{action.title}</p>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 text-blue-500" />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Không có action nào đang chờ</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminDashboardPage;

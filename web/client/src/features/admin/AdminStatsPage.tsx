import { BarChart2, TrendingUp, Users, BookOpen, DollarSign, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const AdminStatsPage = () => {
    const { isDarkMode } = useTheme();

    // Mock statistics data
    const monthlyData = [
        { month: 'T1', revenue: 12500000, users: 450, courses: 8 },
        { month: 'T2', revenue: 15800000, users: 520, courses: 12 },
        { month: 'T3', revenue: 18200000, users: 610, courses: 15 },
        { month: 'T4', revenue: 21000000, users: 780, courses: 18 },
        { month: 'T5', revenue: 25600000, users: 920, courses: 22 },
        { month: 'T6', revenue: 28900000, users: 1050, courses: 25 },
    ];

    const topCourses = [
        { name: 'IELTS Speaking Masterclass', enrollments: 245, revenue: 4900000, rating: 4.9 },
        { name: 'TOEIC 700+ Complete Guide', enrollments: 198, revenue: 3960000, rating: 4.8 },
        { name: 'Grammar Fundamentals', enrollments: 167, revenue: 0, rating: 4.7 },
        { name: 'Business English Pro', enrollments: 134, revenue: 2680000, rating: 4.6 },
        { name: 'Pronunciation Perfect', enrollments: 112, revenue: 2240000, rating: 4.5 },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const stats = {
        totalRevenue: 122000000,
        revenueGrowth: 15.2,
        totalUsers: 7234,
        userGrowth: 12.5,
        totalCourses: 100,
        courseGrowth: 8.3,
        totalEnrollments: 2004,
        enrollmentGrowth: 22.1
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart2 className="text-blue-500" /> Thống kê hệ thống
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tổng quan về hiệu suất của nền tảng
                </p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${isDarkMode ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' : 'bg-gradient-to-br from-emerald-50 to-emerald-100'} p-6 rounded-2xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <DollarSign className="text-emerald-500" size={28} />
                        <span className="flex items-center gap-1 text-emerald-500 text-sm font-bold">
                            <ArrowUp size={14} /> {stats.revenueGrowth}%
                        </span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatCurrency(stats.totalRevenue)}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng doanh thu</div>
                </div>

                <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10' : 'bg-gradient-to-br from-blue-50 to-blue-100'} p-6 rounded-2xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <Users className="text-blue-500" size={28} />
                        <span className="flex items-center gap-1 text-blue-500 text-sm font-bold">
                            <ArrowUp size={14} /> {stats.userGrowth}%
                        </span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Người dùng</div>
                </div>

                <div className={`${isDarkMode ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10' : 'bg-gradient-to-br from-purple-50 to-purple-100'} p-6 rounded-2xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <BookOpen className="text-purple-500" size={28} />
                        <span className="flex items-center gap-1 text-purple-500 text-sm font-bold">
                            <ArrowUp size={14} /> {stats.courseGrowth}%
                        </span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{stats.totalCourses}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Khóa học</div>
                </div>

                <div className={`${isDarkMode ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10' : 'bg-gradient-to-br from-orange-50 to-orange-100'} p-6 rounded-2xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="text-orange-500" size={28} />
                        <span className="flex items-center gap-1 text-orange-500 text-sm font-bold">
                            <ArrowUp size={14} /> {stats.enrollmentGrowth}%
                        </span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{stats.totalEnrollments.toLocaleString()}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Đăng ký</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Calendar size={20} /> Doanh thu theo tháng
                    </h2>
                    <div className="space-y-3">
                        {monthlyData.map((data, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <span className="w-8 text-sm font-medium">{data.month}</span>
                                <div className="flex-1 h-8 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg flex items-center justify-end pr-2"
                                        style={{ width: `${(data.revenue / 30000000) * 100}%` }}
                                    >
                                        <span className="text-white text-xs font-bold">{(data.revenue / 1000000).toFixed(0)}M</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Courses */}
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <BookOpen size={20} /> Khóa học phổ biến nhất
                    </h2>
                    <div className="space-y-3">
                        {topCourses.map((course, index) => (
                            <div key={index} className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-white' :
                                    index === 1 ? 'bg-gray-400 text-white' :
                                        index === 2 ? 'bg-orange-600 text-white' :
                                            'bg-gray-200 text-gray-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{course.name}</div>
                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {course.enrollments} học viên • ⭐ {course.rating}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-emerald-500">
                                        {course.revenue > 0 ? formatCurrency(course.revenue) : 'Miễn phí'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Growth Chart */}
            <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users size={20} /> Tăng trưởng người dùng
                </h2>
                <div className="flex items-end gap-4 h-48">
                    {monthlyData.map((data, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                                style={{ height: `${(data.users / 1200) * 100}%` }}
                            ></div>
                            <span className="text-xs font-medium">{data.month}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminStatsPage;

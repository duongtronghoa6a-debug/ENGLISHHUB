import { useState, useEffect } from 'react';
import { BookOpen, Eye, CheckCircle, XCircle, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { courseService } from '../../services/course.service';

interface Course {
    id: string;
    title: string;
    description: string;
    level: string;
    price: number;
    status: string;
    thumbnail_url: string;
    created_at: string;
    teacher?: {
        full_name?: string;
        profile?: {
            full_name: string;
        }
    };
}

const AdminCoursesPage = () => {
    const { isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState('all');
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCourses();
    }, [activeTab]);

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            // Admin should see all courses including unpublished
            const params: any = { limit: 100, is_published: 'all' };
            if (activeTab !== 'all') params.status = activeTab;

            const response = await courseService.getAllCourses(params);
            // Handle multiple response formats - API returns array in data
            const courseData = response.data?.rows || response.data?.courses || response.data || [];
            setCourses(Array.isArray(courseData) ? courseData : []);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (courseId: string, newStatus: string) => {
        try {
            await courseService.updateCourse(courseId, { status: newStatus });
            fetchCourses();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Lỗi khi cập nhật trạng thái');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400';
            case 'draft': return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400';
            case 'rejected': return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'published': 'Đã duyệt',
            'pending': 'Chờ duyệt',
            'draft': 'Nháp',
            'rejected': 'Từ chối'
        };
        return labels[status] || status;
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: courses.length,
        pending: courses.filter(c => c.status === 'pending').length,
        published: courses.filter(c => c.status === 'published').length,
        draft: courses.filter(c => c.status === 'draft').length
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="text-blue-500" /> Quản lý khóa học
                    </h1>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Duyệt và quản lý tất cả khóa học trong hệ thống
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className={`text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng khóa học</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase mb-1">Chờ duyệt</div>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-green-600 dark:text-green-400 text-xs font-bold uppercase mb-1">Đã duyệt</div>
                    <div className="text-2xl font-bold">{stats.published}</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className={`text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nháp</div>
                    <div className="text-2xl font-bold">{stats.draft}</div>
                </div>
            </div>

            {/* Filters & Tabs */}
            <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} flex flex-col md:flex-row justify-between items-center gap-4`}>
                <div className={`flex gap-2 p-1 ${isDarkMode ? 'bg-black/20' : 'bg-gray-100'} rounded-lg`}>
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'published', label: 'Đã duyệt' },
                        { key: 'pending', label: 'Chờ duyệt' },
                        { key: 'draft', label: 'Nháp' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === tab.key
                                ? `${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} text-blue-600 shadow-sm`
                                : `${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full md:w-64 pl-9 pr-4 py-2 ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} rounded-lg text-sm border-none outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                    </div>
                </div>
            </div>

            {/* Course List Table */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rounded-2xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} overflow-hidden`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} text-xs uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <th className="p-4">Khóa học</th>
                                <th className="p-4">Giảng viên</th>
                                <th className="p-4">Cấp độ</th>
                                <th className="p-4">Giá</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'} text-sm`}>
                            {filteredCourses.length > 0 ? filteredCourses.map(course => (
                                <tr key={course.id} className={`${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors group`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex-shrink-0">
                                                {course.thumbnail_url && (
                                                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold">{course.title}</div>
                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {new Date(course.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {course.teacher?.full_name || course.teacher?.profile?.full_name || 'N/A'}
                                    </td>
                                    <td className="p-4 capitalize">{course.level}</td>
                                    <td className="p-4 font-bold">
                                        {course.price === 0
                                            ? <span className="text-green-500">Miễn phí</span>
                                            : new Intl.NumberFormat('vi-VN').format(course.price) + 'đ'
                                        }
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${getStatusColor(course.status)}`}>
                                            {getStatusLabel(course.status)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {course.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(course.id, 'published')}
                                                        className="p-2 bg-green-50 dark:bg-green-500/20 text-green-600 rounded-lg hover:bg-green-100"
                                                        title="Duyệt"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(course.id, 'rejected')}
                                                        className="p-2 bg-red-50 dark:bg-red-500/20 text-red-600 rounded-lg hover:bg-red-100"
                                                        title="Từ chối"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600" title="Xem chi tiết">
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                            Không tìm thấy khóa học nào
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
};

export default AdminCoursesPage;

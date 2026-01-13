import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, CheckCircle, XCircle, Search, Plus, Trash2, X, Edit } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

interface Course {
    id: string;
    title: string;
    description: string;
    level: string;
    price: number;
    status: string;
    approval_status: string;
    is_published: boolean;
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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCourses, setTotalCourses] = useState(0);
    const [newCourse, setNewCourse] = useState({ title: '', description: '', price: 0, level: 'B1' });
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, published: 0, draft: 0 });

    useEffect(() => {
        fetchCourses();
    }, [activeTab, currentPage]);

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/courses', {
                params: { limit: 20, page: currentPage, status: activeTab !== 'all' ? activeTab : undefined }
            });
            setCourses(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
            setTotalCourses(response.data.pagination?.total || response.data.data?.length || 0);
            // Use stats from API if available
            if (response.data.stats) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCourse = async () => {
        try {
            const response = await api.post('/admin/courses', newCourse);
            const courseId = response.data?.data?.id;
            setShowCreateModal(false);
            setNewCourse({ title: '', description: '', price: 0, level: 'B1' });
            fetchCourses();
            if (courseId) {
                setCreatedCourseId(courseId);
            }
        } catch (error) {
            alert('Lỗi tạo khóa học');
        }
    };

    const handleViewCourse = (courseId: string) => {
        navigate(`/admin/courses/${courseId}/lessons`);
    };

    const handleDeleteCourse = async (id: string, force: boolean = false) => {
        if (!force && !window.confirm('Bạn có chắc muốn xóa khóa học này?')) return;
        try {
            const response = await api.delete(`/admin/courses/${id}${force ? '?force=true' : ''}`);

            // Check if confirmation is required (course has enrollments/orders)
            if (response.data.requireConfirmation) {
                const confirmMsg = `⚠️ CẢNH BÁO:\n\n${response.data.message}\n\nNếu xóa, tất cả dữ liệu liên quan sẽ bị mất vĩnh viễn!\n\nBạn có CHẮC CHẮN muốn xóa?`;
                if (window.confirm(confirmMsg)) {
                    // Retry with force=true
                    await handleDeleteCourse(id, true);
                }
                return;
            }

            fetchCourses();
            alert('Đã xóa khóa học thành công!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi xóa khóa học');
        }
    };

    const handleUpdateStatus = async (courseId: string, newApprovalStatus: string) => {
        // Map UI status to approval_status values
        const approvalStatusMap: Record<string, string> = {
            'published': 'approved',
            'rejected': 'rejected',
            'draft': 'draft'
        };
        const mappedStatus = approvalStatusMap[newApprovalStatus] || newApprovalStatus;
        console.log('[DEBUG] Updating course:', courseId, 'to approval_status:', mappedStatus);

        try {
            await api.put(`/admin/courses/${courseId}`, {
                approval_status: mappedStatus,
                is_published: mappedStatus === 'approved'
            });
            console.log('[DEBUG] Update successful!');
            fetchCourses();
            alert('Cập nhật trạng thái thành công!');
        } catch (error: any) {
            console.error('[DEBUG] Update failed:', error.response?.data || error);
            alert(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    // Helper to determine effective status based on approval_status
    const getEffectiveStatus = (course: Course): string => {
        // Use approval_status as the source of truth (ignore is_published which may be stale)
        const status = course.approval_status;
        if (status === 'approved') return 'published';
        if (status === 'pending_review') return 'pending';
        if (status === 'rejected') return 'rejected';
        return 'draft';
    };

    const getStatusColor = (course: Course) => {
        const status = getEffectiveStatus(course);
        switch (status) {
            case 'published': return 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400';
            case 'draft': return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400';
            case 'rejected': return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (course: Course) => {
        const status = getEffectiveStatus(course);
        const labels: Record<string, string> = {
            'published': 'Đã duyệt',
            'pending': 'Chờ duyệt',
            'draft': 'Nháp',
            'rejected': 'Từ chối'
        };
        return labels[status] || 'Nháp';
    };

    // Check if course can be published
    const canPublish = (course: Course): boolean => {
        const status = getEffectiveStatus(course);
        return status !== 'published';
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats now come from API (see fetchCourses)

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
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-purple-500"
                >
                    <Plus size={18} /> Tạo khóa học
                </button>
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
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${getStatusColor(course)}`}>
                                            {getStatusLabel(course)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {getEffectiveStatus(course) === 'pending' && (
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
                                            {getEffectiveStatus(course) === 'draft' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(course.id, 'published')}
                                                    className="p-2 bg-green-50 dark:bg-green-500/20 text-green-600 rounded-lg hover:bg-green-100"
                                                    title="Xuất bản"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            {getEffectiveStatus(course) === 'rejected' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(course.id, 'published')}
                                                    className="p-2 bg-green-50 dark:bg-green-500/20 text-green-600 rounded-lg hover:bg-green-100"
                                                    title="Xuất bản lại"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleViewCourse(course.id)}
                                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-500/10 rounded-lg text-blue-600"
                                                title="Quản lý nội dung"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCourse(course.id)}
                                                className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg hover:bg-red-100"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 p-4 border-t border-white/10">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <span className="px-4 py-2">Trang {currentPage} / {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rounded-2xl p-6 w-full max-w-md space-y-4`}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Tạo khóa học mới</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-500/20 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Tên khóa học *"
                            value={newCourse.title}
                            onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                        />
                        <textarea
                            placeholder="Mô tả"
                            value={newCourse.description}
                            onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} resize-none`}
                            rows={3}
                        />
                        <div className="flex gap-4">
                            <input
                                type="number"
                                placeholder="Giá (VND)"
                                value={newCourse.price}
                                onChange={e => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                                className={`flex-1 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                            />
                            <select
                                value={newCourse.level}
                                onChange={e => setNewCourse({ ...newCourse, level: e.target.value })}
                                className={`px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                            >
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="C1">C1</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCreateCourse}
                            disabled={!newCourse.title}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50"
                        >
                            Tạo khóa học
                        </button>
                    </div>
                </div>
            )}

            {/* Created Course Success Modal */}
            {createdCourseId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setCreatedCourseId(null)}>
                    <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4`} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-2">🎉 Tạo khóa học thành công!</h2>
                        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bạn muốn thêm bài học vào khóa học ngay bây giờ?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCreatedCourseId(null)}
                                className={`flex-1 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}
                            >
                                Để sau
                            </button>
                            <button
                                onClick={() => { navigate(`/admin/courses/${createdCourseId}/lessons`); setCreatedCourseId(null); }}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold"
                            >
                                Thêm bài học
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminCoursesPage;

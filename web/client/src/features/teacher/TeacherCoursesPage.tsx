import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    BookOpen,
    Users
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    level: string;
    status: string;
    thumbnail_url: string;
    created_at: string;
    lessonCount: number;
    enrollmentCount: number;
}

const TeacherCoursesPage = () => {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: 0,
        level: 'beginner',
        category: 'toeic',
        thumbnail_url: '',
        status: 'draft'
    });

    useEffect(() => {
        fetchCourses();
    }, [statusFilter]);

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const params: any = { limit: 50 };
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await teacherService.getMyCourses(params);
            setCourses(response.courses || []);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCourse = async () => {
        try {
            await teacherService.createCourse(formData);
            setShowCreateModal(false);
            setFormData({ title: '', description: '', price: 0, level: 'beginner', category: 'toeic', thumbnail_url: '', status: 'draft' });
            fetchCourses();
        } catch (error) {
            console.error('Failed to create course:', error);
            alert('Lỗi khi tạo khóa học');
        }
    };

    const handleUpdateCourse = async () => {
        if (!editingCourse) return;
        try {
            await teacherService.updateCourse(editingCourse.id, formData);
            setEditingCourse(null);
            setFormData({ title: '', description: '', price: 0, level: 'beginner', category: 'toeic', thumbnail_url: '', status: 'draft' });
            fetchCourses();
        } catch (error) {
            console.error('Failed to update course:', error);
            alert('Lỗi khi cập nhật khóa học');
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa khóa học này?')) return;
        try {
            await teacherService.deleteCourse(id);
            fetchCourses();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Không thể xóa khóa học');
        }
    };

    const openEditModal = (course: Course) => {
        setEditingCourse(course);
        setFormData({
            title: course.title,
            description: course.description || '',
            price: course.price,
            level: course.level,
            category: (course as any).category || 'toeic',
            thumbnail_url: course.thumbnail_url || '',
            status: course.status
        });
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'draft': 'bg-gray-500',
            'pending': 'bg-yellow-500',
            'published': 'bg-green-500',
            'archived': 'bg-red-500'
        };
        const labels: Record<string, string> = {
            'draft': 'Nháp',
            'pending': 'Chờ duyệt',
            'published': 'Đã xuất bản',
            'archived': 'Đã lưu trữ'
        };
        return (
            <span className={`${colors[status] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded-full`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Khóa học của tôi</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                    <Plus size={20} />
                    Thêm khóa học
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className={`flex-1 flex items-center px-4 py-2 rounded-xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow`}>
                    <Search size={20} className="text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm khóa học..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`px-4 py-2 rounded-xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow outline-none`}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="draft">Nháp</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="published">Đã xuất bản</option>
                </select>
            </div>

            {/* Course Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <div
                            key={course.id}
                            className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden group`}
                        >
                            {/* Thumbnail */}
                            <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
                                {course.thumbnail_url && (
                                    <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute top-3 right-3">
                                    {getStatusBadge(course.status)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-2 line-clamp-1">{course.title}</h3>
                                <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {course.description || 'Chưa có mô tả'}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm mb-4">
                                    <div className="flex items-center gap-1">
                                        <BookOpen size={16} className="text-blue-500" />
                                        <span>{course.lessonCount} bài</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users size={16} className="text-green-500" />
                                        <span>{course.enrollmentCount} học viên</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/teacher/courses/${course.id}/lessons`)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
                                    >
                                        <Eye size={16} />
                                        Xem
                                    </button>
                                    <button
                                        onClick={() => openEditModal(course)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20 transition-colors"
                                    >
                                        <Edit size={16} />
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCourse(course.id)}
                                        className="py-2 px-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Chưa có khóa học nào</p>
                    <p className="text-sm">Bắt đầu tạo khóa học đầu tiên của bạn</p>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingCourse) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-lg mx-4 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-2xl p-6`}>
                        <h2 className="text-xl font-bold mb-6">
                            {editingCourse ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên khóa học *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="Nhập tên khóa học"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none`}
                                    placeholder="Nhập mô tả khóa học"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Giá (VND)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cấp độ</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Danh mục *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    <option value="toeic">TOEIC</option>
                                    <option value="ielts">IELTS</option>
                                    <option value="vstep">VSTEP</option>
                                    <option value="giao-tiep">Giao tiếp</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Ảnh bìa (URL)</label>
                                <input
                                    type="text"
                                    value={formData.thumbnail_url}
                                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    <option value="draft">Nháp</option>
                                    <option value="pending">Gửi duyệt</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditingCourse(null);
                                    setFormData({ title: '', description: '', price: 0, level: 'beginner', category: 'toeic', thumbnail_url: '', status: 'draft' });
                                }}
                                className={`flex-1 py-2 rounded-lg ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} font-medium transition-colors`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                {editingCourse ? 'Cập nhật' : 'Tạo khóa học'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherCoursesPage;

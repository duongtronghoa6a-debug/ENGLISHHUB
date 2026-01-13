import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Video, FileText, Link as LinkIcon, ChevronLeft, Loader2, Music, FileQuestion, Eye, Plus, Trash2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

interface Lesson {
    id: string;
    title: string;
    content_type: 'video' | 'pdf' | 'audio' | 'link' | 'text' | 'quiz';
    content_url?: string;
    duration?: number;
    order_index: number;
}

interface Course {
    id: string;
    title: string;
    description?: string;
    teacher?: {
        full_name?: string;
        profile?: { full_name: string };
    };
}

const AdminCourseLessonsPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { addNotification } = useNotification();

    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Add lesson modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLesson, setNewLesson] = useState({
        title: '',
        content_type: 'video',
        content_url: '',
        duration: 10
    });

    useEffect(() => {
        if (courseId) {
            fetchCourseLessons();
        }
    }, [courseId]);

    const fetchCourseLessons = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/admin/courses/${courseId}/lessons`);
            const data = response.data?.data || response.data;
            setCourse(data.course || null);
            setLessons(data.lessons || []);
        } catch (error) {
            console.error('Failed to fetch course lessons:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddLesson = async () => {
        if (!courseId || !newLesson.title.trim()) return;
        console.log('[DEBUG] Creating lesson:', { courseId, newLesson, order_index: lessons.length });
        try {
            const response = await api.post(`/admin/courses/${courseId}/lessons`, {
                ...newLesson,
                order_index: lessons.length
            });
            console.log('[DEBUG] Create lesson response:', response.data);
            addNotification('Thành công', 'Đã thêm bài học mới!', 'success');
            setShowAddModal(false);
            setNewLesson({ title: '', content_type: 'video', content_url: '', duration: 10 });
            fetchCourseLessons();
        } catch (error: any) {
            console.error('[DEBUG] Failed to add lesson:', error);
            console.error('[DEBUG] Error response:', error.response?.data);
            addNotification('Lỗi', error.response?.data?.message || 'Không thể thêm bài học', 'error');
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Xóa bài học này?')) return;
        try {
            await api.delete(`/admin/courses/${courseId}/lessons/${lessonId}`);
            addNotification('Thành công', 'Đã xóa bài học', 'success');
            fetchCourseLessons();
        } catch (error) {
            console.error('Failed to delete lesson:', error);
            addNotification('Lỗi', 'Không thể xóa bài học', 'error');
        }
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={18} className="text-blue-500" />;
            case 'pdf': return <FileText size={18} className="text-red-500" />;
            case 'audio': return <Music size={18} className="text-purple-500" />;
            case 'link': return <LinkIcon size={18} className="text-cyan-500" />;
            case 'quiz': return <FileQuestion size={18} className="text-yellow-500" />;
            default: return <BookOpen size={18} className="text-gray-500" />;
        }
    };

    const getContentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'video': 'Video',
            'pdf': 'PDF',
            'audio': 'Audio',
            'link': 'Link',
            'text': 'Văn bản',
            'quiz': 'Quiz'
        };
        return labels[type] || type;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    const teacherName = course?.teacher?.full_name || 'Admin';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/courses')}
                        className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="text-blue-500" />
                            {course?.title || 'Chi tiết khóa học'}
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Giảng viên: {teacherName} • {lessons.length} bài học
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:opacity-90"
                >
                    <Plus size={18} /> Thêm bài học
                </button>
            </div>

            {/* Course Info Card */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} border ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
                <h3 className="font-bold mb-2">Mô tả khóa học</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {course?.description || 'Không có mô tả'}
                </p>
            </div>

            {/* Lessons List */}
            <div className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} border ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
                <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <h3 className="font-bold">Danh sách bài học ({lessons.length})</h3>
                </div>

                {lessons.length === 0 ? (
                    <div className="p-12 text-center">
                        <BookOpen size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                        <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Khóa học này chưa có bài học nào
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                        >
                            Thêm bài học đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-white/5">
                        {lessons.map((lesson, index) => (
                            <div
                                key={lesson.id}
                                className={`px-6 py-4 flex items-center justify-between ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        {index + 1}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {getContentIcon(lesson.content_type)}
                                        <span className="font-medium">{lesson.title}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        {getContentTypeLabel(lesson.content_type)}
                                    </span>
                                    {lesson.duration && (
                                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {lesson.duration} phút
                                        </span>
                                    )}
                                    {lesson.content_url && (
                                        <a
                                            href={lesson.content_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                            title="Xem nội dung"
                                        >
                                            <Eye size={16} />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        title="Xóa"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Lesson Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4`} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">➕ Thêm bài học mới</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-1 hover:opacity-70">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tiêu đề bài học</label>
                                <input
                                    type="text"
                                    value={newLesson.title}
                                    onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                    placeholder="Nhập tiêu đề..."
                                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'} border`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Loại nội dung</label>
                                <select
                                    value={newLesson.content_type}
                                    onChange={e => setNewLesson({ ...newLesson, content_type: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'} border`}
                                >
                                    <option value="video">Video</option>
                                    <option value="pdf">PDF</option>
                                    <option value="audio">Audio</option>
                                    <option value="link">Link</option>
                                    <option value="text">Văn bản</option>
                                    <option value="quiz">Quiz</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">URL nội dung (tùy chọn)</label>
                                <input
                                    type="text"
                                    value={newLesson.content_url}
                                    onChange={e => setNewLesson({ ...newLesson, content_url: e.target.value })}
                                    placeholder="https://..."
                                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'} border`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Thời lượng (phút)</label>
                                <input
                                    type="number"
                                    value={newLesson.duration}
                                    onChange={e => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) || 0 })}
                                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'} border`}
                                />
                            </div>

                            <button
                                onClick={handleAddLesson}
                                disabled={!newLesson.title.trim()}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50"
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

export default AdminCourseLessonsPage;

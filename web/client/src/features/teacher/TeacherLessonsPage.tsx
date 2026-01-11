import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Video,
    FileText,
    BookOpen,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Headphones,
    Link,
    MessageSquare
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';

interface Lesson {
    id: string;
    title: string;
    content_type: string;
    content_url: string;
    duration: number;
    order_index: number;
}

interface Module {
    id: string;
    title: string;
    order_index: number;
    lessons: Lesson[];
}

interface Course {
    id: string;
    title: string;
}

const TeacherLessonsPage = () => {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [modules, setModules] = useState<Module[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Modal states
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');

    // Form states
    const [moduleTitle, setModuleTitle] = useState('');
    const [lessonForm, setLessonForm] = useState({
        title: '',
        content_type: 'video',
        content_url: '',
        duration: 0
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchLessons();
        }
    }, [selectedCourse]);

    const fetchCourses = async () => {
        try {
            const response = await teacherService.getMyCourses({ limit: 100 });
            setCourses(response.courses || []);
            if (response.courses?.length > 0) {
                setSelectedCourse(response.courses[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLessons = async () => {
        try {
            const response = await teacherService.getCourseLessons(selectedCourse);
            setModules(response.modules || []);
            // Expand all by default
            setExpandedModules(new Set(response.modules?.map((m: Module) => m.id) || []));
        } catch (error) {
            console.error('Failed to fetch lessons:', error);
        }
    };

    const handleCreateModule = async () => {
        if (!moduleTitle.trim()) return;
        try {
            await teacherService.createModule({
                course_id: selectedCourse,
                title: moduleTitle,
                order_index: modules.length
            });
            setModuleTitle('');
            setShowModuleModal(false);
            fetchLessons();
        } catch (error) {
            console.error('Failed to create module:', error);
            alert('Lỗi khi tạo module');
        }
    };

    const handleCreateLesson = async () => {
        if (!lessonForm.title.trim() || !selectedModuleId) return;
        try {
            await teacherService.createLesson({
                module_id: selectedModuleId,
                title: lessonForm.title,
                content_type: lessonForm.content_type,
                content_url: lessonForm.content_url,
                duration: lessonForm.duration
            });
            resetLessonForm();
            setShowLessonModal(false);
            fetchLessons();
        } catch (error) {
            console.error('Failed to create lesson:', error);
            alert('Lỗi khi tạo bài học');
        }
    };

    const handleUpdateLesson = async () => {
        if (!editingLesson) return;
        try {
            await teacherService.updateLesson(editingLesson.id, lessonForm);
            resetLessonForm();
            setEditingLesson(null);
            setShowLessonModal(false);
            fetchLessons();
        } catch (error) {
            console.error('Failed to update lesson:', error);
            alert('Lỗi khi cập nhật bài học');
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Bạn có chắc muốn xóa bài học này?')) return;
        try {
            await teacherService.deleteLesson(lessonId);
            fetchLessons();
        } catch (error) {
            console.error('Failed to delete lesson:', error);
            alert('Lỗi khi xóa bài học');
        }
    };

    const resetLessonForm = () => {
        setLessonForm({ title: '', content_type: 'video', content_url: '', duration: 0 });
    };

    const openAddLessonModal = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        resetLessonForm();
        setEditingLesson(null);
        setShowLessonModal(true);
    };

    const openEditLessonModal = (lesson: Lesson, moduleId: string) => {
        setSelectedModuleId(moduleId);
        setEditingLesson(lesson);
        setLessonForm({
            title: lesson.title,
            content_type: lesson.content_type,
            content_url: lesson.content_url || '',
            duration: lesson.duration || 0
        });
        setShowLessonModal(true);
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={16} className="text-blue-500" />;
            case 'pdf': return <FileText size={16} className="text-red-500" />;
            case 'audio': return <Headphones size={16} className="text-orange-500" />;
            case 'link': return <Link size={16} className="text-green-500" />;
            case 'text': return <MessageSquare size={16} className="text-purple-500" />;
            case 'quiz': return <BookOpen size={16} className="text-yellow-500" />;
            default: return <FileText size={16} className="text-gray-500" />;
        }
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Quản lý bài học</h1>
                <div className="flex gap-3">
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className={`px-4 py-2 rounded-xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow outline-none min-w-[200px]`}
                    >
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowModuleModal(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium"
                    >
                        <Plus size={20} />
                        Thêm Module
                    </button>
                </div>
            </div>

            {/* Modules List */}
            {courses.length === 0 ? (
                <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Bạn chưa có khóa học nào. Hãy tạo khóa học trước.</p>
                    <button
                        onClick={() => navigate('/teacher/courses')}
                        className="mt-4 text-blue-500 hover:underline"
                    >
                        Đi đến Quản lý khóa học
                    </button>
                </div>
            ) : modules.length === 0 ? (
                <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Khóa học này chưa có module nào</p>
                    <button
                        onClick={() => setShowModuleModal(true)}
                        className="mt-4 text-blue-500 hover:underline"
                    >
                        Tạo module đầu tiên
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}
                        >
                            {/* Module Header */}
                            <div
                                className={`flex items-center justify-between p-4 cursor-pointer ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                onClick={() => toggleModule(module.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedModules.has(module.id) ? (
                                        <ChevronDown size={20} />
                                    ) : (
                                        <ChevronRight size={20} />
                                    )}
                                    <span className="font-bold">{module.title}</span>
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        ({module.lessons?.length || 0} bài)
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openAddLessonModal(module.id);
                                    }}
                                    className="flex items-center gap-1 text-sm bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg hover:bg-blue-500/20"
                                >
                                    <Plus size={16} />
                                    Thêm bài
                                </button>
                            </div>

                            {/* Lessons List */}
                            {expandedModules.has(module.id) && (
                                <div className={`border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                    {module.lessons?.length > 0 ? (
                                        module.lessons.map((lesson, index) => (
                                            <div
                                                key={lesson.id}
                                                className={`flex items-center justify-between p-4 pl-12 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${index !== module.lessons.length - 1 ? `border-b ${isDarkMode ? 'border-white/5' : 'border-gray-50'}` : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <GripVertical size={16} className="text-gray-400 cursor-grab" />
                                                    {getContentIcon(lesson.content_type)}
                                                    <span>{lesson.title}</span>
                                                    {lesson.duration > 0 && (
                                                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            ({lesson.duration} phút)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditLessonModal(lesson, module.id)}
                                                        className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={`p-4 pl-12 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Chưa có bài học nào trong module này
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Module Modal */}
            {showModuleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-md mx-4 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-2xl p-6`}>
                        <h2 className="text-xl font-bold mb-4">Tạo Module mới</h2>
                        <input
                            type="text"
                            value={moduleTitle}
                            onChange={(e) => setModuleTitle(e.target.value)}
                            placeholder="Tên module..."
                            className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-green-500`}
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowModuleModal(false); setModuleTitle(''); }}
                                className={`flex-1 py-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} font-medium`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateModule}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                            >
                                Tạo Module
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lesson Modal */}
            {showLessonModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-lg mx-4 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-2xl p-6`}>
                        <h2 className="text-xl font-bold mb-6">
                            {editingLesson ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên bài học *</label>
                                <input
                                    type="text"
                                    value={lessonForm.title}
                                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="Nhập tên bài học"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Loại nội dung</label>
                                    <select
                                        value={lessonForm.content_type}
                                        onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                    >
                                        <option value="video">Video (YouTube/Link)</option>
                                        <option value="pdf">PDF Document</option>
                                        <option value="audio">Audio (MP3)</option>
                                        <option value="link">External Link</option>
                                        <option value="text">Text Content</option>
                                        <option value="quiz">Quiz/Bài tập</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Thời lượng (phút)</label>
                                    <input
                                        type="number"
                                        value={lessonForm.duration}
                                        onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {lessonForm.content_type === 'video' && 'Link video (YouTube, Vimeo,...)'}
                                    {lessonForm.content_type === 'pdf' && 'Link PDF (từ R2 Storage)'}
                                    {lessonForm.content_type === 'audio' && 'Link Audio (MP3)'}
                                    {lessonForm.content_type === 'link' && 'External URL'}
                                    {lessonForm.content_type === 'text' && 'Nội dung (hoặc link)'}
                                    {lessonForm.content_type === 'quiz' && 'Link bài tập'}
                                </label>
                                <input
                                    type="text"
                                    value={lessonForm.content_url}
                                    onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                    placeholder={lessonForm.content_type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://...'}
                                />
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Tip: Upload file PDF/Audio lên R2 qua mục Settings rồi paste link vào đây
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowLessonModal(false); resetLessonForm(); setEditingLesson(null); }}
                                className={`flex-1 py-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} font-medium`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                                {editingLesson ? 'Cập nhật' : 'Tạo bài học'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherLessonsPage;

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    MessageSquare,
    Upload,
    X,
    Users,
    User,
    Mail,
    Calendar
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';
import api from '../../services/api';

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

interface Student {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    enrolled_at: string;
    progress_percent: number;
    status: string;
}

const TeacherLessonsPage = () => {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const { courseId: urlCourseId } = useParams<{ courseId: string }>();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [modules, setModules] = useState<Module[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'modules' | 'students'>('modules');

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
        duration: 0,
        description: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            // API returns {success, data: {courses}}, service unwraps to response.data
            const courseList = response.data?.courses || response.courses || [];
            setCourses(courseList);
            // Use courseId from URL if available, otherwise use first course
            if (urlCourseId && courseList.some((c: Course) => c.id === urlCourseId)) {
                setSelectedCourse(urlCourseId);
            } else if (courseList.length > 0) {
                setSelectedCourse(courseList[0].id);
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
            // API returns lessons directly as array or in data object
            const data = response.data || response;
            // Group lessons into modules (or create default module)
            const lessons = data.lessons || [];
            if (lessons.length > 0) {
                // Create a default module if none exist
                setModules([{
                    id: 'default',
                    title: data.course?.title || 'Bài học',
                    order_index: 0,
                    lessons: lessons
                }]);
                setExpandedModules(new Set(['default']));
            } else {
                setModules([]);
            }
            // Also fetch real modules from API
            fetchModules();
        } catch (error) {
            console.error('Failed to fetch lessons:', error);
            setModules([]);
        }
    };

    const fetchModules = async () => {
        try {
            const response = await api.get(`/teacher/courses/${selectedCourse}/modules`);
            if (response.data?.success && response.data.data?.length > 0) {
                setModules(response.data.data);
                // Expand first module by default
                setExpandedModules(new Set([response.data.data[0].id]));
            }
        } catch (error) {
            console.error('Failed to fetch modules:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get(`/teacher/courses/${selectedCourse}/students`);
            if (response.data?.success) {
                setStudents(response.data.data?.students || []);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
            setStudents([]);
        }
    };

    const handleCreateModule = async () => {
        if (!moduleTitle.trim()) return;
        try {
            await api.post('/teacher/modules', {
                course_id: selectedCourse,
                title: moduleTitle
            });
            setModuleTitle('');
            setShowModuleModal(false);
            fetchModules();
        } catch (error) {
            console.error('Failed to create module:', error);
            alert('Lỗi khi tạo module');
        }
    };

    const handleCreateLesson = async () => {
        if (!lessonForm.title.trim()) return;
        setIsUploading(true);
        try {
            // Use FormData for file upload
            if (selectedFile) {
                const formData = new FormData();
                formData.append('course_id', selectedCourse);
                formData.append('title', lessonForm.title);
                formData.append('description', lessonForm.description || '');
                formData.append('content_type', lessonForm.content_type);
                formData.append('duration_minutes', lessonForm.duration.toString());
                formData.append('order_index', (modules[0]?.lessons?.length || 0).toString());
                formData.append('file', selectedFile);

                await api.post('/teacher/lessons/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // No file - use regular API
                await teacherService.createLesson({
                    course_id: selectedCourse,
                    title: lessonForm.title,
                    content_type: lessonForm.content_type,
                    content_url: lessonForm.content_url,
                    duration_minutes: lessonForm.duration,
                    order_index: modules[0]?.lessons?.length || 0
                });
            }
            resetLessonForm();
            setShowLessonModal(false);
            fetchLessons();
        } catch (error) {
            console.error('Failed to create lesson:', error);
            alert('Lỗi khi tạo bài học');
        } finally {
            setIsUploading(false);
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
        setLessonForm({ title: '', content_type: 'video', content_url: '', duration: 0, description: '' });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Auto-detect content type
            const ext = file.name.split('.').pop()?.toLowerCase();
            let contentType = lessonForm.content_type;
            if (ext === 'pdf') contentType = 'pdf';
            else if (['mp3', 'wav', 'ogg'].includes(ext || '')) contentType = 'audio';
            else if (ext === 'mp4') contentType = 'video';

            setSelectedFile(file);
            setLessonForm(prev => ({ ...prev, content_type: contentType }));
        }
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
            duration: lesson.duration || 0,
            description: ''
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

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-white/10">
                <button
                    onClick={() => { setActiveTab('modules'); }}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'modules'
                        ? 'text-blue-500 border-b-2 border-blue-500'
                        : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <BookOpen size={16} className="inline mr-2" />
                    Modules & Bài học
                </button>
                <button
                    onClick={() => { setActiveTab('students'); fetchStudents(); }}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'students'
                        ? 'text-blue-500 border-b-2 border-blue-500'
                        : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={16} className="inline mr-2" />
                    Học viên ({students.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'students' ? (
                /* Students List */
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-500" />
                        Danh sách học viên ({students.length})
                    </h2>
                    {students.length === 0 ? (
                        <div className={`text-center py-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <User size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Chưa có học viên nào tham gia khóa học này</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {students.map((student) => (
                                <div key={student.id} className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {student.avatar_url ? (
                                                <img src={student.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                student.full_name?.charAt(0)?.toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{student.full_name || 'Học viên'}</p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <Mail size={12} className="inline mr-1" />
                                                {student.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-24 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                                                <div
                                                    className="h-full rounded-full bg-green-500"
                                                    style={{ width: `${student.progress_percent}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium">{student.progress_percent}%</span>
                                        </div>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <Calendar size={10} className="inline mr-1" />
                                            Tham gia: {new Date(student.enrolled_at).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Modules List */
                <>
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
                </>
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

                            {/* File Upload Section for PDF/Audio */}
                            {(lessonForm.content_type === 'pdf' || lessonForm.content_type === 'audio') && !editingLesson && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Upload file {lessonForm.content_type === 'pdf' ? 'PDF' : 'MP3/Audio'}
                                    </label>
                                    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept={lessonForm.content_type === 'pdf' ? '.pdf' : '.mp3,.wav,.ogg'}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="lesson-file-input"
                                        />
                                        {selectedFile ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-green-500">✓ {selectedFile.name}</span>
                                                <button
                                                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label htmlFor="lesson-file-input" className="cursor-pointer">
                                                <Upload className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={24} />
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Click để chọn file (max 50MB)
                                                </p>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* URL Input for video/link types */}
                            {(lessonForm.content_type === 'video' || lessonForm.content_type === 'link' || lessonForm.content_type === 'text' || lessonForm.content_type === 'quiz' || editingLesson) && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {lessonForm.content_type === 'video' && 'Link video (YouTube, Vimeo,...)'}
                                        {lessonForm.content_type === 'pdf' && 'Link PDF'}
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
                                </div>
                            )}
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

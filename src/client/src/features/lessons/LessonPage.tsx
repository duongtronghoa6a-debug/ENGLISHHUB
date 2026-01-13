import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonService } from '../../services/lesson.service';
import { ArrowLeft, PlayCircle, CheckCircle, Menu, Download, FileText, Headphones, ExternalLink, BookOpen } from 'lucide-react';
import { progressService } from '../../services/progress.service';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import CourseReviews from '../../components/reviews/CourseReviews';
import { enrollmentService } from '../../services/enrollment.service';
import { courseService } from '../../services/course.service';


interface Lesson {
    id: string | number;
    title: string;
    description?: string;
    content?: string;
    content_type?: string;
    content_url?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    durationMinutes?: number;
    duration_seconds?: number;
    progress?: number;
    is_free?: boolean;
}

const LessonPage = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const { isDarkMode } = useTheme();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchLessons = async () => {
            if (!courseId) return;
            try {
                const data = await lessonService.getLessonsByCourse(courseId);
                const lessonsList = data.data || [];
                setLessons(lessonsList);

                if (lessonId) {
                    const found = lessonsList.find((l: Lesson) => String(l.id) === String(lessonId));
                    setCurrentLesson(found || lessonsList[0]);
                } else if (lessonsList.length > 0) {
                    setCurrentLesson(lessonsList[0]);
                }

                // Fetch progress to mark completed lessons
                try {
                    const progressData = await progressService.getCourseProgress(courseId);
                    if (progressData?.data?.completedLessons) {
                        setCompletedLessons(new Set(progressData.data.completedLessons.map((id: any) => String(id))));
                    } else if (progressData?.completedLessons) {
                        setCompletedLessons(new Set(progressData.completedLessons.map((id: any) => String(id))));
                    }
                } catch (progressError) {
                    console.log('Could not fetch progress, user may not be enrolled');
                }
            } catch (error) {
                console.error("Failed to fetch lessons", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (courseId) {
            checkAndEnroll(courseId);
            fetchLessons();
        }
    }, [courseId, lessonId]);

    const checkAndEnroll = async (id: string) => {
        try {
            const status = await enrollmentService.checkEnrollment(id);
            if (!status.isEnrolled) {
                const courseData = await courseService.getCourseById(id);
                const course = courseData.data || courseData;

                // If free, auto enroll
                if (course && (Number(course.price) === 0 || course.is_free)) {
                    console.log('Auto enrolling in free course...');
                    await enrollmentService.enroll(id);
                    // Refresh progress logic if needed, or just let the user proceed
                    // Maybe fetch progress again?
                }
            }
        } catch (err) {
            console.error('Error checking enrollment:', err);
        }
    };


    const handleLessonSelect = (lesson: Lesson) => {
        setCurrentLesson(lesson);
        navigate(`/courses/${courseId}/learn/${lesson.id}`);
    };

    const handleCompleteLesson = async () => {
        if (!courseId || !currentLesson) return;
        try {
            await progressService.updateProgress(courseId, String(currentLesson.id));

            // Mark lesson as completed in local state
            setCompletedLessons(prev => new Set([...prev, String(currentLesson.id)]));

            addNotification('Thành công', 'Đã hoàn thành bài học!', 'success');

            const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
            if (currentIndex < lessons.length - 1) {
                handleLessonSelect(lessons[currentIndex + 1]);
            }
        } catch (error) {
            console.error("Failed to update progress", error);
            addNotification('Lỗi', 'Có lỗi xảy ra khi cập nhật tiến độ.', 'error');
        }
    };

    const handleDownload = () => {
        if (currentLesson?.content_url) {
            window.open(currentLesson.content_url, '_blank');
        }
    };

    const getContentIcon = (type?: string) => {
        switch (type) {
            case 'video': return <PlayCircle className="text-blue-500" size={24} />;
            case 'pdf': return <FileText className="text-red-500" size={24} />;
            case 'audio': return <Headphones className="text-orange-500" size={24} />;
            case 'link': return <ExternalLink className="text-green-500" size={24} />;
            case 'quiz': return <BookOpen className="text-purple-500" size={24} />;
            default: return <FileText className="text-gray-500" size={24} />;
        }
    };

    const getSidebarIcon = (type?: string) => {
        switch (type) {
            case 'video': return <PlayCircle className="text-blue-500" size={16} />;
            case 'pdf': return <FileText className="text-red-500" size={16} />;
            case 'audio': return <Headphones className="text-orange-500" size={16} />;
            case 'link': return <ExternalLink className="text-green-500" size={16} />;
            case 'quiz': return <BookOpen className="text-purple-500" size={16} />;
            default: return <FileText className="text-gray-500" size={16} />;
        }
    };

    // Render content based on type
    const renderMainContent = () => {
        if (!currentLesson) return null;

        const contentType = currentLesson.content_type || 'text';
        const contentUrl = currentLesson.content_url || currentLesson.videoUrl;

        switch (contentType) {
            case 'video':
                if (contentUrl?.includes('youtube') || contentUrl?.includes('youtu.be')) {
                    const videoId = contentUrl.includes('youtu.be')
                        ? contentUrl.split('/').pop()
                        : contentUrl.split('v=')[1]?.split('&')[0];
                    return (
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={currentLesson.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    );
                }
                return (
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                        <video
                            src={contentUrl}
                            controls
                            className="w-full h-full"
                        >
                            Your browser does not support video.
                        </video>
                    </div>
                );

            case 'pdf':
                return (
                    <div className="bg-white dark:bg-[#151e32] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-white/5">
                        {/* PDF Preview Frame */}
                        <div className="aspect-[4/5] mb-4 bg-gray-100 dark:bg-[#0d1526] rounded-xl overflow-hidden">
                            <iframe
                                src={`${contentUrl}#toolbar=1&navpanes=0`}
                                className="w-full h-full"
                                title={currentLesson.title}
                            />
                        </div>

                        {/* Download & Open buttons */}
                        <div className="flex gap-3 justify-center">
                            <a
                                href={contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                            >
                                <ExternalLink size={18} />
                                Mở PDF trong tab mới
                            </a>
                            <a
                                href={contentUrl}
                                download
                                className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-[#1a2438] text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-[#1e2a42] transition-all"
                            >
                                <Download size={18} />
                                Tải PDF
                            </a>
                        </div>
                    </div>
                );

            case 'audio':
                return (
                    <div className="bg-white dark:bg-[#151e32] rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-white/5">
                        <div className="flex flex-col items-center">
                            {/* Audio visualization placeholder */}
                            <div className="w-40 h-40 mb-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-xl">
                                <Headphones size={64} className="text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                                {currentLesson.title}
                            </h3>

                            {/* Audio player */}
                            <audio
                                src={contentUrl}
                                controls
                                className="w-full max-w-md"
                                style={{ height: '54px' }}
                            >
                                Your browser does not support audio.
                            </audio>

                            <a
                                href={contentUrl}
                                download
                                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-[#1a2438] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-[#1e2a42] transition-all"
                            >
                                <Download size={18} />
                                Tải audio
                            </a>
                        </div>
                    </div>
                );

            case 'link':
                return (
                    <div className="bg-white dark:bg-[#151e32] rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-white/5 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl">
                            <ExternalLink size={40} className="text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            {currentLesson.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Nội dung nằm ở trang bên ngoài
                        </p>

                        <a
                            href={contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            <ExternalLink size={20} />
                            Mở liên kết
                        </a>
                    </div>
                );

            case 'quiz':
                return (
                    <div className="bg-white dark:bg-[#151e32] rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-white/5 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-xl">
                            <BookOpen size={40} className="text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            {currentLesson.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Bài tập/Đề thi trắc nghiệm
                        </p>

                        {contentUrl ? (
                            <a
                                href={contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                <BookOpen size={20} />
                                Làm bài tập
                            </a>
                        ) : (
                            <p className="text-yellow-500">Quiz sẽ sớm được cập nhật</p>
                        )}
                    </div>
                );

            default:
                // Text/Document content
                return (
                    <div className="bg-white dark:bg-[#151e32] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-white/5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-full flex-shrink-0 mt-1"></div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                                {currentLesson.title}
                            </h2>
                        </div>

                        <div className="prose dark:prose-invert max-w-none mb-6">
                            {currentLesson.content ? (
                                <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                            ) : (
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Nội dung bài học sẽ được hiển thị ở đây.
                                </p>
                            )}
                        </div>

                        {contentUrl && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-[#1a2438] hover:bg-gray-200 dark:hover:bg-[#1e2a42] rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-all hover:shadow-md"
                                >
                                    <Download size={18} />
                                    <span>Download tài liệu</span>
                                </button>
                            </div>
                        )}
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-gray-300">Đang tải bài học...</span>
                </div>
            </div>
        );
    }

    if (!currentLesson) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120]">
                <p className="text-gray-600 dark:text-gray-300">Không tìm thấy bài học nào.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-[#0B1120] text-gray-800 dark:text-gray-100 overflow-hidden">
            {/* Left Sidebar - Lesson List */}
            <div className={`w-80 bg-white dark:bg-[#151e32] border-r border-gray-200 dark:border-white/10 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full z-20'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-cyan-500/10 to-transparent">
                    <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span>Trang chủ</span>
                    </button>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors md:hidden">
                        <Menu size={18} />
                    </button>
                </div>

                {/* Lesson Count */}
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
                    {lessons.length} bài học
                </div>

                {/* Lesson Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {lessons.map((lesson, idx) => {
                        const isActive = currentLesson?.id === lesson.id;
                        const isCompleted = completedLessons.has(String(lesson.id));

                        return (
                            <div
                                key={lesson.id}
                                onClick={() => handleLessonSelect(lesson)}
                                className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/50'
                                    : isCompleted
                                        ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800/50'
                                        : 'bg-gray-50 dark:bg-[#1a2438] hover:bg-gray-100 dark:hover:bg-[#1e2a42] border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted
                                        ? 'bg-green-500/20'
                                        : isActive
                                            ? 'bg-cyan-500/20'
                                            : 'bg-gray-200 dark:bg-[#0d1526]'
                                        }`}>
                                        {isCompleted ? (
                                            <CheckCircle size={20} className="text-green-500" />
                                        ) : (
                                            getSidebarIcon(lesson.content_type)
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-medium text-sm line-clamp-2 ${isCompleted
                                            ? 'text-green-600 dark:text-green-400'
                                            : isActive
                                                ? 'text-cyan-600 dark:text-cyan-400'
                                                : 'text-gray-800 dark:text-gray-100'
                                            }`}>
                                            {idx + 1}. {lesson.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                                            {lesson.content_type || 'document'}
                                            {isCompleted && <span className="ml-2 text-green-500 font-medium">✓ Đã học</span>}
                                            {!isCompleted && lesson.is_free && <span className="ml-2 text-green-500">• Miễn phí</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Side - Main Content */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Toggle Sidebar Button (Mobile) */}
                {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-10 p-2 bg-white dark:bg-[#151e32] rounded-full shadow-lg hover:shadow-xl transition-shadow">
                        <Menu size={20} />
                    </button>
                )}

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto p-4 md:p-8">
                        {/* Content Type Badge */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#151e32] rounded-full shadow-sm">
                                {getContentIcon(currentLesson.content_type)}
                                <span className="font-medium capitalize text-gray-700 dark:text-gray-200">
                                    {currentLesson.content_type || 'Tài liệu'}
                                </span>
                            </div>
                            {currentLesson.is_free && (
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                                    Miễn phí
                                </span>
                            )}
                        </div>

                        {/* Lesson Title */}
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
                            {currentLesson.title}
                        </h1>

                        {/* Main Content Area */}
                        {renderMainContent()}

                        {/* Complete Button */}
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={handleCompleteLesson}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all transform hover:scale-105"
                            >
                                <CheckCircle size={20} />
                                <span>Hoàn thành bài học</span>
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="mt-6 flex justify-between">
                            {lessons.findIndex(l => l.id === currentLesson.id) > 0 && (
                                <button
                                    onClick={() => handleLessonSelect(lessons[lessons.findIndex(l => l.id === currentLesson.id) - 1])}
                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-500 transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    Bài trước
                                </button>
                            )}
                            <div className="flex-1"></div>
                            {lessons.findIndex(l => l.id === currentLesson.id) < lessons.length - 1 && (
                                <button
                                    onClick={() => handleLessonSelect(lessons[lessons.findIndex(l => l.id === currentLesson.id) + 1])}
                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-500 transition-colors"
                                >
                                    Bài tiếp
                                    <ArrowLeft size={18} className="rotate-180" />
                                </button>
                            )}
                        </div>

                        {/* Course Reviews Section */}
                        {courseId && (
                            <div className="mt-8">
                                <CourseReviews courseId={courseId} isDarkMode={isDarkMode} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonPage;

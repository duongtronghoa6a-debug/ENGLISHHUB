import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Calendar, Trophy, Mail, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';

interface Student {
    id: string;
    email: string;
    full_name: string;
    avatar: string;
    enrolled_at: string;
    progress_percent: number;
    status: string;
    last_accessed: string;
}

interface CourseInfo {
    id: string;
    title: string;
    totalLessons: number;
}

const TeacherCourseStudentsPage = () => {
    const { isDarkMode } = useTheme();
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<CourseInfo | null>(null);
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        if (courseId) {
            fetchStudents();
        }
    }, [courseId]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await teacherService.getCourseStudents(courseId!);
            if (response.success) {
                setCourse(response.data.course);
                setStudents(response.data.students);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Chưa có';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 80) return 'bg-green-500';
        if (percent >= 50) return 'bg-yellow-500';
        if (percent >= 20) return 'bg-orange-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/teacher/courses')}
                    className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">{course?.title || 'Khóa học'}</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Danh sách học viên đã đăng ký
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-lg`}>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            <Users className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng học viên</p>
                            <p className="text-2xl font-bold">{students.length}</p>
                        </div>
                    </div>
                </div>
                <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-lg`}>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <Trophy className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hoàn thành</p>
                            <p className="text-2xl font-bold">
                                {students.filter(s => s.progress_percent === 100).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-lg`}>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <BookOpen className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng bài học</p>
                            <p className="text-2xl font-bold">{course?.totalLessons || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className={`rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-lg overflow-hidden`}>
                {students.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Chưa có học viên nào đăng ký khóa học này
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <tr>
                                    <th className="text-left px-6 py-4 font-semibold">Học viên</th>
                                    <th className="text-left px-6 py-4 font-semibold">Ngày đăng ký</th>
                                    <th className="text-left px-6 py-4 font-semibold">Tiến độ</th>
                                    <th className="text-left px-6 py-4 font-semibold">Truy cập lần cuối</th>
                                    <th className="text-left px-6 py-4 font-semibold">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr
                                        key={student.id}
                                        className={`border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=random`}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium">{student.full_name}</p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>{formatDate(student.enrolled_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-24 h-2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                                                    <div
                                                        className={`h-full rounded-full ${getProgressColor(student.progress_percent)}`}
                                                        style={{ width: `${student.progress_percent}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium">{student.progress_percent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {formatDate(student.last_accessed)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`/teacher/chat?userId=${student.id}`)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-colors text-sm"
                                            >
                                                <Mail className="w-4 h-4" />
                                                Nhắn tin
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherCourseStudentsPage;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService, type Exam } from '../../services/exam.service';
import Layout from '../../layouts/Layout';
import { Clock, FileText, Award, ChevronLeft, ChevronRight, Target, BookOpen, Headphones, PenTool, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface CompletedExam {
    id: string;
    examId: string;
    examTitle: string;
    examDescription?: string;
    score: number;
    passed: boolean;
    timeSpent: number;
    submittedAt: string;
}

const ExamListPage = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [completedExams, setCompletedExams] = useState<CompletedExam[]>([]);
    const [activeTab, setActiveTab] = useState<'exams' | 'completed'>('exams');
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { isAuthenticated } = useAuth();
    const [pagination, setPagination] = useState({ page: 1, limit: 9, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        loadExams();
    }, [pagination.page, searchQuery]);

    useEffect(() => {
        if (isAuthenticated && activeTab === 'completed') {
            loadCompletedExams();
        }
    }, [isAuthenticated, activeTab]);

    const loadExams = async () => {
        setLoading(true);
        try {
            const res = await examService.getPublishedExams({
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery || undefined
            });
            if (res.success && res.data) {
                const examList = res.data.rows || res.data || (Array.isArray(res.data) ? res.data : []);
                setExams(examList);
                if (res.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: res.pagination.total,
                        totalPages: res.pagination.totalPages || 1
                    }));
                } else {
                    const total = res.count || examList.length;
                    setPagination(prev => ({
                        ...prev,
                        total,
                        totalPages: Math.ceil(total / prev.limit) || 1
                    }));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on new search
    };

    const loadCompletedExams = async () => {
        setLoading(true);
        try {
            const res = await examService.getMySubmissions();
            if (res.success && res.data) {
                setCompletedExams(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Get grading method display
    const getGradingMethod = (method: string) => {
        switch (method) {
            case 'auto': return { text: 'Tự động', color: 'bg-green-500' };
            case 'manual': return { text: 'Giáo viên', color: 'bg-blue-500' };
            case 'hybrid': return { text: 'Kết hợp', color: 'bg-purple-500' };
            default: return { text: method, color: 'bg-gray-500' };
        }
    };

    // Infer exam type from title
    const getExamType = (title: string) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('ielts') || lowerTitle.includes('speaking') || lowerTitle.includes('writing')) {
            return { icon: PenTool, label: 'IELTS', color: 'from-purple-600 to-pink-600' };
        }
        if (lowerTitle.includes('toeic') || lowerTitle.includes('listening')) {
            return { icon: Headphones, label: 'TOEIC', color: 'from-cyan-600 to-blue-600' };
        }
        if (lowerTitle.includes('vocab')) {
            return { icon: BookOpen, label: 'Vocabulary', color: 'from-orange-500 to-yellow-500' };
        }
        if (lowerTitle.includes('grammar')) {
            return { icon: Target, label: 'Grammar', color: 'from-green-600 to-teal-600' };
        }
        if (lowerTitle.includes('placement')) {
            return { icon: Award, label: 'Placement', color: 'from-indigo-600 to-purple-600' };
        }
        return { icon: FileText, label: 'General', color: 'from-indigo-600 to-purple-600' };
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Hero Header */}
                <div className={`rounded-3xl p-8 mb-8 ${isDarkMode ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50' : 'bg-gradient-to-r from-indigo-100 to-purple-100'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/10' : 'bg-white shadow-lg'}`}>
                                <FileText size={32} className="text-indigo-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Bài Kiểm Tra</h1>
                                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Kiểm tra trình độ và luyện tập kỹ năng tiếng Anh • {pagination.total} đề thi
                                </p>
                            </div>
                        </div>
                        {/* Search Box */}
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Tìm bài kiểm tra..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                className={`px-4 py-2.5 rounded-xl min-w-[200px] transition-all ${isDarkMode
                                    ? 'bg-white/10 text-white placeholder-gray-400 border border-white/10 focus:border-indigo-500'
                                    : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 shadow'}`}
                            />
                            <button
                                type="submit"
                                className={`px-4 py-2.5 rounded-xl font-bold transition-all ${isDarkMode
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'}`}
                            >
                                Tìm
                            </button>
                        </form>
                    </div>
                </div>

                {/* Tab Buttons */}
                {isAuthenticated && (
                    <div className="flex gap-3 mb-8">
                        <button
                            onClick={() => setActiveTab('exams')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'exams'
                                ? isDarkMode
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : isDarkMode
                                    ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border'
                                }`}
                        >
                            <FileText size={18} />
                            Đề thi ({exams.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'completed'
                                ? isDarkMode
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                                : isDarkMode
                                    ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border'
                                }`}
                        >
                            <CheckCircle size={18} />
                            Đã làm ({completedExams.length})
                        </button>
                    </div>
                )}

                {/* Content based on active tab */}
                {activeTab === 'exams' ? (
                    <>
                        {/* Exam Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className={`h-64 rounded-2xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {exams.map((exam) => {
                                    const examType = getExamType(exam.title);
                                    const gradingMethod = getGradingMethod(exam.grading_method);
                                    const ExamIcon = examType.icon;
                                    const questionCount = exam.list_question_ids?.length || 0;

                                    return (
                                        <div
                                            key={exam.id}
                                            className={`group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isDarkMode ? 'bg-[#151e32] border border-white/5' : 'bg-white shadow-md'}`}
                                        >
                                            {/* Header with gradient */}
                                            <div className={`h-24 relative bg-gradient-to-br ${examType.color}`}>
                                                <div className="absolute inset-0 bg-black/10"></div>
                                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                                    <ExamIcon size={20} className="text-white/80" />
                                                    <span className="text-white/90 font-bold text-sm">{examType.label}</span>
                                                </div>
                                                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold text-white ${gradingMethod.color}`}>
                                                    {gradingMethod.text}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {exam.title}
                                                </h3>

                                                {exam.description && (
                                                    <p className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {exam.description}
                                                    </p>
                                                )}

                                                <div className={`flex items-center justify-between mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={16} />
                                                        <span>{exam.duration_minutes} phút</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <FileText size={16} />
                                                        <span>{questionCount} câu hỏi</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/test/${exam.id}/take`)}
                                                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isDarkMode
                                                        ? 'bg-white/10 hover:bg-white/20 text-white'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                                                        }`}
                                                >
                                                    <Award size={18} />
                                                    Làm bài ngay
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {exams.length === 0 && (
                                    <div className="col-span-full text-center py-20">
                                        <FileText size={64} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                                        <p className={`text-lg ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Chưa có bài kiểm tra nào.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center mt-12 gap-3">
                                <button
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold disabled:opacity-40 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white hover:bg-gray-50 shadow border'}`}
                                >
                                    <ChevronLeft size={18} /> Trước
                                </button>
                                <span className={`flex items-center px-6 rounded-xl font-bold ${isDarkMode ? 'bg-white/5 text-white' : 'bg-white shadow border'}`}>
                                    Trang {pagination.page} / {pagination.totalPages}
                                </span>
                                <button
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold disabled:opacity-40 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white hover:bg-gray-50 shadow border'}`}
                                >
                                    Sau <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Completed Exams Tab */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className={`h-40 rounded-2xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                            ))
                        ) : completedExams.length === 0 ? (
                            <div className="col-span-full text-center py-20">
                                <CheckCircle size={64} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                                <p className={`text-lg ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Bạn chưa hoàn thành bài kiểm tra nào.</p>
                            </div>
                        ) : (
                            completedExams.map((submission) => (
                                <div
                                    key={submission.id}
                                    className={`rounded-2xl p-5 transition-all hover:shadow-lg ${isDarkMode ? 'bg-[#151e32] border border-white/5' : 'bg-white shadow-md'}`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {submission.examTitle}
                                        </h3>
                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${submission.passed
                                            ? 'bg-green-500/20 text-green-500'
                                            : 'bg-red-500/20 text-red-500'
                                            }`}>
                                            {submission.passed ? 'Đạt' : 'Chưa đạt'}
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-4 mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <div className="flex items-center gap-1.5">
                                            <Award size={16} />
                                            <span className="font-bold">{submission.score}%</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={16} />
                                            <span>{Math.floor(submission.timeSpent / 60)}:{String(submission.timeSpent % 60).padStart(2, '0')}</span>
                                        </div>
                                    </div>

                                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Hoàn thành: {new Date(submission.submittedAt).toLocaleDateString('vi-VN')}
                                    </p>

                                    <button
                                        onClick={() => navigate(`/test/${submission.examId}/take`)}
                                        className={`w-full mt-4 py-2.5 rounded-xl font-bold transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                    >
                                        Làm lại
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ExamListPage;

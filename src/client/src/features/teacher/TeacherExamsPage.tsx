import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    FileText,
    Clock,
    CheckCircle,
    Eye,
    Upload,
    Headphones,
    PenTool,
    BookOpen,
    Send
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';
import { type Exam, type Question } from '../../services/exam.service';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

const TeacherExamsPage = () => {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const { addNotification } = useNotification();

    const [exams, setExams] = useState<Exam[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
    const [questionFile, setQuestionFile] = useState<File | null>(null);
    const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
    const questionFileRef = useRef<HTMLInputElement>(null);

    const [questionFormData, setQuestionFormData] = useState({
        skill: 'reading' as 'listening' | 'reading' | 'writing' | 'grammar' | 'vocabulary',
        type: 'multiple_choice' as 'multiple_choice' | 'fill_in_blank' | 'essay' | 'matching',
        level: 'B1' as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
        content_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: ''
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration_minutes: 60,
        grading_method: 'auto' as 'auto' | 'manual' | 'hybrid',
        status: 'draft' as 'draft' | 'published' | 'archived'
    });

    useEffect(() => {
        fetchExams();
        fetchQuestions();
    }, []);

    const fetchExams = async () => {
        setIsLoading(true);
        try {
            const response = await teacherService.getMyExams();
            if (response.success) {
                setExams(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch exams:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuestions = async () => {
        try {
            const response = await teacherService.getMyQuestions();
            if (response.success) {
                setQuestions(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            duration_minutes: 60,
            grading_method: 'auto',
            status: 'draft'
        });
        setSelectedQuestions([]);
        setEditingExam(null);
    };

    const resetQuestionForm = () => {
        setQuestionFormData({
            skill: 'reading',
            type: 'multiple_choice',
            level: 'B1',
            content_text: '',
            options: ['', '', '', ''],
            correct_answer: '',
            explanation: ''
        });
        setQuestionFile(null);
        if (questionFileRef.current) questionFileRef.current.value = '';
    };

    const handleCreateQuestion = async () => {
        if (!questionFormData.content_text.trim()) {
            addNotification('Lỗi', 'Vui lòng nhập nội dung câu hỏi', 'error');
            return;
        }
        setIsCreatingQuestion(true);
        try {
            const formData = new FormData();
            formData.append('skill', questionFormData.skill);
            formData.append('type', questionFormData.type);
            formData.append('level', questionFormData.level);
            formData.append('content_text', questionFormData.content_text);
            formData.append('correct_answer', questionFormData.correct_answer);
            formData.append('explanation', questionFormData.explanation || '');

            if (questionFormData.type === 'multiple_choice') {
                formData.append('options', JSON.stringify(questionFormData.options.filter(o => o.trim())));
            }

            if (questionFile) {
                formData.append('file', questionFile);
            }

            const response = await api.post('/teacher/questions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Auto-add new question to selectedQuestions
            const newQuestionId = response.data?.data?.id;
            if (newQuestionId) {
                setSelectedQuestions(prev => [...prev, newQuestionId]);
            }

            addNotification('Thành công', 'Đã tạo câu hỏi mới và thêm vào đề thi!', 'success');
            setShowCreateQuestionModal(false);
            resetQuestionForm();
            fetchQuestions();
        } catch (error: any) {
            console.error('Failed to create question:', error);
            addNotification('Lỗi', error.response?.data?.message || 'Lỗi khi tạo câu hỏi', 'error');
        } finally {
            setIsCreatingQuestion(false);
        }
    };

    const handleCreateOrUpdateExam = async () => {
        if (!formData.title.trim()) {
            addNotification('Lỗi', 'Vui lòng nhập tên đề thi', 'error');
            return;
        }

        try {
            const examData = {
                ...formData,
                list_question_ids: selectedQuestions
            };

            if (editingExam) {
                await teacherService.updateExam(editingExam.id, examData);
                addNotification('Thành công', 'Cập nhật đề thi thành công!', 'success');
            } else {
                await teacherService.createExam(examData);
                addNotification('Thành công', 'Tạo đề thi thành công!', 'success');
            }

            setShowCreateModal(false);
            resetForm();
            fetchExams();
        } catch (error) {
            console.error('Failed to save exam:', error);
            addNotification('Lỗi', 'Lỗi khi lưu đề thi', 'error');
        }
    };

    const handleEditExam = (exam: Exam) => {
        setEditingExam(exam);
        setFormData({
            title: exam.title,
            description: exam.description || '',
            duration_minutes: exam.duration_minutes,
            grading_method: exam.grading_method,
            status: exam.status
        });
        setSelectedQuestions(exam.list_question_ids || []);
        setShowCreateModal(true);
    };

    const handleDeleteExam = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa đề thi này?')) return;
        try {
            await teacherService.deleteExam(id);
            addNotification('Thành công', 'Đã xóa đề thi', 'success');
            fetchExams();
        } catch (error) {
            console.error('Failed to delete exam:', error);
            addNotification('Lỗi', 'Lỗi khi xóa đề thi', 'error');
        }
    };

    const toggleQuestion = (questionId: string) => {
        setSelectedQuestions(prev =>
            prev.includes(questionId)
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId]
        );
    };

    const handleSubmitExamForReview = async (examId: string) => {
        if (!confirm('Gửi đề thi này để admin duyệt?')) return;
        try {
            await api.put(`/teacher/exams/${examId}/submit-review`);
            addNotification('Thành công', 'Đã gửi đề thi để duyệt!', 'success');
            fetchExams();
        } catch (error: any) {
            console.error('Failed to submit exam:', error);
            addNotification('Lỗi', error.response?.data?.message || 'Lỗi khi gửi duyệt', 'error');
        }
    };

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string, approvalStatus?: string) => {
        // Use approval_status if available
        const effectiveStatus = approvalStatus || status;
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            'draft': { bg: 'bg-gray-500/20', text: 'text-gray-500', label: 'Nháp' },
            'pending_review': { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'Chờ duyệt' },
            'approved': { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Đã duyệt' },
            'published': { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Đã xuất bản' },
            'rejected': { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Bị từ chối' },
            'archived': { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Đã lưu trữ' }
        };
        const config = configs[effectiveStatus] || configs['draft'];
        return (
            <span className={`${config.bg} ${config.text} text-xs px-2 py-1 rounded-full`}>
                {config.label}
            </span>
        );
    };

    const getGradingBadge = (method: string) => {
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            'auto': { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'Tự động' },
            'manual': { bg: 'bg-orange-500/20', text: 'text-orange-500', label: 'Thủ công' },
            'hybrid': { bg: 'bg-purple-500/20', text: 'text-purple-500', label: 'Kết hợp' }
        };
        const config = configs[method] || configs['auto'];
        return (
            <span className={`${config.bg} ${config.text} text-xs px-2 py-1 rounded-full`}>
                {config.label}
            </span>
        );
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
                <h1 className="text-3xl font-bold">Quản lý đề thi</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateQuestionModal(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium"
                    >
                        <Plus size={20} />
                        Tạo câu hỏi
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium"
                    >
                        <Plus size={20} />
                        Tạo đề thi
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-4 rounded-xl shadow`}>
                    <div className="text-2xl font-bold">{exams.length}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng đề thi</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-4 rounded-xl shadow`}>
                    <div className="text-2xl font-bold text-green-500">
                        {exams.filter(e => e.status === 'published').length}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Đã xuất bản</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-4 rounded-xl shadow`}>
                    <div className="text-2xl font-bold text-gray-500">
                        {exams.filter(e => e.status === 'draft').length}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bản nháp</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-4 rounded-xl shadow`}>
                    <div className="text-2xl font-bold text-blue-500">{questions.length}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Câu hỏi</div>
                </div>
            </div>

            {/* Search */}
            <div className={`flex items-center px-4 py-2 rounded-xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow`}>
                <Search size={20} className="text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Tìm kiếm đề thi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                />
            </div>

            {/* Exams Table */}
            {filteredExams.length > 0 ? (
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
                    <table className="w-full">
                        <thead className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium">Tên đề</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Thời gian</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Câu hỏi</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Chấm điểm</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Trạng thái</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExams.map((exam, index) => (
                                <tr
                                    key={exam.id}
                                    className={`${index !== filteredExams.length - 1 ? `border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}` : ''} 
                                        ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{exam.title}</div>
                                        {exam.description && (
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                                                {exam.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {exam.duration_minutes} phút
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{exam.list_question_ids?.length || 0} câu</td>
                                    <td className="px-6 py-4">{getGradingBadge(exam.grading_method)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(exam.status, (exam as any).approval_status)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/test/${exam.id}/take`)}
                                                className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"
                                                title="Xem trước"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEditExam(exam)}
                                                className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            {((exam as any).approval_status === 'draft' || (!((exam as any).approval_status) && exam.status === 'draft')) && (
                                                <button
                                                    onClick={() => handleSubmitExamForReview(exam.id)}
                                                    className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20"
                                                    title="Gửi duyệt"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteExam(exam.id)}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Chưa có đề thi nào</p>
                    <p className="text-sm">Bắt đầu tạo đề thi đầu tiên của bạn</p>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-2xl mx-4 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto`}>
                        <h2 className="text-xl font-bold mb-6">
                            {editingExam ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên đề thi *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                    placeholder="Nhập tên đề thi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none h-20 resize-none`}
                                    placeholder="Mô tả đề thi"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Thời gian (phút)</label>
                                    <input
                                        type="number"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phương thức chấm</label>
                                    <select
                                        value={formData.grading_method}
                                        onChange={(e) => setFormData({ ...formData, grading_method: e.target.value as any })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                    >
                                        <option value="auto">Tự động</option>
                                        <option value="manual">Thủ công</option>
                                        <option value="hybrid">Kết hợp</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                >
                                    <option value="draft">Bản nháp</option>
                                    <option value="published">Xuất bản</option>
                                    <option value="archived">Lưu trữ</option>
                                </select>
                            </div>

                            {/* Question Selection */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium">Câu hỏi ({selectedQuestions.length} đã chọn)</label>
                                    <button
                                        onClick={() => setShowQuestionModal(true)}
                                        className="text-sm text-blue-500 hover:underline"
                                    >
                                        Chọn câu hỏi
                                    </button>
                                </div>
                                {selectedQuestions.length > 0 && (
                                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} max-h-32 overflow-y-auto`}>
                                        {selectedQuestions.map((qId, idx) => {
                                            const q = questions.find(q => q.id === qId);
                                            return (
                                                <div key={qId} className="text-sm flex justify-between items-center py-1">
                                                    <span>{idx + 1}. {q?.content_text?.substring(0, 50) || qId}...</span>
                                                    <button
                                                        onClick={() => toggleQuestion(qId)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className={`flex-1 py-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} font-medium`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateOrUpdateExam}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                                {editingExam ? 'Cập nhật' : 'Tạo đề thi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Selection Modal */}
            {showQuestionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-3xl mx-4 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col`}>
                        <h2 className="text-xl font-bold mb-4">Chọn câu hỏi ({selectedQuestions.length} đã chọn)</h2>

                        <div className="flex-1 overflow-y-auto">
                            {questions.length > 0 ? (
                                <div className="space-y-2">
                                    {questions.map((q) => (
                                        <div
                                            key={q.id}
                                            onClick={() => toggleQuestion(q.id)}
                                            className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedQuestions.includes(q.id)
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : isDarkMode ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${selectedQuestions.includes(q.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                                                    }`}>
                                                    {selectedQuestions.includes(q.id) && (
                                                        <CheckCircle size={14} className="text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium line-clamp-2">{q.content_text}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-500 rounded">{q.skill}</span>
                                                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded">{q.level}</span>
                                                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded">{q.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <p>Chưa có câu hỏi nào</p>
                                    <button
                                        onClick={() => setShowCreateQuestionModal(true)}
                                        className="mt-3 text-blue-500 hover:underline"
                                    >
                                        Tạo câu hỏi mới
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowCreateQuestionModal(true)}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Tạo câu hỏi mới
                            </button>
                            <button
                                onClick={() => setShowQuestionModal(false)}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                                Xong ({selectedQuestions.length} câu)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Question Modal */}
            {showCreateQuestionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-2xl mx-4 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto`}>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-blue-500" />
                            Tạo câu hỏi mới
                        </h2>

                        <div className="space-y-4">
                            {/* Skill Selection */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'listening', icon: Headphones, label: 'Nghe' },
                                    { value: 'reading', icon: BookOpen, label: 'Đọc' },
                                    { value: 'writing', icon: PenTool, label: 'Viết' }
                                ].map(skill => (
                                    <button
                                        key={skill.value}
                                        onClick={() => setQuestionFormData({ ...questionFormData, skill: skill.value as any })}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${questionFormData.skill === skill.value
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : isDarkMode ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <skill.icon size={24} className={questionFormData.skill === skill.value ? 'text-blue-500' : ''} />
                                        <span className="text-sm font-medium">{skill.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Question Type & Level */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Loại câu hỏi</label>
                                    <select
                                        value={questionFormData.type}
                                        onChange={(e) => setQuestionFormData({ ...questionFormData, type: e.target.value as any })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                    >
                                        <option value="multiple_choice">Trắc nghiệm</option>
                                        <option value="fill_in_blank">Điền khuyết</option>
                                        <option value="essay">Tự luận</option>
                                        <option value="matching">Nối</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cấp độ</label>
                                    <select
                                        value={questionFormData.level}
                                        onChange={(e) => setQuestionFormData({ ...questionFormData, level: e.target.value as any })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                    >
                                        <option value="A1">A1</option>
                                        <option value="A2">A2</option>
                                        <option value="B1">B1</option>
                                        <option value="B2">B2</option>
                                        <option value="C1">C1</option>
                                        <option value="C2">C2</option>
                                    </select>
                                </div>
                            </div>

                            {/* File Upload for Listening/Reading */}
                            {(questionFormData.skill === 'listening' || questionFormData.skill === 'reading') && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {questionFormData.skill === 'listening' ? 'Tải lên file Audio (MP3)' : 'Tải lên file PDF/Hình ảnh'}
                                    </label>
                                    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                                        <input
                                            ref={questionFileRef}
                                            type="file"
                                            accept={questionFormData.skill === 'listening' ? '.mp3,.wav,.ogg' : '.pdf,.png,.jpg,.jpeg'}
                                            onChange={(e) => setQuestionFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="question-file-input"
                                        />
                                        {questionFile ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-green-500">✓ {questionFile.name}</span>
                                                <button onClick={() => { setQuestionFile(null); if (questionFileRef.current) questionFileRef.current.value = ''; }} className="text-red-500">×</button>
                                            </div>
                                        ) : (
                                            <label htmlFor="question-file-input" className="cursor-pointer">
                                                <Upload className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={24} />
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Click để chọn file (max 30MB)</p>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Question Content */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung câu hỏi *</label>
                                <textarea
                                    value={questionFormData.content_text}
                                    onChange={(e) => setQuestionFormData({ ...questionFormData, content_text: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none h-24 resize-none`}
                                    placeholder="Nhập nội dung câu hỏi..."
                                />
                            </div>

                            {/* Multiple Choice Options */}
                            {questionFormData.type === 'multiple_choice' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Các đáp án</label>
                                    <div className="space-y-2">
                                        {questionFormData.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${questionFormData.correct_answer === String.fromCharCode(65 + idx) ? 'bg-green-500 text-white' : isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...questionFormData.options];
                                                        newOpts[idx] = e.target.value;
                                                        setQuestionFormData({ ...questionFormData, options: newOpts });
                                                    }}
                                                    className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                                                />
                                                <button
                                                    onClick={() => setQuestionFormData({ ...questionFormData, correct_answer: String.fromCharCode(65 + idx) })}
                                                    className={`px-2 py-1 text-xs rounded ${questionFormData.correct_answer === String.fromCharCode(65 + idx) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                                >
                                                    Đáp án đúng
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Correct Answer for other types */}
                            {questionFormData.type !== 'multiple_choice' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Đáp án đúng / Gợi ý</label>
                                    <input
                                        type="text"
                                        value={questionFormData.correct_answer}
                                        onChange={(e) => setQuestionFormData({ ...questionFormData, correct_answer: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none`}
                                        placeholder="Nhập đáp án đúng hoặc gợi ý chấm điểm"
                                    />
                                </div>
                            )}

                            {/* Explanation */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Giải thích (tùy chọn)</label>
                                <textarea
                                    value={questionFormData.explanation}
                                    onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none h-16 resize-none`}
                                    placeholder="Giải thích đáp án..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowCreateQuestionModal(false); resetQuestionForm(); }}
                                className={`flex-1 py-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} font-medium`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateQuestion}
                                disabled={isCreatingQuestion}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                {isCreatingQuestion ? 'Đang tạo...' : 'Tạo câu hỏi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherExamsPage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    FileText,
    Clock,
    CheckCircle,
    Eye
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';
import { type Exam, type Question } from '../../services/exam.service';
import { useNotification } from '../../context/NotificationContext';

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

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            'draft': { bg: 'bg-gray-500/20', text: 'text-gray-500', label: 'Nháp' },
            'published': { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Đã xuất bản' },
            'archived': { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Đã lưu trữ' }
        };
        const config = configs[status] || configs['draft'];
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
                <button
                    onClick={() => { resetForm(); setShowCreateModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium"
                >
                    <Plus size={20} />
                    Tạo đề thi
                </button>
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
                                    <td className="px-6 py-4">{getStatusBadge(exam.status)}</td>
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
                                    Chưa có câu hỏi nào
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
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
        </div>
    );
};

export default TeacherExamsPage;

import { useState, useEffect, useRef } from 'react';
import { type Exam } from '../../services/exam.service';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import './AdminExamsPage.css';
import {
    Headphones,
    BookOpen,
    PenTool,
    Upload,
    Plus
} from 'lucide-react';

interface Question {
    id: string;
    skill: string;
    type: string;
    level: string;
    content_text: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    content_url?: string;
}

export default function AdminExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newExam, setNewExam] = useState({ title: '', description: '', duration_minutes: 60, grading_method: 'auto' as 'auto' | 'manual' | 'hybrid' });

    // Question selection for new exam
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [showQuestionSelectionModal, setShowQuestionSelectionModal] = useState(false);

    // View and Edit modal states
    const [viewingExam, setViewingExam] = useState<Exam | null>(null);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', duration_minutes: 60, status: 'draft' });

    // Question management states
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
    const [examQuestions, setExamQuestions] = useState<Question[]>([]);
    const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
    const [questionFile, setQuestionFile] = useState<File | null>(null);
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

    const [filters, setFilters] = useState({
        status: '',
        search: ''
    });

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 1
    });

    useEffect(() => {
        fetchExams();
        fetchAllQuestions();
    }, []);

    const fetchAllQuestions = async () => {
        try {
            const response = await api.get('/questions');
            setAllQuestions(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching all questions:', error);
        }
    };

    const handleCreateExam = async () => {
        try {
            await api.post('/admin/exams', {
                ...newExam,
                list_question_ids: selectedQuestions
            });
            addNotification('Thành công', 'Đã tạo bài kiểm tra mới', 'success');
            setShowCreateModal(false);
            setNewExam({ title: '', description: '', duration_minutes: 60, grading_method: 'auto' });
            setSelectedQuestions([]);
            fetchExams();
        } catch (error) {
            addNotification('Lỗi', 'Không thể tạo bài kiểm tra', 'error');
        }
    };

    const toggleQuestionSelection = (questionId: string) => {
        setSelectedQuestions(prev =>
            prev.includes(questionId)
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId]
        );
    };

    const fetchExams = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('limit', String(pagination.limit));
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/admin/exams?${params.toString()}`);
            setExams(response.data?.data || []);
            if (response.data?.pagination) {
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
            addNotification('Lỗi', 'Không thể tải danh sách bài kiểm tra', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (examId: string, newStatus: 'draft' | 'published' | 'archived') => {
        try {
            await api.put(`/admin/exams/${examId}`, { status: newStatus });
            addNotification('Thành công', `Đã cập nhật trạng thái bài kiểm tra`, 'success');
            fetchExams();
        } catch (error) {
            console.error('Error updating exam status:', error);
            addNotification('Lỗi', 'Không thể cập nhật trạng thái', 'error');
        }
    };

    const handleDelete = async (examId: string) => {
        if (!confirm('Bạn có chắc muốn xóa bài kiểm tra này?')) return;

        try {
            await api.delete(`/admin/exams/${examId}`);
            addNotification('Thành công', 'Đã xóa bài kiểm tra', 'success');
            fetchExams();
        } catch (error) {
            console.error('Error deleting exam:', error);
            addNotification('Lỗi', 'Không thể xóa bài kiểm tra', 'error');
        }
    };

    const openViewModal = (exam: Exam) => {
        setViewingExam(exam);
    };

    const openEditModal = (exam: Exam) => {
        setEditForm({
            title: exam.title,
            description: exam.description || '',
            duration_minutes: exam.duration_minutes,
            status: exam.status
        });
        setEditingExam(exam);
    };

    const handleEditExam = async () => {
        if (!editingExam) return;
        try {
            await api.put(`/admin/exams/${editingExam.id}`, editForm);
            addNotification('Thành công', 'Đã cập nhật bài kiểm tra', 'success');
            setEditingExam(null);
            fetchExams();
        } catch (error) {
            console.error('Error updating exam:', error);
            addNotification('Lỗi', 'Không thể cập nhật bài kiểm tra', 'error');
        }
    };

    // Question management functions
    const openQuestionModal = (exam: Exam) => {
        setViewingExam(exam);
        setExamQuestions([]);
        fetchExamQuestions(exam.id);
        setShowQuestionModal(true);
    };

    const fetchExamQuestions = async (examId: string) => {
        try {
            const response = await api.get(`/admin/exams/${examId}/questions`);
            setExamQuestions(response.data.data || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
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
            // If we're managing an existing exam's questions - use FormData for file upload
            if (viewingExam && showQuestionModal) {
                const formData = new FormData();
                formData.append('skill', questionFormData.skill);
                formData.append('type', questionFormData.type);
                formData.append('level', questionFormData.level);
                formData.append('content_text', questionFormData.content_text);
                formData.append('correct_answer', questionFormData.correct_answer);
                formData.append('explanation', questionFormData.explanation || '');

                if (questionFormData.type === 'multiple_choice') {
                    formData.append('options', JSON.stringify(questionFormData.options.filter((o: string) => o.trim())));
                }

                if (questionFile) {
                    formData.append('file', questionFile);
                }

                await api.post(`/admin/exams/${viewingExam.id}/questions`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                addNotification('Thành công', 'Đã tạo câu hỏi mới!', 'success');
                setShowCreateQuestionModal(false);
                resetQuestionForm();
                fetchExamQuestions(viewingExam.id);
                fetchExams();
            } else {
                // Creating standalone question (for new exam creation) - use FormData too
                const formData = new FormData();
                formData.append('skill', questionFormData.skill);
                formData.append('type', questionFormData.type);
                formData.append('level', questionFormData.level);
                formData.append('content_text', questionFormData.content_text);
                formData.append('correct_answer', questionFormData.correct_answer);
                formData.append('explanation', questionFormData.explanation || '');

                if (questionFormData.type === 'multiple_choice') {
                    formData.append('options', JSON.stringify(questionFormData.options.filter((o: string) => o.trim())));
                }

                if (questionFile) {
                    formData.append('media', questionFile);
                }

                const response = await api.post('/questions', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const newQuestionId = response.data?.data?.id;

                if (newQuestionId) {
                    setSelectedQuestions(prev => [...prev, newQuestionId]);
                    setAllQuestions(prev => [response.data.data, ...prev]);
                }

                addNotification('Thành công', 'Đã tạo câu hỏi mới và thêm vào đề thi!', 'success');
                setShowCreateQuestionModal(false);
                resetQuestionForm();
            }
        } catch (error: any) {
            console.error('Failed to create question:', error);
            addNotification('Lỗi', error.response?.data?.message || 'Lỗi khi tạo câu hỏi', 'error');
        } finally {
            setIsCreatingQuestion(false);
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!viewingExam || !confirm('Xóa câu hỏi này?')) return;
        try {
            await api.delete(`/admin/exams/${viewingExam.id}/questions/${questionId}`);
            addNotification('Thành công', 'Đã xóa câu hỏi', 'success');
            fetchExamQuestions(viewingExam.id);
            fetchExams();
        } catch (error) {
            console.error('Error deleting question:', error);
            addNotification('Lỗi', 'Không thể xóa câu hỏi', 'error');
        }
    };

    const filteredExams = exams.filter(exam => {
        if (filters.status && exam.status !== filters.status) return false;
        if (filters.search && !exam.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            draft: { label: 'Nháp', class: 'badge-draft' },
            published: { label: 'Đã xuất bản', class: 'badge-published' },
            archived: { label: 'Đã lưu trữ', class: 'badge-archived' }
        };
        const config = statusMap[status] || { label: status, class: '' };
        return <span className={`status-badge ${config.class}`}>{config.label}</span>;
    };

    if (loading) {
        return (
            <div className="admin-exams-page">
                <div className="loading-spinner">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="admin-exams-page">
            <div className="page-header">
                <h1>Quản lý Bài kiểm tra</h1>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Tạo bài kiểm tra mới
                </button>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài kiểm tra..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="draft">Nháp</option>
                    <option value="published">Đã xuất bản</option>
                    <option value="archived">Đã lưu trữ</option>
                </select>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-number">{exams.length}</span>
                    <span className="stat-label">Tổng số</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{exams.filter(e => e.status === 'published').length}</span>
                    <span className="stat-label">Đã xuất bản</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{exams.filter(e => e.status === 'draft').length}</span>
                    <span className="stat-label">Nháp</span>
                </div>
            </div>

            <div className="exams-table">
                <table>
                    <thead>
                        <tr>
                            <th>Tên bài kiểm tra</th>
                            <th>Số câu hỏi</th>
                            <th>Thời gian (phút)</th>
                            <th>Trạng thái</th>
                            <th>Phương thức chấm</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExams.map(exam => (
                            <tr key={exam.id}>
                                <td>
                                    <div className="exam-title">{exam.title}</div>
                                    <div className="exam-description">{exam.description?.substring(0, 50)}...</div>
                                </td>
                                <td>{exam.list_question_ids?.length || 0}</td>
                                <td>{exam.duration_minutes}</td>
                                <td>{getStatusBadge(exam.status)}</td>
                                <td>
                                    {exam.grading_method === 'auto' ? 'Tự động' :
                                        exam.grading_method === 'manual' ? 'Thủ công' : 'Kết hợp'}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-icon btn-view"
                                            onClick={() => openViewModal(exam)}
                                            title="Xem"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            className="btn-icon btn-edit"
                                            onClick={() => openEditModal(exam)}
                                            title="Sửa"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => openQuestionModal(exam)}
                                            title="Quản lý câu hỏi"
                                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                        >
                                            📝
                                        </button>
                                        {exam.status === 'draft' && (
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleStatusChange(exam.id, 'published')}
                                                title="Duyệt exam"
                                                style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
                                            >
                                                ✅
                                            </button>
                                        )}
                                        {exam.status === 'published' && (
                                            <button
                                                className="btn-icon btn-archive"
                                                onClick={() => handleStatusChange(exam.id, 'archived')}
                                                title="Lưu trữ"
                                            >
                                                📦
                                            </button>
                                        )}
                                        {exam.status === 'archived' && (
                                            <button
                                                className="btn-icon btn-publish"
                                                onClick={() => handleStatusChange(exam.id, 'published')}
                                                title="Xuất bản lại"
                                            >
                                                🔄
                                            </button>
                                        )}
                                        <button
                                            className="btn-icon btn-delete"
                                            onClick={() => handleDelete(exam.id)}
                                            title="Xóa"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredExams.length === 0 && (
                    <div className="empty-state">
                        <p>Không có bài kiểm tra nào</p>
                    </div>
                )}
            </div>

            {/* Create Exam Modal */}
            {showCreateModal && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Tạo bài kiểm tra mới</h2>
                        <input
                            type="text"
                            placeholder="Tên bài kiểm tra *"
                            value={newExam.title}
                            onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', marginBottom: '0.75rem', color: 'white' }}
                        />
                        <textarea
                            placeholder="Mô tả"
                            value={newExam.description}
                            onChange={e => setNewExam({ ...newExam, description: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', marginBottom: '0.75rem', color: 'white', resize: 'none' }}
                            rows={2}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#9ca3af' }}>Thời gian (phút)</label>
                                <input
                                    type="number"
                                    value={newExam.duration_minutes}
                                    onChange={e => setNewExam({ ...newExam, duration_minutes: Number(e.target.value) })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#9ca3af' }}>Phương thức chấm</label>
                                <select
                                    value={newExam.grading_method}
                                    onChange={e => setNewExam({ ...newExam, grading_method: e.target.value as any })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
                                >
                                    <option value="auto">Tự động</option>
                                    <option value="manual">Thủ công</option>
                                    <option value="hybrid">Kết hợp</option>
                                </select>
                            </div>
                        </div>

                        {/* Question Selection */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Câu hỏi ({selectedQuestions.length} đã chọn)</label>
                                <button
                                    onClick={() => setShowQuestionSelectionModal(true)}
                                    style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', background: '#22c55e', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                                >
                                    Chọn câu hỏi
                                </button>
                            </div>
                            {selectedQuestions.length > 0 && (
                                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', maxHeight: '120px', overflow: 'auto' }}>
                                    {selectedQuestions.map((qId, idx) => {
                                        const q = allQuestions.find(q => q.id === qId);
                                        return (
                                            <div key={qId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', padding: '0.25rem 0' }}>
                                                <span>{idx + 1}. {q?.content_text?.substring(0, 40) || qId}...</span>
                                                <button
                                                    onClick={() => toggleQuestionSelection(qId)}
                                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                >×</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => { setShowCreateModal(false); setSelectedQuestions([]); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'gray', color: 'white', border: 'none', cursor: 'pointer' }}>Hủy</button>
                            <button onClick={handleCreateExam} disabled={!newExam.title} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>Tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Selection Modal for Create Exam */}
            {showQuestionSelectionModal && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '700px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Chọn câu hỏi ({selectedQuestions.length} đã chọn)</h2>

                        <div style={{ flex: 1, overflow: 'auto', marginBottom: '1rem' }}>
                            {allQuestions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {allQuestions.map((q) => (
                                        <div
                                            key={q.id}
                                            onClick={() => toggleQuestionSelection(q.id)}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                border: selectedQuestions.includes(q.id) ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.1)',
                                                background: selectedQuestions.includes(q.id) ? 'rgba(59,130,246,0.1)' : 'transparent'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '1.25rem',
                                                    height: '1.25rem',
                                                    borderRadius: '0.25rem',
                                                    border: '2px solid',
                                                    borderColor: selectedQuestions.includes(q.id) ? '#3b82f6' : '#6b7280',
                                                    background: selectedQuestions.includes(q.id) ? '#3b82f6' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    marginTop: '0.1rem'
                                                }}>
                                                    {selectedQuestions.includes(q.id) && <span style={{ color: 'white', fontSize: '0.75rem' }}>✓</span>}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ marginBottom: '0.25rem' }}>{q.content_text}</div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'rgba(168,85,247,0.2)', color: '#a855f7', borderRadius: '0.25rem' }}>{q.skill}</span>
                                                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: '0.25rem' }}>{q.level}</span>
                                                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'rgba(34,197,94,0.2)', color: '#22c55e', borderRadius: '0.25rem' }}>{q.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                                    <p>Chưa có câu hỏi nào</p>
                                    <button
                                        onClick={() => setShowCreateQuestionModal(true)}
                                        style={{ marginTop: '0.5rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Tạo câu hỏi mới
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setShowCreateQuestionModal(true)}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#22c55e', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <Plus size={18} />
                                Tạo câu hỏi mới
                            </button>
                            <button
                                onClick={() => setShowQuestionSelectionModal(false)}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Xong ({selectedQuestions.length} câu)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Exam Modal */}
            {viewingExam && (
                <div className="modal-overlay" onClick={() => setViewingExam(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>👁️ Chi tiết bài kiểm tra</h2>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Tên:</strong> {viewingExam.title}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Mô tả:</strong> {viewingExam.description || 'Không có mô tả'}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Thời gian:</strong> {viewingExam.duration_minutes} phút
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Số câu hỏi:</strong> {viewingExam.list_question_ids?.length || 0}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Trạng thái:</strong> {viewingExam.status === 'draft' ? 'Nháp' : viewingExam.status === 'published' ? 'Đã xuất bản' : 'Đã lưu trữ'}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Phương thức chấm:</strong> {viewingExam.grading_method === 'auto' ? 'Tự động' : viewingExam.grading_method === 'manual' ? 'Thủ công' : 'Kết hợp'}
                        </div>
                        <button onClick={() => setViewingExam(null)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>Đóng</button>
                    </div>
                </div>
            )}

            {/* Edit Exam Modal */}
            {editingExam && (
                <div className="modal-overlay" onClick={() => setEditingExam(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>✏️ Sửa bài kiểm tra</h2>
                        <input
                            type="text"
                            placeholder="Tên bài kiểm tra *"
                            value={editForm.title}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', marginBottom: '0.75rem', color: 'white' }}
                        />
                        <textarea
                            placeholder="Mô tả"
                            value={editForm.description}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', marginBottom: '0.75rem', color: 'white', resize: 'none' }}
                            rows={3}
                        />
                        <input
                            type="number"
                            placeholder="Thời gian (phút)"
                            value={editForm.duration_minutes}
                            onChange={e => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', marginBottom: '0.75rem', color: 'white' }}
                        />
                        <select
                            value={editForm.status}
                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', marginBottom: '1rem', color: 'white' }}
                        >
                            <option value="draft">Nháp</option>
                            <option value="published">Đã xuất bản</option>
                            <option value="archived">Đã lưu trữ</option>
                        </select>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setEditingExam(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'gray', color: 'white', border: 'none', cursor: 'pointer' }}>Hủy</button>
                            <button onClick={handleEditExam} disabled={!editForm.title} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Management Modal */}
            {showQuestionModal && viewingExam && (
                <div className="modal-overlay" onClick={() => { setShowQuestionModal(false); setViewingExam(null); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1rem' }}>📝 Quản lý câu hỏi - {viewingExam.title}</h2>

                        {/* Button to open Create Question Modal */}
                        <button
                            onClick={() => setShowCreateQuestionModal(true)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: '#22c55e',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={18} />
                            Tạo câu hỏi mới
                        </button>

                        {/* Existing Questions */}
                        <div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Danh sách câu hỏi ({examQuestions.length})</h3>
                            {examQuestions.length === 0 ? (
                                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Chưa có câu hỏi nào</p>
                            ) : (
                                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                                    {examQuestions.map((q, idx) => (
                                        <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                                            <div>
                                                <span style={{ color: '#60a5fa', marginRight: '0.5rem' }}>#{idx + 1}</span>
                                                <span>{q.content_text.substring(0, 60)}...</span>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'rgba(168,85,247,0.2)', color: '#a855f7', borderRadius: '0.25rem' }}>{q.skill}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: '0.25rem' }}>{q.level}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'rgba(34,197,94,0.2)', color: '#22c55e', borderRadius: '0.25rem' }}>{q.type}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteQuestion(q.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>🗑️</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={() => { setShowQuestionModal(false); setViewingExam(null); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', marginTop: '1rem' }}>Đóng</button>
                    </div>
                </div>
            )}

            {/* Create Question Modal - Similar to Teacher */}
            {showCreateQuestionModal && (
                <div className="modal-overlay" onClick={() => { setShowCreateQuestionModal(false); resetQuestionForm(); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={20} style={{ color: '#3b82f6' }} />
                            Tạo câu hỏi mới
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Skill Selection with Icons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                                {[
                                    { value: 'listening', icon: Headphones, label: 'Nghe' },
                                    { value: 'reading', icon: BookOpen, label: 'Đọc' },
                                    { value: 'writing', icon: PenTool, label: 'Viết' }
                                ].map(skill => (
                                    <button
                                        key={skill.value}
                                        onClick={() => setQuestionFormData({ ...questionFormData, skill: skill.value as any })}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: questionFormData.skill === skill.value ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.1)',
                                            background: questionFormData.skill === skill.value ? 'rgba(59,130,246,0.1)' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: questionFormData.skill === skill.value ? '#3b82f6' : 'inherit'
                                        }}
                                    >
                                        <skill.icon size={24} />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{skill.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Question Type & Level */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Loại câu hỏi</label>
                                    <select
                                        value={questionFormData.type}
                                        onChange={e => setQuestionFormData({ ...questionFormData, type: e.target.value as any })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
                                    >
                                        <option value="multiple_choice">Trắc nghiệm</option>
                                        <option value="fill_in_blank">Điền khuyết</option>
                                        <option value="essay">Tự luận</option>
                                        <option value="matching">Nối</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cấp độ</label>
                                    <select
                                        value={questionFormData.level}
                                        onChange={e => setQuestionFormData({ ...questionFormData, level: e.target.value as any })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
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
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                                        {questionFormData.skill === 'listening' ? 'Tải lên file Audio (MP3)' : 'Tải lên file PDF/Hình ảnh'}
                                    </label>
                                    <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
                                        <input
                                            ref={questionFileRef}
                                            type="file"
                                            accept={questionFormData.skill === 'listening' ? '.mp3,.wav,.ogg' : '.pdf,.png,.jpg,.jpeg'}
                                            onChange={e => setQuestionFile(e.target.files?.[0] || null)}
                                            style={{ display: 'none' }}
                                            id="admin-question-file-input"
                                        />
                                        {questionFile ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                <span style={{ color: '#22c55e' }}>✓ {questionFile.name}</span>
                                                <button
                                                    onClick={() => { setQuestionFile(null); if (questionFileRef.current) questionFileRef.current.value = ''; }}
                                                    style={{ color: '#ef4444', cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.25rem' }}
                                                >×</button>
                                            </div>
                                        ) : (
                                            <label htmlFor="admin-question-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                                                <Upload style={{ marginBottom: '0.5rem', color: '#9ca3af' }} size={24} />
                                                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Click để chọn file (max 30MB)</p>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Question Content */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nội dung câu hỏi *</label>
                                <textarea
                                    value={questionFormData.content_text}
                                    onChange={e => setQuestionFormData({ ...questionFormData, content_text: e.target.value })}
                                    rows={3}
                                    placeholder="Nhập nội dung câu hỏi..."
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', resize: 'none' }}
                                />
                            </div>

                            {/* Multiple Choice Options */}
                            {questionFormData.type === 'multiple_choice' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Các đáp án</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {questionFormData.options.map((opt: string, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    width: '1.5rem',
                                                    height: '1.5rem',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    background: questionFormData.correct_answer === String.fromCharCode(65 + idx) ? '#22c55e' : 'rgba(255,255,255,0.1)',
                                                    color: questionFormData.correct_answer === String.fromCharCode(65 + idx) ? 'white' : 'inherit'
                                                }}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...questionFormData.options];
                                                        newOpts[idx] = e.target.value;
                                                        setQuestionFormData({ ...questionFormData, options: newOpts });
                                                    }}
                                                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
                                                />
                                                <button
                                                    onClick={() => setQuestionFormData({ ...questionFormData, correct_answer: String.fromCharCode(65 + idx) })}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        background: questionFormData.correct_answer === String.fromCharCode(65 + idx) ? '#22c55e' : 'rgba(255,255,255,0.2)',
                                                        color: questionFormData.correct_answer === String.fromCharCode(65 + idx) ? 'white' : '#9ca3af'
                                                    }}
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
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Đáp án đúng / Gợi ý</label>
                                    <input
                                        type="text"
                                        value={questionFormData.correct_answer}
                                        onChange={e => setQuestionFormData({ ...questionFormData, correct_answer: e.target.value })}
                                        placeholder="Nhập đáp án đúng hoặc gợi ý chấm điểm"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
                                    />
                                </div>
                            )}

                            {/* Explanation */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Giải thích (tùy chọn)</label>
                                <textarea
                                    value={questionFormData.explanation}
                                    onChange={e => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                                    rows={2}
                                    placeholder="Giải thích đáp án..."
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', resize: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => { setShowCreateQuestionModal(false); resetQuestionForm(); }}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateQuestion}
                                disabled={isCreatingQuestion}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, opacity: isCreatingQuestion ? 0.5 : 1 }}
                            >
                                {isCreatingQuestion ? 'Đang tạo...' : 'Tạo câu hỏi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

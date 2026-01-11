import { useState, useEffect } from 'react';
import { type Exam } from '../../services/exam.service';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import './AdminExamsPage.css';

interface Question {
    id: string;
    skill: string;
    type: string;
    level: string;
    content_text: string;
    options: string[];
    correct_answer: string;
}

export default function AdminExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newExam, setNewExam] = useState({ title: '', description: '', duration_minutes: 60 });

    // View and Edit modal states
    const [viewingExam, setViewingExam] = useState<Exam | null>(null);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', duration_minutes: 60, status: 'draft' });

    // Question management states
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [examQuestions, setExamQuestions] = useState<Question[]>([]);
    const [newQuestion, setNewQuestion] = useState({
        content_text: '',
        skill: 'reading',
        type: 'multiple_choice',
        level: 'B1',
        options: ['', '', '', ''],
        correct_answer: '0'
    });

    const [filters, setFilters] = useState({
        status: '',
        search: ''
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const handleCreateExam = async () => {
        try {
            await api.post('/admin/exams', newExam);
            addNotification('Thành công', 'Đã tạo bài kiểm tra mới', 'success');
            setShowCreateModal(false);
            setNewExam({ title: '', description: '', duration_minutes: 60 });
            fetchExams();
        } catch (error) {
            addNotification('Lỗi', 'Không thể tạo bài kiểm tra', 'error');
        }
    };

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/exams');
            setExams(response.data?.data || []);
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

    const handleAddQuestion = async () => {
        if (!viewingExam || !newQuestion.content_text) return;
        try {
            await api.post(`/admin/exams/${viewingExam.id}/questions`, {
                ...newQuestion,
                options: newQuestion.options.filter(o => o.trim() !== '')
            });
            addNotification('Thành công', 'Đã thêm câu hỏi', 'success');
            setNewQuestion({
                content_text: '',
                skill: 'reading',
                type: 'multiple_choice',
                level: 'B1',
                options: ['', '', '', ''],
                correct_answer: '0'
            });
            fetchExamQuestions(viewingExam.id);
            fetchExams();
        } catch (error) {
            console.error('Error adding question:', error);
            addNotification('Lỗi', 'Không thể thêm câu hỏi', 'error');
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
                                                className="btn-icon btn-publish"
                                                onClick={() => handleStatusChange(exam.id, 'published')}
                                                title="Xuất bản"
                                            >
                                                🚀
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
                    <div style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
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
                            rows={3}
                        />
                        <input
                            type="number"
                            placeholder="Thời gian (phút)"
                            value={newExam.duration_minutes}
                            onChange={e => setNewExam({ ...newExam, duration_minutes: Number(e.target.value) })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', marginBottom: '1rem', color: 'white' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'gray', color: 'white', border: 'none', cursor: 'pointer' }}>Hủy</button>
                            <button onClick={handleCreateExam} disabled={!newExam.title} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>Tạo</button>
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

                        {/* Question Form */}
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Thêm câu hỏi mới</h3>
                            <textarea
                                placeholder="Nội dung câu hỏi *"
                                value={newQuestion.content_text}
                                onChange={e => setNewQuestion({ ...newQuestion, content_text: e.target.value })}
                                rows={2}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', marginBottom: '0.5rem', color: 'white', resize: 'none' }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <select value={newQuestion.skill} onChange={e => setNewQuestion({ ...newQuestion, skill: e.target.value })} style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                                    <option value="reading">Reading</option>
                                    <option value="listening">Listening</option>
                                    <option value="grammar">Grammar</option>
                                    <option value="vocabulary">Vocabulary</option>
                                </select>
                                <select value={newQuestion.level} onChange={e => setNewQuestion({ ...newQuestion, level: e.target.value })} style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                                    <option value="A1">A1</option>
                                    <option value="A2">A2</option>
                                    <option value="B1">B1</option>
                                    <option value="B2">B2</option>
                                    <option value="C1">C1</option>
                                </select>
                                <select value={newQuestion.correct_answer} onChange={e => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })} style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                                    <option value="0">Đáp án A</option>
                                    <option value="1">Đáp án B</option>
                                    <option value="2">Đáp án C</option>
                                    <option value="3">Đáp án D</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {newQuestion.options.map((opt, idx) => (
                                    <input
                                        key={idx}
                                        placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                                        value={opt}
                                        onChange={e => {
                                            const newOpts = [...newQuestion.options];
                                            newOpts[idx] = e.target.value;
                                            setNewQuestion({ ...newQuestion, options: newOpts });
                                        }}
                                        style={{ padding: '0.5rem', borderRadius: '0.5rem', background: newQuestion.correct_answer === String(idx) ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)', border: newQuestion.correct_answer === String(idx) ? '1px solid #22c55e' : 'none', color: 'white' }}
                                    />
                                ))}
                            </div>
                            <button onClick={handleAddQuestion} disabled={!newQuestion.content_text} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: '#22c55e', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                + Thêm câu hỏi
                            </button>
                        </div>

                        {/* Existing Questions */}
                        <div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Danh sách câu hỏi ({examQuestions.length})</h3>
                            {examQuestions.length === 0 ? (
                                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Chưa có câu hỏi nào</p>
                            ) : (
                                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                                    {examQuestions.map((q, idx) => (
                                        <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                                            <div>
                                                <span style={{ color: '#60a5fa', marginRight: '0.5rem' }}>#{idx + 1}</span>
                                                <span>{q.content_text.substring(0, 60)}...</span>
                                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>[{q.skill} - {q.level}]</span>
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
        </div>
    );
}

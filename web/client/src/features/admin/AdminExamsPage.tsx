import { useState, useEffect } from 'react';
import { examService, type Exam } from '../../services/exam.service';
import { useNotification } from '../../context/NotificationContext';
import './AdminExamsPage.css';

export default function AdminExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();

    const [filters, setFilters] = useState({
        status: '',
        search: ''
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await examService.getExams();
            setExams(response.data || []);
        } catch (error) {
            console.error('Error fetching exams:', error);
            addNotification('Lỗi', 'Không thể tải danh sách bài kiểm tra', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (examId: string, newStatus: 'draft' | 'published' | 'archived') => {
        try {
            await examService.updateExam(examId, { status: newStatus });
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
            await examService.deleteExam(examId);
            addNotification('Thành công', 'Đã xóa bài kiểm tra', 'success');
            fetchExams();
        } catch (error) {
            console.error('Error deleting exam:', error);
            addNotification('Lỗi', 'Không thể xóa bài kiểm tra', 'error');
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
                <button className="btn-primary" onClick={() => window.location.href = '/teacher/exams'}>
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
                                            onClick={() => window.open(`/exams/${exam.id}`, '_blank')}
                                            title="Xem"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            className="btn-icon btn-edit"
                                            onClick={() => window.location.href = `/teacher/exams?edit=${exam.id}`}
                                            title="Sửa"
                                        >
                                            ✏️
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
        </div>
    );
}

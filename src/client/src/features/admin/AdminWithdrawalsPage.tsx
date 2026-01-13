import { useState, useEffect } from 'react';
import {
    DollarSign,
    Check,
    X,
    Clock,
    CreditCard,
    RefreshCw,
    Filter,
    CheckCircle,
    XCircle,
    Building2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

interface Withdrawal {
    id: string;
    teacher_id: string;
    teacher_name: string;
    teacher_email: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    bank_name: string;
    bank_account: string;
    bank_holder_name: string;
    rejection_reason?: string;
    created_at: string;
    processed_at?: string;
}

interface TeacherRevenue {
    id: string;
    email: string;
    full_name: string;
    avatar: string;
    totalCourses: number;
    totalRevenue: number;
    withdrawnAmount: number;
    pendingWithdrawal: number;
    availableBalance: number;
}

const AdminWithdrawalsPage = () => {
    const { isDarkMode } = useTheme();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [teacherRevenues, setTeacherRevenues] = useState<TeacherRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('pending');
    const [rejectModal, setRejectModal] = useState<{ show: boolean; id: string; reason: string }>({
        show: false, id: '', reason: ''
    });
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [withdrawalsRes, revenuesRes] = await Promise.all([
                api.get(`/admin/withdrawals${filter ? `?status=${filter}` : ''}`),
                api.get('/admin/teacher-revenues')
            ]);
            setWithdrawals(withdrawalsRes.data.data || []);
            setTeacherRevenues(revenuesRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter]);

    const handleProcess = async (id: string, action: 'approve' | 'reject' | 'paid', reason?: string) => {
        setProcessing(id);
        try {
            await api.put(`/admin/withdrawals/${id}`, { action, rejection_reason: reason });
            fetchData();
            if (action === 'reject') setRejectModal({ show: false, id: '', reason: '' });
        } catch (error) {
            console.error('Failed to process withdrawal:', error);
            alert('Thao tác thất bại!');
        } finally {
            setProcessing(null);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-500/20 text-yellow-500',
            approved: 'bg-blue-500/20 text-blue-500',
            paid: 'bg-green-500/20 text-green-500',
            rejected: 'bg-red-500/20 text-red-500'
        };
        const labels: Record<string, string> = {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
            paid: 'Đã thanh toán',
            rejected: 'Từ chối'
        };
        return <span className={`px-3 py-1 rounded-full text-sm font-bold ${styles[status]}`}>{labels[status]}</span>;
    };

    const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
    const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <DollarSign className="text-green-500" /> Quản lý rút tiền
                    </h1>
                    <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Xét duyệt yêu cầu rút tiền từ giáo viên
                    </p>
                </div>
                <button
                    onClick={() => fetchData()}
                    className="p-3 rounded-xl hover:bg-white/10 border border-gray-200 dark:border-white/10"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg border-l-4 border-yellow-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="text-yellow-500" size={24} />
                        <span className="text-3xl font-bold">{pendingCount}</span>
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Yêu cầu chờ duyệt</div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg border-l-4 border-orange-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <CreditCard className="text-orange-500" size={24} />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng tiền chờ duyệt</div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg border-l-4 border-blue-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <Building2 className="text-blue-500" size={24} />
                    </div>
                    <div className="text-2xl font-bold">{teacherRevenues.length}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Giáo viên có doanh thu</div>
                </div>
            </div>

            {/* Top Teachers by Revenue */}
            <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg`}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-500" /> Doanh thu giáo viên
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <th className="pb-4">Giáo viên</th>
                                <th className="pb-4">Tổng doanh thu</th>
                                <th className="pb-4">Đã rút</th>
                                <th className="pb-4">Khả dụng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teacherRevenues.slice(0, 5).map((t) => (
                                <tr key={t.id} className={`border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                    <td className="py-4 flex items-center gap-3">
                                        <img
                                            src={t.avatar || `https://ui-avatars.com/api/?name=${t.full_name}`}
                                            className="w-10 h-10 rounded-full"
                                            alt=""
                                        />
                                        <div>
                                            <div className="font-bold">{t.full_name || 'Chưa cập nhật'}</div>
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.email}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 font-bold text-blue-500">{formatCurrency(t.totalRevenue)}</td>
                                    <td className="py-4">{formatCurrency(t.withdrawnAmount)}</td>
                                    <td className="py-4 font-bold text-green-500">{formatCurrency(t.availableBalance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdrawal Requests */}
            <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CreditCard size={20} /> Yêu cầu rút tiền
                    </h2>
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border`}
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="rejected">Từ chối</option>
                        </select>
                    </div>
                </div>

                {withdrawals.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <th className="pb-4">Giáo viên</th>
                                    <th className="pb-4">Số tiền</th>
                                    <th className="pb-4">Ngân hàng</th>
                                    <th className="pb-4">Số TK</th>
                                    <th className="pb-4">Trạng thái</th>
                                    <th className="pb-4">Ngày yêu cầu</th>
                                    <th className="pb-4">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map((w) => (
                                    <tr key={w.id} className={`border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                        <td className="py-4">
                                            <div className="font-bold">{w.teacher_name || 'N/A'}</div>
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{w.teacher_email}</div>
                                        </td>
                                        <td className="py-4 font-bold text-green-500">{formatCurrency(w.amount)}</td>
                                        <td className="py-4">{w.bank_name}</td>
                                        <td className="py-4">
                                            <div>{w.bank_account}</div>
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{w.bank_holder_name}</div>
                                        </td>
                                        <td className="py-4">{getStatusBadge(w.status)}</td>
                                        <td className="py-4">{new Date(w.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td className="py-4">
                                            {w.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleProcess(w.id, 'approve')}
                                                        disabled={processing === w.id}
                                                        className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
                                                        title="Duyệt"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ show: true, id: w.id, reason: '' })}
                                                        disabled={processing === w.id}
                                                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                                                        title="Từ chối"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            {w.status === 'approved' && (
                                                <button
                                                    onClick={() => handleProcess(w.id, 'paid')}
                                                    disabled={processing === w.id}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                                                >
                                                    {processing === w.id ? '...' : 'Đã chuyển'}
                                                </button>
                                            )}
                                            {w.status === 'rejected' && w.rejection_reason && (
                                                <span className="text-xs text-red-400">{w.rejection_reason}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Không có yêu cầu nào
                    </p>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl w-full max-w-md p-6`}>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <XCircle size={20} className="text-red-500" />
                            Từ chối yêu cầu
                        </h3>
                        <textarea
                            value={rejectModal.reason}
                            onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            placeholder="Nhập lý do từ chối..."
                            className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border mb-4`}
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectModal({ show: false, id: '', reason: '' })}
                                className="flex-1 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleProcess(rejectModal.id, 'reject', rejectModal.reason)}
                                className="flex-1 py-2 bg-red-500 text-white rounded-xl"
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawalsPage;

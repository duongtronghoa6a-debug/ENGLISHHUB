import { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    CreditCard,
    ArrowUpRight,
    Building2,
    X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

interface RevenueStats {
    totalRevenue: number;
    withdrawnAmount: number;
    pendingWithdrawal: number;
    availableBalance: number;
    monthlyRevenue: { month: string; amount: number }[];
}

interface Withdrawal {
    id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    bank_name: string;
    bank_account: string;
    bank_holder_name: string;
    rejection_reason?: string;
    created_at: string;
    processed_at?: string;
}

const TeacherRevenuePage = () => {
    const { isDarkMode } = useTheme();
    // Simple notification via alert for now
    const [stats, setStats] = useState<RevenueStats | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        bank_name: '',
        bank_account: '',
        bank_holder_name: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, withdrawalsRes] = await Promise.all([
                api.get('/teacher/revenue-stats'),
                api.get('/teacher/withdrawals')
            ]);
            setStats(statsRes.data.data);
            setWithdrawals(withdrawalsRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/teacher/withdrawals', {
                amount: parseFloat(withdrawForm.amount),
                bank_name: withdrawForm.bank_name,
                bank_account: withdrawForm.bank_account,
                bank_holder_name: withdrawForm.bank_holder_name
            });
            alert('Yêu cầu rút tiền đã được gửi!');
            setShowWithdrawModal(false);
            setWithdrawForm({ amount: '', bank_name: '', bank_account: '', bank_holder_name: '' });
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Không thể gửi yêu cầu');
        } finally {
            setSubmitting(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <DollarSign className="text-green-500" /> Doanh thu
                    </h1>
                    <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Quản lý doanh thu và yêu cầu rút tiền
                    </p>
                </div>
                <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={!stats || stats.availableBalance <= 0}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <ArrowUpRight size={20} />
                    Yêu cầu rút tiền
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg border-l-4 border-blue-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="text-blue-500" size={24} />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng doanh thu</div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg border-l-4 border-green-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="text-green-500" size={24} />
                    </div>
                    <div className="text-2xl font-bold text-green-500">{formatCurrency(stats?.availableBalance || 0)}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Số dư khả dụng</div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg border-l-4 border-yellow-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="text-yellow-500" size={24} />
                    </div>
                    <div className="text-2xl font-bold text-yellow-500">{formatCurrency(stats?.pendingWithdrawal || 0)}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Đang chờ rút</div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg border-l-4 border-purple-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="text-purple-500" size={24} />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.withdrawnAmount || 0)}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Đã rút</div>
                </div>
            </div>

            {/* Withdrawal History */}
            <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} p-6 rounded-2xl shadow-lg`}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CreditCard size={20} /> Lịch sử rút tiền
                </h2>

                {withdrawals.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <th className="pb-4 font-medium">Ngày</th>
                                    <th className="pb-4 font-medium">Số tiền</th>
                                    <th className="pb-4 font-medium">Ngân hàng</th>
                                    <th className="pb-4 font-medium">Số tài khoản</th>
                                    <th className="pb-4 font-medium">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map((w) => (
                                    <tr key={w.id} className={`border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                        <td className="py-4">{new Date(w.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td className="py-4 font-bold">{formatCurrency(w.amount)}</td>
                                        <td className="py-4">{w.bank_name}</td>
                                        <td className="py-4">{w.bank_account}</td>
                                        <td className="py-4">
                                            {getStatusBadge(w.status)}
                                            {w.rejection_reason && (
                                                <p className="text-xs text-red-400 mt-1">{w.rejection_reason}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Chưa có yêu cầu rút tiền nào
                    </p>
                )}
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl w-full max-w-md p-6`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Building2 size={20} className="text-green-500" />
                                Yêu cầu rút tiền
                            </h3>
                            <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className={`p-4 rounded-xl mb-6 ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Số dư khả dụng</p>
                            <p className="text-2xl font-bold text-green-500">{formatCurrency(stats?.availableBalance || 0)}</p>
                        </div>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Số tiền rút (VND)</label>
                                <input
                                    type="number"
                                    required
                                    max={stats?.availableBalance || 0}
                                    value={withdrawForm.amount}
                                    onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border focus:ring-2 focus:ring-green-500`}
                                    placeholder="Nhập số tiền"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Tên ngân hàng</label>
                                <input
                                    type="text"
                                    required
                                    value={withdrawForm.bank_name}
                                    onChange={e => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border`}
                                    placeholder="VD: Vietcombank, MB Bank..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Số tài khoản</label>
                                <input
                                    type="text"
                                    required
                                    value={withdrawForm.bank_account}
                                    onChange={e => setWithdrawForm({ ...withdrawForm, bank_account: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border`}
                                    placeholder="Nhập số tài khoản"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Tên chủ tài khoản</label>
                                <input
                                    type="text"
                                    required
                                    value={withdrawForm.bank_holder_name}
                                    onChange={e => setWithdrawForm({ ...withdrawForm, bank_holder_name: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border`}
                                    placeholder="NGUYEN VAN A"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                {submitting ? 'Đang xử lý...' : 'Gửi yêu cầu rút tiền'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherRevenuePage;

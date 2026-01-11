import { useState, useEffect } from 'react';
import { Edit, Trash2, Search, Users, Shield, GraduationCap, UserCheck, Download } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/admin.service';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import * as XLSX from 'xlsx';

interface User {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    full_name?: string | null;
}

const AdminUsersPage = () => {
    const { isDarkMode } = useTheme();
    const { addNotification } = useNotification();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [apiStats, setApiStats] = useState<{ learners: number; teachers: number; admins: number; active: number } | null>(null);

    // Edit and Delete modal states
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ role: '', is_active: true });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, pagination.page]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const params: any = { limit: pagination.limit, page: pagination.page };
            if (roleFilter !== 'all') params.role = roleFilter;

            const response = await adminService.getUsers(params);
            // Handle multiple response formats
            const userData = response.data?.users || response.users || response.data || [];
            setUsers(Array.isArray(userData) ? userData : []);

            // Update pagination from response
            if (response.pagination) {
                setPagination(prev => ({
                    ...prev,
                    total: response.pagination.total || 0,
                    totalPages: response.pagination.totalPages || 1
                }));
            }

            // Update stats from API response
            if (response.stats) {
                setApiStats(response.stats);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openEditModal = (user: User) => {
        setEditForm({ role: user.role, is_active: user.is_active });
        setEditingUser(user);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            await api.put(`/admin/users/${editingUser.id}`, editForm);
            addNotification('Thành công', 'Đã cập nhật người dùng', 'success');
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            addNotification('Lỗi', 'Không thể cập nhật người dùng', 'error');
        }
    };

    const handleDeleteUser = async () => {
        if (!showDeleteConfirm) return;
        try {
            await api.delete(`/admin/users/${showDeleteConfirm.id}`);
            addNotification('Thành công', 'Đã xóa người dùng', 'success');
            setShowDeleteConfirm(null);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            addNotification('Lỗi', 'Không thể xóa người dùng', 'error');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active);
        return matchSearch && matchStatus;
    });

    const stats = {
        total: pagination.total || users.length,
        students: apiStats?.learners || 0,
        teachers: apiStats?.teachers || 0,
        admins: apiStats?.admins || 0,
        active: apiStats?.active || 0
    };

    const handleExportExcel = () => {
        const exportData = filteredUsers.map(user => ({
            'Họ tên': user.full_name || 'Chưa cập nhật',
            'Email': user.email,
            'Vai trò': user.role === 'learner' ? 'Học viên' : user.role === 'teacher' ? 'Giáo viên' : 'Admin',
            'Trạng thái': user.is_active ? 'Hoạt động' : 'Không hoạt động',
            'Ngày tạo': new Date(user.created_at).toLocaleDateString('vi-VN')
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        XLSX.writeFile(workbook, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getRoleBadge = (role: string) => {
        const config: Record<string, { bg: string; text: string; icon: any }> = {
            'admin': { bg: 'bg-red-500/20', text: 'text-red-500', icon: Shield },
            'teacher': { bg: 'bg-blue-500/20', text: 'text-blue-500', icon: GraduationCap },
            'learner': { bg: 'bg-green-500/20', text: 'text-green-500', icon: Users }
        };
        const c = config[role] || config['student'];
        const Icon = c.icon;
        return (
            <span className={`${c.bg} ${c.text} px-2 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1`}>
                <Icon size={12} /> {role}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="text-blue-500" /> Quản lý người dùng
                    </h1>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Quản lý tất cả người dùng trong hệ thống
                    </p>
                </div>
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700"
                >
                    <Download size={18} /> Export to Excel
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className={`text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tổng số</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-green-500 text-xs font-bold uppercase mb-1">Học viên</div>
                    <div className="text-2xl font-bold">{stats.students}</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-blue-500 text-xs font-bold uppercase mb-1">Giáo viên</div>
                    <div className="text-2xl font-bold">{stats.teachers}</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-red-500 text-xs font-bold uppercase mb-1">Admin</div>
                    <div className="text-2xl font-bold">{stats.admins}</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-emerald-500 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                        <UserCheck size={12} /> Active
                    </div>
                    <div className="text-2xl font-bold">{stats.active}</div>
                </div>
            </div>

            {/* Filters */}
            <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} flex flex-col md:flex-row gap-4`}>
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className={`px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                >
                    <option value="all">Tất cả vai trò</option>
                    <option value="learner">Học viên</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="admin">Admin</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`px-4 py-2 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} outline-none`}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                </select>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rounded-2xl shadow-sm border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} overflow-hidden`}>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} text-xs uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <th className="p-4">Người dùng</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Vai trò</th>
                                    <th className="p-4">Trạng thái</th>
                                    <th className="p-4">Ngày tạo</th>
                                    <th className="p-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'} text-sm`}>
                                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                    <tr key={user.id} className={`${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors group`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {(user.full_name || user.email)[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{user.full_name || 'Chưa cập nhật'}</div>
                                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {user.role.toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">{user.email}</td>
                                        <td className="p-4">{getRoleBadge(user.role)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                {user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(user)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg" title="Sửa">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => setShowDeleteConfirm(user)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg" title="Xóa">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center">
                                            <Users size={48} className="mx-auto mb-4 opacity-30" />
                                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                                Không tìm thấy người dùng nào
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className={`flex flex-col md:flex-row justify-between items-center gap-4 p-4 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-b-xl`}>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Trang {pagination.page} / {pagination.totalPages} • Tổng: {pagination.total} người dùng
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={pagination.limit}
                                onChange={(e) => setPagination(prev => ({ ...prev, page: 1, limit: parseInt(e.target.value) }))}
                                className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
                            >
                                <option value={20}>20 / trang</option>
                                <option value={50}>50 / trang</option>
                                <option value={100}>100 / trang</option>
                            </select>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-[#1e293b] hover:bg-white/10' : 'bg-white hover:bg-gray-100'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
                            >
                                ← Trước
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                disabled={pagination.page === pagination.totalPages}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-[#1e293b] hover:bg-white/10' : 'bg-white hover:bg-gray-100'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
                            >
                                Sau →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingUser(null)}>
                    <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-xl max-w-md w-full mx-4`} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">✏️ Sửa người dùng</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input type="text" value={editingUser.email} disabled className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} opacity-50`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Vai trò</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100'}`}
                                >
                                    <option value="learner">Học viên</option>
                                    <option value="teacher">Giáo viên</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.is_active}
                                        onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">Kích hoạt</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg">Hủy</button>
                            <button onClick={handleUpdateUser} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(null)}>
                    <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-6 rounded-2xl shadow-xl max-w-md w-full mx-4`} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 text-red-500">⚠️ Xác nhận xóa</h2>
                        <p className="mb-4">Bạn có chắc muốn xóa người dùng <strong>{showDeleteConfirm.email}</strong>?</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Hành động này không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg">Hủy</button>
                            <button onClick={handleDeleteUser} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;

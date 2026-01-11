import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MapPin,
    Users,
    Calendar,
    Edit,
    Trash2,
    Building,
    Loader2,
    X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';
import api from '../../services/api';

interface OfflineClass {
    id: string;
    class_name: string;
    organizer_name: string;
    address: string;
    room: string;
    schedule_text: string;
    start_date: string;
    end_date: string;
    price: number;
    capacity: number;
    current_enrolled: number;
    thumbnail_url: string;
    status: string;
    enrolledCount?: number;
    pendingCount?: number;
}

// Create Modal Component
const CreateOfflineClassModal = ({
    isDarkMode,
    onClose,
    onSuccess
}: {
    isDarkMode: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        class_name: '',
        address: '',
        room: '',
        schedule_text: '',
        start_date: '',
        end_date: '',
        capacity: 20,
        price: 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.class_name || !formData.address) {
            setError('Vui lòng điền tên lớp và địa chỉ');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/offline-classes', formData);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tạo lớp học');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className={`w-full max-w-xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-2xl`}>
                <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
                    <h2 className="text-xl font-bold">Tạo lớp học offline mới</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Tên lớp học *</label>
                        <input
                            type="text"
                            value={formData.class_name}
                            onChange={e => setFormData(f => ({ ...f, class_name: e.target.value }))}
                            className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                            placeholder="VD: IELTS 7.0 - Lớp tối"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Địa chỉ *</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                                placeholder="VD: 123 Nguyễn Huệ, Q1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phòng học</label>
                            <input
                                type="text"
                                value={formData.room}
                                onChange={e => setFormData(f => ({ ...f, room: e.target.value }))}
                                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                                placeholder="VD: Phòng 301"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Lịch học</label>
                        <input
                            type="text"
                            value={formData.schedule_text}
                            onChange={e => setFormData(f => ({ ...f, schedule_text: e.target.value }))}
                            className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                            placeholder="VD: Thứ 2, 4, 6 - 19:00-21:00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={e => setFormData(f => ({ ...f, start_date: e.target.value }))}
                                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={e => setFormData(f => ({ ...f, end_date: e.target.value }))}
                                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Sĩ số tối đa</label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={e => setFormData(f => ({ ...f, capacity: parseInt(e.target.value) || 20 }))}
                                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Học phí (VNĐ)</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData(f => ({ ...f, price: parseInt(e.target.value) || 0 }))}
                                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 py-2.5 rounded-lg font-medium ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Tạo lớp học
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TeacherOfflineClassesPage = () => {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<OfflineClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setIsLoading(true);
        try {
            const response = await teacherService.getMyOfflineClasses();
            const data = response.data?.classes || response.data || response.classes || [];
            setClasses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch offline classes:', error);
            setClasses([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa lớp học này?')) return;
        try {
            await teacherService.deleteOfflineClass(id);
            fetchClasses();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Không thể xóa lớp học');
        }
    };

    const filteredClasses = classes.filter(c =>
        c.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'open': 'bg-green-500',
            'in_progress': 'bg-blue-500',
            'completed': 'bg-gray-500',
            'full': 'bg-yellow-500',
            'closed': 'bg-red-500'
        };
        const labels: Record<string, string> = {
            'open': 'Đang mở',
            'in_progress': 'Đang diễn ra',
            'completed': 'Đã kết thúc',
            'full': 'Đã đầy',
            'closed': 'Đã đóng'
        };
        return (
            <span className={`${colors[status] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded-full`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Khóa học Offline</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                    <Plus size={20} />
                    Thêm lớp học
                </button>
            </div>

            {/* Search */}
            <div className={`flex items-center px-4 py-2 rounded-xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow max-w-md`}>
                <Search size={20} className="text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Tìm kiếm lớp học..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                />
            </div>

            {/* Classes Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map((cls) => (
                        <div
                            key={cls.id}
                            className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-700/30">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg line-clamp-1">
                                        {cls.class_name || 'Lớp học Offline'}
                                    </h3>
                                    {getStatusBadge(cls.status)}
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <MapPin size={16} className="text-blue-400" />
                                        <span className="line-clamp-1">{cls.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Building size={16} className="text-purple-400" />
                                        <span className="line-clamp-1">{cls.room || 'Chưa có phòng'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="p-5">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="text-green-400" size={16} />
                                        <span>{cls.current_enrolled || 0}/{cls.capacity} học viên</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="text-yellow-400" size={16} />
                                        <span>{formatDate(cls.start_date)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/teacher/offline-classes/${cls.id}`)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
                                    >
                                        <Edit size={16} />
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClass(cls.id)}
                                        className="py-2 px-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Building size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Chưa có lớp học offline nào</p>
                    <p className="text-sm">Bắt đầu tạo lớp học đầu tiên của bạn</p>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateOfflineClassModal
                    isDarkMode={isDarkMode}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchClasses();
                    }}
                />
            )}
        </div>
    );
};

export default TeacherOfflineClassesPage;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, MapPin, Calendar, Clock,
    Check, X, Loader2, Mail, AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { teacherService } from '../../services/teacher.service';
import api from '../../services/api';

interface OfflineClass {
    id: string;
    class_name: string;
    address: string;
    room: string;
    schedule_text: string;
    start_date: string;
    end_date: string;
    capacity: number;
    current_enrolled: number;
    status: string;
}

interface EnrollmentRequest {
    id: string;
    class_id: string;
    learner_id: string;
    status: string;
    created_at: string;
    learner: {
        id: string;
        email: string;
    };
    offlineClass?: {
        class_name: string;
    };
}

interface Attendee {
    id: string;
    email: string;
    full_name: string;
    joined_at: string;
}

const TeacherOfflineClassDetailPage = () => {
    const { isDarkMode } = useTheme();
    const { id: classId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [offlineClass, setOfflineClass] = useState<OfflineClass | null>(null);
    const [pendingRequests, setPendingRequests] = useState<EnrollmentRequest[]>([]);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (classId) {
            fetchData();
        }
    }, [classId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Get class details (includes attendances)
            const classRes = await api.get(`/offline-classes/${classId}`);
            if (classRes.data.success) {
                const classData = classRes.data.data;
                setOfflineClass(classData);

                // Extract attendees from attendances array
                if (classData.attendances && Array.isArray(classData.attendances)) {
                    const attendeesList = classData.attendances.map((att: any) => ({
                        id: att.id,
                        email: att.learner?.email || 'N/A',
                        full_name: att.learner?.email?.split('@')[0] || 'Học viên',
                        joined_at: att.created_at || att.createdAt
                    }));
                    setAttendees(attendeesList);
                }
            }

            // Get pending requests
            try {
                const requestsRes = await teacherService.getPendingRequests();
                if (requestsRes.success) {
                    // Filter only requests for this class
                    const classRequests = requestsRes.data.filter(
                        (r: EnrollmentRequest) => r.class_id === classId
                    );
                    setPendingRequests(classRequests);
                }
            } catch (e) {
                console.log('No pending requests or error:', e);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        setActionLoading(requestId);
        setMessage(null);
        try {
            await teacherService.approveEnrollmentRequest(requestId);
            setMessage({ type: 'success', text: 'Đã duyệt yêu cầu thành công!' });
            fetchData(); // Refresh data
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Không thể duyệt yêu cầu'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!confirm('Bạn có chắc muốn từ chối yêu cầu này?')) return;

        setActionLoading(requestId);
        setMessage(null);
        try {
            await teacherService.rejectEnrollmentRequest(requestId);
            setMessage({ type: 'success', text: 'Đã từ chối yêu cầu!' });
            fetchData(); // Refresh data
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Không thể từ chối yêu cầu'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Chưa có';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/teacher/offline-classes')}
                    className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">{offlineClass?.class_name || 'Chi tiết lớp học'}</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Quản lý yêu cầu đăng ký và học viên
                    </p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Class Info */}
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-lg`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <div>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Địa điểm</p>
                            <p className="font-medium">{offlineClass?.address || 'Chưa có'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-green-500" />
                        <div>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thời gian</p>
                            <p className="font-medium">{offlineClass?.schedule_text || 'Chưa có'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-500" />
                        <div>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sĩ số</p>
                            <p className="font-medium">{offlineClass?.current_enrolled || 0}/{offlineClass?.capacity}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <div>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phòng học</p>
                            <p className="font-medium">{offlineClass?.room || 'Chưa có'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Requests */}
            <div className={`rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-lg overflow-hidden`}>
                <div className="p-4 border-b border-gray-700/30">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        Yêu cầu chờ duyệt ({pendingRequests.length})
                    </h2>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Không có yêu cầu nào đang chờ duyệt
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700/30">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{request.learner?.email}</p>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Yêu cầu lúc: {formatDate(request.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleApprove(request.id)}
                                        disabled={actionLoading === request.id}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-400 disabled:opacity-50 transition-colors text-sm"
                                    >
                                        {actionLoading === request.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        Duyệt
                                    </button>
                                    <button
                                        onClick={() => handleReject(request.id)}
                                        disabled={actionLoading === request.id}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors text-sm"
                                    >
                                        <X className="w-4 h-4" />
                                        Từ chối
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enrolled Students */}
            <div className={`rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-lg overflow-hidden`}>
                <div className="p-4 border-b border-gray-700/30">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-500" />
                        Học viên đã đăng ký ({attendees.length})
                    </h2>
                </div>

                {attendees.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Chưa có học viên nào đăng ký lớp này
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700/30">
                        {attendees.map(attendee => (
                            <div key={attendee.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.full_name || attendee.email)}&background=random`}
                                        alt=""
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium">{attendee.full_name || attendee.email}</p>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Tham gia: {formatDate(attendee.joined_at)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/teacher/chat`)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-colors text-sm"
                                >
                                    <Mail className="w-4 h-4" />
                                    Nhắn tin
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherOfflineClassDetailPage;

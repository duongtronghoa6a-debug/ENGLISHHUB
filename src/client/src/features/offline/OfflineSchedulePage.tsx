import React, { useState, useEffect } from 'react';
import Layout from '../../layouts/Layout';
import { offlineService, type OfflineClass } from '../../services/offline.service';
import { classEnrollmentService } from '../../services/classEnrollment.service';
import { Calendar, MapPin, Clock, User, DollarSign, BookOpen, Send } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const OfflineSchedulePage = () => {
    const [classes, setClasses] = useState<OfflineClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestingId, setRequestingId] = useState<string | null>(null);
    const { addNotification } = useNotification();

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const res = await offlineService.getOpenClasses();
            if (res.success) setClasses(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestEnroll = async (classId: string) => {
        try {
            setRequestingId(classId);
            const res = await classEnrollmentService.requestEnrollment(classId);
            if (res.success) {
                addNotification('Thành công', res.message || 'Đã gửi yêu cầu tham gia!', 'success');
            } else {
                addNotification('Thông báo', res.message || 'Yêu cầu đã được gửi', 'info');
            }
        } catch (error: any) {
            addNotification('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra', 'error');
        } finally {
            setRequestingId(null);
        }
    };

    const formatPrice = (price: number) => {
        return price === 0 ? 'Free' : `${price.toLocaleString('vi-VN')} VND`;
    };

    if (loading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Offline Classes</h1>

                <div className="grid gap-6">
                    {classes.map((cls) => (
                        <div key={cls.id} className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-indigo-500 hover:shadow-xl transition-shadow">
                            <div className="flex flex-col md:flex-row">
                                {/* Thumbnail */}
                                {cls.thumbnail_url && (
                                    <div className="md:w-48 h-48 md:h-auto">
                                        <img
                                            src={cls.thumbnail_url}
                                            alt={cls.class_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{cls.class_name}</h3>
                                            <p className="text-gray-600 mb-4">{cls.organizer_name}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${cls.status === 'open' ? 'bg-green-100 text-green-800' :
                                            cls.status === 'closed' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {cls.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={18} />
                                            <span>{cls.address}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={18} />
                                            <span>{cls.schedule_text}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User size={18} />
                                            <span>
                                                {cls.current_enrolled}/{cls.capacity} enrolled
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={18} />
                                            <span className="font-semibold text-indigo-600">
                                                {formatPrice(cls.price)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Syllabus Preview */}
                                    {cls.syllabus_json && cls.syllabus_json.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                                <BookOpen size={16} />
                                                <span>Syllabus Preview:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {cls.syllabus_json.slice(0, 3).map((item: any, idx: number) => (
                                                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm">
                                                        {item.title || item.name || `Week ${idx + 1}`}
                                                    </span>
                                                ))}
                                                {cls.syllabus_json.length > 3 && (
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-500">
                                                        +{cls.syllabus_json.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action */}
                                    <div className="flex justify-end">
                                        {cls.status === 'open' && cls.current_enrolled < cls.capacity ? (
                                            <button
                                                onClick={() => handleRequestEnroll(cls.id)}
                                                disabled={requestingId === cls.id}
                                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Send size={18} />
                                                {requestingId === cls.id ? 'Đang gửi...' : 'Yêu cầu tham gia'}
                                            </button>
                                        ) : (
                                            <button disabled className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed">
                                                {cls.current_enrolled >= cls.capacity ? 'Lớp đã đầy' : 'Đã đóng'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {classes.length === 0 && (
                        <div className="text-center py-16 bg-gray-50 rounded-lg">
                            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">No offline classes available currently.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default OfflineSchedulePage;

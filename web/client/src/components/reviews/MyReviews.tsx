import { useState, useEffect } from 'react';
import { Star, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Review {
    id: string;
    course_id: string;
    rating: number;
    comment: string;
    created_at: string;
    course?: {
        id: string;
        title: string;
        thumbnail_url?: string;
    };
}

interface MyReviewsProps {
    isDarkMode: boolean;
}

const MyReviews = ({ isDarkMode }: MyReviewsProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyReviews();
    }, []);

    const fetchMyReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reviews/my');
            setReviews(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

        try {
            setDeleting(reviewId);
            await api.delete(`/reviews/${reviewId}`);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (error) {
            console.error('Failed to delete review:', error);
            alert('Không thể xóa đánh giá. Vui lòng thử lại.');
        } finally {
            setDeleting(null);
        }
    };

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={14}
                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
            ))}
        </div>
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-sm`}>
                <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="text-cyan-500" size={24} />
                    <h3 className="text-lg font-bold">Đánh giá của tôi</h3>
                </div>
                <div className="text-center py-8 opacity-60">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Đang tải...
                </div>
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <MessageSquare className="text-cyan-500" size={24} />
                    <h3 className="text-lg font-bold">Đánh giá của tôi</h3>
                </div>
                <span className="text-sm opacity-60">{reviews.length} đánh giá</span>
            </div>

            {reviews.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                    <p>Bạn chưa đánh giá khóa học nào.</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className={`p-4 rounded-xl flex items-start gap-4 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-gray-50'
                                }`}
                        >
                            {/* Course Thumbnail */}
                            <img
                                src={review.course?.thumbnail_url || 'https://via.placeholder.com/80'}
                                alt={review.course?.title}
                                className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate(`/document/${review.course_id}`)}
                            />

                            {/* Review Content */}
                            <div className="flex-1 min-w-0">
                                <h4
                                    className="font-medium text-sm truncate cursor-pointer hover:text-cyan-500 transition-colors"
                                    onClick={() => navigate(`/document/${review.course_id}`)}
                                >
                                    {review.course?.title || 'Khóa học'}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    {renderStars(review.rating)}
                                    <span className="text-xs opacity-50">{formatDate(review.created_at)}</span>
                                </div>
                                <p className="text-sm opacity-70 mt-2 line-clamp-2">{review.comment}</p>
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDelete(review.id)}
                                disabled={deleting === review.id}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
                                title="Xóa đánh giá"
                            >
                                {deleting === review.id ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Trash2 size={18} />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReviews;

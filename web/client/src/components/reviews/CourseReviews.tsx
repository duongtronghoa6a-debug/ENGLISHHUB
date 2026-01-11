import { useState, useEffect } from 'react';
import { Star, Send, User } from 'lucide-react';
import api from '../../services/api';

interface Review {
    id: string;
    learner_id: string;
    course_id: string;
    rating: number;
    comment: string;
    created_at: string;
    learner?: {
        full_name: string;
    };
}

interface CourseReviewsProps {
    courseId: string;
    isDarkMode: boolean;
}

const CourseReviews = ({ courseId, isDarkMode }: CourseReviewsProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [hoveredStar, setHoveredStar] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [courseId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/reviews/course/${courseId}`);
            const data = response.data.data || response.data || [];
            setReviews(data);

            // Calculate average
            if (data.length > 0) {
                const avg = data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length;
                setAverageRating(Math.round(avg * 10) / 10);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            await api.post('/reviews', {
                course_id: courseId,
                rating: newRating,
                comment: newComment
            });

            setNewComment('');
            setNewRating(5);
            fetchReviews();
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Vui lòng đăng nhập để đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number, interactive = false, size = 20) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={size}
                        className={`transition-all cursor-pointer ${star <= (interactive ? (hoveredStar || newRating) : rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                            }`}
                        onClick={() => interactive && setNewRating(star)}
                        onMouseEnter={() => interactive && setHoveredStar(star)}
                        onMouseLeave={() => interactive && setHoveredStar(0)}
                    />
                ))}
            </div>
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={`mt-12 p-6 rounded-3xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-sm`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Đánh giá & Nhận xét</h3>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-yellow-500">{averageRating || '-'}</span>
                    {renderStars(Math.round(averageRating))}
                    <span className="text-sm opacity-60">({reviews.length} đánh giá)</span>
                </div>
            </div>

            {/* Rating Form */}
            <form onSubmit={handleSubmit} className={`p-4 rounded-2xl mb-6 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium">Đánh giá của bạn:</span>
                    {renderStars(newRating, true, 28)}
                    <span className="text-sm text-yellow-500 font-bold">{newRating}/5</span>
                </div>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Viết nhận xét của bạn..."
                        className={`flex-1 px-4 py-3 rounded-xl border-none outline-none ${isDarkMode ? 'bg-[#151e32] text-white' : 'bg-white text-gray-900'
                            }`}
                    />
                    <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-600 transition-colors disabled:opacity-50"
                    >
                        <Send size={18} />
                        {submitting ? 'Đang gửi...' : 'Gửi'}
                    </button>
                </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="text-center py-8 opacity-60">Đang tải đánh giá...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 opacity-60">
                        Chưa có đánh giá nào. Hãy là người đầu tiên!
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review.id}
                            className={`p-4 rounded-2xl ${isDarkMode ? 'bg-[#1e293b]' : 'bg-gray-50'}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-100'
                                    }`}>
                                    <User size={20} className="text-cyan-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium">
                                            {review.learner?.full_name || 'Học viên ẩn danh'}
                                        </span>
                                        <span className="text-xs opacity-50">{formatDate(review.created_at)}</span>
                                    </div>
                                    <div className="mb-2">{renderStars(review.rating, false, 14)}</div>
                                    <p className="text-sm opacity-80">{review.comment}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CourseReviews;

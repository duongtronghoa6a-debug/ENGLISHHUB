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
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={size}
                        className={`transition-all ${interactive ? 'cursor-pointer hover:scale-110' : ''} ${star <= (interactive ? (hoveredStar || newRating) : rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : isDarkMode ? 'text-gray-600' : 'text-gray-300'
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
        <div className={`mt-8 rounded-3xl overflow-hidden ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} shadow-lg`}>
            {/* Header with Gradient */}
            <div className={`p-6 ${isDarkMode ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50' : 'bg-gradient-to-r from-cyan-50 to-blue-50'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></span>
                        Đánh giá & Nhận xét
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                {averageRating || '-'}
                            </span>
                            <div className="flex flex-col">
                                {renderStars(Math.round(averageRating), false, 18)}
                                <span className="text-xs opacity-60 mt-0.5">({reviews.length} đánh giá)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Rating Form */}
                <form onSubmit={handleSubmit} className={`p-5 rounded-2xl mb-6 ${isDarkMode ? 'bg-[#1a2438]' : 'bg-gray-50'} border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                        <span className="text-sm font-medium opacity-80">Đánh giá của bạn:</span>
                        <div className="flex items-center gap-3">
                            {renderStars(newRating, true, 32)}
                            <span className="text-lg font-bold text-yellow-500">{newRating}/5</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Viết nhận xét của bạn..."
                            className={`flex-1 px-5 py-3.5 rounded-xl border-none outline-none transition-all focus:ring-2 ${isDarkMode
                                ? 'bg-[#0d1526] text-white focus:ring-cyan-500/30 placeholder:text-gray-500'
                                : 'bg-white text-gray-900 focus:ring-cyan-500/20 placeholder:text-gray-400 shadow-sm'
                                }`}
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold flex items-center gap-2 hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
                        >
                            <Send size={18} />
                            {submitting ? 'Đang gửi...' : 'Gửi'}
                        </button>
                    </div>
                </form>

                {/* Reviews List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <span className="opacity-60">Đang tải đánh giá...</span>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-12 opacity-60">
                            <Star size={48} className="mx-auto mb-3 opacity-30" />
                            <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        reviews.map((review, index) => (
                            <div
                                key={review.id}
                                className={`p-5 rounded-2xl transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-[#1a2438] hover:bg-[#1e2a42]' : 'bg-gray-50 hover:bg-gray-100'}`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'
                                        }`}>
                                        <User size={24} className="text-cyan-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="font-bold text-sm">
                                                {review.learner?.full_name || 'Học viên ẩn danh'}
                                            </span>
                                            <span className="text-xs opacity-40">•</span>
                                            <span className="text-xs opacity-50">{formatDate(review.created_at)}</span>
                                        </div>
                                        <div className="mb-2">{renderStars(review.rating, false, 16)}</div>
                                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {review.comment}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseReviews;


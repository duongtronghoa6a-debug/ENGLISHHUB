import { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { enrollmentService } from '../../services/enrollment.service';
import { classEnrollmentService } from '../../services/classEnrollment.service';
import api from '../../services/api';

interface DocumentProps {
    data: {
        id: number;
        title: string;
        description: string;
        image: string;
        type: string;
        progress?: number;
        isCompleted?: boolean;
        isEnrolled?: boolean;
        price?: number;
        author?: string;
        rating?: number;
        reviewCount?: number;
    };
}

const DocumentCard = ({ data }: DocumentProps) => {
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isRequesting, setIsRequesting] = useState(false);
    const [ratingInfo, setRatingInfo] = useState<{ avg: number; count: number } | null>(null);
    const [ratingFetched, setRatingFetched] = useState(false);

    // Fetch rating on hover
    const fetchRating = async () => {
        if (ratingFetched) return;
        setRatingFetched(true);
        try {
            const res = await api.get(`/reviews/course/${data.id}`);
            const { averageRating, count } = res.data;
            setRatingInfo({ avg: averageRating || 0, count: count || 0 });
        } catch {
            setRatingInfo({ avg: 0, count: 0 });
        }
    };

    // Check login before allowing access
    const requireLogin = (): boolean => {
        if (!isAuthenticated) {
            const shouldLogin = window.confirm('Bạn cần đăng nhập để truy cập nội dung này. Đăng nhập ngay?');
            if (shouldLogin) {
                navigate('/login');
            }
            return true;
        }
        return false;
    };

    const handleAction = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click

        // Custom link override
        if ((data as any).link) {
            navigate((data as any).link);
            return;
        }

        // Enrolled courses: navigate to lessons
        if (data.isEnrolled) {
            navigate(`/courses/${data.id}/learn`);
            return;
        }

        if (data.type === 'offline') {
            // Handle offline class enrollment request
            if (!isAuthenticated) {
                const shouldLogin = window.confirm('Bạn cần đăng nhập để gửi yêu cầu tham gia. Đăng nhập ngay?');
                if (shouldLogin) navigate('/login');
                return;
            }
            try {
                setIsRequesting(true);
                const res = await classEnrollmentService.requestEnrollment(String(data.id));
                alert(res.message || 'Đã gửi yêu cầu tham gia!');
            } catch (error: any) {
                alert(error.response?.data?.message || 'Có lỗi xảy ra');
            } finally {
                setIsRequesting(false);
            }
            return;
        }

        if (data.type === 'paid') {
            addToCart(data);
            // Do not navigate to cart automatically, just add. User can see cart icon update.
        } else if (data.type === 'test') {
            navigate(`/test/${data.id}/take`);
        } else {
            // Free course - navigate directly to learn page
            navigate(`/courses/${data.id}/learn`);
        }
    };

    const handleCardClick = async () => {
        console.log('[DocumentCard] Click event triggered. data:', data);
        console.log('[DocumentCard] data.type:', data.type, 'data.price:', data.price, 'data.isEnrolled:', data.isEnrolled);

        if ((data as any).link) {
            navigate((data as any).link);
            return;
        }

        // Require login for all content types
        if (requireLogin()) return;

        // If course is enrolled (purchased), navigate to lessons
        if (data.isEnrolled) {
            console.log('[DocumentCard] Enrolled course - navigating to lessons');

            // Video courses should go to detail page with YouTube embed
            if ((data as any).course_type === 'video' || data.type === 'video') {
                console.log('[DocumentCard] Video course - navigating to document detail');
                navigate(`/documents/${data.id}`);
                return;
            }

            navigate(`/courses/${data.id}/learn`);
            return;
        }

        // Paid courses: add to cart and navigate to cart
        // Also check by price as fallback
        const isPaid = data.type === 'paid' || (data.price && data.price > 0);
        const isVideoCourse = (data as any).course_type === 'video' || data.type === 'video';
        console.log('[DocumentCard] isPaid:', isPaid, 'isVideoCourse:', isVideoCourse);

        // Video courses: navigate to detail page directly
        if (isVideoCourse) {
            console.log('[DocumentCard] Video course - navigating to document detail');
            navigate(`/documents/${data.id}`);
            return;
        }

        if (isPaid) {
            console.log('[DocumentCard] Adding to cart and navigating to /cart');
            addToCart(data);
            navigate('/cart');
            return;
        }

        // Free courses: auto-enroll first, then navigate to learn page
        console.log('[DocumentCard] Free course - enrolling and navigating to learn page');
        try {
            await enrollmentService.enroll(String(data.id));
            console.log('[DocumentCard] Enrollment successful');
        } catch (error: any) {
            // Ignore if already enrolled
            if (!error.response?.data?.message?.includes('already enrolled')) {
                console.error('[DocumentCard] Enrollment failed:', error);
            }
        }
        navigate(`/courses/${data.id}/learn`);
    };

    // Logic: If progress > 0 (Started) or Completed -> Dim background
    const hasStarted = (data.progress && data.progress > 0) || data.isCompleted;

    return (
        <div
            className={`group relative rounded-2xl overflow-hidden cursor-pointer h-80 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 select-none ${data.isEnrolled ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-transparent' : ''}`}
            onClick={handleCardClick}
            onMouseEnter={fetchRating}
        >
            {/* Enrolled Badge */}
            {data.isEnrolled && (
                <div className="absolute top-3 right-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    Đã mua
                </div>
            )}
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={data.image}
                    alt={data.title}
                    className={`w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-110 ${hasStarted ? 'blur-sm brightness-50' : ''
                        }`}
                />
                {/* Dark Overlay on Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Content Container - Flex flex-col to push content to bottom on hover */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">

                {/* Initial View (Title only) - Fades out on hover */}
                <div className={`transition-all duration-300 group-hover:opacity-0 ${hasStarted ? 'opacity-0' : 'opacity-100'} translate-y-0 group-hover:-translate-y-4`}>
                    <h3 className="text-xl font-bold text-white drop-shadow-md line-clamp-2">{data.title}</h3>
                </div>

                {/* Progress View (Always visible if started, moves up on hover) */}
                {hasStarted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-300 group-hover:opacity-0">
                        {data.isCompleted ? (
                            <div className="flex flex-col items-center text-green-400">
                                <CheckCircle size={48} className="mb-2" />
                                <span className="font-bold text-lg">Đã hoàn thành</span>
                            </div>
                        ) : (
                            <div className="text-center w-full">
                                <div className="text-4xl font-bold text-white mb-2">{data.progress}%</div>
                                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${data.progress}%` }}></div>
                                </div>
                                <div className="text-cyan-400 text-sm mt-2 font-medium">Đang học</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Hover Details (Slides up) */}
                <div className="absolute inset-x-6 bottom-6 flex flex-col items-center text-center transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{data.title}</h3>
                    {ratingInfo ? (
                        ratingInfo.count > 0 ? (
                            <div className="flex items-center gap-1 text-yellow-400 mb-2">
                                <span className="font-bold text-sm">{ratingInfo.avg.toFixed(1)}</span>
                                <Star size={14} fill="currentColor" />
                                <span className="text-xs text-gray-400">({ratingInfo.count})</span>
                            </div>
                        ) : (
                            <div className="text-gray-400 text-xs mb-2">Chưa có đánh giá</div>
                        )
                    ) : (
                        <div className="flex items-center gap-1 text-yellow-400 mb-2">
                            <span className="font-bold text-sm">{data.rating || '-'}</span>
                            <Star size={14} fill="currentColor" />
                        </div>
                    )}

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {data.description}
                    </p>

                    {data.author && (
                        <p className="text-cyan-300 text-xs font-medium mb-3">GV: {data.author}</p>
                    )}

                    <button
                        onClick={handleAction}
                        className="bg-cyan-500 hover:bg-cyan-400 text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-cyan-500/30 translate-y-4 group-hover:translate-y-0 duration-300 delay-200"
                    >
                        {data.isEnrolled
                            ? 'Vào học'
                            : data.type === 'offline'
                                ? (isRequesting ? 'Đang gửi...' : 'Yêu cầu tham gia')
                                : data.type === 'paid'
                                    ? `Thêm vào giỏ - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.price || 0)}`
                                    : data.type === 'test'
                                        ? (data.isCompleted ? 'Xem kết quả' : 'Làm bài ngay')
                                        : 'Học ngay'}
                    </button>
                </div>
            </div>

            {/* Bottom Footer Info (Always visible, fades out on hover to show details) */}
            <div className={`absolute bottom-0 left-0 w-full p-5 pt-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${hasStarted ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                <h3 className="text-white font-bold text-lg line-clamp-1">{data.title}</h3>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-gray-300 text-xs font-medium">{data.author}</p>
                    {data.type === 'paid' && !data.isEnrolled && <span className="text-cyan-400 font-bold bg-cyan-900/30 px-2 py-0.5 rounded text-xs">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.price || 0)}</span>}
                </div>
            </div>
        </div>
    );
};

export default DocumentCard;

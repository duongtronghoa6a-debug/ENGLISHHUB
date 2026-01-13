import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, LogIn } from 'lucide-react';
import Layout from '../../layouts/Layout';
import DocumentCard from './DocumentCard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import { offlineService } from '../../services/offline.service';
import { enrollmentService } from '../../services/enrollment.service';
import { libraryService } from '../../services/library.service';

interface DocumentsPageProps {
    type: 'free' | 'paid' | 'offline' | 'test';
}

const DocumentsPage = ({ type }: DocumentsPageProps) => {
    const { isDarkMode } = useTheme();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    // Data State
    const [documents, setDocuments] = useState<any[]>([]); // Use appropriate type if available
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1 });

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    // Initialize activeTab from URL query param or default to 'all'
    const [activeTab, setActiveTab] = useState(() => {
        const tabParam = searchParams.get('tab');
        return tabParam === 'learning' && isAuthenticated ? 'learning' : 'all';
    });
    const [selectedAuthor, setSelectedAuthor] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [allAuthors, setAllAuthors] = useState<string[]>(['All']);

    // Reset page to 1 when search query changes
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [searchQuery, selectedAuthor, selectedStatus]);

    // Fetch Data
    useEffect(() => {
        const fetchCourses = async () => {
            setIsLoading(true);
            try {
                let response;
                let coursesList = [];
                let total = 0;

                if (activeTab === 'learning') {
                    // Must be authenticated to fetch enrolled courses
                    if (!isAuthenticated) {
                        setDocuments([]);
                        setIsLoading(false);
                        return;
                    }

                    // Handle offline registrations separately from course enrollments
                    if (type === 'offline') {
                        // Fetch approved offline class enrollments
                        const { classEnrollmentService } = await import('../../services/classEnrollment.service');
                        response = await classEnrollmentService.getEnrolledClasses();
                        const enrollments = response.data || [];

                        const mappedData = enrollments.map((enrollment: any) => {
                            const offlineClass = enrollment.offlineClass || {};
                            return {
                                id: offlineClass.id,
                                title: offlineClass.class_name || 'Untitled Class',
                                type: 'offline',
                                image: offlineClass.thumbnail_url || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2670&auto=format&fit=crop",
                                author: offlineClass.teacher?.email?.split('@')[0] || 'English Hub Center',
                                price: offlineClass.price || 0,
                                description: `${offlineClass.address || ''} | ${offlineClass.schedule_text || ''}`,
                                progress: 50,
                                isCompleted: false,
                                enrolledAt: enrollment.enrolledAt
                            };
                        });
                        setDocuments(mappedData);
                        total = mappedData.length;
                    } else {
                        // Fetch course enrollments for free/paid
                        response = await enrollmentService.getMyCourses();
                        const enrollments = Array.isArray(response) ? response : (response.data || []);

                        const mappedData = enrollments.map((enrollment: any) => {
                            const course = enrollment.course || enrollment;
                            const price = parseFloat(course.price) || 0;
                            return {
                                ...course,
                                isEnrolled: true, // Mark as enrolled (purchased)
                                type: price > 0 ? 'paid' : 'free',
                                id: course.id || course.idCOURSE || course._id,
                                title: course.title || course.name,
                                image: course.thumbnail_url || course.thumbnail || 'https://via.placeholder.com/300',
                                author: course.teacher?.full_name || course.teacher?.profile?.full_name || 'Unknown',
                                price: price,
                                progress: enrollment.progress || 0,
                                isCompleted: enrollment.status === 'completed'
                            };
                        });

                        // Filter enrolled courses by current page type (free/paid)
                        const filteredByType = mappedData.filter((doc: any) => {
                            if (type === 'free') return doc.type === 'free';
                            if (type === 'paid') return doc.type === 'paid';
                            return true;
                        });

                        setDocuments(filteredByType);
                        total = filteredByType.length;
                    }
                } else if (type === 'offline') {
                    // Fetch Offline Classes
                    response = await offlineService.getClasses({ page: pagination.page, limit: pagination.limit });
                    coursesList = response.data || [];
                    // Handle case where pagination info might be missing or different
                    total = response.pagination?.total || coursesList.length;

                    const mappedData = coursesList.map((cls: any) => ({
                        id: cls.id,
                        title: cls.class_name,
                        type: 'offline',
                        image: cls.thumbnail_url || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2670&auto=format&fit=crop",
                        author: cls.organizer_name || cls.teacher?.email?.split('@')[0] || 'Teacher',
                        price: cls.price || 0,
                        description: `${cls.address || ''} | ${cls.schedule_text || ''}`,
                        progress: 0,
                        isCompleted: false
                    }));
                    setDocuments(mappedData);
                } else {
                    // Fetch Online Courses (Free/Paid)
                    const params: any = { page: pagination.page, limit: pagination.limit };
                    if (type === 'free') params.is_free = 'true';
                    if (type === 'paid') params.is_free = 'false';
                    if (searchQuery.trim()) params.search = searchQuery.trim();

                    // Fetch courses and enrolled IDs in parallel
                    const [coursesResponse, enrolledResponse] = await Promise.all([
                        courseService.getAllCourses(params),
                        isAuthenticated ? enrollmentService.getMyCourses().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
                    ]);

                    response = coursesResponse;
                    // API returns { success, count, data: [...courses], pagination: {...} }
                    // data is the array directly, or nested in courses/rows for backwards compatibility
                    coursesList = Array.isArray(response.data)
                        ? response.data
                        : (response.data?.courses || response.data?.rows || response.data?.data || []);

                    // Get total from pagination object or response level
                    const paginationData = response.pagination || response.data?.pagination;
                    total = paginationData?.total || response.count || coursesList.length;

                    // Update totalPages from API
                    if (paginationData?.totalPages) {
                        setPagination(prev => ({
                            ...prev,
                            totalPages: paginationData.totalPages,
                            page: paginationData.page || prev.page
                        }));
                    }

                    // Build set of enrolled course IDs
                    const enrolledData = enrolledResponse.data || enrolledResponse || [];
                    const enrolledIds = new Set(
                        (Array.isArray(enrolledData) ? enrolledData : []).map((e: any) => {
                            const course = e.course || e;
                            return String(course.id || course.idCOURSE || course._id);
                        })
                    );
                    setEnrolledCourseIds(enrolledIds);

                    const mappedData = coursesList.map((doc: any) => {
                        let uiType = 'paid';
                        const price = parseFloat(doc.price);
                        const isFree = isNaN(price) || price === 0;

                        // Check for video course type first
                        if (doc.course_type === 'video') {
                            uiType = 'video';
                        } else if (isFree) {
                            uiType = 'free';
                        }

                        const courseId = String(doc.idCOURSE || doc.id || doc._id);

                        return {
                            ...doc,
                            type: uiType,
                            course_type: doc.course_type, // Preserve course_type for DocumentCard
                            id: courseId,
                            image: doc.thumbnail_url || doc.thumbnailUrl || doc.thumbnail || 'https://picsum.photos/seed/' + doc.id + '/300/200',
                            author: doc.teacher?.full_name || doc.teacher?.profile?.full_name || doc.teacher?.fullName || 'Unknown',
                            progress: 0,
                            isCompleted: false,
                            isEnrolled: enrolledIds.has(courseId),
                            price: price || 0
                        };
                    });
                    setDocuments(mappedData);
                }

                // Update Total Pages
                setPagination(prev => ({
                    ...prev,
                    totalPages: Math.ceil(total / prev.limit) || 1
                }));

            } catch (err) {
                console.error("Fetch error:", err);
                setError('Failed to load documents.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    }, [type, pagination.page, activeTab, isAuthenticated, searchQuery]);

    // Fetch all authors for filter dropdown (from all pages)
    useEffect(() => {
        const fetchAllAuthors = async () => {
            try {
                // Fetch teachers from public courses endpoint
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/courses/teachers`);
                const data = await res.json();
                const teachers = data.data || [];
                // Add special options: All, Teacher (for all teachers), ENGLISH HUB
                const authorOptions = ['All', 'Teacher', ...teachers.filter((t: string) => t !== 'ENGLISH HUB'), 'ENGLISH HUB'];
                setAllAuthors([...new Set(authorOptions)] as string[]);
            } catch (error) {
                console.error('Failed to fetch authors:', error);
                // Fallback to page-based authors
                const authors = new Set(documents.map(doc => doc.author).filter(Boolean));
                setAllAuthors(['All', ...Array.from(authors)]);
            }
        };
        fetchAllAuthors();
    }, [documents]);

    // uniqueAuthors now uses allAuthors state (fetched from all courses)
    const uniqueAuthors = allAuthors;

    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            // Note: Type filtering is handled by API via is_free param
            // We no longer filter by type here because:
            // 1. Video courses have type='video' but are free
            // 2. API already sends correct data based on is_free

            // Tab Filter - skip for 'learning' tab
            if (activeTab === 'learning') {
                // Show all enrolled courses regardless of type
            }

            // 3. Search Filter
            const searchLower = searchQuery.toLowerCase();
            if (searchQuery && !doc.title.toLowerCase().includes(searchLower) && !doc.description.toLowerCase().includes(searchLower)) {
                return false;
            }

            // 4. Author Filter / Source Filter
            if (selectedAuthor !== 'All') {
                if (selectedAuthor === 'Teacher') {
                    // Show all EXCEPT English Hub
                    if (doc.author === 'ENGLISH HUB') return false;
                } else {
                    // Specific author (or ENGLISH HUB explicitly selected)
                    if (doc.author !== selectedAuthor) return false;
                }
            }

            // 5. Status Filter
            if (selectedStatus !== 'All') {
                if (selectedStatus === 'Completed' && !doc.isCompleted) return false;
                if (selectedStatus === 'In Progress' && (!doc.progress || doc.progress === 0 || doc.isCompleted)) return false;
                if (selectedStatus === 'Not Started' && doc.progress && doc.progress > 0) return false;
            }

            return true;
        });
    }, [type, activeTab, searchQuery, selectedAuthor, selectedStatus, documents]);

    // Dynamic Banner Config
    const getBannerConfig = () => {
        switch (type) {
            case 'free': return {
                title: 'Tài liệu miễn phí',
                desc: 'Bộ tài liệu miễn phí chất lượng cao dành cho cộng đồng.',
                image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop"
            };
            case 'paid': return {
                title: 'Tài liệu trả phí',
                desc: 'Các khóa học và tài liệu chuyên sâu giúp bạn bứt phá.',
                image: "https://images.unsplash.com/photo-1550592704-6c76defa9985?q=80&w=2670&auto=format&fit=crop"
            };
            case 'offline': return {
                title: 'Khóa học Offline',
                desc: 'Học trực tiếp tại trung tâm với giáo viên bản ngữ.',
                image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2670&auto=format&fit=crop"
            };
            case 'test': return {
                title: 'Bài kiểm tra',
                desc: 'Đánh giá năng lực của bạn qua các bài test chuẩn hóa.',
                image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=2670&auto=format&fit=crop"
            };
            default: return { title: '', desc: '', image: '' };
        }
    };

    const banner = getBannerConfig();

    return (
        <Layout>
            {/* Header/Banner Area - Now inside Layout's children */}
            <div className="relative w-full h-64 md:h-80 rounded-[32px] overflow-hidden mb-10 shadow-2xl group">
                <img
                    src={banner.image}
                    alt="Banner"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                <div className="absolute top-1/2 left-8 md:left-16 -translate-y-1/2 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-xl">
                        {banner.title}
                    </h1>
                    <p className="text-gray-200 text-lg drop-shadow-md">
                        {banner.desc}
                    </p>
                </div>
            </div>

            {/* Filter & Tabs Bar */}
            <div className="flex flex-col gap-6 mb-8">
                {/* ... (Keep existing Filter/Tab code) ... */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-full backdrop-blur-sm dark:bg-white/5">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'all'
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                }`}
                        >
                            Tất cả tài liệu
                        </button>
                        <button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    setShowLoginDialog(true);
                                } else {
                                    setActiveTab('learning');
                                }
                            }}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'learning'
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                }`}
                        >
                            Đang học
                        </button>
                    </div>

                    {/* Search & Filter Toggle */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className={`flex items-center px-4 py-2.5 rounded-full flex-1 md:w-64 border transition-all ${isDarkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200'
                            }`}>
                            <Search size={18} className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent outline-none w-full text-sm placeholder:text-gray-400"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2.5 rounded-full border transition-all ${isDarkMode
                                ? `border-white/10 hover:bg-white/10 ${showFilters ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white/5 text-gray-300'}`
                                : `border-gray-200 hover:bg-gray-50 ${showFilters ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-gray-600'}`
                                }`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Extended Filters Panel */}
                {showFilters && (
                    <div className={`p-4 rounded-2xl border grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'
                        }`}>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Giảng viên</label>
                            <select
                                value={selectedAuthor}
                                onChange={(e) => setSelectedAuthor(e.target.value)}
                                className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                                    }`}
                            >
                                {uniqueAuthors.map(author => (
                                    <option key={author} value={author}>{author}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Trạng thái</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                                    }`}
                            >
                                <option value="All">Tất cả</option>
                                <option value="Not Started">Chưa học</option>
                                <option value="In Progress">Đang học</option>
                                <option value="Completed">Đã hoàn thành</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Nguồn tài liệu</label>
                            <select
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Handle filtering logic in useMemo
                                    if (val === 'System') setSelectedAuthor('ENGLISH HUB');
                                    else if (val === 'Teacher') setSelectedAuthor('Teacher'); // Will need special handling
                                    else setSelectedAuthor('All');
                                }}
                                className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                                    }`}
                            >
                                <option value="All">Tất cả</option>
                                <option value="System">Tài liệu hệ thống (English Hub)</option>
                                <option value="Teacher">Giáo viên đóng góp</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedAuthor('All');
                                    setSelectedStatus('All');
                                    setActiveTab('all');
                                }}
                                className="w-full py-2.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-bold"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex justify-center p-20">Loading...</div>
            ) : filteredDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDocs.map(doc => (
                        <DocumentCard
                            key={doc.id}
                            data={{
                                ...doc,
                                // Only set link for offline courses - paid/free use native DocumentCard behavior
                                link: doc.type === 'offline' ? `/offline-courses/${doc.id}` : undefined
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <Search size={48} className="mb-4" />
                    <h3 className="text-xl font-bold">Không tìm thấy tài liệu nào {error && `(${error})`}</h3>
                    <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            )}

            {/* Pagination */}
            {!isLoading && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2 flex-wrap">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        className="px-4 py-2 rounded-lg border font-bold hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        ← Trước
                    </button>

                    {/* Smart pagination */}
                    {(() => {
                        const pages: (number | string)[] = [];
                        const current = pagination.page;
                        const total = pagination.totalPages;
                        const delta = 2;

                        pages.push(1);
                        if (current - delta > 2) pages.push('...');
                        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
                            pages.push(i);
                        }
                        if (current + delta < total - 1) pages.push('...');
                        if (total > 1) pages.push(total);

                        return pages.map((p, idx) => (
                            p === '...' ? (
                                <span key={`e-${idx}`} className="px-2 text-gray-400">...</span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => setPagination(prev => ({ ...prev, page: p as number }))}
                                    className={`w-10 h-10 rounded-lg border font-bold transition-all ${pagination.page === p
                                        ? 'bg-cyan-500 text-white border-cyan-500'
                                        : 'bg-white hover:bg-gray-50 dark:bg-transparent dark:border-white/10 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            )
                        ));
                    })()}

                    <button
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        className="px-4 py-2 rounded-lg border font-bold hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        Sau →
                    </button>

                    <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                        Trang {pagination.page}/{pagination.totalPages}
                    </span>
                </div>
            )}

            {/* Login Dialog */}
            {showLoginDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'}`}>
                        <div className="text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-50'}`}>
                                <LogIn className="text-cyan-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Yêu cầu đăng nhập</h2>
                            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Bạn cần đăng nhập để xem các khóa học đang học của mình.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLoginDialog(false)}
                                    className={`flex-1 py-3 rounded-xl font-bold ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="flex-1 py-3 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-600 text-white"
                                >
                                    Đăng nhập
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default DocumentsPage;

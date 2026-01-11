import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Sidebar from '../../components/common/Sidebar';
import { courseService } from '../../services/course.service';
import { Menu, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CourseListPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isDarkMode } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 9,
        total: 0,
        totalPages: 1
    });

    // Get current page from URL or state
    const currentPage = parseInt(searchParams.get('page') || '1');
    const limit = 9; // Fixed limit

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const data = await courseService.getAllCourses({
                    page: currentPage,
                    limit: limit
                });

                if (data.success && data.data) {
                    setCourses(data.data.courses || []);
                    setPagination({
                        page: data.data.pagination?.page || currentPage,
                        limit: data.data.pagination?.limit || limit,
                        total: data.data.pagination?.total || 0,
                        totalPages: data.data.pagination?.totalPages || 1
                    });
                } else if (data.courses) {
                    // Fallback for old API structure
                    setCourses(data.courses);
                    setPagination(prev => ({ ...prev, page: currentPage }));
                }
            } catch (error) {
                console.error("Failed to fetch courses", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [currentPage]);

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-[#0B1120] text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 md:ml-64 transition-all duration-300">
                {/* Mobile Header */}
                <header className={`sticky top-0 z-30 flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? 'bg-black/20 backdrop-blur-xl border-white/5' : 'bg-white/80 backdrop-blur-md border-gray-100'
                    }`}>
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Danh sách khóa học</h1>
                    <div className="w-6"></div> {/* Spacer */}
                </header>

                <main className="p-6 md:p-10">
                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm khóa học..."
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-accent/50 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'
                                    }`}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-bold shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all">
                            <Filter size={20} />
                            <span>Lọc</span>
                        </button>
                    </div>

                    {/* Course Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className={`h-80 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {courses.map((course) => (
                                    <div key={course.id}
                                        onClick={() => navigate(`/courses/${course.id}`)}
                                        className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-white/10 group cursor-pointer"
                                    >
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={course.thumbnail_url || course.thumbnail || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2671&auto=format&fit=crop"}
                                                alt={course.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute top-4 right-4 bg-accent/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">
                                                {course.level || 'Beginner'}
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-lg mb-2 line-clamp-2 dark:text-gray-100 group-hover:text-accent transition-colors">{course.title}</h3>

                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={course.teacher?.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                                        className="w-6 h-6 rounded-full bg-gray-200"
                                                        alt="Teacher"
                                                    />
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                                                        {course.teacher?.profile?.full_name || 'Teacher'}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-accent">
                                                    {course.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price) : 'Free'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center items-center mt-12 gap-2">
                                    <button
                                        disabled={pagination.page === 1}
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    {/* Smart pagination - show limited pages */}
                                    {(() => {
                                        const pages = [];
                                        const current = pagination.page;
                                        const total = pagination.totalPages;
                                        const delta = 2; // Pages around current

                                        // Always show first page
                                        pages.push(1);

                                        // Show ellipsis if needed
                                        if (current - delta > 2) {
                                            pages.push('...');
                                        }

                                        // Pages around current
                                        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
                                            pages.push(i);
                                        }

                                        // Show ellipsis if needed
                                        if (current + delta < total - 1) {
                                            pages.push('...');
                                        }

                                        // Always show last page (if more than 1)
                                        if (total > 1) {
                                            pages.push(total);
                                        }

                                        return pages.map((page, idx) => (
                                            page === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page as number)}
                                                    className={`w-10 h-10 rounded-lg font-bold transition-all ${pagination.page === page
                                                        ? 'bg-accent text-white shadow-lg shadow-accent/30'
                                                        : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-accent'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ));
                                    })()}

                                    <button
                                        disabled={pagination.page === pagination.totalPages}
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>

                                    {/* Page info */}
                                    <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                                        Trang {pagination.page}/{pagination.totalPages} ({pagination.total} khóa học)
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CourseListPage;

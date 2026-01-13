import { useState, useEffect } from 'react';
import {
    FolderOpen, FileText, Search, Grid, List,
    ExternalLink, RefreshCw, BookOpen, Users, HardDrive
} from 'lucide-react';
import { libraryService } from '../../services/library.service';
import type { LibraryFile, LibraryStats } from '../../services/library.service';

const AdminLibraryPage = () => {
    // State
    const [stats, setStats] = useState<LibraryStats | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [teachers, setTeachers] = useState<string[]>([]);
    const [courses, setCourses] = useState<string[]>([]);
    const [files, setFiles] = useState<LibraryFile[]>([]);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalFiles, setTotalFiles] = useState(0);

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load files when filters change
    useEffect(() => {
        loadFiles();
    }, [selectedCategory, selectedTeacher, selectedCourse, searchQuery, currentPage]);

    // Load teachers when category changes
    useEffect(() => {
        if (selectedCategory) {
            libraryService.getTeachers(selectedCategory).then(setTeachers);
            setSelectedTeacher('');
            setSelectedCourse('');
        } else {
            libraryService.getTeachers().then(setTeachers);
        }
    }, [selectedCategory]);

    // Load courses when teacher changes
    useEffect(() => {
        if (selectedTeacher) {
            libraryService.getCourses(selectedCategory, selectedTeacher).then(setCourses);
            setSelectedCourse('');
        } else if (selectedCategory) {
            libraryService.getCourses(selectedCategory).then(setCourses);
        } else {
            setCourses([]);
        }
    }, [selectedTeacher, selectedCategory]);

    const loadInitialData = async () => {
        try {
            const [statsData, categoriesData, teachersData] = await Promise.all([
                libraryService.getStats(),
                libraryService.getCategories(),
                libraryService.getTeachers()
            ]);
            setStats(statsData);
            setCategories(categoriesData);
            setTeachers(teachersData);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const loadFiles = async () => {
        setLoading(true);
        try {
            const result = await libraryService.getFiles({
                exam: selectedCategory || undefined,
                teacher: selectedTeacher || undefined,
                course: selectedCourse || undefined,
                search: searchQuery || undefined,
                page: currentPage,
                limit: 50
            });
            setFiles(result.files);
            setTotalPages(result.pagination.totalPages);
            setTotalFiles(result.pagination.total);
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            'toeic': 'TOEIC',
            'ielts': 'IELTS',
            'vstep': 'VSTEP',
            'giao-tiep': 'Giao tiếp'
        };
        return labels[cat] || cat;
    };

    const openFile = (file: LibraryFile) => {
        window.open(file.url, '_blank');
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedTeacher('');
        setSelectedCourse('');
        setSearchQuery('');
        setCurrentPage(1);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderOpen className="text-blue-500" />
                        Thư viện nội dung
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Quản lý tất cả tài nguyên và nội dung của hệ thống
                    </p>
                </div>
                <button
                    onClick={loadFiles}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    <RefreshCw size={18} />
                    Làm mới
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFiles.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">Tổng file</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <BookOpen className="text-green-500" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.courses}</p>
                                <p className="text-sm text-gray-500">Khóa học</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Users className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.teachers}</p>
                                <p className="text-sm text-gray-500">Giáo viên</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <HardDrive className="text-orange-500" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSize}</p>
                                <p className="text-sm text-gray-500">Dung lượng</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Category Filter */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Tất cả</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Teacher Filter */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs text-gray-500 mb-1">Giáo viên</label>
                        <select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Tất cả</option>
                            {teachers.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Course Filter */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-gray-500 mb-1">Khóa học</label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={!courses.length}
                        >
                            <option value="">Tất cả</option>
                            {courses.map(c => (
                                <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-gray-500 mb-1">Tìm kiếm</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tên file..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* View Mode & Clear */}
                    <div className="flex items-end gap-2">
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Xóa bộ lọc
                        </button>
                        <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700'}`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                    Hiển thị {files.length} / {totalFiles.toLocaleString()} file
                    {selectedCategory && ` trong ${getCategoryLabel(selectedCategory)}`}
                </span>
                <span>Trang {currentPage} / {totalPages}</span>
            </div>

            {/* File List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Tên file</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Danh mục</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Giáo viên</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Khóa học</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Kích thước</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {files.map((file, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="text-red-500 flex-shrink-0" size={18} />
                                            <span className="text-sm text-gray-900 dark:text-white truncate max-w-[300px]" title={file.file}>
                                                {file.file}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            {getCategoryLabel(file.exam)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{file.teacher}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px]" title={file.course}>
                                        {file.course.replace(/-/g, ' ')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 text-right">{file.sizeFormatted}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => openFile(file)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                            title="Mở file"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            onClick={() => openFile(file)}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 cursor-pointer transition-all"
                        >
                            <div className="flex justify-center mb-3">
                                <FileText className="text-red-500" size={40} />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.file}>
                                {file.file}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{file.sizeFormatted}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {getCategoryLabel(file.exam)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                    >
                        Trước
                    </button>
                    <span className="px-4 py-2 text-gray-600 dark:text-gray-300">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && files.length === 0 && (
                <div className="text-center py-12">
                    <FolderOpen className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">Không tìm thấy file nào</p>
                </div>
            )}
        </div>
    );
};

export default AdminLibraryPage;

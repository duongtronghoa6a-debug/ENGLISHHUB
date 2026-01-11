import { useState } from 'react';
import { Download, FileText, Video, BookOpen, Search, Filter, FolderOpen, ExternalLink, Clock, Eye } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Resource {
    id: string;
    title: string;
    type: 'document' | 'video' | 'template' | 'quiz';
    category: string;
    downloads: number;
    size: string;
    updatedAt: string;
}

const TeacherResourcesPage = () => {
    const { isDarkMode } = useTheme();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock resources data
    const resources: Resource[] = [
        { id: '1', title: 'Template Giáo án IELTS Speaking', type: 'document', category: 'template', downloads: 245, size: '2.5 MB', updatedAt: '2024-01-05' },
        { id: '2', title: 'Bộ câu hỏi Grammar B1-B2', type: 'quiz', category: 'question-bank', downloads: 189, size: '1.2 MB', updatedAt: '2024-01-03' },
        { id: '3', title: 'Video hướng dẫn tạo khóa học', type: 'video', category: 'guide', downloads: 567, size: '156 MB', updatedAt: '2024-01-01' },
        { id: '4', title: 'Template bài giảng PowerPoint', type: 'template', category: 'template', downloads: 432, size: '15 MB', updatedAt: '2023-12-28' },
        { id: '5', title: 'Bộ từ vựng TOEIC 600+', type: 'document', category: 'vocabulary', downloads: 892, size: '5.6 MB', updatedAt: '2023-12-25' },
        { id: '6', title: 'Audio Listening Practice Set 1', type: 'video', category: 'listening', downloads: 321, size: '89 MB', updatedAt: '2023-12-20' },
        { id: '7', title: 'Đề thi thử IELTS Reading', type: 'quiz', category: 'question-bank', downloads: 654, size: '3.2 MB', updatedAt: '2023-12-18' },
        { id: '8', title: 'Template Certificate', type: 'template', category: 'template', downloads: 234, size: '1.8 MB', updatedAt: '2023-12-15' },
    ];

    const categories = [
        { key: 'all', label: 'Tất cả', count: resources.length },
        { key: 'template', label: 'Template', count: resources.filter(r => r.category === 'template').length },
        { key: 'question-bank', label: 'Ngân hàng đề', count: resources.filter(r => r.category === 'question-bank').length },
        { key: 'guide', label: 'Hướng dẫn', count: resources.filter(r => r.type === 'video').length },
    ];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'document': return <FileText className="text-blue-500" size={20} />;
            case 'video': return <Video className="text-red-500" size={20} />;
            case 'template': return <BookOpen className="text-purple-500" size={20} />;
            case 'quiz': return <FolderOpen className="text-green-500" size={20} />;
            default: return <FileText className="text-gray-500" size={20} />;
        }
    };

    const filteredResources = resources.filter(r => {
        const matchCategory = activeCategory === 'all' || r.category === activeCategory || (activeCategory === 'guide' && r.type === 'video');
        const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Download className="text-blue-500" /> Tài nguyên giảng dạy
                    </h1>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tải xuống template, bộ đề, và tài liệu hỗ trợ giảng dạy
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
                    <div className="text-2xl font-bold">{resources.length}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tài nguyên</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
                    <div className="text-2xl font-bold text-blue-500">{resources.filter(r => r.type === 'document').length}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tài liệu</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
                    <div className="text-2xl font-bold text-red-500">{resources.filter(r => r.type === 'video').length}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Video</div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
                    <div className="text-2xl font-bold text-green-500">{resources.filter(r => r.type === 'quiz').length}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bộ đề</div>
                </div>
            </div>

            {/* Filters */}
            <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4`}>
                <div className={`flex gap-2 p-1 ${isDarkMode ? 'bg-black/20' : 'bg-gray-100'} rounded-lg flex-1`}>
                    {categories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex-1 ${activeCategory === cat.key
                                ? `${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} text-blue-600 shadow-sm`
                                : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
                                }`}
                        >
                            {cat.label} ({cat.count})
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tài nguyên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} rounded-lg outline-none`}
                    />
                </div>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources.map(resource => (
                    <div
                        key={resource.id}
                        className={`${isDarkMode ? 'bg-[#1e293b] hover:bg-[#253449]' : 'bg-white hover:bg-gray-50'} p-6 rounded-xl shadow-sm transition-all cursor-pointer group`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center`}>
                                {getTypeIcon(resource.type)}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold mb-1 group-hover:text-blue-500 transition-colors">{resource.title}</h3>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-3`}>
                                    <span className="flex items-center gap-1"><Download size={12} /> {resource.downloads}</span>
                                    <span>{resource.size}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} flex items-center gap-1`}>
                                <Clock size={12} /> {new Date(resource.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                                    <Eye size={16} />
                                </button>
                                <button className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20">
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredResources.length === 0 && (
                <div className="text-center py-12">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Không tìm thấy tài nguyên nào</p>
                </div>
            )}
        </div>
    );
};

export default TeacherResourcesPage;

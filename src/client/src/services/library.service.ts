import api from './api';

// Types
export interface LibraryFile {
    exam: string;
    teacher: string;
    course: string;
    section: string;
    file: string;
    ext: string;
    sizeBytes: number;
    path: string;
    urlPath: string;
    url: string;
    sizeFormatted: string;
}

export interface LibraryStats {
    totalFiles: number;
    categories: number;
    teachers: number;
    courses: number;
    totalSize: string;
    totalSizeBytes: number;
}

export interface PaginatedFiles {
    files: LibraryFile[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Service
export const libraryService = {
    async getStats(): Promise<LibraryStats> {
        const response = await api.get('/library/stats');
        return response.data;
    },

    async getCategories(): Promise<string[]> {
        const response = await api.get('/library/categories');
        return response.data;
    },

    async getTeachers(exam?: string): Promise<string[]> {
        const response = await api.get('/library/teachers', { params: { exam } });
        return response.data;
    },

    async getCourses(exam?: string, teacher?: string): Promise<string[]> {
        const response = await api.get('/library/courses', { params: { exam, teacher } });
        return response.data;
    },

    async getSections(exam: string, teacher: string, course: string): Promise<string[]> {
        const response = await api.get('/library/sections', { params: { exam, teacher, course } });
        return response.data;
    },

    async getFiles(options: {
        exam?: string;
        teacher?: string;
        course?: string;
        section?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<PaginatedFiles> {
        const response = await api.get('/library/files', { params: options });
        return response.data;
    }
};

export default libraryService;

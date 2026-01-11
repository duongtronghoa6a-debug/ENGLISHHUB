import api from './api';

export const courseService = {
    // GET /api/v1/courses
    getAllCourses: async (params?: { page?: number; limit?: number; type?: string; is_free?: boolean | string }) => {
        const response = await api.get('/courses', { params });
        return response.data;
    },



    // GET /api/v1/courses/:id
    getCourseById: async (id: number | string) => {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },

    /**
     * POST /api/v1/courses
     * Use FormData for file upload
     * Fields: title (req), thumbnail (file), price, type, description, level, category, syllabus
     */
    createCourse: async (formData: FormData) => {
        const response = await api.post('/courses', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * PUT /api/v1/courses/:id
     * Use FormData for file upload
     */
    updateCourse: async (id: number | string, formData: FormData) => {
        const response = await api.put(`/courses/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // PUT /api/v1/courses/:id/approve
    // status: 'PUBLISHED' | 'ARCHIVED'
    approveCourse: async (id: number | string, status: 'PUBLISHED' | 'ARCHIVED') => {
        const response = await api.put(`/courses/${id}/approve`, { status });
        return response.data;
    },

    // Reviews
    // GET /api/v1/courses/:id/reviews
    getReviews: async (id: number | string) => {
        const response = await api.get(`/courses/${id}/reviews`);
        return response.data;
    },

    // POST /api/v1/reviews
    createReview: async (courseId: number, rating: number, comment: string) => {
        const response = await api.post('/reviews', { courseId, rating, comment });
        return response.data;
    }
};
